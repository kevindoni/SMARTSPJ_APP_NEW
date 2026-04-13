import React from 'react';
import { formatRupiah } from '../../../utils/transactionHelpers';
import { BarChart3 } from 'lucide-react';

const RingkasanSumberDana = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
        <BarChart3 size={18} className="text-indigo-600" />
        <h3 className="text-sm font-bold text-slate-800">Ringkasan per Sumber Dana</h3>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/40">
              <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sumber Dana</th>
              <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Pagu</th>
              <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Realisasi</th>
              <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Sisa</th>
              <th className="py-3 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right w-32">Penyerapan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, idx) => {
              const sisa = (row.pagu || 0) - (row.realisasi || 0);
              const persen = row.pagu > 0 ? (row.realisasi / row.pagu) * 100 : 0;
              return (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-sm font-semibold text-slate-800">{row.nama_sumber_dana}</td>
                  <td className="py-3 px-4 text-sm text-slate-600 text-right whitespace-nowrap">{formatRupiah(row.pagu)}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-rose-600 text-right whitespace-nowrap">{formatRupiah(row.realisasi)}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-emerald-600 text-right whitespace-nowrap">{formatRupiah(Math.max(sisa, 0))}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${persen > 80 ? 'bg-rose-500' : persen > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(persen, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-slate-700 min-w-[40px] text-right">{persen.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RingkasanSumberDana;
