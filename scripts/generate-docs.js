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

lines.push('# Panduan Lengkap SmartSPJ');
lines.push('## Aplikasi Pendamping ARKAS untuk Pengelolaan SPJ BOS');
lines.push('');
lines.push('> Versi 1.3.0 | Terakhir diperbarui: 8 April 2026 | Pengembang: Kevin Doni');
lines.push('');
lines.push('---');
lines.push('');
lines.push('## Daftar Isi');
lines.push('');
lines.push('1. Pendahuluan');
lines.push('2. Instalasi & Persyaratan');
lines.push('3. Mengenal Antarmuka');
lines.push('4. Dashboard');
lines.push('5. Penganggaran (RKAS + Realisasi Belanja)');
lines.push('6. Penatausahaan (BKU Umum, Tunai, Bank, Pajak, Bukti Transaksi)');
lines.push('7. Laporan (BA Rekonsiliasi, Rekonsiliasi Bank, SPTJM, K7/K7a, Register Kas)');
lines.push('8. Fitur Lainnya (Backup & Restore, Pengaturan)');
lines.push('9. Alur Kerja SPJ Lengkap');
lines.push('10. FAQ');
lines.push('');
lines.push('---');
lines.push('');

// SECTION 1
lines.push('## 1. Pendahuluan');
lines.push('');
lines.push('### Apa itu SmartSPJ?');
lines.push('');
lines.push(
  'SmartSPJ adalah aplikasi desktop berbasis **Electron** yang berfungsi sebagai pendamping **ARKAS** untuk membantu para bendahara sekolah dalam menyusun **Surat Pertanggungjawaban (SPJ)** dana **Bantuan Operasional Sekolah (BOS)**.'
);
lines.push('');
lines.push('### Apa itu ARKAS?');
lines.push('');
lines.push(
  'ARKAS (Administrasi Keuangan Sekolah) adalah sistem administrasi keuangan resmi yang dikembangkan oleh **Kementerian Pendidikan dan Kebudayaan (Kemdikbud)** Republik Indonesia. ARKAS digunakan oleh seluruh sekolah penerima BOS untuk mengelola anggaran, mencatat transaksi keuangan, dan melaporkan pertanggungjawaban dana BOS.'
);
lines.push('');
lines.push('### Hubungan SmartSPJ dengan ARKAS');
lines.push('');
lines.push(
  'SmartSPJ membaca data dari database ARKAS (`arkas.db`) yang terenkripsi SQLCipher. Penting untuk dipahami:'
);
lines.push('');
lines.push('- SmartSPJ **hanya MEMBACA** data dari ARKAS (read-only)');
lines.push('- SmartSPJ **tidak mengubah** data di database ARKAS');
lines.push('- Data tambahan yang dihasilkan SmartSPJ disimpan terpisah di folder `data/`');
lines.push('');
lines.push('### Mengapa Perlu SmartSPJ?');
lines.push('');
lines.push(
  'ARKAS sebagai sistem utama memiliki beberapa keterbatasan yang menjadi alasan dibuatnya SmartSPJ:'
);
lines.push('');
lines.push('| Keterbatasan ARKAS | Solusi SmartSPJ |');
lines.push('|---|---|');
lines.push('| Terbatas dalam cetak dokumen SPJ | Menyediakan cetak profesional (PDF & Excel) |');
lines.push(
  '| Tidak ada fitur rekonsiliasi bank otomatis | Rekonsiliasi bank dengan perbandingan saldo |'
);
lines.push('| Analisis realisasi terbatas | Dashboard & grafik analisis realisasi lengkap |');
lines.push(
  '| Pengelolaan bukti transaksi manual | Sistem pengelolaan & cetak bukti terintegrasi |'
);
lines.push('| Tidak ada backup data tambahan | Backup & restore data pengaturan |');
lines.push('');
lines.push('### Fitur Utama');
lines.push('');
lines.push('| No | Fitur | Deskripsi |');
lines.push('|---|---|---|');
lines.push('| 1 | Dashboard | Ringkasan visual keuangan sekolah |');
lines.push('| 2 | Buku Kas Umum (BKU) | Catatan utama penerimaan & pengeluaran |');
lines.push('| 3 | Buku Pembantu Tunai | Sub-ledger transaksi tunai |');
lines.push('| 4 | Buku Pembantu Bank | Sub-ledger transaksi bank |');
lines.push('| 5 | Buku Pembantu Pajak | Sub-ledger pungutan & setoran pajak |');
lines.push('| 6 | Kertas Kerja (RKAS) | Rencana Kegiatan dan Anggaran Sekolah |');
lines.push('| 7 | Realisasi Belanja | Perbandingan RKAS vs realisasi |');
lines.push('| 8 | BA Rekonsiliasi | Berita Acara Rekonsiliasi dana BOS |');
lines.push('| 9 | Rekonsiliasi Bank | Perbandingan saldo BKU vs rekening koran |');
lines.push('| 10 | SPTJM | Surat Pernyataan Tanggung Jawab Mutlak |');
lines.push('| 11 | Laporan K7/K7a | Matriks standar nasional pendidikan |');
lines.push('| 12 | Register Kas | Penutupan kas & perhitungan uang fisik |');
lines.push('| 13 | Bukti Transaksi | Pengelolaan & cetak nota/kwitansi |');
lines.push('| 14 | Backup & Restore | Cadangan dan pemulihan data |');
lines.push('');
lines.push('---');
lines.push('');

// SECTION 2
lines.push('## 2. Instalasi & Persyaratan');
lines.push('');
lines.push('### Persyaratan Sistem');
lines.push('');
lines.push('| Komponen | Keterangan |');
lines.push('|---|---|');
lines.push('| Sistem Operasi | Windows 10 atau lebih baru |');
lines.push('| ARKAS | Harus sudah terinstall di komputer yang sama |');
lines.push('| Ruang Penyimpanan | Minimal ~200 MB |');
lines.push('| RAM | Minimal 4 GB (disarankan 8 GB) |');
lines.push('');
lines.push('### Prasyarat Data');
lines.push('');
lines.push('Sebelum menggunakan SmartSPJ, pastikan:');
lines.push('');
lines.push('1. Database ARKAS tersedia di lokasi: `%AppData%/Arkas/arkas.db`');
lines.push('2. Minimal sudah ada **anggaran yang disahkan** di ARKAS');
lines.push('3. Anda mengetahui **password** database ARKAS (jika diminta)');
lines.push('');
lines.push('### Catatan Penting');
lines.push('');
lines.push('- SmartSPJ **tidak mengubah** data ARKAS sama sekali');
lines.push(
  '- Data tambahan SmartSPJ (pengaturan, entri manual, dll.) disimpan di folder `data/` terpisah'
);
lines.push('- SmartSPJ dapat berjalan bersamaan dengan ARKAS');
lines.push('');
lines.push('---');
lines.push('');

