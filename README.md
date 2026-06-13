<p align="center">
  <img src="https://img.shields.io/badge/SmartSPJ-v1.9.5-0F172A?style=for-the-badge&labelColor=1E293B&color=3B82F6" alt="SmartSPJ"/>
</p>

<h1 align="center">SmartSPJ</h1>

<p align="center">
  <strong>Aplikasi Desktop Pendamping ARKAS untuk Pengelolaan SPJ BOS</strong><br/>
  <em>Solusi praktis untuk membantu bendahara sekolah menyusun laporan, bukti transaksi, dan dokumen pertanggungjawaban BOS secara lebih cepat, rapi, dan akurat.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Windows-10%2B-0078D4?style=flat-square&logo=windows&logoColor=white" alt="Windows 10+"/>
  <img src="https://img.shields.io/badge/Electron-28-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron"/>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"/>
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=flat-square" alt="License"/>
</p>

<p align="center">
  <a href="#tentang-smartspj">Tentang</a> &bull;
  <a href="#fitur-utama">Fitur</a> &bull;
  <a href="#tech-stack">Tech Stack</a> &bull;
  <a href="#keamanan">Keamanan</a> &bull;
  <a href="#download">Download</a> &bull;
  <a href="#lisensi">Lisensi</a>
</p>

---

## Tentang SmartSPJ

**SmartSPJ** adalah aplikasi desktop yang dikembangkan sebagai pendamping **ARKAS** untuk membantu bendahara sekolah dalam mengelola dokumen **SPJ BOS**.

Aplikasi ini membaca database ARKAS secara **read-only**, lalu menyajikan data keuangan dalam tampilan yang lebih mudah dipahami, dianalisis, dicetak, dan diekspor.

SmartSPJ dirancang untuk membantu pekerjaan administrasi keuangan sekolah, mulai dari pengecekan transaksi, pembuatan buku kas, cetak kwitansi, cetak bukti pengeluaran, BA Rekonsiliasi, Rekonsiliasi Bank, SPTJM, RKAS Proporsi, Kertas Kerja, hingga rekap saldo bulanan.

---

## Tujuan Aplikasi

SmartSPJ dibuat untuk membantu sekolah dalam:

- Mempercepat penyusunan SPJ BOS.
- Mengurangi pekerjaan manual yang berulang.
- Menyajikan data ARKAS dalam tampilan yang lebih informatif.
- Mempermudah proses cetak kwitansi dan bukti pengeluaran.
- Membantu pengecekan transaksi, pajak, dan saldo.
- Menyediakan export laporan ke format Excel dan PDF.
- Mendukung bendahara dalam menyiapkan dokumen pertanggungjawaban.

---

## Fitur Utama

### Dashboard & Analitik Keuangan

- Statistik keuangan real-time.
- Perbandingan transaksi bulanan.
- Grafik pendapatan, belanja, dan saldo akhir.
- Pergerakan kas bulanan berdasarkan sumber dana.
- Ringkasan sumber dana: BOS Reguler, BOS Kinerja, Dana Lainnya, SiLPA.
- Breakdown belanja berdasarkan kategori dan kegiatan.
- Top 5 pengeluaran untuk membantu analisis transaksi.

### RKAS Creator & Proporsi

- Pembuatan dan penyusunan RKAS langsung dari aplikasi.
- Visualisasi proporsi anggaran dalam grafik donat interaktif.
- Standar Summary ringkasan pagu per standar belanja.
- Kegiatan View untuk perincian anggaran per kegiatan.
- Perhitungan otomatis berdasarkan data ARKAS.

### Buku Kas & Buku Pembantu

- **Buku Kas Umum (BKU)** dengan filter, search, dan paginasi.
- **Buku Pembantu Tunai** &mdash; arus kas tunai.
- **Buku Pembantu Bank** &mdash; rekening koran bank.
- **Buku Pembantu Pajak** &mdash; pajak pungut dan setor, termasuk input pajak manual.
- Export ke Excel dan PDF per bulan maupun 12 bulan sekaligus.
- Export All-in-One &mdash; satu file Excel multi-sheet.

### Cetak Bukti Transaksi

- Cetak Kwitansi A2 (satuan dan batch).
- Cetak Bukti Pengeluaran (satuan dan batch).
- Nota Group Manager untuk pengelompokan nota.
- Merge Transaksi untuk menggabungkan beberapa transaksi ke dalam satu bukti.
- Preview dokumen sebelum dicetak.

### Rekonsiliasi & Kertas Kerja

- **BA Rekonsiliasi** &mdash; Berita Acara otomatis dari data ARKAS.
- **Rekonsiliasi Bank** &mdash; rekonsiliasi rekening bank dengan mutasi.
- **Kertas Kerja** &mdash; lembar kertas kerja formal (bulanan, triwulan, tahunan).
- **Smart Reconciliation Table** &mdash; tabel rekonsiliasi cerdas.
- Export laporan ke PDF, Excel, dan HTML.

### Laporan & Dokumen Pertanggungjawaban

