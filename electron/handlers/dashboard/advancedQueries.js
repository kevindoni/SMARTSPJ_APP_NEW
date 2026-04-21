// Fund source IDs for classification
const SOURCE_IDS = {
  REGULER: [1, 33],
  LAINNYA: [5],
  KINERJA: [12, 35],
  AFIRMASI: [11, 34],
  DAERAH: [3],
};

// advancedQueries.js - Dashboard V3 Analytics Queries
// Uses ref_kode table for kegiatan grouping (rapbs -> ref_kode via id_ref_kode)
// Uses anggaranScope (self-contained subquery) for fund source filtering

/**
 * 1. Count RAPBS items and distinct Kegiatan
 */
function getRapbsAndKegiatanCount(db, yearStr, fundSource, anggaranScope) {
  try {
    let fundJoin = '';
    let fundWhere = '';
    if (fundSource && fundSource !== 'SEMUA') {
      fundJoin = 'JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana';
      if (fundSource === 'BOS Reguler') {
        fundWhere = `AND (sd.nama_sumber_dana NOT LIKE '%Kinerja%' OR sd.nama_sumber_dana IS NULL)`;
      } else {
        fundWhere = `AND sd.nama_sumber_dana LIKE '%${fundSource}%'`;
      }
    }

    const query = `
      SELECT 
        COUNT(DISTINCT r.id_rapbs) as item_count,
        COUNT(DISTINCT k.id_kode) as kegiatan_count
      FROM rapbs r
      JOIN anggaran a ON r.id_anggaran = a.id_anggaran
      LEFT JOIN ref_kode k ON r.id_ref_kode = k.id_ref_kode AND k.tahun = a.tahun_anggaran
      ${fundJoin}
      WHERE a.tahun_anggaran = ?
        AND r.soft_delete = 0
        AND a.soft_delete = 0 
        AND a.is_approve = 1
        AND a.is_revisi = (
          SELECT MAX(a2.is_revisi) FROM anggaran a2
          WHERE a2.id_ref_sumber_dana = a.id_ref_sumber_dana
            AND a2.tahun_anggaran = a.tahun_anggaran
            AND a2.soft_delete = 0
            AND a2.is_approve = 1
        )
        ${fundWhere}
    `;
    const result = db.prepare(query).get(yearStr);
    return {
      item_count: result?.item_count || 0,
      kegiatan_count: result?.kegiatan_count || 0,
    };
  } catch (e) {
    console.error('V3 Query Error (Count):', e.message);
    return { item_count: 0, kegiatan_count: 0 };
  }
}

/**
 * 2. Kategori Belanja (Barang Jasa, Modal Alat, Modal Aset Lain)
 *
 * Realisasi: filtered via ku.id_anggaran (anggaranScope) - works for kas_umum
 * Anggaran/Pagu: filtered via direct JOIN ref_sumber_dana - proven approach from statsQueries
 */
