const Database = require('better-sqlite3-multiple-ciphers');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('=== TEST KONEKSI DATABASE ARKAS ===\n');

// Step 1: Cari path database
const homeDir = os.homedir();
const roaming = process.env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');
const local = process.env.LOCALAPPDATA || path.join(homeDir, 'AppData', 'Local');

const candidates = [
  path.join(roaming, 'arkas', 'arkas.db'),
  path.join(roaming, 'Arkas', 'arkas.db'),
  path.join(roaming, 'ARKAS', 'arkas.db'),
  path.join(local, 'arkas', 'arkas.db'),
  path.join(local, 'Arkas', 'arkas.db'),
  path.join(roaming, 'RKAS', 'arkas.db'),
];

let dbPath = null;
for (const candidate of candidates) {
  console.log(`Memeriksa: ${candidate}`);
  if (fs.existsSync(candidate)) {
    dbPath = candidate;
    console.log(`✓ Ditemukan: ${dbPath}\n`);
    break;
  }
}

if (!dbPath) {
  console.log('✗ Database tidak ditemukan di semua path kandidat!');
  process.exit(1);
}

// Step 2: Coba dapatkan password dari .env di direktori arkas
let password = '';
const arkasEnvPath = path.join(path.dirname(dbPath), '.env');
console.log(`Memeriksa .env di: ${arkasEnvPath}`);
if (fs.existsSync(arkasEnvPath)) {
  try {
    const content = fs.readFileSync(arkasEnvPath, 'utf8');
    const match = content.match(/^ARKAS_PASSWORD=(.*)$/m);
    if (match) {
      password = match[1].trim();
      console.log(`✓ Password ditemukan (${password.length} karakter)\n`);
    }
  } catch (e) {
    console.log(`⚠ Gagal baca .env: ${e.message}`);
  }
}

// Step 3: Coba juga .env di direktori proyek
if (!password) {
  const projectEnvPath = path.join(__dirname, '../.env');
  console.log(`Memeriksa .env di: ${projectEnvPath}`);
  if (fs.existsSync(projectEnvPath)) {
    try {
      const content = fs.readFileSync(projectEnvPath, 'utf8');
      const match = content.match(/^ARKAS_PASSWORD=(.*)$/m);
      if (match) {
        password = match[1].trim();
        console.log(`✓ Password ditemukan di proyek (${password.length} karakter)\n`);
      }
    } catch (e) {
      console.log(`⚠ Gagal baca .env proyek: ${e.message}`);
    }
  }
}

if (!password) {
  console.log('✗ Password database tidak ditemukan!');
  process.exit(1);
}

// Step 4: Coba koneksi dan query
console.log('Mencoba koneksi ke database...');
try {
  const db = new Database(dbPath, { readonly: true });

  console.log('✓ Database berhasil dibuka');
  console.log('Menerapkan konfigurasi SQLCipher...');

  db.pragma("cipher='sqlcipher'");
  db.pragma('legacy=4');
  db.pragma(`key='${password}'`);

  console.log('✓ Konfigurasi cipher diterapkan');
  console.log('Menjalankan query SELECT 1...');

  const result = db.prepare('SELECT 1 as test').get();
  console.log(`✓ Query berhasil! Hasil: ${JSON.stringify(result)}`);

  console.log('\nMencoba mengambil data instansi...');
  try {
    const instansi = db.prepare('SELECT * FROM instansi LIMIT 1').get();
    if (instansi) {
      console.log('✓ Data instansi ditemukan!');
      console.log(JSON.stringify(instansi, null, 2));
    } else {
      console.log('⚠ Tabel instansi kosong');
    }
  } catch (e) {
    console.log(`⚠ Gagal query instansi: ${e.message}`);
  }

  db.close();
  console.log('\n=== SEMUA TEST BERHASIL ===');
} catch (e) {
  console.error('\n✗ ERROR:');
  console.error(`  Pesan: ${e.message}`);
  console.error(`  Stack: ${e.stack}`);
  process.exit(1);
}
