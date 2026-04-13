import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, FileSignature, Download, Printer, Calendar } from 'lucide-react';
import { useFilter } from '../context/FilterContext';
import { formatDateIndonesian } from '../utils/dateHelpers';
import { formatRupiah } from '../utils/transactionHelpers';
import { jsPDF } from 'jspdf';

export default function CetakSPTJM() {
  const { year } = useFilter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [school, setSchool] = useState(null);

  // Tab state
  const [activeSemester, setActiveSemester] = useState('1');
  const [activeFund, setActiveFund] = useState('reguler');

  // Signature date
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().split('T')[0]);

  // Fund source options
  const fundSources = [
    { id: 'reguler', label: 'BOS Reguler', sourceIds: [1, 33] },
    { id: 'kinerja', label: 'BOS Kinerja', sourceIds: [12, 35] },
  ];

  useEffect(() => {
    fetchData();
  }, [year, activeSemester, activeFund]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get school info
      const schoolRes = await window.arkas.getSchoolInfo();
      if (schoolRes.success) setSchool(schoolRes.data);

      // Get SPTJM data
      const sptjmRes = await window.arkas.getSPTJMData(year, parseInt(activeSemester), activeFund);
      if (sptjmRes.success) {
        setData(sptjmRes.data);
      } else {
        setError(sptjmRes.message || 'Gagal mengambil data SPTJM');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get semester months
  const getSemesterMonths = () => {
    return activeSemester === '1' ? 'Januari sampai dengan Juni' : 'Juli sampai dengan Desember';
  };

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [215, 330],
    });

    const margin = 22.5;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK', pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Line under title
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Opening paragraph
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const fundLabel = fundSources.find((f) => f.id === activeFund)?.label || 'Dana BOS';
    const openingText = `Saya yang bertanda tangan dibawah ini menyatakan bahwa bertanggung jawab secara formal dan material atas kebenaran realisasi penerimaan dan pengeluaran ${fundLabel} serta kebenaran perhitungan dan setoran pajak yang telah dipungut atas penggunaan ${fundLabel} pada Semester ${activeSemester} tahun anggaran ${year} dengan rincian sebagai berikut:`;

    const lines = doc.splitTextToSize(openingText, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 10;

    // Nomor field
    doc.text('Nomor : .......................................', margin, y);
    y += 8;

    // School info
    const info = [
      ['1.', 'NPSN', ':', school?.npsn || '-'],
      ['2.', 'Nama Sekolah', ':', school?.nama_sekolah || '-'],
      ['3.', 'Kode Sekolah', ':', '.......................................'],
      ['4.', 'Nomor/Tanggal DPA SKPD', ':', '.......................................'],
    ];

    info.forEach((row) => {
      doc.text(row[0], margin, y);
      doc.text(row[1], margin + 6, y);
      doc.text(row[2], margin + 50, y);
      doc.text(row[3], margin + 55, y);
      y += 6;
    });

    y += 4;

    // Financial data
    doc.text('5.', margin, y);
    doc.text(`Kegiatan ${fundLabel}`, margin + 6, y);
    y += 8;

    // A. Saldo Awal
    doc.text(`A. Saldo Awal ${fundLabel}`, margin + 6, y);
    doc.text(formatRupiah(data?.saldoAwal || 0), margin + 120, y, { align: 'right' });
    y += 8;

    // B. Penerimaan
    doc.text(`B. Penerimaan ${fundLabel}`, margin + 6, y);
    y += 6;
    doc.text('1. Tahap I', margin + 10, y);
    doc.text(formatRupiah(data?.penerimaanTahap1 || 0), margin + 80, y, { align: 'right' });
    y += 5;
    doc.text('2. Tahap II', margin + 10, y);
    doc.text(formatRupiah(data?.penerimaanTahap2 || 0), margin + 80, y, { align: 'right' });
    y += 5;
    doc.text('Jumlah Penerimaan', margin + 10, y);
    doc.text(formatRupiah(data?.totalPenerimaan || 0), margin + 120, y, { align: 'right' });
    y += 8;

    // C. Pengeluaran
    doc.text(`C. Pengeluaran ${fundLabel}`, margin + 6, y);
    y += 6;
    doc.text('1. Jenis Belanja Operasi', margin + 10, y);
    doc.text(formatRupiah(data?.belanjaOperasi || 0), margin + 80, y, { align: 'right' });
    y += 5;
    doc.text('2. Jenis Belanja Modal', margin + 10, y);
    doc.text(formatRupiah(data?.belanjaModal || 0), margin + 80, y, { align: 'right' });
    y += 5;
    doc.text('Jumlah Pengeluaran', margin + 10, y);
    doc.text(formatRupiah(data?.totalPengeluaran || 0), margin + 120, y, { align: 'right' });
    y += 8;

    // D. Sisa Dana
    doc.text(`D. Sisa ${fundLabel}`, margin + 6, y);
    doc.text(formatRupiah(data?.sisaDana || 0), margin + 120, y, { align: 'right' });
    y += 6;
    doc.text('Terdiri atas :', margin + 10, y);
    y += 5;
    doc.text('1. Sisa Kas Tunai', margin + 10, y);
    doc.text(formatRupiah(data?.sisaTunai || 0), margin + 80, y, { align: 'right' });
    y += 5;
    doc.text('2. Sisa di Bank', margin + 10, y);
    doc.text(formatRupiah(data?.sisaBank || 0), margin + 80, y, { align: 'right' });
    y += 12;

    // Disclaimer paragraph
    const disclaimer = `Bukti-bukti atas belanja tersebut pada huruf B disimpan pada Sekolah ${school?.nama_sekolah || '-'} untuk kelengkapan Administrasi dan keperluan pemeriksaan sesuai peraturan perundang-undangan. Apabila bukti-bukti tersebut tidak benar yang mengakibatkan kerugian daerah, saya bertanggungjawab sepenuhnya atas kerugian daerah dimaksud sesuai kewenangan saya berdasarkan ketentuan peraturan perundang-undangan.`;

    const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth);
    doc.text(disclaimerLines, margin, y);
    y += disclaimerLines.length * 5 + 10;

    // Closing
    doc.text('Demikian surat pernyataan ini dibuat dengan sebenarnya.', margin, y);
    y += 15;

    // Signature section
    const signX = pageWidth - margin - 60;
    doc.text(
      `${school?.kabupaten || '...............'}, ${formatDateIndonesian(signatureDate)}`,
      signX,
      y
    );
    y += 8;
    doc.text('Kepala Sekolah,', signX, y);
    y += 25;
    doc.text(school?.kepala_sekolah || '......................', signX, y);
    y += 5;
    doc.text(`NIP. ${school?.nip_kepala || '......................'}`, signX, y);

    // Save
    doc.save(`SPTJM_${activeFund}_Semester${activeSemester}_${year}.pdf`);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-red-600">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
          Coba Lagi
        </button>
      </div>
    );
  }

  const fundLabel = fundSources.find((f) => f.id === activeFund)?.label || 'Dana BOS';

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <FileSignature size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              LAPORAN
            </span>
            <h2 className="text-lg font-bold text-slate-800">
              Surat Pernyataan Tanggung Jawab Mutlak (SPTJM)
            </h2>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium shadow-sm active:scale-95"
          >
            <Download size={16} />
            Export PDF
          </button>

        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
        <div className="flex flex-wrap items-center gap-4">
          {/* Semester Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100/50 p-1 rounded-lg">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">
              Semester
            </span>
            {['1', '2'].map((sem) => (
              <button
                key={sem}
                onClick={() => setActiveSemester(sem)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  activeSemester === sem
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                Semester {sem}
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-slate-200" />

          {/* Fund Source Tabs */}
          <div className="flex items-center gap-1.5 bg-amber-50/50 p-1 rounded-lg border border-amber-100">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider px-2">
              Sumber Dana
            </span>
            {fundSources.map((fund) => (
              <button
                key={fund.id}
                onClick={() => setActiveFund(fund.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  activeFund === fund.id
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {fund.label.replace('BOS ', '')}
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-slate-200" />

          {/* Date Picker */}
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <input
              type="date"
              value={signatureDate}
              onChange={(e) => setSignatureDate(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Document Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-4xl mx-auto">
        {/* Title */}
        <h1 className="text-lg font-bold text-center text-slate-800 mb-2 underline decoration-2">
          SURAT PERNYATAAN TANGGUNG JAWAB MUTLAK
        </h1>

        {/* Opening Paragraph */}
        <p className="text-sm text-slate-700 text-justify mb-6 leading-relaxed">
          Saya yang bertanda tangan dibawah ini menyatakan bahwa bertanggung jawab secara formal dan
          material atas kebenaran realisasi penerimaan dan pengeluaran <strong>{fundLabel}</strong>{' '}
          serta kebenaran perhitungan dan setoran pajak yang telah dipungut atas penggunaan{' '}
          {fundLabel} pada <strong>Semester {activeSemester}</strong> tahun anggaran{' '}
          <strong>{year}</strong> dengan rincian sebagai berikut:
        </p>

        {/* Nomor */}
        <p className="text-sm text-slate-700 mb-6 text-center">
          Nomor : ...........................................
        </p>

        {/* School Info */}
        <div className="space-y-2 mb-6 text-sm">
          <div className="grid grid-cols-12 gap-2">
            <span className="col-span-1">1.</span>
            <span className="col-span-4">NPSN</span>
            <span className="col-span-1">:</span>
            <span className="col-span-6 font-medium">{school?.npsn || '-'}</span>
          </div>
          <div className="grid grid-cols-12 gap-2">
            <span className="col-span-1">2.</span>
            <span className="col-span-4">Nama Sekolah</span>
            <span className="col-span-1">:</span>
            <span className="col-span-6 font-medium">{school?.nama_sekolah || '-'}</span>
          </div>
          <div className="grid grid-cols-12 gap-2">
            <span className="col-span-1">3.</span>
            <span className="col-span-4">Kode Sekolah</span>
            <span className="col-span-1">:</span>
            <span className="col-span-6">........................................</span>
          </div>
          <div className="grid grid-cols-12 gap-2">
            <span className="col-span-1">4.</span>
            <span className="col-span-4">Nomor/Tanggal DPA SKPD</span>
            <span className="col-span-1">:</span>
            <span className="col-span-6">........................................</span>
          </div>
        </div>

        {/* Financial Data */}
        <div className="text-sm space-y-4 mb-6">
          <div className="grid grid-cols-12 gap-2">
            <span className="col-span-1">5.</span>
            <span className="col-span-11 font-medium">Kegiatan {fundLabel}</span>
          </div>

          {/* A. Saldo Awal */}
          <div className="ml-6">
            <div className="grid grid-cols-12 gap-2">
              <span className="col-span-6">A. Saldo Awal {fundLabel}</span>
              <span className="col-span-6 text-right font-medium">
                {formatRupiah(data?.saldoAwal || 0)}
              </span>
            </div>
          </div>

          {/* B. Penerimaan */}
          <div className="ml-6">
            <div className="grid grid-cols-12 gap-2 mb-2">
              <span className="col-span-12">B. Penerimaan {fundLabel}</span>
            </div>
            <div className="ml-4 space-y-1">
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-4">1. Tahap I</span>
                <span className="col-span-4 text-right">
                  {formatRupiah(data?.penerimaanTahap1 || 0)}
                </span>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-4">2. Tahap II</span>
                <span className="col-span-4 text-right">
                  {formatRupiah(data?.penerimaanTahap2 || 0)}
                </span>
              </div>
              <div className="grid grid-cols-12 gap-2 pt-1 border-t border-slate-200">
                <span className="col-span-4">Jumlah Penerimaan</span>
                <span className="col-span-4"></span>
                <span className="col-span-4 text-right font-medium">
                  {formatRupiah(data?.totalPenerimaan || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* C. Pengeluaran */}
          <div className="ml-6">
            <div className="grid grid-cols-12 gap-2 mb-2">
              <span className="col-span-12">C. Pengeluaran {fundLabel}</span>
            </div>
            <div className="ml-4 space-y-1">
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-4">1. Jenis Belanja Operasi</span>
                <span className="col-span-4 text-right">
                  {formatRupiah(data?.belanjaOperasi || 0)}
                </span>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-4">2. Jenis Belanja Modal</span>
                <span className="col-span-4 text-right">
                  {formatRupiah(data?.belanjaModal || 0)}
                </span>
              </div>
              <div className="grid grid-cols-12 gap-2 pt-1 border-t border-slate-200">
                <span className="col-span-4">Jumlah Pengeluaran</span>
                <span className="col-span-4"></span>
                <span className="col-span-4 text-right font-medium">
                  {formatRupiah(data?.totalPengeluaran || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* D. Sisa Dana */}
          <div className="ml-6">
            <div className="grid grid-cols-12 gap-2 mb-2">
              <span className="col-span-6">D. Sisa {fundLabel}</span>
              <span className="col-span-6 text-right font-bold text-emerald-600">
                {formatRupiah(data?.sisaDana || 0)}
              </span>
            </div>
            <div className="ml-4 space-y-1">
              <span className="text-slate-500">Terdiri atas :</span>
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-4">1. Sisa Kas Tunai</span>
                <span className="col-span-4 text-right">{formatRupiah(data?.sisaTunai || 0)}</span>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <span className="col-span-4">2. Sisa di Bank</span>
                <span className="col-span-4 text-right">{formatRupiah(data?.sisaBank || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-sm text-slate-700 text-justify mb-6 leading-relaxed">
          Bukti-bukti atas belanja tersebut pada huruf B disimpan pada Sekolah{' '}
          <strong>{school?.nama_sekolah || '-'}</strong> untuk kelengkapan Administrasi dan
          keperluan pemeriksaan sesuai peraturan perundang-undangan. Apabila bukti-bukti tersebut
          tidak benar yang mengakibatkan kerugian daerah, saya bertanggungjawab sepenuhnya atas
          kerugian daerah dimaksud sesuai kewenangan saya berdasarkan ketentuan peraturan
          perundang-undangan.
        </p>

        {/* Closing */}
        <p className="text-sm text-slate-700 mb-8">
          Demikian surat pernyataan ini dibuat dengan sebenarnya.
        </p>

        {/* Signature */}
        <div className="flex justify-end">
          <div className="text-sm text-center">
            <p className="mb-2">
              {school?.kabupaten || '...............'}, {formatDateIndonesian(signatureDate)}
            </p>
            <p className="mb-16">Kepala Sekolah,</p>
            <p className="font-medium border-b border-slate-400 pb-1">
              {school?.kepala_sekolah || '.......................'}
            </p>
            <p className="mt-1 text-slate-500">
              NIP. {school?.nip_kepala || '.......................'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
