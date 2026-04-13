/**
 * Reconciliation Handler - BA Rekonsiliasi Data Aggregation
 * 
 * Generates monthly reconciliation data from ARKAS database:
 * - Opening/Closing Balances per fund type (Bank + Tunai)
 * - Income (Penerimaan): Reguler T1/T2, Kinerja, Bunga Bank
 * - Expenses (Pengeluaran) by category: Barang/Jasa, Modal Mesin, Modal Aset
 * - Tax (Pajak): Pungut and Setor
 * 
 * Fund Types:
 * - Dana Lainnya (interest income, returns)
 * - BOS Reguler (main operational fund)
 * - BOS Kinerja (performance-based fund)
 * - SILPA (prior year remaining funds)
 */

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const fs = require('fs');
const path = require('path');

// Standard fund source patterns and their display names
// Using ID based mapping for accuracy
const SOURCE_IDS = {
    REGULER: [1, 33],  // BOS Reguler + SiLPA Reguler
    LAINNYA: [5],     // Lainnya
    KINERJA: [12, 35], // BOS Kinerja + SiLPA Kinerja
    AFIRMASI: [11, 34], // BOS Afirmasi + SiLPA Afirmasi
    DAERAH: [3]       // BOS Daerah
};

// Patterns kept for UI labeling alignment if needed, but logic uses IDs
const FUND_SOURCE_PATTERNS = [
    { id: 'lainnya', pattern: '%Lainnya%', label: 'Dana Lainnya', order: 1 },
    { id: 'reguler', pattern: '%Reguler%', label: 'BOS Reguler', order: 2 },
    { id: 'silpa', pattern: '%SILPA%', label: 'SILPA', order: 3 },
    { id: 'kinerja', pattern: '%Kinerja%', label: 'BOS Kinerja', order: 4 }
];

/**
 * Get available fund sources that have data for a specific year
 */
function getAvailableFundSources(db, year) {
    const available = [];

    for (const source of FUND_SOURCE_PATTERNS) {
        // Check if this fund source has any budget for this year
        const result = db.prepare(`
            SELECT COUNT(*) as count
            FROM anggaran a
            JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
            WHERE a.tahun_anggaran = ?
              AND sd.nama_sumber_dana LIKE ?
              AND a.is_approve = 1
              AND a.soft_delete = 0
        `).get(year.toString(), source.pattern);

        if (result && result.count > 0) {
            available.push({
                id: source.id,
                label: source.label,
                pattern: source.pattern,
                order: source.order
            });
        }
    }

    // Sort by order
    return available.sort((a, b) => a.order - b.order);
}

/**
 * Get valid budget IDs for a specific fund source
 */
function getBudgetIdsForFund(db, year, fundPattern) {
    const query = `
        SELECT a.id_anggaran 
        FROM anggaran a
        JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
        WHERE a.tahun_anggaran = ?
          AND sd.nama_sumber_dana LIKE ?
          AND a.is_approve = 1 
          AND a.soft_delete = 0
          AND a.is_revisi = (
              SELECT MAX(is_revisi) FROM anggaran a2 
              WHERE a2.id_ref_sumber_dana = a.id_ref_sumber_dana 
              AND a2.tahun_anggaran = a.tahun_anggaran
              AND a2.soft_delete = 0
              AND a2.is_approve = 1
          )
    `;
    return db.prepare(query).all(year.toString(), fundPattern).map(r => r.id_anggaran);
}

/**
 * Get opening balance (Saldo Awal) for a specific month
 * Uses id_ref_bku 8 (Bank) and 9 (Tunai)
 */
/**
 * Get opening balance (Saldo Awal) for a specific month
 * Uses id_ref_bku 8 (Bank) and 9 (Tunai)
 */
function getOpeningBalance(db, year, month) {
    const yearStr = year.toString();
    const monthStr = month.toString().padStart(2, '0');

    // For month 1, get from first transaction of the year
    if (month === 1) {
        // Query to get opening balance grouped by source fund ID
        // Uses JOIN to anggaran -> ref_sumber_dana for 100% accuracy
        // FIX: Exclude "Tahap" or "Terima Dana" transactions which are transfers incorrectly marked as Saldo Awal (BKU 2)
        const openingData = db.prepare(`
            SELECT 
                sd.id_ref_sumber_dana,
                SUM(CASE WHEN k.id_ref_bku IN (2, 8) AND k.uraian NOT LIKE '%tunai%' THEN k.saldo ELSE 0 END) as bank,
                SUM(CASE WHEN k.id_ref_bku = 9 OR k.uraian LIKE '%tunai%' THEN k.saldo ELSE 0 END) as tunai
            FROM kas_umum k
            LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
            LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
            WHERE strftime('%Y', k.tanggal_transaksi) = ?
              AND strftime('%m', k.tanggal_transaksi) = '01'
              AND k.soft_delete = 0
              AND k.id_ref_bku IN (2, 8, 9)
              AND k.uraian NOT LIKE '%Tahap%' 
              AND k.uraian NOT LIKE '%Terima Dana%'
            GROUP BY sd.id_ref_sumber_dana
        `).all(yearStr);

        let totalBank = 0;
        let totalTunai = 0;

        // Initialize details with 0
        const details = {
            reguler: { bank: 0, tunai: 0 },
            lainnya: { bank: 0, tunai: 0 },
            kinerja: { bank: 0, tunai: 0 },
            silpaKinerja: { bank: 0, tunai: 0 }
        };

        const internal = {
            pureReguler: { bank: 0, tunai: 0 },
            pureLainnya: { bank: 0, tunai: 0 },
            pureKinerja: { bank: 0, tunai: 0 }
        };

        // Map database results to our buckets
        openingData.forEach(row => {
            const id = row.id_ref_sumber_dana;
            const bank = row.bank || 0;
            const tunai = row.tunai || 0;

            if (SOURCE_IDS.REGULER.includes(id)) {
                details.reguler.bank += bank;
                details.reguler.tunai += tunai;
                internal.pureReguler.bank += bank;
                internal.pureReguler.tunai += tunai;
                totalBank += bank;
                totalTunai += tunai;
            } else if (SOURCE_IDS.LAINNYA.includes(id)) {
                details.lainnya.bank += bank;
                details.lainnya.tunai += tunai;
                internal.pureLainnya.bank += bank;
                internal.pureLainnya.tunai += tunai;
                totalBank += bank;
                totalTunai += tunai;
            } else if (SOURCE_IDS.KINERJA.includes(id)) {
                // Determine if specifically SiLPA Kinerja (35) or BOS Kinerja (12)
                if (id === 35) {
                    details.silpaKinerja.bank += bank;
                    details.silpaKinerja.tunai += tunai;
                } else {
                    details.kinerja.bank += bank;
                    details.kinerja.tunai += tunai;
                }
                internal.pureKinerja.bank += bank;
                internal.pureKinerja.tunai += tunai;
                totalBank += bank;
                totalTunai += tunai;
            } else {

                details.reguler.bank += bank;
                details.reguler.tunai += tunai;
                internal.pureReguler.bank += bank;
                internal.pureReguler.tunai += tunai;
                totalBank += bank;
                totalTunai += tunai;
            }
        });

        if (details.lainnya.bank === 0) {
            const silpaLainnya = db.prepare(`
                SELECT SUM(k.saldo) as total
                FROM kas_umum k
                LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
                LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
                WHERE strftime('%Y', k.tanggal_transaksi) = ?
                  AND k.soft_delete = 0
                  AND k.uraian LIKE '%SiLpa%'
                  AND sd.id_ref_sumber_dana = 5
            `).get(yearStr);

            if (silpaLainnya && silpaLainnya.total > 0) {
                const amount = silpaLainnya.total;
                details.lainnya.bank = amount;
                internal.pureLainnya.bank = amount;
                totalBank += amount;
            }
        }

        return {
            bank: totalBank,
            tunai: totalTunai,
            total: totalBank + totalTunai,
            details: details,
            '_internal': internal
        };
    } else {
        return { bank: 0, tunai: 0, total: 0, details: { lainnya: { bank: 0, tunai: 0 }, reguler: { bank: 0, tunai: 0 } } };
    }
}

/**
 * Get income (Penerimaan) for a specific month
 */
