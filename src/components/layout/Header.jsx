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
  X,
  ArrowRight,
  Bug,
  Shield,
  Rocket,
} from 'lucide-react';
import { useFilter } from '../../context/FilterContext';
import { useState, useEffect, useCallback } from 'react';

const isElectron = typeof window !== 'undefined' && window.arkas;

function parseReleaseNotes(notes) {
  if (!notes) return [];
  if (typeof notes === 'string') {
    return notes.split('\n').filter((l) => l.trim().startsWith('- ') || l.trim().startsWith('* ')).map((l) => l.replace(/^[\-\*\s]+/, '').trim());
  }
  if (Array.isArray(notes)) {
    return notes.map((n) => (typeof n === 'string' ? n : n.note || '')).filter(Boolean);
  }
  return [];
}

function getChangeIcon(text) {
  const lower = text.toLowerCase();
  if (lower.includes('sql injection') || lower.includes('credential') || lower.includes('keamanan') || lower.includes('security')) return { icon: Shield, color: 'violet' };
  if (lower.includes('fix') || lower.includes('perbaikan') || lower.includes('bug') || lower.includes('gagal') || lower.includes('precision')) return { icon: Bug, color: 'emerald' };
  if (lower.includes('new') || lower.includes('baru') || lower.includes('tambah')) return { icon: Sparkles, color: 'blue' };
  return { icon: ArrowRight, color: 'amber' };
}

function UpdateNotificationModal({ version, releaseNotes, onDownload, onDismiss, currentVersion }) {
  const changes = parseReleaseNotes(releaseNotes);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onDismiss} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-6 py-5">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute bottom-0 left-1/4 w-20 h-20 bg-white/[0.06] rounded-full" />
          </div>
          <button onClick={onDismiss} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors">
            <X size={14} />
          </button>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Rocket size={16} className="text-white/80" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Update Tersedia</span>
            </div>
            <h2 className="text-xl font-extrabold text-white">SmartSPJ v{version}</h2>
            <p className="text-xs text-white/60 mt-1">Versi saat ini: v{currentVersion}</p>
          </div>
        </div>

        {changes.length > 0 && (
          <div className="px-6 py-4 max-h-56 overflow-y-auto">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Yang Baru</p>
            <div className="space-y-2">
              {changes.map((change, i) => {
                const { icon: Icon, color } = getChangeIcon(change);
                const colorMap = {
                  violet: 'bg-violet-50 text-violet-600',
                  emerald: 'bg-emerald-50 text-emerald-600',
                  blue: 'bg-blue-50 text-blue-600',
                  amber: 'bg-amber-50 text-amber-600',
                };
                return (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${colorMap[color]}`}>
                      <Icon size={11} />
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{change}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
          <button
            onClick={onDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm shadow-indigo-200"
          >
            <Download size={14} />
            Download Update
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-500 transition-colors"
          >
            Nanti
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Header({ dbStatus, availableSources, availableYears }) {
  const { year, setYear, fundSource, setFundSource } = useFilter();

  const [updateStatus, setUpdateStatus] = useState('idle'); // idle | checking | available | downloading | downloaded | not-available | error
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [appVersion, setAppVersion] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Fetch app version
  useEffect(() => {
    if (!isElectron || !window.arkas?.getAppVersion) return;
    window.arkas
      .getAppVersion()
      .then((v) => setAppVersion(v.appVersion))
      .catch(() => {});
  }, []);

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
          setShowUpdateModal(true);
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
        setShowUpdateModal(true);
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

      {showUpdateModal && updateInfo && updateStatus === 'available' && (
        <UpdateNotificationModal
          version={updateInfo.version}
          releaseNotes={updateInfo.releaseNotes}
          currentVersion={appVersion}
          onDownload={() => {
            setShowUpdateModal(false);
            handleDownload();
          }}
          onDismiss={() => setShowUpdateModal(false)}
        />
      )}
    </header>
  );
}
