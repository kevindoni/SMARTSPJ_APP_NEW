/**
 * TransactionFilters.jsx
 * Header, Search Bar, and Filter Menu components
 */
import { useState } from 'react';
import { Search, ChevronDown, Check, Download } from 'lucide-react';
import { MONTHS, FILTER_OPTIONS } from '../../utils/transactionHelpers';

export default function TransactionFilters({
  year,
  selectedMonth,
  setSelectedMonth,
  search,
  setSearch,
  showFilterMenu,
  setShowFilterMenu,
  selectedFilters,
  setSelectedFilters,
  onResetFilters,
  onExport,
  isExporting,
}) {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const isAllMonths = selectedMonth === 'SEMUA';
  const monthName = !isAllMonths ? MONTHS.find((m) => m.id === selectedMonth)?.name : '';

  const toggleFilter = (id) => {
    setSelectedFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const activeFilterCount = selectedFilters.length;

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-2 mb-2 rounded-xl">
      {/* Left: Filter & Month */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        {/* Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors shadow-sm ${
              activeFilterCount > 0
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>Filter {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
            <ChevronDown
              size={14}
              className={`transition-transform text-slate-400 ${showFilterMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {showFilterMenu && (
            <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-3 pb-2 border-b border-slate-50 mb-1 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase">Tipe Transaksi</span>
                {activeFilterCount > 0 && (
                  <button
                    onClick={onResetFilters}
                    className="text-[10px] text-red-500 hover:text-red-600 font-medium"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto p-1">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => toggleFilter(opt.id)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-between group transition-colors"
                  >
                    <span
                      className={`text-xs ${selectedFilters.includes(opt.id) ? 'text-blue-600 font-medium' : 'text-slate-600'}`}
                    >
                      {opt.label}
                    </span>
                    {selectedFilters.includes(opt.id) && (
                      <Check size={14} className="text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1"></div>

        {/* Month Selector */}
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-sm min-w-[150px]"
          >
            <option value="SEMUA">Semua Bulan</option>
            {MONTHS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-3 text-slate-400 pointer-events-none"
          />
        </div>
      </div>

      {/* Right: Search + Export */}
      <div className="flex items-center gap-2 w-full md:w-auto">
        <div className="relative flex-1 md:w-72">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari uraian, kode rekening..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm placeholder:text-slate-400"
          />
        </div>

        {/* Export Menu */}
        {onExport && (
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              disabled={isExporting}
              className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition-all shadow-sm ${isExportMenuOpen ? 'bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700'} disabled:bg-emerald-300`}
            >
              <Download size={16} />
              <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export'}</span>
              <ChevronDown
                size={14}
                className={`transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isExportMenuOpen && !isExporting && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsExportMenuOpen(false)}
                ></div>
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden text-sm animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                  <div className="p-1">
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Halaman Ini
                    </div>
                    <button
                      onClick={() => {
                        onExport('single_xlsx');
                        setIsExportMenuOpen(false);
                      }}
                      disabled={selectedMonth === 'SEMUA'}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="w-5 h-5 flex items-center justify-center bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">
                        X
                      </span>
                      Excel (Bulan Ini)
                    </button>
                    <button
                      onClick={() => {
                        onExport('single_pdf');
                        setIsExportMenuOpen(false);
                      }}
                      disabled={selectedMonth === 'SEMUA'}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="w-5 h-5 flex items-center justify-center bg-red-100 text-red-700 rounded text-[10px] font-bold">
                        P
                      </span>
                      PDF (Bulan Ini)
                    </button>
                  </div>
                  <div className="border-t border-slate-100 p-1 bg-slate-50/50">
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Laporan Tahunan
                    </div>
                    <button
                      onClick={() => {
                        onExport('bulk_xlsx');
                        setIsExportMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-white rounded-lg text-slate-700 flex items-center gap-2"
                    >
                      <span className="w-5 h-5 flex items-center justify-center bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">
                        X
                      </span>
                      Excel (Semua Bulan)
                    </button>
                    <button
                      onClick={() => {
                        onExport('bulk_pdf');
                        setIsExportMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-white rounded-lg text-slate-700 flex items-center gap-2"
                    >
                      <span className="w-5 h-5 flex items-center justify-center bg-red-100 text-red-700 rounded text-[10px] font-bold">
                        P
                      </span>
                      PDF (Semua Bulan)
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
