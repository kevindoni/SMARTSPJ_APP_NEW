import React, { useState, useMemo } from 'react';
import { useArkasData } from '../../hooks/useArkasData';
import { useFilter } from '../../context/FilterContext';
import { formatRupiah } from '../../utils/transactionHelpers';
import SchoolInfoCard from './SchoolInfoCard';
import RevenueChart from './v2/RevenueChart';
import {
  Wallet, ArrowDownCircle, CreditCard, PiggyBank,
  BarChart3, Activity, ArrowDown, ArrowUp, Inbox,
  Database, School, LayoutDashboard
} from 'lucide-react';

const ProgressBar = ({ percent, color }) => (
  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
    <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(percent, 100)}%` }} />
  </div>
);

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${active ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
  >
    {children}
  </button>
);

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 text-slate-400">
    <Inbox size={28} className="mb-2 text-slate-300" strokeWidth={1.5} />
    <p className="text-xs font-medium">{message || 'Belum ada data'}</p>
  </div>
);

/* ─── Welcome / No-Data State ─── */
const WelcomeState = ({ isElectron }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 animate-fade-in">
    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
      <LayoutDashboard size={36} className="text-blue-500" strokeWidth={1.5} />
    </div>
    <h2 className="text-xl font-bold text-slate-700 mb-2">Selamat Datang di SmartSPJ</h2>
    <p className="text-sm text-slate-400 max-w-md text-center leading-relaxed mb-8">
      {isElectron
        ? 'Data sekolah belum tersedia. Pastikan database ARKAS sudah diunduh dari MARKAS dan terhubung dengan benar.'
        : 'Aplikasi sedang berjalan di mode browser. Untuk mengakses data ARKAS, jalankan aplikasi melalui Electron.'
      }
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-xl">
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex flex-col items-center gap-2 text-center">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
          <Database size={18} className="text-blue-500" />
        </div>
        <p className="text-xs font-semibold text-slate-600">Hubungkan ARKAS</p>
        <p className="text-[10px] text-slate-400 leading-relaxed">Install & buka ARKAS, lalu download database</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex flex-col items-center gap-2 text-center">
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
          <School size={18} className="text-emerald-500" />
        </div>
        <p className="text-xs font-semibold text-slate-600">Registrasi Sekolah</p>
        <p className="text-[10px] text-slate-400 leading-relaxed">Lakukan registrasi data sekolah di ARKAS</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex flex-col items-center gap-2 text-center">
        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
          <LayoutDashboard size={18} className="text-amber-500" />
        </div>
        <p className="text-xs font-semibold text-slate-600">Dashboard Aktif</p>
        <p className="text-[10px] text-slate-400 leading-relaxed">Dashboard otomatis menampilkan data</p>
      </div>
    </div>
  </div>
);

/* ─── Main Dashboard ─── */
export default function DashboardRedesigned() {
  const { year, fundSource } = useFilter();
  const { school, stats, isElectron } = useArkasData();
  const [detailTab, setDetailTab] = useState('top5');
  const [historyTab, setHistoryTab] = useState('income');

  const penyerapan = (stats?.anggaran || 0) > 0
    ? ((stats?.realisasi || 0) / stats.anggaran) * 100
    : 0;
  const sisa = (stats?.anggaran || 0) - (stats?.realisasi || 0);

  const chartTitle = useMemo(() => {
    if (!fundSource || fundSource === 'SEMUA') return 'Arus Kas';
    return `Arus Kas ${fundSource}`;
  }, [fundSource]);

  const kpiCards = [
    { icon: Wallet, bg: 'bg-rose-50', ic: 'text-rose-500', title: 'Pagu Anggaran', value: stats?.anggaran, sub: `${stats?.ringkasan_sumber_dana?.length || 0} Sumber Dana` },
    { icon: ArrowDownCircle, bg: 'bg-emerald-50', ic: 'text-emerald-500', title: 'Penerimaan', value: stats?.penerimaan, sub: `${stats?.penerimaan_dana?.length || 0} Tahap` },
    { icon: CreditCard, bg: 'bg-red-50', ic: 'text-red-500', title: 'Realisasi', value: stats?.realisasi },
    { icon: PiggyBank, bg: 'bg-emerald-50', ic: 'text-emerald-500', title: 'Sisa Anggaran', value: sisa },
  ];

  const sumberDanaList = stats?.ringkasan_sumber_dana || [];
  const top5Belanja = stats?.top_5_belanja || [];
  const belanjaKegiatan = stats?.belanja_kegiatan || [];
  const belanjaKategori = stats?.belanja_kategori || [];
  const penerimaanDana = stats?.penerimaan_dana || [];
  const pengeluaranTerbaru = stats?.pengeluaran_terbaru || [];

  /* ─── No school data → show welcome ─── */
  if (!school) {
    return <WelcomeState isElectron={isElectron} />;
  }

  /* ─── Full dashboard ─── */
  return (
    <div className="flex flex-col gap-5 animate-fade-in">

      <SchoolInfoCard school={school} selectedYear={year} selectedFundSource={fundSource} />

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.bg}`}>
                  <Icon size={16} className={card.ic} strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{card.title}</span>
              </div>
              <div className="text-2xl font-bold text-slate-800 tracking-tight mb-1">{formatRupiah(card.value)}</div>
              {card.sub && <div className="text-[11px] text-slate-400">{card.sub}</div>}
              {i === 2 && (
                <div className="mt-2">
                  <ProgressBar percent={penyerapan} color={penyerapan > 75 ? 'bg-emerald-500' : penyerapan > 40 ? 'bg-amber-500' : 'bg-rose-500'} />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-slate-400">Penyerapan</span>
                    <span className="text-[10px] font-bold text-slate-600">{penyerapan.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* CHART + FUND SUMMARY */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 min-h-[320px]">
          <RevenueChart data={stats?.chart || []} year={year} title={chartTitle} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col overflow-hidden min-h-[200px]">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <BarChart3 size={15} className="text-indigo-500" />
            <span className="text-xs font-semibold text-slate-700">Sumber Dana</span>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            {sumberDanaList.length > 0 ? sumberDanaList.map((row, idx) => {
              const rawPct = row.pagu > 0 ? (row.realisasi / row.pagu) * 100 : 0;
              const sisaFund = (row.pagu || 0) - (row.realisasi || 0);
              return (
                <div key={idx} className="px-4 py-3 border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50 transition-colors">
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-xs font-semibold text-slate-700">{row.nama_sumber_dana}</span>
                    <span className="text-[10px] font-bold text-slate-500">{rawPct >= 100 ? (rawPct === 100 ? "100" : ">100") : rawPct.toFixed(1)}%</span>
                  </div>
                  <ProgressBar percent={Math.min(rawPct, 100)} color={rawPct > 80 ? 'bg-rose-400' : rawPct > 50 ? 'bg-amber-400' : 'bg-emerald-400'} />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[10px] text-slate-400">Realisasi {formatRupiah(row.realisasi)}</span>
                    <span className="text-[10px] font-medium text-emerald-600">Sisa {formatRupiah(Math.max(sisaFund, 0))}</span>
                  </div>
                </div>
              );
            }) : (
              <EmptyState message="Belum ada data sumber dana" />
            )}
          </div>
        </div>
      </div>

      {/* SPENDING DETAILS - Tabbed */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 flex-wrap">
          <Activity size={15} className="text-slate-500" />
          <span className="text-xs font-semibold text-slate-700">Detail Belanja</span>
          <div className="ml-auto flex gap-1">
            <TabButton active={detailTab === 'top5'} onClick={() => setDetailTab('top5')}>Top 5</TabButton>
            <TabButton active={detailTab === 'kegiatan'} onClick={() => setDetailTab('kegiatan')}>Per Kegiatan</TabButton>
            <TabButton active={detailTab === 'kategori'} onClick={() => setDetailTab('kategori')}>Kategori</TabButton>
          </div>
        </div>
        <div className="max-h-[300px] overflow-auto custom-scrollbar">
          {detailTab === 'top5' && (
            top5Belanja.length > 0 ? (
              <div className="p-3 space-y-2">
                {stats.top_5_belanja.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${idx === 0 ? 'bg-rose-100 text-rose-600' : idx === 1 ? 'bg-orange-100 text-orange-600' : idx === 2 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate" title={item.uraian}>{item.uraian}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{item.tanggal_transaksi?.split(' ')[0]}</span>
                    </div>
                    <span className="text-xs font-bold text-rose-600">{formatRupiah(item.nominal)}</span>
                  </div>
                ))}
              </div>
            ) : <EmptyState message="Belum ada data belanja" />
          )}
          {detailTab === 'kegiatan' && (
            belanjaKegiatan.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase">#</th>
                    <th className="py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase">Kegiatan</th>
                    <th className="py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase text-right">Anggaran</th>
                    <th className="py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase text-right">Realisasi</th>
                    <th className="py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.belanja_kegiatan.map((keg, idx) => {
                    const pct = keg.pagu_kegiatan > 0 ? (keg.realisasi / keg.pagu_kegiatan) * 100 : 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 text-xs text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 text-xs font-medium text-slate-700 max-w-[200px] truncate" title={keg.nama_kegiatan}>{keg.nama_kegiatan || 'Tanpa Kegiatan'}</td>
                        <td className="py-2 px-3 text-xs text-slate-500 text-right whitespace-nowrap">{formatRupiah(keg.pagu_kegiatan)}</td>
                        <td className="py-2 px-3 text-xs font-semibold text-rose-600 text-right whitespace-nowrap">{keg.realisasi > 0 ? formatRupiah(keg.realisasi) : 'Rp 0'}</td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="w-10 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${pct > 90 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 min-w-[32px] text-right">{pct.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : <EmptyState message="Belum ada data belanja per kegiatan" />
          )}
          {detailTab === 'kategori' && (
            belanjaKategori.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3">
                {stats.belanja_kategori.map((cat, idx) => {
                  const pct = cat.anggaran > 0 ? (cat.realisasi / cat.anggaran) * 100 : 0;
                  const sisaKat = Math.max((cat.anggaran || 0) - (cat.realisasi || 0), 0);
                  const colors = ['bg-rose-500', 'bg-blue-500', 'bg-amber-500'];
                  return (
                    <div key={idx} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase">{cat.id.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] font-bold text-slate-600">{pct.toFixed(1)}%</span>
                      </div>
                      <ProgressBar percent={pct} color={colors[idx] || colors[0]} />
                      <div className="mt-2 space-y-0.5 text-[11px]">
                        <div className="flex justify-between"><span className="text-slate-400">Anggaran</span><span className="text-slate-600 font-medium">{formatRupiah(cat.anggaran)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Realisasi</span><span className="text-rose-600 font-medium">{formatRupiah(cat.realisasi)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Sisa</span><span className="text-emerald-600 font-medium">{formatRupiah(sisaKat)}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <EmptyState message="Belum ada data belanja per kategori" />
          )}
        </div>
      </div>

      {/* TRANSACTION HISTORY - Tabbed */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 flex-wrap">
          {historyTab === 'income' ? <ArrowDown size={15} className="text-emerald-500" /> : <ArrowUp size={15} className="text-rose-500" />}
          <span className="text-xs font-semibold text-slate-700">Riwayat</span>
          <div className="ml-auto flex gap-1">
            <TabButton active={historyTab === 'income'} onClick={() => setHistoryTab('income')}>Penerimaan</TabButton>
            <TabButton active={historyTab === 'expense'} onClick={() => setHistoryTab('expense')}>Pengeluaran</TabButton>
          </div>
        </div>
        <div className="max-h-[280px] overflow-auto custom-scrollbar">
          {historyTab === 'income' && (
            penerimaanDana.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase">#</th>
                    <th className="py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase">Uraian</th>
                    <th className="py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase text-right">Tanggal</th>
                    <th className="py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.penerimaan_dana.map((item, idx) => (
                    <tr key={idx} className="hover:bg-emerald-50/30">
                      <td className="py-2 px-3 text-xs text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 text-xs text-slate-700 font-medium max-w-[200px] truncate">{item.uraian}</td>
                      <td className="py-2 px-3 text-[10px] text-slate-400 text-right font-mono">{item.tanggal_transaksi ? new Date(item.tanggal_transaksi).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-'}</td>
                      <td className="py-2 px-3 text-xs font-bold text-emerald-600 text-right whitespace-nowrap">{formatRupiah(item.nominal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <EmptyState message="Belum ada data penerimaan" />
          )}
          {historyTab === 'expense' && (
            pengeluaranTerbaru.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase">#</th>
                    <th className="py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase">Uraian</th>
                    <th className="py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase text-right">Tanggal</th>
                    <th className="py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.pengeluaran_terbaru.map((item, idx) => (
                    <tr key={idx} className="hover:bg-rose-50/30">
                      <td className="py-2 px-3 text-xs text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3 text-xs text-slate-700 font-medium max-w-[200px] truncate" title={item.uraian}>{item.uraian}</td>
                      <td className="py-2 px-3 text-[10px] text-slate-400 text-right font-mono">{item.tanggal_transaksi ? new Date(item.tanggal_transaksi).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-'}</td>
                      <td className="py-2 px-3 text-xs font-bold text-rose-600 text-right whitespace-nowrap">{formatRupiah(item.nominal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <EmptyState message="Belum ada data pengeluaran" />
          )}
        </div>
      </div>

    </div>
  );
}