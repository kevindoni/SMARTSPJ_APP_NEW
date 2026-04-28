# Panduan Pengguna SmartSPJ

Selamat datang di SmartSPJ! Panduan ini akan membantu Anda memahami dan menggunakan aplikasi SmartSPJ untuk pendamping ARKAS dalam pengelolaan SPJ (Surat Perintah Jalan).

## 1. Memulai

### Instalasi
1. Unduh installer terbaru dari [GitHub Releases](https://github.com/kevindoni/SMARTSPJ_APP_NEW/releases).
2. Jalankan installer dan ikuti petunjuk wizard.
3. Setelah instalasi selesai, aplikasi akan terbuka secara otomatis.

### Aktivasi Lisensi
- Pada pertama kali membuka aplikasi, Anda akan diminta untuk memasukkan lisensi key.
- Pilih mode **Trial (30 hari)** jika Anda ingin mencoba aplikasi terlebih dahulu, atau masukkan lisensi key yang telah Anda beli.
- Lisensi key berbentuk: `SMARTSPJ-XXXXX-XXXXX-XXXXX-XXXXX`

## 2. Navigasi Dasar

SmartSPJ menggunakan sidebar navigasi di sebelah kiri untuk mengakses berbagai modul:

- **Dashboard**: Statistik keuangan real-time.
- **Penganggaran**: Melihat dan mengelola RKAS serta realisasi belanja.
- **Buku Kas**: mencakup Buku Kas Umum, Buku Pembantu Tunai, Bank, dan Pajak.
- **Bukti Transaksi & Cetak**: mencetak kwitansi, bukti pengeluaran, dan lain-lain.
- **Laporan**: mencetak BA Rekonsiliasi, SPTJM, laporan K7/K7a, dan register kas.
- **Backup & Data**: backup dan restore data aplikasi.
- **Pengaturan**: konfigurasi pejabat sekolah, koneksi database ARKAS, dan lisensi.

## 3. Menggunakan Modul Utama

### Dashboard
Melihat grafik penerimaan, pengeluaran, saldo, dan grafik interaktif lainnya.

### Penganggaran
- **Kertas Kerja (RKAS)**: Lihat RKAS dari ARKAS.
- **Realisasi Belanja**: Lihat realisasi belanja per kegiatan, filter per bulan dan sumber dana.

### Buku Kas Umum (BKU)
- Lihat transaksi kas dengan filter bulan, sumber dana, dan pencarian.
- Export transaksi ke Excel atau PDF per bulan.
- Export semua bulan ke satu file Excel (fitur Pro).

### Cetak Kwitansi dan Bukti
- Cetak kwitansi A2 secara satuan atau batch.
- Cetak bukti pengeluaran.
- Gabungkan beberapa transaksi menjadi satu bukti (Merge Transaksi).

### Laporan
- Cetak Berita Acara Rekonsiliasi (BA) ke PDF, Excel, atau HTML.
- Cetak SPTJM, laporan K7/K7a, dan register kas.

### Backup dan Pemulihan
- Buat backup lengkap (ZIP) atau hanya konfigurasi (JSON).
- Restore data dari file backup.
- Lihat isi backup sebelum melakukan restore.

### Pengaturan
- Konfigurasikan nama kepala sekolah, bendahara, NIP, dan penandatangan BA.
- Atur koneksi ke database ARKAS (otomatis mendeteksi path dan password).
- Lihat informasi versi aplikasi, Electron, Chrome, dan Node.
- Aktifkan/deaktifkan lisensi, lihat masa trial, dan cek update otomatis.

## 4. Tips dan Trik

- Gunakan filter dan pencarian untuk mempercepat pencarian data.
- Simpan pekerjaan Anda secara berkala; aplikasi memiliki auto-save untuk beberapa form.
- Untuk versi trial, ada batasan pada jumlah ekspor cetak dan fitur tertentu. Lihat bagian **Ketentuan Lisensi** di bawah ini.

## 5. Ketentuan Lisensi

SmartSPJ menyediakan tiga tier lisensi:

- **Free Trial**: 30 hari, fitur terbatas (lihat tabel di About → Lisensi).
- **Basic**: Lisensi tahunan, satu device, fitur menengah.
- **Pro**: Lisensi tahunan, satu device, fitur penuh.

Lisensi terikat pada perangkat keras Anda (hardware fingerprint). Untuk pindah ke PC lain, gunakan fitur **Deactivate** di menu Pengaturan → Lisensi, lalu aktifkan di PC baru.

## 6. Bantuan dan Dukungan

Jika Anda mengalami kesulitan, silakan:
- Lihat file `Troubleshooting Guide` dan `FAQ` di dalam folder `docs`.
- Hubungi tim support melalui email: support@smartspj.example.com (contoh).
- Sertakan log aplikasi (bisa diaktifkan dengan mengatur variabel lingkungan `ELECTRON_ENABLE_LOGGING=1` sebelum menjalankan aplikasi).

---

*Versi dokumen: 1.0*  
*Tanggal: 26 April 2026*