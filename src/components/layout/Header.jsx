import {
  Activity,
  Database,
  AlertCircle,
  Filter,
  Download,
  RefreshCw,
  CheckCircle,
  Zap,
  Sparkles,
} from 'lucide-react';
import { useFilter } from '../../context/FilterContext';
import { useState, useEffect, useCallback } from 'react';

const isElectron = typeof window !== 'undefined' && window.arkas;

export default function Header({ dbStatus, availableSources, availableYears }) {
  const { year, setYear, fundSource, setFundSource } = useFilter();

  const [updateStatus, setUpdateStatus] = useState('idle'); // idle | checking | available | downloading | downloaded | not-available | error
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [appVersion, setAppVersion] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [downloadSpeed, setDownloadSpeed] = useState(0);

  // Fetch app version
  useEffect(() => {
    if (!isElectron || !window.arkas?.getAppVersion) return;
    window.arkas
      .getAppVersion()
      .then((v) => setAppVersion(v.appVersion))
      .catch(() => {});
  }, []);

  // Listen for auto-update events from main process (cleanup on unmount)
  useEffect(() => {
    if (!isElectron) return;

    const cleanups = [];

    if (window.arkas?.onUpdateAvailable) {
      cleanups.push(
        window.arkas.onUpdateAvailable((info) => {
          console.log('[Updater] Update available:', info.version);
          setUpdateInfo(info);
          setUpdateStatus('available');
          setUpdateError(null);
        })
      );
    }
    if (window.arkas?.onUpdateProgress) {
      cleanups.push(
        window.arkas.onUpdateProgress((p) => {
          setDownloadProgress(Math.round(p.percent));
          setDownloadSpeed(p.bytesPerSecond || 0);
          setUpdateStatus('downloading');
        })
      );
    }
    if (window.arkas?.onUpdateDownloaded) {
      cleanups.push(
        window.arkas.onUpdateDownloaded(() => {
          setUpdateStatus('downloaded');
          setUpdateError(null);
        })
      );
    }
    if (window.arkas?.onUpdateNotAvailable) {
      cleanups.push(
        window.arkas.onUpdateNotAvailable(() => {
          setUpdateStatus('not-available');
        })
      );
    }
    if (window.arkas?.onUpdateError) {
      cleanups.push(
        window.arkas.onUpdateError((err) => {
          console.error('[Updater] Error:', err);
          setUpdateError(err.message);
          setUpdateStatus('error');
        })
      );
    }

    return () => {
      cleanups.forEach((cleanup) => {
        if (typeof cleanup === 'function') cleanup();
      });
    };
  }, []);

  const handleCheckUpdate = useCallback(async () => {
    if (!window.arkas?.checkForUpdate) return;
    if (updateStatus === 'checking') return;
    setUpdateStatus('checking');
    setUpdateError(null);
    try {
      const result = await window.arkas.checkForUpdate();
      if (result.error && !result.hasUpdate) {
        setUpdateError(result.error);
        setUpdateStatus('error');
        return;
      }
      if (result.hasUpdate) {
        setUpdateInfo({ version: result.version, releaseNotes: result.releaseNotes });
        setUpdateStatus('available');
      } else {
        setUpdateStatus('not-available');
      }
    } catch (err) {
      setUpdateError(err.message || 'Gagal mengecek update');
      setUpdateStatus('error');
    }
  }, [updateStatus]);

  const handleDownload = useCallback(async () => {
    if (!window.arkas?.downloadUpdate) return;
    setUpdateStatus('downloading');
    setDownloadProgress(0);
    try {
      const result = await window.arkas.downloadUpdate();
      if (result && !result.success) {
        setUpdateError(result.error || 'Download gagal');
        setUpdateStatus('error');
      }
    } catch (err) {
      setUpdateError(err.message || 'Download gagal');
      setUpdateStatus('available'); // allow retry
    }
  }, []);

  const handleInstall = useCallback(() => {
    if (window.arkas?.installUpdate) window.arkas.installUpdate();
  }, []);

  // Format download speed
  const formatSpeed = (bytesPerSecond) => {
    if (!bytesPerSecond) return '';
    if (bytesPerSecond > 1048576) return `${(bytesPerSecond / 1048576).toFixed(1)} MB/s`;
    if (bytesPerSecond > 1024) return `${(bytesPerSecond / 1024).toFixed(0)} KB/s`;
    return `${bytesPerSecond} B/s`;
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-200">
      {/* Filters */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
        <Filter size={16} className="text-slate-400 ml-2" />
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
        <select
          value={fundSource}
          onChange={(e) => setFundSource(e.target.value)}
          className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 rounded px-2 py-1 max-w-[160px] truncate"
        >
          <option value="SEMUA">SEMUA DANA</option>
          {availableSources?.map((src) => (
            <option key={src} value={src}>
              {src}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* DB Status - Electron only */}
        {isElectron && (
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${dbStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : dbStatus.loading ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-red-50 border-red-200 text-red-700'}`}
          >
            {dbStatus.loading ? (
              <Activity className="animate-spin w-3.5 h-3.5" />
            ) : dbStatus.success ? (
              <Database className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            <span>
              {dbStatus.loading
                ? 'Menghubungkan...'
                : dbStatus.success
                  ? 'Terhubung Arkas'
                  : 'Terputus'}
            </span>
          </div>
        )}

        {/* Update controls - Electron only */}
        {isElectron && (
          <>
            {/* Idle: show version + check button */}
            {updateStatus === 'idle' && (
              <button
                onClick={handleCheckUpdate}
                title="Cek update tersedia"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <RefreshCw size={12} />
                <span className="font-medium">v{appVersion || '...'}</span>
              </button>
            )}

            {/* Checking */}
            {updateStatus === 'checking' && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs bg-slate-50 border-slate-200 text-slate-400">
                <RefreshCw size={12} className="animate-spin" />
                <span className="font-medium">Cek update...</span>
              </div>
            )}

            {/* No update available */}
            {updateStatus === 'not-available' && (
              <button
                onClick={handleCheckUpdate}
                title="Sudah versi terbaru. Klik untuk cek lagi."
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-colors"
              >
                <CheckCircle size={12} />
                <span className="font-semibold">v{appVersion || '...'}</span>
              </button>
            )}

            {/* Update available! */}
            {updateStatus === 'available' && updateInfo && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
              >
                <Download size={12} />
                <span className="font-semibold">Update v{updateInfo.version}</span>
              </button>
            )}

            {/* Downloading */}
            {updateStatus === 'downloading' && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs bg-indigo-50 border-indigo-200 text-indigo-700">
                <Download size={12} className="animate-bounce" />
                <span className="font-bold font-mono">{downloadProgress}%</span>
                {downloadSpeed > 0 && (
                  <span className="text-[10px] text-indigo-400 font-medium">
                    {formatSpeed(downloadSpeed)}
                  </span>
                )}
                <div className="w-20 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: downloadProgress + '%' }}
                  />
                </div>
              </div>
            )}

            {/* Downloaded - ready to install */}
            {updateStatus === 'downloaded' && (
              <button
                onClick={handleInstall}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200 animate-pulse"
              >
                <Zap size={12} />
                <span className="font-semibold">Install & Restart</span>
              </button>
            )}

            {/* Error */}
            {updateStatus === 'error' && (
              <button
                onClick={handleCheckUpdate}
                title={updateError || 'Kesalahan tidak diketahui'}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <AlertCircle size={12} />
                <span className="font-medium">Update gagal</span>
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
}
