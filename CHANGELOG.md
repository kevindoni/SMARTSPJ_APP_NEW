# Changelog — SmartSPJ

Semua perubahan penting pada proyek ini akan didokumentasikan dalam file ini.

---

## [2.1.5] — 30 Juli 2026

### Perbaikan

- **Hutang Pajak BA Rekonsiliasi tidak double** — Info Card & Summary Banner kini ambil saldo akhir dari Tab Pajak (getPajakDetail), bukan perhitungan `pajakPungut - pajakSetor`. Sebelumnya 198.200 → sekarang 99.100.
- **Saldo Pajak terbawa ke bulan berikutnya** — BKU Pajak: saldo akhir bulan lalu muncul sebagai baris "Saldo Bulan [nama bulan]" di awal bulan berikutnya. Sebelumnya selalu mulai dari 0.
- **"Saldo Bulan Lalu" → "Saldo Bulan Januari"** — Label saldo awal di TaxTransactionTable kini tampilkan nama bulan spesifik.
- **A2/Kwitansi: nama penerima dikosongkan** — Kolom "Yang menerima uang" tidak cetak nama otomatis di bawah garis. Hanya "Nama:" + "Alamat:" di atas. Ditulis manual dengan pulpen.
- **Bukti Pengeluaran: Penerima dikosongkan** — Signature block "Penerima" tidak cetak nama otomatis.
- **BPU muncul di Gabung Transaksi BKU** — BPU (id_ref_bku=4) tidak lagi di-exclude sebagai penerimaan. Sebelumnya tidak muncul di modal.
- **Limit transaksi modal Gabung** — `limit:0` sekarang benar = tanpa batas (sebelumnya `0||50`=50, transaksi terpotong).
- **Dropdown bulan terfilter** — Semua dropdown bulan (6 tempat: BKU, Cetak Manual, Nota Gabungan, Realisasi Belanja, Kertas Kerja, Register Kas) hanya tampil sampai bulan terakhir yang punya data di ARKAS.

### Peningkatan

- **Sisa Anggaran RKAS bisa minus** — Card "Sisa Anggaran" tampil merah jika realisasi melebihi anggaran (bukan di-clamp ke 0).
- **Harga satuan RKAS bisa minus** — Input harga satuan menerima nilai negatif untuk adjustment/koreksi.
- **Uraian override terpusat + sync lintas komponen** — Edit uraian di mana pun (BKU/Nota Gabungan/Cetak Manual) → sync ke semua via backend `uraian-overrides.json` + cross-component event.

---

## [2.1.4] — 28 Juli 2026

### Perbaikan

- **Hutang Pajak BA Rekonsiliasi** — Nilai UTANG PJK di tabel REKAP SALDO BULANAN kini akurat (pakai saldo dari Tab Pajak, bukan perhitungan terpisah). Sebelumnya terhitung double (198.200 → 99.100).
- **Info Card Hutang Pajak** — Pakai saldo akhir dari Tab Pajak (getPajakDetail) bukan pajakPungut - pajakSetor.
- **BPU di Gabung Transaksi** — BPU (id_ref_bku=4) tidak lagi di-exclude dari modal Gabung Transaksi BKU. Sebelumnya tertimpa filter penerimaan.
- **Limit transaksi modal Gabung** — `limit: 0` sekarang benar-benar "tanpa batas" (sebelumnya `0 || 50` = 50, BPU terpotong).
- **A2/Kwitansi: nama penerima kosong** — Kolom "Yang menerima uang" tidak lagi mencetak nama otomatis. Hanya "Nama:" + "Alamat:" di atas, garis kosong di bawah untuk ditulis manual dengan pulpen.
- **Sisa Anggaran RKAS bisa minus** — Card "Sisa Anggaran" menampilkan nilai negatif (merah) jika realisasi melebihi anggaran, bukan di-clamp ke 0.
- **Harga satuan RKAS bisa minus** — Input harga satuan di Tambah Item menerima nilai negatif (untuk adjustment/koreksi).
- **PajakHutang di reconciliation handler** — Tambah properti pajakHutang (opening/closing) ke monthly/quarterly/semester/annual data.

---

## [2.1.3] — 26 Juli 2026

### Perbaikan

- **CI/CD auto-publish** — Release otomatis publish (un-draft + set latest) setelah build.
- **check-changelog strict** — Build gagal jika CHANGELOG.md ATAU About.jsx belum di-update ke versi package.json.
- **About.jsx v2.1.2 changelog** — Entry v2.1.2 yang hilang di build sebelumnya sekarang benar.

---

## [2.1.2] — 26 Juli 2026

### Fitur Baru

