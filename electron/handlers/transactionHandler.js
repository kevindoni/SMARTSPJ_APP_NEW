/**
 * Transaction Handler
 * Contains core logic for fetching and processing BKU transactions
 */
const path = require('path');
const TAX_RATES = require('../config/tax-rates');

/**
 * Fetch transactions with complex filtering and calculations
 * @param {Object} db - Database connection
 * @param {Object} params - Query parameters (year, month, fundSource, limit, offset, search)
 * @returns {Array} List of transactions
 */
function getTransactions(db, params, overrides = {}) {
  const yearStr = (params.year || 2025).toString();
  const limit = params.limit || 50;
  const offset = params.offset || 0;

  let budgetSourceFilter = ''; // For anggaran query (no k. alias)
  let transactionSourceFilter = ''; // For kas_umum query (has k. alias)

  if (params.fundSource && params.fundSource !== 'SEMUA') {
    if (params.fundSource === 'BOS Reguler') {
      // Budget filter: Only get Reguler budgets
      budgetSourceFilter = `AND sd.nama_sumber_dana LIKE '%Reguler%'`;
      // Transaction filter: Also include admin transactions but exclude Lainnya balances
      transactionSourceFilter = `AND (
                sd.nama_sumber_dana LIKE '%Reguler%'
                OR (sd.nama_sumber_dana IS NULL 
                    AND k.kode_rekening NOT LIKE '03.05.%'
                    AND k.id_ref_bku IN (2, 3, 4, 5, 6, 7, 8, 9, 10, 11))
            )`;
    } else if (params.fundSource === 'Lainnya') {
      budgetSourceFilter = `AND sd.nama_sumber_dana LIKE '%Lainnya%'`;
      transactionSourceFilter = `AND (sd.nama_sumber_dana LIKE '%Lainnya%' OR k.kode_rekening LIKE '03.05.%')`;
    } else {
      budgetSourceFilter = `AND sd.nama_sumber_dana LIKE '%${params.fundSource}%'`;
      transactionSourceFilter = `AND sd.nama_sumber_dana LIKE '%${params.fundSource}%'`;
    }
  }

  const budgetQuery = `
        SELECT a.id_anggaran 
        FROM anggaran a
        LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
        WHERE a.tahun_anggaran = ? 
          AND a.is_approve = 1 
          AND a.soft_delete = 0
          ${budgetSourceFilter}
          AND a.is_revisi = (
                SELECT MAX(is_revisi) 
                FROM anggaran a2 
                WHERE a2.tahun_anggaran = a.tahun_anggaran 
                  AND a2.id_ref_sumber_dana = a.id_ref_sumber_dana
                  AND a2.soft_delete = 0
                  AND a2.is_approve = 1
          )
    `;
  const validBudgetIds = db
    .prepare(budgetQuery)
    .all(yearStr)
    .map((r) => r.id_anggaran);

  const idList = validBudgetIds.length > 0 ? validBudgetIds.map((id) => `'${id}'`).join(',') : "''";
  const allowNullBudget =
    !params.fundSource || params.fundSource === 'SEMUA' || params.fundSource === 'BOS Reguler';

  // Build Search Filter
  let searchFilter = '';
  if (params.search) {
    const term = params.search.replace(/'/g, "''"); // Escape single quotes
    searchFilter = `AND (
            k.uraian LIKE '%${term}%' OR 
            k.no_bukti LIKE '%${term}%' OR
            k.kode_rekening LIKE '%${term}%' OR
            am.code LIKE '%${term}%'
        )`;
  }

  let query = `
        WITH ActivityMap AS (
            -- Pre-calculate unique activity codes per budget ID
            SELECT r.id_anggaran, MIN(rk.id_kode) as code
            FROM rapbs r
            JOIN ref_kode rk ON r.id_ref_kode = rk.id_ref_kode
            GROUP BY r.id_anggaran
        ),
        BaseData AS (
            SELECT 
                MIN(k.rowid) as sort_order,
                MIN(k.id_kas_umum) as id_kas_umum,
                DATE(k.tanggal_transaksi) as normalized_date,
                MIN(k.tanggal_transaksi) as tanggal_transaksi,
                COALESCE(NULLIF(TRIM(k.no_bukti), '-'), '') as no_bukti,
                k.uraian,
                -- SMART TAX AMOUNT: For tax records (10,11) with saldo=0, calculate from rapbs_periode
                CASE 
                    WHEN k.id_ref_bku IN (10, 11) AND k.saldo = 0 THEN (
                        -- Get base amount: Try rapbs_periode.harga_satuan first (for Honorarium)
                        COALESCE(
                            (SELECT rp.harga_satuan FROM rapbs_periode rp WHERE rp.id_rapbs_periode = k.id_rapbs_periode LIMIT 1),
                            (SELECT p.saldo FROM kas_umum p WHERE p.id_kas_umum = k.parent_id_kas_umum LIMIT 1),
                            (SELECT s.saldo FROM kas_umum s 
                             WHERE s.id_kas_nota = k.id_kas_nota 
                               AND s.id_ref_bku NOT IN (10, 11, 12, 13)
                               AND s.soft_delete = 0 LIMIT 1),
                            0
                        )
                        -- Apply tax rate based on type (check specific flags FIRST)
                        * CASE 
                            -- PPh 21: 6% for Non-PNS tanpa NPWP, 5% default
                            WHEN k.is_pph_21 = 1 AND k.uraian_pajak LIKE '%tidak memiliki NPWP%' THEN 0.06
                            WHEN k.is_pph_21 = 1 THEN 0.05
                            -- PPN 11%
                            WHEN k.is_ppn = 1 THEN 0.11
                            -- PPh 23: Check for explicit % in uraian, then default 2%
                            WHEN k.is_pph_23 = 1 AND k.uraian LIKE '%4%' THEN 0.04
                            WHEN k.is_pph_23 = 1 THEN 0.02
                            -- PPh 4 default 2%
                            WHEN k.is_pph_4 = 1 THEN 0.02
                            -- Fallback
                            ELSE 0.05 
                        END
                    )
                    ELSE k.saldo
                END as nominal,
                k.kode_rekening,
                k.id_ref_bku,
                -- TAX FLAGS
                MAX(k.is_ppn) as is_ppn,
                MAX(k.is_pph_21) as is_pph_21,
                MAX(k.is_pph_22) as is_pph_22,
                MAX(k.is_pph_23) as is_pph_23,
                MAX(k.is_pph_4) as is_pph_4,
                MAX(k.is_sspd) as is_sspd,
                
                MAX(sd.nama_sumber_dana) as nama_sumber_dana,
                MAX(am.code) as activity_code,
                -- METADATA TOKO & NOTA
                MAX(kn.nama_toko) as nama_toko,
                MAX(kn.alamat_toko) as alamat_toko,
                MAX(kn.no_telp) as no_telp_toko,
                MAX(kn.no_nota) as no_invoice,
                MAX(kn.is_badan_usaha) as is_badan_usaha,
                MAX(kn.is_beli_di_siplah) as is_siplah,
                
                -- DETEKTIF PAJAK (TOOLTIP MODE SECURE): Pakai Separator Unik
                CASE 
                    WHEN k.id_ref_bku IN (10, 11) THEN (
                        SELECT GROUP_CONCAT(clean_uraian, ' ||| ') 
                        FROM (
                            SELECT DISTINCT ua.uraian as clean_uraian
                            FROM kas_umum ua 
                            WHERE ua.id_ref_bku NOT IN (10,11,12,13,28)
                              AND ua.kode_rekening = k.kode_rekening
                              AND (
                                   (ua.id_kas_nota IS NOT NULL AND ua.id_kas_nota = k.id_kas_nota)
                                   OR 
                                   (k.id_kas_nota IS NULL AND ua.tanggal_transaksi = k.tanggal_transaksi AND (ua.no_bukti = k.no_bukti OR ua.no_bukti IS NOT NULL))
                              )
                        )
                    )
                    ELSE NULL 
                END as uraian_induk,

                CASE 
                    -- 1. Initial Balances (Jan or Dec start)
                    WHEN k.uraian LIKE '%Saldo%' AND (SUBSTR(k.tanggal_transaksi, 1, 7) LIKE '%-01' OR k.uraian LIKE '%Desember%') THEN k.saldo
                    WHEN k.uraian LIKE '%Saldo%' THEN 0
                    
                    -- 2. Strict Expense Prefix Priority: BPU (Pengeluaran), BNU (Nota)
                    WHEN k.no_bukti LIKE 'BPU%' OR k.no_bukti LIKE 'BNU%' THEN -k.saldo
                    
                    -- 3. Receipts (Positive): 2=BOSP, 4=Setor Tunai (ke Bank), 10=Pungut Pajak, 12=Giro, 14=Pindahan+, 26/28=Bunga
                    WHEN k.id_ref_bku IN (2, 4, 10, 12, 14, 26, 28) THEN k.saldo
                    WHEN (k.uraian LIKE '%Terima%' OR k.uraian LIKE '%Penerimaan%' OR k.uraian LIKE '%Bunga Bank%' OR k.uraian LIKE '%Pergeseran%') AND k.id_ref_bku NOT IN (1, 3, 5, 11, 13) THEN k.saldo
                    
                    -- 4. Expenses (Negative): 1=Belanja, 3=Tarik Tunai (dari Bank), 5=Panjar (BPU), 11=Setor Pajak, 13=Pindahan-
                    WHEN k.id_ref_bku IN (1, 3, 5, 11, 13) THEN -k.saldo
                    WHEN k.no_bukti LIKE 'BPU%' OR k.no_bukti LIKE 'BNU%' THEN -k.saldo  -- CRITICAL: Catch all BPU/BNU as Expenses
                    WHEN k.uraian LIKE '%Tarik Tunai%' OR k.uraian LIKE '%Setor Pajak%' OR k.uraian LIKE '%Setor%' OR k.uraian LIKE '%Biaya Admin%' THEN -k.saldo
                    
                    -- DEFAULT FAIL-SAFE: Anything not explicitly an Expense is INCOME
                    ELSE k.saldo
                END as signed_amount,
                MAX(rr.rekening) as nama_rekening
            FROM kas_umum k
            LEFT JOIN ActivityMap am ON k.id_anggaran = am.id_anggaran
            LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
            LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
            LEFT JOIN ref_rekening rr ON k.kode_rekening = rr.kode_rekening AND rr.tahun = a.tahun_anggaran
            LEFT JOIN kas_umum_nota kn ON k.id_kas_nota = kn.id_kas_nota  -- JOIN TABEL NOTA
            WHERE k.soft_delete = 0 
              AND k.tanggal_transaksi LIKE ?
              -- Removed strict Budget ID check to include transactions from previous revisions
              ${transactionSourceFilter}
              ${searchFilter}
            -- CONDITIONAL GROUP BY: Merge "System" dupes, Keep "User" items distinct
            GROUP BY 
                CASE 
                    WHEN (k.uraian LIKE '%Saldo%' OR k.uraian LIKE '%Bunga Bank%' OR k.uraian LIKE '%Pajak Bunga%' OR k.uraian LIKE '%Jasa Giro%') 
                    THEN 'MERGE_SYSTEM_ITEMS' 
                    ELSE k.id_kas_umum 
                END,
                UPPER(TRIM(k.uraian)), 
                DATE(k.tanggal_transaksi), 
                k.saldo,
                CASE WHEN k.id_kas_nota IS NOT NULL THEN k.id_kas_nota ELSE 'NO_NOTA' END
        )
        SELECT 
            sort_order,
            id_kas_umum,
            normalized_date,
            tanggal_transaksi,
            no_bukti,
            -- Smart Uraian: Append Source Info for Taxes (ID 10=Pungut, 11=Setor)
            -- Smart Uraian: Append Source Info for Taxes (ID 10=Pungut, 11=Setor)
            CASE 
                WHEN id_ref_bku IN (10, 11) AND uraian_induk IS NOT NULL AND uraian_induk != '' 
                THEN uraian || ' (' || REPLACE(uraian_induk, ' ||| ', ', ') || ')'
                ELSE uraian 
            END as uraian,
            nominal,
            kode_rekening,
            id_ref_bku,
            nama_sumber_dana,
            nama_rekening,
            activity_code,
            nama_toko,
            alamat_toko,
            no_telp_toko,
            no_invoice,
            is_badan_usaha,
            is_siplah,
            is_ppn,
            is_pph_21,
            is_pph_22,
            is_pph_23,
            is_pph_4,
            is_sspd,
            signed_amount
        FROM BaseData
        ORDER BY normalized_date ASC, sort_order ASC
    `;

  // Handle Month Filter
  let monthPattern =
    params.month === 'SEMUA'
      ? `${yearStr}-%`
      : `${yearStr}-${params.month.toString().padStart(2, '0')}-%`;
  let rows = db.prepare(query).all(monthPattern);

  // Apply strict "Month Only" filter if not "SEMUA" because LIKE '%-01-%' might catch '2025-01-01' and '2025-11-01' if just using %1%
  if (params.month !== 'SEMUA') {
    const strictMonth = params.month.toString().padStart(2, '0');
    rows = rows.filter((r) => {
      const m = r.tanggal_transaksi.substring(5, 7);
      return m === strictMonth;
    });
  }

  // Apply Filter Types (Dropdown)
  if (params.filterType && Array.isArray(params.filterType) && params.filterType.length > 0) {
    rows = rows.filter((r) => {
      const uraian = (r.uraian || '').toLowerCase();
      const idBku = r.id_ref_bku;

      return params.filterType.some((type) => {
        if (type === 'PAJAK_PUNGUT') return idBku === 10;
        if (type === 'PAJAK_SETOR') return idBku === 11;

        if (type === 'BUNGA') {
          // ID 12=Giro, 26,28=Bunga Bank
          return (
            [12, 26, 28].includes(idBku) ||
            uraian.includes('bunga bank') ||
            uraian.includes('jasa giro')
          );
        }

        if (type === 'PAJAK_BUNGA') {
          return (
            uraian.includes('pajak bunga') ||
            uraian.includes('biaya admin') ||
            uraian.includes('adm bank')
          );
        }

        if (type === 'SALDO') {
          // ID 3=Tarik Tunai, 4=Setor Tunai, 13=Pindahan-, 14=Pindahan+
          return (
            [3, 4, 13, 14].includes(idBku) ||
            uraian.includes('saldo') ||
            uraian.includes('pindahan') ||
            uraian.includes('pergeseran') ||
            uraian.includes('tarik tunai') ||
            uraian.includes('setor tunai')
          );
        }

        if (type === 'TRANSAKSI') {
          // Everything else (Belanja, BOSP, BPU, etc.)
          const excludedIds = [3, 4, 10, 11, 12, 13, 14, 26, 28];
          const isExcludedId = excludedIds.includes(idBku);

          const isBungaText = uraian.includes('bunga bank') || uraian.includes('jasa giro');
          const isPajakBungaText =
            uraian.includes('pajak bunga') ||
            uraian.includes('biaya admin') ||
            uraian.includes('adm bank');
          const isSaldoText =
            uraian.includes('saldo') ||
            uraian.includes('pindahan') ||
            uraian.includes('pergeseran') ||
            uraian.includes('tarik tunai') ||
            uraian.includes('setor tunai');

          return !isExcludedId && !isBungaText && !isPajakBungaText && !isSaldoText;
        }
        return false;
      });
    });
  }

  // Apply Payment Type Filter (TUNAI/BANK)
  if (params.paymentType === 'TUNAI') {
    rows = rows.filter((r) => {
      const noBukti = (r.no_bukti || '').toUpperCase();
      const uraian = (r.uraian || '').toLowerCase();
      const idBku = r.id_ref_bku;

      const isTunaiById = [3, 4, 9].includes(idBku);
      const isBPU = noBukti.startsWith('BPU');
      const hasTunaiKeyword =
        uraian.includes('tunai') ||
        uraian.includes('tarik tunai') ||
        uraian.includes('setor tunai');

      return isTunaiById || isBPU || hasTunaiKeyword;
    });
  } else if (params.paymentType === 'BANK') {
    rows = rows.filter((r) => {
      const noBukti = (r.no_bukti || '').toUpperCase();
      const uraian = (r.uraian || '').toLowerCase();
      const idBku = r.id_ref_bku;

      const isSaldoTunai = idBku === 9;
      const isBPU = noBukti.startsWith('BPU');

      const isTarikSetor = uraian.includes('tarik tunai') || uraian.includes('setor tunai');
      const hasOtherTunaiKeyword = uraian.includes('tunai') && !isTarikSetor;
      const isPergeseranBank = uraian.includes('pergeseran uang di bank');
      // Exclude Pungut (10) and Setor (11) to avoid inflation (wash transactions)
      const isPajakWash = [10, 11].includes(idBku);

      return !isSaldoTunai && !isBPU && !hasOtherTunaiKeyword && !isPergeseranBank && !isPajakWash;
    });
  } else if (params.paymentType === 'PAJAK') {
    rows = rows.filter((r) => {
      const idBku = r.id_ref_bku;
      const uraian = (r.uraian || '').toLowerCase();

      const isTaxId = [5, 6, 7, 10, 11, 25, 33].includes(idBku);

      // Exclusion rules from statsQueries.js
      const isExcludedText =
        uraian.startsWith('setor tunai') || // ID 5 exclusion
        uraian.includes('bunga') || // ID 6,7,25 exclusion
        uraian.includes('tarik tunai'); // Exclude cash withdrawals too

      // Backup text matching
      const isTaxText = uraian.includes('pungut pajak') || uraian.includes('setor pajak');

      return (isTaxId && !isExcludedText) || isTaxText;
    });
  }

  if (overrides && Object.keys(overrides).length > 0) {
    rows.forEach((row) => {
      if (overrides[row.id_kas_umum]) {
        row.no_bukti = overrides[row.id_kas_umum];
      }
    });
  }

  const total = rows.length;
  let paginatedRows = rows;

  if (limit > 0) {
    paginatedRows = rows.slice(offset, offset + limit);
  }

  return {
    rows: paginatedRows,
    total,
  };
}

/**
 * Merges multiple transactions into a single proof number (No Bukti).
 * Updates 'kas_umum' table directly.
 *
 * @param {Database} db
 * @param {Array<string>} idList - List of id_kas_umum to update
 * @param {string} targetNoBukti - The new proof number
 */
function mergeTransactions(db, idList, targetNoBukti) {
  if (!idList || idList.length === 0) throw new Error('No transactions selected');
  if (!targetNoBukti) throw new Error('Target No Bukti is required');

  // Prepare placeholders for IN clause
  const placeholders = idList.map(() => '?').join(',');

  try {
    const query = `
            UPDATE kas_umum 
            SET no_bukti = ? 
            WHERE id_kas_umum IN (${placeholders})
        `;

    const stmt = db.prepare(query);
    // Bind targetNoBukti first, then all IDs
    const result = stmt.run(targetNoBukti, ...idList);

    return { updatedCount: result.changes };
  } catch (error) {
    console.error('Merge error:', error);
    throw error;
  }
}

function getTransactionsByProof(db, no_bukti, year, overrides = {}) {
  // 1. Find IDs in overrides that map to this virtual no_bukti
  const virtualIds = Object.keys(overrides).filter((id) => overrides[id] === no_bukti);

  // 2. Fetch those virtual rows
  let virtualRows = [];
  if (virtualIds.length > 0) {
    virtualRows = getTransactionsByIds(db, virtualIds);
    virtualRows.forEach((r) => (r.no_bukti = no_bukti));
  }

  const query = `
        SELECT 
            k.id_kas_umum,
            k.no_bukti,
            k.uraian,
            k.nilai_bersih as nominal, -- nilai_bersih or total_nilai? Usually 'nilai_bersih' is final. No, 'total_nilai' or 'nilai_bersih'? Let's check schema. Typically 'nominal' = nilai_bersih + pajak if separate? 
            -- Actually, let's use the field 'k.nilai_bersih' as nominal for now, or match getTransactions logic.
            -- getTransactions uses CTEs. Let's try a simpler approach for aggregation.
            k.total_nilai,
            k.pajak_negara as ppn, -- Assuming column mapping
            k.id_ref_sumber_dana,
            k.kode_rekening,
            k.id_kas_nota
        FROM kas_umum k
        WHERE k.no_bukti = ?
          AND k.soft_delete = 0
          -- Filter by year? Assume No Bukti is unique enough or context year provided
    `;

  const sumQuery = `
        SELECT 
            SUM(kn.total) as total_nominal, -- Check if nilai_bersih includes tax?
            -- Actually in ARKAS, often 'nilai_bersih' is what we paid? 
            -- Let's stick to the 'nominal' logic from getTransactions:
            -- It calculates nominal dynamically.
            
            -- Let's just fetch ALL columns for these rows and process in JS
             k.*,
             kn.nama_toko, kn.alamat_toko, kn.no_telp, kn.is_badan_usaha
        FROM kas_umum k
        LEFT JOIN kas_umum_nota kn ON k.id_kas_nota = kn.id_kas_nota
        WHERE k.no_bukti = ? 
          AND k.soft_delete = 0
        GROUP BY k.id_kas_umum
    `;

  const naturalRows = db.prepare(sumQuery).all(no_bukti);
  const validNaturalRows = naturalRows.filter((r) => !overrides[r.id_kas_umum]);
  return [...virtualRows, ...validNaturalRows];
}

/**
 * Fetches transactions by a list of IDs.
 * Used for 'Virtual Merge' printing (without modifying DB).
 */
function getTransactionsByIds(db, idList) {
  if (!idList || idList.length === 0) return [];

  const placeholders = idList.map(() => '?').join(',');

  // Fetch detailed info for aggregation
  const query = `
        SELECT 
             k.*,
             kn.nama_toko, kn.alamat_toko, kn.no_telp, kn.is_badan_usaha,
             kn.tanggal_nota,
             rr.rekening as nama_rekening,
             k.saldo as nominal
        FROM kas_umum k
        LEFT JOIN kas_umum_nota kn ON k.id_kas_nota = kn.id_kas_nota
        LEFT JOIN anggaran a ON k.id_anggaran = a.id_anggaran
        LEFT JOIN ref_rekening rr ON k.kode_rekening = rr.kode_rekening AND rr.tahun = a.tahun_anggaran
        WHERE k.id_kas_umum IN (${placeholders})
          AND k.soft_delete = 0
        GROUP BY k.id_kas_umum
    `;

  return db.prepare(query).all(...idList);
}

module.exports = {
  getTransactions,
  mergeTransactions,
  getTransactionsByProof,
  getTransactionsByIds,
};