function getBelanjaKategori(db, yearStr, fundSource, anggaranScope) {
  try {
    // --- Realisasi from kas_umum (anggaranScope works here) ---
    let fundWhereBelanja = '';
    if (fundSource && fundSource !== 'SEMUA') {
      fundWhereBelanja = `AND ku.${anggaranScope}`;
    }

    const realisasiQuery = `
      SELECT 
        SUM(CASE WHEN ku.kode_rekening LIKE '5.1.02%' THEN ku.saldo ELSE 0 END) as realisasi_bj,
        SUM(CASE WHEN ku.kode_rekening LIKE '5.2.02%' THEN ku.saldo ELSE 0 END) as realisasi_ma,
        SUM(CASE WHEN ku.kode_rekening LIKE '5.2.05%' THEN ku.saldo ELSE 0 END) as realisasi_al
      FROM kas_umum ku
      WHERE strftime('%Y', ku.tanggal_transaksi) = ? 
        AND ku.soft_delete = 0 
        AND ku.id_ref_bku NOT IN (5, 33, 10, 11)
        ${fundWhereBelanja}
    `;
    const realisasi = db.prepare(realisasiQuery).get(yearStr) || {};

    // --- Anggaran/Pagu from rapbs (direct JOIN ref_sumber_dana) ---
    let fundJoinAnggaran = '';
    let fundWhereAnggaran = '';
    if (fundSource && fundSource !== 'SEMUA') {
      fundJoinAnggaran = 'JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana';
      if (fundSource === 'BOS Reguler') {
        fundWhereAnggaran = `AND (sd.nama_sumber_dana NOT LIKE '%Kinerja%' OR sd.nama_sumber_dana IS NULL)`;
      } else {
        fundWhereAnggaran = `AND sd.nama_sumber_dana LIKE '%${fundSource}%'`;
      }
    }

    const anggaranQuery = `
      SELECT 
        SUM(CASE WHEN r.kode_rekening LIKE '5.1.02%' THEN r.jumlah ELSE 0 END) as pagu_bj,
        SUM(CASE WHEN r.kode_rekening LIKE '5.2.02%' THEN r.jumlah ELSE 0 END) as pagu_ma,
        SUM(CASE WHEN r.kode_rekening LIKE '5.2.05%' THEN r.jumlah ELSE 0 END) as pagu_al
      FROM rapbs r
      JOIN anggaran a ON r.id_anggaran = a.id_anggaran
      ${fundJoinAnggaran}
      WHERE a.tahun_anggaran = ?
        AND r.soft_delete = 0
        AND a.soft_delete = 0
        AND a.is_approve = 1
        AND a.is_revisi = (
          SELECT MAX(a2.is_revisi) FROM anggaran a2
          WHERE a2.id_ref_sumber_dana = a.id_ref_sumber_dana
            AND a2.tahun_anggaran = a.tahun_anggaran
            AND a2.soft_delete = 0
            AND a2.is_approve = 1
        )
        ${fundWhereAnggaran}
    `;
    const anggaran = db.prepare(anggaranQuery).get(yearStr) || {};

    return [
      {
        id: 'barang_jasa',
        name: 'BELANJA BARANG DAN JASA',
        anggaran: anggaran.pagu_bj || 0,
        realisasi: realisasi.realisasi_bj || 0,
      },
      {
        id: 'modal_alat',
        name: 'BELANJA MODAL ALAT DAN MESIN',
        anggaran: anggaran.pagu_ma || 0,
        realisasi: realisasi.realisasi_ma || 0,
      },
      {
        id: 'modal_aset_lain',
        name: 'BELANJA MODAL ASET TETAP LAINNYA',
        anggaran: anggaran.pagu_al || 0,
        realisasi: realisasi.realisasi_al || 0,
      },
    ];
  } catch (e) {
    console.error('V3 Query Error (Kategori):', e.message);
    return [];
  }
}

/**
 * 3. Pergerakan Kas Bulanan
 * Uses separate queries matching reconciliationHandler classification:
 * - MASUK: BBU no_bukti + BOSP (id_ref_bku=2) + bunga (6) + pajak pungut (5,10,33) + dana lainnya (kode_rekening 4.%)
 * - KELUAR: BNU/BPU no_bukti with kode_rekening 5.% + biaya admin (7) + setor pajak (11)
 * - SALDO AWAL: id_ref_bku IN (2,8,9) in January (matching getOpeningBalance)
 *
 * Fund source filtering uses anggaranScope on k.id_anggaran (kas_umum has id_anggaran directly).
 * For BBU transactions, filtering is via k.id_anggaran -> anggaran -> ref_sumber_dana.
 * For BNU/BPU transactions, filtering is via k.id_anggaran (or k.id_rapbs_periode -> rapbs -> anggaran).
 */