- **SPTJM** &mdash; Surat Pertanggungjawaban Mutlak.
- **Laporan K7 / K7a** &mdash; Rekapitulasi per periode.
- **Register Kas** &mdash; Pecahan uang kas fisik.
- **Realisasi Belanja** &mdash; monitoring realisasi vs anggaran.
- **Rekap Saldo Bulanan** &mdash; bulanan, triwulan, semester, tahunan.
- Export laporan ke PDF, Excel, dan HTML.

### Backup & Restore

- Backup konfigurasi dalam format JSON.
- Backup lengkap dalam format ZIP (seluruh folder data).
- Restore data dengan preview isi backup sebelum proses restore.
- Pemeriksaan isi backup sebelum data diterapkan kembali.

### Pengaturan & Sistem

- Konfigurasi identitas sekolah.
- Konfigurasi Kepala Sekolah dan Bendahara.
- Konfigurasi NIP pejabat.
- Konfigurasi penandatangan BA Rekonsiliasi.
- Auto-detect database ARKAS.
- Penyimpanan kredensial menggunakan mekanisme aman dari sistem operasi.
- Auto-update aplikasi melalui GitHub Releases.
- Informasi versi Electron, Chrome, Node.js, dan aplikasi.

---

## Tech Stack

| Teknologi | Fungsi |
| --- | --- |
| **Electron 28** | Framework aplikasi desktop |
| **React 18** | Antarmuka pengguna |
| **Vite 5** | Build tool dan development server |
| **TailwindCSS 3** | Styling antarmuka |
| **better-sqlite3-multiple-ciphers** | Akses database terenkripsi SQLCipher |
| **Chart.js 4** | Visualisasi data dan grafik |
| **jsPDF** | Pembuatan file PDF dari frontend |
| **pdfkit** | Pembuatan file PDF dari backend |
| **ExcelJS** | Export laporan ke Excel |
| **Lucide React** | Ikon antarmuka |
| **Electron Updater** | Auto-update aplikasi |
| **Bytenode** | Kompilasi source code ke bytecode |

---

## Keamanan

SmartSPJ menggunakan pendekatan keamanan berlapis untuk menjaga data dan konfigurasi aplikasi.

| Layer | Implementasi |
| --- | --- |
| **Database** | Akses database terenkripsi menggunakan SQLCipher |
| **Akses ARKAS** | Read-only terhadap database ARKAS &mdash; data asli tidak pernah dimodifikasi |
| **Source Code** | Backend dikompilasi ke bytecode Bytenode (`.jsc`); file `.js` tidak ikut di installer |
| **Credential Storage** | Penyimpanan aman menggunakan Electron safeStorage (Windows DPAPI) |
| **Konfigurasi** | Password dan konfigurasi sensitif disimpan melalui file `.env` |
| **Lisensi** | Ed25519 digital signature dan hardware fingerprint binding |

---

## Prinsip Akses Data

SmartSPJ tidak mengubah data utama ARKAS.

Aplikasi hanya membaca database ARKAS secara **read-only** untuk kebutuhan tampilan, analisis, export, dan pencetakan laporan. Dengan pendekatan ini, data asli ARKAS tetap aman dan tidak dimodifikasi oleh SmartSPJ.

---

## Download

Installer terbaru dapat diunduh melalui halaman berikut:

**[GitHub Releases](https://github.com/kevindoni/SMARTSPJ_APP_NEW/releases)**

> **Catatan Windows SmartScreen**
> Karena repository bersifat private dan aplikasi belum menggunakan code signing certificate publik, Windows SmartScreen dapat menampilkan peringatan saat instalasi.
> Pilih **More info** lalu klik **Run anyway** untuk melanjutkan instalasi.

---

## Dokumentasi

| Dokumen | Keterangan |
| --- | --- |
| [Panduan Pengguna](docs/Panduan_Pengguna_SmartSPJ.md) | Panduan penggunaan untuk pengguna akhir |
| [Panduan Instalasi](docs/Panduan_Instalasi_Konfigurasi_Awal.md) | Panduan instalasi dan konfigurasi awal |
| [Panduan Sistem Lisensi](docs/Panduan_Sistem_Lisensi_SmartSPJ.md) | Penjelasan sistem lisensi aplikasi |
| [Panduan Lengkap](docs/PANDUAN_LENGKAP.md) | Dokumentasi teknis dan operasional |

---

## Status Pengembangan

SmartSPJ saat ini berada pada versi **v1.9.5**.

Pengembangan difokuskan pada stabilitas aplikasi, penyempurnaan fitur RKAS Proporsi, peningkatan keamanan source code, perbaikan perhitungan pajak, dan penambahan fitur yang relevan untuk kebutuhan bendahara sekolah.

---

## Lisensi

Hak cipta &copy; 2024&ndash;2026 **KevinDoni**. Seluruh hak dilindungi.

SmartSPJ dilisensikan di bawah **SmartSPJ Proprietary License**.

Penggunaan, reproduksi, modifikasi, distribusi, atau publikasi ulang tanpa izin tertulis dari pemilik hak cipta tidak diperbolehkan.

Lihat file [LICENSE](LICENSE) untuk detail lengkap.

---

<p align="center">
  <strong>SmartSPJ</strong><br/>
  Dibuat dengan dedikasi untuk membantu bendahara sekolah Indonesia.
</p>
