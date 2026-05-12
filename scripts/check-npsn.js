require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const Database = require('better-sqlite3-multiple-ciphers');
const dbPath = process.env.ARKAS_DB_PATH || 'C:/Users/kevin/AppData/Roaming/arkas/arkas.db';
const db = new Database(dbPath, { readonly: true });
db.pragma("cipher='sqlcipher'");
db.pragma('legacy=4');
db.pragma(`key='${process.env.ARKAS_PASSWORD || ''}'`);

const instansi = db.prepare('SELECT * FROM instansi LIMIT 1').get();
console.log('instansi_id:', instansi?.instansi_id);
console.log('kode_instansi:', instansi?.kode_instansi);

const npsn = instansi?.kode_instansi || '';
console.log('NPSN:', npsn);
db.close();
