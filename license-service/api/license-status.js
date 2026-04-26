const { getSql, ensureTable } = require('../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { npsn } = req.query;
    if (!npsn) return res.status(400).json({ error: 'npsn required' });

    await ensureTable();
    const sql = getSql();
    const rows = await sql`
      SELECT * FROM licenses WHERE npsn = ${npsn} AND status = 'active'
      ORDER BY id DESC LIMIT 1
    `;

    if (rows.length === 0) return res.status(200).json({ active: false, status: 'none' });

    const license = rows[0];
    const expired = license.expires_at && new Date(license.expires_at) < new Date();

    return res.status(200).json({
      active: !expired, status: expired ? 'expired' : 'active',
      tier: license.tier, licenseKey: license.license_key,
      expiresAt: license.expires_at, activatedAt: license.activated_at,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
