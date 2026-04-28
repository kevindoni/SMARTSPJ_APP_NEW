import React, { useState } from 'react';
import { useArkasData } from './hooks/useArkasData';
import MainLayout from './components/layout/MainLayout';
import DashboardRedesigned from './components/dashboard/DashboardRedesigned';
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

function App() {
  const { dbStatus, stats, availableSources, availableYears } = useArkasData();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

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
      {activeTab === 'dashboard' && <DashboardRedesigned />}
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