function getKasBulanan(db, yearStr, fundSource, anggaranScope) {
  try {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];

    // Build fund source filter conditions
    // anggaranScope is a subquery like: id_anggaran IN (SELECT ...)
    // It can be applied to kas_umum directly since kas_umum has id_anggaran column
    const hasFundFilter = fundSource && fundSource !== 'SEMUA';
    const fundWhere = hasFundFilter ? `AND k.${anggaranScope}` : '';

    // --- Saldo Awal (matching reconciliationHandler getOpeningBalance) ---
    // Includes id_ref_bku 2 (BOSP recorded as Saldo Awal), 8 (Saldo Bank), 9 (Saldo Tunai)
    // Excludes "Tahap" and "Terima Dana" (those are income, not opening balance)
    const saldoAwalRow = db
      .prepare(
        `
      SELECT SUM(k.saldo) as total
      FROM kas_umum k
      WHERE k.id_ref_bku IN (2, 8, 9)
        AND strftime('%m', k.tanggal_transaksi) = '01'
        AND strftime('%Y', k.tanggal_transaksi) = ?
        AND k.soft_delete = 0
        AND k.uraian NOT LIKE '%Tahap%'
        AND k.uraian NOT LIKE '%Terima Dana%'
        ${fundWhere}
    `
      )
      .get(yearStr);
    const saldoAwal = saldoAwalRow?.total || 0;

    // --- Monthly Penerimaan (MASUK) ---
    // Matches reconciliationHandler.getIncome classification:
    // 1. BBU entries (all penerimaan use no_bukti LIKE 'BBU%') - filtered by fund source
    // 2. Bunga bank (id_ref_bku = 6) - global (no fund source filter)
    // 3. Pajak pungut (id_ref_bku IN 5,10,33) - filtered by fund source
    // 4. Dana lainnya: id_ref_bku=2 or kode_rekening 4.% - filtered by fund source
    const masukQuery = `
      SELECT
        strftime('%m', k.tanggal_transaksi) as bulan,
        SUM(CASE
          WHEN k.no_bukti LIKE 'BBU%' AND k.uraian NOT LIKE '%Saldo%' THEN k.saldo
          ELSE 0
        END) as bbu,
        SUM(CASE WHEN k.id_ref_bku = 6 THEN k.saldo ELSE 0 END) as bunga,
        SUM(CASE WHEN k.id_ref_bku IN (5, 10, 33) AND k.uraian NOT LIKE 'Setor Tunai%' THEN k.saldo ELSE 0 END) as pajak_pungut,
        SUM(CASE
          WHEN (k.id_ref_bku = 2 OR k.kode_rekening LIKE '4.%')
            AND k.id_ref_bku NOT IN (5, 33, 10, 11)
            AND k.uraian NOT LIKE '%Saldo%'
            AND k.no_bukti NOT LIKE 'BBU%'
          THEN k.saldo ELSE 0
        END) as dana_lainnya
      FROM kas_umum k
      WHERE strftime('%Y', k.tanggal_transaksi) = ?
        AND k.soft_delete = 0
        ${fundWhere}
      GROUP BY bulan
      ORDER BY bulan
    `;
    const masukRows = db.prepare(masukQuery).all(yearStr);

    // --- Monthly Pengeluaran (KELUAR) ---
    // Matches reconciliationHandler.getExpenses + monthly summary:
    // 1. BNU/BPU with kode_rekening 5.% (belanja) - filtered by fund source
    // 2. Biaya admin bank (id_ref_bku = 7) - filtered by fund source
    // 3. Setor pajak (id_ref_bku = 11) - filtered by fund source
    // 4. Other expenses: id_ref_bku IN (4,13) (setor tunai, pindahan) - filtered by fund source
    const keluarQuery = `
      SELECT
        strftime('%m', k.tanggal_transaksi) as bulan,
        SUM(CASE
          WHEN (k.no_bukti LIKE 'BNU%' OR k.no_bukti LIKE 'BPU%') AND k.kode_rekening LIKE '5.%' THEN k.saldo
          ELSE 0
        END) as belanja,
        SUM(CASE WHEN k.id_ref_bku = 7 THEN k.saldo ELSE 0 END) as biaya_admin,
        SUM(CASE WHEN k.id_ref_bku = 11 THEN k.saldo ELSE 0 END) as setor_pajak,
        SUM(CASE
          WHEN k.id_ref_bku IN (4, 13)
            AND k.no_bukti NOT LIKE 'BNU%' AND k.no_bukti NOT LIKE 'BPU%'
          THEN k.saldo ELSE 0
        END) as lainnya
      FROM kas_umum k
      WHERE strftime('%Y', k.tanggal_transaksi) = ?
        AND k.soft_delete = 0
        ${fundWhere}
      GROUP BY bulan
      ORDER BY bulan
    `;
    const keluarRows = db.prepare(keluarQuery).all(yearStr);

    // --- Build monthly data ---
    let runningSaldo = saldoAwal;
    const results = [];
    for (let i = 1; i <= 12; i++) {
      const monthKey = String(i).padStart(2, '0');
      const mRow = masukRows.find((r) => r.bulan === monthKey);
      const kRow = keluarRows.find((r) => r.bulan === monthKey);

      const masuk =
        (mRow?.bbu || 0) +
        (mRow?.bunga || 0) +
        (mRow?.pajak_pungut || 0) +
        (mRow?.dana_lainnya || 0);
      const keluar =
        (kRow?.belanja || 0) +
        (kRow?.biaya_admin || 0) +
        (kRow?.setor_pajak || 0) +
        (kRow?.lainnya || 0);

      runningSaldo = runningSaldo + masuk - keluar;
      results.push({
        bulan: months[i - 1],
        masuk,
        keluar,
        saldo: runningSaldo,
      });
    }
    return results;
  } catch (e) {
    console.error('V3 Query Error (Kas):', e.message);
    return [];
  }
}

