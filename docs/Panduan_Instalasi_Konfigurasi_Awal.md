# Panduan Instalasi dan Konfigurasi Awal SmartSPJ

## Persyaratan Sistem
- Sistem Operasi: Windows 10 64-bit atau Windows 11
- RAM: Minimal 4 GB (disarankan 8 GB)
- Penyimpanan: Minimal 2 GB ruang bebas
- Koneksi Internet: Untuk aktivasi lisensi dan update (opsional untuk mode offline setelah aktivasi)

## Langkah Instalasi
1. **Download Installer**
   - Kunjungi [GitHub Releases](https://github.com/kevindoni/SMARTSPJ_APP_NEW/releases)
   - Unduh file `SmartSPJ Setup X.X.X.exe` versi terbaru

2. **Menjalankan Installer**
   - Klik dua kali file installer yang diunduh
   - Jika muncul peringatan SmartScreen, klik "More info" lalu "Run anyway"
   - Pilih bahasa instalasi (Indonesia/English)
   - Terima Perjanjian Lisensi
   - Pilih folder tujuan (default: `C:\Program Files\SmartSPJ`)
   - Centang opsi "Buat ikon di desktop" jika diinginkan
   - Klik "Install" untuk memulai proses instalasi

3. **Konfigurasi Awal**
   Setelah instalasi selesai, aplikasi akan terbuka secara otomatis:
   - **Koneksi Database ARKAS**
     - Aplikasi akan otomatis mendeteksi instalasi ARKAS di komputer Anda
     - Jika tidak terdeteksi, Anda akan diminta untuk:
       - Menentukan path ke folder ARKAS (biasanya `C:\ARKAS` atau `D:\ARKAS`)
       - Memasukkan password database jika diminta (biasanya kosong untuk instalasi standar)
   - **Aktivasi Lisensi**
     - Pilih opsi:
       - **Trial (30 hari)** untuk mencoba aplikasi
       - **Masukkan Lisensi Key** jika Anda telah membeli lisensi Basic atau Pro
     - Lisensi key harus dalam format: `SMARTSPJ-XXXXX-XXXXX-XXXXX-XXXXX`
   - **Pengaturan Awal Sekolah**
     - Isi data kepala sekolah, bendahara, dan NIP
     - Pilih penandatangan untuk Berita Acara Rekonsiliasi

4. **Restart Aplikasi**
   - Setelah konfigurasi selesai, aplikasi akan restart otomatis
   - Login menggunakan username dan password default (jika ada) atau gunakan akses penuh sebagai pengguna pertama

## Verifikasi Instalasi
- Pastikan tampilan dashboard menunjukkan data dari ARKAS (jika terhubung)
- Coba buat transaksi kecil di Buku Kas Umum untuk memastikan fungsi dasar bekerja
- Periksa menu Pengaturan → Lisensi untuk melihat status aktif dan masa berlaku

## Troubleshooting Instalasi Umum
| Masalah | Solusi |
|---------|--------|
| Installer tidak bisa dijalankan | Klik kanan → "Run as administrator" |
| Tidak terdeteksi database ARKAS | Pastikan ARKAS terinstal dan tidak sedang digunakan oleh aplikasi lain |
| Gagal aktivasi lisensi | Periksa koneksi internet (untuk aktivasi online) atau pastikan format key benar |
| Aplikasi crash setelah instalasi | Pastikan versi Windows memenuhi syarat dan .NET Framework terinstal |

*Versi dokumen: 1.0*  
*Tanggal: 26 April 2026*