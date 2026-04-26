const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const LICENSE_DIR = path.join(__dirname, '..', 'electron', 'license');

if (!fs.existsSync(LICENSE_DIR)) fs.mkdirSync(LICENSE_DIR, { recursive: true });

const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

const pubPem = publicKey.export({ type: 'spki', format: 'pem' });
const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' });

fs.writeFileSync(path.join(LICENSE_DIR, 'publicKey.pem'), pubPem);
fs.writeFileSync(path.join(LICENSE_DIR, 'privateKey.pem'), privPem);

const pubBase64 = pubPem
  .replace('-----BEGIN PUBLIC KEY-----', '')
  .replace('-----END PUBLIC KEY-----', '')
  .replace(/\s/g, '');

console.log('Keypair generated!');
console.log('');
console.log('Files:');
console.log('  - electron/license/publicKey.pem (embed in app)');
console.log('  - electron/license/privateKey.pem (keep secret, used by server)');
console.log('');
console.log('Public Key (base64):');
console.log(pubBase64);
console.log('');
console.log('IMPORTANT: Add privateKey.pem to .gitignore!');
