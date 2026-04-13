# Changelog — SmartSPJ

Semua perubahan penting pada proyek ini akan didokumentasikan dalam file ini.

---

## [1.4.0] — 2026-04-12

### Bug Fix — Kritis

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
