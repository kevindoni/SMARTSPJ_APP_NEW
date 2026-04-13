import React, { useMemo } from 'react';
import { Wallet, ArrowDownCircle, CreditCard, PiggyBank, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatRupiah } from '../../../utils/transactionHelpers';

const cards = [
  {
    key: 'pagu',
    title: 'PAGU ANGGARAN',
    field: 'anggaran',
    icon: Wallet,
    accent: 'border-l-rose-400',
    iconColor: 'text-rose-500',
    iconBg: 'bg-rose-50',
    valueColor: 'text-rose-600',
    bgGradient: 'from-rose-50/60 to-white',
  },
  {
    key: 'penerimaan',
    title: 'PENERIMAAN',
    field: 'penerimaan',
    icon: ArrowDownCircle,
    accent: 'border-l-emerald-400',
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-50',
    valueColor: 'text-emerald-600',
    bgGradient: 'from-emerald-50/60 to-white',
    subtitle: true,
  },
  {
    key: 'realisasi',
    title: 'REALISASI BELANJA',
    field: 'realisasi',
    icon: CreditCard,
    accent: 'border-l-red-400',
    iconColor: 'text-red-500',
    iconBg: 'bg-red-50',
    valueColor: 'text-red-600',
    bgGradient: 'from-red-50/80 to-red-50/20',
  },
  {
    key: 'sisa',
    title: 'SISA ANGGARAN',
    field: null, // Computed: PAGU - REALISASI
    computed: (stats) => (stats.anggaran || 0) - (stats.realisasi || 0),
    icon: PiggyBank,
    accent: 'border-l-emerald-400',
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-50',
    valueColor: 'text-emerald-600',
    bgGradient: 'from-emerald-50/60 to-white',
  },
];

/**
 * Calculate month-over-month comparison for a given metric
 * Returns { changePercent, isPositive, label } or null if no comparison available
 */
function getMonthComparison(chart, field, computedFn, stats) {
  if (!chart || chart.length === 0) return null;

  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

  // Find current and previous month data from chart
  const currentData = chart.find(d => d.bulan === currentMonth);
  const prevMonthNum = String(now.getMonth()).padStart(2, '0');
  const prevData = chart.find(d => d.bulan === prevMonthNum);

  if (!currentData || !prevData) return null;

  let currentVal, prevVal;

  if (field === 'penerimaan') {
    currentVal = currentData.penerimaan || 0;
    prevVal = prevData.penerimaan || 0;
  } else if (field === 'realisasi') {
    currentVal = currentData.pengeluaran || 0;
    prevVal = prevData.pengeluaran || 0;
  } else if (computedFn) {
    // For computed fields (sisa), we can't compare monthly from chart
    return null;
  } else {
    return null;
  }

  if (prevVal === 0 && currentVal === 0) return null;
  if (prevVal === 0) return { changePercent: null, isPositive: true, currentVal, prevVal, label: 'baru' };

  const changePercent = ((currentVal - prevVal) / prevVal) * 100;
  // For penerimaan: up is good. For realisasi: down is good (less spending)
  const isPositive = field === 'realisasi' ? changePercent <= 0 : changePercent >= 0;

  return { changePercent, isPositive, currentVal, prevVal };
}

const TopCards = ({ stats }) => {
  if (!stats) return null;

  // Calculate month-over-month comparisons
  const comparisons = useMemo(() => {
    const chart = stats.chart || [];
    const result = {};
    cards.forEach(card => {
      if (card.field === 'anggaran') return; // Pagu doesn't change monthly
      result[card.key] = getMonthComparison(chart, card.field, card.computed, stats);
    });
    return result;
  }, [stats]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const prevMonthLabel = monthNames[new Date().getMonth()];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = card.computed ? card.computed(stats) : stats[card.field] || 0;
        const comp = comparisons[card.key];

        return (
          <div
            key={card.key}
            className={`relative bg-gradient-to-r ${card.bgGradient} rounded-xl border border-slate-200/80 border-l-4 ${card.accent} shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden`}
          >
            <div className="p-4 flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${card.iconBg}`}>
                    <Icon size={16} className={card.iconColor} strokeWidth={2.5} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {card.title}
                  </span>
                </div>
                <h3
                  className={`text-xl font-extrabold ${card.valueColor} tracking-tight leading-tight`}
                >
                  {formatRupiah(value)}
                </h3>
                {card.subtitle && stats.penerimaan > 0 && (
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">
                    {stats.penerimaan_dana?.length || 1} Tahap
                  </p>
                )}
              </div>

              {/* Month-over-Month Comparison Badge */}
              {comp && comp.changePercent !== null && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${
                  comp.isPositive 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : 'bg-rose-50 text-rose-600'
                }`}>
                  {comp.isPositive ? (
                    <TrendingUp size={12} />
                  ) : (
                    <TrendingDown size={12} />
                  )}
                  <span>{Math.abs(comp.changePercent).toFixed(1)}%</span>
                </div>
              )}
            </div>
            {comp && (
              <div className="px-4 pb-3">
                <p className="text-[10px] text-slate-400">
                  vs {prevMonthLabel}: {formatRupiah(comp.currentVal)} vs {formatRupiah(comp.prevVal)}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TopCards;