function getIncome(db, year, month) {
    const yearStr = year.toString();
    const monthStr = month.toString().padStart(2, '0');

    const dateFilter = `strftime('%Y', k.tanggal_transaksi) = '${yearStr}' AND strftime('%m', k.tanggal_transaksi) = '${monthStr}'`;

    const regulerT1 = db.prepare(`
        SELECT SUM(k.saldo) as total
        FROM kas_umum k
        LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
        WHERE ${dateFilter}
                AND k.soft_delete = 0
          AND k.no_bukti LIKE 'BBU%'
        AND(k.uraian LIKE '%Tahap 1%' OR k.uraian LIKE '%T1%')
          AND k.uraian NOT LIKE '%Saldo%'
          AND k.uraian NOT LIKE '%Kinerja%'
          AND (a.id_ref_sumber_dana IS NULL OR a.id_ref_sumber_dana NOT IN (12, 35))
            `).get();


    const regulerT2 = db.prepare(`
        SELECT SUM(k.saldo) as total
        FROM kas_umum k
        LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
        WHERE ${dateFilter}
                AND k.soft_delete = 0
          AND k.no_bukti LIKE 'BBU%'
        AND(k.uraian LIKE '%Tahap 2%' OR k.uraian LIKE '%T2%')
          AND k.uraian NOT LIKE '%Saldo%'
          AND k.uraian NOT LIKE '%Kinerja%'
          AND (a.id_ref_sumber_dana IS NULL OR a.id_ref_sumber_dana NOT IN (12, 35))
            `).get();

    const kinerja = db.prepare(`
        SELECT SUM(k.saldo) as total
        FROM kas_umum k
        LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
        WHERE ${dateFilter}
                AND k.soft_delete = 0
          AND k.no_bukti LIKE 'BBU%'
          AND k.uraian NOT LIKE '%Saldo%'
          AND (
              k.uraian LIKE '%Kinerja%'
              OR a.id_ref_sumber_dana IN (12, 35)
          )
            `).get();


    // Dana Lainnya income (SiLpa, misc - catch all non-categorized penerimaan)
    const danaLainnya = db.prepare(`
        SELECT SUM(k.saldo) as total
        FROM kas_umum k
        WHERE ${dateFilter}
                AND k.soft_delete = 0
          AND (k.id_ref_bku = 2 OR k.kode_rekening LIKE '4.%')
          AND k.id_ref_bku NOT IN (5, 33, 10, 11)
          AND k.uraian NOT LIKE '%Saldo%'
          AND k.uraian NOT LIKE '%Kinerja%'
          AND k.uraian NOT LIKE '%Tahap%'
          AND k.uraian NOT LIKE '%T1%'
          AND k.uraian NOT LIKE '%T2%'
    `).get();
    const bunga = db.prepare(`
        SELECT SUM(saldo) as total
        FROM kas_umum k
        WHERE ${dateFilter}
            AND soft_delete = 0
            AND id_ref_bku = 6
            `).get();

    // Tax collected (Pajak Pungut)
    const pajakPungut = db.prepare(`
        SELECT SUM(saldo) as total
        FROM kas_umum k
        WHERE ${dateFilter}
                AND soft_delete = 0
          AND id_ref_bku IN(5, 10, 33)
          AND uraian NOT LIKE 'Setor Tunai%'
    `).get();

    const displayTotal = (regulerT1?.total || 0) + (regulerT2?.total || 0) +
        (kinerja?.total || 0) + (danaLainnya?.total || 0) + (bunga?.total || 0) + (pajakPungut?.total || 0);

    // Total affecting balance (Legacy use)
    const totalForBalance = (regulerT1?.total || 0) + (regulerT2?.total || 0) +
        (kinerja?.total || 0) + (danaLainnya?.total || 0);

    return {
        regulerT1: regulerT1?.total || 0,
        regulerT2: regulerT2?.total || 0,
        kinerja: kinerja?.total || 0,
        danaLainnya: danaLainnya?.total || 0,
        bunga: bunga?.total || 0,
        pajakPungut: pajakPungut?.total || 0,
        total: displayTotal,
        totalForBalance: totalForBalance
    };
}

/**
 * Get expenses (Pengeluaran) for a specific month, grouped by category and fund
 */
function getExpenses(db, year, month) {
    const yearStr = year.toString();
    const monthStr = month.toString().padStart(2, '0');

    const dateFilter = `strftime('%Y', k.tanggal_transaksi) = '${yearStr}' AND strftime('%m', k.tanggal_transaksi) = '${monthStr}'`;

    const expenses = db.prepare(`
        SELECT 
            sd.id_ref_sumber_dana as id_ref_sumber_dana,
            k.kode_rekening,
            SUM(k.saldo) as amount,
            SUM(CASE WHEN k.no_bukti LIKE 'BPU%' THEN k.saldo ELSE 0 END) as amount_tunai
        FROM kas_umum k
        LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
        LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
        WHERE strftime('%Y', k.tanggal_transaksi) = ?
          AND strftime('%m', k.tanggal_transaksi) = ?
          AND k.soft_delete = 0
          AND k.id_ref_bku NOT IN (
              0, 1, 2, 3, 8, 9,              -- Penerimaan, Balances, Cash Flow (REMOVED 4)
              5, 10, 33,                     -- Pajak Pungut (Income side)
              6, 7, 11, 25,                  -- Pajak Setor (Non-Budget Expense)
              12, 13, 14, 26, 28,            -- Bunga/Pajak Bank (Handled separately)
              19, 24                         -- Transfer/Tarik Tunai IDs
          )
        GROUP BY sd.id_ref_sumber_dana, k.kode_rekening
    `).all(yearStr, monthStr);

    let lainnyaBJ = 0, lainnyaModalMesin = 0, lainnyaModalAset = 0;
    let lainnyaBJ_Tunai = 0, lainnyaModalMesin_Tunai = 0, lainnyaModalAset_Tunai = 0;

    let regulerBJ = 0, regulerModalMesin = 0, regulerModalAset = 0;
    let regulerBJ_Tunai = 0, regulerModalMesin_Tunai = 0, regulerModalAset_Tunai = 0;

    let kinerjaBJ = 0, kinerjaModalMesin = 0, kinerjaModalAset = 0;
    let kinerjaBJ_Tunai = 0, kinerjaModalMesin_Tunai = 0, kinerjaModalAset_Tunai = 0;

    let silpaKinerjaBJ = 0, silpaKinerjaModalMesin = 0, silpaKinerjaModalAset = 0;
    let silpaKinerjaBJ_Tunai = 0, silpaKinerjaModalMesin_Tunai = 0, silpaKinerjaModalAset_Tunai = 0;

    let grandTotalBJ = 0, grandTotalModalMesin = 0, grandTotalModalAset = 0;

    expenses.forEach(tx => {
        const id = tx.id_ref_sumber_dana;
        const code = tx.kode_rekening || '';
        const amount = tx.amount || 0;

        // Skip if not an expense account (just in case)
        if (!code.startsWith('5.')) return;

        // Flags for expense type
        const isBarangJasa = code.startsWith('5.1.');
        const isModalMesinStrict = code.startsWith('5.2.02.');
        const isModalAsetStrict = code.startsWith('5.2.05.');

        // Count totals (these were removed from the provided snippet, re-adding them here)
        if (isBarangJasa) grandTotalBJ += amount;
        else if (isModalMesinStrict) grandTotalModalMesin += amount;
        else if (isModalAsetStrict) grandTotalModalAset += amount;



        const amountTunai = tx.amount_tunai || 0;

        if (SOURCE_IDS.LAINNYA.includes(id)) {
            if (isBarangJasa) { lainnyaBJ += amount; lainnyaBJ_Tunai += amountTunai; }
            else if (isModalMesinStrict) { lainnyaModalMesin += amount; lainnyaModalMesin_Tunai += amountTunai; }
            else if (isModalAsetStrict) { lainnyaModalAset += amount; lainnyaModalAset_Tunai += amountTunai; }
        } else if (SOURCE_IDS.REGULER.includes(id)) {
            if (isBarangJasa) { regulerBJ += amount; regulerBJ_Tunai += amountTunai; }
            else if (isModalMesinStrict) { regulerModalMesin += amount; regulerModalMesin_Tunai += amountTunai; }
            else if (isModalAsetStrict) { regulerModalAset += amount; regulerModalAset_Tunai += amountTunai; }
        } else if (SOURCE_IDS.KINERJA.includes(id)) {
            if (id === 35) { // SiLPA Kinerja
                if (isBarangJasa) { silpaKinerjaBJ += amount; silpaKinerjaBJ_Tunai += amountTunai; }
                else if (isModalMesinStrict) { silpaKinerjaModalMesin += amount; silpaKinerjaModalMesin_Tunai += amountTunai; }
                else if (isModalAsetStrict) { silpaKinerjaModalAset += amount; silpaKinerjaModalAset_Tunai += amountTunai; }
            } else { // Reguler Kinerja (2025)
                if (isBarangJasa) { kinerjaBJ += amount; kinerjaBJ_Tunai += amountTunai; }
                else if (isModalMesinStrict) { kinerjaModalMesin += amount; kinerjaModalMesin_Tunai += amountTunai; }
                else if (isModalAsetStrict) { kinerjaModalAset += amount; kinerjaModalAset_Tunai += amountTunai; }
            }
        } else {
            // Default to Reguler if unknown
            if (isBarangJasa) { regulerBJ += amount; regulerBJ_Tunai += amountTunai; }
            else if (isModalMesinStrict) { regulerModalMesin += amount; regulerModalMesin_Tunai += amountTunai; }
            else if (isModalAsetStrict) { regulerModalAset += amount; regulerModalAset_Tunai += amountTunai; }
        }
    });

    const admBank = db.prepare(`
        SELECT SUM(saldo) as total
        FROM kas_umum k
        WHERE ${dateFilter}
                AND soft_delete = 0
        AND(
            LOWER(uraian) LIKE '%biaya admin%'
              OR LOWER(uraian) LIKE '%pajak bunga%'
        )
    `).get();

    const pajakSetor = db.prepare(`
        SELECT SUM(saldo) as total
        FROM kas_umum k
        WHERE ${dateFilter}
                AND soft_delete = 0
          AND id_ref_bku IN(6, 7, 11, 25)
          AND uraian NOT LIKE '%Bunga%'
    `).get();

    const totalBelanja = grandTotalBJ + grandTotalModalMesin + grandTotalModalAset;

    const totalLainnya = lainnyaBJ + lainnyaModalMesin + lainnyaModalAset;

    const totalForBalance = totalBelanja - totalLainnya + (admBank?.total || 0);

    return {
        lainnya: {
            barangJasa: lainnyaBJ, modalMesin: lainnyaModalMesin, modalAset: lainnyaModalAset,
            tunai: (lainnyaBJ_Tunai + lainnyaModalMesin_Tunai + lainnyaModalAset_Tunai)
        },
        reguler: {
            barangJasa: regulerBJ, modalMesin: regulerModalMesin, modalAset: regulerModalAset,
            tunai: (regulerBJ_Tunai + regulerModalMesin_Tunai + regulerModalAset_Tunai)
        },
        silpaKinerja: {
            barangJasa: silpaKinerjaBJ, modalMesin: silpaKinerjaModalMesin, modalAset: silpaKinerjaModalAset,
            tunai: (silpaKinerjaBJ_Tunai + silpaKinerjaModalMesin_Tunai + silpaKinerjaModalAset_Tunai)
        },
        kinerja: {
            barangJasa: kinerjaBJ, modalMesin: kinerjaModalMesin, modalAset: kinerjaModalAset,
            tunai: (kinerjaBJ_Tunai + kinerjaModalMesin_Tunai + kinerjaModalAset_Tunai)
        },
        barangJasa: grandTotalBJ,
        modalMesin: grandTotalModalMesin,
        modalAset: grandTotalModalAset,
        totalBelanja,
        admBank: admBank?.total || 0,
        pajakSetor: pajakSetor?.total || 0,
        total: totalBelanja + (admBank?.total || 0) + (pajakSetor?.total || 0),
        totalForBalance: totalForBalance
    };
}

