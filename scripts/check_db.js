const Database = require('better-sqlite3-multiple-ciphers');
const path = require('path');
const os = require('os');
const fs = require('fs');

const envPath = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Arkas', 'arkas.db');
if (!fs.existsSync(envPath)) {
    console.log("Database tidak ditemukan:", envPath);
    process.exit(1);
}

const db = new Database(envPath, { readonly: true });
db.pragma("cipher='sqlcipher'");
db.pragma("legacy=4");
db.pragma(`key='K3md1kbudRIS3n4yan'`);

// 1. Cek di tabel rapbs ada berapa baris untuk Modul Pramuka
const rows = db.prepare(`
    SELECT id_rapbs, id_anggaran, kode_rekening, uraian, volume, harga_satuan, jumlah 
    FROM rapbs 
    WHERE uraian LIKE '%Modul Pramuka%' 
    AND soft_delete = 0
`).all();

console.log('--- DATA MURNI DARI TABEL RAPBS ---');
console.log(`Ditemukan ${rows.length} baris 'Modul Pramuka' di tabel rapbs.`);
console.table(rows);

// 2. Cek gabungan anggaran aktif di tahun 2026 untuk BOS Reguler
const anggaran = db.prepare(`
    SELECT a.id_anggaran, a.tahun_anggaran, a.is_revisi, a.is_approve
    FROM anggaran a
    LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
    WHERE a.soft_delete = 0
    AND a.is_approve = 1
    AND (a.tahun_anggaran = '2026' OR a.tahun_anggaran = 2026)
`).all();

console.log('\n--- DAFTAR ANGGARAN (BOS REGULER/AKTIF 2026) ---');
console.table(anggaran);

db.close();
