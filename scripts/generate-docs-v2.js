const fs = require('fs');
const path = require('path');

const outputPath = path.join(
  'D:',
  'laragon',
  'www',
  'arkas',
  'SmartSPJ',
  'docs',
  'PANDUAN_LENGKAP.md'
);

const lines = [];

function L(text) {
  lines.push(text);
}
function blank() {
  lines.push('');
}
function h1(text) {
  L('## ' + text);
  blank();
}
function h2(text) {
  L('### ' + text);
  blank();
}
function h3(text) {
  L('#### ' + text);
  blank();
}
function h4(text) {
  L('##### ' + text);
  blank();
}
function bullet(text) {
  L('- ' + text);
}
function bold(text) {
  return '**' + text + '**';
}
function code(text) {
  return '`' + text + '`';
}
function italic(text) {
  return '*' + text + '*';
}
function tableHeader(...cols) {
  L('| ' + cols.join(' | ') + ' |');
  L('| ' + cols.map(() => '---').join(' | ') + ' |');
}
function tableRow(...cols) {
  L('| ' + cols.join(' | ') + ' |');
}
function hr() {
  L('---');
  blank();
}

// ====== HEADER ======
L('# Panduan Lengkap SmartSPJ v2');
L('## Aplikasi Pendamping ARKAS untuk Pengelolaan SPJ BOS');
blank();
L('> Versi 2.0.0 | Terakhir diperbarui: 8 April 2026 | Pengembang: Kevin Doni');
blank();
L(
  '*Dokumentasi lengkap hasil audit komprehensif — mencakup setiap fitur, tombol, dan alur kerja.*'
);
blank();
hr();

// ====== DAFTAR ISI ======
h1('Daftar Isi');
L('1. Pendahuluan');
L('2. Instalasi & Persyaratan');
L('3. Mengenal Antarmuka');
L('4. Dashboard & Informasi Sekolah');
L('5. Penganggaran (RKAS + Realisasi Belanja)');
L('6. Penatausahaan (BKU Umum, Tunai, Bank, Pajak, Bukti Transaksi)');
L('7. Laporan (BA Rekonsiliasi, Rekonsiliasi Bank, SPTJM, K7/K7a, Register Kas)');
L('8. Fitur Lainnya (Backup & Restore, Pengaturan)');
L('9. Alur Kerja SPJ Lengkap');
L('10. FAQ & Pemecahan Masalah');
blank();
hr();

// ====== SECTION 1: PENDAHULUAN ======
h1('1. Pendahuluan');

h2('Apa itu SmartSPJ?');
L(
  'SmartSPJ adalah aplikasi desktop berbasis ' +
    bold('Electron.js') +
    ' yang berfungsi sebagai pendamping ' +
    bold('ARKAS') +
    ' (Administrasi Keuangan Sekolah) untuk membantu para bendahara sekolah di Indonesia dalam menyusun ' +
    bold('Surat Pertanggungjawaban (SPJ)') +
    ' dana ' +
    bold('Bantuan Operasional Sekolah (BOS)') +
    '.'
);
blank();
L('Aplikasi ini dibangun menggunakan:');
bullet('Electron sebagai runtime desktop');
bullet('React.js dengan JSX untuk antarmuka pengguna');
bullet('Tailwind CSS untuk styling');
bullet('SQLCipher untuk membaca database terenkripsi ARKAS');
bullet('jsPDF + autoTable untuk pembuatan dokumen PDF');
bullet('ExcelJS untuk pembuatan dokumen Excel');
bullet('Lucide React untuk ikon antarmuka');
blank();

h2('Hubungan SmartSPJ dengan ARKAS');
L(
  'SmartSPJ membaca data dari database ARKAS (' + code('arkas.db') + ') yang terenkripsi SQLCipher:'
);
blank();
bullet('SmartSPJ ' + bold('hanya MEMBACA') + ' data dari ARKAS (read-only)');
bullet('SmartSPJ ' + bold('tidak mengubah') + ' data di database ARKAS');
bullet('Data tambahan yang dihasilkan SmartSPJ disimpan terpisah di folder ' + code('data/') + '');
bullet(
  'Data pengaturan penandatangan BA Rekonsiliasi disimpan via ' +
    code('window.arkas.saveSignatoryData()') +
    ''
);
bullet(
  'Status cetak bukti transaksi disimpan di ' +
    code('localStorage') +
    ' browser (key: ' +
    code('printed_groups') +
    ')'
);
bullet(
  'Custom date per transaksi disimpan di ' +
    code('localStorage') +
    ' (key: ' +
    code('custom_date_{id_kas_umum}') +
    ')'
);
blank();

h2('Arsitektur Sistem');
L('SmartSPJ menggunakan arsitektur Electron dengan komunikasi IPC:');
blank();
tableHeader('Komponen', 'Teknologi', 'Fungsi');
tableRow('Main Process', 'Electron (Node.js)', 'Akses filesystem, database, IPC handlers');
tableRow('Renderer Process', 'React.js + Tailwind', 'Antarmuka pengguna (UI)');
tableRow('Preload Script', 'contextBridge', 'Jembatan API antara Main & Renderer');
tableRow('Database Handler', 'better-sqlite3 + SQLCipher', 'Baca data dari arkas.db');
tableRow('Export Engine', 'jsPDF, ExcelJS', 'Generate dokumen PDF & Excel');
blank();

hr();

// ====== SECTION 2: INSTALASI ======
h1('2. Instalasi & Persyaratan');

h2('Persyaratan Sistem');
tableHeader('Komponen', 'Minimum', 'Direkomendasikan');
tableRow('OS', 'Windows 10 64-bit', 'Windows 11 64-bit');
tableRow('RAM', '4 GB', '8 GB');
tableRow('Storage', '500 MB', '1 GB');
tableRow('ARKAS', 'Terinstal dan berjalan', 'Versi terbaru');
tableRow('Node.js', 'v18 LTS', 'v20 LTS');
blank();

h2('Struktur Folder Proyek');
L('```');
L('SmartSPJ/');
L('\u251c\u2500\u2500 electron/');
L('\u2502   \u251c\u2500\u2500 main.js              \u2190 Entry point Electron');
L('\u2502   \u251c\u2500\u2500 main-loader.js');
L('\u2502   \u251c\u2500\u2500 preload.js           \u2190 Bridge API ke renderer');
L('\u2502   \u2514\u2500\u2500 handlers/            \u2190 IPC handlers (database, export, dll)');
L('\u251c\u2500\u2500 src/');
L('\u2502   \u251c\u2500\u2500 pages/               \u2190 Halaman utama (Dashboard, BKU, dll)');
L('\u2502   \u251c\u2500\u2500 components/          \u2190 Komponen React reusable');
L('\u2502   \u251c\u2500\u2500 context/             \u2190 React Context (FilterContext)');
L('\u2502   \u251c\u2500\u2500 hooks/               \u2190 Custom hooks (useArkasData, dll)');
L('\u2502   \u251c\u2500\u2500 utils/               \u2190 Helper functions');
L('\u2502   \u251c\u2500\u2500 config/              \u2190 Konfigurasi tabel & kolom');
L('\u2502   \u2514\u2500\u2500 theme/               \u2190 Definisi tema UI');
L('\u251c\u2500\u2500 data/                    \u2190 Data SmartSPJ (terpisah dari ARKAS)');
L('\u251c\u2500\u2500 docs/                    \u2190 Dokumentasi');
L('\u2514\u2500\u2500 scripts/                 \u2190 Script utilitas');
L('```');
blank();

h2('Cara Menjalankan (Development)');
L('```bash');
L('npm install        # Install dependencies');
L('npm run dev        # Jalankan mode development (Vite)');
L('npm run build      # Build untuk produksi');
L('npm run electron   # Jalankan Electron app');
L('```');
blank();

hr();

// ====== SECTION 3: ANTARMUKA ======
h1('3. Mengenal Antarmuka');

h2('Tata Letak Utama');
L('SmartSPJ menggunakan layout ' + bold('Sidebar + Main Content') + ' yang terdiri dari:');
blank();
bullet(bold('Sidebar (kiri)') + ': Navigasi menu utama, selalu terlihat');
bullet(bold('Header (atas)') + ': Filter global (Tahun Anggaran & Sumber Dana) + identitas');
bullet(bold('Main Content (tengah)') + ': Area konten halaman yang aktif');
blank();

h2('Sidebar — Menu Navigasi');
L('Sidebar menampilkan logo SmartSPJ, versi aplikasi, dan 5 grup menu:');
blank();
tableHeader('Grup', 'Menu', 'ID Tab', 'Ikon');
tableRow('—', 'Dashboard', code('dashboard'), 'LayoutDashboard');
tableRow(bold('PENGANGGARAN'), 'Kertas Kerja (RKAS)', code('kertas-kerja'), 'Table');
tableRow('', 'Realisasi Belanja', code('realisasi-belanja'), 'PieChart');
tableRow(bold('PENATAUSAHAAN'), 'Buku Kas Umum', code('transactions'), 'BookOpen');
tableRow('', 'Buku Pembantu Tunai', code('cash-report'), 'Wallet');
tableRow('', 'Buku Pembantu Bank', code('bank-report'), 'Landmark');
tableRow('', 'Buku Pembantu Pajak', code('tax-report'), 'PieChart');
tableRow('', 'Bukti Transaksi', code('nota-groups'), 'FileStack');
tableRow(bold('LAPORAN'), 'BA Rekonsiliasi', code('reconciliation'), 'FileBarChart');
tableRow('', 'Rekonsiliasi Bank', code('bank-reconciliation'), 'Scale');
tableRow('', 'Cetak SPTJM', code('sptjm'), 'FileSignature');
tableRow('', 'Laporan K7 / K7a', code('k7-report'), 'ClipboardList');
tableRow('', 'Register Kas', code('register-kas'), 'Printer');
tableRow(bold('LAINNYA'), 'Backup & Restore', code('backup-restore'), 'HardDrive');
tableRow('', 'Pengaturan', code('settings'), 'Settings');
tableRow('', 'Tentang Aplikasi', code('about'), 'Info');
blank();
L(
  'Versi aplikasi ditampilkan di bagian bawah sidebar, dimuat via ' +
    code('window.arkas.getAppVersion()') +
    '.'
);
blank();

