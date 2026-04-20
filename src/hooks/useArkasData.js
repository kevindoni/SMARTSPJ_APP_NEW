import { useState, useEffect } from 'react';
import { useFilter } from '../context/FilterContext';

const isElectron = typeof window !== 'undefined' && window.arkas;

export function useArkasData() {
  const { year, fundSource } = useFilter();
  const [dbStatus, setDbStatus] = useState({ loading: true, success: false, message: '' });
  const [school, setSchool] = useState(null);
  const [stats, setStats] = useState(null);
  const [availableSources, setAvailableSources] = useState([]);
  const [availableYears, setAvailableYears] = useState([new Date().getFullYear()]);

  useEffect(() => {
    if (!isElectron) {
      setDbStatus({ loading: false, success: false, message: 'Jalankan melalui aplikasi Electron untuk mengakses database ARKAS.' });
      return;
    }

    let cancelled = false;

    async function fetchData() {
      try {
        setDbStatus((prev) => ({ ...prev, loading: true }));

        const conn = await window.arkas.checkConnection();
        if (cancelled) return;

        setDbStatus({
          loading: false,
          success: conn.success,
          message: conn.success ? 'Terhubung Dengan Arkas' : conn.message,
        });

        if (conn.success) {
          const schoolInfo = await window.arkas.getSchoolInfo();
          if (!cancelled && schoolInfo.success) setSchool(schoolInfo.data);

          const yearsRes = await window.arkas.getAvailableYears();
          if (!cancelled && yearsRes.success && yearsRes.data.length > 0) setAvailableYears(yearsRes.data);

          const sources = await window.arkas.getFundSources(year);
          if (!cancelled && sources.success) setAvailableSources(sources.data);

          const dashStats = await window.arkas.getDashboardStats(year, fundSource);
          if (!cancelled && dashStats.success) setStats(dashStats.data);
        }
      } catch (err) {
        if (!cancelled) setDbStatus({ loading: false, success: false, message: err.message });
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [year, fundSource]);

  return { dbStatus, school, stats, availableSources, availableYears, isElectron };
}