/**
 * 4. Top 5 Pengeluaran Terbesar
 */
function getTop5Belanja(db, yearStr, fundSource, anggaranScope) {
  try {
    let fundWhere = '';
    if (fundSource && fundSource !== 'SEMUA') {
      fundWhere = `AND ku.${anggaranScope}`;
    }

    const query = `
      SELECT ku.uraian, ku.tanggal_transaksi, ku.saldo as nominal
      FROM kas_umum ku
      WHERE strftime('%Y', ku.tanggal_transaksi) = ? 
        AND ku.soft_delete = 0 
        AND ku.kode_rekening LIKE '5.%' 
        AND ku.id_ref_bku NOT IN (5, 33, 10, 11)
        ${fundWhere}
      ORDER BY ku.saldo DESC
      LIMIT 5
    `;
    return db.prepare(query).all(yearStr);
  } catch (e) {
    console.error('V3 Query Error (Top5):', e.message);
    return [];
  }
}

/**
 * 5. Belanja per Kegiatan (using ref_kode table)
 */
function getBelanjaKegiatan(db, yearStr, fundSource, anggaranScope) {
  try {
    let fundJoinKeg = '';
    let fundWhereKeg = '';
    if (fundSource && fundSource !== 'SEMUA') {
      fundJoinKeg = 'JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana';
      if (fundSource === 'BOS Reguler') {
        fundWhereKeg = `AND (sd.nama_sumber_dana NOT LIKE '%Kinerja%' OR sd.nama_sumber_dana IS NULL)`;
      } else {
        fundWhereKeg = `AND sd.nama_sumber_dana LIKE '%${fundSource}%'`;
      }
    }

    // Group RAPBS by kegiatan (ref_kode)
    const kegiatanQuery = `
      SELECT 
        r.id_ref_kode as id_kode,
        (SELECT k.uraian_kode FROM ref_kode k WHERE k.id_ref_kode = r.id_ref_kode AND k.tahun = ? LIMIT 1) as nama_kegiatan,
        SUM(r.jumlah) as pagu_kegiatan
      FROM rapbs r
      JOIN anggaran a ON r.id_anggaran = a.id_anggaran
      ${fundJoinKeg}
      WHERE a.tahun_anggaran = ?
        AND r.soft_delete = 0
        AND a.soft_delete = 0
        AND a.is_approve = 1
        AND a.is_revisi = (
          SELECT MAX(a2.is_revisi) FROM anggaran a2
          WHERE a2.id_ref_sumber_dana = a.id_ref_sumber_dana
            AND a2.tahun_anggaran = a.tahun_anggaran
            AND a2.soft_delete = 0
            AND a2.is_approve = 1
        )
        ${fundWhereKeg}
      GROUP BY r.id_ref_kode
      ORDER BY pagu_kegiatan DESC
      LIMIT 10
    `;
    const daftarKegiatan = db.prepare(kegiatanQuery).all(yearStr, yearStr);

    // Calculate realisasi per kegiatan
    let fundWhereTx = '';
    if (fundSource && fundSource !== 'SEMUA') {
      fundWhereTx = `AND ku.${anggaranScope}`;
    }

    for (const keg of daftarKegiatan) {
      if (!keg.id_kode) {
        keg.realisasi = 0;
        continue;
      }
      try {
        const txRow = db
          .prepare(
            `
          SELECT SUM(ku.saldo) as sum_real
          FROM kas_umum ku
          JOIN rapbs_periode rp ON ku.id_rapbs_periode = rp.id_rapbs_periode
          JOIN rapbs r ON rp.id_rapbs = r.id_rapbs
          WHERE strftime('%Y', ku.tanggal_transaksi) = ? 
            AND ku.soft_delete = 0
            AND r.id_ref_kode = ?
            AND ku.kode_rekening LIKE '5.%' 
            AND ku.id_ref_bku NOT IN (5, 33, 10, 11)
            ${fundWhereTx}
        `
          )
          .get(yearStr, keg.id_kode);
        keg.realisasi = txRow?.sum_real || 0;
      } catch (_) {
        keg.realisasi = 0;
      }
    }

    return daftarKegiatan;
  } catch (e) {
    console.error('V3 Query Error (BelanjaKeg):', e.message);
    return [];
  }
}

