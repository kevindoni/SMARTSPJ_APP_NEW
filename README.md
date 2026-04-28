<div align="center">

# SmartSPJ

### Aplikasi Pendamping ARKAS untuk Pengelolaan SPJ BOS

*A desktop companion for school treasurers across Indonesia*

<br/>

[![Version](https://img.shields.io/badge/v1.7.2-Latest_Release-2563EB?style=for-the-badge&labelColor=1E40AF&logo=rocket&logoColor=white)](https://github.com/kevindoni/SMARTSPJ_APP_NEW/releases)
[![Windows](https://img.shields.io/badge/Windows-10%2B-0078D4?style=for-the-badge&logo=windows&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-Proprietary-E11D48?style=for-the-badge&logoColor=white)](LICENSE)

<br/>

[![Electron](https://img.shields.io/badge/Electron-28-47848F?style=flat-square&logo=electron&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](#)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](#)
[![Tailwind](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](#)
[![SQLite](https://img.shields.io/badge/SQLCipher-Encrypted-003B57?style=flat-square&logo=sqlite&logoColor=white)](#)

<br/>

**[Download](https://github.com/kevindoni/SMARTSPJ_APP_NEW/releases)** &nbsp;&bull;&nbsp; **[Documentation](docs/PANDUAN_LENGKAP.md)** &nbsp;&bull;&nbsp; **[Changelog](CHANGELOG.md)**

---

</div>

## Apa itu SmartSPJ?

**SmartSPJ** adalah aplikasi desktop yang dirancang sebagai pendamping **ARKAS** (Aplikasi Rencana Kegiatan dan Anggaran Sekolah) untuk membantu bendahara sekolah mengelola **SPJ BOS** (Surat Pertanggungjawaban Bantuan Operasional Sekolah).

Aplikasi ini membaca database ARKAS secara **read-only** dan menyediakan fitur pengelolaan keuangan yang lengkap — dari dashboard analitik, buku kas, cetak kwitansi, hingga BA Rekonsiliasi dan SPTJM.

<br/>

## Fitur Utama

<table>
<tr>
<td width="50%">

### Dashboard & Analitik
- Statistik keuangan real-time
- Grafik revenue interaktif dengan garis Saldo Akhir
- Pergerakan Kas Bulanan per sumber dana
- Breakdown belanja per kategori & kegiatan
- Ringkasan: BOS Reguler, Kinerja, Dana Lain, SiLPA

</td>
<td width="50%">

### Buku Kas & Pembantu
- **BKU** — transaksi lengkap + filter & paginasi
- **Buku Pembantu Tunai** — arus kas tunai
- **Buku Pembantu Bank** — rekening koran
- **Buku Pembantu Pajak** — pajak pungut & setor
- Export ke Excel & PDF (per bulan / 12 bulan / all-in-one)

</td>
</tr>
<tr>
<td width="50%">

### Cetak & Bukti Transaksi
- Cetak Kwitansi A2 (satuan & batch)
- Cetak Bukti Pengeluaran (satuan & batch)
- Nota Group Manager
- Merge Transaksi jadi satu bukti
- Preview sebelum cetak

</td>
<td width="50%">

### Laporan
- **BA Rekonsiliasi** — otomatis dari data ARKAS
- **SPTJM** — Surat Pertanggungjawaban Mutlak
- **Laporan K7 / K7a** — Rekapitulasi per periode
- **Register Kas** — Pecahan uang kas fisik
- **Rekap Saldo** — bulanan, triwulan, semester, tahunan

</td>
</tr>
</table>

<br/>

## Tech Stack

| | Teknologi | Kegunaan |
|:---:|---|---|
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/electron/electron-original.svg" width="20"/> | **Electron 28** | Desktop app framework |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="20"/> | **React 18** | UI library |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vitejs/vitejs-original.svg" width="20"/> | **Vite 5** | Build tool & dev server |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" width="20"/> | **TailwindCSS 3** | Utility-first CSS |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sqlite/sqlite-original.svg" width="20"/> | **SQLCipher** | Encrypted database access |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/chartjs/chartjs-original.svg" width="20"/> | **Chart.js 4** | Data visualization |
| | **jsPDF / pdfkit** | PDF generation |
| | **ExcelJS** | Excel export |
| | **Lucide React** | Icon library |
| | **Electron Updater** | Auto-update via GitHub |

<br/>

## Arsitektur

```
SmartSPJ/
├── electron/                    # Electron main process
│   ├── main.js                  #   Entry point & IPC handlers
│   ├── main-loader.js           #   App loader
│   ├── preload.js               #   Context bridge (IPC → Renderer)
│   ├── handlers/                #   Business logic
│   │   ├── dashboard/           #     Analytics queries
│   │   ├── reconciliationHandler.js  #   BA Rekonsiliasi
│   │   ├── transactionHandler.js     #   Buku Kas Umum
│   │   ├── exportHandler.js          #   Export Excel/PDF
│   │   ├── backupHandler.js          #   Backup & restore
│   │   └── ...
│   ├── config/                  #   Tax rates & config
│   └── utils/                   #   Utilities (terbilang, dll)
├── src/                         # React frontend (Vite)
│   ├── components/              #   Reusable components
│   │   ├── dashboard/           #     Dashboard & analytics
│   │   ├── reconciliation/      #     BA Rekonsiliasi
│   │   ├── KertasKerja/         #     Kertas Kerja tables
│   │   ├── transactions/        #     Buku Kas & Pembantu
│   │   ├── print/               #     Kwitansi & Bukti
│   │   ├── layout/              #     Sidebar, Header
│   │   └── SplashScreen.jsx     #     Splash screen
│   ├── pages/                   #   Page components
│   ├── hooks/                   #   Custom React hooks
│   ├── utils/                   #   Frontend utilities
│   ├── context/                 #   React context
│   └── config/                  #   Table configs
├── scripts/                     #   Build scripts
├── docs/                        #   Documentation
└── release/                     #   Built installers (gitignored)
```

<br/>

## Keamanan

| Layer | Proteksi |
|---|---|
| Database | SQLCipher encryption via better-sqlite3-multiple-ciphers |
| Source Code | Bytenode compilation (`.js` → `.jsc` bytecode) |
| Credentials | Electron safeStorage (OS-level encryption) |
| Configuration | `.env` for sensitive data, tidak hardcode |
| Access | Read-only terhadap database ARKAS |
| License | Ed25519 digital signature + hardware fingerprint binding |

<br/>

## Download & Instalasi

Download installer terbaru dari **[GitHub Releases](https://github.com/kevindoni/SMARTSPJ_APP_NEW/releases)**.

> **Catatan Windows SmartScreen:** Karena repository bersifat private, code signing certificate tidak tersedia. Jika muncul peringatan SmartScreen, klik **"More info"** → **"Run anyway"**.

### Persyaratan
- Windows 10 atau lebih baru
- Aplikasi ARKAS sudah terinstal dengan database yang aktif

<br/>

## Dokumentasi

| Dokumen | Keterangan |
|---|---|
| [Panduan Pengguna](docs/Panduan_Pengguna_SmartSPJ.md) | Panduan lengkap untuk pengguna akhir |
| [Panduan Instalasi](docs/Panduan_Instalasi_Konfigurasi_Awal.md) | Instalasi dan konfigurasi awal |
| [Sistem Lisensi](docs/Panduan_Sistem_Lisensi_SmartSPJ.md) | Arsitektur lisensi dan tier |
| [Panduan Lengkap](docs/PANDUAN_LENGKAP.md) | Panduan teknis lengkap |

<br/>

## Pengembangan

```bash
# Install dependencies
npm install

# Jalankan mode development
npm run dev

# Build production
npm run build:electron
```

<br/>

## Lisensi

Hak cipta &copy; 2024-2026 **KevinDoni**. Semua hak dilindungi.

Software ini dilisensikan di bawah **SmartSPJ Proprietary License** — lihat file [LICENSE](LICENSE) untuk detail lengkap. Penggunaan, reproduksi, dan distribusi tanpa izin tertulis dari pemilik hak cipta dilarang.

---

<div align="center">

*Dibuat dengan dedikasi untuk bendahara sekolah Indonesia*

</div>