/**
 * Get cash flow data for Bank/Tunai calculation
 */
function getCashFlow(db, year, month) {
    const yearStr = year.toString();
    const monthStr = month.toString().padStart(2, '0');
    // Using simple date filter for efficiency
    const dateFilter = `strftime('%Y', k.tanggal_transaksi) = '${yearStr}' AND strftime('%m', k.tanggal_transaksi) = '${monthStr}'`;

    // Helper to get flow by Source
    const getFlow = (ids, keywords, sourceIdList) => {
        let sourceFilter = '1=1'; // Default all
        if (sourceIdList && sourceIdList.length > 0) {
            return db.prepare(`
                SELECT SUM(k.saldo) as total
                FROM kas_umum k
                LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
                LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
                WHERE ${dateFilter}
                  AND k.soft_delete = 0
                  AND (k.id_ref_bku IN (${ids}) OR LOWER(k.uraian) REGEXP '${keywords}')
                  AND sd.id_ref_sumber_dana IN (${sourceIdList.join(',')})
            `).get()?.total || 0;
        } else {
            return 0;
        }
    };

    const query = `
        SELECT 
            CASE 
                WHEN sd.id_ref_sumber_dana IN (12, 35) THEN 'kinerja'
                WHEN sd.id_ref_sumber_dana IN (5) THEN 'lainnya'
                WHEN sd.id_ref_sumber_dana IN (11, 34) THEN 'afirmasi'
                ELSE 'reguler' -- Default including NULL id_anggaran
            END as source_category,
            SUM(CASE WHEN (k.id_ref_bku = 3 OR LOWER(k.uraian) LIKE '%tarik tunai%') THEN k.saldo ELSE 0 END) as tarik_tunai,
            SUM(CASE WHEN (k.id_ref_bku = 4 OR LOWER(k.uraian) LIKE '%setor tunai%') THEN k.saldo ELSE 0 END) as setor_tunai,
            SUM(CASE WHEN k.no_bukti LIKE 'BPU%' AND k.kode_rekening LIKE '5.%' THEN k.saldo ELSE 0 END) as bpu_expense
        FROM kas_umum k
        LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
        LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
        WHERE ${dateFilter}
          AND k.soft_delete = 0
          AND (
             k.id_ref_bku IN (3, 4) 
             OR LOWER(k.uraian) LIKE '%tunai%'
             OR k.no_bukti LIKE 'BPU%'
          )
        GROUP BY source_category
    `;

    const rows = db.prepare(query).all();

    const result = {
        reguler: { tarikTunai: 0, setorTunai: 0, bpuExpense: 0 },
        kinerja: { tarikTunai: 0, setorTunai: 0, bpuExpense: 0 },
        lainnya: { tarikTunai: 0, setorTunai: 0, bpuExpense: 0 },
    };

    rows.forEach(r => {
        if (result[r.source_category]) {
            result[r.source_category].tarikTunai = r.tarik_tunai;
            result[r.source_category].setorTunai = r.setor_tunai;
            result[r.source_category].bpuExpense = r.bpu_expense;
        }
    });

    return result;
}

/**
 * Main function: Get complete reconciliation data for a year
 */
