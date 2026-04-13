import { useState, useEffect } from 'react';
import { useFilter } from '../context/FilterContext';

export function useArkasData() {
  const { year, fundSource } = useFilter(); // Ambil dari global context
  const [dbStatus, setDbStatus] = useState({ loading: true, success: false, message: '' });
  const [school, setSchool] = useState(null);
  const [stats, setStats] = useState(null);
  const [availableSources, setAvailableSources] = useState([]);
  const [availableYears, setAvailableYears] = useState([2025]); // Default sebelum load

  useEffect(() => {
    async function fetchData() {
      try {
        setDbStatus((prev) => ({ ...prev, loading: true }));

        // Cek Koneksi
        const conn = await window.arkas.checkConnection();
        setDbStatus({
          loading: false,
          success: conn.success,
          message: conn.success ? `Terhubung Dengan Arkas (${conn.count} tx)` : conn.message,
        });

        if (conn.success) {
          // Info Sekolah
          const schoolInfo = await window.arkas.getSchoolInfo();
          if (schoolInfo.success) setSchool(schoolInfo.data);

          // Ambil Tahun Tersedia (Dinamis)
          const yearsRes = await window.arkas.getAvailableYears();
          if (yearsRes.success && yearsRes.data.length > 0) {
            setAvailableYears(yearsRes.data);
          }

          // Ambil Sumber Dana yg tersedia di tahun ini
          const sources = await window.arkas.getFundSources(year);
          if (sources.success) setAvailableSources(sources.data);

          // Dashboard Stats (Filtered)
          const dashStats = await window.arkas.getDashboardStats(year, fundSource);
          if (dashStats.success) setStats(dashStats.data);
        }
      } catch (err) {
        setDbStatus({ loading: false, success: false, message: err.message });
      }
    }

    fetchData();
  }, [year, fundSource]);

  return { dbStatus, school, stats, availableSources, availableYears };
}