- **Foto Nota (dataUrl)** — Foto nota kini ditampilkan via base64 dataUrl (bukan protocol handler). Upload, hapus, dan gallery foto nota di kedua tab (Nota Gabungan & Cetak Manual).
- **Sync foto lintas tab** — Upload/hapus foto di satu tab langsung update count & gallery di tab lain (via `nota-changed` event).
- **Ikon kategori** — Kartu transaksi menampilkan ikon sesuai kategori: Truck (transport), User (honorarium/nama orang), Wifi (internet), Zap (listrik), Fingerprint (absen), ShoppingCart (belanja), Store (ada invoice), Package (lainnya).
- **Simpan Gabungan** — Cetak Manual: centang ≥2 transaksi → Simpan Gabungan → muncul di tab Nota Gabungan. Peringatan otomatis saat gabung campur rekening/SIPLah/PPN.
- **Batal Gabung** — Nota Gabungan: tombol batal gabungan untuk user-saved gabungan.
- **Uraian override terpusat** — Edit uraian (double-click) di mana pun (BKU, Nota Gabungan, Cetak Manual) → sync ke semua tempat via `uraian-overrides.json` + cross-component event.
- **Kode Program & Kode Kegiatan** — Kwitansi, A2, dan Bukti Pengeluaran kini menampilkan Kode Program + nama (mis. "06. / Standar Pengelolaan") dan Kode Kegiatan + nama, diambil dari hierarki ref_kode ARKAS.
- **CI/CD GitHub Actions** — Auto-build installer Windows (NSIS) saat tag push. Upload ke GitHub Releases otomatis.

### Perbaikan

- **Urutan BKU konsisten** — Semua tabel (BKU Umum/Tunai/Bank/Pajak, Nota Gabungan, Cetak Manual) sort by tanggal_transaksi → no_bukti (numeric).
- **Grouping Nota Gabungan** — Single bukti pakai `no_bukti` sebagai key (cocok Cetak Manual); multi bukti pakai `no_nota` (invoice).
- **Badge jumlah item always-on** — Nota Gabungan selalu tampilkan jumlah item per grup.
- **Tombol action seragam** — Kedua tab: Atur Tanggal → Cetak A2 → Cetak Bukti → Foto Nota (kiri), Reset Cetak (kanan).

### Peningkatan

- **PDF Bukti Pengeluaran: A4 → F4** — Ukuran [610, 936] portrait.
- **Lampiran foto grid 2×2** — Maks 4 foto/halaman dengan background putih (anti PNG transparan hitam). Header "LAMPIRAN BUKTI (1-N dari N)" + label per foto.
- **Dynamic button** — Tombol nota: "Unggah Nota" (belum ada foto) → "N Foto Nota" (biru, klik lihat) → "Mengunggah…" (disabled).
- **Uraian override di export** — Kwitansi, Bukti Pengeluaran, dan BKU Excel kini pakai uraian override.

---

## [2.1.1] — 24 Juli 2026

### Perbaikan

- **PDF RKAS-P: tabel rapi** — Kode Rekening dan Uraian/Nama Barang dipisah jadi 2 kolom terpisah (sebelumnya menumpuk dalam 1 cell).
- **Tab Perubahan auto-refresh** — Setelah tambah/edit item di RKAS Perubahan, tabel diff otomatis update tanpa perlu pindah tab.

### Peningkatan

- **Modal bisa di-resize** — Popup "Tambah Item" dan "Pergeseran Anggaran" kini bisa diseret di pojok kanan-bawah untuk memperbesar/memperkecil.
- **Tooltip nama lengkap** — Hover item dropdown (kegiatan, rekening, barang, pergeseran) menampilkan nama lengkap sebagai tooltip.

---

## [2.0.7] — 12 Juli 2026

### Fitur Baru

- **Preview PDF sebelum simpan** — Modal preview (iframe) muncul dulu sebelum dialog simpan, untuk Cetak A2 & Cetak Bukti di tab Cetak Manual maupun Nota Gabungan. Tombol Simpan/Batal.
- **Edit uraian inline (double-click)** — Klik dua kali baris uraian di tabel expand (Cetak Manual & Nota Gabungan) untuk mengubah uraian. Tersimpan sebagai override lokal (`localStorage`), DB ARKAS tetap read-only. Badge `•edit`, diteruskan ke PDF A2 & Bukti.
- **Hint MATERAI** — Teks abu-abu `MATERAI` otomatis muncul di kolom tanda tangan "Yang menerima uang" jika nominal belanja > Rp5.000.000.

### Perbaikan

- **A2 PDF: teks tidak bentrok** — Uraian Kode Rekening, Terbilang, dan Untuk Kepentingan kini wrap di dalam lebar kolom kiri (tidak tumpang tindih dengan kolom Penerimaan/Pajak).
- **A2 PDF: layout tanda tangan penerima** — Nama/Alamat toko lebih rapat ke label "Yang menerima uang", garis tanda tangan diperpanjang agar cap & materai tidak menutupi nama.

---

## [2.1.0] — 24 Juli 2026

### UI/UX Polish
- **Nota Gabungan + Cetak Manual**: stats cards gradient + icon (FileStack, Package, Wallet)
- **Realisasi Belanja**: default Januari (bukan Kumulatif), hapus catatan selisih Dashboard
- **Register Kas**: layout format Dinas (Times New Roman, no borders, no colors)
- **Berita Acara**: layout format Dinas dengan section Keterangan Perbedaan
- **Section Uang Panjar** di Register Kas (input manual)

### Export Fix
- **Export PDF/Excel**: ikut tax override (entry "belum disetor" hilang dari export)
- BKU Umum, Tunai, Bank — semua konsisten dengan UI

### Dashboard
- **Catatan Revisi** dari Dinas otomatis tampil
- Warning pajak belum disetor
- Info SILPA di BA Rekonsiliasi

