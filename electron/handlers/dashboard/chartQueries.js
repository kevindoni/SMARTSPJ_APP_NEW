/**
 * Chart Queries - Chart data and composition queries
 * Handles: Monthly chart data, expense composition
 * All queries filter by fund source using JOINs
 */

/**
 * Get monthly chart data with income, expenses, and cash flows
 * Filters by fund source for expenses via rapbs/anggaran JOINs
 */
function getChartData(db, yearStr, chartConfig, fundSource) {
  // Dynamic Kinerja amount
  const { getKinerjaAnggaranTotal } = require('./statsQueries');
  const kinerjaAmount = getKinerjaAnggaranTotal(db, parseInt(yearStr) || yearStr);

  // Build fund source filter for expenses
  let fundJoin = '';
  let fundWhere = '';

  const isFiltered = fundSource && fundSource !== 'SEMUA';

  if (isFiltered) {
    fundJoin = `
      LEFT JOIN rapbs_periode rp ON k.id_rapbs_periode = rp.id_rapbs_periode
      LEFT JOIN rapbs r ON rp.id_rapbs = r.id_rapbs
      LEFT JOIN anggaran a ON r.id_anggaran = a.id_anggaran
      LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
    `;

    // Strict Income Filtering based on Fund Source Heuristics
    let incomeFilter = "OR k.kode_rekening NOT LIKE '5.%'"; // Default loose

    if (fundSource === 'BOS Kinerja') {
      // Income strictly 35jt (Transfer Kinerja)
      incomeFilter = `OR (k.id_ref_bku = 2 AND k.saldo = ${kinerjaAmount})`;
    } else if (fundSource === 'BOS Reguler') {
      // Income NOT 35jt (Not Kinerja) AND Not Interest (Not Lainnya)
      incomeFilter = `OR (
        (k.id_ref_bku = 2 AND k.saldo != ${kinerjaAmount} AND LOWER(k.uraian) NOT LIKE '%bunga%' AND LOWER(k.uraian) NOT LIKE '%jasa giro%')
        OR 
        (k.kode_rekening LIKE '4.%' AND k.id_ref_bku != 26 AND LOWER(k.uraian) NOT LIKE '%bunga%' AND LOWER(k.uraian) NOT LIKE '%jasa giro%')
      )`;
    }

    // FIX: For tunai_masuk/keluar, we need to include transactions even if they don't have a fund source
    // BPU transactions (cash expenses) should always be counted
    fundWhere = `AND (
      sd.nama_sumber_dana LIKE '%${fundSource}%' 
      ${incomeFilter}
      OR (k.no_bukti LIKE 'BPU%' AND sd.nama_sumber_dana IS NULL)
      OR k.id_ref_bku = 3
    )`;
  }

  // For SEMUA: include ALL income types (including bunga bank BKU 26, BKU 8, BKU 28)
  // For filtered: exclude BKU 26 (bunga) which belongs to Lainnya
  const bku26Exclude = isFiltered ? ' AND k.id_ref_bku != 26' : '';

  const query = `
    SELECT
      strftime('%m', k.tanggal_transaksi) as bulan,
      SUM(CASE WHEN k.kode_rekening LIKE '5.%' AND k.id_ref_bku NOT IN(5, 33, 10, 11) THEN k.saldo ELSE 0 END) as pengeluaran,
      SUM(CASE WHEN (k.id_ref_bku = 2 OR (k.kode_rekening LIKE '4.%'${bku26Exclude}))
                AND k.id_ref_bku NOT IN(5, 33, 10, 11) 
           THEN k.saldo ELSE 0 END) as penerimaan,
      SUM(CASE 
        WHEN (k.id_ref_bku = 2 OR (k.kode_rekening LIKE '4.%'${bku26Exclude})) THEN k.saldo
        WHEN k.kode_rekening LIKE '5.%' AND k.id_ref_bku NOT IN(5, 33, 10, 11) THEN -k.saldo
        ELSE 0 
      END) as mutasi_netto,
      -- Tunai calculations should be GLOBAL (not filtered by fund source)
      -- because cash is shared across all fund sources
      (SELECT COALESCE(SUM(CASE WHEN k2.id_ref_bku = 3 THEN k2.saldo ELSE 0 END), 0) 
       FROM kas_umum k2 
       WHERE strftime('%m', k2.tanggal_transaksi) = strftime('%m', k.tanggal_transaksi)
         AND strftime('%Y', k2.tanggal_transaksi) = strftime('%Y', k.tanggal_transaksi)
         AND k2.soft_delete = 0
      ) as tunai_masuk,
      (SELECT COALESCE(SUM(CASE WHEN k2.no_bukti LIKE 'BPU%' AND k2.kode_rekening LIKE '5.%' THEN k2.saldo ELSE 0 END), 0)
       FROM kas_umum k2
       WHERE strftime('%m', k2.tanggal_transaksi) = strftime('%m', k.tanggal_transaksi)
         AND strftime('%Y', k2.tanggal_transaksi) = strftime('%Y', k.tanggal_transaksi)
         AND k2.soft_delete = 0
      ) as tunai_keluar
    FROM kas_umum k
    ${fundJoin}
    WHERE strftime('%Y', k.tanggal_transaksi) = ?
      AND k.soft_delete = 0
      AND (k.saldo > 0 OR k.id_ref_bku IN(8, 9))
      ${fundWhere}
    GROUP BY bulan
    ORDER BY bulan
  `;

  return db.prepare(query).all(yearStr);
}