// SECTION 3
lines.push('## 3. Mengenal Antarmuka');
lines.push('');
lines.push('### Tata Letak (Layout)');
lines.push('');
lines.push('Antarmuka SmartSPJ terdiri dari tiga bagian utama:');
lines.push('');
lines.push('```');
lines.push('┌──────────────────────────────────────────────────────┐');
lines.push('│                    HEADER (Filter Global)             │');
lines.push('├────────────┬─────────────────────────────────────────┤');
lines.push('│            │                                         │');
lines.push('│  SIDEBAR   │              KONTEN                     │');
lines.push('│  (Menu)   │         (Halaman Aktif)                │');
lines.push('│            │                                         │');
lines.push('│            │                                         │');
lines.push('│            │                                         │');
lines.push('├────────────┴─────────────────────────────────────────┤');
lines.push('│                    STATUS BAR                         │');
lines.push('└──────────────────────────────────────────────────────┘');
lines.push('```');
lines.push('');
lines.push('### Struktur Menu Sidebar');
lines.push('');
lines.push('Menu diorganisasikan dalam beberapa grup:');
lines.push('');
lines.push('| Grup | Menu |');
lines.push('|---|---|');
lines.push('| **UTAMA** | Dashboard |');
lines.push('| **PENGANGGARAN** | Kertas Kerja (RKAS), Realisasi Belanja |');
lines.push(
  '| **PENATAUSAHAAN** | Buku Kas Umum, Buku Pembantu Tunai, Buku Pembantu Bank, Buku Pembantu Pajak, Bukti Transaksi |'
);
lines.push(
  '| **LAPORAN** | BA Rekonsiliasi, Rekonsiliasi Bank, Cetak SPTJM, Laporan K7/K7a, Register Kas |'
);
lines.push('| **LAINNYA** | Backup & Restore, Pengaturan, About |');
lines.push('');
lines.push('### Header — Filter Global');
lines.push('');
lines.push('Di bagian atas aplikasi terdapat filter global yang berlaku untuk seluruh halaman:');
lines.push('');
lines.push('| Filter | Deskripsi |');
lines.push('|---|---|');
lines.push('| Tahun Anggaran | Dropdown untuk memilih tahun anggaran aktif |');
lines.push('| Sumber Dana | Pilihan: SEMUA, BOS Reguler, BOS Kinerja, Lainnya |');
lines.push('| Indikator Koneksi | Lampu hijau = terhubung ke database, merah = tidak terhubung |');
lines.push('');
lines.push(
  '> **Tips:** Filter di header akan mempengaruhi semua data yang ditampilkan di setiap halaman.'
);
lines.push('');
lines.push('---');
lines.push('');

// SECTION 4
lines.push('## 4. Dashboard');
lines.push('');
lines.push(
  'Dashboard merupakan halaman utama yang menampilkan ringkasan visual keuangan sekolah. Dashboard terdiri dari beberapa komponen:'
);
lines.push('');
lines.push('### 4.1 SchoolInfoCard (Informasi Sekolah)');
lines.push('');
lines.push('Menampilkan informasi dasar sekolah:');
lines.push('');
lines.push('- **Nama Sekolah** dan **NPSN**');
lines.push('- **Alamat** lengkap sekolah');
lines.push('');
lines.push('Serta 6 badge status:');
lines.push('');
lines.push('| Badge | Keterangan |');
lines.push('|---|---|');
lines.push('| Status BKU | Menunjukkan apakah BKU sudah ada data |');
lines.push('| Kertas Kerja | Status RKAS (belum disusun / sudah disusun / disahkan) |');
lines.push('| Terima Dana | Apakah sekolah sudah menerima dana BOS |');
lines.push('| Revisi | Status revisi anggaran |');
lines.push('| Sisa Pagu | Sisa pagu anggaran yang belum direalisasi |');
lines.push('| Respon | Status respons terhadap data |');
lines.push('');
lines.push('Terdapat tombol **Sinkronkan** untuk memperbarui data dari database ARKAS.');
lines.push('');
lines.push('### 4.2 TopCards (Kartu Ringkasan)');
lines.push('');
lines.push('Empat kartu ringkasan utama:');
lines.push('');
lines.push('| Kartu | Warna | Keterangan |');
lines.push('|---|---|---|');
lines.push('| Pagu Anggaran | Rose (merah muda) | Total pagu anggaran yang disahkan |');
lines.push('| Penerimaan | Emerald (hijau) | Total dana yang diterima |');
lines.push('| Realisasi Belanja | Red (merah) | Total belanja yang sudah direalisasi |');
lines.push('| Sisa Anggaran | Emerald (hijau) | Sisa anggaran yang belum digunakan |');
lines.push('');
lines.push('### 4.3 MasterProgress (Progress Penyerapan)');
lines.push('');
lines.push('Progress bar yang menunjukkan tingkat penyerapan anggaran:');
lines.push('');
lines.push('| Kategori | Rentang | Warna |');
lines.push('|---|---|---|');
lines.push('| Tinggi | ≥ 75% | Hijau |');
lines.push('| Sedang | 40% – 74% | Kuning/Oranye |');
lines.push('| Rendah | < 40% | Merah |');
lines.push('');
lines.push('### 4.4 KategoriBelanja (Kategori Belanja)');
lines.push('');
lines.push('Tiga kartu kategori belanja berdasarkan standar akuntansi:');
lines.push('');
lines.push('| Kategori | Keterangan |');
lines.push('|---|---|');
lines.push('| **Barang & Jasa** | Belanja operasional rutin (ATK, listrik, internet, dll.) |');
lines.push('| **Modal Alat & Mesin** | Pembelian peralatan dan mesin |');
lines.push('| **Modal Aset Tetap** | Pembelian aset tetap (tanah, bangunan, dll.) |');
lines.push('');
lines.push('### 4.5 Grafik & Tabel Analisis');
lines.push('');
lines.push('Dashboard juga menyajikan beberapa visualisasi data:');
lines.push('');
lines.push('1. **Arus Kas** — Grafik chart aliran kas masuk dan keluar');
lines.push('2. **Pergerakan Kas Bulanan** — Grafik perubahan saldo kas per bulan');
lines.push(
  '3. **Ringkasan per Sumber Dana** — Tabel ringkasan berdasarkan sumber dana (BOS Reguler, BOS Kinerja, dll.)'
);
lines.push('4. **Belanja per Kegiatan** — Tabel rincian belanja per kegiatan');
lines.push('5. **Top 5 Belanja** — Lima pos belanja terbesar');
lines.push('6. **Riwayat Transaksi** — Daftar transaksi terbaru');
lines.push('');
lines.push('---');
lines.push('');

