import { Calendar, ChevronRight } from 'lucide-react';
import { formatRupiah } from '../../utils/transactionHelpers';

export default function KertasKerjaTable({
  processedData,
  isQuarterly,
  isMonthly,
  selectedMonth,
  months,
}) {
  let currentKegiatan = '';
  let currentRekening = '';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4 w-12">No</th>
              <th className="px-6 py-4">Uraian</th>

              {!isQuarterly ? (
                <>
                  <th className="px-6 py-4 text-right">Harga</th>
                  <th className="px-6 py-4 text-center">
                    {isMonthly ? `Vol (${months[selectedMonth - 1].substring(0, 3)})` : 'Vol'}
                  </th>
                  <th className="px-6 py-4 text-center">Sat</th>
                  <th className="px-6 py-4 text-right">
                    {isMonthly ? `Jumlah (${months[selectedMonth - 1].substring(0, 3)})` : 'Jumlah'}
                  </th>
                </>
              ) : (
                <>
                  <th className="px-6 py-4 text-right bg-slate-100/50">Total</th>
                  <th className="px-4 py-4 text-center bg-blue-50/50 text-blue-700 border-l border-blue-100">
                    TW 1
                  </th>
                  <th className="px-4 py-4 text-center bg-green-50/50 text-green-700 border-l border-green-100">
                    TW 2
                  </th>
                  <th className="px-4 py-4 text-center bg-amber-50/50 text-amber-700 border-l border-amber-100">
                    TW 3
                  </th>
                  <th className="px-4 py-4 text-center bg-red-50/50 text-red-700 border-l border-red-100">
                    TW 4
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {processedData.map((item, index) => {
              const renderRows = [];
              const colSpan = isQuarterly ? 7 : 6;

              // Calculate Quarter Values if needed
              const tw1 = isQuarterly
                ? ((item.v1 || 0) + (item.v2 || 0) + (item.v3 || 0)) * (item.harga_satuan || 0)
                : 0;
              const tw2 = isQuarterly
                ? ((item.v4 || 0) + (item.v5 || 0) + (item.v6 || 0)) * (item.harga_satuan || 0)
                : 0;
              const tw3 = isQuarterly
                ? ((item.v7 || 0) + (item.v8 || 0) + (item.v9 || 0)) * (item.harga_satuan || 0)
                : 0;
              const tw4 = isQuarterly
                ? ((item.v10 || 0) + (item.v11 || 0) + (item.v12 || 0)) * (item.harga_satuan || 0)
                : 0;

              // Group Header: Kegiatan
              if (item.kode_kegiatan !== currentKegiatan) {
                currentKegiatan = item.kode_kegiatan;
                currentRekening = ''; // Reset Rekening

                renderRows.push(
                  <tr
                    key={`keg-${index}`}
                    className="bg-indigo-50/50 hover:bg-indigo-50 transition-colors"
                  >
                    <td
                      colSpan={colSpan}
                      className="px-6 py-3 text-indigo-900 font-bold border-t border-indigo-100/50"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight size={16} className="text-indigo-400" />
                        <span>
                          {item.kode_kegiatan} - {item.nama_kegiatan}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              }

              // Sub Group Header: Kode Rekening
              if (item.kode_rekening !== currentRekening) {
                currentRekening = item.kode_rekening;

                renderRows.push(
                  <tr key={`rek-${index}`} className="bg-slate-50/80">
                    <td className="px-6 py-2 text-slate-400 font-mono text-[10px] text-right">
                      {/* Empty No */}
                    </td>
                    <td
                      colSpan={colSpan - 1}
                      className="px-6 py-2 text-slate-700 font-semibold italic text-xs border-l-4 border-slate-200"
                    >
                      {item.kode_rekening} - {item.nama_rekening || 'Belanja'}
                    </td>
                  </tr>
                );
              }

              // Item Row
              renderRows.push(
                <tr key={`item-${index}`} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-3 text-slate-400 text-center text-xs group-hover:text-slate-600">
                    {item.urutan}
                  </td>
                  <td className="px-6 py-3 font-medium text-slate-700">
                    {item.nama_barang || item.nama_barang_clean}
                    {item.nama_sumber_dana && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                        {item.nama_sumber_dana}
                      </span>
                    )}
                  </td>

                  {!isQuarterly ? (
                    <>
                      <td className="px-6 py-3 text-right text-slate-600 tabular-nums">
                        {formatRupiah(item.harga_satuan)}
                      </td>
                      <td className="px-6 py-3 text-center text-slate-600">{item.volume}</td>
                      <td className="px-6 py-3 text-center text-slate-500 text-xs">
                        {item.satuan}
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-slate-800 tabular-nums bg-slate-50/30">
                        {formatRupiah(item.total)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-3 text-right font-bold text-slate-800 tabular-nums bg-slate-50/30">
                        {formatRupiah(item.total)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 tabular-nums bg-blue-50/10 border-l border-blue-50">
                        {tw1 > 0 ? formatRupiah(tw1) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 tabular-nums bg-green-50/10 border-l border-green-50">
                        {tw2 > 0 ? formatRupiah(tw2) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 tabular-nums bg-amber-50/10 border-l border-amber-50">
                        {tw3 > 0 ? formatRupiah(tw3) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 tabular-nums bg-red-50/10 border-l border-red-50">
                        {tw4 > 0 ? formatRupiah(tw4) : '-'}
                      </td>
                    </>
                  )}
                </tr>
              );

              return renderRows;
            })}

            {/* Empty State for Monthly Filter */}
            {processedData.length === 0 && isMonthly && (
              <tr>
                <td
                  colSpan={isQuarterly ? 7 : 6}
                  className="px-6 py-12 text-center text-slate-500 bg-slate-50/50"
                >
                  <div className="flex flex-col items-center justify-center animate-in fade-in zoom-in-95">
                    <Calendar size={32} className="text-slate-400 mb-2" />
                    <p className="font-semibold text-slate-700">
                      Tidak ada kegiatan di bulan {months[selectedMonth - 1]}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Anggaran mungkin dialokasikan di bulan lain. Coba ganti bulan (contoh:
                      November) atau gunakan tampilan Tahunan.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
