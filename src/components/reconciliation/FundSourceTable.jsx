import { FileSpreadsheet } from 'lucide-react';
import { formatRupiah } from '../../utils/reconciliationHelpers';
import { theme } from '../../theme';

// ─── Row style config (data-driven, no hardcoded inline colors) ──────────────
const ROW_STYLES = {
  month: { className: 'bg-white hover:bg-slate-50/80 transition-colors', bg: 'bg-white' },
  quarter: {
    className: 'bg-amber-50 font-semibold border-y-2 border-amber-200',
    bg: 'bg-amber-50',
  },
  semester: {
    className: 'bg-violet-50 font-semibold border-y-2 border-violet-200',
    bg: 'bg-violet-50',
  },
  annual: { className: 'bg-emerald-800 text-white font-bold', bg: 'bg-emerald-800' },
};

const GROUP_COLORS = {
  BARANG_JASA: { header: 'bg-blue-700 border-blue-600', label: 'Barang & Jasa (5.1.02)' },
  MODAL_MESIN: {
    header: 'bg-orange-600 border-orange-500',
    label: 'Modal Alat & Mesin (5.2.02+5.2.04)',
  },
  MODAL_LAINNYA: {
    header: 'bg-purple-600 border-purple-500',
    label: 'Modal Aset Lainnya (5.2.05)',
  },
};

/**
 * FundSourceTable - Month vs Account Code table (DINAS format)
 * Matches Excel: 5 header rows (Group, Numbers, Kode, Nama, Pagu)
 */
