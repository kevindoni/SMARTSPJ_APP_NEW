/**
 * Cashflow Queries - Cash balance and flow calculations
 * Handles: Saldo calculations, Kas Masuk/Keluar, Tunai checkpoints
 */

/**
 * Calculate cash flows (tunai masuk/keluar) with source filtering
 * NOTE: kas_umum HAS id_anggaran column directly for BBU transactions.
 *       For BNU/BPU transactions, the link may also go via rapbs_periode -> rapbs -> anggaran
 */
function calculateCashFlows(db, yearStr, anggaranScope, fundSource) {
  // Get all budget IDs for this fund source (for BPU filtering)
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

  // Get raw transactions for cash flow calculation (including id_anggaran and other fields)
  const rawTransactions = db
    .prepare(
      `
    SELECT k.id_kas_umum, k.id_ref_bku, k.saldo, k.uraian, k.no_bukti, k.kode_rekening, k.id_rapbs_periode
    FROM kas_umum k
    WHERE strftime('%Y', k.tanggal_transaksi) = ?
      AND k.soft_delete = 0
  `
    )
    .all(yearStr);

  // For BPU transactions, we need to check budget link via rapbs
  const getBudgetIdForTransaction = (idRapbsPeriode) => {
    if (!idRapbsPeriode) return null;
    try {
      const result = db
        .prepare(
          `
        SELECT r.id_anggaran
        FROM rapbs_periode rp
        JOIN rapbs r ON rp.id_rapbs = r.id_rapbs
        WHERE rp.id_rapbs_periode = ?
      `
        )
        .get(idRapbsPeriode);
      return result?.id_anggaran || null;
    } catch (e) {
      return null;
    }
  };

  // Filter function for budget matching
  const isBudgetMatch = (tx) => {
    if (!fundSource || fundSource === 'SEMUA') return true;
    const txBudgetId = getBudgetIdForTransaction(tx.id_rapbs_periode);
    if (!txBudgetId) return false;
    return budgetIds.includes(txBudgetId);
  };

  let totalMasuk = 0;
  let totalKeluar = 0;

  for (const tx of rawTransactions) {
    const uraian = (tx.uraian || '').toLowerCase();
    const val = Number(tx.saldo) || 0;

    // MASUK: Tarik Tunai (ref 3)
    if (tx.id_ref_bku === 3 || uraian.includes('tarik tunai')) {
      totalMasuk += val;
    }

    // KELUAR: Various expense types
    let isExpense = false;

    // Admin expenses (global)
    if (
      tx.id_ref_bku === 4 ||
      uraian.includes('setor tunai') ||
      uraian.includes('pengembalian sisa') ||
      (uraian.includes('pergeseran') && uraian.includes('ke bank')) ||
      tx.id_ref_bku === 5 ||
      tx.id_ref_bku === 13
    ) {
      if (tx.id_ref_bku !== 12 && !uraian.includes('di bank')) {
        isExpense = true;
      }
    }

    // Special Case: Pergeseran Uang di Bank (Ref 12)
    // Treated as Cash Out (Deposit back to Bank) to balance any withdrawals
    if (tx.id_ref_bku === 12 || uraian.includes('pergeseran uang di bank')) {
      isExpense = true;
    }

    // BPU expenses = Cash expenses (Belanja Pakai Uang tunai)
    // All transactions with no_bukti starting with "BPU" are cash expenses
    if (tx.no_bukti?.startsWith('BPU') && tx.kode_rekening?.startsWith('5.')) {
      isExpense = true;
    }

    if (isExpense) {
      totalKeluar += val;
    }
  }

  return { totalMasuk, totalKeluar };
}

/**
 * Get saldo tunai checkpoints from database
 * These are "Saldo Tunai Bulan X" transactions (id_ref_bku = 9)
 * NOTE: Simplified - no fund source filtering for checkpoints
 */