h2('Header — Filter Global');
L('Header menampilkan filter yang berlaku untuk ' + bold('semua halaman') + ':');
blank();
bullet(bold('Tahun Anggaran (TA)') + ': Dropdown untuk memilih tahun (misal: 2025, 2026)');
bullet(
  bold('Sumber Dana') +
    ': Dropdown dengan opsi ' +
    code('SEMUA') +
    ' atau sumber dana spesifik (misal: BOS Reguler, BOS Kinerja)'
);
blank();
L(
  'Filter ini disimpan di ' +
    code('FilterContext') +
    ' dan secara otomatis memicu re-fetch data saat berubah.'
);
blank();

hr();

// ====== SECTION 4: DASHBOARD ======
h1('4. Dashboard & Informasi Sekolah');

h2('4.1 SchoolInfoCard — Kartu Informasi Sekolah');
L(
  'SchoolInfoCard adalah komponen utama di Dashboard yang menampilkan informasi sekolah dan status-badge. Dibagi menjadi dua bagian: ' +
    bold('Identitas') +
    ' dan ' +
    bold('Status Grid') +
    '.'
);
blank();

h3('Bagian Atas: Identitas & Aksi');
tableHeader('Elemen', 'Deskripsi');
tableRow('Ikon Sekolah', 'Avatar bulat berwarna sky-100 dengan ikon School (lucide)');
tableRow('Nama Sekolah', 'Judul utama (bold, xl) yang diambil dari ' + code('school.nama') + '');
tableRow(
  'Badge "Tersinkronisasi"',
  'Badge hijau (emerald) yang muncul setelah sinkronisasi berhasil via ' + code('scrapedData') + ''
);
tableRow(
  'Alamat',
  'Teks dari ' + code('school.alamat') + ' atau ' + code('scrapedData.alamat') + ''
);
tableRow('Badge NPSN', 'Badge kecil "NPSN: 12345678"');
tableRow('Badge Wilayah', 'Gabungan provinsi, kabupaten, kecamatan');
tableRow(
  bold('Tombol "Muat Ulang Data"'),
  'Tombol dengan ikon RefreshCw. Label berubah ke "Memuat Data..." saat proses berjalan, ikon berputar (animate-spin)'
);
tableRow(
  'Label "Data dari Database Lokal"',
  'Teks italic kecil di bawah tombol, menampilkan tanggal update: "Terakhir di-update: ' +
    code('toLocaleDateString(id-ID)') +
    '"'
);
tableRow(
  'Badge Indikator Sumber Dana',
  'Badge biru kecil "' +
    code('\uD83C\uDFAF {selectedFundSource}') +
    '" — menampilkan "Gabungan Sumber Dana" jika SEMUA'
);
blank();

h3('Sinkronisasi — Detail Proses');
L('Ketika tombol "Muat Ulang Data" diklik, dilakukan ' + bold('dua operasi') + ':');
blank();
bullet(
  bold('1. Reload dari DB lokal') +
    ': Memanggil ' +
    code('window.arkas.reloadSchoolData()') +
    ' — memuat ulang data sekolah dari database arkas.db'
);
bullet(
  bold('2. Sync via NPSN') +
    ': Jika NPSN tersedia, memanggil ' +
    code('window.arkas.syncRegionData(school.npsn)') +
    ' — mengambil data wilayah (provinsi, kabupaten, kecamatan) dari API eksternal'
);
blank();
L('Hasil sinkronisasi ditampilkan via toast notification:');
bullet('Sukses: ' + code('toast.success("Data berhasil disinkronkan!")') + ' (hijau, 3 detik)');
bullet('Gagal: ' + code('toast.error("Gagal menyinkronkan data.")') + ' (merah, 3 detik)');
blank();

h3('Bagian Bawah: Status Grid (6 Badge)');
L('Grid 2x3 (mobile) atau 1x6 (desktop) dengan 6 badge status:');
blank();

h4('1. Status BKU');
L('Menampilkan bulan dan status pengiriman BKU:');
bullet('Format: "' + code('{bulan} \u2022 {status}') + '"');
bullet('Jika ' + code('status_pengiriman === 2') + ': Badge biru, teks "' + bold('Terkirim') + '"');
bullet('Jika status lain: Badge kuning, teks "' + bold('Draf') + '"');
bullet('Jika belum ada data: Teks italic "Belum Terkirim/Belum Diaktivasi"');
blank();
L(
  'Data diambil dari ' +
    code('window.arkas.getDashboardBadges(year, fundSource)') +
    ' → ' +
    code('badges.bku') +
    '.'
);
blank();

h4('2. Kertas Kerja (Pengesahan)');
L('Menampilkan status validasi Kertas Kerja:');
bullet(
  'Jika ' +
    code('is_sah === 1') +
    ': Badge hijau + ikon CheckCircle2, teks "' +
    bold('Disahkan') +
    '"'
);
bullet(
  'Jika ' +
    code('is_sah !== 1') +
    ': Badge merah + ikon XCircle, teks "' +
    bold('Perlu Diperbaiki') +
    '"'
);
bullet('Jika belum disahkan: Teks italic "Belum Disahkan"');
blank();

h4('3. Terima Dana');
L('Menampilkan transfer dana terakhir:');
bullet('Baris 1: Uraian transfer (' + code('badges.transfer.uraian') + ', teks tebal, truncate)');
bullet('Baris 2: Tanggal transfer (format: "25 Jan")');
bullet('Jika belum ada: Teks italic "Belum Terima Dana"');
blank();

h4('4. Revisi');
L('Menampilkan level revisi:');
bullet('Jika ' + code('nomor === 0') + ': Badge indigo, teks "' + bold('Murni') + '"');
bullet('Jika ' + code('nomor > 0') + ': Teks "' + bold('Rev-N') + '" (misal: Rev-1, Rev-2)');
bullet('Jika di-approve (' + code('is_approve === 1') + '): Warna indigo');
bullet('Jika belum: Warna abu-abu');
blank();

h4('5. Sisa Pagu');
L('Menampilkan selisih anggaran:');
bullet('Nilai: ' + code('badges.pagu_sisa') + ' diformat IDR');
bullet('Tooltip (title attribute) panjang menjelaskan perhitungan:');
bullet('  "(+) Positif: Ada dana belum direncanakan kegiatannya"');
bullet('  "(0) Nol: Anggaran sudah pas (Balance)"');
bullet('  "(-) Negatif: Rencana belanja melebihi anggaran"');
bullet('Jika ' + code('pagu_sisa === 0') + ': Teks hijau "Balance" + ikon centang');
bullet('Jika ' + code('pagu_sisa > 0') + ': Teks "Belum Diplot"');
bullet('Jika ' + code('pagu_sisa < 0') + ': Teks merah "Defisit"');
blank();

h4('6. Respon');
L('Menampilkan komentar/pesan dari dinas (pengesahan):');
bullet('Label: "\uD83D\uDCAC Respon"');
bullet('Konten: ' + code('badges.pengesahan.keterangan') + ' (truncate, max-width 120px)');
bullet('Tooltip menampilkan pesan lengkap');
bullet('Default: "Tidak ada pesan."');
blank();

h2('4.2 Komponen Dashboard Lainnya');
L(
  'Selain SchoolInfoCard, Dashboard juga menampilkan komponen dari direktori ' +
    code('components/dashboard/') +
    ':'
);
blank();
bullet(bold('MasterProgress (v3)') + ': Progress bar utama realisasi keseluruhan');
bullet(bold('TopCards (v3)') + ': Kartu statistik ringkasan (Pagu, Realisasi, Sisa)');
bullet(bold('KategoriBelanja (v3)') + ': Grafik breakdown kategori belanja');
bullet(bold('RingkasanSumberDana (v3)') + ': Ringkasan per sumber dana');
bullet(bold('RiwayatTransaksi (v3)') + ': Tabel riwayat transaksi terbaru');
bullet(bold('StrategicSpending (v3)') + ': Analisis pengeluaran strategis');
bullet(bold('PergerakanKasBulanan (v3)') + ': Grafik pergerakan kas per bulan');
bullet(bold('StatCardPro (v2)') + ': Kartu statistik versi 2');
bullet(bold('SpendingAnalysis (v2)') + ': Analisis pengeluaran versi 2');
bullet(bold('RevenueChart (v2)') + ': Grafik penerimaan versi 2');
bullet(bold('ActivityFeed (v2)') + ': Feed aktivitas terbaru versi 2');
blank();

hr();

// ====== SECTION 5: PENGANGGARAN ======
h1('5. Penganggaran (RKAS + Realisasi Belanja)');

h2('5.1 Kertas Kerja (RKAS)');
L(
  'Halaman Kertas Kerja menampilkan Rencana Kegiatan dan Anggaran Sekolah (RKAS) dalam berbagai format. Diakses via menu ' +
    bold('Penganggaran > Kertas Kerja (RKAS)') +
    '.'
);
blank();
L(
  'File: ' +
    code('src/pages/KertasKerja.jsx') +
    ', Toolbar: ' +
    code('src/components/KertasKerja/KertasKerjaToolbar.jsx') +
    ''
);
blank();

h3('Prasyarat');
L(
  'Halaman ini ' +
    bold('memerlukan sumber dana spesifik') +
    ' untuk ditampilkan. Jika filter global menunjukkan ' +
    code('SEMUA') +
    ', akan muncul pesan peringatan:'
);
blank();
bullet('Ikon AlertCircle berwarna amber');
bullet('Judul: "Pilih Sumber Dana Spesifik"');
bullet(
  'Pesan: "Untuk melihat rincian Kertas Kerja yang rapi dan terstruktur, mohon ' +
    bold('pilih salah satu Sumber Dana') +
    ' (misal: BOS Reguler) pada menu filter di pojok kanan atas."'
);
blank();

h3('Format Laporan yang Tersedia');
L('Pengguna memilih format melalui dropdown "Format RKAS:" di toolbar:');
blank();
tableHeader('No', 'Format', 'Deskripsi');
tableRow('1', bold('Rincian RKAS (Tahunan)'), 'Ringkasan RKAS keseluruhan tahun anggaran');
tableRow('2', bold('Rincian RKAS (Triwulan)'), 'RKAS dikelompokkan per triwulan (3 bulanan)');
tableRow(
  '3',
  bold('Rincian RKAS (Bulanan)'),
  'RKAS per bulan individu — ' + italic('memunculkan dropdown bulan tambahan')
);
tableRow(
  '4',
  bold('Lembar Kertas Kerja (Triwulan)'),
  'Hanya tersedia untuk periode Triwulan — tampilan lembar kerja formal'
);
blank();

