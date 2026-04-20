/**
 * Query Builders - SQL filter and clause utilities for dashboard queries
 * Extracted from dashboardHandler.js for maintainability
 */

/**
 * Build anggaran scope filter for a specific fund source
 * @param {string} fundSource - Fund source name (e.g., 'BOS Reguler', 'BOS Kinerja', 'Lainnya')
 * @returns {string} SQL subquery for filtering by budget ID
 */
function buildAnggaranScope(fundSource) {
  if (!fundSource || fundSource === 'SEMUA') {
    return '1=1'; // No filter
  }

  // SMART LOGIC: For BOS Reguler, we include everything EXCEPT Kinerja
  if (fundSource === 'BOS Reguler') {
    return `
        id_anggaran IN (
          SELECT id_anggaran FROM anggaran a
          LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
          WHERE (sd.nama_sumber_dana NOT LIKE '%Kinerja%' OR sd.nama_sumber_dana IS NULL)
        )
      `;
  }

  return `
    id_anggaran IN (
      SELECT id_anggaran FROM anggaran a
      JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
      WHERE sd.nama_sumber_dana LIKE '%${fundSource}%'
    )
  `;
}

/**
 * Build all fund filters for different query types
 */
function buildFundFilters(fundSource, anggaranScope, kinerjaAmount = 0) {
  let fundFilterAnggaran = '';
  let fundFilterRealisasi = '';
  let fundFilterBelanja = '';
  let fundFilterKas = '';
  let extraFilter = '';

  if (fundSource && fundSource !== 'SEMUA') {
    if (fundSource === 'BOS Reguler') {
      fundFilterAnggaran = `AND sd.nama_sumber_dana LIKE '%Reguler%'`;
    } else {
      fundFilterAnggaran = `AND sd.nama_sumber_dana LIKE '%${fundSource}%'`;
    }

    // Income criteria WITHOUT Bunga (Ref 26)
    const incCritNoBunga = `((kode_rekening LIKE '4.%' AND id_ref_bku != 26) OR id_ref_bku IN (2, 14, 28))`;

    // Base: Admin Cash Items
    extraFilter = ` OR (id_ref_bku IN (4, 13) OR uraian LIKE '%ergeseran%' OR uraian LIKE '%Setor Tunai%')`;

    if (fundSource === 'BOS Kinerja') {
      extraFilter += ` OR (${incCritNoBunga} AND saldo < 200000000 AND LOWER(uraian) NOT LIKE '%bunga%' AND LOWER(uraian) NOT LIKE '%jasa giro%')`;
    } else if (fundSource === 'Lainnya') {
      extraFilter += ` OR (LOWER(uraian) LIKE '%bunga%' OR LOWER(uraian) LIKE '%jasa giro%')`;
    } else {
      // BOS Reguler (Smart Mode)
      // We DO NOT exclude Bunga/Jasa Giro anymore, to match user book
      extraFilter += ` OR (${incCritNoBunga} AND saldo != ${kinerjaAmount})`;
    }

    fundFilterRealisasi = `AND ( (${anggaranScope}) ${extraFilter} )`;
    fundFilterBelanja = `AND (${anggaranScope})`;
    fundFilterKas = fundFilterRealisasi;
  }

  return {
    fundFilterAnggaran,
    fundFilterRealisasi,
    fundFilterBelanja,
    fundFilterKas,
    extraFilter,
  };
}

/**
 * Build chart CASE statements based on fund source
 */
