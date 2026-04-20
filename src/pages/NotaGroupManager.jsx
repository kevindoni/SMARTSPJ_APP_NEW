import { useState, useEffect } from 'react';
import { useFilter } from '../context/FilterContext';
import { useArkasData } from '../hooks/useArkasData';
import PrintReceiptContent from '../components/print/PrintReceiptContent';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FileStack,
  Search,
  Store,
  ChevronDown,
  ChevronUp,
  Package,
  RefreshCw,
  AlertCircle,
  Printer,
  Loader2,
  Calendar,
  Hash,
  FileText,
  CheckCircle,
} from 'lucide-react';

export default function NotaGroupManager() {
  const { year: contextYear } = useFilter();
  const [month, setMonth] = useState('');
  const [notaGroups, setNotaGroups] = useState([]);
  const [savedGroups, setSavedGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedNota, setExpandedNota] = useState(null);
  const [printedGroups, setPrintedGroups] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('nota-gabungan');

  const { school } = useArkasData();
  const year = contextYear;

  const months = [
    { value: '', label: 'Semua Bulan' },
    { value: '01', label: 'Januari' },
    { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ];

  const loadNotaGroups = async () => {
    if (!window.arkas?.notaGroups?.getTransactionsByNota) {
      setError('API tidak tersedia');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await window.arkas.notaGroups.getTransactionsByNota(year, month || null);
      if (result.success) {
        setNotaGroups(result.data || []);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedGroups = async () => {
    if (!window.arkas?.notaGroups?.getAll) return;
    try {
      const result = await window.arkas.notaGroups.getAll(year);
      if (result.success) {
        setSavedGroups(result.data || []);
      }
    } catch (err) {
      console.error('Error loading saved groups:', err);
    }
  };

  useEffect(() => {
    loadNotaGroups();
    loadSavedGroups();
    try {
      const saved = localStorage.getItem('printed_groups');
      if (saved) setPrintedGroups(new Set(JSON.parse(saved)));
    } catch (e) {
      console.error('Failed to load printed status:', e);
    }
  }, [year, month]);

  // Reload printed status when switching tabs (sync with Cetak Manual)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('printed_groups');
      if (saved) setPrintedGroups(new Set(JSON.parse(saved)));
    } catch {}
  }, [activeTab]);

  const filteredGroups = notaGroups.filter((group) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      group.noNota?.toLowerCase().includes(searchLower) ||
      group.namaToko?.toLowerCase().includes(searchLower) ||
      group.items?.some((item) => item.uraian?.toLowerCase().includes(searchLower))
    );
  });

  const toggleExpand = (notaId) => {
    setExpandedNota(expandedNota === notaId ? null : notaId);
  };

  const handlePrintA2 = async (group) => {
    if (!group.items?.length) return;
    const ids = group.items.map((i) => i.id_kas_umum).filter(Boolean);
    const noBus = [...new Set(group.items.map((i) => i.no_bukti).filter(Boolean))];
    if (window.arkas?.printA2AutoSave) {
      await window.arkas.printA2AutoSave(ids, noBus, year);
      markAsPrinted(group.items?.map((i) => i.no_bukti).filter(Boolean), 'A2');
    }
  };

  const handlePrintBukti = async (group) => {
    if (!group.items?.length) return;
    const ids = group.items.map((i) => i.id_kas_umum).filter(Boolean);
    const noBus = [...new Set(group.items.map((i) => i.no_bukti).filter(Boolean))];
    if (window.arkas?.printBuktiAutoSave) {
      await window.arkas.printBuktiAutoSave(ids, noBus, year);
      markAsPrinted(group.items?.map((i) => i.no_bukti).filter(Boolean), 'BUKTI');
    }
  };

  const markAsPrinted = (noBuktiList, type) => {
    setPrintedGroups((prev) => {
      const next = new Set(prev);
      const keys = Array.isArray(noBuktiList) ? noBuktiList : [noBuktiList];
      keys.forEach((k) => next.add(k + '_' + type));
      localStorage.setItem('printed_groups', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const resetPrintStatus = (noBuktiList, type = 'ALL') => {
    setPrintedGroups((prev) => {
      const next = new Set(prev);
      const keys = Array.isArray(noBuktiList) ? noBuktiList : [noBuktiList];
      keys.forEach((k) => {
        if (type === 'ALL') {
          next.delete(k + '_A2');
          next.delete(k + '_BUKTI');
        } else next.delete(k + '_' + type);
      });
      localStorage.setItem('printed_groups', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <ToastContainer />

      {/* Page Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-violet-200">
            <FileStack size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              PENATAUSAHAAN
            </span>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">BUKTI TRANSAKSI</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-600 uppercase tracking-wide">
            TA {year}
          </span>
          {month && (
            <span className="text-sm font-medium text-slate-500">
              Bulan {months.find((m) => m.value === month)?.label}
            </span>
          )}
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Toolbar: Tabs + Filters */}
        <div className="border-b border-slate-200">
          {/* Row 1: Tabs */}
          <div className="flex items-center justify-between px-4 pt-3 pb-0">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {[
                { id: 'nota-gabungan', label: 'Nota Gabungan', icon: FileStack },
                { id: 'cetak-manual', label: 'Cetak Manual', icon: Printer },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                      activeTab === tab.id
                        ? 'bg-white text-violet-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {activeTab === 'nota-gabungan' && (
              <button
                onClick={() => {
                  loadNotaGroups();
                  loadSavedGroups();
                }}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition active:scale-95 disabled:opacity-50"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            )}
          </div>

          {/* Row 2: Filters (only for nota-gabungan) */}
          {activeTab === 'nota-gabungan' && (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-slate-400" />
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent cursor-pointer"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-px h-6 bg-slate-200" />

              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari no nota, toko, atau uraian..."
                  className="w-full pl-10 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                />
              </div>

              <div className="flex-1" />

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Hash size={13} />
                <span className="font-medium">{filteredGroups.length} nota</span>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-4">
          {activeTab === 'cetak-manual' ? (
            <PrintReceiptContent />
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
              <p className="text-sm text-slate-500 font-medium">Memuat data nota...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-500" />
              </div>
              <p className="text-sm text-red-600 font-medium">{error}</p>
              <button
                onClick={loadNotaGroups}
                className="mt-1 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition active:scale-95"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-violet-50/50 border border-violet-100 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-1">
                    Total Nota
                  </p>
                  <p className="text-2xl font-extrabold text-violet-700">{filteredGroups.length}</p>
                </div>
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">
                    Total Item
                  </p>
                  <p className="text-2xl font-extrabold text-blue-700">
                    {filteredGroups.reduce((sum, g) => sum + g.items.length, 0)}
                  </p>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">
                    Total Nilai
                  </p>
                  <p className="text-xl font-extrabold text-emerald-700 tabular-nums">
                    {formatCurrency(filteredGroups.reduce((sum, g) => sum + g.totalNominal, 0))}
                  </p>
                </div>
              </div>

              {/* Empty State */}
              {filteredGroups.length === 0 && (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileStack className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-700 mb-1">
                    Tidak ada nota ditemukan
                  </h3>
                  <p className="text-sm text-slate-500">
                    Tidak ada transaksi dengan nota pada periode yang dipilih
                  </p>
                </div>
              )}

              {/* Nota List */}
              {filteredGroups.length > 0 && (
                <div className="space-y-2">
                  {filteredGroups.map((group, gi) => {
                    const gNoBus = [
                      ...new Set((group.items || []).map((i) => i.no_bukti).filter(Boolean)),
                    ];
                    const isPA2 = gNoBus.some((b) => printedGroups.has(b + '_A2'));
                    const isPBukti = gNoBus.some((b) => printedGroups.has(b + '_BUKTI'));
                    const isFull = gNoBus.length > 0 && isPA2 && isPBukti;
                    return (
                      <div
                        key={group.notaId}
                        className={`rounded-xl border overflow-hidden transition-all ${
                          expandedNota === group.notaId
                            ? 'border-violet-200 shadow-md shadow-violet-100/50'
                            : 'border-slate-200 shadow-sm hover:shadow hover:border-slate-300'
                        } ${isFull ? 'opacity-60' : ''}`}
                      >
                        {/* Card Header */}
                        <div
                          className="px-4 py-3 cursor-pointer transition-colors"
                          onClick={() => toggleExpand(group.notaId)}
                        >
                          <div className="flex items-center gap-3">
                            {/* Number badge */}
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-slate-500">{gi + 1}</span>
                            </div>

                            {/* Icon */}
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isFull
                                  ? 'bg-emerald-100'
                                  : group.isGrouped
                                    ? group.isSiplah
                                      ? 'bg-blue-100'
                                      : 'bg-violet-100'
                                    : 'bg-slate-100'
                              }`}
                            >
                              {isFull ? (
                                <CheckCircle size={16} className="text-emerald-600" />
                              ) : (
                                <Store
                                  size={16}
                                  className={
                                    group.isGrouped
                                      ? group.isSiplah
                                        ? 'text-blue-600'
                                        : 'text-violet-600'
                                      : 'text-slate-500'
                                  }
                                />
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`font-semibold text-sm truncate ${isFull ? 'text-slate-400 line-through' : 'text-slate-800'}`}
                                >
                                  {group.namaToko || 'Tanpa Nama'}
                                </span>
                                {group.isGrouped && (
                                  <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-bold rounded flex-shrink-0">
                                    {group.items.length}
                                  </span>
                                )}
                                {group.isSiplah && (
                                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded flex-shrink-0">
                                    SIPLah
                                  </span>
                                )}
                                {group.hasPPN && (
                                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded flex-shrink-0">
                                    PPN
                                  </span>
                                )}
                                {isPA2 && (
                                  <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded flex-shrink-0">
                                    A2
                                  </span>
                                )}
                                {isPBukti && (
                                  <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-bold rounded flex-shrink-0">
                                    Bukti
                                  </span>
                                )}
                              </div>
                              <p
                                className={`text-xs mt-0.5 truncate ${isFull ? 'text-slate-300' : 'text-slate-500'}`}
                              >
                                {group.noNota || group.items[0]?.no_bukti || 'Tanpa No. Nota'} •{' '}
                                {formatDate(group.tanggalNota)}
                              </p>
                            </div>

                            {/* Amount */}
                            <div className="text-right flex-shrink-0 mr-2">
                              <p
                                className={`font-bold text-sm tabular-nums ${isFull ? 'text-slate-300 line-through' : 'text-slate-800'}`}
                              >
                                {formatCurrency(group.totalNominal)}
                              </p>
                            </div>

                            {/* Chevron */}
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                                expandedNota === group.notaId
                                  ? 'bg-violet-100 text-violet-600 rotate-180'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              <ChevronDown size={14} />
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedNota === group.notaId && (
                          <div className="border-t border-slate-200 bg-slate-50/50">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-slate-200">
                                    <th className="px-4 py-2 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                      No Bukti
                                    </th>
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
                                  {group.items.map((item, idx) => (
                                    <tr key={item.id_kas_umum || idx} className="hover:bg-white/80">
                                      <td className="px-4 py-2.5">
                                        <span className="inline-flex items-center px-2 py-0.5 bg-violet-50 text-violet-700 text-xs font-semibold rounded-md">
                                          {item.no_bukti || '-'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2.5 text-slate-700">{item.uraian}</td>
                                      <td className="px-4 py-2.5 text-slate-500 text-xs">
                                        {formatDate(item.tanggal_transaksi)}
                                      </td>
                                      <td className="px-4 py-2.5 text-right font-semibold text-slate-800 tabular-nums">
                                        {formatCurrency(item.nominal)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t border-slate-300 bg-white">
                                    <td
                                      colSpan="3"
                                      className="px-4 py-2.5 font-bold text-slate-800 text-sm"
                                    >
                                      Total
                                    </td>
                                    <td className="px-4 py-2.5 text-right font-extrabold text-slate-900 text-sm tabular-nums">
                                      {formatCurrency(group.totalNominal)}
                                    </td>
                                  </tr>
                                  {group.hasPPN && (
                                    <tr className="border-t border-slate-200 bg-emerald-50/30">
                                      <td
                                        colSpan="3"
                                        className="px-4 py-2.5 font-medium text-emerald-700 text-xs"
                                      >
                                        PPN (11%)
                                      </td>
                                      <td className="px-4 py-2.5 text-right font-bold text-emerald-700 text-xs tabular-nums">
                                        {formatCurrency(group.calculatedPPN)}
                                      </td>
                                    </tr>
                                  )}
                                </tfoot>
                              </table>
                            </div>
                            <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handlePrintA2(group)}
                                  disabled={isPA2}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition active:scale-[0.97] ${isPA2 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                                >
                                  <FileText size={12} />
                                  {isPA2 ? '✓ A2' : 'Cetak A2'}
                                </button>
                                <button
                                  onClick={() => handlePrintBukti(group)}
                                  disabled={isPBukti}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition active:scale-[0.97] ${isPBukti ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-violet-600 text-white hover:bg-violet-700'}`}
                                >
                                  <Printer size={12} />
                                  {isPBukti ? '✓ Bukti' : 'Cetak Bukti'}
                                </button>
                              </div>
                              <button
                                onClick={() =>
                                  resetPrintStatus(
                                    group.items?.map((i) => i.no_bukti).filter(Boolean),
                                    'ALL'
                                  )
                                }
                                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition active:scale-[0.97]"
                              >
                                <RefreshCw size={12} />
                                Reset Cetak
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
