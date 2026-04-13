import { useMemo } from 'react';
import { RECONCILIATION_COLUMNS } from '../config/reconciliationTableConfig';
import { formatRupiah, getNestedValue } from '../utils/reconciliationHelpers';
import { theme } from '../theme';

export default function SmartReconciliationTable({ data }) {
  // Flatten Headers for Rendering Logic
  const headerRows = useMemo(() => {
    const rows = [[], [], []]; // 3 levels of headers

    RECONCILIATION_COLUMNS.forEach((col) => {
      // Level 1
      rows[0].push({
        ...col,
        rowSpan: col.subColumns ? 1 : col.rowSpan || 1,
        colSpan: col.colSpan || 1,
      });

      if (col.subColumns) {
        col.subColumns.forEach((sub) => {
          // Level 2
          rows[1].push({
            ...sub,
            rowSpan: sub.subColumns ? 1 : sub.rowSpan || 1,
            colSpan: sub.colSpan || 1,
            parentColor: col.color, // Pass color down
          });

          if (sub.subColumns) {
            sub.subColumns.forEach((leaf) => {
              // Level 3 (Leaf)
              rows[2].push({
                ...leaf,
                rowSpan: 1,
                colSpan: 1,
                parentColor: col.color,
              });
            });
          }
        });
      }
    });
    return rows;
  }, []);

  // Get flat list of leaf columns for body rendering
  const leafColumns = useMemo(() => {
    const leaves = [];
    RECONCILIATION_COLUMNS.forEach((col) => {
      if (!col.subColumns) leaves.push(col);
      else {
        col.subColumns.forEach((sub) => {
          if (!sub.subColumns) leaves.push(sub);
          else {
            sub.subColumns.forEach((leaf) => leaves.push(leaf));
          }
        });
      }
    });
    return leaves;
  }, []);

  // Helper for Header Styles
  const getHeaderClass = (col, level) => {
    let base =
      'px-2 py-2 border border-slate-300 text-[10px] uppercase align-middle font-bold tracking-wide ';

    if (col.sticky === 'left') base += 'sticky left-0 z-30 ';

    // Colors provided in config
    if (col.color === 'blue') base += 'bg-blue-700 text-white ';
    else if (col.color === 'orange') base += 'bg-orange-600 text-white ';
    else if (col.color === 'emerald') base += 'bg-emerald-700 text-white ';
    else if (col.parentColor === 'blue') base += 'bg-blue-600 text-white ';
    else if (col.parentColor === 'orange') base += 'bg-orange-500 text-white ';
    else if (col.parentColor === 'emerald') base += 'bg-emerald-600 text-white ';
    else if (level === 0) base += 'bg-slate-700 text-white ';
    else base += 'bg-slate-600 text-white ';

    return base;
  };

  // Enhanced row styling based on type
  const getEnhancedRowStyle = (row) => {
    const type = row.type;

    // Monthly rows - regular styling with subtle striping
    if (type === 'month') {
      return 'bg-white hover:bg-slate-50/80 transition-colors';
    }

    // Quarterly subtotals
    if (type === 'quarter') {
      return 'bg-amber-50 border-y-2 border-amber-200 font-semibold';
    }

    // Semester subtotals
    if (type === 'semester') {
      return 'bg-violet-50 border-y-2 border-violet-200 font-semibold';
    }

    // Annual total
    if (type === 'annual') {
      return 'bg-emerald-800 text-white font-bold';
    }

    return 'bg-white';
  };

  return (
    <div className={`${theme.card} overflow-hidden`}>
      {/* Table Section Header */}
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className={theme.text.h3}>Rekap Saldo Bulanan</h3>
          <p className={theme.text.subtle}>
            Data Opening & Closing Balance per Bulan, Triwulan, dan Semester
          </p>
        </div>
        <div className="flex gap-2">
          <span className={`${theme.badge.base} ${theme.badge.success}`}>Jan - Des</span>
        </div>
      </div>

      {/* Table Container - horizontal scroll only */}
      <div className="overflow-x-auto">
        <table className="w-max border-collapse text-[11px]">
          <thead className="sticky top-0 z-40">
            {headerRows.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((col, cIdx) => (
                  <th
                    key={`${rIdx}-${cIdx}`}
                    colSpan={col.colSpan}
                    rowSpan={col.rowSpan}
                    className={getHeaderClass(col, rIdx)}
                    style={{
                      left: col.leftOffset,
                      position: col.sticky ? 'sticky' : undefined,
                      width: col.width,
                      minWidth: col.width,
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {data.map((row, rIdx) => {
              const rowType = row.type;
              const rowBgClass = getEnhancedRowStyle(row);

              // Determine cell background for all cells based on row type
              // Using a more professional color palette
              const getCellBg = () => {
                if (rowType === 'annual') return 'bg-slate-800'; // Dark slate for annual total
                if (rowType === 'quarter') return 'bg-amber-100'; // Warm amber for quarterly
                if (rowType === 'semester') return 'bg-indigo-100'; // Cool indigo for semester
                return 'bg-white'; // White for regular months
              };
              const cellBg = getCellBg();

              return (
                <tr key={rIdx} className="border-b border-slate-200">
                  {leafColumns.map((col, cIdx) => {
                    const val = getNestedValue(row, col.accessor);
                    let content = col.format === 'currency' ? formatRupiah(val) : val;

                    // Custom visual tweaks
                    const isSticky = col.sticky === 'left';
                    const isAnnual = rowType === 'annual';
                    const isSummaryRow = ['quarter', 'semester', 'annual'].includes(rowType);

                    // Get background color value for inline style
                    const getBgColor = () => {
                      if (rowType === 'annual') return '#1e293b'; // slate-800
                      if (rowType === 'quarter') return '#fef3c7'; // amber-100
                      if (rowType === 'semester') return '#e0e7ff'; // indigo-100
                      return '#ffffff'; // white
                    };

                    // Apply background to ALL cells for consistent row coloring
                    let cellClass = `px-2 py-2 border-r border-slate-200 whitespace-nowrap ${col.className || ''}`;

                    // Sticky column styling
                    if (isSticky) {
                      cellClass += ` sticky left-0 z-20`;
                    }

                    // Number alignment
                    if (col.format === 'currency') {
                      cellClass += ' text-right font-mono';
                    }

                    // Text color and font weight for summary rows
                    if (isAnnual) {
                      cellClass += ' text-white font-bold';
                    } else if (isSummaryRow) {
                      cellClass += ' font-semibold';
                    }

                    // Apply offset for sticky + background color inline
                    const style = {
                      backgroundColor: getBgColor(),
                      ...(isSticky ? { left: col.leftOffset } : {}),
                    };

                    return (
                      <td key={`${rIdx}-${cIdx}`} className={cellClass} style={style}>
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer Legend */}
      <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center gap-6 text-[10px]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-100 border border-amber-300"></div>
          <span className="text-slate-600 font-medium">Triwulan</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-indigo-100 border border-indigo-300"></div>
          <span className="text-slate-600 font-medium">Semester</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-800"></div>
          <span className="text-slate-600 font-medium">Total Tahunan</span>
        </div>
      </div>
    </div>
  );
}
