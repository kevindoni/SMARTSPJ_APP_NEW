import Sidebar from './Sidebar';
import Header from './Header';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const isElectron = typeof window !== 'undefined' && window.arkas;

export default function MainLayout({
  children,
  activeTab,
  setActiveTab,
  dbStatus,
  availableSources,
  availableYears,
}) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col ml-64 overflow-hidden relative">
        {/* Header */}
        <div className="p-5 pb-0 z-10">
          <Header
            dbStatus={dbStatus}
            availableSources={availableSources}
            availableYears={availableYears}
          />
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5 scroll-smooth">
          {/* Error Banner */}
          {!isElectron && (
            <div className="bg-amber-50 border border-amber-200 p-4 mb-5 rounded-xl shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-amber-800">
                    Mode Browser (Tanpa Electron)
                  </h3>
                  <p className="text-xs text-amber-600 mt-1">
                    Aplikasi berjalan di browser tanpa akses database ARKAS. Jalankan melalui
                    Electron untuk data lengkap.
                  </p>
                </div>
              </div>
            </div>
          )}
          {isElectron && !dbStatus.loading && !dbStatus.success && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-5 rounded-r-xl shadow-sm">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-red-400 shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-red-800">Koneksi Database Gagal</h3>
                  <p className="mt-1 text-xs text-red-600">
                    {dbStatus.message || 'Gagal terhubung ke database ARKAS.'}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 px-3 py-1 rounded-md text-xs font-medium text-red-800 bg-red-100 hover:bg-red-200 transition-colors"
                  >
                    Reload Aplikasi
                  </button>
                </div>
              </div>
            </div>
          )}

          {children}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