// SECTION 5
lines.push('## 5. Penganggaran (RKAS + Realisasi Belanja)');
lines.push('');
lines.push('### 5.1 Kertas Kerja (RKAS)');
lines.push('');
lines.push(
  '**RKAS (Rencana Kegiatan dan Anggaran Sekolah)** adalah dokumen perencanaan anggaran yang menjadi acuan pengelolaan keuangan sekolah. Data RKAS diambil langsung dari ARKAS.'
);
lines.push('');
lines.push('#### Syarat Penggunaan');
lines.push('');
lines.push(
  '- Harus memilih **sumber dana spesifik** (BOS Reguler atau BOS Kinerja), bukan "SEMUA"'
);
lines.push('- RKAS harus sudah **disahkan** di ARKAS');
lines.push('');
lines.push('#### Format Tampilan');
lines.push('');
lines.push('Tersedia 4 format tampilan RKAS:');
lines.push('');
lines.push('| No | Format | Deskripsi |');
lines.push('|---|---|---|');
lines.push('| 1 | Rincian Tahunan | Tampilan lengkap seluruh tahun dalam satu tabel |');
lines.push('| 2 | Triwulan | Data dikelompokkan per triwulan (4 triwulan) |');
lines.push('| 3 | Bulanan | Data dikelompokkan per bulan (12 bulan) |');
lines.push('| 4 | Lembar Kertas Kerja | Format lembar kerja formal untuk dicetak |');
lines.push('');
lines.push('#### Data yang Ditampilkan');
lines.push('');
lines.push('Setiap baris RKAS menampilkan informasi berikut:');
lines.push('');
lines.push('- **Kode Kegiatan** — Kode standar kegiatan');
lines.push('- **Kode Rekening** — Kode akun/rekening belanja');
lines.push('- **Uraian** — Deskripsi kegiatan atau belanja');
lines.push('- **Volume** — Jumlah unit yang direncanakan');
lines.push('- **Satuan** — Satuan pengukuran (buah, lembar, orang, dll.)');
lines.push('- **Harga Satuan** — Harga per unit');
lines.push('- **Jumlah Pagu** — Total anggaran (volume × harga satuan)');
lines.push('');
lines.push('### 5.2 Realisasi Belanja');
lines.push('');
lines.push(
  'Halaman Realisasi Belanja membandingkan antara **RKAS (rencana)** dengan **BKU (realisasi aktual)**. Ini membantu bendahara memantau apakah penggunaan anggaran sesuai dengan rencana.'
);
lines.push('');
lines.push('#### Mode Tampilan');
lines.push('');
lines.push('Tersedia 3 mode tampilan:');
lines.push('');
lines.push('| Mode | Deskripsi |');
lines.push('|---|---|');
lines.push(
  '| **Ringkasan** | Tampilan ringkas per kegiatan — menampilkan total pagu, total realisasi, dan sisa per kegiatan |'
);
lines.push(
  '| **Rincian** | Tampilan flat semua item belanja — detail per item dengan kode rekening dan jumlah |'
);
lines.push(
  '| **RKAS vs Realisasi** | Tampilan side-by-side — membandingkan kolom rencana dan kolom realisasi secara berdampingan |'
);
lines.push('');
lines.push('#### Filter Periode');
lines.push('');
lines.push('- **Kumulatif** — Menampilkan total akumulasi dari awal tahun');
lines.push('- **Per Bulan** — Dapat memilih bulan tertentu untuk melihat realisasi bulanan');
lines.push('');
lines.push('#### Status Badges');
lines.push('');
lines.push('Setiap item realisasi memiliki status badge dengan arti sebagai berikut:');
lines.push('');
lines.push('| Status | Warna | Arti |');
lines.push('|---|---|---|');
lines.push(
  '| Sesuai Target | Hijau | Realisasi sesuai dengan rencana RKAS pada periode yang ditentukan |'
);
lines.push('| Belum Terealisasi | Abu-abu | Item belum memiliki realisasi sama sekali |');
lines.push(
  '| Terbayar (Rapel) | Biru | Item dibayar di bulan yang berbeda dari rencana (bayar tertunda/rapel) |'
);
lines.push(
  '| Realisasi Geser Bulan | Kuning | Realisasi terjadi di bulan yang berbeda dari jadwal RKAS |'
);
lines.push('| Melampaui Pagu | Merah | Total realisasi melebihi pagu anggaran yang ditetapkan |');
lines.push('| Akumulatif | Ungu | Penjumlahan dari beberapa bulan |');
lines.push('| Parsial | Oranye | Realisasi hanya sebagian dari rencana |');
lines.push('');
lines.push('#### Detail Modal');
lines.push('');
lines.push('Klik pada item untuk membuka detail modal yang menampilkan:');
lines.push('');
lines.push('- **Timeline bulanan** — Progress realisasi per bulan untuk item tersebut');
lines.push('- Grafik batang perbandingan RKAS vs realisasi per bulan');
lines.push('- Total kumulatif dan sisa pagu');
lines.push('');
lines.push('---');
lines.push('');

