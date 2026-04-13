import React from 'react';
import { formatRupiah } from '../../../utils/transactionHelpers';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

const RiwayatTransaksi = ({ penerimaanDana, pengeluaranTerbaru }) => {
  const totalPenerimaan = (penerimaanDana || []).reduce((sum, item) => sum + (item.nominal || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Penerimaan Dana */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowDownCircle size={18} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800">Penerimaan Dana</h3>
          </div>
          {penerimaanDana && penerimaanDana.length > 0 && (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              {penerimaanDana.length} Tahap
            </span>
          )}
        </div>
        <div className="overflow-auto custom-scrollbar flex-1">
          {(!penerimaanDana || penerimaanDana.length === 0) ? (
            <div className="text-sm text-slate-500 py-8 text-center">Belum ada penerimaan.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-8">#</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Uraian</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">Tanggal</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {penerimaanDana.map((item, idx) => (
                  <tr key={idx} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="py-2.5 px-4 text-sm text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-4 text-sm text-slate-700 font-medium max-w-[200px]">
                      <span className="line-clamp-1">{item.uraian}</span>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-500 text-center font-mono whitespace-nowrap">
                      {item.tanggal_transaksi ? new Date(item.tanggal_transaksi).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-sm font-bold text-emerald-600 text-right whitespace-nowrap">
                      {formatRupiah(item.nominal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-slate-200">
                  <td colSpan="3" className="py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase text-right">Total</td>
                  <td className="py-2.5 px-4 text-sm font-bold text-emerald-700 text-right">{formatRupiah(totalPenerimaan)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* Pengeluaran Terbaru */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpCircle size={18} className="text-rose-600" />
            <h3 className="text-sm font-bold text-slate-800">Pengeluaran Terbaru</h3>
          </div>
          {pengeluaranTerbaru && pengeluaranTerbaru.length > 0 && (
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
              {pengeluaranTerbaru.length} Data
            </span>
          )}
        </div>
        <div className="overflow-auto custom-scrollbar flex-1 max-h-[350px]">
          {(!pengeluaranTerbaru || pengeluaranTerbaru.length === 0) ? (
            <div className="text-sm text-slate-500 py-8 text-center">Belum ada pengeluaran.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-slate-100">
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-8">#</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Uraian</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">Tanggal</th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pengeluaranTerbaru.map((item, idx) => (
                  <tr key={idx} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-2.5 px-4 text-sm text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-4 text-sm text-slate-700 font-medium max-w-[200px]">
                      <span className="line-clamp-1" title={item.uraian}>{item.uraian}</span>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-500 text-center font-mono whitespace-nowrap">
                      {item.tanggal_transaksi ? new Date(item.tanggal_transaksi).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-sm font-bold text-rose-600 text-right whitespace-nowrap">
                      {formatRupiah(item.nominal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiwayatTransaksi;
