import { useState, useEffect, useMemo } from 'react';
import { useArkasData } from '../hooks/useArkasData';
import { useFilter } from '../context/FilterContext';
import {
  Printer,
  Download,
  Save,
  AlertTriangle,
  CheckCircle,
  Calculator,
  Banknote,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { formatRupiah } from '../utils/transactionHelpers';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NOTES = [100000, 50000, 20000, 10000, 5000, 2000, 1000];
const COINS = [1000, 500, 200, 100];
const MONTHS = [
  { id: 1, label: 'Januari' },
  { id: 2, label: 'Februari' },
  { id: 3, label: 'Maret' },
  { id: 4, label: 'April' },
  { id: 5, label: 'Mei' },
  { id: 6, label: 'Juni' },
  { id: 7, label: 'Juli' },
  { id: 8, label: 'Agustus' },
  { id: 9, label: 'September' },
  { id: 10, label: 'Oktober' },
  { id: 11, label: 'November' },
  { id: 12, label: 'Desember' },
];

export default function RegisterKas() {
  const { year, fundSource, setFundSource } = useFilter();
  const { availableSources, school } = useArkasData();
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth() + 1); // 1-indexed to match MONTHS array (id: 1 = Jan)

  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState({
    saldo_buku: 0,
    saldo_bank: 0,
    saldo_pajak: 0,
    total_penerimaan: 0,
    total_pengeluaran: 0,
  });

  const [noteCounts, setNoteCounts] = useState(Object.fromEntries(NOTES.map((n) => [n, 0])));
  const [coinCounts, setCoinCounts] = useState(Object.fromEntries(COINS.map((c) => [c, 0])));
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [exportMenu, setExportMenu] = useState(null);

  // Fetch Balances + Load denominations when filter changes
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      // Reset to zero first
      setNoteCounts(Object.fromEntries(NOTES.map((n) => [n, 0])));
      setCoinCounts(Object.fromEntries(COINS.map((c) => [c, 0])));

      try {
        const res = await window.arkas.getClosingBalances(year, activeMonth, fundSource);
        if (res.success) {
          setBalances((prev) => ({ ...prev, ...res.data }));
        }
      } catch (error) {
        console.error('Failed to load closing balances', error);
      }

      try {
        if (window.arkas?.getRegisterKas) {
          const res = await window.arkas.getRegisterKas(year, activeMonth, fundSource);
          if (res.success && res.data) {
            const savedNotes = res.data.notes || {};
            const savedCoins = res.data.coins || {};
            setNoteCounts(Object.fromEntries(NOTES.map((n) => [n, savedNotes[n] || 0])));
            setCoinCounts(Object.fromEntries(COINS.map((c) => [c, savedCoins[c] || 0])));
            if (res.data.updatedAt) setLastSaved(res.data.updatedAt);
          }
        }
      } catch (e) {
        console.error('Gagal memuat data register:', e);
      }

      setLoading(false);
    }
    loadData();
  }, [year, activeMonth, fundSource]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (window.arkas?.saveRegisterKas) {
        await window.arkas.saveRegisterKas(year, activeMonth, fundSource, {
          notes: noteCounts,
          coins: coinCounts,
        });
        setLastSaved(new Date().toISOString());
        toast.success('Register kas berhasil disimpan.');
      }
    } catch (e) {
      console.error('Gagal menyimpan register:', e);
    }
    setSaving(false);
  };

  const handleNoteChange = (denom, count) => {
    setNoteCounts((prev) => ({ ...prev, [denom]: parseInt(count) || 0 }));
  };
  const handleCoinChange = (denom, count) => {
    setCoinCounts((prev) => ({ ...prev, [denom]: parseInt(count) || 0 }));
  };

  // Derived Calculations
  const totalNotes = useMemo(
    () => NOTES.reduce((acc, val) => acc + val * (noteCounts[val] || 0), 0),
    [noteCounts]
  );
  const totalCoins = useMemo(
    () => COINS.reduce((acc, val) => acc + val * (coinCounts[val] || 0), 0),
    [coinCounts]
  );
  const totalFisik = totalNotes + totalCoins;
  const difference = balances.saldo_buku - totalFisik;

  // Generate PDF Logic
  const handlePrintRegister = () => {
    const doc = new jsPDF({ format: [215, 330] }); // F4 paper size

    doc
      .setFontSize(14)
      .setFont('times', 'bold')
      .text('REGISTER PENUTUPAN KAS', 107.5, 20, { align: 'center' });

    // Header Info
    let y = 35;
    doc.setFontSize(10).setFont('times', 'normal');

    const mLabel = MONTHS.find((m) => m.id === activeMonth)?.label;
    // Last Day of Month Calculation
    const lastDay = new Date(year, activeMonth, 0).getDate(); // activeMonth is 1-based in our ID
    const dateStr = `${lastDay} ${mLabel} ${year}`;

    // Find previous month date
    const prevMonth = activeMonth === 1 ? 12 : activeMonth - 1;
    const prevYear = activeMonth === 1 ? year - 1 : year;
    const prevMLabel =
      activeMonth === 1 && prevYear < year
        ? 'Desember'
        : MONTHS.find((m) => m.id === prevMonth)?.label;
    const prevDateStr = new Date(prevYear, prevMonth, 0).getDate() + ` ${prevMLabel} ${prevYear}`;

    const headerData = [
      ['Tanggal Penutupan Kas', ':', dateStr],
      ['Nama Penutup Kas (Pemegang Kas)', ':', school?.bendahara || '......................'],
      ['Tanggal Penutupan Kas Yang Lalu', ':', prevDateStr],
      ['Jumlah Penerimaan (D)', ':', formatRupiah(balances.total_penerimaan)],
      ['Jumlah Total Pengeluaran (K)', ':', formatRupiah(balances.total_pengeluaran)],
      ['Saldo Buku (A = D - K)', ':', formatRupiah(balances.saldo_buku)],
      ['Saldo Kas (B)', ':', formatRupiah(totalFisik)], // Physical cash count
    ];

    autoTable(doc, {
      startY: y,
      body: headerData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 1 },
      columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 5 }, 2: { cellWidth: 80 } },
    });

    y = doc.lastAutoTable.finalY + 10;
    doc.text('Saldo kas B terdiri dari :', 14, y);
    y += 5;

    // Details Table
    // Section 1: Kertas
    const body = [];
    let subTotal1 = 0;
    NOTES.forEach((val, idx) => {
      const qty = noteCounts[val] || 0;
      const sub = val * qty;
      subTotal1 += sub;
      body.push([
        idx === 0 ? '1. Lembaran uang kertas' : 'Lembaran uang kertas',
        `Rp. ${val.toLocaleString('id-ID')}`,
        `${qty} Lembar`,
        `Rp. ${sub.toLocaleString('id-ID')}`,
      ]);
    });
    body.push(['', '', 'Sub Jumlah (1)', `Rp. ${subTotal1.toLocaleString('id-ID')}`]);

    // Section 2: Logam
    let subTotal2 = 0;
    COINS.forEach((val, idx) => {
      const qty = coinCounts[val] || 0;
      const sub = val * qty;
      subTotal2 += sub;
      body.push([
        idx === 0 ? '2. Keping uang logam' : 'Keping uang logam',
        `Rp. ${val.toLocaleString('id-ID')}`,
        `${qty} Keping`,
        `Rp. ${sub.toLocaleString('id-ID')}`,
      ]);
    });
    body.push(['', '', 'Sub Jumlah (2)', `Rp. ${subTotal2.toLocaleString('id-ID')}`]);

    // Section 3 & 4
    body.push([
      '3. Saldo Bank, Surat Berharga dll',
      '',
      'Sub Jumlah (3)',
      `Rp. ${(balances.saldo_bank || 0).toLocaleString('id-ID')}`,
    ]);
    body.push([
      '4. Saldo Kas Pajak',
      '',
      'Sub Jumlah (4)',
      `Rp. ${(balances.saldo_pajak || 0).toLocaleString('id-ID')}`,
    ]);

    const totalSemua = subTotal1 + subTotal2 + balances.saldo_bank; // + Pajak? Usually Pajak is part of Bank/Tunai mix, but here treated separate line? No, layout imply addition.

    body.push(['', '', 'Jumlah (1+2)', `Rp. ${(subTotal1 + subTotal2).toLocaleString('id-ID')}`]);
    body.push([
      '',
      '',
      'Perbedaan',
      `Rp. ${(balances.saldo_buku - (subTotal1 + subTotal2)).toLocaleString('id-ID')}`,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Keterangan', 'Nominal', 'Jumlah', 'Total']],
      body: body,
      theme: 'grid',
      styles: { fontSize: 11, cellPadding: 2 },
      headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: 'bold', halign: 'center' },
      margin: { left: 20 },
      columnStyles: {
        0: { cellWidth: 65 },
        1: { cellWidth: 30, halign: 'right' },
        2: { cellWidth: 35, halign: 'center' },
        3: { cellWidth: 40, halign: 'right' },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    // Signatures
    y = doc.lastAutoTable.finalY + 20;

    doc.text(`${school?.kabupaten?.replace('Kab. ', '') || ''}, ${dateStr}`, 145, y);
    y += 10;

    doc.text('Yang diperiksa,', 30, y);
    doc.text('Yang Memeriksa,', 145, y);
    y += 5;
    doc.text('Bendahara BOS / Pemegang KAS', 30, y);
    doc.text('Kepala Sekolah', 145, y);
    y += 5;
    doc.text(school?.nama_sekolah || '', 30, y);
    doc.text(school?.nama_sekolah || '', 145, y);
    y += 25;

    doc.text(school?.bendahara || '......................', 30, y);
    doc.text(school?.kepala_sekolah || '......................', 145, y);
    y += 5;
    doc.text(`NIP. ${school?.nip_bendahara || '-'}`, 30, y);
    doc.text(`NIP. ${school?.nip_kepala || '-'}`, 145, y);

    doc.save(`Register_Penutupan_Kas_${mLabel}_${year}.pdf`);
  };

  const handlePrintBA = () => {
    // Similar to above but cleaner "Berita Acara" format
    const doc = new jsPDF({ format: [215, 330] });

    doc
      .setFontSize(14)
      .setFont('times', 'bold')
      .text('BERITA ACARA PEMERIKSAAAN KAS', 107.5, 20, { align: 'center' });
    const mLabel = MONTHS.find((m) => m.id === activeMonth)?.label;
    doc.text(`PERIODE : ${mLabel} ${year}`, 107.5, 27, { align: 'center' });

    let y = 40;
    doc.setFontSize(10).setFont('times', 'normal');

    // Date calculation moved below to dateObj

    const dateObj = new Date(year, activeMonth, 0);
    const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
    const dateNum = dateObj.getDate();

    const text = `Pada hari ini ${dayName} tanggal ${dateNum} Bulan ${mLabel} Tahun ${year}, Yang bertanda tangan di bawah ini:`;
    doc.text(text, 14, y, { maxWidth: 180 });
    y += 15;

    // Inspector (Kepala)
    doc.text(`Nama      : ${school?.kepala_sekolah || '-'}`, 14, y);
    y += 5;
    doc.text(`Jabatan   : Kepala Sekolah`, 14, y);
    y += 10;

    doc.text('Melakukan pemeriksaan KAS kepada :', 14, y);
    y += 10;

    // Inspectee (Bendahara)
    doc.text(`Nama      : ${school?.bendahara || '-'}`, 14, y);
    y += 5;
    doc.text(`Jabatan   : Bendahara BOS / Pemegang KAS`, 14, y);
    y += 15;

    const skText = `Yang berdasarkan Surat Keputusan No. ${school?.nomor_sk || '.............................................'} ditugaskan dengan pengurusan uang BOS. Berdasarkan pemeriksaan kas serta bukti-bukti dalam pengurusan itu, kami menemui kenyataan sebagai berikut:`;
    doc.text(skText, 14, y, { maxWidth: 180 });
    y += 20;

    const tableBody = [
      ['a', 'Saldo KAS (Uang kertas dan logam)', ':', formatRupiah(totalFisik)],
      ['b', 'Saldo Bank', ':', formatRupiah(balances.saldo_bank)],
      ['c', 'Saldo Pajak', ':', formatRupiah(balances.saldo_pajak)],
      ['', 'Jumlah', ':', formatRupiah(totalFisik + balances.saldo_bank)],
    ];

    autoTable(doc, {
      startY: y,
      body: tableBody,
      theme: 'plain',
      margin: { left: 40 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 80 },
        2: { cellWidth: 5 },
        3: { cellWidth: 40, halign: 'right' },
      },
    });

    y = doc.lastAutoTable.finalY + 10;
    doc.text(
      `Perbedaan Antara Saldo KAS dan Kas Umum : ${formatRupiah(balances.saldo_buku - totalFisik)}`,
      14,
      y
    );

    // Signatures (Copy from above)
    // ... (Simplified for brevity of implementation plan code)
    y += 20;
    const lastDay = new Date(year, activeMonth, 0).getDate();
    doc.text(
      `${school?.kabupaten?.replace('Kab. ', '') || ''}, ${lastDay} ${mLabel} ${year}`,
      160,
      y,
      { align: 'center' }
    );
    y += 10;
    doc.text('Bendahara', 55, y, { align: 'center' });
    doc.text('Kepala Sekolah', 160, y, { align: 'center' });
    y += 25;
    doc.text(school?.bendahara || '......................', 55, y, { align: 'center' });
    doc.text(school?.kepala_sekolah || '......................', 160, y, { align: 'center' });

    doc.save(`Berita_Acara_Kas_${mLabel}_${year}.pdf`);
  };

  const getMonthLabel = () => MONTHS.find((m) => m.id === activeMonth)?.label || '';
  const getLastDay = () => new Date(year, activeMonth, 0).getDate();

  const handleExportRegister = async (format) => {
    if (format === 'pdf') {
      handlePrintRegister();
      return;
    }
    if (format === 'pdf-ba') {
      handlePrintBA();
      return;
    }

    const mLabel = getMonthLabel();
    const dateStr = `${getLastDay()} ${mLabel} ${year}`;
    const title = format === 'xlsx-ba' ? 'BERITA ACARA PEMERIKSAAAN KAS' : 'REGISTER PENUTUPAN KAS';

    if (format === 'xlsx') {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'SmartSPJ';
      const ws = wb.addWorksheet('Register Kas');
      ws.columns = [{ width: 5 }, { width: 45 }, { width: 20 }, { width: 18 }, { width: 25 }];

      let r = 1;
      ws.mergeCells(`A${r}:E${r}`);
      ws.getCell(`A${r}`).value = title;
      ws.getCell(`A${r}`).font = { bold: true, size: 14, color: { argb: 'FF1E293B' } };
      ws.getCell(`A${r}`).alignment = { horizontal: 'center' };
      r += 2;

      const headerData = [
        ['Tanggal Penutupan Kas', ':', dateStr],
        ['Penutup Kas', ':', school?.bendahara || '-'],
        ['Saldo Buku (Sistem)', ':', balances.saldo_buku],
        ['Total Penerimaan', ':', balances.total_penerimaan],
        ['Total Pengeluaran', ':', balances.total_pengeluaran],
      ];
      headerData.forEach(([label, sep, val]) => {
        ws.getCell(`B${r}`).value = label;
        ws.getCell(`B${r}`).font = { bold: true, size: 10 };
        ws.getCell(`C${r}`).value = sep;
        ws.getCell(`D${r}`).value = typeof val === 'number' ? val : val;
        if (typeof val === 'number') ws.getCell(`D${r}`).numFmt = '#,##0';
        r++;
      });
      r++;

      // Pecahan table
      const borderStyle = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
      const addRow = (cells, opts = {}) => {
        const row = ws.getRow(r);
        cells.forEach((val, i) => {
          const cell = row.getCell(i + 2);
          cell.value = val;
          cell.font = { size: 10, bold: !!opts.bold };
          cell.alignment = i >= 3 ? { horizontal: 'right' } : { horizontal: 'left' };
          cell.border = borderStyle;
          if (typeof val === 'number') cell.numFmt = '#,##0';
        });
        r++;
      };

      addRow(['Keterangan', 'Nominal', 'Jumlah', 'Total'], { bold: true });
      let subTotal1 = 0;
      NOTES.forEach((note, i) => {
        const qty = noteCounts[note] || 0;
        const sub = note * qty;
        subTotal1 += sub;
        addRow([
          i === 0 ? '1. Lembaran uang kertas' : '',
          `Rp ${note.toLocaleString('id-ID')}`,
          `${qty} Lembar`,
          sub,
        ]);
      });
      addRow(['', '', 'Sub Jumlah (1)', subTotal1], { bold: true });

      let subTotal2 = 0;
      COINS.forEach((coin, i) => {
        const qty = coinCounts[coin] || 0;
        const sub = coin * qty;
        subTotal2 += sub;
        addRow([
          i === 0 ? '2. Keping uang logam' : '',
          `Rp ${coin.toLocaleString('id-ID')}`,
          `${qty} Keping`,
          sub,
        ]);
      });
      addRow(['', '', 'Sub Jumlah (2)', subTotal2], { bold: true });
      addRow(['', '', 'Jumlah (1+2)', subTotal1 + subTotal2], { bold: true });
      addRow(['3. Saldo Bank', '', '', balances.saldo_bank]);
      addRow(['4. Saldo Pajak', '', '', balances.saldo_pajak]);
      addRow(['', '', 'Perbedaan', balances.saldo_buku - (subTotal1 + subTotal2)], { bold: true });

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Register_Penutupan_Kas_${mLabel}_${year}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    }

    if (format === 'xlsx-ba') {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'SmartSPJ';
      const ws = wb.addWorksheet('Berita Acara');
      ws.columns = [{ width: 5 }, { width: 50 }, { width: 5 }, { width: 25 }];

      let r = 1;
      ws.mergeCells(`A${r}:D${r}`);
      ws.getCell(`A${r}`).value = 'BERITA ACARA PEMERIKSAAAN KAS';
      ws.getCell(`A${r}`).font = { bold: true, size: 14, color: { argb: 'FF1E293B' } };
      ws.getCell(`A${r}`).alignment = { horizontal: 'center' };
      r++;
      ws.getCell(`A${r}`).value = `PERIODE: ${mLabel} ${year}`;
      ws.getCell(`A${r}`).font = { bold: true, size: 11 };
      ws.getCell(`A${r}`).alignment = { horizontal: 'center' };
      r += 2;

      const dateObj = new Date(year, activeMonth, 0);
      const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
      ws.getCell(`B${r}`).value =
        `Pada hari ini ${dayName} tanggal ${getLastDay()} Bulan ${mLabel} Tahun ${year}`;
      r += 2;
      ws.getCell(`B${r}`).value = `Nama: ${school?.kepala_sekolah || '-'}`;
      r++;
      ws.getCell(`B${r}`).value = 'Jabatan: Kepala Sekolah';
      r += 2;
      ws.getCell(`B${r}`).value = 'Melakukan pemeriksaan KAS kepada:';
      r += 2;
      ws.getCell(`B${r}`).value = `Nama: ${school?.bendahara || '-'}`;
      r++;
      ws.getCell(`B${r}`).value = 'Jabatan: Bendahara BOS / Pemegang KAS';
      r += 2;

      const borderStyle = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
      [
        ['a', 'Saldo KAS (Uang kertas dan logam)', ':', totalFisik],
        ['b', 'Saldo Bank', ':', balances.saldo_bank],
        ['c', 'Saldo Pajak', ':', balances.saldo_pajak],
        ['', 'Jumlah', ':', totalFisik + balances.saldo_bank],
        ['', 'Perbedaan', ':', balances.saldo_buku - totalFisik],
      ].forEach(([a, b, c, d]) => {
        const row = ws.getRow(r);
        [
          [1, a],
          [2, b],
          [3, c],
          [4, d],
        ].forEach(([col, val]) => {
          const cell = row.getCell(col);
          cell.value = val;
          cell.font = { size: 10 };
          cell.border = borderStyle;
          if (typeof val === 'number') cell.numFmt = '#,##0';
        });
        r++;
      });

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Berita_Acara_Kas_${mLabel}_${year}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    }

    setExportMenu(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <ToastContainer />
      {/* Page Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Banknote size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
              PENATAUSAHAAN
            </span>
            <h2 className="text-lg font-bold text-slate-800 leading-tight">
              REGISTER PENUTUPAN KAS
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 uppercase tracking-wide">
            TA {year}
          </span>
          <select
            value={activeMonth}
            onChange={(e) => setActiveMonth(parseInt(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent cursor-pointer"
          >
            {MONTHS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            value={fundSource}
            onChange={(e) => setFundSource(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent cursor-pointer"
          >
            <option value="SEMUA">Semua Sumber Dana</option>
            {availableSources?.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="w-px h-8 bg-slate-200" />
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition active:scale-95 disabled:opacity-50 shadow-sm"
          >
            <Save size={15} className={saving ? 'animate-spin' : ''} />
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
          {lastSaved && (
            <span className="text-[10px] text-slate-400">
              {new Date(lastSaved).toLocaleString('id-ID')}
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Col 1: Uang Kertas */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-blue-50/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <span className="font-extrabold text-blue-600 text-[10px]">Rp</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Uang Kertas</h3>
                <p className="text-[10px] text-slate-500">Jumlah lembar</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 space-y-2">
            {NOTES.map((note) => {
              const count = noteCounts[note] || 0;
              const subtotal = count * note;
              return (
                <div key={note} className="flex items-center gap-2">
                  <div className="w-[72px] text-right text-xs font-bold text-slate-500 tabular-nums">
                    {note.toLocaleString('id-ID')}
                  </div>
                  <span className="text-slate-300 text-[10px]">&times;</span>
                  <input
                    type="number"
                    min="0"
                    value={count || ''}
                    onChange={(e) => handleNoteChange(note, e.target.value)}
                    className="w-16 bg-white border border-slate-200 rounded-md px-2 py-1 text-center font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent tabular-nums"
                    placeholder="0"
                  />
                  <span className="text-slate-300 text-[10px]">=</span>
                  <div className="flex-1 text-right font-semibold text-slate-700 text-sm tabular-nums">
                    {subtotal > 0 ? subtotal.toLocaleString('id-ID') : '-'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Kertas
            </span>
            <span className="font-extrabold text-blue-600 tabular-nums">
              {formatRupiah(totalNotes)}
            </span>
          </div>
        </div>

        {/* Col 2: Uang Logam */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-amber-50/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <span className="font-extrabold text-amber-600 text-[10px]">¢</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Uang Logam</h3>
                <p className="text-[10px] text-slate-500">Jumlah keping</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 space-y-2">
            {COINS.map((coin) => {
              const count = coinCounts[coin] || 0;
              const subtotal = count * coin;
              return (
                <div key={coin} className="flex items-center gap-2">
                  <div className="w-[72px] text-right text-xs font-bold text-slate-500 tabular-nums">
                    {coin.toLocaleString('id-ID')}
                  </div>
                  <span className="text-slate-300 text-[10px]">&times;</span>
                  <input
                    type="number"
                    min="0"
                    value={count || ''}
                    onChange={(e) => handleCoinChange(coin, e.target.value)}
                    className="w-16 bg-white border border-slate-200 rounded-md px-2 py-1 text-center font-bold text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent tabular-nums"
                    placeholder="0"
                  />
                  <span className="text-slate-300 text-[10px]">=</span>
                  <div className="flex-1 text-right font-semibold text-slate-700 text-sm tabular-nums">
                    {subtotal > 0 ? subtotal.toLocaleString('id-ID') : '-'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Logam
            </span>
            <span className="font-extrabold text-amber-600 tabular-nums">
              {formatRupiah(totalCoins)}
            </span>
          </div>
        </div>

        {/* Col 3: Ringkasan */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-orange-50/30">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Calculator size={15} className="text-orange-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Ringkasan</h3>
                <p className="text-[10px] text-slate-500">Status balance kas tunai</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 space-y-4">
            {/* Saldo Buku */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Saldo Buku (Sistem)
              </p>
              <p className="text-xl font-extrabold text-slate-800 tabular-nums">
                {loading ? '...' : formatRupiah(balances.saldo_buku)}
              </p>
            </div>

            {/* Total Fisik */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Total Fisik (Input)
              </p>
              <p className="text-xl font-extrabold text-indigo-600 tabular-nums">
                {formatRupiah(totalFisik)}
              </p>
              <div className="flex gap-2 mt-2">
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-semibold">
                  Kertas {formatRupiah(totalNotes)}
                </span>
                <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded font-semibold">
                  Logam {formatRupiah(totalCoins)}
                </span>
              </div>
            </div>

            {/* Status Balance */}
            <div
              className={`p-3 rounded-lg border-l-4 ${
                difference === 0
                  ? 'bg-emerald-50/50 border-emerald-500'
                  : 'bg-rose-50/50 border-rose-500'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                {difference === 0 ? (
                  <CheckCircle size={13} className="text-emerald-600" />
                ) : (
                  <AlertTriangle size={13} className="text-rose-600" />
                )}
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${
                    difference === 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {difference === 0 ? 'Balance' : 'Belum Balance'}
                </span>
              </div>
              <p
                className={`text-lg font-extrabold tabular-nums ${
                  difference === 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {difference === 0 ? 'Sesuai (Rp 0)' : formatRupiah(Math.abs(difference))}
              </p>
              {difference !== 0 && (
                <p className="text-[10px] text-rose-600 font-medium mt-0.5">
                  {difference > 0 ? 'Uang fisik KURANG dari buku' : 'Uang fisik LEBIH dari buku'}
                </p>
              )}
            </div>

            {/* Saldo Bank & Pajak */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Saldo Bank</span>
                <span className="text-xs font-bold text-slate-700 tabular-nums">
                  {formatRupiah(balances.saldo_bank)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Saldo Pajak</span>
                <span className="text-xs font-bold text-slate-700 tabular-nums">
                  {formatRupiah(balances.saldo_pajak)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-4 py-3 border-t border-slate-200 space-y-2">
            {/* Register K7b */}
            <div className="relative">
              <button
                onClick={() => setExportMenu(exportMenu === 'register' ? null : 'register')}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition active:scale-[0.97] shadow-sm"
              >
                <Printer size={14} />
                Register (K7b)
                <ChevronDown
                  size={12}
                  className={`transition ${exportMenu === 'register' ? 'rotate-180' : ''}`}
                />
              </button>
              {exportMenu === 'register' && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-lg border border-slate-200 shadow-lg z-10 overflow-hidden">
                  <button
                    onClick={() => handleExportRegister('pdf')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <FileText size={13} className="text-red-500" />
                    Export PDF
                  </button>
                  <button
                    onClick={() => handleExportRegister('xlsx')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <FileSpreadsheet size={13} className="text-emerald-600" />
                    Export Excel
                  </button>
                </div>
              )}
            </div>

            {/* Berita Acara */}
            <div className="relative">
              <button
                onClick={() => setExportMenu(exportMenu === 'ba' ? null : 'ba')}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition active:scale-[0.97]"
              >
                <Download size={14} />
                Berita Acara
                <ChevronDown
                  size={12}
                  className={`transition ${exportMenu === 'ba' ? 'rotate-180' : ''}`}
                />
              </button>
              {exportMenu === 'ba' && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-lg border border-slate-200 shadow-lg z-10 overflow-hidden">
                  <button
                    onClick={() => handleExportRegister('pdf-ba')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <FileText size={13} className="text-red-500" />
                    Export PDF
                  </button>
                  <button
                    onClick={() => handleExportRegister('xlsx-ba')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    <FileSpreadsheet size={13} className="text-emerald-600" />
                    Export Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
