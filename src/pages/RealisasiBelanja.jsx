import React, { useState, useEffect } from 'react';
import {
  List,
  AlertCircle,
  TrendingUp,
  BarChart3,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Clock,
  ChevronRight,
  GitCompare,
} from 'lucide-react';
import { useFilter } from '../context/FilterContext';
import { useArkasData } from '../hooks/useArkasData';
import { formatRupiah } from '../utils/transactionHelpers';
import { REALISASI_MONTHS, parsePlannedMonths } from '../utils/realisasiHelpers';
import { theme } from '../theme';

export default function RealisasiBelanja() {
  const { year, fundSource } = useFilter();
  const { stats } = useArkasData();
  const [viewMode, setViewMode] = useState('summary'); // summary | detail
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = Kumulatif
  const [items, setItems] = useState([]);
  const [annualPagu, setAnnualPagu] = useState(0);
  const [cumulativeRealisasi, setCumulativeRealisasi] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Use imported months constant
  const months = REALISASI_MONTHS;

  // parsePlannedMonths and getShiftInfo are now imported from realisasiHelpers.js

  useEffect(() => {
    if (fundSource !== 'SEMUA') {
      fetchData();
    }
  }, [year, fundSource, selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetching budget realization data
      if (window.arkas && window.arkas.getBudgetRealization) {
        const res = await window.arkas.getBudgetRealization(year, fundSource, selectedMonth);
        if (res.success) {
          setItems(res.data);
          setAnnualPagu(res.annualPagu || 0);
          setCumulativeRealisasi(res.cumulativeRealisasi || 0);
        } else {
          setError(res.error || 'Gagal mengambil data realisasi');
        }
      } else {
        setError('API getBudgetRealization tidak ditemukan');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  if (fundSource === 'SEMUA') {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="text-blue-600" size={24} />
            Realisasi Belanja
          </h2>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <AlertCircle size={48} className="text-amber-500 mb-4" />
          <h3 className="text-amber-800 font-bold text-xl mb-2">Pilih Sumber Dana Spesifik</h3>
          <p className="text-amber-700 max-w-md">
            Untuk melihat rincian realisasi belanja, mohon{' '}
            <strong>pilih salah satu Sumber Dana</strong> pada menu filter di pojok kanan atas.
          </p>
        </div>
      </div>
    );
  }

  // Helper to group by activity for summary view
  const activities = items.reduce((acc, current) => {
    const key = current.kode_kegiatan;
    if (!acc[key]) {
      acc[key] = {
        kode: current.kode_kegiatan,
        nama: current.nama_kegiatan,
        anggaran: 0,
        realisasi: 0,
        vol_pagu: 0,
        vol_realisasi: 0,
        vol_realisasi_kumulatif: 0,
        units: new Set(),
        rekenings: [],
      };
    }
    acc[key].anggaran += current.total_anggaran || 0;
    acc[key].realisasi += current.total_realisasi || 0;
    acc[key].vol_pagu += current.total_volume_pagu || 0;
    acc[key].vol_realisasi += current.total_volume_realisasi || 0;
    acc[key].vol_realisasi_kumulatif += current.cumulative_volume_realisasi || 0;
    if (current.satuan) acc[key].units.add(current.satuan);
    acc[key].rekenings.push(current);
    return acc;
  }, {});

  const sortedActivities = Object.values(activities).sort((a, b) => a.kode.localeCompare(b.kode));

  // Calculate internal totals to ensure consistency between cards and table
  const totalPaguInternal = items.reduce((sum, item) => sum + (item.total_anggaran || 0), 0);
  const totalRealisasiInternal = items.reduce((sum, item) => sum + (item.total_realisasi || 0), 0);
  const totalSisaInternal = totalPaguInternal - totalRealisasiInternal;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 pb-12">
      {/* Header / Toolbar */}
      <div
        className={`${theme.card} p-4 flex flex-col md:flex-row justify-between items-center gap-4`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className={theme.text.label}>PENGANGGARAN</span>
            <h2 className={theme.text.h2}>Realisasi Belanja - {fundSource}</h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <span className={theme.text.label}>Periode:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className={theme.input.select}
            >
              {months.map((m) => (
                <option key={m.v} value={m.v}>
                  {m.n}
                </option>
              ))}
            </select>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg gap-0.5">
            <button
              onClick={() => {
                setViewMode('summary');
                setExpandedRows(new Set());
              }}
              className={`${theme.button.base} ${viewMode === 'summary' ? theme.button.active : theme.button.ghost}`}
            >
              <BarChart3 size={14} /> Ringkasan
            </button>
            <button
              onClick={() => setViewMode('detail')}
              className={`${theme.button.base} ${viewMode === 'detail' ? theme.button.active : theme.button.ghost}`}
            >
              <List size={14} /> Rincian
            </button>
            <button
              onClick={() => {
                setViewMode('comparison');
                setExpandedRows(new Set());
              }}
              className={`${theme.button.base} ${viewMode === 'comparison' ? theme.button.active : theme.button.ghost}`}
            >
              <GitCompare size={14} /> RKAS vs Realisasi
            </button>
          </div>
        </div>
      </div>

      {/* Standard Stats Banner */}
      {viewMode !== 'control' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div
            className={`${theme.card} border-l-4 border-l-slate-400 p-5 flex items-center justify-between`}
          >
            <div>
              <div className={theme.text.label}>Total Pagu Alokasi</div>
              <div className="text-xl font-bold text-slate-800">{formatRupiah(annualPagu)}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 text-slate-400">
              <List size={20} />
            </div>
          </div>

          <div className={`${theme.card} border-l-4 border-l-red-500 p-5`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className={`${theme.text.label} text-red-500`}>Realisasi Belanja</div>
                <div className="text-xl font-bold text-slate-800">
                  {formatRupiah(totalRealisasiInternal)}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-red-50 text-red-500">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-lg overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all"
                style={{ width: `${annualPagu > 0 ? Math.min(100, (totalRealisasiInternal / annualPagu) * 100) : 0}%` }}
              ></div>
            </div>
          </div>

          <div
            className={`${theme.card} border-l-4 border-l-emerald-500 p-5 flex items-center justify-between`}
          >
            <div>
              <div className={`${theme.text.label} text-emerald-500`}>Sisa Anggaran</div>
              <div
                className={`text-xl font-bold tracking-tight ${annualPagu - totalRealisasiInternal < 0 ? 'text-red-700' : 'text-slate-800'}`}
              >
                {formatRupiah(annualPagu - totalRealisasiInternal)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-500">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className={`${theme.card} p-24 flex flex-col items-center justify-center`}>
          <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
          <p className="text-slate-500 font-bold">Menghitung Volume & Realisasi...</p>
        </div>
      ) : items.length === 0 ? (
        <div className={`${theme.card} p-24 flex flex-col items-center justify-center text-center`}>
          <AlertCircle size={48} className="text-slate-200 mb-4" />
          <h3 className={theme.text.h2}>Tidak ada data untuk periode ini</h3>
          <p className={`${theme.text.subtle} max-w-sm mt-2`}>
            {selectedMonth === 0
              ? 'Pastikan Kertas Kerja sudah disahkan dan BKU sudah diisi.'
              : `Belum ada transaksi BKU yang tercatat pada bulan ${months.find((m) => m.v === selectedMonth)?.n}.`}
          </p>
        </div>
      ) : (
        <div
          className={`${theme.card} overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500`}
        >
          <div className={theme.cardHeader}>
            <h3 className={theme.text.h3}>
              {viewMode === 'summary'
                ? 'RINGKASAN REALISASI'
                : viewMode === 'detail'
                  ? 'RINCIAN REALISASI'
                  : 'RKAS vs REALISASI'}
            </h3>
            <div className="flex gap-2">
              <span className={theme.badge.info}>Tahun {year}</span>
              <span className={theme.badge.neutral}>{fundSource}</span>
            </div>
          </div>

          {viewMode !== 'control' && (
            <div className={theme.table.wrapper}>
              <table className={theme.table.root}>
                <thead className={theme.table.thead}>
                  {viewMode === 'comparison' ? (
                    <tr>
                      <th className={`${theme.table.th} w-[5%]`}>NO</th>
                      <th className={`${theme.table.th} w-[35%]`}>Item Belanja</th>
                      <th className={`${theme.table.th} w-[15%] text-center`}>Target RKAS</th>
                      <th className={`${theme.table.th} w-[15%] text-center`}>Laporan BKU</th>
                      <th className={`${theme.table.th} w-[20%] text-center`}>Keterangan</th>
                      <th className={`${theme.table.th} w-[10%] text-center`}>Aksi</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className={`${theme.table.th} text-center w-[4%]`}>No</th>
                      <th className={`${theme.table.th} text-center w-[7%]`}>Program</th>
                      <th className={`${theme.table.th} w-[14%]`}>Kegiatan</th>
                      <th className={`${theme.table.th} w-[14%]`}>Rekening Belanja</th>
                      <th className={`${theme.table.th} w-[18%]`}>Uraian / Barang</th>
                      <th className={`${theme.table.th} text-center w-[6%]`}>Anggar</th>
                      <th className={`${theme.table.th} text-center w-[6%]`}>Real</th>
                      <th className={`${theme.table.th} text-center w-[5%]`}>Sat</th>
                      <th className={`${theme.table.th} text-right w-[10%]`}>Harga</th>
                      <th className={`${theme.table.th} text-right w-[10%]`}>Total</th>
                      <th className={`${theme.table.th} text-center w-[9%]`}>Sts</th>
                    </tr>
                  )}
                </thead>
                <tbody className={theme.table.tbody}>
                  {viewMode === 'comparison'
                    ? items.map((item, idx) => {
                        const planVol = item.target_volume_bulan || 0;
                        const realVol = item.total_volume_realisasi || 0;
                        const planAmount = item.target_anggaran_bulan || 0;
                        const realAmount = item.total_realisasi || 0;
                        const selisihAmount = planAmount - realAmount;

                        let gapStatus = 'Sesuai Target';
                        let gapColor = theme.badge.success;
                        let statusIcon = <CheckCircle2 size={12} />;

                        if (planVol > 0 && realVol === 0) {
                          const isCoveredByOtherMonth =
                            (item.cumulative_realisasi || 0) >= (item.cumulative_pagu || 0);
                          if (isCoveredByOtherMonth) {
                            gapStatus = 'Terbayar (Rapel)';
                            gapColor = theme.badge.info;
                            statusIcon = <ArrowRight size={12} />;
                          } else {
                            gapStatus = 'Belum Terealisasi';
                            gapColor = theme.badge.warning;
                            statusIcon = <Clock size={12} />;
                          }
                        } else if (planVol === 0 && realVol > 0) {
                          gapStatus = 'Realisasi Geser Bulan';
                          gapColor = theme.badge.primary;
                          statusIcon = <GitCompare size={12} />;
                        } else if (realAmount > planAmount) {
                          const isOverPagu =
                            (item.cumulative_realisasi || 0) > (item.total_anggaran || 0);
                          if (isOverPagu) {
                            gapStatus = 'Melampaui Pagu';
                            gapColor = theme.badge.danger;
                            statusIcon = <AlertCircle size={12} />;
                          } else {
                            gapStatus = 'Akumulatif';
                            gapColor = theme.badge.primary;
                            statusIcon = <TrendingUp size={12} />;
                          }
                        } else if (realVol < planVol && realVol > 0) {
                          gapStatus = 'Parsial';
                          gapColor = theme.badge.info;
                          statusIcon = <BarChart3 size={12} />;
                        }

                        return (
                          <tr key={idx} className={theme.table.tr}>
                            <td
                              className={`${theme.table.tdCenter} font-mono font-bold text-slate-800`}
                            >
                              {idx + 1}
                            </td>
                            <td className={theme.table.td}>
                              <div className="font-bold text-slate-800 text-xs mb-0.5">
                                {item.nama_barang}
                              </div>
                              <div className={`${theme.text.subtle} font-medium line-clamp-2`}>
                                {item.nama_rekening}
                              </div>
                            </td>
                            <td className={`${theme.table.tdCenter} bg-slate-50/50`}>
                              <div className="font-bold text-slate-700 text-xs">
                                {planVol} {item.satuan}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {formatRupiah(planAmount)}
                              </div>
                            </td>
                            <td className={theme.table.tdCenter}>
                              <div
                                className={`font-bold text-xs ${realVol > 0 ? 'text-emerald-700' : 'text-slate-400'}`}
                              >
                                {realVol} {item.satuan}
                              </div>
                              <div
                                className={`text-[10px] ${realVol > 0 ? 'text-emerald-500' : 'text-slate-400'}`}
                              >
                                {formatRupiah(realAmount)}
                              </div>
                            </td>
                            <td className={theme.table.tdCenter}>
                              <span className={`${theme.badge.base} ${gapColor}`}>
                                {statusIcon} {gapStatus}
                              </span>
                            </td>
                            <td className={theme.table.tdCenter}>
                              <button
                                onClick={() => setSelectedPlan(item)}
                                className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-blue-600 text-xs font-bold hover:bg-blue-50 hover:border-blue-300 shadow-sm transition-all"
                              >
                                Detail
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    : (viewMode === 'summary' ? sortedActivities : items).map((item, idx) => {
                        const isSummary = viewMode === 'summary';
                        const prog = ((item.kode || item.kode_kegiatan) || '').split('.')[0];

                        const vPagu = isSummary ? item.vol_pagu : item.total_volume_pagu;
                        const vCumReal = isSummary
                          ? item.vol_realisasi_kumulatif
                          : item.cumulative_volume_realisasi || 0;
                        const vMonthReal = isSummary
                          ? item.vol_realisasi
                          : item.total_volume_realisasi || 0;

                        const sisaVolTotal = vPagu - vCumReal;
                        const isSelesai = sisaVolTotal <= 0;
                        const monthName =
                          selectedMonth === 0
                            ? 'Kumulatif'
                            : months.find((m) => m.v === selectedMonth)?.n;

                        const unitLabel = isSummary
                          ? item.units.size === 1
                            ? Array.from(item.units)[0]
                            : 'Item'
                          : item.satuan || 'Item';
                        const isExpanded = isSummary && expandedRows.has(item.kode);

                        return (
                          <React.Fragment key={isSummary ? `sum-${item.kode}` : `det-${idx}`}>
                            <tr
                              onClick={() => isSummary && toggleRow(item.kode)}
                              className={`${theme.table.tr} cursor-pointer ${isSelesai ? 'bg-slate-50/50' : ''}`}
                            >
                              <td
                                className={`${theme.table.tdCenter} font-bold text-slate-800 w-12`}
                              >
                                {idx + 1}
                              </td>
                              <td
                                className={`${theme.table.tdCenter} font-mono font-bold text-slate-500`}
                              >
                                {prog}.
                              </td>
                              <td className={theme.table.td}>
                                <div className="flex items-center gap-2">
                                  {isSummary && (
                                    <div
                                      className={`shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                    >
                                      <ChevronRight size={14} className="text-slate-400" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-bold text-blue-600 mb-0.5 whitespace-nowrap">
                                      {item.kode || item.kode_kegiatan}
                                    </div>
                                    <div className={`${theme.text.subtle} line-clamp-1`}>
                                      {item.nama || item.nama_kegiatan}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className={theme.table.td}>
                                <div
                                  className={`font-bold leading-tight ${isSummary ? 'text-blue-700 group-hover:underline' : 'text-slate-600'}`}
                                >
                                  {isSummary
                                    ? `${new Set(item.rekenings.map((r) => r.kode_rekening)).size} Rekening Belanja`
                                    : item.nama_rekening || item.kode_rekening}
                                </div>
                              </td>
                              <td className={`${theme.table.td} font-bold text-slate-700`}>
                                {isSummary ? 'Total Akumulasi Kegiatan' : item.nama_barang || '-'}
                              </td>
                              <td
                                className={`${theme.table.tdCenter} font-bold text-slate-600 bg-slate-50/50`}
                              >
                                {vPagu}
                              </td>
                              <td
                                className={`${theme.table.tdCenter} font-bold bg-slate-50/50 ${vMonthReal > 0 ? 'text-red-500' : 'text-slate-300'}`}
                              >
                                {vMonthReal}
                              </td>
                              <td className={`${theme.table.tdCenter} text-slate-400 italic`}>
                                {isSummary
                                  ? item.units.size === 1
                                    ? Array.from(item.units)[0]
                                    : item.units.size > 1
                                      ? 'Multi'
                                      : '-'
                                  : item.satuan || '-'}
                              </td>
                              <td className={theme.table.tdNumber}>
                                {formatRupiah(
                                  isSummary
                                    ? item.anggaran / (item.vol_pagu || 1)
                                    : item.harga_satuan || 0
                                )}
                              </td>
                              <td className={`${theme.table.tdNumber} font-bold text-slate-700`}>
                                {formatRupiah(
                                  isSummary ? item.realisasi : item.total_realisasi || 0
                                )}
                              </td>
                              <td className={theme.table.tdCenter}>
                                <div className="flex flex-col items-center gap-0.5">
                                  <span
                                    className={`${theme.badge.base} ${isSelesai ? theme.badge.neutral : vCumReal > 0 ? theme.badge.info : theme.badge.success}`}
                                  >
                                    {isSelesai ? (
                                      'Selesai'
                                    ) : (
                                      <span className="flex items-center gap-1">
                                        <span>SISA</span>
                                        <span className="font-extrabold text-[10px]">
                                          {vCumReal > 0 ? sisaVolTotal : vPagu}
                                        </span>
                                        <span>{unitLabel}</span>
                                      </span>
                                    )}
                                  </span>
                                  <span className={`${theme.text.subtle} font-medium italic`}>
                                    {monthName}
                                  </span>
                                </div>
                              </td>
                            </tr>

                            {isExpanded &&
                              (() => {
                                // Grouping identical items to prevent 'double' display
                                const groupedMap = new Map();
                                item.rekenings.forEach((sub) => {
                                  // Ensure matching criteria
                                  const key = `${sub.kode_rekening}|${sub.nama_barang}|${sub.harga_satuan}`;
                                  if (!groupedMap.has(key)) {
                                    groupedMap.set(key, { ...sub });
                                  } else {
                                    const existing = groupedMap.get(key);
                                    // Aggregate Vol & Amounts
                                    existing.total_volume_pagu =
                                      (existing.total_volume_pagu || 0) +
                                      (sub.total_volume_pagu || 0);
                                    existing.total_volume_realisasi =
                                      (existing.total_volume_realisasi || 0) +
                                      (sub.total_volume_realisasi || 0);
                                    existing.cumulative_volume_realisasi =
                                      (existing.cumulative_volume_realisasi || 0) +
                                      (sub.cumulative_volume_realisasi || 0);
                                    existing.total_realisasi =
                                      (existing.total_realisasi || 0) + (sub.total_realisasi || 0);
                                    existing.total_anggaran =
                                      (existing.total_anggaran || 0) + (sub.total_anggaran || 0);
                                  }
                                });
                                const groupedSubItems = Array.from(groupedMap.values());

                                return groupedSubItems.map((sub, sidx) => {
                                  const subStatusBit =
                                    (sub.total_volume_pagu || 0) -
                                      (sub.cumulative_volume_realisasi || 0) <=
                                    0
                                      ? 1
                                      : 0;
                                  return (
                                    <tr
                                      key={`sub-${sidx}`}
                                      className={`${theme.table.tr} bg-slate-50/30 border-l-4 border-l-blue-400`}
                                    >
                                      <td
                                        className={`${theme.table.tdCenter} ${theme.text.subtle} italic`}
                                      >
                                        {idx + 1}.{sidx + 1}
                                      </td>
                                      <td className={`${theme.table.tdCenter} text-slate-300`}>
                                        --
                                      </td>
                                      <td className={`${theme.table.td} opacity-60 pl-8`}>
                                        <div className={theme.text.mono}>{sub.kode_rekening}</div>
                                      </td>
                                      <td
                                        className={`${theme.table.td} font-bold text-slate-600`}
                                        title={sub.nama_rekening}
                                      >
                                        {sub.nama_rekening}
                                      </td>
                                      <td className={`${theme.table.td} italic pl-6`}>
                                        {sub.nama_barang}
                                      </td>
                                      <td
                                        className={`${theme.table.tdCenter} font-bold text-slate-400 bg-white/50`}
                                      >
                                        {sub.total_volume_pagu || 0}
                                      </td>
                                      <td
                                        className={`${theme.table.tdCenter} font-bold bg-white/50 ${(sub.total_volume_realisasi || 0) > 0 ? 'text-red-400' : 'text-slate-200'}`}
                                      >
                                        {sub.total_volume_realisasi || 0}
                                      </td>
                                      <td className={`${theme.table.tdCenter} text-slate-400`}>
                                        {sub.satuan}
                                      </td>
                                      <td className={`${theme.table.tdNumber} text-slate-400`}>
                                        {formatRupiah(sub.harga_satuan)}
                                      </td>
                                      <td
                                        className={`${theme.table.tdNumber} font-bold text-slate-500`}
                                      >
                                        {formatRupiah(sub.total_realisasi)}
                                      </td>
                                      <td className={theme.table.tdCenter}>
                                        <span
                                          className={`text-[9px] font-bold ${subStatusBit === 1 ? 'text-emerald-500' : 'text-slate-300'}`}
                                        >
                                          {subStatusBit === 1 ? 'LUNAS' : 'SISA'}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                          </React.Fragment>
                        );
                      })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Trace Plan Modal - Professional Style */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`${theme.card} w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200`}
          >
            {/* Header Modal */}
            <div className={theme.cardHeader}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <GitCompare size={20} />
                </div>
                <div className="min-w-0 pr-4">
                  <h4 className={theme.text.h2}>Aliran Dana: {selectedPlan.nama_barang}</h4>
                  <p className={`${theme.text.subtle} mt-0.5`}>{selectedPlan.nama_rekening}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <AlertCircle size={18} className="rotate-45" />
              </button>
            </div>

            {/* Summary Block */}
            <div className="grid grid-cols-2 border-b border-slate-100 bg-white">
              <div className="p-4 flex flex-col items-center border-r border-slate-100">
                <span className={theme.text.label}>Total Realisasi</span>
                <div className="text-lg font-bold text-emerald-600">
                  {formatRupiah(selectedPlan.cumulative_realisasi)}
                </div>
              </div>
              <div className="p-4 flex flex-col items-center">
                <span className={theme.text.label}>Pagu Tahunan</span>
                <div className="text-lg font-bold text-slate-700">
                  {formatRupiah(selectedPlan.total_anggaran)}
                </div>
              </div>
            </div>

            {/* Content Timeline */}
            <div className="p-4 overflow-y-auto bg-slate-50 custom-scrollbar flex-grow">
              <div className="space-y-3">
                {parsePlannedMonths(
                  selectedPlan.planned_months,
                  selectedPlan.realized_months,
                  selectedPlan.harga_satuan
                )
                  .filter((pm) => pm.isBudgeted || pm.actualTrans > 0)
                  .map((pm, idx) => {
                    const isPaid = pm.isRealized;
                    const isCurrent = pm.m === selectedMonth;

                    return (
                      <div
                        key={idx}
                        className={`bg-white rounded-xl border shadow-sm transition-all overflow-hidden ${isCurrent ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}`}
                      >
                        <div className="flex items-stretch">
                          {/* Left Identity */}
                          <div
                            className={`w-20 p-3 shrink-0 flex flex-col items-center justify-center border-r border-slate-50 ${isPaid ? 'bg-emerald-50/50' : 'bg-slate-50'}`}
                          >
                            <span className={theme.text.label}>{pm.monthName}</span>
                            <div className={`mt-1 flex items-center justify-center`}>
                              {isPaid ? (
                                <CheckCircle2 size={14} className="text-emerald-500" />
                              ) : (
                                <Clock size={14} className="text-amber-500" />
                              )}
                            </div>
                          </div>

                          {/* Details */}
                          <div className="flex-grow p-3 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={theme.text.h3}>
                                {pm.isBudgeted
                                  ? `${pm.vol} ${selectedPlan.satuan}`
                                  : 'Realisasi Dari Bulan Sebelumnya'}
                              </div>
                              {pm.paidInMonth > 0 && pm.paidInMonth !== pm.m && (
                                <div className="text-[9px] font-bold text-blue-600 flex items-center gap-1">
                                  <ArrowRight size={10} />{' '}
                                  {months.find((m) => m.v === pm.paidInMonth)?.n}
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className={theme.text.label}>Target</span>
                                <div className={`${theme.text.subtle} font-medium`}>
                                  {formatRupiah(pm.realAmt)}
                                </div>
                              </div>
                              <div>
                                <span
                                  className={`${theme.text.label} ${pm.actualTrans > 0 ? 'text-blue-500' : ''}`}
                                >
                                  Keuangan (BKU)
                                </span>
                                <div
                                  className={`text-[10px] font-bold ${pm.actualTrans > 0 ? 'text-blue-700' : 'text-slate-300'}`}
                                >
                                  {pm.actualTrans > 0 ? formatRupiah(pm.actualTrans) : '—'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-white">
              <button
                onClick={() => setSelectedPlan(null)}
                className="px-6 py-2 bg-slate-800 text-white rounded-lg text-[11px] font-bold hover:bg-slate-700 transition-colors shadow-sm"
              >
                SELESAI TINJAU
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