/**
 * 6. Penerimaan Dana (list of income transactions)
 * Filtered by fund source matching reconciliationHandler classification:
 * - SEMUA: all penerimaan
 * - BOS Reguler: BBU entries with Tahap/T1/T2, NOT Kinerja
 * - BOS Kinerja: BBU entries with Kinerja uraian or id_ref_sumber_dana IN (12, 35)
 * - Lainnya: non-BBU income (SiLpa, dana lainnya) + bunga bank
 */
function getPenerimaanDana(db, yearStr, fundSource, anggaranScope) {
  try {
    let fundFilter = '';
    if (!fundSource || fundSource === 'SEMUA') {
      fundFilter = '';
    } else if (fundSource === 'BOS Reguler') {
      fundFilter = `AND ku.no_bukti LIKE '%BBU%' AND (ku.uraian LIKE '%Tahap%' OR ku.uraian LIKE '%T1%' OR ku.uraian LIKE '%T2%')`;

      fundFilter += ` AND ku.uraian NOT LIKE '%Kinerja%' AND (sd.id_ref_sumber_dana IS NULL OR sd.id_ref_sumber_dana NOT IN (12, 35))`;
    } else if (fundSource === 'BOS Kinerja') {
      fundFilter = `AND (ku.uraian LIKE '%Kinerja%' OR sd.id_ref_sumber_dana IN (12, 35))`;
    } else if (fundSource === 'Lainnya') {
      fundFilter =
        "AND (ku.id_ref_bku = 6 OR LOWER(ku.uraian) LIKE '%silpa%' OR LOWER(ku.uraian) LIKE '%sisa lebih%')";
    }

    const query = `SELECT ku.uraian, ku.tanggal_transaksi, ku.saldo as nominal, sd.nama_sumber_dana, sd.id_ref_sumber_dana FROM kas_umum ku LEFT JOIN anggaran a ON ku.id_anggaran = a.id_anggaran LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana WHERE strftime('%Y', ku.tanggal_transaksi) = ? AND ku.soft_delete = 0 AND ku.saldo > 0 AND (ku.id_ref_bku = 2 OR LOWER(ku.uraian) LIKE '%silpa%') ${fundFilter} ORDER BY ku.tanggal_transaksi ASC LIMIT 10`;
    const rows = db.prepare(query).all(yearStr);

    return rows.map((row) => {
      let displayUraian = row.uraian;
      const sdId = row.id_ref_sumber_dana;
      const sdName = (row.nama_sumber_dana || '').toLowerCase();
      const isGeneric = ['Tahap 1', 'Tahap 2', 'SiLpa', 'Kinerja'].some((g) => displayUraian === g);
      if (isGeneric) {
        if (SOURCE_IDS.KINERJA.includes(sdId) || sdName.includes('kinerja')) {
          displayUraian = 'Terima Dana BOS ' + row.uraian;
        }
      }
      return {
        uraian: displayUraian,
        tanggal_transaksi: row.tanggal_transaksi,
        nominal: row.nominal,
      };
    });
  } catch (e) {
    console.error('Query Error (Penerimaan):', e.message);
    return [];
  }
}
/**
 * 7. Pengeluaran Terbaru (recent expense transactions)
 */
