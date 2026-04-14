function getAnggaran(db, year, fundFilterAnggaran) {
  const result = db
    .prepare(
      `
    SELECT SUM(jumlah) as total 
    FROM anggaran a
    JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
    WHERE a.tahun_anggaran = ? 
      AND a.soft_delete = 0 
      AND a.is_approve = 1
      AND a.is_revisi = (
          SELECT MAX(is_revisi) FROM anggaran a2 
          WHERE a2.id_ref_sumber_dana = a.id_ref_sumber_dana 
          AND a2.tahun_anggaran = a.tahun_anggaran
          AND a2.soft_delete = 0
          AND a2.is_approve = 1
      )
    ${fundFilterAnggaran}
  `
    )
    .get(year);

  return result?.total || 0;
}

// NOTE: getPenerimaanMurni is defined below (line ~100) with SEMUA fix

/**
 * Get saldo awal tahun (opening balance)
 * Only for SEMUA - for per-source views, we use a different calculation method
 */
// 1. UPDATED getSaldoAwalTahun
function getSaldoAwalTahun(db, yearStr, fundFilterRealisasi, fundSource) {
  let extraFilter = '';
  if (fundSource === 'BOS Reguler') {
    // Smart Filter: Exclude Kinerja
    extraFilter = `AND id_kas_umum NOT IN (
      SELECT k.id_kas_umum FROM kas_umum k
      JOIN rapbs_periode rp ON k.id_rapbs_periode = rp.id_rapbs_periode
      JOIN rapbs r ON rp.id_rapbs = r.id_rapbs
      JOIN anggaran a ON r.id_anggaran = a.id_anggaran
      JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
      WHERE sd.nama_sumber_dana LIKE '%Kinerja%'
    )`;
  } else if (fundSource && fundSource !== 'SEMUA') {
    return 0;
  }

  const minDateRow = db
    .prepare(
      `
    SELECT MIN(tanggal_transaksi) as d 
    FROM kas_umum 
    WHERE strftime('%Y', tanggal_transaksi) = ?
      AND soft_delete = 0 
      AND id_ref_bku IN (8, 9)
  `
    )
    .get(yearStr);

  if (!minDateRow?.d) return 0;

  const result = db
    .prepare(
      `
    SELECT SUM(saldo) as total 
    FROM kas_umum 
    WHERE tanggal_transaksi = ? 
      AND soft_delete = 0 
      AND id_ref_bku IN (8, 9)
      ${extraFilter}
  `
    )
    .get(minDateRow.d);

  return result?.total || 0;
}

/**
 * Get realisasi belanja (expense realization)
 * Uses proper JOINs through rapbs_periode -> rapbs -> anggaran -> ref_sumber_dana
 */
function getRealisasiBelanja(db, yearStr, fundFilterBelanja, fundSource) {
  // Build WHERE clause for fund source filtering
  let fundWhere = '';
  if (fundSource && fundSource !== 'SEMUA') {
    fundWhere = `AND sd.nama_sumber_dana LIKE '%${fundSource}%'`;
  }

  const result = db
    .prepare(
      `
    SELECT SUM(k.saldo) as total 
    FROM kas_umum k
    LEFT JOIN rapbs_periode rp ON k.id_rapbs_periode = rp.id_rapbs_periode
    LEFT JOIN rapbs r ON rp.id_rapbs = r.id_rapbs
    LEFT JOIN anggaran a ON r.id_anggaran = a.id_anggaran
    LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
    WHERE strftime('%Y', k.tanggal_transaksi) = ? 
      AND k.soft_delete = 0 
      AND k.kode_rekening LIKE '5.%' 
      AND k.id_ref_bku NOT IN (5, 33, 10, 11)
      ${fundWhere}
  `
    )
    .get(yearStr);

  return result?.total || 0;
}

