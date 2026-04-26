const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const TRIAL_DAYS = 30;
const SALT = 'smrtspj2026x';

function getDataDir() {
  const p = path.join(os.homedir(), 'AppData', 'Roaming', 'smart-spj', 'data');
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  return p;
}

function getTrialFilePath() {
  return path.join(getDataDir(), '.sys_cache');
}

function computeHash(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data) + SALT).digest('hex').substring(0, 32);
}

function getRealTimestamp() {
  return Date.now();
}

function initTrial() {
  const fp = getTrialFilePath();
  if (fs.existsSync(fp)) {
    try {
      const raw = fs.readFileSync(fp, 'utf-8');
      const decoded = Buffer.from(raw, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);

      if (!parsed.h || parsed.h !== computeHash({ s: parsed.s, c: parsed.c, v: parsed.v })) {
        const fresh = createFreshTrial();
        writeTrial(fresh);
        return fresh;
      }

      const storedCount = (parsed.c || 0) + 1;
      if (parsed.v !== storedCount) {
        const fresh = createFreshTrial();
        writeTrial(fresh);
        return fresh;
      }

      return { startDate: parsed.s, version: parsed.v, counter: parsed.c };
    } catch {
      const fresh = createFreshTrial();
      writeTrial(fresh);
      return fresh;
    }
  }

  const fresh = createFreshTrial();
  writeTrial(fresh);
  return fresh;
}

function createFreshTrial() {
  return { startDate: new Date().toISOString(), version: 1, counter: 0 };
}

function writeTrial(data) {
  const toStore = { s: data.startDate, c: data.version, v: data.version };
  toStore.h = computeHash(toStore);
  const encoded = Buffer.from(JSON.stringify(toStore)).toString('base64');
  try {
    fs.writeFileSync(getTrialFilePath(), encoded, 'utf-8');

    const altPath = path.join(getDataDir(), '.sys_idx');
    const altData = { t: data.startDate, n: data.version, m: computeHash({ t: data.startDate, n: data.version }) };
    fs.writeFileSync(altPath, Buffer.from(JSON.stringify(altData)).toString('base64'), 'utf-8');
  } catch {}
}

function getTrialInfo() {
  const trial = initTrial();

  const altPath = path.join(getDataDir(), '.sys_idx');
  if (fs.existsSync(altPath)) {
    try {
      const altRaw = Buffer.from(fs.readFileSync(altPath, 'utf-8'), 'base64').toString('utf-8');
      const altParsed = JSON.parse(altRaw);
      if (altParsed.t && altParsed.m === computeHash({ t: altParsed.t, n: altParsed.n })) {
        if (altParsed.t !== trial.startDate) {
          const d1 = new Date(trial.startDate).getTime();
          const d2 = new Date(altParsed.t).getTime();
          const earliest = new Date(Math.min(d1, d2)).toISOString();
          if (earliest !== trial.startDate) {
            trial.startDate = earliest;
          }
        }
      }
    } catch {}
  }

  const start = new Date(trial.startDate);
  const now = new Date();
  const elapsedMs = now.getTime() - start.getTime();
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const remaining = Math.max(0, TRIAL_DAYS - elapsedDays);
  const expired = elapsedDays >= TRIAL_DAYS;
  const percentage = Math.min(100, Math.round((elapsedDays / TRIAL_DAYS) * 100));

  return {
    active: true,
    startDate: trial.startDate,
    daysTotal: TRIAL_DAYS,
    daysElapsed: elapsedDays,
    daysRemaining: remaining,
    expired,
    percentage,
  };
}

function resetTrial() {
  const fp = getTrialFilePath();
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
  const altPath = path.join(getDataDir(), '.sys_idx');
  if (fs.existsSync(altPath)) fs.unlinkSync(altPath);
}

module.exports = { getTrialInfo, resetTrial, TRIAL_DAYS };
