const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { getFingerprint } = require('./fingerprint');
const { getTrialInfo } = require('./trialManager');

const PUBLIC_KEY_PATH = path.join(__dirname, 'publicKey.pem');
const OBFUSCATE_KEY = 'smrtspj_l1c_v2_2026';
let fetch = globalThis.fetch;

function getDataDir() {
  const p = path.join(os.homedir(), 'AppData', 'Roaming', 'smart-spj', 'data');
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  return p;
}

function getLicenseFilePath() {
  return path.join(getDataDir(), '.sys_cfg');
}

function getLicenseBackupPath() {
  return path.join(getDataDir(), '.sys_dat');
}

function getPublicKey() {
  const possiblePaths = [
    path.join(__dirname, 'publicKey.pem'),
    path.join(process.resourcesPath || '', 'publicKey.pem'),
    path.join(process.cwd(), 'publicKey.pem'),
    path.join(__dirname, '..', 'publicKey.pem'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf-8');
    }
  }
  return null;
}

function xorEncode(data, key) {
  const dataBuf = Buffer.from(data, 'utf-8');
  const keyBuf = Buffer.from(key, 'utf-8');
  const result = Buffer.alloc(dataBuf.length);
  for (let i = 0; i < dataBuf.length; i++) {
    result[i] = dataBuf[i] ^ keyBuf[i % keyBuf.length];
  }
  return result.toString('base64');
}

function xorDecode(encoded, key) {
  try {
    const dataBuf = Buffer.from(encoded, 'base64');
    const keyBuf = Buffer.from(key, 'utf-8');
    const result = Buffer.alloc(dataBuf.length);
    for (let i = 0; i < dataBuf.length; i++) {
      result[i] = dataBuf[i] ^ keyBuf[i % keyBuf.length];
    }
    return result.toString('utf-8');
  } catch {
    return null;
  }
}

function computeLicenseHash(payload, signature) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(payload) + signature + OBFUSCATE_KEY)
    .digest('hex')
    .substring(0, 32);
}

function verifySignature(payload, signature) {
  const publicKey = getPublicKey();
  if (!publicKey) return { valid: false, error: 'Public key tidak ditemukan' };

  try {
    const keyObject = crypto.createPublicKey(publicKey);
    const data = Buffer.from(JSON.stringify(payload), 'utf-8');
    const sig = Buffer.from(signature, 'base64');
    const verified = crypto.verify(null, data, keyObject, sig);
    return { valid: verified };
  } catch (e) {
    return { valid: false, error: 'Verifikasi gagal: ' + e.message };
  }
}

function validateLicense(licenseData) {
  const now = new Date();

  if (!licenseData.npsn) return { valid: false, error: 'NPSN tidak ditemukan' };
  if (!licenseData.tier) return { valid: false, error: 'Tier tidak valid' };

  if (licenseData.expiry) {
    const expiry = new Date(licenseData.expiry);
    if (now > expiry) {
      return { valid: false, error: 'License expired pada ' + expiry.toLocaleDateString('id-ID') };
    }
  }

  if (licenseData.hardwareId) {
    const currentFingerprint = getFingerprint();
    if (licenseData.hardwareId !== currentFingerprint) {
      return { valid: false, error: 'License terikat ke device lain.' };
    }
  }

  return { valid: true };
}

