import React, { useState } from 'react';

import { useArkasData } from './hooks/useArkasData';
import { useFilter } from './context/FilterContext';
import MainLayout from './components/layout/MainLayout';
import SchoolInfoCard from './components/dashboard/SchoolInfoCard';

// V3 Enterprise Dashboard Components
import TopCards from './components/dashboard/v3/TopCards';
import MasterProgress from './components/dashboard/v3/MasterProgress';
import KategoriBelanja from './components/dashboard/v3/KategoriBelanja';
import PergerakanKasBulanan from './components/dashboard/v3/PergerakanKasBulanan';
import StrategicSpending from './components/dashboard/v3/StrategicSpending';
import RiwayatTransaksi from './components/dashboard/v3/RiwayatTransaksi';
import RingkasanSumberDana from './components/dashboard/v3/RingkasanSumberDana';
import RevenueChart from './components/dashboard/v2/RevenueChart';

// Legacy / Other Pages
import TransactionList from './components/transactions/TransactionList';
import CashReportList from './components/transactions/CashReportList';
import BankReportList from './components/transactions/BankReportList';
import TaxReportList from './components/transactions/TaxReportList';
import KertasKerja from './pages/KertasKerja';
import RealisasiBelanja from './pages/RealisasiBelanja';
import BAReconciliation from './pages/BAReconciliation';
import BankReconciliation from './pages/BankReconciliation';
import CetakSPTJM from './pages/CetakSPTJM';
import LaporanK7 from './pages/LaporanK7';
import RegisterKas from './pages/RegisterKas';
import NotaGroupManager from './pages/NotaGroupManager';

import Pengaturan from './pages/Pengaturan';
import BackupRestore from './pages/BackupRestore';
import About from './pages/About';
import SplashScreen from './components/SplashScreen';
import { Hash, BookOpen } from 'lucide-react';

function App() {
  const { year, fundSource } = useFilter();
  const { dbStatus, school, stats, availableSources, availableYears } = useArkasData();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Safe title generation
  const chartTitle = React.useMemo(() => {
    if (!fundSource) return 'Arus Kas';
    if (fundSource === 'SEMUA' || fundSource === 'all') return 'Arus Kas Gabungan';

    if (!availableSources || !Array.isArray(availableSources)) {
      return `Arus Kas ${fundSource}`;
    }

    const source = availableSources.find((s) => s.id === fundSource);
    return `Arus Kas ${source?.nama || fundSource}`;
  }, [fundSource, availableSources]);

  if (isLoading) {
    return <SplashScreen onComplete={() => setIsLoading(false)} />;
  }

  return (
    <MainLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      dbStatus={dbStatus}
      availableSources={availableSources}
      availableYears={availableYears}
    >
      {/* DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="h-full flex flex-col gap-5 pb-4 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-y-auto custom-scrollbar pr-2">
          {/* IDENTITAS SEKOLAH */}
          <div className="flex-shrink-0">
            <SchoolInfoCard school={school} selectedYear={year} selectedFundSource={fundSource} />
          </div>

          {/* ROW 1: TOP SUMMARY CARDS (4 PILAR) */}
          <div className="flex-shrink-0">
            <TopCards stats={stats} />
          </div>

          {/* ROW 2: MASTER PROGRESS BAR */}
          <div className="flex-shrink-0">
            <MasterProgress stats={stats} />
          </div>

          {/* ROW 3: KATEGORI BELANJA */}
          <div className="flex-shrink-0 mt-1">
            <KategoriBelanja categories={stats?.belanja_kategori} />
          </div>

          {/* === SECTION: ANALISIS KEUANGAN === */}
          <div className="flex-shrink-0 mt-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">
              Analisis Keuangan
            </h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {/* Kiri: Grafik Arus Kas */}
              <div className="min-h-[350px]">
                <RevenueChart
                  data={stats?.chart || []}
                  year={year}
                  title={chartTitle}
                  onNavigateToBku={(month) => setActiveTab('transactions')}
                />
              </div>

              {/* Kanan: Pergerakan Kas Bulanan */}
              <div className="h-full min-h-[350px]">
                <PergerakanKasBulanan data={stats?.kas_bulanan} />
              </div>
            </div>
          </div>

          {/* Ringkasan per Sumber Dana */}
          <div className="flex-shrink-0">
            <RingkasanSumberDana data={stats?.ringkasan_sumber_dana} />
          </div>

          {/* === SECTION: DETAIL BELANJA === */}
          <div className="flex-shrink-0 mt-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">
              Detail Belanja
            </h2>
            <StrategicSpending kegiatan={stats?.belanja_kegiatan} top5={stats?.top_5_belanja} />
          </div>

          {/* === SECTION: RIWAYAT TRANSAKSI === */}
          <div className="flex-shrink-0 mt-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">
              Riwayat Transaksi
            </h2>
            <RiwayatTransaksi
              penerimaanDana={stats?.penerimaan_dana}
              pengeluaranTerbaru={stats?.pengeluaran_terbaru}
            />
          </div>

          {/* === FOOTER INFO === */}
          <div className="flex-shrink-0 mt-2 mb-4">
            <div className="bg-slate-50 rounded-2xl border border-slate-200/60 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L5.757 10H4v2h1.757z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs font-medium">
                  Data dari database ARKAS lokal (read-only)
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Hash size={14} />
                  <span className="text-xs font-semibold">
                    {stats?.item_rapbs_count || 0} RAPBS
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <BookOpen size={14} />
                  <span className="text-xs font-semibold">
                    {stats?.kegiatan_count || 0} Kegiatan
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OTHER PAGES */}
      {activeTab === 'kertas-kerja' && <KertasKerja />}
      {activeTab === 'realisasi-belanja' && <RealisasiBelanja />}
      {activeTab === 'transactions' && <TransactionList stats={stats} />}
      {activeTab === 'tax-report' && <TaxReportList stats={stats} />}
      {activeTab === 'cash-report' && <CashReportList stats={stats} />}
      {activeTab === 'bank-report' && <BankReportList stats={stats} />}
      {activeTab === 'reconciliation' && <BAReconciliation />}
      {activeTab === 'bank-reconciliation' && <BankReconciliation />}
      {activeTab === 'sptjm' && <CetakSPTJM />}
      {activeTab === 'k7-report' && <LaporanK7 />}

      {activeTab === 'register-kas' && <RegisterKas />}
      {activeTab === 'nota-groups' && <NotaGroupManager />}

      {activeTab === 'settings' && <Pengaturan />}
      {activeTab === 'backup-restore' && <BackupRestore />}
      {activeTab === 'about' && <About />}
    </MainLayout>
  );
}

export default App;
