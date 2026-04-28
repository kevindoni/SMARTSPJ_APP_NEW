import { Landmark } from 'lucide-react';
import { formatRupiah } from '../../utils/reconciliationHelpers';
import { theme } from '../../theme';

export default function BungaTable({ data }) {
  if (!data) return null;
  const { rows } = data;

  const renderRow = (row, idx) => {
    const isSummary = row.isSummary;

    // Enhanced row styling based on type
    let rowClass = 'border-b border-slate-200 ';
    if (isSummary) {
      if (row.label.includes('TRIWULAN')) {
        rowClass += 'bg-amber-50 font-semibold border-y-2 border-amber-200';
      } else if (row.label.includes('SEMESTER')) {
        rowClass += 'bg-violet-50 font-semibold border-y-2 border-violet-200';
      } else if (row.label.includes('JUMLAH')) {
        rowClass += 'bg-emerald-800 text-white font-bold';
      }
    } else {
      rowClass += 'bg-white hover:bg-slate-50/80 transition-colors';
    }

    return (
      <tr key={idx} className={rowClass}>
        <td className="px-3 py-2.5 text-center border-r border-slate-200">
          {isSummary ? '' : row.month}
        </td>
        <td className="px-3 py-2.5 border-r border-slate-200 font-medium">
          {row.monthName || row.label}
        </td>
        <td className="px-3 py-2.5 text-right border-r border-slate-200 font-mono">
          {formatRupiah(row.values.bunga)}
        </td>
        <td className="px-3 py-2.5 text-right border-r border-slate-200 font-mono">
          {formatRupiah(row.values.adm)}
        </td>
        <td className="px-3 py-2.5 text-right font-bold font-mono">
          {formatRupiah(row.values.saldo)}
        </td>
      </tr>
    );
  };

  return (
    <div className={theme.card}>
      {/* Section Header */}
      <div className="bg-blue-50 px-5 py-4 border-b border-blue-100 flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Landmark size={20} className="text-blue-600" />
        </div>
        <div>
          <h3 className="text-blue-800 font-bold uppercase tracking-wide text-sm">
            Rekap Bunga Bank & Biaya Administrasi
          </h3>
          <p className={theme.text.subtle}>
            Rincian penerimaan bunga dan potongan administrasi per bulan
          </p>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-700 text-white text-center">
              <th className="px-3 py-3 border border-slate-600 w-16 font-bold">NO</th>
              <th className="px-3 py-3 border border-slate-600 font-bold">NAMA BULAN</th>
              <th className="px-3 py-3 border border-slate-600 font-bold">BUNGA BANK</th>
              <th className="px-3 py-3 border border-slate-600 font-bold">
                BIAYA ADM & PAJAK BUNGA
              </th>
              <th className="px-3 py-3 border border-slate-600 font-bold">SALDO</th>
            </tr>
            <tr className="bg-slate-600 text-slate-300 text-xs text-center font-mono">
              <th className="px-2 py-1.5 border border-slate-500">1</th>
              <th className="px-2 py-1.5 border border-slate-500">2</th>
              <th className="px-2 py-1.5 border border-slate-500">3</th>
              <th className="px-2 py-1.5 border border-slate-500">4</th>
              <th className="px-2 py-1.5 border border-slate-500">5 (3-4)</th>
            </tr>
          </thead>
          <tbody>{rows.map((row, idx) => renderRow(row, idx))}</tbody>
        </table>
      </div>

      {/* Legend Footer */}
      <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center gap-4 text-[10px]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200"></div>
          <span className="text-slate-500">Triwulan</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-violet-100 border border-violet-200"></div>
          <span className="text-slate-500">Semester</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-700"></div>
          <span className="text-slate-500">Total Tahunan</span>
        </div>
      </div>
    </div>
  );
}
