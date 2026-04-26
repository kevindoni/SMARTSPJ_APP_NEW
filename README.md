<p align="center">
  <img src="https://img.shields.io/badge/SmartSPJ-v1.7.2-0F172A?style=for-the-badge&labelColor=1E293B&color=3B82F6" alt="SmartSPJ"/>
</p>

<p align="center">
  <strong>Aplikasi Pendamping ARKAS untuk Pengelolaan SPJ BOS</strong><br/>
  <em>Desktop App untuk Bendahara Sekolah di Indonesia</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Windows-10%2B-0078D4?style=flat-square&logo=windows&logoColor=white"/>
  <img src="https://img.shields.io/badge/Electron-28-47848F?style=flat-square&logo=electron&logoColor=white"/>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black"/>
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=flat-square"/>
</p>

<p align="center">
  <a href="#fitur-utama">Fitur</a> &bull;
  <a href="#arsitektur">Arsitektur</a> &bull;
  <a href="#tech-stack">Tech Stack</a> &bull;
  <a href="#keamanan">Keamanan</a> &bull;
  <a href="#lisensi">Lisensi</a>
</p>

---

## Tentang

**SmartSPJ** adalah aplikasi desktop yang dirancang sebagai pendamping **ARKAS** (Aplikasi Rencana Kegiatan dan Anggaran Sekolah) untuk membantu bendahara sekolah mengelola **SPJ BOS** (Surat Pertanggungjawaban Bantuan Operasional Sekolah).

Aplikasi ini membaca database ARKAS secara **read-only** dan menyediakan fitur pengelolaan keuangan yang lengkap — dari dashboard analitik, buku kas, cetak kwitansi, hingga BA Rekonsiliasi dan SPTJM.

---

## Fitur Utama

### Dashboard & Analitik
- Statistik keuangan real-time dengan perbandingan bulanan
- Grafik revenue interaktif dengan garis Saldo Akhir
- Pergerakan Kas Bulanan — running balance per sumber dana
- Breakdown belanja per kategori, kegiatan, dan top 5 pengeluaran
- Ringkasan sumber dana: BOS Reguler, BOS Kinerja, Dana Lainnya, SiLPA

### Buku Kas & Pembantu
- **Buku Kas Umum (BKU)** — transaksi lengkap dengan filter, search, dan paginasi
- **Buku Pembantu Tunai** — arus kas tunai
- **Buku Pembantu Bank** — rekening koran bank
- **Buku Pembantu Pajak** — pajak pungut dan setor, termasuk input pajak manual
- Export ke Excel dan PDF per bulan maupun 12 bulan sekaligus
- Export All-in-One — satu file Excel multi-sheet

### Cetak & Bukti Transaksi
- Cetak Kwitansi A2 (satuan dan batch)
- Cetak Bukti Pengeluaran (satuan dan batch)
- Nota Group Manager — pengelompokan nota
- Merge Transaksi — gabung beberapa transaksi jadi satu bukti
- Preview kwitansi sebelum cetak

### Laporan
- **BA Rekonsiliasi** — Berita Acara otomatis dari data ARKAS, export ke PDF/Excel/HTML
- **SPTJM** — Surat Pertanggungjawaban Mutlak
- **Laporan K7 / K7a** — Rekapitulasi per periode
- **Register Kas** — Pecahan uang kas fisik
- **Rekap Saldo Bulanan** — bulanan, triwulan, semester, tahunan

### Backup & Restore
- Backup konfigurasi (JSON)
- Backup lengkap (full ZIP — seluruh folder data/)
- Restore dengan preview isi backup sebelum restore

### Pengaturan & Sistem
- Konfigurasi pejabat sekolah (Kepala Sekolah, Bendahara, NIP)
- Konfigurasi penandatangan BA Rekonsiliasi
- Auto-update dari GitHub Releases
- Koneksi database ARKAS otomatis (auto-detect path + password)
- Info versi aplikasi (Electron, Chrome, Node)

