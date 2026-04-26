import { useLicense } from '../../context/LicenseContext';
import { Lock } from 'lucide-react';

export default function LicenseGate({ feature, children, fallback }) {
  const { licensed, tier, loading } = useLicense();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!feature) return children;

  if (tier === 'pro') return children;

  const basicAllowed = [
    'view_bku', 'view_bku_full', 'export_bku', 'cetak_kwitansi', 'batch_cetak',
    'nota_group', 'ba_rekons_view', 'ba_rekons_export', 'rekon_bank',
    'sptjm', 'laporan_k7', 'register_kas', 'pajak_manual', 'backup_restore', 'auto_update',
  ];

  if (tier === 'basic' && basicAllowed.includes(feature)) return children;

  const freeAllowed = ['view_bku', 'ba_rekons_view', 'cetak_kwitansi'];
  if (tier === 'free' && freeAllowed.includes(feature)) return children;

  if (fallback) return fallback;

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-8">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
        <Lock size={24} className="text-blue-500" />
      </div>
      <h3 className="font-bold text-slate-700 mb-1">Fitur Terkunci</h3>
      <p className="text-xs text-slate-500 mb-4 max-w-sm">
        Fitur ini memerlukan license {tier === 'free' ? 'Basic atau Pro' : 'Pro'}.
        Upgrade untuk mengakses semua fitur.
      </p>
      <button
        onClick={() => {
          if (window.arkas?.showLicenseScreen) window.arkas.showLicenseScreen();
        }}
        className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-sm"
      >
        Upgrade Sekarang
      </button>
    </div>
  );
}
