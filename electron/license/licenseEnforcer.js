const { getStatus, isFeatureAllowed } = require('./licenseManager');

const FEATURES = {
  VIEW_BKU: 'view_bku',
  VIEW_BKU_FULL: 'view_bku_full',
  EXPORT_BKU: 'export_bku',
  BULK_EXPORT_12: 'bulk_export_12',
  EXPORT_ALL_IN_ONE: 'export_all_in_one',
  CETAK_KWITANSI: 'cetak_kwitansi',
  BATCH_CETAK: 'batch_cetak',
  UNLIMITED_CETAK: 'unlimited_cetak',
  NOTA_GROUP: 'nota_group',
  BA_REKONS_VIEW: 'ba_rekons_view',
  BA_REKONS_EXPORT: 'ba_rekons_export',
  REKON_BANK: 'rekon_bank',
  SPTJM: 'sptjm',
  LAPORAN_K7: 'laporan_k7',
  REGISTER_KAS: 'register_kas',
  PAJAK_MANUAL: 'pajak_manual',
  BACKUP_RESTORE: 'backup_restore',
  AUTO_UPDATE: 'auto_update',
  WATERMARK_FREE: 'watermark_free',
};

const TIER_FEATURES = {
  free: {
    [FEATURES.VIEW_BKU]: { allowed: true, limit: 50 },
    [FEATURES.VIEW_BKU_FULL]: { allowed: false },
    [FEATURES.EXPORT_BKU]: { allowed: false },
    [FEATURES.BULK_EXPORT_12]: { allowed: false },
    [FEATURES.EXPORT_ALL_IN_ONE]: { allowed: false },
    [FEATURES.CETAK_KWITANSI]: { allowed: true, limit: 5 },
    [FEATURES.BATCH_CETAK]: { allowed: false },
    [FEATURES.UNLIMITED_CETAK]: { allowed: false },
    [FEATURES.NOTA_GROUP]: { allowed: false },
    [FEATURES.BA_REKONS_VIEW]: { allowed: true },
    [FEATURES.BA_REKONS_EXPORT]: { allowed: false },
    [FEATURES.REKON_BANK]: { allowed: false },
    [FEATURES.SPTJM]: { allowed: false },
    [FEATURES.LAPORAN_K7]: { allowed: false },
    [FEATURES.REGISTER_KAS]: { allowed: false },
    [FEATURES.PAJAK_MANUAL]: { allowed: false },
    [FEATURES.BACKUP_RESTORE]: { allowed: false },
    [FEATURES.AUTO_UPDATE]: { allowed: false },
    [FEATURES.WATERMARK_FREE]: { allowed: true },
  },
  basic: {
    [FEATURES.VIEW_BKU]: { allowed: true },
    [FEATURES.VIEW_BKU_FULL]: { allowed: true },
    [FEATURES.EXPORT_BKU]: { allowed: true },
    [FEATURES.BULK_EXPORT_12]: { allowed: false },
    [FEATURES.EXPORT_ALL_IN_ONE]: { allowed: false },
    [FEATURES.CETAK_KWITANSI]: { allowed: true, limit: 30 },
    [FEATURES.BATCH_CETAK]: { allowed: true, limit: 10 },
    [FEATURES.UNLIMITED_CETAK]: { allowed: false },
    [FEATURES.NOTA_GROUP]: { allowed: true },
    [FEATURES.BA_REKONS_VIEW]: { allowed: true },
    [FEATURES.BA_REKONS_EXPORT]: { allowed: true },
    [FEATURES.REKON_BANK]: { allowed: true },
    [FEATURES.SPTJM]: { allowed: true },
    [FEATURES.LAPORAN_K7]: { allowed: true },
    [FEATURES.REGISTER_KAS]: { allowed: true },
    [FEATURES.PAJAK_MANUAL]: { allowed: true },
    [FEATURES.BACKUP_RESTORE]: { allowed: true },
    [FEATURES.AUTO_UPDATE]: { allowed: true },
    [FEATURES.WATERMARK_FREE]: { allowed: false },
  },
  pro: {
    [FEATURES.VIEW_BKU]: { allowed: true },
    [FEATURES.VIEW_BKU_FULL]: { allowed: true },
    [FEATURES.EXPORT_BKU]: { allowed: true },
    [FEATURES.BULK_EXPORT_12]: { allowed: true },
    [FEATURES.EXPORT_ALL_IN_ONE]: { allowed: true },
    [FEATURES.CETAK_KWITANSI]: { allowed: true },
    [FEATURES.BATCH_CETAK]: { allowed: true },
    [FEATURES.UNLIMITED_CETAK]: { allowed: true },
    [FEATURES.NOTA_GROUP]: { allowed: true },
    [FEATURES.BA_REKONS_VIEW]: { allowed: true },
    [FEATURES.BA_REKONS_EXPORT]: { allowed: true },
    [FEATURES.REKON_BANK]: { allowed: true },
    [FEATURES.SPTJM]: { allowed: true },
    [FEATURES.LAPORAN_K7]: { allowed: true },
    [FEATURES.REGISTER_KAS]: { allowed: true },
    [FEATURES.PAJAK_MANUAL]: { allowed: true },
    [FEATURES.BACKUP_RESTORE]: { allowed: true },
    [FEATURES.AUTO_UPDATE]: { allowed: true },
    [FEATURES.WATERMARK_FREE]: { allowed: false },
  },
};