---

## Arsitektur

```
SmartSPJ/
├── electron/                  # Electron main process
│   ├── main.js               # Entry point
│   ├── main-loader.js        # App loader
│   ├── preload.js            # Preload (context bridge)
│   ├── handlers/             # IPC handlers
│   │   ├── dashboard/        #   Dashboard queries & analytics
│   │   ├── reconciliationHandler.js  #   BA Rekonsiliasi
│   │   ├── transactionHandler.js     #   Buku Kas Umum
│   │   ├── exportHandler.js          #   Export Excel/PDF
│   │   ├── printHandler.js           #   Cetak kwitansi/bukti
│   │   ├── backupHandler.js          #   Backup & restore
│   │   └── ...
│   └── config/               # Tax rates, reconciliation columns
├── src/                       # React frontend
│   ├── components/            #   Reusable components
│   │   ├── dashboard/v3/     #     Dashboard analytics
│   │   ├── reconciliation/   #     BA Rekonsiliasi
│   │   ├── layout/           #     Sidebar, Header
│   │   └── SplashScreen.jsx  #     Splash screen
│   ├── pages/                #   Page components
│   ├── utils/                #   Utility functions
│   └── assets/               #   Static assets & logo
├── scripts/                   # Build scripts
├── docs/                      # Documentation
└── release/                   # Built installers (gitignored)
```

---

## Tech Stack

| Teknologi | Kegunaan |
|---|---|
| **Electron 28** | Desktop app framework |
| **React 18** | UI library |
| **Vite 5** | Build tool & dev server |
| **TailwindCSS 3** | Utility-first CSS framework |
| **better-sqlite3-multiple-ciphers** | SQLCipher encrypted database access |
| **Chart.js 4** | Data visualization & grafik |
| **jsPDF** | PDF generation |
| **ExcelJS** | Excel export |
| **pdfkit** | PDF generation (backend) |
| **Lucide React** | Icon library |
| **Electron Updater** | Auto-update dari GitHub |

---

## Keamanan

| Layer | Proteksi |
|---|---|
| **Database** | SQLCipher encryption via better-sqlite3-multiple-ciphers |
| **Source Code** | Bytenode compilation (`.js` → `.jsc` bytecode) |
| **Credential Storage** | Electron safeStorage (OS-level encryption) |
| **Configuration** | `.env` file untuk password, tidak hardcode |
| **Access** | Read-only terhadap database ARKAS |
| **License** | Ed25519 digital signature + hardware fingerprint binding |

---

## Download

Download installer terbaru dari **[GitHub Releases](https://github.com/kevindoni/SMARTSPJ_APP_NEW/releases)**.

> **Catatan Windows SmartScreen:** Karena repository bersifat private, code signing certificate tidak tersedia. Jika muncul peringatan SmartScreen, klik **"More info"** → **"Run anyway"**.

---

## Dokumentasi

| Dokumen | Keterangan |
|---|---|
| [Panduan Pengguna](docs/Panduan_Pengguna_SmartSPJ.md) | Panduan lengkap untuk pengguna akhir |
| [Panduan Instalasi](docs/Panduan_Instalasi_Konfigurasi_Awal.md) | Instalasi dan konfigurasi awal |
| [Sistem Lisensi](docs/Panduan_Sistem_Lisensi_SmartSPJ.md) | Arsitektur lisensi dan tier |
| [Panduan Lengkap](docs/PANDUAN_LENGKAP.md) | Panduan teknis lengkap |

---

## Lisensi

Hak cipta (c) 2024-2026 **KevinDoni**. Semua hak dilindungi.

Software ini dilisensikan di bawah **SmartSPJ Proprietary License** — lihat file [LICENSE](LICENSE) untuk detail lengkap. Penggunaan, reproduksi, dan distribusi tanpa izin tertulis dari pemilik hak cipta dilarang.

---

<p align="center">
  Dibuat dengan dedikasi untuk bendahara sekolah Indonesia
</p>
