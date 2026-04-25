# 🔐 Analisis Sistem Lisensi SmartSPJ

## 1. Konteks Proyek

| Aspek | Detail |
|-------|--------|
| **Aplikasi** | SmartSPJ - Pendamping ARKAS untuk SPJ BOS |
| **Platform** | Windows Desktop (Electron 28) |
| **Target User** | Bendahara sekolah di Indonesia |
| **Distribusi** | GitHub Releases (private repo) |
| **Proteksi Saat Ini** | Bytenode (.jsc), SQLCipher DB, Electron safeStorage |

---

## 2. Inventaris Fitur SmartSPJ (Lengkap)

### 📊 A. DASHBOARD
| # | Sub-Fitur | Keterangan |
|---|-----------|------------|
| A1 | Statistik Keuangan Real-time | Penerimaan, pengeluaran, saldo |
| A2 | Grafik Revenue Interaktif | Chart.js dengan garis saldo akhir |
| A3 | Pergerakan Kas Bulanan | Running balance per sumber dana |
| A4 | Belanja per Kategori | Pie chart breakdown |
| A5 | Top 5 Pengeluaran | Ranking pengeluaran terbesar |
| A6 | Belanja per Kegiatan | Breakdown per aktivitas |
| A7 | Ringkasan Sumber Dana | BOS Reguler, Kinerja, Lainnya, SiLPA |
| A8 | Badges/Alert | Notifikasi status anggaran |

### 📋 B. PENGANGGARAN
| # | Sub-Fitur | Keterangan |
|---|-----------|------------|
| B1 | Kertas Kerja (RKAS) — View | Melihat data RKAS dari ARKAS |
| B2 | Realisasi Belanja — View | Progress bar per kegiatan |
| B3 | Realisasi Belanja — Filter | Filter per sumber dana, bulan |

### 📖 C. PENATAUSAHAAN — Buku Kas
| # | Sub-Fitur | Keterangan |
|---|-----------|------------|
| C1 | BKU — View (Buku Kas Umum) | Tabel transaksi dengan paginasi |
| C2 | BKU — Filter & Search | Filter bulan, sumber dana, search |
| C3 | BKU — Export Excel Bulanan | Export 1 bulan ke Excel |
| C4 | BKU — Export PDF Bulanan | Export 1 bulan ke PDF |
| C5 | BKU — Bulk Export 12 Bulan | Export semua bulan sekaligus |
| C6 | Buku Pembantu Tunai — View | Arus kas tunai |
| C7 | Buku Pembantu Tunai — Export | Export Excel/PDF |
| C8 | Buku Pembantu Bank — View | Rekening koran |
| C9 | Buku Pembantu Bank — Export | Export Excel/PDF |
| C10 | Buku Pembantu Pajak — View | Pajak pungut & setor |
| C11 | Buku Pembantu Pajak — Export | Export Excel/PDF |
| C12 | Pajak Manual — Input | Tambah pajak manual |
| C13 | Pajak Manual — Edit/Delete | Kelola pajak manual |

### 🧾 D. BUKTI TRANSAKSI & CETAK
| # | Sub-Fitur | Keterangan |
|---|-----------|------------|
| D1 | Nota Group Manager | Pengelompokan nota/bukti |
| D2 | Cetak Kwitansi A2 (Satuan) | Print 1 kwitansi |
| D3 | Cetak Kwitansi A2 (Batch) | Print banyak kwitansi sekaligus |
| D4 | Cetak Bukti Pengeluaran | Print bukti pengeluaran |
| D5 | Cetak Bukti Pengeluaran (Batch) | Print banyak bukti sekaligus |
| D6 | Merge Transaksi | Gabung beberapa transaksi jadi 1 |
| D7 | Cetak Merged Kwitansi | Print hasil gabungan |
| D8 | Preview Kwitansi | Modal preview sebelum cetak |

### 📊 E. LAPORAN
| # | Sub-Fitur | Keterangan |
|---|-----------|------------|
| E1 | BA Rekonsiliasi — View | Berita Acara Rekonsiliasi |
| E2 | BA Rekonsiliasi — Export PDF | Export BA ke PDF |
| E3 | BA Rekonsiliasi — Export Excel | Export BA ke Excel |
| E4 | BA Rekonsiliasi — Export HTML | Export BA ke HTML |
| E5 | Rekonsiliasi Bank | Rekonsiliasi saldo bank |
| E6 | Cetak SPTJM | Surat Pertanggungjawaban Mutlak |
| E7 | Laporan K7 / K7a | Laporan rekapitulasi per periode |
| E8 | Register Kas | Pecahan uang kas fisik |

