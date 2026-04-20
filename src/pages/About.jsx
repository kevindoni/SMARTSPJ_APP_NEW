import { useState, useEffect, useMemo } from 'react';
import { Heart, Calendar, ChevronDown, Sparkles, CheckCircle, ArrowRight, Bug } from 'lucide-react';

const CHANGELOG = [
  {
    version: '1.7.1',
    date: '21 April 2026',
    title: 'Fix SiLPA & Filter Sumber Dana Dashboard',
    changes: [
      {
        type: 'fix',
        text: "SiLPA di-exclude dari penerimaan — hapus NOT LIKE '%silpa%' di chartQueries, statsQueries, dashboardHandler (selisih Rp 248.907 hilang dari saldo)",
      },
      {
        type: 'fix',
        text: 'Widget Sumber Dana tidak terfilter — getRingkasanSumberDana sekarang menerima fundSource dan memfilter query',
      },
      {
        type: 'imp',
        text: 'Standarisasi font tema — hapus redundant font-sans di 13 komponen, unified print font (Times New Roman)',
      },
      {
        type: 'imp',
        text: 'Centralized theme tokens — gradient, row highlight, print font tokens di theme/index.js',
      },
      {
        type: 'imp',
        text: 'Inline hardcoded colors → Tailwind classes — About.jsx, SmartReconciliationTable',
      },
      {
        type: 'imp',
        text: 'Table thead background seragam — bg-[#fcfdff] diganti bg-slate-50 di TransactionTable & TaxTransactionTable',
      },
      {
        type: 'imp',
        text: 'Custom scrollbar consolidated — hapus duplicate <style> di RealisasiBelanja, global index.css pakai theme() colors',
      },
      {
        type: 'imp',
        text: 'PDF export font seragam — Register Kas, SPTJM, Laporan K7, Receipt Preview semua pakai Times',
      },
      {
        type: 'imp',
        text: 'Closing text ukuran seragam — text-xs di semua varian (BKU, Tunai, Bank, Pajak)',
      },
      {
        type: 'imp',
        text: 'Hapus dead primary color tokens dari tailwind.config.js — tidak pernah digunakan',
      },
      {
        type: 'imp',
        text: 'SmartReconciliationTable highlight rows — Tailwind class + inline style dual-layer untuk border-collapse',
      },
      {
        type: 'fix',
        text: 'Saldo Tunai Reguler tidak akurat — BPU double-count sebagai setorTunai dan bpuExpense',
      },
    ],
  },
  {
    version: '1.7.0',
    date: '19 April 2026',
    title: 'Dashboard Redesign & Auto-Updater Fix',
    changes: [
      {
        type: 'new',
        text: 'Dashboard Welcome State — tampilan panduan saat belum ada data sekolah',
      },
      { type: 'new', text: 'Auto-check update otomatis 5 detik setelah app buka' },
      {
        type: 'new',
        text: 'Updater UI lengkap — progress, error feedback, retry, install & restart',
      },
      { type: 'new', text: 'Custom scrollbar & fade-in animation di seluruh dashboard' },
      {
        type: 'imp',
        text: 'Deteksi path database ARKAS — dukung 6 lokasi (Roaming/Local, case-sensitive)',
      },
      { type: 'imp', text: 'Guard window.arkas — aplikasi tidak crash saat dijalankan di browser' },
      { type: 'imp', text: 'Sidebar, Header, MainLayout konsisten menggunakan isElectron flag' },
      { type: 'imp', text: 'Revenue Chart empty state lebih informatif' },
      {
        type: 'fix',
        text: 'Realisasi Sumber Dana salah 100% — ku.saldo (sisa) diganti ku.kredit (pengeluaran)',
      },
      {
        type: 'fix',
        text: 'Persentase penyerapan dibulatkan ke atas — toFixed(1) dengan cap 100%',
      },
      {
        type: 'fix',
        text: 'Double scroll container — dashboard dan main sama-sama overflow-y-auto',
      },
      { type: 'fix', text: 'Empty state kosong — section tanpa pesan saat data kosong' },
      {
        type: 'fix',
        text: 'Event listener leak — updater listeners tidak di-cleanup saat unmount',
      },
      { type: 'fix', text: 'setupAutoUpdater jalan di dev mode — menyebabkan error' },
      { type: 'fix', text: 'Fallback versi hardcoded diganti dinamis dari CHANGELOG' },
    ],
  },
  {
    version: '1.6.0',
    date: '17 April 2026',
    title: 'Stabilisasi & Perbaikan Komprehensif',
    changes: [
      { type: 'new', text: 'Data pejabat dari app_config — koreg, kepala dinas, manager BOS, BUD' },
      {
        type: 'new',
        text: 'NPSN dari kode_instansi — identitas sekolah lengkap tanpa mst_sekolah',
      },
      {
        type: 'new',
        text: 'Sistem tema terpusat — konsistensi tampilan warna di seluruh aplikasi',
      },
      {
        type: 'new',
        text: 'Revenue Chart interaktif — garis Saldo Akhir, tooltip, klik navigasi ke BKU',
      },
      { type: 'new', text: 'Halaman Backup & Restore — backup data + backup lengkap folder data/' },
      { type: 'new', text: 'Export Semua Laporan — satu file Excel multi-sheet' },
      { type: 'imp', text: 'Refactor getSchoolInfoWithOfficials() — satu sumber data sekolah' },
      { type: 'imp', text: 'Fix kritis perhitungan Saldo Akhir BA Rekonsiliasi' },
      { type: 'fix', text: 'Data sekolah tidak muncul — fallback ke tabel instansi' },
      { type: 'fix', text: 'Penerimaan Dana duplikat dan Rp 0' },
      { type: 'fix', text: 'Auto-update tidak berfungsi — latest.yml dan blockmap ikut di-upload' },
      { type: 'fix', text: 'Filter Semua Bulan double-counting saldo' },
      { type: 'fix', text: 'Export BKU Pajak nominal kosong' },
      { type: 'fix', text: 'Buku Pembantu Bank salah filter pergeseran uang' },
      { type: 'fix', text: 'Pengaturan gagal menyimpan ENOTDIR' },
      { type: 'fix', text: 'Pergerakan Kas Bulanan saldo selalu Rp 0' },
      { type: 'fix', text: 'Filter sumber dana di Dashboard tidak bekerja' },
      { type: 'fix', text: 'Label PPh 21% menjadi PPh 21' },
    ],
  },
  {
    version: '1.3.0',
    date: '9 April 2026',
    title: 'Dashboard, Export & Pencarian',
    changes: [
      { type: 'new', text: 'Dashboard perbandingan bulan ini vs bulan lalu' },
      { type: 'new', text: 'Tombol Cetak A2 & Cetak Bukti di Nota Gabungan' },
      { type: 'new', text: 'Pencarian di Buku Pembantu Tunai, Bank, Pajak' },
      { type: 'new', text: 'Restore dari file backup (ZIP) dengan preview' },
      { type: 'imp', text: 'Konfirmasi sebelum hapus entri pajak manual' },
      { type: 'fix', text: 'runningBalance is not defined di Buku Pembantu Pajak' },
      { type: 'fix', text: 'Kode Kegiatan kosong di Export Semua Laporan' },
      { type: 'fix', text: 'Export BKU menambahkan Saldo Bulan Lalu palsu' },
    ],
  },
  {
    version: '1.2.0',
    date: '7 April 2026',
    title: 'Security & UI Konsistensi',
    changes: [
      { type: 'imp', text: 'Password database dipindah ke file .env (dotenv)' },
      { type: 'imp', text: 'Aktifkan verifikasi TLS untuk HTTPS request' },
      { type: 'imp', text: 'UI konsistensi — spinner, error state, card border' },
      { type: 'fix', text: 'Cetak A2 field kepala sekolah & bendahara salah' },
      { type: 'fix', text: 'Semua alert() diganti toast notification' },
      { type: 'fix', text: 'Register Kas PDF: Saldo Kas pakai total fisik' },
      { type: 'fix', text: 'Realisasi Belanja: Sisa Anggaran & progress bar konsisten' },
      { type: 'fix', text: 'Laporan K7 timezone bug saat parsing tanggal' },
    ],
  },
  {
    version: '1.1.0',
    date: '7 April 2026',
    title: 'Codebase Cleanup & Stabilisasi',
    changes: [
      { type: 'imp', text: 'Hapus debug handler, dead code, console.log dari production' },
      { type: 'imp', text: 'Hapus export DOCX dari Register Kas (-350KB)' },
      { type: 'fix', text: 'Laporan K7 nama & NIP bendahara hardcoded' },
      { type: 'fix', text: 'Laporan K7 sub-program kosong diberi nama Lain-lain' },
      { type: 'fix', text: 'Realisasi Belanja hapus label New dari header' },
    ],
  },
  {
    version: '1.0.0',
    date: '1 Juli 2025',
    title: 'Initial Release',
    changes: [
      { type: 'new', text: 'Dashboard dengan statistik real-time' },
      { type: 'new', text: 'Buku Kas Umum, Pembantu Bank, Tunai, Pajak' },
      { type: 'new', text: 'BA Rekonsiliasi dengan export PDF & Excel' },
      { type: 'new', text: 'Cetak SPTJM, Laporan K7/K7a, Register Kas' },
      { type: 'new', text: 'Realisasi Belanja, Nota Group, Rekonsiliasi Bank' },
      { type: 'new', text: 'Integrasi database ARKAS (SQLCipher)' },
      { type: 'fix', text: 'Dashboard SISA ANGGARAN = PAGU - REALISASI' },
      { type: 'fix', text: 'Belanja per Kegiatan duplikasi (subquery fix)' },
      { type: 'fix', text: 'PAGU filter BOS Reguler akurat' },
    ],
  },
];

