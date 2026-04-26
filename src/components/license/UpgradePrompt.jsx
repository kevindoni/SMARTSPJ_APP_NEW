import { X, Shield, Crown, ExternalLink } from 'lucide-react';
import { useLicense } from '../../context/LicenseContext';

export default function UpgradePrompt({ isOpen, onClose, feature, requiredTier }) {
  const { tier } = useLicense();

  if (!isOpen) return null;

  const targetTier = requiredTier || (tier === 'free' ? 'basic' : 'pro');
  const isPro = targetTier === 'pro';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div
          className={`p-5 text-white ${
            isPro
              ? 'bg-gradient-to-r from-purple-600 to-purple-700'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPro ? <Crown size={20} /> : <Shield size={20} />}
              <h3 className="font-bold">Upgrade ke {targetTier.toUpperCase()}</h3>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition">
              <X size={18} />
            </button>
          </div>
          <p className="text-white/80 text-xs mt-2">
            {feature
              ? `Fitur "${feature}" memerlukan license ${targetTier.toUpperCase()}`
              : `Dapatkan akses penuh ke semua fitur SmartSPJ`}
          </p>
        </div>

        <div className="p-5 space-y-3">
          <div className="text-sm text-slate-600">
            {isPro ? (
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-500">+</span> Bulk Export 12 bulan
                </li>
                <li className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-500">+</span> Export All-in-One Excel
                </li>
                <li className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-500">+</span> Cetak unlimited
                </li>
                <li className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-500">+</span> Priority update
                </li>
              </ul>
            ) : (
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-500">+</span> Export Excel/PDF
                </li>
                <li className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-500">+</span> BA Rekonsiliasi + Export
                </li>
                <li className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-500">+</span> SPTJM, K7, Register Kas
                </li>
                <li className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-500">+</span> Backup & Restore
                </li>
              </ul>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                if (window.arkas?.openPaymentPage) {
                  window.arkas.openPaymentPage(targetTier);
                } else {
                  window.open('https://smartspj.id/buy', '_blank');
                }
                onClose();
              }}
              className={`flex-1 py-2.5 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                isPro
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <ExternalLink size={13} />
              Beli {targetTier.toUpperCase()}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition"
            >
              Nanti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
