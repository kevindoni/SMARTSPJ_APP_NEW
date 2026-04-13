// advancedQueries.js - Dashboard V3 Analytics Queries
// Uses ref_kode table for kegiatan grouping (rapbs -> ref_kode via id_ref_kode)
// Uses anggaranScope (self-contained subquery) for fund source filtering

/**
 * 1. Count RAPBS items and distinct Kegiatan
 */
function getRapbsAndKegiatanCount(db, yearStr, fundSource, anggaranScope) {
  try {
    let fundWhere = '';
    if (fundSource && fundSource !== 'SEMUA') {
      fundWhere = `AND r.${anggaranScope}`;
    }

    const query = `
      SELECT 
        COUNT(DISTINCT r.id_rapbs) as item_count,
        COUNT(DISTINCT k.id_kode) as kegiatan_count
      FROM rapbs r
      JOIN anggaran a ON r.id_anggaran = a.id_anggaran
      LEFT JOIN ref_kode k ON r.id_ref_kode = k.id_ref_kode AND k.tahun = a.tahun_anggaran
      WHERE a.tahun_anggaran = ?
        AND r.soft_delete = 0
        AND a.soft_delete = 0 
        AND a.is_approve = 1
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
 */
function getBelanjaKategori(db, yearStr, fundSource, anggaranScope) {
  try {
    let fundWhereBelanja = '';
    let joinClause = '';

    if (fundSource && fundSource !== 'SEMUA') {
      joinClause = `
        LEFT JOIN rapbs_periode rp ON ku.id_rapbs_periode = rp.id_rapbs_periode
        LEFT JOIN rapbs r ON rp.id_rapbs = r.id_rapbs
      `;
      fundWhereBelanja = `AND r.${anggaranScope}`;
    }

    const realisasiQuery = `
      SELECT 
        SUM(CASE WHEN ku.kode_rekening LIKE '5.1.02%' THEN ku.saldo ELSE 0 END) as realisasi_bj,
        SUM(CASE WHEN ku.kode_rekening LIKE '5.2.02%' THEN ku.saldo ELSE 0 END) as realisasi_ma,
        SUM(CASE WHEN ku.kode_rekening LIKE '5.2.05%' THEN ku.saldo ELSE 0 END) as realisasi_al
      FROM kas_umum ku
      ${joinClause}
      WHERE strftime('%Y', ku.tanggal_transaksi) = ? 
        AND ku.soft_delete = 0 
        AND ku.id_ref_bku NOT IN (5, 33, 10, 11)
        ${fundWhereBelanja}
    `;
    const realisasi = db.prepare(realisasiQuery).get(yearStr) || {};

    let fundWhereAnggaran = '';
    if (fundSource && fundSource !== 'SEMUA') {
      fundWhereAnggaran = `AND r.${anggaranScope}`;
    }

    const anggaranQuery = `
      SELECT 
        SUM(CASE WHEN r.kode_rekening LIKE '5.1.02%' THEN r.jumlah ELSE 0 END) as pagu_bj,
        SUM(CASE WHEN r.kode_rekening LIKE '5.2.02%' THEN r.jumlah ELSE 0 END) as pagu_ma,
        SUM(CASE WHEN r.kode_rekening LIKE '5.2.05%' THEN r.jumlah ELSE 0 END) as pagu_al
      FROM rapbs r
      JOIN anggaran a ON r.id_anggaran = a.id_anggaran
      WHERE a.tahun_anggaran = ?
        AND r.soft_delete = 0
        AND a.soft_delete = 0
        AND a.is_approve = 1
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
    let results = [];

    let joinClauseOut = '';
    let fundWhereOut = '';

    if (fundSource && fundSource !== 'SEMUA') {
      joinClauseOut = `
        LEFT JOIN rapbs_periode rp ON ku.id_rapbs_periode = rp.id_rapbs_periode
        LEFT JOIN rapbs r ON rp.id_rapbs = r.id_rapbs
      `;
      fundWhereOut = `AND r.${anggaranScope}`;
    }

    for (let i = 1; i <= 12; i++) {
      const monthKey = String(i).padStart(2, '0');
      const ym = `${yearStr}-${monthKey}`;

      const incomeRow = db
        .prepare(
          `
        SELECT SUM(ku.saldo) as masuk 
        FROM kas_umum ku
        WHERE strftime('%Y-%m', ku.tanggal_transaksi) = ? 
          AND (ku.id_ref_bku = 2 OR ku.kode_rekening LIKE '4.%') 
          AND ku.soft_delete = 0
      `
        )
        .get(ym);

      const expenseRow = db
        .prepare(
          `
        SELECT SUM(ku.saldo) as keluar 
        FROM kas_umum ku
        ${joinClauseOut}
        WHERE strftime('%Y-%m', ku.tanggal_transaksi) = ? 
          AND ku.kode_rekening LIKE '5.%' 
          AND ku.id_ref_bku NOT IN (5, 33, 10, 11) 
          AND ku.soft_delete = 0 
          ${fundWhereOut}
      `
        )
        .get(ym);

      results.push({
        bulan: months[i - 1],
        masuk: incomeRow?.masuk || 0,
        keluar: expenseRow?.keluar || 0,
        saldo: 0,
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
    let joinClause = '';
    if (fundSource && fundSource !== 'SEMUA') {
      joinClause = `
        LEFT JOIN rapbs_periode rp ON ku.id_rapbs_periode = rp.id_rapbs_periode
        LEFT JOIN rapbs r ON rp.id_rapbs = r.id_rapbs
      `;
      fundWhere = `AND r.${anggaranScope}`;
    }

    const query = `
      SELECT ku.uraian, ku.tanggal_transaksi, ku.saldo as nominal
      FROM kas_umum ku
      ${joinClause}
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
    let fundWhereAnggaran = '';
    if (fundSource && fundSource !== 'SEMUA') {
      fundWhereAnggaran = `AND r.${anggaranScope}`;
    }

    // Group RAPBS by kegiatan (ref_kode)
    // Use subquery to avoid row duplication from LEFT JOIN
    const kegiatanQuery = `
      SELECT 
        r.id_ref_kode as id_kode,
        (SELECT k.uraian_kode FROM ref_kode k WHERE k.id_ref_kode = r.id_ref_kode AND k.tahun = ? LIMIT 1) as nama_kegiatan,
        SUM(r.jumlah) as pagu_kegiatan
      FROM rapbs r
      JOIN anggaran a ON r.id_anggaran = a.id_anggaran
      WHERE a.tahun_anggaran = ?
        AND r.soft_delete = 0
        AND a.soft_delete = 0
        AND a.is_approve = 1
        ${fundWhereAnggaran}
      GROUP BY r.id_ref_kode
      ORDER BY pagu_kegiatan DESC
      LIMIT 10
    `;
    const daftarKegiatan = db.prepare(kegiatanQuery).all(yearStr, yearStr);

    // Calculate realisasi per kegiatan
    let fundWhereTx = '';
    if (fundSource && fundSource !== 'SEMUA') {
      fundWhereTx = `AND r.${anggaranScope}`;
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
 */
function getPenerimaanDana(db, yearStr, fundSource, anggaranScope) {
  try {
    const query = `
      SELECT ku.uraian, ku.tanggal_transaksi, ku.saldo as nominal,
             sd.nama_sumber_dana, sd.id_ref_sumber_dana
      FROM kas_umum ku
      LEFT JOIN anggaran a ON ku.id_anggaran = a.id_anggaran
      LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
      WHERE strftime('%Y', ku.tanggal_transaksi) = ? 
        AND ku.soft_delete = 0
        AND (ku.id_ref_bku = 2 OR ku.kode_rekening LIKE '4.%')
        AND ku.id_ref_bku NOT IN (5, 33, 10, 11)
      ORDER BY ku.tanggal_transaksi ASC
      LIMIT 10
    `;
    const rows = db.prepare(query).all(yearStr);

    // Map each row to a display-friendly uraian
    return rows.map(row => {
      let displayUraian = row.uraian;
      const sdId = row.id_ref_sumber_dana;
      const sdName = (row.nama_sumber_dana || '').toLowerCase();

      // If linked to Kinerja fund source (ids 12, 35) or name contains 'kinerja'
      if (sdId === 12 || sdId === 35 || sdName.includes('kinerja')) {
        displayUraian = 'Kinerja';
      }

      return {
        uraian: displayUraian,
        tanggal_transaksi: row.tanggal_transaksi,
        nominal: row.nominal
      };
    });
  } catch (e) {
    console.error('V3 Query Error (Penerimaan):', e.message);
    return [];
  }
}

/**
 * 7. Pengeluaran Terbaru (recent expense transactions)
 */
function getPengeluaranTerbaru(db, yearStr, fundSource, anggaranScope) {
  try {
    let fundWhere = '';
    let joinClause = '';
    if (fundSource && fundSource !== 'SEMUA') {
      joinClause = `
        LEFT JOIN rapbs_periode rp ON ku.id_rapbs_periode = rp.id_rapbs_periode
        LEFT JOIN rapbs r ON rp.id_rapbs = r.id_rapbs
      `;
      fundWhere = `AND r.${anggaranScope}`;
    }

    const query = `
      SELECT ku.uraian, ku.tanggal_transaksi, ku.saldo as nominal
      FROM kas_umum ku
      ${joinClause}
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
function getRingkasanSumberDana(db, yearStr) {
  try {
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
