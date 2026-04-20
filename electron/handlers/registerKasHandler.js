const fs = require('fs');
const path = require('path');

let DATA_DIR = path.join(__dirname, '../../data');

function initRegisterKasStorage(dir) {
  DATA_DIR = dir;
}

// Use a getter to always resolve against the current DATA_DIR
// (avoids stale path when initRegisterKasStorage is called after module load)
function getRegisterFilePath() {
  return path.join(DATA_DIR, 'register-kas.json');
}

function loadFile() {
  try {
    const filePath = getRegisterFilePath();
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (e) { console.error("Failed to load register kas file:", e.message); }
  return {};
}

function saveFile(data) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(getRegisterFilePath(), JSON.stringify(data, null, 2), 'utf-8');
}

function getRegisterKasData(year, month, fundSource) {
  const key = `${year}-${String(month).padStart(2, '0')}-${fundSource || 'SEMUA'}`;
  const data = loadFile();
  return {
    success: true,
    data: data[key] || { notes: {}, coins: {} },
  };
}

function saveRegisterKasData(year, month, fundSource, denominations) {
  const key = `${year}-${String(month).padStart(2, '0')}-${fundSource || 'SEMUA'}`;
  const data = loadFile();
  data[key] = {
    ...denominations,
    updatedAt: new Date().toISOString(),
  };
  saveFile(data);
  return { success: true };
}

module.exports = {
  initRegisterKasStorage,
  getRegisterKasData,
  saveRegisterKasData,
};