export default function FundSourceTable({ data }) {
  if (!data || !data.columns || !data.rows) {
    return (
      <div className="p-12 text-center text-slate-400 font-medium">
        Data tidak tersedia atau sedang memuat...
      </div>
    );
  }

  const { columns, rows } = data;

  // ─── Helpers ────────────────────────────────────────────────────────
  const isSummary = (col) => col.isSummaryColumn;

  const getRowType = (row) => {
    const l = row.label || '';
    if (l.includes('JUMLAH')) return 'annual';
    if (l.includes('TRIWULAN')) return 'quarter';
    if (l.includes('SEMESTER')) return 'semester';
    return 'month';
  };

  // Compute group header spans (summary cols merge into preceding group)
  const groupSpans = (() => {
    const result = [];
    let current = null;
    let span = 0;
    columns.forEach((col) => {
      if (isSummary(col)) {
        span++;
      } else if (col.group !== current) {
        if (current !== null) result.push({ group: current, span });
        current = col.group;
        span = 1;
      } else {
        span++;
      }
    });
    if (current !== null) result.push({ group: current, span });
    return result;
  })();

  const dataColCount = columns.filter((c) => !isSummary(c)).length;
  const summaryColCount = columns.filter((c) => isSummary(c)).length;
  return (
    <div className={theme.card}>
      {/* Section Header */}
      <div className="bg-emerald-50 px-5 py-4 border-b border-emerald-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <FileSpreadsheet size={20} className="text-emerald-600" />
          </div>
          <div>
            <h3 className="text-emerald-800 font-bold uppercase tracking-wide text-sm">
              Rekapitulasi Belanja per Kode Rekening
            </h3>
            <p className={theme.text.subtle}>Detail realisasi bulanan sesuai format DINAS</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-600 border border-blue-200">
            {dataColCount} Kode Rekening
          </span>
          {summaryColCount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-200">
              {summaryColCount} Summary
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-max border-collapse text-[11px]">
          <thead className="sticky top-0 z-40">
            {/* Row 0: Group Header */}
            <tr>
              <th
                rowSpan={5}
                className="px-2 py-2 border border-slate-600 bg-slate-700 text-white font-bold w-12 text-center align-middle"
              >
                NO
              </th>
              <th
                rowSpan={5}
                className="px-3 py-2 border border-slate-600 bg-slate-700 text-white font-bold min-w-[100px] text-center align-middle"
              >
                BULAN
              </th>
              <th
                rowSpan={5}
                className="px-3 py-2 border border-slate-600 bg-slate-600 text-white font-bold min-w-[100px] text-center align-middle"
              >
                ANGGARAN
              </th>
              {groupSpans.map((gs, i) => {
                const gc = GROUP_COLORS[gs.group];
                return (
                  <th
                    key={i}
                    colSpan={gs.span}
                    className={`px-2 py-2.5 border font-bold text-[10px] uppercase tracking-wider text-center text-white ${gc?.header || 'bg-slate-700 border-slate-600'}`}
                  >
                    {gc?.label || gs.group}
                  </th>
                );
              })}
            </tr>

            {/* Row 1: Column Numbers / Summary names */}
            <tr className="bg-slate-600 text-slate-300 text-center font-mono text-[10px]">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-2 py-1.5 border border-slate-500 ${isSummary(col) ? 'font-bold bg-emerald-700 text-white text-[8px] leading-tight' : ''}`}
                >
                  {isSummary(col) ? col.nama_rekening : col.displayIdx || idx + 1}
                </th>
              ))}
            </tr>

            {/* Row 2: Kode Rekening */}
            <tr className="bg-slate-500 text-slate-200">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-2 py-1.5 border border-slate-400 text-[8px] leading-tight text-left ${isSummary(col) ? 'bg-emerald-600 text-white text-center' : ''}`}
                  style={{ maxWidth: isSummary(col) ? '140px' : '120px' }}
                >
                  {isSummary(col) ? '' : col.kode_rekening}
                </th>
              ))}
            </tr>

            {/* Row 3: Nama Rekening */}
            <tr className="bg-slate-500/80 text-slate-300">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-2 py-1 border border-slate-400 text-[8px] leading-tight text-left ${isSummary(col) ? 'bg-emerald-500/80 text-emerald-100 text-center' : ''}`}
                  style={{ maxWidth: isSummary(col) ? '140px' : '120px' }}
                >
                  {isSummary(col) ? '' : col.nama_rekening}
                </th>
              ))}
            </tr>

            {/* Row 4: Pagu Anggaran */}
            <tr className="bg-emerald-50">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-2 py-2 border border-emerald-200 text-right font-mono font-bold text-emerald-800 text-[10px] ${isSummary(col) ? 'bg-emerald-100' : ''}`}
                >
                  {col.total_anggaran > 0 ? formatRupiah(col.total_anggaran) : '-'}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rIdx) => {
              const type = getRowType(row);
              const style = ROW_STYLES[type];
              const isSum = type !== 'month';
              const isAnnual = type === 'annual';

              return (
                <tr key={rIdx} className={style.className}>
                  {/* NO */}
                  <td
                    className={`sticky left-0 z-20 px-2 py-2 border-r border-slate-200 text-center font-bold w-12 ${style.bg}`}
                  >
                    {isSum ? '' : row.month || ''}
                  </td>

                  {/* BULAN */}
                  <td
                    className={`sticky left-[48px] z-20 px-3 py-2 border-r border-slate-200 whitespace-nowrap font-medium min-w-[100px] ${style.bg} ${isSum ? 'uppercase tracking-wider' : ''}`}
                  >
                    {row.monthName || row.label || ''}
                  </td>

                  {/* ANGGARAN - total belanja bulanan, total untuk summary */}
                  <td
                    className={`px-3 py-2 border-r border-slate-200 text-right font-mono font-bold min-w-[100px] ${isAnnual ? 'bg-emerald-900 text-white' : isSum ? 'bg-emerald-50' : 'bg-slate-50'}`}
                  >
                    {formatRupiah(row.total || 0)}
                  </td>

                  {/* Value Columns */}
                  {columns.map((col, cIdx) => {
                    const val = (row.values && row.values[col.kode_rekening]) || 0;
                    const sumHighlight = isSummary(col) && type === 'month';
                    return (
                      <td
                        key={cIdx}
                        className={`px-2 py-2 border-r border-slate-200 text-right font-mono ${isSum ? 'font-semibold' : ''} ${isSummary(col) ? 'font-bold' : ''} ${sumHighlight ? 'bg-green-50' : ''}`}
                      >
                        {formatRupiah(val)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Legend */}
      <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center gap-6 text-[10px]">
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
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-50 border-2 border-emerald-500"></div>
          <span className="text-slate-500">Kolom Summary</span>
        </div>
      </div>
    </div>
  );
}