### Merge BKU
- Exclude: Saldo Bank Bulan, Saldo Tunai Bulan, Bunga Bank, Pajak Bunga

### Lainnya
- DevTools toggle via `.env`
- Lint: 0 errors frontend

---

## [2.0.9] — 24 Juli 2026

### Register Penutupan Kas — Layout Dinas
- **Refactor layout** mengikuti format resmi Dinas Pendidikan (government document style)
- Times New Roman, background putih, no borders, no colors
- Header: label ":" sejajar, nominal rata kanan
- 5 kelompok: Uang Kertas → Logam → Ordonasi → Panjar → Pajak
- Section 4 Uang Panjar/Uang Muka Kerja (BARU — input manual)
- Berita Acara Pemeriksaan Kas: refactor layout format Dinas

### Dashboard
- **Catatan Revisi** dari Dinas sekarang tampil (baca dari `anggaran.alasan_penolakan`)
- Warning "setor pajak belum disetor" di SchoolInfoCard
- Info card SILPA breakdown di BA Rekonsiliasi

### Lint Cleanup
- Remove unused imports
- Fix unescaped JSX entities
- Fix TransactionTable memo import

### DevTools
- Toggle via `DEVTOOLS=true/false` di `.env` + F12 shortcut

---

## [2.0.8] — 24 Juli 2026

### Fitur Baru — Setor Pajak Belum Disetor (Tax Override)

- **Hapus setor pajak di semua BKU** (Umum/Tunai/Bank/Pajak/Merge) → entry hilang, saldo naik
- **Lupa bayar dropdown** di Input Pajak Manual → auto-fill + restore di BKU saat dibayar
- **Opsi "Setor Pajak (Bayar Hutang)"** di Input Pajak Manual → posisi otomatis - Setoran
- **Opsi "Pungutan Pajak Terlewat"** (rename dari "Lupa Bayar")
- Integrasi BA Rekonsiliasi: **REKAP PAJAK** + **REKAP SALDO BULANAN** (PJK, UTANG PJK, annual closing)
- Backend: `taxOverrideHandler.js` + IPC + `useTaxOverrides` hook

### Bug Fix

- **Fix smartMatchTransactions** — per-bulan vs kumulatif (RKAS vs Realisasi)
- **Fix cumulative_pagu** di mode Kumulatif (status "TERBAYAR RAPEL" salah)
- **Fix manualTaxHandler year type mismatch** — entries tidak muncul (string vs number)
- **Fix merge group "SETOR PAJAK"** yang sembunyikan entry pajak
- **Fix TransactionTable** — penerimaan dana di-exclude dari merge list
- **Fix double checkbox** di Merge BKU modal

### UI/UX Improvements

- Label Realisasi Belanja: "terealisasi", "geser dari Feb", "sisa", "belum digunakan"
- Info panel: bulan mana yang belum terealisasi (otomatis)
- Posisi "Setor Pajak" auto-set ke - Setoran (merah)
- Dropdown lupa bayar: auto-fill form, hide form fields saat dipilih

---

## [2.0.6] — 10 Juli 2026

### License Service

- **Migrasi signing Ed25519 → ECDSA (P-256)** — server cPanel tidak support sodium extension, jadi signing license sekarang pakai OpenSSL ECDSA yang tersedia di semua server.
- **Auto-detect key type** di Electron app — verification otomatis pakai algoritma yang sesuai (Ed25519=null atau ECDSA=sha256).
- Fix DNS apex `smartspj.my.id` (Cloudflare A record ke `202.10.43.28`).
- Fix `.htaccess` — hapus `php_value` (tidak support LiteSpeed), pindah ke `.user.ini`.

---

## [1.11.5] — 30 Juni 2026

### Performance & Caching

- **Cache IPC backend** — Dashboard, Realisasi Belanja, Kertas Kerja, Rekonsiliasi Bank, Register Kas, dan Dashboard Badges kini di-cache 60 detik. Pindah-pindah halaman jadi instan (cache hit <5ms) tanpa query ulang.
- **Invalidation cerdas** — Cache otomatis dibersihkan saat ada operasi tulis (input/edit/hapus pajak manual, merge transaksi, reload ARKAS, restore backup, simpan rekonsiliasi) + TTL backup 60 detik.

### Fitur Baru

- **Target Pencairan Tahap 2 BOS** — Banner peringatan otomatis di Dashboard untuk BOS Reguler. Deteksi nominal Tahap 1, hitung target 50%, progress realisasi s/d Juni, dan countdown deadline. Otomatis hilang saat Tahap 2 sudah cair.
- **Tanggal Nota & Tanggal Bayar terpisah** — Sekarang bisa mencatat skenario belanja tgl 1 & bayar tgl 7. Tombol "Atur Tanggal" di Bukti Transaksi & Nota Gabungan. PDF menampilkan "Tgl Nota" & "Tgl Bayar" secara terpisah saat berbeda.
- **Pencarian di Realisasi Belanja** — Cari kode, kegiatan, rekening, atau nama barang langsung di header tabel Ringkasan/Rincian/RKAS vs Realisasi.
- **Pencarian di Cetak Manual** — Search box + manfaatkan checkbox multi-select untuk cetak gabungan (tetap per-bulan, tidak lintas bulan).

