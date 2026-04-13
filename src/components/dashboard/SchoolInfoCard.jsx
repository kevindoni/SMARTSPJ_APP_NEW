import { useState, useEffect } from 'react';
import { School, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export default function SchoolInfoCard({ school, selectedYear, selectedFundSource }) {
  const [syncing, setSyncing] = useState(false);
  const [scrapedData, setScrapedData] = useState(null);
  const [badges, setBadges] = useState(null);

  // Effect: Fetch badges on mount or when filters change
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        // Pass selected filters to the handler
        const res = await window.arkas.getDashboardBadges(
          selectedYear || new Date().getFullYear(),
          selectedFundSource || 'SEMUA'
        );
        if (res.success) setBadges(res.data);
      } catch (e) {
        console.error('Fetch Badges Error:', e);
      }
    };
    fetchBadges();
  }, [selectedYear, selectedFundSource]);

  if (!school) {
    return (
      <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center h-32">
        <span className="text-slate-400 animate-pulse">Memuat Data Sekolah...</span>
      </div>
    );
  }

  const handleSync = async () => {
    setSyncing(true);
    try {
      // Reload school data from database (soft refresh, no page reload)
      await window.arkas.reloadSchoolData();

      // Also try to sync region data from external source if NPSN available
      if (school.npsn) {
        const res = await window.arkas.syncRegionData(school.npsn);
        if (res.success) setScrapedData(res.data);
      }

      toast.success('Data berhasil disinkronkan!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyinkronkan data.', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setSyncing(false);
    }
  };

  // Build region display from school data (now includes kecamatan, kabupaten, provinsi from DB)
  const displayRegion = scrapedData
    ? `${scrapedData.provinsi} ${scrapedData.kabupaten} ${scrapedData.kecamatan}`
    : [school.provinsi, school.kabupaten, school.kecamatan].filter(Boolean).join(', ') || '-';

  const getBkuMonth = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('id-ID', { month: 'long' });
  };

  // Formatter for Currency
  const formatIDR = (val) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val || 0);

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col relative group">
      {/* TOP SECTION: Identity & Actions */}
      <div className="p-6 flex items-start gap-6 border-b border-slate-100">
        <div className="bg-sky-100 p-4 rounded-full text-sky-600 shrink-0">
          <School size={32} />
        </div>

        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {school.nama}
            {scrapedData && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                Tersinkronisasi
              </span>
            )}
          </h2>
          <p className="text-slate-500 font-medium mt-1">{scrapedData?.alamat || school.alamat}</p>
          <div className="flex flex-wrap gap-2 mt-3 text-sm items-center">
            <span className="bg-slate-50 px-3 py-1 rounded-md text-slate-600 font-medium border border-slate-200 text-xs text-nowrap">
              NPSN: {school.npsn || '-'}
            </span>
            <span className="bg-slate-50 px-3 py-1 rounded-md text-slate-600 font-medium border border-slate-200 text-xs">
              {displayRegion}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-600 font-medium text-sm transition-all shadow-sm"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin text-blue-600' : ''} />
            <span>{syncing ? 'Memuat Data...' : 'Muat Ulang Data'}</span>
          </button>
          <div className="text-[10px] text-slate-400 italic text-right">
            Data dari Database Lokal
            <br />
            Terakhir di-update: {new Date().toLocaleDateString('id-ID')}
          </div>
          <div className="mt-1 flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 text-[10px] font-bold uppercase tracking-tight">
            🎯 {selectedFundSource === 'SEMUA' ? 'Gabungan Sumber Dana' : selectedFundSource}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Status Grid (Slim & Compact Badges) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-slate-100 bg-slate-50/30 border-t border-slate-100">
        {/* 1. BKU Status */}
        <div className="p-2.5 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-1.5">
            Status BKU
          </span>
          {badges?.bku ? (
            <div className="flex flex-col items-center">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badges.bku.status_pengiriman === 2 ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'}`}
              >
                {getBkuMonth(badges.bku.tanggal_aktivasi)} •{' '}
                {badges.bku.status_pengiriman === 2 ? 'Terkirim' : 'Draf'}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 text-[10px] italic">
              Belum Terkirim/Belum Diaktivasi
            </span>
          )}
        </div>

        {/* 2. Validation Status */}
        <div className="p-2.5 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-1.5">
            Kertas Kerja
          </span>
          {badges?.pengesahan ? (
            <div
              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badges.pengesahan.is_sah === 1 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}
            >
              {badges.pengesahan.is_sah === 1 ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
              {badges.pengesahan.is_sah === 1 ? 'Disahkan' : 'Perlu Diperbaiki'}
            </div>
          ) : (
            <span className="text-slate-400 text-[10px] italic">Belum Disahkan</span>
          )}
        </div>

        {/* 3. Latest Fund */}
        <div className="p-2.5 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-1.5">
            Terima Dana
          </span>
          {badges?.transfer ? (
            <div className="flex flex-col items-center max-w-full">
              <div className="text-[10px] font-bold text-slate-600 truncate w-full px-1">
                {badges.transfer.uraian}
              </div>
              <div className="text-[8px] text-slate-400">
                {new Date(badges.transfer.tanggal_transaksi).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                })}
              </div>
            </div>
          ) : (
            <span className="text-slate-400 text-[10px] italic">Belum Terima Dana</span>
          )}
        </div>

        {/* 4. Revision Level */}
        <div className="p-2.5 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-1.5">
            Revisi
          </span>
          {badges?.revisi ? (
            <div
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badges.revisi.is_approve === 1 ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
            >
              {badges.revisi.nomor === 0 ? 'Murni' : `Rev-${badges.revisi.nomor}`}
            </div>
          ) : (
            <span className="text-slate-400 text-[10px] italic">Belum Revisi</span>
          )}
        </div>

        {/* 5. Remaining Budget (Pagu) */}
        <div
          className="p-2.5 flex flex-col items-center justify-center text-center cursor-help transition-colors hover:bg-slate-50"
          title="Selisih: Total Anggaran (Penerimaan) - Total Rencana Belanja (RAPBS).&#013;(+) Positif: Ada dana belum direncanakan kegiatannya.&#013;(0) Nol: Anggaran sudah pas (Balance).&#013;(-) Negatif: Rencana belanja melebihi anggaran."
        >
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mb-1.5 border-b border-dotted border-slate-300">
            Sisa Pagu
          </span>
          <div className="flex flex-col items-center">
            <div
              className={`text-[10px] font-bold ${badges?.pagu_sisa < 0 ? 'text-red-600' : 'text-slate-700'}`}
            >
              {formatIDR(badges?.pagu_sisa)}
            </div>
            <span
              className={`text-[8px] mt-0.5 font-medium ${badges?.pagu_sisa === 0 ? 'text-emerald-600' : 'text-slate-400'}`}
            >
              {badges?.pagu_sisa === 0
                ? '✅ Balance'
                : badges?.pagu_sisa > 0
                  ? 'Belum Diplot'
                  : '⚠️ Defisit'}
            </span>
          </div>
        </div>

        {/* 6. Agency Comments / Feedback */}
        <div
          className="p-2.5 flex flex-col items-center justify-center text-center bg-blue-50/30 cursor-help"
          title={badges?.pengesahan?.keterangan || 'Tidak ada pesan.'}
        >
          <span className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter mb-1.5 flex items-center gap-1">
            💬 Respon
          </span>
          <div className="text-[9px] text-slate-500 italic truncate w-full px-2 max-w-[120px]">
            {badges?.pengesahan?.keterangan || 'Tidak ada pesan.'}
          </div>
        </div>
      </div>
    </div>
  );
}
