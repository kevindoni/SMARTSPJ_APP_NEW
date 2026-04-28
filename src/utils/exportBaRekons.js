import ExcelJS from 'exceljs';

/**
 * Parses period text for Excel
 */
const getPeriodText = (period, year) => {
  const map = {
    tw1: { label: 'Triwulan I' },
    tw2: { label: 'Triwulan II' },
    tw3: { label: 'Triwulan III' },
    tw4: { label: 'Triwulan IV' },
    sm1: { label: 'Semester 1' },
    sm2: { label: 'Semester 2' },
    tahunan: { label: 'Tahun Anggaran' },
  };
  const info = map[period] || map['tahunan'];

  if (period === 'tahunan') {
    return `Tahun Anggaran ${year}`;
  }
  return `${info.label} Tahun Anggaran ${year}`;
};

/**
 * Export BA Rekons Document to Excel
 */
export const exportBaRekonsToExcel = async (
  data,
  signatoryData,
  schoolInfo,
  year,
  period,
  pajakData = null
) => {
  if (!data) return;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('BA REKONS');

  // Default styles
  sheet.properties.defaultRowHeight = 15;

  // --- DATA PROCESSING (Exact Match with PDF) ---
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

  // --- EXCEL CONSTRUCTION ---

  // Styles
  const fontBold = { name: 'Times New Roman', bold: true, size: 10 };
  const fontNormal = { name: 'Times New Roman', size: 10 };
  const alignCenter = { horizontal: 'center', vertical: 'middle' };
  const borderAll = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };

  // Colors (ARGB)
  // ExcelJS uses ARGB (Alpha, Red, Green, Blue)
  // Yellow: FFFF00 -> FFFF00 (Pure Yellow)
  // Beige: FFF8DC -> FFFFF8DC (Cornsilk)
  // Green: DCFFDC -> FFDCFFDC (Light Green)

  const fillYellow = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
  const fillBeige = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF8DC' } };
  const fillGreen = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFFDC' } };

  // Setup Columns
  sheet.columns = [
    { width: 5 }, // A
    { width: 45 }, // B (Uraian)
    { width: 5 }, // C (Rp)
    { width: 18 }, // D (Nilai)
    { width: 5 }, // E (Sign)
    { width: 18 }, // F (Total)
  ];

  let r = 1;

  // Header Helper
  const addHeaderRow = (text, size = 10, bold = false) => {
    sheet.mergeCells(`A${r}:F${r}`);
    const cell = sheet.getCell(`A${r}`);
    cell.value = text;
    cell.alignment = { horizontal: 'center' };
    cell.font = { name: 'Times New Roman', size, bold };
    r++;
  };

  addHeaderRow(signatoryData.header1 || '', 12, true);
  addHeaderRow(signatoryData.header2 || '', 12, true);
  addHeaderRow(signatoryData.headerAlamat || '', 9);
  addHeaderRow(signatoryData.headerTelepon || '', 9);
  addHeaderRow(signatoryData.headerLaman || '', 9);

  sheet.getCell(`A${r - 1}`).border = { bottom: { style: 'double' } };
  r++;

  addHeaderRow('BERITA ACARA REKONSILIASI BOSP', 11, true);
  addHeaderRow(schoolInfo.nama || schoolInfo.nama_sekolah || 'SEKOLAH', 11, true);
  addHeaderRow(`NOMOR: ${signatoryData.nomorBa || '.../.../.../...'}`, 10);
  r++;

  // Opening Statement
  sheet.mergeCells(`A${r}:F${r + 2}`);
  const textCell = sheet.getCell(`A${r}`);

  // Date Calculations
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
  const formattedDate = `${dayDate} ${monthName} ${yearNum}`;

  const periodText = getPeriodText(period, year);

  textCell.value = `Pada hari ${dayName} tanggal ${dayDate} bulan ${monthName} tahun ${yearNum}, bertempat di ${signatoryData?.tempatRekonsiliasi || '...................'}. Yang bertanda tangan di bawah ini menyatakan bahwa kami bertanggung jawab penuh atas kebenaran Laporan Realisasi Penggunaan Dana BOSP ${periodText} dengan rincian sebagai berikut:`;
  textCell.alignment = { vertical: 'top', wrapText: true };
  textCell.font = fontNormal;
  r += 3;

  // --- TABLE ---
  const addRow = (
    label,
    val1 = null,
    val2 = null,
    symbol = '',
    isBold = false,
    fillStyle = null
  ) => {
    sheet.getCell(`B${r}`).value = label;
    sheet.getCell(`B${r}`).font = isBold ? fontBold : fontNormal;

    if (val1 !== null) {
      sheet.getCell(`C${r}`).value = 'Rp';
      sheet.getCell(`D${r}`).value = val1;
      sheet.getCell(`D${r}`).numFmt = '#,##0';
      if (fillStyle) {
        sheet.getCell(`D${r}`).fill = fillStyle;
        sheet.getCell(`C${r}`).fill = fillStyle;
      }
    }

    if (val2 !== null) {
      sheet.getCell(`E${r}`).value = isBold ? 'Rp' : symbol;
      sheet.getCell(`F${r}`).value = val2;
      sheet.getCell(`F${r}`).numFmt = '#,##0';
      if (fillStyle) {
        sheet.getCell(`F${r}`).fill = fillStyle;
        sheet.getCell(`E${r}`).fill = fillStyle;
      }
    } else if (symbol) {
      sheet.getCell(`E${r}`).value = symbol;
    }

    // Borders
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach((c) => {
      sheet.getCell(`${c}${r}`).border = borderAll;
    });

    r++;
  };

  // Header
  // Row 1: Saldo Awal
  sheet.getCell(`A${r}`).value = '1.';
  sheet.getCell(`A${r}`).alignment = { vertical: 'top' };
  addRow('Dana Lainnya BOSP', saldoAwalLainnya, null, '', false, fillYellow);

  addRow(
    `BOSP Reguler ${year - 1} (sisa reguler ${year - 1})`,
    saldoAwalReguler,
    null,
    '',
    false,
    fillYellow
  );

  addRow(`SiLPA Kinerja ${year - 1}`, saldoAwalKinerja, null, '', false, fillYellow);

  addRow('BOSP Kinerja ' + year, saldoAwalKinerja2025, null, '', false, fillYellow);

  // Row 2: Penerimaan
  sheet.getCell(`A${r}`).value = '2.';
  sheet.getCell(`A${r}`).alignment = { vertical: 'top' };
  addRow('BOSP Reguler Tahap I', terimaReguler1, null, '', false, fillYellow);

  addRow('BOSP Reguler Tahap II', terimaReguler2, null, '', false, fillYellow);

  addRow(`BOSP Kinerja ${year}`, terimaKinerja, null, '+', false, fillYellow);

  // Summary Penerimaan
  // Row 6 needs "Jumlah" label
  sheet.getCell(`B${r}`).value = 'Jumlah Penerimaan';
  sheet.getCell(`B${r}`).font = fontBold;
  sheet.getCell(`E${r}`).value = 'Rp';
  sheet.getCell(`F${r}`).value = totalPenerimaan;
  sheet.getCell(`F${r}`).numFmt = '#,##0';
  // Summary Colors (Beige)
  ['B', 'C', 'D', 'E', 'F'].forEach((c) => (sheet.getCell(`${c}${r}`).fill = fillBeige));
  ['A', 'B', 'C', 'D', 'E', 'F'].forEach((c) => (sheet.getCell(`${c}${r}`).border = borderAll));
  r++;

  // Row 3: Belanja
  sheet.getCell(`A${r}`).value = '3.';
  sheet.getCell(`A${r}`).alignment = { vertical: 'top' };
  addRow('BOSP Dana Lainnya', realisasiLainnya, null, '', false, fillYellow);

  addRow(`BOSP Reguler ${year}`, realisasiReguler, null, '', false, fillYellow);

  addRow(`BOSP Kinerja ${year}`, realisasiKinerja, null, '', false, fillYellow);

  addRow(
    `Sisa BOSP Kinerja ${year - 1}`,
    realisasiSilpaKinerja,
    null,
    '-',
    false,
    fillYellow
  );

  // Summary Belanja
  sheet.getCell(`B${r}`).value = 'Jumlah Realisasi';
  sheet.getCell(`B${r}`).font = fontBold;
  sheet.getCell(`E${r}`).value = 'Rp';
  sheet.getCell(`F${r}`).value = totalBelanja;
  sheet.getCell(`F${r}`).numFmt = '#,##0';
  ['B', 'C', 'D', 'E', 'F'].forEach((c) => (sheet.getCell(`${c}${r}`).fill = fillBeige));
  ['A', 'B', 'C', 'D', 'E', 'F'].forEach((c) => (sheet.getCell(`${c}${r}`).border = borderAll));
  r++;

  // Row 4: Saldo Akhir
  sheet.getCell(`A${r}`).value = '4.';
  sheet.getCell(`B${r}`).value = 'Saldo Akhir';
  sheet.getCell(`B${r}`).font = fontBold;
  sheet.getCell(`E${r}`).value = 'Rp';
  sheet.getCell(`F${r}`).value = saldoAkhir;
  sheet.getCell(`F${r}`).numFmt = '#,##0';
  // Green
  ['B', 'C', 'D', 'E', 'F'].forEach((c) => (sheet.getCell(`${c}${r}`).fill = fillGreen));
  ['A', 'B', 'C', 'D', 'E', 'F'].forEach((c) => (sheet.getCell(`${c}${r}`).border = borderAll));
  r++;

  // Row 5: Rincian
  sheet.getCell(`A${r}`).value = '5.';
  sheet.mergeCells(`B${r}:F${r}`);
  sheet.getCell(`B${r}`).value = 'Rincian Saldo:';
  sheet.getCell(`B${r}`).font = fontBold;
  sheet.getCell(`B${r}`).border = borderAll; // Merged
  r++;

  addRow(
    'Tunai BOSP Reguler',
    saldoTunaiReguler,
    saldoTunaiReguler + saldoBankReguler,
    'Rp',
    false,
    fillYellow
  );
  addRow('Bank BOSP Reguler', saldoBankReguler, null, '+', false, fillYellow);
  addRow('Tunai BOSP AFKIN', saldoTunaiKinerja, null, '', false, fillYellow);
  addRow('Bank BOSP AFKIN', saldoBankKinerja, null, '', false, fillYellow);

  // Hutang Pajak (from manual tax entries)
  const manualTaxes = pajakData?.manualTaxes;
  if (manualTaxes) {
    const saldoAwal = manualTaxes.totalSaldoAwal || 0;
    const totalPungut = manualTaxes.totalPungut || 0;
    const totalSetor = manualTaxes.totalSetor || 0;
    const hutangPajak = saldoAwal + totalPungut - totalSetor;
    if (hutangPajak > 0) {
      const fillAmber = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBCFE8' } }; // Amber-50
      addRow('Hutang Pajak *)', hutangPajak, null, '', false, fillAmber);
    }
  }

  // Selisih Row
  sheet.getCell(`B${r}`).value = 'Selisih Bunga Bank dan Biaya Admin Bank';
  sheet.getCell(`C${r}`).value = 'Rp';
  sheet.getCell(`C${r}`).fill = fillYellow;
  sheet.getCell(`D${r}`).value = selisihBunga;
  sheet.getCell(`D${r}`).numFmt = '#,##0';
  sheet.getCell(`D${r}`).fill = fillYellow;
  ['A', 'B', 'C', 'D', 'E', 'F'].forEach((c) => (sheet.getCell(`${c}${r}`).border = borderAll));
  r++;

  r++; // Spacer

  // Signatories
  const signDate = `${signatoryData?.kabupaten || schoolInfo?.kabupaten || ''}, ${formattedDate}`;
  sheet.mergeCells(`E${r}:F${r}`);
  sheet.getCell(`E${r}`).value = signDate;
  sheet.getCell(`E${r}`).alignment = { horizontal: 'center' };
  r++;

  sheet.mergeCells(`B${r}:C${r}`);
  sheet.getCell(`B${r}`).value = 'Mengetahui';
  sheet.getCell(`B${r}`).alignment = { horizontal: 'center' };

  sheet.mergeCells(`E${r}:F${r}`);
  sheet.getCell(`E${r}`).value = 'Bendahara BOS';
  sheet.getCell(`E${r}`).alignment = { horizontal: 'center' };
  r++;

  sheet.mergeCells(`B${r}:C${r}`);
  sheet.getCell(`B${r}`).value = 'Kepala Sekolah';
  sheet.getCell(`B${r}`).alignment = { horizontal: 'center' };
  sheet.getCell(`B${r}`).font = fontBold;
  r += 4;

  sheet.mergeCells(`B${r}:C${r}`);
  sheet.getCell(`B${r}`).value = `(${schoolInfo?.kepala_sekolah || '.......................'})`;
  sheet.getCell(`B${r}`).alignment = { horizontal: 'center' };
  sheet.getCell(`B${r}`).font = fontBold;

  sheet.mergeCells(`E${r}:F${r}`);
  sheet.getCell(`E${r}`).value = `(${schoolInfo?.bendahara || '.......................'})`;
  sheet.getCell(`E${r}`).alignment = { horizontal: 'center' };
  sheet.getCell(`E${r}`).font = fontBold;
  r++;

  sheet.mergeCells(`B${r}:C${r}`);
  sheet.getCell(`B${r}`).value = `NIP. ${schoolInfo?.nip_kepala || '-'}`;
  sheet.getCell(`B${r}`).alignment = { horizontal: 'center' };

  sheet.mergeCells(`E${r}:F${r}`);
  sheet.getCell(`E${r}`).value = `NIP. ${schoolInfo?.nip_bendahara || '-'}`;
  sheet.getCell(`E${r}`).alignment = { horizontal: 'center' };
  r += 2;

  // PPTK / Rekons
  sheet.mergeCells(`B${r}:C${r}`);
  sheet.getCell(`B${r}`).value = 'PPTK BOSP';
  sheet.getCell(`B${r}`).alignment = { horizontal: 'center' };

  sheet.mergeCells(`E${r}:F${r}`);
  sheet.getCell(`E${r}`).value = 'Petugas Rekons';
  sheet.getCell(`E${r}`).alignment = { horizontal: 'center' };
  r += 4;

  sheet.mergeCells(`B${r}:C${r}`);
  sheet.getCell(`B${r}`).value = `(${signatoryData?.pptkNama || '.......................'})`;
  sheet.getCell(`B${r}`).alignment = { horizontal: 'center' };
  sheet.getCell(`B${r}`).font = fontBold;

  sheet.mergeCells(`E${r}:F${r}`);
  sheet.getCell(`E${r}`).value =
    `(${signatoryData?.petugasRekonsNama || '.......................'})`;
  sheet.getCell(`E${r}`).alignment = { horizontal: 'center' };
  sheet.getCell(`E${r}`).font = fontBold;
  r++;

  sheet.mergeCells(`B${r}:C${r}`);
  sheet.getCell(`B${r}`).value = `NIP. ${signatoryData?.pptkNip || '-'}`;
  sheet.getCell(`B${r}`).alignment = { horizontal: 'center' };

  sheet.mergeCells(`E${r}:F${r}`);
  sheet.getCell(`E${r}`).value = `NIP. ${signatoryData?.petugasRekonsNip || '-'}`;
  sheet.getCell(`E${r}`).alignment = { horizontal: 'center' };

  // DOWNLOAD
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `BA_Rekons_${schoolInfo.nama || 'Sekolah'}_${period}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);

  return true;
};