### Perbaikan UI/UX

- **Hapus accent picker** — Kembali ke tema biru native yang konsisten (sebelumnya 5 warna tapi setengah jadi).
- **Aksesibilitas** — `focus-visible` keyboard navigation, `prefers-reduced-motion`, `cursor-pointer` global, 17 atribut `aria-label` (sebelumnya 1).
- **Input seragam & netral** — Input pajak manual & pencarian kini konsisten dengan BKU (border netral, tanpa warna saat fokus).
- **3 card statistik Realisasi setara** — Semua card kini punya progress bar + persentase.
- **Badge tanggal netral** — "Tahun 2026" & "BOS Reguler" jadi teks bold bersih.

### Bug Fix

- **Disconnect tanggal custom** — Sebelumnya tanggal nota yang diatur via modal Detail tidak terbaca saat cetak Bukti (localStorage terputus dari backend). Kini tersambung via IPC `customDates`.
- **Validasi tanggal** — Hapus larangan "tanggal tidak boleh melebihi transaksi" (sekarang bayar bisa setelah belanja). Pertahankan batas 3 bulan.
- **Reset Cetak menyertakan tanggal** — Reset Cetak kini juga menghapus tanggal custom (kembali ke kondisi awal).
- **Dropdown Nota Gabungan** — Hapus opsi "Semua Bulan", langsung mulai dari Januari.
- **`scale-120` silent bug** — Class Tailwind tidak valid, otomatis ikut terhapus bersama accent picker.
- **`console.log` bocor** — Digate dengan `import.meta.env.DEV` di Header.
- **Prebuild check-changelog** — Script `check-changelog.js` yang hilang kini dibuat ulang agar build tidak gagal.

---

## [1.11.4] — 2026-06-27

### Fitur
- Kolom Realisasi & Selisih di Buat RKAS, Kertas Kerja, Realisasi Belanja
- Peringatan sinkronisasi RKAS lokal vs ARKAS + tombol Sinkronisasi
- Detail Aliran Dana per item (Target, Realisasi BKU, Selisih per bulan)

### Bug Fix
- Perhitungan realisasi ganda pada item kode/uraian sama kini akurat per baris
- Mode Kumulatif RKAS vs Realisasi tampilkan anggaran tahunan

---

## [1.11.3] — 2026-06-25

- Hapus Tier Basic — sekarang Free, Pro, Lifetime
- Single instance lock
- Popup update via portal (backdrop blur menutupi seluruh layar)

---

## [1.11.2] — 2026-06-24

- Notifikasi "Pajak Dipungut Belum Disetor" & "Item Melampaui Pagu"
- Backup Otomatis Terjadwal + Backup Database ARKAS Asli

---

## [1.8.0] – [1.11.1] — Mei–Juni 2026

Rangkaian peningkatan besar: ARKAS Parity (tax, BKU, dashboard), Pratinjau Dokumen, Register Kas Live, NIP Universal, dan audit mendalam saldo tunai & klasifikasi. Lihat detail di halaman About aplikasi.

---

## [1.7.2] — 2026-04-23

### Bug Fix — Kritis

#### ✅ Fix Data Sekolah Tidak Muncul (Nama, NPSN, Alamat, Wilayah, Pejabat)

**File:** `electron/main.js` (`getSchoolInfoWithOfficials`), `src/pages/Pengaturan.jsx`

**Masalah:** Pada beberapa sekolah (terutama SLB, TK, RA, dan sekolah dengan struktur ID berbeda), data sekolah tidak muncul sama sekali di dashboard dan halaman Pengaturan. Tampilan menampilkan "-" untuk NPSN, alamat, provinsi/kabupaten/kecamatan, dan nama pejabat.

**Penyebab:** Fungsi `getSchoolInfoWithOfficials` memiliki 5 bug:

1. **JOIN kaku** — Query utama `i.instansi_id = mst.sekolah_id` hanya cocok untuk sekolah yang ID-nya sama persis. Di banyak database Arkas, `mst_sekolah.sekolah_id` berisi UUID/NPSN yang berbeda dari `instansi.instansi_id`, sehingga JOIN gagal total.

2. **WHERE clause mematikan LEFT JOIN** — `WHERE mst.sekolah_id IS NOT NULL` membuat LEFT JOIN berfungsi sebagai INNER JOIN, sehingga jika `mst_sekolah` tidak cocok, seluruh query return NULL.

3. **Fallback terlalu sempit** — Fallback 1 hanya mencari `jenis_instansi_id = 5` (sekolah umum), melewatkan SLB, TK, RA, dan jenis lain. Di beberapa database, `instansi` berisi Dinas (jenis 3), bukan sekolah.

4. **Wilayah lookup hanya dari instansi** — Jika `instansi.kode_wilayah` = '0' atau NULL, lookup wilayah di-skip sepenuhnya, padahal `mst_sekolah.kode_wilayah` mungkin berisi data valid.

5. **Pejabat lookup hanya 1 ID** — Hanya mencoba `sekolah.sekolah_id`, padahal `sekolah_penjab` bisa menggunakan NPSN atau ID lain sebagai foreign key.

**Perbaikan:**

