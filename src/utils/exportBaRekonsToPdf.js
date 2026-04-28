import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatRupiah } from './reconciliationHelpers';

/**
 * Export BA Rekonsiliasi to PDF (Final Polish)
 */
export const exportBaRekonsToPdf = (
  data,
  signatoryData,
  schoolInfo,
  year,
  period,
  pajakData = null
) => {
  if (!data) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [215, 330], // F4
  });

  // COMPACT SETTINGS
  const margin = 12;
  const pageWidth = 215;
  const pageHeight = 330;
  const contentWidth = pageWidth - margin * 2;

  // COLORS
  const yellowStyle = { fillColor: [255, 255, 0] }; // Input Values
  const summaryStyle = { fontStyle: 'bold', fillColor: [255, 248, 220] }; // Beige for 'Jumlah'
  const finalBalanceStyle = { fontStyle: 'bold', fillColor: [220, 255, 220] }; // Green for 'Saldo Akhir'

  // --- DATA PROCESSING LOGIC ---
  const getPeriodInfo = (p) => {
    const periodMap = {
      tw1: { label: 'Triwulan I' },
      tw2: { label: 'Triwulan II' },
      tw3: { label: 'Triwulan III' },
      tw4: { label: 'Triwulan IV' },
      sm1: { label: 'Semester 1' },
      sm2: { label: 'Semester 2' },
      tahunan: { label: 'Tahun Anggaran' },
    };
    return periodMap[p] || periodMap['tahunan'];
  };

  const periodInfo = getPeriodInfo(period);

  const getDataForPeriod = () => {
    if (period === 'tahunan') {
      return data.annual || {};
    } else if (period.startsWith('tw')) {
      const qIndex = parseInt(period.charAt(2)) - 1;
      return data.quarterly?.[qIndex] || {};
    } else if (period.startsWith('sm')) {
      const sIndex = parseInt(period.charAt(2)) - 1;
      return data.semester?.[sIndex] || {};
    }
    return data.annual || {};
  };

  const periodData = getDataForPeriod();
  const income = periodData.income || {};
  const expenses = periodData.expenses || {};
  const opening = periodData.opening || data.annual?.opening || {};
  const closing = periodData.closing || data.annual?.closing || {};

  const openingDetails = opening.details || {};
  const saldoAwalLainnya =
    (openingDetails.lainnya?.bank || 0) + (openingDetails.lainnya?.tunai || 0);
  const saldoAwalReguler =
    (openingDetails.reguler?.bank || 0) + (openingDetails.reguler?.tunai || 0);
  const saldoAwalKinerja =
    (openingDetails.silpaKinerja?.bank || 0) + (openingDetails.silpaKinerja?.tunai || 0);

  const saldoAwalKinerja2025 =
    (openingDetails.kinerja?.bank || 0) + (openingDetails.kinerja?.tunai || 0);

  const terimaReguler1 = income.regulerT1 || 0;
  const terimaReguler2 = income.regulerT2 || 0;
  const terimaKinerja = income.kinerja || 0;

  const totalPenerimaan =
    saldoAwalLainnya +
    saldoAwalReguler +
    saldoAwalKinerja +
    saldoAwalKinerja2025 +
    terimaReguler1 +
    terimaReguler2 +
    terimaKinerja;

  const realisasiLainnya =
    (expenses.lainnya?.barangJasa || 0) +
    (expenses.lainnya?.modalMesin || 0) +
    (expenses.lainnya?.modalAset || 0);
  const realisasiReguler =
    (expenses.reguler?.barangJasa || 0) +
    (expenses.reguler?.modalMesin || 0) +
    (expenses.reguler?.modalAset || 0);
  const realisasiKinerja =
    (expenses.kinerja?.barangJasa || 0) +
    (expenses.kinerja?.modalMesin || 0) +
    (expenses.kinerja?.modalAset || 0);
  const realisasiSilpaKinerja =
    (expenses.silpaKinerja?.barangJasa || 0) +
    (expenses.silpaKinerja?.modalMesin || 0) +
    (expenses.silpaKinerja?.modalAset || 0);

  const totalBelanja =
    realisasiLainnya + realisasiReguler + realisasiKinerja + realisasiSilpaKinerja;
  const saldoAkhir = totalPenerimaan - totalBelanja;

  const closingDetails = closing.details || {};
  const saldoTunaiReguler = closingDetails.reguler?.tunai || 0;
  const saldoBankReguler = closingDetails.reguler?.bank || 0;
  const saldoTunaiKinerja =
    (closingDetails.kinerja?.tunai || 0) + (closingDetails.silpaKinerja?.tunai || 0);
  const saldoBankKinerja =
    (closingDetails.kinerja?.bank || 0) + (closingDetails.silpaKinerja?.bank || 0);
  const selisihBunga =
    (closing.bungaBank || 0) - (closing.pajakBunga || 0) - (closing.adminBank || 0);

  // --- PDF GENERATION ---

  let cursorY = 10;

  // 1. Header (Logo & Text)
  if (signatoryData?.logoBase64) {
    try {
      const imgProps = doc.getImageProperties(signatoryData.logoBase64);
      const ratio = imgProps.width / imgProps.height;
      const maxSize = 22;
      let w = maxSize;
      let h = w / ratio;
      if (h > maxSize) {
        h = maxSize;
        w = h * ratio;
      }
      const xOffset = (maxSize - w) / 2;
      const yOffset = (maxSize - h) / 2;
      doc.addImage(signatoryData.logoBase64, 'PNG', margin + xOffset, cursorY + 2 + yOffset, w, h);
    } catch (e) {
      doc.addImage(signatoryData.logoBase64, 'PNG', margin, cursorY + 2, 22, 22);
    }
  } else {
    doc.rect(margin, cursorY + 2, 22, 22);
  }

  const textStart = margin + 26;
  doc.setFont('times', 'bold');

  doc.setFontSize(13);
  doc.text(signatoryData?.header1 || '', pageWidth / 2, cursorY + 5, { align: 'center' });

  doc.setFontSize(13);
  doc.text(signatoryData?.header2 || '', pageWidth / 2, cursorY + 11, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text(signatoryData?.headerAlamat || '', pageWidth / 2, cursorY + 16, { align: 'center' });
  doc.text(signatoryData?.headerTelepon || '', pageWidth / 2, cursorY + 20, { align: 'center' });
  doc.text(signatoryData?.headerLaman || '', pageWidth / 2, cursorY + 24, { align: 'center' });

  cursorY += 28;
  doc.setLineWidth(0.5);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  doc.setLineWidth(0.2);
  doc.line(margin, cursorY + 1, pageWidth - margin, cursorY + 1);

  // 2. Title
  cursorY += 6;
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text('BERITA ACARA REKONSILIASI BOSP', pageWidth / 2, cursorY, { align: 'center' });

  cursorY += 5;
  doc.text(schoolInfo?.nama || schoolInfo?.nama_sekolah || 'Nama Sekolah', pageWidth / 2, cursorY, {
    align: 'center',
  });

  cursorY += 5;
  doc.setFontSize(10);
  doc.setFont('times', 'normal');
  const nomorBa = signatoryData?.nomorBa || '.../.../.../...';
  doc.text(`NOMOR: ${nomorBa}`, pageWidth / 2, cursorY, { align: 'center' });

  // 3. Opening Text (Dynamic Period Logic)
  cursorY += 6;
  doc.setFontSize(10);

  // Period Text Construction
  let reportPeriodText;
  if (period === 'tahunan') {
    reportPeriodText = `Tahun Anggaran ${year}`;
  } else {
    reportPeriodText = `${periodInfo.label} Tahun Anggaran ${year}`; // e.g., "Triwulan I Tahun Anggaran 2025"
  }

  let dateObj = new Date();
  if (signatoryData?.tanggalSurat) {
    dateObj = new Date(signatoryData.tanggalSurat);
  }
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
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
  const dayName = days[dateObj.getDay()];
  const dayDate = dateObj.getDate();
  const monthName = months[dateObj.getMonth()];
  const yearNum = dateObj.getFullYear();
  const formattedDateSimple = `${dayDate} ${monthName} ${yearNum}`;

  const statementText = `Pada hari ${dayName} tanggal ${dayDate} bulan ${monthName} tahun ${yearNum}, bertempat di ${signatoryData?.tempatRekonsiliasi || '...................'}. Yang bertanda tangan di bawah ini:`;

  const splitStatement = doc.splitTextToSize(statementText, contentWidth);
  doc.text(splitStatement, margin, cursorY);
  cursorY += splitStatement.length * 4 + 2;

  // 4. Signatories Names
  const col1X = margin + 5;
  const col2X = margin + 35;
  const lineHeight = 4.5;

  // Pihak 1
  doc.text('1.', margin, cursorY);
  doc.text('Nama', col1X, cursorY);
  doc.text(':', col1X + 25, cursorY);
  doc.text(String(schoolInfo?.kepala_sekolah || '.......................'), col2X + 10, cursorY);
  cursorY += lineHeight;

  doc.text('NIP', col1X, cursorY);
  doc.text(':', col1X + 25, cursorY);
  doc.text(String(schoolInfo?.nip_kepala || '-'), col2X + 10, cursorY);
  cursorY += lineHeight;

  doc.text('Jabatan', col1X, cursorY);
  doc.text(':', col1X + 25, cursorY);
  doc.text(
    `Kepala Sekolah ${schoolInfo?.nama || schoolInfo?.nama_sekolah || ''}`,
    col2X + 10,
    cursorY
  );
  cursorY += lineHeight + 2;

  // Pihak 2
  doc.text('2.', margin, cursorY);
  doc.text('Nama', col1X, cursorY);
  doc.text(':', col1X + 25, cursorY);
  doc.text(String(schoolInfo?.bendahara || '.......................'), col2X + 10, cursorY);
  cursorY += lineHeight;

  doc.text('NIP', col1X, cursorY);
  doc.text(':', col1X + 25, cursorY);
  doc.text(String(schoolInfo?.nip_bendahara || '-'), col2X + 10, cursorY);
  cursorY += lineHeight;

  doc.text('Jabatan', col1X, cursorY);
  doc.text(':', col1X + 25, cursorY);
  doc.text(
    `Bendahara BOS ${schoolInfo?.nama || schoolInfo?.nama_sekolah || ''}`,
    col2X + 10,
    cursorY
  );
  cursorY += 6;

  // 5. Statement Body
  // FIXED: Removed inconsistent Roman numeral and ensured spacing is correct.
  // Also changed "Dana BOS" to "Dana BOSP" to match title.
  const bodyText = `Menyatakan bahwa kami bertanggung jawab penuh atas kebenaran Laporan Realisasi Penggunaan Dana BOSP ${reportPeriodText} dengan rincian sebagai berikut:`;

  const splitBody = doc.splitTextToSize(bodyText, contentWidth);
  doc.text(splitBody, margin, cursorY);
  cursorY += splitBody.length * 4 + 2;

  // 6. Table Generation (Colors Applied)
  const tableBody = [
    [
      'Dana Lainnya BOSP',
      { content: 'Rp', styles: yellowStyle },
      { content: formatRupiahLocal(saldoAwalLainnya), styles: yellowStyle },
      '',
      '',
    ],
    [
      `BOSP Reguler ${year - 1} (sisa reguler ${year - 1})`,
      { content: 'Rp', styles: yellowStyle },
      { content: formatRupiahLocal(saldoAwalReguler), styles: yellowStyle },
      '',
      '',
    ],
    [
      `SiLPA Kinerja ${year - 1}`,
      { content: 'Rp', styles: yellowStyle },
      { content: formatRupiahLocal(saldoAwalKinerja), styles: yellowStyle },
      '',
      '',
    ],
    [
      `BOSP Kinerja ${year}`,
      { content: 'Rp', styles: yellowStyle },
      { content: formatRupiahLocal(saldoAwalKinerja2025), styles: yellowStyle },
      '',
      '',
    ],
    [
      'BOSP Reguler Tahap I',
      { content: 'Rp', styles: yellowStyle },
      { content: formatRupiahLocal(terimaReguler1), styles: yellowStyle },
      '',
      '',
    ],
    [
      'BOSP Reguler Tahap II',
      { content: 'Rp', styles: yellowStyle },
      { content: formatRupiahLocal(terimaReguler2), styles: yellowStyle },
      '',
      '',
    ],
    [
      `BOSP Kinerja ${year}`,
      { content: 'Rp', styles: yellowStyle },
      { content: formatRupiahLocal(terimaKinerja), styles: yellowStyle },
      '+',
      '',
    ],
    // Row 6: Jumlah Penerimaan (Beige)
    [
      { content: 'Jumlah', styles: summaryStyle },
      { content: '', styles: summaryStyle },
      { content: '', styles: summaryStyle },
      { content: 'Rp', styles: summaryStyle },
      { content: formatRupiahLocal(totalPenerimaan), styles: summaryStyle },
    ],

    [
      'BOSP Dana Lainnya',
      { content: 'Rp', styles: yellowStyle },
      { content: formatRupiahLocal(realisasiLainnya), styles: yellowStyle },
      '',
      '',
    ],
    [
      `BOSP Reguler ${year}`,
      { content: 'Rp', styles: yellowStyle },
      { content: formatRupiahLocal(realisasiReguler), styles: yellowStyle },
      '',
      '',
    ],
    [
      `BOSP Kinerja ${year}`,
      { content: 'Rp', styles: yellowStyle },
      { content: formatRupiahLocal(realisasiKinerja), styles: yellowStyle },
      '',
      '',
    ],
    [
      `Sisa BOSP Kinerja ${year - 1}`,
      { content: 'Rp', styles: yellowStyle },
      { content: formatRupiahLocal(realisasiSilpaKinerja), styles: yellowStyle },
      '-',
      '',
    ],

    // Row 11: Jumlah Belanja (Beige)
    [
      { content: 'Jumlah', styles: summaryStyle },
      { content: '', styles: summaryStyle },
      { content: '', styles: summaryStyle },
      { content: 'Rp', styles: summaryStyle },
      { content: formatRupiahLocal(totalBelanja), styles: summaryStyle },
    ],

    // Row 12: Saldo Akhir (Green)
    [
      { content: 'Saldo Akhir', styles: finalBalanceStyle },
      { content: '', styles: finalBalanceStyle },
      { content: '', styles: finalBalanceStyle },
      { content: 'Rp', styles: finalBalanceStyle },
      { content: formatRupiahLocal(saldoAkhir), styles: finalBalanceStyle },
    ],

    [{ content: 'Rincian Saldo:', colSpan: 5, styles: { fontStyle: 'bold' } }],
    [
      'Tunai BOSP Reguler',
      { content: 'Rp', styles: yellowStyle },
      { content: formatRupiahLocal(saldoTunaiReguler), styles: yellowStyle },
      'Rp',
      formatRupiahLocal(saldoTunaiReguler + saldoBankReguler),
    ],
    [
      'Bank BOSP Reguler',
      { content: 'Rp', styles: yellowStyle },
      { content: formatRupiahLocal(saldoBankReguler), styles: yellowStyle },
      '+',
      '',
    ],
    [
      'Tunai BOSP AFKIN',
      { content: 'Rp', styles: yellowStyle },
      { content: formatRupiahLocal(saldoTunaiKinerja), styles: yellowStyle },
      '',
      '',
    ],
    [
      'Bank BOSP AFKIN',
      { content: 'Rp', styles: yellowStyle },
      { content: formatRupiahLocal(saldoBankKinerja), styles: yellowStyle },
      '',
      '',
    ],
  ];

  // Add Hutang Pajak row if exists
  const manualTaxes = pajakData?.manualTaxes;
  if (manualTaxes) {
    const saldoAwalPajak = manualTaxes.totalSaldoAwal || 0;
    const totalPungut = manualTaxes.totalPungut || 0;
    const totalSetor = manualTaxes.totalSetor || 0;
    const hutangPajak = saldoAwalPajak + totalPungut - totalSetor;
    if (hutangPajak > 0) {
      const amberStyle = { fillColor: [251, 207, 232] }; // Amber-50
      tableBody.push([
        'Hutang Pajak *)',
        { content: 'Rp', styles: amberStyle },
        { content: formatRupiahLocal(hutangPajak), styles: { ...amberStyle, fontStyle: 'bold' } },
        '',
        '',
      ]);
    }
  }

  // Add Selisih Bunga row
  tableBody.push([
    { content: 'Selisih Bunga Bank dan Biaya Admin Bank' },
    { content: 'Rp', styles: yellowStyle },
    { content: formatRupiahLocal(selisihBunga || 0), styles: yellowStyle },
    '',
    '',
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [],
    body: tableBody,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: 8, // Smaller font (8pt)
      cellPadding: 0.8, // Compact padding
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      valign: 'middle',
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 10, halign: 'center' },
      4: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  cursorY = doc.lastAutoTable.finalY + 10; // 10mm gap

  // 7. Footer Check & Signatures
  if (pageHeight - cursorY < 110) {
    doc.addPage();
    cursorY = 15;
  }

  doc.setFontSize(9);
  doc.text(
    'Laporan Realisasi Belanja tersebut di atas sudah diinput dalam aplikasi ARKAS.',
    margin,
    cursorY
  );
  cursorY += 4;
  doc.text(
    'Demikian Berita Acara ini dibuat dan ditandatangani bersama, dibuat rangkap secukupnya dan untuk dapat dipergunakan seperlunya.',
    margin,
    cursorY,
    { maxWidth: contentWidth }
  );
  cursorY += 8;

  // Signature Block with Dates
  const dateText = `${signatoryData?.kabupaten || schoolInfo?.kabupaten || ''}, ${formattedDateSimple}`;
  const dateWidth = (doc.getStringUnitWidth(dateText) * 9) / doc.internal.scaleFactor;
  doc.text(dateText, pageWidth - margin - dateWidth - 5, cursorY);

  cursorY += 6;

  // Signatures
  const leftX = margin + 20;
  const rightX = pageWidth - margin - 60;
  const centerLeft = leftX + 20;
  const centerRight = rightX + 25;

  doc.text('Mengetahui', centerLeft, cursorY, { align: 'center' });
  doc.text('Bendahara BOS', centerRight, cursorY, { align: 'center' });
  cursorY += 4;

  doc.setFont('times', 'bold');
  doc.text('Kepala Sekolah', centerLeft, cursorY, { align: 'center' });
  doc.text(schoolInfo?.nama || schoolInfo?.nama_sekolah || '', centerRight, cursorY, { align: 'center' });

  cursorY += 18; // Compact signature space

  doc.text(`(${schoolInfo?.kepala_sekolah || '.......................'})`, centerLeft, cursorY, {
    align: 'center',
  });
  doc.text(`(${schoolInfo?.bendahara || '.......................'})`, centerRight, cursorY, {
    align: 'center',
  });

  cursorY += 4;
  doc.setFont('times', 'normal');
  doc.text(`NIP. ${schoolInfo?.nip_kepala || '-'}`, centerLeft, cursorY, { align: 'center' });
  doc.text(`NIP. ${schoolInfo?.nip_bendahara || '-'}`, centerRight, cursorY, { align: 'center' });

  cursorY += 8; // Gap between blocks
  doc.text('PPTK BOSP', centerLeft, cursorY, { align: 'center' });
  doc.text('Petugas Rekons,', centerRight, cursorY, { align: 'center' });

  cursorY += 18; // Compact signature space

  doc.setFont('times', 'bold');
  doc.text(`(${signatoryData?.pptkNama || '.......................'})`, centerLeft, cursorY, {
    align: 'center',
  });
  doc.text(
    `(${signatoryData?.petugasRekonsNama || '.......................'})`,
    centerRight,
    cursorY,
    { align: 'center' }
  );

  cursorY += 4;
  doc.setFont('times', 'normal');
  const pptkNip = signatoryData?.pptkNip
    ? `NIP. ${signatoryData.pptkNip}`
    : 'NIP. .......................';
  const rekonsNip = signatoryData?.petugasRekonsNip
    ? `NIP. ${signatoryData.petugasRekonsNip}`
    : 'NIP. .......................';

  doc.text(pptkNip, centerLeft, cursorY, { align: 'center' });
  doc.text(rekonsNip, centerRight, cursorY, { align: 'center' });

  doc.save(`BA_Rekonsiliasi_${year}_${period}.pdf`);
};

// Helper for currency
const formatRupiahLocal = (value) => {
  return formatRupiah(value);
};