function getSaldoTunaiCheckpoints(db, yearStr, anggaranScope) {
  const checkpoints = {};

  try {
    // SUM all checkpoint values for the same month (there can be multiple for different fund sources)
    const query = `
      SELECT 
        strftime('%m', tanggal_transaksi) as bulan_checkpoint,
        SUM(saldo) as total_saldo
      FROM kas_umum
      WHERE strftime('%Y', tanggal_transaksi) = ?
        AND soft_delete = 0
        AND id_ref_bku = 9
        AND uraian LIKE 'Saldo Tunai Bulan%'
      GROUP BY bulan_checkpoint
      ORDER BY bulan_checkpoint
    `;

    const results = db.prepare(query).all(yearStr);

    results.forEach((cp) => {
      // Checkpoint for "Saldo Tunai Bulan November" appears on Dec 1st (month 12)
      // So map to the PREVIOUS month
      let targetMonth = parseInt(cp.bulan_checkpoint) - 1;
      if (targetMonth === 0) targetMonth = 12;
      const monthKey = targetMonth.toString().padStart(2, '0');

      // SUM all values for this month
      checkpoints[monthKey] = Number(cp.total_saldo) || 0;
    });
  } catch (e) {
    // Failed to fetch checkpoints
  }

  return checkpoints;
}

/**
 * Process raw chart data with running balances
 */
function processChartDataWithBalances(rawChartData, options) {
  const { saldoAwalTahun = 0, fundSource, saldoTunaiCheckpoints = {}, targetSaldo } = options;

  // Initial balance
  let currentBalance =
    fundSource === 'Lainnya' || fundSource === 'BOS Kinerja' ? 0 : Number(saldoAwalTahun) || 0;

  let runningCashBalance = 0;

  // Generate array of all 12 months
  const allMonths = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  // Create a map of existing data for quick lookup
  const dataMap = new Map(rawChartData.map((item) => [item.bulan, item]));

  // Fill missing months with zero values
  const fullYearData = allMonths.map((month) => {
    if (dataMap.has(month)) {
      return dataMap.get(month);
    }
    return {
      bulan: month,
      pengeluaran: 0,
      penerimaan: 0,
      mutasi_netto: 0,
      tunai_masuk: 0,
      tunai_keluar: 0,
    };
  });

  // First pass: compute raw saldo per month
  const rawBalances = fullYearData.map((d) => {
    currentBalance += d.mutasi_netto;
    if (currentBalance < 0) currentBalance = 0;
    return currentBalance;
  });

  // Calibrate: if chart saldo doesn't match stats.saldo, adjust last active month
  // This accounts for income types (like bunga bank) that SQL can't easily classify
  if (targetSaldo !== undefined && targetSaldo !== null && rawBalances.length > 0) {
    const lastRaw = rawBalances[rawBalances.length - 1];
    const target = Number(targetSaldo) || 0;
    const diff = target - lastRaw;
    if (diff !== 0) {
      // Find last month with activity to add the difference
      for (let i = fullYearData.length - 1; i >= 0; i--) {
        if (fullYearData[i].mutasi_netto !== 0) {
          fullYearData[i] = { ...fullYearData[i], mutasi_netto: fullYearData[i].mutasi_netto + diff };
          break;
        }
      }
    }
  }

  // Reset and second pass with calibrated data
  currentBalance =
    fundSource === 'Lainnya' || fundSource === 'BOS Kinerja' ? 0 : Number(saldoAwalTahun) || 0;

  return fullYearData.map((d) => {
    currentBalance += d.mutasi_netto;
    if (currentBalance < 0) currentBalance = 0;

    // Calculate running cash balance
    runningCashBalance += d.tunai_masuk - d.tunai_keluar;
    if (runningCashBalance < 0) runningCashBalance = 0;

    // Use checkpoint if available, otherwise calculated
    let saldoTunaiActual = saldoTunaiCheckpoints[d.bulan];
    if (saldoTunaiActual === undefined) {
      saldoTunaiActual = runningCashBalance;
    } else {
      runningCashBalance = saldoTunaiActual;
    }

    // Calculate bank balance
    let bankBalance = currentBalance - saldoTunaiActual;
    if (bankBalance < 0) bankBalance = 0;

    // Prevent tunai > total
    if (saldoTunaiActual > currentBalance) {
      saldoTunaiActual = currentBalance;
      bankBalance = 0;
    }

    return {
      ...d,
      saldo_akhir: currentBalance,
      saldo_tunai: saldoTunaiActual,
      saldo_bank: bankBalance,
    };
  });
}

module.exports = {
  calculateCashFlows,
  getSaldoTunaiCheckpoints,
  processChartDataWithBalances,
};
