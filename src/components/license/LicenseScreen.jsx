import { useState, useEffect, useRef } from 'react';
import { Shield, Crown, Zap, Lock, CheckCircle, AlertCircle, Key, ExternalLink, Loader2, KeyRound } from 'lucide-react';
import { useLicense } from '../../context/LicenseContext';
import { theme } from '../../theme';

const API_BASE = 'https://project-11rt0.vercel.app';

const PLANS = [
  {
    id: 'free',
    name: 'Free Trial',
    price: 'Gratis',
    duration: '30 hari',
    icon: Zap,
    accent: 'slate',
    features: ['Dashboard lengkap', 'View BKU (max 50 baris)', 'Cetak kwitansi (5x/bulan)', 'Preview kwitansi'],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 'Rp 100.000',
    duration: '/ tahun',
    icon: Shield,
    accent: 'blue',
    popular: true,
    features: [
      'Semua fitur Free',
      'View BKU unlimited',
      'Export Excel/PDF',
      'Cetak 30x/bulan',
      'BA Rekonsiliasi + Export',
      'SPTJM, K7, Register Kas',
      'Backup & Restore',
      'Auto Update',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'Rp 200.000',
    duration: '/ tahun',
    icon: Crown,
    accent: 'purple',
    features: [
      'Semua fitur Basic',
      'Bulk Export 12 bulan',
      'Export All-in-One',
      'Cetak unlimited',
      'Batch cetak unlimited',
      'Priority update',
      'Semua fitur tanpa batas',
    ],
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: 'Rp 500.000',
    duration: 'Sekali bayar',
    icon: Lock,
    accent: 'emerald',
    features: [
      'Semua fitur Pro',
      'Berlaku selamanya',
      'Tanpa perpanjangan',
      'Semua update mendatang',
      'Support prioritas',
      'Best value',
    ],
  },
];

const accentConfig = {
  slate: { iconBg: 'bg-slate-100 text-slate-600', ring: 'ring-slate-300', activeBadge: 'bg-slate-600', headerBg: 'bg-slate-50/50' },
  blue: { iconBg: 'bg-blue-100 text-blue-600', ring: 'ring-blue-300', activeBadge: 'bg-blue-600', headerBg: 'bg-blue-50/30' },
  purple: { iconBg: 'bg-purple-100 text-purple-600', ring: 'ring-purple-300', activeBadge: 'bg-purple-600', headerBg: 'bg-purple-50/30' },
  emerald: { iconBg: 'bg-emerald-100 text-emerald-600', ring: 'ring-emerald-300', activeBadge: 'bg-emerald-600', headerBg: 'bg-emerald-50/30' },
};

const tierColors = {
  free: { accent: 'text-slate-600', bg: 'bg-slate-50', label: 'Free Trial' },
  basic: { accent: 'text-blue-600', bg: 'bg-blue-50', label: 'Basic' },
  pro: { accent: 'text-purple-600', bg: 'bg-purple-50', label: 'Pro' },
  lifetime: { accent: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Lifetime' },
};

const TIER_ORDER = { free: 0, basic: 1, pro: 2, lifetime: 3 };

export default function LicenseScreen() {
  const { activate, deactivate, trial, tier, licensed, expiry, refresh } = useLicense();
  const [licenseKey, setLicenseKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [hwId, setHwId] = useState('-');
  const [recovering, setRecovering] = useState(false);
  const [recoveredKey, setRecoveredKey] = useState(null);
  const [storedKey, setStoredKey] = useState('');
  const pollingRef = useRef(null);

  useEffect(() => {
    if (window.arkas?.getHardwareId) {
      window.arkas.getHardwareId().then((r) => setHwId(r.id || '-')).catch(() => {});
    }
    if (window.arkas?.getStoredLicenseKey) {
      window.arkas.getStoredLicenseKey().then((r) => setStoredKey(r.key || '')).catch(() => {});
    }
  }, [licensed]);

  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!licenseKey.trim()) { setError('Masukkan license key'); return; }
    setActivating(true); setError(null); setSuccess(null);
    try {
      const result = await activate(licenseKey.trim());
      if (result.success) setSuccess(`License ${result.tier?.toUpperCase()} berhasil diaktifkan!`);
      else setError(result.error || 'Aktivasi gagal');
    } catch (err) { setError('Terjadi kesalahan: ' + err.message); }
    finally { setActivating(false); }
  };

  const handleBuy = async (buyTier) => {
    setError(null); setPaymentStatus('opening'); setCheckingPayment(true);
    try {
      if (window.arkas?.createPayment) {
        const result = await window.arkas.createPayment(buyTier);
        if (result.success) {
          setPendingOrderId(result.orderId);
          setPaymentStatus({ type: 'waiting', message: `Pembayaran Rp ${result.amount?.toLocaleString('id-ID')} dibuka di browser. Selesaikan pembayaran, lalu klik "Cek Status Pembayaran".`, amount: result.amount, orderId: result.orderId });
          startPolling();
        } else { setError(result.error || 'Gagal membuat transaksi'); setPaymentStatus(null); }
      } else {
        window.open(`${API_BASE}/buy?tier=${buyTier}`, '_blank');
        setPaymentStatus({ type: 'waiting', message: 'Selesaikan pembayaran di browser, lalu masukkan license key yang diberikan.' });
      }
    } catch (err) { setError('Gagal membuka pembayaran: ' + err.message); setPaymentStatus(null); }
    finally { setCheckingPayment(false); }
  };

  const startPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        if (window.arkas?.checkServerLicense) {
          const result = await window.arkas.checkServerLicense();
          if (result.active && result.licenseKey) {
            clearInterval(pollingRef.current); pollingRef.current = null;
            setPaymentStatus({ type: 'paid', message: 'Pembayaran berhasil! License key ditemukan.', licenseKey: result.licenseKey, tier: result.tier });
            setLicenseKey(result.licenseKey);
          }
        }
      } catch {}
    }, 5000);
  };

  const handleActivateFromPayment = async () => {
    if (!licenseKey) return;
    setActivating(true);
    try {
      const result = await activate(licenseKey);
      if (result.success) { setSuccess(`License ${result.tier?.toUpperCase()} berhasil diaktifkan!`); setPaymentStatus(null); setPendingOrderId(null); refresh(); }
      else setError(result.error || 'Aktivasi gagal');
    } catch (err) { setError('Terjadi kesalahan: ' + err.message); }
    finally { setActivating(false); }
  };

  const handleCheckPayment = async () => {
    setCheckingPayment(true);
    try {
      if (window.arkas?.checkServerLicense) {
        const result = await window.arkas.checkServerLicense();
        if (result.active && result.licenseKey) {
          setPaymentStatus({ type: 'paid', message: 'Pembayaran berhasil! License key ditemukan.', licenseKey: result.licenseKey, tier: result.tier });
          setLicenseKey(result.licenseKey);
        } else {
          setPaymentStatus((prev) => ({ ...prev, type: 'waiting', message: 'Pembayaran belum terdeteksi. Pastikan sudah selesai bayar, lalu coba lagi.' }));
        }
      }
    } catch (err) { setError('Gagal cek status: ' + err.message); }
    finally { setCheckingPayment(false); }
  };

  const handleRecoverKey = async () => {
    setRecovering(true);
    setRecoveredKey(null);
    setError(null);
    try {
      if (window.arkas?.checkServerLicense) {
        const result = await window.arkas.checkServerLicense();
        if (result.active && result.licenseKey) {
          setRecoveredKey(result.licenseKey);
          setLicenseKey(result.licenseKey);
        } else {
          setError('Tidak ada license aktif untuk NPSN ini di server.');
        }
      }
    } catch (err) {
      setError('Gagal cek server: ' + err.message);
    } finally {
      setRecovering(false);
    }
  };

  const trialDays = trial?.daysRemaining || 0;
  const currentTier = tier || 'free';
  const tc = tierColors[currentTier] || tierColors.free;
  const isActive = (planId) => {
    if (planId === 'free') return currentTier === 'free' && !licensed;
    return currentTier === planId && licensed;
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      {/* Page Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200">
          <KeyRound size={20} />
        </div>
        <div className="flex-1">
          <span className={theme.text.label}>MANAJEMEN LICENSE</span>
          <h2 className={theme.text.h2 + ' leading-tight'}>
            {licensed ? 'LISENSI AKTIF' : 'AKTIFKAN SMARTSPJ'}
          </h2>
        </div>
        {licensed ? (
          <span className={`${theme.badge.base} ${theme.badge.success}`}>
            <CheckCircle size={10} /> {tc.label} AKTIF
          </span>
        ) : !trial?.expired ? (
          <span className={`${theme.badge.base} ${theme.badge.warning}`}>
            <Zap size={10} /> TRIAL {trialDays} HARI
          </span>
        ) : (
          <span className={`${theme.badge.base} ${theme.badge.danger}`}>
            <AlertCircle size={10} /> EXPIRED
          </span>
        )}
      </div>

      {/* Status & Info */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
            <Shield size={12} className="text-blue-600" />
          </div>
          <h3 className={theme.text.h3}>Informasi Lisensi</h3>
        </div>
        <div className={`${theme.card} overflow-hidden`}>
          <div className={`p-4 border-b border-slate-100 ${tc.bg}`}>
            <p className="text-sm text-slate-700">
              {licensed && expiry ? (
                <>Paket <span className={`font-bold ${tc.accent}`}>{tc.label}</span> aktif sampai <span className="font-bold text-slate-800">{new Date(expiry).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span></>
              ) : trial && !trial.expired ? (
                <>Masa trial tersisa <span className="font-bold text-amber-600">{trialDays} hari</span></>
              ) : trial?.expired ? (
                <span className="text-red-600 font-medium">Trial 30 hari telah berakhir</span>
              ) : (
                'Belum ada license aktif'
              )}
            </p>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div>
                <span className={theme.text.label}>Tier</span>
                <div className={`font-bold text-sm mt-1 ${tc.accent}`}>{tc.label}</div>
              </div>
              <div>
                <span className={theme.text.label}>Status</span>
                <div className="font-semibold text-sm mt-1">
                  {licensed ? (
                    <span className="flex items-center gap-1 text-emerald-600"><CheckCircle size={13} /> Aktif</span>
                  ) : trial?.expired ? (
                    <span className="flex items-center gap-1 text-red-500"><AlertCircle size={13} /> Expired</span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-500"><Zap size={13} /> Trial ({trialDays} hari)</span>
                  )}
                </div>
              </div>
              <div>
                <span className={theme.text.label}>Berlaku Hingga</span>
                <div className="font-semibold text-sm mt-1 text-slate-800">
                  {currentTier === 'lifetime' && licensed
                    ? 'Selamanya'
                    : expiry
                      ? new Date(expiry).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                      : trial?.startDate
                        ? new Date(new Date(trial.startDate).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                        : '-'}
                </div>
              </div>
              <div>
                <span className={theme.text.label}>Device</span>
                <div className="font-mono text-xs text-slate-500 mt-1">{hwId}</div>
              </div>
              <div className="flex items-end">
                {licensed && (
                  <button
                    onClick={async () => {
                      if (!confirm('Yakin ingin menonaktifkan license? Anda perlu memasukkan key lagi untuk menggunakan fitur berbayar.')) return;
                      setDeactivating(true);
                      try { await deactivate(); } finally { setDeactivating(false); }
                    }}
                    disabled={deactivating}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition disabled:opacity-50"
                  >
                    {deactivating ? <Loader2 size={10} className="animate-spin" /> : <AlertCircle size={10} />}
                    {deactivating ? 'Memproses...' : 'Deactivate'}
                  </button>
                )}
              </div>
            </div>

            {!licensed && (
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg mt-4">
                <p className="text-xs text-amber-700 font-medium">
                  {trial?.expired
                    ? 'Trial 30 hari telah berakhir. Upgrade ke Basic atau Pro untuk melanjutkan.'
                    : `Trial berakhir dalam ${trialDays} hari. Upgrade untuk akses penuh.`}
                </p>
              </div>
            )}
            {licensed && storedKey && (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg mt-4">
                <span className={theme.text.label}>License Key</span>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs text-slate-600 select-all">{storedKey}</code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(storedKey); }}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition shrink-0"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Simpan key ini untuk aktivasi di device lain.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input & Buy */}
      {!licensed && (        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-blue-100 flex items-center justify-center">
              <Key size={12} className="text-blue-600" />
            </div>
            <h3 className={theme.text.h3}>Aktivasi License</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={theme.card}>
              <div className="p-4 border-b border-slate-100 bg-blue-50/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Key size={15} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Input License Key</h4>
                    <p className={theme.text.label}>Masukkan key yang sudah dibeli</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <form onSubmit={handleActivate} className="space-y-3">
                  <input
                    type="text"
                    value={licenseKey}
                    onChange={(e) => { setLicenseKey(e.target.value); setError(null); }}
                    placeholder="SMARTSPJ-XXXXX-XXXXX-XXXXX-XXXXX"
                    className={theme.input.base + ' font-mono w-full'}
                    disabled={activating}
                  />
                  {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-2.5 rounded-lg flex items-center gap-2">
                      <AlertCircle size={13} className="shrink-0" /> {error}
                    </div>
                  )}
                  {success && (
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs p-2.5 rounded-lg flex items-center gap-2">
                      <CheckCircle size={13} className="shrink-0" /> {success}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={activating || !licenseKey.trim()}
                    className={`${theme.gradient.primary} ${theme.gradient.primaryHover} w-full py-2.5 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 shadow-sm shadow-blue-200`}
                  >
                    {activating ? 'Memverifikasi...' : 'Aktifkan License'}
                  </button>
                  {recoveredKey && (
                    <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-lg space-y-1">
                      <p className="text-[10px] text-blue-600 font-bold">Key ditemukan di server:</p>
                      <code className="text-xs text-slate-800 break-all select-all">{recoveredKey}</code>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleRecoverKey}
                    disabled={recovering}
                    className="w-full py-2.5 text-slate-500 rounded-lg text-xs font-medium hover:text-blue-600 hover:bg-blue-50 transition disabled:opacity-50 flex items-center justify-center gap-1.5 border border-slate-200 hover:border-blue-200"
                  >
                    <Key size={12} />
                    {recovering ? 'Mencari...' : 'Lupa License Key?'}
                  </button>
                </form>
              </div>
            </div>

            <div className={theme.card}>
              <div className="p-4 border-b border-slate-100 bg-amber-50/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <ExternalLink size={15} className="text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Beli License Online</h4>
                    <p className={theme.text.label}>QRIS, transfer bank, e-wallet</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <p className={theme.text.body}>
                  Bayar via QRIS, transfer bank, atau e-wallet. License otomatis dikirim setelah pembayaran berhasil.
                </p>
                {paymentStatus?.type === 'waiting' && (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-amber-700 font-medium">
                      <Loader2 size={13} className="animate-spin" /> Menunggu pembayaran...
                    </div>
                    <p className={theme.text.subtle}>{paymentStatus.message}</p>
                    <button onClick={handleCheckPayment} disabled={checkingPayment}
                      className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-1">
                      {checkingPayment ? <><Loader2 size={12} className="animate-spin" /> Mengecek...</> : <><CheckCircle size={12} /> Cek Status Pembayaran</>}
                    </button>
                  </div>
                )}
                {paymentStatus?.type === 'paid' && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold"><CheckCircle size={14} /> Pembayaran Berhasil!</div>
                    <p className={theme.text.subtle}>{paymentStatus.message}</p>
                    <div className="bg-white rounded-lg p-2 border border-emerald-100">
                      <code className="text-xs text-slate-800 break-all">{paymentStatus.licenseKey}</code>
                    </div>
                    <button onClick={handleActivateFromPayment} disabled={activating}
                      className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50">
                      {activating ? 'Mengaktifkan...' : 'Aktifkan Sekarang'}
                    </button>
                  </div>
                )}
                {(!paymentStatus || paymentStatus.type === 'opening') && (
                  <div className="space-y-2">
                    <button onClick={() => handleBuy('basic')} disabled={checkingPayment}
                      className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                      <Shield size={14} /> Beli Basic — Rp 100.000/tahun
                    </button>
                    <button onClick={() => handleBuy('pro')} disabled={checkingPayment}
                      className="w-full py-2.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                      <Crown size={14} /> Beli Pro — Rp 200.000/tahun
                    </button>
                    <button onClick={() => handleBuy('lifetime')} disabled={checkingPayment}
                      className="w-full py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                      <Lock size={14} /> Beli Lifetime — Rp 500.000
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plans */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center">
            <Crown size={12} className="text-indigo-600" />
          </div>
          <h3 className={theme.text.h3}>Bandingkan Paket</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
          {PLANS.map((plan) => {
            const active = isActive(plan.id);
            const canUpgrade = licensed && !active && (TIER_ORDER[plan.id] || 0) > (TIER_ORDER[currentTier] || 0);
            const Icon = plan.icon;
            const ac = accentConfig[plan.accent];
            return (
              <div key={plan.id}
                className={`bg-white rounded-xl border border-slate-200 shadow-sm relative pt-2 ${active ? `ring-2 ring-offset-1 ${ac.ring}` : ''}`}>
                {active && (
                  <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 ${ac.activeBadge} text-white text-[10px] font-bold rounded-full flex items-center gap-1 z-10`}>
                    <CheckCircle size={10} /> AKTIF
                  </div>
                )}
                {!active && plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full z-10">
                    POPULER
                  </div>
                )}
                <div className={`px-4 py-3 border-b border-slate-100 ${ac.headerBg} flex items-center gap-2.5`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${ac.iconBg}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm">{plan.name}</h4>
                    <p className={theme.text.label}>{plan.duration}</p>
                  </div>
                  {active && plan.id !== 'free' && (
                    <span className={`${theme.badge.base} ${theme.badge.success}`}>Aktif</span>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-lg font-bold text-slate-800 mb-3">{plan.price}</div>
                  <ul className="space-y-1.5">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                        <CheckCircle size={11} className="text-emerald-500 shrink-0 mt-0.5" /> {f}
                      </li>
                    ))}
                  </ul>
                  {active && plan.id === 'free' && !trial?.expired && (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-center">
                      <span className="text-[11px] text-amber-600 font-semibold">Sisa {trialDays} hari trial</span>
                    </div>
                  )}
                  {active && plan.id === 'free' && trial?.expired && (
                    <div className="mt-3 pt-3 border-t border-red-100 text-center">
                      <span className="text-[11px] text-red-500 font-semibold">Trial expired</span>
                    </div>
                  )}
                  {canUpgrade && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleBuy(plan.id)}
                        className="w-full py-1.5 bg-blue-600 text-white rounded-lg text-[11px] font-bold hover:bg-blue-700 transition flex items-center justify-center gap-1"
                      >
                        <Crown size={11} /> Upgrade ke {plan.name}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-center text-[10px] text-slate-400 pt-1 pb-4">
        SmartSPJ v1.7.3 · License perangkat (1 key = 1 device)
      </div>
    </div>
  );
}
