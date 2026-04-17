import { useState, useMemo } from 'react';
import { useFilter } from '../../context/FilterContext';
import { MONTHS, isPenerimaan } from '../../utils/transactionHelpers';
import TransactionSummary from './TransactionSummary';
import TransactionFilters from './TransactionFilters';
import TransactionTable from './TransactionTable';
import useTransactions from './hooks/useTransactions';
import { FileText } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function TransactionList({ stats }) {
  const { year, fundSource } = useFilter();
  const [selectedMonth, setSelectedMonth] = useState('01'); // Default January
  const [selectedFilters, setSelectedFilters] = useState([]); // Array of selected filter IDs
  const [search, setSearch] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data, loading, hasMore, handleLoadMore } = useTransactions({
    year,
    fundSource,
    search,
    selectedMonth,
    selectedFilters,
  });

  const isMonthView = selectedMonth !== 'SEMUA';
  let openingBalance = 0;
  if (isMonthView && stats?.chart) {
    const monthIndex = MONTHS.findIndex((m) => m.id === selectedMonth);
    if (monthIndex > 0) {
      openingBalance = stats.chart[monthIndex - 1].saldo_akhir;
    } else {
      if (monthIndex === 0) openingBalance = 0;
    }
  }

  const getDisplayStats = () => {
    if (selectedMonth === 'SEMUA') {
      return {
        saldo: stats?.saldo || 0,
        saldo_bank: stats?.saldo_bank || 0,
        saldo_tunai: stats?.saldo_tunai || 0,
        penerimaan: stats?.penerimaan || 0,
        pengeluaran: stats?.realisasi || 0,
      };
    }

    const monthData = stats?.chart?.find((d) => d.bulan === selectedMonth);

    return {
      saldo: monthData?.saldo_akhir || 0,
      saldo_tunai: monthData?.saldo_tunai || 0,
      saldo_bank: monthData?.saldo_bank || 0,
      penerimaan: (monthData?.penerimaan || 0) + openingBalance,
      pengeluaran: monthData?.pengeluaran || 0,
    };
  };

  const displayStats = getDisplayStats();

  const sortedData = isMonthView
    ? [...data].sort((a, b) => {
        // 1. Sort by Date
        const dateA = new Date(a.tanggal_transaksi);
        const dateB = new Date(b.tanggal_transaksi);
        return dateA - dateB;
      })
    : data;

  // For SEMUA view: remove duplicate monthly saldo carry-forward entries.
  // Each month starts with "Saldo Bank Bulan X" / "Saldo Tunai Bulan X" entries.
  // Only the FIRST month entries are the real opening balance.
  // Subsequent months are carry-forward duplicates that cause double-counting.
  const displayData = useMemo(() => {
    if (isMonthView) return sortedData;

    let firstSaldoDate = null;
    return sortedData.filter((tx) => {
      const desc = (tx.uraian || '').toLowerCase();
      const isMonthlySaldo = desc.startsWith('saldo bank bulan') || desc.startsWith('saldo tunai bulan');

      if (!isMonthlySaldo) return true;

      // Keep only the first month saldo entries (initial opening balance)
      const txDate = (tx.normalized_date || tx.tanggal_transaksi || '').substring(0, 10);
      if (firstSaldoDate === null) {
        firstSaldoDate = txDate;
      }
      return txDate === firstSaldoDate;
    });
  }, [sortedData, isMonthView]);

  const hasExistingOpeningBalance =
    isMonthView &&
    displayData.some((tx) => {
      const isFirstDate =
        tx.tanggal_transaksi.includes(`-${selectedMonth}-01`) ||
        tx.tanggal_transaksi.startsWith(`${year}-${selectedMonth}-01`);
      const isSaldoKw =
        (tx.uraian || '').toLowerCase().includes('saldo') ||
        (tx.uraian || '').toLowerCase().includes('penerimaan pindahan');
      return isFirstDate && isSaldoKw;
    });

  const calculatedBalances = useMemo(() => {
    let rb = hasExistingOpeningBalance ? 0 : openingBalance;
    return displayData.map((tx) => {
      const isDebit = isPenerimaan(tx);
      if (isDebit) { rb += tx.nominal; } else { rb -= tx.nominal; }
      return rb;
    });
  }, [displayData, hasExistingOpeningBalance, openingBalance]);

  const tablePenerimaan =
    displayData.reduce((acc, tx) => acc + (isPenerimaan(tx) ? tx.nominal : 0), 0) +
    (isMonthView && selectedMonth !== '01' && !hasExistingOpeningBalance ? openingBalance : 0);
  const tablePengeluaran = displayData.reduce(
    (acc, tx) => acc + (!isPenerimaan(tx) ? tx.nominal : 0),
    0
  );
  const tableSaldo =
    calculatedBalances.length > 0
      ? calculatedBalances[calculatedBalances.length - 1]
      : displayStats.saldo; // Use FINAL calculated balance

  // Export handler
  const handleExport = async (mode = 'single_xlsx') => {
    setIsExporting(true);
    try {
      let scope = 'single';
      let format = 'xlsx';

      if (mode === 'bulk_xlsx') {
        scope = 'bulk';
        format = 'xlsx';
      }
      if (mode === 'single_pdf') {
        scope = 'single';
        format = 'pdf';
      }
      if (mode === 'bulk_pdf') {
        scope = 'bulk';
        format = 'pdf';
      }

      // Prepare transactions for single mode (frontend data)
      // Use EXACT SAME logic as display (including opening balance row if shown in table)
      let exportData = [];
      if (scope === 'single') {
        // Add Opening Balance row if shown in display (same condition as TransactionTable.jsx)
        if (
          isMonthView &&
          selectedMonth !== '01' &&
          !hasExistingOpeningBalance &&
          openingBalance > 0
        ) {
          exportData.push({
            tanggal_transaksi: `${year}-${selectedMonth}-01`,
            no_bukti: '',
            kode_kegiatan: '',
            kode_rekening: '',
            uraian: 'Saldo Bulan Lalu',
            penerimaan: openingBalance,
            pengeluaran: 0,
            saldo_berjalan: openingBalance,
          });
        }

        // Use the SAME calculated balances as display (already computed correctly)
        displayData.forEach((tx, idx) => {
          exportData.push({
            tanggal_transaksi: tx.tanggal_transaksi,
            no_bukti: tx.no_bukti || '',
            kode_kegiatan: tx.activity_code || tx.kode_kegiatan || '',
            kode_rekening: tx.kode_rekening || '',
            uraian: tx.uraian,
            penerimaan: isPenerimaan(tx) ? tx.nominal : 0,
            pengeluaran: !isPenerimaan(tx) ? tx.nominal : 0,
            saldo_berjalan: calculatedBalances[idx],
          });
        });
      }

      const result = await window.arkas.exportBku(exportData, {
        year,
        month: selectedMonth === 'SEMUA' ? 1 : selectedMonth,
        fundSource,
        stats: displayStats,
        // Send pre-calculated values from display (these are already correct)
        tablePenerimaan: tablePenerimaan,
        tablePengeluaran: tablePengeluaran,
        calculatedSaldo: tableSaldo,
        scope,
        format,
      });

      if (result.success) {
        toast.success(`BKU berhasil di-export ke: ${result.filePath}`, {
          position: 'top-right',
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else if (!result.canceled) {
        toast.error('Gagal export BKU: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Gagal export: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Toast Container */}
      <ToastContainer />

      {/* Page Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <FileText size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              PENATAUSAHAAN
            </span>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">BUKU KAS UMUM</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 uppercase tracking-wide">
            TA {year}
          </span>
          {isMonthView && (
            <span className="text-sm font-medium text-slate-500">
              Bulan {MONTHS.find((m) => m.id === selectedMonth)?.name}
            </span>
          )}
        </div>
      </div>

      <TransactionSummary
        tableSaldo={tableSaldo}
        tablePenerimaan={tablePenerimaan}
        tablePengeluaran={tablePengeluaran}
        selectedMonth={selectedMonth}
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        {/* Header, Search & Filter */}
        <TransactionFilters
          year={year}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          search={search}
          setSearch={setSearch}
          showFilterMenu={showFilterMenu}
          setShowFilterMenu={setShowFilterMenu}
          selectedFilters={selectedFilters}
          setSelectedFilters={setSelectedFilters}
          onResetFilters={() => setSelectedFilters([])}
          onExport={handleExport}
          isExporting={isExporting}
        />

        {/* Table Content */}
        <TransactionTable
          data={displayData}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          year={year}
          selectedMonth={selectedMonth}
          openingBalance={openingBalance}
          calculatedBalances={calculatedBalances}
          hasExistingOpeningBalance={hasExistingOpeningBalance}
          stats={displayStats}
          calculatedSaldo={tableSaldo}
          totalPenerimaan={tablePenerimaan}
          totalPengeluaran={tablePengeluaran}
        />
      </div>
    </div>
  );
}