const MENU_REQUIREMENTS = {
  transactions: FEATURES.VIEW_BKU,
  'cash-report': FEATURES.VIEW_BKU,
  'bank-report': FEATURES.VIEW_BKU,
  'tax-report': FEATURES.VIEW_BKU,
  'nota-groups': FEATURES.NOTA_GROUP,
  reconciliation: FEATURES.BA_REKONS_VIEW,
  'bank-reconciliation': FEATURES.REKON_BANK,
  sptjm: FEATURES.SPTJM,
  'k7-report': FEATURES.LAPORAN_K7,
  'register-kas': FEATURES.REGISTER_KAS,
  'backup-restore': FEATURES.BACKUP_RESTORE,
};

function checkFeature(feature) {
  const status = getStatus();

  if (!status.licensed && status.trialActive) {
    const freeFeatures = TIER_FEATURES.free;
    const feat = freeFeatures[feature];
    if (feat) {
      return { allowed: feat.allowed, limit: feat.limit || null, tier: 'free', reason: 'trial' };
    }
    return { allowed: false, limit: null, tier: 'free', reason: 'not_in_trial' };
  }

  if (!status.licensed && !status.trialActive) {
    return { allowed: false, limit: null, tier: 'free', reason: 'trial_expired' };
  }

  const tierFeatures = TIER_FEATURES[status.tier];
  if (!tierFeatures) return { allowed: false, tier: 'free', reason: 'unknown_tier' };

  const feat = tierFeatures[feature];
  if (!feat) return { allowed: false, tier: status.tier, reason: 'feature_not_found' };

  return { allowed: feat.allowed, limit: feat.limit || null, tier: status.tier };
}

function isMenuAllowed(menuId) {
  const requirement = MENU_REQUIREMENTS[menuId];
  if (!requirement) return { allowed: true };
  return checkFeature(requirement);
}

function getBlockedMenus() {
  const blocked = [];
  for (const [menuId, feature] of Object.entries(MENU_REQUIREMENTS)) {
    const result = checkFeature(feature);
    if (!result.allowed) blocked.push(menuId);
  }
  return blocked;
}

function getUsageCounter(feature) {
  const { app } = require('electron');
  const fs = require('fs');
  const path = require('path');
  const counterFile = path.join(app.getPath('userData'), 'data', `counter_${feature}.json`);

  try {
    if (fs.existsSync(counterFile)) {
      const data = JSON.parse(fs.readFileSync(counterFile, 'utf-8'));
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      if (data.month !== monthKey) {
        const reset = { month: monthKey, count: 0 };
        fs.writeFileSync(counterFile, JSON.stringify(reset), 'utf-8');
        return reset;
      }
      return data;
    }
  } catch {}
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return { month: monthKey, count: 0 };
}

function incrementUsage(feature) {
  const { app } = require('electron');
  const fs = require('fs');
  const path = require('path');
  const counterFile = path.join(app.getPath('userData'), 'data', `counter_${feature}.json`);

  const current = getUsageCounter(feature);
  current.count += 1;
  fs.writeFileSync(counterFile, JSON.stringify(current), 'utf-8');
  return current;
}

function canDoAction(feature) {
  const result = checkFeature(feature);
  if (!result.allowed) {
    return { can: false, reason: 'feature_locked', upgradeTo: result.tier === 'free' ? 'basic' : 'pro' };
  }
  if (result.limit) {
    const usage = getUsageCounter(feature);
    if (usage.count >= result.limit) {
      return { can: false, reason: 'limit_reached', limit: result.limit, used: usage.count };
    }
    return { can: true, remaining: result.limit - usage.count };
  }
  return { can: true };
}

module.exports = {
  FEATURES,
  TIER_FEATURES,
  MENU_REQUIREMENTS,
  checkFeature,
  isMenuAllowed,
  getBlockedMenus,
  getUsageCounter,
  incrementUsage,
  canDoAction,
};