h3('Month Sub-Selector');
L(
  'Ketika format yang dipilih adalah ' +
    bold('"Rincian RKAS (Bulanan)"') +
    ', sebuah dropdown tambahan muncul secara otomatis di sebelah kanan dropdown format:'
);
blank();
bullet('Ikon Calendar di sisi kiri dropdown');
bullet(
  'Berisi 12 bulan: Januari, Februari, Maret, April, Mei, Juni, Juli, Agustus, September, Oktober, November, Desember'
);
bullet('Animasi masuk: ' + code('animate-in fade-in slide-in-from-left-2') + '');
blank();

h3('Pencarian');
L('Terdapat fitur pencarian real-time di toolbar:');
blank();
bullet('Input field dengan placeholder "' + bold('Cari Kegiatan / Barang...') + '"');
bullet('Ikon Search (lucide) di sisi kiri input');
bullet(
  'Filter dilakukan pada ' +
    code('searchTerm') +
    ' yang dikirim ke hook ' +
    code('useKertasKerjaData()') +
    ''
);
bullet('Pencarian bersifat case-insensitive dan memfilter baris yang mengandung teks pencarian');
blank();

h3('Export Options — "Cetak / Export"');
L('Di sisi kanan toolbar terdapat tombol dropdown ' + bold('"Cetak / Export"') + ':');
blank();
bullet('Tombol hijau dengan ikon Download + teks "Cetak / Export" + ikon ChevronDown');
bullet('Dropdown menu muncul saat diklik (animasi fade-in dari atas)');
bullet('Opsi yang tersedia:');
bullet(
  '  1. ' + bold('Cetak PDF') + ' — Ikon Printer merah, memanggil ' + code('exportToPDF()') + ''
);
bullet(
  '  2. ' +
    bold('Export Excel') +
    ' — Ikon FileSpreadsheet hijau, memanggil ' +
    code('exportToExcel()') +
    ''
);
bullet(
  'Dropdown menutup otomatis saat klik di luar area (via ' + code('mousedown') + ' event listener)'
);
blank();

h3('Komponen Tabel');
L('Berdasarkan format yang dipilih, tabel berbeda dirender:');
blank();
tableHeader('Format', 'Komponen', 'File');
tableRow(
  'Rincian RKAS (Tahunan)',
  code('KertasKerjaFormalTableAnnual'),
  code('KertasKerjaFormalTableAnnual.jsx')
);
tableRow(
  'Rincian RKAS (Triwulan)',
  code('KertasKerjaFormalTableQuarterly'),
  code('KertasKerjaFormalTableQuarterly.jsx')
);
tableRow(
  'Rincian RKAS (Bulanan)',
  code('KertasKerjaFormalTable'),
  code('KertasKerjaFormalTable.jsx')
);
tableRow(
  'Lembar Kertas Kerja',
  code('LembarKertasKerjaFormal'),
  code('LembarKertasKerjaFormal.jsx')
);
blank();

h3('State & Data Flow');
L(
  'Data dimuat melalui custom hook ' +
    code('useKertasKerjaData(selectedFormat, selectedMonth, searchTerm)') +
    ' yang mengembalikan:'
);
blank();
bullet(code('data') + ': Data mentah dari API');
bullet(code('processedData') + ': Data yang sudah diproses dan siap ditampilkan');
bullet(code('loading') + ': Status loading');
bullet(code('error') + ' Pesan error jika ada');
bullet(code('isMonthly') + ': Boolean apakah format bulanan');
bullet(code('isQuarterly') + ': Boolean apakah format triwulan');
bullet(code('isLembar') + ': Boolean apakah format lembar kertas kerja');
bullet(code('year') + ', ' + code('fundSource') + ': Konteks filter');
blank();

h2('5.2 Realisasi Belanja');
L(
  'Halaman Realisasi Belanja menampilkan analisis mendetail tentang penggunaan anggaran vs rencana RKAS. File: ' +
    code('src/pages/RealisasiBelanja.jsx') +
    '.'
);
blank();

h3('Prasyarat');
L(
  'Sama seperti Kertas Kerja, halaman ini ' +
    bold('memerlukan sumber dana spesifik') +
    '. Jika ' +
    code('SEMUA') +
    ', ditampilkan pesan peringatan serupa.'
);
blank();

h3('3 Kartu Statistik di Atas Tabel');
L(
  'Di bagian atas halaman terdapat ' +
    bold('3 kartu statistik') +
    ' yang menampilkan ringkasan anggaran:'
);
blank();
tableHeader('Kartu', 'Label', 'Nilai', 'Border Color', 'Ikon');
tableRow(
  '1',
  'Total Pagu Alokasi',
  code('annualPagu') + ' (formatRupiah)',
  'Slate (abu-abu)',
  'List'
);
tableRow(
  '2',
  'Realisasi Belanja',
  code('totalRealisasiInternal'),
  'Merah (red-500)',
  'CheckCircle2'
);
tableRow(
  '3',
  'Sisa Anggaran',
  code('annualPagu - totalRealisasi'),
  'Hijau (emerald-500)',
  'TrendingUp'
);
blank();
L('Kartu ke-2 (Realisasi) dilengkapi dengan ' + bold('progress bar') + ':');
bullet('Background: abu-abu muda (slate-100)');
bullet('Fill: merah (red-500), lebar proporsional terhadap persentase realisasi');
bullet('Maks 100%: ' + code('Math.min(100, (totalRealisasi / annualPagu) * 100)') + '');
blank();
L('Jika sisa anggaran negatif, angka ditampilkan dalam warna merah (text-red-700).');
blank();

h3('Toolbar');
L('Toolbar di bagian atas mencakup:');
blank();
bullet(bold('Periode') + ': Dropdown untuk memilih bulan atau kumulatif (0 = Kumulatif)');
bullet(bold('Mode View') + ': 3 tombol toggle:');
bullet('  - ' + bold('Ringkasan') + ' (BarChart3): Grouping per kegiatan');
bullet('  - ' + bold('Rincian') + ' (List): Detail per item');
bullet(
  '  - ' + bold('RKAS vs Realisasi') + ' (GitCompare): Perbandingan RKAS dengan realisasi BKU'
);
blank();

h3('Mode "Ringkasan"');
L(
  'Dalam mode Ringkasan, data dikelompokkan per kegiatan. Setiap baris kegiatan dapat di-expand untuk melihat rincian sub-item. Kolom tabel:'
);
blank();
tableHeader('Kolom', 'Lebar', 'Deskripsi');
tableRow('No', '4%', 'Nomor urut');
tableRow('Program', '7%', 'Kode program (misal: "5.")');
tableRow('Kegiatan', '14%', 'Kode + nama kegiatan + ikon expand');
tableRow('Rekening Belanja', '14%', 'Jumlah rekening belanja dalam kegiatan');
tableRow('Uraian / Barang', '18%', 'Total Akumulasi Kegiatan');
tableRow('Anggar', '6%', 'Volume pagu');
tableRow('Real', '6%', 'Volume realisasi bulan berjalan');
tableRow('Sat', '5%', 'Satuan (misal: pcs, paket)');
tableRow('Harga', '10%', 'Harga satuan');
tableRow('Total', '10%', 'Total realisasi');
tableRow('Sts', '9%', 'Badge status: Selesai / SISA + jumlah + satuan');
blank();

h3('Mode "RKAS vs Realisasi"');
L('Tabel perbandingan antara rencana RKAS dan laporan BKU:');
blank();
tableHeader('Kolom', 'Lebar', 'Deskripsi');
tableRow('NO', '5%', 'Nomor urut');
tableRow('Item Belanja', '35%', 'Nama barang + kode rekening');
tableRow('Target RKAS', '15%', 'Volume target + jumlah anggaran');
tableRow('Laporan BKU', '15%', 'Volume realisasi + jumlah');
tableRow('Keterangan', '20%', 'Badge status gap');
tableRow('Aksi', '10%', 'Tombol "Detail"');
blank();
L('Status gap yang ditampilkan:');
bullet('Sesuai Target (hijau)');
bullet('Terbayar (Rapel) (biru) — sudah dibayar di bulan lain');
bullet('Belum Terealisasi (kuning) — belum ada realisasi');
bullet('Realisasi Geser Bulan (biru) — realisasi terjadi di bulan berbeda');
bullet('Melampaui Pagu (merah) — melebihi total anggaran');
bullet('Akumulatif (biru) — masih dalam batas');
bullet('Parsial (biru) — sebagian terealisasi');
blank();

h3('Detail Modal — "Aliran Dana"');
L('Ketika tombol "Detail" diklik pada mode RKAS vs Realisasi, muncul modal profesional:');
blank();
bullet(bold('Judul') + ': "Aliran Dana: {nama_barang}"');
bullet(bold('Subjudul') + ': Kode rekening');
blank();
L('Modal terdiri dari ' + bold('Summary Block') + ' di bagian atas:');
blank();
bullet('Kolom kiri: "Total Realisasi" (kumulatif) — teks hijau (emerald-600)');
bullet('Kolom kanan: "Pagu Tahunan" — teks abu-abu');
bullet('Dua kolom dipisahkan oleh border vertikal');
blank();
L(
  'Di bawah summary terdapat ' +
    bold('Timeline per Bulan') +
    ' berupa kartu-kartu (bukan bar chart):'
);
blank();
bullet('Setiap kartu mewakili satu bulan yang dianggarkan atau terealisasi');
bullet(
  'Bagian kiri kartu: Nama bulan + ikon status (CheckCircle2 hijau jika lunas, Clock kuning jika belum)'
);
bullet('Bagian kanan kartu: Target (volume + jumlah), Keuangan/BKU (jumlah)');
bullet(
  bold('Blue arrow indicator') +
    ': Jika realisasi berasal dari bulan berbeda, muncul indikator biru: "→ {NamaBulan}"'
);
bullet('Kartu bulan yang sedang aktif memiliki border biru + ring');
blank();

hr();

// ====== SECTION 6: PENATAUSAHAAN ======
h1('6. Penatausahaan (BKU)');

h2('6.1 BKU Umum — Buku Kas Umum');
L(
  'Halaman Buku Kas Umum menampilkan seluruh transaksi keuangan sekolah. File: ' +
    code('src/pages/TransactionList.jsx') +
    ', ' +
    code('src/components/transactions/TransactionTable.jsx') +
    '.'
);
blank();

