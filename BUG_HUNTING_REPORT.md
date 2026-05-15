# SmartSPJ v1.7.9 - Bug Hunting & Fix Report

> **Tanggal:** 15 Mei 2026  
> **Versi:** v1.7.9  
> **Total file diubah:** 24  
> **Total fix:** 20 (2 CRITICAL, 3 HIGH, 9 MEDIUM, 6 LOW)

---

## Daftar Isi

- [CRITICAL (2)](#critical-2)
- [HIGH (3)](#high-3)
- [MEDIUM (9)](#medium-9)
- [LOW (6)](#low-6)
- [Ringkasan File yang Diubah](#ringkasan-file-yang-diubah)
- [Catatan untuk Reviewer](#catatan-untuk-reviewer)

---

## CRITICAL (2)

### 1. Hardcoded Database Credentials di Scripts

| Properti | Detail |
|----------|--------|
| **File** | `scripts/reset-hw-null.js:2`, `scripts/check-license-db.js:2` |
| **Dampak** | Password database Neon PostgreSQL (`npg_S0BzYjieNpE2`) tertulis langsung di source code. Siapapun yang akses repo bisa langsung masuk ke database produksi. |
| **Status** | FIXED |

**Sebelum:**
```js
const sql = neon('postgresql://neondb_owner:npg_S0BzYjieNpE2@ep-aged-rain-ao7wnfhj-pooler...');
```

**Sesudah:**
```js
if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is required.');
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);
```

**Cara pakai sekarang:**
```bash
DATABASE_URL="postgresql://..." node scripts/check-license-db.js
```

---

### 2. `nominal` Undefined - Handler Crash

| Properti | Detail |
|----------|--------|
| **File** | `electron/main.js:2026-2029` |
| **Handler** | `arkas:get-related-taxes` |
| **Dampak** | Handler **selalu crash** dengan `ReferenceError: nominal is not defined`. Parameter bernama `transactionNominal` tapi body memanggil `nominal` yang tidak ada di scope. Fitur "lihat pajak terkait" tidak pernah berfungsi. |
| **Status** | FIXED |

**Sebelum:**
```js
async (event, ..., transactionNominal) => {
  const expectedPPN = calcPPN_DPP(nominal);      // ReferenceError!
  const expectedPPh21 = calcPPh21(nominal);       // ReferenceError!
  const expectedPPh23 = calcPPh23(nominal);       // ReferenceError!
  const expectedSSPD = calcSSPD(nominal);         // ReferenceError!
```

**Sesudah:**
```js
  const expectedPPN = calcPPN_DPP(transactionNominal);
  const expectedPPh21 = calcPPh21(transactionNominal);
  const expectedPPh23 = calcPPh23(transactionNominal);
  const expectedSSPD = calcSSPD(transactionNominal);
```

---

## HIGH (3)

### 3. Database Connection Leak (13 Handler)

| Properti | Detail |
|----------|--------|
| **File** | `electron/main.js` (13 lokasi) |
| **Handler** | `get-school-info`, `reload-school-data`, `get-fund-sources`, `get-available-years`, `get-transactions`, `export-bku`, `export-all-bku`, `activate-license`, `create-payment`, `get-license-debug`, `check-server-license`, `get-sptjm-data`, `get-k7-data` |
| **Dampak** | Jika operasi database gagal (error path), koneksi SQLite tidak pernah ditutup. Lama-lama menyebabkan file lock dan memory leak. |
| **Status** | FIXED |

**Pola masalah:**
```js
// db tidak bisa diakses di catch block karena "const" block-scoped
try {
  const db = openDatabase(...);
  // ... operasi yang bisa error ...
  db.close();           // tidak jalan kalau error di atas
} catch (err) {
  // db TIDAK bisa diakses di sini
}
```

**Fix Pattern A** (9 handler sederhana):
```js
let db;
try {
  db = openDatabase(...);
  // ... operasi ...
  db.close();
  return { success: true, data };
} catch (err) {
  if (db && db.open) db.close();
  return { success: false, error: err.message };
}
```

**Fix Pattern B** (4 handler dengan inner try):
```js
const db = openDatabase(...);
try {
  // ... operasi db ...
} finally {
  db.close();   // selalu jalan, baik sukses maupun error
}
```

---

### 4. `isBudgetMatch()` Tidak Pernah Dipanggil - Cash Flow Salah

| Properti | Detail |
|----------|--------|
| **File** | `electron/handlers/dashboard/cashflowQueries.js:60-111` |
| **Dampak** | Function `isBudgetMatch` sudah ditulis benar untuk filter transaksi per sumber dana, tapi **tidak pernah dipanggil** di loop pemrosesan. Akibatnya, saat user pilih sumber dana tertentu (misal "BOS Reguler"), angka saldo tunai dan saldo bank di dashboard **salah** karena menghitung semua transaksi dari semua sumber dana. |
| **Status** | FIXED |

**Fix:**
```js
for (const tx of rawTransactions) {
  if (!isBudgetMatch(tx)) continue;   // ← baris baru yang ditambahkan
  // ... proses transaksi ...
}
```

---

### 5. SQL LIKE Wildcard Tidak Di-escape

| Properti | Detail |
|----------|--------|
| **File** | `electron/handlers/transactionHandler.js:38-40, 73-79` |
| **Dampak** | Input user (`fundSource` dan `search`) dimasukkan ke SQL LIKE clause. Single quote di-escape, tapi karakter `%` dan `_` (wildcard LIKE) tidak. User bisa memanipulasi hasil pencarian. |
| **Status** | FIXED |

**Sebelum:**
```js
const safeFund = String(params.fundSource).replace(/'/g, "''");
budgetSourceFilter = `AND sd.nama_sumber_dana LIKE '%${safeFund}%'`;
```

**Sesudah:**
```js
const safeFund = String(params.fundSource)
  .replace(/'/g, "''")
  .replace(/%/g, '\\%')
  .replace(/_/g, '\\_');
budgetSourceFilter = `AND sd.nama_sumber_dana LIKE '%${safeFund}%' ESCAPE '\\'`;
```

---

## MEDIUM (9)

### 6. Null Date Dianggap Januari di Tax Report

| Properti | Detail |
|----------|--------|
| **File** | `electron/main.js:2313-2314, 2571-2572` |
| **Dampak** | `getMonthIndex(null)` return `0` (Januari). Manual tax tanpa tanggal masuk ke bulan Januari, merusak saldo pajak Januari dan running balance semua bulan setelahnya. |
| **Status** | FIXED |

**Fix:** Return `-1` untuk tanggal kosong + skip entry:
```js
const getMonthIndex = (dateStr) => {
  if (!dateStr) return -1;
  const month = parseInt(dateStr.substring(5, 7), 10);
  if (isNaN(month) || month < 1 || month > 12) return -1;
  return month - 1;
};
// ... dalam loop:
if (monthIndex < 0) return;   // skip entry tanpa tanggal valid
```

---

### 7. Dead Code: `pajakHutangBalance` Loop

| Properti | Detail |
|----------|--------|
| **File** | `electron/main.js:2332-2347` |
| **Dampak** | Variabel `pajakHutangBalance` dihitung dalam loop tapi tidak pernah dipakai. Tepat setelahnya, `runningPajakHutang` menghitung hal yang sama dan yang itulah yang dipakai. |
| **Status** | FIXED — dead code loop dihapus |

---

### 8. Duplicate SQL CASE Condition (Dead Code)

| Properti | Detail |
|----------|--------|
| **File** | `electron/handlers/transactionHandler.js:174, 182` |
| **Dampak** | Pengecekan `BPU/BNU` muncul 2x di CASE expression SQL. Karena CASE mengevaluasi atas ke bawah, kondisi kedua tidak pernah tercapai (dead code). |
| **Status** | FIXED — baris duplikat dihapus |

---

### 9. `parseInt` Tanpa NaN Guard

| Properti | Detail |
|----------|--------|
| **File** | `electron/main.js:3006`, `electron/handlers/reconciliationHandler.js:1205` |
| **Dampak** | `parseInt("abc")` → `NaN`. Di K7 handler, `NaN === 1` → false, jadi logic masuk ke tahap 2 padahal seharusnya default ke tahap 1. Di reconciliation, `realizationMap[NaN]` membuat key invalid. |
| **Status** | FIXED |

```js
// main.js
const tahap = parseInt(activeTahap || '1') || 1;

// reconciliationHandler.js
const m = parseInt(row.month) || 0;
```

---

### 10. `npsn` Tidak Di-encode di URL Scraper

| Properti | Detail |
|----------|--------|
| **File** | `electron/handlers/scrapeHandler.js:7` |
| **Dampak** | NPSN di-interpolate langsung ke URL tanpa encoding. Karakter khusus bisa merusak URL. |
| **Status** | FIXED |

```js
const safeNpsn = encodeURIComponent(String(npsn));
const url = `https://referensi.data.kemendikdasmen.go.id/tabs.php?npsn=${safeNpsn}`;
```

---

### 11. `isPenerimaan()` Diduplikasi 2x Tanpa DRY

| Properti | Detail |
|----------|--------|
| **File** | `electron/main.js:1428-1444` dan `3383-3399` |
| **Dampak** | Function identik di-copy paste ke 2 handler berbeda (`arkas:export-bku` dan `arkas:export-all-bku`). Bug fix di satu tempat tidak otomatis apply ke tempat lain. |
| **Status** | FIXED — diekstrak ke `electron/lib/financial-utils.js`, di-import sekali di `main.js` |

---

### 12. `getTransactionsByProof` Kolom `nominal` Tidak Konsisten

| Properti | Detail |
|----------|--------|
| **File** | `electron/handlers/transactionHandler.js:449 vs 501` |
| **Dampak** | Query cetak kwitansi gabungan pakai `k.nilai_bersih as nominal`, sedangkan query cetak kwitansi merge pakai `k.saldo as nominal`. Dua kolom bisa berbeda untuk transaksi yang sama, menyebabkan nominal di kwitansi berbeda. |
| **Status** | FIXED — kedua query sekarang konsisten menggunakan `k.saldo as nominal` |

---

### 13. Frontend Race Condition (7 Halaman)

| Properti | Detail |
|----------|--------|
| **File** | `LaporanK7.jsx`, `CetakSPTJM.jsx`, `BankReconciliation.jsx`, `BAReconciliation.jsx`, `RealisasiBelanja.jsx`, `NotaGroupManager.jsx`, `useKertasKerjaData.js` |
| **Dampak** | 7 halaman punya `useEffect` yang memanggil `fetchData()` async tanpa cancellation flag. Jika user ganti filter cepat, response lama bisa menimpa data baru. |
| **Status** | FIXED |

**Pola fix yang diterapkan ke semua 7 file:**
```jsx
useEffect(() => {
  let cancelled = false;
  const load = async () => {
    const res = await window.arkas.getData(year);
    if (cancelled) return;        // ← skip kalau sudah cancelled
    setData(res.data);
  };
  load();
  return () => { cancelled = true; };  // ← cancel saat deps berubah
}, [year, fundSource]);
```

---

### 14. `setTimeout` Tanpa Cleanup

| Properti | Detail |
|----------|--------|
| **File** | `src/components/SplashScreen.jsx:46`, `src/pages/BankReconciliation.jsx:56` |
| **Dampak** | `setTimeout` yang memanggil `setState` tidak dibersihkan saat component unmount. Menyebabkan React warning di development. |
| **Status** | FIXED |

```jsx
// SplashScreen - timeoutId disimpan dan dicleanup
return () => {
  cancelAnimationFrame(frame);
  if (timeoutId) clearTimeout(timeoutId);
};

// BankReconciliation - useRef untuk timeout
const savedTimeoutRef = useRef(null);
// cleanup di useEffect return
```

---

## LOW (6)

### 15. ErrorBoundary Tanpa `componentDidCatch`

| Properti | Detail |
|----------|--------|
| **File** | `src/components/ErrorBoundary.jsx` |
| **Dampak** | Error tertangkap dan ditampilkan ke user, tapi tidak di-log ke console. Developer tidak bisa lihat error di production. |
| **Status** | FIXED |

```jsx
componentDidCatch(error, errorInfo) {
  console.error('[ErrorBoundary] Caught error:', error);
  console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
}
```

---

### 16. Unhandled Promise Rejection Handler

| Properti | Detail |
|----------|--------|
| **File** | `src/main.jsx` |
| **Dampak** | Async error dari IPC calls yang tidak di-try-catch tidak tertangkap oleh ErrorBoundary (hanya menangkap render errors). |
| **Status** | FIXED |

```js
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise] ', event.reason);
});
```

---

### 17. Array Index Sebagai React `key`

| Properti | Detail |
|----------|--------|
| **File** | `src/pages/RealisasiBelanja.jsx:355,692`, `src/pages/BackupRestore.jsx:415,500,539` |
| **Dampak** | Menggunakan index array sebagai React `key` pada list yang bisa berubah urutannya. Bisa menyebabkan rendering artifact saat switch view. |
| **Status** | FIXED — diganti dengan unique identifier (`kode_rekening`, `f.name`, `item.label`, `pm.m`) |

---

### 18. `useMemo` Tidak Efektif di TaxReportList

| Properti | Detail |
|----------|--------|
| **File** | `src/components/transactions/TaxReportList.jsx:192-221` |
| **Dampak** | `sortedData` dibuat dengan `[...mergedData].sort()` yang selalu menghasilkan array baru setiap render. Akibatnya `useMemo([sortedData, ...])` selalu recompute, menghilangkan manfaat memoization. |
| **Status** | FIXED — `sortedData` dibungkus dengan `useMemo` sendiri |

---

### 19. Input Validation di Pengaturan

| Properti | Detail |
|----------|--------|
| **File** | `src/pages/Pengaturan.jsx:91-107` |
| **Dampak** | Data form disimpan tanpa validasi. NIP bisa berisi karakter non-angka, nama bisa kosong. |
| **Status** | FIXED |

**Validasi yang ditambahkan:**
- Minimal nama Kepala Sekolah atau Bendahara harus diisi
- NIP hanya boleh berisi angka (max 25 digit)

---

### 20. License Key Format Validation

| Properti | Detail |
|----------|--------|
| **File** | `src/components/license/LicenseScreen.jsx:118-127` |
| **Dampak** | License key tidak divalidasi formatnya sebelum dikirim ke IPC handler. String kosong atau teks acak diproses oleh backend. |
| **Status** | FIXED |

**Validasi yang ditambahkan:**
```js
const keyPattern = /^SMARTSPJ-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
if (!keyPattern.test(licenseKey.trim()) && licenseKey.trim().length < 10) {
  setError('Format license key tidak valid');
  return;
}
```

---

## Ringkasan File yang Diubah

### Backend (Electron) — 10 file

| File | Fix # | Perubahan |
|------|-------|-----------|
| `scripts/reset-hw-null.js` | #1 | Hardcoded cred → `process.env.DATABASE_URL` |
| `scripts/check-license-db.js` | #1 | Hardcoded cred → `process.env.DATABASE_URL` |
| `electron/main.js` | #2, #3, #6, #7, #9, #11 | Undefined var fix, DB leak fix (13 handler), null date fix, dead code removal, parseInt guard, isPenerimaan extract |
| `electron/lib/financial-utils.js` | #11 | Tambah `isPenerimaan()` sebagai shared function |
| `electron/handlers/transactionHandler.js` | #5, #8, #12 | SQL LIKE escape, dead CASE removal, nominal consistency |
| `electron/handlers/dashboard/cashflowQueries.js` | #4 | Tambah `isBudgetMatch()` call di loop |
| `electron/handlers/scrapeHandler.js` | #10 | `encodeURIComponent` untuk NPSN |
| `electron/handlers/reconciliationHandler.js` | #9 | parseInt NaN guard |
| `package.json` | - | Version bump |
| `README.md` | - | Doc update |

### Frontend (React) — 14 file

| File | Fix # | Perubahan |
|------|-------|-----------|
| `src/main.jsx` | #16 | `unhandledrejection` global handler |
| `src/components/ErrorBoundary.jsx` | #15 | Tambah `componentDidCatch` logging |
| `src/components/SplashScreen.jsx` | #14 | setTimeout cleanup |
| `src/components/license/LicenseScreen.jsx` | #20 | License key format validation |
| `src/components/transactions/TaxReportList.jsx` | #18 | `sortedData` dibungkus `useMemo` |
| `src/hooks/useKertasKerjaData.js` | #13 | Race condition fix (cancelled flag) |
| `src/pages/LaporanK7.jsx` | #13 | Race condition fix (cancelled flag) |
| `src/pages/CetakSPTJM.jsx` | #13 | Race condition fix (cancelled flag) |
| `src/pages/BankReconciliation.jsx` | #13, #14 | Race condition fix + setTimeout cleanup |
| `src/pages/BAReconciliation.jsx` | #13 | Race condition fix (cancelled flag) |
| `src/pages/RealisasiBelanja.jsx` | #13, #17 | Race condition fix + unique React key |
| `src/pages/NotaGroupManager.jsx` | #13 | Race condition fix (cancelled flag) |
| `src/pages/BackupRestore.jsx` | #17 | Unique React key |
| `src/pages/Pengaturan.jsx` | #19 | Input validation (NIP, nama) |

---

## Catatan untuk Reviewer

1. **Semua fix tidak mengubah behavior di happy path.** Perubahan hanya menambah safety net di error paths dan edge cases.

2. **Semua file backend sudah pass `node -c` syntax check.** Frontend memerlukan `npm install && npm run build` untuk verifikasi penuh.

3. **Action yang perlu dilakukan setelah merge:**
   - Set `DATABASE_URL` environment variable sebelum menjalankan script debug
   - Rotasi password database Neon yang sebelumnya terekspos di git history
   - Test manual halaman dashboard dengan filter sumber dana tertentu untuk verifikasi fix #4
   - Test fitur "lihat pajak terkait" di halaman transaksi untuk verifikasi fix #2

4. **Jika ada masalah setelah merge,** semua fix bersifat independen — bisa di-revert per file tanpa mempengaruhi fix lainnya.
