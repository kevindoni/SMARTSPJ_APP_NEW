import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Download,
  FileText,
  ChevronDown,
  Calendar,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '../../utils/exportKertasKerja';

export default function KertasKerjaToolbar({
  selectedFormat,
  setSelectedFormat,
  reportFormats,
  selectedMonth,
  setSelectedMonth,
  months,
  searchTerm,
  setSearchTerm,
  isMonthly,
  // NEW: Export props
  processedData,
  year,
  fundSource,
  schoolInfo,
  reportTitle,
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportExcel = () => {
    if (!processedData || processedData.length === 0) {
      toast.warning('Tidak ada data untuk di-export.');
      return;
    }
    exportToExcel(processedData, {
      year,
      fundSource,
      schoolInfo,
      reportTitle,
      selectedFormat,
      selectedMonth,
      months,
    });
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    if (!processedData || processedData.length === 0) {
      toast.warning('Tidak ada data untuk di-export ke PDF.');
      return;
    }
    exportToPDF(processedData, {
      year,
      fundSource,
      schoolInfo,
      reportTitle,
      selectedFormat,
      selectedMonth,
      months,
    });
    setShowExportMenu(false);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
      {/* Top Row: Title & Format Selection */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <FileText size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              PENGANGGARAN
            </span>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              {reportTitle || 'Kertas Kerja (RKAS)'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Format RKAS:
          </label>

          {/* Format Dropdown */}
          <div className="relative w-full md:w-80">
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            >
              {reportFormats.map((fmt, idx) => (
                <option key={idx} value={fmt}>
                  {fmt}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-2.5 text-slate-400 pointer-events-none"
              size={16}
            />
          </div>

          {/* Month Selection (Only visible if Monthly format) */}
          {isMonthly && (
            <div className="relative w-40 animate-in fade-in slide-in-from-left-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full appearance-none pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer shadow-sm"
              >
                {months.map((m, idx) => (
                  <option key={idx} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <Calendar
                className="absolute left-3 top-2.5 text-slate-500 pointer-events-none"
                size={14}
              />
              <ChevronDown
                className="absolute right-3 top-2.5 text-slate-400 pointer-events-none"
                size={16}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Search & Export */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center border-t border-slate-100 pt-4">
        <div className="w-full flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari Kegiatan / Barang..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Export Dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-100 transition shadow-sm whitespace-nowrap"
            >
              <Download size={16} />
              Cetak / Export
              <ChevronDown
                size={14}
                className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown Menu */}
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={handleExportPDF}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                >
                  <Printer size={16} className="text-red-500" />
                  <span>Cetak PDF</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <FileSpreadsheet size={16} className="text-green-600" />
                  <span>Export Excel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