### 🗄️ F. BACKUP & DATA
| # | Sub-Fitur | Keterangan |
|---|-----------|------------|
| F1 | Backup Data (JSON) | Backup config + localStorage |
| F2 | Backup Lengkap (Full ZIP) | Backup seluruh folder data/ |
| F3 | Restore dari Backup | Restore dari file ZIP |
| F4 | Preview sebelum Restore | Melihat isi backup sebelum restore |
| F5 | Export Semua BKU (All-in-One) | 1 file Excel multi-sheet |

### ⚙️ G. PENGATURAN & SISTEM
| # | Sub-Fitur | Keterangan |
|---|-----------|------------|
| G1 | Konfigurasi Pejabat Sekolah | Nama KS, Bendahara, NIP |
| G2 | Konfigurasi Penandatangan BA | Pejabat untuk BA Rekonsiliasi |
| G3 | Auto-Update dari GitHub | Check & download update otomatis |
| G4 | Koneksi Database ARKAS | Auto-detect path + password |
| G5 | Info Versi Aplikasi | Electron, Chrome, Node version |

---

## 3. Mapping Fitur per Tier Lisensi

### Legend
- ✅ = Tersedia penuh
- ⚠️ = Tersedia terbatas (ada batasan)
- 🔒 = Terkunci (tidak tersedia)
- 🏷️ = Watermark ditambahkan

### Tier: FREE (Trial 30 Hari)

| Grup | Fitur | Status | Batasan |
|------|-------|:------:|---------|
| **Dashboard** | A1-A8 Semua statistik & grafik | ✅ | — |
| **Penganggaran** | B1 Kertas Kerja View | ✅ | — |
| | B2-B3 Realisasi Belanja | ✅ | — |
| **BKU** | C1-C2 View & Filter | ⚠️ | Max 50 rows per halaman |
| | C3-C4 Export Bulanan | 🔒 | — |
| | C5 Bulk Export 12 Bulan | 🔒 | — |
| **Buku Pembantu** | C6, C8, C10 View Tunai/Bank/Pajak | ⚠️ | Max 50 rows |
| | C7, C9, C11 Export Tunai/Bank/Pajak | 🔒 | — |
| | C12-C13 Pajak Manual | 🔒 | — |
| **Cetak** | D1 Nota Group Manager | 🔒 | — |
| | D2 Cetak Kwitansi Satuan | ⚠️ | Max 5x/bulan, 🏷️ watermark |
| | D3-D7 Batch & Merge | 🔒 | — |
| | D8 Preview Kwitansi | ✅ | — |
| **Laporan** | E1 BA Rekonsiliasi View | ⚠️ | Hanya view, tanpa export |
| | E2-E4 Export BA PDF/Excel/HTML | 🔒 | — |
| | E5-E8 Rekon Bank, SPTJM, K7, Register | 🔒 | — |
| **Backup** | F1-F5 Semua backup/restore/export | 🔒 | — |
| **Pengaturan** | G1-G2 Konfigurasi Pejabat | ✅ | — |
| | G3 Auto-Update | 🔒 | — |
| | G4-G5 Koneksi & Info | ✅ | — |

### Tier: BASIC (1 Tahun, 1 Device)

| Grup | Fitur | Status | Batasan |
|------|-------|:------:|---------|
| **Dashboard** | A1-A8 Semua statistik & grafik | ✅ | — |
| **Penganggaran** | B1-B3 Kertas Kerja & Realisasi | ✅ | — |
| **BKU** | C1-C2 View & Filter | ✅ | Unlimited rows |
| | C3-C4 Export Bulanan | ✅ | — |
| | C5 Bulk Export 12 Bulan | 🔒 | — |
| **Buku Pembantu** | C6-C11 View & Export Semua | ✅ | — |
| | C12-C13 Pajak Manual | ✅ | — |
| **Cetak** | D1 Nota Group Manager | ✅ | — |
| | D2 Cetak Kwitansi Satuan | ⚠️ | Max 30x/bulan |
| | D3-D5 Batch Cetak | ⚠️ | Max 10 transaksi per batch |
| | D6-D7 Merge & Cetak Merged | ✅ | — |
| | D8 Preview Kwitansi | ✅ | — |
| **Laporan** | E1-E4 BA Rekonsiliasi + Export | ✅ | — |
| | E5 Rekonsiliasi Bank | ✅ | — |
| | E6-E7 SPTJM & K7 | ✅ | — |
| | E8 Register Kas | ✅ | — |
| **Backup** | F1-F4 Backup/Restore | ✅ | — |
| | F5 Export Semua BKU (All-in-One) | 🔒 | — |
| **Pengaturan** | G1-G5 Semua Pengaturan | ✅ | — |
| | G3 Auto-Update | ✅ | — |

