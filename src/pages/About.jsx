import { useState, useMemo } from 'react';
import { Heart, Calendar, ChevronDown, Sparkles, CheckCircle, ArrowRight, Bug } from 'lucide-react';

const CHANGELOG = [
  {
    version: '1.7.4',
    date: '29 April 2026',
    title: 'Fix License Activation & Dynamic School Data',
    changes: [
      { type: 'fix', text: 'Aktivasi license gagal di packaged app — .env terkunci di ASAR archive' },
      { type: 'fix', text: 'Koneksi license server ETIMEDOUT — force IPv4 untuk semua network request' },
      { type: 'fix', text: 'electron.net.fetch gagal di packaged app — fallback ke Node.js https module' },
      { type: 'fix', text: 'NPSN comparison gagal (type mismatch) — String() cast di perbandingan' },
      { type: 'fix', text: 'admin-insert.js selalu 401 Unauthorized — fix variabel auth undefined' },
      { type: 'imp', text: 'Semua hardcoded value spesifik sekolah dihapus — aplikasi 100% dinamis' },
      { type: 'imp', text: 'Kode wilayah dinamis (kode_prop, kode_kab_kota, kode_kec) dari database' },
      { type: 'imp', text: 'Placeholder Pengaturan generik — tidak lagi menampilkan data sekolah tertentu' },
      { type: 'new', text: 'Changelog hanya menampilkan 3 versi terakhir + tombol tampilkan semua' },
    ],
  },
  {
    version: '1.7.3',
    date: '26 April 2026',
    title: 'License System v2 & Codebase Audit',
    changes: [
      { type: 'new', text: 'Format license key baru (short key) — SMARTSPJ-XXXXX-XXXXX-XXXXX-XXXX' },
      { type: 'new', text: 'Halaman Lisensi terpusat — tier, status, expiry, device ID, deactivate' },
      { type: 'new', text: 'Paket Lifetime & upgrade license dari dalam app' },
      { type: 'new', text: 'Fitur "Lupa License Key?" — cari key berdasarkan NPSN' },
      { type: 'imp', text: 'Midtrans production — QRIS, transfer bank, e-wallet' },
      { type: 'imp', text: 'Server-side signing Ed25519 — private key tidak pernah keluar server' },
      { type: 'fix', text: 'Data sekolah tidak muncul — rewrite getSchoolInfoWithOfficials multi-strategy' },
      { type: 'fix', text: 'Race condition auto-update & crash di dev mode' },
      { type: 'fix', text: 'Dashboard, Kertas Kerja, Rekonsiliasi, Register Kas — crash & NaN fix' },
      { type: 'imp', text: 'Auto-update: GitHub token terenkripsi via Electron safeStorage' },
    ],
  },
  {
    version: '1.7.2',
    date: '28 April 2026',
    title: 'Hardcoded Removal & Build Fix',
    changes: [
      { type: 'fix', text: 'Semua hardcoded value (TEMANGGUNG, alamat, kode wilayah) dihapus' },
      { type: 'fix', text: 'Data sekolah tidak muncul untuk SLB/TK/RA — fix school lookup' },
      { type: 'fix', text: 'Race condition auto-update & crash di dev mode' },
      { type: 'fix', text: 'Build crash — package.json korupsi di ASAR, tambah asarUnpack workaround' },
      { type: 'imp', text: 'Versi aplikasi dinamis dari package.json — single source of truth' },
    ],
  },
  {
    version: '1.0.0 – 1.7.1',
    date: '2025 – April 2026',
    title: 'Rekap Versi Sebelumnya',
    changes: [
      { type: 'new', text: 'Dashboard statistik real-time, Revenue Chart interaktif, Welcome State' },
      { type: 'new', text: 'Buku Kas Umum, Pembantu Bank/Tunai/Pajak, pencarian & filter' },
      { type: 'new', text: 'BA Rekonsiliasi, Cetak SPTJM, Laporan K7/K7a, Register Kas' },
      { type: 'new', text: 'Realisasi Belanja, Nota Group, Rekonsiliasi Bank' },
      { type: 'new', text: 'Backup & Restore, Export Semua Laporan (multi-sheet Excel)' },
      { type: 'new', text: 'Sistem tema terpusat, custom scrollbar, fade-in animation' },
      { type: 'new', text: 'Auto-updater dengan UI progress, timeout protection, encrypted token' },
      { type: 'new', text: 'Integrasi database ARKAS (SQLCipher) dengan 6 path detection' },
      { type: 'imp', text: 'Password database dipindah ke .env, TLS verification diaktifkan' },
      { type: 'imp', text: 'Standarisasi font tema, centralized theme tokens, Tailwind classes' },
      { type: 'imp', text: 'PDF export font seragam (Times New Roman) di semua laporan' },
      { type: 'imp', text: 'Semua alert() diganti toast notification' },
      { type: 'imp', text: 'Versi dinamis dari package.json, hapus debug handler & dead code' },
      { type: 'fix', text: '60+ bug fix: NaN propagation, crash, double-counting, timezone, filter, dll.' },
    ],
  },
];