function getReconciliationData(db, year) {
    const monthlyData = [];

    const initialOpening = getOpeningBalance(db, year, 1);

    let runningLainnya = { ...initialOpening._internal.pureLainnya };
    let runningReguler = { ...initialOpening._internal.pureReguler };
    let runningSilpaKinerja = { ...initialOpening._internal.pureKinerja || { bank: 0, tunai: 0 } };
    let runningKinerja = { bank: 0, tunai: 0 };

    runningSilpaKinerja = { ...initialOpening.details.silpaKinerja || { bank: 0, tunai: 0 } };
    runningKinerja = { ...initialOpening.details.kinerja || { bank: 0, tunai: 0 } };

    const getMonthlyOpeningFromDB = (monthCheck) => {
        const monthStrCheck = monthCheck.toString().padStart(2, '0');
        const rows = db.prepare(`
            SELECT 
                sd.id_ref_sumber_dana,
                SUM(CASE WHEN k.id_ref_bku = 8 THEN k.saldo ELSE 0 END) as bank,
                SUM(CASE WHEN k.id_ref_bku = 9 THEN k.saldo ELSE 0 END) as tunai
            FROM kas_umum k
            LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
            LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
            WHERE strftime('%Y', k.tanggal_transaksi) = ?
              AND strftime('%m', k.tanggal_transaksi) = ?
              AND k.soft_delete = 0
              AND k.id_ref_bku IN (8, 9)
            GROUP BY sd.id_ref_sumber_dana
        `).all(year.toString(), monthStrCheck);

        if (rows.length === 0) return null;

        const result = {
            reguler: { bank: 0, tunai: 0, found: false },
            kinerja: { bank: 0, tunai: 0, found: false },
            lainnya: { bank: 0, tunai: 0, found: false }
        };

        rows.forEach(r => {
            const id = r.id_ref_sumber_dana;
            const bank = r.bank || 0;
            const tunai = r.tunai || 0;

            if (SOURCE_IDS.REGULER.includes(id)) {
                result.reguler.bank += bank;
                result.reguler.tunai += tunai;
                result.reguler.found = true;
            } else if (SOURCE_IDS.KINERJA.includes(id)) {
                result.kinerja.bank += bank;
                result.kinerja.tunai += tunai;
                result.kinerja.found = true;
            } else if (SOURCE_IDS.LAINNYA.includes(id)) {
                result.lainnya.bank += bank;
                result.lainnya.tunai += tunai;
                result.lainnya.found = true;
            }
        });
        return result;
    };

    for (let month = 1; month <= 12; month++) {
        const dbOpening = getMonthlyOpeningFromDB(month);

        if (dbOpening) {
            if (dbOpening.reguler.found && (dbOpening.reguler.bank > 0 || dbOpening.reguler.tunai > 0)) {
                runningReguler.bank = dbOpening.reguler.bank;
                runningReguler.tunai = dbOpening.reguler.tunai;
            }
            if (dbOpening.kinerja.found && (dbOpening.kinerja.bank > 0 || dbOpening.kinerja.tunai > 0)) {
                runningKinerja.bank = dbOpening.kinerja.bank;
                runningKinerja.tunai = dbOpening.kinerja.tunai;
            }
            if (dbOpening.lainnya.found && (dbOpening.lainnya.bank > 0 || dbOpening.lainnya.tunai > 0)) {
                runningLainnya.bank = dbOpening.lainnya.bank;
                runningLainnya.tunai = dbOpening.lainnya.tunai;
            }
        }

        const opening = month === 1 ? initialOpening : {
            bank: runningLainnya.bank + runningReguler.bank + runningSilpaKinerja.bank + runningKinerja.bank,
            tunai: runningLainnya.tunai + runningReguler.tunai + runningSilpaKinerja.tunai + runningKinerja.tunai,
            total: (runningLainnya.bank + runningReguler.bank + runningSilpaKinerja.bank + runningKinerja.bank) +
                (runningLainnya.tunai + runningReguler.tunai + runningSilpaKinerja.tunai + runningKinerja.tunai),
            details: {
                lainnya: { ...runningLainnya },
                reguler: { ...runningReguler },
                silpaKinerja: { ...runningSilpaKinerja },
                kinerja: { ...runningKinerja }
            }
        };

        const income = getIncome(db, year, month);
        const expenses = getExpenses(db, year, month);
        const cashFlow = getCashFlow(db, year, month);

        const biayaLainnya = (expenses.lainnya?.barangJasa || 0) +
            (expenses.lainnya?.modalMesin || 0) +
            (expenses.lainnya?.modalAset || 0);

        const closingLainnyaTotal = runningLainnya.bank + runningLainnya.tunai + (income.danaLainnya || 0) - biayaLainnya;

        const biayaLainnyaTunai = (expenses.lainnya?.tunai || 0);
        let closingLainnyaTunai = runningLainnya.tunai + (cashFlow.lainnya?.tarikTunai || 0) - (cashFlow.lainnya?.setorTunai || 0) - biayaLainnyaTunai;
        if (closingLainnyaTunai < 0) closingLainnyaTunai = 0;
        if (closingLainnyaTunai > closingLainnyaTotal) closingLainnyaTunai = closingLainnyaTotal;

        const closingLainnyaBank = closingLainnyaTotal - closingLainnyaTunai;

        const biayaSilpaKinerja = (expenses.silpaKinerja?.barangJasa || 0) +
            (expenses.silpaKinerja?.modalMesin || 0) +
            (expenses.silpaKinerja?.modalAset || 0);

        const closingSilpaKinerjaTotal = runningSilpaKinerja.bank + runningSilpaKinerja.tunai - biayaSilpaKinerja;
        const closingSilpaKinerjaBank = closingSilpaKinerjaTotal;
        const closingSilpaKinerjaTunai = 0;

        const incomeKinerja = income.kinerja || 0;

        const biayaKinerja = (expenses.kinerja?.barangJasa || 0) +
            (expenses.kinerja?.modalMesin || 0) +
            (expenses.kinerja?.modalAset || 0);

        const closingKinerjaTotal = runningKinerja.bank + runningKinerja.tunai + incomeKinerja - biayaKinerja;

        let closingKinerjaTunai = runningKinerja.tunai + (cashFlow.kinerja?.tarikTunai || 0) - (cashFlow.kinerja?.setorTunai || 0);

        if (closingKinerjaTunai > closingKinerjaTotal) closingKinerjaTunai = closingKinerjaTotal;
        if (closingKinerjaTunai < 0) closingKinerjaTunai = 0;

        const closingKinerjaBank = closingKinerjaTotal - closingKinerjaTunai;

        const incomeReguler = (income.regulerT1 || 0) + (income.regulerT2 || 0);

        const biayaReguler = (expenses.reguler?.barangJasa || 0) +
            (expenses.reguler?.modalMesin || 0) +
            (expenses.reguler?.modalAset || 0) +
            (expenses.admBank || 0);

        const closingRegulerTotal = runningReguler.bank + runningReguler.tunai + incomeReguler - biayaReguler;

        let closingRegulerTunai = runningReguler.tunai + (cashFlow.reguler?.tarikTunai || 0) - (cashFlow.reguler?.setorTunai || 0) - (cashFlow.reguler?.bpuExpense || 0);

        if (closingRegulerTunai < 0) closingRegulerTunai = 0;
        if (closingRegulerTotal < 0) {
            closingRegulerTunai = 0;
        } else if (closingRegulerTunai > closingRegulerTotal) {
            closingRegulerTunai = closingRegulerTotal;
        }

        const closingRegulerBank = closingRegulerTotal - closingRegulerTunai;

        const closingTotal = closingLainnyaBank + closingLainnyaTunai + closingSilpaKinerjaBank + closingSilpaKinerjaTunai + closingKinerjaBank + closingKinerjaTunai + closingRegulerBank + closingRegulerTunai;

        const closing = {
            bank: closingLainnyaBank + closingSilpaKinerjaBank + closingKinerjaBank + closingRegulerBank,
            tunai: closingRegulerTunai + closingLainnyaTunai + closingSilpaKinerjaTunai + closingKinerjaTunai,
            total: closingTotal,
            details: {
                lainnya: { bank: closingLainnyaBank, tunai: closingLainnyaTunai },
                reguler: { bank: closingRegulerBank, tunai: closingRegulerTunai },
                silpaKinerja: { bank: closingSilpaKinerjaBank, tunai: closingSilpaKinerjaTunai },
                kinerja: { bank: closingKinerjaBank, tunai: closingKinerjaTunai }
            },
            _internal: {
                pureLainnya: { bank: closingLainnyaBank, tunai: closingLainnyaTunai },
                pureReguler: { bank: closingRegulerBank, tunai: closingRegulerTunai },
                pureSilpaKinerja: { bank: closingSilpaKinerjaBank, tunai: closingSilpaKinerjaTunai },
                pureKinerja: { bank: closingKinerjaBank, tunai: closingKinerjaTunai }
            }
        };

        runningLainnya = { ...closing._internal.pureLainnya };
        runningReguler = { ...closing._internal.pureReguler };
        runningSilpaKinerja = { ...closing._internal.pureSilpaKinerja };
        runningKinerja = { ...closing._internal.pureKinerja };

        monthlyData.push({
            no: month,  // Explicit row number
            month: month, // Frontend expects 'month' for rendering logic (<row.month>)
            monthId: month,
            monthName: MONTHS[month - 1],
            opening,
            income,
            expenses,
            cashFlow,
            closing
        });
    }

    const quarterlySummaries = [];
    for (let q = 1; q <= 4; q++) {
        const startMonth = (q - 1) * 3;
        const quarterMonths = monthlyData.slice(startMonth, startMonth + 3);

        const sumExpenses = (path) => quarterMonths.reduce((sum, m) => {
            const parts = path.split('.');
            let val = m.expenses;
            for (const part of parts) {
                if (val) val = val[part];
                else { val = 0; break; }
            }
            return sum + (val || 0);
        }, 0);

        quarterlySummaries.push({
            quarter: q,
            label: `TRIWULAN ${q} `,
            opening: quarterMonths[0].opening,
            income: {
                regulerT1: quarterMonths.reduce((sum, m) => sum + m.income.regulerT1, 0),
                regulerT2: quarterMonths.reduce((sum, m) => sum + m.income.regulerT2, 0),
                kinerja: quarterMonths.reduce((sum, m) => sum + m.income.kinerja, 0),
                bunga: quarterMonths.reduce((sum, m) => sum + m.income.bunga, 0),
                pajakPungut: quarterMonths.reduce((sum, m) => sum + m.income.pajakPungut, 0),
                total: quarterMonths.reduce((sum, m) => sum + m.income.total, 0)
            },
            expenses: {
                lainnya: {
                    barangJasa: sumExpenses('lainnya.barangJasa'),
                    modalMesin: sumExpenses('lainnya.modalMesin'),
                    modalAset: sumExpenses('lainnya.modalAset')
                },
                reguler: {
                    barangJasa: sumExpenses('reguler.barangJasa'),
                    modalMesin: sumExpenses('reguler.modalMesin'),
                    modalAset: sumExpenses('reguler.modalAset')
                },
                silpaKinerja: {
                    barangJasa: sumExpenses('silpaKinerja.barangJasa'),
                    modalMesin: sumExpenses('silpaKinerja.modalMesin'),
                    modalAset: sumExpenses('silpaKinerja.modalAset')
                },
                kinerja: {
                    barangJasa: sumExpenses('kinerja.barangJasa'),
                    modalMesin: sumExpenses('kinerja.modalMesin'),
                    modalAset: sumExpenses('kinerja.modalAset')
                },
                barangJasa: sumExpenses('barangJasa'),
                modalMesin: sumExpenses('modalMesin'),
                modalAset: sumExpenses('modalAset'),
                totalBelanja: sumExpenses('totalBelanja'),
                admBank: sumExpenses('admBank'),
                pajakSetor: sumExpenses('pajakSetor'),
                total: sumExpenses('total')
            },
            closing: quarterMonths[2].closing
        });
    }

    // Calculate semester summaries
    const semesterSummaries = [];
    for (let s = 1; s <= 2; s++) {
        const startQuarter = (s - 1) * 2;
        const semesterQuarters = quarterlySummaries.slice(startQuarter, startQuarter + 2);

        const sumExpenses = (path) => semesterQuarters.reduce((sum, q) => {
            const parts = path.split('.');
            let val = q.expenses;
            for (const part of parts) {
                if (val) val = val[part];
                else { val = 0; break; }
            }
            return sum + (val || 0);
        }, 0);

        semesterSummaries.push({
            semester: s,
            label: `SEMESTER ${s} `,
            opening: semesterQuarters[0].opening,
            income: {
                regulerT1: semesterQuarters.reduce((sum, q) => sum + q.income.regulerT1, 0),
                regulerT2: semesterQuarters.reduce((sum, q) => sum + q.income.regulerT2, 0),
                kinerja: semesterQuarters.reduce((sum, q) => sum + q.income.kinerja, 0),
                bunga: semesterQuarters.reduce((sum, q) => sum + q.income.bunga, 0),
                pajakPungut: semesterQuarters.reduce((sum, q) => sum + q.income.pajakPungut, 0),
                total: semesterQuarters.reduce((sum, q) => sum + q.income.total, 0)
            },
            expenses: {
                lainnya: {
                    barangJasa: sumExpenses('lainnya.barangJasa'),
                    modalMesin: sumExpenses('lainnya.modalMesin'),
                    modalAset: sumExpenses('lainnya.modalAset')
                },
                reguler: {
                    barangJasa: sumExpenses('reguler.barangJasa'),
                    modalMesin: sumExpenses('reguler.modalMesin'),
                    modalAset: sumExpenses('reguler.modalAset')
                },
                silpaKinerja: {
                    barangJasa: sumExpenses('silpaKinerja.barangJasa'),
                    modalMesin: sumExpenses('silpaKinerja.modalMesin'),
                    modalAset: sumExpenses('silpaKinerja.modalAset')
                },
                kinerja: {
                    barangJasa: sumExpenses('kinerja.barangJasa'),
                    modalMesin: sumExpenses('kinerja.modalMesin'),
                    modalAset: sumExpenses('kinerja.modalAset')
                },
                barangJasa: sumExpenses('barangJasa'),
                modalMesin: sumExpenses('modalMesin'),
                modalAset: sumExpenses('modalAset'),
                totalBelanja: sumExpenses('totalBelanja'),
                admBank: sumExpenses('admBank'),
                pajakSetor: sumExpenses('pajakSetor'),
                total: sumExpenses('total')
            },
            closing: semesterQuarters[1].closing
        });
    }

    // Calculate annual summary
    const sumAnnualExpenses = (path) => monthlyData.reduce((sum, m) => {
        const parts = path.split('.');
        let val = m.expenses;
        for (const part of parts) {
            if (val) val = val[part];
            else { val = 0; break; }
        }
        return sum + (val || 0);
    }, 0);

    const annualSummary = {
        label: 'JUMLAH 1 TAHUN',
        opening: monthlyData[0].opening,
        income: {
            regulerT1: monthlyData.reduce((sum, m) => sum + m.income.regulerT1, 0),
            regulerT2: monthlyData.reduce((sum, m) => sum + m.income.regulerT2, 0),
            kinerja: monthlyData.reduce((sum, m) => sum + m.income.kinerja, 0),
            bunga: monthlyData.reduce((sum, m) => sum + m.income.bunga, 0),
            pajakPungut: monthlyData.reduce((sum, m) => sum + m.income.pajakPungut, 0),
            total: monthlyData.reduce((sum, m) => sum + m.income.total, 0)
        },
        expenses: {
            lainnya: {
                barangJasa: sumAnnualExpenses('lainnya.barangJasa'),
                modalMesin: sumAnnualExpenses('lainnya.modalMesin'),
                modalAset: sumAnnualExpenses('lainnya.modalAset')
            },
            reguler: {
                barangJasa: sumAnnualExpenses('reguler.barangJasa'),
                modalMesin: sumAnnualExpenses('reguler.modalMesin'),
                modalAset: sumAnnualExpenses('reguler.modalAset')
            },
            silpaKinerja: {
                barangJasa: sumAnnualExpenses('silpaKinerja.barangJasa'),
                modalMesin: sumAnnualExpenses('silpaKinerja.modalMesin'),
                modalAset: sumAnnualExpenses('silpaKinerja.modalAset')
            },
            kinerja: {
                barangJasa: sumAnnualExpenses('kinerja.barangJasa'),
                modalMesin: sumAnnualExpenses('kinerja.modalMesin'),
                modalAset: sumAnnualExpenses('kinerja.modalAset')
            },
            barangJasa: sumAnnualExpenses('barangJasa'),
            modalMesin: sumAnnualExpenses('modalMesin'),
            modalAset: sumAnnualExpenses('modalAset'),
            totalBelanja: sumAnnualExpenses('totalBelanja'),
            admBank: sumAnnualExpenses('admBank'),
            pajakSetor: sumAnnualExpenses('pajakSetor'),
            total: sumAnnualExpenses('total')
        },
        closing: monthlyData[11].closing
    };

    return {
        year,
        monthly: monthlyData,
        quarterly: quarterlySummaries,
        semester: semesterSummaries,
        annual: annualSummary
    };
}