// SECTION 6
lines.push('## 6. Penatausahaan');
lines.push('');
lines.push(
  'Bagian penatausahaan mencakup seluruh buku kas dan bukti transaksi yang diperlukan dalam penyusunan SPJ.'
);
lines.push('');
lines.push('### 6.1 Buku Kas Umum');
lines.push('');
lines.push(
  'Buku Kas Umum adalah **catatan utama** semua penerimaan dan pengeluaran sekolah. Ini merupakan buku kas pokok yang wajib diisi dan dicetak sebagai bagian SPJ.'
);
lines.push('');
lines.push('#### Kolom Data');
lines.push('');
lines.push('| Kolom | Keterangan |');
lines.push('|---|---|');
lines.push('| Tanggal | Tanggal transaksi |');
lines.push('| No Bukti | Nomor bukti transaksi |');
lines.push('| Kode Kegiatan | Kode kegiatan terkait |');
lines.push('| Kode Rekening | Kode akun/rekening |');
lines.push('| Uraian | Deskripsi transaksi |');
lines.push('| Penerimaan | Jumlah uang masuk |');
lines.push('| Pengeluaran | Jumlah uang keluar |');
lines.push('| Saldo | Saldo berjalan (running balance) |');
lines.push('');
lines.push('#### Fitur');
lines.push('');
lines.push('- **Filter Bulan** — Tampilkan data per bulan tertentu');
lines.push('- **Pencarian** — Cari transaksi berdasarkan kata kunci');
lines.push('- **Filter Jenis** — Filter berdasarkan jenis transaksi (penerimaan/pengeluaran)');
lines.push('- **Export PDF** — Cetak buku kas dalam format PDF');
lines.push('- **Export Excel** — Cetak buku kas dalam format Excel');
lines.push('');
lines.push('#### Opsi Export');
lines.push('');
lines.push('- **Bulan Tertentu** — Export hanya bulan yang sedang ditampilkan');
lines.push('- **Semua Bulan** — Export seluruh bulan (Januari–Desember) dalam satu file');
lines.push('');
lines.push('#### Saldo Awal');
lines.push('');
lines.push('- Saldo awal bulan **Januari** = 0');
lines.push('- Saldo awal bulan lainnya dihitung otomatis dari saldo akhir bulan sebelumnya');
lines.push('');
lines.push('### 6.2 Buku Pembantu Tunai');
lines.push('');
lines.push(
  'Buku Pembantu Tunai adalah **sub-ledger** khusus yang mencatat seluruh transaksi yang dilakukan secara **TUNAI**.'
);
lines.push('');
lines.push('#### Perspektif Arus Kas');
lines.push('');
lines.push('Penting untuk memahami perspektif arus kas pada buku tunai:');
lines.push('');
lines.push('| Jenis Transaksi | Perspektif Buku Tunai | Keterangan |');
lines.push('|---|---|---|');
lines.push(
  '| Tarik Tunai (Bank → Kas) | **Penerimaan** | Uang ditarik dari rekening bank ke kas tunai |'
);
lines.push(
  '| Setor Tunai (Kas → Bank) | **Pengeluaran** | Uang disetor dari kas tunai ke rekening bank |'
);
lines.push('');
lines.push('#### Saldo Awal');
lines.push('');
lines.push('Saldo awal diambil dari data dengan `id_ref_bku = 9` di database.');
lines.push('');
lines.push('### 6.3 Buku Pembantu Bank');
lines.push('');
lines.push(
  'Buku Pembantu Bank adalah **sub-ledger** khusus yang mencatat seluruh transaksi yang dilakukan melalui **rekening BANK**.'
);
lines.push('');
lines.push('#### Saldo Awal');
lines.push('');
lines.push('Saldo awal diambil dari data dengan `id_ref_bku = 8` di database.');
lines.push('');
lines.push('### 6.4 Buku Pembantu Pajak');
lines.push('');
lines.push(
  'Buku Pembantu Pajak mencatat seluruh pungutan pajak (penerimaan) dan setoran pajak (pengeluaran) yang terkait dengan kegiatan belanja sekolah.'
);
lines.push('');
lines.push('#### Jenis Pajak');
lines.push('');
lines.push('| Jenis Pajak | Tarif | Keterangan |');
lines.push('|---|---|---|');
lines.push('| PPN | 11% | Pajak Pertambahan Nilai |');
lines.push('| PPh 21 | 5–6% | Pajak Penghasilan Pasal 21 |');
lines.push('| PPh 22 | Variabel | Pajak Penghasilan Pasal 22 |');
lines.push('| PPh 23 | 2% | Pajak Penghasilan Pasal 23 |');
lines.push('| PPh 4(2) | 10% | Pajak Penghasilan Final |');
lines.push('| Pajak Daerah | 10% | Pajak daerah setempat |');
lines.push('');
lines.push('#### Entri Pajak Manual');
lines.push('');
lines.push(
  'SmartSPJ menyediakan fitur untuk menambahkan entri pajak secara manual. Terdapat 3 jenis entri:'
);
lines.push('');
lines.push('| Jenis Entri | Keterangan |');
lines.push('|---|---|');
lines.push('| Saldo Awal Tahun | Untuk mencatat saldo awal pajak di awal tahun anggaran |');
lines.push(
  '| Hutang Bulan | Untuk mencatat kewajiban pajak di bulan tertentu yang belum disetor |'
);
lines.push('| Transaksi | Entri pajak reguler (pungutan atau setoran) |');
lines.push('');
lines.push('#### Cara Menambah Entri Manual');
lines.push('');
lines.push('1. Klik tombol **+ Tambah Entri Manual**');
lines.push('2. Pilih **Jenis Input** (Saldo Awal / Hutang Bulan / Transaksi)');
lines.push('3. Pilih **Jenis Pajak** (PPN, PPh 21, PPh 22, dll.)');
lines.push('4. Pilih **Posisi**: Pungutan (penerimaan) atau Setoran (pengeluaran)');
lines.push('5. Isi **Tanggal** transaksi');
lines.push('6. Masukkan **Nominal** jumlah pajak');
lines.push('7. Isi **Keterangan** (opsional)');
lines.push('8. Isi **No Bukti** (opsional)');
lines.push('9. Klik **Simpan**');
lines.push('');
lines.push(
  '> **Catatan:** Data pajak manual disimpan terpisah dari database ARKAS dan tidak akan mengubah data ARKAS.'
);
lines.push('');
lines.push('### 6.5 Bukti Transaksi (Nota)');
lines.push('');
lines.push(
  'Halaman Bukti Transaksi menyediakan pengelolaan dan pencetakan bukti-bukti transaksi keuangan.'
);
lines.push('');
lines.push('#### Tab Nota Gabungan');
lines.push('');
lines.push('- Transaksi dikelompokkan berdasarkan **nomor nota**');
lines.push('- Dapat difilter **per bulan**');
lines.push('- Klik untuk **expand** detail transaksi dalam setiap grup nota');
lines.push('');
lines.push('#### Tab Cetak Manual');
lines.push('');
lines.push('- Daftar transaksi dengan **checkbox** untuk seleksi');
lines.push('- **Batch print** — cetak beberapa dokumen sekaligus');
lines.push('- **Tracking status cetak** — menandai transaksi yang sudah dicetak');
lines.push('');
lines.push('#### Jenis Dokumen');
lines.push('');
lines.push('| Jenis | Format | Keterangan |');
lines.push('|---|---|---|');
lines.push('| Kwitansi (A2) | Formulir A2 | Bukti penerimaan/pengeluaran standar |');
lines.push('| Bukti Pengeluaran | Formulir standar | Bukti pengeluaran belanja |');
lines.push('| Kwitansi Gabungan | Gabungan | Kwitansi untuk beberapa transaksi sekaligus |');
lines.push('| Bukti Gabungan | Gabungan | Bukti pengeluaran untuk beberapa transaksi sekaligus |');
lines.push('');
lines.push('#### Isi Dokumen');
lines.push('');
lines.push('Setiap dokumen bukti transaksi berisi:');
lines.push('');
lines.push('- **Kop Dinas** — Kepala dinas pendidikan');
lines.push('- **Tahun Anggaran** — Tahun anggaran aktif');
lines.push('- **Kode Rekening** — Kode akun terkait');
lines.push('- **Uraian** — Deskripsi belanja');
lines.push('- **Jumlah** — Dalam angka dan terbilang');
lines.push('- **Rincian Pajak** — Detail pajak yang dipotong');
lines.push('- **4 Kolom Tanda Tangan:**');
lines.push('  1. Kepala Sekolah');
lines.push('  2. Bendahara');
lines.push('  3. Pemegang Barang / Pengurus Barang');
lines.push('  4. Toko / Vendor / Pihak Ketiga');
lines.push('');
lines.push('---');
lines.push('');

