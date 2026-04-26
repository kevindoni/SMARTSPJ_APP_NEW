const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateShortCode(length = 5) {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CHARSET[bytes[i] % CHARSET.length];
  }
  return code;
}

function generateShortKey() {
  const parts = [generateShortCode(5), generateShortCode(5), generateShortCode(5), generateShortCode(4)];
  return 'SMARTSPJ-' + parts.join('-');
}

const npsn = process.argv[2];
const tier = process.argv[3] || 'basic';
const days = parseInt(process.argv[4]) || 365;

if (!npsn) {
  console.log('Usage: node generate-license.js <NPSN> [tier] [days]');
  console.log('  tier: basic (default) or pro');
  console.log('  days: 365 (default)');
  console.log('');
  console.log('Example:');
  console.log('  node generate-license.js 20318462 basic 365');
  console.log('  node generate-license.js 20318462 pro');
  process.exit(1);
}

if (!['basic', 'pro', 'lifetime'].includes(tier)) {
  console.error('Invalid tier. Use "basic", "pro", or "lifetime".');
  process.exit(1);
}

const expiry = new Date();
expiry.setDate(expiry.getDate() + days);

const key = generateShortKey();

console.log('┌─────────────────────────────────────────────┐');
console.log('│       SMARTSPJ LICENSE KEY GENERATOR        │');
console.log('├─────────────────────────────────────────────┤');
console.log(`│ NPSN:    ${npsn.padEnd(34)}│`);
console.log(`│ Tier:    ${tier.toUpperCase().padEnd(34)}│`);
console.log(`│ Expires: ${expiry.toISOString().split('T')[0].padEnd(34)}│`);
console.log('│                                             │');
console.log('│ License Key:                                │');
console.log(`│ ${key.padEnd(44)}│`);
console.log('└─────────────────────────────────────────────┘');
console.log('');
console.log('Copy this key:');
console.log(key);
console.log('');
console.log('NOTE: This key must be inserted into the license database manually or via the license service.');
