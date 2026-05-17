const Database = require('better-sqlite3-multiple-ciphers');

function openDatabase(dbPath, readonly = true, password = '') {
  const safeKey = String(password).replace(/'/g, "''");

  try {
    const db = new Database(dbPath, { readonly });
    db.pragma("cipher='sqlcipher'");
    db.pragma('legacy=4');
    db.pragma(`key='${safeKey}'`);
    db.prepare('SELECT 1').get();
    if (!readonly) {
      db.pragma('journal_mode=WAL');
      db.pragma('synchronous=NORMAL');
    }
    return db;
  } catch (e) {
    console.error('[openDatabase] cipher sqlcipher/legacy4 failed:', e.message);
  }

  try {
    const db = new Database(dbPath, { readonly });
    db.pragma(`key='${safeKey}'`);
    db.prepare('SELECT 1').get();
    return db;
  } catch (e) {
    console.error('[openDatabase] key-only failed:', e.message);
  }

  try {
    const db = new Database(dbPath, { readonly });
    db.prepare('SELECT 1').get();
    return db;
  } catch (e) {}

  throw new Error('Tidak dapat membuka database');
}

module.exports = { openDatabase };
