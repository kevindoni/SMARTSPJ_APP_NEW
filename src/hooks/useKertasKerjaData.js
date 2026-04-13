import { useState, useEffect } from 'react';
import { useFilter } from '../context/FilterContext';

export function useKertasKerjaData(selectedFormat, selectedMonth, searchTerm) {
  const { year, fundSource } = useFilter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isMonthly = selectedFormat.toLowerCase().includes('bulanan');
  const isQuarterly =
    selectedFormat.toLowerCase().includes('triwulan') ||
    selectedFormat.toLowerCase().includes('tahapan');
  const isLembar = selectedFormat.toLowerCase().includes('lembar');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (fundSource === 'SEMUA') {
      setData([]);
      setLoading(false);
      return;
    }
    fetchData();
  }, [year, fundSource]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (window.arkas && window.arkas.getKertasKerja) {
        const result = await window.arkas.getKertasKerja(year, fundSource);
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Gagal mengambil data Kertas Kerja');
        }
      } else {
        setError('API Kertas Kerja belum tersedia. Harap restart aplikasi.');
      }
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  // --- Processing Logic ---
  const processedData = data
    .map((item) => {
      // Clone item
      const newItem = { ...item };

      // Month Mapping
      const monthMap = {
        Januari: 1,
        Februari: 2,
        Maret: 3,
        April: 4,
        Mei: 5,
        Juni: 6,
        Juli: 7,
        Agustus: 8,
        September: 9,
        Oktober: 10,
        November: 11,
        Desember: 12,
      };

      // Reset volumes
      for (let i = 1; i <= 12; i++) newItem[`v${i}`] = 0;

      try {
        // STRATEGY 1: New String Format (volumes_str)
        if (item.volumes_str) {
          const parts = item.volumes_str.split('|');
          parts.forEach((part) => {
            const [blnRaw, volRaw] = part.split(':');
            if (blnRaw && volRaw) {
              const bln = blnRaw.trim();
              // Normalize (Capital First)
              const blnNorm = bln.charAt(0).toUpperCase() + bln.slice(1).toLowerCase();
              const idx = monthMap[bln] || monthMap[blnNorm];
              if (idx) newItem[`v${idx}`] += parseFloat(volRaw);
            }
          });
        }
        // STRATEGY 2: Legacy JSON Format (volumes) - Fallback
        else if (item.volumes) {
          const volObj = JSON.parse(item.volumes);
          Object.keys(volObj).forEach((k) => {
            const idx = monthMap[k];
            if (idx) newItem[`v${idx}`] = parseFloat(volObj[k]);
          });
        }
      } catch (_e) { /* Parse error ignored - data fallback handled */ }

      // If Monthly: Override Volume/Total
      if (isMonthly) {
        const volMonth = newItem[`v${selectedMonth}`] || 0;
        newItem.volume = volMonth;
        newItem.total = volMonth * newItem.harga_satuan;
        newItem._hidden = volMonth === 0;
      } else {
        newItem._hidden = false;
      }
      return newItem;
    })
    .filter((item) => {
      // 1. Monthly Filter
      if (isMonthly && item._hidden) return false;

      // 2. Search Filter
      if (!searchTerm) return true;
      const low = searchTerm.toLowerCase();
      return (
        (item.nama_kegiatan || '').toLowerCase().includes(low) ||
        (item.nama_barang || '').toLowerCase().includes(low) ||
        (item.kode_rekening || '').toLowerCase().includes(low)
      );
    });

  return {
    data,
    processedData,
    loading,
    error,
    fetchData,
    isMonthly,
    isQuarterly,
    isLembar,
    year,
    fundSource,
  };
}
