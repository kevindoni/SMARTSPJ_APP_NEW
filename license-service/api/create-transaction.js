const { getSql, ensureTable } = require('../lib/db');
const { getSnap } = require('../lib/midtrans');
const crypto = require('crypto');

const TIER_ORDER = { basic: 1, pro: 2, lifetime: 3 };

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { npsn, tier, customerName, customerEmail } = req.body;
    if (!npsn || !tier) return res.status(400).json({ error: 'npsn dan tier wajib diisi' });
    if (!['basic', 'pro', 'lifetime'].includes(tier)) return res.status(400).json({ error: 'Tier harus "basic", "pro", atau "lifetime"' });

    await ensureTable();
    const sql = getSql();

    const existing = await sql`SELECT tier FROM licenses WHERE npsn = ${npsn} AND status = 'active' ORDER BY id DESC LIMIT 1`;
    if (existing.length > 0) {
      const currentTier = existing[0].tier;
      if ((TIER_ORDER[currentTier] || 0) >= (TIER_ORDER[tier] || 0)) {
        return res.status(400).json({ error: `Sudah memiliki license ${currentTier.toUpperCase()}. Pilih tier yang lebih tinggi untuk upgrade.` });
      }
    }

    const amount = tier === 'lifetime'
      ? parseInt(process.env.PRICE_LIFETIME || '750000')
      : tier === 'pro'
        ? parseInt(process.env.PRICE_PRO || '300000')
        : parseInt(process.env.PRICE_BASIC || '150000');

    const orderId = 'SPJ-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    const snap = getSnap();
    const transaction = await snap.createTransaction({
      transaction_details: { order_id: orderId, gross_amount: amount },
      item_details: [{
        id: 'smartspj-' + tier, price: amount, quantity: 1,
        name: 'SmartSPJ License ' + tier.toUpperCase() + (tier === 'lifetime' ? ' (Lifetime)' : ' (1 Tahun)'), category: 'Software License',
      }],
      customer_details: {
        first_name: customerName || 'User',
        email: customerEmail || `spj-${npsn}@smartspj.app`,
        metadata: { npsn },
      },
    });

    await sql`
      INSERT INTO licenses (order_id, npsn, tier, status, amount, customer_email, customer_name)
      VALUES (${orderId}, ${npsn}, ${tier}, 'pending', ${amount}, ${customerEmail || ''}, ${customerName || ''})
    `;

    return res.status(200).json({
      success: true, orderId, token: transaction.token,
      redirectUrl: transaction.redirect_url, amount,
    });
  } catch (err) {
    console.error('Create transaction error:', err);
    return res.status(500).json({ error: err.message });
  }
};