const TYPE_META = {
  new: { icon: Sparkles, label: 'Baru', dot: 'bg-blue-500', text: 'text-blue-600', bg: 'bg-blue-50 text-blue-700 border border-blue-100' },
  fix: { icon: CheckCircle, label: 'Perbaikan', dot: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
  imp: { icon: ArrowRight, label: 'Peningkatan', dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50 text-amber-700 border border-amber-100' },
  brk: { icon: Bug, label: 'Breaking', dot: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50 text-red-700 border border-red-100' },
  sec: { icon: CheckCircle, label: 'Keamanan', dot: 'bg-violet-500', text: 'text-violet-600', bg: 'bg-violet-50 text-violet-700 border border-violet-100' },
};

const FILTER_OPTIONS = [
  { key: 'all', label: 'Semua' },
  { key: 'new', label: 'Baru' },
  { key: 'fix', label: 'Perbaikan' },
  { key: 'imp', label: 'Peningkatan' },
];

const TOTAL = CHANGELOG.reduce((s, r) => s + r.changes.length, 0);
const COUNTS = {};
CHANGELOG.forEach((r) => r.changes.forEach((c) => { COUNTS[c.type] = (COUNTS[c.type] || 0) + 1; }));

export default function About() {
  const [appVersion] = useState(__APP_VERSION__);
  const [expanded, setExpanded] = useState({ 0: true });
  const [filter, setFilter] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const toggle = (i) => setExpanded((p) => ({ ...p, [i]: !p[i] }));
  const VISIBLE_COUNT = 3;
  const filtered = useMemo(() => {
    if (filter === 'all') return CHANGELOG;
    return CHANGELOG.map((r) => ({ ...r, changes: r.changes.filter((c) => c.type === filter) })).filter((r) => r.changes.length > 0);
  }, [filter]);
  const displayed = showAll ? filtered : filtered.slice(0, VISIBLE_COUNT);
  const hasMore = !showAll && filtered.length > VISIBLE_COUNT;

  return (
    <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 shadow-lg shadow-blue-500/20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-12 -right-12 w-72 h-72 bg-white/10 rounded-full animate-pulse" />
          <div className="absolute top-1/2 -left-20 w-56 h-56 bg-white/[0.07] rounded-full animate-pulse" style={{ animationDelay: '1s', animationDuration: '3s' }} />
          <div className="absolute -bottom-8 right-1/3 w-40 h-40 bg-white/[0.05] rounded-full animate-pulse" style={{ animationDelay: '2s', animationDuration: '4s' }} />
          <div className="absolute top-8 left-1/3 w-20 h-20 bg-white/[0.08] rounded-full animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }} />
        </div>
        <div className="relative z-10 px-8 py-10 flex items-center gap-7">
          <div className="w-24 h-24 bg-white rounded-2xl shadow-xl shadow-black/10 flex items-center justify-center shrink-0">
            <img src={new URL('../assets/logo.png', import.meta.url).href} alt="SmartSPJ" className="w-20 h-20 object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">SmartSPJ</h1>
            <p className="text-blue-100 mt-1 text-sm leading-relaxed">Aplikasi Pendamping ARKAS untuk Pengelolaan SPJ BOS</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold text-white tracking-wide">v{appVersion}</span>
              <span className="bg-emerald-500/30 text-emerald-100 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-emerald-400/30">Stable</span>
            </div>
          </div>
          <div className="hidden lg:flex flex-col items-end gap-1.5 text-right shrink-0">
            <span className="text-blue-200/80 text-[10px] font-semibold uppercase tracking-[0.15em]">Dibangun dengan</span>
            <span className="text-white/90 text-xs font-medium">Electron + React + TailwindCSS</span>
            <span className="text-blue-300/60 text-[10px] mt-1"><Heart size={10} className="inline text-rose-400 mx-0.5 -mt-0.5" /> Kevin Doni</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Calendar size={16} className="text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Log Perubahan</h3>
              <p className="text-[11px] text-slate-400">{TOTAL} perubahan di {CHANGELOG.length} versi</p>
            </div>
          </div>
          <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
            {FILTER_OPTIONS.map((opt) => {
              const cnt = opt.key === 'all' ? TOTAL : COUNTS[opt.key] || 0;
              return (
                <button key={opt.key} onClick={() => setFilter(opt.key)} className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${filter === opt.key ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>
                  {opt.label} <span className="ml-0.5 text-[9px] opacity-50">{cnt}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 space-y-3">
          {displayed.map((rel, ri) => {
            const open = expanded[ri];
            const latest = rel.version === CHANGELOG[0].version;
            const nc = rel.changes.filter((c) => c.type === 'new').length;
            const fc = rel.changes.filter((c) => c.type === 'fix').length;
            const ic = rel.changes.filter((c) => c.type === 'imp').length;
            return (
              <div key={`${rel.version}-${ri}`} className={`rounded-xl border transition-all ${latest ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 bg-white'} ${open ? (latest ? 'ring-1 ring-indigo-200' : 'ring-1 ring-slate-200') : ''}`}>
                <button onClick={() => toggle(ri)} className="w-full px-5 py-4 flex items-center justify-between text-left group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="shrink-0 text-center">
                      <div className={`text-lg font-black tracking-tight ${latest ? 'text-indigo-600' : 'text-slate-700'}`}>{rel.version}</div>
                    </div>
                    <div className={`w-px h-10 rounded-full shrink-0 ${latest ? 'bg-indigo-200' : 'bg-slate-200'}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[13px] font-semibold truncate ${latest ? 'text-indigo-800' : 'text-slate-800'}`}>{rel.title}</span>
                        {latest && <span className="shrink-0 px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-bold rounded-full uppercase tracking-wider">Latest</span>}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">{rel.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-1.5">
                      {nc > 0 && <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">+{nc} Baru</span>}
                      {fc > 0 && <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">~{fc} Fix</span>}
                      {ic > 0 && <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">&#8593;{ic} Improve</span>}
                    </div>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${latest ? 'bg-indigo-100 text-indigo-500' : 'bg-slate-100 text-slate-400'}`}>
                      <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </button>

                {open && rel.changes.length > 0 && (
                  <div className="px-5 pb-5 pt-1">
                    <div className="space-y-1">
                      {rel.changes.map((ch, ci) => {
                        const meta = TYPE_META[ch.type] || TYPE_META['new'];
                        return (
                          <div key={ci} className="flex items-start gap-3 py-2 px-3 -mx-1 rounded-lg hover:bg-slate-50/80 transition-colors">
                            <span className={`mt-px shrink-0 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${meta.bg}`}>{meta.label}</span>
                            <span className="text-[11px] text-slate-600 leading-relaxed">{ch.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {hasMore && (
          <div className="px-4 pb-4">
            <button onClick={() => setShowAll(true)} className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-slate-400 hover:text-slate-600 hover:border-slate-400 transition-colors">
              Tampilkan semua ({filtered.length - VISIBLE_COUNT} versi lainnya)
            </button>
          </div>
        )}
      </div>

      <div className="text-center pb-4">
        <p className="text-[10px] text-slate-300">&copy; {new Date().getFullYear()} Kevin Doni &middot; Terintegrasi dengan ARKAS (SQLCipher)</p>
      </div>
    </div>
  );
}
