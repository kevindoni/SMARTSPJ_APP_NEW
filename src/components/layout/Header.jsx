import {
  Activity,
  Database,
  AlertCircle,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  Zap,
} from 'lucide-react';
import { useFilter } from '../../context/FilterContext';
import { useState, useEffect } from 'react';

export default function Header({ dbStatus, availableSources, availableYears }) {
  const { year, setYear, fundSource, setFundSource } = useFilter();

  const [updateStatus, setUpdateStatus] = useState('idle');
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [appVersion, setAppVersion] = useState(null);

  useEffect(() => {
    if (!window.arkas) return;
    window.arkas
      .getAppVersion?.()
      .then((v) => setAppVersion(v.appVersion))
      .catch(() => {});
    window.arkas.onUpdateAvailable?.((info) => {
      setUpdateInfo(info);
      setUpdateStatus('available');
    });
    window.arkas.onUpdateProgress?.((p) => {
      setDownloadProgress(Math.round(p.percent));
      setUpdateStatus('downloading');
    });
    window.arkas.onUpdateDownloaded?.(() => {
      setUpdateStatus('downloaded');
    });
  }, []);

  const handleCheckUpdate = async () => {
    if (!window.arkas?.checkForUpdate) return;
    setUpdateStatus('checking');
    try {
      const result = await window.arkas.checkForUpdate();
      if (result.hasUpdate) {
        setUpdateInfo({ version: result.version });
        setUpdateStatus('available');
      } else {
        setUpdateStatus('not-available');
      }
    } catch {
      setUpdateStatus('idle');
    }
  };

  const handleDownload = async () => {
    if (!window.arkas?.downloadUpdate) return;
    setUpdateStatus('downloading');
    setDownloadProgress(0);
    try {
      await window.arkas.downloadUpdate();
    } catch {
      setUpdateStatus('available');
    }
  };

  const handleInstall = () => {
    if (window.arkas?.installUpdate) window.arkas.installUpdate();
  };

  return (
    <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <div>{/* Page Title could go here, or left empty for cleaner look */}</div>

      <div className="flex flex-wrap items-center gap-3">
        {/* === FILTER GLOBAL === */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
          <Filter size={16} className="text-slate-400 ml-2" />

          {/* Tahun */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 rounded px-2 py-1"
          >
            {availableYears?.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>

          <div className="w-px h-4 bg-slate-300"></div>

          {/* Sumber Dana */}
          <select
            value={fundSource}
            onChange={(e) => setFundSource(e.target.value)}
            className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 rounded px-2 py-1 max-w-[150px] truncate"
          >
            <option value="SEMUA">SEMUA DANA</option>
            {availableSources?.map((src) => (
              <option key={src} value={src}>
                {src}
              </option>
            ))}
          </select>
        </div>

        {/* Status Koneksi */}
        {/* Status Koneksi - Only show if running in Electron (window.arkas available) */}
        {typeof window !== 'undefined' && window.arkas && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${
              dbStatus.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {dbStatus.loading ? (
              <Activity className="animate-spin w-4 h-4" />
            ) : dbStatus.success ? (
              <Database className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="font-medium">
              {dbStatus.loading
                ? '...'
                : dbStatus.success
                  ? 'Terhubung Dengan Arkas'
                  : 'Terputus Dengan Arkas'}
            </span>
          </div>
        )}

        {/* Update Badge */}
        {typeof window !== 'undefined' && window.arkas && (
          <>
            {updateStatus === 'idle' && (
              <button
                onClick={handleCheckUpdate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <RefreshCw size={14} />
                <span className="font-medium">v{appVersion || '...'}</span>
              </button>
            )}
            {updateStatus === 'checking' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm bg-slate-50 border-slate-200 text-slate-400">
                <RefreshCw size={14} className="animate-spin" />
                <span className="font-medium">v{appVersion || '...'}</span>
              </div>
            )}
            {updateStatus === 'not-available' && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm bg-emerald-50 border-emerald-200 text-emerald-600">
                <CheckCircle size={14} />
                <span className="font-semibold">v{appVersion || '...'}</span>
              </div>
            )}
            {updateStatus === 'available' && updateInfo && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                <Download size={14} />
                <span className="font-medium">Update v{updateInfo.version}</span>
              </button>
            )}
            {updateStatus === 'downloading' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm bg-indigo-50 border-indigo-200 text-indigo-700">
                <Download size={14} className="animate-bounce" />
                <span className="font-medium font-mono">{downloadProgress}%</span>
                <div className="w-16 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: downloadProgress + '%' }}
                  />
                </div>
              </div>
            )}
            {updateStatus === 'downloaded' && (
              <button
                onClick={handleInstall}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                <Zap size={14} />
                <span className="font-medium">Install & Restart</span>
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
}