- **STEP 1**: Selalu ambil `instansi` dulu (tanpa filter jenis), lalu cari `mst_sekolah` dengan 3 strategi berurutan: via `sekolah_id`, via `npsn`, atau `LIMIT 1`
- **STEP 2**: Merge data `mst_sekolah` tanpa menimpa kolom `instansi` yang sudah ada (safe merge per-kolom)
- **STEP 3**: Wilayah lookup menggunakan dual source: `instansi.kode_wilayah` **atau** `mst_sekolah.kode_wilayah`
- **STEP 4**: Pejabat lookup mencoba semua ID yang tersedia: `sekolah_id`, `instansi_id`, `npsn`
- **STEP 5**: Alamat fallback ke `mst_sekolah.alamat_jalan` jika `instansi.alamat` kosong

**Verifikasi:** Dites langsung ke database Arkas (SMP Nur Lintang Kedu, NPSN 70007889) di mana `instansi` hanya berisi Dinas dan `mst_sekolah` berisi data sekolah. Semua field berhasil ditampilkan dengan benar.

---

### Bug Fix — Auto Update

#### ✅ Fix Race Condition Auto-Check vs Manual Check

**File:** `electron/main.js` (`setupAutoUpdater`)

**Masalah:** Auto-check (5 detik setelah load) dan manual check bisa berjalan bersamaan, menyebabkan state flicker di UI dan duplikasi events ke renderer.

**Perbaikan:** Tambahkan flag `isCheckingUpdate` untuk mencegah concurrent `checkForUpdates()`, dan `isAutoCheck` untuk suppress events non-kritis (`update-not-available`, `update-error`) dari auto-check agar tidak mengganggu UI.

---

#### ✅ Fix Version Comparison NaN untuk Pre-release Tag

**File:** `electron/main.js` (`isNewerVersion`)

**Masalah:** Versi string seperti `1.0.0-beta` menghasilkan `NaN` saat `.map(Number)` karena `"0-beta"` gagal dikonversi. Perbandingan `NaN > x` selalu `false`, sehingga update tidak terdeteksi.

**Perbaikan:** Ubah `.map(Number)` menjadi `.map(s => parseInt(s, 10) || 0)` untuk menangani suffix non-numerik.

---

#### ✅ Fix Crash di Dev Mode: "No handler registered"

**File:** `electron/main.js`

**Masalah:** `setupAutoUpdater()` hanya dipanggil saat `!isDev`, tapi preload.js tetap expose API ke renderer. Klik tombol update di dev mode menyebabkan crash `Error: No handler registered for 'arkas:check-update'`.

**Perbaikan:** Register stub IPC handlers di dev mode yang mengembalikan pesan "tidak tersedia dalam mode pengembangan".

---

### Peningkatan

#### ✅ Auto Update: Encrypted Token Storage & Timeout Protection

**File:** `electron/main.js`, `src/components/layout/Header.jsx`

- GitHub token untuk auto-update disimpan terenkripsi menggunakan Electron `safeStorage` (OS-level encryption)
- Auto-migrasi dari plain-text `updater.json` ke encrypted `.updater-key`
- Cek update timeout 30 detik, download timeout 5 menit (sebelumnya tidak ada timeout)
- Download speed ditampilkan saat update diunduh (MB/s atau KB/s)
- IPC handler guard untuk mencegah double-register

---

#### ✅ Pengaturan: Tampilkan Provinsi di Lokasi Sekolah

**File:** `src/pages/Pengaturan.jsx`

**Masalah:** Halaman Pengaturan hanya menampilkan "Kecamatan, Kabupaten" di field Lokasi, tanpa Provinsi. Dashboard sudah menampilkan ketiganya.

**Perbaikan:** Tambahkan `school?.provinsi` ke array Lokasi di Pengaturan.

---

## [1.7.1] — 2026-04-21

### Bug Fix — Kritis

#### ✅ Fix SiLPA Di-exclude dari Perhitungan Penerimaan & Saldo

**File:** `electron/handlers/dashboard/chartQueries.js`, `electron/handlers/dashboard/statsQueries.js`, `electron/handlers/dashboardHandler.js`

**Masalah:** Transaksi SiLPA (Sisa Lebih Perhitungan Anggaran) selisih Rp 960.000 − Rp 711.093 = **Rp 248.907** tidak dihitung sebagai penerimaan karena filter `NOT LIKE '%silpa%'` di 3 lokasi. Akibatnya:

- Chart "Informasi Keuangan" bulan Desember menampilkan Penerimaan = Rp 0 dan Saldo Akhir = Rp 711.093 (kurang Rp 248.907)
- `getPenerimaanMurni` menghasilkan angka terlalu rendah → `saldoGlobal` (`targetSaldo`) salah → kalibrasi chart tidak akurat

**Perbaikan:** Hapus `AND LOWER(uraian) NOT LIKE '%silpa%'` dari:

1. `chartQueries.js:65,68` — perhitungan `penerimaan` dan `mutasi_netto` di chart data
2. `statsQueries.js:142,158` — query `getPenerimaanMurni` untuk SEMUA dan BOS Reguler
3. `dashboardHandler.js:311,317` — query penerimaan dengan batas tanggal

#### ✅ Fix Widget Sumber Dana Tidak Terfilter

**File:** `electron/handlers/dashboard/advancedQueries.js`, `electron/handlers/dashboardHandler.js`