function getPenerimaanMurni(db, yearStr, fundSource, anggaranScope, fundFilterRealisasi) {
  let whereClause = '';

  if (!fundSource || fundSource === 'SEMUA') {
    whereClause = `(
        (id_ref_bku = 2 OR (kode_rekening LIKE '4.%' AND id_ref_bku != 26) OR id_kas_umum = 'RwWBy8ZzdkWLzoFas88C3g')
        AND LOWER(uraian) NOT LIKE '%silpa%'
    )`;
  } else if (fundSource === 'BOS Kinerja') {
    // Use anggaranScope to filter: only penerimaan linked to Kinerja anggaran
    // anggaranScope = id_anggaran IN (SELECT ... WHERE nama_sumber_dana LIKE '%Kinerja%')
    whereClause = `((id_ref_bku = 2 OR kode_rekening LIKE '4.%') AND ${anggaranScope})`;
  } else if (fundSource === 'Lainnya') {
    return 0;
  } else {
    whereClause = `(
      (id_ref_bku = 2 AND saldo != 35000000)
      OR (kode_rekening LIKE '4.%' AND id_ref_bku != 26)
      OR (LOWER(uraian) LIKE '%bunga bank%' OR LOWER(uraian) LIKE '%jasa giro%')
    ) AND LOWER(uraian) NOT LIKE '%silpa%'`;
  }

  const result = db
    .prepare(
      `
    SELECT SUM(saldo) as total 
    FROM kas_umum 
    WHERE strftime('%Y', tanggal_transaksi) = ? 
      AND soft_delete = 0 
      AND ${whereClause}
  `
    )
    .get(yearStr);

  return result?.total || 0;
}

// 3. UPDATED calculateSaldoPerSource (Simplify BOS Reguler)
function calculateSaldoPerSource(db, yearStr, fundSource, anggaran, belanja, globalSaldo) {
  if (!fundSource || fundSource === 'SEMUA') {
    return globalSaldo;
  }

  // BOS Reguler: Use the globalSaldo directly because we've now aligned
  // the inputs (Penerimaan include Bunga, Saldo Awal filters correctly)
  // to match the "Smart Filter" logic.
  if (fundSource === 'BOS Reguler') {
    return globalSaldo;
  }

  let saldo = anggaran - belanja;
  if (saldo < 0) saldo = 0;
  return saldo;
}

/**
 * Get pajak pungut dan setor (tax collected and deposited)
 * Now filters by fund source using JOINs to rapbs/anggaran
 */
function getPajak(db, yearStr, fundFilterRealisasi, fundSource) {
  // Build fund source filter
  let fundWhere = '';
  let joinClause = '';

  if (fundSource && fundSource !== 'SEMUA') {
    joinClause = `
      LEFT JOIN rapbs_periode rp ON k.id_rapbs_periode = rp.id_rapbs_periode
      LEFT JOIN rapbs r ON rp.id_rapbs = r.id_rapbs
      LEFT JOIN anggaran a ON r.id_anggaran = a.id_anggaran
      LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
    `;
    fundWhere = `AND sd.nama_sumber_dana LIKE '%${fundSource}%'`;
  }

  const result = db
    .prepare(
      `
    SELECT
      SUM(CASE 
        WHEN k.id_ref_bku IN(5, 33, 10) AND k.uraian NOT LIKE 'Setor Tunai%' THEN k.saldo 
        ELSE 0 
      END) as pungut,
      SUM(CASE 
        WHEN k.id_ref_bku IN(6, 7, 25, 11) AND k.uraian NOT LIKE '%Bunga%' THEN k.saldo 
        ELSE 0 
      END) as setor
    FROM kas_umum k
    ${joinClause}
    WHERE strftime('%Y', k.tanggal_transaksi) = ? 
      AND k.soft_delete = 0
      ${fundWhere}
  `
    )
    .get(yearStr);

  return {
    pungut: result?.pungut || 0,
    setor: result?.setor || 0,
  };
}

module.exports = {
  getAnggaran,
  getPenerimaanMurni,
  getSaldoAwalTahun,
  getRealisasiBelanja,
  getPajak,
  calculateSaldoPerSource,
};
