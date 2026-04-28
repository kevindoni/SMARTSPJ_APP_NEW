/**
 * TransactionTable.jsx
 * Displays the list of transactions in a table format
 */
import { formatRupiah, isPenerimaan } from '../../utils/transactionHelpers';

import TransactionClosing from './TransactionClosing';

export default function TransactionTable({
  data,
  loading,
  hasMore,
  onLoadMore,
  year,
  selectedMonth,
  openingBalance,
  calculatedBalances,
  hasExistingOpeningBalance,
  stats,
  calculatedSaldo,
  totalPenerimaan,
  totalPengeluaran,
  isPenerimaanFunc, // Custom function for perspective (e.g. Tunai vs BKU)
  reportType, // 'TUNAI', 'BANK', or undefined (BKU)
}) {
  const isMonthView = selectedMonth !== 'SEMUA';

  // Helper to determine if transaction is debit (income) based on report type
  const checkIsDebit = (item) => {
    if (isPenerimaanFunc) return isPenerimaanFunc(item);
    return isPenerimaan(item);
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-slate-300 min-h-[300px] relative pb-8">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-slate-50 border-b border-slate-300 sticky top-0 z-10">
          {/* Main Header */}
          <tr>
            <th className="px-3 py-3 text-center font-bold text-slate-800 border-r border-slate-300 w-[100px] text-[11px] uppercase tracking-wide">
              TANGGAL
            </th>
            <th className="px-3 py-3 text-center font-bold text-slate-800 border-r border-slate-300 w-[120px] text-[11px] uppercase tracking-wide">
              KODE KEGIATAN
            </th>
            <th className="px-3 py-3 text-center font-bold text-slate-800 border-r border-slate-300 w-[120px] text-[11px] uppercase tracking-wide">
              KODE REKENING
            </th>
            <th className="px-3 py-3 text-center font-bold text-slate-800 border-r border-slate-300 w-[120px] text-[11px] uppercase tracking-wide">
              NO. BUKTI
            </th>
            <th className="px-3 py-3 text-center font-bold text-slate-800 border-r border-slate-300 min-w-[300px] text-[11px] uppercase tracking-wide">
              URAIAN
            </th>
            <th className="px-3 py-3 text-center font-bold text-slate-800 border-r border-slate-300 w-[140px] text-[11px] uppercase tracking-wide">
              PENERIMAAN
            </th>
            <th className="px-3 py-3 text-center font-bold text-slate-800 border-r border-slate-300 w-[140px] text-[11px] uppercase tracking-wide">
              PENGELUARAN
            </th>
            <th className="px-3 py-3 text-center font-bold text-slate-800 w-[140px] text-[11px] uppercase tracking-wide">
              SALDO
            </th>
          </tr>
          {/* Numbered Sub-Header */}
          <tr className="bg-slate-200 border-b border-slate-300 text-slate-600 text-[10px] font-bold">
            <td className="text-center py-1 border-r border-slate-300">1</td>
            <td className="text-center py-1 border-r border-slate-300">2</td>
            <td className="text-center py-1 border-r border-slate-300">3</td>
            <td className="text-center py-1 border-r border-slate-300">4</td>
            <td className="text-center py-1 border-r border-slate-300">5</td>
            <td className="text-center py-1 border-r border-slate-300">6</td>
            <td className="text-center py-1 border-r border-slate-300">7</td>
            <td className="text-center py-1">8</td>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {isMonthView && selectedMonth !== '01' && !hasExistingOpeningBalance && (
            <tr className="bg-white hover:bg-slate-50 transition-colors">
              <td className="px-3 py-2 text-center font-medium text-slate-700 border-r border-slate-200 text-xs">
                01-{selectedMonth}-{year}
              </td>
              <td className="px-3 py-2 border-r border-slate-200"></td>
              <td className="px-3 py-2 border-r border-slate-200"></td>
              <td className="px-3 py-2 border-r border-slate-200"></td>
              <td className="px-3 py-2 border-r border-slate-200">
                <div className="font-medium text-slate-900 text-xs">Saldo Bulan Lalu</div>
              </td>
              <td className="px-3 py-2 text-right font-medium text-slate-900 border-r border-slate-200 tabular-nums text-xs">
                {formatRupiah(openingBalance)}
              </td>
              <td className="px-3 py-2 text-right font-medium text-slate-900 border-r border-slate-200 tabular-nums text-xs">
                0
              </td>
              <td className="px-3 py-2 text-right font-bold text-slate-900 tabular-nums text-xs">
                {formatRupiah(openingBalance)}
              </td>
            </tr>
          )}

          {loading && data.length === 0 ? (
            <tr>
              <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                Memuat data...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                Tidak ada transaksi
              </td>
            </tr>
          ) : (
            data.map((item, idx) => {
              const isDebit = checkIsDebit(item);
              const currentRunningBalance = calculatedBalances[idx];

              return (
                <tr
                  key={item.id_kas_umum || idx}
                  className="hover:bg-slate-50 transition-colors group border-b border-slate-200"
                >
                  <td className="px-3 py-2 text-center font-medium text-slate-700 whitespace-nowrap border-r border-slate-200 align-top text-xs">
                    {new Date(item.tanggal_transaksi)
                      .toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                      .replace(/\//g, '-')}
                  </td>
                  <td className="px-3 py-2 text-slate-600 font-mono text-[10px] border-r border-slate-200 align-top text-center">
                    {item.activity_code || ''}
                  </td>
                  <td className="px-3 py-2 text-slate-600 font-mono text-[10px] border-r border-slate-200 align-top text-center">
                    {item.kode_rekening || ''}
                  </td>
                  <td className="px-3 py-2 text-center text-slate-700 font-medium border-r border-slate-200 align-top text-xs">
                    {item.no_bukti || ''}
                  </td>
                  <td className="px-3 py-2 text-slate-800 border-r border-slate-200 align-top max-w-md text-xs">
                    <div className="line-clamp-2 leading-snug cursor-help" title={item.uraian}>
                      {item.uraian}
                    </div>
                    {item.penerima && (
                      <div className="text-[10px] text-slate-500 mt-1 italic">
                        * {item.penerima}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-slate-900 border-r border-slate-200 align-top tabular-nums text-xs">
                    {isDebit ? formatRupiah(item.nominal) : '0'}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-slate-900 border-r border-slate-200 align-top tabular-nums text-xs">
                    {!isDebit ? formatRupiah(item.nominal) : '0'}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-slate-900 align-top tabular-nums text-xs">
                    {formatRupiah(currentRunningBalance)}
                  </td>
                </tr>
              );
            })
          )}

          {/* Jumlah Row */}
          {!loading && data.length > 0 && isMonthView && (
            <tr className="bg-emerald-50 font-bold border-t-2 border-emerald-200">
              <td
                colSpan="5"
                className="px-3 py-3 text-left text-emerald-800 text-sm border-r border-emerald-200"
              >
                Jumlah
              </td>
              <td className="px-3 py-3 text-right text-emerald-800 tabular-nums text-sm border-r border-emerald-200">
                {formatRupiah(totalPenerimaan || 0)}
              </td>
              <td className="px-3 py-3 text-right text-emerald-800 tabular-nums text-sm border-r border-emerald-200">
                {formatRupiah(totalPengeluaran || 0)}
              </td>
              <td className="px-3 py-3 text-right text-emerald-800 tabular-nums text-sm">
                {formatRupiah(calculatedSaldo || 0)}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Closing Block inside Card */}
      {!loading && (
        <div className="px-4 border-t border-slate-300">
          {' '}
          {/* Added Separator Line */}
          <TransactionClosing
            year={year}
            selectedMonth={selectedMonth}
            stats={stats}
            calculatedSaldo={calculatedSaldo}
            reportType={reportType}
          />
        </div>
      )}

      {!loading && hasMore && data.length > 0 && selectedMonth === 'SEMUA' && (
        <div className="p-4 flex justify-center border-t border-slate-200 bg-slate-50">
          <button
            onClick={onLoadMore}
            className="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded shadow-sm text-sm font-medium hover:bg-slate-100 transition-all"
          >
            Muat Lebih Banyak
          </button>
        </div>
      )}
    </div>
  );
}
