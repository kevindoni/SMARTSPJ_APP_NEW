import { useState, useEffect, useCallback, useMemo } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useFilter } from '../../context/FilterContext';
import { FileSpreadsheet, Plus, Trash2, AlertTriangle } from 'lucide-react';
import TaxTransactionTable from './TaxTransactionTable'; // Custom Table
import TransactionSummary from './TransactionSummary';
import TransactionFilters from './TransactionFilters';
import useTransactions from './hooks/useTransactions'; // Default import correct
import { formatRupiah, MONTHS } from '../../utils/transactionHelpers';

import ManualTaxModal from './ManualTaxModal';

export default function TaxReportList({ stats }) {
  // Accept props stats
  const { year, fundSource } = useFilter();

  // Manage Month selection locally like BankReportList
  const [selectedMonth, setSelectedMonth] = useState('01'); // Default to January
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [search, setSearch] = useState('');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false); // Consistent with others
  const [isExporting, setIsExporting] = useState(false);

  // === Manual Tax Entry State ===
  const [showManualTaxModal, setShowManualTaxModal] = useState(false);
  const [manualTaxes, setManualTaxes] = useState([]);

  // Fetch manual taxes for this year
  const fetchManualTaxes = useCallback(async () => {
    if (window.arkas?.getManualTaxes) {
      const result = await window.arkas.getManualTaxes(year);
      if (result.success) {
        setManualTaxes(result.data || []);
      }
    }
  }, [year]);

  useEffect(() => {
    fetchManualTaxes();
  }, [fetchManualTaxes]);

  // Custom Hook for fetching transactions
  const { data, loading, hasMore, handleLoadMore, refetch } = useTransactions({
    year,
    fundSource,
    search,
    selectedMonth,
    selectedFilters,
    paymentType: 'PAJAK', // Filter for Tax transactions
    // Tax Reports usually need comprehensive totals, fetch practically all for the year
    limit: 20000,
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle Month Change
  const handleMonthChange = (val) => {
    setSelectedMonth(val);
  };

  const isMonthView = selectedMonth !== 'SEMUA';

  // Handler for successful save from Modal
  const handleManualTaxSaved = () => {
    fetchManualTaxes();
    if (refetch) refetch();
  };

  const confirmDeleteManualTax = (id) => {
    setPendingDeleteId(id);
  };
  const cancelDelete = () => {
    setPendingDeleteId(null);
  };
  const handleDeleteManualTax = async (id) => {
    try {
      const result = await window.arkas.deleteManualTax(id);
      if (result.success) {
        toast.success('Entri pajak manual berhasil dihapus');
        fetchManualTaxes();
        if (refetch) refetch();
      } else {
        toast.error(`Gagal menghapus: ${result.error}`);
      }
    } catch (err) {
      toast.error('Error menghapus data');
      console.error(err);
    } finally {
      setPendingDeleteId(null);
    }
  };

  // --- Calculation Logic (Copied & Adapted from BankReportList) ---

  // Merge manual taxes into data for display
  const mergedData = useMemo(() => {
    // Transform manual taxes to match transaction format
    const manualTxs = manualTaxes
      .filter((tax) => {
        // For saldo_awal_tahun (or legacy saldo_awal): only show in January OR in the month it was created
        // This is opening balance from previous year, carries forward
        if (tax.jenis_input === 'saldo_awal_tahun' || tax.jenis_input === 'saldo_awal') {
          if (isMonthView) {
            // Show saldo_awal_tahun in January OR if the entry's month matches selected month
            const txMonth = (tax.tanggal || '').substring(5, 7);
            return selectedMonth === '01' || txMonth === selectedMonth;
          }
          return true; // Show in "SEMUA" view
        }

        // For hutang_bulan: show in the month it was created only
        // This is forgotten payment in a specific month
        if (tax.jenis_input === 'hutang_bulan') {
          if (isMonthView && tax.tanggal) {
            const txMonth = tax.tanggal.substring(5, 7);
            return txMonth === selectedMonth;
          }
          return true;
        }

        // For regular transaksi: filter by month
        if (isMonthView && tax.tanggal) {
          const txMonth = tax.tanggal.substring(5, 7);
          return txMonth === selectedMonth;
        }
        return true;
      })
      .map((tax) => {
        let uraian = tax.keterangan || 'Entri Pajak Manual';
        // Handle both new and legacy jenis_input values
        if (tax.jenis_input === 'saldo_awal_tahun' || tax.jenis_input === 'saldo_awal') {
          uraian = `Saldo Awal ${tax.jenis_pajak} (${tax.keterangan || 'Hutang Tahun Lalu'})`;
        } else if (tax.jenis_input === 'hutang_bulan') {
          uraian = `Hutang ${tax.jenis_pajak} (${tax.keterangan || 'Lupa Bayar'})`;
        }
        return {
          id_kas_umum: tax.id,
          no_bukti: tax.no_bukti || 'MANUAL',
          tanggal_transaksi: tax.tanggal || tax.created_at?.split('T')[0],
          uraian,
          nominal: tax.nominal || 0,
          id_ref_bku: tax.position === 'pungutan' ? 10 : 11,
          is_manual: true,
          jenis_pajak: tax.jenis_pajak,
          manual_type: tax.jenis_input,
        };
      });

    return [...data, ...manualTxs];
  }, [data, manualTaxes, isMonthView, selectedMonth]);

  // 1. Calculate Opening Balance (from system stats + manual saldo_awal from previous months)
  let openingBalance = 0;
  if (isMonthView && stats?.chart) {
    const monthIndex = MONTHS.findIndex((m) => m.id === selectedMonth);
    if (monthIndex > 0) {
      openingBalance = stats.chart[monthIndex - 1].saldo_pajak || 0;
    }
  }

  // Add saldo_awal entries from BEFORE selected month to openingBalance
  // (This ensures saldo carries over to subsequent months)
  if (isMonthView && selectedMonth !== '01') {
    const manualCarryOver = manualTaxes
      .filter((tax) => {
        // Only saldo_awal_tahun (or legacy saldo_awal) carries over to subsequent months
        if (tax.jenis_input !== 'saldo_awal_tahun' && tax.jenis_input !== 'saldo_awal')
          return false;
        const txMonth = (tax.tanggal || '').substring(5, 7);
        // Include if entry month is BEFORE selected month
        return txMonth < selectedMonth;
      })
      .reduce((acc, tax) => {
        const amount = tax.nominal || 0;
        return acc + (tax.position === 'pungutan' ? amount : -amount);
      }, 0);
    openingBalance += manualCarryOver;
  }

  // Manual opening balance removed - not used

  // 2. Sort Data (saldo_awal entries first, then by date)
  const sortedData = isMonthView
    ? [...mergedData].sort((a, b) => {
        // Saldo_awal entries should come first
        if ((a.manual_type === 'saldo_awal' || a.manual_type === 'saldo_awal_tahun') && b.manual_type !== 'saldo_awal' && b.manual_type !== 'saldo_awal_tahun') return -1;
        if ((b.manual_type === 'saldo_awal' || b.manual_type === 'saldo_awal_tahun') && a.manual_type !== 'saldo_awal' && a.manual_type !== 'saldo_awal_tahun') return 1;

        const dateA = new Date(a.tanggal_transaksi);
        const dateB = new Date(b.tanggal_transaksi);
        return dateA - dateB;
      })
    : mergedData;

  // 3. Running Balance
  const calculatedBalances = useMemo(() => {
    let rb = openingBalance;
    return sortedData.map((tx) => {
      if (tx.id_ref_bku === 10) {
        rb += tx.nominal;
      } else if (tx.id_ref_bku === 11) {
        rb -= tx.nominal;
      } else {
        if ([11, 26, 28].includes(tx.id_ref_bku)) {
          rb -= tx.nominal;
        } else {
          rb += tx.nominal;
        }
      }
      return rb;
    });
  }, [sortedData, openingBalance]);

  // 4. Totals
  const totalPenerimaan =
    sortedData.reduce((acc, tx) => acc + (tx.id_ref_bku === 10 ? tx.nominal : 0), 0) +
    (isMonthView && selectedMonth !== '01' ? openingBalance : 0);
  const totalPengeluaran = sortedData.reduce(
    (acc, tx) => acc + (tx.id_ref_bku === 11 ? tx.nominal : 0),
    0
  );

  // Stats for Summary
  const calculatedSaldo =
    calculatedBalances.length > 0
      ? calculatedBalances[calculatedBalances.length - 1]
      : openingBalance; // Final balance

  const displayStats = {
    saldo: calculatedSaldo,
    penerimaan: totalPenerimaan,
    pengeluaran: totalPengeluaran,
  };

  const handleExport = async (exportType = 'single_xlsx') => {
    setIsExporting(true);
    try {
      const [scope, formatType] = exportType.split('_');
      const format = formatType === 'pdf' ? 'pdf' : 'excel';
      const exportScope = scope === 'bulk' ? 'bulk' : 'single';

      // For single export: pass pre-calculated data including manual taxes
      let exportTransactions = [];
      if (exportScope === 'single') {
        sortedData.forEach((tx, idx) => {
          exportTransactions.push({
            tanggal_transaksi: tx.tanggal_transaksi,
            no_bukti: tx.no_bukti || '',
            kode_kegiatan: tx.activity_code || tx.kode_kegiatan || '',
            kode_rekening: tx.kode_rekening || '',
            uraian: tx.uraian,
            // Raw fields needed by export handler (getTaxComponentsForExport)
            nominal: tx.nominal || 0,
            signed_amount: tx.signed_amount || 0,
            id_ref_bku: tx.id_ref_bku,
            is_ppn: tx.is_ppn || 0,
            is_pph_21: tx.is_pph_21 || 0,
            is_pph_23: tx.is_pph_23 || 0,
            is_pph_4: tx.is_pph_4 || 0,
            is_sspd: tx.is_sspd || 0,
            is_siplah: tx.is_siplah || 0,
            // Pre-calculated values for non-PAJAK fallback
            penerimaan: tx.id_ref_bku === 10 ? tx.nominal : 0,
            pengeluaran: tx.id_ref_bku === 11 ? tx.nominal : 0,
            saldo_berjalan: calculatedBalances[idx],
            // Manual tax fields
            is_manual: tx.is_manual || false,
            jenis_pajak: tx.jenis_pajak || '',
          });
        });
      }

      if (window.arkas && window.arkas.exportBku) {
        const result = await window.arkas.exportBku(exportTransactions, {
          year,
          fundSource,
          month: selectedMonth,
          paymentType: 'PAJAK',
          reportType: 'PAJAK',
          scope: exportScope,
          format: format,
          tablePenerimaan: totalPenerimaan,
          tablePengeluaran: totalPengeluaran,
          calculatedSaldo: calculatedSaldo,
          stats: displayStats,
        });
        if (result.success) {
          toast.success('Export berhasil: ' + result.filePath);
        } else if (result.canceled) {
          toast.info('Export dibatalkan');
        } else {
          toast.error('Export gagal: ' + result.error);
        }
      }
    } catch (error) {
      toast.error('Gagal melakukan export');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <ToastContainer />

      {/* Page Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-purple-200">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              PENATAUSAHAAN
            </span>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">BUKU PEMBANTU PAJAK</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Manual Tax Entry Button */}
          <button
            onClick={() => setShowManualTaxModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium text-sm hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
          >
            <Plus size={16} />
            Input Pajak Manual
          </button>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-600 uppercase tracking-wide">
            TA {year}
          </span>
          {isMonthView && (
            <span className="text-sm font-medium text-slate-500">
              Bulan {MONTHS.find((m) => m.id === selectedMonth)?.name}
            </span>
          )}
        </div>
      </div>

      {/* Manual Tax Entries Preview (if any) */}
      {manualTaxes.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200">
          <h3 className="text-sm font-bold text-amber-800 mb-2">
            📝 Entri Pajak Manual ({manualTaxes.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {manualTaxes.slice(0, 5).map((tax) => (
              <div
                key={tax.id}
                className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-amber-200 text-xs"
              >
                <span
                  className={`font-bold ${tax.position === 'pungutan' ? 'text-emerald-600' : 'text-red-600'}`}
                >
                  {tax.position === 'pungutan' ? '+' : '-'}
                  {formatRupiah(tax.nominal)}
                </span>
                <span className="text-slate-600 truncate max-w-[150px]">{tax.keterangan}</span>
                {pendingDeleteId === tax.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDeleteManualTax(tax.id)}
                      className="px-1.5 py-0.5 bg-red-500 text-white rounded text-[10px] font-bold hover:bg-red-600"
                    >
                      Ya
                    </button>
                    <button
                      onClick={cancelDelete}
                      className="px-1.5 py-0.5 bg-slate-300 text-slate-700 rounded text-[10px] font-bold hover:bg-slate-400"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => confirmDeleteManualTax(tax.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
            {manualTaxes.length > 5 && (
              <span className="text-xs text-amber-600 self-center">
                +{manualTaxes.length - 5} lainnya
              </span>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <TransactionSummary
        stats={displayStats} // Use locally calculated stats
        loading={loading}
        title="Ringkasan Pajak"
        isCashOnly={true} // Simplify view
        tablePenerimaan={totalPenerimaan}
        tablePengeluaran={totalPengeluaran}
        tableSaldo={calculatedSaldo}
        selectedMonth={selectedMonth}
      />

      {/* Filters & Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <TransactionFilters
          year={year}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          search={search}
          setSearch={setSearchTerm} // Use setSearchTerm for debounce input
          showFilterMenu={showFilterMenu}
          setShowFilterMenu={setShowFilterMenu}
          selectedFilters={selectedFilters}
          setSelectedFilters={setSelectedFilters}
          onResetFilters={() => setSelectedFilters([])}
          onExport={handleExport}
          isExporting={isExporting}
        />

        {/* Transaction Table */}
        <TaxTransactionTable
          data={sortedData}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          year={year}
          selectedMonth={selectedMonth}
          openingBalance={openingBalance}
          calculatedBalances={calculatedBalances}
          calculatedSaldo={calculatedSaldo}
          totalPenerimaan={totalPenerimaan}
          totalPengeluaran={totalPengeluaran}
          hasExistingOpeningBalance={false}
          stats={displayStats}
          reportType="PAJAK"
          onDeleteManualTax={handleDeleteManualTax}
        />
      </div>

      {/* Manual Tax Input Modal - ISOLATED */}
      <ManualTaxModal
        isOpen={showManualTaxModal}
        onClose={() => setShowManualTaxModal(false)}
        year={year}
        onSave={handleManualTaxSaved}
      />
    </div>
  );
}