// SECTION 7
lines.push('## 7. Laporan');
lines.push('');
lines.push('Bagian laporan menyediakan seluruh dokumen resmi yang diperlukan dalam SPJ.');
lines.push('');
lines.push('### 7.1 BA Rekonsiliasi');
lines.push('');
lines.push(
  '**Berita Acara Rekonsiliasi** adalah dokumen resmi pertanggungjawaban penggunaan dana BOS yang memuat rekonsiliasi (perbandingan) antara data keuangan sekolah dengan catatan dinas pendidikan.'
);
lines.push('');
lines.push('#### Struktur Tab');
lines.push('');
lines.push('Tersedia 5 tab pada halaman BA Rekonsiliasi:');
lines.push('');
lines.push('| Tab | Keterangan |');
lines.push('|---|---|');
lines.push('| BA REKONS | Tabel utama berisi data rekonsiliasi lengkap |');
lines.push('| LEMBAR BA | Preview formal dokumen BA yang siap cetak |');
lines.push('| Per Sumber Dana | Data rekonsiliasi per sumber dana (BOS Reguler/Kinerja) |');
lines.push('| REKAP BUNGA | Rekapitulasi bunga bank |');
lines.push('| REKAP PAJAK | Rekapitulasi pajak yang dipotong/setor |');
lines.push('');
lines.push('#### Data yang Ditampilkan');
lines.push('');
lines.push('- **Saldo Awal** — Saldo awal periode');
lines.push('- **Penerimaan** — Total penerimaan dana');
lines.push('- **Pengeluaran** — Total pengeluaran belanja');
lines.push('- **Pajak** — Total pajak');
lines.push('- **Saldo Akhir** — Saldo akhir setelah dikurangi pengeluaran dan pajak');
lines.push('');
lines.push('#### Period Selector');
lines.push('');
lines.push('| Periode | Rentang |');
lines.push('|---|---|');
lines.push('| Triwulan I | Januari – Maret |');
lines.push('| Triwulan II | April – Juni |');
lines.push('| Triwulan III | Juli – September |');
lines.push('| Triwulan IV | Oktober – Desember |');
lines.push('| Semester 1 | Januari – Juni |');
lines.push('| Semester 2 | Juli – Desember |');
lines.push('| Tahunan | Januari – Desember |');
lines.push('');
lines.push('#### Pengaturan Penandatangan');
lines.push('');
lines.push('Sebelum mencetak BA Rekonsiliasi, perlu diisi pengaturan penandatangan:');
lines.push('');
lines.push('- **PPTK BOSP** — Nama pejabat pembina keuangan');
lines.push('- **Petugas Rekons** — Nama petugas rekonsiliasi');
lines.push('- **Nomor BA** — Nomor berita acara');
lines.push('- **Tanggal Surat** — Tanggal diterbitkan');
lines.push('- **Kop Surat** — Upload logo dinas pendidikan');
lines.push('');
lines.push('#### Export');
lines.push('');
lines.push('- **PDF** — Format kertas F4/Legal');
lines.push('- **Excel** — Format spreadsheet');
lines.push('');
lines.push('### 7.2 Rekonsiliasi Bank');
lines.push('');
lines.push(
  'Rekonsiliasi Bank membandingkan **saldo BKU** (dari catatan pembukuan) dengan **saldo rekening koran** (dari bank).'
);
lines.push('');
lines.push('#### Cara Penggunaan');
lines.push('');
lines.push('1. Pilih **bulan** yang akan direkonsiliasi');
lines.push('2. Isi kolom **Saldo Rekening Koran** dengan saldo dari rekening koran bank');
lines.push('3. Klik **Simpan**');
lines.push(
  '4. Sistem akan otomatis menghitung **selisih** antara saldo BKU dan saldo rekening koran'
);
lines.push('');
lines.push('#### Status');
lines.push('');
lines.push('| Status | Tampilan | Arti |');
lines.push('|---|---|---|');
lines.push('| Cocok | ✅ | Saldo BKU sama dengan saldo rekening koran |');
lines.push('| Selisih | ⚠️ | Terdapat perbedaan antara saldo BKU dan rekening koran |');
lines.push('');
lines.push(
  '> **Tips:** Lakukan rekonsiliasi bank setiap bulan untuk memastikan catatan keuangan akurat.'
);
lines.push('');
lines.push('### 7.3 Cetak SPTJM');
lines.push('');
lines.push(
  '**SPTJM (Surat Pernyataan Tanggung Jawab Mutlak)** adalah dokumen pernyataan resmi yang ditandatangani oleh Kepala Sekolah sebagai bentuk pertanggungjawaban mutlak atas pengelolaan dana BOS.'
);
lines.push('');
lines.push('#### Opsi');
lines.push('');
lines.push('- **Semester:** Pilih Semester 1 atau Semester 2');
lines.push('- **Sumber Dana:** BOS Reguler atau BOS Kinerja');
lines.push('- **Tanggal Tanda Tangan** — Tanggal penandatanganan SPTJM');
lines.push('');
lines.push('#### Isi Dokumen SPTJM');
lines.push('');
lines.push('Dokumen SPTJM berisi:');
lines.push('');
lines.push('- **Identitas Sekolah** — Nama, NPSN, alamat');
lines.push('- **A. Saldo Awal** — Saldo awal semester');
lines.push('- **B. Penerimaan** — Total penerimaan (Tahap I + Tahap II)');
lines.push('- **C. Pengeluaran** — Total pengeluaran (Operasi + Modal)');
lines.push('- **D. Sisa Dana** — Sisa dana (Saldo Bank + Saldo Tunai)');
lines.push('- **Pernyataan Hukum** — Pernyataan tanggung jawab secara hukum');
lines.push('- **Tanda Tangan Kepala Sekolah**');
lines.push('');
lines.push('#### Export');
lines.push('');
lines.push('- **PDF** — Format dokumen resmi');
lines.push('');
lines.push('### 7.4 Laporan K7/K7a');
lines.push('');
lines.push(
  'Laporan K7/K7a adalah matriks yang menggambarkan alokasi dan realisasi belanja berdasarkan **7 Standar Nasional Pendidikan** terhadap **12 Sub Program**.'
);
lines.push('');
lines.push('#### Opsi Tampilan');
lines.push('');
lines.push('| Opsi | Pilihan |');
lines.push('|---|---|');
lines.push('| Periode | Per Tahap / Per Bulan / Tahunan |');
lines.push('| Sumber Dana | BOS Reguler / BOS Kinerja |');
lines.push('');
lines.push('#### Ringkasan Data');
lines.push('');
lines.push('Setiap laporan K7/K7a menampilkan ringkasan:');
lines.push('');
lines.push('- **Saldo Sebelumnya** — Saldo dari periode sebelumnya');
lines.push('- **Penerimaan** — Dana yang diterima');
lines.push('- **Pengeluaran** — Total belanja');
lines.push('- **Saldo Akhir** — Saldo setelah pengeluaran');
lines.push('');
lines.push('#### Export');
lines.push('');
lines.push('- **PDF F4 Landscape** — Format kertas F4 dengan orientasi landscape');
lines.push('');
lines.push('### 7.5 Register Kas');
lines.push('');
lines.push(
  'Register Kas (K7b) adalah formulir **penutupan kas** yang digunakan untuk menghitung dan memverifikasi uang fisik yang ada di kas sekolah terhadap saldo menurut pembukuan.'
);
lines.push('');
lines.push('#### Cara Penggunaan');
lines.push('');
lines.push('1. Pilih **bulan** dan **sumber dana**');
lines.push('2. Hitung uang fisik di kas');
lines.push('3. Masukkan **jumlah lembar/keping** untuk setiap denominasi');
lines.push('4. Sistem otomatis menghitung total');
lines.push('');
lines.push('#### Denominasi');
lines.push('');
lines.push('**Uang Kertas:**');
lines.push('');
lines.push('| Denominasi | Nilai |');
lines.push('|---|---|');
lines.push('| Rp 100.000 | Seratus ribu rupiah |');
lines.push('| Rp 50.000 | Lima puluh ribu rupiah |');
lines.push('| Rp 20.000 | Dua puluh ribu rupiah |');
lines.push('| Rp 10.000 | Sepuluh ribu rupiah |');
lines.push('| Rp 5.000 | Lima ribu rupiah |');
lines.push('| Rp 2.000 | Dua ribu rupiah |');
lines.push('| Rp 1.000 | Seribu rupiah |');
lines.push('');
lines.push('**Uang Logam:**');
lines.push('');
lines.push('| Denominasi | Nilai |');
lines.push('|---|---|');
lines.push('| Rp 1.000 | Seribu rupiah |');
lines.push('| Rp 500 | Lima ratus rupiah |');
lines.push('| Rp 200 | Dua ratus rupiah |');
lines.push('| Rp 100 | Seratus rupiah |');
lines.push('');
lines.push('#### Perhitungan Otomatis');
lines.push('');
lines.push('- **Subtotal Kertas** — Total dari seluruh uang kertas');
lines.push('- **Subtotal Logam** — Total dari seluruh uang logam');
lines.push('- **Total Fisik** — Subtotal kertas + subtotal logam');
lines.push('- **Balance** — Total fisik vs saldo buku');
lines.push('');
lines.push('#### Status');
lines.push('');
lines.push('| Status | Tampilan | Arti |');
lines.push('|---|---|---|');
lines.push('| Sesuai | ✅ | Uang fisik sama dengan saldo buku |');
lines.push('| Kurang/Lebih | ❌ | Terdapat selisih antara uang fisik dan saldo buku |');
lines.push('');
lines.push('#### Data Tambahan');
lines.push('');
lines.push('- **Saldo Bank** — Otomatis dari BKU');
lines.push('- **Saldo Pajak** — Otomatis dari BKU');
lines.push('');
lines.push('#### Export');
lines.push('');
lines.push('| Dokumen | Format |');
lines.push('|---|---|');
lines.push('| Register Kas (K7b) | PDF, Excel |');
lines.push('| Berita Acara Pemeriksaan Kas | PDF, Excel |');
lines.push('');
lines.push('---');
lines.push('');