h3('Header Halaman');
L('Header menampilkan:');
bullet('Ikon biru (FileText) dengan label "BUKU KAS UMUM"');
bullet('Badge "TA {tahun}"');
bullet('Jika month view: teks "Bulan {NamaBulan}"');
blank();

h3('"SEMUA" Month Option');
L('Dropdown pemilihan bulan menyertakan opsi khusus ' + bold('"SEMUA"') + ' di awal daftar:');
blank();
bullet('Jika dipilih: menampilkan transaksi dari ' + bold('seluruh bulan') + ' sekaligus');
bullet('Tidak ada "Saldo Bulan Lalu" yang ditampilkan');
bullet('Summary cards menampilkan total tahunan');
bullet('Sorting tidak dilakukan berdasarkan tanggal (data mentah dari API)');
blank();
L(
  'Daftar bulan dimuat dari konstanta ' +
    code('MONTHS') +
    ' di ' +
    code('src/utils/transactionHelpers.js') +
    '.'
);
blank();

h3('TransactionSummary Cards');
L('Di atas tabel terdapat 3 kartu ringkasan via komponen ' + code('TransactionSummary') + ':');
blank();
tableHeader('Kartu', 'Label Dinamis', 'Ikon', 'Warna');
tableRow('Saldo', '"Sisa Saldo Tahunan" atau "Saldo Akhir {Bulan}"', 'Wallet', 'Biru');
tableRow('Penerimaan', '"Total Penerimaan" atau "Penerimaan {Bulan}"', 'ArrowDownCircle', 'Hijau');
tableRow('Pengeluaran', '"Total Pengeluaran" atau "Belanja {Bulan}"', 'ArrowUpCircle', 'Merah');
blank();

h3('Advanced Filter Menu (TransactionFilters)');
L('Komponen ' + code('TransactionFilters') + ' menyediakan sistem multi-filter:');
blank();
bullet(bold('Tombol Filter') + ': Menampilkan jumlah filter aktif, misal "Filter (3)"');
bullet(
  bold('Dropdown multi-select') + ': Daftar tipe transaksi dari ' + code('FILTER_OPTIONS') + ''
);
bullet(bold('Tombol Reset') + ': Menghapus semua filter aktif');
bullet(bold('Search bar') + ': Pencarian teks real-time');
bullet(bold('Export dropdown') + ': Menu export dengan beberapa opsi');
blank();

h3('Opening Balance Row — "Saldo Bulan Lalu"');
L(
  'Untuk bulan selain Januari, secara otomatis muncul baris ' +
    bold('"Saldo Bulan Lalu"') +
    ' di awal tabel:'
);
blank();
bullet(
  'Hanya muncul jika: ' +
    code(
      'isMonthView && selectedMonth !== "01" && !hasExistingOpeningBalance && openingBalance > 0'
    ) +
    ''
);
bullet('Tanggal: ' + code('{year}-{month}-01') + '');
bullet('No. Bukti: kosong');
bullet('Uraian: "Saldo Bulan Lalu"');
bullet('Kolom Penerimaan: nilai opening balance');
bullet('Kolom Pengeluaran: 0');
bullet('Kolom Saldo Berjalan: sama dengan opening balance');
blank();
L(
  'Opening balance dihitung dari saldo akhir bulan sebelumnya: ' +
    code('stats.chart[monthIndex - 1].saldo_akhir') +
    '.'
);
blank();

h3('4 Tombol Export');
L('Export BKU tersedia melalui 4 tombol eksplisit di area filter:');
blank();
tableHeader('Tombol', 'Scope', 'Format', 'Behavior');
tableRow(
  bold('PDF Bulan Ini'),
  'Single (bulan aktif)',
  'PDF',
  'Export tabel bulan terpilih ke PDF'
);
tableRow(
  bold('PDF Semua Bulan'),
  'Bulk (seluruh tahun)',
  'PDF',
  'Export seluruh transaksi tahun ke PDF'
);
tableRow(
  bold('Excel Bulan Ini'),
  'Single (bulan aktif)',
  'Excel',
  'Export tabel bulan terpilih ke Excel'
);
tableRow(
  bold('Excel Semua Bulan'),
  'Bulk (seluruh tahun)',
  'Excel',
  'Export seluruh transaksi tahun ke Excel'
);
blank();
L(
  'Export dilakukan via ' +
    code('window.arkas.exportBku(data, options)') +
    ' dengan parameter ' +
    code('scope') +
    ' dan ' +
    code('format') +
    '.'
);
blank();

h3('Kolom Tabel BKU');
tableHeader('Kolom', 'Deskripsi');
tableRow('Tanggal', 'Tanggal transaksi');
tableRow('No. Bukti', 'Nomor bukti transaksi');
tableRow('Kode Kegiatan', 'Kode kegiatan anggaran');
tableRow('Kode Rekening', 'Kode rekening belanja');
tableRow('Uraian', 'Deskripsi transaksi');
tableRow('Penerimaan', 'Jumlah penerimaan (Debit)');
tableRow('Pengeluaran', 'Jumlah pengeluaran (Kredit)');
tableRow('Saldo', 'Saldo berjalan (dihitung otomatis)');
blank();

h2('6.2 Buku Pembantu Tunai');
L(
  'Buku Pembantu Tunai menampilkan transaksi yang menggunakan metode pembayaran tunai. Menggunakan komponen yang sama dengan BKU Umum tetapi dengan filter ' +
    code('paymentType: "TUNAI"') +
    '.'
);
blank();
L('File: ' + code('src/components/transactions/CashReportList.jsx') + '.');
blank();

h2('6.3 Buku Pembantu Bank');
L(
  'Buku Pembantu Bank menampilkan transaksi yang menggunakan metode pembayaran bank. Menggunakan komponen yang sama dengan BKU Umum tetapi dengan filter ' +
    code('paymentType: "BANK"') +
    '.'
);
blank();
L('File: ' + code('src/components/transactions/BankReportList.jsx') + '.');
blank();

h2('6.4 Buku Pembantu Pajak');
L(
  'Halaman Buku Pembantu Pajak menampilkan transaksi pajak dengan fitur input manual. File: ' +
    code('src/components/transactions/TaxReportList.jsx') +
    '.'
);
blank();

h3('Tombol "Input Pajak Manual"');
L(
  'Di header halaman terdapat tombol ' +
    bold('"Input Pajak Manual"') +
    ' (bukan "Tambah Entri Manual"):'
);
blank();
bullet('Tombol gradient oranye (amber-500 to orange-500)');
bullet('Ikon Plus (lucide)');
bullet('Membuka ' + code('ManualTaxModal') + '');
blank();

h3('ManualTaxModal');
L(
  'Modal input pajak manual memiliki judul "Input Pajak Manual" (header gradient oranye) dengan field:'
);
blank();
tableHeader('Field', 'Tipe', 'Deskripsi');
tableRow('Jenis Input', 'Select', 'Opsi: saldo_awal_tahun, hutang_bulan, transaksi');
tableRow('Jenis Pajak', 'Select', 'Opsi: PPN, PPh 21, PPh 23, SSPD');
tableRow('Nominal', 'Number', 'Jumlah nominal pajak');
tableRow('Keterangan', 'Text', 'Deskripsi/keterangan');
tableRow('Tanggal', 'Date', 'Tanggal input (default: hari ini)');
tableRow('No. Bukti', 'Text', 'Nomor bukti (opsional)');
tableRow('Posisi', 'Radio', 'Pungutan (+) atau Setoran (-)');
blank();

h3('Manual Tax Preview Section');
L(
  'Jika ada entri pajak manual, ditampilkan area preview berwarna ' + bold('gradient oranye') + ':'
);
blank();
bullet('Header: "\uD83D\uDCDD Entri Pajak Manual ({count})"');
bullet('Menampilkan ' + bold('maksimal 5 entri terbaru') + ' sebagai card kecil');
bullet('Setiap card menampilkan:');
bullet('  - Indikator +/- dengan warna (hijau untuk pungutan, merah untuk setoran)');
bullet('  - Nominal dalam format Rupiah');
bullet('  - Keterangan (truncate max 150px)');
bullet('  - ' + bold('Tombol delete (Trash2 icon)') + ' berwarna merah untuk menghapus entry');
bullet('Jika lebih dari 5 entri: teks "+N lainnya"');
blank();
L('Delete dilakukan via ' + code('window.arkas.deleteManualTax(id)') + ' dengan toast konfirmasi.');
blank();

h3('Export Options');
L('Export Buku Pembantu Pajak tersedia melalui ' + code('TransactionFilters') + ':');
blank();
bullet(bold('PDF Bulan Ini') + ': Export bulan terpilih ke PDF');
bullet(bold('PDF Semua Bulan') + ': Export seluruh tahun ke PDF');
bullet(bold('Excel Bulan Ini') + ': Export bulan terpilih ke Excel');
bullet(bold('Excel Semua Bulan') + ': Export seluruh tahun ke Excel');
blank();
L(
  'Export dilakukan via ' +
    code('window.arkas.exportBku()') +
    ' dengan ' +
    code('paymentType: "PAJAK"') +
    ' dan ' +
    code('reportType: "PAJAK"') +
    '.'
);
blank();

h2('6.5 Bukti Transaksi');
L(
  'Halaman Bukti Transaksi adalah fitur komprehensif yang mengelola bukti-bukti pengeluaran. File: ' +
    code('src/pages/NotaGroupManager.jsx') +
    ', ' +
    code('src/components/print/PrintReceiptContent.jsx') +
    '.'
);
blank();

h3('Tab Nota Gabungan');
L('Tab ini menampilkan daftar nota yang dikelompokkan berdasarkan nomor nota/toko.');
blank();

h4('Stats Cards');
L('Di bagian atas terdapat 3 kartu statistik:');
blank();
tableHeader('Kartu', 'Warna Background', 'Isi');
tableRow(bold('Total Nota'), 'Violet', 'Jumlah grup nota terfilter');
tableRow(bold('Total Item'), 'Biru', 'Total item dalam semua grup');
tableRow(bold('Total Nilai'), 'Hijau', 'Total nominal semua transaksi (format Rupiah)');
blank();

