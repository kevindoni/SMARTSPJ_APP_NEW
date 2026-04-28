# Panduan Lengkap SmartSPJ v2
## Aplikasi Pendamping ARKAS untuk Pengelolaan SPJ BOS

> Versi 2.0.0 | Terakhir diperbarui: 8 April 2026 | Pengembang: Kevin Doni

*Dokumentasi lengkap hasil audit komprehensif — mencakup setiap fitur, tombol, dan alur kerja.*

---

## Daftar Isi

1. Pendahuluan
2. Instalasi & Persyaratan
3. Mengenal Antarmuka
4. Dashboard & Informasi Sekolah
5. Penganggaran (RKAS + Realisasi Belanja)
6. Penatausahaan (BKU Umum, Tunai, Bank, Pajak, Bukti Transaksi)
7. Laporan (BA Rekonsiliasi, Rekonsiliasi Bank, SPTJM, K7/K7a, Register Kas)
8. Fitur Lainnya (Backup & Restore, Pengaturan)
9. Alur Kerja SPJ Lengkap
10. FAQ & Pemecahan Masalah

---

## 1. Pendahuluan

### Apa itu SmartSPJ?

SmartSPJ adalah aplikasi desktop berbasis **Electron.js** yang berfungsi sebagai pendamping **ARKAS** (Administrasi Keuangan Sekolah) untuk membantu para bendahara sekolah di Indonesia dalam menyusun **Surat Pertanggungjawaban (SPJ)** dana **Bantuan Operasional Sekolah (BOS)**.

Aplikasi ini dibangun menggunakan:
- Electron sebagai runtime desktop
- React.js dengan JSX untuk antarmuka pengguna
- Tailwind CSS untuk styling
- SQLCipher untuk membaca database terenkripsi ARKAS
- jsPDF + autoTable untuk pembuatan dokumen PDF
- ExcelJS untuk pembuatan dokumen Excel
- Lucide React untuk ikon antarmuka

### Hubungan SmartSPJ dengan ARKAS

SmartSPJ membaca data dari database ARKAS (`arkas.db`) yang terenkripsi SQLCipher:

- SmartSPJ **hanya MEMBACA** data dari ARKAS (read-only)
- SmartSPJ **tidak mengubah** data di database ARKAS
- Data tambahan yang dihasilkan SmartSPJ disimpan terpisah di folder `data/`
- Data pengaturan penandatangan BA Rekonsiliasi disimpan via `window.arkas.saveSignatoryData()`
- Status cetak bukti transaksi disimpan di `localStorage` browser (key: `printed_groups`)
- Custom date per transaksi disimpan di `localStorage` (key: `custom_date_{id_kas_umum}`)

### Arsitektur Sistem

SmartSPJ menggunakan arsitektur Electron dengan komunikasi IPC:

| Komponen | Teknologi | Fungsi |
| --- | --- | --- |
| Main Process | Electron (Node.js) | Akses filesystem, database, IPC handlers |
| Renderer Process | React.js + Tailwind | Antarmuka pengguna (UI) |
| Preload Script | contextBridge | Jembatan API antara Main & Renderer |
| Database Handler | better-sqlite3 + SQLCipher | Baca data dari arkas.db |
| Export Engine | jsPDF, ExcelJS | Generate dokumen PDF & Excel |

---

## 2. Instalasi & Persyaratan

### Persyaratan Sistem

| Komponen | Minimum | Direkomendasikan |
| --- | --- | --- |
| OS | Windows 10 64-bit | Windows 11 64-bit |
| RAM | 4 GB | 8 GB |
| Storage | 500 MB | 1 GB |
| ARKAS | Terinstal dan berjalan | Versi terbaru |
| Node.js | v18 LTS | v20 LTS |

### Struktur Folder Proyek

```
SmartSPJ/
├── electron/
│   ├── main.js              ← Entry point Electron
│   ├── main-loader.js
│   ├── preload.js           ← Bridge API ke renderer
│   └── handlers/            ← IPC handlers (database, export, dll)
├── src/
│   ├── pages/               ← Halaman utama (Dashboard, BKU, dll)
│   ├── components/          ← Komponen React reusable
│   ├── context/             ← React Context (FilterContext)
│   ├── hooks/               ← Custom hooks (useArkasData, dll)
│   ├── utils/               ← Helper functions
│   ├── config/              ← Konfigurasi tabel & kolom
│   └── theme/               ← Definisi tema UI
├── data/                    ← Data SmartSPJ (terpisah dari ARKAS)
├── docs/                    ← Dokumentasi
└── scripts/                 ← Script utilitas
```

### Cara Menjalankan (Development)

```bash
npm install        # Install dependencies
npm run dev        # Jalankan mode development (Vite)
npm run build      # Build untuk produksi
npm run electron   # Jalankan Electron app
```

---

## 3. Mengenal Antarmuka

### Tata Letak Utama

SmartSPJ menggunakan layout **Sidebar + Main Content** yang terdiri dari:

- **Sidebar (kiri)**: Navigasi menu utama, selalu terlihat
- **Header (atas)**: Filter global (Tahun Anggaran & Sumber Dana) + identitas
- **Main Content (tengah)**: Area konten halaman yang aktif

### Sidebar — Menu Navigasi

Sidebar menampilkan logo SmartSPJ, versi aplikasi, dan 5 grup menu:

| Grup | Menu | ID Tab | Ikon |
| --- | --- | --- | --- |
| — | Dashboard | `dashboard` | LayoutDashboard |
| **PENGANGGARAN** | Kertas Kerja (RKAS) | `kertas-kerja` | Table |
|  | Realisasi Belanja | `realisasi-belanja` | PieChart |
| **PENATAUSAHAAN** | Buku Kas Umum | `transactions` | BookOpen |
|  | Buku Pembantu Tunai | `cash-report` | Wallet |
|  | Buku Pembantu Bank | `bank-report` | Landmark |
|  | Buku Pembantu Pajak | `tax-report` | PieChart |
|  | Bukti Transaksi | `nota-groups` | FileStack |
| **LAPORAN** | BA Rekonsiliasi | `reconciliation` | FileBarChart |
|  | Rekonsiliasi Bank | `bank-reconciliation` | Scale |
|  | Cetak SPTJM | `sptjm` | FileSignature |
|  | Laporan K7 / K7a | `k7-report` | ClipboardList |
|  | Register Kas | `register-kas` | Printer |
| **LAINNYA** | Backup & Restore | `backup-restore` | HardDrive |
|  | Pengaturan | `settings` | Settings |
|  | Tentang Aplikasi | `about` | Info |

Versi aplikasi ditampilkan di bagian bawah sidebar, dimuat via `window.arkas.getAppVersion()`.

### Header — Filter Global

Header menampilkan filter yang berlaku untuk **semua halaman**:

- **Tahun Anggaran (TA)**: Dropdown untuk memilih tahun (misal: 2025, 2026)
- **Sumber Dana**: Dropdown dengan opsi `SEMUA` atau sumber dana spesifik (misal: BOS Reguler, BOS Kinerja)

Filter ini disimpan di `FilterContext` dan secara otomatis memicu re-fetch data saat berubah.

---

## 4. Dashboard & Informasi Sekolah

### 4.1 SchoolInfoCard — Kartu Informasi Sekolah

SchoolInfoCard adalah komponen utama di Dashboard yang menampilkan informasi sekolah dan status-badge. Dibagi menjadi dua bagian: **Identitas** dan **Status Grid**.

#### Bagian Atas: Identitas & Aksi