### Tier: PRO (1 Tahun, 1 Device)

| Grup | Fitur | Status | Batasan |
|------|-------|:------:|---------|
| **Dashboard** | A1-A8 Semua statistik & grafik | ✅ | — |
| **Penganggaran** | B1-B3 Kertas Kerja & Realisasi | ✅ | — |
| **BKU** | C1-C5 View, Filter, Export, Bulk | ✅ | Unlimited |
| **Buku Pembantu** | C6-C13 Semua fitur | ✅ | Unlimited |
| **Cetak** | D1-D8 Semua fitur cetak | ✅ | Unlimited |
| **Laporan** | E1-E8 Semua laporan | ✅ | Unlimited |
| **Backup** | F1-F5 Semua backup + All-in-One | ✅ | Unlimited |
| **Pengaturan** | G1-G5 Semua Pengaturan | ✅ | — |
| | G3 Auto-Update | ✅ | Priority update |

---

## 4. Ringkasan Perbedaan Tier

| Aspek | FREE (Trial) | BASIC | PRO |
|-------|:---:|:---:|:---:|
| **Durasi** | 30 hari | 1 tahun | 1 tahun |
| **Device** | 1 | 1 | 1 |
| **Dashboard** | ✅ Full | ✅ Full | ✅ Full |
| **View BKU** | ⚠️ 50 rows | ✅ Unlimited | ✅ Unlimited |
| **Export Bulanan** | 🔒 | ✅ | ✅ |
| **Bulk Export 12 Bulan** | 🔒 | 🔒 | ✅ |
| **Export All-in-One** | 🔒 | 🔒 | ✅ |
| **Cetak Kwitansi** | ⚠️ 5x/bln | ⚠️ 30x/bln | ✅ Unlimited |
| **Batch Cetak** | 🔒 | ⚠️ Max 10 | ✅ Unlimited |
| **Nota Group** | 🔒 | ✅ | ✅ |
| **BA Rekonsiliasi** | ⚠️ View only | ✅ + Export | ✅ + Export |
| **Rekon Bank** | 🔒 | ✅ | ✅ |
| **SPTJM** | 🔒 | ✅ | ✅ |
| **Laporan K7** | 🔒 | ✅ | ✅ |
| **Register Kas** | 🔒 | ✅ | ✅ |
| **Pajak Manual** | 🔒 | ✅ | ✅ |
| **Backup/Restore** | 🔒 | ✅ | ✅ |
| **Auto Update** | 🔒 | ✅ | ✅ Priority |
| **Watermark Cetak** | 🏷️ Ya | ❌ Tidak | ❌ Tidak |

---

## 5. Detail Enforcement per Fitur

### Di Mana Lisensi Dicek (Enforcement Points)

```
┌────────────────────────────────────────────────────┐
│              ENFORCEMENT ARCHITECTURE               │
├────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────┐                            │
│  │ 1. APP STARTUP      │ ← License validity check  │
│  │    main.js           │   (sebelum createWindow)  │
│  └──────────┬──────────┘                            │
│             ▼                                       │
│  ┌─────────────────────┐                            │
│  │ 2. SIDEBAR MENU     │ ← Hide/disable menu items │
│  │    Sidebar.jsx       │   berdasarkan tier        │
│  └──────────┬──────────┘                            │
│             ▼                                       │
│  ┌─────────────────────┐                            │
│  │ 3. PAGE COMPONENT   │ ← Show upgrade prompt     │
│  │    *.jsx pages       │   jika fitur terkunci     │
│  └──────────┬──────────┘                            │
│             ▼                                       │
│  ┌─────────────────────┐                            │
│  │ 4. ACTION HANDLER   │ ← Block export/print      │
│  │    Button onClick    │   sebelum action execute  │
│  └──────────┬──────────┘                            │
│             ▼                                       │
│  ┌─────────────────────┐                            │
│  │ 5. BACKEND IPC      │ ← Final gate di Electron  │
│  │    electron/main.js  │   (tidak bisa di-bypass)  │
│  └─────────────────────┘                            │
│                                                     │
└────────────────────────────────────────────────────┘
```