/**
 * Get expense composition by category
 * Filters by fund source using JOINs
 */
function getComposition(db, yearStr, fundFilterBelanja, fundSource) {
  // Build fund source filter
  let fundJoin = '';
  let fundWhere = '';

  if (fundSource && fundSource !== 'SEMUA') {
    fundJoin = `
      LEFT JOIN rapbs_periode rp ON k.id_rapbs_periode = rp.id_rapbs_periode
      LEFT JOIN rapbs r ON rp.id_rapbs = r.id_rapbs
      LEFT JOIN anggaran a ON r.id_anggaran = a.id_anggaran
      LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
    `;
    fundWhere = `AND sd.nama_sumber_dana LIKE '%${fundSource}%'`;
  }

  const composition = db
    .prepare(
      `
    SELECT
      substr(k.kode_rekening, 1, 6) as kategori,
      SUM(k.saldo) as total
    FROM kas_umum k
    ${fundJoin}
    WHERE strftime('%Y', k.tanggal_transaksi) = ?
      AND k.soft_delete = 0
      AND k.saldo > 0
      AND k.kode_rekening LIKE '5.%'
      AND k.id_ref_bku NOT IN(5, 33, 10, 11)
      ${fundWhere}
    GROUP BY kategori
  `
    )
    .all(yearStr);

  // Category name mapping
  const namaMap = {
    '5.1.01': 'Belanja Pegawai',
    '5.1.02': 'Barang & Jasa',
    '5.2.01': 'Modal Tanah',
    '5.2.02': 'Modal Peralatan',
    '5.2.03': 'Modal Gedung',
    '5.2.04': 'Modal Jalan',
    '5.2.05': 'Modal Aset Lain',
  };

  return composition.map((item) => ({
    kategori: item.kategori,
    nama: namaMap[item.kategori] || item.kategori,
    total: item.total,
  }));
}

/**
 * Get chart data for "Lainnya" source (interest income only)
 */
function getChartDataLainnya(db, yearStr) {
  return db
    .prepare(
      `
    SELECT
      strftime('%m', k.tanggal_transaksi) as bulan,
      SUM(CASE 
        WHEN k.kode_rekening LIKE '5.%' AND k.id_ref_bku NOT IN(5, 33, 10, 11) AND sd.nama_sumber_dana LIKE '%Lainnya%' 
        THEN k.saldo 
        ELSE 0 
      END) as pengeluaran,
      SUM(CASE 
        WHEN (
            -- Condition 1: Linked to Lainnya Source with income ref
            (sd.nama_sumber_dana LIKE '%Lainnya%' AND (k.id_ref_bku IN (2, 8, 9) OR k.kode_rekening LIKE '4.%'))
            OR 
            -- Condition 2: Keyword match for Bunga/SiLPA (NOT expense items!)
            -- Handle NULL kode_rekening and exclude expenses (5.%)
            ((k.kode_rekening IS NULL OR k.kode_rekening NOT LIKE '5.%') AND k.saldo > 0 AND (
              LOWER(k.uraian) LIKE '%bunga bank%' OR 
              LOWER(k.uraian) LIKE '%jasa giro%' OR 
              LOWER(k.uraian) LIKE '%silpa%' OR 
              LOWER(k.uraian) LIKE '%sisa lebih%' OR 
              (k.id_ref_bku IN (8, 26, 28) AND LOWER(k.uraian) NOT LIKE '%saldo bank%' AND LOWER(k.uraian) NOT LIKE '%saldo awal%')
            ))
        )
        AND k.id_ref_bku NOT IN(5, 33, 10, 11) 
        THEN k.saldo 
        ELSE 0 
      END) as penerimaan, 

      0 as mutasi_netto,
      0 as tunai_masuk,
      SUM(CASE 
        WHEN (k.no_bukti LIKE 'BPU%' OR k.uraian LIKE 'BPU %') 
             AND k.kode_rekening LIKE '5.%' 
             AND sd.nama_sumber_dana LIKE '%Lainnya%'
        THEN k.saldo 
        ELSE 0 
      END) as tunai_keluar
    FROM kas_umum k
    LEFT JOIN rapbs_periode rp ON k.id_rapbs_periode = rp.id_rapbs_periode
    LEFT JOIN rapbs r ON rp.id_rapbs = r.id_rapbs
    LEFT JOIN anggaran a ON r.id_anggaran = a.id_anggaran
    LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
    WHERE strftime('%Y', k.tanggal_transaksi) = ?
      AND k.soft_delete = 0
      AND (
          (sd.nama_sumber_dana LIKE '%Lainnya%') OR 
          (
            -- Income from SiLPA/Bunga without explicit source link
            -- Handle NULL kode_rekening and exclude expenses (5.%)
            (k.kode_rekening IS NULL OR k.kode_rekening NOT LIKE '5.%') AND (
              LOWER(k.uraian) LIKE '%bunga bank%' OR
              LOWER(k.uraian) LIKE '%jasa giro%' OR
              LOWER(k.uraian) LIKE '%silpa%' OR 
              LOWER(k.uraian) LIKE '%sisa lebih%' OR
              (k.id_ref_bku IN (8, 26, 28) AND LOWER(k.uraian) NOT LIKE '%saldo bank%' AND LOWER(k.uraian) NOT LIKE '%saldo awal%')
            )
          )
      )
    GROUP BY bulan
    ORDER BY bulan
  `
    )
    .all(yearStr);
}

module.exports = {
  getChartData,
  getComposition,
  getChartDataLainnya,
};