const TYPE_META = {
  new: {
    icon: Sparkles,
    label: 'Baru',
    dot: 'bg-blue-500',
    text: 'text-blue-600',
    bg: 'bg-blue-50 text-blue-700 border border-blue-100',
  },
  fix: {
    icon: CheckCircle,
    label: 'Perbaikan',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600',
    bg: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  },
  imp: {
    icon: ArrowRight,
    label: 'Peningkatan',
    dot: 'bg-amber-500',
    text: 'text-amber-600',
    bg: 'bg-amber-50 text-amber-700 border border-amber-100',
  },
  brk: {
    icon: Bug,
    label: 'Breaking',
    dot: 'bg-red-500',
    text: 'text-red-600',
    bg: 'bg-red-50 text-red-700 border border-red-100',
  },
};

const FILTER_OPTIONS = [
  { key: 'all', label: 'Semua' },
  { key: 'new', label: 'Baru' },
  { key: 'fix', label: 'Perbaikan' },
  { key: 'imp', label: 'Peningkatan' },
];

const TOTAL = CHANGELOG.reduce((s, r) => s + r.changes.length, 0);
const COUNTS = {};
CHANGELOG.forEach((r) =>
  r.changes.forEach((c) => {
    COUNTS[c.type] = (COUNTS[c.type] || 0) + 1;
  })
);

