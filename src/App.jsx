import React, { useState } from 'react';
import { LicenseProvider, useLicense } from './context/LicenseContext';
import { useArkasData } from './hooks/useArkasData';
import ErrorBoundary from './components/ErrorBoundary';
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
import LicenseScreen from './components/license/LicenseScreen';

function AppContent() {
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
      {activeTab === 'dashboard' && <ErrorBoundary><DashboardRedesigned /></ErrorBoundary>}
      {activeTab === 'kertas-kerja' && <ErrorBoundary><KertasKerja /></ErrorBoundary>}
      {activeTab === 'realisasi-belanja' && <ErrorBoundary><RealisasiBelanja /></ErrorBoundary>}
      {activeTab === 'transactions' && <ErrorBoundary><TransactionList stats={stats} /></ErrorBoundary>}
      {activeTab === 'tax-report' && <ErrorBoundary><TaxReportList stats={stats} /></ErrorBoundary>}
      {activeTab === 'cash-report' && <ErrorBoundary><CashReportList stats={stats} /></ErrorBoundary>}
      {activeTab === 'bank-report' && <ErrorBoundary><BankReportList stats={stats} /></ErrorBoundary>}
      {activeTab === 'reconciliation' && <ErrorBoundary><BAReconciliation /></ErrorBoundary>}
      {activeTab === 'bank-reconciliation' && <ErrorBoundary><BankReconciliation /></ErrorBoundary>}
      {activeTab === 'sptjm' && <ErrorBoundary><CetakSPTJM /></ErrorBoundary>}
      {activeTab === 'k7-report' && <ErrorBoundary><LaporanK7 /></ErrorBoundary>}
      {activeTab === 'register-kas' && <ErrorBoundary><RegisterKas /></ErrorBoundary>}
      {activeTab === 'nota-groups' && <ErrorBoundary><NotaGroupManager /></ErrorBoundary>}
      {activeTab === 'settings' && <ErrorBoundary><Pengaturan /></ErrorBoundary>}
      {activeTab === 'backup-restore' && <ErrorBoundary><BackupRestore /></ErrorBoundary>}
      {activeTab === 'about' && <ErrorBoundary><About /></ErrorBoundary>}
      {activeTab === 'license' && <ErrorBoundary><LicenseScreen /></ErrorBoundary>}
    </MainLayout>
  );
}

function App() {
  return (
    <LicenseProvider>
      <AppContent />
    </LicenseProvider>
  );
}

export default App;