h4('Search');
L(
  'Search bar dengan placeholder "' +
    bold('Cari no nota, toko, atau uraian...') +
    '" untuk filtering real-time. Pencarian dilakukan terhadap:'
);
bullet(code('noNota') + ' (nomor nota)');
bullet(code('namaToko') + ' (nama toko/vendor)');
bullet(code('items[].uraian') + ' (uraian item)');
blank();

h4('Pengelompokan Nota');
L('Setiap grup nota ditampilkan sebagai kartu yang dapat di-expand:');
blank();
bullet('Badge nomor urut');
bullet('Ikon Store dengan warna berbeda:');
bullet('  - Biru jika transaksi SIPLah');
bullet('  - Violet jika grouped (non-SIPLah)');
bullet('  - Abu-abu jika single item');
bullet(bold('SIPLah Badge') + ': Badge biru bertuliskan "SIPLah" untuk transaksi SIPLah');
bullet(bold('PPN Badge') + ': Badge hijau bertuliskan "PPN" jika nota memiliki PPN');
bullet('Jumlah item badge (jika grouped)');
bullet('Total nominal di sisi kanan');
bullet('Ikon ChevronDown yang berputar 180° saat expanded');
blank();

h4('Tabel Expanded');
L('Saat kartu nota di-expand, tabel detail ditampilkan dengan kolom:');
blank();
tableHeader('Kolom', 'Deskripsi');
tableRow('No Bukti', 'Badge violet dengan nomor bukti');
tableRow('Uraian', 'Deskripsi item');
tableRow('Tanggal', 'Tanggal transaksi (format locale Indonesia)');
tableRow('Nominal', 'Jumlah nominal (format Rupiah, align right)');
blank();
L(
  'Footer tabel menampilkan total dan ' +
    bold('PPN (11%)') +
    ' yang dihitung jika nota memiliki flag PPN.'
);
blank();

h4('Refresh Button');
L(
  'Tombol "Refresh" di sisi kanan toolbar untuk memuat ulang data. Ikon RefreshCw berputar saat loading.'
);
blank();

h3('Tab Cetak Manual');
L('Tab kedua menampilkan daftar transaksi untuk dicetak sebagai bukti pengeluaran.');
blank();

h4('Checkbox Selection');
L('Setiap grup transaksi memiliki checkbox untuk seleksi:');
blank();
bullet(bold('Select All Toggle') + ': Checkbox di header untuk memilih/membatalkan semua');
bullet(bold('Individual Selection') + ': Checkbox per grup');
bullet('State tersimpan di ' + code('selectedGroups') + ' (Set)');
blank();

h4('Print Tracking');
L('Status cetak dilacak menggunakan ' + code('localStorage') + ':');
blank();
bullet('Key: ' + code('printed_groups') + '');
bullet('Format: Array of "' + code('{noBukti}_{type}') + '"');
bullet(bold('"A2" Badge') + ': Muncul jika grup sudah dicetak sebagai A2');
bullet(bold('"Bukti" Badge') + ': Muncul jika grup sudah dicetak sebagai Bukti Pengeluaran');
blank();

h4('Batch Action Bar');
L('Ketika ada grup yang dipilih, muncul ' + bold('action bar berwarna ungu (violet)') + ':');
blank();
bullet('Teks: "{count} grup dipilih ({itemCount} item)"');
bullet('Total: Jumlah nominal terpilih (format Rupiah)');
bullet(bold('Tombol "Cetak A2 Gabungan"') + ': Tombol oranye untuk mencetak A2 gabungan');
bullet(bold('Tombol "Cetak Bukti Gabungan"') + ': Tombol violet untuk mencetak Bukti gabungan');
bullet('Tombol "Reset" (XCircle) untuk membatalkan pilihan');
blank();

h4('Safe Mode');
L('Label peringatan ditampilkan:');
blank();
bullet(bold('"Cetak gabungan TIDAK mengubah data asli (Safe Mode)"') + '');
blank();

h4('Reset Cetak');
L('Tombol reset tersedia untuk:');
bullet('Reset per grup: Menghapus status cetak untuk satu grup tertentu');
bullet('Reset global: Menghapus semua status cetak dari localStorage');
blank();
L('Dilakukan via fungsi ' + code('resetPrintStatus(noBukti, type)') + '.');
blank();

h3('ReceiptPreviewModal (Bukti Pengeluaran Uang)');
L(
  'Modal preview dokumen Bukti Pengeluaran Uang yang ditampilkan ketika melihat detail transaksi. File: ' +
    code('src/components/print/ReceiptPreviewModal.jsx') +
    '.'
);
blank();

h4('Header Modal');
bullet('Judul: "Preview Bukti Pengeluaran Uang"');
bullet('Background gradient ungu (purple-600 to indigo-600)');
bullet('Tombol close (X)');
blank();

h4('Dokumen Preview');
L('Dokumen ditampilkan dalam format profesional dengan border hitam 3px dan font serif:');
blank();
bullet(bold('Judul') + ': "BUKTI PENGELUARAN UANG" (uppercase, letter-spacing 2px)');
bullet(bold('Nomor') + ': "No : {no_bukti}"');
bullet(
  'Field kiri: Dinas/Instansi, Tahun Anggaran, Kode Rekening, Uraian Kode Rek, Terima Dari, Uang Sebesar (dalam kotak miring), Terbilang (dalam bahasa Indonesia via ' +
    code('terbilang()') +
    '), Untuk Kepentingan'
);
blank();

h4('Custom Date');
L('Tanggal per transaksi dapat dikustomisasi:');
blank();
bullet('Disimpan di localStorage dengan key ' + code('custom_date_{id_kas_umum}') + '');
bullet(
  'Kolom 1-3 (Mengetahui, Dibayar, Barang diterima) selalu menggunakan ' +
    bold('tanggal transaksi') +
    ''
);
bullet(
  'Kolom 4 (Yang menerima uang) menggunakan ' +
    bold('custom date') +
    ' atau tanggal_nota atau tanggal transaksi (prioritas berurutan)'
);
blank();

h4('Auto Tax Fetch');
L('Pajak terkait diambil otomatis dari entri BKU:');
blank();
bullet(
  'API: ' + code('window.arkas.getRelatedTaxes(uraian, tanggal, kode_rekening, year, nominal)') + ''
);
bullet('Prioritas: Data BKU (relatedTaxes) > Flag transaksi (is_ppn, is_pph_21, dll)');
bullet('Pajak yang diambil: PPN, PPh 21, PPh 23, SSPD/Pajak Daerah');
blank();

h4('Tax Summary Column');
L('Di sisi kanan dokumen terdapat tabel ringkasan pajak:');
blank();
tableHeader('Baris', 'Deskripsi');
tableRow('Penerimaan', 'Nominal utama transaksi');
tableRow('PPN', 'PPN dari BKU atau 11% jika flag PPN aktif');
tableRow('PPh 21%', 'PPh 21 dari BKU atau 5% jika flag aktif');
tableRow('PPh 23%', 'PPh 23 dari BKU atau 2% jika flag aktif');
tableRow('Pajak Daerah', 'SSPD dari BKU atau 10% jika flag aktif');
tableRow(bold('Jumlah'), 'Nominal - Total Pajak (net)');
blank();

h4('5 Area Tanda Tangan');
L('Dokumen memiliki 5 area tanda tangan dalam layout 4 kolom + 1 footer:');
blank();
tableHeader('No', 'Label', 'Pihak', 'Tanggal');
tableRow('1', 'MENGETAHUI', 'Kepala Sekolah', 'Tanggal transaksi');
tableRow('2', 'Dibayar oleh', 'Bendahara Pengeluaran', 'Tanggal transaksi');
tableRow('3', 'Barang telah diterima', 'Pemegang Barang', 'Tanggal transaksi');
tableRow(
  '4',
  'Yang menerima uang',
  'Toko/Vendor (nama_toko + alamat_toko jika is_badan_usaha)',
  'Custom date atau tanggal_nota'
);
tableRow('5', 'Paraf Pencatat Pembukuan', '(area kosong untuk paraf)', '—');
blank();

h4('Tombol "Simpan sebagai PDF"');
L(
  'Di footer modal terdapat tombol gradient ungu "' +
    bold('Simpan sebagai PDF') +
    '" untuk menyimpan dokumen sebagai file PDF.'
);
blank();

h3('Merge Feature (Cetak Gabungan)');
L('Fitur penggabungan beberapa transaksi menjadi satu dokumen:');
blank();

h4('Footer Section');
L('Di bagian bawah daftar transaksi terdapat area merge:');
blank();
bullet(bold('Nomor Bukti') + ': Input field opsional untuk nomor bukti gabungan');
bullet(bold('Uraian Kwitansi') + ': Input field opsional untuk uraian kwitansi');
bullet(bold('"Preview & Cetak"') + ': Tombol untuk memproses dan mencetak dokumen gabungan');
blank();

h4('Safe Mode Label');
L('Terdapat label: ' + bold('"Fitur ini TIDAK mengubah data asli di database"') + '');
blank();

hr();

// ====== SECTION 7: LAPORAN ======
h1('7. Laporan');

h2('7.1 BA Rekonsiliasi');
L(
  'Berita Acara Rekonsiliasi (BA Rekons) adalah laporan rekonsiliasi keuangan komprehensif. File: ' +
    code('src/pages/BAReconciliation.jsx') +
    '.'
);
blank();

h3('Header');
L(
  'Header menampilkan judul "Berita Acara Rekonsiliasi (BA Rekons)" dengan ikon emerald dan dua tombol aksi:'
);
blank();
bullet(bold('"Download PDF"') + ': Export konten sesuai tab aktif');
bullet(bold('"Export Excel"') + ': Export konten sesuai tab aktif');
blank();

h3('Context-Sensitive Export');
L('Perilaku tombol PDF/Excel berubah berdasarkan tab aktif:');
blank();
tableHeader('Tab Aktif', 'PDF Behavior', 'Excel Behavior');
tableRow(
  'BA REKONS',
  'Export smart table via ' + code('exportTableToPdf()') + '',
  'Export smart table via ' + code('exportTableToExcel()') + ''
);
tableRow(
  'LEMBAR BA',
  'Export dokumen BA via ' + code('exportBaRekonsToPdf()') + '',
  'Export BA via ' + code('exportBaRekonsToExcel()') + ''
);
tableRow('Rekap Bunga', 'Export tabel bunga', 'Export tabel bunga');
tableRow('Rekap Pajak', 'Export tabel pajak', 'Export tabel pajak');
tableRow('Fund Source Tab', 'Export detail sumber dana', 'Export detail sumber dana');
blank();

