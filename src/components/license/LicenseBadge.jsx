import { Shield, Crown, Zap } from 'lucide-react';
import { useLicense } from '../../context/LicenseContext';

const TIER_CONFIG = {
  free: { icon: Zap, bg: 'bg-slate-100', text: 'text-slate-600', label: 'Trial' },
  basic: { icon: Shield, bg: 'bg-blue-100', text: 'text-blue-700', label: 'Basic' },
  pro: { icon: Crown, bg: 'bg-purple-100', text: 'text-purple-700', label: 'Pro' },
};

export default function LicenseBadge({ compact }) {
  const { tier, licensed, trial, loading } = useLicense();

  if (loading) return null;

  const config = TIER_CONFIG[tier] || TIER_CONFIG.free;
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${config.bg} ${config.text}`}>
        <Icon size={10} />
        {config.label}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${config.bg} ${config.text}`}>
      <Icon size={12} />
      {config.label}
      {tier === 'free' && trial && !trial.expired && (
        <span className="font-normal opacity-70">({trial.daysRemaining}h)</span>
      )}
      {tier === 'free' && trial?.expired && (
        <span className="text-red-500">Expired</span>
      )}
    </div>
  );
}
