import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LicenseContext = createContext(null);

const TIER_LABELS = {
  free: { label: 'Free Trial', color: 'bg-slate-100 text-slate-600', icon: 'shield' },
  basic: { label: 'Basic', color: 'bg-blue-100 text-blue-700', icon: 'shield-check' },
  pro: { label: 'Pro', color: 'bg-purple-100 text-purple-700', icon: 'crown' },
  lifetime: { label: 'Lifetime', color: 'bg-emerald-100 text-emerald-700', icon: 'lock' },
};

export function LicenseProvider({ children }) {
  const [status, setStatus] = useState({
    licensed: false,
    tier: 'free',
    expiry: null,
    npsn: null,
    expired: false,
    trialActive: true,
    trial: null,
    loading: true,
  });

  const refresh = useCallback(async () => {
    if (window.arkas?.getLicenseStatus) {
      try {
        const result = await window.arkas.getLicenseStatus();
        setStatus({ ...result, loading: false });
      } catch {
        setStatus((prev) => ({ ...prev, loading: false }));
      }
    } else {
      setStatus({ licensed: false, tier: 'free', loading: false, trialActive: true });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activate = useCallback(async (key) => {
    if (!window.arkas?.activateLicense) return { success: false, error: 'API tidak tersedia' };
    const result = await window.arkas.activateLicense(key);
    if (result.success) await refresh();
    return result;
  }, [refresh]);

  const deactivate = useCallback(async () => {
    if (!window.arkas?.deactivateLicense) return { success: false, error: 'API tidak tersedia' };
    const result = await window.arkas.deactivateLicense();
    if (result.success) await refresh();
    return result;
  }, [refresh]);

  const checkFeature = useCallback((feature) => {
    if (!window.arkas?.checkLicenseFeature) return { can: true };
    return window.arkas.checkLicenseFeature(feature);
  }, []);

  const value = {
    ...status,
    tierLabel: TIER_LABELS[status.tier] || TIER_LABELS.free,
    activate,
    deactivate,
    checkFeature,
    refresh,
  };

  return <LicenseContext.Provider value={value}>{children}</LicenseContext.Provider>;
}

export function useLicense() {
  const ctx = useContext(LicenseContext);
  if (!ctx) throw new Error('useLicense must be used within LicenseProvider');
  return ctx;
}

export { TIER_LABELS };