// SECTION 8
lines.push('## 8. Fitur Lainnya');
lines.push('');
lines.push('### 8.1 Backup & Restore');
lines.push('');
lines.push(
  'SmartSPJ menyediakan fitur backup dan restore untuk menjaga keamanan data tambahan yang dibuat oleh aplikasi.'
);
lines.push('');
lines.push('#### Opsi Backup');
lines.push('');
lines.push('| Opsi | Keterangan |');
lines.push('|---|---|');
lines.push('| **Backup Data** | Mencadangkan 6 file JSON dan localStorage (ukuran kecil, cepat) |');
lines.push(
  '| **Backup Lengkap** | Mencadangkan seluruh folder `data/` (ukuran lebih besar, komprehensif) |'
);
lines.push('| **Restore** | Mengembalikan data dari file backup |');
lines.push('');
lines.push('#### Data yang Di-backup');
lines.push('');
lines.push('File-file berikut dicadangkan saat melakukan Backup Data:');
lines.push('');
lines.push('| No | File | Keterangan |');
lines.push('|---|---|---|');
lines.push('| 1 | `config.json` | Konfigurasi aplikasi |');
lines.push('| 2 | `register-kas.json` | Data register kas |');
lines.push('| 3 | `manual_taxes.json` | Entri pajak manual |');
lines.push('| 4 | `nota-groups.json` | Pengelompokan nota |');
lines.push('| 5 | `ba_signatory.json` | Data penandatangan BA |');
lines.push('| 6 | `bank-reconciliation.json` | Data rekonsiliasi bank |');
lines.push('| 7 | localStorage | Data penyimpanan lokal browser |');
lines.push('');
lines.push('#### Data yang TIDAK Di-backup');
lines.push('');
lines.push('- `arkas.db` — Database ARKAS (file ini milik ARKAS)');
lines.push('- Password database');
lines.push('');
lines.push(
  '> **Tips:** Gunakan **Backup Lengkap** jika Anda ingin memindahkan seluruh data ke komputer lain.'
);
lines.push('');
lines.push('### 8.2 Pengaturan');
lines.push('');
lines.push(
  'Halaman Pengaturan menyediakan konfigurasi data sekolah dan pejabat yang diperlukan untuk pencetakan dokumen.'
);
lines.push('');
lines.push('#### Info Sekolah (Read-Only dari ARKAS)');
lines.push('');
lines.push('| Data | Keterangan |');
lines.push('|---|---|');
lines.push('| Nama Sekolah | Nama resmi sekolah |');
lines.push('| NPSN | Nomor Pokok Sekolah Nasional |');
lines.push('| Alamat | Alamat lengkap sekolah |');
lines.push('| Lokasi | Kota/Kabupaten |');
lines.push('');
lines.push('#### Data yang Dapat Diedit');
lines.push('');
lines.push('| Data | Keterangan |');
lines.push('|---|---|');
lines.push('| Nama Kepala Sekolah | Nama lengkap beserta gelar |');
lines.push('| NIP Kepala Sekolah | Nomor Induk Pegawai |');
lines.push('| Nama Bendahara | Nama lengkap beserta gelar |');
lines.push('| NIP Bendahara | Nomor Induk Pegawai |');
lines.push('| Nomor SK | Nomor Surat Keputusan penunjukan bendahara |');
lines.push('| Tanggal SK | Tanggal diterbitkannya SK |');
lines.push('');
lines.push(
  '> **Penting:** Isi data pengaturan **SEBELUM** mencetak dokumen apapun agar dokumen yang dihasilkan lengkap dan benar.'
);
lines.push('');
lines.push('---');
lines.push('');

