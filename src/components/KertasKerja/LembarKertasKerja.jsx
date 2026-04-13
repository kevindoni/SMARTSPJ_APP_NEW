import { FileText, ChevronDown } from 'lucide-react';
import { formatRupiah } from '../../utils/transactionHelpers';

export default function LembarKertasKerja({
  processedData,
  fundSource,
  selectedFormat,
  setSelectedFormat,
  reportFormats,
}) {
  // Calculate Summaries
  const summary = {
    pendapatan: { total: 0, tw: [0, 0, 0, 0] },
    belanjaOperasi: { total: 0, tw: [0, 0, 0, 0] },
    belanjaModal: { total: 0, tw: [0, 0, 0, 0] },
  };

  processedData.forEach((item) => {
    const k = item.kode_rekening || '';
    let target = null;
    if (k.startsWith('4')) target = summary.pendapatan;
    else if (k.startsWith('5.1')) target = summary.belanjaOperasi;
    else if (k.startsWith('5.2')) target = summary.belanjaModal;

    if (target) {
      target.total += item.total;
      // Calculate TWs using parsed v1..v12
      const p = item.harga_satuan;
      target.tw[0] += ((item.v1 || 0) + (item.v2 || 0) + (item.v3 || 0)) * p;
      target.tw[1] += ((item.v4 || 0) + (item.v5 || 0) + (item.v6 || 0)) * p;
      target.tw[2] += ((item.v7 || 0) + (item.v8 || 0) + (item.v9 || 0)) * p;
      target.tw[3] += ((item.v10 || 0) + (item.v11 || 0) + (item.v12 || 0)) * p;
    }
  });

  // Calculate Totals per Column
  const grandTotalTW = [0, 0, 0, 0];
  grandTotalTW[0] = summary.belanjaOperasi.tw[0] + summary.belanjaModal.tw[0];
  grandTotalTW[1] = summary.belanjaOperasi.tw[1] + summary.belanjaModal.tw[1];
  grandTotalTW[2] = summary.belanjaOperasi.tw[2] + summary.belanjaModal.tw[2];
  grandTotalTW[3] = summary.belanjaOperasi.tw[3] + summary.belanjaModal.tw[3];
  const grandTotal = summary.belanjaOperasi.total + summary.belanjaModal.total;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Toolbar Summary */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="text-blue-600" size={24} />
              Lembar Kertas Kerja (Rekapitulasi)
            </h2>
            <p className="text-slate-500 text-xs">
              Unit Kerja: {fundSource === 'SEMUA' ? 'Semua Sumber Dana' : fundSource}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
              Format RKAS:
            </label>
            <div className="relative w-full md:w-80">
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              >
                {reportFormats.map((fmt, idx) => (
                  <option key={idx} value={fmt}>
                    {fmt}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-2.5 text-slate-400 pointer-events-none"
                size={16}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-center">
          <h3 className="font-bold text-slate-800 uppercase text-sm">
            Rencana Pelaksanaan Anggaran Unit Kerja per Triwulan
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center">
            <thead className="bg-white text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 border-r border-slate-200 w-12" rowSpan="2">
                  No.
                </th>
                <th className="px-4 py-3 border-r border-slate-200 text-left" rowSpan="2">
                  Uraian
                </th>
                <th className="px-4 py-2 border-b border-slate-200" colSpan="4">
                  Triwulan
                </th>
                <th className="px-4 py-3 border-l border-slate-200" rowSpan="2">
                  Jumlah
                </th>
              </tr>
              <tr>
                <th className="px-4 py-2 border-r border-slate-100 bg-blue-50/50">I</th>
                <th className="px-4 py-2 border-r border-slate-100 bg-green-50/50">II</th>
                <th className="px-4 py-2 border-r border-slate-100 bg-amber-50/50">III</th>
                <th className="px-4 py-2 bg-red-50/50">IV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* 1. Pendapatan */}
              <tr className="hover:bg-slate-50">
                <td className="py-3 border-r border-slate-100">1</td>
                <td className="py-3 px-4 text-left font-medium border-r border-slate-100">
                  Pendapatan
                </td>
                <td className="py-3 px-4 tabular-nums text-right">
                  {formatRupiah(summary.pendapatan.tw[0])}
                </td>
                <td className="py-3 px-4 tabular-nums text-right">
                  {formatRupiah(summary.pendapatan.tw[1])}
                </td>
                <td className="py-3 px-4 tabular-nums text-right">
                  {formatRupiah(summary.pendapatan.tw[2])}
                </td>
                <td className="py-3 px-4 tabular-nums text-right">
                  {formatRupiah(summary.pendapatan.tw[3])}
                </td>
                <td className="py-3 px-4 tabular-nums text-right font-bold border-l border-slate-100">
                  {formatRupiah(summary.pendapatan.total)}
                </td>
              </tr>
              {/* 2.1 Belanja Operasi */}
              <tr className="hover:bg-slate-50">
                <td className="py-3 border-r border-slate-100">2.1</td>
                <td className="py-3 px-4 text-left font-medium border-r border-slate-100">
                  Belanja Operasi
                </td>
                <td className="py-3 px-4 tabular-nums text-right">
                  {formatRupiah(summary.belanjaOperasi.tw[0])}
                </td>
                <td className="py-3 px-4 tabular-nums text-right">
                  {formatRupiah(summary.belanjaOperasi.tw[1])}
                </td>
                <td className="py-3 px-4 tabular-nums text-right">
                  {formatRupiah(summary.belanjaOperasi.tw[2])}
                </td>
                <td className="py-3 px-4 tabular-nums text-right">
                  {formatRupiah(summary.belanjaOperasi.tw[3])}
                </td>
                <td className="py-3 px-4 tabular-nums text-right font-bold border-l border-slate-100">
                  {formatRupiah(summary.belanjaOperasi.total)}
                </td>
              </tr>
              {/* 2.2 Belanja Modal */}
              <tr className="hover:bg-slate-50">
                <td className="py-3 border-r border-slate-100">2.2</td>
                <td className="py-3 px-4 text-left font-medium border-r border-slate-100">
                  Belanja Modal
                </td>
                <td className="py-3 px-4 tabular-nums text-right">
                  {formatRupiah(summary.belanjaModal.tw[0])}
                </td>
                <td className="py-3 px-4 tabular-nums text-right">
                  {formatRupiah(summary.belanjaModal.tw[1])}
                </td>
                <td className="py-3 px-4 tabular-nums text-right">
                  {formatRupiah(summary.belanjaModal.tw[2])}
                </td>
                <td className="py-3 px-4 tabular-nums text-right">
                  {formatRupiah(summary.belanjaModal.tw[3])}
                </td>
                <td className="py-3 px-4 tabular-nums text-right font-bold border-l border-slate-100">
                  {formatRupiah(summary.belanjaModal.total)}
                </td>
              </tr>
              {/* 4. Pembiayaan (Dummy/Zero as previously implemented) */}
              <tr className="hover:bg-slate-50 text-slate-400">
                <td className="py-3 border-r border-slate-100">3.1</td>
                <td className="py-3 px-4 text-left font-medium border-r border-slate-100">
                  Penerimaan Pembiayaan
                </td>
                <td className="py-3 px-4 text-right">0</td>
                <td className="py-3 px-4 text-right">0</td>
                <td className="py-3 px-4 text-right">0</td>
                <td className="py-3 px-4 text-right">0</td>
                <td className="py-3 px-4 text-right border-l border-slate-100">0</td>
              </tr>
              <tr className="hover:bg-slate-50 text-slate-400">
                <td className="py-3 border-r border-slate-100">4.1</td>
                <td className="py-3 px-4 text-left font-medium border-r border-slate-100">
                  Pengeluaran Pembiayaan
                </td>
                <td className="py-3 px-4 text-right">0</td>
                <td className="py-3 px-4 text-right">0</td>
                <td className="py-3 px-4 text-right">0</td>
                <td className="py-3 px-4 text-right">0</td>
                <td className="py-3 px-4 text-right border-l border-slate-100">0</td>
              </tr>
              {/* GRAND TOTAL */}
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-800">
                <td className="py-4 border-r border-slate-200"></td>
                <td className="py-4 px-4 text-right border-r border-slate-200">JUMLAH BELANJA</td>
                <td className="py-4 px-4 tabular-nums text-right">
                  {formatRupiah(grandTotalTW[0])}
                </td>
                <td className="py-4 px-4 tabular-nums text-right">
                  {formatRupiah(grandTotalTW[1])}
                </td>
                <td className="py-4 px-4 tabular-nums text-right">
                  {formatRupiah(grandTotalTW[2])}
                </td>
                <td className="py-4 px-4 tabular-nums text-right">
                  {formatRupiah(grandTotalTW[3])}
                </td>
                <td className="py-4 px-4 tabular-nums text-right border-l border-slate-200">
                  {formatRupiah(grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
