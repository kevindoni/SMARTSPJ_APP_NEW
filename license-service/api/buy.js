const { getSql, ensureTable } = require('../lib/db');
const { signPayload } = require('../lib/license');

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const tier = req.query.tier || 'basic';
    const prices = { basic: 'Rp 100.000', pro: 'Rp 200.000', lifetime: 'Rp 500.000' };
    const priceLabel = prices[tier] || prices.basic;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Beli License SmartSPJ</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:420px;width:100%;padding:32px;text-align:center}
.logo{font-size:24px;font-weight:800;color:#4f46e5;margin-bottom:4px}
.sub{color:#64748b;font-size:13px;margin-bottom:24px}
.tier-badge{display:inline-block;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px}
.tier-basic{background:#dbeafe;color:#1d4ed8}
.tier-pro{background:#ede9fe;color:#7c3aed}
.tier-lifetime{background:#d1fae5;color:#065f46}
.price{font-size:32px;font-weight:800;color:#0f172a;margin:8px 0}
.period{color:#94a3b8;font-size:13px}
.form{text-align:left;margin:20px 0}
.form label{display:block;font-size:12px;font-weight:600;color:#475569;margin-bottom:4px}
.form input{width:100%;padding:10px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:14px;margin-bottom:12px;outline:none;transition:border .2s}
.form input:focus{border-color:#6366f1}
.btn{width:100%;padding:12px;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;color:#fff;background:linear-gradient(135deg,#6366f1,#8b5cf6)}
.btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(99,102,241,.4)}
.btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
.footer{margin-top:16px;font-size:11px;color:#94a3b8}
.error{color:#ef4444;font-size:12px;margin:8px 0}
</style>
</head>
<body>
<div class="card">
  <div class="logo">SmartSPJ</div>
  <div class="sub">Aplikasi Pendamping ARKAS</div>
  <div class="tier-badge tier-${tier}">${tier}</div>
  <div class="price">${priceLabel}</div>
  <div class="period">${tier === 'lifetime' ? 'Sekali bayar, berlaku selamanya' : 'Per tahun'}</div>
  <form class="form" id="payForm">
    <label>NPSN Sekolah</label>
    <input type="text" id="npsn" placeholder="Contoh: 70007889" required maxlength="20">
    <label>Nama Sekolah (opsional)</label>
    <input type="text" id="schoolName" placeholder="Contoh: SMP Negeri 1 Jakarta">
    <label>Email</label>
    <input type="email" id="email" placeholder="email@sekolah.sch.id" required>
    <div id="errorMsg" class="error" style="display:none"></div>
    <button type="submit" class="btn" id="payBtn">Bayar Sekarang</button>
  </form>
  <div class="footer">Pembayaran via Midtrans (QRIS, Transfer Bank, E-Wallet)<br>License otomatis dikirim setelah pembayaran berhasil</div>
</div>
<script>
document.getElementById('payForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('payBtn');
  const errEl = document.getElementById('errorMsg');
  errEl.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Memproses...';
  try {
    const res = await fetch('/api/create-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        npsn: document.getElementById('npsn').value.trim(),
        tier: '${tier}',
        customerName: document.getElementById('schoolName').value.trim() || 'Bendahara BOS',
        customerEmail: document.getElementById('email').value.trim(),
      }),
    });
    const data = await res.json();
    if (data.success && data.redirectUrl) {
      window.location.href = data.redirectUrl;
    } else {
      errEl.textContent = data.error || 'Gagal membuat transaksi. Coba lagi.';
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Bayar Sekarang';
    }
  } catch (err) {
    errEl.textContent = 'Koneksi gagal. Periksa internet Anda.';
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Bayar Sekarang';
  }
});
</script>
</body>
</html>`);
  }
  return res.status(405).json({ error: 'Method not allowed' });
};
