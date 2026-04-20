const fs = require('fs');
const path = require('path');

let DATA_DIR = path.join(__dirname, '../../data');

function initBankReconStorage(dir) {
  DATA_DIR = dir;
}

// Dynamic path getter to avoid stale-const bug
function getReconFilePath() {
  return path.join(DATA_DIR, 'bank-reconciliation.json');
}

const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

function loadLocalData() {
  try {
    const filePath = getReconFilePath();
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (e) {}
  return {};
}

function saveLocalData(data) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(getReconFilePath(), JSON.stringify(data, null, 2), 'utf-8');
}

function getBankReconciliationData(db, year) {
  const yearStr = year.toString();

  // 1. Get opening balance (bank + tunai from January checkpoints)
  const openingRow = db
    .prepare(
      `
    SELECT 
      COALESCE(SUM(CASE WHEN k.id_ref_bku IN (2, 8) AND k.uraian NOT LIKE '%tunai%' THEN k.saldo ELSE 0 END), 0) as bank,
      COALESCE(SUM(CASE WHEN k.id_ref_bku = 9 OR k.uraian LIKE '%tunai%' THEN k.saldo ELSE 0 END), 0) as tunai
    FROM kas_umum k
    WHERE strftime('%Y', k.tanggal_transaksi) = ?
      AND strftime('%m', k.tanggal_transaksi) = '01'
      AND k.soft_delete = 0
      AND k.id_ref_bku IN (2, 8, 9)
      AND k.uraian NOT LIKE '%Tahap%'
      AND k.uraian NOT LIKE '%Terima Dana%'
  `
    )
    .get(yearStr);

  const saldoAwalBank = Number(openingRow?.bank) || 0;
  const saldoAwalTunai = Number(openingRow?.tunai) || 0;
  const saldoAwalTotal = saldoAwalBank + saldoAwalTunai;

  // 2. Get monthly totals using isPenerimaan logic (same as front-end transactionHelpers.js)
  // Priority order matters - replicates the exact isPenerimaan() function
  const monthlyData = db
    .prepare(
      `
    SELECT 
      strftime('%m', k.tanggal_transaksi) as bulan,
      SUM(CASE 
        WHEN k.id_ref_bku IN (8, 9) THEN 0
        ELSE k.saldo 
      END * CASE
        -- Priority 1: saldo keyword = penerimaan
        WHEN LOWER(k.uraian) LIKE '%saldo%' THEN 1
        -- Priority 2: setor tunai = penerimaan
        WHEN LOWER(k.uraian) LIKE '%setor tunai%' THEN 1
        -- Priority 3: pergeseran uang ke bank = pengeluaran
        WHEN LOWER(k.uraian) LIKE '%pergeseran uang ke bank%' THEN -1
        -- Priority 4: pergeseran uang di bank = penerimaan
        WHEN LOWER(k.uraian) LIKE '%pergeseran uang di bank%' THEN 1
        -- Priority 5: BPU/BNU prefix = pengeluaran
        WHEN UPPER(k.no_bukti) LIKE 'BPU%' OR UPPER(k.no_bukti) LIKE 'BNU%' THEN -1
        -- Priority 6: Expense IDs (1=Belanja, 3=Tarik Tunai, 5=BPU, 11=Setor Pajak, 13=Pindahan)
        WHEN k.id_ref_bku IN (1, 3, 5, 11, 13) THEN -1
        -- Priority 7: Receipt IDs (2=BOSP, 4=Setor Tunai, 10=Pungut Pajak, 12=Giro, 14=Pindahan+, 26/28=Bunga)
        WHEN k.id_ref_bku IN (2, 4, 10, 12, 14, 26, 28) THEN 1
        -- Priority 8: Keyword fallback
        WHEN LOWER(k.uraian) LIKE '%terima%' THEN 1
        WHEN LOWER(k.uraian) LIKE '%penerimaan%' THEN 1
        WHEN LOWER(k.uraian) LIKE '%giro%' THEN 1
        WHEN LOWER(k.uraian) LIKE '%bunga bank%' THEN 1
        WHEN LOWER(k.uraian) LIKE '%pengembalian%' THEN 1
        WHEN LOWER(k.uraian) LIKE '%pungut%' THEN 1
        -- Default: pengeluaran
        ELSE -1
      END) as mutasi_netto,
      SUM(CASE WHEN k.id_ref_bku NOT IN (8, 9) AND (
        LOWER(k.uraian) LIKE '%saldo%'
        OR LOWER(k.uraian) LIKE '%setor tunai%'
        OR LOWER(k.uraian) LIKE '%pergeseran uang di bank%'
        OR k.id_ref_bku IN (2, 4, 10, 12, 14, 26, 28)
        OR LOWER(k.uraian) LIKE '%terima%'
        OR LOWER(k.uraian) LIKE '%penerimaan%'
        OR LOWER(k.uraian) LIKE '%giro%'
        OR LOWER(k.uraian) LIKE '%bunga bank%'
        OR LOWER(k.uraian) LIKE '%pengembalian%'
        OR LOWER(k.uraian) LIKE '%pungut%'
      ) THEN k.saldo ELSE 0 END) as total_penerimaan,
      SUM(CASE WHEN k.id_ref_bku NOT IN (8, 9) AND NOT (
        LOWER(k.uraian) LIKE '%saldo%'
        OR LOWER(k.uraian) LIKE '%setor tunai%'
        OR LOWER(k.uraian) LIKE '%pergeseran uang di bank%'
        OR k.id_ref_bku IN (2, 4, 10, 12, 14, 26, 28)
        OR LOWER(k.uraian) LIKE '%terima%'
        OR LOWER(k.uraian) LIKE '%penerimaan%'
        OR LOWER(k.uraian) LIKE '%giro%'
        OR LOWER(k.uraian) LIKE '%bunga bank%'
        OR LOWER(k.uraian) LIKE '%pengembalian%'
        OR LOWER(k.uraian) LIKE '%pungut%'
      ) THEN k.saldo ELSE 0 END) as total_pengeluaran,
      SUM(CASE WHEN k.id_ref_bku = 3 THEN k.saldo ELSE 0 END) as tarik_tunai,
      SUM(CASE WHEN k.id_ref_bku = 4 THEN k.saldo ELSE 0 END) as setor_tunai,
      SUM(CASE WHEN (UPPER(k.no_bukti) LIKE 'BPU%' OR UPPER(k.no_bukti) LIKE 'BNU%')
        AND k.id_ref_bku NOT IN (8, 9) THEN k.saldo ELSE 0 END) as pengeluaran_bpu
    FROM kas_umum k
    WHERE strftime('%Y', k.tanggal_transaksi) = ?
      AND k.soft_delete = 0
    GROUP BY bulan
    ORDER BY bulan
  `
    )
    .all(yearStr);

  // 3. Get saldo tunai checkpoints
  const tunaiCheckpoints = {};
  try {
    const cpRows = db
      .prepare(
        `
      SELECT 
        strftime('%m', tanggal_transaksi) as bulan_checkpoint,
        SUM(saldo) as total_saldo
      FROM kas_umum
      WHERE strftime('%Y', tanggal_transaksi) = ?
        AND soft_delete = 0
        AND id_ref_bku = 9
        AND uraian LIKE 'Saldo Tunai Bulan%'
      GROUP BY bulan_checkpoint
    `
      )
      .all(yearStr);

    cpRows.forEach((cp) => {
      let targetMonth = parseInt(cp.bulan_checkpoint) - 1;
      if (targetMonth === 0) targetMonth = 12;
      const monthKey = targetMonth.toString().padStart(2, '0');
      tunaiCheckpoints[monthKey] = Number(cp.total_saldo) || 0;
    });
  } catch (e) {}

  // 4. Build monthly data with running balances
  let runningTotal = saldoAwalTotal;
  let runningTunai = saldoAwalTunai;

  const months = [];
  for (let m = 1; m <= 12; m++) {
    const monthKey = m.toString().padStart(2, '0');
    const raw = monthlyData.find((d) => d.bulan === monthKey) || {};

    const mutasiNetto = Number(raw.mutasi_netto) || 0;
    const totalPenerimaanBank = Number(raw.total_penerimaan) || 0;
    const totalPengeluaranBank = Number(raw.total_pengeluaran) || 0;
    const tarikTunai = Number(raw.tarik_tunai) || 0;
    const setorTunai = Number(raw.setor_tunai) || 0;
    const pengeluaranBPU = Number(raw.pengeluaran_bpu) || 0;

    runningTotal += mutasiNetto;
    if (runningTotal < 0) runningTotal = 0;

    runningTunai += tarikTunai - setorTunai - pengeluaranBPU;
    if (runningTunai < 0) runningTunai = 0;

    if (tunaiCheckpoints[monthKey] !== undefined) {
      runningTunai = tunaiCheckpoints[monthKey];
    }

    if (runningTunai > runningTotal) runningTunai = runningTotal;

    let saldoBank = runningTotal - runningTunai;
    if (saldoBank < 0) saldoBank = 0;

    months.push({
      bulan: m,
      nama: MONTHS[m - 1],
      saldoAwalBank: m === 1 ? saldoAwalBank : 0,
      totalPenerimaanBank,
      totalPengeluaranBank,
      saldoAkhirBank: saldoBank,
      saldoTunai: runningTunai,
      saldoTotal: runningTotal,
    });
  }

  // 5. Set saldoAwalBank for months > 1
  for (let i = 1; i < months.length; i++) {
    months[i].saldoAwalBank = months[i - 1].saldoAkhirBank;
  }

  // 6. Load saved bank statement values
  const localData = loadLocalData();
  const savedValues = localData[yearStr] || {};

  return {
    year,
    saldoAwalBank,
    months,
    savedValues,
  };
}

function saveBankStatementValues(year, values) {
  const data = loadLocalData();
  data[year.toString()] = values;
  saveLocalData(data);
  return true;
}

module.exports = {
  initBankReconStorage,
  getBankReconciliationData,
  saveBankStatementValues,
};