/**
 * Get detailed report for a specific fund source
 * Rows: Months
 * Columns: Account Codes (Kode Rekening)
 */
function getFundSourceDetail(db, year, fundSourceId) {
    const yearStr = year.toString();
    const sourceConfig = FUND_SOURCE_PATTERNS.find(s => s.id === fundSourceId);
    if (!sourceConfig) return { columns: [], rows: [] };
    const budgetFilter = `
        SELECT a.id_anggaran 
        FROM anggaran a
        JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
        WHERE a.tahun_anggaran = ?
            AND sd.nama_sumber_dana LIKE ?
            AND a.is_approve = 1
            AND a.soft_delete = 0
            AND a.is_revisi = (
                SELECT MAX(a2.is_revisi) FROM anggaran a2 
                WHERE a2.id_ref_sumber_dana = a.id_ref_sumber_dana 
                AND a2.tahun_anggaran = a.tahun_anggaran
                AND a2.soft_delete = 0
                AND a2.is_approve = 1
            )
            `;

    const configPath = path.join(process.cwd(), 'src/config/reconciliation_columns_full.json');
    let columns = [];
    try {
        const rawConfig = fs.readFileSync(configPath, 'utf8');
        columns = JSON.parse(rawConfig);
    } catch (err) {
        console.error("Failed to load reconciliation columns:", err);
    }

    const budgetMapQuery = `
        WITH RelevantBudgets AS(${budgetFilter})
        SELECT r.kode_rekening, SUM(r.jumlah) as total_anggaran
        FROM rapbs r
        WHERE r.id_anggaran IN(SELECT id_anggaran FROM RelevantBudgets)
          AND r.soft_delete = 0
        GROUP BY r.kode_rekening
            `;

    const budgetMapRows = db.prepare(budgetMapQuery).all(yearStr, sourceConfig.pattern);
    const budgetMap = {};
    budgetMapRows.forEach(row => budgetMap[row.kode_rekening] = row.total_anggaran);
    columns = columns.map(col => ({
        ...col,
        total_anggaran: budgetMap[col.kode_rekening] || 0
    }));

    const realizationQuery = `
        SELECT
        strftime('%m', k.tanggal_transaksi) as month,
            k.kode_rekening,
            SUM(k.saldo) as total
        FROM kas_umum k
        LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
        LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
        WHERE strftime('%Y', k.tanggal_transaksi) = ?
            AND k.soft_delete = 0
          AND k.kode_rekening LIKE '5.%'
        AND(
            k.no_bukti LIKE 'BNU%' OR k.no_bukti LIKE 'BPU%'
        )
        AND(
            sd.nama_sumber_dana LIKE ?
          )
        GROUP BY month, k.kode_rekening
            `;

    const realizationRows = db.prepare(realizationQuery).all(yearStr, sourceConfig.pattern);

    const realizationMap = {};
    const realizedCodes = new Set();
    realizationRows.forEach(row => {
        const m = parseInt(row.month);
        if (!realizationMap[m]) realizationMap[m] = {};
        realizationMap[m][row.kode_rekening] = row.total;
        if (row.total > 0) realizedCodes.add(row.kode_rekening);
    });

    const filteredColumns = columns; // Show ALL columns like Excel template

    const colBarangJasa = filteredColumns.filter(c => c.group === 'BARANG_JASA');
    const colModalMesin = filteredColumns.filter(c => c.group === 'MODAL_MESIN');
    const colModalLainnya = filteredColumns.filter(c => c.group === 'MODAL_LAINNYA');

    const summaryColBJ = {
        kode_rekening: 'SUMMARY_BJ',
        nama_rekening: 'JUMLAH BELANJA BARANG DAN JASA',
        isSummaryColumn: true,
        group: 'SUMMARY',
        sumGroup: 'BARANG_JASA',
        total_anggaran: colBarangJasa.reduce((sum, c) => sum + (c.total_anggaran || 0), 0)
    };

    const summaryColModalMesin = {
        kode_rekening: 'SUMMARY_MODAL_MESIN',
        nama_rekening: 'TOTAL BELANJA MODAL ALAT DAN MESIN',
        isSummaryColumn: true,
        group: 'SUMMARY',
        sumGroup: 'MODAL_MESIN',
        total_anggaran: colModalMesin.reduce((sum, c) => sum + (c.total_anggaran || 0), 0)
    };

    const summaryColModalLainnya = {
        kode_rekening: 'SUMMARY_MODAL_LAINNYA',
        nama_rekening: 'TOTAL BELANJA MODAL ASET TETAP LAINNYA',
        isSummaryColumn: true,
        group: 'SUMMARY',
        sumGroup: 'MODAL_LAINNYA',
        total_anggaran: colModalLainnya.reduce((sum, c) => sum + (c.total_anggaran || 0), 0)
    };

    const summaryColTotal = {
        kode_rekening: 'SUMMARY_TOTAL',
        nama_rekening: 'JUMLAH TOTAL',
        isSummaryColumn: true,
        group: 'SUMMARY',
        sumGroup: 'ALL',
        total_anggaran: filteredColumns.reduce((sum, c) => sum + (c.total_anggaran || 0), 0)
    };

    let bjIdx = 1;
    colBarangJasa.forEach(c => { c.displayIdx = bjIdx++; });

    let modalIdx = 1;
    colModalMesin.forEach(c => { c.displayIdx = modalIdx++; });

    colModalLainnya.forEach(c => { c.displayIdx = modalIdx++; });

    const enrichedColumns = [
        ...colBarangJasa,
        summaryColBJ,
        ...colModalMesin,
        summaryColModalMesin,
        ...colModalLainnya,
        summaryColModalLainnya,
        summaryColTotal
    ];

    const rows = [];
    const monthlyData = [];

    const calculateSummary = (monthsToSum, label) => {
        const summaryRow = {
            label,
            isSummary: true,
            values: {},
            total: 0
        };

        enrichedColumns.forEach(col => {
            let colSum = 0;
            if (col.isSummaryColumn) {
                const groupCols = col.sumGroup === 'ALL'
                    ? filteredColumns
                    : filteredColumns.filter(c => c.group === col.sumGroup);
                groupCols.forEach(gc => {
                    monthsToSum.forEach(mRow => {
                        colSum += (mRow.values[gc.kode_rekening] || 0);
                    });
                });
            } else {
                monthsToSum.forEach(mRow => {
                    colSum += (mRow.values[col.kode_rekening] || 0);
                });
            }
            summaryRow.values[col.kode_rekening] = colSum;
            if (!col.isSummaryColumn) {
                summaryRow.total += colSum;
            }
        });

        return summaryRow;
    };

    for (let m = 1; m <= 12; m++) {
        const rowData = {
            month: m,
            monthName: MONTHS[m - 1],
            values: {},
            total: 0
        };

        enrichedColumns.forEach(col => {
            if (col.isSummaryColumn) {
                const groupCols = col.sumGroup === 'ALL'
                    ? filteredColumns
                    : filteredColumns.filter(c => c.group === col.sumGroup);
                let groupSum = 0;
                groupCols.forEach(gc => {
                    groupSum += (realizationMap[m]?.[gc.kode_rekening] || 0);
                });
                rowData.values[col.kode_rekening] = groupSum;
            } else {
                const val = realizationMap[m]?.[col.kode_rekening] || 0;
                rowData.values[col.kode_rekening] = val;
                rowData.total += val;
            }
        });

        monthlyData.push(rowData);
        rows.push(rowData);

        if (m % 3 === 0) {
            const q = m / 3;
            const quarterMonths = monthlyData.slice((q - 1) * 3, q * 3);
            rows.push(calculateSummary(quarterMonths, `TRIWULAN ${q} `));
        }

        if (m === 6) {
            const sem1Months = monthlyData.slice(0, 6);
            rows.push(calculateSummary(sem1Months, 'SEMESTER 1'));
        }
        if (m === 12) {
            const sem2Months = monthlyData.slice(6, 12);
            rows.push(calculateSummary(sem2Months, 'SEMESTER 2'));
        }
    }

    rows.push(calculateSummary(monthlyData, 'JUMLAH 1 TAHUN'));

    return {
        columns: enrichedColumns,
        rows
    };
}

