const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3-multiple-ciphers');
const fs = require('fs');
let autoUpdater;
try {
  autoUpdater = require('electron-updater').autoUpdater;
} catch (e) {
  // electron-updater not available
}

// Format no_bukti list: ['BNU173','BNU174',...,'BNU182'] -> 'BNU173 - BNU182'
function formatNoBuktiList(list) {
  const unique = [...new Set(list)].filter(Boolean);
  if (unique.length === 0) return 'GABUNGAN';
  if (unique.length === 1) return unique[0];
  // Try to extract prefix + number pattern
  const match = unique[0].match(/^(.*?)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const nums = unique
      .map((s) => {
        const m = s.match(/^.*?(\d+)$/);
        return m ? parseInt(m[1]) : null;
      })
      .filter((n) => n !== null)
      .sort((a, b) => a - b);
    if (nums.length === unique.length && unique.every((s) => s.startsWith(prefix))) {
      const min = Math.min(...nums);
      const max = Math.max(...nums);
      if (max - min === nums.length - 1) {
        // Consecutive range
        return prefix + min + ' - ' + prefix + max;
      }
      // Same prefix, not consecutive: show range anyway
      return prefix + min + ' - ' + prefix + max;
    }
  }
  // Fallback: join with comma
  return unique.join(', ');
}

// Helper: compare semver versions (true if remote > local)
function isNewerVersion(remote, local) {
  const r = remote
    .replace(/^v/, '')
    .split('.')
    .map((s) => parseInt(s, 10) || 0);
  const l = local
    .replace(/^v/, '')
    .split('.')
    .map((s) => parseInt(s, 10) || 0);
  for (let i = 0; i < Math.max(r.length, l.length); i++) {
    const rv = r[i] || 0;
    const lv = l[i] || 0;
    if (rv > lv) return true;
    if (rv < lv) return false;
  }
  return false;
}

const isDev = !app.isPackaged;
let DATA_DIR = isDev ? path.join(__dirname, '../data') : path.join(app.getPath('userData'), 'data');

function getDbPath() {
  const homeDir = require('os').homedir();
  const roaming = process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');
  const local = process.env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local');

  // Candidate paths - search in priority order
  const candidates = [
    path.join(roaming, 'arkas', 'arkas.db'), // %APPDATA% arkas (lowercase, most common)
    path.join(roaming, 'Arkas', 'arkas.db'), // %APPDATA% Arkas (PascalCase)
    path.join(roaming, 'ARKAS', 'arkas.db'), // %APPDATA% ARKAS (uppercase)
    path.join(local, 'arkas', 'arkas.db'), // %LOCALAPPDATA% arkas
    path.join(local, 'Arkas', 'arkas.db'), // %LOCALAPPDATA% Arkas
    path.join(roaming, 'RKAS', 'arkas.db'), // %APPDATA% RKAS (legacy name)
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  // Fallback: default to %APPDATA% arkas arkas.db
  return candidates[0];
}

function loadLocalConfig() {
  const configPath = path.join(DATA_DIR, 'config.json');
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    console.error('Config load error:', e.message);
  }
  return {};
}

function saveLocalConfig(updates) {
  const configPath = path.join(DATA_DIR, 'config.json');
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const existing = loadLocalConfig();
    const merged = { ...existing, ...updates };
    fs.writeFileSync(configPath, JSON.stringify(merged, null, 2), 'utf8');
  } catch (e) {
    console.error('Config save error:', e.message);
  }
}

const dashboardHandler = require('./handlers/dashboardHandler');
const kertasKerjaHandler = require('./handlers/kertasKerjaHandler');
const transactionHandler = require('./handlers/transactionHandler');
const exportHandler = require('./handlers/exportHandler');
const reconciliationHandler = require('./handlers/reconciliationHandler');
const bankReconciliationHandler = require('./handlers/bankReconciliationHandler');
const registerKasHandler = require('./handlers/registerKasHandler');
const manualTaxHandler = require('./handlers/manualTaxHandler');
const notaGroupHandler = require('./handlers/notaGroupHandler');
const scrapeHandler = require('./handlers/scrapeHandler');
const backupHandler = require('./handlers/backupHandler');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
registerKasHandler.initRegisterKasStorage(DATA_DIR);
manualTaxHandler.initManualTaxStorage(DATA_DIR);
notaGroupHandler.initNotaGroupStorage(DATA_DIR);
reconciliationHandler.initSignatoryStorage(DATA_DIR);
backupHandler.initBackupStorage(DATA_DIR);

// Secure password management using Electron safeStorage
// Password is stored encrypted in a local config file, never in plain text .env
let ARKAS_PASSWORD = '';

function getSecurePasswordPath() {
  return path.join(DATA_DIR, '.arkas-key');
}

function loadSecurePassword() {
  const keyPath = getSecurePasswordPath();

  // 1. Try encrypted storage first (production)
  if (fs.existsSync(keyPath)) {
    try {
      const { safeStorage } = require('electron');
      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = fs.readFileSync(keyPath);
        ARKAS_PASSWORD = safeStorage.decryptString(Buffer.from(encrypted)).toString();
        return;
      }
    } catch (e) {
      // safeStorage not available yet (before app ready) or decrypt failed
    }
  }

  // 2. Fallback: read from .env (dev mode or first run)
  const envPaths = [
    path.join(__dirname, '../.env'),
    path.join(process.resourcesPath, '.env'),
    path.join(path.dirname(app.getPath('exe')), '.env'),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      require('dotenv').config({ path: envPath });
      break;
    }
  }
  ARKAS_PASSWORD = process.env.ARKAS_PASSWORD || '';

  // 3. If we got the password, migrate to encrypted storage
  if (ARKAS_PASSWORD) {
    try {
      const { safeStorage } = require('electron');
      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(ARKAS_PASSWORD);
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(keyPath, encrypted);
      }
    } catch (e) {
      // safeStorage not ready yet - will retry next launch
    }
  }
} // Password will be loaded after app is ready (safeStorage requires app ready)
// loadSecurePassword() is called in app.whenReady()

function getSecureTokenPath() {
  return path.join(DATA_DIR, '.updater-key');
}

function loadSecureGithubToken() {
  const keyPath = getSecureTokenPath();

  // 1. Try encrypted storage first
  if (fs.existsSync(keyPath)) {
    try {
      const { safeStorage } = require('electron');
      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = fs.readFileSync(keyPath);
        return safeStorage.decryptString(Buffer.from(encrypted)).toString();
      }
    } catch (e) {
      console.error('[Updater] Failed to decrypt token:', e.message);
    }
  }

  // 2. Fallback: read from updater.json (plain text)
  const updaterConfigPath = path.join(DATA_DIR, 'updater.json');
  let token = '';
  try {
    if (fs.existsSync(updaterConfigPath)) {
      const config = JSON.parse(fs.readFileSync(updaterConfigPath, 'utf8'));
      token = config.github_token || '';
    }
  } catch (e) {
    console.error('[Updater] Failed to load updater config:', e.message);
  }

  // 3. Migrate to encrypted storage and remove plain text
  if (token) {
    try {
      const { safeStorage } = require('electron');
      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(token);
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(keyPath, encrypted);
        // Remove plain text token from updater.json
        try {
          const config = JSON.parse(fs.readFileSync(updaterConfigPath, 'utf8'));
          delete config.github_token;
          config._migrated = 'Token telah dimigrasikan ke penyimpanan terenkripsi';
          fs.writeFileSync(updaterConfigPath, JSON.stringify(config, null, 2), 'utf8');
        } catch (e) {
          /* ignore */
        }
        console.log('[Updater] Token migrated to encrypted storage');
      }
    } catch (e) {
      console.error('[Updater] Token migration failed:', e.message);
    }
  }

  return token;
}

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'logo.png'),
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3847');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Open DevTools in Dev Mode
  // if (isDev) mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

let isCheckingUpdate = false;

function setupAutoUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  // Load GitHub token from encrypted storage (auto-migrates from updater.json)
  const githubToken = loadSecureGithubToken();

  if (githubToken) {
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'kevindoni',
      repo: 'SMARTSPJ_APP_NEW',
      private: true,
      token: githubToken,
    });
  } else {
    // No token - try public access (won't work for private repos but won't crash)
    console.warn('[Updater] No GitHub token found. Auto-update may not work for private repo.');
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'kevindoni',
      repo: 'SMARTSPJ_APP_NEW',
    });
  }

  let isAutoCheck = false;

  autoUpdater.on('update-available', (info) => {
    if (isAutoCheck) return;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-available', {
        version: info.version,
        releaseNotes: info.releaseNotes || '',
      });
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-progress', {
        percent: progress.percent,
        transferred: progress.transferred,
        total: progress.total,
        bytesPerSecond: progress.bytesPerSecond,
      });
    }
  });

  autoUpdater.on('update-downloaded', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-downloaded');
    }
  });

  autoUpdater.on('update-not-available', () => {
    if (isAutoCheck) return;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-not-available');
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('[Updater] Error:', err.message);
    if (isAutoCheck) return;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-error', { message: err.message });
    }
  });

  // Auto-check for updates 5 seconds after window loads
  mainWindow.webContents.on('did-finish-load', () => {
    setTimeout(async () => {
      if (isCheckingUpdate) return;
      isAutoCheck = true;
      isCheckingUpdate = true;
      try {
        console.log('[Updater] Auto-checking for updates...');
        const result = await autoUpdater.checkForUpdates();
        if (result && result.updateInfo) {
          const hasUpdate = isNewerVersion(result.updateInfo.version, app.getVersion());
          console.log(
            '[Updater] Auto-check result:',
            hasUpdate ? 'UPDATE AVAILABLE' : 'up to date',
            '| remote:',
            result.updateInfo.version,
            '| local:',
            app.getVersion()
          );
          if (hasUpdate && mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('update-available', {
              version: result.updateInfo.version,
              releaseNotes: result.updateInfo.releaseNotes || '',
            });
          }
        }
      } catch (err) {
        console.error('[Updater] Auto-check failed:', err.message);
      } finally {
        isAutoCheck = false;
        isCheckingUpdate = false;
      }
    }, 5000);
  });

  // Guard: remove existing handlers to prevent double-register
  ['arkas:check-update', 'arkas:download-update', 'arkas:install-update'].forEach((ch) => {
    try {
      ipcMain.removeHandler(ch);
    } catch (e) {
      /* not registered yet */
    }
  });

  ipcMain.handle('arkas:check-update', async () => {
    if (isCheckingUpdate) {
      return {
        hasUpdate: false,
        currentVersion: app.getVersion(),
        error: 'Cek update sedang berjalan',
      };
    }
    isCheckingUpdate = true;
    try {
      console.log('[Updater] Checking for updates... current:', app.getVersion());
      const result = await Promise.race([
        autoUpdater.checkForUpdates(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout: cek update melebihi 30 detik')), 30000)
        ),
      ]);
      if (result && result.updateInfo) {
        const hasUpdate = isNewerVersion(result.updateInfo.version, app.getVersion());
        console.log(
          '[Updater] hasUpdate:',
          hasUpdate,
          '| remote:',
          result.updateInfo.version,
          '| local:',
          app.getVersion()
        );
        return {
          hasUpdate,
          version: result.updateInfo.version,
          currentVersion: app.getVersion(),
          releaseNotes: result.updateInfo.releaseNotes || '',
        };
      }
      console.log('[Updater] No updateInfo in result');
      return { hasUpdate: false, currentVersion: app.getVersion() };
    } catch (err) {
      console.error('[Updater] Check failed:', err.message);
      return { hasUpdate: false, error: err.message, currentVersion: app.getVersion() };
    } finally {
      isCheckingUpdate = false;
    }
  });

  ipcMain.handle('arkas:download-update', async () => {
    try {
      await Promise.race([
        autoUpdater.downloadUpdate(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout: download melebihi 5 menit')), 300000)
        ),
      ]);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('arkas:install-update', () => {
    autoUpdater.quitAndInstall(false, true);
  });
}

// ─── Updater Token Management (outside setupAutoUpdater to avoid double-register) ───
ipcMain.handle('arkas:save-updater-token', async (_event, token) => {
  try {
    if (!token || typeof token !== 'string' || token.trim().length < 10) {
      return { success: false, error: 'Token tidak valid' };
    }
    const { safeStorage } = require('electron');
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(token.trim());
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(getSecureTokenPath(), encrypted);
    } else {
      // Fallback: save to updater.json
      const updaterConfigPath = path.join(DATA_DIR, 'updater.json');
      const config = fs.existsSync(updaterConfigPath)
        ? JSON.parse(fs.readFileSync(updaterConfigPath, 'utf8'))
        : {};
      config.github_token = token.trim();
      fs.writeFileSync(updaterConfigPath, JSON.stringify(config, null, 2), 'utf8');
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('arkas:get-updater-token-status', async () => {
  try {
    const hasEncrypted = fs.existsSync(getSecureTokenPath());
    const updaterConfigPath = path.join(DATA_DIR, 'updater.json');
    let hasPlainText = false;
    if (fs.existsSync(updaterConfigPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(updaterConfigPath, 'utf8'));
        hasPlainText = !!config.github_token;
      } catch (e) {
        /* ignore */
      }
    }
    return { success: true, hasToken: hasEncrypted || hasPlainText, isEncrypted: hasEncrypted };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ─── License IPC Handlers ───
const licenseManager = require('./license/licenseManager');
const licenseEnforcer = require('./license/licenseEnforcer');

const { net: electronNet } = require('electron');
licenseManager.setNetFetch(electronNet.fetch);

const LICENSE_API = 'https://project-11rt0.vercel.app';

ipcMain.handle('arkas:get-license-status', async () => {
  try {
    return licenseManager.getStatus();
  } catch (err) {
    return { licensed: false, tier: 'free', error: err.message };
  }
});

ipcMain.handle('arkas:activate-license', async (event, key) => {
  try {
    let npsn = '';
    try {
      const dbPath = getDbPath();
      if (fs.existsSync(dbPath)) {
        const db = new Database(dbPath, { readonly: true });
        db.pragma("cipher='sqlcipher'");
        db.pragma('legacy=4');
        db.pragma(`key='${ARKAS_PASSWORD}'`);
        const sekolah = getSchoolInfoWithOfficials(db);
        if (sekolah) {
          npsn = sekolah.npsn || sekolah.kode_instansi || '';
        }
        db.close();
      }
    } catch (dbErr) {
      console.error('[activate-license] DB error:', dbErr.message);
    }

    if (!npsn && !licenseManager.isShortKey(key)) {
      const parsed = licenseManager.parseLicenseKey(key);
      if (parsed.valid && parsed.payload?.npsn) {
        npsn = parsed.payload.npsn;
      }
    }

    if (!npsn) return { success: false, error: 'NPSN tidak ditemukan. Pastikan database ARKAS terhubung.' };

    return await licenseManager.activateLicense(key, npsn);
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('arkas:deactivate-license', async () => {
  try {
    return licenseManager.deactivateLicense();
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('arkas:check-license-feature', async (event, feature) => {
  try {
    return licenseEnforcer.canDoAction(feature);
  } catch (err) {
    return { can: false, error: err.message };
  }
});

ipcMain.handle('arkas:increment-license-usage', async (event, feature) => {
  try {
    return licenseEnforcer.incrementUsage(feature);
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('arkas:get-blocked-menus', async () => {
  try {
    return licenseEnforcer.getBlockedMenus();
  } catch {
    return [];
  }
});

ipcMain.handle('arkas:get-hardware-id', async () => {
  try {
    const { getShortId } = require('./license/fingerprint');
    return { id: getShortId() };
  } catch {
    return { id: 'unknown' };
  }
});

ipcMain.handle('arkas:get-stored-license-key', async () => {
  try {
    const license = licenseManager.getStoredLicense();
    return { key: license?.key || '' };
  } catch {
    return { key: '' };
  }
});

ipcMain.handle('arkas:open-payment-page', async (event, tier) => {
  try {
    const { shell } = require('electron');
    await shell.openExternal(`${LICENSE_API}/buy?tier=${tier}`);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('arkas:create-payment', async (event, tier) => {
  try {
    let npsn = '';
    let schoolName = '';
    let customerEmail = '';
    try {
      const dbPath = getDbPath();
      if (fs.existsSync(dbPath)) {
        const db = new Database(dbPath, { readonly: true });
        db.pragma("cipher='sqlcipher'");
        db.pragma('legacy=4');
        db.pragma(`key='${ARKAS_PASSWORD}'`);
        const sekolah = getSchoolInfoWithOfficials(db);
        if (sekolah) {
          npsn = sekolah.npsn || sekolah.kode_instansi || '';
          schoolName = sekolah.nama_sekolah || '';
        }
        try {
          const rows = db.prepare("SELECT varname, varvalue FROM app_config WHERE varvalue LIKE '%@%'").all();
          const priority = ['email_arkas', 'email_bendahara', 'user_email', 'email_sekolah', 'email'];
          for (const p of priority) {
            const found = rows.find(r => r.varname === p);
            if (found && found.varvalue && found.varvalue.includes('@')) {
              customerEmail = found.varvalue;
              break;
            }
          }
        } catch {}
        if (!customerEmail) {
          try {
            const sekolahId = sekolah?.sekolah_id || sekolah?.instansi_id || sekolah?.npsn;
            if (sekolahId) {
              const ids = [sekolahId, sekolah?.instansi_id, sekolah?.npsn].filter(Boolean);
              let penjab = null;
              for (const id of ids) {
                try {
                  const row = db.prepare('SELECT * FROM sekolah_penjab WHERE sekolah_id = ? ORDER BY tahun DESC LIMIT 1').get(id);
                  if (row) { penjab = row; break; }
                } catch {}
              }
              if (penjab) {
                const emailPriority = [
                  { key: 'email_bendahara', label: 'Email Bendahara' },
                  { key: 'nip_komite', label: 'Email Sekolah (komite)' },
                  { key: 'email_ks', label: 'Email Kepala Sekolah' },
                ];
                for (const ep of emailPriority) {
                  const val = (penjab[ep.key] || '').trim();
                  if (val && val.includes('@')) {
                    customerEmail = val;
                    break;
                  }
                }
              }
            }
          } catch {}
        }
        if (!customerEmail) {
          const sekolahEmail = (sekolah?.email_kepsek || '').trim();
          if (sekolahEmail && sekolahEmail.includes('@')) {
            customerEmail = sekolahEmail;
          }
        }
        db.close();
      }
    } catch (dbErr) {
      console.error('[create-payment] DB error:', dbErr.message);
    }

    if (!npsn) return { success: false, error: 'NPSN tidak ditemukan. Pastikan database ARKAS terhubung.' };

    if (!customerEmail) customerEmail = `spj-${npsn}@smartspj.app`;

    const { net } = require('electron');
    const response = await net.fetch(`${LICENSE_API}/api/create-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        npsn,
        tier,
        customerName: schoolName || 'Bendahara BOS',
        customerEmail,
      }),
    });

    const data = await response.json();
    if (data.success) {
      const { shell } = require('electron');
      await shell.openExternal(data.redirectUrl);
      return { success: true, orderId: data.orderId, redirectUrl: data.redirectUrl, amount: data.amount };
    }
    return { success: false, error: data.error || 'Gagal membuat transaksi' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('arkas:check-server-license', async () => {
  try {
    let npsn = '';
    try {
      const dbPath = getDbPath();
      if (fs.existsSync(dbPath)) {
        const db = new Database(dbPath, { readonly: true });
        db.pragma("cipher='sqlcipher'");
        db.pragma('legacy=4');
        db.pragma(`key='${ARKAS_PASSWORD}'`);
        const sekolah = getSchoolInfoWithOfficials(db);
        if (sekolah) {
          npsn = sekolah.npsn || sekolah.kode_instansi || '';
        }
        db.close();
      }
    } catch (dbErr) {
      console.error('[check-server-license] DB error:', dbErr.message);
    }

    if (!npsn) return { active: false, status: 'no_npsn' };

    const { net } = require('electron');
    const response = await net.fetch(`${LICENSE_API}/api/license-status?npsn=${npsn}`);
    return await response.json();
  } catch (err) {
    return { active: false, status: 'error', error: err.message };
  }
});

app.whenReady().then(() => {
  loadSecurePassword();
  createWindow();
  if (!isDev) {
    setupAutoUpdater();
  } else {
    ipcMain.handle('arkas:check-update', async () => ({
      hasUpdate: false,
      currentVersion: app.getVersion(),
      error: 'Auto-update tidak tersedia dalam mode pengembangan',
    }));
    ipcMain.handle('arkas:download-update', async () => ({
      success: false,
      error: 'Auto-update tidak tersedia dalam mode pengembangan',
    }));
    ipcMain.handle('arkas:install-update', () => {});
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

const getSchoolInfoWithOfficials = (db) => {
  let sekolah = null;
  let mstData = null;

  // === STEP 1a: Get instansi data (always) ===
  sekolah = db.prepare(`SELECT * FROM instansi LIMIT 1`).get();

  if (!sekolah) return null;

  // === STEP 1b: Try to get mst_sekolah data via multiple join strategies ===
  const mstQueries = [
    sekolah.instansi_id ? `SELECT * FROM mst_sekolah WHERE sekolah_id = ?` : null,
    sekolah.kode_instansi ? `SELECT * FROM mst_sekolah WHERE npsn = ?` : null,
    `SELECT * FROM mst_sekolah LIMIT 1`,
  ];

  for (const q of mstQueries) {
    if (!q) continue;
    try {
      const param = q.includes('sekolah_id = ?')
        ? sekolah.instansi_id
        : q.includes('npsn = ?')
          ? sekolah.kode_instansi
          : undefined;
      const row = param !== undefined ? db.prepare(q).get(param) : db.prepare(q).get();
      if (row) {
        mstData = row;
        break;
      }
    } catch (e) {
      /* skip */
    }
  }

  // Merge mst_sekolah fields without overwriting instansi columns
  if (mstData) {
    const iCols = Object.keys(sekolah);
    for (const [k, v] of Object.entries(mstData)) {
      if (!iCols.includes(k) || v !== null) {
        sekolah[k] = v;
      }
    }
    sekolah.sekolah_id = mstData.sekolah_id || sekolah.instansi_id;
    if (!sekolah.npsn && mstData.npsn) sekolah.npsn = mstData.npsn;
    if (!sekolah.alamat && mstData.alamat_jalan) sekolah.alamat = mstData.alamat_jalan;
  } else {
    sekolah.sekolah_id = sekolah.sekolah_id || sekolah.instansi_id;
    if (!sekolah.npsn && sekolah.kode_instansi) sekolah.npsn = sekolah.kode_instansi;
  }

  // === STEP 2: Lookup wilayah ===
  const kodeWilayah = sekolah.kode_wilayah || mstData?.kode_wilayah;
  if (kodeWilayah && kodeWilayah !== '0' && kodeWilayah.length >= 2) {
    try {
      const kecamatan = db
        .prepare(`SELECT nama FROM mst_wilayah WHERE kode_wilayah = ?`)
        .get(kodeWilayah);
      if (kecamatan) sekolah.kecamatan = kecamatan.nama;
      const kabKode = kodeWilayah.substring(0, 4) + '00';
      const kabupaten = db
        .prepare(`SELECT nama FROM mst_wilayah WHERE kode_wilayah = ?`)
        .get(kabKode);
      if (kabupaten) sekolah.kabupaten = kabupaten.nama;
      const provKode = kodeWilayah.substring(0, 2) + '0000';
      const provinsi = db
        .prepare(`SELECT nama FROM mst_wilayah WHERE kode_wilayah = ?`)
        .get(provKode);
      if (provinsi) sekolah.provinsi = provinsi.nama;
    } catch (e) {
      console.log('[getSchoolInfo] Wilayah lookup failed:', e.message);
    }
  }

  sekolah.nama_sekolah = sekolah.nama;

  // === STEP 3: Lookup Officials from sekolah_penjab via multiple IDs ===
  const officialIds = [sekolah.sekolah_id, sekolah.instansi_id, sekolah.npsn].filter(Boolean);
  let officials = null;
  for (const id of officialIds) {
    try {
      const row = db
        .prepare(
          `SELECT ks as kepala_sekolah, nip_ks as nip_kepala, bendahara, nip_bendahara FROM sekolah_penjab WHERE sekolah_id = ? ORDER BY tahun DESC LIMIT 1`
        )
        .get(id);
      if (row && (row.kepala_sekolah || row.bendahara)) {
        officials = row;
        break;
      }
    } catch (e) {
      /* skip */
    }
  }
  if (officials) Object.assign(sekolah, officials);

  // === STEP 4: Enrich from app_config ===
  try {
    const configRows = db.prepare(`SELECT varname, varvalue FROM app_config`).all();
    const configMap = {};
    configRows.forEach((r) => {
      configMap[r.varname] = r.varvalue;
    });
    if (!sekolah.kode_registrasi && configMap.koreg) sekolah.kode_registrasi = configMap.koreg;
    if (!sekolah.npsn && configMap.salur) {
      try {
        const salurData = JSON.parse(configMap.salur);
        if (salurData && salurData.length > 0 && salurData[0].npsn)
          sekolah.npsn = salurData[0].npsn;
      } catch (e) {}
    }
    if (configMap.kepala_dinas) sekolah.kepala_dinas = configMap.kepala_dinas;
    if (configMap.nip_kepala_dinas) sekolah.nip_kepala_dinas = configMap.nip_kepala_dinas;
    if (configMap.manager_bos) sekolah.manager_bos = configMap.manager_bos;
    if (configMap.nip_manager_bos) sekolah.nip_manager_bos = configMap.nip_manager_bos;
    if (configMap.bud) sekolah.bud = configMap.bud;
    if (configMap.nip_bud) sekolah.nip_bud = configMap.nip_bud;
  } catch (e) {
    console.log('[getSchoolInfo] app_config lookup skipped:', e.message);
  }

  // === STEP 5: Merge with local config (user overrides) ===
  const localConfig = loadLocalConfig();
  if (localConfig.schoolInfo) Object.assign(sekolah, localConfig.schoolInfo);

  return sekolah;
};

ipcMain.handle('arkas:check-connection', async () => {
  try {
    const dbPath = getDbPath();
    if (!fs.existsSync(dbPath))
      return { success: false, error: 'File database ARKAS tidak ditemukan.' };

    const db = new Database(dbPath, { readonly: true });
    db.pragma("cipher='sqlcipher'");
    db.pragma('legacy=4');
    db.pragma(`key='${ARKAS_PASSWORD}'`);

    // Simple test query
    db.prepare('SELECT 1').get();

    db.close();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('arkas:get-app-version', async () => {
  return {
    appVersion: app.getVersion(),
    electronVersion: process.versions.electron,
    chromeVersion: process.versions.chrome,
    nodeVersion: process.versions.node,
  };
});

ipcMain.handle('arkas:get-school-info', async () => {
  try {
    const dbPath = getDbPath();
    const db = new Database(dbPath, { readonly: true });
    db.pragma("cipher='sqlcipher'");
    db.pragma('legacy=4');
    db.pragma(`key='${ARKAS_PASSWORD}'`);

    const sekolah = getSchoolInfoWithOfficials(db);

    db.close();
    return { success: true, data: sekolah };
  } catch (err) {
    console.error('[getSchoolInfo] Error:', err.message, err.stack);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('arkas:save-school-info', async (event, data) => {
  try {
    // Save only specific relevant fields to avoid garbage
    const safeData = {
      kepala_sekolah: data.kepala_sekolah,
      nip_kepala: data.nip_kepala,
      bendahara: data.bendahara,
      nip_bendahara: data.nip_bendahara,
      nomor_sk: data.nomor_sk,
      tanggal_sk: data.tanggal_sk,
    };
    saveLocalConfig({ schoolInfo: safeData });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('arkas:reload-school-data', async () => {
  try {
    const dbPath = getDbPath();
    const db = new Database(dbPath, { readonly: true });
    db.pragma("cipher='sqlcipher'");
    db.pragma('legacy=4');
    db.pragma(`key='${ARKAS_PASSWORD}'`);

    const sekolah = getSchoolInfoWithOfficials(db);

    db.close();
    return { success: true, data: sekolah };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('arkas:get-fund-sources', async (event, year) => {
  try {
    const dbPath = getDbPath();
    const db = new Database(dbPath, { readonly: true });
    db.pragma("cipher='sqlcipher'");
    db.pragma('legacy=4');
    db.pragma(`key='${ARKAS_PASSWORD}'`);
    const sources = db
      .prepare(
        `SELECT DISTINCT sd.nama_sumber_dana FROM anggaran a JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana WHERE a.tahun_anggaran = ? AND a.soft_delete = 0 ORDER BY sd.nama_sumber_dana`
      )
      .all(year);
    db.close();
    return { success: true, data: sources.map((s) => s.nama_sumber_dana) };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('arkas:get-available-years', async () => {
  try {
    const dbPath = getDbPath();
    if (!fs.existsSync(dbPath))
      return { success: true, data: [2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031] };

    const db = new Database(dbPath, { readonly: true });
    db.pragma("cipher='sqlcipher'");
    db.pragma('legacy=4');
    db.pragma(`key='${ARKAS_PASSWORD}'`);

    const years = db
      .prepare(
        `
            SELECT DISTINCT tahun_anggaran 
            FROM anggaran 
            WHERE soft_delete = 0 
            ORDER BY tahun_anggaran DESC
        `
      )
      .all();

    db.close();

    let result = years.map((y) => parseInt(y.tahun_anggaran)).filter((y) => !isNaN(y));
    if (result.length === 0) result = [new Date().getFullYear()];

    return { success: true, data: result };
  } catch (err) {
    console.error('Get Years Error:', err);
    return { success: false, error: err.message, data: [2024, 2025, 2026] };
  }
});

ipcMain.handle('arkas:get-dashboard-stats', async (event, year, fundSource) => {
  return await dashboardHandler.getDashboardStats(getDbPath(), ARKAS_PASSWORD, year, fundSource);
});

ipcMain.handle('arkas:get-closing-balances', async (event, year, month, fundSource) => {
  return await dashboardHandler.getClosingBalances(
    getDbPath(),
    ARKAS_PASSWORD,
    year,
    month,
    fundSource
  );
});
ipcMain.handle('arkas:get-kertas-kerja', async (event, year, fundSource) => {
  return await kertasKerjaHandler.getKertasKerja(getDbPath(), ARKAS_PASSWORD, year, fundSource);
});
ipcMain.handle('arkas:get-budget-realization', async (event, year, fundSource, month) => {
  return await kertasKerjaHandler.getBudgetRealization(
    getDbPath(),
    ARKAS_PASSWORD,
    year,
    fundSource,
    month
  );
});
ipcMain.handle('arkas:get-transactions', async (event, params) => {
  try {
    const dbPath = getDbPath();
    const db = new Database(dbPath, { readonly: true });
    db.pragma("cipher='sqlcipher'");
    db.pragma('legacy=4');
    db.pragma(`key='${ARKAS_PASSWORD}'`);

    // Load Virtual Overrides
    const localConfig = loadLocalConfig();
    const overrides = localConfig.mergedTransactions || {};

    const result = transactionHandler.getTransactions(db, params, overrides);

    db.close();
    return { success: true, data: result.rows, total: result.total };
  } catch (err) {
    console.error('get-transactions Error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('arkas:export-bku', async (event, frontendTransactions, params) => {
  try {
    const db = new Database(getDbPath(), { readonly: true });
    db.pragma("cipher='sqlcipher'");
    db.pragma('legacy=4');
    db.pragma(`key='${ARKAS_PASSWORD}'`);

    // 1. Get School Info (using shared function)
    const schoolInfo = getSchoolInfoWithOfficials(db);

    let payload = [];

    // Handle both calling conventions: (params) or (transactions, params)
    // If frontendTransactions is an object with scope/year, treat it as params
    let actualParams = params;
    if (!params && frontendTransactions && typeof frontendTransactions === 'object') {
      if (
        frontendTransactions.scope ||
        frontendTransactions.year ||
        frontendTransactions.reportType
      ) {
        actualParams = frontendTransactions;
      }
    }

    // Default scope to 'single' if not provided
    const scope = actualParams?.scope || 'single';

    if (scope === 'bulk') {
      // BULK MODE: Use dashboard stats for accurate saldo (same as frontend)
      const dashboardResult = await dashboardHandler.getDashboardStats(
        getDbPath(),
        ARKAS_PASSWORD,
        actualParams.year,
        actualParams.fundSource
      );

      const chartData = dashboardResult.data?.chart || [];
      const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

      for (const m of months) {
        // Find chart data for this month
        const monthStr = m.toString().padStart(2, '0');
        const monthStats = chartData.find((c) => c.bulan === monthStr) || {
          penerimaan: 0,
          pengeluaran: 0,
          saldo_akhir: 0,
          saldo_tunai: 0,
          saldo_bank: 0,
        };

        // Get opening balance (saldo from previous month)
        let openingBalance = 0;
        if (m > 1) {
          const prevMonthStr = (m - 1).toString().padStart(2, '0');
          const prevMonthStats = chartData.find((c) => c.bulan === prevMonthStr);
          openingBalance = prevMonthStats?.saldo_akhir || 0;
        }

        // Fetch transactions for this month
        const mParams = {
          year: actualParams.year,
          month: m,
          fundSource: actualParams.fundSource,
          limit: 1000000,
        };
        // Add PAJAK filter for tax reports
        if (actualParams.reportType === 'PAJAK') {
          mParams.paymentType = 'PAJAK';
        }
        // Add BANK filter for bank reports
        if (actualParams.reportType === 'BANK') {
          mParams.paymentType = 'BANK';
        }
        const { rows } = transactionHandler.getTransactions(db, mParams);

        // Check if opening balance already exists in data (same logic as frontend)
        const hasExistingOpeningBalance = rows.some((tx) => {
          const isFirstDate =
            tx.tanggal_transaksi &&
            (tx.tanggal_transaksi.includes(`-${monthStr}-01`) ||
              tx.tanggal_transaksi.startsWith(`${actualParams.year}-${monthStr}-01`));
          const uraian = (tx.uraian || '').toLowerCase();
          const isSaldoKeyword = uraian.includes('saldo') || uraian.includes('penerimaan pindahan');
          return isFirstDate && isSaldoKeyword;
        });

        // Build final transaction list with opening balance row if applicable
        let finalTransactions = [];

        // Add opening balance row ONLY if not already in data
        if (m > 1 && openingBalance > 0 && !hasExistingOpeningBalance) {
          finalTransactions.push({
            tanggal_transaksi: `${actualParams.year}-${monthStr}-01`,
            no_bukti: '',
            kode_kegiatan: '',
            kode_rekening: '',
            uraian: 'Saldo Bulan Lalu',
            penerimaan: openingBalance,
            pengeluaran: 0,
            saldo_berjalan: openingBalance,
          });
        }

        // Helper: Same logic as frontend isPenerimaan
        const isPenerimaan = (tx) => {
          const desc = (tx.uraian || '').toLowerCase();
          if (desc.includes('saldo')) return true;
          if (desc.includes('setor tunai')) return true;
          if (desc.includes('pergeseran uang ke bank')) return false;
          if (desc.includes('pergeseran uang di bank')) return true;
          const noBukti = (tx.no_bukti || '').toUpperCase();
          if (noBukti.startsWith('BPU') || noBukti.startsWith('BNU')) return false;
          const expenseIds = [1, 3, 5, 11, 13];
          if (expenseIds.some((id) => id == tx.id_ref_bku)) return false;
          const receiptIds = [2, 4, 10, 12, 14, 26, 28];
          if (receiptIds.some((id) => id == tx.id_ref_bku)) return true;
          if (desc.includes('terima') || desc.includes('penerimaan')) return true;
          if (desc.includes('giro') || desc.includes('bunga bank')) return true;
          if (desc.includes('pengembalian') || desc.includes('pungut')) return true;
          return false;
        };

        // Calculate running balance for each row (starting from opening balance)
        let runningBal = openingBalance;
        rows.forEach((tx) => {
          const isDebit = isPenerimaan(tx);
          const nominal = Math.abs(tx.signed_amount || tx.nominal || 0);

          if (isDebit) {
            runningBal += nominal;
          } else {
            runningBal -= nominal;
          }

          finalTransactions.push({
            tanggal_transaksi: tx.tanggal_transaksi,
            no_bukti: tx.no_bukti || '',
            kode_kegiatan: tx.activity_code || '',
            kode_rekening: tx.kode_rekening || '',
            uraian: tx.uraian || '',
            penerimaan: isDebit ? nominal : 0,
            pengeluaran: !isDebit ? nominal : 0,
            saldo_berjalan: runningBal,
            // Tax fields for PAJAK export
            nominal: tx.nominal,
            signed_amount: tx.signed_amount,
            id_ref_bku: tx.id_ref_bku,
            is_ppn: tx.is_ppn,
            is_pph_21: tx.is_pph_21,
            is_pph_22: tx.is_pph_22,
            is_pph_23: tx.is_pph_23,
            is_pph_4: tx.is_pph_4,
            is_sspd: tx.is_sspd,
            is_siplah: tx.is_siplah,
          });
        });

        // Calculate monthly totals using isPenerimaan logic
        let monthPenerimaan = rows.reduce((s, t) => {
          if (isPenerimaan(t)) return s + Math.abs(t.signed_amount || t.nominal || 0);
          return s;
        }, 0);
        let monthPengeluaran = rows.reduce((s, t) => {
          if (!isPenerimaan(t)) return s + Math.abs(t.signed_amount || t.nominal || 0);
          return s;
        }, 0);

        if (m > 1 && openingBalance > 0) {
          monthPenerimaan += openingBalance;
        }

        payload.push({
          year: actualParams.year,
          month: m,
          fundSource: actualParams.fundSource,
          transactions: finalTransactions,
          // Use chart data saldo_akhir (same as frontend display)
          tablePenerimaan: monthPenerimaan,
          tablePengeluaran: monthPengeluaran,
          calculatedSaldo: monthStats.saldo_akhir,
          stats: {
            saldo_tunai: monthStats.saldo_tunai || 0,
            saldo_bank: monthStats.saldo_bank || 0,
          },
          schoolInfo: schoolInfo,
        });
      }

      actualParams.isBulk = true;
    } else {
      // SINGLE MODE: Use data from frontend (with pre-calculated totals)
      // Special handling for PAJAK reports - fetch from DB to get tax flags
      let transactions = frontendTransactions;

      if (actualParams.reportType === 'PAJAK') {
        // Always fetch PAJAK transactions from DB (has tax flags: is_ppn, is_pph_21, etc)
        const taxParams = {
          year: actualParams.year,
          month: actualParams.month === 'SEMUA' ? 'SEMUA' : actualParams.month,
          fundSource: actualParams.fundSource,
          paymentType: 'PAJAK',
          limit: 100000,
        };
        const taxResult = transactionHandler.getTransactions(db, taxParams);
        transactions = taxResult.rows || [];

        // ALWAYS merge manual taxes from backend storage
        try {
          const exportYear = parseInt(actualParams.year);
          const allManualTaxes = manualTaxHandler.getManualTaxesByYear(exportYear);
          const selectedMonth = actualParams.month;
          const isMonthView = selectedMonth !== 'SEMUA';

          // Filter manual taxes by month (same logic as frontend)
          const filteredManual = allManualTaxes.filter((tax) => {
            if (isMonthView && tax.tanggal) {
              const txMonth = tax.tanggal.substring(5, 7);
              return txMonth === selectedMonth;
            }
            return true;
          });

          // Transform manual taxes to transaction format
          filteredManual.forEach((tax) => {
            let uraian = tax.keterangan || 'Entri Pajak Manual';
            if (tax.jenis_input === 'saldo_awal_tahun' || tax.jenis_input === 'saldo_awal') {
              uraian =
                'Saldo Awal ' +
                tax.jenis_pajak +
                ' (' +
                (tax.keterangan || 'Hutang Tahun Lalu') +
                ')';
            } else if (tax.jenis_input === 'hutang_bulan') {
              uraian = 'Hutang ' + tax.jenis_pajak + ' (' + (tax.keterangan || 'Lupa Bayar') + ')';
            }
            transactions.push({
              tanggal_transaksi: tax.tanggal || tax.created_at?.split('T')[0],
              no_bukti: tax.no_bukti || 'MANUAL',
              kode_rekening: tax.no_bukti || 'MANUAL',
              uraian: uraian,
              nominal: tax.nominal || 0,
              id_ref_bku: tax.position === 'pungutan' ? 10 : 11,
              is_manual: true,
              jenis_pajak: tax.jenis_pajak || '',
              // Tax flags default to 0 (manual entries use jenis_pajak instead)
              is_ppn: 0,
              is_pph_21: 0,
              is_pph_23: 0,
              is_pph_4: 0,
              is_sspd: 0,
              is_siplah: 0,
            });
          });

          // Sort: manual saldo_awal first, then by date
          transactions.sort((a, b) => {
            const aManual = a.is_manual && (a.uraian || '').startsWith('Saldo Awal');
            const bManual = b.is_manual && (b.uraian || '').startsWith('Saldo Awal');
            if (aManual && !bManual) return -1;
            if (bManual && !aManual) return 1;
            return new Date(a.tanggal_transaksi) - new Date(b.tanggal_transaksi);
          });
        } catch (e) {
          console.error('Error merging manual taxes for export:', e);
        }
      }

      payload = {
        year: actualParams.year,
        month: actualParams.month,
        fundSource: actualParams.fundSource,
        transactions: transactions,
        // Use pre-calculated values from frontend display
        tablePenerimaan: actualParams.tablePenerimaan,
        tablePengeluaran: actualParams.tablePengeluaran,
        calculatedSaldo: actualParams.calculatedSaldo,
        stats: actualParams.stats,
        schoolInfo: schoolInfo,
      };
      actualParams.isBulk = false;
    }

    db.close();

    // 2. Call Export Handler
    const result = await exportHandler.exportData(payload, actualParams);
    return result;
  } catch (err) {
    console.error('Export BKU Error:', err);
    return { success: false, error: err.message };
  }
});

// IPC: PRINT KWITANSI
ipcMain.handle('arkas:print-kwitansi', async (event, transaction, year) => {
  let db;
  try {
    db = new Database(getDbPath(), { readonly: true });
    db.pragma("cipher='sqlcipher'");
    db.pragma('legacy=4');
    db.pragma(`key='${ARKAS_PASSWORD}'`);

    // Use the shared helper to get school info with officials
    const schoolInfo = getSchoolInfoWithOfficials(db);

    const { dialog } = require('electron');
    const result = await dialog.showSaveDialog({
      title: 'Simpan Kwitansi A2',
      defaultPath: `Kwitansi_${transaction.no_bukti || 'Draft'}.pdf`,
      filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
    });

    if (result.canceled || !result.filePath) {
      db.close();
      return { canceled: true };
    }

    // Add Year info to transaction object if missing
    transaction.year = year;

    // AUTO-MERGE: Check for other items with same No Bukti (Checking Virtual Overrides)
    if (transaction.no_bukti) {
      try {
        // Load Virtual Overrides
        const localConfig = loadLocalConfig();
        const overrides = localConfig.mergedTransactions || {};

        const relatedItems = transactionHandler.getTransactionsByProof(
          db,
          transaction.no_bukti,
          year,
          overrides
        );
        if (relatedItems && relatedItems.length > 1) {
          // Sum nominal (assuming nilai_bersih is the correct field for amount)
          const totalNominal = relatedItems.reduce(
            (sum, item) => sum + (item.nilai_bersih || 0),
            0
          );

          transaction.nominal = totalNominal; // Update nominal for PDF
          // Optional: You might want to append "(Gabungan)" to description or leave as is
        }
      } catch (err) {
        console.warn('[Auto-Merge] Failed to aggregate items:', err);
      }
    }

    // Generate PDF
    await exportHandler.generateKwitansiPdf(transaction, schoolInfo, result.filePath);

    db.close();
    return { success: true, filePath: result.filePath };
  } catch (error) {
    console.error('Print Kwitansi Error:', error);
    if (db && db.open) db.close();
    return { success: false, error: error.message };
  }
});

// IPC: PRINT MERGED KWITANSI (SAFE - NO DB CHANGE)
ipcMain.handle(
  'arkas:print-merged-kwitansi',
  async (event, idList, customNoBukti, customUraian, year) => {
    let db;
    try {
      db = new Database(getDbPath(), { readonly: true });
      db.pragma("cipher='sqlcipher'");
      db.pragma('legacy=4');
      db.pragma(`key='${ARKAS_PASSWORD}'`);

      // Reuse helper to get school info
      const schoolInfo = getSchoolInfoWithOfficials(db);

      if (!idList || idList.length === 0) throw new Error('No items selected');

      const items = transactionHandler.getTransactionsByIds(db, idList);
      if (items.length === 0) throw new Error('Transactions not found');

      // Calculate Total
      const totalNominal = items.reduce((sum, item) => sum + (item.nominal || 0), 0);

      // Auto-Generate Uraian based on Kode Rekening if no custom Uraian provided
      let finalUraian = customUraian;
      let finalKodeRekening = '';
      let finalNamaRekening = '';

      {
        // ALWAYS calculate aggregates for Kode/Nama Rekening even if Uraian is custom
        const uniqueAccounts = new Map();
        items.forEach((item) => {
          if (item.kode_rekening) {
            // Use nama_rekening (from ref_rekening) or fallback to item.uraian if missing
            const name = item.nama_rekening || item.uraian || '';
            if (!uniqueAccounts.has(item.kode_rekening)) {
              uniqueAccounts.set(item.kode_rekening, name);
            }
          } else {
            // Handle items without kode_rekening (should limit repeats)
            // If no code, we don't add to "Kode Rekening" field usually, just Uraian?
            // But user specifically wants multiple codes.
          }
        });

        // Format: "5.1.02.xx Belanja ..."
        const uraianLines = [];
        const kodeLines = [];
        const namaLines = [];

        uniqueAccounts.forEach((name, code) => {
          kodeLines.push(code);
          namaLines.push(name);
          uraianLines.push(`${code} ${name}`);
        });

        if (!finalUraian) {
          finalUraian = uraianLines.join('\n');
        }
        finalKodeRekening = kodeLines.join('\n');
        finalNamaRekening = namaLines.join('\n');
      }

      // Create Virtual Transaction based on the first item
      const baseItem = items[0];
      const mergedTransaction = {
        ...baseItem,
        transaction_id: baseItem.id_kas_umum,
        no_bukti: customNoBukti || baseItem.no_bukti || 'GABUNGAN',
        uraian: finalUraian, // OVERRIDE Uraian
        kode_rekening: finalKodeRekening || baseItem.kode_rekening, // OVERRIDE Kode Rekening
        nama_rekening: finalNamaRekening || baseItem.nama_rekening, // OVERRIDE Nama Rekening
        nominal: totalNominal, // OVERRIDE with Sum
        year: year,
      };

      const { dialog } = require('electron');
      const result = await dialog.showSaveDialog({
        title: 'Simpan Kuitansi Gabungan (Virtual)',
        defaultPath: `Kuitansi_Gabungan_${mergedTransaction.no_bukti}.pdf`,
        filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
      });

      if (result.canceled || !result.filePath) {
        db.close();
        return { canceled: true };
      }

      // Generate PDF
      await exportHandler.generateKwitansiPdf(mergedTransaction, schoolInfo, result.filePath);

      db.close();
      return { success: true, filePath: result.filePath };
    } catch (error) {
      console.error('Print Merged Error:', error);
      if (db && db.open) db.close();
      return { success: false, error: error.message };
    }
  }
);

// IPC: PRINT BUKTI PENGELUARAN AUTO-SAVE (No Dialog)
ipcMain.handle('arkas:print-bukti-autosave', async (event, idList, noBuktiList, year) => {
  let db;
  try {
    db = new Database(getDbPath(), { readonly: true });
    db.pragma("cipher='sqlcipher'");
    db.pragma('legacy=4');
    db.pragma(`key='${ARKAS_PASSWORD}'`);

    const schoolInfo = getSchoolInfoWithOfficials(db);

    if (!idList || idList.length === 0) throw new Error('No items selected');

    const items = transactionHandler.getTransactionsByIds(db, idList);
    if (items.length === 0) throw new Error('Transactions not found');

    const totalNominal = items.reduce((sum, item) => sum + (item.nominal || 0), 0);

    // Auto-generate uraian from kode_rekening
    const uniqueAccounts = new Map();
    items.forEach((item) => {
      if (item.kode_rekening) {
        const name = item.nama_rekening || item.uraian || '';
        if (!uniqueAccounts.has(item.kode_rekening)) {
          uniqueAccounts.set(item.kode_rekening, name);
        }
      }
    });

    const uraianLines = [];
    const kodeLines = [];
    const namaLines = [];
    uniqueAccounts.forEach((name, code) => {
      kodeLines.push(code);
      namaLines.push(name);
      uraianLines.push(`${code} ${name}`);
    });

    // Show save dialog with simple filename
    const { dialog } = require('electron');
    const fileName = `${formatNoBuktiList(noBuktiList).replace(/[^a-zA-Z0-9._-]/g, '_')}_belanja.pdf`;

    // Query actual tax entries - get ALL PPN entries linked to these transactions
    const idPlaceholders = idList.map(() => '?').join(',');
    const taxRows = db
      .prepare(
        `
      SELECT k.id_kas_umum, k.parent_id_kas_umum, k.saldo, k.is_ppn, k.uraian
      FROM kas_umum k
      WHERE (k.parent_id_kas_umum IN (${idPlaceholders})
             OR k.id_kas_umum IN (SELECT k2.parent_id_kas_umum FROM kas_umum k2 WHERE k2.id_kas_umum IN (${idPlaceholders})))
        AND k.id_ref_bku = 10
        AND k.soft_delete = 0
    `
      )
      .all(...idList, ...idList);

    let actualPPN = 0;
    taxRows.forEach((row) => {
      if (row.is_ppn) actualPPN += row.saldo || 0;
    });

    // If no PPN found from DB, calculate from total nominal (DPP method)
    if (actualPPN === 0 && items[0]?.is_badan_usaha) {
      actualPPN = Math.round((totalNominal / 1.11) * 0.11);
    }

    const vendorName = items[0]?.nama_toko || 'Bukti Belanja';

    const result = await dialog.showSaveDialog({
      title: 'Simpan Bukti Pengeluaran',
      defaultPath: fileName,
      filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
    });

    if (result.canceled || !result.filePath) {
      db.close();
      return { canceled: true };
    }

    // Use Bukti Pengeluaran generator (table format with items)
    await exportHandler.generateBuktiPengeluaranPdf(
      {
        noNota: formatNoBuktiList(noBuktiList),
        namaToko: vendorName,
        tanggalNota: items[0]?.tanggal_transaksi,
        items: items,
        totalNominal: totalNominal,
        hasPPN: actualPPN > 0,
        calculatedPPN: actualPPN,
      },
      schoolInfo,
      result.filePath
    );

    db.close();

    // Open containing folder
    // require('electron').shell.showItemInFolder(result.filePath);

    return { success: true, filePath: result.filePath };
  } catch (error) {
    console.error('Print Bukti Error:', error);
    if (db && db.open) db.close();
    return { success: false, error: error.message };
  }
});

// IPC: PRINT A2 (BUKTI PENGELUARAN UANG) AUTO-SAVE (No Dialog)
ipcMain.handle('arkas:print-a2-autosave', async (event, idList, noBuktiList, year) => {
  let db;
  try {
    db = new Database(getDbPath(), { readonly: true });
    db.pragma("cipher='sqlcipher'");
    db.pragma('legacy=4');
    db.pragma(`key='${ARKAS_PASSWORD}'`);

    const schoolInfo = getSchoolInfoWithOfficials(db);

    if (!idList || idList.length === 0) throw new Error('No items selected');

    const items = transactionHandler.getTransactionsByIds(db, idList);
    if (items.length === 0) throw new Error('Transactions not found');

    const totalNominal = items.reduce((sum, item) => sum + (item.nominal || 0), 0);

    // Auto-generate uraian from kode_rekening
    const uniqueAccounts = new Map();
    items.forEach((item) => {
      if (item.kode_rekening) {
        const name = item.nama_rekening || item.uraian || '';
        if (!uniqueAccounts.has(item.kode_rekening)) {
          uniqueAccounts.set(item.kode_rekening, name);
        }
      }
    });

    const uraianLines = [];
    const kodeLines = [];
    const namaLines = [];
    uniqueAccounts.forEach((name, code) => {
      kodeLines.push(code);
      namaLines.push(name);
      uraianLines.push(`${code} ${name}`);
    });

    const baseItem = items[0];

    // Query actual tax entries (Pungut Pajak, id_ref_bku=10) for these transactions
    const idPlaceholders = idList.map(() => '?').join(',');
    const taxRows = db
      .prepare(
        `
      SELECT k.parent_id_kas_umum, k.saldo, k.uraian,
             k.is_ppn, k.is_pph_21, k.is_pph_23, k.is_pph_4, k.is_sspd
      FROM kas_umum k
      WHERE (k.parent_id_kas_umum IN (${idPlaceholders})
             OR k.id_kas_umum IN (SELECT k2.parent_id_kas_umum FROM kas_umum k2 WHERE k2.id_kas_umum IN (${idPlaceholders})))
        AND k.id_ref_bku = 10
        AND k.soft_delete = 0
    `
      )
      .all(...idList, ...idList);

    let actualPPN = 0,
      actualPPh21 = 0,
      actualPPh23 = 0,
      actualPPh4 = 0,
      actualSSPD = 0;
    taxRows.forEach((row) => {
      const val = row.saldo || 0;
      if (row.is_ppn) actualPPN += val;
      else if (row.is_pph_21) actualPPh21 += val;
      else if (row.is_pph_23) actualPPh23 += val;
      else if (row.is_pph_4) actualPPh4 += val;
      else if (row.is_sspd) actualSSPD += val;
    });

    const a2Data = {
      ...baseItem,
      transaction_id: baseItem.id_kas_umum,
      no_bukti: formatNoBuktiList(noBuktiList) || baseItem.no_bukti || 'GABUNGAN',
      uraian: items
        .map((i) => i.uraian)
        .filter(Boolean)
        .join('\n'),
      kode_rekening: kodeLines.join('\n') || baseItem.kode_rekening,
      nama_rekening: namaLines.join('\n') || baseItem.nama_rekening,
      nominal: totalNominal,
      year: year,
      items: items,
      actualTax: {
        ppn: actualPPN,
        pph21: actualPPh21,
        pph23: actualPPh23,
        pph4: actualPPh4,
        sspd: actualSSPD,
      },
    };

    // Show save dialog with simple filename
    const { dialog } = require('electron');
    const fileName = `${formatNoBuktiList(noBuktiList).replace(/[^a-zA-Z0-9._-]/g, '_')}.pdf`;

    const result = await dialog.showSaveDialog({
      title: 'Simpan A2 (Bukti Pengeluaran Uang)',
      defaultPath: fileName,
      filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
    });

    if (result.canceled || !result.filePath) {
      db.close();
      return { canceled: true };
    }

    // Use A2 generator if available, otherwise fallback to kwitansi
    if (exportHandler.generateA2Pdf) {
      await exportHandler.generateA2Pdf(a2Data, schoolInfo, result.filePath);
    } else {
      await exportHandler.generateKwitansiPdf(a2Data, schoolInfo, result.filePath);
    }

    db.close();

    // Open containing folder
    // require('electron').shell.showItemInFolder(result.filePath);

    return { success: true, filePath: result.filePath };
  } catch (error) {
    console.error('Print A2 Error:', error);
    if (db && db.open) db.close();
    return { success: false, error: error.message };
  }
});

// IPC: GET RELATED TAX ENTRIES
// Finds tax entries (Terima/Setor) related to a transaction by matching calculated tax amounts
ipcMain.handle(
  'arkas:get-related-taxes',
  async (
    event,
    transactionUraian,
    transactionDate,
    transactionKodeRekening,
    year,
    transactionNominal
  ) => {
    let db;
    try {
      db = new Database(getDbPath(), { readonly: true });
      db.pragma("cipher='sqlcipher'");
      db.pragma('legacy=4');
      db.pragma(`key='${ARKAS_PASSWORD}'`);

      const nominal = transactionNominal || 0;

      // Calculate expected tax amounts with tolerance for rounding
      // PPN 11%: DPP = Nominal / 1.11, PPN = DPP * 0.11
      const expectedPPN = Math.round((nominal / 1.11) * 0.11);
      // PPh 21: 5% of nominal (honor simplicity)
      const expectedPPh21 = Math.round(nominal * 0.05);
      // PPh 23: 2% of nominal
      const expectedPPh23 = Math.round(nominal * 0.02);
      // Pajak Daerah (SSPD): 10% of nominal
      const expectedSSPD = Math.round(nominal * 0.1);

      // Query all Terima entries on the same date
      const query = `
            SELECT 
                k.id_kas_umum,
                k.uraian,
                k.saldo,
                k.id_ref_bku,
                k.is_ppn,
                k.is_pph_21,
                k.is_pph_22,
                k.is_pph_23,
                k.is_pph_4,
                k.is_sspd,
                k.tanggal_transaksi,
                k.kode_rekening
            FROM kas_umum k
            WHERE k.soft_delete = 0
              AND k.tanggal_transaksi LIKE ?
              AND k.id_ref_bku = 10
        `;

      const rows = db.prepare(query).all(`%${transactionDate}%`);

      // Match by calculated amount (with tolerance of ±10 for rounding errors)
      let ppnAmount = 0;
      let pph21Amount = 0;
      let pph23Amount = 0;
      let sspdAmount = 0;

      const tolerance = 100; // Allow ±100 for rounding differences

      rows.forEach((row) => {
        const saldo = row.saldo || 0;

        // Check if this entry matches expected PPN
        if (Math.abs(saldo - expectedPPN) <= tolerance && expectedPPN > 0 && ppnAmount === 0) {
          ppnAmount = saldo;
        }
        // Check if matches expected PPh 21
        else if (
          Math.abs(saldo - expectedPPh21) <= tolerance &&
          expectedPPh21 > 0 &&
          pph21Amount === 0
        ) {
          pph21Amount = saldo;
        }
        // Check if matches expected PPh 23
        else if (
          Math.abs(saldo - expectedPPh23) <= tolerance &&
          expectedPPh23 > 0 &&
          pph23Amount === 0
        ) {
          pph23Amount = saldo;
        }
        // Check if matches expected SSPD
        else if (
          Math.abs(saldo - expectedSSPD) <= tolerance &&
          expectedSSPD > 0 &&
          sspdAmount === 0
        ) {
          sspdAmount = saldo;
        }
      });

      db.close();
      return {
        success: true,
        data: {
          ppn: ppnAmount,
          pph21: pph21Amount,
          pph22: 0,
          pph23: pph23Amount,
          pph4: 0,
          sspd: sspdAmount,
          rawEntries: rows,
        },
      };
    } catch (error) {
      console.error('Get related taxes error:', error);
      if (db && db.open) db.close();
      return { success: false, error: error.message };
    }
  }
);

ipcMain.handle('arkas:sync-region-data', async (event, npsn) => {
  return await scrapeHandler.scrapeSchoolData(npsn);
});

// ============================================
// NOTA GROUPS - Local Storage Handlers
// ============================================

// Get all nota groups
ipcMain.handle('nota-groups:get-all', async (event, year) => {
  try {
    const groups = notaGroupHandler.getNotaGroups(year);
    return { success: true, data: groups };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Save nota group
ipcMain.handle('nota-groups:save', async (event, group) => {
  return notaGroupHandler.saveNotaGroup(group);
});

// Delete nota group
ipcMain.handle('nota-groups:delete', async (event, groupId) => {
  return notaGroupHandler.deleteNotaGroup(groupId);
});

// Get nota group by ID
ipcMain.handle('nota-groups:get-by-id', async (event, groupId) => {
  try {
    const group = notaGroupHandler.getNotaGroupById(groupId);
    return { success: true, data: group };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get transactions grouped by nota (from ARKAS - readonly)
ipcMain.handle('arkas:get-transactions-by-nota', async (event, year, month) => {
  let db;
  try {
    db = new Database(getDbPath(), { readonly: true });
    db.pragma("cipher='sqlcipher'");
    db.pragma('legacy=4');
    db.pragma(`key='${ARKAS_PASSWORD}'`);

    let dateFilter = `${year}-%`;
    if (month) {
      dateFilter = `${year}-${month.toString().padStart(2, '0')}-%`;
    }

    // Query ALL transactions with their nota info
    // Join with kas_umum_nota to get nota details
    const query = `
            SELECT 
                k.id_kas_umum,
                k.no_bukti,
                k.uraian,
                k.saldo,
                k.tanggal_transaksi,
                k.kode_rekening,
                k.id_ref_bku,
                k.id_kas_nota,
                kn.id_kas_nota as nota_id,
                kn.no_nota,
                kn.nama_toko,
                kn.tanggal_nota,
                kn.total as nota_total,
                kn.is_beli_di_siplah,
                kn.has_ppn,
                kn.has_pph_22
            FROM kas_umum k
            LEFT JOIN kas_umum_nota kn ON k.id_kas_nota = kn.id_kas_nota AND kn.soft_delete = 0
            WHERE k.soft_delete = 0
              AND k.tanggal_transaksi LIKE ?
              AND (
                (k.no_bukti LIKE 'BNU%' AND k.id_ref_bku = 15)
                OR (k.no_bukti LIKE 'BPU%' AND k.id_ref_bku = 4)
              )
            ORDER BY k.tanggal_transaksi, kn.no_nota
        `;

    const rows = db.prepare(query).all(dateFilter);

    // Group transactions by nota OR by individual transaction if no nota
    const notaGroups = {};

    rows.forEach((row) => {
      // Determine grouping key:
      // - If has nota (no_nota is not empty), group by no_nota + tanggal_nota
      // - If no nota, each transaction is its own "group"
      const hasNota = row.no_nota && row.no_nota.trim() !== '';
      const groupKey = hasNota
        ? `nota_${row.no_nota}_${row.tanggal_nota || row.tanggal_transaksi}`
        : `single_${row.id_kas_umum}`;

      if (!notaGroups[groupKey]) {
        // Detect SIPLah from no_nota pattern (contains /INV/PO)
        const isSiplahFromNota = row.no_nota ? row.no_nota.includes('/INV/PO') : false;

        notaGroups[groupKey] = {
          notaId: row.nota_id || row.id_kas_nota || groupKey,
          noNota: row.no_nota || '',
          namaToko: row.nama_toko || row.uraian?.split('-')[0]?.trim() || 'Tanpa Nama',
          tanggalNota: row.tanggal_nota || row.tanggal_transaksi,
          // SIPLah detection: from database flag OR from no_nota pattern
          isSiplah: row.is_beli_di_siplah === 1 || isSiplahFromNota,
          hasPPN: row.has_ppn === 1,
          hasPPh22: row.has_pph_22 === 1,
          isGrouped: hasNota, // True if this is a grouped nota, false if single transaction
          items: [],
          totalNominal: 0,
        };
      }

      notaGroups[groupKey].items.push({
        id_kas_umum: row.id_kas_umum,
        no_bukti: row.no_bukti,
        uraian: row.uraian,
        nominal: row.saldo,
        tanggal_transaksi: row.tanggal_transaksi,
        kode_rekening: row.kode_rekening,
      });
      notaGroups[groupKey].totalNominal += row.saldo;
    });

    // Calculate PPN for each group
    Object.values(notaGroups).forEach((group) => {
      if (group.hasPPN || group.isSiplah) {
        group.calculatedPPN = Math.round((group.totalNominal / 1.11) * 0.11);
      } else {
        group.calculatedPPN = 0;
      }
    });

    // Sort by date and filter to show grouped notas first, then singles
    const result = Object.values(notaGroups).sort((a, b) => {
      // Grouped notas first
      if (a.isGrouped !== b.isGrouped) return b.isGrouped ? 1 : -1;
      // Then by date
      return new Date(a.tanggalNota) - new Date(b.tanggalNota);
    });

    db.close();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error getting transactions by nota:', error);
    if (db && db.open) db.close();
    return { success: false, error: error.message };
  }
});

ipcMain.handle('arkas:get-dashboard-badges', async (event, year, fundSource) => {
  return await dashboardHandler.getDashboardBadges(getDbPath(), ARKAS_PASSWORD, year, fundSource);
});

// Export BKU to Excel
// IPC: MERGE TRANSACTIONS (UPDATE NO BUKTI)
// IPC: SAFE VIRTUAL MERGE TRANSACTIONS (NO DB UPDATE)
ipcMain.handle('arkas:merge-transactions', async (event, idList, targetNoBukti) => {
  try {
    if (!idList || idList.length === 0)
      return { success: false, error: 'No transactions selected' };

    const localConfig = loadLocalConfig();
    const mergedTransactions = localConfig.mergedTransactions || {};

    // Apply overrides
    idList.forEach((id) => {
      mergedTransactions[id] = targetNoBukti;
    });

    // Save back to config
    saveLocalConfig({ mergedTransactions });

    return {
      success: true,
      updatedCount: idList.length,
      message: 'Virtual merge successful (Config saved)',
    };
  } catch (error) {
    console.error('Merge Transactions Error:', error);
    return { success: false, error: error.message };
  }
});

// BA Rekonsiliasi - Get reconciliation data for a year
ipcMain.handle('arkas:get-reconciliation-data', async (event, year) => {
  let db;
  try {
    db = new Database(getDbPath(), { readonly: true });
    db.pragma("cipher='sqlcipher'");
    db.pragma('legacy=4');
    db.pragma(`key='${ARKAS_PASSWORD}'`);

    const data = reconciliationHandler.getReconciliationData(db, year);

    // === Merge Manual Tax Entries to Reconciliation Data ===
    const manualTaxes = manualTaxHandler.getManualTaxesByYear(year);

    if (manualTaxes.length > 0) {
      // Helper function to get month index (0-11) from date string
      const getMonthIndex = (dateStr) => {
        if (!dateStr) return 0;
        const month = parseInt(dateStr.substring(5, 7), 10);
        return month - 1;
      };

      // Calculate per-month manual pungut & setor
      const manualPungutByMonth = {};
      const manualSetorByMonth = {};
      for (let m = 0; m < 12; m++) {
        manualPungutByMonth[m] = 0;
        manualSetorByMonth[m] = 0;
      }

      manualTaxes.forEach((tax) => {
        const amount = tax.nominal || 0;
        const monthIndex = getMonthIndex(tax.tanggal);

        if (tax.jenis_input === 'saldo_awal_tahun' || tax.jenis_input === 'saldo_awal') {
          // Saldo awal adds to January pungut
          if (tax.position === 'pungutan') {
            manualPungutByMonth[0] += amount;
          }
        } else if (tax.jenis_input === 'hutang_bulan') {
          manualPungutByMonth[monthIndex] += amount;
        } else {
          if (tax.position === 'pungutan') {
            manualPungutByMonth[monthIndex] += amount;
          } else {
            manualSetorByMonth[monthIndex] += amount;
          }
        }
      });

      // Apply manual tax to monthly rows (data.monthly is array of 12 months)
      // Also calculate running pajak hutang balance
      let pajakHutangBalance = 0; // Running balance starts at 0

      // Add saldo awal tahun to initial balance
      for (let m = 0; m < 12; m++) {
        if (m === 0) {
          // January gets the saldo_awal_tahun entries
          manualTaxes.forEach((tax) => {
            if (
              (tax.jenis_input === 'saldo_awal_tahun' || tax.jenis_input === 'saldo_awal') &&
              tax.position === 'pungutan'
            ) {
              pajakHutangBalance += tax.nominal || 0;
            }
          });
        }
      }

      // Reset and recalculate with running balance
      let runningPajakHutang = 0;
      // Add saldo awal tahun to initial balance
      manualTaxes.forEach((tax) => {
        if (
          (tax.jenis_input === 'saldo_awal_tahun' || tax.jenis_input === 'saldo_awal') &&
          tax.position === 'pungutan'
        ) {
          runningPajakHutang += tax.nominal || 0;
        }
      });

      if (data.monthly && Array.isArray(data.monthly)) {
        for (let m = 0; m < data.monthly.length; m++) {
          const row = data.monthly[m];

          // Store opening pajak hutang balance for this month
          row.pajakHutang = row.pajakHutang || {};
          row.pajakHutang.opening = runningPajakHutang;

          // Add manual pungut and setor to income/expenses
          if (row.income) {
            row.income.pajakPungut = (row.income.pajakPungut || 0) + manualPungutByMonth[m];
            row.income.total = (row.income.total || 0) + manualPungutByMonth[m];
          }
          if (row.expenses) {
            row.expenses.pajakSetor = (row.expenses.pajakSetor || 0) + manualSetorByMonth[m];
            row.expenses.total = (row.expenses.total || 0) + manualSetorByMonth[m];
          }

          // Calculate closing hutang: opening + pungut - setor
          const monthPungut = row.income?.pajakPungut || 0;
          const monthSetor = row.expenses?.pajakSetor || 0;
          runningPajakHutang = runningPajakHutang + monthPungut - monthSetor;
          row.pajakHutang.closing = runningPajakHutang;
        }
      }

      // Recalculate quarterly summaries (data.quarterly is array of 4 quarters)
      if (data.quarterly && Array.isArray(data.quarterly)) {
        const quarterMonthRanges = [
          [0, 1, 2],
          [3, 4, 5],
          [6, 7, 8],
          [9, 10, 11],
        ];
        for (let q = 0; q < data.quarterly.length; q++) {
          const row = data.quarterly[q];
          const months = quarterMonthRanges[q] || [];
          let sumPungut = 0,
            sumSetor = 0;
          for (const mIdx of months) {
            sumPungut += manualPungutByMonth[mIdx] || 0;
            sumSetor += manualSetorByMonth[mIdx] || 0;
          }
          if (row.income) {
            row.income.pajakPungut = (row.income.pajakPungut || 0) + sumPungut;
            row.income.total = (row.income.total || 0) + sumPungut;
          }
          if (row.expenses) {
            row.expenses.pajakSetor = (row.expenses.pajakSetor || 0) + sumSetor;
            row.expenses.total = (row.expenses.total || 0) + sumSetor;
          }
          // Add pajakHutang for quarterly (opening from first month, closing from last month)
          const firstMonth = months[0];
          const lastMonth = months[months.length - 1];
          row.pajakHutang = {
            opening: data.monthly?.[firstMonth]?.pajakHutang?.opening || 0,
            closing: data.monthly?.[lastMonth]?.pajakHutang?.closing || 0,
          };
        }
      }

      // Recalculate semester summaries (data.semester is array of 2 semesters)
      if (data.semester && Array.isArray(data.semester)) {
        const semesterMonthRanges = [
          [0, 1, 2, 3, 4, 5],
          [6, 7, 8, 9, 10, 11],
        ];
        for (let s = 0; s < data.semester.length; s++) {
          const row = data.semester[s];
          const months = semesterMonthRanges[s] || [];
          let sumPungut = 0,
            sumSetor = 0;
          for (const mIdx of months) {
            sumPungut += manualPungutByMonth[mIdx] || 0;
            sumSetor += manualSetorByMonth[mIdx] || 0;
          }
          if (row.income) {
            row.income.pajakPungut = (row.income.pajakPungut || 0) + sumPungut;
            row.income.total = (row.income.total || 0) + sumPungut;
          }
          if (row.expenses) {
            row.expenses.pajakSetor = (row.expenses.pajakSetor || 0) + sumSetor;
            row.expenses.total = (row.expenses.total || 0) + sumSetor;
          }
          // Add pajakHutang for semester
          const firstMonth = months[0];
          const lastMonth = months[months.length - 1];
          row.pajakHutang = {
            opening: data.monthly?.[firstMonth]?.pajakHutang?.opening || 0,
            closing: data.monthly?.[lastMonth]?.pajakHutang?.closing || 0,
          };
        }
      }

      // Recalculate annual summary (data.annual is single object)
      if (data.annual) {
        let sumPungut = 0,
          sumSetor = 0;
        for (let m = 0; m < 12; m++) {
          sumPungut += manualPungutByMonth[m] || 0;
          sumSetor += manualSetorByMonth[m] || 0;
        }
        if (data.annual.income) {
          data.annual.income.pajakPungut = (data.annual.income.pajakPungut || 0) + sumPungut;
          data.annual.income.total = (data.annual.income.total || 0) + sumPungut;
        }
        if (data.annual.expenses) {
          data.annual.expenses.pajakSetor = (data.annual.expenses.pajakSetor || 0) + sumSetor;
          data.annual.expenses.total = (data.annual.expenses.total || 0) + sumSetor;
        }
        // Add pajakHutang for annual (opening from Jan, closing from Dec)
        data.annual.pajakHutang = {
          opening: data.monthly?.[0]?.pajakHutang?.opening || 0,
          closing: data.monthly?.[11]?.pajakHutang?.closing || 0,
        };
      }
    }

    db.close();
    return { success: true, data };
  } catch (error) {
    console.error('Reconciliation Error:', error);
    if (db && db.open) db.close();
    return { success: false, error: error.message };
  }
});

// BA Rekonsiliasi - Get available fund sources for a year
ipcMain.handle('arkas:get-reconciliation-fund-sources', async (event, year) => {
  let db;
  try {
    db = new Database(getDbPath(), { readonly: true });
    db.pragma("cipher='sqlcipher'");
    db.pragma('legacy=4');
    db.pragma(`key='${ARKAS_PASSWORD}'`);

    const sources = reconciliationHandler.getAvailableFundSources(db, year);

    db.close();
    return { success: true, data: sources };
  } catch (error) {
    console.error('Get Fund Sources Error:', error);
    if (db && db.open) db.close();
    return { success: false, error: error.message };
  }
});

// BA Rekonsiliasi - Get detailed data for a specific fund source
ipcMain.handle('arkas:get-fund-source-detail', async (event, year, fundSourceId) => {
  let db;
  try {
    db = new Database(getDbPath(), { readonly: true });
    db.pragma("cipher='sqlcipher'");
    db.pragma('legacy=4');
    db.pragma(`key='${ARKAS_PASSWORD}'`);

    const data = reconciliationHandler.getFundSourceDetail(db, year, fundSourceId);

    db.close();
    return { success: true, data };
  } catch (error) {
    console.error('Get Fund Detail Error:', error);
    if (db && db.open) db.close();
    return { success: false, error: error.message };
  }
});

// BA Rekonsiliasi - Get Bunga Detail
ipcMain.handle('arkas:get-bunga-detail', async (event, year) => {
  let db;
  try {
    db = new Database(getDbPath(), { readonly: true });
    db.pragma("cipher='sqlcipher'");
    db.pragma('legacy=4');
    db.pragma(`key='${ARKAS_PASSWORD}'`);

    // Get bunga detail data
    const data = reconciliationHandler.getBungaDetail(db, year);

    db.close();
    return { success: true, data };
  } catch (error) {
    if (db && db.open) db.close();
    return { success: false, error: error.message };
  }
});

// BA Rekonsiliasi - Get Pajak Detail
ipcMain.handle('arkas:get-pajak-detail', async (event, year) => {
  let db;
  try {
    db = new Database(getDbPath(), { readonly: true });
    db.pragma("cipher='sqlcipher'");
    db.pragma('legacy=4');
    db.pragma(`key='${ARKAS_PASSWORD}'`);

    const data = reconciliationHandler.getPajakDetail(db, year);

    // === Merge Manual Tax Entries ===
    const manualTaxes = manualTaxHandler.getManualTaxesByYear(year);

    if (manualTaxes.length > 0) {
      // Helper function to get month index (0-11) from date string
      const getMonthIndex = (dateStr) => {
        if (!dateStr) return 0;
        const month = parseInt(dateStr.substring(5, 7), 10);
        return month - 1; // Convert to 0-indexed
      };

      // Helper function to map jenis_pajak to key
      const getKey = (jenisPajak) => {
        if (jenisPajak === 'PPh 21') return 'pph21';
        if (jenisPajak === 'PPh 22') return 'pph22';
        if (jenisPajak === 'PPh 23') return 'pph23';
        if (jenisPajak === 'PPh 4(2)') return 'pph23'; // Group with pph23
        if (jenisPajak === 'Pajak Daerah') return 'pajakDaerah';
        return 'ppn';
      };

      // Calculate manual tax totals for summary
      let manualSaldoAwal = { ppn: 0, pph21: 0, pph22: 0, pph23: 0, pajakDaerah: 0 };
      let manualPungutByMonth = {}; // { monthIndex: { ppn: 0, pph21: 0, ... } }
      let manualSetorByMonth = {}; // { monthIndex: { ppn: 0, pph21: 0, ... } }

      // Initialize per-month storage
      for (let m = 0; m < 12; m++) {
        manualPungutByMonth[m] = { ppn: 0, pph21: 0, pph22: 0, pph23: 0, pajakDaerah: 0 };
        manualSetorByMonth[m] = { ppn: 0, pph21: 0, pph22: 0, pph23: 0, pajakDaerah: 0 };
      }

      manualTaxes.forEach((tax) => {
        const amount = tax.nominal || 0;
        const key = getKey(tax.jenis_pajak);
        const monthIndex = getMonthIndex(tax.tanggal);

        // Handle different jenis_input types
        if (tax.jenis_input === 'saldo_awal_tahun' || tax.jenis_input === 'saldo_awal') {
          // Saldo awal adds to opening balance (always positive for pungutan)
          if (tax.position === 'pungutan') {
            manualSaldoAwal[key] += amount;
          } else {
            manualSaldoAwal[key] -= amount;
          }
        } else if (tax.jenis_input === 'hutang_bulan') {
          // Hutang bulan is treated as pungutan for that specific month
          manualPungutByMonth[monthIndex][key] += amount;
        } else {
          // Regular transaction (transaksi)
          if (tax.position === 'pungutan') {
            manualPungutByMonth[monthIndex][key] += amount;
          } else {
            manualSetorByMonth[monthIndex][key] += amount;
          }
        }
      });

      // Add manual data to each monthly row
      let monthRowIndex = 0;
      for (let i = 0; i < data.rows.length; i++) {
        const row = data.rows[i];
        if (!row.isSummary && row.values) {
          const m = monthRowIndex; // 0-11 for Jan-Dec

          // Add manual pungut to this month
          row.values.pungut.ppn += manualPungutByMonth[m].ppn;
          row.values.pungut.pph21 += manualPungutByMonth[m].pph21;
          row.values.pungut.pph22 += manualPungutByMonth[m].pph22;
          row.values.pungut.pph23 += manualPungutByMonth[m].pph23;
          row.values.pungut.pajakDaerah += manualPungutByMonth[m].pajakDaerah;

          // Add manual setor to this month
          row.values.setor.ppn += manualSetorByMonth[m].ppn;
          row.values.setor.pph21 += manualSetorByMonth[m].pph21;
          row.values.setor.pph22 += manualSetorByMonth[m].pph22;
          row.values.setor.pph23 += manualSetorByMonth[m].pph23;
          row.values.setor.pajakDaerah += manualSetorByMonth[m].pajakDaerah;

          // Recalculate totals
          row.values.totalPungut = Object.values(row.values.pungut).reduce((a, b) => a + b, 0);
          row.values.totalSetor = Object.values(row.values.setor).reduce((a, b) => a + b, 0);

          monthRowIndex++;
        }
      }

      // Calculate total manual pungut and setor for summary
      const totalManualPungut = { ppn: 0, pph21: 0, pph22: 0, pph23: 0, pajakDaerah: 0 };
      const totalManualSetor = { ppn: 0, pph21: 0, pph22: 0, pph23: 0, pajakDaerah: 0 };
      for (let m = 0; m < 12; m++) {
        for (const k of Object.keys(totalManualPungut)) {
          totalManualPungut[k] += manualPungutByMonth[m][k];
          totalManualSetor[k] += manualSetorByMonth[m][k];
        }
      }

      // Add manual data to response
      data.manualTaxes = {
        count: manualTaxes.length,
        saldoAwal: manualSaldoAwal,
        pungut: totalManualPungut,
        setor: totalManualSetor,
        totalSaldoAwal: Object.values(manualSaldoAwal).reduce((a, b) => a + b, 0),
        totalPungut: Object.values(totalManualPungut).reduce((a, b) => a + b, 0),
        totalSetor: Object.values(totalManualSetor).reduce((a, b) => a + b, 0),
      };

      // Recalculate running balances with manual saldo_awal
      const totalSaldoAwal = data.manualTaxes.totalSaldoAwal;
      let runningBalance = totalSaldoAwal;

      // First pass: update monthly rows
      const monthRows = [];
      for (let i = 0; i < data.rows.length; i++) {
        const row = data.rows[i];
        if (!row.isSummary && row.values) {
          // Set opening balance for this month to current running balance
          row.values.saldoAwal = runningBalance;
          // Calculate closing balance: opening + pungut - setor
          runningBalance = row.values.saldoAwal + row.values.totalPungut - row.values.totalSetor;
          row.values.saldoAkhir = runningBalance;
          monthRows.push(row);
        }
      }

      // Second pass: update summary rows
      for (let i = 0; i < data.rows.length; i++) {
        const row = data.rows[i];
        if (row.isSummary && row.values) {
          // Recalculate pungut totals for summary
          let sumPungut = { ppn: 0, pph21: 0, pph22: 0, pph23: 0, pajakDaerah: 0 };
          let sumSetor = { ppn: 0, pph21: 0, pph22: 0, pph23: 0, pajakDaerah: 0 };
          let startIdx = 0,
            endIdx = 0;

          if (row.label && row.label.includes('TRIWULAN 1')) {
            startIdx = 0;
            endIdx = 2;
          } else if (row.label && row.label.includes('TRIWULAN 2')) {
            startIdx = 3;
            endIdx = 5;
          } else if (row.label && row.label.includes('TRIWULAN 3')) {
            startIdx = 6;
            endIdx = 8;
          } else if (row.label && row.label.includes('TRIWULAN 4')) {
            startIdx = 9;
            endIdx = 11;
          } else if (row.label && row.label.includes('SEMESTER 1')) {
            startIdx = 0;
            endIdx = 5;
          } else if (row.label && row.label.includes('SEMESTER 2')) {
            startIdx = 6;
            endIdx = 11;
          } else if (row.label && row.label.includes('JUMLAH')) {
            startIdx = 0;
            endIdx = 11;
          }

          // Sum up values from monthly rows
          for (let j = startIdx; j <= endIdx && j < monthRows.length; j++) {
            const mr = monthRows[j];
            if (mr && mr.values) {
              sumPungut.ppn += mr.values.pungut.ppn;
              sumPungut.pph21 += mr.values.pungut.pph21;
              sumPungut.pph22 += mr.values.pungut.pph22;
              sumPungut.pph23 += mr.values.pungut.pph23;
              sumPungut.pajakDaerah += mr.values.pungut.pajakDaerah;
              sumSetor.ppn += mr.values.setor.ppn;
              sumSetor.pph21 += mr.values.setor.pph21;
              sumSetor.pph22 += mr.values.setor.pph22;
              sumSetor.pph23 += mr.values.setor.pph23;
              sumSetor.pajakDaerah += mr.values.setor.pajakDaerah;
            }
          }

          row.values.pungut = sumPungut;
          row.values.setor = sumSetor;
          row.values.totalPungut = Object.values(sumPungut).reduce((a, b) => a + b, 0);
          row.values.totalSetor = Object.values(sumSetor).reduce((a, b) => a + b, 0);
          row.values.saldoAwal = monthRows[startIdx]?.values?.saldoAwal || 0;
          row.values.saldoAkhir = monthRows[endIdx]?.values?.saldoAkhir || 0;
        }
      }
    }

    db.close();
    return { success: true, data };
  } catch (error) {
    if (db && db.open) db.close();
    return { success: false, error: error.message };
  }
});

// BA Rekonsiliasi - Save Signatory Data
ipcMain.handle('arkas:save-signatory-data', async (event, data) => {
  try {
    const result = reconciliationHandler.saveSignatoryData(getDbPath(), data);
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Bank Reconciliation
ipcMain.handle('arkas:get-bank-reconciliation', async (event, year) => {
  let db;
  try {
    db = new Database(getDbPath(), { readonly: true });
    db.pragma("cipher='sqlcipher'");
    db.pragma('legacy=4');
    db.pragma(`key='${ARKAS_PASSWORD}'`);

    const data = bankReconciliationHandler.getBankReconciliationData(db, year);

    db.close();
    return { success: true, data };
  } catch (error) {
    if (db && db.open) db.close();
    return { success: false, error: error.message };
  }
});

ipcMain.handle('arkas:save-bank-reconciliation', async (event, year, values) => {
  try {
    bankReconciliationHandler.saveBankStatementValues(year, values);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Register Kas - Save/Load denomination data
ipcMain.handle('arkas:get-register-kas', async (event, year, month, fundSource) => {
  try {
    return registerKasHandler.getRegisterKasData(year, month, fundSource);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('arkas:save-register-kas', async (event, year, month, fundSource, denominations) => {
  try {
    return registerKasHandler.saveRegisterKasData(year, month, fundSource, denominations);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// BA Rekonsiliasi - Get Signatory Data
ipcMain.handle('arkas:get-signatory-data', async (event) => {
  try {
    const result = reconciliationHandler.getSignatoryData(getDbPath());
    return result;
  } catch (error) {
    return { success: false, error: error.message, data: {} };
  }
});

// BA Rekonsiliasi - Get Audit Data for cross-check
ipcMain.handle('arkas:get-ba-audit-data', async (event, year) => {
  try {
    if (!fs.existsSync(getDbPath())) {
      return { success: false, error: 'Database ARKAS tidak ditemukan.' };
    }
    const db = new Database(getDbPath(), { readonly: true });
    db.pragma("cipher='sqlcipher'");
    db.pragma('legacy=4');
    db.pragma(`key='${ARKAS_PASSWORD}'`);
    const data = reconciliationHandler.getBaAuditData(db, year);
    db.close();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// SPTJM - Get SPTJM Data for a specific semester and fund type
ipcMain.handle('arkas:get-sptjm-data', async (event, year, semester, fundType) => {
  try {
    if (!fs.existsSync(getDbPath())) {
      return { success: false, message: 'Database ARKAS tidak ditemukan.' };
    }
    const db = new Database(getDbPath(), { readonly: true });
    db.pragma("cipher='sqlcipher'");
    db.pragma('legacy=4');
    db.pragma(`key='${ARKAS_PASSWORD}'`);

    const yearStr = year.toString();

    // Determine semester months
    const startMonth = semester === 1 ? '01' : '07';
    const endMonth = semester === 1 ? '06' : '12';

    // Fund source IDs - dynamic lookup from database
    const fundKeyword = fundType === 'reguler' ? '%Reguler%' : '%Kinerja%';
    const sourceRows = db
      .prepare(
        `
        SELECT id_ref_sumber_dana FROM ref_sumber_dana WHERE nama_sumber_dana LIKE ?
    `
      )
      .all(fundKeyword);
    const sourceIds = sourceRows.map((r) => r.id_ref_sumber_dana);
    if (sourceIds.length === 0) {
      db.close();
      return { success: false, message: 'Sumber dana tidak ditemukan: ' + fundType };
    }
    const sourceIdStr = sourceIds.join(',');

    // Get Saldo Awal (Opening Balance for the semester)
    const openingMonth = semester === 1 ? '01' : '07';
    const saldoAwal = db
      .prepare(
        `
            SELECT 
                SUM(CASE WHEN k.id_ref_bku = 8 THEN k.saldo ELSE 0 END) as bank,
                SUM(CASE WHEN k.id_ref_bku = 9 THEN k.saldo ELSE 0 END) as tunai
            FROM kas_umum k
            LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
            WHERE strftime('%Y', k.tanggal_transaksi) = ?
              AND strftime('%m', k.tanggal_transaksi) = ?
              AND k.soft_delete = 0
              AND k.id_ref_bku IN (8, 9)
              AND a.id_ref_sumber_dana IN (${sourceIdStr})
        `
      )
      .get(yearStr, openingMonth);

    // Get Penerimaan (Income during semester)
    const penerimaan = db
      .prepare(
        `
            SELECT 
                SUM(CASE WHEN k.uraian LIKE '%Tahap 1%' OR k.uraian LIKE '%Tahap I%' THEN k.saldo ELSE 0 END) as tahap1,
                SUM(CASE WHEN k.uraian LIKE '%Tahap 2%' OR k.uraian LIKE '%Tahap II%' THEN k.saldo ELSE 0 END) as tahap2,
                SUM(k.saldo) as total
            FROM kas_umum k
            LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
            WHERE strftime('%Y', k.tanggal_transaksi) = ?
              AND strftime('%m', k.tanggal_transaksi) BETWEEN ? AND ?
              AND k.soft_delete = 0
              AND k.id_ref_bku = 2
              AND k.uraian LIKE '%Tahap%'
              AND a.id_ref_sumber_dana IN (${sourceIdStr})
        `
      )
      .get(yearStr, startMonth, endMonth);

    // Get Pengeluaran (Expenses during semester)
    const pengeluaran = db
      .prepare(
        `
            SELECT 
                SUM(CASE WHEN k.kode_rekening LIKE '5.1.%' THEN k.saldo ELSE 0 END) as operasi,
                SUM(CASE WHEN k.kode_rekening LIKE '5.2.%' THEN k.saldo ELSE 0 END) as modal,
                SUM(k.saldo) as total
            FROM kas_umum k
            LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
            WHERE strftime('%Y', k.tanggal_transaksi) = ?
              AND strftime('%m', k.tanggal_transaksi) BETWEEN ? AND ?
              AND k.soft_delete = 0
              AND k.kode_rekening LIKE '5.%'
              AND k.id_ref_bku NOT IN (0, 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 19, 24, 25, 26, 28, 33)
              AND a.id_ref_sumber_dana IN (${sourceIdStr})
        `
      )
      .get(yearStr, startMonth, endMonth);

    // Get Sisa Dana (Closing Balance for the semester)
    const closingMonth = semester === 1 ? '07' : '01';
    const closingYear = semester === 1 ? year : year + 1;
    const sisaDana = db
      .prepare(
        `
            SELECT 
                SUM(CASE WHEN k.id_ref_bku = 8 THEN k.saldo ELSE 0 END) as bank,
                SUM(CASE WHEN k.id_ref_bku = 9 THEN k.saldo ELSE 0 END) as tunai
            FROM kas_umum k
            LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
            WHERE strftime('%Y', k.tanggal_transaksi) = ?
              AND strftime('%m', k.tanggal_transaksi) = ?
              AND k.soft_delete = 0
              AND k.id_ref_bku IN (8, 9)
              AND a.id_ref_sumber_dana IN (${sourceIdStr})
        `
      )
      .get(closingYear.toString(), closingMonth);

    // Calculate sisa from formula if closing balance not found
    const saldoAwalTotal = (saldoAwal?.bank || 0) + (saldoAwal?.tunai || 0);
    const totalPenerimaan = penerimaan?.total || 0;
    const totalPengeluaran = pengeluaran?.total || 0;
    const calculatedSisa = saldoAwalTotal + totalPenerimaan - totalPengeluaran;

    db.close();

    return {
      success: true,
      data: {
        saldoAwal: saldoAwalTotal,
        penerimaanTahap1: penerimaan?.tahap1 || 0,
        penerimaanTahap2: penerimaan?.tahap2 || 0,
        totalPenerimaan: totalPenerimaan,
        belanjaOperasi: pengeluaran?.operasi || 0,
        belanjaModal: pengeluaran?.modal || 0,
        totalPengeluaran: totalPengeluaran,
        sisaDana: calculatedSisa,
        sisaBank: sisaDana?.bank || calculatedSisa,
        sisaTunai: sisaDana?.tunai || 0,
      },
    };
  } catch (error) {
    console.error('SPTJM Error:', error);
    return { success: false, message: error.message };
  }
});

// K7 Report - Get K7 Data for rekapitulasi penggunaan dana
ipcMain.handle(
  'arkas:get-k7-data',
  async (event, year, periodType, activeTahap, activeMonth, fundType) => {
    try {
      if (!fs.existsSync(getDbPath())) {
        return { success: false, message: 'Database ARKAS tidak ditemukan.' };
      }
      const db = new Database(getDbPath(), { readonly: true });
      db.pragma("cipher='sqlcipher'");
      db.pragma('legacy=4');
      db.pragma(`key='${ARKAS_PASSWORD}'`);

      const yearStr = year.toString();
      let startMonth, endMonth, openingMonth;

      // Determine period months
      if (periodType === 'bulan') {
        startMonth = activeMonth;
        endMonth = activeMonth;
        openingMonth = activeMonth;
      } else if (periodType === 'tahunan') {
        startMonth = '01';
        endMonth = '12';
        openingMonth = '01';
      } else {
        // Default: tahap
        const tahap = parseInt(activeTahap || '1');
        startMonth = tahap === 1 ? '01' : '07';
        endMonth = tahap === 1 ? '06' : '12';
        openingMonth = tahap === 1 ? '01' : '07';
      }

      // Fund source IDs - dynamic lookup from database
      const fundKeyword = fundType === 'reguler' ? '%Reguler%' : '%Kinerja%';
      const sourceRows = db
        .prepare(
          `
          SELECT id_ref_sumber_dana FROM ref_sumber_dana WHERE nama_sumber_dana LIKE ?
      `
        )
        .all(fundKeyword);
      const sourceIds = sourceRows.map((r) => r.id_ref_sumber_dana);
      if (sourceIds.length === 0) {
        db.close();
        return { success: false, message: 'Sumber dana tidak ditemukan: ' + fundType };
      }
      const sourceIdStr = sourceIds.join(',');

      // TWO-PASS APPROACH to avoid JOIN duplicates:
      // Pass 1: Get expenditure data with correct filter (no rapbs JOIN to avoid duplicates)
      const expenditures = db
        .prepare(
          `
            SELECT 
                k.id_kas_umum,
                k.kode_rekening,
                k.saldo,
                k.id_rapbs_periode
            FROM kas_umum k
            LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
            WHERE strftime('%Y', k.tanggal_transaksi) = ?
              AND strftime('%m', k.tanggal_transaksi) BETWEEN ? AND ?
              AND k.soft_delete = 0
              AND k.kode_rekening LIKE '5.%'
              AND k.id_ref_bku NOT IN (0, 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 19, 24, 25, 26, 28, 33)
              AND a.id_ref_sumber_dana IN (${sourceIdStr})
        `
        )
        .all(yearStr, startMonth, endMonth);

      // Pass 2: Build ref_kode lookup map for each id_rapbs_periode
      const refKodeLookup = {};
      const uniqueRapbsPeriodeIds = [
        ...new Set(expenditures.map((e) => e.id_rapbs_periode).filter(Boolean)),
      ];
      if (uniqueRapbsPeriodeIds.length > 0) {
        const placeholders = uniqueRapbsPeriodeIds.map(() => '?').join(',');
        const refKodeQuery = db
          .prepare(
            `
                SELECT DISTINCT rp.id_rapbs_periode, rk.id_kode
                FROM rapbs_periode rp
                LEFT JOIN rapbs r ON rp.id_rapbs = r.id_rapbs
                LEFT JOIN ref_kode rk ON r.id_ref_kode = rk.id_ref_kode
                WHERE rp.id_rapbs_periode IN (${placeholders})
            `
          )
          .all(...uniqueRapbsPeriodeIds);
        refKodeQuery.forEach((row) => {
          if (!refKodeLookup[row.id_rapbs_periode]) {
            refKodeLookup[row.id_rapbs_periode] = row.id_kode;
          }
        });
      }

      const byStandar = {};
      const bySubProgram = {};
      let totalPengeluaran = 0;

      // Initialize
      for (let i = 1; i <= 7; i++) byStandar[i] = {};
      for (let i = 1; i <= 12; i++) bySubProgram[i] = 0;

      const getSubProgramFromRefKode = (idKode) => {
        if (!idKode) return { standar: 5, subProgram: 5 }; // Default: Administrasi

        const parts = idKode.split('.');
        const level1 = parts[0] || '';
        const level2 = parts.slice(0, 2).join('.');

        // Level 1 mapping
        switch (level1) {
          case '02': // Perpustakaan
            return { standar: 4, subProgram: 2 };
          case '07': // Honor
            return { standar: 3, subProgram: 12 };
        }

        // Level 2 mapping
        if (level2.startsWith('03.01') || level2.startsWith('06.01')) {
          return { standar: 2, subProgram: 1 }; // PPDB
        }
        if (level2.startsWith('03.03') || level2.startsWith('03.05')) {
          return { standar: 2, subProgram: 3 }; // Pembelajaran
        }
        if (
          level2.startsWith('03.06') ||
          level2.startsWith('04.06') ||
          level2.startsWith('08.06')
        ) {
          return { standar: 5, subProgram: 6 }; // Profesi
        }
        if (level2.startsWith('05.02')) {
          return { standar: 4, subProgram: 2 }; // Perpustakaan
        }
        if (level2.startsWith('05.05') || level2.startsWith('05.08')) {
          return { standar: 4, subProgram: 8 }; // Pemeliharaan Sarana
        }
        if (level2.startsWith('05.09')) {
          return { standar: 4, subProgram: 9 }; // Multimedia
        }
        if (level2.startsWith('06.03') || level2.startsWith('06.05')) {
          return { standar: 5, subProgram: 5 }; // Administrasi
        }
        if (level2.startsWith('06.07')) {
          return { standar: 4, subProgram: 7 }; // Langganan Daya & Jasa
        }
        if (level2.startsWith('08.04')) {
          return { standar: 7, subProgram: 4 }; // Asesmen
        }

        // Default fallback
        return { standar: 5, subProgram: 5 }; // Administrasi
      };

      // Process expenditures with dynamic mapping using lookup
      expenditures.forEach((exp) => {
        const val = exp.saldo || 0;
        totalPengeluaran += val;

        // Get ref_kode from lookup map
        const refIdKode = refKodeLookup[exp.id_rapbs_periode] || null;
        const { standar: standarId, subProgram: subProgramId } =
          getSubProgramFromRefKode(refIdKode);

        // Aggregate by Standar and SubProgram
        if (!byStandar[standarId]) byStandar[standarId] = {};
        if (!byStandar[standarId][subProgramId]) byStandar[standarId][subProgramId] = 0;
        byStandar[standarId][subProgramId] += val;
        bySubProgram[subProgramId] = (bySubProgram[subProgramId] || 0) + val;
      });

      // Saldo Awal: for tahap/bulan modes, calculate cumulative opening balance
      // For tahap 1 (Jan-Jun), openingMonth is Jan. For tahap 2 (Jul-Dec), openingMonth is Jul.
      // The "saldo awal" in K7 context = actual opening balance (id_ref_bku 8/9) in openingMonth
      const saldoAwal = db
        .prepare(
          `
            SELECT SUM(k.saldo) as total
            FROM kas_umum k
            LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
            WHERE strftime('%Y', k.tanggal_transaksi) = ?
              AND strftime('%m', k.tanggal_transaksi) = ?
              AND k.soft_delete = 0
              AND k.id_ref_bku IN (8, 9)
              AND a.id_ref_sumber_dana IN (${sourceIdStr})
        `
        )
        .get(yearStr, openingMonth);

      // For tahap 2, also accumulate saldo awal from tahap 1 + penerimaan tahap 1 - pengeluaran tahap 1
      let saldoAwalTotal = saldoAwal?.total || 0;
      if (periodType === 'tahap' && parseInt(activeTahap || '1') === 2) {
        // Saldo awal tahap 2 = saldo awal tahap 1 + penerimaan tahap 1 - pengeluaran tahap 1
        const saldoAwalTahap1 = db
          .prepare(
            `
            SELECT SUM(k.saldo) as total
            FROM kas_umum k
            LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
            WHERE strftime('%Y', k.tanggal_transaksi) = ?
              AND strftime('%m', k.tanggal_transaksi) = '01'
              AND k.soft_delete = 0
              AND k.id_ref_bku IN (8, 9)
              AND a.id_ref_sumber_dana IN (${sourceIdStr})
        `
          )
          .get(yearStr);

        const tahap1Penerimaan = db
          .prepare(
            `
                SELECT SUM(k.saldo) as total
                FROM kas_umum k
                LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
                WHERE strftime('%Y', k.tanggal_transaksi) = ?
                  AND strftime('%m', k.tanggal_transaksi) BETWEEN '01' AND '06'
                  AND k.soft_delete = 0
                  AND k.id_ref_bku = 2
                  AND a.id_ref_sumber_dana IN (${sourceIdStr})
            `
          )
          .get(yearStr);

        const tahap1Pengeluaran = db
          .prepare(
            `
                SELECT SUM(k.saldo) as total
                FROM kas_umum k
                LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
                WHERE strftime('%Y', k.tanggal_transaksi) = ?
                  AND strftime('%m', k.tanggal_transaksi) BETWEEN '01' AND '06'
                  AND k.soft_delete = 0
                  AND k.kode_rekening LIKE '5.%'
                  AND k.id_ref_bku NOT IN (0, 1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 19, 24, 25, 26, 28, 33)
                  AND a.id_ref_sumber_dana IN (${sourceIdStr})
            `
          )
          .get(yearStr);

        saldoAwalTotal =
          (saldoAwalTahap1?.total || 0) +
          (tahap1Penerimaan?.total || 0) -
          (tahap1Pengeluaran?.total || 0);
      }

      // Get Penerimaan - remove restrictive '%Tahap%' filter to capture all receipts
      const penerimaan = db
        .prepare(
          `
            SELECT SUM(k.saldo) as total
            FROM kas_umum k
            LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
            WHERE strftime('%Y', k.tanggal_transaksi) = ?
              AND strftime('%m', k.tanggal_transaksi) BETWEEN ? AND ?
              AND k.soft_delete = 0
              AND k.id_ref_bku = 2
              AND a.id_ref_sumber_dana IN (${sourceIdStr})
        `
        )
        .get(yearStr, startMonth, endMonth);

      const totalPenerimaan = penerimaan?.total || 0;
      const sisaDana = saldoAwalTotal + totalPenerimaan - totalPengeluaran;

      db.close();

      return {
        success: true,
        data: {
          byStandar,
          bySubProgram,
          saldoAwal: saldoAwalTotal,
          totalPenerimaan,
          totalPengeluaran,
          sisaDana,
        },
      };
    } catch (error) {
      console.error('K7 Error:', error);
      return { success: false, message: error.message };
    }
  }
);

// ==================== Manual Tax Handlers ====================

ipcMain.handle('arkas:get-manual-taxes', async (event, year) => {
  try {
    const taxes = year
      ? manualTaxHandler.getManualTaxesByYear(year)
      : manualTaxHandler.getManualTaxes();
    return { success: true, data: taxes };
  } catch (err) {
    console.error('Error getting manual taxes:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('arkas:save-manual-tax', async (event, entry) => {
  try {
    const saved = manualTaxHandler.saveManualTax(entry);
    return { success: true, data: saved };
  } catch (err) {
    console.error('Error saving manual tax:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('arkas:update-manual-tax', async (event, { id, updates }) => {
  try {
    const updated = manualTaxHandler.updateManualTax(id, updates);
    if (!updated) {
      return { success: false, error: 'Entry not found' };
    }
    return { success: true, data: updated };
  } catch (err) {
    console.error('Error updating manual tax:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('arkas:delete-manual-tax', async (event, id) => {
  try {
    const deleted = manualTaxHandler.deleteManualTax(id);
    if (!deleted) {
      return { success: false, error: 'Entry not found' };
    }
    return { success: true };
  } catch (err) {
    console.error('Error deleting manual tax:', err);
    return { success: false, error: err.message };
  }
});

// ==================== Backup & Restore Handlers ====================

ipcMain.handle('arkas:create-backup', async (event, savePath, localStorageData) => {
  try {
    return await backupHandler.createBackup(savePath, localStorageData);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('arkas:create-full-backup', async (event, savePath, localStorageData) => {
  try {
    return await backupHandler.createFullBackup(savePath, localStorageData);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('arkas:get-backup-info', async (event, filePath) => {
  try {
    return await backupHandler.getBackupInfo(filePath);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('arkas:restore-backup', async (event, filePath, currentLocalStorageData) => {
  try {
    return await backupHandler.restoreBackup(filePath, currentLocalStorageData);
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('arkas:show-save-dialog', async (event, options) => {
  const { dialog } = require('electron');
  return dialog.showSaveDialog(mainWindow, options);
});

ipcMain.handle('arkas:show-open-dialog', async (event, options) => {
  const { dialog } = require('electron');
  return dialog.showOpenDialog(mainWindow, options);
});

// IPC: EXPORT ALL BKU REPORTS (Batch Multi-Sheet Excel)
ipcMain.handle('arkas:export-all-bku', async (event, params) => {
  try {
    const db = new Database(getDbPath(), { readonly: true });
    db.pragma("cipher='sqlcipher'");
    db.pragma('legacy=4');
    db.pragma(`key='${ARKAS_PASSWORD}'`);

    const schoolInfo = getSchoolInfoWithOfficials(db);

    // Get dashboard stats for accurate data
    const dashboardResult = await dashboardHandler.getDashboardStats(
      getDbPath(),
      ARKAS_PASSWORD,
      params.year,
      params.fundSource
    );
    const chartData = dashboardResult.data?.chart || [];

    const reportTypes = [
      { type: 'UMUM', label: 'BKU Umum', paymentType: null },
      { type: 'TUNAI', label: 'BKU Tunai', paymentType: 'TUNAI' },
      { type: 'BANK', label: 'BKU Bank', paymentType: 'BANK' },
      { type: 'PAJAK', label: 'BKU Pajak', paymentType: 'PAJAK' },
    ];

    const allData = {};
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    const isPenerimaan = (tx) => {
      const desc = (tx.uraian || '').toLowerCase();
      if (desc.includes('saldo')) return true;
      if (desc.includes('setor tunai')) return true;
      if (desc.includes('pergeseran uang ke bank')) return false;
      if (desc.includes('pergeseran uang di bank')) return true;
      const noBukti = (tx.no_bukti || '').toUpperCase();
      if (noBukti.startsWith('BPU') || noBukti.startsWith('BNU')) return false;
      const expenseIds = [1, 3, 5, 11, 13];
      if (expenseIds.some((id) => id == tx.id_ref_bku)) return false;
      const receiptIds = [2, 4, 10, 12, 14, 26, 28];
      if (receiptIds.some((id) => id == tx.id_ref_bku)) return true;
      if (desc.includes('terima') || desc.includes('penerimaan')) return true;
      if (desc.includes('giro') || desc.includes('bunga bank')) return true;
      if (desc.includes('pengembalian') || desc.includes('pungut')) return true;
      return false;
    };

    for (const report of reportTypes) {
      allData[report.type] = [];
      for (const m of months) {
        const monthStr = m.toString().padStart(2, '0');
        const mParams = {
          year: params.year,
          month: m,
          fundSource: params.fundSource,
          limit: 1000000,
        };
        if (report.paymentType) mParams.paymentType = report.paymentType;

        const { rows } = transactionHandler.getTransactions(db, mParams);

        // Only UMUM gets opening balance; BANK/TUNAI/PAJAK use raw data only
        const isUmum = report.type === 'UMUM';
        let openingBalance = 0;
        if (isUmum && m > 1) {
          const prevMonthStr = (m - 1).toString().padStart(2, '0');
          const prevMonthStats = chartData.find((c) => c.bulan === prevMonthStr);
          openingBalance = prevMonthStats?.saldo_akhir || 0;
        }

        let runningBal = openingBalance;
        const finalTransactions = [];

        // Add opening balance row only for UMUM
        if (isUmum && m > 1 && openingBalance > 0) {
          finalTransactions.push({
            tanggal_transaksi: params.year + '-' + monthStr + '-01',
            no_bukti: '',
            kode_kegiatan: '',
            kode_rekening: '',
            uraian: 'Saldo Bulan Lalu',
            penerimaan: openingBalance,
            pengeluaran: 0,
            saldo_berjalan: openingBalance,
          });
        }

        // For non-UMUM, start running balance from 0
        if (!isUmum) runningBal = 0;

        rows.forEach((tx) => {
          const isDebit = isPenerimaan(tx);
          const nominal = Math.abs(tx.signed_amount || tx.nominal || 0);
          if (isDebit) runningBal += nominal;
          else runningBal -= nominal;

          finalTransactions.push({
            tanggal_transaksi: tx.tanggal_transaksi,
            no_bukti: tx.no_bukti || '',
            kode_kegiatan: tx.activity_code || '',
            kode_rekening: tx.kode_rekening || '',
            uraian: tx.uraian || '',
            penerimaan: isDebit ? nominal : 0,
            pengeluaran: !isDebit ? nominal : 0,
            saldo_berjalan: runningBal,
            nominal: tx.nominal,
            signed_amount: tx.signed_amount,
            id_ref_bku: tx.id_ref_bku,
            is_ppn: tx.is_ppn,
            is_pph_21: tx.is_pph_21,
            is_pph_23: tx.is_pph_23,
            is_pph_4: tx.is_pph_4,
            is_sspd: tx.is_sspd,
            is_siplah: tx.is_siplah,
          });
        });

        // Skip empty months for non-UMUM reports
        if (!isUmum && finalTransactions.length === 0) continue;

        const monthStats = chartData.find((c) => c.bulan === monthStr) || {};
        let monthPenerimaan =
          (isUmum ? openingBalance : 0) +
          rows.reduce(
            (s, t) => (isPenerimaan(t) ? s + Math.abs(t.signed_amount || t.nominal || 0) : s),
            0
          );
        let monthPengeluaran = rows.reduce(
          (s, t) => (!isPenerimaan(t) ? s + Math.abs(t.signed_amount || t.nominal || 0) : s),
          0
        );

        allData[report.type].push({
          year: params.year,
          month: m,
          fundSource: params.fundSource,
          transactions: finalTransactions,
          tablePenerimaan: monthPenerimaan,
          tablePengeluaran: monthPengeluaran,
          calculatedSaldo: runningBal,
          stats: {
            saldo_tunai: monthStats.saldo_tunai || 0,
            saldo_bank: monthStats.saldo_bank || 0,
          },
          schoolInfo: schoolInfo,
        });
      }
    }

    db.close();

    const result = await exportHandler.exportAllReports(allData, {
      year: params.year,
      fundSource: params.fundSource || 'SEMUA',
      schoolInfo: schoolInfo,
    });
    return result;
  } catch (err) {
    console.error('Export All BKU Error:', err);
    return { success: false, error: err.message };
  }
});