// SECTION 9
lines.push('## 9. Alur Kerja SPJ Lengkap');
lines.push('');
lines.push(
  'Berikut adalah panduan langkah demi langkah untuk menyusun SPJ BOS menggunakan SmartSPJ:'
);
lines.push('');
lines.push('### Langkah-Langkah');
lines.push('');
lines.push('| Langkah | Aktivitas | Keterangan |');
lines.push('|---|---|---|');
lines.push(
  '| 1 | Install SmartSPJ + Isi Pengaturan | Install aplikasi, buka menu Pengaturan, isi data pejabat (Kepala Sekolah, Bendahara, SK) |'
);
lines.push(
  '| 2 | Dashboard — Verifikasi Data | Buka Dashboard, pastikan semua data terisi, cek badge status |'
);
lines.push('| 3 | Cek RKAS | Buka menu Kertas Kerja, verifikasi rencana anggaran sudah sesuai |');
lines.push(
  '| 4 | Review 4 BKU | Periksa Buku Kas Umum, Buku Tunai, Buku Bank, Buku Pajak — pastikan transaksi tercatat lengkap |'
);
lines.push(
  '| 5 | Analisis Realisasi Belanja | Buka Realisasi, gunakan mode **RKAS vs Realisasi**, cek apakah penggunaan sesuai rencana |'
);
lines.push(
  '| 6 | Rekonsiliasi Bank | Isi saldo rekening koran setiap bulan, pastikan selisih = 0 |'
);
lines.push(
  '| 7 | Register Kas | Hitung uang fisik, masukkan per denominasi, pastikan balance sesuai |'
);
lines.push(
  '| 8 | Cetak Bukti Transaksi | Cetak Bukti Pengeluaran dan Kwitansi (A2) untuk setiap transaksi |'
);
lines.push('| 9 | Susun Laporan | Cetak BA Rekonsiliasi, SPTJM, dan K7/K7a |');
lines.push(
  '| 10 | Backup Data | Lakukan Backup Data untuk menyimpan seluruh konfigurasi dan data tambahan |'
);
lines.push('');
lines.push('### Urutan Cetak Dokumen SPJ');
lines.push('');
lines.push('Berikut adalah urutan cetak dokumen SPJ yang disarankan:');
lines.push('');
lines.push('| No | Dokumen | Menu |');
lines.push('|---|---|---|');
lines.push('| 1 | Buku Kas Umum | Penatausahaan → Buku Kas Umum → Export PDF |');
lines.push('| 2 | Buku Pembantu Tunai | Penatausahaan → Buku Pembantu Tunai → Export PDF |');
lines.push('| 3 | Buku Pembantu Bank | Penatausahaan → Buku Pembantu Bank → Export PDF |');
lines.push('| 4 | Buku Pembantu Pajak | Penatausahaan → Buku Pembantu Pajak → Export PDF |');
lines.push(
  '| 5 | Bukti Pengeluaran & Kwitansi (A2) | Penatausahaan → Bukti Transaksi → Tab Cetak Manual |'
);
lines.push('| 6 | Rekonsiliasi Bank | Laporan → Rekonsiliasi Bank → Export |');
lines.push('| 7 | Register Kas | Laporan → Register Kas → Export PDF |');
lines.push('| 8 | BA Rekonsiliasi | Laporan → BA Rekonsiliasi → Export PDF |');
lines.push('| 9 | SPTJM | Laporan → Cetak SPTJM → Export PDF |');
lines.push('| 10 | Laporan K7/K7a | Laporan → Laporan K7/K7a → Export PDF |');
lines.push('| 11 | Backup | Lainnya → Backup & Restore → Backup Data |');
lines.push('');
lines.push('---');
lines.push('');

