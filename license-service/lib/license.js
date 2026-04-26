const crypto = require('crypto');

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateShortCode(length = 5) {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CHARSET[bytes[i] % CHARSET.length];
  }
  return code;
}

function generateLicenseKey() {
  const parts = [generateShortCode(5), generateShortCode(5), generateShortCode(5), generateShortCode(4)];
  return 'SMARTSPJ-' + parts.join('-');
}

function signPayload(payload) {
  const privateKeyPem = process.env.LICENSE_PRIVATE_KEY;
  if (!privateKeyPem) throw new Error('LICENSE_PRIVATE_KEY not set');

  const privateKey = crypto.createPrivateKey(privateKeyPem);
  const data = Buffer.from(JSON.stringify(payload), 'utf-8');
  const signature = crypto.sign(null, data, privateKey).toString('base64');
  return signature;
}

module.exports = { generateLicenseKey, signPayload };