function getStoredLicense() {
  const fp = getLicenseFilePath();
  if (!fs.existsSync(fp)) {
    const oldFp = path.join(getDataDir(), 'license.json');
    if (fs.existsSync(oldFp)) {
      try {
        const oldData = JSON.parse(fs.readFileSync(oldFp, 'utf-8'));
        saveLicense(oldData);
        fs.unlinkSync(oldFp);
        return oldData;
      } catch {}
    }
    return null;
  }

  try {
    const encoded = fs.readFileSync(fp, 'utf-8');
    const decoded = xorDecode(encoded, OBFUSCATE_KEY);
    if (!decoded) return null;
    const parsed = JSON.parse(decoded);

    if (!parsed.payload || !parsed.signature || !parsed.hash) {
      return null;
    }

    const expectedHash = computeLicenseHash(parsed.payload, parsed.signature);
    if (parsed.hash !== expectedHash) {
      return null;
    }

    if (!verifySignature(parsed.payload, parsed.signature).valid) {
      return null;
    }

    return {
      key: parsed.key,
      npsn: parsed.payload.npsn,
      tier: parsed.payload.tier,
      expiry: parsed.payload.expiry || null,
      hardwareId: parsed.hardwareId,
      activatedAt: parsed.activatedAt,
      signature: parsed.signature,
      payload: parsed.payload,
    };
  } catch {
    return null;
  }
}

function saveLicense(licenseData) {
  const payload = {
    npsn: licenseData.npsn,
    tier: licenseData.tier,
    expiry: licenseData.expiry || null,
    issuedAt: licenseData.payload?.issuedAt || new Date().toISOString(),
  };

  const storeData = {
    key: licenseData.key,
    payload: payload,
    signature: licenseData.signature,
    hardwareId: getFingerprint(),
    activatedAt: new Date().toISOString(),
  };

  storeData.hash = computeLicenseHash(payload, licenseData.signature);

  const encoded = xorEncode(JSON.stringify(storeData), OBFUSCATE_KEY);
  fs.writeFileSync(getLicenseFilePath(), encoded, 'utf-8');

  const backup = { ...storeData, hash: crypto.createHash('sha256').update(JSON.stringify(storeData) + OBFUSCATE_KEY + '_bak').digest('hex').substring(0, 32) };
  fs.writeFileSync(getLicenseBackupPath(), xorEncode(JSON.stringify(backup), OBFUSCATE_KEY + '_bak'), 'utf-8');
}

function removeLicense() {
  [getLicenseFilePath(), getLicenseBackupPath(), path.join(getDataDir(), 'license.json')].forEach((p) => {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });
}

const LICENSE_SERVICE_URL = 'https://project-11rt0.vercel.app';

function isShortKey(key) {
  const cleaned = key.trim().toUpperCase();
  return /^SMARTSPJ-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{4}$/.test(cleaned);
}

function isLegacyKey(key) {
  const cleaned = key.trim().replace(/^SMARTSPJ-/i, '').replace(/[-\s]/g, '');
  return cleaned.length > 30;
}

function parseLicenseKey(key) {
  try {
    const cleaned = key.trim().replace(/^SMARTSPJ-/i, '').replace(/[-\s]/g, '');
    const decoded = Buffer.from(cleaned, 'base64').toString('utf-8');
    const parsed = JSON.parse(decoded);

    if (!parsed.p || !parsed.s || !parsed.t) {
      return { valid: false, error: 'Format key tidak valid' };
    }

    return { valid: true, payload: parsed.p, signature: parsed.s, meta: parsed.t };
  } catch (e) {
    return { valid: false, error: 'Key tidak dapat diparsing: ' + e.message };
  }
}

