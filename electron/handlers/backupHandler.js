const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const unzipper = require('unzipper');

let DATA_DIR = path.join(__dirname, '../../data');

function initBackupStorage(dir) {
  DATA_DIR = dir;
}

const BACKUP_FILES = [
  'config.json',
  'register-kas.json',
  'manual_taxes.json',
  'nota-groups.json',
  'ba_signatory.json',
  'bank-reconciliation.json',
];

const LOCALSTORAGE_KEYS = [
  'selected_year',
  'selected_fund_source',
  'printed_transactions',
  'printed_groups',
];

async function createBackup(savePath, localStorageData) {
  return new Promise((resolve, reject) => {
    try {
      const output = fs.createWriteStream(savePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        const size = archive.pointer();
        resolve({ success: true, size, path: savePath });
      });

      archive.on('error', (err) => reject(err));
      archive.pipe(output);

      const manifest = {
        version: '1.2.0',
        createdAt: new Date().toISOString(),
        files: [],
        localStorageKeys: Object.keys(localStorageData || {}),
      };

      BACKUP_FILES.forEach((file) => {
        const filePath = path.join(DATA_DIR, file);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: `data/${file}` });
          const stats = fs.statSync(filePath);
          manifest.files.push({ name: file, size: stats.size });
        }
      });

      if (localStorageData && Object.keys(localStorageData).length > 0) {
        const lsContent = JSON.stringify(localStorageData, null, 2);
        archive.append(lsContent, { name: 'localstorage.json' });
        manifest.localStorageCount = Object.keys(localStorageData).length;
      }

      const customDateKeys = Object.keys(localStorageData || {}).filter((k) =>
        k.startsWith('custom_date_')
      );
      if (customDateKeys.length > 0) {
        manifest.customDateCount = customDateKeys.length;
      }

      archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });
      archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
}

async function getBackupInfo(filePath) {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(filePath)) {
        return resolve({ success: false, error: 'File tidak ditemukan' });
      }

      let manifestData = null;
      let lsData = null;
      let fileCount = 0;

      fs.createReadStream(filePath)
        .pipe(unzipper.Parse())
        .on('entry', (entry) => {
          const chunks = [];
          if (entry.path === 'manifest.json') {
            entry.on('data', (chunk) => chunks.push(chunk));
            entry.on('end', () => {
              try {
                manifestData = JSON.parse(Buffer.concat(chunks).toString());
              } catch (e) {
                // ignore parse error
              }
            });
          } else if (entry.path === 'localstorage.json') {
            entry.on('data', (chunk) => chunks.push(chunk));
            entry.on('end', () => {
              try {
                lsData = JSON.parse(Buffer.concat(chunks).toString());
              } catch (e) {
                // ignore parse error
              }
            });
          } else if (entry.path.startsWith('data/')) {
            fileCount++;
            entry.autodrain();
          } else {
            entry.autodrain();
          }
        })
        .on('close', () => {
          if (!manifestData) {
            return resolve({
              success: false,
              error: 'File backup tidak valid (tidak ada manifest)',
            });
          }
          resolve({
            success: true,
            info: {
              ...manifestData,
              fileCount,
              hasLocalStorage: !!lsData,
              localStorageKeys: lsData ? Object.keys(lsData) : [],
            },
          });
        })
        .on('error', (err) => resolve({ success: false, error: err.message }));
    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
}

async function restoreBackup(filePath, currentLocalStorageData) {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(filePath)) {
        return resolve({ success: false, error: 'File tidak ditemukan' });
      }

      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const restoredFiles = [];
      let lsData = null;
      let manifestData = null;

      fs.createReadStream(filePath)
        .pipe(unzipper.Parse())
        .on('entry', (entry) => {
          const chunks = [];
          if (entry.path === 'manifest.json') {
            entry.on('data', (chunk) => chunks.push(chunk));
            entry.on('end', () => {
              try {
                manifestData = JSON.parse(Buffer.concat(chunks).toString());
              } catch (e) {
                // ignore
              }
            });
          } else if (entry.path === 'localstorage.json') {
            entry.on('data', (chunk) => chunks.push(chunk));
            entry.on('end', () => {
              try {
                lsData = JSON.parse(Buffer.concat(chunks).toString());
              } catch (e) {
                // ignore
              }
            });
          } else if (entry.path.startsWith('data/') && !entry.path.endsWith('/')) {
            const fileName = entry.path.replace('data/', '');
            if (BACKUP_FILES.includes(fileName)) {
              const destPath = path.join(DATA_DIR, fileName);
              entry.on('data', (chunk) => chunks.push(chunk));
              entry.on('end', () => {
                try {
                  fs.writeFileSync(destPath, Buffer.concat(chunks));
                  restoredFiles.push(fileName);
                } catch (e) {
                  // ignore individual file write errors
                }
              });
            } else {
              entry.autodrain();
            }
          } else {
            entry.autodrain();
          }
        })
        .on('close', () => {
          // Build localStorage restore data
          const lsRestore = {};
          if (lsData) {
            Object.entries(lsData).forEach(([key, value]) => {
              lsRestore[key] = value;
            });
          }

          resolve({
            success: true,
            restoredFiles,
            localStorageData: lsRestore,
            manifest: manifestData,
          });
        })
        .on('error', (err) => resolve({ success: false, error: err.message }));
    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
}

async function createFullBackup(savePath, localStorageData) {
  return new Promise((resolve, reject) => {
    try {
      const output = fs.createWriteStream(savePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        const size = archive.pointer();
        resolve({ success: true, size, path: savePath });
      });

      archive.on('error', (err) => reject(err));
      archive.pipe(output);

      const manifest = {
        type: 'full',
        version: '1.2.0',
        createdAt: new Date().toISOString(),
        files: [],
        localStorageKeys: Object.keys(localStorageData || {}),
      };

      if (fs.existsSync(DATA_DIR)) {
        const allFiles = fs.readdirSync(DATA_DIR);
        allFiles.forEach((file) => {
          const filePath = path.join(DATA_DIR, file);
          const stat = fs.statSync(filePath);
          if (stat.isFile()) {
            archive.file(filePath, { name: `data/${file}` });
            manifest.files.push({ name: file, size: stat.size });
          }
        });
      }

      if (localStorageData && Object.keys(localStorageData).length > 0) {
        const lsContent = JSON.stringify(localStorageData, null, 2);
        archive.append(lsContent, { name: 'localstorage.json' });
        manifest.localStorageCount = Object.keys(localStorageData).length;
      }

      archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });
      archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  initBackupStorage,
  createBackup,
  createFullBackup,
  getBackupInfo,
  restoreBackup,
  BACKUP_FILES,
  LOCALSTORAGE_KEYS,
};
