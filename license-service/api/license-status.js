const { getSql, ensureTable } = require('../lib/db');

module.exports = async function handler(req, res) {
  const npsn = req.query.npsn || '';
  console.log('[license-status] incoming npsn:', JSON.stringify(npsn), 'raw:', req.query.npsn);

  if (!npsn) {
    return res.status(200).json({ active: false, status: 'no_npsn', error: 'NPSN tidak diberikah' });
  }

  try {
    await ensureTable();
    const sql = getSql();
    const rows = await sql`SELECT * FROM licenses WHERE npsn = ${npsn} AND status = 'active' ORDER BY id DESC LIMIT 1`;

    if (rows.length === 0) {
      console.log('[license-status] no active license for npsn:', npsn);
      return res.status(200).json({ active: false, status: 'not_found', error: 'Tidak ada license aktif untuk NPSN ini di server.' });
    }

    const license = rows[0];
    console.log('[license-status] found license:', { id: license.id, npsn: license.npsn, tier: license.tier, hardware_id: license.hardware_id });

    return res.status(200).json({
      active: true,
      status: 'active',
      tier: license.tier,
      licenseKey: license.license_key,
      expiresAt: license.expires_at,
      activatedAt: license.activated_at,
    });
  } catch (err) {
    console.error('[license-status] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
