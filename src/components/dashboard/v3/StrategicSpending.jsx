import React from 'react';
import { formatRupiah } from '../../../utils/transactionHelpers';
import { Trophy, Activity } from 'lucide-react';

const StrategicSpending = ({ kegiatan, top5 }) => {

  const renderKegiatan = () => {
    if (!kegiatan || kegiatan.length === 0) {
      return <div className="text-sm text-slate-500 py-8 text-center">Data kegiatan belum tersedia.</div>;
    }

    return (
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/60">
            <th className="py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-8">#</th>
            <th className="py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Kegiatan</th>
            <th className="py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Anggaran</th>
            <th className="py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Realisasi</th>
            <th className="py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right w-20">%</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {kegiatan.map((keg, idx) => {
            const persentase = keg.pagu_kegiatan > 0 ? (keg.realisasi / keg.pagu_kegiatan) * 100 : 0;
            return (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 px-3 text-sm text-slate-400 font-medium">{idx + 1}</td>
                <td className="py-2.5 px-3 text-sm text-slate-700 font-medium leading-snug max-w-[250px]">
                  <span className="line-clamp-2" title={keg.nama_kegiatan}>
                    {keg.nama_kegiatan || 'Tanpa Kegiatan'}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-sm text-slate-600 text-right whitespace-nowrap">
                  {formatRupiah(keg.pagu_kegiatan)}
                </td>
                <td className="py-2.5 px-3 text-sm font-semibold text-rose-600 text-right whitespace-nowrap">
                  {keg.realisasi > 0 ? formatRupiah(keg.realisasi) : <span className="text-slate-400">Rp 0</span>}
                </td>
                <td className="py-2.5 px-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          persentase > 90 ? 'bg-rose-500' : persentase > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(persentase, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-slate-700 min-w-[35px] text-right">{persentase.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const renderTop5 = () => {
    if (!top5 || top5.length === 0) {
      return <div className="text-sm text-slate-500 py-8 text-center">Tidak ada data transaksi.</div>;
    }

    return (
      <div className="space-y-2.5">
        {top5.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                idx === 0 ? 'bg-rose-100 text-rose-600' : 
                idx === 1 ? 'bg-orange-100 text-orange-600' : 
                idx === 2 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'
            }`}>
              #{idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 mb-0.5 mt-0.5 line-clamp-2 leading-tight" title={item.uraian}>
                {item.uraian}
              </p>
              <span className="text-xs text-slate-400 font-mono">{item.tanggal_transaksi?.split(' ')[0]}</span>
            </div>
            <div className="flex-shrink-0 text-right mt-0.5">
              <span className="text-sm font-bold text-rose-600">{formatRupiah(item.nominal)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-full">
      {/* Kolom Kiri: Top 5 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 sticky top-0 z-10">
          <Trophy size={18} className="text-rose-600" />
          <h3 className="text-sm font-bold text-slate-800">Top 5 Belanja Terbesar</h3>
        </div>
        <div className="p-2 overflow-auto custom-scrollbar flex-1">
          {renderTop5()}
        </div>
      </div>

      {/* Kolom Kanan: Belanja per Kegiatan (TABULAR) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2 sticky top-0 z-10">
          <Activity size={18} className="text-blue-600" />
          <h3 className="text-sm font-bold text-slate-800">Belanja per Kegiatan</h3>
        </div>
        <div className="overflow-auto custom-scrollbar flex-1">
          {renderKegiatan()}
        </div>
      </div>
    </div>
  );
};

export default StrategicSpending;
