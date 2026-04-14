import React, { useMemo } from 'react';
import { formatRupiah } from '../../../utils/transactionHelpers';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const PergerakanKasBulanan = ({ data }) => {
  const tableData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((row) => {
      return {
        ...row,
        mutasi: row.masuk - row.keluar,
      };
    });
  }, [data]);

  if (!tableData.length) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-sm font-bold text-slate-800 tracking-wide">
          Pergerakan Saldo Kas (Bulanan)
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Analisis arus kas masuk dan keluar selama tahun anggaran berjalan
        </p>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead className="bg-slate-50 sticky top-0 z-10 box-shadow-sm">
            <tr>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                Bulan
              </th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-right">
                Debit (Masuk)
              </th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-right">
                Kredit (Keluar)
              </th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-right">
                Mutasi
              </th>
              <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-right">
                Saldo Kas
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tableData.map((row, idx) => {
              const hasActivity = row.masuk > 0 || row.keluar > 0;
              const isPositive = row.mutasi > 0;

              return (
                <tr
                  key={idx}
                  className={`hover:bg-slate-50/80 transition-colors ${!hasActivity ? 'opacity-50' : ''}`}
                >
                  <td className="py-2.5 px-4 text-sm font-medium text-slate-700">{row.bulan}</td>
                  <td className="py-2.5 px-4 text-sm text-emerald-600 font-medium text-right">
                    {row.masuk > 0 ? formatRupiah(row.masuk) : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-sm text-rose-600 font-medium text-right">
                    {row.keluar > 0 ? formatRupiah(row.keluar) : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-sm text-right font-medium">
                    {row.mutasi === 0 ? (
                      <span className="text-slate-400 flex items-center justify-end gap-1">
                        <Minus size={14} /> 0
                      </span>
                    ) : isPositive ? (
                      <span className="text-emerald-600 flex items-center justify-end gap-1">
                        <TrendingUp size={14} /> {formatRupiah(Math.abs(row.mutasi))}
                      </span>
                    ) : (
                      <span className="text-rose-600 flex items-center justify-end gap-1">
                        <TrendingDown size={14} /> {formatRupiah(Math.abs(row.mutasi))}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-sm font-bold text-right">
                    {row.saldo < 0 ? (
                      <span className="text-rose-600">{formatRupiah(Math.abs(row.saldo))}-</span>
                    ) : (
                      <span className="text-slate-800">{formatRupiah(row.saldo)}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default PergerakanKasBulanan;
