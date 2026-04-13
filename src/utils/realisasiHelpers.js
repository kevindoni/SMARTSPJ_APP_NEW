/**
 * Realisasi Belanja Helper Functions
 * Extracted from RealisasiBelanja.jsx
 */

/**
 * Month options for period selector
 */
export const REALISASI_MONTHS = [
  { v: 0, n: 'Sampai Bulan Ini (Kumulatif)' },
  { v: 1, n: 'Januari' },
  { v: 2, n: 'Februari' },
  { v: 3, n: 'Maret' },
  { v: 4, n: 'April' },
  { v: 5, n: 'Mei' },
  { v: 6, n: 'Juni' },
  { v: 7, n: 'Juli' },
  { v: 8, n: 'Agustus' },
  { v: 9, n: 'September' },
  { v: 10, n: 'Oktober' },
  { v: 11, n: 'November' },
  { v: 12, n: 'Desember' },
];

/**
 * Parse planned vs realized months for budget tracking
 * @param {string} rawPlanned - Comma-separated planned periods (id_periode:volume)
 * @param {string} rawRealized - Comma-separated realized months (month:amount)
 * @param {number} unitPrice - Price per unit
 * @returns {Array} Monthly breakdown with plan vs actual data
 */
export const parsePlannedMonths = (rawPlanned, rawRealized, unitPrice = 0) => {
  const planMap = (rawPlanned || '').split(',').reduce((acc, item) => {
    const [id_periode, vol] = item.split(':');
    acc[Number(id_periode)] = Number(vol);
    return acc;
  }, {});

  const realMap = (rawRealized || '').split(',').reduce((acc, item) => {
    const [mStr, val] = item.split(':');
    acc[Number(mStr)] = Number(val);
    return acc;
  }, {});

  // Calculate cumulative realization BY MONTH (Cashflow over time)
  let cumRealByMonth = {};
  let total = 0;
  for (let i = 1; i <= 12; i++) {
    total += realMap[i] || 0;
    cumRealByMonth[i] = total;
  }

  let runningPlanTotal = 0;
  return REALISASI_MONTHS.filter((m) => m.v > 0).map((mObj) => {
    const arkasPeriod = mObj.v + 80;
    const planVol = planMap[arkasPeriod] || 0;
    const planAmt = planVol * unitPrice;
    const actualTransInMonth = realMap[mObj.v] || 0;

    runningPlanTotal += planAmt;

    let paidInMonth = null;
    let isCovered = false;

    if (planAmt > 0) {
      // Find first month that covers this cumulative plan
      for (let rMonth = 1; rMonth <= 12; rMonth++) {
        if (cumRealByMonth[rMonth] >= runningPlanTotal) {
          paidInMonth = rMonth;
          isCovered = true;
          break;
        }
      }
    } else if (actualTransInMonth > 0) {
      // No plan but spend happened (Cross-period)
      isCovered = true;
      paidInMonth = mObj.v;
    }

    return {
      m: mObj.v,
      monthName: mObj.n,
      vol: planVol,
      realAmt: planAmt,
      isBudgeted: planVol > 0,
      isRealized: isCovered,
      paidInMonth: paidInMonth,
      actualTrans: actualTransInMonth,
    };
  });
};

/**
 * Get shift info for budget item (moved to different month)
 * @param {object} item - Budget item with planned_months and realized_months
 * @param {number} currentMonth - Currently selected month
 * @returns {object|null} Shift info { type: 'to'|'from', month: string }
 */
export const getShiftInfo = (item, currentMonth) => {
  if (!item || currentMonth === 0) return null;
  const up = item.harga_satuan || item.harga || 0;
  const flow = parsePlannedMonths(item.planned_months, item.realized_months, up);

  const myPlan = flow.find((f) => f.m === currentMonth);
  if (myPlan && myPlan.vol > 0 && myPlan.paidInMonth && myPlan.paidInMonth !== currentMonth) {
    return { type: 'to', month: REALISASI_MONTHS.find((m) => m.v === myPlan.paidInMonth)?.n };
  }

  const coveredPlans = flow.filter(
    (f) => f.paidInMonth === currentMonth && f.m !== currentMonth && f.vol > 0
  );
  if (coveredPlans.length > 0) {
    const sourceMonths = coveredPlans
      .map((f) => REALISASI_MONTHS.find((m) => m.v === f.m)?.n)
      .join(', ');
    return { type: 'from', month: sourceMonths };
  }
  return null;
};

/**
 * Group items by activity for summary view
 * @param {Array} items - Budget items
 * @returns {Array} Sorted activities with aggregated data
 */
export const groupByActivity = (items) => {
  const activities = items.reduce((acc, current) => {
    const key = current.kode_kegiatan;
    if (!acc[key]) {
      acc[key] = {
        kode: current.kode_kegiatan,
        nama: current.nama_kegiatan,
        anggaran: 0,
        realisasi: 0,
        vol_pagu: 0,
        vol_realisasi: 0,
        vol_realisasi_kumulatif: 0,
        units: new Set(),
        rekenings: [],
      };
    }
    acc[key].anggaran += current.total_anggaran;
    acc[key].realisasi += current.total_realisasi || 0;
    acc[key].vol_pagu += current.total_volume_pagu || 0;
    acc[key].vol_realisasi += current.total_volume_realisasi || 0;
    acc[key].vol_realisasi_kumulatif += current.cumulative_volume_realisasi || 0;
    if (current.satuan) acc[key].units.add(current.satuan);
    acc[key].rekenings.push(current);
    return acc;
  }, {});

  return Object.values(activities).sort((a, b) => a.kode.localeCompare(b.kode));
};