h3('Tab Navigation');
L('Navigasi tab terdiri dari beberapa grup:');
blank();
h4('Tab Utama');
bullet(code('ba-rekons') + ': BA REKONS — Tabel smart rekonsiliasi');
bullet(code('lembar-ba') + ': LEMBAR BA — Preview dokumen BA');
blank();
h4('Dynamic Fund Source Tabs');
L('Tab sumber dana dimuat ' + bold('dinamis dari API') + ' (bukan hardcoded):');
blank();
bullet('Data diambil via ' + code('window.arkas.getReconciliationFundSources(year)') + '');
bullet('Setiap sumber dana ditampilkan sebagai tab terpisah');
bullet('Label: nama sumber dana tanpa prefix "BOS "');
bullet('Background area tab: amber-50 dengan border amber-100');
bullet('Label: "SUMBER DANA"');
blank();
h4('Tab Rekap');
bullet(code('rekap-bunga') + ': BUNGA — Tabel rekap bunga bank');
bullet(code('rekap-pajak') + ': PAJAK — Tabel rekap pajak');
blank();

h3('Summary Stats (3 Cards)');
L('Pada tab BA REKONS, ditampilkan 3 kartu statistik:');
blank();
tableHeader('Kartu', 'Label', 'Detail', 'Border Color');
tableRow('1', 'Saldo Awal (Januari)', 'Total + breakdown Bank/Tunai', 'Emerald');
tableRow('2', 'Total Penerimaan', 'Total (Reguler + Kinerja + Bunga)', 'Biru');
tableRow('3', 'Saldo Akhir (Desember)', 'Total + breakdown Bank/Tunai', 'Amber');
blank();

h3('LEMBAR BA — Period Selector');
L('Di tab LEMBAR BA tersedia pemilihan periode:');
blank();
bullet(
  'Dropdown "Pilih Periode" dengan opsi: Triwulan I, Triwulan II, Triwulan III, Triwulan IV, Semester 1, Semester 2, Tahunan'
);
bullet(
  'Tombol "' + bold('Pengaturan Penandatangan') + '" (ikon Settings) untuk membuka signatory modal'
);
blank();

h3('Signatory Modal — Full Fields');
L('Modal pengaturan penandatangan memiliki field lengkap:');
blank();
tableHeader('Section', 'Field', 'Tipe', 'Placeholder/Deskripsi');
tableRow(
  'Logo Surat',
  'Logo Upload',
  'File input (image/*)',
  'Upload logo dengan preview + tombol "Hapus Logo"'
);
tableRow('Kop Surat', 'Baris 1', 'Text', 'e.g. PEMERINTAH KABUPATEN...');
tableRow('', 'Baris 2', 'Text', 'e.g. DINAS PENDIDIKAN...');
tableRow('', 'Alamat', 'Text', 'Alamat kantor');
tableRow('', 'Telepon/Fax', 'Text', 'Nomor telepon/fax');
tableRow('', 'Laman/Email', 'Text', 'Website/email');
tableRow('Dokumen', 'Nomor BA', 'Text', 'Contoh: 900/...');
tableRow('', 'Tanggal Surat', 'Date', 'Tanggal surat BA');
tableRow('PPTK BOSP', 'Nama', 'Text', 'Nama PPTK BOSP');
tableRow('', 'NIP', 'Text', 'NIP PPTK BOSP');
tableRow('Petugas Rekons', 'Nama', 'Text', 'Nama Petugas Rekons');
tableRow('', 'NIP', 'Text', 'NIP Petugas Rekons');
blank();
L(
  'Data disimpan via ' +
    code('window.arkas.saveSignatoryData(data)') +
    ' dan dimuat via ' +
    code('window.arkas.getSignatoryData()') +
    '.'
);
blank();

h2('7.2 Rekonsiliasi Bank');
L(
  'Halaman Rekonsiliasi Bank membandingkan saldo BKU dengan rekening koran bank. File: ' +
    code('src/pages/BankReconciliation.jsx') +
    '.'
);
blank();

h3('3 Summary Cards');
L('Di bagian atas ditampilkan 3 kartu ringkasan:');
blank();
tableHeader('Kartu', 'Label', 'Warna Angka', 'Detail');
tableRow('1', 'Saldo Bank BKU', 'Hitam (slate-800)', 'Dihitung otomatis dari data BKU');
tableRow('2', 'Saldo Rekening Koran', 'Biru (blue-700)', 'Input manual dari rekening koran');
tableRow('3', 'Selisih', bold('Color-coded'), 'Merah jika ada selisih, hijau jika cocok');
blank();

h3('Tabel Utama');
L('Tabel rekonsiliasi bank memiliki kolom:');
blank();
tableHeader('Kolom', 'Tipe', 'Deskripsi');
tableRow('No', 'Auto', 'Nomor urut');
tableRow('Bulan', 'Auto', 'Nama bulan');
tableRow('Saldo Awal Bank', 'Auto', 'Saldo awal bank bulan berjalan');
tableRow('Penerimaan Bank', 'Auto', 'Total penerimaan bank (hijau)');
tableRow('Pengeluaran Bank', 'Auto', 'Total pengeluaran bank (merah)');
tableRow('Saldo BKU', 'Auto', 'Saldo akhir menurut BKU (abu-abu)');
tableRow('Saldo Rekening Koran', bold('Input'), 'Input manual saldo rekening koran (biru)');
tableRow('Selisih', 'Auto', 'Selisih = Saldo BKU - Saldo Rekening Koran');
tableRow('Status', 'Auto', 'Indikator status');
blank();

h3('3 Status States');
L('Kolom Status menampilkan salah satu dari 3 state:');
blank();
tableHeader('Status', 'Ikon/Warna', 'Kondisi');
tableRow(
  bold('Belum Input'),
  'Teks abu-abu + background slate-100',
  'Saldo Rekening Koran belum diisi'
);
tableRow(bold('Cocok \u2705'), 'CheckCircle hijau (emerald)', 'Selisih = 0 dan ada input');
tableRow(bold('Selisih \u26A0\uFE0F'), 'AlertTriangle merah (red)', 'Selisih \u2260 0');
blank();

h3('Detail Arus Kas Bank Bulanan');
L('Di bawah tabel utama terdapat section ' + bold('"Detail Arus Kas Bank Bulanan"') + ':');
blank();
bullet('Grid kartu bulanan (1-3 kolom responsive)');
bullet('Setiap kartu menampilkan:');
bullet('  - Nama bulan (bold)');
bullet('  - Saldo Awal Bank');
bullet('  - + Penerimaan Bank (hijau)');
bullet('  - - Pengeluaran Bank (merah)');
bullet('  - Saldo Akhir BKU (bold, separator)');
bullet('  - Saldo Rekening Koran (biru, jika ada input)');
bullet('  - Selisih (hijau jika cocok, merah jika selisih)');
bullet('Kartu berwarna merah (bg-red-50/30) jika ada selisih');
blank();

h3('Save Button Feedback');
L('Tombol "' + bold('Simpan Saldo Bank') + '" memberikan feedback:');
blank();
bullet('Saat menyimpan: Ikon Loader2 berputar, teks "Menyimpan..."');
bullet('Setelah tersimpan: Teks berubah menjadi "' + bold('Tersimpan!') + '" selama 3 detik');
bullet('Lalu kembali ke teks normal "Simpan Saldo Bank"');
blank();
L('Data disimpan via ' + code('window.arkas.saveBankReconciliation(year, bankValues)') + '.');
blank();

h3('Info Card');
L('Kartu instruksi dengan background gradient emerald dan ikon Landmark:');
blank();
bullet(bold('Judul') + ': "Cara Menggunakan"');
bullet('4 langkah bernomor:');
bullet('  1. Kolom Saldo BKU dihitung otomatis dari data Buku Kas Umum');
bullet('  2. Masukkan Saldo Rekening Koran sesuai rekening asli dari bank');
bullet('  3. Kolom Selisih akan otomatis menunjukkan perbedaan');
bullet('  4. Klik Simpan untuk menyimpan data saldo rekening koran');
blank();

h2('7.3 SPTJM — Surat Pernyataan Tanggung Jawab Mutlak');
L(
  'Halaman SPTJM menghasilkan Surat Pernyataan Tanggung Jawab Mutlak. File: ' +
    code('src/pages/CetakSPTJM.jsx') +
    '.'
);
blank();

h3('In-Page Document Preview');
L('Dokumen SPTJM dirender ' + bold('langsung di halaman') + ' (bukan modal):');
blank();
bullet('Container putih dengan padding p-8, max-width 4xl, centered');
bullet('Judul dokumen: "SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK" (bold, center, underline)');
bullet('Paragraf pembuka yang menyebutkan ' + bold('fundLabel') + ', Semester, dan tahun anggaran');
blank();

h3('Document Fields');
L('Dokumen SPTJM berisi:');
blank();
tableHeader('No', 'Field', 'Sumber Data');
tableRow('1', 'NPSN', code('school.npsn'));
tableRow('2', 'Nama Sekolah', code('school.nama_sekolah'));
tableRow('3', 'Kode Sekolah', '(kosong, untuk diisi manual)');
tableRow('4', 'Nomor/Tanggal DPA SKPD', '(kosong, untuk diisi manual)');
blank();
L(
  'Data keuangan: Saldo Awal, Penerimaan (Tahap I + II + Jumlah), Pengeluaran (Belanja Operasi + Modal + Jumlah), Sisa Dana (Tunai + Bank).'
);
blank();

h3('Date Picker');
L('Tersedia date picker di toolbar untuk tanggal tanda tangan:');
blank();
bullet('Default: hari ini (' + code('new Date().toISOString().split("T")[0]') + ')');
bullet('Ikon Calendar di samping input');
bullet('Digunakan pada bagian tanda tangan dokumen');
blank();

h3('Tab Controls');
L('Toolbar memiliki 3 grup kontrol:');
blank();
bullet(bold('Semester') + ': Tombol Semester 1 / Semester 2');
bullet(bold('Sumber Dana') + ': BOS Reguler / BOS Kinerja');
bullet(bold('Export PDF') + ': Tombol merah untuk export PDF langsung');
blank();

