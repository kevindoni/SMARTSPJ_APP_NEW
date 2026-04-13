import { useState, useEffect, useMemo } from 'react';
import {
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Printer,
  TrendingUp,
  Wallet,
  ArrowRightLeft,
  X,
} from 'lucide-react';
import { exportBaRekonsToExcel } from '../utils/exportBaRekons';
import { exportBaRekonsToPdf } from '../utils/exportBaRekonsToPdf';
import { exportTableToExcel } from '../utils/exportTableToExcel';
import { exportTableToPdf } from '../utils/exportTableToPdf';
import { useFilter } from '../context/FilterContext';
import { RECONCILIATION_COLUMNS } from '../config/reconciliationTableConfig';
import { flattenReconciliationData, formatRupiah } from '../utils/reconciliationHelpers';
import { theme } from '../theme';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Smart Components
import SmartReconciliationTable from '../components/SmartReconciliationTable';
import BungaTable from '../components/reconciliation/BungaTable';
import PajakTable from '../components/reconciliation/PajakTable';
import FundSourceTable from '../components/reconciliation/FundSourceTable';
import ReconciliationDocument from '../components/reconciliation/ReconciliationDocument';

export default function BAReconciliation() {
  const { year } = useFilter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('ba-rekons');
  const [selectedPeriod, setSelectedPeriod] = useState('tahunan'); // 'tw1', 'tw2', 'tw3', 'tw4', 'sm1', 'sm2', 'tahunan'

  // Auxiliary Data
  const [bungaData, setBungaData] = useState(null);
  const [pajakData, setPajakData] = useState(null);
  const [reconSources, setReconSources] = useState([]);
  const [fundDetailData, setFundDetailData] = useState(null);

  // BA Document Signatories Data

  const [signatoryData, setSignatoryData] = useState({
    pptkNama: '',
    pptkNip: '',
    petugasRekonsNama: '',
    petugasRekonsNip: '',
    nomorBa: '',
    // Header Default Values (Pengguna bisa atur via modal penandatangan)
    header1: '',
    header2: '',
    headerAlamat: '',
    headerTelepon: '',
    headerLaman: '',
  });


  // Fetch school info
  useEffect(() => {
    if (window.arkas?.getSchoolInfo) {
      window.arkas
        .getSchoolInfo()
        .then((res) => {
          if (res.success) setSchoolInfo(res.data);
        })
        .catch((err) => console.error('Failed to get school info:', err));
    }
  }, []);

  // Load signatory data from JSON on mount
  useEffect(() => {
    if (window.arkas?.getSignatoryData) {
      window.arkas
        .getSignatoryData()
        .then((res) => {
          if (res.success && res.data) {
            setSignatoryData((prev) => ({
              ...prev,
              ...res.data,
            }));
          }
        })
        .catch((err) => console.error('Failed to load signatory data:', err));
    }
  }, []);

  // Fetch available fund sources for tabs
  useEffect(() => {
    if (window.arkas?.getReconciliationFundSources) {
      window.arkas
        .getReconciliationFundSources(year)
        .then((res) => {
          if (res.success) setReconSources(res.data);
        })
        .catch((err) => console.error('Failed to get recon fund sources:', err));
    }
  }, [year]);

  // Fetch Data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchData();
  }, [year, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!window.arkas?.getReconciliationData) {
        throw new Error('API tidak tersedia');
      }

      // Fetch Main Data (always needed for BA Rekons & Doc)
      if (activeTab === 'ba-rekons' || activeTab === 'lembar-ba') {
        const result = await window.arkas.getReconciliationData(year);
        if (result.success) setData(result.data);
        else throw new Error(result.error || 'Gagal memuat data rekonsiliasi');

        // Also fetch pajak data for Hutang Pajak display
        if (window.arkas?.getPajakDetail) {
          const pajakResult = await window.arkas.getPajakDetail(year);
          if (pajakResult.success) setPajakData(pajakResult.data);
        }
      } else if (activeTab === 'rekap-bunga') {
        const result = await window.arkas.getBungaDetail(year);
        if (result.success) setBungaData(result.data);
        else throw new Error(result.error);
      } else if (activeTab === 'rekap-pajak') {
        const result = await window.arkas.getPajakDetail(year);
        if (result.success) setPajakData(result.data);
        else throw new Error(result.error);
      } else if (reconSources.some((s) => s.id === activeTab)) {
        const result = await window.arkas.getFundSourceDetail(year, activeTab);
        if (result.success) setFundDetailData(result.data);
        else throw new Error(result.error);
      }
    } catch (err) {
      console.error('Reconciliation Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Memoized Flattened Data for Smart Table
  const smartTableData = useMemo(() => {
    if (!data || activeTab !== 'ba-rekons') return [];
    return flattenReconciliationData(data);
  }, [data, activeTab]);

  // UI Renders
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-96">
        <Loader2 size={48} className="text-emerald-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Memuat Data Rekonsiliasi {year}...</p>
      </div>
    );
  }

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

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <ToastContainer />

      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              REKONSILIASI
            </span>
            <h2 className="text-lg font-bold text-slate-800">
              Berita Acara Rekonsiliasi (BA Rekons)
            </h2>
          </div>
        </div>

        <div className="flex gap-2">
{/* PDF Export - hidden for Fund Source tabs */}
{!reconSources.some((s) => s.id === activeTab) && (
          <button
            onClick={async () => {
              try {
                // Logic Switch based on Tab
                if (activeTab === 'lembar-ba') {
                  if (!data) {
                    toast.warning('Data belum siap. Mohon tunggu.');
                    return;
                  }
                  exportBaRekonsToPdf(
                    data,
                    signatoryData,
                    schoolInfo,
                    year,
                    selectedPeriod,
                    pajakData
                  );
                } else if (activeTab === 'ba-rekons') {
                  // NEW: Export detailed table for Main Tab
                  if (!smartTableData || smartTableData.length === 0)
                    throw new Error('Data Tabel belum dimuat');

                  // Use Shared Config for consistent export
                  exportTableToPdf(
                    'smart-table',
                    { rows: smartTableData, columns: RECONCILIATION_COLUMNS },
                    signatoryData,
                    schoolInfo,
                    year,
                    'Rincian BA Rekonsiliasi'
                  );
                } else if (activeTab === 'rekap-bunga') {
                  if (!bungaData) throw new Error('Data Bunga belum dimuat');
                  exportTableToPdf(
                    'rekap-bunga',
                    bungaData,
                    signatoryData,
                    schoolInfo,
                    year,
                    'Rekap Bunga Bank'
                  );
                } else if (activeTab === 'rekap-pajak') {
                  if (!pajakData) throw new Error('Data Pajak belum dimuat');
                  exportTableToPdf(
                    'rekap-pajak',
                    pajakData,
                    signatoryData,
                    schoolInfo,
                    year,
                    'Rekap Pajak'
                  );
                } else {
                  // Fund Source Tabs
                  const source = reconSources.find((s) => s.id === activeTab);
                  if (source) {
                    if (!fundDetailData) throw new Error('Data Sumber Dana belum dimuat');
                    exportTableToPdf(
                      'fund-source',
                      fundDetailData,
                      signatoryData,
                      schoolInfo,
                      year,
                      source.label
                    );
                  }
                }
              } catch (error) {
                console.error('Export PDF Error:', error);
                toast.error('Gagal export PDF: ' + error.message);
              }
            }}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium shadow-sm active:scale-95"
          >
            <Printer size={16} />
            Download PDF
          </button>
)}

          <button
            onClick={async () => {
              try {
                if (activeTab === 'lembar-ba') {
                  if (!data) {
                    toast.warning('Data belum siap.');
                    return;
                  }
                  await exportBaRekonsToExcel(
                    data,
                    signatoryData,
                    schoolInfo,
                    year,
                    selectedPeriod,
                    pajakData
                  );
                } else if (activeTab === 'ba-rekons') {
                  // NEW: Export detailed table for Main Tab
                  if (!smartTableData || smartTableData.length === 0)
                    throw new Error('Data Tabel belum dimuat');

                  await exportTableToExcel(
                    'smart-table',
                    { rows: smartTableData, columns: RECONCILIATION_COLUMNS },
                    signatoryData,
                    schoolInfo,
                    year,
                    'Rincian BA Rekonsiliasi'
                  );
                } else if (activeTab === 'rekap-bunga') {
                  if (!bungaData) throw new Error('Data Bunga belum dimuat');
                  await exportTableToExcel(
                    'rekap-bunga',
                    bungaData,
                    signatoryData,
                    schoolInfo,
                    year,
                    'Rekap Bunga Bank'
                  );
                } else if (activeTab === 'rekap-pajak') {
                  if (!pajakData) throw new Error('Data Pajak belum dimuat');
                  await exportTableToExcel(
                    'rekap-pajak',
                    pajakData,
                    signatoryData,
                    schoolInfo,
                    year,
                    'Rekap Pajak'
                  );
                } else {
                  const source = reconSources.find((s) => s.id === activeTab);
                  if (source) {
                    if (!fundDetailData) throw new Error('Data Sumber Dana belum dimuat');
                    await exportTableToExcel(
                      'fund-source',
                      fundDetailData,
                      signatoryData,
                      schoolInfo,
                      year,
                      source.label
                    );
                  }
                }
              } catch (error) {
                console.error('Export Excel Error:', error);
                toast.error('Gagal export Excel: ' + error.message);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium shadow-sm active:scale-95"
          >
            <Download size={16} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100/50 p-1 rounded-lg">
            <TabButton
              id="ba-rekons"
              label="BA REKONS"
              activeTab={activeTab}
              onClick={setActiveTab}
            />
            <TabButton
              id="lembar-ba"
              label="LEMBAR BA"
              activeTab={activeTab}
              onClick={setActiveTab}
            />
          </div>

          <div className="flex flex-col items-center px-2">
            <div className="w-px h-6 bg-gradient-to-b from-transparent via-slate-300 to-transparent" />
          </div>

          {/* Fund Source Tabs */}
          <div className="flex items-center gap-1.5 bg-amber-50/50 p-1 rounded-lg border border-amber-100">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider px-2">
              Sumber Dana
            </span>
            {reconSources.map((source) => (
              <TabButton
                key={source.id}
                id={source.id}
                label={source.label.replace('BOS ', '')}
                activeTab={activeTab}
                onClick={setActiveTab}
              />
            ))}
          </div>

          <div className="flex flex-col items-center px-2">
            <div className="w-px h-6 bg-gradient-to-b from-transparent via-slate-300 to-transparent" />
          </div>

          {/* Summary Tabs */}
          <div className="flex items-center gap-1.5 bg-blue-50/50 p-1 rounded-lg border border-blue-100">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider px-2">
              Rekap
            </span>
            <TabButton
              id="rekap-bunga"
              label="BUNGA"
              activeTab={activeTab}
              onClick={setActiveTab}
            />
            <TabButton
              id="rekap-pajak"
              label="PAJAK"
              activeTab={activeTab}
              onClick={setActiveTab}
            />
          </div>
        </div>
      </div>

      {/* Summary Stats Banner - Only for BA Rekons tab */}
      {activeTab === 'ba-rekons' && data?.annual && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`${theme.card} border-l-4 border-l-emerald-500 p-5 flex items-center justify-between`}
          >
            <div>
              <div className={theme.text.label}>Saldo Awal (Januari)</div>
              <div className="text-xl font-bold text-slate-800">
                {formatRupiah(data.annual.opening?.total || 0)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Bank: {formatRupiah(data.annual.opening?.bank || 0)} | Tunai:{' '}
                {formatRupiah(data.annual.opening?.tunai || 0)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-500">
              <Wallet size={24} />
            </div>
          </div>

          <div
            className={`${theme.card} border-l-4 border-l-blue-500 p-5 flex items-center justify-between`}
          >
            <div>
              <div className={`${theme.text.label} text-blue-500`}>Total Penerimaan</div>
              <div className="text-xl font-bold text-slate-800">
                {formatRupiah(data.annual.income?.total || 0)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Reguler + Kinerja + Bunga</div>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-blue-500">
              <TrendingUp size={24} />
            </div>
          </div>

          <div
            className={`${theme.card} border-l-4 border-l-amber-500 p-5 flex items-center justify-between`}
          >
            <div>
              <div className={`${theme.text.label} text-amber-500`}>Saldo Akhir (Desember)</div>
              <div className="text-xl font-bold text-slate-800">
                {formatRupiah(data.annual.closing?.total || 0)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Bank: {formatRupiah(data.annual.closing?.bank || 0)} | Tunai:{' '}
                {formatRupiah(data.annual.closing?.tunai || 0)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 text-amber-500">
              <ArrowRightLeft size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Smart Content Area */}
      <div className="min-h-[500px]">
        {activeTab === 'ba-rekons' && <SmartReconciliationTable data={smartTableData} />}

        {activeTab === 'lembar-ba' && (
          <div>
            {/* Period Selector and Settings */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-slate-600">Pilih Periode:</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="tw1">Triwulan I</option>
                  <option value="tw2">Triwulan II</option>
                  <option value="tw3">Triwulan III</option>
                  <option value="tw4">Triwulan IV</option>
                  <option value="sm1">Semester 1</option>
                  <option value="sm2">Semester 2</option>
                  <option value="tahunan">Tahunan</option>
                </select>
              </div>
            </div>
            <div className="w-full overflow-x-auto min-h-[500px]">
              <ReconciliationDocument
                data={data}
                schoolInfo={schoolInfo}
                year={year}
                period={selectedPeriod}
                signatoryData={signatoryData}
                pajakData={pajakData}
              />
            </div>
          </div>
        )}

        {activeTab === 'rekap-bunga' && <BungaTable data={bungaData} />}

        {activeTab === 'rekap-pajak' && <PajakTable data={pajakData} />}

        {reconSources.some((s) => s.id === activeTab) && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <FundSourceTable data={fundDetailData} />
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced tab button component with icons
const TabButton = ({ id, label, activeTab, onClick, icon: CustomIcon }) => {
  // Icon mapping based on tab ID
  const getIcon = () => {
    const iconMap = {
      'ba-rekons': FileSpreadsheet,
      'lembar-ba': FileSpreadsheet,
      'dana-lainnya': Wallet,
      reguler: Wallet,
      kinerja: TrendingUp,
      'rekap-bunga': TrendingUp,
      'rekap-pajak': ArrowRightLeft,
    };
    return CustomIcon || iconMap[id] || Wallet;
  };

  const Icon = getIcon();
  const isActive = activeTab === id;

  return (
    <button
      onClick={() => onClick(id)}
      className={`
                group flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200
                ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-200/50 scale-[1.02]'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-emerald-600 hover:shadow-md'
                }
            `}
    >
      <Icon
        size={16}
        className={`transition-transform duration-200 ${isActive ? '' : 'group-hover:scale-110'}`}
      />
      <span>{label}</span>
      {isActive && <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-pulse" />}
    </button>
  );
};