**Masalah:** Widget "Sumber Dana" di dashboard selalu menampilkan semua sumber dana (BOS Reguler, BOS Kinerja, Lainnya) meskipun sudah memilih salah satu sumber dana di filter. Seharusnya hanya menampilkan sumber dana yang dipilih.

**Perbaikan:** Tambahkan parameter `fundSource` ke `getRingkasanSumberDana` dan filter query dengan `sd.nama_sumber_dana LIKE '%${fundSource}%'`.

---

## [1.6.0] — 2026-04-17

### Bug Fix — Kritis

#### ✅ Fix Pergerakan Kas Bulanan: Saldo Selalu Rp 0

**File:** `electron/handlers/dashboard/advancedQueries.js` (`getKasBulanan`)

**Masalah:** Kolom SALDO KAS selalu menampilkan Rp 0 di setiap bulan. Penyebab:

1. Saldo dihitung di frontend dengan `currentSaldo = currentSaldo + row.masuk - row.keluar`, tapi pengeluaran jauh melebihi pemasukan sehingga saldo selalu negatif
2. `Math.max(row.saldo, 0)` di frontend memaksa saldo minimum 0
3. Klasifikasi debit/kredit salah — transaksi penerimaan (BBU) salah diklasifikasikan sebagai pengeluaran karena pengecekan `no_bukti LIKE 'BPU%'` dilakukan sebelum `id_ref_bku`
4. Tidak ada saldo awal yang dihitung

**Perbaikan:**

- Saldo awal dihitung dari `id_ref_bku IN (2, 8, 9)` di bulan Januari (mengikuti `getOpeningBalance` di reconciliation handler)
- Klasifikasi debit/kredit menggunakan query terpisah yang mengikuti reconciliation handler:
  - **Masuk**: BBU + bunga bank (ref 6) + pajak pungut (ref 5,10,33) + dana lainnya
  - **Keluar**: BNU/BPU kode 5.% + biaya admin (ref 7) + setor pajak (ref 11)
- Running saldo dihitung di backend
- Frontend menampilkan saldo negatif dengan warna merah

---

#### ✅ Fix Filter Sumber Dana di Dashboard V3 Analytics

**File:** `electron/handlers/dashboard/advancedQueries.js`, `electron/handlers/dashboard/statsQueries.js`

**Masalah:** Semua komponen dashboard (Belanja Kategori, Top 5, Belanja per Kegiatan, Pengeluaran Terbaru, Penerimaan Dana) tidak terfilter per sumber dana — BOS Kinerja menampilkan data BOS Reguler dan sebaliknya.

**Perbaikan:**

1. `getBelanjaKategori` — realisasi difilter via `ku.id_anggaran` langsung (bukan LEFT JOIN rapbs_periode yang bisa NULL)
2. `getTop5Belanja` — dihapus JOIN yang tidak perlu, filter via `ku.id_anggaran`
3. `getBelanjaKegiatan` — realisasi per kegiatan difilter via `ku.id_anggaran`
4. `getPengeluaranTerbaru` — filter via `ku.id_anggaran`
5. `getPenerimaanDana` — difilter per sumber dana (BBU Tahap untuk Reguler, BBU Kinerja, dana lainnya + bunga)
6. `getPenerimaanMurni` (statsQueries.js) — fix BOS Kinerja dari `id_ref_bku = 2 AND kode_rekening LIKE '4.%'` menjadi `(id_ref_bku = 2 OR kode_rekening LIKE '4.%') AND anggaranScope`

---

#### ✅ Fix PENERIMAAN Rp 0 untuk BOS Kinerja

**File:** `electron/handlers/dashboard/statsQueries.js` (`getPenerimaanMurni`)

**Masalah:** Header PENERIMAAN menampilkan Rp 0 untuk BOS Kinerja karena filter `id_ref_bku = 2 AND kode_rekening LIKE '4.%'` tidak cocok — transaksi Kinerja dicatat dengan `id_ref_bku = 2` dan `no_bukti = 'BBU%'` tanpa `kode_rekening LIKE '4.%'`.

**Perbaikan:** Gunakan `anggaranScope` (subquery `id_anggaran IN (SELECT ... WHERE nama_sumber_dana LIKE '%Kinerja%')`) untuk memfilter penerimaan Kinerja secara akurat.

---

#### ✅ Fix Pagu Belanja Kategori Terhitung Berulang (4x Lipat)

**File:** `electron/handlers/dashboard/advancedQueries.js` (`getBelanjaKategori`, `getRapbsAndKegiatanCount`, `getBelanjaKegiatan`)

**Masalah:** Pagu belanja kategori untuk BOS Kinerja menampilkan Rp 115.852.000 (total semua sumber dana) padahal seharusnya Rp 35.000.000. Penyebabnya adalah query `rapbs` menjumlahkan semua revisi anggaran (4 revisi × Rp 35.000.000 = Rp 140.000.000 untuk Kinerja, plus sumber dana lain).

**Perbaikan:**

- Tambahkan filter `is_revisi = MAX(is_revisi)` agar hanya revisi terakhir per sumber dana yang dihitung
- Untuk query `rapbs`, gunakan direct JOIN ke `ref_sumber_dana` karena `anggaranScope` (subquery `id_anggaran IN ...`) tidak membedakan sumber dana di tabel `rapbs`
- Diterapkan ke 3 fungsi: `getBelanjaKategori`, `getRapbsAndKegiatanCount`, `getBelanjaKegiatan`

