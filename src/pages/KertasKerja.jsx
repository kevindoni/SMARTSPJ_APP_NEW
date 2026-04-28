import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, FileText } from 'lucide-react';

// Custom Hooks
import { useKertasKerjaData } from '../hooks/useKertasKerjaData';

// Components
import KertasKerjaToolbar from '../components/KertasKerja/KertasKerjaToolbar';
import KertasKerjaFormalTableQuarterly from '../components/KertasKerja/KertasKerjaFormalTableQuarterly';
import KertasKerjaFormalTableAnnual from '../components/KertasKerja/KertasKerjaFormalTableAnnual';
import KertasKerjaFormalTable from '../components/KertasKerja/KertasKerjaFormalTable';
import KertasKerjaTable from '../components/KertasKerja/KertasKerjaTable';
import LembarKertasKerjaFormal from '../components/KertasKerja/LembarKertasKerjaFormal';

export default function KertasKerja() {
  // UI State
  const [selectedFormat, setSelectedFormat] = useState('Rincian RKAS (Tahunan)');
  const [selectedMonth, setSelectedMonth] = useState(1); // 1 = Januari
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolInfo, setSchoolInfo] = useState(null);

  useEffect(() => {
    if (window.arkas && window.arkas.getSchoolInfo) {
      window.arkas
        .getSchoolInfo()
        .then((info) => {
          if (info.success) {
            setSchoolInfo(info.data);
          }
        })
        .catch((err) => console.error('Failed to get school info:', err));
    }
  }, []);

  // Constants
  const reportFormats = [
    'Rincian RKAS (Tahunan)',
    'Rincian RKAS (Triwulan)',
    'Rincian RKAS (Bulanan)',
    'Lembar Kertas Kerja (Triwulan)',
  ];

  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  // Data Logic Hook
  const {
    data,
    processedData,
    loading,
    error,
    fetchData,
    isMonthly,
    isQuarterly,
    isLembar,
    year,
    fundSource,
  } = useKertasKerjaData(selectedFormat, selectedMonth, searchTerm);

  // Determine Report Title for Footer
  const getReportTitle = () => {
    if (selectedFormat.startsWith('Rincian RKAS')) return 'RKAS';
    if (selectedFormat.startsWith('Lembar Kertas Kerja')) return 'Lembar Kertas Kerja';
    return 'Kertas Kerja';
  };
  const reportTitle = getReportTitle();

  // --- RENDER LOGIC ---

  // 1. Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-96">
        <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Memuat Kertas Kerja...</p>
      </div>
    );
  }

  // 2. Select Fund Source Hint
  if (fundSource === 'SEMUA') {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <FileText size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              PENGANGGARAN
            </span>
            <h2 className="text-lg font-bold text-slate-800">Kertas Kerja (RKAS)</h2>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <AlertCircle size={48} className="text-amber-500 mb-4" />
          <h3 className="text-amber-800 font-bold text-xl mb-2">Pilih Sumber Dana Spesifik</h3>
          <p className="text-amber-700 max-w-md">
            Untuk melihat rincian Kertas Kerja yang rapi dan terstruktur, mohon{' '}
            <strong>pilih salah satu Sumber Dana</strong> (misal: BOS Reguler) pada menu filter di
            pojok kanan atas.
          </p>
        </div>
      </div>
    );
  }

  // 3. Error State
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
        <AlertCircle size={48} className="text-red-500 mb-2" />
        <h3 className="text-red-800 font-bold text-lg">Gagal Memuat Data</h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  // 4. View: Lembar Kertas Kerja (Summary)
  if (isLembar) {
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <KertasKerjaToolbar
          selectedFormat={selectedFormat}
          setSelectedFormat={setSelectedFormat}
          reportFormats={reportFormats}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          months={months}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isMonthly={isMonthly}
          processedData={processedData}
          year={year}
          fundSource={fundSource}
          schoolInfo={schoolInfo}
          reportTitle={reportTitle}
        />
        <LembarKertasKerjaFormal
          processedData={processedData}
          fundSource={fundSource}
          year={year}
          schoolInfo={schoolInfo}
        />
      </div>
    );
  }

  // 5. View: Empty Data (No Data at all from DB)
  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
        <FileText size={48} className="text-slate-300 mb-2" />
        <h3 className="text-slate-800 font-bold text-lg">Tidak Ada Data</h3>
        <p className="text-slate-500">
          Belum ada rencana anggaran untuk Tahun {year} ({fundSource}).
        </p>
      </div>
    );
  }

  // 6. View: Standard List (Toolbar + Table)
  const isFormal =
    selectedFormat.startsWith('Rincian Kertas Kerja') || selectedFormat.startsWith('Rincian RKAS');
  const isAnnualView = selectedFormat.toLowerCase().includes('tahunan');
  const isQuarterlyView = selectedFormat.toLowerCase().includes('triwulan');

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <KertasKerjaToolbar
        selectedFormat={selectedFormat}
        setSelectedFormat={setSelectedFormat}
        reportFormats={reportFormats}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        months={months}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isMonthly={isMonthly}
        // Export props
        processedData={processedData}
        year={year}
        fundSource={fundSource}
        schoolInfo={schoolInfo}
        reportTitle={reportTitle}
      />

      {isAnnualView ? (
        <KertasKerjaFormalTableAnnual
          processedData={processedData}
          year={year}
          fundSource={fundSource}
          reportTitle={reportTitle}
          schoolInfo={schoolInfo}
        />
      ) : isQuarterlyView ? ( // NEW: Quarterly View
        <KertasKerjaFormalTableQuarterly
          processedData={processedData}
          fundSource={fundSource}
          reportTitle={reportTitle}
          schoolInfo={schoolInfo}
        />
      ) : isFormal ? (
        <KertasKerjaFormalTable
          processedData={processedData}
          isMonthly={isMonthly}
          selectedMonth={selectedMonth}
          months={months}
          fundSource={fundSource}
          reportTitle={reportTitle}
          schoolInfo={schoolInfo}
        />
      ) : (
        <KertasKerjaTable
          processedData={processedData}
          isQuarterly={isQuarterly}
          isMonthly={isMonthly}
          selectedMonth={selectedMonth}
          months={months}
        />
      )}
    </div>
  );
}
