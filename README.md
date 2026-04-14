# SmartSPJ

<p align="center">
  <img src="src/assets/logo.png" alt="SmartSPJ" width="120"/>
</p>

<p align="center">
  <strong>Aplikasi Pendamping ARKAS untuk Pengelolaan SPJ BOS</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.4.0--beta-amber" alt="version"/>
  <img src="https://img.shields.io/badge/platform-Windows-blue" alt="platform"/>
  <img src="https://img.shields.io/badge/Electron-28-blueviolet" alt="electron"/>
  <img src="https://img.shields.io/badge/React-18+-61DAFB" alt="react"/>
  <img src="https://img.shields.io/badge/License-ISC-green" alt="license"/>
</p>

---

## 📋 Tentang

SmartSPJ adalah aplikasi desktop yang dirancang sebagai pendamping **ARKAS** (Aplikasi Rencana Kegiatan dan Anggaran Sekolah) untuk membantu bendahara sekolah mengelola **SPJ (Surat Pertanggungjawaban) BOS**. Aplikasi ini membaca database ARKAS secara read-only dan menyediakan fitur pengelolaan keuangan yang lengkap.

## ✨ Fitur Utama

### 📊 Dashboard & Analitik
- Dashboard monitoring keuangan real-time dengan statistik perbandingan bulanan
- Grafik revenue interaktif dengan garis Saldo Akhir
- Pergerakan Kas Bulanan dengan saldo awal + running balance per sumber dana
- Belanja per Kategori, Top 5 Pengeluaran, Belanja per Kegiatan — terfilter per sumber dana
- Ringkasan sumber dana (BOS Reguler, BOS Kinerja, Dana Lainnya, SiLPA)

### 📖 Buku Kas & Pembantu
- **Buku Kas Umum** — pencatatan transaksi lengkap dengan filter dan paginasi
- **Buku Pembantu Bank** — rekening koran bank
- **Buku Pembantu Tunai** — arus kas tunai
- **Buku Pembantu Pajak** — pajak pungut dan setor

### 🤝 BA Rekonsiliasi
- Berita Acara Rekonsiliasi otomatis dari data ARKAS
- Export ke **PDF**, **Excel**, dan **HTML**
- Ringkasan per sumber dana (Reguler, Kinerja, Lainnya, SiLPA)
- Rekap Saldo Bulanan (bulanan, triwulan, semester, tahunan)
- Lembar BA dengan saldo awal, penerimaan, realisasi, dan saldo akhir

### 🧾 Cetak & Export
- Cetak A2 (Kwitansi) dan Bukti Pengeluaran
- Cetak SPTJM dan Laporan K7/K7a
- Export Semua Laporan — satu file Excel multi-sheet (BKU Umum, Tunai, Bank, Pajak)
- Register Kas dengan filter tahun

### 📝 Manajemen Transaksi
- Nota Group Manager — pengelompokan nota
- Cetak Manual — input transaksi manual
- Realisasi Belanja per kegiatan dengan progress bar
- Scraping data otomatis dari sumber eksternal

### 💾 Backup & Restore
- Backup data (JSON + localStorage)
- Backup lengkap (seluruh folder data/)
- Restore dari file backup (ZIP) dengan preview sebelum restore

### ⚙️ Pengaturan
- Konfigurasi pejabat sekolah (Kepala Sekolah, Bendahara)
- Integrasi database ARKAS (SQLCipher encrypted)
- Tema terpusat untuk konsistensi visual

## 🏗️ Arsitektur

```
SmartSPJ/
├── electron/                  # Electron backend (compiled to .jsc bytecode)
│   ├── main.js               # Main process
│   ├── main-loader.js        # Bytecode loader
│   ├── handlers/             # IPC handlers
│   │   ├── dashboard/        # Dashboard queries (advancedQueries, statsQueries, etc.)
│   │   ├── reconciliationHandler.js
│   │   ├── transactionHandler.js
│   │   ├── exportHandler.js
│   │   └── ...
│   └── config/               # Tax rates, etc.
├── src/                       # React frontend (Vite hot-reload)
│   ├── components/            # React components
│   │   ├── dashboard/v3/     # Dashboard analytics
│   │   └── reconciliation/   # BA Rekonsiliasi components
│   ├── pages/                # Page components
│   ├── utils/                # Utility functions
│   └── assets/               # Static assets
├── scripts/                   # Build scripts (compile-bytecode.js)
└── release/                   # Built installers
```

## 🛠️ Tech Stack

| Teknologi | Kegunaan |
|---|---|
| **Electron 28** | Desktop app framework |
| **React 18** | UI library |
| **Vite 5** | Build tool & dev server |
| **TailwindCSS** | Utility-first CSS |
| **better-sqlite3-multiple-ciphers** | SQLCipher encrypted database |
| **bytenode** | Source code protection (JS → JSC bytecode) |
| **ExcelJS** | Excel export |
| **jsPDF** | PDF generation |
| **Chart.js** | Data visualization |
| **dotenv** | Secure configuration |

## 📦 Instalasi

### Prasyarat

- **Node.js** 18+
- **npm** 9+
- **Windows** (target platform)

### Development

```bash
# Clone repository
git clone https://github.com/kevindoni/SMARTSPJ_APP_NEW.git
cd SMARTSPJ_APP_NEW

# Install dependencies
npm install

# Run development mode (Vite + Electron)
npm run dev
```

### Build Production

```bash
# 1. Build frontend
npm run build

# 2. Compile backend to bytecode
npm run compile:bytecode

# 3. Build installer
npx electron-builder --win --publish never
```

Atau satu perintah:

```bash
npm run build:electron
```

## 🔐 Keamanan

- Source code backend dilindungi dengan **bytenode** — semua `.js` di folder `electron/` dikompilasi ke bytecode `.jsc`
- Password database disimpan di file `.env` (tidak hardcode di source code)
- Database ARKAS menggunakan **SQLCipher** encryption
- Aplikasi membaca database ARKAS secara **read-only**

## 📥 Download

Download installer terbaru dari [GitHub Releases](https://github.com/kevindoni/SMARTSPJ_APP_NEW/releases).

> ⚠️ **Catatan Windows SmartScreen:** Karena repository bersifat private, code signing tidak tersedia. Klik "More info" → "Run anyway" pada peringatan SmartScreen.

## 📄 Changelog

Lihat [CHANGELOG.md](CHANGELOG.md) untuk riwayat perubahan lengkap.

## 📜 License

ISC License - lihat [LICENSE](LICENSE) untuk detail.

## 👨‍💻 Author

**Kevin Doni**