---

#### ✅ Fix ITEM RAPBS dan Kegiatan Count Tidak Terfilter per Sumber Dana

**File:** `electron/handlers/dashboard/advancedQueries.js` (`getRapbsAndKegiatanCount`)

**Masalah:** ITEM RAPBS selalu menampilkan 76 (total) untuk semua sumber dana, termasuk BOS Kinerja yang seharusnya hanya 19.

**Perbaikan:** Gunakan direct JOIN `ref_sumber_dana` + filter `is_revisi = MAX` untuk menghitung RAPBS dan kegiatan per sumber dana.

---

### UI / UX

#### ✅ Perbaikan Tampilan Pergerakan Kas Bulanan

**File:** `src/components/dashboard/v3/PergerakanKasBulanan.jsx`, `src/App.jsx`

- Saldo negatif ditampilkan dengan warna merah + tanda minus
- Hapus prop `totalPenerimaan` yang tidak diperlukan
- Saldo dihitung di backend, frontend hanya menampilkan
- Formatting kode yang lebih rapi

---

#### ✅ Fix Saldo Akhir BA Rekonsiliasi Semester 2 (Rp 711.093 → Rp 960.000)

**File:** `electron/handlers/reconciliationHandler.js` (baris 609-621)

**Masalah:** Saldo akhir S2 menampilkan Rp 711.093 padahal seharusnya Rp 960.000. Penyebabnya adalah running balance Dana Lainnya (Rp 248.907) di-overwrite menjadi 0 oleh saldo awal DB yang kosong untuk bulan 2+.

**Perbaikan:** Tambahkan guard `(bank > 0 || tunai > 0)` agar DB saldo awal hanya menimpa running value jika nilainya positif. Diterapkan ke ketiga sumber dana (Reguler, Kinerja, Lainnya).

```js
// Sebelum (BUG):
if (dbOpening.lainnya.found) {
  runningLainnya.bank = dbOpening.lainnya.bank; // 0 menimpa 248.907!
}

// Sesudah (FIX):
if (dbOpening.lainnya.found && (dbOpening.lainnya.bank > 0 || dbOpening.lainnya.tunai > 0)) {
  runningLainnya.bank = dbOpening.lainnya.bank;
}
```

**Dampak:** Semua periode (Triwulan, Semester, Tahunan) kini menampilkan saldo akhir yang benar.

---

#### ✅ Fix Hardcode "SMP" di PDF Export BA Rekonsiliasi

**File:** `src/utils/exportBaRekonsToPdf.js` (baris 520)

**Masalah:** Kolom tanda tangan Bendahara BOS di PDF export menampilkan string hardcode `'SMP'` alih-alih nama sekolah yang sebenarnya.

**Perbaikan:** Ganti `'SMP'` menjadi `schoolInfo?.nama || schoolInfo?.nama_sekolah || ''` agar dinamis sesuai data sekolah dari database.

---

### Perbaikan Fitur

#### ✅ Penambahan Baris "Saldo awal BOSP Kinerja 2025" di Lembar BA

**File:** `ReconciliationDocument.jsx`, `exportBaRekons.js`, `exportBaRekonsToPdf.js`

Menambahkan baris Saldo Awal BOSP Kinerja tahun berjalan di semua 3 format rendering (HTML, Excel, PDF). Data diambil dari `opening.details.kinerja` yang merupakan saldo awal kinerja tahun berjalan.

---

#### ✅ Fix Deteksi Penerimaan & Pengeluaran Kinerja

**File:** `electron/handlers/reconciliationHandler.js`

Menggunakan approach `LEFT JOIN anggaran` + `a.id_ref_sumber_dana IN (12, 35)` untuk mengklasifikasikan transaksi Kinerja secara akurat, baik di sisi penerimaan (`getIncome`) maupun pengeluaran (`getExpenses`).

---

#### ✅ Fix Label "Penerimaan Kinerja" di Dashboard

**File:** `electron/handlers/dashboard/advancedQueries.js`

Override label Penerimaan Dana di dashboard agar menampilkan "BOSP Kinerja 2025" untuk sumber dana Kinerja, bukan label generik.

---

#### ✅ Perbaikan Perhitungan Closing Dana Lainnya

**File:** `electron/handlers/reconciliationHandler.js` (baris 645)

Menambahkan `(income.danaLainnya || 0)` ke perhitungan `closingLainnyaTotal` agar penerimaan dana lainnya diperhitungkan dalam saldo akhir.

---

#### ✅ Penghapusan Baris "Penerimaan BOSP Dana Lainnya" yang Menyesatkan

**File:** `ReconciliationDocument.jsx`, `exportBaRekons.js`, `exportBaRekonsToPdf.js`

Baris "Penerimaan BOSP Dana Lainnya" dihapus dari tabel BA Rekonsiliasi karena nilainya selalu 0 (query tidak bisa menangkap SiLpa entry). Saldo Dana Lainnya sudah tercakup di baris "Saldo awal Dana Lainnya BOSP".

---

### UI / UX