h3('Export PDF');
L('Export PDF menggunakan jsPDF dengan format F4 (215x330mm):');
blank();
bullet('Orientasi: Portrait');
bullet('Font: Helvetica (bold untuk judul, normal untuk konten)');
bullet('Mencakup semua data dokumen + tanda tangan Kepala Sekolah');
bullet('Filename: ' + code('SPTJM_{fund}_Semester{N}_{year}.pdf') + '');
blank();

h2('7.4 Laporan K7/K7a');
L(
  'Laporan K7/K7a menampilkan Rekapitulasi Realisasi Penggunaan Dana BOSP. File: ' +
    code('src/pages/LaporanK7.jsx') +
    '.'
);
blank();

h3('Sub-Selectors');
L('Kontrol periode terdiri dari 3 bagian:');
blank();
bullet(
  bold('Period Type') +
    ': 3 tombol toggle — ' +
    code('tahap') +
    ', ' +
    code('bulan') +
    ', ' +
    code('tahunan')
);
bullet(bold('Periode Detail') + ': Muncul berdasarkan period type:');
bullet(
  '  - Jika ' + code('"Per Tahap"') + ': Tombol ' + bold('Tahap 1') + ' / ' + bold('Tahap 2') + ''
);
bullet('  - Jika ' + code('"Per Bulan"') + ': Dropdown 12 bulan');
bullet('  - Jika ' + code('"Tahunan"') + ': Tidak ada sub-selector');
bullet(bold('Sumber Dana') + ': BOS Reguler / BOS Kinerja');
bullet(bold('Signature Date Picker') + ': Input tanggal tanda tangan');
blank();

h3('7 Standar Nasional Pendidikan');
L('Tabel utama K7 menggunakan 7 standar sebagai baris:');
blank();
tableHeader('No', 'Nama Standar');
tableRow('1', 'Pengembangan Standar Isi');
tableRow('2', 'Standar Proses');
tableRow('3', 'Standar Tenaga Kependidikan');
tableRow('4', 'Standar Sarana dan Prasarana');
tableRow('5', 'Standar Pengelolaan');
tableRow('6', 'Pengembangan standar pembiayaan');
tableRow('7', 'Standar Penilaian Pendidikan');
blank();

h3('12 Sub Program');
L('Kolom cross-tabulasi menggunakan 12 kategori Sub Program:');
blank();
tableHeader('No', 'Nama Sub Program');
tableRow('1', 'Penerimaan Peserta Didik Baru');
tableRow('2', 'Pengembangan Perpustakaan');
tableRow('3', 'Pelaksanaan Kegiatan Pembelajaran dan Ekstrakurikuler');
tableRow('4', 'Pelaksanaan Kegiatan Asesmen/Evaluasi Pembelajaran');
tableRow('5', 'Pelaksanaan Administrasi Kegiatan Sekolah');
tableRow('6', 'Pengembangan Profesi Pendidik dan Tenaga Kependidikan');
tableRow('7', 'Pembiayaan Langganan Daya dan Jasa');
tableRow('8', 'Pemeliharaan Sarana dan Prasarana Sekolah');
tableRow('9', 'Penyediaan Alat Multi Media Pembelajaran');
tableRow('10', 'Penyelenggaraan Kegiatan Peningkatan Kompetensi Keahlian');
tableRow('11', 'Lain-lain');
tableRow('12', 'Pembayaran Honor');
blank();

h3('In-Page Preview');
L('Dokumen dirender langsung di halaman dengan:');
blank();
bullet(
  bold('Header') +
    ': Judul "REKAPITULASI REALISASI PENGGUNAAN DANA BOSP {FUND}", periode tanggal, dan sub-judul'
);
bullet(
  bold('Info Sekolah') + ': NPSN, Nama Sekolah, Kecamatan, Kabupaten/Kota, Provinsi, Sumber Dana'
);
bullet(bold('Tabel Utama') + ': Grid 7 standar x 12 sub program dengan baris JUMLAH');
blank();

h3('Summary Section');
L('Di bawah tabel terdapat ringkasan:');
blank();
bullet('Saldo periode sebelumnya');
bullet('Total penerimaan dana BOSP periode ini');
bullet('Total penggunaan dana BOSP periode ini');
bullet(bold('Akhir saldo BOSP periode ini') + ' (bold, hijau emerald)');
blank();

h3('Dual Signatures');
L('Bagian tanda tangan menggunakan ' + bold('dua kolom') + ':');
blank();
tableHeader('Posisi', 'Label', 'Nama');
tableRow('Kiri', 'Menyetujui, Kepala Sekolah', code('school.kepala_sekolah') + ' + NIP');
tableRow('Kanan', 'Bendahara/Penanggungjawab Kegiatan', code('school.bendahara') + ' + NIP');
blank();

h3('Export PDF');
L(
  'Export menggunakan jsPDF dengan format landscape F4 (330x215mm) dan autoTable untuk tabel kompleks (3 header rows, colSpan, rowSpan).'
);
blank();

h2('7.5 Register Kas');
L(
  'Halaman Register Penutupan Kas untuk menghitung dan mendokumentasikan saldo fisik kas. File: ' +
    code('src/pages/RegisterKas.jsx') +
    '.'
);
blank();

h3('3-Column Layout');
L('Halaman menggunakan layout ' + bold('3 kolom') + ':');
blank();
tableHeader('Kolom', 'Judul', 'Warna Header', 'Isi');
tableRow('1', bold('Uang Kertas'), 'Biru (blue-50/30)', 'Input jumlah lembar per pecahan');
tableRow('2', bold('Uang Logam'), 'Amber (amber-50/30)', 'Input jumlah keping per pecahan');
tableRow('3', bold('Ringkasan'), 'Oranye (orange-50/30)', 'Status balance & info saldo');
blank();

h3('Pecahan Uang Kertas');
L('7 pecahan uang kertas tersedia:');
bullet('Rp 100.000, Rp 50.000, Rp 20.000, Rp 10.000, Rp 5.000, Rp 2.000, Rp 1.000');
blank();
L('Setiap baris menampilkan: nominal × input = subtotal');
blank();

h3('Pecahan Uang Logam');
L('4 pecahan uang logam tersedia:');
bullet('Rp 1.000, Rp 500, Rp 200, Rp 100');
blank();

h3('Local Fund Source Selector');
L(
  'Di header halaman terdapat ' +
    bold('dropdown sumber dana lokal') +
    ' (terpisah dari filter global):'
);
blank();
bullet('Opsi: "Semua Sumber Dana" + daftar sumber dana dari ' + code('availableSources') + '');
bullet('Perubahan langsung memicu re-fetch data');
blank();

h3('Save Button with Timestamp');
L('Tombol "' + bold('Simpan') + '" dengan feedback dinamis:');
blank();
bullet('Normal: Ikon Save + teks "Simpan"');
bullet('Menyimpan: Ikon Save berputar (animate-spin) + teks "' + bold('Menyimpan...') + '"');
bullet('Timestamp: Jika sudah pernah disimpan, ditampilkan timestamp terakhir di samping tombol');
bullet('Format timestamp: ' + code('new Date(lastSaved).toLocaleString("id-ID")') + '');
blank();
L(
  'Data disimpan via ' +
    code('window.arkas.saveRegisterKas(year, month, fundSource, {notes, coins})') +
    '.'
);
blank();

h3('Ringkasan Column — Full Details');
L('Kolom ketiga menampilkan ringkasan lengkap:');
blank();
bullet(
  bold('Saldo Buku (Sistem)') +
    ': Saldo menurut sistem (' +
    code('balances.saldo_buku') +
    '), hitam, xl, bold'
);
bullet(bold('Total Fisik (Input)') + ': Total uang fisik yang diinput, indigo, xl, bold');
bullet('  - Badge biru: "Kertas {totalNotes}"');
bullet('  - Badge amber: "Logam {totalCoins}"');
bullet(bold('Balance Status') + ':');
bullet('  - Jika balance (0): Hijau + ikon CheckCircle + "Balance" + "Sesuai (Rp 0)"');
bullet('  - Jika tidak balance: Merah + ikon AlertTriangle + "Belum Balance"');
bullet('  - Pesan detail: "Uang fisik KURANG dari buku" atau "Uang fisik LEBIH dari buku"');
bullet(bold('Saldo Bank') + ': dari ' + code('balances.saldo_bank') + '');
bullet(bold('Saldo Pajak') + ': dari ' + code('balances.saldo_pajak') + '');
blank();

h3('Export Dropdown Menus');
L('Export dilakukan melalui ' + bold('dropdown menu') + ' (bukan tombol sederhana):');
blank();
h4('Register (K7b)');
bullet('Tombol indigo: "Register (K7b)" + ikon Printer + ChevronDown');
bullet('Dropdown:');
bullet('  - ' + bold('Export PDF') + ' (FileText merah): Register penutupan kas standar');
bullet('  - ' + bold('Export Excel') + ' (FileSpreadsheet hijau): Export ke format .xlsx');
blank();
h4('Berita Acara');
bullet('Tombol putih: "Berita Acara" + ikon Download + ChevronDown');
bullet('Dropdown:');
bullet('  - ' + bold('Export PDF') + ': Berita Acara Pemeriksaan Kas');
bullet('  - ' + bold('Export Excel') + ': Export ke format .xlsx');
blank();
L(
  'Dropdown muncul dari bawah ke atas (' +
    code('bottom-full') +
    ') dan hanya satu dropdown yang terbuka dalam satu waktu.'
);
blank();

hr();

// ====== SECTION 8: FITUR LAINNYA ======
h1('8. Fitur Lainnya');

h2('8.1 Backup & Restore');
L(
  'Halaman Backup & Restore memungkinkan pengguna untuk mencadangkan dan mengembalikan data SmartSPJ. File: ' +
    code('src/pages/BackupRestore.jsx') +
    '.'
);
blank();

h2('8.2 Pengaturan');
L(
  'Halaman Pengaturan untuk mengelola data pejabat sekolah. File: ' +
    code('src/pages/Pengaturan.jsx') +
    '.'
);
blank();

h3('Layout');
L('Halaman menggunakan layout ' + bold('2 kolom (1/3 + 2/3)') + ':');
blank();
bullet(bold('Kolom Kiri (1/3)') + ': Info Sekolah (Read-Only)');
bullet(bold('Kolom Kanan (2/3)') + ': Form Editable');
blank();