### Tabel Enforcement Detail

| Kode | Fitur yang Dikunci | Check Location | Aksi jika Terkunci |
|------|--------------------|----------------|-------------------|
| `LK-01` | Limit rows BKU (50) | `transactionHandler.js` (backend) | Return max 50 rows |
| `LK-02` | Export BKU Excel/PDF | `exportHandler.js` (backend) | Return `{ error: 'LICENSE_REQUIRED' }` |
| `LK-03` | Bulk Export 12 Bulan | `exportHandler.js` (backend) | Return error + upgrade prompt |
| `LK-04` | Export All-in-One | `exportHandler.js` (backend) | Return error |
| `LK-05` | Cetak Kwitansi A2 | `printHandler` (backend) + counter | Increment counter, block jika > limit |
| `LK-06` | Batch Cetak A2/Bukti | `printHandler` (backend) | Block jika > batch limit |
| `LK-07` | Nota Group Manager | `Sidebar.jsx` (frontend) | Menu hidden/disabled |
| `LK-08` | BA Rekonsiliasi Export | `reconciliationHandler.js` (backend) | Block export, allow view |
| `LK-09` | Rekonsiliasi Bank | `Sidebar.jsx` (frontend) + backend | Menu hidden + IPC blocked |
| `LK-10` | SPTJM | `Sidebar.jsx` (frontend) + backend | Menu hidden + IPC blocked |
| `LK-11` | Laporan K7/K7a | `Sidebar.jsx` (frontend) + backend | Menu hidden + IPC blocked |
| `LK-12` | Register Kas | `Sidebar.jsx` (frontend) + backend | Menu hidden + IPC blocked |
| `LK-13` | Pajak Manual CRUD | `manualTaxHandler.js` (backend) | Block save/edit/delete |
| `LK-14` | Backup & Restore | `backupHandler.js` (backend) | Block semua operasi |
| `LK-15` | Auto Update | `main.js` setupAutoUpdater() | Skip auto-update setup |
| `LK-16` | Watermark Cetak | `exportHandler.js` (backend) | Tambah watermark "TRIAL" |
| `LK-17` | Trial Expiry | `licenseManager.js` (backend) | Block app setelah 30 hari |

---

## 6. Arsitektur Sistem Lisensi

### Hybrid Offline-First License System

```
┌─────────────────────────────────────────────────┐
│                  ADMIN SIDE                      │
│                                                  │
│  generate-keypair.js → private.pem + public.pem  │
│  generate-license.js → License Key (signed)      │
│                                                  │
│  Input: NPSN, Tier, Expiry                        │
│  Output: SMARTSPJ-XXXXX-XXXXX-XXXXX-XXXXX        │
└──────────────────────┬──────────────────────────┘
                       │ Key dikirim ke user
                       ▼
┌─────────────────────────────────────────────────┐
│                 CLIENT SIDE                      │
│                                                  │
│  1. User input License Key                       │
│  2. Verify signature (public key embedded)       │
│  3. Decode: NPSN + Tier + Expiry                 │
│  4. Match NPSN dengan database ARKAS             │
│  5. Collect Hardware Fingerprint                 │
│  6. Store encrypted license di userData          │
│  7. Unlock fitur sesuai tier                     │
│                                                  │
│  [IF ONLINE] → Heartbeat ke server (optional)    │
│  [IF OFFLINE] → Grace period 30 hari             │
└─────────────────────────────────────────────────┘
```

---

## 7. Flow Aktivasi

```
Install App → First Launch
    │
    ▼
┌──────────────────┐     ┌──────────────────┐
│ License Screen   │────▶│ Input License Key│
│ (Trial/Activate) │     └────────┬─────────┘
└──────┬───────────┘              │
       │ Pilih Trial              ▼
       ▼               ┌─────────────────────────┐
┌──────────────┐       │ Validate Key Format     │
│ Start Trial  │       │ Verify Digital Signature │
│ (30 hari)    │       │ Decode NPSN + Tier      │
│ Fitur LIMITED│       └────────────┬────────────┘
└──────────────┘                    │
                       ┌────────────▼────────────┐
                       │ Match NPSN dgn DB ARKAS │
                       │ Collect HW Fingerprint  │
                       │ Store License (encrypted)│
                       └────────────┬────────────┘
                                    │
                       ┌────────────▼────────────┐
                       │ ✅ Unlock Features      │
                       │    sesuai Tier           │
                       └─────────────────────────┘
```

