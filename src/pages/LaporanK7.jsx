import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, ClipboardList, Download, Calendar } from 'lucide-react';
import { useFilter } from '../context/FilterContext';
import { formatRupiah } from '../utils/transactionHelpers';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDateIndonesian } from '../utils/dateHelpers';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Standar Nasional Pendidikan categories
const STANDAR_PENDIDIKAN = [
  { id: 1, nama: 'Pengembangan Standar Isi' },
  { id: 2, nama: 'Standar Proses' },
  { id: 3, nama: 'Standar Tenaga Kependidikan' },
  { id: 4, nama: 'Standar Sarana dan Prasarana' },
  { id: 5, nama: 'Standar Pengelolaan' },
  { id: 6, nama: 'Pengembangan standar pembiayaan' },
  { id: 7, nama: 'Standar Penilaian Pendidikan' },
];

// Sub Program categories
const SUB_PROGRAMS = [
  { id: 1, nama: 'Penerimaan Peserta Didik Baru' },
  { id: 2, nama: 'Pengembangan Perpustakaan' },
  { id: 3, nama: 'Pelaksanaan Kegiatan Pembelajaran dan Ekstrakurikuler' },
  { id: 4, nama: 'Pelaksanaan Kegiatan Asesmen/Evaluasi Pembelajaran' },
  { id: 5, nama: 'Pelaksanaan Administrasi Kegiatan Sekolah' },
  { id: 6, nama: 'Pengembangan Profesi Pendidik dan Tenaga Kependidikan' },
  { id: 7, nama: 'Pembiayaan Langganan Daya dan Jasa' },
  { id: 8, nama: 'Pemeliharaan Sarana dan Prasarana Sekolah' },
  { id: 9, nama: 'Penyediaan Alat Multi Media Pembelajaran' },
  { id: 10, nama: 'Penyelenggaraan Kegiatan Peningkatan Kompetensi Keahlian' },
  { id: 11, nama: 'Lain-lain' },
  { id: 12, nama: 'Pembayaran Honor' },
];