export default function About() {
  const [appVersion, setAppVersion] = useState('...');
  const [expanded, setExpanded] = useState({ 0: true });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (window.arkas?.getAppVersion) {
      window.arkas
        .getAppVersion()
        .then((v) => setAppVersion(v.appVersion))
        .catch(() => setAppVersion(CHANGELOG[0].version));
    } else {
      setAppVersion(CHANGELOG[0].version);
    }
  }, []);
  const toggle = (i) => setExpanded((p) => ({ ...p, [i]: !p[i] }));
  const filtered = useMemo(() => {
    if (filter === 'all') return CHANGELOG;
    return CHANGELOG.map((r) => ({
      ...r,
      changes: r.changes.filter((c) => c.type === filter),
    })).filter((r) => r.changes.length > 0);
  }, [filter]);

  return (
    <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 shadow-lg shadow-blue-500/20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-12 -right-12 w-72 h-72 bg-white/10 rounded-full animate-pulse" />
          <div
            className="absolute top-1/2 -left-20 w-56 h-56 bg-white/[0.07] rounded-full animate-pulse"
            style={{ animationDelay: '1s', animationDuration: '3s' }}
          />
          <div
            className="absolute -bottom-8 right-1/3 w-40 h-40 bg-white/[0.05] rounded-full animate-pulse"
            style={{ animationDelay: '2s', animationDuration: '4s' }}
          />
          <div
            className="absolute top-8 left-1/3 w-20 h-20 bg-white/[0.08] rounded-full animate-pulse"
            style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}
          />
        </div>
        <div className="relative z-10 px-8 py-10 flex items-center gap-7">
          <div className="w-24 h-24 bg-white rounded-2xl shadow-xl shadow-black/10 flex items-center justify-center shrink-0">
            <img
              src={new URL('../assets/logo.png', import.meta.url).href}
              alt="SmartSPJ"
              className="w-20 h-20 object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">SmartSPJ</h1>
            <p className="text-blue-100 mt-1 text-sm leading-relaxed">
              Aplikasi Pendamping ARKAS untuk Pengelolaan SPJ BOS
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold text-white tracking-wide">
                v{appVersion}
              </span>
              <span className="bg-emerald-500/30 text-emerald-100 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-emerald-400/30">
                Stable
              </span>
            </div>
          </div>
          <div className="hidden lg:flex flex-col items-end gap-1.5 text-right shrink-0">
            <span className="text-blue-200/80 text-[10px] font-semibold uppercase tracking-[0.15em]">
              Dibangun dengan
            </span>
            <span className="text-white/90 text-xs font-medium">
              Electron + React + TailwindCSS
            </span>
            <span className="text-blue-300/60 text-[10px] mt-1">
              <Heart size={10} className="inline text-rose-400 mx-0.5 -mt-0.5" /> Kevin Doni
            </span>
          </div>
        </div>
      </div>

      {/* Changelog */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Calendar size={16} className="text-indigo-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Log Perubahan</h3>
              <p className="text-[11px] text-slate-400">
                {TOTAL} perubahan di {CHANGELOG.length} versi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
            {FILTER_OPTIONS.map((opt) => {
              const cnt = opt.key === 'all' ? TOTAL : COUNTS[opt.key] || 0;
              return (
                <button
                  key={opt.key}
                  onClick={() => setFilter(opt.key)}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all ${filter === opt.key ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {opt.label} <span className="ml-0.5 text-[9px] opacity-50">{cnt}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 space-y-3">
          {filtered.map((rel, ri) => {
            const open = expanded[ri];
            const latest = rel.version === CHANGELOG[0].version;
            const nc = rel.changes.filter((c) => c.type === 'new').length;
            const fc = rel.changes.filter((c) => c.type === 'fix').length;
            const ic = rel.changes.filter((c) => c.type === 'imp').length;
            return (
              <div
                key={`${rel.version}-${ri}`}
                className={`rounded-xl border transition-all ${latest ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200 bg-white'} ${open ? (latest ? 'ring-1 ring-indigo-200' : 'ring-1 ring-slate-200') : ''}`}
              >
                <button
                  onClick={() => toggle(ri)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="shrink-0 text-center">
                      <div
                        className={`text-lg font-black tracking-tight ${latest ? 'text-indigo-600' : 'text-slate-700'}`}
                      >
                        {rel.version}
                      </div>
                    </div>
                    <div
                      className={`w-px h-10 rounded-full shrink-0 ${latest ? 'bg-indigo-200' : 'bg-slate-200'}`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[13px] font-semibold truncate ${latest ? 'text-indigo-800' : 'text-slate-800'}`}
                        >
                          {rel.title}
                        </span>
                        {latest && (
                          <span className="shrink-0 px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-bold rounded-full uppercase tracking-wider">
                            Latest
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">{rel.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex items-center gap-1.5">
                      {nc > 0 && (
                        <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                          +{nc} Baru
                        </span>
                      )}
                      {fc > 0 && (
                        <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                          ~{fc} Fix
                        </span>
                      )}
                      {ic > 0 && (
                        <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                          &#8593;{ic} Improve
                        </span>
                      )}
                    </div>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${latest ? 'bg-indigo-100 text-indigo-500' : 'bg-slate-100 text-slate-400'}`}
                    >
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>
                </button>

                {open && rel.changes.length > 0 && (
                  <div className="px-5 pb-5 pt-1">
                    <div className="space-y-1">
                      {rel.changes.map((ch, ci) => {
                        const meta = TYPE_META[ch.type] || TYPE_META['new'];
                        return (
                          <div
                            key={ci}
                            className="flex items-start gap-3 py-2 px-3 -mx-1 rounded-lg hover:bg-slate-50/80 transition-colors"
                          >
                            <span
                              className={`mt-px shrink-0 text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${meta.bg}`}
                            >
                              {meta.label}
                            </span>
                            <span className="text-[11px] text-slate-600 leading-relaxed">
                              {ch.text}
                            </span>
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
      </div>

      <div className="text-center pb-4">
        <p className="text-[10px] text-slate-300">
          &copy; {new Date().getFullYear()} Kevin Doni &middot; Terintegrasi dengan ARKAS
          (SQLCipher)
        </p>
      </div>
    </div>
  );
}
