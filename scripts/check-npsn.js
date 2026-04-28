const Database = require('better-sqlite3-multiple-ciphers');
const db = new Database('C:/Users/kevin/AppData/Roaming/arkas/arkas.db', { readonly: true });
db.pragma("cipher='sqlcipher'");
db.pragma('legacy=4');
db.pragma("key='K3md1kbudRIS3n4yan'");

const instansi = db.prepare('SELECT * FROM instansi LIMIT 1').get();
console.log('=== instansi columns ===');
console.log('Columns:', Object.keys(instansi));
console.log('instansi_id:', instansi.instansi_id);
console.log('kode_instansi:', instansi.kode_instansi);
console.log('Full row:', JSON.stringify(instansi, null, 2));

const mstQueries = [
  instansi.instansi_id ? { sql: 'SELECT * FROM mst_sekolah WHERE sekolah_id = ?', param: instansi.instansi_id } : null,
  instansi.kode_instansi ? { sql: 'SELECT * FROM mst_sekolah WHERE npsn = ?', param: instansi.kode_instansi } : null,
  { sql: 'SELECT * FROM mst_sekolah LIMIT 1', param: undefined },
];

console.log('\n=== mst_sekolah queries ===');
let mstData = null;
for (const q of mstQueries) {
  if (!q) { console.log('SKIP: null query'); continue; }
  try {
    const row = q.param !== undefined ? db.prepare(q.sql).get(q.param) : db.prepare(q.sql).get();
    console.log(`Query: ${q.sql} Param: ${q.param} =>`, row ? `FOUND (npsn=${row.npsn})` : 'NOT FOUND');
    if (row && !mstData) mstData = row;
  } catch (e) {
    console.log(`Query: ${q.sql} => ERROR: ${e.message}`);
  }
}

console.log('\n=== Merge simulation ===');
let sekolah = { ...instansi };
if (mstData) {
  const iCols = Object.keys(instansi);
  for (const [k, v] of Object.entries(mstData)) {
    if (!iCols.includes(k) || v !== null) {
      sekolah[k] = v;
    }
  }
}
console.log('sekolah.npsn:', sekolah.npsn);
console.log('sekolah.kode_instansi:', sekolah.kode_instansi);
const npsn = sekolah.npsn || sekolah.kode_instansi || '';
console.log('Final NPSN used:', JSON.stringify(npsn));

db.close();