export default function LaporanK7() {
  const { year } = useFilter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [school, setSchool] = useState(null);

  // Tab state
  const [periodType, setPeriodType] = useState('tahap'); // 'tahap', 'bulan', 'tahunan'
  const [activeTahap, setActiveTahap] = useState('1');
  const [activeMonth, setActiveMonth] = useState('01');
  const [activeFund, setActiveFund] = useState('reguler');

  // Signature date
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().split('T')[0]);

  // Fund source options
  const fundSources = [
    { id: 'reguler', label: 'BOS Reguler' },
    { id: 'kinerja', label: 'BOS Kinerja' },
  ];

  // Month options
  const months = [
    { id: '01', label: 'Januari' },
    { id: '02', label: 'Februari' },
    { id: '03', label: 'Maret' },
    { id: '04', label: 'April' },
    { id: '05', label: 'Mei' },
    { id: '06', label: 'Juni' },
    { id: '07', label: 'Juli' },
    { id: '08', label: 'Agustus' },
    { id: '09', label: 'September' },
    { id: '10', label: 'Oktober' },
    { id: '11', label: 'November' },
    { id: '12', label: 'Desember' },
  ];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchData();
  }, [year, periodType, activeTahap, activeMonth, activeFund]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get school info
      const schoolRes = await window.arkas.getSchoolInfo();
      if (schoolRes.success) setSchool(schoolRes.data);

      // Get K7 data with period type
      const k7Res = await window.arkas.getK7Data(
        year,
        periodType,
        activeTahap,
        activeMonth,
        activeFund
      );
      if (k7Res.success) {
        setData(k7Res.data);
      } else {
        setError(k7Res.message || 'Gagal mengambil data K7');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get period string
  const getPeriodString = () => {
    const monthNames = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];

    if (periodType === 'tahunan') {
      return `01 Januari ${year} s/d 31 Desember ${year}`;
    } else if (periodType === 'bulan') {
      const monthIdx = parseInt(activeMonth) - 1;
      const monthName = monthNames[monthIdx];
      const lastDay = new Date(year, parseInt(activeMonth), 0).getDate();
      return `01 ${monthName} ${year} s/d ${lastDay} ${monthName} ${year}`;
    } else {
      // tahap
      if (activeTahap === '1') {
        return `01 Januari ${year} s/d 30 Juni ${year}`;
      }
      return `01 Juli ${year} s/d 31 Desember ${year}`;
    }
  };

  // Export to PDF
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [330, 215], // F4 (21.5 x 33 cm)
      });

      const margin = 5;
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      // Title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `REKAPITULASI REALISASI PENGGUNAAN DANA BOSP ${activeFund.toUpperCase()}`,
        pageWidth / 2,
        y,
        { align: 'center' }
      );
      y += 5;
      doc.setFontSize(10);
      doc.text(`PERIODE TANGGAL : ${getPeriodString()}`, pageWidth / 2, y, { align: 'center' });
      y += 5;
      let subtitle = '';
      if (periodType === 'bulan') {
        const m = months.find((m) => m.id === activeMonth);
        subtitle = `BULAN ${m?.label.toUpperCase() || ''} TAHUN ${year}`;
      } else if (periodType === 'tahunan') {
        subtitle = `TAHUN ${year}`;
      } else {
        subtitle = `TAHAP ${activeTahap} TAHUN ${year}`;
      }
      doc.text(subtitle, pageWidth / 2, y, { align: 'center' });
      y += 8;

      // School Info Table
      const fundLabel = fundSources.find((f) => f.id === activeFund)?.label || 'BOS Reguler';
      const schoolInfoData = [
        ['NPSN', ':', school?.npsn || '-'],
        ['Nama Sekolah', ':', school?.nama_sekolah || '-'],
        ['Kecamatan', ':', school?.kecamatan || '-'],
        ['Kabupaten/Kota', ':', school?.kabupaten || '-'],
        ['Provinsi', ':', school?.provinsi || '-'],
        ['Sumber Dana', ':', fundLabel],
      ];

      autoTable(doc, {
        startY: y,
        body: schoolInfoData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1, font: 'helvetica' },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 4 },
          2: { cellWidth: 100 },
        },
        margin: { left: 5, right: 5 },
      });
      y = doc.lastAutoTable.finalY + 5;

      // Table Configuration
      const tableColumns = [
        { header: 'No.', dataKey: 'no' },
        { header: 'Standar Nasional Pendidikan', dataKey: 'standar' },
        ...SUB_PROGRAMS.map((sp, i) => ({ header: (i + 1).toString(), dataKey: `sp${i + 1}` })),
        { header: 'Jumlah', dataKey: 'jumlah' },
      ];

      const tableData = STANDAR_PENDIDIKAN.map((std, idx) => {
        const row = { no: idx + 1, standar: std.nama };
        const stdData = data?.byStandar?.[std.id] || {};
        let rowTotal = 0;
        SUB_PROGRAMS.forEach((sp, i) => {
          const val = stdData[sp.id] || 0;
          row[`sp${i + 1}`] = Math.abs(val) > 0 ? Math.abs(val).toLocaleString('id-ID') : 0;
          rowTotal += Math.abs(val);
        });
        row.jumlah = rowTotal > 0 ? rowTotal.toLocaleString('id-ID') : 0;
        return row;
      });

      // Add totals row
      const totalsRow = { no: '', standar: 'JUMLAH' };
      let grandTotal = 0;
      SUB_PROGRAMS.forEach((sp, i) => {
        const colTotal = data?.bySubProgram?.[sp.id] || 0;
        totalsRow[`sp${i + 1}`] =
          Math.abs(colTotal) > 0 ? Math.abs(colTotal).toLocaleString('id-ID') : 0;
        grandTotal += Math.abs(colTotal);
      });
      totalsRow.jumlah = grandTotal > 0 ? grandTotal.toLocaleString('id-ID') : 0;

      // Complex Header Definition
      const headerRow1 = [
        { content: 'No.\nUrut', rowSpan: 3, styles: { valign: 'middle', halign: 'center' } },
        {
          content: 'Standar Nasional\nPendidikan',
          rowSpan: 3,
          styles: { valign: 'middle', halign: 'center' },
        },
        {
          content: 'SUB PROGRAM',
          colSpan: 12,
          styles: { halign: 'center', fontStyle: 'bold', valign: 'middle' },
        },
        { content: 'Jumlah', rowSpan: 3, styles: { valign: 'middle', halign: 'center' } },
      ];

      const headerRow2 = SUB_PROGRAMS.map((sp) => ({
        content: sp.nama,
        styles: { halign: 'center', fontSize: 6, valign: 'middle' },
      }));

      const headerRow3 = SUB_PROGRAMS.map((_, i) => ({
        content: (i + 1).toString(),
        styles: { halign: 'center', fontSize: 7 },
      }));

      // Generate Equal Column Styles
      const colStyles = {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 40 }, // Widened for standard name
      };
      // Cols 2-14 (13 columns). Usable 320 - 48 = 272. 272/13 ~ 20.9mm
      for (let i = 2; i <= 14; i++) {
        colStyles[i] = { cellWidth: 20.5, halign: 'right' };
      }
      // Bold last column (Jumlah)
      colStyles[14] = { ...colStyles[14], fontStyle: 'bold' };

      autoTable(doc, {
        startY: y,
        head: [headerRow1, headerRow2, headerRow3],
        body: tableData.map((row) => tableColumns.map((c) => row[c.dataKey])),
        foot: [tableColumns.map((c) => totalsRow[c.dataKey])],
        theme: 'grid',
        styles: {
          fontSize: 7,
          cellPadding: 1.5,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          textColor: [0, 0, 0],
          fillColor: [255, 255, 255],
          valign: 'middle',
          font: 'helvetica',
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'center',
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
        },
        footStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'right',
          valign: 'middle',
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255],
        },
        columnStyles: colStyles,
        margin: { left: 5, right: 5 },
      });

      y = doc.lastAutoTable.finalY + 8;

      // Summary Table
      const summaryData = [
        ['Saldo periode sebelumnya', ':', formatRupiah(Math.abs(data?.saldoAwal || 0))],
        [
          'Total penerimaan dana BOSP periode ini',
          ':',
          formatRupiah(Math.abs(data?.totalPenerimaan || 0)),
        ],
        [
          'Total penggunaan dana BOSP periode ini',
          ':',
          formatRupiah(Math.abs(data?.totalPengeluaran || 0)),
        ],
        ['Akhir saldo BOSP periode ini', ':', formatRupiah(Math.abs(data?.sisaDana || 0))],
      ];

      autoTable(doc, {
        startY: y,
        body: summaryData,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1, font: 'helvetica' },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 4 },
          2: { cellWidth: 100 },
        },
        margin: { left: 5, right: 5 },
      });
      y = doc.lastAutoTable.finalY + 10;

      // Signatures
      const sigHeight = 40;
      if (y + sigHeight > doc.internal.pageSize.getHeight() - 10) {
        doc.addPage();
        y = 20;
      }

      doc.setFont('helvetica', 'normal'); // Reset bold
      const sigWidth = 70;
      doc.text('Menyetujui,', margin, y);
      doc.text('Bendahara /', pageWidth - margin - sigWidth, y);
      y += 4;
      doc.text('Kepala Sekolah', margin, y);
      doc.text('Penanggungjawab Kegiatan', pageWidth - margin - sigWidth, y);
      y += 18;
      doc.text(school?.kepala_sekolah || '......................', margin, y);
      doc.text(school?.bendahara || '......................', pageWidth - margin - sigWidth, y);
      y += 4;
      doc.text(`NIP. ${school?.nip_kepala || '......................'}`, margin, y);
      doc.text(
        `NIP. ${school?.nip_bendahara || '......................'}`,
        pageWidth - margin - sigWidth,
        y
      );

      doc.save(`K7_${activeFund}_${year}.pdf`);
    } catch (error) {
      console.error('Export Error:', error);
      toast.error('Gagal mengekspor PDF: ' + error.message);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-red-600">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-purple-600 text-white rounded-lg">
          Coba Lagi
        </button>
      </div>
    );
  }

  const fundLabel = fundSources.find((f) => f.id === activeFund)?.label || 'BOS Reguler';

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <ToastContainer />
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-purple-200">
            <ClipboardList size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              LAPORAN
            </span>
            <h2 className="text-lg font-bold text-slate-800">
              Laporan K7 / K7a - Rekapitulasi Penggunaan Dana
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
          {/* Period Type */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {['tahap', 'bulan', 'tahunan'].map((type) => (
              <button
                key={type}
                onClick={() => setPeriodType(type)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                  periodType === type
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-slate-200" />

          {/* Period Details */}
          {periodType === 'tahap' && (
            <div className="flex items-center gap-1.5 bg-indigo-50/50 p-1 rounded-lg border border-indigo-100">
              {['1', '2'].map((tahap) => (
                <button
                  key={tahap}
                  onClick={() => setActiveTahap(tahap)}
                  className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
                    activeTahap === tahap
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-indigo-600 hover:bg-indigo-50'
                  }`}
                >
                  Tahap {tahap}
                </button>
              ))}
            </div>
          )}

          {periodType === 'bulan' && (
            <div className="flex items-center gap-2 bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100">
              <span className="text-xs font-bold text-indigo-600 uppercase">Bulan:</span>
              <select
                value={activeMonth}
                onChange={(e) => setActiveMonth(e.target.value)}
                className="bg-transparent text-sm font-semibold text-indigo-700 focus:outline-none cursor-pointer"
              >
                {months.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="w-px h-8 bg-slate-200" />

          {/* Fund Source Tabs */}
          <div className="flex items-center gap-1.5 bg-amber-50/50 p-1 rounded-lg border border-amber-100">
            {fundSources.map((fund) => (
              <button
                key={fund.id}
                onClick={() => setActiveFund(fund.id)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${
                  activeFund === fund.id
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-amber-600 hover:bg-amber-50'
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
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Document Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 overflow-x-auto">
        {/* Title */}
        <div className="text-center mb-4">
          <h1 className="text-base font-bold text-slate-800">
            REKAPITULASI REALISASI PENGGUNAAN DANA BOSP {activeFund.toUpperCase()}
          </h1>
          <p className="text-sm text-slate-600">PERIODE TANGGAL : {getPeriodString()}</p>
          <p className="text-sm font-semibold text-slate-700">
            {periodType === 'bulan'
              ? `BULAN ${months.find((m) => m.id === activeMonth)?.label.toUpperCase()} TAHUN ${year}`
              : periodType === 'tahunan'
                ? `TAHUN ${year}`
                : `TAHAP ${activeTahap} TAHUN ${year}`}
          </p>
        </div>

        {/* School Info */}
        <div className="text-xs space-y-1 mb-4">
          <div className="grid grid-cols-12 gap-2">
            <span className="col-span-2">NPSN</span>
            <span className="col-span-10">: {school?.npsn || '-'}</span>
          </div>
          <div className="grid grid-cols-12 gap-2">
            <span className="col-span-2">Nama Sekolah</span>
            <span className="col-span-10">: {school?.nama_sekolah || '-'}</span>
          </div>
          <div className="grid grid-cols-12 gap-2">
            <span className="col-span-2">Kecamatan</span>
            <span className="col-span-10">: {school?.kecamatan || '-'}</span>
          </div>
          <div className="grid grid-cols-12 gap-2">
            <span className="col-span-2">Kabupaten/Kota</span>
            <span className="col-span-10">: {school?.kabupaten || '-'}</span>
          </div>
          <div className="grid grid-cols-12 gap-2">
            <span className="col-span-2">Provinsi</span>
            <span className="col-span-10">: {school?.provinsi || '-'}</span>
          </div>
          <div className="grid grid-cols-12 gap-2">
            <span className="col-span-2">Sumber Dana</span>
            <span className="col-span-10">: {fundLabel}</span>
          </div>
        </div>

        {/* Main Table */}
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-xs border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100">
                <th rowSpan="3" className="border border-slate-300 p-2 w-8">
                  No. Urut
                </th>
                <th rowSpan="3" className="border border-slate-300 p-2 min-w-[180px]">
                  Standar Nasional Pendidikan
                </th>
                <th colSpan="12" className="border border-slate-300 p-2">
                  SUB PROGRAM
                </th>
                <th rowSpan="3" className="border border-slate-300 p-2 w-20">
                  Jumlah
                </th>
              </tr>
              <tr className="bg-slate-50">
                {SUB_PROGRAMS.map((sp) => (
                  <th
                    key={sp.id}
                    className="border border-slate-300 p-1 w-20 text-[8px] font-medium align-bottom"
                  >
                    {sp.nama}
                  </th>
                ))}
              </tr>
              <tr className="bg-slate-50">
                {SUB_PROGRAMS.map((sp, i) => (
                  <th
                    key={sp.id}
                    className="border border-slate-300 p-1 w-20 text-[10px] font-bold"
                  >
                    {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STANDAR_PENDIDIKAN.map((std, idx) => {
                const stdData = data?.byStandar?.[std.id] || {};
                let rowTotal = 0;
                return (
                  <tr key={std.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                    <td className="border border-slate-300 p-2">{std.nama}</td>
                    {SUB_PROGRAMS.map((sp) => {
                      const val = stdData[sp.id] || 0;
                      rowTotal += val;
                      return (
                        <td key={sp.id} className="border border-slate-300 p-1 text-right">
                          {Math.abs(val) > 0 ? Math.abs(val).toLocaleString('id-ID') : 0}
                        </td>
                      );
                    })}
                    <td className="border border-slate-300 p-2 text-right font-medium">
                      {rowTotal > 0 ? rowTotal.toLocaleString('id-ID') : 0}
                    </td>
                  </tr>
                );
              })}
              {/* Totals Row */}
              <tr className="bg-slate-200 font-bold">
                <td className="border border-slate-300 p-2"></td>
                <td className="border border-slate-300 p-2">JUMLAH</td>
                {SUB_PROGRAMS.map((sp) => {
                  const colTotal = data?.bySubProgram?.[sp.id] || 0;
                  return (
                    <td key={sp.id} className="border border-slate-300 p-1 text-right">
                      {Math.abs(colTotal) > 0 ? Math.abs(colTotal).toLocaleString('id-ID') : 0}
                    </td>
                  );
                })}
                <td className="border border-slate-300 p-2 text-right">
                  {(() => { const sum = SUB_PROGRAMS.reduce((s, sp) => s + Math.abs(data?.bySubProgram?.[sp.id] || 0), 0); return sum > 0 ? sum.toLocaleString('id-ID') : 0; })()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="text-sm space-y-1 mb-6">
          <div className="flex">
            <span className="w-64">Saldo periode sebelumnya</span>
            <span>: {formatRupiah(data?.saldoAwal || 0)}</span>
          </div>
          <div className="flex">
            <span className="w-64">Total penerimaan dana BOSP periode ini</span>
            <span>: {formatRupiah(data?.totalPenerimaan || 0)}</span>
          </div>
          <div className="flex">
            <span className="w-64">Total penggunaan dana BOSP periode ini</span>
            <span>: {formatRupiah(data?.totalPengeluaran || 0)}</span>
          </div>
          <div className="flex font-bold">
            <span className="w-64">Akhir saldo BOSP periode ini</span>
            <span className="text-emerald-600">: {formatRupiah(data?.sisaDana || 0)}</span>
          </div>
        </div>

        {/* Signatures */}
        <div className="flex justify-between mt-8 text-sm">
          <div className="text-center">
            <p className="mb-1">Menyetujui,</p>
            <p className="mb-16">Kepala Sekolah</p>
            <p className="font-medium border-b border-slate-400 pb-1 inline-block">
              {school?.kepala_sekolah || '.......................'}
            </p>
            <p className="mt-1 text-slate-500 text-xs">
              NIP. {school?.nip_kepala || '.......................'}
            </p>
          </div>
          <div className="text-center">
            <p className="mb-1">Bendahara /</p>
            <p className="mb-16">Penanggungjawab Kegiatan</p>
            <p className="font-medium border-b border-slate-400 pb-1 inline-block">
              {school?.bendahara || '.......................'}
            </p>
            <p className="mt-1 text-slate-500 text-xs">
              NIP. {school?.nip_bendahara || '.......................'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