---

## 8. Struktur File Baru

```
electron/
├── license/
│   ├── licenseManager.js    # Core: validate, store, check tier
│   ├── licenseEnforcer.js   # Enforcement: cek tier sebelum aksi
│   ├── fingerprint.js       # Hardware ID (CPU + Disk Serial)
│   ├── trialManager.js      # Trial period tracking
│   └── publicKey.pem        # Embedded public key (Ed25519)
scripts/
├── generate-keypair.js      # One-time: buat keypair Ed25519
└── generate-license.js      # Admin: generate license key
src/
├── components/
│   ├── license/
│   │   ├── LicenseGate.jsx      # Wrapper: cek akses sebelum render
│   │   ├── LicenseScreen.jsx    # Halaman input license key
│   │   ├── UpgradePrompt.jsx    # Modal "upgrade ke tier lebih tinggi"
│   │   └── LicenseBadge.jsx     # Badge tier di sidebar/header
│   └── layout/
│       └── Sidebar.jsx          # [MODIFY] Tambah lock icon per menu
├── context/
│   └── LicenseContext.jsx       # React context untuk tier info
```

### Perubahan File Existing

| File | Perubahan |
|------|-----------|
| `electron/main.js` | Tambah license check sebelum `createWindow()` |
| `electron/preload.js` | Expose `license.*` APIs (activate, getTier, getTrialDays) |
| `src/App.jsx` | Wrap dengan `LicenseProvider` + `LicenseGate` |
| `src/components/layout/Sidebar.jsx` | Lock icon + disabled state per tier |
| `electron/handlers/exportHandler.js` | Cek tier sebelum export |
| `electron/handlers/reconciliationHandler.js` | Cek tier sebelum export BA |
| `electron/handlers/backupHandler.js` | Cek tier sebelum backup/restore |
| `electron/handlers/transactionHandler.js` | Limit rows untuk FREE tier |

---

## 9. Keamanan

### Defense in Depth (5 Layer)

| Layer | Mekanisme | Lokasi |
|-------|-----------|--------|
| **1. Crypto** | Ed25519 digital signature | `licenseManager.js` |
| **2. Binding** | NPSN + Hardware Fingerprint | `fingerprint.js` |
| **3. Storage** | Electron safeStorage (encrypted) | `data/.license-key` |
| **4. Code** | Bytenode compilation (.jsc) | `compile-bytecode.js` |
| **5. Runtime** | 17 enforcement points (LK-01 ~ LK-17) | Backend handlers |

### Anti-Bypass

| Serangan | Mitigasi |
|----------|----------|
| Copy license ke PC lain | Hardware fingerprint binding |
| Patch binary | Multiple check points + bytenode |
| Mundurkan tanggal | Last-check timestamp + NTP (saat online) |
| Decompile asar | asar + bytenode obfuscation |
| Bypass frontend check | Backend IPC juga cek (double gate) |

---

## 10. Mekanisme Transfer Lisensi (Pindah PC)

### Kebijakan: 1 Key = 1 Device, tapi BISA dipindah

> **Prinsip:** User tidak perlu beli key baru saat ganti PC.
> Cukup **deactivate** di PC lama, lalu **activate** di PC baru.

### Flow Transfer

```
PC LAMA                              PC BARU
───────                              ───────
┌──────────────────┐
│ Buka Pengaturan  │
│ → Menu "Lisensi" │
│ → Klik DEACTIVATE│
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Konfirmasi       │
│ "Yakin pindah?"  │
│ → Ya, Deactivate │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ ✅ License       │
│    DEACTIVATED   │                 ┌──────────────────┐
│ App kembali ke   │                 │ Install SmartSPJ │
│ mode FREE/Trial  │                 │ di PC Baru       │
└──────────────────┘                 └────────┬─────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │ Input License Key │
                                     │ (key yang sama)   │
                                     └────────┬─────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │ Bind ke HW baru  │
                                     │ ✅ ACTIVATED      │
                                     └──────────────────┘
```

### Skenario Transfer

