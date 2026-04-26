const { getSql, ensureTable } = require('../lib/db');
const { signPayload } = require('../lib/license');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { key, hardwareId } = req.body;
    if (!key) return res.status(400).json({ error: 'key required' });

    const normalizedKey = key.trim().toUpperCase();

    await ensureTable();
    const sql = getSql();
    const rows = await sql`
      SELECT * FROM licenses
      WHERE license_key = ${normalizedKey} AND status = 'active'
      ORDER BY id DESC LIMIT 1
    `;

    if (rows.length === 0) {
      return res.status(200).json({ success: false, error: 'License key tidak ditemukan atau tidak aktif.' });
    }

    const license = rows[0];

    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return res.status(200).json({ success: false, error: 'License sudah expired pada ' + new Date(license.expires_at).toLocaleDateString('id-ID') });
    }

    if (hardwareId) {
      if (license.hardware_id && license.hardware_id !== hardwareId) {
        return res.status(200).json({ success: false, error: 'License sudah terikat ke device lain.' });
      }
      await sql`
        UPDATE licenses SET hardware_id = ${hardwareId}, updated_at = NOW()
        WHERE id = ${license.id}
      `;
      await sql`
        UPDATE licenses SET status = 'upgraded', hardware_id = NULL, updated_at = NOW()
        WHERE npsn = ${license.npsn} AND status = 'active' AND id != ${license.id}
      `;
    }

    const payload = {
      npsn: license.npsn,
      tier: license.tier,
      expiry: license.expires_at ? new Date(license.expires_at).toISOString().split('T')[0] : null,
      issuedAt: license.activated_at ? new Date(license.activated_at).toISOString() : new Date().toISOString(),
    };

    const signature = signPayload(payload);

    return res.status(200).json({
      success: true,
      payload,
      signature,
      meta: { v: 2, alg: 'ed25519' },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
