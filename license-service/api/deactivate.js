const { getSql, ensureTable } = require('../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { npsn, licenseKey } = req.body;
    if (!npsn || !licenseKey) return res.status(400).json({ error: 'npsn dan licenseKey required' });

    await ensureTable();
    const sql = getSql();
    await sql`
      UPDATE licenses SET hardware_id = NULL, updated_at = NOW()
      WHERE npsn = ${npsn} AND license_key = ${licenseKey} AND status = 'active'
    `;
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
