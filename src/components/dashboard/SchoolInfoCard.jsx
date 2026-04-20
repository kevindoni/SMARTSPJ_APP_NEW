import { useState, useEffect } from 'react';
import { School, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const isElectron = typeof window !== 'undefined' && window.arkas;

export default function SchoolInfoCard({ school, selectedYear, selectedFundSource }) {
  const [syncing, setSyncing] = useState(false);
  const [scrapedData, setScrapedData] = useState(null);
  const [badges, setBadges] = useState(null);

  useEffect(() => {
    if (!isElectron) return;

    let cancelled = false;
    const fetchBadges = async () => {
      try {
        const res = await window.arkas.getDashboardBadges(
          selectedYear || new Date().getFullYear(),
          selectedFundSource || 'SEMUA'
        );
        if (!cancelled && res.success) setBadges(res.data);
      } catch (e) {
        // Silently fail - badges are supplementary info
      }
    };
    fetchBadges();
    return () => { cancelled = true; };
  }, [selectedYear, selectedFundSource]);

  if (!school) {
    return (
      <div className="w-full bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center h-36 gap-2.5 p-6">
        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center">
          <School size={24} className="text-amber-400" />
        </div>
        <span className="text-slate-600 font-semibold text-sm">Data Sekolah Tidak Ditemukan</span>
        <span className="text-slate-400 text-xs text-center max-w-sm leading-relaxed">
          Pastikan ARKAS sudah terinstall, sudah registrasi, dan database sudah diunduh dari MARKAS.
        </span>
      </div>
    );
  }

  const handleSync = async () => {
    if (!isElectron) return;
    setSyncing(true);
    try {
      await window.arkas.reloadSchoolData();
      if (school.npsn) {
        const res = await window.arkas.syncRegionData(school.npsn);
        if (res.success) setScrapedData(res.data);
      }
      toast.success('Data berhasil disinkronkan!', { position: 'top-right', autoClose: 3000 });
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyinkronkan data.', { position: 'top-right', autoClose: 3000 });
    } finally {
      setSyncing(false);
    }
  };

  const displayRegion = scrapedData
    ? `${scrapedData.provinsi} ${scrapedData.kabupaten} ${scrapedData.kecamatan}`
    : [school.provinsi, school.kabupaten, school.kecamatan].filter(Boolean).join(', ') || '-';

  const getBkuMonth = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('id-ID', { month: 'long' });
  };

  const formatIDR = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
      {/* Identity Section */}
      <div className="p-5 flex items-start gap-5 border-b border-slate-100">
        <div className="bg-sky-100 p-3.5 rounded-2xl text-sky-600 shrink-0">
          <School size={28} />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {school.nama}
            {scrapedData && (
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                Tersinkronisasi
              </span>
            )}
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">{scrapedData?.alamat || school.alamat || '-'}</p>
          <div className="flex flex-wrap gap-1.5 mt-2.5 items-center">
            <span className="bg-slate-50 px-2.5 py-0.5 rounded-md text-slate-600 font-medium border border-slate-200 text-[11px] text-nowrap">
              NPSN: {school.npsn || '-'}
            </span>
            <span className="bg-slate-50 px-2.5 py-0.5 rounded-md text-slate-600 font-medium border border-slate-200 text-[11px]">
              {displayRegion}
            </span>
            <span className="bg-blue-50 px-2.5 py-0.5 rounded-md text-blue-600 font-semibold border border-blue-100 text-[11px]">
              {selectedFundSource === 'SEMUA' ? 'Semua Sumber Dana' : selectedFundSource}
            </span>
          </div>
        </div>

        {isElectron && (
          <div className="flex flex-col items-end gap-2 shrink-0">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-600 font-medium text-xs transition-all shadow-sm"
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin text-blue-600' : ''} />
              <span>{syncing ? 'Memuat...' : 'Muat Ulang'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Status Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-slate-100 bg-slate-50/30">
        {/* BKU Status */}
        <div className="p-2.5 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-1">Status BKU</span>
          {badges?.bku ? (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badges.bku.status_pengiriman === 2 ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
              {getBkuMonth(badges.bku.tanggal_aktivasi)} • {badges.bku.status_pengiriman === 2 ? 'Terkirim' : 'Draf'}
            </span>
          ) : (
            <span className="text-slate-400 text-[10px] italic">Belum Diaktivasi</span>
          )}
        </div>

        {/* Validation */}
        <div className="p-2.5 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-1">Kertas Kerja</span>
          {badges?.pengesahan ? (
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badges.pengesahan.is_sah === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
              {badges.pengesahan.is_sah === 1 ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
              {badges.pengesahan.is_sah === 1 ? 'Disahkan' : 'Perlu Diperbaiki'}
            </span>
          ) : (
            <span className="text-slate-400 text-[10px] italic">Belum Disahkan</span>
          )}
        </div>

        {/* Latest Fund */}
        <div className="p-2.5 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-1">Terima Dana</span>
          {badges?.transfer ? (
            <div className="flex flex-col items-center max-w-full">
              <span className="text-[10px] font-bold text-slate-600 truncate w-full px-1">{badges.transfer.uraian}</span>
              <span className="text-[9px] text-slate-400">
                {new Date(badges.transfer.tanggal_transaksi).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 text-[10px] italic">Belum Terima Dana</span>
          )}
        </div>

        {/* Revision */}
        <div className="p-2.5 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-1">Revisi</span>
          {badges?.revisi ? (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badges.revisi.is_approve === 1 ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
              {badges.revisi.nomor === 0 ? 'Murni' : `Rev-${badges.revisi.nomor}`}
            </span>
          ) : (
            <span className="text-slate-400 text-[10px] italic">Belum Revisi</span>
          )}
        </div>

        {/* Remaining Budget */}
        <div className="p-2.5 flex flex-col items-center justify-center text-center cursor-help transition-colors hover:bg-slate-50" title="Selisih: Total Anggaran - Total Rencana Belanja (RAPBS)">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-1 border-b border-dotted border-slate-300">Sisa Pagu</span>
          <span className={`text-[10px] font-bold ${badges?.pagu_sisa < 0 ? 'text-red-600' : 'text-slate-700'}`}>
            {formatIDR(badges?.pagu_sisa)}
          </span>
          <span className={`text-[8px] mt-0.5 font-medium ${badges?.pagu_sisa === 0 ? 'text-emerald-600' : badges?.pagu_sisa > 0 ? 'text-amber-500' : 'text-red-500'}`}>
            {badges?.pagu_sisa === 0 ? '✅ Balance' : badges?.pagu_sisa > 0 ? 'Belum Diplot' : badges?.pagu_sisa < 0 ? '⚠️ Defisit' : '-'}
          </span>
        </div>

        {/* Agency Comments */}
        <div className="p-2.5 flex flex-col items-center justify-center text-center bg-blue-50/30 cursor-help" title={badges?.pengesahan?.keterangan || 'Tidak ada pesan.'}>
          <span className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter mb-1">💬 Respon</span>
          <span className="text-[9px] text-slate-500 italic truncate w-full px-2 max-w-[120px]">
            {badges?.pengesahan?.keterangan || 'Tidak ada pesan.'}
          </span>
        </div>
      </div>
    </div>
  );
}