async function resolveShortKey(key, hardwareId) {
  let resp;
  try {
    resp = await fetch(`${LICENSE_SERVICE_URL}/api/activate-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, hardwareId }),
    });
  } catch (e) {
    return { valid: false, error: 'Tidak dapat terhubung ke server license. Periksa koneksi internet.' };
  }

  const text = await resp.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { valid: false, error: 'Server license belum siap. Pastikan endpoint /api/activate-key sudah di-deploy.' };
  }

  if (!data.success) {
    return { valid: false, error: data.error || 'Aktivasi key gagal.' };
  }
  return { valid: true, payload: data.payload, signature: data.signature, meta: data.meta };
}

function setNetFetch(fn) {
  fetch = fn;
}

async function activateLicense(key, npsn) {
  if (isShortKey(key)) {
    const resolved = await resolveShortKey(key, getFingerprint());
    if (!resolved.valid) return { success: false, error: resolved.error };

    const { payload, signature } = resolved;
    const sigCheck = verifySignature(payload, signature);
    if (!sigCheck.valid) return { success: false, error: sigCheck.error || 'Signature tidak valid' };

    if (payload.npsn !== npsn) {
      return { success: false, error: `License ini untuk NPSN ${payload.npsn}, bukan ${npsn}` };
    }

    const licenseRecord = {
      key,
      npsn: payload.npsn,
      tier: payload.tier,
      expiry: payload.expiry || null,
      hardwareId: getFingerprint(),
      activatedAt: new Date().toISOString(),
      signature,
      payload,
    };

    const validation = validateLicense(licenseRecord);
    if (!validation.valid) return { success: false, error: validation.error };

    saveLicense(licenseRecord);
    return {
      success: true,
      tier: licenseRecord.tier,
      expiry: licenseRecord.expiry,
      npsn: licenseRecord.npsn,
    };
  }

  if (isLegacyKey(key)) {
    const parsed = parseLicenseKey(key);
    if (!parsed.valid) return { success: false, error: parsed.error };

    const { payload, signature } = parsed;

    const sigCheck = verifySignature(payload, signature);
    if (!sigCheck.valid) return { success: false, error: sigCheck.error || 'Signature tidak valid' };

    if (payload.npsn !== npsn) {
      return { success: false, error: `License ini untuk NPSN ${payload.npsn}, bukan ${npsn}` };
    }

    const licenseRecord = {
      key,
      npsn: payload.npsn,
      tier: payload.tier,
      expiry: payload.expiry || null,
      hardwareId: getFingerprint(),
      activatedAt: new Date().toISOString(),
      signature,
      payload,
    };

    const validation = validateLicense(licenseRecord);
    if (!validation.valid) return { success: false, error: validation.error };

    saveLicense(licenseRecord);
    return {
      success: true,
      tier: licenseRecord.tier,
      expiry: licenseRecord.expiry,
      npsn: licenseRecord.npsn,
    };
  }

  return { success: false, error: 'Format key tidak dikenali. Gunakan format SMARTSPJ-XXXXX-XXXXX-XXXXX-XXXXX.' };
}

async function deactivateLicense() {
  const license = getStoredLicense();
  if (license && isShortKey(license.key)) {
    try {
      await fetch(`${LICENSE_SERVICE_URL}/api/deactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ npsn: license.npsn, licenseKey: license.key }),
      });
    } catch {}
  }
  removeLicense();
  return { success: true };
}

function getStatus() {
  const license = getStoredLicense();

  if (license) {
    const sigResult = verifySignature(license.payload, license.signature);
    if (!sigResult.valid) {
      return {
        licensed: false, tier: 'free', expiry: null, npsn: null,
        expired: true, trialActive: false, trial: getTrialInfo(),
        error: 'License tidak valid (signature mismatch)',
      };
    }

    const validation = validateLicense(license);
    if (validation.valid) {
      return {
        licensed: true,
        tier: license.tier,
        expiry: license.expiry,
        npsn: license.npsn,
        activatedAt: license.activatedAt,
        expired: false,
        trialActive: false,
      };
    } else {
      return {
        licensed: false, tier: 'free', expiry: null, npsn: null,
        expired: true, trialActive: false, trial: getTrialInfo(),
        error: validation.error,
      };
    }
  }

  const trial = getTrialInfo();
  return {
    licensed: false,
    tier: 'free',
    expiry: null,
    npsn: null,
    expired: false,
    trialActive: !trial.expired,
    trial,
  };
}

function getTier() {
  return getStatus().tier;
}

module.exports = {
  activateLicense,
  deactivateLicense,
  getStatus,
  getTier,
  getStoredLicense,
  parseLicenseKey,
  isShortKey,
  isLegacyKey,
  setNetFetch,
  verifySignature,
};
