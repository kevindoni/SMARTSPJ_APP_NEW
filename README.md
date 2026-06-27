<p align="center">
  <img src="https://img.shields.io/badge/SmartSPJ-v1.11.4-0F172A?style=for-the-badge&labelColor=1E293B&color=3B82F6" alt="SmartSPJ"/>
  <img src="https://img.shields.io/badge/Windows-10%2B-0078D4?style=for-the-badge&logo=windows&logoColor=white" alt="Windows"/>
  <img src="https://img.shields.io/badge/Electron-28-47848F?style=for-the-badge&logo=electron&logoColor=white" alt="Electron"/>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
</p>

<h1 align="center">SmartSPJ</h1>

<p align="center">
  <strong>Aplikasi Desktop Pendamping ARKAS untuk Pengelolaan SPJ BOS</strong><br/>
  <em>Membantu bendahara sekolah menyusun laporan, bukti transaksi, dan dokumen pertanggungjawaban BOS &mdash; lebih cepat, rapi, dan akurat.</em>
</p>

<p align="center">
  <a href="https://github.com/kevindoni/SMARTSPJ_APP_NEW/releases">
    <img src="https://img.shields.io/badge/Download-Installer%20Terbaru-22C55E?style=for-the-badge&logo=github&logoColor=white" alt="Download"/>
  </a>
</p>

<p align="center">
  <a href="#tentang">Tentang</a> &bull;
  <a href="#fitur">Fitur</a> &bull;
  <a href="#yang-baru">Yang Baru</a> &bull;
  <a href="#tech-stack">Tech Stack</a> &bull;
  <a href="#keamanan">Keamanan</a> &bull;
  <a href="#download">Download</a> &bull;
  <a href="#dokumentasi">Dokumentasi</a>
</p>

---

## Tentang

**SmartSPJ** adalah aplikasi desktop pendamping **ARKAS** yang membantu bendahara sekolah mengelola dokumen **SPJ BOS**. Aplikasi membaca database ARKAS secara **read-only**, lalu menyajikan data keuangan dalam tampilan yang lebih mudah dipahami, dianalisis, dicetak, dan diekspor &mdash; **tanpa pernah memodifikasi data asli ARKAS**.

Cakupan pekerjaan: pengecekan transaksi, pembuatan buku kas, cetak kwitansi &amp; bukti pengeluaran, BA Rekonsiliasi, Rekonsiliasi Bank, SPTJM, RKAS Proporsi, Kertas Kerja, monitoring realisasi, hingga rekap saldo bulanan.

---

## Fitur

### Dashboard & Analitik Keuangan
- Statistik keuangan real-time dan perbandingan transaksi bulanan.
- Grafik pendapatan, belanja, dan saldo akhir.
- Pergerakan kas per sumber dana (BOS Reguler, BOS Kinerja, Dana Lainnya, SiLPA).
- Breakdown belanja per kategori/kegiatan dan Top 5 pengeluaran.

### RKAS Creator & Proporsi
- Penyusunan RKAS langsung dari aplikasi dengan visualisasi proporsi anggaran (donat chart).
- View: Standar, Kegiatan, Bulanan, dan Proporsi.
- **Monitoring Realisasi & Selisih** per item (anggaran vs realisasi BKU).
- Deteksi sinkronisasi otomatis dengan ARKAS.

### Buku Kas & Buku Pembantu
- **Buku Kas Umum (BKU)** dengan filter, pencarian, dan paginasi.
- **Buku Pembantu Tunai, Bank, dan Pajak** (termasuk input pajak manual).
- Export Excel &amp; PDF per bulan maupun 12 bulan sekaligus (All-in-One multi-sheet).

### Cetak Bukti Transaksi
- Kwitansi A2 &amp; Bukti Pengeluaran (satuan dan batch).
- Nota Group Manager dan Merge Transaksi.
- Pratinjau dokumen sebelum dicetak.

### Rekonsiliasi & Kertas Kerja
- **BA Rekonsiliasi** otomatis dari data ARKAS.
- **Rekonsiliasi Bank** dengan mutasi rekening.
- **Kertas Kerja** formal (bulanan, triwulan, tahunan) + Smart Reconciliation Table.
- Export PDF, Excel, dan HTML.