function getPengeluaranTerbaru(db, yearStr, fundSource, anggaranScope) {
  try {
    let fundWhere = '';
    if (fundSource && fundSource !== 'SEMUA') {
      fundWhere = `AND ku.${anggaranScope}`;
    }

    const query = `
      SELECT ku.uraian, ku.tanggal_transaksi, ku.saldo as nominal
      FROM kas_umum ku
      WHERE strftime('%Y', ku.tanggal_transaksi) = ? 
        AND ku.soft_delete = 0 
        AND ku.kode_rekening LIKE '5.%' 
        AND ku.id_ref_bku NOT IN (5, 33, 10, 11)
        ${fundWhere}
      ORDER BY ku.tanggal_transaksi DESC
      LIMIT 15
    `;
    return db.prepare(query).all(yearStr);
  } catch (e) {
    console.error('V3 Query Error (PengeluaranTerbaru):', e.message);
    return [];
  }
}

/**
 * 8. Ringkasan per Sumber Dana
 */
function getRingkasanSumberDana(db, yearStr, fundSource) {
  try {
    const fundFilter =
      fundSource && fundSource !== 'SEMUA' ? `AND sd.nama_sumber_dana LIKE '%${fundSource}%'` : '';
    const query = `
      SELECT 
        sd.nama_sumber_dana,
        SUM(r.jumlah) as pagu,
        0 as realisasi
      FROM rapbs r
      JOIN anggaran a ON r.id_anggaran = a.id_anggaran
      JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
      WHERE a.tahun_anggaran = ?
        AND r.soft_delete = 0
        AND a.soft_delete = 0
        AND a.is_approve = 1
        AND a.is_revisi = (
          SELECT MAX(is_revisi) FROM anggaran a2
          WHERE a2.id_ref_sumber_dana = a.id_ref_sumber_dana
          AND a2.tahun_anggaran = a.tahun_anggaran
          AND a2.soft_delete = 0
          AND a2.is_approve = 1
        )
        ${fundFilter}
      GROUP BY sd.nama_sumber_dana
      ORDER BY pagu DESC
    `;
    const rows = db.prepare(query).all(yearStr);

    // Calculate realisasi per sumber dana
    for (const row of rows) {
      try {
        const realRow = db
          .prepare(
            `
          SELECT SUM(ku.saldo) as total
          FROM kas_umum ku
          LEFT JOIN rapbs_periode rp ON ku.id_rapbs_periode = rp.id_rapbs_periode
          LEFT JOIN rapbs r ON rp.id_rapbs = r.id_rapbs
          LEFT JOIN anggaran a ON r.id_anggaran = a.id_anggaran
          LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
          WHERE strftime('%Y', ku.tanggal_transaksi) = ?
            AND ku.soft_delete = 0
            AND ku.kode_rekening LIKE '5.%'
            AND ku.id_ref_bku NOT IN (5, 33, 10, 11)
            AND sd.nama_sumber_dana = ?
        `
          )
          .get(yearStr, row.nama_sumber_dana);
        row.realisasi = realRow?.total || 0;
      } catch (_) {
        row.realisasi = 0;
      }
    }

    return rows;
  } catch (e) {
    console.error('V3 Query Error (RingkasanSD):', e.message);
    return [];
  }
}

module.exports = {
  getRapbsAndKegiatanCount,
  getBelanjaKategori,
  getKasBulanan,
  getTop5Belanja,
  getBelanjaKegiatan,
  getPenerimaanDana,
  getPengeluaranTerbaru,
  getRingkasanSumberDana,
};
