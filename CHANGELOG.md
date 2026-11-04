# Changelog

## [3.1.0] — 4 November 2026

### Fitur Baru
- **Asisten Tutup Bulan ARKAS** (BA Rekonsiliasi → tab TUTUP BULAN) — siapkan angka Bunga Bank & Pajak Bunga untuk dialog tutup bulan ARKAS; checklist pra-tutup: status & urutan bulan, nota SIPLAH tanpa PPN, aturan pecah nota (nota manual ber-PPN > Rp 2.220.000/bulan per kegiatan+rekening), hutang pajak, dan pengingat pajak daerah (belanja rekening kena SSPD belum dicatat). Ringkasan bulan: jumlah transaksi, penerimaan, belanja, pajak dipungut/disetor, saldo akhir. Sadar status: pratinjau pasca-tutup vs periksa pra-tutup; bulan masa depan tidak bisa dipilih.
- **Pembanding Saldo ARKAS ⇄ Rekening Riil** (tab BA REKONS) — dua angka berdampingan per periode + selisih (= pajak dipungut belum disetor) dengan penjelasan singkat.
- **Asisten Tutup Tahun** — status 12 bulan, pratinjau Saldo Awal tahun baru saat SIAP KONVERSI, pengingat akun konversi (NPSN+tahun/koreg), device binding harddisk, dan tenggat BOS Kinerja 2 tahun.
- **Tahap Pencairan Dana** — dari tabel salur ARKAS per sumber dana: tahap, tanggal persetujuan, nilai bersih, potongan silpa/carry over.
- **Kalkulator pajak otomatis** di Input Pajak Manual — Pajak Daerah 10%, PPN 11%→12% (mulai 2025, opsi harga termasuk pajak/gross-up), PPh 23 & PPh 4(2) 2%; kolom nominal kini berformat titik ribuan.
- **Info revisi RKAS** — chip label Murni/Pergeseran/Perubahan per sumber dana di BA Rekonsiliasi (dekode is_revisi ARKAS).
- **Checklist SPJ sesuai Sosialisasi BOS 2026 Temanggung** — 23 jenis checklist dari PPTM resmi: tambah Belanja Sosialisasi/Bimtek, Belanja Pemeliharaan, Belanja Kursus/Pelatihan; Jasa Tenaga dipisah Kependidikan (0013) vs Administrasi/Kebersihan/Keamanan (0015/26/27/30/31); semua butir selaras dokumen resmi pemda.
- **Kode BOS Besar pada cetakan A2** — baris kode program–kegiatan–rekening di bawah Tahun Anggaran; input manual + checkbox on/off di Pengaturan → Data Pejabat Sekolah.
- **Kelompokkan per Rekening** — tombol pintar di Gabung Manual: pilih semua grup se-rekening sekaligus untuk digabung jadi satu nota A2.
- **Riwayat SIPLAH diperluas** — pencarian (invoice/toko/barang), filter bulan, ringkasan jumlah transaksi & total nilai.
- Pajak daerah mengenali Input Pajak Manual: status LUNAS / BELUM SETOR (hutang) dengan sisa.

### Perbaikan
- **Pajak menempel induknya di BKU** — urutan cetak: belanja A → Terima pajak A → Setor pajak A (tidak lagi tercecer di atas); berlaku di layar dan export PDF/Excel.
- **Gabung Manual diperbaiki** — belanja non-SIPLAH kini bisa digabung (sebelumnya hanya SIPLAH); tombol tidak lagi disable padahal grup sudah dipilih; grup tanpa no. bukti tampil dengan kode TX_ otomatis.
- **Buku Pembantu Tunai & Bank** — filter transaksi memakai matriks kanonik ARKAS (persis bku-tunai-q2 / bku-bank-q2), bukan tebakan uraian.
- **Urutan Cetak ARKAS** — toggle di BKU: urutkan tanggal → waktu entri → jenis transaksi, dengan saldo resmi cetakan dinas (bku-q2.sql); untuk mencocokkan layar dengan kertas cetakan.
- **Export BKU diperbaiki** — perbaikan error "options is not defined" pada PDF; pajak kini menempel induknya di export semua bulan.
- **Deteksi SIPLAH** — hanya berdasarkan flag `is_siplah = 1` di database ARKAS (bukan pola nomor invoice); transaksi non-SIPLAH tidak lagi salah dapat checklist SIPLAH.
- **Pencocokan checklist berbasis kode rekening** — kode rekening diperiksa lebih dulu (dari REKAPITULASI BELANJA PER KODE REKENING), uraian hanya fallback; memastikan checklist SPJ sesuai jenis belanja resmi.
- **Perjalanan Dinas lengkap** — tambah tiket pesawat/boarding pass, bukti hotel/penginapan, bukti sewa kendaraan, Daftar Pengeluaran Riil, dan uang transport peserta.
- **Belanja Modal** — PPh pasal 22 (bukan pasal 23); Berita Acara serah terima kepada PPTK.
- **Belanja Online** — tambah Surat Pesanan, Bukti Tagihan, Bukti Serah Terima, Undangan, Daftar Hadir, Foto Kegiatan.
- **Belanja Tagihan** — label diperbaiki dari "Jasa Kantor" menjadi "Belanja Tagihan"; hanya 2 butir sesuai PPTM.
- **Materai otomatis dihapus dari checklist** — PPTM tidak memiliki butir materai terpisah.
- **Blok Penutupan Buku** — tampil rapi di BKU bulanan dengan saldo Bank & Tunai berdasarkan matriks kanonik.
- **Rekening 5.1.02.03** — kini terpetakan ke Pemeliharaan (sebelumnya salah ke Bahan Pakai Habis).
- **Rekening 5.1.02.02.01.0027** — kini terpetakan ke Jasa Tenaga Administrasi (sebelumnya salah ke Honor Narasumber).

## [3.0.9] — 31 Oktober 2026

### Fitur Baru
- **Menu "Hutang Pajak"** — daftar pajak yang dipotong dan belum disetorkan, dikelompokkan per bulan. Pelunasan dicatat lewat transaksi Setor Pajak di BKU.
- **Input Pajak Manual** — catat pajak yang tidak tercatat di ARKAS (Saldo Awal Tahun, Pajak Terlewat, Setor Pajak, Transaksi Manual) — lengkap dengan penjelasan tiap jenis.
- **Kini terintegrasi dengan SIPLAH Toko Ladang** — login otomatis lewat SSO belajar.id, kode keamanan (2FA) diminta langsung di aplikasi.
- **Jendela pembayaran lisensi yang tidak sengaja tertutup dapat dibuka lagi** — tautan pembayaran tersimpan dan tetap berlaku 24 jam.

### Perbaikan
- **Pajak yang dipotong dari belanja kini ikut terhitung di saldo laporan** — pajak yang sudah dipungut tetapi belum disetorkan tidak lagi "hilang" dari saldo BA Rekons & REKAP; saldo buku kini sama dengan rekening riil, dan begitu disetorkan saldo otomatis berkurang.