| Skenario | Solusi |
|----------|--------|
| PC lama masih bisa diakses | User deactivate sendiri → activate di PC baru |
| PC lama rusak/hilang (tidak bisa deactivate) | Hubungi admin → admin reset binding via dashboard |
| User lupa deactivate | Key ditolak di PC baru → muncul pesan "Key sudah aktif di device lain, deactivate dulu atau hubungi admin" |

### Batasan Transfer

| Aturan | Nilai |
|--------|-------|
| Jumlah transfer per tahun | **3x** (mencegah sharing key antar sekolah) |
| Cooldown antar transfer | **24 jam** |
| Counter reset | Setiap perpanjangan lisensi |

### Data saat Deactivate

| Data | Aksi |
|------|------|
| License key | Dilepas dari hardware fingerprint |
| Config pejabat (config.json) | **Tetap tersimpan** di PC lama |
| Data nota group, register kas | **Tetap tersimpan** di PC lama |
| Backup file | User disarankan backup dulu sebelum pindah |

### Implementasi Teknis

```javascript
// electron/license/licenseManager.js

// Deactivate: hapus binding hardware, kembalikan ke FREE
async function deactivateLicense() {
  // 1. Baca license file
  // 2. Hapus hardware fingerprint dari license data
  // 3. [IF ONLINE] Notify server: "device slot freed"
  // 4. [IF OFFLINE] Simpan deactivation token (untuk sync nanti)
  // 5. Increment transfer counter
  // 6. Tulis ulang license file (status: deactivated)
  // 7. Restart app dalam mode FREE
}

// Activate: bind ke hardware baru
async function activateLicense(licenseKey) {
  // 1. Validate key format + signature
  // 2. [IF ONLINE] Check server: "apakah key masih punya slot?"
  // 3. [IF OFFLINE] Check local deactivation token
  // 4. Collect hardware fingerprint PC baru
  // 5. Bind key ke hardware baru
  // 6. Store encrypted license
  // 7. Unlock features sesuai tier
}
```

### UI yang Ditambahkan

| Lokasi | Elemen |
|--------|--------|
| **Pengaturan** | Section "Lisensi" dengan info tier, expiry, device ID |
| **Pengaturan** | Tombol "Deactivate" dengan konfirmasi dialog |
| **Pengaturan** | Info sisa transfer: "Transfer tersisa: 2/3 tahun ini" |
| **License Screen** | Pesan error jika key sudah aktif di device lain |

---

## 11. Roadmap Implementasi

### Fase 1: Offline License + Feature Lock ⚡ (Prioritas Tinggi)
- Generate keypair Ed25519
- License key format: `SMARTSPJ-XXXXX-XXXXX-XXXXX`
- Encode: NPSN + Tier + Expiry + Signature
- Validasi lokal dengan public key
- NPSN binding ke database ARKAS
- Trial manager (30 hari)
- License gate UI (LicenseScreen, UpgradePrompt)
- Feature locking (LK-01 ~ LK-17)
- Sidebar lock indicators

### Fase 2: Hardware Fingerprint 🔒 (Medium)
- Collect: Volume Serial + Processor ID
- Bind license ke hardware spesifik
- Device limit enforcement (1 key = 1 device, strict)

### Fase 3: Online Dashboard 🌐 (Low Priority)
- Admin panel untuk manage licenses
- Usage analytics & telemetry
- Remote revocation capability
- Simple API (Vercel/Railway)

---

## 12. Estimasi Effort

| Fase | Estimasi | Kompleksitas |
|------|----------|:------------:|
| Fase 1 | 3-4 hari | ⭐⭐⭐ |
| Fase 2 | 1-2 hari | ⭐⭐ |
| Fase 3 | 3-5 hari | ⭐⭐⭐ |

---

## 13. Open Questions

> ❓ **Model bisnis**: Subscription (tahunan) atau perpetual (sekali bayar)?

> ❓ **Harga**: Berapa range harga BASIC dan PRO? Ini bisa mempengaruhi pembagian fitur.

> ❓ **Trial**: 30 hari cukup? Atau mau freemium (free selamanya tapi sangat terbatas)?

> ❓ **Server**: Sudah punya server/VPS untuk license API, atau full offline dulu?

> ❓ **Grace period**: Berapa lama app boleh jalan offline sebelum paksa re-validasi?

> ❓ **Upgrade path**: Apakah user bisa upgrade dari BASIC ke PRO mid-subscription?

> ❓ **Pembagian fitur**: Apakah setuju dengan mapping di atas, atau ada fitur yang ingin dipindah tier?