| Elemen | Deskripsi |
| --- | --- |
| Ikon Sekolah | Avatar bulat berwarna sky-100 dengan ikon School (lucide) |
| Nama Sekolah | Judul utama (bold, xl) yang diambil dari `school.nama` |
| Badge "Tersinkronisasi" | Badge hijau (emerald) yang muncul setelah sinkronisasi berhasil via `scrapedData` |
| Alamat | Teks dari `school.alamat` atau `scrapedData.alamat` |
| Badge NPSN | Badge kecil "NPSN: 12345678" |
| Badge Wilayah | Gabungan provinsi, kabupaten, kecamatan |
| **Tombol "Muat Ulang Data"** | Tombol dengan ikon RefreshCw. Label berubah ke "Memuat Data..." saat proses berjalan, ikon berputar (animate-spin) |
| Label "Data dari Database Lokal" | Teks italic kecil di bawah tombol, menampilkan tanggal update: "Terakhir di-update: `toLocaleDateString(id-ID)`" |
| Badge Indikator Sumber Dana | Badge biru kecil "`🎯 {selectedFundSource}`" — menampilkan "Gabungan Sumber Dana" jika SEMUA |

#### Sinkronisasi — Detail Proses

Ketika tombol "Muat Ulang Data" diklik, dilakukan **dua operasi**:

- **1. Reload dari DB lokal**: Memanggil `window.arkas.reloadSchoolData()` — memuat ulang data sekolah dari database arkas.db
- **2. Sync via NPSN**: Jika NPSN tersedia, memanggil `window.arkas.syncRegionData(school.npsn)` — mengambil data wilayah (provinsi, kabupaten, kecamatan) dari API eksternal

Hasil sinkronisasi ditampilkan via toast notification:
- Sukses: `toast.success("Data berhasil disinkronkan!")` (hijau, 3 detik)
- Gagal: `toast.error("Gagal menyinkronkan data.")` (merah, 3 detik)

#### Bagian Bawah: Status Grid (6 Badge)

Grid 2x3 (mobile) atau 1x6 (desktop) dengan 6 badge status:

##### 1. Status BKU

Menampilkan bulan dan status pengiriman BKU:
- Format: "`{bulan} • {status}`"
- Jika `status_pengiriman === 2`: Badge biru, teks "**Terkirim**"
- Jika status lain: Badge kuning, teks "**Draf**"
- Jika belum ada data: Teks italic "Belum Terkirim/Belum Diaktivasi"

Data diambil dari `window.arkas.getDashboardBadges(year, fundSource)` → `badges.bku`.

##### 2. Kertas Kerja (Pengesahan)

Menampilkan status validasi Kertas Kerja:
- Jika `is_sah === 1`: Badge hijau + ikon CheckCircle2, teks "**Disahkan**"
- Jika `is_sah !== 1`: Badge merah + ikon XCircle, teks "**Perlu Diperbaiki**"
- Jika belum disahkan: Teks italic "Belum Disahkan"

##### 3. Terima Dana

Menampilkan transfer dana terakhir:
- Baris 1: Uraian transfer (`badges.transfer.uraian`, teks tebal, truncate)
- Baris 2: Tanggal transfer (format: "25 Jan")
- Jika belum ada: Teks italic "Belum Terima Dana"

##### 4. Revisi

Menampilkan level revisi:
- Jika `nomor === 0`: Badge indigo, teks "**Murni**"
- Jika `nomor > 0`: Teks "**Rev-N**" (misal: Rev-1, Rev-2)
- Jika di-approve (`is_approve === 1`): Warna indigo
- Jika belum: Warna abu-abu

##### 5. Sisa Pagu

Menampilkan selisih anggaran:
- Nilai: `badges.pagu_sisa` diformat IDR
- Tooltip (title attribute) panjang menjelaskan perhitungan:
-   "(+) Positif: Ada dana belum direncanakan kegiatannya"
-   "(0) Nol: Anggaran sudah pas (Balance)"
-   "(-) Negatif: Rencana belanja melebihi anggaran"
- Jika `pagu_sisa === 0`: Teks hijau "Balance" + ikon centang
- Jika `pagu_sisa > 0`: Teks "Belum Diplot"
- Jika `pagu_sisa < 0`: Teks merah "Defisit"

##### 6. Respon

Menampilkan komentar/pesan dari dinas (pengesahan):
- Label: "💬 Respon"
- Konten: `badges.pengesahan.keterangan` (truncate, max-width 120px)
- Tooltip menampilkan pesan lengkap
- Default: "Tidak ada pesan."

### 4.2 Komponen Dashboard Lainnya

Selain SchoolInfoCard, Dashboard juga menampilkan komponen dari direktori `components/dashboard/`:

- **MasterProgress (v3)**: Progress bar utama realisasi keseluruhan
- **TopCards (v3)**: Kartu statistik ringkasan (Pagu, Realisasi, Sisa)
- **KategoriBelanja (v3)**: Grafik breakdown kategori belanja
- **RingkasanSumberDana (v3)**: Ringkasan per sumber dana
- **RiwayatTransaksi (v3)**: Tabel riwayat transaksi terbaru
- **StrategicSpending (v3)**: Analisis pengeluaran strategis
- **PergerakanKasBulanan (v3)**: Grafik pergerakan kas per bulan
- **StatCardPro (v2)**: Kartu statistik versi 2
- **SpendingAnalysis (v2)**: Analisis pengeluaran versi 2
- **RevenueChart (v2)**: Grafik penerimaan versi 2
- **ActivityFeed (v2)**: Feed aktivitas terbaru versi 2

---

## 5. Penganggaran (RKAS + Realisasi Belanja)

### 5.1 Kertas Kerja (RKAS)

Halaman Kertas Kerja menampilkan Rencana Kegiatan dan Anggaran Sekolah (RKAS) dalam berbagai format. Diakses via menu **Penganggaran > Kertas Kerja (RKAS)**.

File: `src/pages/KertasKerja.jsx`, Toolbar: `src/components/KertasKerja/KertasKerjaToolbar.jsx`

#### Prasyarat

Halaman ini **memerlukan sumber dana spesifik** untuk ditampilkan. Jika filter global menunjukkan `SEMUA`, akan muncul pesan peringatan:

- Ikon AlertCircle berwarna amber
- Judul: "Pilih Sumber Dana Spesifik"
- Pesan: "Untuk melihat rincian Kertas Kerja yang rapi dan terstruktur, mohon **pilih salah satu Sumber Dana** (misal: BOS Reguler) pada menu filter di pojok kanan atas."

#### Format Laporan yang Tersedia

Pengguna memilih format melalui dropdown "Format RKAS:" di toolbar:

| No | Format | Deskripsi |
| --- | --- | --- |
| 1 | **Rincian RKAS (Tahunan)** | Ringkasan RKAS keseluruhan tahun anggaran |
| 2 | **Rincian RKAS (Triwulan)** | RKAS dikelompokkan per triwulan (3 bulanan) |
| 3 | **Rincian RKAS (Bulanan)** | RKAS per bulan individu — *memunculkan dropdown bulan tambahan* |
| 4 | **Lembar Kertas Kerja (Triwulan)** | Hanya tersedia untuk periode Triwulan — tampilan lembar kerja formal |

#### Month Sub-Selector

Ketika format yang dipilih adalah **"Rincian RKAS (Bulanan)"**, sebuah dropdown tambahan muncul secara otomatis di sebelah kanan dropdown format:

- Ikon Calendar di sisi kiri dropdown
- Berisi 12 bulan: Januari, Februari, Maret, April, Mei, Juni, Juli, Agustus, September, Oktober, November, Desember
- Animasi masuk: `animate-in fade-in slide-in-from-left-2`

#### Pencarian

Terdapat fitur pencarian real-time di toolbar:

- Input field dengan placeholder "**Cari Kegiatan / Barang...**"
- Ikon Search (lucide) di sisi kiri input
- Filter dilakukan pada `searchTerm` yang dikirim ke hook `useKertasKerjaData()`
- Pencarian bersifat case-insensitive dan memfilter baris yang mengandung teks pencarian

#### Export Options — "Cetak / Export"

Di sisi kanan toolbar terdapat tombol dropdown **"Cetak / Export"**:

- Tombol hijau dengan ikon Download + teks "Cetak / Export" + ikon ChevronDown
- Dropdown menu muncul saat diklik (animasi fade-in dari atas)
- Opsi yang tersedia:
-   1. **Cetak PDF** — Ikon Printer merah, memanggil `exportToPDF()`
-   2. **Export Excel** — Ikon FileSpreadsheet hijau, memanggil `exportToExcel()`
- Dropdown menutup otomatis saat klik di luar area (via `mousedown` event listener)

#### Komponen Tabel

Berdasarkan format yang dipilih, tabel berbeda dirender:

| Format | Komponen | File |
| --- | --- | --- |
| Rincian RKAS (Tahunan) | `KertasKerjaFormalTableAnnual` | `KertasKerjaFormalTableAnnual.jsx` |
| Rincian RKAS (Triwulan) | `KertasKerjaFormalTableQuarterly` | `KertasKerjaFormalTableQuarterly.jsx` |
| Rincian RKAS (Bulanan) | `KertasKerjaFormalTable` | `KertasKerjaFormalTable.jsx` |
| Lembar Kertas Kerja | `LembarKertasKerjaFormal` | `LembarKertasKerjaFormal.jsx` |

#### State & Data Flow

Data dimuat melalui custom hook `useKertasKerjaData(selectedFormat, selectedMonth, searchTerm)` yang mengembalikan:

- `data`: Data mentah dari API
- `processedData`: Data yang sudah diproses dan siap ditampilkan
- `loading`: Status loading
- `error` Pesan error jika ada
- `isMonthly`: Boolean apakah format bulanan
- `isQuarterly`: Boolean apakah format triwulan
- `isLembar`: Boolean apakah format lembar kertas kerja
- `year`, `fundSource`: Konteks filter

### 5.2 Realisasi Belanja

Halaman Realisasi Belanja menampilkan analisis mendetail tentang penggunaan anggaran vs rencana RKAS. File: `src/pages/RealisasiBelanja.jsx`.

#### Prasyarat

Sama seperti Kertas Kerja, halaman ini **memerlukan sumber dana spesifik**. Jika `SEMUA`, ditampilkan pesan peringatan serupa.

#### 3 Kartu Statistik di Atas Tabel

Di bagian atas halaman terdapat **3 kartu statistik** yang menampilkan ringkasan anggaran:

| Kartu | Label | Nilai | Border Color | Ikon |
| --- | --- | --- | --- | --- |
| 1 | Total Pagu Alokasi | `annualPagu` (formatRupiah) | Slate (abu-abu) | List |
| 2 | Realisasi Belanja | `totalRealisasiInternal` | Merah (red-500) | CheckCircle2 |
| 3 | Sisa Anggaran | `annualPagu - totalRealisasi` | Hijau (emerald-500) | TrendingUp |

Kartu ke-2 (Realisasi) dilengkapi dengan **progress bar**:
- Background: abu-abu muda (slate-100)
- Fill: merah (red-500), lebar proporsional terhadap persentase realisasi
- Maks 100%: `Math.min(100, (totalRealisasi / annualPagu) * 100)`

Jika sisa anggaran negatif, angka ditampilkan dalam warna merah (text-red-700).

#### Toolbar

Toolbar di bagian atas mencakup:

- **Periode**: Dropdown untuk memilih bulan atau kumulatif (0 = Kumulatif)
- **Mode View**: 3 tombol toggle:
-   - **Ringkasan** (BarChart3): Grouping per kegiatan
-   - **Rincian** (List): Detail per item
-   - **RKAS vs Realisasi** (GitCompare): Perbandingan RKAS dengan realisasi BKU

#### Mode "Ringkasan"

Dalam mode Ringkasan, data dikelompokkan per kegiatan. Setiap baris kegiatan dapat di-expand untuk melihat rincian sub-item. Kolom tabel:

| Kolom | Lebar | Deskripsi |
| --- | --- | --- |
| No | 4% | Nomor urut |
| Program | 7% | Kode program (misal: "5.") |
| Kegiatan | 14% | Kode + nama kegiatan + ikon expand |
| Rekening Belanja | 14% | Jumlah rekening belanja dalam kegiatan |
| Uraian / Barang | 18% | Total Akumulasi Kegiatan |
| Anggar | 6% | Volume pagu |
| Real | 6% | Volume realisasi bulan berjalan |
| Sat | 5% | Satuan (misal: pcs, paket) |
| Harga | 10% | Harga satuan |
| Total | 10% | Total realisasi |
| Sts | 9% | Badge status: Selesai / SISA + jumlah + satuan |

#### Mode "RKAS vs Realisasi"

Tabel perbandingan antara rencana RKAS dan laporan BKU:

| Kolom | Lebar | Deskripsi |
| --- | --- | --- |
| NO | 5% | Nomor urut |
| Item Belanja | 35% | Nama barang + kode rekening |
| Target RKAS | 15% | Volume target + jumlah anggaran |
| Laporan BKU | 15% | Volume realisasi + jumlah |
| Keterangan | 20% | Badge status gap |
| Aksi | 10% | Tombol "Detail" |

Status gap yang ditampilkan:
- Sesuai Target (hijau)
- Terbayar (Rapel) (biru) — sudah dibayar di bulan lain
- Belum Terealisasi (kuning) — belum ada realisasi
- Realisasi Geser Bulan (biru) — realisasi terjadi di bulan berbeda
- Melampaui Pagu (merah) — melebihi total anggaran
- Akumulatif (biru) — masih dalam batas
- Parsial (biru) — sebagian terealisasi

#### Detail Modal — "Aliran Dana"

Ketika tombol "Detail" diklik pada mode RKAS vs Realisasi, muncul modal profesional:

- **Judul**: "Aliran Dana: {nama_barang}"
- **Subjudul**: Kode rekening

Modal terdiri dari **Summary Block** di bagian atas:

- Kolom kiri: "Total Realisasi" (kumulatif) — teks hijau (emerald-600)
- Kolom kanan: "Pagu Tahunan" — teks abu-abu
- Dua kolom dipisahkan oleh border vertikal

Di bawah summary terdapat **Timeline per Bulan** berupa kartu-kartu (bukan bar chart):

- Setiap kartu mewakili satu bulan yang dianggarkan atau terealisasi
- Bagian kiri kartu: Nama bulan + ikon status (CheckCircle2 hijau jika lunas, Clock kuning jika belum)
- Bagian kanan kartu: Target (volume + jumlah), Keuangan/BKU (jumlah)
- **Blue arrow indicator**: Jika realisasi berasal dari bulan berbeda, muncul indikator biru: "→ {NamaBulan}"
- Kartu bulan yang sedang aktif memiliki border biru + ring

---

## 6. Penatausahaan (BKU)

### 6.1 BKU Umum — Buku Kas Umum

Halaman Buku Kas Umum menampilkan seluruh transaksi keuangan sekolah. File: `src/pages/TransactionList.jsx`, `src/components/transactions/TransactionTable.jsx`.

#### Header Halaman

Header menampilkan:
- Ikon biru (FileText) dengan label "BUKU KAS UMUM"
- Badge "TA {tahun}"
- Jika month view: teks "Bulan {NamaBulan}"

#### "SEMUA" Month Option

Dropdown pemilihan bulan menyertakan opsi khusus **"SEMUA"** di awal daftar:

- Jika dipilih: menampilkan transaksi dari **seluruh bulan** sekaligus
- Tidak ada "Saldo Bulan Lalu" yang ditampilkan
- Summary cards menampilkan total tahunan
- Sorting tidak dilakukan berdasarkan tanggal (data mentah dari API)

Daftar bulan dimuat dari konstanta `MONTHS` di `src/utils/transactionHelpers.js`.

#### TransactionSummary Cards

Di atas tabel terdapat 3 kartu ringkasan via komponen `TransactionSummary`:

| Kartu | Label Dinamis | Ikon | Warna |
| --- | --- | --- | --- |
| Saldo | "Sisa Saldo Tahunan" atau "Saldo Akhir {Bulan}" | Wallet | Biru |
| Penerimaan | "Total Penerimaan" atau "Penerimaan {Bulan}" | ArrowDownCircle | Hijau |
| Pengeluaran | "Total Pengeluaran" atau "Belanja {Bulan}" | ArrowUpCircle | Merah |

#### Advanced Filter Menu (TransactionFilters)

Komponen `TransactionFilters` menyediakan sistem multi-filter:

- **Tombol Filter**: Menampilkan jumlah filter aktif, misal "Filter (3)"
- **Dropdown multi-select**: Daftar tipe transaksi dari `FILTER_OPTIONS`
- **Tombol Reset**: Menghapus semua filter aktif
- **Search bar**: Pencarian teks real-time
- **Export dropdown**: Menu export dengan beberapa opsi

#### Opening Balance Row — "Saldo Bulan Lalu"

Untuk bulan selain Januari, secara otomatis muncul baris **"Saldo Bulan Lalu"** di awal tabel:

- Hanya muncul jika: `isMonthView && selectedMonth !== "01" && !hasExistingOpeningBalance && openingBalance > 0`
- Tanggal: `{year}-{month}-01`
- No. Bukti: kosong
- Uraian: "Saldo Bulan Lalu"
- Kolom Penerimaan: nilai opening balance
- Kolom Pengeluaran: 0
- Kolom Saldo Berjalan: sama dengan opening balance

Opening balance dihitung dari saldo akhir bulan sebelumnya: `stats.chart[monthIndex - 1].saldo_akhir`.

#### 4 Tombol Export

Export BKU tersedia melalui 4 tombol eksplisit di area filter:

| Tombol | Scope | Format | Behavior |
| --- | --- | --- | --- |
| **PDF Bulan Ini** | Single (bulan aktif) | PDF | Export tabel bulan terpilih ke PDF |
| **PDF Semua Bulan** | Bulk (seluruh tahun) | PDF | Export seluruh transaksi tahun ke PDF |
| **Excel Bulan Ini** | Single (bulan aktif) | Excel | Export tabel bulan terpilih ke Excel |
| **Excel Semua Bulan** | Bulk (seluruh tahun) | Excel | Export seluruh transaksi tahun ke Excel |

Export dilakukan via `window.arkas.exportBku(data, options)` dengan parameter `scope` dan `format`.

#### Kolom Tabel BKU

| Kolom | Deskripsi |
| --- | --- |
| Tanggal | Tanggal transaksi |
| No. Bukti | Nomor bukti transaksi |
| Kode Kegiatan | Kode kegiatan anggaran |
| Kode Rekening | Kode rekening belanja |
| Uraian | Deskripsi transaksi |
| Penerimaan | Jumlah penerimaan (Debit) |
| Pengeluaran | Jumlah pengeluaran (Kredit) |
| Saldo | Saldo berjalan (dihitung otomatis) |

### 6.2 Buku Pembantu Tunai

Buku Pembantu Tunai menampilkan transaksi yang menggunakan metode pembayaran tunai. Menggunakan komponen yang sama dengan BKU Umum tetapi dengan filter `paymentType: "TUNAI"`.

File: `src/components/transactions/CashReportList.jsx`.

### 6.3 Buku Pembantu Bank

Buku Pembantu Bank menampilkan transaksi yang menggunakan metode pembayaran bank. Menggunakan komponen yang sama dengan BKU Umum tetapi dengan filter `paymentType: "BANK"`.

File: `src/components/transactions/BankReportList.jsx`.

### 6.4 Buku Pembantu Pajak

Halaman Buku Pembantu Pajak menampilkan transaksi pajak dengan fitur input manual. File: `src/components/transactions/TaxReportList.jsx`.

#### Tombol "Input Pajak Manual"

Di header halaman terdapat tombol **"Input Pajak Manual"** (bukan "Tambah Entri Manual"):

- Tombol gradient oranye (amber-500 to orange-500)
- Ikon Plus (lucide)
- Membuka `ManualTaxModal`

#### ManualTaxModal

Modal input pajak manual memiliki judul "Input Pajak Manual" (header gradient oranye) dengan field:

| Field | Tipe | Deskripsi |
| --- | --- | --- |
| Jenis Input | Select | Opsi: saldo_awal_tahun, hutang_bulan, transaksi |
| Jenis Pajak | Select | Opsi: PPN, PPh 21, PPh 23, SSPD |
| Nominal | Number | Jumlah nominal pajak |
| Keterangan | Text | Deskripsi/keterangan |
| Tanggal | Date | Tanggal input (default: hari ini) |
| No. Bukti | Text | Nomor bukti (opsional) |
| Posisi | Radio | Pungutan (+) atau Setoran (-) |

#### Manual Tax Preview Section

Jika ada entri pajak manual, ditampilkan area preview berwarna **gradient oranye**:

- Header: "📝 Entri Pajak Manual ({count})"
- Menampilkan **maksimal 5 entri terbaru** sebagai card kecil
- Setiap card menampilkan:
-   - Indikator +/- dengan warna (hijau untuk pungutan, merah untuk setoran)
-   - Nominal dalam format Rupiah
-   - Keterangan (truncate max 150px)
-   - **Tombol delete (Trash2 icon)** berwarna merah untuk menghapus entry
- Jika lebih dari 5 entri: teks "+N lainnya"

Delete dilakukan via `window.arkas.deleteManualTax(id)` dengan toast konfirmasi.

#### Export Options

Export Buku Pembantu Pajak tersedia melalui `TransactionFilters`:

- **PDF Bulan Ini**: Export bulan terpilih ke PDF
- **PDF Semua Bulan**: Export seluruh tahun ke PDF
- **Excel Bulan Ini**: Export bulan terpilih ke Excel
- **Excel Semua Bulan**: Export seluruh tahun ke Excel

Export dilakukan via `window.arkas.exportBku()` dengan `paymentType: "PAJAK"` dan `reportType: "PAJAK"`.

### 6.5 Bukti Transaksi

Halaman Bukti Transaksi adalah fitur komprehensif yang mengelola bukti-bukti pengeluaran. File: `src/pages/NotaGroupManager.jsx`, `src/components/print/PrintReceiptContent.jsx`.

#### Tab Nota Gabungan

Tab ini menampilkan daftar nota yang dikelompokkan berdasarkan nomor nota/toko.

##### Stats Cards

Di bagian atas terdapat 3 kartu statistik:

| Kartu | Warna Background | Isi |
| --- | --- | --- |
| **Total Nota** | Violet | Jumlah grup nota terfilter |
| **Total Item** | Biru | Total item dalam semua grup |
| **Total Nilai** | Hijau | Total nominal semua transaksi (format Rupiah) |

##### Search

Search bar dengan placeholder "**Cari no nota, toko, atau uraian...**" untuk filtering real-time. Pencarian dilakukan terhadap:
- `noNota` (nomor nota)
- `namaToko` (nama toko/vendor)
- `items[].uraian` (uraian item)

##### Pengelompokan Nota

Setiap grup nota ditampilkan sebagai kartu yang dapat di-expand:

- Badge nomor urut
- Ikon Store dengan warna berbeda:
-   - Biru jika transaksi SIPLah
-   - Violet jika grouped (non-SIPLah)
-   - Abu-abu jika single item
- **SIPLah Badge**: Badge biru bertuliskan "SIPLah" untuk transaksi SIPLah
- **PPN Badge**: Badge hijau bertuliskan "PPN" jika nota memiliki PPN
- Jumlah item badge (jika grouped)
- Total nominal di sisi kanan
- Ikon ChevronDown yang berputar 180° saat expanded

##### Tabel Expanded

Saat kartu nota di-expand, tabel detail ditampilkan dengan kolom:

| Kolom | Deskripsi |
| --- | --- |
| No Bukti | Badge violet dengan nomor bukti |
| Uraian | Deskripsi item |
| Tanggal | Tanggal transaksi (format locale Indonesia) |
| Nominal | Jumlah nominal (format Rupiah, align right) |

Footer tabel menampilkan total dan **PPN (11%)** yang dihitung jika nota memiliki flag PPN.

##### Refresh Button

Tombol "Refresh" di sisi kanan toolbar untuk memuat ulang data. Ikon RefreshCw berputar saat loading.

#### Tab Cetak Manual

Tab kedua menampilkan daftar transaksi untuk dicetak sebagai bukti pengeluaran.

##### Checkbox Selection

Setiap grup transaksi memiliki checkbox untuk seleksi:

- **Select All Toggle**: Checkbox di header untuk memilih/membatalkan semua
- **Individual Selection**: Checkbox per grup
- State tersimpan di `selectedGroups` (Set)

##### Print Tracking

Status cetak dilacak menggunakan `localStorage`:

- Key: `printed_groups`
- Format: Array of "`{noBukti}_{type}`"
- **"A2" Badge**: Muncul jika grup sudah dicetak sebagai A2
- **"Bukti" Badge**: Muncul jika grup sudah dicetak sebagai Bukti Pengeluaran

##### Batch Action Bar

Ketika ada grup yang dipilih, muncul **action bar berwarna ungu (violet)**:

- Teks: "{count} grup dipilih ({itemCount} item)"
- Total: Jumlah nominal terpilih (format Rupiah)
- **Tombol "Cetak A2 Gabungan"**: Tombol oranye untuk mencetak A2 gabungan
- **Tombol "Cetak Bukti Gabungan"**: Tombol violet untuk mencetak Bukti gabungan
- Tombol "Reset" (XCircle) untuk membatalkan pilihan

##### Safe Mode

Label peringatan ditampilkan:

- **"Cetak gabungan TIDAK mengubah data asli (Safe Mode)"**

##### Reset Cetak

Tombol reset tersedia untuk:
- Reset per grup: Menghapus status cetak untuk satu grup tertentu
- Reset global: Menghapus semua status cetak dari localStorage

Dilakukan via fungsi `resetPrintStatus(noBukti, type)`.

#### ReceiptPreviewModal (Bukti Pengeluaran Uang)

Modal preview dokumen Bukti Pengeluaran Uang yang ditampilkan ketika melihat detail transaksi. File: `src/components/print/ReceiptPreviewModal.jsx`.

##### Header Modal

- Judul: "Preview Bukti Pengeluaran Uang"
- Background gradient ungu (purple-600 to indigo-600)
- Tombol close (X)

##### Dokumen Preview

Dokumen ditampilkan dalam format profesional dengan border hitam 3px dan font serif:

- **Judul**: "BUKTI PENGELUARAN UANG" (uppercase, letter-spacing 2px)
- **Nomor**: "No : {no_bukti}"
- Field kiri: Dinas/Instansi, Tahun Anggaran, Kode Rekening, Uraian Kode Rek, Terima Dari, Uang Sebesar (dalam kotak miring), Terbilang (dalam bahasa Indonesia via `terbilang()`), Untuk Kepentingan

##### Custom Date

Tanggal per transaksi dapat dikustomisasi:

- Disimpan di localStorage dengan key `custom_date_{id_kas_umum}`
- Kolom 1-3 (Mengetahui, Dibayar, Barang diterima) selalu menggunakan **tanggal transaksi**
- Kolom 4 (Yang menerima uang) menggunakan **custom date** atau tanggal_nota atau tanggal transaksi (prioritas berurutan)

##### Auto Tax Fetch

Pajak terkait diambil otomatis dari entri BKU:

- API: `window.arkas.getRelatedTaxes(uraian, tanggal, kode_rekening, year, nominal)`
- Prioritas: Data BKU (relatedTaxes) > Flag transaksi (is_ppn, is_pph_21, dll)
- Pajak yang diambil: PPN, PPh 21, PPh 23, SSPD/Pajak Daerah

##### Tax Summary Column

Di sisi kanan dokumen terdapat tabel ringkasan pajak:

| Baris | Deskripsi |
| --- | --- |
| Penerimaan | Nominal utama transaksi |
| PPN | PPN dari BKU atau 11% jika flag PPN aktif |
| PPh 21% | PPh 21 dari BKU atau 5% jika flag aktif |
| PPh 23% | PPh 23 dari BKU atau 2% jika flag aktif |
| Pajak Daerah | SSPD dari BKU atau 10% jika flag aktif |
| **Jumlah** | Nominal - Total Pajak (net) |

##### 5 Area Tanda Tangan

Dokumen memiliki 5 area tanda tangan dalam layout 4 kolom + 1 footer:

| No | Label | Pihak | Tanggal |
| --- | --- | --- | --- |
| 1 | MENGETAHUI | Kepala Sekolah | Tanggal transaksi |
| 2 | Dibayar oleh | Bendahara Pengeluaran | Tanggal transaksi |
| 3 | Barang telah diterima | Pemegang Barang | Tanggal transaksi |
| 4 | Yang menerima uang | Toko/Vendor (nama_toko + alamat_toko jika is_badan_usaha) | Custom date atau tanggal_nota |
| 5 | Paraf Pencatat Pembukuan | (area kosong untuk paraf) | — |

##### Tombol "Simpan sebagai PDF"

Di footer modal terdapat tombol gradient ungu "**Simpan sebagai PDF**" untuk menyimpan dokumen sebagai file PDF.

#### Merge Feature (Cetak Gabungan)

Fitur penggabungan beberapa transaksi menjadi satu dokumen:

##### Footer Section

Di bagian bawah daftar transaksi terdapat area merge:

- **Nomor Bukti**: Input field opsional untuk nomor bukti gabungan
- **Uraian Kwitansi**: Input field opsional untuk uraian kwitansi
- **"Preview & Cetak"**: Tombol untuk memproses dan mencetak dokumen gabungan

##### Safe Mode Label

Terdapat label: **"Fitur ini TIDAK mengubah data asli di database"**

---

## 7. Laporan

### 7.1 BA Rekonsiliasi

Berita Acara Rekonsiliasi (BA Rekons) adalah laporan rekonsiliasi keuangan komprehensif. File: `src/pages/BAReconciliation.jsx`.

#### Header

Header menampilkan judul "Berita Acara Rekonsiliasi (BA Rekons)" dengan ikon emerald dan dua tombol aksi:

- **"Download PDF"**: Export konten sesuai tab aktif
- **"Export Excel"**: Export konten sesuai tab aktif

#### Context-Sensitive Export

Perilaku tombol PDF/Excel berubah berdasarkan tab aktif:

| Tab Aktif | PDF Behavior | Excel Behavior |
| --- | --- | --- |
| BA REKONS | Export smart table via `exportTableToPdf()` | Export smart table via `exportTableToExcel()` |
| LEMBAR BA | Export dokumen BA via `exportBaRekonsToPdf()` | Export BA via `exportBaRekonsToExcel()` |
| Rekap Bunga | Export tabel bunga | Export tabel bunga |
| Rekap Pajak | Export tabel pajak | Export tabel pajak |
| Fund Source Tab | Export detail sumber dana | Export detail sumber dana |

#### Tab Navigation

Navigasi tab terdiri dari beberapa grup:

##### Tab Utama

- `ba-rekons`: BA REKONS — Tabel smart rekonsiliasi
- `lembar-ba`: LEMBAR BA — Preview dokumen BA

##### Dynamic Fund Source Tabs

Tab sumber dana dimuat **dinamis dari API** (bukan hardcoded):

- Data diambil via `window.arkas.getReconciliationFundSources(year)`
- Setiap sumber dana ditampilkan sebagai tab terpisah
- Label: nama sumber dana tanpa prefix "BOS "
- Background area tab: amber-50 dengan border amber-100
- Label: "SUMBER DANA"

