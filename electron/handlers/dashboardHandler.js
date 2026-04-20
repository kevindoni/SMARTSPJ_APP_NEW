/**
 * Dashboard Handler - Main orchestrator for dashboard statistics
 *
 * This is a slim wrapper that coordinates the modular query functions.
 * All query logic is in the ./dashboard/ subfolder.
 */

const Database = require('better-sqlite3-multiple-ciphers');
const {
  buildAnggaranScope,
  buildFundFilters,
  buildChartCases,
  getAnggaran,
  getPenerimaanMurni,
  getSaldoAwalTahun,
  getRealisasiBelanja,
  getPajak,
  getKinerjaAnggaranTotal,
  calculateSaldoPerSource,
  calculateCashFlows,
  getSaldoTunaiCheckpoints,
  processChartDataWithBalances,
  getChartData,
  getChartDataLainnya,
  getComposition,
  getBkuStatus,
  getPengesahanStatus,
  getLatestTransfer,
  getRevisiStatus,
  calculatePaguSisa,
} = require('./dashboard');

// Inject Advanced V3 Queries
const advancedQueries = require('./dashboard/advancedQueries');

/**
 * Open database connection with SQLCipher
 */
function openDatabase(dbPath, password) {
  const db = new Database(dbPath, { readonly: true });
  db.pragma("cipher='sqlcipher'");
  db.pragma('legacy=4');
  db.pragma(`key='${password}'`);
  return db;
}

