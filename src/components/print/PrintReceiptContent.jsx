import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFilter } from '../../context/FilterContext';
import { useArkasData } from '../../hooks/useArkasData';
import {
  Printer,
  Eye,
  Calendar,
  FileText,
  ChevronDown,
  Store,
  Loader2,
  CheckCircle,
  XCircle,
  Hash,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { MONTHS, formatRupiah, isPenerimaan } from '../../utils/transactionHelpers';
import ReceiptDetailModal from './ReceiptDetailModal';
import NotaGroupPreviewModal from './NotaGroupPreviewModal';

export default function PrintReceiptContent() {
  const { year, fundSource } = useFilter();
  const { school: schoolInfo } = useArkasData();
  const [selectedMonth, setSelectedMonth] = useState('01');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [previewGroup, setPreviewGroup] = useState(null);
  const [selectedGroups, setSelectedGroups] = useState(new Set());
  const [printedGroups, setPrintedGroups] = useState(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem('printed_groups');
      if (saved) setPrintedGroups(new Set(JSON.parse(saved)));
    } catch (e) { console.error("Failed to load printed groups:", e); }
  }, []);

  // Poll printed status from localStorage to sync with Nota Gabungan tab
  useEffect(() => {
    const poll = () => {
      try {
        const saved = localStorage.getItem('printed_groups');
        if (saved) {
          const parsed = new Set(JSON.parse(saved));
          setPrintedGroups(prev => {
            if (prev.size === parsed.size && [...parsed].every(k => prev.has(k))) return prev;
            return parsed;
          });
        }
      } catch {}
    };
    const id = setInterval(poll, 1500);
    return () => clearInterval(id);
  }, []);

  const markAsPrinted = (groupKeys, type) => {
    setPrintedGroups((prev) => {
      const next = new Set(prev);
      const keys = Array.isArray(groupKeys) ? groupKeys : [groupKeys];
      keys.forEach((key) => next.add(`${key}_${type}`));
      localStorage.setItem('printed_groups', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { year, month: selectedMonth, fundSource, limit: 1000 };
      const result = await window.arkas.getTransactions(params);
      const allRows = result.success ? result.data || [] : [];
      const filteredRows = allRows.filter(
        (row) => row.no_bukti && row.no_bukti.trim() !== '' && !isPenerimaan(row)
      );
      setTransactions(filteredRows);
    } catch (err) {
      toast.error('Gagal memuat data transaksi');
    } finally {
      setLoading(false);
    }
  }, [year, selectedMonth, fundSource]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const groupedTransactions = useMemo(() => {
    const groups = {};
    transactions.forEach((tx) => {
      const key = tx.no_bukti;
      if (!groups[key]) {
        groups[key] = { noBukti: key, tanggal: tx.tanggal_transaksi, items: [], totalNominal: 0 };
      }
      groups[key].items.push(tx);
      groups[key].totalNominal += tx.nominal || 0;
    });
    return Object.values(groups).sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
  }, [transactions]);

  const toggleGroupSelection = (groupKey) => {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedGroups.size === groupedTransactions.length) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(groupedTransactions.map((g) => g.noBukti)));
    }
  };

  const getSelectedItems = () => {
    const items = [];
    groupedTransactions.forEach((group) => {
      if (selectedGroups.has(group.noBukti)) items.push(...group.items);
    });
    return items;
  };

  const handlePrintA2 = async (groupOrGroups) => {
    const groups = Array.isArray(groupOrGroups) ? groupOrGroups : [groupOrGroups];
    const items = groups.flatMap((g) => g.items);
    const noBuktiList = [...new Set(groups.map((g) => g.noBukti))];
    if (items.length === 0) {
      toast.warning('Tidak ada item untuk dicetak.');
      return;
    }

    try {
      const ids = items.map((item) => item.id_kas_umum);
      if (window.arkas?.printA2AutoSave) {
        const result = await window.arkas.printA2AutoSave(ids, noBuktiList, year);
        if (result.success) {
          toast.success('A2 berhasil disimpan');
          markAsPrinted(noBuktiList, 'A2');
          if (Array.isArray(groupOrGroups)) setSelectedGroups(new Set());
        } else if (!result.canceled) {
          toast.error('Gagal mencetak: ' + (result.error || 'Unknown error'));
        }
      } else {
        const result = await window.arkas.printMergedKwitansi(ids, noBuktiList.join('_'), '', year);
        if (result.success) {
          toast.success('Dokumen berhasil disimpan!');
          markAsPrinted(noBuktiList, 'A2');
        }
      }
    } catch (err) {
      toast.error('Terjadi kesalahan: ' + err.message);
    }
  };

  const handlePrintBukti = async (groupOrGroups) => {
    const groups = Array.isArray(groupOrGroups) ? groupOrGroups : [groupOrGroups];
    const items = groups.flatMap((g) => g.items);
    const noBuktiList = [...new Set(groups.map((g) => g.noBukti))];
    if (items.length === 0) {
      toast.warning('Tidak ada item untuk dicetak.');
      return;
    }

    try {
      const ids = items.map((item) => item.id_kas_umum);
      if (window.arkas?.printBuktiAutoSave) {
        const result = await window.arkas.printBuktiAutoSave(ids, noBuktiList, year);
        if (result.success) {
          toast.success('Bukti Pengeluaran berhasil disimpan');
          markAsPrinted(noBuktiList, 'BUKTI');
          if (Array.isArray(groupOrGroups)) setSelectedGroups(new Set());
        } else if (!result.canceled) {
          toast.error('Gagal mencetak: ' + (result.error || 'Unknown error'));
        }
      } else {
        const notaData = {
          namaToko: groups[0]?.items[0]?.uraian?.split(' - ')[0] || 'Bukti Belanja',
          noNota: noBuktiList.join(', '),
          tanggalNota: groups[0]?.tanggal,
          items: items.map((item) => ({
            id_kas_umum: item.id_kas_umum,
            uraian: item.uraian,
            nominal: item.nominal,
            no_bukti: item.no_bukti,
          })),
          totalNominal: items.reduce((sum, item) => sum + item.nominal, 0),
          calculatedPPN: Math.round(
            (items.reduce((sum, item) => sum + item.nominal, 0) * 11) / 111
          ),
          isSiplah: false,
          hasPPN: true,
        };
        setPreviewGroup(notaData);
      }
    } catch (err) {
      toast.error('Terjadi kesalahan: ' + err.message);
    }
  };

  const resetPrintStatus = (noBukti, type = 'ALL') => {
    setPrintedGroups((prev) => {
      const next = new Set(prev);
      if (type === 'ALL') {
        next.delete(`${noBukti}_A2`);
        next.delete(`${noBukti}_BUKTI`);
      } else next.delete(`${noBukti}_${type}`);
      localStorage.setItem('printed_groups', JSON.stringify(Array.from(next)));
      return next;
    });
    toast.info(`Status cetak ${noBukti} direset.`);
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const totalItems = transactions.length;
  const totalNominal = transactions.reduce((sum, t) => sum + t.nominal, 0);
  const selectedCount = selectedGroups.size;
  const selectedTotal = getSelectedItems().reduce((sum, t) => sum + t.nominal, 0);

  return (
    <div className="space-y-4">
      {selectedTransaction && (
        <ReceiptDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
      {previewGroup && (
        <NotaGroupPreviewModal
          notaGroup={previewGroup}
          schoolInfo={schoolInfo}
          onClose={() => setPreviewGroup(null)}
        />
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-slate-400" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent cursor-pointer"
          >
            {MONTHS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-px h-6 bg-slate-200" />
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Hash size={13} />
          <span className="font-medium">{groupedTransactions.length} grup</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-violet-50/50 border border-violet-100 rounded-xl p-4">
          <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-1">
            Total Grup
          </p>
          <p className="text-2xl font-extrabold text-violet-700">{groupedTransactions.length}</p>
        </div>
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">
            Total Item
          </p>
          <p className="text-2xl font-extrabold text-blue-700">{totalItems}</p>
        </div>
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">
            Total Nilai
          </p>
          <p className="text-xl font-extrabold text-emerald-700 tabular-nums">
            {formatRupiah(totalNominal)}
          </p>
        </div>
      </div>

      {/* Batch Action Bar */}
      {selectedCount > 0 && (
        <div className="bg-violet-50 p-4 rounded-xl border border-violet-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-violet-700">
                {selectedCount} grup dipilih ({getSelectedItems().length} item)
              </span>
              <span className="text-sm font-medium text-violet-600 tabular-nums">
                Total: {formatRupiah(selectedTotal)}
              </span>
            </div>
            <button
              onClick={() => setSelectedGroups(new Set())}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 transition"
            >
              <XCircle size={13} />
              Reset
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                handlePrintA2(groupedTransactions.filter((g) => selectedGroups.has(g.noBukti)))
              }
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition active:scale-[0.98]"
            >
              <FileText size={16} />
              Cetak A2 Gabungan
            </button>
            <button
              onClick={() =>
                handlePrintBukti(groupedTransactions.filter((g) => selectedGroups.has(g.noBukti)))
              }
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 transition active:scale-[0.98]"
            >
              <Printer size={16} />
              Cetak Bukti Gabungan
            </button>
          </div>
        </div>
      )}

      {/* Grouped List */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            <p className="text-sm text-slate-500 font-medium">Memuat data transaksi...</p>
          </div>
        ) : groupedTransactions.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 mb-1">
              Tidak ada data transaksi
            </h3>
            <p className="text-sm text-slate-500">Pilih bulan untuk menampilkan transaksi</p>
          </div>
        ) : (
          groupedTransactions.map((group, gi) => {
            const isExpanded = expandedGroup === group.noBukti;
            const isSelected = selectedGroups.has(group.noBukti);
            const isPrintedA2 = printedGroups.has(`${group.noBukti}_A2`);
            const isPrintedBukti = printedGroups.has(`${group.noBukti}_BUKTI`);
            const isFullyPrinted = isPrintedA2 && isPrintedBukti;

            return (
              <div
                key={group.noBukti}
                className={`rounded-xl border overflow-hidden transition-all ${
                  isExpanded
                    ? 'border-violet-200 shadow-md shadow-violet-100/50'
                    : isSelected
                      ? 'border-violet-300 shadow-sm'
                      : 'border-slate-200 shadow-sm hover:shadow hover:border-slate-300'
                } ${isFullyPrinted ? 'opacity-60' : ''}`}
              >
                <div
                  className="px-4 py-3 cursor-pointer transition-colors"
                  onClick={() => setExpandedGroup(isExpanded ? null : group.noBukti)}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <div onClick={(e) => e.stopPropagation()} className="flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleGroupSelection(group.noBukti)}
                        className="rounded accent-violet-600 w-4 h-4 cursor-pointer"
                        disabled={isFullyPrinted}
                      />
                    </div>

                    {/* Number */}
                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-slate-500">{gi + 1}</span>
                    </div>

                    {/* Icon */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isFullyPrinted ? 'bg-emerald-100' : 'bg-violet-100'}`}
                    >
                      {isFullyPrinted ? (
                        <CheckCircle size={16} className="text-emerald-600" />
                      ) : (
                        <FileText size={16} className="text-violet-600" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-800 text-sm">
                          {group.noBukti}
                        </span>
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">
                          {group.items.length}
                        </span>
                        {isPrintedA2 && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              resetPrintStatus(group.noBukti, 'A2');
                            }}
                            className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded cursor-pointer hover:bg-orange-200 transition"
                            title="A2 Sudah dicetak (Klik untuk reset)"
                          >
                            A2
                          </span>
                        )}
                        {isPrintedBukti && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              resetPrintStatus(group.noBukti, 'BUKTI');
                            }}
                            className="px-1.5 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-bold rounded cursor-pointer hover:bg-violet-200 transition"
                            title="Bukti Sudah dicetak (Klik untuk reset)"
                          >
                            Bukti
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {group.items.length === 1
                          ? group.items[0].uraian
                          : `${group.items[0].uraian} (+${group.items.length - 1} lainnya)`}
                        <span className="text-slate-400 ml-1">{formatDate(group.tanggal)}</span>
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0 mr-1">
                      <p className="font-bold text-slate-800 text-sm tabular-nums">
                        {formatRupiah(group.totalNominal)}
                      </p>
                    </div>

                    {/* Chevron */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                        isExpanded
                          ? 'bg-violet-100 text-violet-600 rotate-180'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/50">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="px-4 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Uraian
                            </th>
                            <th className="px-4 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Tanggal
                            </th>
                            <th className="px-4 py-2 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Nominal
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/50">
                          {group.items.map((item) => (
                            <tr key={item.id_kas_umum} className="hover:bg-white/80">
                              <td className="px-4 py-2.5 text-slate-700">{item.uraian}</td>
                              <td className="px-4 py-2.5 text-slate-500 text-xs">
                                {formatDate(item.tanggal_transaksi)}
                              </td>
                              <td className="px-4 py-2.5 text-right font-semibold text-slate-800 tabular-nums">
                                {formatRupiah(item.nominal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-slate-300 bg-white">
                            <td
                              colSpan="2"
                              className="px-4 py-2.5 font-bold text-slate-800 text-sm"
                            >
                              Total
                            </td>
                            <td className="px-4 py-2.5 text-right font-extrabold text-slate-900 text-sm tabular-nums">
                              {formatRupiah(group.totalNominal)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Action Buttons */}
                    <div className="px-4 py-3 border-t border-slate-200 bg-white flex items-center justify-between">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resetPrintStatus(group.noBukti, 'ALL');
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition active:scale-[0.97]"
                      >
                        <RefreshCw size={12} />
                        Reset Cetak
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintA2(group);
                          }}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition active:scale-[0.97] ${
                            isPrintedA2
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm'
                          }`}
                          disabled={isPrintedA2}
                        >
                          <FileText size={13} />
                          Cetak A2
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintBukti(group);
                          }}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition active:scale-[0.97] ${
                            isPrintedBukti
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
                          }`}
                          disabled={isPrintedBukti}
                        >
                          <Printer size={13} />
                          Cetak Bukti
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Select All Footer */}
      {groupedTransactions.length > 0 && (
        <div className="flex items-center justify-between py-2 px-1">
          <button
            onClick={toggleSelectAll}
            className="text-xs font-semibold text-violet-600 hover:text-violet-800 transition"
          >
            {selectedGroups.size === groupedTransactions.length ? 'Batalkan Semua' : 'Pilih Semua'}
          </button>
          <p className="text-[10px] text-slate-400">
            Cetak gabungan TIDAK mengubah data asli (Safe Mode)
          </p>
        </div>
      )}
    </div>
  );
}