// SECTION 10
lines.push('## 10. FAQ (Pertanyaan yang Sering Diajukan)');
lines.push('');
lines.push('**Q: Apakah SmartSPJ mengubah data ARKAS?**');
lines.push('');
lines.push(
  'A: Tidak. SmartSPJ bersifat **read-only** terhadap database ARKAS. SmartSPJ hanya membaca data dan tidak mengubah, menambah, atau menghapus data apapun di ARKAS. Data tambahan SmartSPJ disimpan terpisah di folder `data/`.'
);
lines.push('');
lines.push('---');
lines.push('');
lines.push('**Q: Kenapa indikator koneksi berwarna merah?**');
lines.push('');
lines.push(
  'A: Indikator koneksi berwarna merah berarti SmartSPJ tidak dapat terhubung ke database ARKAS. Pastikan:'
);
lines.push('- ARKAS sudah terinstall di komputer yang sama');
lines.push('- File `arkas.db` tersedia di `%AppData%/Arkas/`');
lines.push('- Tidak ada aplikasi lain yang mengunci file database');
lines.push('');
lines.push('---');
lines.push('');
lines.push('**Q: Kenapa data yang ditampilkan kosong?**');
lines.push('');
lines.push('A: Beberapa kemungkinan:');
lines.push('- **Tahun anggaran** belum dipilih dengan benar di filter header');
lines.push('- **Sumber dana** belum dipilih (beberapa fitur memerlukan sumber dana spesifik)');
lines.push(
  '- **RKAS belum disahkan** di ARKAS — pastikan RKAS sudah disahkan sebelum data dapat ditampilkan'
);
lines.push('');
lines.push('---');
lines.push('');
lines.push('**Q: Bagaimana cara mengubah nama Kepala Sekolah di dokumen?**');
lines.push('');
lines.push(
  'A: Buka menu **Lainnya → Pengaturan**, lalu edit kolom **Nama Kepala Sekolah** dan **NIP**. Data ini akan otomatis digunakan di semua dokumen yang dicetak.'
);
lines.push('');
lines.push('---');
lines.push('');
lines.push('**Q: Apakah SmartSPJ bisa digunakan tanpa ARKAS?**');
lines.push('');
lines.push(
  'A: Tidak. SmartSPJ adalah aplikasi **pendamping** ARKAS. Semua data keuangan utama (anggaran, transaksi, dll.) dibaca dari database ARKAS. Tanpa ARKAS, SmartSPJ tidak memiliki data untuk ditampilkan.'
);
lines.push('');
lines.push('---');
lines.push('');
lines.push('**Q: Apa arti status "Melampaui Pagu"?**');
lines.push('');
lines.push(
  'A: Status "Melampaui Pagu" berarti total realisasi belanja untuk suatu item **melebihi** pagu anggaran yang telah ditetapkan di RKAS. Ini perlu ditinjau karena menandakan ada pengeluaran yang melebihi rencana anggaran.'
);
lines.push('');
lines.push('---');
lines.push('');
lines.push('**Q: Data pajak belum lengkap, apa yang harus dilakukan?**');
lines.push('');
lines.push(
  'A: Gunakan fitur **Entri Pajak Manual** di menu Buku Pembantu Pajak. Anda dapat menambahkan entri manual untuk jenis pajak yang belum tercatat secara otomatis. Data ini disimpan terpisah dan tidak mengubah data ARKAS.'
);
lines.push('');
lines.push('---');
lines.push('');
lines.push('**Q: File backup disimpan di mana?**');
lines.push('');
lines.push(
  'A: File backup berupa arsip **.ZIP** yang disimpan di lokasi yang Anda pilih sendiri saat melakukan backup. Anda akan diminta memilih folder penyimpanan saat mengklik tombol Backup.'
);
lines.push('');
lines.push('---');
lines.push('');
lines.push('**Q: Apakah file backup bisa dipindahkan ke PC lain?**');
lines.push('');
lines.push(
  'A: Ya. Gunakan opsi **Backup Lengkap** untuk membackup seluruh folder `data/`. Kemudian di PC baru, install SmartSPJ, buka Backup & Restore, dan pilih **Restore** untuk mengembalikan data.'
);
lines.push('');
lines.push('---');
lines.push('');
lines.push('**Q: Seberapa sering harus melakukan backup?**');
lines.push('');
lines.push('A: Disarankan melakukan backup:');
lines.push('- Setiap selesai menyusun SPJ');
lines.push('- Setiap akhir bulan');
lines.push('- Sebelum melakukan update aplikasi');
lines.push('- Sebelum melakukan perubahan besar pada data');
lines.push('');
lines.push('---');
lines.push('');
lines.push('');
lines.push(
  '*Dokumentasi ini dibuat untuk SmartSPJ v1.3.0. Untuk pertanyaan lebih lanjut, hubungi pengembang.*'
);

const content = lines.join('\n');

const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(outputPath, content, 'utf8');

const stats = fs.statSync(outputPath);
const sizeKB = (stats.size / 1024).toFixed(2);

console.log('Dokumentasi berhasil dibuat!');
console.log('Lokasi: ' + outputPath);
console.log('Ukuran file: ' + sizeKB + ' KB');
console.log('Jumlah baris: ' + lines.length);
