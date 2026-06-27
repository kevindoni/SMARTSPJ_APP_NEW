# SmartSPJ

<h1 align="center">SmartSPJ</h1>

<p align="center">
<b>Desktop Companion for ARKAS</b><br>
Aplikasi desktop modern untuk membantu bendahara sekolah menyusun
SPJ BOS, laporan keuangan, dan dokumen pertanggungjawaban secara
lebih cepat, rapi, dan akurat.
</p>

<p align="center">

<img src="https://img.shields.io/github/v/release/kevindoni/SMARTSPJ_APP_NEW?style=flat-square">
<img src="https://img.shields.io/badge/Windows-10+-0078D4?style=flat-square&logo=windows">
<img src="https://img.shields.io/badge/Electron-28-47848F?style=flat-square&logo=electron">
<img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react">
<img src="https://img.shields.io/badge/License-Proprietary-red?style=flat-square">

</p>

<p align="center">

<a href="https://github.com/kevindoni/SMARTSPJ_APP_NEW/releases">Download</a>
• <a href="#fitur">Features</a>
• <a href="#screenshot">Screenshots</a>
• <a href="#keamanan">Security</a>
• <a href="docs/PANDUAN_LENGKAP.md">Documentation</a>

</p>

---

## Dashboard

<p align="center">
<img src="docs/image1.png" width="100%">
</p>

---

## Tentang

SmartSPJ merupakan aplikasi desktop pendamping **ARKAS** yang dirancang untuk membantu bendahara sekolah dalam mengelola seluruh proses administrasi BOS.

Aplikasi bekerja dengan prinsip **Read Only**, sehingga database ARKAS tidak pernah dimodifikasi. Seluruh analisis, laporan, pencetakan dokumen, dan ekspor dilakukan dari salinan data yang aman.

---

# Fitur

| Modul        | Deskripsi                                        |
| ------------ | ------------------------------------------------ |
| Dashboard    | Statistik keuangan, grafik, saldo, analitik BOS  |
| RKAS Creator | Penyusunan RKAS, proporsi, realisasi anggaran    |
| Buku Kas     | BKU, Buku Tunai, Buku Bank, Buku Pajak           |
| Rekonsiliasi | BA Rekonsiliasi, Rekonsiliasi Bank, Kertas Kerja |
| Dokumen      | Kwitansi, Bukti Pengeluaran, SPTJM, Register Kas |
| Laporan      | K7, K7a, Realisasi Belanja, Rekap Saldo          |
| Export       | PDF, Excel, HTML                                 |
| Backup       | Backup & Restore Konfigurasi                     |

---

## RKAS Creator

<p align="center">
<img src="docs/03-rkas-kegiatan.png" width="48%">
<img src="docs/03-rkas-bulanan.png" width="48%">
</p>

---

# Yang Baru

## v1.11.4

### Realisasi Anggaran

* Tracking realisasi per item RKAS
* Perhitungan selisih anggaran
* Smart Reconciliation
* Detail aliran dana

### Sinkronisasi ARKAS

* Deteksi RKAS usang
* Tombol sinkronisasi
* Validasi data otomatis

### Peningkatan

* Perbaikan realisasi ganda
* Optimasi performa
* Akurasi laporan meningkat

---

# Teknologi

| Komponen  | Teknologi        |
| --------- | ---------------- |
| Framework | Electron 28      |
| UI        | React 18         |
| Build     | Vite 5           |
| Styling   | TailwindCSS      |
| Database  | SQLCipher        |
| Grafik    | Chart.js         |
| Excel     | ExcelJS          |
| PDF       | jsPDF & PDFKit   |
| Update    | Electron Updater |
| Proteksi  | Bytenode         |

---

# Keamanan

| Layer       | Implementasi              |
| ----------- | ------------------------- |
| Database    | SQLCipher Encryption      |
| ARKAS       | Read Only Access          |
| Credential  | Electron safeStorage      |
| Windows     | DPAPI                     |
| License     | Ed25519 Digital Signature |
| Device      | Hardware Fingerprint      |
| Source Code | Bytenode (.jsc)           |

---

# Screenshot Lainnya

<p align="center">
<img src="docs/18-tentang-semua.png" width="100%">
</p>

---

# Download

<p align="center">

### Download versi terbaru

https://github.com/kevindoni/SMARTSPJ_APP_NEW/releases

</p>

> **Windows SmartScreen**
>
> Karena aplikasi belum menggunakan Code Signing Certificate publik, Windows dapat menampilkan peringatan saat instalasi. Pilih **More info → Run anyway** untuk melanjutkan.

---

# Dokumentasi

| Dokumen            | Keterangan         |
| ------------------ | ------------------ |
| PANDUAN_LENGKAP.md | Panduan penggunaan |
| CHANGELOG.md       | Riwayat perubahan  |
| LICENSE            | Lisensi            |

---

# Lisensi

Copyright © 2024–2026 KevinDoni.

SmartSPJ didistribusikan menggunakan **SmartSPJ Proprietary License**.

Seluruh hak cipta dilindungi.

---

<p align="center">
<b>SmartSPJ</b><br>
Desktop Companion for ARKAS
</p>
