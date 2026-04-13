import React from 'react';
import { FileText, ArrowDownCircle, Hash, BookOpen, TrendingUp, Percent } from 'lucide-react';
import { formatRupiah } from '../../../utils/transactionHelpers';

const MasterProgress = ({ stats }) => {
  if (!stats) return null;

  const penyerapan = stats.anggaran > 0 ? (stats.realisasi / stats.anggaran) * 100 : 0;
  const statusLabel = penyerapan >= 75 ? 'Tinggi' : penyerapan >= 40 ? 'Sedang' : 'Rendah !';
  const statusColor =
    penyerapan >= 75 ? 'text-emerald-600' : penyerapan >= 40 ? 'text-amber-600' : 'text-rose-600';
  const statusDot =
    penyerapan >= 75 ? 'bg-emerald-500' : penyerapan >= 40 ? 'bg-amber-500' : 'bg-rose-500';

  const infoBadges = [
    {
      icon: FileText,
      label: 'SUMBER DANA',
      value: stats.ringkasan_sumber_dana?.length || 1,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      valueBold: 'text-emerald-700',
    },
    {
      icon: ArrowDownCircle,
      label: 'PENERIMAAN',
      value: `${stats.penerimaan_dana?.length || 1} Tahap`,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      valueBold: 'text-emerald-700',
    },
    {
      icon: Hash,
      label: 'ITEM RAPBS',
      value: stats.item_rapbs_count || 0,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      valueBold: 'text-blue-700',
    },
    {
      icon: BookOpen,
      label: 'KEGIATAN',
      value: stats.kegiatan_count || 0,
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      valueBold: 'text-orange-700',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Progress Bar Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-slate-500" />
          <h4 className="text-sm font-semibold text-slate-700">Penyerapan Anggaran</h4>
        </div>

        <div className="flex items-center justify-end gap-6 mb-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            <span className="text-slate-500">Pagu:</span>
            <span className="font-bold text-slate-700">{formatRupiah(stats.anggaran)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span className="text-slate-500">Realisasi:</span>
            <span className="font-bold text-rose-600">{formatRupiah(stats.realisasi)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-slate-500">Sisa:</span>
            <span className="font-bold text-emerald-600">
              {formatRupiah((stats.anggaran || 0) - (stats.realisasi || 0))}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-rose-400 via-rose-500 to-pink-500 transition-all duration-1000 ease-out relative rounded-full"
              style={{ width: `${Math.min(penyerapan, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full h-full shimmering-effect rounded-full"></div>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <span className="text-lg font-extrabold text-slate-800 tracking-tight">
              {penyerapan.toFixed(1)}
            </span>
            <Percent size={12} className="text-slate-500 mt-0.5" />
          </div>
        </div>
      </div>

      {/* Info Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {infoBadges.map((badge, idx) => {
          const Icon = badge.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className={`inline-flex p-1.5 rounded-lg ${badge.iconBg} mb-2`}>
                <Icon size={15} className={badge.iconColor} strokeWidth={2.5} />
              </div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                {badge.label}
              </p>
              <p className={`text-lg font-extrabold ${badge.valueBold} leading-tight`}>
                {badge.value}
              </p>
            </div>
          );
        })}

        {/* Status Card (special) */}
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl border border-rose-200/60 p-3.5 shadow-sm relative overflow-hidden">
          <div
            className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${statusDot} animate-pulse`}
          ></div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            STATUS PENYERAPAN
          </p>
          <p className={`text-lg font-extrabold ${statusColor} leading-tight`}>{statusLabel}</p>
        </div>
      </div>

      <style>{`
        .shimmering-effect {
          background-image: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default MasterProgress;
