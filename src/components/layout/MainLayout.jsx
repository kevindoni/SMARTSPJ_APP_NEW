import Sidebar from './Sidebar';
import Header from './Header';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Main Layout Component
 * Standardizes the layout structure across the application (Sidebar + Header + Content)
 */
export default function MainLayout({
  children,
  activeTab,
  setActiveTab,
  dbStatus,
  availableSources,
  availableYears,
}) {
  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* 1. SIDEBAR */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col ml-64 overflow-hidden relative">
        {/* Header (Sticky Top) */}
        <div className="p-6 pb-0 z-10">
          <Header
            dbStatus={dbStatus}
            availableSources={availableSources}
            availableYears={availableYears}
          />
        </div>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {/* Database Error Banner */}
          {!dbStatus.loading && !dbStatus.success && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm leading-5 font-medium text-red-800">
                    Koneksi Database Gagal
                  </h3>
                  <div className="mt-2 text-sm leading-5 text-red-700">
                    <p>
                      {dbStatus.message ||
                        'Gagal terhubung ke database. Pastikan Arkas terinstall atau file arkas.db tersedia.'}
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="-mx-2 -my-1.5 flex">
                      <button
                        onClick={() => window.location.reload()}
                        className="px-2 py-1.5 rounded-md text-xs leading-5 font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:bg-red-100 transition ease-in-out duration-150"
                      >
                        Reload Aplikasi
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {children}
        </main>
      </div>

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
}
