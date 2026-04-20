# Changelog — SmartSPJ

Semua perubahan penting pada proyek ini akan didokumentasikan dalam file ini.

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