#### ✅ Penghapusan Tombol "Audit BKU"

**File:** `src/pages/BAReconciliation.jsx`

Tombol "Audit BKU" dan seluruh kode terkait (state `showAudit`, `auditData`, import `BaAuditPanel`, `FileSearch`) dihapus dari halaman BA Rekonsiliasi sesuai permintaan user.

---

#### ✅ Peningkatan FundSourceTable

**File:** `src/components/reconciliation/FundSourceTable.jsx`

Rewrite komponen tabel sumber dana dengan tampilan yang lebih rapi dan informatif.

---

#### ✅ Peningkatan Halaman Pengaturan

**File:** `src/pages/Pengaturan.jsx` (atau setara)

Rewrite UI halaman pengaturan dengan layout yang lebih bersih.

---

#### ✅ Fix Print & Status Sinkronisasi

Perbaikan pada fungsi cetak dan sinkronisasi status cetak antara komponen.

---

#### ✅ Fix MODAL_MESIN Klasifikasi

**File:** `electron/handlers/reconciliationHandler.js`

Perbaikan klasifikasi kode rekening Modal Mesin (`5.2.02.x`) agar tepat terdeteksi sebagai belanja modal mesin, bukan masuk ke kategori lain.

---

### Arsitektur & Kode

#### ✅ Sistem Tema Terpusat

**File:** `src/theme/index.js`

Implementasi centralized theme object (`theme.card`, `theme.text.h2`, `theme.text.label`, `theme.text.body`) untuk konsistensi visual slate-\* di seluruh aplikasi.

---

### Bug Fix Tambahan

#### ✅ Fix Perhitungan Closing Total

**File:** `electron/handlers/reconciliationHandler.js` (baris 697)

**Masalah:** Perhitungan `closingTotal` hanya menjumlahkan komponen **bank** dari sumber dana Lainnya, SilpaKinerja, dan Kinerja — tanpa memasukkan komponen **tunai**.

**Perbaikan:** Menjumlahkan semua komponen bank + tunai dari keempat sumber dana.

---

#### ✅ Fix Kolom Selisih & Kolom Placeholder di Rekap Saldo Bulanan

**File:** `src/config/reconciliationTableConfig.js`

**Masalah:** Kolom "Selisih" di Saldo Akhir menggunakan `() => 0` (hardcoded), dan kolom "Adm" di Saldo Awal tidak memiliki data.

**Perbaikan:**

- Kolom Selisih kini menampilkan `(income.bunga - expenses.admBank)`
- Kolom "Adm" dihapus, diganti kolom **KINERJA** (Bank/Tunai) dari `opening.details.kinerja`

---

#### ✅ Tambah Kolom Kinerja di Saldo Awal

**File:** `src/config/reconciliationTableConfig.js`

Menambahkan breakdown saldo awal Kinerja (Bank/Tunai) di section SALDO AWAL tabel Rekap Saldo Bulanan, agar konsisten dengan section SALDO AKHIR.

---

#### ✅ Perbaikan Kolom Nomor Urut

**File:** `src/config/reconciliationTableConfig.js`

Kolom NO kini menampilkan nomor yang benar untuk semua tipe baris (bulanan, triwulan, semester).

---

#### ✅ Rapikan Label Tabel Lembar BA

**File:** `ReconciliationDocument.jsx`, `exportBaRekons.js`, `exportBaRekonsToPdf.js`

Seluruh label tabel di Lembar BA diseragamkan di ketiga format (HTML, Excel, PDF). Label seperti "Saldo awal Dana Lainnya BOSP" disederhanakan menjadi "Dana Lainnya BOSP" karena sudah berada di bawah section header "Saldo Awal".

---

### Verifikasi

Seluruh angka di BA Rekonsiliasi Semester 2 telah diverifikasi berasal dari query database real:

| Baris                         | Nilai          | Sumber                                        |
| ----------------------------- | -------------- | --------------------------------------------- |
| Saldo Awal Dana Lainnya       | Rp 248.907     | `kas_umum` id_ref_bku IN (8,9), carry-forward |
| Saldo Awal BOSP Reguler 2024  | Rp 202.160     | `kas_umum` id_ref_bku IN (8,9)                |
| Saldo Awal SiLPA Kinerja 2024 | Rp 0           | Tidak ada aktivitas                           |
| Saldo Awal BOSP Kinerja 2025  | Rp 35.000.000  | `kas_umum` id_ref_bku IN (8,9)                |
| Penerimaan BOSP Reguler T2    | Rp 414.144.000 | `kas_umum` BBU% + Tahap 2                     |
| Realisasi Dana Lainnya        | Rp 248.907     | `kas_umum` kode 5.% + sumber 5                |
| Realisasi BOSP Reguler        | Rp 413.386.160 | `kas_umum` kode 5.% + sumber (1,33)           |
| Realisasi BOSP Kinerja        | Rp 35.000.000  | `kas_umum` kode 5.% + sumber 12               |
| **Saldo Akhir**               | **Rp 960.000** | **449.595.067 - 448.635.067**                 |

---

## [1.3.0] — 2026-04-09

- Versi awal sebelum perbaikan v1.4.0
- Backup: `SmartSPJ_backup_FULL_2026-04-09_v1.3.0.zip`
