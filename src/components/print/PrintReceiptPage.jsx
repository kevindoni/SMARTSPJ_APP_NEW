import { useState, useEffect, useCallback } from 'react';
import { useFilter } from '../../context/FilterContext';
import { Printer, Eye, Calendar, FileText } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MONTHS, formatRupiah, isPenerimaan } from '../../utils/transactionHelpers';
import ReceiptDetailModal from './ReceiptDetailModal';
import ReceiptPreviewModal from './ReceiptPreviewModal';

export default function PrintReceiptPage() {
  const { year, fundSource } = useFilter();
  const [selectedMonth, setSelectedMonth] = useState('01');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [printingId, setPrintingId] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [previewTransaction, setPreviewTransaction] = useState(null);
  const [schoolInfo, setSchoolInfo] = useState(null);

  // Merge State
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [targetNoBukti, setTargetNoBukti] = useState('');
  const [customUraian, setCustomUraian] = useState('');
  const [isMerging, setIsMerging] = useState(false);

  // Local Print History (Safe Mode)
  const [printedIds, setPrintedIds] = useState(new Set());

  // Load history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('printed_groups');
      if (saved) {
        setPrintedIds(new Set(JSON.parse(saved)));
      }
    } catch (e) {
      console.error('Failed to load print history', e);
    }
  }, []);

  // Save history helper
  const markAsPrinted = (ids) => {
    setPrintedIds((prev) => {
      const next = new Set(prev);
      if (Array.isArray(ids)) ids.forEach((id) => next.add(id));
      else next.add(ids);
      localStorage.setItem('printed_groups', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // Toggle (Re-print) helper
  const togglePrintedStatus = (id) => {
    setPrintedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('printed_groups', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // Fetch data function
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        year: year,
        month: selectedMonth,
        fundSource: fundSource,
        limit: 1000,
      };

      const result = await window.arkas.getTransactions(params);
      const allRows = result.success ? result.data || [] : [];

      // Filter for "Nota" / "Expense" type items that are printable and have a proof number
      const filteredRows = allRows.filter(
        (row) => row.no_bukti && row.no_bukti.trim() !== '' && !isPenerimaan(row)
      );
      setTransactions(filteredRows);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Gagal memuat data transaksi');
    } finally {
      setLoading(false);
    }
  }, [year, selectedMonth, fundSource]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Fetch school info on mount
  useEffect(() => {
    const fetchSchoolInfo = async () => {
      try {
        if (window.arkas && window.arkas.reloadSchoolData) {
          const result = await window.arkas.reloadSchoolData();
          if (result.success) {
            setSchoolInfo(result.data);
          }
        }
      } catch (err) {
        console.error('Failed to load school info:', err);
      }
    };
    fetchSchoolInfo();
  }, []);

  // Merge Logic
  const toggleSelection = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((t) => t.id_kas_umum)));
    }
  };

  const handleMerge = async () => {
    if (selectedIds.size === 0) {
      toast.warning('Pilih minimal 1 item untuk dicetak gabungan.');
      return;
    }
    // targetNoBukti is optional for printing, but good for label
    const title = targetNoBukti ? targetNoBukti : 'GABUNGAN';

    // Logic: Virtual Merge Print (Does NOT update DB)
    setIsMerging(true);
    try {
      if (window.arkas && window.arkas.printMergedKwitansi) {
        const result = await window.arkas.printMergedKwitansi(
          Array.from(selectedIds),
          targetNoBukti,
          customUraian,
          year
        );
        if (result.success) {
          toast.success('Kuitansi Gabungan berhasil disimpan!');
          markAsPrinted(Array.from(selectedIds));
          // No need to refresh transactions because DB is unchanged
          // Let's clear to indicate done.
          setSelectedIds(new Set());
          setTargetNoBukti('');
          setCustomUraian('');
        } else if (!result.canceled) {
          toast.error('Gagal mencetak: ' + result.error);
        }
      } else {
        toast.error('Fungsi cetak gabungan belum tersedia (restart app).');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan: ' + err.message);
    } finally {
      setIsMerging(false);
    }
  };

  // Open preview modal
  const openPreview = (transaction) => {
    setPreviewTransaction(transaction);
  };

  const handlePrint = async (transaction) => {
    setPrintingId(transaction.id_kas_umum);
    try {
      const customDate = localStorage.getItem(`custom_date_${transaction.id_kas_umum}`);
      const transactionWithDate = customDate
        ? { ...transaction, printDate: customDate }
        : transaction;

      if (window.arkas && window.arkas.printKwitansi) {
        const result = await window.arkas.printKwitansi(transactionWithDate, year);
        if (result.success) {
          toast.success('Bukti Pengeluaran berhasil disimpan');
          markAsPrinted([transaction.id_kas_umum]);
        } else if (!result.canceled) {
          toast.error('Gagal mencetak: ' + result.error);
        }
      }
    } catch (error) {
      toast.error('Terjadi kesalahan sistem');
    } finally {
      setPrintingId(null);
    }
  };

  const getDayName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  return (
    <div className="font-sans min-h-screen pb-20 bg-slate-50/50">
      <ToastContainer />

      {selectedTransaction && (
        <ReceiptDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}

      {previewTransaction && (
        <ReceiptPreviewModal
          transaction={previewTransaction}
          schoolInfo={schoolInfo}
          year={year}
          onClose={() => setPreviewTransaction(null)}
          onPrint={(tx) => {
            setPreviewTransaction(null);
            handlePrint(tx);
          }}
        />
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-blue-600 mb-1">Filter Data</h3>
          <p className="text-xs text-slate-500">Menampilkan data untuk TA {year}</p>
        </div>

        <div className="w-64">
          <label className="block text-xs font-bold text-slate-500 mb-1">Bulan</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
            >
              {MONTHS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-bold text-blue-600">Daftar Nota / Bukti Transaksi</h3>
          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded">
            {fundSource === 'all' ? 'SEMUA SUMBER DANA' : fundSource}
          </span>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-700 text-white">
              <tr>
                <th className="w-12 py-3 px-4 text-center">
                  <input
                    type="checkbox"
                    className="rounded accent-blue-600 w-4 h-4 cursor-pointer"
                    checked={transactions.length > 0 && selectedIds.size === transactions.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider">
                  No. Bukti
                </th>
                <th className="py-3 px-4 text-left font-semibold text-xs uppercase tracking-wider">
                  Kode Rekening / Kegiatan
                </th>
                <th className="py-3 px-4 text-center font-semibold text-xs uppercase tracking-wider">
                  Jumlah Item
                </th>
                <th className="py-3 px-4 text-right font-semibold text-xs uppercase tracking-wider">
                  Total Nominal
                </th>
                <th className="py-3 px-4 text-center font-semibold text-xs uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Memuat data...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Tidak ada data transaksi
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const isPrinted = printedIds.has(tx.id_kas_umum);
                  return (
                    <tr
                      key={tx.id_kas_umum}
                      className={`transition-colors group ${selectedIds.has(tx.id_kas_umum) ? 'bg-blue-50/50' : ''} ${isPrinted ? 'opacity-60 bg-slate-50' : 'hover:bg-slate-50'}`}
                    >
                      <td className="py-4 px-4 text-center align-middle">
                        <input
                          type="checkbox"
                          className="rounded accent-blue-600 w-4 h-4 cursor-pointer border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          checked={selectedIds.has(tx.id_kas_umum)}
                          onChange={() => toggleSelection(tx.id_kas_umum)}
                          disabled={isPrinted}
                        />
                      </td>
                      <td className="py-4 px-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm ${isPrinted ? 'bg-slate-400' : 'bg-teal-500'}`}
                          >
                            {new Date(tx.tanggal_transaksi).getDate()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-500 text-xs">
                              {new Date(tx.tanggal_transaksi).toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                              })}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              {getDayName(tx.tanggal_transaksi)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 align-middle">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm ${isPrinted ? 'bg-slate-400' : 'bg-yellow-400'}`}
                            >
                              <FileText size={14} />
                            </div>
                            <span className="font-bold text-slate-600 text-sm">
                              {tx.no_bukti || '-'}
                            </span>
                          </div>
                          {isPrinted && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePrintedStatus(tx.id_kas_umum);
                              }}
                              className="self-start px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded cursor-pointer hover:bg-emerald-200 border border-emerald-200 transition-colors select-none"
                              title="Klik untuk membuka kunci (Supaya bisa dicetak lagi)"
                            >
                              ✅ Sudah Dicetak
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 align-middle">
                        <div className="flex flex-col gap-1">
                          <span className="bg-slate-600 text-white px-2 py-0.5 rounded text-[10px] font-mono self-start">
                            {tx.kode_rekening || '-'}
                          </span>
                          <span className="text-xs text-slate-500 line-clamp-1">{tx.uraian}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-slate-500 text-xs align-middle">
                        1 Item
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-emerald-500 text-sm align-middle">
                        {formatRupiah(tx.nominal)}
                      </td>
                      <td className="py-4 px-4 text-center align-middle">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => setSelectedTransaction(tx)}
                            className="p-1.5 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors shadow-sm"
                            title="Lihat Detail"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => openPreview(tx)}
                            disabled={printingId === tx.id_kas_umum || isPrinted}
                            className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50 disabled:bg-slate-400 disabled:cursor-not-allowed"
                            title={isPrinted ? 'Sudah Dicetak' : 'Preview & Cetak'}
                          >
                            {printingId === tx.id_kas_umum ? (
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Printer size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {transactions.length > 0 && (
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td
                    colSpan="5"
                    className="py-3 px-4 text-right font-bold text-slate-400 text-xs uppercase"
                  >
                    Total
                  </td>
                  <td
                    colSpan="1"
                    className="py-3 px-4 text-right font-bold text-emerald-500 text-sm"
                  >
                    {formatRupiah(transactions.reduce((acc, curr) => acc + curr.nominal, 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Merge Request Footer */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mt-6">
        <div className="flex items-center gap-2 mb-2">
          <Printer className="text-blue-600" size={18} />
          <h3 className="text-sm font-bold text-blue-600">Cetak Gabungan (Virtual - Aman)</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Centang beberapa item di atas untuk dicetak dalam <b>SATU KUITANSI GABUNGAN</b>.
          <br />
          <span className="text-emerald-600 font-semibold">
            Fitur ini TIDAK mengubah data asli di database (Safe Mode).
          </span>
        </p>
        <div className="flex gap-4 items-end">
          <div className="w-64">
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Nomor Bukti (Opsional)
            </label>
            <input
              type="text"
              value={targetNoBukti}
              onChange={(e) => setTargetNoBukti(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Contoh: BNU-GAB..."
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-500 mb-1">
              Uraian Kuitansi (Opsional)
            </label>
            <input
              type="text"
              value={customUraian}
              onChange={(e) => setCustomUraian(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Biarkan kosong untuk memakai uraian item pertama..."
            />
          </div>
          <div>
            <button
              onClick={handleMerge}
              disabled={isMerging || selectedIds.size === 0}
              className="px-6 py-2 bg-slate-700 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 disabled:opacity-50 disabled:shadow-none flex items-center gap-2 whitespace-nowrap"
            >
              {isMerging ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Printer size={16} />
              )}
              Preview & Cetak
            </button>
          </div>
        </div>
        {/* Selected Count Indicator & Reset */}
        {selectedIds.size > 0 && (
          <div className="mt-2 flex items-center gap-4">
            <div className="text-xs text-blue-600 font-semibold">
              {selectedIds.size} item dipilih
            </div>
            <button
              onClick={() => {
                setSelectedIds(new Set());
                setTargetNoBukti('');
                setCustomUraian('');
              }}
              className="text-xs text-red-500 hover:text-red-700 font-bold underline decoration-dotted"
            >
              Batalkan / Reset Pilihan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
