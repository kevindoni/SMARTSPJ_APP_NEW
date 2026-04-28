import { Receipt, AlertCircle } from 'lucide-react';
import { formatRupiah } from '../../utils/reconciliationHelpers';
import { theme } from '../../theme';

export default function PajakTable({ data }) {
  if (!data) return null;
  const { rows, manualTaxes } = data;

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

    const v = row.values;

    return (
      <tr key={idx} className={rowClass}>
        <td className="px-3 py-2.5 text-center border-r border-slate-200">
          {row.month || (row.label.includes('JUMLAH') ? '' : row.label)}
        </td>
        <td className="px-3 py-2.5 border-r border-slate-200 font-medium min-w-[120px]">
          {row.monthName || row.label}
        </td>

        <td className="px-3 py-2.5 text-right border-r border-slate-200 font-mono">
          {formatRupiah(v.saldoAwal)}
        </td>

        {/* Penerimaan */}
        <td className="px-3 py-2.5 text-right border-r border-slate-200 bg-blue-50/30 font-mono">
          {formatRupiah(v.pungut.ppn)}
        </td>
        <td className="px-3 py-2.5 text-right border-r border-slate-200 bg-blue-50/30 font-mono">
          {formatRupiah(v.pungut.pph21)}
        </td>
        <td className="px-3 py-2.5 text-right border-r border-slate-200 bg-blue-50/30 font-mono">
          {formatRupiah(v.pungut.pph22)}
        </td>
        <td className="px-3 py-2.5 text-right border-r border-slate-200 bg-blue-50/30 font-mono">
          {formatRupiah(v.pungut.pph23)}
        </td>
        <td className="px-3 py-2.5 text-right border-r border-slate-200 bg-blue-50/30 font-mono">
          {formatRupiah(v.pungut.pajakDaerah)}
        </td>
        <td className="px-3 py-2.5 text-right border-r border-slate-200 font-bold bg-blue-100/50 font-mono">
          {formatRupiah(v.totalPungut)}
        </td>

        {/* Pengeluaran */}
        <td className="px-3 py-2.5 text-right border-r border-slate-200 bg-orange-50/30 font-mono">
          {formatRupiah(v.setor.ppn)}
        </td>
        <td className="px-3 py-2.5 text-right border-r border-slate-200 bg-orange-50/30 font-mono">
          {formatRupiah(v.setor.pph21)}
        </td>
        <td className="px-3 py-2.5 text-right border-r border-slate-200 bg-orange-50/30 font-mono">
          {formatRupiah(v.setor.pph22)}
        </td>
        <td className="px-3 py-2.5 text-right border-r border-slate-200 bg-orange-50/30 font-mono">
          {formatRupiah(v.setor.pph23)}
        </td>
        <td className="px-3 py-2.5 text-right border-r border-slate-200 bg-orange-50/30 font-mono">
          {formatRupiah(v.setor.pajakDaerah)}
        </td>
        <td className="px-3 py-2.5 text-right border-r border-slate-200 font-bold bg-orange-100/50 font-mono">
          {formatRupiah(v.totalSetor)}
        </td>

        <td className="px-3 py-2.5 text-right font-bold font-mono">{formatRupiah(v.saldoAkhir)}</td>
      </tr>
    );
  };

  return (
    <div className={theme.card}>
      {/* Section Header */}
      <div className="bg-orange-50 px-5 py-4 border-b border-orange-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Receipt size={20} className="text-orange-600" />
          </div>
          <div>
            <h3 className="text-orange-800 font-bold uppercase tracking-wide text-sm">
              Rekap Penerimaan dan Pengeluaran Pajak
            </h3>
            <p className={theme.text.subtle}>Rincian pajak yang dipungut dan disetor per bulan</p>
          </div>
        </div>

        {/* Manual Tax Indicator */}
        {manualTaxes && manualTaxes.count > 0 && (
          <div className="flex items-center gap-2 bg-amber-100 px-3 py-2 rounded-lg border border-amber-300">
            <AlertCircle size={16} className="text-amber-600" />
            <div className="text-xs">
              <span className="font-bold text-amber-800">{manualTaxes.count} Entri Manual</span>
              {manualTaxes.totalSaldoAwal !== 0 && (
                <span className="text-amber-600 ml-2">
                  (Saldo Awal: {formatRupiah(manualTaxes.totalSaldoAwal)})
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-max border-collapse text-[11px]">
          <thead>
            {/* Header 1 */}
            <tr className="bg-slate-700 text-white text-center">
              <th rowSpan={2} className="px-3 py-3 border border-slate-600 w-12 font-bold">
                NO
              </th>
              <th rowSpan={2} className="px-3 py-3 border border-slate-600 min-w-[120px] font-bold">
                BULAN
              </th>
              <th rowSpan={2} className="px-3 py-3 border border-slate-600 bg-slate-600 font-bold">
                SALDO AWAL
              </th>
              <th colSpan={6} className="px-3 py-2 border border-slate-600 bg-blue-700 font-bold">
                PENERIMAAN (PUNGUT)
              </th>
              <th colSpan={6} className="px-3 py-2 border border-slate-600 bg-orange-600 font-bold">
                PENGELUARAN (SETOR)
              </th>
              <th
                rowSpan={2}
                className="px-3 py-3 border border-slate-600 bg-emerald-700 font-bold"
              >
                SALDO AKHIR
              </th>
            </tr>
            {/* Header 2 */}
            <tr className="bg-slate-600 text-white text-center text-[10px]">
              {/* Pungut columns */}
              <th className="px-2 py-2 border border-slate-500 bg-blue-600 font-bold">PPN</th>
              <th className="px-2 py-2 border border-slate-500 bg-blue-600 font-bold">PPh 21</th>
              <th className="px-2 py-2 border border-slate-500 bg-blue-600 font-bold">PPh 22</th>
              <th className="px-2 py-2 border border-slate-500 bg-blue-600 font-bold">PPh 23</th>
              <th className="px-2 py-2 border border-slate-500 bg-blue-600 font-bold">
                Pj. Daerah
              </th>
              <th className="px-2 py-2 border border-slate-500 bg-blue-800 font-bold">JUMLAH</th>
              {/* Setor columns */}
              <th className="px-2 py-2 border border-slate-500 bg-orange-500 font-bold">PPN</th>
              <th className="px-2 py-2 border border-slate-500 bg-orange-500 font-bold">PPh 21</th>
              <th className="px-2 py-2 border border-slate-500 bg-orange-500 font-bold">PPh 22</th>
              <th className="px-2 py-2 border border-slate-500 bg-orange-500 font-bold">PPh 23</th>
              <th className="px-2 py-2 border border-slate-500 bg-orange-500 font-bold">
                Pj. Daerah
              </th>
              <th className="px-2 py-2 border border-slate-500 bg-orange-700 font-bold">JUMLAH</th>
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
