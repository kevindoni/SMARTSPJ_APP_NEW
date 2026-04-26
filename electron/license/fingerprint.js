const crypto = require('crypto');
const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

function getVolumeSerial() {
  try {
    const output = execSync('vol C:', { encoding: 'utf-8', timeout: 5000 });
    const match = output.match(/is\s+([A-F0-9]{4}-[A-F0-9]{4})/i);
    if (match) return match[1].replace('-', '');
  } catch {}
  try {
    const output = execSync('wmic diskdrive get serialnumber', {
      encoding: 'utf-8',
      timeout: 5000,
    });
    const lines = output.split('\n').filter((l) => l.trim());
    if (lines.length > 1) return lines[1].trim().replace(/\s/g, '');
  } catch {}
  return null;
}

function getCPUSerial() {
  try {
    const output = execSync('wmic cpu get processorid', {
      encoding: 'utf-8',
      timeout: 5000,
    });
    const lines = output.split('\n').filter((l) => l.trim());
    if (lines.length > 1) return lines[1].trim().replace(/\s/g, '');
  } catch {}
  return null;
}

function getMachineId() {
  try {
    const output = execSync('wmic csproduct get uuid', {
      encoding: 'utf-8',
      timeout: 5000,
    });
    const lines = output.split('\n').filter((l) => l.trim());
    if (lines.length > 1) return lines[1].trim().replace(/\s/g, '');
  } catch {}
  return os.hostname() + '-' + os.cpus()[0]?.model;
}

function getFingerprint() {
  const parts = [getMachineId() || 'unknown', getCPUSerial() || 'no-cpu', getVolumeSerial() || 'no-disk'];
  const raw = parts.join('|');
  return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 32);
}

function getShortId() {
  return getFingerprint().substring(0, 8).toUpperCase();
}

module.exports = { getFingerprint, getShortId };
