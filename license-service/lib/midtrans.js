const midtransClient = require('midtrans-client');

let snapInstance = null;

function getSnap() {
  if (snapInstance) return snapInstance;
  snapInstance = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
  });
  return snapInstance;
}

function verifySignature(orderId, statusCode, grossAmount, serverKey, signatureKey) {
  const crypto = require('crypto');
  const hash = crypto
    .createHash('sha512')
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest('hex');
  return hash === signatureKey;
}

module.exports = { getSnap, verifySignature };
