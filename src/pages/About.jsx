import { useState, useEffect } from 'react';
import {
  Info,
  Sparkles,
  Heart,
  Code,
  Calendar,
  Bug,
  CheckCircle,
  ArrowRight,
  Shield,
  Zap,
  Database,
  Monitor,
  ChevronDown,
} from 'lucide-react';

const CHANGELOG = [
  {
    version: '1.5.13',
    date: '17 April 2026',
    title: 'Fix Data Sekolah Tidak Muncul',
    changes: [
      { type: 'fix', text: 'Data sekolah tidak muncul — fallback ke tabel instansi ketika mst_sekolah kosong' },
      { type: 'fix', text: 'NPSN dari kode_instansi — untuk sekolah, kode_instansi = NPSN' },
      { type: 'feature', text: 'Data pejabat dari app_config — koreg, kepala dinas, manager BOS, BUD' },
      { type: 'improvement', text: 'Refactor semua handler export pakai getSchoolInfoWithOfficials() — satu sumber data sekolah' },
      { type: 'fix', text: 'Fix auto-update — file latest.yml sekarang ikut di-upload ke GitHub release' },
    ],
  },
  {
    version: '1.5.12',
    date: '17 April 2026',
    title: 'Fix Crash initSignatoryStorage',
    changes: [
      { type: 'fix', text: 'Fix crash initSignatoryStorage is not defined — fungsi tidak pernah ditambahkan ke body file' },
      { type: 'fix', text: 'Fix label PPh 21% menjadi PPh 21 di ReceiptPreviewModal dan export' },
    ],
  },
  {
    version: '1.5.11',
    date: '17 April 2026',
    title: 'Fix Auto-Update Token Expired',
    changes: [
      { type: 'fix', text: 'Auto-update tidak berfungsi karena token GitHub expired — token sekarang dibaca dari updater.json' },
    ],
  },
  {
    version: '1.5.10',
    date: '17 April 2026',
    title: 'Fix Pengaturan ENOTDIR',
    changes: [
      { type: 'fix', text: 'Pengaturan gagal menyimpan ENOTDIR — path resolution fix di reconciliationHandler' },
    ],
  },
  {
    version: '1.5.9',
    date: '17 April 2026',
    title: 'Fix Export Pajak Manual Taxes',
    changes: [
      { type: 'fix', text: 'Manual taxes tidak muncul di export — backend sekarang langsung fetch dan merge dari manual_taxes.json' },
    ],
  },
  {
    version: '1.5.8',
    date: '17 April 2026',
    title: 'Fix Export BKU Pajak Nominal Kosong',
    changes: [
      { type: 'fix', text: 'Export BKU Pajak nominal kosong (semua 0) — frontend perlu kirim field mentah yang dibutuhkan getTaxComponentsForExport()' },
    ],
  },
  {
    version: '1.5.7',
    date: '17 April 2026',
    title: 'Fix Modal Pajak & Export Manual Taxes',
    changes: [
      { type: 'fix', text: 'Modal Input Pajak Manual tidak responsive — ditambah overflow-y-auto dan max-height' },
      { type: 'fix', text: 'Export manual taxes tidak ikut — frontend kirim data lengkap ke backend' },
    ],
  },
  {
    version: '1.5.6',
    date: '17 April 2026',
    title: 'Fix Buku Pembantu Bank Filter',
    changes: [
      { type: 'fix', text: 'Buku Pembantu Bank salah karena Pergeseran Uang ke Bank/Tunai lolos filter — ditambahkan ke exclusion list' },
    ],
  },
  {
    version: '1.5.5',
    date: '17 April 2026',
    title: 'Fix Filter Semua Bulan Double-Counting',
    changes: [
      { type: 'fix', text: 'Filter Semua Bulan double-counting saldo bulanan — ditambah displayData memo di TransactionList, BankReportList, CashReportList' },
    ],
  },
  {
    version: '1.5.4',
    date: '17 April 2026',
    title: 'Fix Compile Bytecode utils/terbilang',
    changes: [
      { type: 'fix', text: 'utils/terbilang tidak ikut compiled — compile-bytecode.js perlu include folder utils' },
    ],
  },

  {
    version: '1.4.1',
    date: '14 April 2026',
    title: 'BA Rekonsiliasi Overhaul & Dashboard Filter Fix',
    changes: [
      {
        type: 'fix',
        text: 'Fix kritis perhitungan Saldo Akhir BA Rekonsiliasi — running balance sumber dana tidak lagi di-overwrite oleh saldo awal kosong',
      },
      {
        type: 'fix',
        text: 'Fix label sekolah hardcode di PDF export BA Rekonsiliasi — kini ditampilkan secara dinamis sesuai data sekolah',
      },
      {
        type: 'fix',
        text: 'Fix klasifikasi belanja Modal Mesin agar tepat terdeteksi pada semua sumber dana',
      },
      {
        type: 'fix',
        text: 'Fix deteksi Penerimaan & Pengeluaran Kinerja — klasifikasi kini menggunakan join anggaran untuk akurasi',
      },
      {
        type: 'fix',
        text: 'Fix perhitungan saldo akhir Dana Lainnya — penerimaan kini diperhitungkan dengan benar',
      },
      {
        type: 'fix',
        text: 'Fix label Penerimaan Kinerja di Dashboard — menampilkan label sumber dana yang sesuai',
      },
      {
        type: 'feature',
        text: 'Tambah baris Saldo Awal BOSP Kinerja tahun berjalan di Lembar BA semua format export',
      },
      {
        type: 'feature',
        text: 'Sistem tema terpusat — konsistensi tampilan warna di seluruh aplikasi',
      },
      {
        type: 'feature',
        text: 'Peningkatan tampilan tabel rincian sumber dana — lebih rapi dan informatif',
      },
      {
        type: 'improvement',
        text: 'Hapus baris penerimaan yang tidak akurat dari tabel BA Rekonsiliasi',
      },
      { type: 'improvement', text: 'Hapus tombol Audit BKU dari halaman BA Rekonsiliasi' },
      { type: 'improvement', text: 'Perbaikan sinkronisasi status cetak antar komponen' },
      {
        type: 'fix',
        text: 'Fix perhitungan closing total — komponen tunai dari semua sumber dana kini diperhitungkan dengan benar',
      },
      {
        type: 'fix',
        text: 'Fix kolom Selisih di Rekap Saldo Bulanan — kini menampilkan selisih bunga bank dikurangi biaya admin',
      },
      { type: 'feature', text: 'Tambah kolom Kinerja di section Saldo Awal Rekap Saldo Bulanan' },
      {
        type: 'improvement',
        text: 'Rapikan label tabel Lembar BA — konsistensi nama di semua format (HTML, Excel, PDF)',
      },
      {
        type: 'improvement',
        text: 'Perbaikan kolom nomor urut di Rekap Saldo Bulanan untuk baris Triwulan dan Semester',
      },
      {
        type: 'improvement',
        text: 'Hapus kolom placeholder di Rekap Saldo Bulanan — semua kolom kini menampilkan data nyata',
      },
      {
        type: 'fix',
        text: 'Fix Pergerakan Kas Bulanan — saldo tidak lagi selalu Rp 0, kini dihitung dengan saldo awal + running balance di backend',
      },
      {
        type: 'fix',
        text: 'Fix klasifikasi debit/kredit di Pergerakan Kas — mengikuti reconciliation handler (BBU = masuk, BNU/BPU = keluar)',
      },
      {
        type: 'fix',
        text: 'Fix filter sumber dana di Dashboard — Belanja Kategori, Top 5, Kegiatan, Penerimaan, Pengeluaran kini terfilter per sumber dana',
      },
      {
        type: 'fix',
        text: 'Fix Pagu Belanja Kategori terhitung berulang — filter revisi terakhir per sumber dana agar tidak double count',
      },
      {
        type: 'fix',
        text: 'Fix ITEM RAPBS dan Kegiatan count — kini menampilkan jumlah yang benar per sumber dana',
      },
      {
        type: 'fix',
        text: 'Fix Penerimaan BOS Kinerja Rp 0 di header dashboard — gunakan anggaranScope untuk filter akurat',
      },
      {
        type: 'feature',
        text: 'Saldo kas negatif ditampilkan dengan warna merah di Pergerakan Kas Bulanan',
      },
    ],
  },
  {
    version: '1.3.0',
    date: '9 April 2026',
    title: 'Backup & Restore, Dashboard, Export',
    changes: [
      {
        type: 'feature',
        text: 'Halaman Backup & Restore — backup data (6 JSON + localStorage) dan backup lengkap (seluruh folder data/)',
      },
      { type: 'feature', text: 'Restore dari file backup (ZIP) dengan preview sebelum restore' },
      {
        type: 'feature',
        text: 'Export Semua Laporan — satu file Excel multi-sheet (BKU Umum, Tunai, Bank, Pajak)',
      },
      {
        type: 'feature',
        text: 'Dashboard: perbandingan bulan ini vs bulan lalu di kartu statistik',
      },
      {
        type: 'feature',
        text: 'Revenue Chart interaktif — garis Saldo Akhir, tooltip detail, klik navigasi ke BKU',
      },
      { type: 'feature', text: 'Tombol Cetak A2 & Cetak Bukti di tab Nota Gabungan' },
      {
        type: 'feature',
        text: 'Auto-disable tombol cetak setelah digunakan + tombol Reset Cetak (Nota Gabungan & Cetak Manual)',
      },
      { type: 'feature', text: 'Pencarian (search) di Buku Pembantu Tunai, Bank, dan Pajak' },
      { type: 'improvement', text: 'Konfirmasi sebelum hapus entri pajak manual (Ya/Batal)' },
      {
        type: 'improvement',
        text: 'Seragamkan warna dan style tombol Cetak A2, Cetak Bukti, Reset Cetak',
      },
      { type: 'fix', text: 'Fix runningBalance is not defined di Buku Pembantu Pajak' },
      {
        type: 'fix',
        text: 'Fix Kode Kegiatan kosong di Export Semua Laporan (activity_code mapping)',
      },
      {
        type: 'fix',
        text: 'Fix Export BKU Bank/Tunai/Pajak: tidak lagi menambahkan Saldo Bulan Lalu palsu',
      },
      { type: 'improvement', text: 'Dokumentasi lengkap 10 bab untuk panduan pengguna' },
    ],
  },

  {
    version: '1.2.0',
    date: '7 April 2026',
    title: 'Security, Bug Fixes & UI Konsistensi',
    changes: [
      {
        type: 'fix',
        text: 'Cetak A2: field nama kepala sekolah & bendahara salah (selalu tampil placeholder kosong)',
      },
      {
        type: 'improvement',
        text: 'Password database dipindah dari source code ke file .env (dotenv)',
      },
      { type: 'improvement', text: 'Hapus sisa debug API (debugTaxSchema) dari preload.js' },
      { type: 'fix', text: 'Ganti semua alert() dengan toast notification' },
      {
        type: 'fix',
        text: 'Register Kas PDF: Saldo Kas (B) sekarang pakai total fisik, bukan saldo buku',
      },
      { type: 'fix', text: 'Realisasi Belanja: Sisa Anggaran & progress bar kini konsisten' },
      {
        type: 'fix',
        text: 'Laporan K7: grand total dihitung dari sum kolom (konsisten dengan data tabel)',
      },
      { type: 'fix', text: 'Laporan K7 & SPTJM: fix timezone bug saat parsing tanggal' },
      { type: 'improvement', text: 'Aktifkan verifikasi TLS untuk request HTTPS (scrapeHandler)' },
      { type: 'improvement', text: 'Error handling: fix 4 empty catch block' },
      { type: 'improvement', text: 'Register Kas handler: path data directory kini dinamis' },
      { type: 'improvement', text: 'Refactor formatDateIndonesian ke shared utility' },
      { type: 'improvement', text: 'UI: migrasi green ke emerald untuk status indicator' },
      {
        type: 'improvement',
        text: 'UI: konsistensi spinner, error state, card border, root container',
      },
      { type: 'improvement', text: 'Hapus tombol Print berlebih di SPTJM' },
    ],
  },
  {
    version: '1.1.0',
    date: '7 April 2026',
    title: 'Codebase Cleanup & Stabilisasi',
    changes: [
      { type: 'improvement', text: 'Hapus debug handler arkas:debug-tax-schema' },
      { type: 'fix', text: 'Laporan K7: nama bendahara hardcoded diganti placeholder dinamis' },
      { type: 'fix', text: 'Laporan K7: NIP bendahara kini dibaca dari data sekolah' },
      { type: 'fix', text: 'Laporan K7: sub-program kosong diberi nama Lain-lain' },
      { type: 'improvement', text: 'Bersihkan 8 console.log dari production code' },
      { type: 'fix', text: 'Realisasi Belanja: hapus label New dari header' },
      {
        type: 'improvement',
        text: 'Hapus dead code: placeholder tab reports, orphaned control view',
      },
      { type: 'improvement', text: 'Hapus export DOCX dari Register Kas (bundle -350KB)' },
    ],
  },
  {
    version: '1.0.0',
    date: '1 Juli 2025',
    title: 'Initial Release',
    changes: [
      { type: 'feature', text: 'Dashboard dengan statistik real-time' },
      { type: 'feature', text: 'Buku Kas Umum, Pembantu Bank, Tunai, Pajak' },
      { type: 'feature', text: 'BA Rekonsiliasi dengan export PDF & Excel' },
      { type: 'feature', text: 'Cetak SPTJM, Laporan K7/K7a' },
      { type: 'feature', text: 'Register Kas dengan filter tahun' },
      { type: 'feature', text: 'Cetak A2 (Kwitansi) & Bukti Pengeluaran' },
      { type: 'feature', text: 'Realisasi Belanja per kegiatan' },
      { type: 'feature', text: 'Nota Group Manager' },
      { type: 'feature', text: 'Rekonsiliasi Bank' },
      { type: 'feature', text: 'Pengaturan pejabat sekolah' },
      { type: 'feature', text: 'Integrasi database ARKAS (SQLCipher)' },
      { type: 'fix', text: 'Dashboard SISA ANGGARAN = PAGU - REALISASI' },
      { type: 'fix', text: 'Belanja per Kegiatan tidak duplikasi (subquery fix)' },
      { type: 'fix', text: 'PAGU filter BOS Reguler akurat' },
      { type: 'fix', text: 'getTransactionsByIds menggunakan k.saldo bukan kn.total' },
      { type: 'fix', text: 'K7 saldo awal tahap 2 fix' },
      { type: 'fix', text: 'K7 header tabel Jumlah column fix' },
      { type: 'fix', text: 'Cetak A2 pajak dari database' },
      { type: 'fix', text: 'Cetak Bukti signature layout fix' },
    ],
  },
];
const TYPE_CONFIG = {
  feature: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Sparkles, label: 'New' },
  fix: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle, label: 'Fix' },
  improvement: { bg: 'bg-amber-50', text: 'text-amber-700', icon: ArrowRight, label: 'Improved' },
  breaking: { bg: 'bg-red-50', text: 'text-red-700', icon: Bug, label: 'Breaking' },
};

