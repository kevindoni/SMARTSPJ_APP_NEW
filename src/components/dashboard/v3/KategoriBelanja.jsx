import React from 'react';
import { Package, Monitor, Building2 } from 'lucide-react';
import { formatRupiah } from '../../../utils/transactionHelpers';

const getCategoryStyles = (id) => {
  switch (id) {
    case 'barang_jasa':
      return { icon: Package, label: 'BELANJA BARANG DAN JASA', bar: 'bg-rose-500', badge: 'text-rose-600 bg-rose-50', iconBg: 'bg-rose-100', iconColor: 'text-rose-600' };
    case 'modal_alat':
      return { icon: Monitor, label: 'BELANJA MODAL ALAT DAN MESIN', bar: 'bg-blue-500', badge: 'text-blue-600 bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' };
    case 'modal_aset_lain':
      return { icon: Building2, label: 'BELANJA MODAL ASET TETAP LAINNYA', bar: 'bg-amber-500', badge: 'text-amber-600 bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' };
    default:
      return { icon: Package, label: 'Kategori Lain', bar: 'bg-slate-500', badge: 'text-slate-600 bg-slate-50', iconBg: 'bg-slate-100', iconColor: 'text-slate-600' };
  }
};

const CategoryCard = ({ item }) => {
  const style = getCategoryStyles(item.id);
  const Icon = style.icon;
  const percentage = item.anggaran > 0 ? (item.realisasi / item.anggaran) * 100 : 0;
  const sisa = Math.max((item.anggaran || 0) - (item.realisasi || 0), 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Header with icon, title & percentage badge */}
      <div className="p-4 pb-3 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${style.iconBg}`}>
          <Icon size={18} className={style.iconColor} strokeWidth={2.5} />
        </div>
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex-1 leading-tight">{style.label}</h4>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
          {percentage.toFixed(1)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="px-4 mb-3">
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${style.bar} transition-all duration-700`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Breakdown: Anggaran / Realisasi / Sisa */}
      <div className="px-4 pb-4 space-y-1.5">
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-slate-400 font-medium">Anggaran</span>
          <span className="text-sm font-semibold text-slate-700">{formatRupiah(item.anggaran)}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-slate-400 font-medium">Realisasi</span>
          <span className="text-sm font-bold text-rose-600">{item.realisasi > 0 ? formatRupiah(item.realisasi) : 'Rp 0'}</span>
        </div>
        <div className="flex justify-between items-baseline">
          <span className="text-xs text-slate-400 font-medium">Sisa</span>
          <span className="text-sm font-bold text-emerald-600">{formatRupiah(sisa)}</span>
        </div>
      </div>
    </div>
  );
};

const KategoriBelanja = ({ categories }) => {
  if (!categories || categories.length === 0) return null;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map((cat, idx) => (
          <CategoryCard key={idx} item={cat} />
        ))}
      </div>
    </div>
  );
};

export default KategoriBelanja;