h3('Kolom Kiri — Info Sekolah (Read-Only)');
L('Menampilkan data sekolah yang tidak dapat diedit:');
blank();
tableHeader('Field', 'Sumber Data');
tableRow('Nama Sekolah', code('school.nama_sekolah'));
tableRow('NPSN', code('school.npsn'));
tableRow('Alamat', code('school.alamat') + ' / ' + code('school.alamat_jalan'));
tableRow('Lokasi', code('school.kecamatan') + ', ' + code('school.kabupaten'));
blank();
L('Terdapat ikon gembok (Lock) di judul section, dan catatan di bagian bawah:');
blank();
bullet(
  bold('Blue info box') +
    ': "Info di atas diambil langsung dari database asli (arkas.db) dan tidak dapat diubah di sini."'
);
bullet('Background: slate-50, border: slate-100, teks kecil (text-xs)');
blank();

h3('Kolom Kanan — Form Editable');
L('Form yang dapat diedit terdiri dari 3 section:');
blank();
h4('Section 1: Data Kepala Sekolah');
tableHeader('Field', 'Name Attribute', 'Placeholder');
tableRow('Nama Lengkap', code('kepala_sekolah'), 'Nama Kepala Sekolah');
tableRow('NIP', code('nip_kepala'), 'NIP Kepala Sekolah');
blank();
h4('Section 2: Data Bendahara');
tableHeader('Field', 'Name Attribute', 'Placeholder');
tableRow('Nama Lengkap', code('bendahara'), 'Nama Bendahara');
tableRow('NIP', code('nip_bendahara'), 'NIP Bendahara');
blank();
h4('Section 3: Surat Keputusan (SK)');
L('Terdapat ' + bold('blue info box') + ' di atas form SK:');
blank();
bullet('"Data SK ini akan muncul otomatis di kalimat pembuka Berita Acara."');
bullet('Background: blue-50, border: blue-100, teks: blue-700');
blank();
tableHeader('Field', 'Name Attribute', 'Placeholder');
tableRow('Nomor SK', code('nomor_sk'), 'Contoh: 11.30/SMP.NL/6/VII/2025');
tableRow('Tanggal SK', code('tanggal_sk'), 'Contoh: 01 Juli 2025');
blank();

h3('Success/Error Banner');
L('Setelah menyimpan, muncul banner notifikasi:');
blank();
bullet(
  bold('Sukses') +
    ': Banner hijau (emerald-50) + ikon CheckCircle + teks "Pengaturan berhasil disimpan!"'
);
bullet(bold('Error') + ': Banner merah (rose-50) + ikon AlertCircle + pesan error');
bullet('Banner muncul di ' + bold('atas form') + ' (bukan toast)');
bullet('Setelah sukses, data di-reload via ' + code('window.arkas.reloadSchoolData()') + '');
blank();

h3('Tombol Simpan');
L('Tombol "Simpan Pengaturan" di bagian bawah:');
blank();
bullet('Warna: slate-800 (hampir hitam)');
bullet('Ikon Save (lucide)');
bullet('Disable saat menyimpan (opacity-50, cursor-not-allowed)');
bullet('Teks berubah ke "Simpan..." saat proses berjalan');
blank();

hr();

// ====== SECTION 9: ALUR KERJA ======
h1('9. Alur Kerja SPJ Lengkap');
L('Berikut adalah alur kerja yang direkomendasikan untuk menyusun SPJ menggunakan SmartSPJ:');
blank();

h3('Langkah 1: Setup Awal');
bullet('Pastikan ARKAS terinstal dan database ' + code('arkas.db') + ' ada');
bullet('Buka SmartSPJ dan verifikasi data sekolah di Dashboard');
bullet('Klik "Muat Ulang Data" untuk sinkronisasi');
bullet('Pilih Tahun Anggaran dan Sumber Dana di header');
blank();

h3('Langkah 2: Verifikasi Penganggaran');
bullet('Buka ' + bold('Kertas Kerja (RKAS)') + ' untuk memverifikasi rencana anggaran');
bullet('Cek status "Disahkan" atau "Perlu Diperbaiki" di SchoolInfoCard');
bullet('Gunakan ' + bold('Realisasi Belanja') + ' untuk memantau progres penggunaan anggaran');
bullet('Bandingkan RKAS vs Realisasi untuk menemukan gap');
blank();

h3('Langkah 3: Penatausahaan');
bullet('Buka ' + bold('Buku Kas Umum') + ' untuk memverifikasi semua transaksi tercatat');
bullet('Periksa ' + bold('Buku Pembantu Bank') + ' dan ' + bold('Buku Pembantu Tunai') + '');
bullet(
  'Verifikasi ' + bold('Buku Pembantu Pajak') + ' — tambahkan entri manual jika ada yang terlewat'
);
bullet('Kelola ' + bold('Bukti Transaksi') + ' — cetak A2 dan Bukti Pengeluaran');
blank();

h3('Langkah 4: Rekonsiliasi');
bullet('Isi ' + bold('Rekonsiliasi Bank') + ' dengan saldo rekening koran');
bullet('Verifikasi kecocokan saldo di setiap bulan');
bullet('Buat ' + bold('BA Rekonsiliasi') + ' dengan mengisi penandatangan');
bullet('Generate LEMBAR BA untuk periode yang dipilih');
blank();

h3('Langkah 5: Laporan');
bullet('Generate ' + bold('SPTJM') + ' per semester');
bullet('Generate ' + bold('Laporan K7/K7a') + ' per periode');
bullet('Isi ' + bold('Register Kas') + ' dengan perhitungan fisik uang');
bullet('Cetak Register K7b dan Berita Acara Kas');
blank();

h3('Langkah 6: Finalisasi');
bullet('Export semua dokumen ke PDF/Excel');
bullet('Backup data via ' + bold('Backup & Restore') + '');
bullet('Verifikasi pengaturan di ' + bold('Pengaturan') + '');
blank();

hr();

// ====== SECTION 10: FAQ ======
h1('10. FAQ & Pemecahan Masulan');
blank();

h2('Pertanyaan Umum');
blank();

h3('Q: Apakah SmartSPJ mengubah data ARKAS?');
L(
  'Tidak. SmartSPJ hanya membaca data dari arkas.db (read-only). Semua data tambahan disimpan terpisah.'
);
blank();

h3('Q: Mengapa halaman Kertas Kerja kosong?');
L('Pastikan:');
bullet('Sumber Dana spesifik sudah dipilih (bukan "SEMUA")');
bullet('Kertas Kerja sudah disahkan di ARKAS');
bullet('Tahun Anggaran sudah benar');
blank();

h3('Q: Bagaimana cara menambah entri pajak manual?');
L(
  'Buka Buku Pembantu Pajak > klik tombol "Input Pajak Manual" (oranye) > isi form > Simpan. Entri akan muncul di area preview oranye di atas tabel.'
);
blank();

h3('Q: Status cetak bukti tidak tersimpan?');
L(
  'Status cetak disimpan di localStorage browser. Jika Anda membersihkan data browser, status cetak akan direset. Gunakan tombol "Reset Cetak" untuk mengatur ulang secara manual.'
);
blank();

h3('Q: Mengapa tombol export PDF/Excel tidak berfungsi?');
L('Pastikan:');
bullet('Data sudah dimuat dengan benar (tidak dalam state loading)');
bullet('Tab yang aktif memiliki data untuk di-export');
bullet('Cek console browser (F12) untuk error message');
blank();

h3('Q: Bagaimana cara mengubah penandatangan BA Rekonsiliasi?');
L(
  'Buka BA Rekonsiliasi > tab LEMBAR BA > klik "Pengaturan Penandatangan" (ikon Settings) > isi semua field > klik Simpan. Data akan tersimpan dan langsung diterapkan.'
);
blank();

h3('Q: Custom date di Bukti Pengeluaran hilang setelah refresh?');
L(
  'Custom date disimpan per-transaksi di localStorage dengan key ' +
    code('custom_date_{id_kas_umum}') +
    '. Selama localStorage tidak dibersihkan, data akan tetap ada.'
);
blank();

h2('Error Messages Umum');
blank();
tableHeader('Error', 'Penyebab', 'Solusi');
tableRow(
  '"Pilih Sumber Dana Spesifik"',
  'Filter global diset ke SEMUA',
  'Pilih sumber dana spesifik dari dropdown'
);
tableRow(
  '"Gagal Memuat Data"',
  'Koneksi ke database gagal',
  'Klik "Coba Lagi" atau restart aplikasi'
);
tableRow('"API tidak tersedia"', 'Preload script tidak dimuat', 'Restart aplikasi Electron');
tableRow(
  '"Tidak ada data untuk periode ini"',
  'BKU belum diisi',
  'Isi data transaksi di ARKAS terlebih dahulu'
);
blank();

h2('Keyboard Shortcuts');
L('SmartSPJ belum mendukung keyboard shortcuts khusus. Gunakan navigasi mouse/trackpad standar.');
blank();

h2('Teknologi & Dependensi Utama');
tableHeader('Package', 'Versi', 'Fungsi');
tableRow('electron', 'Build', 'Runtime desktop');
tableRow('react', '18+', 'Framework UI');
tableRow('tailwindcss', '3+', 'Utility CSS');
tableRow('jspdf', '2+', 'Generate PDF');
tableRow('jspdf-autotable', '3+', 'Tabel PDF');
tableRow('exceljs', '4+', 'Generate Excel');
tableRow('lucide-react', 'latest', 'Ikon');
tableRow('react-toastify', '9+', 'Notifikasi toast');
tableRow('better-sqlite3', '11+', 'Akses database SQLite');
blank();

hr();
L(
  '*Dokumentasi ini dihasilkan secara otomatis oleh script ' +
    code('scripts/generate-docs-v2.js') +
    ' pada ' +
    new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) +
    '.*'
);
blank();
L('---');
blank();
L(bold('SmartSPJ') + ' — Aplikasi Pendamping ARKAS untuk Pengelolaan SPJ BOS');
L('\u00A9 2025-2026 Kevin Doni. Dilindungi undang-undang hak cipta.');

// Write to file
const content = lines.join('\n');

fs.writeFileSync(outputPath, content, 'utf8');

const stats = fs.statSync(outputPath);
const lineCount = content.split('\n').length;
const sizeKB = (stats.size / 1024).toFixed(1);

console.log('Dokumentasi v2 berhasil dibuat!');
console.log('Lokasi: ' + outputPath);
console.log('Ukuran: ' + sizeKB + ' KB (' + stats.size + ' bytes)');
console.log('Jumlah baris: ' + lineCount);
