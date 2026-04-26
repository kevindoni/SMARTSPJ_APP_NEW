const { getSql, ensureTable } = require('../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { npsn, tier, licenseKey, days } = req.body;
    if (!npsn || !tier || !licenseKey) {
      return res.status(400).json({ error: 'npsn, tier, licenseKey required' });
    }

    const ADMIN_SECRET = process.env.ADMIN_SECRET;
    if (!ADMIN_SECRET || auth !== `Bearer ${ADMIN_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await ensureTable();
    const sql = getSql();

    const durationDays = parseInt(days) || 365;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const result = await sql`
      INSERT INTO licenses (npsn, tier, license_key, status, expires_at, activated_at, created_at, updated_at)
      VALUES (${npsn}, ${tier}, ${licenseKey.toUpperCase()}, 'active', ${expiresAt.toISOString()}, NOW(), NOW(), NOW())
      RETURNING id, npsn, tier, license_key, status, expires_at
    `;

    return res.status(200).json({ success: true, license: result[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