##### Tab Rekap

- `rekap-bunga`: BUNGA — Tabel rekap bunga bank
- `rekap-pajak`: PAJAK — Tabel rekap pajak

#### Summary Stats (3 Cards)

Pada tab BA REKONS, ditampilkan 3 kartu statistik:

| Kartu | Label | Detail | Border Color |
| --- | --- | --- | --- |
| 1 | Saldo Awal (Januari) | Total + breakdown Bank/Tunai | Emerald |
| 2 | Total Penerimaan | Total (Reguler + Kinerja + Bunga) | Biru |
| 3 | Saldo Akhir (Desember) | Total + breakdown Bank/Tunai | Amber |

#### LEMBAR BA — Period Selector

Di tab LEMBAR BA tersedia pemilihan periode:

- Dropdown "Pilih Periode" dengan opsi: Triwulan I, Triwulan II, Triwulan III, Triwulan IV, Semester 1, Semester 2, Tahunan
- Tombol "**Pengaturan Penandatangan**" (ikon Settings) untuk membuka signatory modal

#### Signatory Modal — Full Fields

Modal pengaturan penandatangan memiliki field lengkap:

| Section | Field | Tipe | Placeholder/Deskripsi |
| --- | --- | --- | --- |
| Logo Surat | Logo Upload | File input (image/*) | Upload logo dengan preview + tombol "Hapus Logo" |
| Kop Surat | Baris 1 | Text | e.g. PEMERINTAH KABUPATEN... |
|  | Baris 2 | Text | e.g. DINAS PENDIDIKAN... |
|  | Alamat | Text | Alamat kantor |
|  | Telepon/Fax | Text | Nomor telepon/fax |
|  | Laman/Email | Text | Website/email |
| Dokumen | Nomor BA | Text | Contoh: 900/... |
|  | Tanggal Surat | Date | Tanggal surat BA |
| PPTK BOSP | Nama | Text | Nama PPTK BOSP |
|  | NIP | Text | NIP PPTK BOSP |
| Petugas Rekons | Nama | Text | Nama Petugas Rekons |
|  | NIP | Text | NIP Petugas Rekons |

Data disimpan via `window.arkas.saveSignatoryData(data)` dan dimuat via `window.arkas.getSignatoryData()`.

### 7.2 Rekonsiliasi Bank

Halaman Rekonsiliasi Bank membandingkan saldo BKU dengan rekening koran bank. File: `src/pages/BankReconciliation.jsx`.

#### 3 Summary Cards

Di bagian atas ditampilkan 3 kartu ringkasan:

| Kartu | Label | Warna Angka | Detail |
| --- | --- | --- | --- |
| 1 | Saldo Bank BKU | Hitam (slate-800) | Dihitung otomatis dari data BKU |
| 2 | Saldo Rekening Koran | Biru (blue-700) | Input manual dari rekening koran |
| 3 | Selisih | **Color-coded** | Merah jika ada selisih, hijau jika cocok |

#### Tabel Utama

Tabel rekonsiliasi bank memiliki kolom:

| Kolom | Tipe | Deskripsi |
| --- | --- | --- |
| No | Auto | Nomor urut |
| Bulan | Auto | Nama bulan |
| Saldo Awal Bank | Auto | Saldo awal bank bulan berjalan |
| Penerimaan Bank | Auto | Total penerimaan bank (hijau) |
| Pengeluaran Bank | Auto | Total pengeluaran bank (merah) |
| Saldo BKU | Auto | Saldo akhir menurut BKU (abu-abu) |
| Saldo Rekening Koran | **Input** | Input manual saldo rekening koran (biru) |
| Selisih | Auto | Selisih = Saldo BKU - Saldo Rekening Koran |
| Status | Auto | Indikator status |

#### 3 Status States

Kolom Status menampilkan salah satu dari 3 state:

| Status | Ikon/Warna | Kondisi |
| --- | --- | --- |
| **Belum Input** | Teks abu-abu + background slate-100 | Saldo Rekening Koran belum diisi |
| **Cocok ✅** | CheckCircle hijau (emerald) | Selisih = 0 dan ada input |
| **Selisih ⚠️** | AlertTriangle merah (red) | Selisih ≠ 0 |

#### Detail Arus Kas Bank Bulanan

Di bawah tabel utama terdapat section **"Detail Arus Kas Bank Bulanan"**:

- Grid kartu bulanan (1-3 kolom responsive)
- Setiap kartu menampilkan:
-   - Nama bulan (bold)
-   - Saldo Awal Bank
-   - + Penerimaan Bank (hijau)
-   - - Pengeluaran Bank (merah)
-   - Saldo Akhir BKU (bold, separator)
-   - Saldo Rekening Koran (biru, jika ada input)
-   - Selisih (hijau jika cocok, merah jika selisih)
- Kartu berwarna merah (bg-red-50/30) jika ada selisih

#### Save Button Feedback

Tombol "**Simpan Saldo Bank**" memberikan feedback:

- Saat menyimpan: Ikon Loader2 berputar, teks "Menyimpan..."
- Setelah tersimpan: Teks berubah menjadi "**Tersimpan!**" selama 3 detik
- Lalu kembali ke teks normal "Simpan Saldo Bank"

Data disimpan via `window.arkas.saveBankReconciliation(year, bankValues)`.

#### Info Card

Kartu instruksi dengan background gradient emerald dan ikon Landmark:

- **Judul**: "Cara Menggunakan"
- 4 langkah bernomor:
-   1. Kolom Saldo BKU dihitung otomatis dari data Buku Kas Umum
-   2. Masukkan Saldo Rekening Koran sesuai rekening asli dari bank
-   3. Kolom Selisih akan otomatis menunjukkan perbedaan
-   4. Klik Simpan untuk menyimpan data saldo rekening koran

### 7.3 SPTJM — Surat Pernyataan Tanggung Jawab Mutlak

Halaman SPTJM menghasilkan Surat Pernyataan Tanggung Jawab Mutlak. File: `src/pages/CetakSPTJM.jsx`.

#### In-Page Document Preview

Dokumen SPTJM dirender **langsung di halaman** (bukan modal):

- Container putih dengan padding p-8, max-width 4xl, centered
- Judul dokumen: "SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK" (bold, center, underline)
- Paragraf pembuka yang menyebutkan **fundLabel**, Semester, dan tahun anggaran

#### Document Fields

Dokumen SPTJM berisi:

| No | Field | Sumber Data |
| --- | --- | --- |
| 1 | NPSN | `school.npsn` |
| 2 | Nama Sekolah | `school.nama_sekolah` |
| 3 | Kode Sekolah | (kosong, untuk diisi manual) |
| 4 | Nomor/Tanggal DPA SKPD | (kosong, untuk diisi manual) |

Data keuangan: Saldo Awal, Penerimaan (Tahap I + II + Jumlah), Pengeluaran (Belanja Operasi + Modal + Jumlah), Sisa Dana (Tunai + Bank).

#### Date Picker

Tersedia date picker di toolbar untuk tanggal tanda tangan:

- Default: hari ini (`new Date().toISOString().split("T")[0]`)
- Ikon Calendar di samping input
- Digunakan pada bagian tanda tangan dokumen

#### Tab Controls

Toolbar memiliki 3 grup kontrol:

- **Semester**: Tombol Semester 1 / Semester 2
- **Sumber Dana**: BOS Reguler / BOS Kinerja
- **Export PDF**: Tombol merah untuk export PDF langsung

#### Export PDF

Export PDF menggunakan jsPDF dengan format F4 (215x330mm):

- Orientasi: Portrait
- Font: Helvetica (bold untuk judul, normal untuk konten)
- Mencakup semua data dokumen + tanda tangan Kepala Sekolah
- Filename: `SPTJM_{fund}_Semester{N}_{year}.pdf`

### 7.4 Laporan K7/K7a

Laporan K7/K7a menampilkan Rekapitulasi Realisasi Penggunaan Dana BOSP. File: `src/pages/LaporanK7.jsx`.

#### Sub-Selectors

Kontrol periode terdiri dari 3 bagian:

- **Period Type**: 3 tombol toggle — `tahap`, `bulan`, `tahunan`
- **Periode Detail**: Muncul berdasarkan period type:
-   - Jika `"Per Tahap"`: Tombol **Tahap 1** / **Tahap 2**
-   - Jika `"Per Bulan"`: Dropdown 12 bulan
-   - Jika `"Tahunan"`: Tidak ada sub-selector
- **Sumber Dana**: BOS Reguler / BOS Kinerja
- **Signature Date Picker**: Input tanggal tanda tangan

#### 7 Standar Nasional Pendidikan

Tabel utama K7 menggunakan 7 standar sebagai baris:

| No | Nama Standar |
| --- | --- |
| 1 | Pengembangan Standar Isi |
| 2 | Standar Proses |
| 3 | Standar Tenaga Kependidikan |
| 4 | Standar Sarana dan Prasarana |
| 5 | Standar Pengelolaan |
| 6 | Pengembangan standar pembiayaan |
| 7 | Standar Penilaian Pendidikan |

#### 12 Sub Program

Kolom cross-tabulasi menggunakan 12 kategori Sub Program:

| No | Nama Sub Program |
| --- | --- |
| 1 | Penerimaan Peserta Didik Baru |
| 2 | Pengembangan Perpustakaan |
| 3 | Pelaksanaan Kegiatan Pembelajaran dan Ekstrakurikuler |
| 4 | Pelaksanaan Kegiatan Asesmen/Evaluasi Pembelajaran |
| 5 | Pelaksanaan Administrasi Kegiatan Sekolah |
| 6 | Pengembangan Profesi Pendidik dan Tenaga Kependidikan |
| 7 | Pembiayaan Langganan Daya dan Jasa |
| 8 | Pemeliharaan Sarana dan Prasarana Sekolah |
| 9 | Penyediaan Alat Multi Media Pembelajaran |
| 10 | Penyelenggaraan Kegiatan Peningkatan Kompetensi Keahlian |
| 11 | Lain-lain |
| 12 | Pembayaran Honor |

#### In-Page Preview

Dokumen dirender langsung di halaman dengan:

- **Header**: Judul "REKAPITULASI REALISASI PENGGUNAAN DANA BOSP {FUND}", periode tanggal, dan sub-judul
- **Info Sekolah**: NPSN, Nama Sekolah, Kecamatan, Kabupaten/Kota, Provinsi, Sumber Dana
- **Tabel Utama**: Grid 7 standar x 12 sub program dengan baris JUMLAH

#### Summary Section

Di bawah tabel terdapat ringkasan:

- Saldo periode sebelumnya
- Total penerimaan dana BOSP periode ini
- Total penggunaan dana BOSP periode ini
- **Akhir saldo BOSP periode ini** (bold, hijau emerald)

#### Dual Signatures

Bagian tanda tangan menggunakan **dua kolom**:

| Posisi | Label | Nama |
| --- | --- | --- |
| Kiri | Menyetujui, Kepala Sekolah | `school.kepala_sekolah` + NIP |
| Kanan | Bendahara/Penanggungjawab Kegiatan | `school.bendahara` + NIP |

#### Export PDF

Export menggunakan jsPDF dengan format landscape F4 (330x215mm) dan autoTable untuk tabel kompleks (3 header rows, colSpan, rowSpan).

### 7.5 Register Kas

Halaman Register Penutupan Kas untuk menghitung dan mendokumentasikan saldo fisik kas. File: `src/pages/RegisterKas.jsx`.

#### 3-Column Layout

Halaman menggunakan layout **3 kolom**:

| Kolom | Judul | Warna Header | Isi |
| --- | --- | --- | --- |
| 1 | **Uang Kertas** | Biru (blue-50/30) | Input jumlah lembar per pecahan |
| 2 | **Uang Logam** | Amber (amber-50/30) | Input jumlah keping per pecahan |
| 3 | **Ringkasan** | Oranye (orange-50/30) | Status balance & info saldo |

#### Pecahan Uang Kertas

7 pecahan uang kertas tersedia:
- Rp 100.000, Rp 50.000, Rp 20.000, Rp 10.000, Rp 5.000, Rp 2.000, Rp 1.000

Setiap baris menampilkan: nominal × input = subtotal

#### Pecahan Uang Logam

4 pecahan uang logam tersedia:
- Rp 1.000, Rp 500, Rp 200, Rp 100

#### Local Fund Source Selector

Di header halaman terdapat **dropdown sumber dana lokal** (terpisah dari filter global):

- Opsi: "Semua Sumber Dana" + daftar sumber dana dari `availableSources`
- Perubahan langsung memicu re-fetch data

#### Save Button with Timestamp

Tombol "**Simpan**" dengan feedback dinamis:

- Normal: Ikon Save + teks "Simpan"
- Menyimpan: Ikon Save berputar (animate-spin) + teks "**Menyimpan...**"
- Timestamp: Jika sudah pernah disimpan, ditampilkan timestamp terakhir di samping tombol
- Format timestamp: `new Date(lastSaved).toLocaleString("id-ID")`

Data disimpan via `window.arkas.saveRegisterKas(year, month, fundSource, {notes, coins})`.

#### Ringkasan Column — Full Details

Kolom ketiga menampilkan ringkasan lengkap:

- **Saldo Buku (Sistem)**: Saldo menurut sistem (`balances.saldo_buku`), hitam, xl, bold
- **Total Fisik (Input)**: Total uang fisik yang diinput, indigo, xl, bold
-   - Badge biru: "Kertas {totalNotes}"
-   - Badge amber: "Logam {totalCoins}"
- **Balance Status**:
-   - Jika balance (0): Hijau + ikon CheckCircle + "Balance" + "Sesuai (Rp 0)"
-   - Jika tidak balance: Merah + ikon AlertTriangle + "Belum Balance"
-   - Pesan detail: "Uang fisik KURANG dari buku" atau "Uang fisik LEBIH dari buku"
- **Saldo Bank**: dari `balances.saldo_bank`
- **Saldo Pajak**: dari `balances.saldo_pajak`

#### Export Dropdown Menus

Export dilakukan melalui **dropdown menu** (bukan tombol sederhana):

##### Register (K7b)

- Tombol indigo: "Register (K7b)" + ikon Printer + ChevronDown
- Dropdown:
-   - **Export PDF** (FileText merah): Register penutupan kas standar
-   - **Export Excel** (FileSpreadsheet hijau): Export ke format .xlsx

##### Berita Acara

- Tombol putih: "Berita Acara" + ikon Download + ChevronDown
- Dropdown:
-   - **Export PDF**: Berita Acara Pemeriksaan Kas
-   - **Export Excel**: Export ke format .xlsx

Dropdown muncul dari bawah ke atas (`bottom-full`) dan hanya satu dropdown yang terbuka dalam satu waktu.

---

## 8. Fitur Lainnya

### 8.1 Backup & Restore

Halaman Backup & Restore memungkinkan pengguna untuk mencadangkan dan mengembalikan data SmartSPJ. File: `src/pages/BackupRestore.jsx`.

### 8.2 Pengaturan

Halaman Pengaturan untuk mengelola data pejabat sekolah. File: `src/pages/Pengaturan.jsx`.

#### Layout

Halaman menggunakan layout **2 kolom (1/3 + 2/3)**:

- **Kolom Kiri (1/3)**: Info Sekolah (Read-Only)
- **Kolom Kanan (2/3)**: Form Editable

#### Kolom Kiri — Info Sekolah (Read-Only)

Menampilkan data sekolah yang tidak dapat diedit:

| Field | Sumber Data |
| --- | --- |
| Nama Sekolah | `school.nama_sekolah` |
| NPSN | `school.npsn` |
| Alamat | `school.alamat` / `school.alamat_jalan` |
| Lokasi | `school.kecamatan`, `school.kabupaten` |

Terdapat ikon gembok (Lock) di judul section, dan catatan di bagian bawah:

- **Blue info box**: "Info di atas diambil langsung dari database asli (arkas.db) dan tidak dapat diubah di sini."
- Background: slate-50, border: slate-100, teks kecil (text-xs)

#### Kolom Kanan — Form Editable

Form yang dapat diedit terdiri dari 3 section:

##### Section 1: Data Kepala Sekolah

| Field | Name Attribute | Placeholder |
| --- | --- | --- |
| Nama Lengkap | `kepala_sekolah` | Nama Kepala Sekolah |
| NIP | `nip_kepala` | NIP Kepala Sekolah |

##### Section 2: Data Bendahara

| Field | Name Attribute | Placeholder |
| --- | --- | --- |
| Nama Lengkap | `bendahara` | Nama Bendahara |
| NIP | `nip_bendahara` | NIP Bendahara |

##### Section 3: Surat Keputusan (SK)

Terdapat **blue info box** di atas form SK:

- "Data SK ini akan muncul otomatis di kalimat pembuka Berita Acara."
- Background: blue-50, border: blue-100, teks: blue-700

| Field | Name Attribute | Placeholder |
| --- | --- | --- |
| Nomor SK | `nomor_sk` | Contoh: 11.30/SMP.NL/6/VII/2025 |
| Tanggal SK | `tanggal_sk` | Contoh: 01 Juli 2025 |

#### Success/Error Banner

Setelah menyimpan, muncul banner notifikasi:

- **Sukses**: Banner hijau (emerald-50) + ikon CheckCircle + teks "Pengaturan berhasil disimpan!"
- **Error**: Banner merah (rose-50) + ikon AlertCircle + pesan error
- Banner muncul di **atas form** (bukan toast)
- Setelah sukses, data di-reload via `window.arkas.reloadSchoolData()`

#### Tombol Simpan

Tombol "Simpan Pengaturan" di bagian bawah:

- Warna: slate-800 (hampir hitam)
- Ikon Save (lucide)
- Disable saat menyimpan (opacity-50, cursor-not-allowed)
- Teks berubah ke "Simpan..." saat proses berjalan

---

## 9. Alur Kerja SPJ Lengkap

Berikut adalah alur kerja yang direkomendasikan untuk menyusun SPJ menggunakan SmartSPJ:

#### Langkah 1: Setup Awal

- Pastikan ARKAS terinstal dan database `arkas.db` ada
- Buka SmartSPJ dan verifikasi data sekolah di Dashboard
- Klik "Muat Ulang Data" untuk sinkronisasi
- Pilih Tahun Anggaran dan Sumber Dana di header

#### Langkah 2: Verifikasi Penganggaran

- Buka **Kertas Kerja (RKAS)** untuk memverifikasi rencana anggaran
- Cek status "Disahkan" atau "Perlu Diperbaiki" di SchoolInfoCard
- Gunakan **Realisasi Belanja** untuk memantau progres penggunaan anggaran
- Bandingkan RKAS vs Realisasi untuk menemukan gap

#### Langkah 3: Penatausahaan

- Buka **Buku Kas Umum** untuk memverifikasi semua transaksi tercatat
- Periksa **Buku Pembantu Bank** dan **Buku Pembantu Tunai**
- Verifikasi **Buku Pembantu Pajak** — tambahkan entri manual jika ada yang terlewat
- Kelola **Bukti Transaksi** — cetak A2 dan Bukti Pengeluaran

#### Langkah 4: Rekonsiliasi

- Isi **Rekonsiliasi Bank** dengan saldo rekening koran
- Verifikasi kecocokan saldo di setiap bulan
- Buat **BA Rekonsiliasi** dengan mengisi penandatangan
- Generate LEMBAR BA untuk periode yang dipilih

#### Langkah 5: Laporan

- Generate **SPTJM** per semester
- Generate **Laporan K7/K7a** per periode
- Isi **Register Kas** dengan perhitungan fisik uang
- Cetak Register K7b dan Berita Acara Kas

#### Langkah 6: Finalisasi

- Export semua dokumen ke PDF/Excel
- Backup data via **Backup & Restore**
- Verifikasi pengaturan di **Pengaturan**

---

## 10. FAQ & Pemecahan Masulan


### Pertanyaan Umum


#### Q: Apakah SmartSPJ mengubah data ARKAS?

Tidak. SmartSPJ hanya membaca data dari arkas.db (read-only). Semua data tambahan disimpan terpisah.

#### Q: Mengapa halaman Kertas Kerja kosong?

Pastikan:
- Sumber Dana spesifik sudah dipilih (bukan "SEMUA")
- Kertas Kerja sudah disahkan di ARKAS
- Tahun Anggaran sudah benar

#### Q: Bagaimana cara menambah entri pajak manual?

Buka Buku Pembantu Pajak > klik tombol "Input Pajak Manual" (oranye) > isi form > Simpan. Entri akan muncul di area preview oranye di atas tabel.

#### Q: Status cetak bukti tidak tersimpan?

Status cetak disimpan di localStorage browser. Jika Anda membersihkan data browser, status cetak akan direset. Gunakan tombol "Reset Cetak" untuk mengatur ulang secara manual.

#### Q: Mengapa tombol export PDF/Excel tidak berfungsi?

Pastikan:
- Data sudah dimuat dengan benar (tidak dalam state loading)
- Tab yang aktif memiliki data untuk di-export
- Cek console browser (F12) untuk error message

#### Q: Bagaimana cara mengubah penandatangan BA Rekonsiliasi?

Buka BA Rekonsiliasi > tab LEMBAR BA > klik "Pengaturan Penandatangan" (ikon Settings) > isi semua field > klik Simpan. Data akan tersimpan dan langsung diterapkan.

#### Q: Custom date di Bukti Pengeluaran hilang setelah refresh?

Custom date disimpan per-transaksi di localStorage dengan key `custom_date_{id_kas_umum}`. Selama localStorage tidak dibersihkan, data akan tetap ada.

### Error Messages Umum


| Error | Penyebab | Solusi |
| --- | --- | --- |
| "Pilih Sumber Dana Spesifik" | Filter global diset ke SEMUA | Pilih sumber dana spesifik dari dropdown |
| "Gagal Memuat Data" | Koneksi ke database gagal | Klik "Coba Lagi" atau restart aplikasi |
| "API tidak tersedia" | Preload script tidak dimuat | Restart aplikasi Electron |
| "Tidak ada data untuk periode ini" | BKU belum diisi | Isi data transaksi di ARKAS terlebih dahulu |

### Keyboard Shortcuts

SmartSPJ belum mendukung keyboard shortcuts khusus. Gunakan navigasi mouse/trackpad standar.

### Teknologi & Dependensi Utama

| Package | Versi | Fungsi |
| --- | --- | --- |
| electron | Build | Runtime desktop |
| react | 18+ | Framework UI |
| tailwindcss | 3+ | Utility CSS |
| jspdf | 2+ | Generate PDF |
| jspdf-autotable | 3+ | Tabel PDF |
| exceljs | 4+ | Generate Excel |
| lucide-react | latest | Ikon |
| react-toastify | 9+ | Notifikasi toast |
| better-sqlite3 | 11+ | Akses database SQLite |

---

*Dokumentasi ini dihasilkan secara otomatis oleh script `scripts/generate-docs-v2.js` pada 8 April 2026.*

---

**SmartSPJ** — Aplikasi Pendamping ARKAS untuk Pengelolaan SPJ BOS
© 2025-2026 Kevin Doni. Dilindungi undang-undang hak cipta.