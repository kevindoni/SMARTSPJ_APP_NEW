/**
 * TaxTransactionTable.jsx
 * Specialized table for Buku Pembantu Pajak with multi-column debit layout
 */
import React from 'react';
import { formatRupiah } from '../../utils/transactionHelpers';

// Memoize to prevent re-renders when parent state changes (e.g. modal input)
function TaxTransactionTable({
  data,
  loading,
  hasMore: _hasMore,
  onLoadMore: _onLoadMore,
  year,
  selectedMonth,
  openingBalance,
  calculatedBalances,
  hasExistingOpeningBalance,
  stats: _stats,
  calculatedSaldo,
  totalPenerimaan: _totalPenerimaan,
  totalPengeluaran: _totalPengeluaran,
  reportType: _reportType,
}) {
  const isMonthView = selectedMonth !== 'SEMUA';

  // Helper to extract tax components based on Uraian
  const getTaxComponents = (item) => {
    const nominal = item.nominal;
    const idBku = item.id_ref_bku;

    // Expense (Setoran) goes to Kredit
    // IDs: 11 (Setor Pajak), 6, 7, 25 (Potongan/Setoran Lainnya)
    if ([11, 6, 7, 25].includes(idBku)) {
      return { ppn: 0, pph21: 0, pph23: 0, pph4: 0, sspd: 0, kredit: nominal };
    }

    // === MANUAL TAX ENTRIES: Check jenis_pajak field first ===
    if (item.is_manual && item.jenis_pajak) {
      const jenisPajak = item.jenis_pajak.toLowerCase();
      if (jenisPajak === 'ppn')
        return { ppn: nominal, pph21: 0, pph23: 0, pph4: 0, sspd: 0, kredit: 0 };
      if (jenisPajak === 'pph 21')
        return { ppn: 0, pph21: nominal, pph23: 0, pph4: 0, sspd: 0, kredit: 0 };
      if (jenisPajak === 'pph 23')
        return { ppn: 0, pph21: 0, pph23: nominal, pph4: 0, sspd: 0, kredit: 0 };
      if (jenisPajak === 'pph 4(2)' || jenisPajak === 'pph 4')
        return { ppn: 0, pph21: 0, pph23: 0, pph4: nominal, sspd: 0, kredit: 0 };
      if (jenisPajak === 'pajak daerah')
        return { ppn: 0, pph21: 0, pph23: 0, pph4: 0, sspd: nominal, kredit: 0 };
      // Default for manual: SSPD column
      return { ppn: 0, pph21: 0, pph23: 0, pph4: 0, sspd: nominal, kredit: 0 };
    }

    // Priority 0: DATABASE FLAGS (The Source of Truth)
    if (item.is_ppn === 1) return { ppn: nominal, pph21: 0, pph23: 0, pph4: 0, sspd: 0, kredit: 0 };
    if (item.is_pph_21 === 1)
      return { ppn: 0, pph21: nominal, pph23: 0, pph4: 0, sspd: 0, kredit: 0 };
    if (item.is_pph_23 === 1)
      return { ppn: 0, pph21: 0, pph23: nominal, pph4: 0, sspd: 0, kredit: 0 };
    if (item.is_pph_4 === 1)
      return { ppn: 0, pph21: 0, pph23: 0, pph4: nominal, sspd: 0, kredit: 0 };
    if (item.is_sspd === 1)
      return { ppn: 0, pph21: 0, pph23: 0, pph4: 0, sspd: nominal, kredit: 0 };

    // Priority 0.5: SIPLah Flag (implies PPN)
    if (item.is_siplah === 1)
      return { ppn: nominal, pph21: 0, pph23: 0, pph4: 0, sspd: 0, kredit: 0 };

    // Parse Income (Pungutan) - ID 10
    const uraian = (item.uraian || '').toLowerCase();

    // Priority 1: Explicit Tax Names
    if (uraian.includes('ppn'))
      return { ppn: nominal, pph21: 0, pph23: 0, pph4: 0, sspd: 0, kredit: 0 };
    if (uraian.includes('pph 21') || uraian.includes('pasal 21'))
      return { ppn: 0, pph21: nominal, pph23: 0, pph4: 0, sspd: 0, kredit: 0 };
    if (uraian.includes('pph 23') || uraian.includes('pasal 23'))
      return { ppn: 0, pph21: 0, pph23: nominal, pph4: 0, sspd: 0, kredit: 0 };
    if (uraian.includes('pph 4') || uraian.includes('pasal 4') || uraian.includes('ayat 2'))
      return { ppn: 0, pph21: 0, pph23: 0, pph4: nominal, sspd: 0, kredit: 0 };

    // Priority 2: Keywords Heuristics
    // SIPLah text match
    if (uraian.includes('siplah'))
      return { ppn: nominal, pph21: 0, pph23: 0, pph4: 0, sspd: 0, kredit: 0 };

    // Honor/Gaji -> PPh 21
    if (uraian.includes('honor') || uraian.includes('gaji') || uraian.includes('insentif'))
      return { ppn: 0, pph21: nominal, pph23: 0, pph4: 0, sspd: 0, kredit: 0 };

    // Makan/Minum/Jasa -> PPh 23
    if (
      uraian.includes('makan') ||
      uraian.includes('minum') ||
      uraian.includes('catering') ||
      uraian.includes('jasa')
    )
      return { ppn: 0, pph21: 0, pph23: nominal, pph4: 0, sspd: 0, kredit: 0 };

    // Sewa -> PPh 4 (Final)
    if (uraian.includes('sewa'))
      return { ppn: 0, pph21: 0, pph23: 0, pph4: nominal, sspd: 0, kredit: 0 };

    // Fallback / Lainnya / SSPD column
    return { ppn: 0, pph21: 0, pph23: 0, pph4: 0, sspd: nominal, kredit: 0 };
  };

  // Calculate Column Totals (Local calculation for display)
  const columnTotals = {
    ppn: 0,
    pph21: 0,
    pph23: 0,
    pph4: 0,
    sspd: 0,
    kredit: 0,
  };

  if (!loading && data) {
    data.forEach((item) => {
      const comps = getTaxComponents(item);
      columnTotals.ppn += comps.ppn;
      columnTotals.pph21 += comps.pph21;
      columnTotals.pph23 += comps.pph23;
      columnTotals.pph4 += comps.pph4;
      columnTotals.sspd += comps.sspd;
      columnTotals.kredit += comps.kredit;
    });
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-slate-300 min-h-[300px] relative pb-8">
      <table className="w-full text-xs border-collapse">
        <thead className="bg-slate-50 border-b border-slate-300 sticky top-0 z-10">
          {/* Main Header */}
          <tr>
            <th
              rowSpan="2"
              className="px-2 py-3 text-center font-bold text-slate-800 border-r border-b border-slate-300 w-[90px] uppercase tracking-wide bg-slate-50"
            >
              TANGGAL
            </th>
            <th
              rowSpan="2"
              className="px-2 py-3 text-center font-bold text-slate-800 border-r border-b border-slate-300 w-[100px] uppercase tracking-wide bg-slate-50"
            >
              NO. KODE
            </th>
            <th
              rowSpan="2"
              className="px-2 py-3 text-center font-bold text-slate-800 border-r border-b border-slate-300 min-w-[250px] uppercase tracking-wide bg-slate-50"
            >
              URAIAN
            </th>
            <th
              colSpan="5"
              className="px-2 py-2 text-center font-bold text-slate-800 border-r border-b border-slate-300 uppercase tracking-wide bg-purple-50"
            >
              PENERIMAAN / DEBIT
            </th>
            <th
              rowSpan="2"
              className="px-2 py-3 text-center font-bold text-slate-800 border-r border-b border-slate-300 w-[110px] uppercase tracking-wide bg-slate-50"
            >
              PENGELUARAN
              <br />/ KREDIT
            </th>
            <th
              rowSpan="2"
              className="px-2 py-3 text-center font-bold text-slate-800 border-b border-slate-300 w-[120px] uppercase tracking-wide bg-slate-50"
            >
              SALDO
            </th>
          </tr>
          {/* Sub Header for Taxes */}
          <tr className="bg-purple-50/50">
            <th className="px-2 py-2 text-center font-bold text-slate-700 border-r border-b border-slate-300 w-[90px] text-[10px]">
              PPN
            </th>
            <th className="px-2 py-2 text-center font-bold text-slate-700 border-r border-b border-slate-300 w-[90px] text-[10px]">
              PPh 21
            </th>
            <th className="px-2 py-2 text-center font-bold text-slate-700 border-r border-b border-slate-300 w-[90px] text-[10px]">
              PPh 23
            </th>
            <th className="px-2 py-2 text-center font-bold text-slate-700 border-r border-b border-slate-300 w-[90px] text-[10px]">
              PPh 4
            </th>
            <th className="px-2 py-2 text-center font-bold text-slate-700 border-r border-b border-slate-300 w-[90px] text-[10px]">
              SSPD
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {/* Opening Balance Row - Show when there's a manual opening balance OR system balance from previous month */}
          {isMonthView && (openingBalance !== 0 || hasExistingOpeningBalance) && (
            <tr
              className={`hover:bg-slate-50 transition-colors ${hasExistingOpeningBalance ? 'bg-amber-50/50' : 'bg-white'}`}
            >
              <td className="px-2 py-2 text-center font-medium text-slate-700 border-r border-slate-200">
                01-{selectedMonth}-{year}
              </td>
              <td className="px-2 py-2 border-r border-slate-200">
                {hasExistingOpeningBalance && (
                  <span className="text-amber-600 font-bold text-[10px]">MANUAL</span>
                )}
              </td>
              <td className="px-2 py-2 border-r border-slate-200">
                <div
                  className={`font-medium ${hasExistingOpeningBalance ? 'text-amber-800' : 'text-slate-900'}`}
                >
                  {hasExistingOpeningBalance
                    ? 'Saldo Awal / Hutang Pajak (Manual)'
                    : 'Saldo Bulan Lalu'}
                </div>
              </td>
              {/* Empty Tax Columns */}
              <td className="px-2 py-2 border-r border-slate-200"></td>
              <td className="px-2 py-2 border-r border-slate-200"></td>
              <td className="px-2 py-2 border-r border-slate-200"></td>
              <td className="px-2 py-2 border-r border-slate-200"></td>
              <td className="px-2 py-2 border-r border-slate-200"></td>

              <td className="px-2 py-2 text-right border-r border-slate-200 font-mono text-slate-400">
                -
              </td>
              <td
                className={`px-2 py-2 text-right font-bold tabular-nums ${openingBalance >= 0 ? 'text-slate-900 bg-yellow-50/30' : 'text-red-600 bg-red-50/30'}`}
              >
                {formatRupiah(openingBalance)}
              </td>
            </tr>
          )}

          {loading && data.length === 0 ? (
            <tr>
              <td colSpan="10" className="px-6 py-12 text-center text-slate-400">
                Memuat data...
              </td>
            </tr>
          ) : data.length === 0 && !hasExistingOpeningBalance ? (
            <tr>
              <td colSpan="10" className="px-6 py-12 text-center text-slate-400">
                Tidak ada transaksi pajak
              </td>
            </tr>
          ) : (
            data.map((item, idx) => {
              const comps = getTaxComponents(item);
              const currentRunningBalance = calculatedBalances[idx];

              return (
                <tr
                  key={item.id_kas_umum || idx}
                  className="hover:bg-slate-50 transition-colors group border-b border-slate-200"
                >
                  <td className="px-2 py-2 text-center font-medium text-slate-700 whitespace-nowrap border-r border-slate-200 align-top">
                    {new Date(item.tanggal_transaksi)
                      .toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                      .replace(/\//g, '-')}
                  </td>
                  <td className="px-2 py-2 text-slate-600 font-mono text-[10px] border-r border-slate-200 align-top text-center">
                    {/* Use No. Bukti or Kode Rekening as "No. Kode" */}
                    {item.no_bukti || item.kode_rekening || '-'}
                  </td>
                  <td className="px-2 py-2 text-slate-800 border-r border-slate-200 align-top max-w-xs">
                    <div className="line-clamp-2 leading-snug cursor-help" title={item.uraian}>
                      {item.uraian}
                    </div>
                  </td>

                  {/* Tax Columns */}
                  <td className="px-2 py-2 text-right font-medium text-slate-700 border-r border-slate-200 align-top tabular-nums">
                    {comps.ppn > 0 ? (
                      formatRupiah(comps.ppn)
                    ) : (
                      <span className="text-slate-200">0</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right font-medium text-slate-700 border-r border-slate-200 align-top tabular-nums">
                    {comps.pph21 > 0 ? (
                      formatRupiah(comps.pph21)
                    ) : (
                      <span className="text-slate-200">0</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right font-medium text-slate-700 border-r border-slate-200 align-top tabular-nums">
                    {comps.pph23 > 0 ? (
                      formatRupiah(comps.pph23)
                    ) : (
                      <span className="text-slate-200">0</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right font-medium text-slate-700 border-r border-slate-200 align-top tabular-nums">
                    {comps.pph4 > 0 ? (
                      formatRupiah(comps.pph4)
                    ) : (
                      <span className="text-slate-200">0</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right font-medium text-slate-700 border-r border-slate-200 align-top tabular-nums">
                    {comps.sspd > 0 ? (
                      formatRupiah(comps.sspd)
                    ) : (
                      <span className="text-slate-200">0</span>
                    )}
                  </td>

                  {/* Kredit */}
                  <td className="px-2 py-2 text-right font-medium text-red-600 border-r border-slate-200 align-top tabular-nums bg-red-50/10">
                    {comps.kredit > 0 ? (
                      formatRupiah(comps.kredit)
                    ) : (
                      <span className="text-slate-200">0</span>
                    )}
                  </td>

                  {/* Saldo */}
                  <td className="px-2 py-2 text-right font-bold text-slate-900 align-top tabular-nums bg-yellow-50/10">
                    {formatRupiah(currentRunningBalance)}
                  </td>
                </tr>
              );
            })
          )}

          {/* Total Row - show for ALL views now */}
          {!loading && data.length > 0 && (
            <tr className="bg-purple-50 font-bold border-t-2 border-purple-200 text-[11px]">
              <td
                colSpan="3"
                className="px-2 py-3 text-left text-purple-900 border-r border-purple-200 pl-4"
              >
                JUMLAH
              </td>
              <td className="px-2 py-3 text-right text-purple-900 border-r border-purple-200">
                {formatRupiah(columnTotals.ppn)}
              </td>
              <td className="px-2 py-3 text-right text-purple-900 border-r border-purple-200">
                {formatRupiah(columnTotals.pph21)}
              </td>
              <td className="px-2 py-3 text-right text-purple-900 border-r border-purple-200">
                {formatRupiah(columnTotals.pph23)}
              </td>
              <td className="px-2 py-3 text-right text-purple-900 border-r border-purple-200">
                {formatRupiah(columnTotals.pph4)}
              </td>
              <td className="px-2 py-3 text-right text-purple-900 border-r border-purple-200">
                {formatRupiah(columnTotals.sspd)}
              </td>
              <td className="px-2 py-3 text-right text-red-700 border-r border-purple-200">
                {formatRupiah(columnTotals.kredit)}
              </td>
              <td className="px-2 py-3 text-right text-purple-900">
                {formatRupiah(calculatedSaldo || 0)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default React.memo(TaxTransactionTable);
