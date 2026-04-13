import { Wallet, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { formatRupiah, MONTHS } from '../../utils/transactionHelpers';

const StatCard = ({ title, value, icon: Icon, colorClass, bgClass }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center gap-5 transition-all hover:shadow-md">
    <div className={`p-3.5 rounded-xl ${bgClass} ${colorClass}`}>
      <Icon size={24} strokeWidth={2} />
    </div>
    <div>
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
        {title}
      </div>
      <div className="text-xl font-bold text-slate-800 tracking-tight">
        {formatRupiah(value || 0)}
      </div>
    </div>
  </div>
);

export default function TransactionSummary({
  tableSaldo,
  tablePenerimaan,
  tablePengeluaran,
  selectedMonth,
}) {
  const isAllMonths = selectedMonth === 'SEMUA';
  const monthData = !isAllMonths ? MONTHS.find((m) => m.id === selectedMonth) : null;
  const monthName = monthData ? monthData.name : '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        title={isAllMonths ? 'Sisa Saldo Tahunan' : `Saldo Akhir ${monthName}`}
        value={tableSaldo}
        icon={Wallet}
        colorClass="text-blue-600"
        bgClass="bg-blue-50"
      />
      <StatCard
        title={isAllMonths ? 'Total Penerimaan' : `Penerimaan ${monthName}`}
        value={tablePenerimaan}
        icon={ArrowDownCircle}
        colorClass="text-emerald-600"
        bgClass="bg-emerald-50"
      />
      <StatCard
        title={isAllMonths ? 'Total Pengeluaran' : `Belanja ${monthName}`}
        value={tablePengeluaran}
        icon={ArrowUpCircle}
        colorClass="text-red-500"
        bgClass="bg-red-50"
      />
    </div>
  );
}
