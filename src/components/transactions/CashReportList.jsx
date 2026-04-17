import { useState, useMemo } from 'react';
import { useFilter } from '../../context/FilterContext';
import { MONTHS } from '../../utils/transactionHelpers';
import TransactionSummary from './TransactionSummary';
import TransactionFilters from './TransactionFilters';
import TransactionTable from './TransactionTable';
import useTransactions from './hooks/useTransactions';
import { Wallet } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * isPenerimaanTunai - Custom helper for CASH BOOK perspective
 * Different from isPenerimaan (BKU) because the perspective is inverted:
 * - Tarik Tunai: BKU=expense (leaves bank), TUNAI=income (enters cash box)
 * - Setor Tunai: BKU=income (enters bank), TUNAI=expense (leaves cash box)
 * - BPU: Always expense in TUNAI (cash spent on purchases)
 */
const isPenerimaanTunai = (tx) => {
  const uraian = (tx.uraian || '').toLowerCase();
  const noBukti = (tx.no_bukti || '').toUpperCase();
  const idBku = tx.id_ref_bku;

  // Saldo entries
  if (uraian.includes('saldo')) return true;

  // PENERIMAAN TUNAI (Cash In):
  // - Tarik Tunai (id=3): cash withdrawal from bank INTO cash box
  if (idBku === 3 || uraian.includes('tarik tunai')) return true;

  // PENGELUARAN TUNAI (Cash Out):
  // - Setor Tunai (id=4): cash deposit TO bank FROM cash box
  if (idBku === 4 || uraian.includes('setor tunai')) return false;

  // - BPU: cash expenses (purchases with cash)
  if (noBukti.startsWith('BPU')) return false;

  // - Saldo Tunai checkpoints (id=9) - treated as neutral/income
  if (idBku === 9) return true;

  // Default: treat as income for other tunai transactions
  return true;
};

/**
 * CashReportList - Buku Pembantu Tunai
 * Similar to TransactionList (BKU Umum) but filtered for TUNAI transactions only
 * Uses isPenerimaanTunai for correct cash perspective
 */
export default function CashReportList({ stats }) {
  const { year, fundSource } = useFilter();
  const [selectedMonth, setSelectedMonth] = useState('01');
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [search, setSearch] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Use transactions hook with TUNAI payment type filter
  const { data, loading, hasMore, handleLoadMore } = useTransactions({
    year,
    fundSource,
    search,
    selectedMonth,
    selectedFilters,
    paymentType: 'TUNAI', // Filter for cash transactions only
  });

  const isMonthView = selectedMonth !== 'SEMUA';

  // Calculate opening balance for Tunai only
  let openingBalance = 0;
  if (isMonthView && stats?.chart) {
    const monthIndex = MONTHS.findIndex((m) => m.id === selectedMonth);
    if (monthIndex > 0) {
      // Use tunai-specific opening balance
      openingBalance = stats.chart[monthIndex - 1].saldo_tunai || 0;
    }
  }

  const sortedData = isMonthView
    ? [...data].sort((a, b) => {
        const dateA = new Date(a.tanggal_transaksi);
        const dateB = new Date(b.tanggal_transaksi);
        return dateA - dateB;
      })
    : data;

  // For SEMUA view: remove duplicate monthly saldo carry-forward entries.
  const displayData = useMemo(() => {
    if (isMonthView) return sortedData;

    let firstSaldoDate = null;
    return sortedData.filter((tx) => {
      const desc = (tx.uraian || '').toLowerCase();
      const isMonthlySaldo = desc.startsWith('saldo bank bulan') || desc.startsWith('saldo tunai bulan');

      if (!isMonthlySaldo) return true;

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
      const isDebit = isPenerimaanTunai(tx);
      if (isDebit) { rb += tx.nominal; } else { rb -= tx.nominal; }
      return rb;
    });
  }, [displayData, hasExistingOpeningBalance, openingBalance]);

  // Calculate totals for Tunai transactions using cash perspective
  const tablePenerimaan =
    displayData.reduce((acc, tx) => acc + (isPenerimaanTunai(tx) ? tx.nominal : 0), 0) +
    (isMonthView && selectedMonth !== '01' && !hasExistingOpeningBalance ? openingBalance : 0);
  const tablePengeluaran = displayData.reduce(
    (acc, tx) => acc + (!isPenerimaanTunai(tx) ? tx.nominal : 0),
    0
  );
  const tableSaldo =
    calculatedBalances.length > 0
      ? calculatedBalances[calculatedBalances.length - 1]
      : stats?.saldo_tunai || 0;

  // Display stats focused on Tunai
  const getDisplayStats = () => {
    if (selectedMonth === 'SEMUA') {
      return {
        saldo: stats?.saldo_tunai || 0,
        saldo_bank: 0,
        saldo_tunai: stats?.saldo_tunai || 0,
        penerimaan: tablePenerimaan,
        pengeluaran: tablePengeluaran,
      };
    }

    const monthData = stats?.chart?.find((d) => d.bulan === selectedMonth);
    return {
      saldo: monthData?.saldo_tunai || 0,
      saldo_tunai: monthData?.saldo_tunai || 0,
      saldo_bank: 0,
      penerimaan: tablePenerimaan,
      pengeluaran: tablePengeluaran,
    };
  };

  const displayStats = getDisplayStats();

  // Export handler for Tunai
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

      let exportData = [];
      if (scope === 'single') {
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
            uraian: 'Saldo Tunai Bulan Lalu',
            penerimaan: openingBalance,
            pengeluaran: 0,
            saldo_berjalan: openingBalance,
          });
        }

        displayData.forEach((tx, idx) => {
          exportData.push({
            tanggal_transaksi: tx.tanggal_transaksi,
            no_bukti: tx.no_bukti || '',
            kode_kegiatan: tx.activity_code || tx.kode_kegiatan || '',
            kode_rekening: tx.kode_rekening || '',
            uraian: tx.uraian,
            penerimaan: isPenerimaanTunai(tx) ? tx.nominal : 0,
            pengeluaran: !isPenerimaanTunai(tx) ? tx.nominal : 0,
            saldo_berjalan: calculatedBalances[idx],
          });
        });
      }

      const result = await window.arkas.exportBku(exportData, {
        year,
        month: selectedMonth === 'SEMUA' ? 1 : selectedMonth,
        fundSource,
        stats: displayStats,
        tablePenerimaan: tablePenerimaan,
        tablePengeluaran: tablePengeluaran,
        calculatedSaldo: tableSaldo,
        scope,
        format,
        reportType: 'TUNAI', // Mark as Tunai report
      });

      if (result.success) {
        toast.success(`Buku Pembantu Tunai berhasil di-export ke: ${result.filePath}`, {
          position: 'top-right',
          autoClose: 4000,
        });
      } else if (!result.canceled) {
        toast.error('Gagal export: ' + (result.error || 'Unknown error'));
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
      <ToastContainer />

      {/* Page Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Wallet size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              PENATAUSAHAAN
            </span>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">
              BUKU PEMBANTU KAS TUNAI
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 uppercase tracking-wide">
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
        isCashOnly={true} // Indicate this is cash-only view
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
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
          isPenerimaanFunc={isPenerimaanTunai} // Pass custom Tunai perspective
          reportType="TUNAI" // Pass report type for custom footer
        />
      </div>
    </div>
  );
}