/**
 * Get "REKAP BUNGA" detailed report
 */
function getBungaDetail(db, year) {
    const yearStr = year.toString();

    const columns = [
        { key: 'bunga', label: 'BUNGA BANK' },
        { key: 'adm', label: 'BIAYA ADMINISTRASI' },
        { key: 'saldo', label: 'SALDO' }
    ];

    const monthlyData = [];

    let currentBalance = 0;

    for (let m = 1; m <= 12; m++) {
        const monthStr = m.toString().padStart(2, '0');

        const bungaRes = db.prepare(`
            SELECT SUM(saldo) as total FROM kas_umum
            WHERE strftime('%Y', tanggal_transaksi) = ? AND strftime('%m', tanggal_transaksi) = ?
            AND soft_delete = 0
            AND id_ref_bku = 6
        `).get(yearStr, monthStr);
        const bunga = bungaRes?.total || 0;

        const admRes = db.prepare(`
            SELECT SUM(saldo) as total FROM kas_umum
            WHERE strftime('%Y', tanggal_transaksi) = ? AND strftime('%m', tanggal_transaksi) = ?
            AND soft_delete = 0
            AND id_ref_bku = 7
        `).get(yearStr, monthStr);
        const adm = admRes?.total || 0;

        currentBalance += (bunga - adm);

        monthlyData.push({
            month: m,
            monthName: MONTHS[m - 1],
            values: { bunga, adm, saldo: currentBalance },
            raw: { bunga, adm } // Keep raw for summarizing
        });
    }

    const rows = [];

    const createSummary = (months, label) => {
        const sumBunga = months.reduce((acc, r) => acc + r.raw.bunga, 0);
        const sumAdm = months.reduce((acc, r) => acc + r.raw.adm, 0);
        const lastBalance = months[months.length - 1].values.saldo;

        return {
            label,
            isSummary: true,
            values: {
                bunga: sumBunga,
                adm: sumAdm,
                saldo: lastBalance
            }
        };
    };

    for (let m = 1; m <= 12; m++) {
        rows.push(monthlyData[m - 1]);

        // Quarterly
        if (m % 3 === 0) {
            const q = m / 3;
            const qMonths = monthlyData.slice((q - 1) * 3, m);
            rows.push(createSummary(qMonths, `TRIWULAN ${q} `));
        }
        // Semester
        if (m === 6) rows.push(createSummary(monthlyData.slice(0, 6), 'SEMESTER 1'));
        if (m === 12) rows.push(createSummary(monthlyData.slice(6, 12), 'SEMESTER 2'));
    }

    // Annual
    const annualBunga = monthlyData.reduce((acc, r) => acc + r.raw.bunga, 0);
    const annualAdm = monthlyData.reduce((acc, r) => acc + r.raw.adm, 0);
    rows.push({
        label: 'JUMLAH 1 TAHUN',
        isSummary: true,
        values: {
            bunga: annualBunga,
            adm: annualAdm,
            saldo: monthlyData[11].values.saldo
        }
    });

    return { columns, rows };
}

