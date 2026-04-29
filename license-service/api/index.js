module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SmartSPJ — License Service</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%);min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px}
.card{background:#fff;border-radius:20px;box-shadow:0 8px 32px rgba(0,0,0,.08);max-width:480px;width:100%;padding:40px;text-align:center}
.logo{font-size:28px;font-weight:800;background:linear-gradient(135deg,#6366f1,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px}
.tagline{color:#64748b;font-size:14px;margin-bottom:28px}
.status{display:inline-flex;align-items:center;gap:6px;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:24px}
.status-ok{background:#d1fae5;color:#065f46}
.dot{width:8px;height:8px;border-radius:50%;background:#10b981;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.info{text-align:left;background:#f8fafc;border-radius:12px;padding:16px;margin:20px 0;font-size:13px;color:#475569;line-height:1.7}
.info strong{color:#1e293b}
.plans{display:grid;gap:10px;margin:20px 0}
.plan{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-radius:12px;border:1.5px solid #e2e8f0;transition:all .2s;text-decoration:none;color:inherit}
.plan:hover{border-color:#6366f1;transform:translateY(-1px);box-shadow:0 4px 12px rgba(99,102,241,.1)}
.plan-name{font-weight:700;font-size:14px;color:#1e293b}
.plan-price{font-size:13px;color:#6366f1;font-weight:600}
.plan-period{font-size:11px;color:#94a3b8}
.footer{margin-top:20px;font-size:11px;color:#94a3b8}
a{color:#6366f1;text-decoration:none}
a:hover{text-decoration:underline}
</style>
</head>
<body>
<div class="card">
  <div class="logo">SmartSPJ</div>
  <div class="tagline">Aplikasi Pendamping ARKAS untuk Pengelolaan SPJ BOS</div>
  <div class="status status-ok"><span class="dot"></span> License Server Active</div>
  <div class="info">
    <strong>SmartSPJ</strong> adalah aplikasi desktop yang terintegrasi dengan database ARKAS untuk membantu bendahara BOS mengelola SPJ secara efisien.<br><br>
    Fitur: Dashboard, Buku Kas Umum, BA Rekonsiliasi, Export Excel/PDF, Cetak SPTJM, Laporan K7, Register Kas, dan lainnya.
  </div>
  <div style="font-size:13px;font-weight:700;color:#1e293b;margin:16px 0 8px">Pilih Paket License</div>
  <div class="plans">
    <a class="plan" href="/buy?tier=basic">
      <div><div class="plan-name">Basic</div><div class="plan-period">Per tahun</div></div>
      <div class="plan-price">Rp 100.000</div>
    </a>
    <a class="plan" href="/buy?tier=pro">
      <div><div class="plan-name">Pro</div><div class="plan-period">Per tahun</div></div>
      <div class="plan-price">Rp 200.000</div>
    </a>
    <a class="plan" href="/buy?tier=lifetime">
      <div><div class="plan-name">Lifetime</div><div class="plan-period">Sekali bayar</div></div>
      <div class="plan-price">Rp 500.000</div>
    </a>
  </div>
  <div class="footer">
    &copy; ${new Date().getFullYear()} Kevin Doni &middot; License server powered by Vercel
  </div>
</div>
</body>
</html>`);
};