module.exports = {
  /**
   * Get all dashboard statistics
   */
  getDashboardStats: async (dbPath, password, year, fundSource) => {
    try {
      const db = openDatabase(dbPath, password);
      const yearStr = year.toString();

      // Dynamic Kinerja amount
      const kinerjaAmount = getKinerjaAnggaranTotal(db, year);

      // Build filters
      const anggaranScope = buildAnggaranScope(fundSource);
      const filters = buildFundFilters(fundSource, anggaranScope, kinerjaAmount);
      const chartConfig = buildChartCases(fundSource, anggaranScope, kinerjaAmount);

      let anggaranTotal = getAnggaran(db, year, filters.fundFilterAnggaran);

      // For BOS Reguler: add unspent balance from other non-Kinerja fund sources
      if (fundSource === 'BOS Reguler') {
        const otherPagu = getAnggaran(
          db,
          year,
          `AND sd.nama_sumber_dana NOT LIKE '%Reguler%' AND sd.nama_sumber_dana NOT LIKE '%Kinerja%'`
        );
        if (otherPagu > 0) {
          const otherBelanja = getRealisasiBelanja(
            db,
            yearStr,
            `AND (sd.nama_sumber_dana NOT LIKE '%Reguler%' AND sd.nama_sumber_dana NOT LIKE '%Kinerja%')`,
            fundSource
          );
          const otherSisa = otherPagu - otherBelanja;
          if (otherSisa > 0) {
            anggaranTotal += otherSisa;
          }
        }
      }

      const saldoAwalTahun = getSaldoAwalTahun(
        db,
        yearStr,
        filters.fundFilterRealisasi,
        fundSource
      );

      let penerimaanMurni = getPenerimaanMurni(
        db,
        yearStr,
        fundSource,
        anggaranScope,
        filters.fundFilterRealisasi
      );

      // For Lainnya, use anggaran as penerimaan (not actual interest income)
      if (fundSource === 'Lainnya') {
        penerimaanMurni = anggaranTotal;
      }

      const penerimaanTotal = penerimaanMurni;
      const realisasiBelanja = getRealisasiBelanja(
        db,
        yearStr,
        filters.fundFilterBelanja,
        fundSource
      );

      const pajak = getPajak(db, yearStr, filters.fundFilterRealisasi, fundSource);

      // Calculate GLOBAL saldo (for SEMUA mode calculation base)
      let globalSaldo = saldoAwalTahun + penerimaanMurni - realisasiBelanja;
      if (globalSaldo < 0) globalSaldo = 0;

      // Calculate saldo based on fund source type
      // BOS Reguler: actual bank balance (global), others: allocation-based (Anggaran - Belanja)
      const saldoGlobal = calculateSaldoPerSource(
        db,
        yearStr,
        fundSource,
        anggaranTotal,
        realisasiBelanja,
        globalSaldo
      );

      // Calculate cash flows
      const cashFlows = calculateCashFlows(db, yearStr, anggaranScope, fundSource);

      // Saldo tunai calculation
      let saldoTunai = saldoAwalTahun + cashFlows.totalMasuk - cashFlows.totalKeluar;
      if (saldoTunai < 0) saldoTunai = 0;

      let saldoBank = saldoGlobal - saldoTunai;
      if (saldoBank < 0) saldoBank = 0;

      // Get chart data
      let chartDataRaw;
      if (fundSource === 'Lainnya') {
        chartDataRaw = getChartDataLainnya(db, yearStr);
      } else {
        chartDataRaw = getChartData(db, yearStr, chartConfig, fundSource);
      }

      // Get tunai checkpoints and process chart data
      let saldoTunaiCheckpoints = {};
      if (fundSource !== 'SEMUA' && fundSource !== 'Lainnya') {
        saldoTunaiCheckpoints = getSaldoTunaiCheckpoints(db, yearStr, anggaranScope);
      }

      const chartData = processChartDataWithBalances(chartDataRaw, {
        saldoAwalTahun,
        fundSource,
        saldoTunaiCheckpoints,
        targetSaldo: saldoGlobal,
      });

      // Get composition
      const composition = getComposition(db, yearStr, filters.fundFilterBelanja, fundSource);
      // Get V3 Advanced Analytics - pass anggaranScope (self-contained subquery)
      const rapbsAndKegiatanCount = advancedQueries.getRapbsAndKegiatanCount(
        db,
        yearStr,
        fundSource,
        anggaranScope
      );
      const belanjaKategori = advancedQueries.getBelanjaKategori(
        db,
        yearStr,
        fundSource,
        anggaranScope
      );
      const kasBulanan = advancedQueries.getKasBulanan(db, yearStr, fundSource, anggaranScope);
      const top5Belanja = advancedQueries.getTop5Belanja(db, yearStr, fundSource, anggaranScope);
      const belanjaKegiatan = advancedQueries.getBelanjaKegiatan(
        db,
        yearStr,
        fundSource,
        anggaranScope
      );
      const penerimaanDana = advancedQueries.getPenerimaanDana(
        db,
        yearStr,
        fundSource,
        anggaranScope
      );
      const pengeluaranTerbaru = advancedQueries.getPengeluaranTerbaru(
        db,
        yearStr,
        fundSource,
        anggaranScope
      );
      const ringkasanSumberDana = advancedQueries.getRingkasanSumberDana(db, yearStr, fundSource);

      db.close();

      return {
        success: true,
        data: {
          anggaran: anggaranTotal,
          penerimaan: penerimaanTotal,
          realisasi: realisasiBelanja,
          saldo: saldoGlobal,
          saldo_tunai: saldoTunai,
          saldo_bank: saldoBank,
          kas_tunai_masuk: cashFlows.totalMasuk,
          kas_tunai_keluar: cashFlows.totalKeluar,
          pajak_pungut: pajak.pungut,
          pajak_setor: pajak.setor,
          chart: chartData,
          composition,
          // V3 Analytics
          item_rapbs_count: rapbsAndKegiatanCount.item_count,
          kegiatan_count: rapbsAndKegiatanCount.kegiatan_count,
          belanja_kategori: belanjaKategori,
          kas_bulanan: kasBulanan,
          top_5_belanja: top5Belanja,
          belanja_kegiatan: belanjaKegiatan,
          penerimaan_dana: penerimaanDana,
          pengeluaran_terbaru: pengeluaranTerbaru,
          ringkasan_sumber_dana: ringkasanSumberDana,
          fund_source: fundSource || 'SEMUA',
        },
      };
    } catch (err) {
      console.error('Dashboard Stats Error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Get dashboard badges/status indicators
   */
  getDashboardBadges: async (dbPath, password, year, fundSource) => {
    try {
      const db = openDatabase(dbPath, password);
      const yearStr = year.toString();

      // Build fund filter for anggaran
      const fundFilterAnggaran =
        fundSource && fundSource !== 'SEMUA'
          ? `AND sd.nama_sumber_dana LIKE '%${fundSource}%'`
          : '';

      // Get all badge data
      const bku = getBkuStatus(db, yearStr);
      const pengesahan = getPengesahanStatus(db, yearStr, fundFilterAnggaran, year);
      const transfer = getLatestTransfer(db, yearStr, fundSource);
      const revisi = getRevisiStatus(db, yearStr, fundFilterAnggaran, year);
      const paguSisa = calculatePaguSisa(db, yearStr, fundSource, revisi.nomor, year);

      db.close();

      return {
        success: true,
        data: {
          bku,
          pengesahan,
          transfer,
          revisi,
          pagu_sisa: paguSisa,
          fund_source: fundSource || 'SEMUA',
        },
      };
    } catch (err) {
      console.error('Badge Error:', err);
      return { success: false, error: err.message };
    }
  },
  /**
   * Get balances as of a specific closing date (End of Month)
   * Used for Register Penutupan Kas
   */
  getClosingBalances: async (dbPath, password, year, month, fundSource) => {
    let db;
    try {
      db = openDatabase(dbPath, password);
      const yearStr = year.toString();
      const monthStr = month.toString().padStart(2, '0');

      const dateLimit = `${yearStr}-${monthStr}-31`;

      // 1. Build Scopes
      const anggaranScope = buildAnggaranScope(fundSource);
      const kinerjaAmount = getKinerjaAnggaranTotal(db, year);
      const filters = buildFundFilters(fundSource, anggaranScope, kinerjaAmount);

      // 2. Saldo Awal Tahun (Constant for the year)
      const saldoAwalTahun = getSaldoAwalTahun(
        db,
        yearStr,
        filters.fundFilterRealisasi,
        fundSource
      );

      // 3. Calculate Global Saldo (Bank + Tunai) UP TO Date Limit
      // Penerimaan Murni (Standard + Bunga)
      // Logic borrowed from statsQueries.getPenerimaanMurni but with date filtering
      // We need to implement custom queries here because existing ones are year-bound

      // RE-IMPLEMENT Queries with Date Limit

      // A. Penerimaan Murni (Up to Date)
      let pmWhere = '';
      if (!fundSource || fundSource === 'SEMUA') {
        pmWhere = `(id_ref_bku = 2 OR (kode_rekening LIKE '4.%' AND id_ref_bku != 26))`;
      } else if (fundSource === 'BOS Reguler') {
        pmWhere = `(
          (id_ref_bku = 2 AND saldo != ${kinerjaAmount})
          OR (kode_rekening LIKE '4.%' AND id_ref_bku != 26)
          OR (LOWER(uraian) LIKE '%bunga bank%' OR LOWER(uraian) LIKE '%jasa giro%')
        )`;
      } else {
        // Fallback others
        pmWhere = `(id_ref_bku = 2 OR kode_rekening LIKE '4.%')`;
      }

      const penerimaanRow = db
        .prepare(
          `
        SELECT SUM(saldo) as total FROM kas_umum 
        WHERE strftime('%Y', tanggal_transaksi) = ? AND tanggal_transaksi <= ? AND soft_delete = 0 AND ${pmWhere}
      `
        )
        .get(yearStr, dateLimit);
      const penerimaanMurni = penerimaanRow?.total || 0;

      // B. Realisasi Belanja (Up to Date)
      let fundWhere =
        fundSource && fundSource !== 'SEMUA'
          ? `AND sd.nama_sumber_dana LIKE '%${fundSource}%'`
          : '';
      const belanjaRow = db
        .prepare(
          `
        SELECT SUM(k.saldo) as total 
        FROM kas_umum k
        LEFT JOIN rapbs_periode rp ON k.id_rapbs_periode = rp.id_rapbs_periode
        LEFT JOIN rapbs r ON rp.id_rapbs = r.id_rapbs
        LEFT JOIN anggaran a ON r.id_anggaran = a.id_anggaran
        LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
        WHERE strftime('%Y', k.tanggal_transaksi) = ? 
          AND k.tanggal_transaksi <= ? 
          AND k.soft_delete = 0 
          AND k.kode_rekening LIKE '5.%' 
          AND k.id_ref_bku NOT IN (5, 33, 10, 11)
          ${fundWhere}
      `
        )
        .get(yearStr, dateLimit);
      // Variables already declared above (Part 2 and Part 3A)
      // saldoAwalTahun is const on L202
      // penerimaanMurni is const on L230

      const realisasiBelanja = belanjaRow?.total || 0;

      // --- FIX: Include Net Tax & Bank Misc ---
      // 1. Tax (Pungiut/Setor) - usually linked
      const pajakRowGlobal = db
        .prepare(
          `
        SELECT
          SUM(CASE WHEN k.id_ref_bku IN(10, 33) OR (k.id_ref_bku=5 AND k.kode_rekening NOT LIKE '5.%') THEN k.saldo ELSE 0 END) as pungut,
          SUM(CASE WHEN k.id_ref_bku IN(11, 25) THEN k.saldo ELSE 0 END) as setor
        FROM kas_umum k
        LEFT JOIN rapbs_periode rp ON k.id_rapbs_periode = rp.id_rapbs_periode
        LEFT JOIN rapbs r ON rp.id_rapbs = r.id_rapbs
        LEFT JOIN anggaran a ON r.id_anggaran = a.id_anggaran
        LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
        WHERE strftime('%Y', k.tanggal_transaksi) = ?
          AND k.tanggal_transaksi <= ? 
          AND k.soft_delete = 0
          ${fundWhere}
      `
        )
        .get(yearStr, dateLimit);

      // 2. Misc Bank (Admin/Bunga) - Often UNLINKED
      const miscRowGlobal = db
        .prepare(
          `
        SELECT
          SUM(CASE WHEN (k.id_ref_bku = 6 OR LOWER(k.uraian) LIKE '%bunga bank%' OR LOWER(k.uraian) LIKE '%jasa giro%') AND (k.kode_rekening IS NULL OR k.kode_rekening NOT LIKE '4.%') THEN k.saldo ELSE 0 END) as bunga_rev,
          SUM(CASE WHEN k.id_ref_bku = 13 AND (k.kode_rekening IS NULL OR k.kode_rekening NOT LIKE '5.%') THEN k.saldo ELSE 0 END) as admin_exp
        FROM kas_umum k
        WHERE strftime('%Y', k.tanggal_transaksi) = ?
          AND k.tanggal_transaksi <= ? 
          AND k.soft_delete = 0
      `
        )
        .get(yearStr, dateLimit);

      const netPajak = (pajakRowGlobal?.pungut || 0) - (pajakRowGlobal?.setor || 0);
      const miscBank = (miscRowGlobal?.bunga_rev || 0) - (miscRowGlobal?.admin_exp || 0);

      // C. Global Saldo (Accounting + Net Cash Flow from Non-Budget Items)
      let globalSaldo = saldoAwalTahun + penerimaanMurni - realisasiBelanja + netPajak + miscBank;

      if (globalSaldo < 0) globalSaldo = 0;

      // Filter per source logic (if needed) - Keeping it simple: Global is primary for Reguler
      if (fundSource !== 'BOS Reguler' && fundSource !== 'SEMUA') {
        // Non-Reguler follows Anggaran - Belanja logic often, but for Closing Register
        // we usually want actual cash moves. Let's stick to Global = Awal + Masuk - Keluar.
      }

      // 4. Calculate Saldo Tunai (Up to Date) via Cash Flow Logic
      // We must calculate Masuk/Keluar manually with date limit
      // Reuse logic from 'calculateCashFlows' loop but with date check?
      // Better: Re-query raw transactions with Date limit

      // Get budget IDs for BPU filtering
      let budgetIds = [];
      if (fundSource && fundSource !== 'SEMUA') {
        const budgetRows = db
          .prepare(
            `
            SELECT id_anggaran FROM anggaran a
            JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana
            WHERE sd.nama_sumber_dana LIKE ?
          `
          )
          .all(`%${fundSource}%`);
        budgetIds = budgetRows.map((r) => r.id_anggaran);
      }

      const rawTx = db
        .prepare(
          `
        SELECT k.id_kas_umum, k.id_ref_bku, k.saldo, k.uraian, k.no_bukti, k.kode_rekening, k.id_rapbs_periode
        FROM kas_umum k
        WHERE strftime('%Y', k.tanggal_transaksi) = ? AND k.tanggal_transaksi <= ? AND k.soft_delete = 0
      `
        )
        .all(yearStr, dateLimit);

      // Helper for BPU budget check
      const getBudgetId = (idRapbsPeriode) => {
        if (!idRapbsPeriode) return null;
        try {
          return db
            .prepare(
              `SELECT r.id_anggaran FROM rapbs_periode rp JOIN rapbs r ON rp.id_rapbs = r.id_rapbs WHERE rp.id_rapbs_periode = ?`
            )
            .get(idRapbsPeriode)?.id_anggaran;
        } catch (e) {
          return null;
        }
      };

      let tunaiMasuk = 0;
      let tunaiKeluar = 0;

      for (const tx of rawTx) {
        // Budget Filter
        if (fundSource && fundSource !== 'SEMUA') {
          const txBid = getBudgetId(tx.id_rapbs_periode);
          if (txBid && !budgetIds.includes(txBid)) continue;
          // Note: General cash ops without ID might be skipped?
          // For BOS Reguler usually all ops are included.
        }

        const val = Number(tx.saldo) || 0;
        const uraian = (tx.uraian || '').toLowerCase();

        // MASUK
        if (tx.id_ref_bku === 3 || uraian.includes('tarik tunai')) {
          tunaiMasuk += val;
        }

        // KELUAR
        // KELUAR
        let isExpense = false;
        // Ref 4: Setor Tunai
        // Ref 5: Belanja (Check for Non-Tunai)
        // Ref 13: Biaya Admin (Check for Non-Tunai)
        // Ref 15: Belanja Lainnya (Check for Non-Tunai)
        if (
          tx.id_ref_bku === 4 ||
          uraian.includes('setor tunai') ||
          uraian.includes('pengembalian sisa') ||
          (uraian.includes('pergeseran') && uraian.includes('ke bank')) ||
          tx.id_ref_bku === 5 ||
          tx.id_ref_bku === 13 ||
          tx.id_ref_bku === 15
        ) {
          if (tx.id_ref_bku !== 12 && !uraian.includes('di bank')) {
            // Exclude explicit Non-Tunai / Transfer markers
            if (
              !uraian.includes('non tunai') &&
              !uraian.includes('transfer') &&
              !uraian.includes('cms')
            ) {
              isExpense = true;
            }
          }
        }

        // Relaxed BPU Check (Case Insensitive)
        // BNU (Bukti Non-Tunai) is EXCLUDED.
        const noBukti = (tx.no_bukti || '').toUpperCase();
        if (noBukti.startsWith('BPU') && tx.kode_rekening?.startsWith('5.')) {
          if (!uraian.includes('non tunai') && !uraian.includes('transfer')) {
            isExpense = true;
          }
        }

        if (isExpense) {
          tunaiKeluar += val;
        } else {
          // DEBUG: Log potential missed expenses (ignoring Tax Ref 10/11)
          // Removed for cleanup
        }
      }

      let saldoTunai = 0;

      // 4a. Check for Official Checkpoint (Ref 9)
      // This overrides manual calculation if a closing has already been performed/recorded
      const checkpoints = getSaldoTunaiCheckpoints(db, yearStr, anggaranScope);
      if (checkpoints[monthStr] !== undefined) {
        saldoTunai = checkpoints[monthStr];
      } else {
        // 4b. Manual Calculation (Fallback)
        saldoTunai = saldoAwalTahun + tunaiMasuk - tunaiKeluar;
        if (saldoTunai < 0) saldoTunai = 0;
      }

      // 5. Saldo Bank = Global - Tunai
      let saldoBank = globalSaldo - saldoTunai;
      if (saldoBank < 0) saldoBank = 0;

      // 6. Pajak (Up to Date)
      const pajakRow = db
        .prepare(
          `
        SELECT
          SUM(CASE WHEN k.id_ref_bku IN(5, 33, 10) AND k.uraian NOT LIKE 'Setor Tunai%' THEN k.saldo ELSE 0 END) as pungut,
          SUM(CASE WHEN k.id_ref_bku IN(6, 7, 25, 11) AND k.uraian NOT LIKE '%Bunga%' THEN k.saldo ELSE 0 END) as setor
        FROM kas_umum k
        ${fundWhere ? 'LEFT JOIN rapbs_periode rp ON k.id_rapbs_periode = rp.id_rapbs_periode LEFT JOIN rapbs r ON rp.id_rapbs = r.id_rapbs LEFT JOIN anggaran a ON r.id_anggaran = a.id_anggaran LEFT JOIN ref_sumber_dana sd ON a.id_ref_sumber_dana = sd.id_ref_sumber_dana' : ''}
        WHERE strftime('%Y', k.tanggal_transaksi) = ?
          AND k.tanggal_transaksi <= ? 
          AND k.soft_delete = 0
          ${fundWhere}
      `
        )
        .get(yearStr, dateLimit);

      const saldoPajak = (pajakRow?.pungut || 0) - (pajakRow?.setor || 0);

      db.close();

      return {
        success: true,
        data: {
          saldo_buku: saldoTunai,
          saldo_bank: saldoBank,
          saldo_pajak: saldoPajak,
          total_penerimaan: penerimaanMurni + saldoAwalTahun,
          total_pengeluaran: realisasiBelanja,
        },
      };
    } catch (err) {
      if (db) db.close();
      console.error('getClosingBalances Error:', err);
      return { success: false, error: err.message };
    }
  },
};