/**
 * Get "REKAP PAJAK" detailed report
 */
function getPajakDetail(db, year) {
    const yearStr = year.toString();
    const columns = [
        { key: 'ppn', label: 'PPN' },
        { key: 'pph21', label: 'PPh 21' },
        { key: 'pph22', label: 'PPh 22' },
        { key: 'pph23', label: 'PPh 23' },
        { key: 'pajakDaerah', label: 'Pajak Daerah' }
    ];

    const monthlyData = [];
    let currentDebt = 0; // Saldo Akhir (Hutang Pajak)

    for (let m = 1; m <= 12; m++) {
        const monthStr = m.toString().padStart(2, '0');

        const getTaxValue = (taxType, direction) => {
            let typePattern = '';
            let colFlag = '';

            if (taxType === 'ppn') { typePattern = '%ppn%'; colFlag = 'is_ppn'; }
            else if (taxType === 'pph21') { typePattern = '%pph_21%'; colFlag = 'is_pph_21'; }
            else if (taxType === 'pph22') { typePattern = '%pph_22%'; colFlag = 'is_pph_22'; }
            else if (taxType === 'pph23') { typePattern = '%pph_23%'; colFlag = 'is_pph_23'; }
            else if (taxType === 'pajakDaerah') { typePattern = '%pajak_daerah%'; colFlag = 'is_pph_4'; } // Assuming PPh 4 or generic region tax

            const idList = direction === 'pungut' ? '5, 10, 33' : '6, 7, 11, 25';
            const uraianKey = direction === 'pungut' ? 'pungut' : 'setor';

            // Query
            const res = db.prepare(`
                SELECT SUM(saldo) as total FROM kas_umum
                WHERE strftime('%Y', tanggal_transaksi) = ? AND strftime('%m', tanggal_transaksi) = ?
                AND soft_delete = 0
                AND (id_ref_bku IN (${idList}) OR LOWER(uraian) LIKE '%${uraianKey}%')
                AND (${colFlag} = 1 OR LOWER(uraian) LIKE '${typePattern}')
             `).get(yearStr, monthStr);

            return res?.total || 0;
        };

        const taxTypes = ['ppn', 'pph21', 'pph22', 'pph23', 'pajakDaerah'];
        const values = {
            pungut: {}, // Income
            setor: {}   // Expense
        };

        let totalPungut = 0;
        let totalSetor = 0;

        taxTypes.forEach(t => {
            const vPungut = getTaxValue(t, 'pungut');
            const vSetor = getTaxValue(t, 'setor');
            values.pungut[t] = vPungut;
            values.setor[t] = vSetor;
            totalPungut += vPungut;
            totalSetor += vSetor;
        });

        const prevDebt = currentDebt;
        currentDebt = currentDebt + totalPungut - totalSetor;

        monthlyData.push({
            month: m,
            monthName: MONTHS[m - 1],
            values: {
                ...values,
                totalPungut,
                totalSetor,
                saldoAwal: prevDebt,
                saldoAkhir: currentDebt
            }
        });
    }

    // Rows with Summaries
    const rows = [];

    // Aggregator for period
    const createTaxSummary = (months, label) => {
        let sumPungut = {};
        let sumSetor = {};
        let grandPungut = 0;
        let grandSetor = 0;

        const taxTypes = ['ppn', 'pph21', 'pph22', 'pph23', 'pajakDaerah'];
        taxTypes.forEach(t => {
            sumPungut[t] = months.reduce((acc, r) => acc + r.values.pungut[t], 0);
            sumSetor[t] = months.reduce((acc, r) => acc + r.values.setor[t], 0);
            grandPungut += sumPungut[t];
            grandSetor += sumSetor[t];
        });

        return {
            label,
            isSummary: true,
            values: {
                pungut: sumPungut,
                setor: sumSetor,
                totalPungut: grandPungut,
                totalSetor: grandSetor,
                saldoAwal: months[0].values.saldoAwal, // Start of period
                saldoAkhir: months[months.length - 1].values.saldoAkhir // End of period
            }
        };
    };

    for (let m = 1; m <= 12; m++) {
        rows.push(monthlyData[m - 1]);
        if (m % 3 === 0) rows.push(createTaxSummary(monthlyData.slice((Math.ceil(m / 3) - 1) * 3, m), `TRIWULAN ${m / 3} `));
        if (m === 6) rows.push(createTaxSummary(monthlyData.slice(0, 6), 'SEMESTER 1'));
        if (m === 12) rows.push(createTaxSummary(monthlyData.slice(6, 12), 'SEMESTER 2'));
    }

    rows.push(createTaxSummary(monthlyData, 'JUMLAH 1 TAHUN'));

    return { columns, rows };
}

/**
 * Save signatory data to JSON file
 * Stores in 'data' folder in project root (Portable)
 * @param {string} dbPath - Path to database (ignored)
 * @param {object} data - Signatory data object
 */