### Laporan & Dokumen Pertanggungjawaban
- **SPTJM**, **Laporan K7/K7a**, **Register Kas**, **Realisasi Belanja**, **Rekap Saldo Bulanan**.
- Export PDF, Excel, dan HTML.

### Backup & Restore
- Backup konfigurasi (JSON) dan backup lengkap (ZIP seluruh folder data).
- Pratinjau isi backup sebelum proses restore.

---

## Yang Baru

### v1.11.4 &mdash; Pelacakan Realisasi & Selisih Anggaran + Sinkronisasi ARKAS

- **Kolom Realisasi & Selisih** di Buat RKAS, Kertas Kerja, dan Realisasi Belanja untuk memantau perbandingan anggaran vs realisasi BKU per item.
- Selisih dikategorikan: **Selisih Sisa** (hemat), **Selisih Kurang** (over), dan **Belum Dipakai** (jatuh tempo, belum dibayar).
- Anggaran bulan mendatang ditandai **"Belum Jatuh Tempo"** agar tidak keliru dihitung sebagai efisiensi.
- **Deteksi sinkronisasi ARKAS** &mdash; peringatan otomatis saat data RKAS lokal usang + tombol Sinkronisasi.
- Detail Aliran Dana per item (Target, Realisasi BKU, Selisih per bulan).
- Perbaikan: realisasi ganda pada item kode/uraian sama; mode Kumulatif kini menampilkan anggaran tahunan.

> Changelog lengkap tersedia di halaman **About** dalam aplikasi.

---

## Tech Stack

| Teknologi | Fungsi |
| --- | --- |
| **Electron 28** | Framework aplikasi desktop |
| **React 18** | Antarmuka pengguna |
| **Vite 5** | Build tool &amp; dev server |
| **TailwindCSS 3** | Styling antarmuka |
| **better-sqlite3-multiple-ciphers** | Akses database terenkripsi SQLCipher |
| **Chart.js 4** | Visualisasi data &amp; grafik |
| **jsPDF / pdfkit** | Pembuatan file PDF |
| **ExcelJS** | Export laporan ke Excel |
| **Electron Updater** | Auto-update via GitHub Releases |
| **Bytenode** | Kompilasi source code ke bytecode |

---

## Keamanan

SmartSPJ menggunakan pendekatan keamanan berlapis.

| Layer | Implementasi |
| --- | --- |
| **Database** | Akses database terenkripsi SQLCipher |
| **Akses ARKAS** | Read-only &mdash; data asli tidak pernah dimodifikasi |
| **Source Code** | Backend dikompilasi ke bytecode Bytenode (`.jsc`) |
| **Credential Storage** | Electron safeStorage (Windows DPAPI) |
| **Lisensi** | Ed25519 digital signature + hardware fingerprint binding |

---

## Download

Installer terbaru: **[GitHub Releases](https://github.com/kevindoni/SMARTSPJ_APP_NEW/releases)**

> **Catatan Windows SmartScreen**
> Karena aplikasi belum menggunakan code signing certificate publik, Windows SmartScreen dapat menampilkan peringatan saat instalasi. Pilih **More info** &rarr; **Run anyway** untuk melanjutkan.

---

## Dokumentasi

| Dokumen | Keterangan |
| --- | --- |
| [Panduan Lengkap](docs/PANDUAN_LENGKAP.md) | Dokumentasi teknis &amp; operasional |

---

## Lisensi

Hak cipta &copy; 2024&ndash;2026 **KevinDoni**. Seluruh hak dilindungi.

SmartSPJ dilisensikan di bawah **SmartSPJ Proprietary License**. Penggunaan, reproduksi, modifikasi, distribusi, atau publikasi ulang tanpa izin tertulis tidak diperbolehkan. Lihat file [LICENSE](LICENSE) untuk detail.

---

<p align="center">
  <strong>SmartSPJ</strong><br/>
  <em>Dibuat untuk membantu bendahara sekolah Indonesia.</em>
</p>
