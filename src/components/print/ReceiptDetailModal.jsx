import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { formatRupiah } from '../../utils/transactionHelpers';
import { toast } from 'react-toastify';

export default function ReceiptDetailModal({ transaction, onClose }) {
  const [notaDate, setNotaDate] = useState('');
  const [originalDate, setOriginalDate] = useState('');

  useEffect(() => {
    if (transaction) {
      // Load saved custom date from localStorage if exists
      const savedDate = localStorage.getItem(`custom_date_${transaction.id_kas_umum}`);
      const initialDate = savedDate || transaction.tanggal_transaksi;

      setNotaDate(initialDate);
      setOriginalDate(transaction.tanggal_transaksi);
    }
  }, [transaction]);

  if (!transaction) return null;

  // Handle date save
  const handleSaveDate = () => {
    if (!notaDate) return;

    // Validation: Max 3 months before transaction date
    const transDate = new Date(originalDate);
    const selectedDate = new Date(notaDate);
    const threeMonthsAgo = new Date(transDate);
    threeMonthsAgo.setMonth(transDate.getMonth() - 3);

    // Reset hours for accurate date comparison
    transDate.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    threeMonthsAgo.setHours(0, 0, 0, 0);

    if (selectedDate > transDate) {
      toast.error('Tanggal nota tidak boleh melebihi tanggal transaksi');
      return;
    }

    if (selectedDate < threeMonthsAgo) {
      toast.error('Tanggal nota maksimal 3 bulan sebelum tanggal transaksi');
      return;
    }

    // Save to localStorage
    localStorage.setItem(`custom_date_${transaction.id_kas_umum}`, notaDate);
    toast.success('Tanggal nota berhasil disimpan untuk pencetakan');
  };

  // Mock items - for now we just show the main transaction as one item
  // In real app, we might need to fetch sub-items if this is a grouped transaction
  const items = [
    {
      id: transaction.id_kas_umum,
      kode_rekening: transaction.kode_rekening,
      uraian: transaction.uraian,
      nominal: transaction.nominal,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Detail Transaksi / Nota</h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Top Section: Details */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Column */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-[140px_1fr] items-baseline gap-2">
                <span className="text-sm font-bold text-slate-500">Tanggal Transaksi</span>
                <span className="text-sm font-medium text-slate-800">
                  :{' '}
                  {new Date(transaction.tanggal_transaksi).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center gap-2">
                <span className="text-sm font-bold text-slate-500">Tanggal Nota</span>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="date"
                      value={notaDate}
                      onChange={(e) => setNotaDate(e.target.value)}
                      className="px-3 py-1.5 border border-slate-300 rounded text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSaveDate}
                    className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    title="Simpan Tanggal Nota untuk Cetak"
                  >
                    <Save size={16} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2 ml-[148px] -mt-2">
                <span className="text-[10px] text-slate-400">
                  Maks 3 bulan sebelum tanggal transaksi ({originalDate})
                </span>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-baseline gap-2">
                <span className="text-sm font-bold text-slate-500">No. Bukti</span>
                <span className="text-sm font-medium text-slate-800">: {transaction.no_bukti}</span>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-baseline gap-2">
                <span className="text-sm font-bold text-slate-500">Kode Rekening</span>
                <span className="text-sm font-medium text-slate-800">
                  : {transaction.kode_rekening}
                </span>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-baseline gap-2">
                <span className="text-sm font-bold text-slate-500">Kegiatan</span>
                <span className="text-sm font-medium text-slate-800">
                  : {transaction.activity_code || '-'}
                </span>
              </div>
            </div>

            {/* Right Column */}
            <div className="w-full md:w-64 space-y-4">
              <div className="grid grid-cols-[100px_1fr] items-baseline gap-2">
                <span className="text-sm font-bold text-slate-500">Jumlah Item</span>
                <span className="text-sm font-medium text-slate-800">: {items.length} Item</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-baseline gap-2">
                <span className="text-sm font-bold text-slate-500">Total Nominal</span>
                <span className="text-sm font-bold text-emerald-500">
                  : {formatRupiah(transaction.nominal)}
                </span>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="w-12 px-4 py-3 text-center font-bold text-slate-500">No</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-500">Kode Rekening</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-500">
                    Uraian Barang / Jasa
                  </th>
                  <th className="px-4 py-3 text-right font-bold text-slate-500">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-center text-slate-500">{index + 1}</td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-100 px-2 py-1 rounded font-mono text-xs border border-slate-200">
                        {item.kode_rekening}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.uraian}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-600">
                      {formatRupiah(item.nominal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan="3" className="px-4 py-3 text-right font-bold text-slate-500">
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-500">
                    {formatRupiah(transaction.nominal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