function saveSignatoryData(dbPath, data) {
    try {
        const projectRoot = path.resolve(__dirname, '../../');
        const dataDir = path.join(projectRoot, 'data');
        const jsonPath = path.join(dataDir, 'ba_signatory.json');

        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
        return { success: true };
    } catch (error) {
        console.error('[Signatory] Save error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get signatory data from JSON file
 * Reads from 'data' folder in project root
 * @param {string} dbPath - Path to database (ignored)
 */
function getSignatoryData(dbPath) {
    try {
        const projectRoot = path.resolve(__dirname, '../../');
        const dataDir = path.join(projectRoot, 'data');
        const jsonPath = path.join(dataDir, 'ba_signatory.json');

        if (!fs.existsSync(jsonPath)) {
            return {
                success: true,
                data: {
                    pptkNama: '',
                    pptkNip: '',
                    petugasRekonsNama: '',
                    petugasRekonsNip: '',
                    nomorBa: ''
                }
            };
        }

        const content = fs.readFileSync(jsonPath, 'utf8');
        const data = JSON.parse(content);
        return { success: true, data };
    } catch (error) {
        console.error('[Signatory] Load error:', error);
        return { success: false, error: error.message, data: {} };
    }
}


/**
 * Get Audit Data for BA Rekonsiliasi cross-check
 * Returns detailed transaction lists for each BA number
 */
/**
 * Get Audit Data for BA Rekonsiliasi cross-check
 * Returns detailed transaction lists for each BA number
 */
function getBaAuditData(db, year) {
    const yearStr = year.toString();
    const result = {
        income: { regulerT1: [], regulerT2: [], kinerja: [], bunga: [], danaLainnya: [] },
        expenses: { lainnya: [], reguler: [], kinerja: [], silpaKinerja: [] },
        monthly: []
    };

    // Income: Reguler T1
    result.income.regulerT1 = db.prepare(`
        SELECT k.id_kas_umum, k.no_bukti, k.tanggal_transaksi, k.uraian, k.saldo, k.kode_rekening,
               k.id_ref_bku, sd.nama_sumber_dana, sd.id_ref_sumber_dana
        FROM kas_umum k
        LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
        LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
        WHERE strftime('%Y', k.tanggal_transaksi) = ?
          AND k.soft_delete = 0
          AND k.no_bukti LIKE 'BBU%'
          AND (k.uraian LIKE '%Tahap 1%' OR k.uraian LIKE '%T1%')
          AND k.uraian NOT LIKE '%Saldo%'
          AND k.uraian NOT LIKE '%Kinerja%'
          AND (sd.id_ref_sumber_dana IS NULL OR sd.id_ref_sumber_dana NOT IN (12, 35))
        ORDER BY k.tanggal_transaksi
    `).all(yearStr);

    // Income: Reguler T2
    result.income.regulerT2 = db.prepare(`
        SELECT k.id_kas_umum, k.no_bukti, k.tanggal_transaksi, k.uraian, k.saldo, k.kode_rekening,
               k.id_ref_bku, sd.nama_sumber_dana, sd.id_ref_sumber_dana
        FROM kas_umum k
        LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
        LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
        WHERE strftime('%Y', k.tanggal_transaksi) = ?
          AND k.soft_delete = 0
          AND k.no_bukti LIKE 'BBU%'
          AND (k.uraian LIKE '%Tahap 2%' OR k.uraian LIKE '%T2%')
          AND k.uraian NOT LIKE '%Saldo%'
          AND k.uraian NOT LIKE '%Kinerja%'
          AND (sd.id_ref_sumber_dana IS NULL OR sd.id_ref_sumber_dana NOT IN (12, 35))
        ORDER BY k.tanggal_transaksi
    `).all(yearStr);

    // Income: Kinerja
    result.income.kinerja = db.prepare(`
        SELECT k.id_kas_umum, k.no_bukti, k.tanggal_transaksi, k.uraian, k.saldo, k.kode_rekening,
               k.id_ref_bku, sd.nama_sumber_dana, sd.id_ref_sumber_dana
        FROM kas_umum k
        LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
        LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
        WHERE strftime('%Y', k.tanggal_transaksi) = ?
          AND k.soft_delete = 0
          AND k.no_bukti LIKE 'BBU%'
          AND k.uraian NOT LIKE '%Saldo%'
          AND (k.uraian LIKE '%Kinerja%' OR a.id_ref_sumber_dana IN (12, 35))
        ORDER BY k.tanggal_transaksi
    `).all(yearStr);


    // Income: Dana Lainnya (catch all non-categorized penerimaan)
    result.income.danaLainnya = db.prepare(`
        SELECT k.id_kas_umum, k.no_bukti, k.tanggal_transaksi, k.uraian, k.saldo, k.kode_rekening,
               k.id_ref_bku, sd.nama_sumber_dana, sd.id_ref_sumber_dana
        FROM kas_umum k
        LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
        LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
        WHERE strftime('%Y', k.tanggal_transaksi) = ?
          AND k.soft_delete = 0
          AND (k.id_ref_bku = 2 OR k.kode_rekening LIKE '4.%')
          AND k.id_ref_bku NOT IN (5, 33, 10, 11)
          AND k.uraian NOT LIKE '%Saldo%'
          AND k.uraian NOT LIKE '%Kinerja%'
          AND k.uraian NOT LIKE '%Tahap%'
          AND k.uraian NOT LIKE '%T1%'
          AND k.uraian NOT LIKE '%T2%'
        ORDER BY k.tanggal_transaksi
    `).all(yearStr);

    // Income: Bunga
    result.income.bunga = db.prepare(`
        SELECT id_kas_umum, no_bukti, tanggal_transaksi, uraian, saldo, kode_rekening, id_ref_bku
        FROM kas_umum WHERE strftime('%Y', tanggal_transaksi) = ?
          AND soft_delete = 0 AND id_ref_bku = 6
        ORDER BY tanggal_transaksi
    `).all(yearStr);

    // Expenses by fund source
    const expBase = `
        SELECT k.id_kas_umum, k.no_bukti, k.tanggal_transaksi, k.uraian, k.saldo, k.kode_rekening,
               k.id_ref_bku, sd.nama_sumber_dana, sd.id_ref_sumber_dana
        FROM kas_umum k
        LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
        LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
        WHERE strftime('%Y', k.tanggal_transaksi) = ?
          AND k.soft_delete = 0
          AND k.kode_rekening LIKE '5.%'
          AND (k.no_bukti LIKE 'BNU%' OR k.no_bukti LIKE 'BPU%')
          AND sd.id_ref_sumber_dana IN (
    `;
    result.expenses.lainnya = db.prepare(expBase + '5) ORDER BY k.tanggal_transaksi').all(yearStr);
    result.expenses.reguler = db.prepare(expBase + '1,33) ORDER BY k.tanggal_transaksi').all(yearStr);
    result.expenses.kinerja = db.prepare(expBase + '12) ORDER BY k.tanggal_transaksi').all(yearStr);
    result.expenses.silpaKinerja = db.prepare(expBase + '35) ORDER BY k.tanggal_transaksi').all(yearStr);

    // Monthly Summary
    for (let m = 1; m <= 12; m++) {
        const ms = m.toString().padStart(2, "0");
        const p = db.prepare(`
            SELECT SUM(saldo) as total FROM kas_umum
            WHERE strftime('%Y', tanggal_transaksi) = ? AND strftime('%m', tanggal_transaksi) = ?
              AND soft_delete = 0 AND no_bukti LIKE 'BBU%'
        `).get(yearStr, ms);
        const e = db.prepare(`
            SELECT SUM(saldo) as total FROM kas_umum
            WHERE strftime('%Y', tanggal_transaksi) = ? AND strftime('%m', tanggal_transaksi) = ?
              AND soft_delete = 0 AND (no_bukti LIKE 'BNU%' OR no_bukti LIKE 'BPU%') AND kode_rekening LIKE '5.%'
        `).get(yearStr, ms);
        const cp = db.prepare(`
            SELECT COUNT(*) as cnt FROM kas_umum
            WHERE strftime('%Y', tanggal_transaksi) = ? AND strftime('%m', tanggal_transaksi) = ?
              AND soft_delete = 0 AND no_bukti LIKE 'BBU%'
        `).get(yearStr, ms);
        const ce = db.prepare(`
            SELECT COUNT(*) as cnt FROM kas_umum
            WHERE strftime('%Y', tanggal_transaksi) = ? AND strftime('%m', tanggal_transaksi) = ?
              AND soft_delete = 0 AND (no_bukti LIKE 'BNU%' OR no_bukti LIKE 'BPU%') AND kode_rekening LIKE '5.%'
        `).get(yearStr, ms);
        result.monthly.push({
            month: m, monthName: MONTHS[m - 1],
            penerimaan: p?.total || 0, pengeluaran: e?.total || 0,
            countPenerimaan: cp?.cnt || 0, countPengeluaran: ce?.cnt || 0
        });
    }
    return result;
}
module.exports = {
    getReconciliationData,
    getAvailableFundSources,
    getFundSourceDetail,
    getOpeningBalance,
    getIncome,
    getExpenses,
    getCashFlow,
    getBudgetIdsForFund,
    getBungaDetail,
    getPajakDetail,
    saveSignatoryData,
    getSignatoryData
};
