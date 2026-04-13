import { useState } from 'react';
import {
  HardDrive,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Shield,
  FileText,
  Database,
  Settings,
  Loader2,
  Archive,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useFilter } from '../context/FilterContext';

const BACKUP_ITEMS = [
  { label: 'Info Pejabat Sekolah', file: 'config.json', icon: Settings },
  { label: 'Register Kas', file: 'register-kas.json', icon: Database },
  { label: 'Pajak Manual', file: 'manual_taxes.json', icon: FileText },
  { label: 'Grup Nota', file: 'nota-groups.json', icon: FileText },
  { label: 'Tanda Tangan BA', file: 'ba_signatory.json', icon: Shield },
  { label: 'Rekening Koran', file: 'bank-reconciliation.json', icon: Database },
  { label: 'Status Cetak & Filter', file: 'localStorage', icon: CheckCircle },
];

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(isoString) {
  if (!isoString) return '-';
  const parts = isoString.split(/[-T:.]/);
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
  const day = parseInt(parts[2], 10);
  const month = months[parseInt(parts[1], 10) - 1] || '-';
  const year = parts[0];
  const time = `${parts[3] || '00'}:${parts[4] || '00'}`;
  return `${day} ${month} ${year}, ${time}`;
}

export default function BackupRestore() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isFullBackingUp, setIsFullBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupInfo, setBackupInfo] = useState(null);
  const [selectedFilePath, setSelectedFilePath] = useState(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { year, fundSource } = useFilter();

  const gatherLocalStorage = () => {
    const data = {};
    const keys = [
      'selected_year',
      'selected_fund_source',
      'printed_transactions',
      'printed_groups',
    ];
    keys.forEach((key) => {
      const val = localStorage.getItem(key);
      if (val) data[key] = val;
    });
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('custom_date_')) data[key] = localStorage.getItem(key);
    }
    return data;
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const result = await window.arkas.showSaveDialog({
        title: 'Simpan Backup Data',
        defaultPath: `SmartSPJ_Backup_${new Date().toISOString().slice(0, 10)}.zip`,
        filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
      });

      if (result.canceled || !result.filePath) {
        setIsBackingUp(false);
        return;
      }

      const localStorageData = gatherLocalStorage();
      const response = await window.arkas.createBackup(result.filePath, localStorageData);

      if (response.success) {
        toast.success(`Backup data berhasil! (${formatBytes(response.size)})`, { autoClose: 3000 });
      } else {
        toast.error(`Backup gagal: ${response.error}`, { autoClose: 5000 });
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat backup.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFullBackup = async () => {
    setIsFullBackingUp(true);
    try {
      const result = await window.arkas.showSaveDialog({
        title: 'Simpan Backup Lengkap',
        defaultPath: `SmartSPJ_FullBackup_${new Date().toISOString().slice(0, 10)}.zip`,
        filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
      });

      if (result.canceled || !result.filePath) {
        setIsFullBackingUp(false);
        return;
      }

      const localStorageData = gatherLocalStorage();
      const response = await window.arkas.createFullBackup(result.filePath, localStorageData);

      if (response.success) {
        toast.success(`Backup lengkap berhasil! (${formatBytes(response.size)})`, {
          autoClose: 3000,
        });
      } else {
        toast.error(`Backup gagal: ${response.error}`, { autoClose: 5000 });
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat backup.');
    } finally {
      setIsFullBackingUp(false);
    }
  };

  const handleRestorePick = async () => {
    try {
      const result = await window.arkas.showOpenDialog({
        title: 'Pilih File Backup',
        filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
        properties: ['openFile'],
      });

      if (result.canceled || !result.filePaths?.length) return;

      const filePath = result.filePaths[0];
      setSelectedFilePath(filePath);
      setBackupInfo(null);
      setShowRestoreConfirm(false);

      const info = await window.arkas.getBackupInfo(filePath);
      if (info.success) {
        setBackupInfo(info.info);
      } else {
        toast.error(`File tidak valid: ${info.error}`);
      }
    } catch (err) {
      toast.error('Gagal membaca file backup.');
    }
  };

  const handleRestoreConfirm = async () => {
    if (!selectedFilePath) return;
    setIsRestoring(true);
    try {
      const currentLs = gatherLocalStorage();
      const response = await window.arkas.restoreBackup(selectedFilePath, currentLs);

      if (response.success) {
        if (response.localStorageData) {
          Object.entries(response.localStorageData).forEach(([key, value]) => {
            localStorage.setItem(key, value);
          });
        }
        toast.success(
          `Restore berhasil! ${response.restoredFiles.length} file dipulihkan. Aplikasi akan dimuat ulang...`,
          { autoClose: 3000 }
        );
        setTimeout(() => window.location.reload(), 3000);
      } else {
        toast.error(`Restore gagal: ${response.error}`);
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat restore.');
    } finally {
      setIsRestoring(false);
      setShowRestoreConfirm(false);
    }
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      toast.info('Mengumpulkan data dari semua laporan...');
      const result = await window.arkas.exportAllBku({
        year,
        fundSource: fundSource === 'all' ? 'SEMUA' : fundSource,
      });
      if (result.success) {
        toast.success('Semua laporan berhasil di-export!', { autoClose: 4000 });
      } else if (!result.canceled) {
        toast.error('Export gagal: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      toast.error('Gagal melakukan export semua laporan');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const anyBusy = isBackingUp || isFullBackingUp || isRestoring || isExporting;

  return (
    <div className="flex flex-col gap-6 font-sans pb-20 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <HardDrive size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              LAINNYA
            </span>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">BACKUP & RESTORE</h2>
          </div>
        </div>
      </div>

      {/* BACKUP CARDS — 3 kolom */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BACKUP DATA (ringkas) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-emerald-50/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <Download size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Backup Data</h3>
                <p className="text-xs text-slate-500">File data & pengaturan saja</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm text-slate-600 mb-4">
              Backup 6 file data JSON + status filter. Ukuran kecil, cepat.
            </p>
            <button
              onClick={handleBackup}
              disabled={anyBusy}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isBackingUp ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Membuat Backup...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Backup Data
                </>
              )}
            </button>
          </div>
        </div>

        {/* BACKUP LENGKAP */}
        <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden ring-1 ring-amber-100">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-amber-50/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-amber-200">
                <Archive size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Backup Lengkap</h3>
                <p className="text-xs text-slate-500">Seluruh folder data (portable)</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm text-slate-600 mb-2">
              Backup seluruh isi folder{' '}
              <code className="bg-slate-100 px-1 rounded text-xs">data/</code> termasuk file yang
              mungkin ditambahkan di masa depan.
            </p>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 mb-4 text-xs text-amber-700">
              Cocok untuk pindah PC atau backup menyeluruh. Termasuk file kunci terenkripsi
              (.arkas-key) yang hanya berfungsi di perangkat yang sama.
            </div>
            <button
              onClick={handleFullBackup}
              disabled={anyBusy}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-3 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isFullBackingUp ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Membuat Backup Lengkap...
                </>
              ) : (
                <>
                  <Archive size={18} />
                  Backup Lengkap
                </>
              )}
            </button>
          </div>
        </div>

        {/* RESTORE */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-indigo-50/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Upload size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Restore Data</h3>
                <p className="text-xs text-slate-500">Pulihkan dari file backup</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm text-slate-600 mb-4">
              Pilih file backup (data atau lengkap) untuk memulihkan data. Data saat ini akan
              ditimpa.
            </p>
            <button
              onClick={handleRestorePick}
              disabled={anyBusy}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isRestoring ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Merestore...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Pilih File Backup
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* BACKUP INFO PREVIEW */}
      {backupInfo && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-amber-50/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-amber-200">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Detail Backup</h3>
                <p className="text-xs text-slate-500">Periksa sebelum melakukan restore</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-xs font-bold text-slate-400 uppercase">Tipe</div>
                <div className="text-sm font-bold text-slate-800 mt-1">
                  {backupInfo.type === 'full' ? 'Lengkap' : 'Data'}
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-xs font-bold text-slate-400 uppercase">Versi</div>
                <div className="text-sm font-bold text-slate-800 mt-1">
                  {backupInfo.version || '-'}
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-xs font-bold text-slate-400 uppercase">Dibuat</div>
                <div className="text-sm font-bold text-slate-800 mt-1">
                  {formatDate(backupInfo.createdAt)}
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <div className="text-xs font-bold text-slate-400 uppercase">File Data</div>
                <div className="text-sm font-bold text-slate-800 mt-1">
                  {backupInfo.fileCount || 0} file
                </div>
              </div>
            </div>

            {backupInfo.files?.length > 0 && (
              <div className="mb-5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  File dalam backup:
                </div>
                <div className="flex flex-wrap gap-2">
                  {backupInfo.files.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-lg"
                    >
                      <CheckCircle size={12} className="text-emerald-500" />
                      {f.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {!showRestoreConfirm ? (
              <button
                onClick={() => setShowRestoreConfirm(true)}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 rounded-xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <AlertTriangle size={18} />
                Restore Data Ini
              </button>
            ) : (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle size={20} className="text-rose-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-rose-800">Peringatan!</h4>
                    <p className="text-sm text-rose-700">
                      Semua data saat ini akan ditimpa dengan data dari backup ini. Tindakan ini
                      tidak dapat dibatalkan.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleRestoreConfirm}
                    disabled={isRestoring}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isRestoring ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Merestore...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Ya, Restore Sekarang
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowRestoreConfirm(false)}
                    disabled={isRestoring}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all disabled:opacity-50"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EXPORT SEMUA LAPORAN */}
      <div className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden ring-1 ring-purple-100">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-purple-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-purple-200">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Export Semua Laporan</h3>
              <p className="text-xs text-slate-500">Satu file Excel multi-sheet: BKU Umum, Tunai, Bank, Pajak</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-600 mb-4">
            Menghasilkan file Excel dengan 4 sheet (masing-masing 12 bulan) untuk semua jenis BKU.
            Data diambil langsung dari database ARKAS.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {['BKU Umum', 'BKU Tunai', 'BKU Bank', 'Buku Pajak'].map((name, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-2.5 text-center">
                <div className="text-xs font-bold text-slate-500">{name}</div>
                <div className="text-[10px] text-slate-400">12 bulan</div>
              </div>
            ))}
          </div>
          <button
            onClick={handleExportAll}
            disabled={anyBusy}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Mengexport Semua Laporan...
              </>
            ) : (
              <>
                <FileSpreadsheet size={18} />
                Export Semua Laporan (Excel)
              </>
            )}
          </button>
        </div>
      </div>

      {/* DATA YANG DI-BACKUP */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Shield size={16} className="text-slate-400" />
            Data yang Disertakan dalam Backup
          </h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {BACKUP_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-800">{item.label}</div>
                    <div className="text-xs text-slate-400">{item.file}</div>
                  </div>
                  <CheckCircle size={16} className="text-emerald-500 ml-auto flex-shrink-0" />
                </div>
              );
            })}
          </div>

          <div className="mt-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-amber-800 text-sm">Yang TIDAK disertakan:</h4>
                <ul className="text-sm text-amber-700 mt-1 space-y-1">
                  <li>&bull; Database ARKAS — milik aplikasi ARKAS, tidak terkait SmartSPJ</li>
                  <li>&bull; Password database — terenkripsi per perangkat via Windows DPAPI</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