const TECH_STACK = [
  { icon: Monitor, label: 'Electron', desc: 'Desktop App', color: 'text-blue-600' },
  { icon: Code, label: 'React', desc: 'UI Library', color: 'text-cyan-600' },
  { icon: Database, label: 'SQLCipher', desc: 'Encrypted DB', color: 'text-indigo-600' },
  { icon: Shield, label: 'dotenv', desc: 'Secure Config', color: 'text-emerald-600' },
  { icon: Zap, label: 'Vite', desc: 'Build Tool', color: 'text-purple-600' },
];

export default function About() {
  const [appVersion, setAppVersion] = useState('...');
  const [expandedVersions, setExpandedVersions] = useState({ 0: true });

  useEffect(() => {
    const loadVersion = async () => {
      try {
        if (window.arkas?.getAppVersion) {
          const v = await window.arkas.getAppVersion();
          setAppVersion(v.appVersion);
        } else {
          setAppVersion('1.3.0');
        }
      } catch {
        setAppVersion('1.3.0');
      }
    };
    loadVersion();
  }, []);

  const toggleVersion = (idx) => {
    setExpandedVersions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
          <Info size={20} />
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            INFORMASI
          </span>
          <h2 className="text-lg font-bold text-slate-800">Tentang Aplikasi</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Hero */}
            <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-700 px-8 py-10 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full -mr-40 -mt-40" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-white rounded-full -ml-30 -mb-30" />
              </div>
              <div className="relative z-10 flex items-center gap-8">
                <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center shadow-2xl shadow-black/20 flex-shrink-0">
                  <img src={new URL('../assets/logo.png', import.meta.url).href} alt="SmartSPJ" className="w-24 h-24 object-contain" />
                </div>
                <div>
                  <h1 className="text-4xl font-black tracking-tight">SmartSPJ</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-bold">
                      v{appVersion}
                    </span>
                    <span className="bg-emerald-400/20 backdrop-blur-sm text-emerald-100 px-3 py-1 rounded-lg text-xs font-bold border border-emerald-300/30">
                      Stable
                    </span>
                  </div>
                  <p className="text-blue-100 mt-3 text-base leading-relaxed max-w-md">
                    Aplikasi Pendamping ARKAS untuk Pengelolaan SPJ BOS
                  </p>
                </div>
              </div>
            </div>
            {/* Tech Stack */}
            <div className="p-6 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                Teknologi
              </p>
              <div className="grid grid-cols-5 gap-3">
                {TECH_STACK.map((tech) => {
                  const IconComp = tech.icon;
                  return (
                    <div
                      key={tech.label}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <IconComp size={18} className={tech.color} />
                      <span className="text-xs font-bold text-slate-700">{tech.label}</span>
                      <span className="text-[9px] text-slate-400">{tech.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50/50">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Terintegrasi dengan ARKAS (Database SQLCipher)</span>
                <span>© {new Date().getFullYear()} Kevin Doni</span>
              </div>
            </div>
          </div>
        </div>
        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Developer */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex-1">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-200/50">
                <Code size={32} className="text-white" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg mt-5">KEVIN DONI</h3>
              <p className="text-sm text-slate-500 mt-0.5">Developer</p>
              <div className="mt-5 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dibangun dengan <Heart size={11} className="inline text-red-400 mx-0.5 -mt-0.5" />{' '}
                  menggunakan Electron + React + TailwindCSS
                </p>
              </div>
            </div>
          </div>
          {/* Stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Ringkasan
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Total Versi</span>
                <span className="text-sm font-bold text-slate-800">{CHANGELOG.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Total Perubahan</span>
                <span className="text-sm font-bold text-slate-800">
                  {CHANGELOG.reduce((s, r) => s + r.changes.length, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Versi Terbaru</span>
                <span className="text-sm font-bold text-indigo-600">v{CHANGELOG[0].version}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Changelog */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar size={18} className="text-indigo-500" />
            Log Perubahan
          </h3>
          <p className="text-xs text-slate-400 mt-1">Riwayat semua perubahan pada aplikasi</p>
        </div>
        <div className="divide-y divide-slate-100">
          {CHANGELOG.map((release, ri) => {
            const isOpen = expandedVersions[ri];
            return (
              <div key={ri}>
                <button
                  onClick={() => toggleVersion(ri)}
                  className="w-full p-5 flex items-center justify-between hover:bg-slate-50/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border ${ri === 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}
                    >
                      <span
                        className={`text-xs font-black ${ri === 0 ? 'text-indigo-600' : 'text-slate-500'}`}
                      >
                        {release.version.split('.').pop()}
                      </span>
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800 text-sm">v{release.version}</h4>
                        {ri === 0 && (
                          <span className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-bold rounded-md uppercase tracking-wider">
                            Latest
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {release.title} &middot; {release.date}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 ml-[52px] space-y-1.5">
                    {release.changes.map((change, i) => {
                      const config = TYPE_CONFIG[change.type] || TYPE_CONFIG.feature;
                      const TypeIcon = config.icon;
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <div className={`mt-1 p-0.5 rounded ${config.bg} flex-shrink-0`}>
                            <TypeIcon size={9} className={config.text} />
                          </div>
                          <p className="text-[12px] text-slate-600 leading-snug">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider ${config.text}`}
                            >
                              {config.label}
                            </span>{' '}
                            {change.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>{' '}
    </div>
  );
}