function buildChartCases(fundSource, anggaranScope, kinerjaAmount = 0) {
  let chartWhereClause = '';
  let pengeluaranCase, penerimaanCase, mutasiNettoCase;

  // Extra filter for chart
  let extraFilter = '';
  if (fundSource === 'BOS Kinerja') {
    extraFilter = `(id_ref_bku IN (4, 13) OR uraian LIKE '%ergeseran%' OR uraian LIKE '%Setor Tunai%')`;
    extraFilter += ` OR (id_ref_bku IN (3, 4, 9, 10, 11, 13, 33) OR ((id_ref_bku = 2 AND ${anggaranScope}) OR (kode_rekening LIKE '4.%' AND ${anggaranScope}) OR (id_ref_bku IN (7, 8, 26, 28) AND (uraian LIKE '%SiLpa%' OR uraian LIKE '%Bunga%' OR uraian LIKE '%Jasa Giro%') AND uraian NOT LIKE 'Saldo Awal%')))`;
  } else if (fundSource === 'BOS Reguler') {
    // Smart Reguler: Include almost everything (Cash ops, etc)
    extraFilter = `(id_ref_bku IN (4, 13) OR uraian LIKE '%ergeseran%' OR uraian LIKE '%Setor Tunai%')`;
    extraFilter += ` OR (id_ref_bku = 2 OR kode_rekening LIKE '4.%' OR uraian LIKE '%Bunga%' OR uraian LIKE '%SiLpa%')`;
  } else if (fundSource === 'Lainnya') {
    extraFilter = `(LOWER(uraian) LIKE '%bunga%' OR LOWER(uraian) LIKE '%jasa giro%')`;
  } else {
    extraFilter = `(id_ref_bku IN (4, 13) OR uraian LIKE '%ergeseran%' OR uraian LIKE '%Setor Tunai%')`;
    extraFilter += ` OR (id_ref_bku = 2 OR kode_rekening LIKE '4.%')`;
  }

  if (fundSource === 'Lainnya') {
    chartWhereClause = '';
    pengeluaranCase = `SUM(CASE WHEN kode_rekening LIKE '5.%' AND id_ref_bku NOT IN(5, 33, 10, 11) AND ${anggaranScope} THEN saldo ELSE 0 END)`;
    penerimaanCase = `SUM(CASE WHEN (LOWER(uraian) LIKE '%bunga%' OR LOWER(uraian) LIKE '%jasa giro%') THEN saldo ELSE 0 END)`;
    mutasiNettoCase = `SUM(CASE 
          WHEN (LOWER(uraian) LIKE '%bunga%' OR LOWER(uraian) LIKE '%jasa giro%') THEN saldo
          WHEN kode_rekening LIKE '5.%' AND id_ref_bku NOT IN(5, 33, 10, 11) AND ${anggaranScope} THEN -saldo
          ELSE 0 
        END)`;
  } else if (fundSource === 'SEMUA' || !fundSource) {
    chartWhereClause = '';
    pengeluaranCase = `SUM(CASE WHEN kode_rekening LIKE '5.%' AND id_ref_bku NOT IN(5, 33, 10, 11) THEN saldo ELSE 0 END)`;
    penerimaanCase = `SUM(CASE WHEN (id_ref_bku = 2 OR (kode_rekening LIKE '4.%' AND id_ref_bku != 26)) AND id_ref_bku NOT IN(5, 33, 10, 11) THEN saldo ELSE 0 END)`;
    mutasiNettoCase = `SUM(CASE 
          WHEN id_ref_bku = 2 OR (kode_rekening LIKE '4.%' AND id_ref_bku != 26) THEN saldo
          WHEN kode_rekening LIKE '5.%' AND id_ref_bku NOT IN(5, 33, 10, 11) THEN -saldo
          ELSE 0 
        END)`;
  } else if (fundSource === 'BOS Kinerja') {
    chartWhereClause = '';
    pengeluaranCase = `SUM(CASE WHEN kode_rekening LIKE '5.%' AND id_ref_bku NOT IN(5, 33, 10, 11) AND ${anggaranScope} THEN saldo ELSE 0 END)`;
    penerimaanCase = `SUM(CASE WHEN (id_ref_bku = 2 OR kode_rekening LIKE '4.%') AND id_ref_bku NOT IN(5, 33, 10, 11) AND ${anggaranScope} THEN saldo ELSE 0 END)`;
    mutasiNettoCase = `SUM(CASE 
          WHEN (id_ref_bku = 2 OR kode_rekening LIKE '4.%') AND ${anggaranScope} THEN saldo
          WHEN kode_rekening LIKE '5.%' AND id_ref_bku NOT IN(5, 33, 10, 11) AND ${anggaranScope} THEN -saldo
          ELSE 0 
        END)`;
  } else {
    // BOS Reguler (Smart Mode)
    chartWhereClause = `AND ((${anggaranScope}) OR (${extraFilter}))`;

    // Expenses: Rely on Anggaran Scope (which is NOT Kinerja)
    pengeluaranCase = `SUM(CASE WHEN kode_rekening LIKE '5.%' AND id_ref_bku NOT IN(5, 33, 10, 11) THEN saldo ELSE 0 END)`;

    // Revenue: Include Bunga / SiLPA, Exclude Kinerja explicitly if needed (though Anggaran Scope helps)
    // But for explicit exclusion of 35M:
    penerimaanCase = `SUM(CASE 
          WHEN (kode_rekening LIKE '4.%' OR id_ref_bku = 2 OR uraian LIKE '%Bunga%' OR uraian LIKE '%SiLpa%') 
               AND id_ref_bku NOT IN(5, 33, 10, 11) 
               AND saldo != ${kinerjaAmount} 
          THEN saldo
          ELSE 0 END)`;

    mutasiNettoCase = `SUM(CASE 
          WHEN (kode_rekening LIKE '4.%' OR id_ref_bku = 2 OR uraian LIKE '%Bunga%' OR uraian LIKE '%SiLpa%') 
               AND saldo != ${kinerjaAmount} 
          THEN saldo
          WHEN kode_rekening LIKE '5.%' AND id_ref_bku NOT IN(5, 33, 10, 11) THEN -saldo
          ELSE 0 
        END)`;
  }

  return {
    chartWhereClause,
    pengeluaranCase,
    penerimaanCase,
    mutasiNettoCase,
    extraFilter,
  };
}

/**
 * Build ref2 filter for penerimaan based on fund source
 * @param {string} fundSource - Fund source name
 * @param {string} anggaranScope - Pre-built anggaran scope
 * @returns {string} SQL filter for ref 2 transactions
 */
function buildRef2Filter(fundSource, anggaranScope) {
  if (fundSource === 'BOS Kinerja' || fundSource === 'BOS Reguler') {
    return `(id_ref_bku = 2 AND ${anggaranScope})`;
  }
  return 'id_ref_bku = 2';
}

module.exports = {
  buildAnggaranScope,
  buildFundFilters,
  buildChartCases,
  buildRef2Filter,
};
