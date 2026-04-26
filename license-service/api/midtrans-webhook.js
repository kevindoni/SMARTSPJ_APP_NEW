const { getSql, ensureTable } = require('../lib/db');
const { verifySignature } = require('../lib/midtrans');
const { generateLicenseKey } = require('../lib/license');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const notification = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!notification || !notification.order_id) {
      return res.status(200).json({ status: 'ok' });
    }

    const { order_id, transaction_status, fraud_status, payment_type, transaction_id,
            status_code, gross_amount, signature_key } = notification;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return res.status(200).json({ status: 'ok' });
    }

    const valid = verifySignature(
      order_id, status_code, gross_amount,
      process.env.MIDTRANS_SERVER_KEY, signature_key
    );

    if (!valid) {
      return res.status(200).json({ status: 'ignored', reason: 'invalid_signature' });
    }

    await ensureTable();
    const sql = getSql();

    let isPaymentSuccess = false;
    if (transaction_status === 'capture') isPaymentSuccess = fraud_status === 'accept';
    else if (transaction_status === 'settlement') isPaymentSuccess = true;

    const rows = await sql`SELECT * FROM licenses WHERE order_id = ${order_id}`;
    if (rows.length === 0) {
      return res.status(200).json({ status: 'ok', note: 'order_not_found' });
    }

    const license = rows[0];

    if (isPaymentSuccess && license.status !== 'active') {
      const licenseKey = generateLicenseKey();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 365);

      await sql`
        UPDATE licenses SET
          status = 'active', license_key = ${licenseKey},
          midtrans_transaction_id = ${transaction_id}, payment_type = ${payment_type},
          payment_time = NOW(), activated_at = NOW(),
          expires_at = ${expiresAt.toISOString()}, updated_at = NOW()
        WHERE order_id = ${order_id}
      `;
      console.log('License activated:', license.npsn, '->', license.tier);
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      await sql`UPDATE licenses SET status = ${transaction_status}, updated_at = NOW() WHERE order_id = ${order_id}`;
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(200).json({ status: 'error', message: err.message });
  }
};
