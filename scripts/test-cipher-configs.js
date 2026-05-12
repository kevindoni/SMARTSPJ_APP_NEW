const Database = require('better-sqlite3-multiple-ciphers');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('=== TEST MULTIPLE CIPHER CONFIGURATIONS ===\n');

const dbPath = path.join(process.env.APPDATA, 'arkas', 'arkas.db');
console.log('Database path:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.error('Database not found!');
  process.exit(1);
}

// Load password from project .env
let password = '';
const projectEnvPath = path.join(__dirname, '../.env');
if (fs.existsSync(projectEnvPath)) {
  const content = fs.readFileSync(projectEnvPath, 'utf8');
  const match = content.match(/^ARKAS_PASSWORD=(.*)$/m);
  if (match) {
    password = match[1].trim();
    console.log('Password loaded:', password.length, 'chars\n');
  }
}

if (!password) {
  console.error('Password not found!');
  process.exit(1);
}

// Test various configurations
const testConfigs = [
  {
    name: 'Default (sqlcipher, legacy=4)',
    config: (db) => {
      db.pragma("cipher='sqlcipher'");
      db.pragma('legacy=4');
      db.pragma(`key='${password}'`);
    }
  },
  {
    name: 'sqlcipher, legacy=3',
    config: (db) => {
      db.pragma("cipher='sqlcipher'");
      db.pragma('legacy=3');
      db.pragma(`key='${password}'`);
    }
  },
  {
    name: 'sqlcipher, no legacy',
    config: (db) => {
      db.pragma("cipher='sqlcipher'");
      db.pragma(`key='${password}'`);
    }
  },
  {
    name: 'aes256cbc',
    config: (db) => {
      db.pragma("cipher='aes256cbc'");
      db.pragma(`key='${password}'`);
    }
  },
  {
    name: 'chacha20',
    config: (db) => {
      db.pragma("cipher='chacha20'");
      db.pragma(`key='${password}'`);
    }
  },
  {
    name: 'Key directly in constructor',
    config: null,
    options: { key: password }
  },
];

for (const test of testConfigs) {
  console.log(`\n--- Testing: ${test.name} ---`);
  try {
    let db;
    if (test.options) {
      db = new Database(dbPath, { readonly: true, ...test.options });
    } else {
      db = new Database(dbPath, { readonly: true });
      test.config(db);
    }
    
    const result = db.prepare('SELECT 1 as test').get();
    console.log('✓ SUCCESS! Result:', result);
    
    // Try to read actual table
    try {
      const instansi = db.prepare('SELECT * FROM instansi LIMIT 1').get();
      if (instansi) {
        console.log('✓ Can read instansi table! First record keys:', Object.keys(instansi));
      }
    } catch (e) {
      console.log('⚠ Can\'t read instansi table (but SELECT 1 works):', e.message);
    }
    
    db.close();
    console.log('\n🎉 WORKING CONFIGURATION FOUND:', test.name);
    process.exit(0);
    
  } catch (e) {
    console.log('✗ Failed:', e.message);
  }
}

console.log('\n❌ All configurations failed!');
process.exit(1);
