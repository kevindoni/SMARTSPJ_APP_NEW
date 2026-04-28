/**
 * Export Handler - Export BKU data to Excel and PDF
 * Supports Single Month and Bulk (All Months) export
 */
const ExcelJS = require('exceljs');
const PdfTable = require('pdfkit-table');
const { dialog } = require('electron');
const fs = require('fs');
const path = require('path');

// Color scheme
const COLORS = {
  maroon: 'FF800020',
  maroonHex: '#800020',
  pink: 'FFFCE4EC',
  pinkHex: '#FCE4EC',
  white: 'FFFFFFFF',
  gray: 'FFF5F5F5',
};

const MONTHS = [
  '',
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

/**
 * Main Export Function
 */
async function exportData(data, options) {
  const { format } = options;

  // Determine target path first to avoid processing if cancelled
  const reportPrefix = options.reportType === 'PAJAK' ? 'BKU_PAJAK' : 'BKU';
  const defaultName = `${reportPrefix}_${options.fundSource || 'SEMUA'}_${options.isBulk ? 'TAHUN' : getMonthName(options.month)}_${options.year}`;
  const ext = format === 'pdf' ? 'pdf' : 'xlsx';

  const result = await dialog.showSaveDialog({
    title: `Export BKU ke ${format.toUpperCase()}`,
    defaultPath: `${defaultName}.${ext}`,
    filters: [{ name: format.toUpperCase(), extensions: [ext] }],
  });

  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true };
  }

  try {
    if (options.reportType === 'PAJAK') {
      // Use Tax-specific template for Buku Pembantu Pajak
      if (format === 'pdf') {
        await generateTaxPdf(data, options, result.filePath);
      } else {
        await generateTaxExcel(data, options, result.filePath);
      }
    } else if (format === 'pdf') {
      await generatePdf(data, options, result.filePath);
    } else {
      await generateExcel(data, options, result.filePath);
    }
    return { success: true, filePath: result.filePath };
  } catch (err) {
    console.error('Export Error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * GENERATE EXCEL (Single & Bulk)
 */
async function generateExcel(dataPayload, options, filePath) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Smart SPJ';
  workbook.created = new Date();

  // Data payload can be a single object (single month) or array (bulk)
  const datasets = Array.isArray(dataPayload) ? dataPayload : [dataPayload];

  for (const data of datasets) {
    const { year, month, fundSource, transactions, stats, calculatedSaldo, schoolInfo } = data;
    const monthName = getMonthName(month);

    const worksheet = workbook.addWorksheet(monthName.substring(0, 31), {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
    });

    // Set column widths
    worksheet.columns = [
      { width: 14 },
      { width: 16 },
      { width: 20 },
      { width: 12 },
      { width: 45 },
      { width: 16 },
      { width: 16 },
      { width: 16 },
    ];

    let rowNum = 1;

    // TITLE
    worksheet.mergeCells(`A${rowNum}:H${rowNum}`);
    const titleRow = worksheet.getRow(rowNum);
    titleRow.getCell(1).value = 'B U K U   K A S   U M U M';
    titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: COLORS.maroon } };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.height = 30;
    rowNum += 2;

    // SUBTITLE
    worksheet.mergeCells(`A${rowNum}:H${rowNum}`);
    const monthRow = worksheet.getRow(rowNum);
    monthRow.getCell(1).value = `BULAN : ${monthName.toUpperCase()} TAHUN : ${year}`;
    monthRow.getCell(1).font = { bold: true, size: 11 };
    monthRow.getCell(1).alignment = { horizontal: 'center' };
    rowNum += 2;

    // SCHOOL INFO
    const alamatKec = schoolInfo?.alamat
      ? `${schoolInfo.alamat}${schoolInfo.kecamatan ? ', ' + schoolInfo.kecamatan : ''}`
      : schoolInfo?.kecamatan || '-';

    const infoData = [
      ['NPSN', schoolInfo?.npsn || '-'],
      ['Nama Sekolah', schoolInfo?.nama_sekolah || schoolInfo?.nama || '-'],
      ['Desa/Kecamatan', alamatKec],
      ['Kabupaten / Kota', schoolInfo?.kabupaten || '-'],
      ['Provinsi', schoolInfo?.provinsi || '-'],
      ['Sumber Dana', fundSource || 'SEMUA'],
    ];

    infoData.forEach((info) => {
      const row = worksheet.getRow(rowNum);
      row.getCell(1).value = info[0] + ' :';
      worksheet.mergeCells(`B${rowNum}:H${rowNum}`);
      row.getCell(2).value = info[1];
      row.font = { size: 10 };
      rowNum++;
    });
    rowNum++;

    // TABLE HEADER
    const headerRow = worksheet.getRow(rowNum);
    [
      'TANGGAL',
      'KODE KEGIATAN',
      'KODE REKENING',
      'NO. BUKTI',
      'URAIAN',
      'PENERIMAAN',
      'PENGELUARAN',
      'SALDO',
    ].forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: COLORS.white }, size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.maroon } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    headerRow.height = 25;
    rowNum++;

    // COLUMN NUMBERS
    const numRow = worksheet.getRow(rowNum);
    for (let i = 1; i <= 8; i++) {
      const cell = numRow.getCell(i);
      cell.value = i;
      cell.font = { bold: true, size: 10, color: { argb: COLORS.maroon } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.pink } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    }
    rowNum++;

    // TRANSACTIONS
    let totalPenerimaan = 0;
    let totalPengeluaran = 0;

    transactions.forEach((tx) => {
      totalPenerimaan += tx.penerimaan || 0;
      totalPengeluaran += tx.pengeluaran || 0;

      const row = worksheet.getRow(rowNum);
      row.getCell(1).value = tx.tanggal_transaksi;
      row.getCell(2).value = tx.kode_kegiatan || '';
      row.getCell(3).value = tx.kode_rekening || '';
      row.getCell(4).value = tx.no_bukti || '';
      row.getCell(5).value = tx.uraian;
      row.getCell(6).value = tx.penerimaan > 0 ? tx.penerimaan : '';
      row.getCell(7).value = tx.pengeluaran > 0 ? tx.pengeluaran : '';
      row.getCell(8).value = tx.saldo_berjalan;

      for (let i = 1; i <= 8; i++) {
        const cell = row.getCell(i);
        cell.font = { size: 10 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        };
        if (i >= 6) {
          cell.alignment = { horizontal: 'right' };
          if (typeof cell.value === 'number') cell.numFmt = '#,##0';
        }
      }
      rowNum++;
    });

    // JUMLAH
    const jumlahRow = worksheet.getRow(rowNum);
    jumlahRow.getCell(1).value = 'Jumlah';
    jumlahRow.getCell(1).font = { bold: true, size: 10 };
    worksheet.mergeCells(`A${rowNum}:E${rowNum}`);

    jumlahRow.getCell(6).value = totalPenerimaan;
    jumlahRow.getCell(7).value = totalPengeluaran;
    jumlahRow.getCell(8).value = calculatedSaldo;

    for (let i = 1; i <= 8; i++) {
      const cell = jumlahRow.getCell(i);
      cell.font = { bold: true, size: 10 };
      cell.border = { top: { style: 'medium' }, bottom: { style: 'medium' } };
      if (i >= 6) {
        cell.alignment = { horizontal: 'right' };
        cell.numFmt = '#,##0';
      }
    }
    rowNum += 2;

    // FOOTER
    worksheet.mergeCells(`A${rowNum}:H${rowNum}`);
    const footerRow = worksheet.getRow(rowNum);
    footerRow.getCell(1).value =
      `BKU ${monthName} ${year} - NPSN : ${schoolInfo?.npsn || '-'}, Nama Sekolah : ${schoolInfo?.nama_sekolah || '-'}`;
    footerRow.getCell(1).font = { size: 9, italic: true };
  }

  await workbook.xlsx.writeFile(filePath);
}

const MARGIN = 30;
const PAGE_WIDTH = 935.43;
const PAGE_HEIGHT = 609.45;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const MAX_Y = PAGE_HEIGHT - 65;

const COLUMNS = [
  { header: 'TANGGAL', key: 'tanggal', width: 60, align: 'center' },
  { header: 'NO. BUKTI', key: 'bukti', width: 60, align: 'center' },
  { header: 'KODE KEGIATAN', key: 'kegiatan', width: 90, align: 'center' },
  { header: 'KODE REKENING', key: 'rekening', width: 90, align: 'center' },
  { header: 'URAIAN', key: 'uraian', width: 275, align: 'left' }, // Expanded for F4
  { header: 'PENERIMAAN', key: 'masuk', width: 95, align: 'right' },
  { header: 'PENGELUARAN', key: 'keluar', width: 95, align: 'right' },
  { header: 'SALDO', key: 'saldo', width: 100, align: 'right' }, // Total ~865
];

async function generatePdf(dataPayload, options, filePath) {
  // Native PDFKit (without table plugin for max control)
  const PDFDocument = require('pdfkit');
  // Set custom size for F4 Landscape (No bufferPages to avoid ghost pages)
  const doc = new PDFDocument({
    margin: MARGIN,
    size: [PAGE_WIDTH, PAGE_HEIGHT],
    autoFirstPage: true,
  });
  const writeStream = fs.createWriteStream(filePath);
  doc.pipe(writeStream);

  const datasets = Array.isArray(dataPayload) ? dataPayload : [dataPayload];

  for (let i = 0; i < datasets.length; i++) {
    const data = datasets[i];
    if (i > 0) doc.addPage();

    await drawMonthReport(doc, data);
  }

  doc.end();
  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

/**
 * Draw Single Report Logic
 */
async function drawMonthReport(doc, data) {
  const { year, month, fundSource, transactions, schoolInfo } = data;

  const totalPenerimaan =
    data.tablePenerimaan !== undefined
      ? data.tablePenerimaan
      : transactions.reduce((s, t) => s + (t.penerimaan || 0), 0);
  const totalPengeluaran =
    data.tablePengeluaran !== undefined
      ? data.tablePengeluaran
      : transactions.reduce((s, t) => s + (t.pengeluaran || 0), 0);
  const finalSaldo =
    data.calculatedSaldo !== undefined
      ? data.calculatedSaldo
      : transactions.length > 0
        ? transactions[transactions.length - 1].saldo_berjalan
        : 0;

  const monthName = getMonthName(month);

  let startX = MARGIN;
  let currentY = MARGIN;

  // --- 1. TITLE ---
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor('#800020')
    .text('BUKU KAS UMUM', 0, currentY, { align: 'center', width: PAGE_WIDTH });
  currentY += 20;

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('black')
    .text(`BULAN : ${monthName.toUpperCase()}   TAHUN : ${year}`, 0, currentY, {
      align: 'center',
      width: PAGE_WIDTH,
    });
  currentY += 25;

  // --- 2. SCHOOL INFO ---
  doc.font('Helvetica').fontSize(9);
  const infoXLabel = MARGIN;
  const infoXColon = MARGIN + 100;
  const infoXValue = MARGIN + 110;

  const infoData = [
    ['Nama Sekolah', schoolInfo?.nama_sekolah || schoolInfo?.nama || '-'],
    ['NPSN', schoolInfo?.npsn || '-'],
    ['Kabupaten/Kota', schoolInfo?.kabupaten || '-'],
    ['Provinsi', schoolInfo?.provinsi || '-'],
    ['Sumber Dana', fundSource || 'BOS Reguler'],
  ];

  infoData.forEach(([label, value]) => {
    doc.text(label, infoXLabel, currentY);
    doc.text(':', infoXColon, currentY);
    doc.text(value, infoXValue, currentY);
    currentY += 14;
  });
  currentY += 10; // Space before table

  // --- 3. TABLE HEADER ---
  function drawTableHeader(y) {
    let x = startX;
    const hHeight = 25; // Header height

    // Background Maroon
    doc.rect(x, y, CONTENT_WIDTH, hHeight).fill('#800020');

    // Borders & Text
    doc.strokeColor('white').lineWidth(0.5); // Grid lines inside header white/black? Standard is black borders, but let's make it clean.

    doc.rect(x, y, CONTENT_WIDTH, hHeight).strokeColor('black').stroke(); // Outer border

    COLUMNS.forEach((col, idx) => {
      // Vertical Separator
      if (idx > 0) {
        doc
          .moveTo(x, y)
          .lineTo(x, y + hHeight)
          .strokeColor('white')
          .stroke();
      }

      // Text
      doc.fillColor('white').fontSize(8).font('Helvetica-Bold');
      doc.text(col.header, x, y + 8, {
        width: col.width,
        align: 'center',
      });

      x += col.width;
    });

    // Return next Y
    return y + hHeight;
  }

  currentY = drawTableHeader(currentY);

  doc.fillColor('black').strokeColor('black').fontSize(8).font('Helvetica');

  // Helper: Draw Row Border
  function drawRowBorder(y, height) {
    let x = startX;
    doc.rect(x, y, CONTENT_WIDTH, height).stroke();

    // Vertical lines
    COLUMNS.forEach((col, idx) => {
      if (idx > 0) {
        // Skip first left border (covered by rect)
        doc
          .moveTo(x, y)
          .lineTo(x, y + height)
          .stroke();
      }
      x += col.width;
    });
  }

  for (let i = 0; i < transactions.length; i++) {
    const tx = transactions[i];
    // Note: We use pre-calculated totals from frontend, don't accumulate here

    // Prepare Text Data
    const rowData = {
      tanggal: tx.tanggal_transaksi,
      bukti: tx.no_bukti || '',
      kegiatan: tx.kode_kegiatan || '',
      rekening: tx.kode_rekening || '',
      uraian: tx.uraian || '',
      masuk: tx.penerimaan > 0 ? formatRp(tx.penerimaan) : '',
      keluar: tx.pengeluaran > 0 ? formatRp(tx.pengeluaran) : '',
      saldo: formatRp(tx.saldo_berjalan),
    };

    // Calculate Row Height needed (based on Uraian wrap)
    // Ensure font is set before calculating height
    doc.fontSize(8).font('Helvetica');
    const textOptions = { width: COLUMNS[4].width - 10, align: 'left' };
    const uraianHeight = doc.heightOfString(rowData.uraian, textOptions);
    const rowHeight = Math.max(uraianHeight + 10, 20); // Min height 20

    // Check Page Break
    if (currentY + rowHeight > MAX_Y) {
      doc.addPage();
      currentY = MARGIN + 20; // Top margin next page
      currentY = drawTableHeader(currentY); // Re-draw header
      doc.fillColor('black').strokeColor('black').fontSize(8).font('Helvetica'); // Reset styles
    }

    // Draw Row Content
    let x = startX;

    // Draw Borders first
    drawRowBorder(currentY, rowHeight);

    // Fill Text
    const textY = currentY + 5; // Padding top

    doc.text(rowData.tanggal, x, textY, { width: COLUMNS[0].width, align: 'center' });
    x += COLUMNS[0].width;
    doc.text(rowData.bukti, x, textY, { width: COLUMNS[1].width, align: 'center' });
    x += COLUMNS[1].width;
    doc.text(rowData.kegiatan, x, textY, { width: COLUMNS[2].width, align: 'center' });
    x += COLUMNS[2].width;
    doc.text(rowData.rekening, x, textY, { width: COLUMNS[3].width, align: 'center' });
    x += COLUMNS[3].width;
    doc.text(rowData.uraian, x + 5, textY, { width: COLUMNS[4].width - 10, align: 'left' });
    x += COLUMNS[4].width; // Padding left constraint
    doc.text(rowData.masuk, x - 5, textY, { width: COLUMNS[5].width, align: 'right' });
    x += COLUMNS[5].width; // Padding right constraint via x adjustment? No, align right works relative to width
    doc.text(rowData.keluar, x - 5, textY, { width: COLUMNS[6].width, align: 'right' });
    x += COLUMNS[6].width;
    doc.text(rowData.saldo, x - 5, textY, { width: COLUMNS[7].width, align: 'right' });

    currentY += rowHeight;
  }

  // --- 5. TOTAL ROW ---
  const totalRowHeight = 25;
  if (currentY + totalRowHeight > MAX_Y) {
    doc.addPage();
    currentY = MARGIN + 20;
  }

  // Borders & Background
  drawRowBorder(currentY, totalRowHeight);

  // Text
  doc.font('Helvetica-Bold');
  doc.text(
    'JUMLAH',
    startX + COLUMNS[0].width + COLUMNS[1].width + COLUMNS[2].width + COLUMNS[3].width,
    currentY + 8,
    { width: COLUMNS[4].width, align: 'center' }
  );

  // Position for numbers
  let xNum =
    startX +
    COLUMNS[0].width +
    COLUMNS[1].width +
    COLUMNS[2].width +
    COLUMNS[3].width +
    COLUMNS[4].width;
  doc.text(formatRp(totalPenerimaan), xNum - 5, currentY + 8, {
    width: COLUMNS[5].width,
    align: 'right',
  });
  xNum += COLUMNS[5].width;
  doc.text(formatRp(totalPengeluaran), xNum - 5, currentY + 8, {
    width: COLUMNS[6].width,
    align: 'right',
  });
  xNum += COLUMNS[6].width;
  doc.text(formatRp(finalSaldo), xNum - 5, currentY + 8, {
    width: COLUMNS[7].width,
    align: 'right',
  });

  currentY += totalRowHeight + 30; // Spacing after table

  // --- 6. LEMBAR PENGESAHAN (SIGNATURE BLOCK) ---
  // Signature block needs ~150pt. Only add page if truly no space.
  const signatureHeight = 150;

  // Only add page if signature ABSOLUTELY won't fit (within 30pt of bottom)
  if (currentY + signatureHeight > PAGE_HEIGHT - 30) {
    doc.addPage();
    currentY = MARGIN + 20;
  } else {
    currentY += 5; // Minimal spacing
  }

  drawSignatureBlock(doc, currentY, data, finalSaldo);
}

function drawSignatureBlock(doc, startY, data, saldoAkhir) {
  const { year, month, schoolInfo } = data;
  const lastDay = new Date(year, month, 0);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dayName = days[lastDay.getDay()];
  const dateString = `${lastDay.getDate()} ${getMonthName(month)} ${year}`;

  // Fix Kecamatan
  let namaKec = schoolInfo?.kecamatan || '';
  if (namaKec) {
    namaKec = namaKec.replace(/^Kec\.?\s*/i, '');
    namaKec = 'Kec. ' + namaKec;
  } else {
    namaKec = 'Kec. .......................';
  }

  // Compact Closing Text
  const closingText = `Pada hari ini ${dayName} ${dateString} Buku Kas Umum Ditutup dengan keadaan/posisi buku sebagai berikut :`;

  let y = startY;
  const leftX = MARGIN;

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('black')
    .text(closingText, leftX, y, { width: CONTENT_WIDTH });
  y += 15; // Reduced from 20

  // Saldo Details - SAME logic as TransactionClosing.jsx
  // saldoTunai comes from stats, saldoBank = total - tunai
  const saldoTunai = data.stats?.saldo_tunai || 0;
  const saldoBank = saldoAkhir - saldoTunai;

  const details = [
    { label: 'Saldo Buku Kas Umum', val: formatRp(saldoAkhir), bold: true },
    { label: 'Terdiri Dari :', val: '', bold: false },
    { label: '- Saldo Bank', val: formatRp(saldoBank), bold: false, indent: 15 },
    { label: '- Saldo Kas Tunai', val: formatRp(saldoTunai), bold: false, indent: 15 },
    { label: 'Jumlah', val: formatRp(saldoBank + saldoTunai), bold: true },
  ];

  details.forEach((item) => {
    doc.font(item.bold ? 'Helvetica-Bold' : 'Helvetica');
    const x = leftX + (item.indent || 0);
    doc.text(item.label, x, y);

    if (item.val) {
      doc.text(':', leftX + 130, y);
      doc.text(item.val, leftX + 140, y);
    }
    y += 12; // Compact line height (was 14)
  });

  y += 15; // Compact gap before signature (was 30)

  // --- SIGNATURE COLUMNS ---
  /* 
       Partition:
       Left Zone Center: x = MARGIN + 100
       Right Zone Center: x = PAGE_WIDTH - MARGIN - 100
    */

  const leftCenter = MARGIN + 100;
  const rightCenter = PAGE_WIDTH - MARGIN - 100;
  const blockWidth = 200;

  const sigTopY = y;

  // Title
  doc.font('Helvetica').text('Menyetujui,', leftCenter - blockWidth / 2, sigTopY, {
    align: 'center',
    width: blockWidth,
  });
  doc.text('Kepala Sekolah', leftCenter - blockWidth / 2, sigTopY + 12, {
    align: 'center',
    width: blockWidth,
  });

  doc.text(`${namaKec}, ${dateString}`, rightCenter - blockWidth / 2, sigTopY, {
    align: 'center',
    width: blockWidth,
  });
  doc.text('Bendahara,', rightCenter - blockWidth / 2, sigTopY + 12, {
    align: 'center',
    width: blockWidth,
  });

  // SPACE FOR SIGNATURE
  const nameY = sigTopY + 50; // Compacted from 70

  // NAMES
  let ksName = schoolInfo?.kepala_sekolah || schoolInfo?.nama_kepsek || '';
  let ksNip = schoolInfo?.nip_kepala_sekolah || schoolInfo?.nip_kepsek || '';

  let benName = schoolInfo?.bendahara || schoolInfo?.nama_bendahara || '';
  let benNip = schoolInfo?.nip_bendahara || '';

  const placeholder = '( .............................................. )';

  // LEFT (KS)
  doc.font('Helvetica-Bold');
  if (ksName && ksName !== '-') {
    doc.text(ksName, leftCenter - blockWidth / 2, nameY, { align: 'center', width: blockWidth });
    const w = doc.widthOfString(ksName);
    const lineStart = leftCenter - w / 2;
    doc
      .moveTo(lineStart, nameY + 10)
      .lineTo(lineStart + w, nameY + 10)
      .stroke();
  } else {
    doc.text(placeholder, leftCenter - blockWidth / 2, nameY, {
      align: 'center',
      width: blockWidth,
    });
  }

  // NIP KS
  doc.font('Helvetica').fontSize(9);
  if (ksNip && ksNip !== '-') {
    doc.text(`NIP. ${ksNip}`, leftCenter - blockWidth / 2, nameY + 14, {
      align: 'center',
      width: blockWidth,
    });
  } else {
    doc.text('NIP. -', leftCenter - blockWidth / 2, nameY + 14, {
      align: 'center',
      width: blockWidth,
    });
  }

  // RIGHT (Bendahara)
  doc.font('Helvetica-Bold').fontSize(9);
  if (benName && benName !== '-') {
    doc.text(benName, rightCenter - blockWidth / 2, nameY, { align: 'center', width: blockWidth });
    const w = doc.widthOfString(benName);
    const lineStart = rightCenter - w / 2;
    doc
      .moveTo(lineStart, nameY + 10)
      .lineTo(lineStart + w, nameY + 10)
      .stroke();
  } else {
    doc.text(placeholder, rightCenter - blockWidth / 2, nameY, {
      align: 'center',
      width: blockWidth,
    });
  }

  // NIP Bendahara
  doc.font('Helvetica').fontSize(9);
  if (benNip && benNip !== '-') {
    doc.text(`NIP. ${benNip}`, rightCenter - blockWidth / 2, nameY + 14, {
      align: 'center',
      width: blockWidth,
    });
  } else {
    doc.text('NIP. -', rightCenter - blockWidth / 2, nameY + 14, {
      align: 'center',
      width: blockWidth,
    });
  }
}

function getMonthName(month) {
  return MONTHS[parseInt(month)] || 'SEMUA';
}

function formatRp(num) {
  if (num === null || num === undefined) return '';
  return num.toLocaleString('id-ID');
}

/**
 * GENERATE TAX LEDGER EXCEL (Buku Pembantu Pajak)
 */
async function generateTaxExcel(dataPayload, options, filePath) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Smart SPJ';
  workbook.created = new Date();

  const datasets = Array.isArray(dataPayload) ? dataPayload : [dataPayload];

  for (const data of datasets) {
    const { year, month, fundSource, transactions, schoolInfo } = data;
    const monthName = getMonthName(month);

    const worksheet = workbook.addWorksheet(monthName.substring(0, 31), {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
    });

    // Set column widths for Tax Ledger
    worksheet.columns = [
      { width: 14 }, // Tanggal
      { width: 18 }, // Kode Rekening
      { width: 45 }, // Uraian
      { width: 14 }, // PPN
      { width: 14 }, // PPh 21
      { width: 14 }, // PPh 23
      { width: 14 }, // PPh 4
      { width: 14 }, // SSPD
      { width: 14 }, // Kredit
      { width: 16 }, // Saldo
    ];

    let rowNum = 1;

    // TITLE
    worksheet.mergeCells(`A${rowNum}:J${rowNum}`);
    const titleRow = worksheet.getRow(rowNum);
    titleRow.getCell(1).value = 'B U K U   P E M B A N T U   P A J A K';
    titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: COLORS.maroon } };
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.height = 30;
    rowNum += 2;

    // SUBTITLE
    worksheet.mergeCells(`A${rowNum}:J${rowNum}`);
    const monthRow = worksheet.getRow(rowNum);
    monthRow.getCell(1).value = `BULAN : ${monthName.toUpperCase()} TAHUN : ${year}`;
    monthRow.getCell(1).font = { bold: true, size: 11 };
    monthRow.getCell(1).alignment = { horizontal: 'center' };
    rowNum += 2;

    // SCHOOL INFO
    const infoData = [
      ['NPSN', schoolInfo?.npsn || '-'],
      ['Nama Sekolah', schoolInfo?.nama_sekolah || schoolInfo?.nama || '-'],
      ['Sumber Dana', fundSource || 'SEMUA'],
    ];

    infoData.forEach((info) => {
      const row = worksheet.getRow(rowNum);
      row.getCell(1).value = info[0] + ' :';
      worksheet.mergeCells(`B${rowNum}:J${rowNum}`);
      row.getCell(2).value = info[1];
      row.font = { size: 10 };
      rowNum++;
    });
    rowNum++;

    // TABLE HEADER - Row 1 (Main Headers with merged cells)
    const headerRow1 = rowNum;
    const header1 = worksheet.getRow(rowNum);

    // TANGGAL, NO. KODE, URAIAN - span 2 rows
    ['TANGGAL', 'NO. KODE', 'URAIAN'].forEach((h, i) => {
      const cell = header1.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FF6B21A8' }, size: 9 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // PENERIMAAN / DEBIT - merged across columns 4-8 (PPN to SSPD)
    worksheet.mergeCells(`D${rowNum}:H${rowNum}`);
    const debitHeader = header1.getCell(4);
    debitHeader.value = 'PENERIMAAN / DEBIT';
    debitHeader.font = { bold: true, color: { argb: COLORS.white }, size: 9 };
    debitHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B21A8' } };
    debitHeader.alignment = { horizontal: 'center', vertical: 'middle' };
    debitHeader.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    // PENGELUARAN/KREDIT, SALDO - span 2 rows
    ['PENGELUARAN\n/ KREDIT', 'SALDO'].forEach((h, i) => {
      const cell = header1.getCell(i + 9);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FF6B21A8' }, size: 9 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    header1.height = 25;
    rowNum++;

    // TABLE HEADER - Row 2 (Sub-headers for tax columns)
    const header2 = worksheet.getRow(rowNum);

    // Merge first 3 columns from previous row
    worksheet.mergeCells(`A${headerRow1}:A${rowNum}`);
    worksheet.mergeCells(`B${headerRow1}:B${rowNum}`);
    worksheet.mergeCells(`C${headerRow1}:C${rowNum}`);
    worksheet.mergeCells(`I${headerRow1}:I${rowNum}`);
    worksheet.mergeCells(`J${headerRow1}:J${rowNum}`);

    // Tax sub-headers (PPN, PPh 21, PPh 23, PPh 4, SSPD)
    const taxHeaders = ['PPN', 'PPh 21', 'PPh 23', 'PPh 4', 'SSPD'];
    taxHeaders.forEach((h, i) => {
      const cell = header2.getCell(i + 4);
      cell.value = h;
      cell.font = { bold: true, color: { argb: 'FF6B21A8' }, size: 8 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    header2.height = 20;
    rowNum++;

    // TRANSACTIONS with Tax Column calculation and RUNNING TAX BALANCE
    let totalPPN = 0,
      totalPPh21 = 0,
      totalPPh23 = 0,
      totalPPh4 = 0,
      totalSSPD = 0,
      totalKredit = 0;
    let runningTaxBalance = 0; // Running balance: Penerimaan - Kredit

    transactions.forEach((tx) => {
      // Parse tax components from transaction
      const taxComponents = getTaxComponentsForExport(tx);

      // Calculate running tax balance
      const penerimaan =
        taxComponents.ppn +
        taxComponents.pph21 +
        taxComponents.pph23 +
        taxComponents.pph4 +
        taxComponents.sspd;
      const kredit = taxComponents.kredit;
      runningTaxBalance = runningTaxBalance + penerimaan - kredit;

      totalPPN += taxComponents.ppn;
      totalPPh21 += taxComponents.pph21;
      totalPPh23 += taxComponents.pph23;
      totalPPh4 += taxComponents.pph4;
      totalSSPD += taxComponents.sspd;
      totalKredit += taxComponents.kredit;

      const row = worksheet.getRow(rowNum);
      // Format date as DD-MM-YYYY (same as UI)
      const dateStr = tx.tanggal_transaksi
        ? new Date(tx.tanggal_transaksi)
            .toLocaleDateString('id-ID', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
            .replace(/\//g, '-')
        : '';
      row.getCell(1).value = dateStr;
      // NO. KODE: use no_bukti or kode_rekening (same as UI)
      row.getCell(2).value = tx.no_bukti || tx.kode_rekening || '-';
      row.getCell(3).value = tx.uraian;
      row.getCell(4).value = taxComponents.ppn > 0 ? taxComponents.ppn : '';
      row.getCell(5).value = taxComponents.pph21 > 0 ? taxComponents.pph21 : '';
      row.getCell(6).value = taxComponents.pph23 > 0 ? taxComponents.pph23 : '';
      row.getCell(7).value = taxComponents.pph4 > 0 ? taxComponents.pph4 : '';
      row.getCell(8).value = taxComponents.sspd > 0 ? taxComponents.sspd : '';
      row.getCell(9).value = taxComponents.kredit > 0 ? taxComponents.kredit : '';
      row.getCell(10).value = runningTaxBalance; // Use running tax balance

      for (let i = 1; i <= 10; i++) {
        const cell = row.getCell(i);
        cell.font = { size: 9 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
          right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        };
        if (i >= 4) {
          cell.alignment = { horizontal: 'right' };
          if (typeof cell.value === 'number') cell.numFmt = '#,##0';
        }
      }
      rowNum++;
    });

    // JUMLAH ROW
    const jumlahRow = worksheet.getRow(rowNum);
    jumlahRow.getCell(1).value = 'JUMLAH';
    jumlahRow.getCell(1).font = { bold: true, size: 10 };
    worksheet.mergeCells(`A${rowNum}:C${rowNum}`);

    jumlahRow.getCell(4).value = totalPPN;
    jumlahRow.getCell(5).value = totalPPh21;
    jumlahRow.getCell(6).value = totalPPh23;
    jumlahRow.getCell(7).value = totalPPh4;
    jumlahRow.getCell(8).value = totalSSPD;
    jumlahRow.getCell(9).value = totalKredit;
    jumlahRow.getCell(10).value = runningTaxBalance; // Final running tax balance (not BKU saldo)

    for (let i = 1; i <= 10; i++) {
      const cell = jumlahRow.getCell(i);
      cell.font = { bold: true, size: 10 };
      cell.border = { top: { style: 'medium' }, bottom: { style: 'medium' } };
      if (i >= 4) {
        cell.alignment = { horizontal: 'right' };
        cell.numFmt = '#,##0';
      }
    }
  }

  await workbook.xlsx.writeFile(filePath);
}

/**
 * GENERATE TAX PDF (Buku Pembantu Pajak)
 * Uses same layout as generateTaxExcel but outputs to PDF
 */
async function generateTaxPdf(dataPayload, options, filePath) {
  const PDFDocument = require('pdfkit');
  const writeStream = fs.createWriteStream(filePath);

  // F4 Landscape
  const doc = new PDFDocument({
    margin: 30,
    size: [935.43, 609.45],
    autoFirstPage: true,
  });
  doc.pipe(writeStream);

  const datasets = Array.isArray(dataPayload) ? dataPayload : [dataPayload];
  const MARGIN = 30;
  const PAGE_WIDTH = 935.43;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

  for (let i = 0; i < datasets.length; i++) {
    const data = datasets[i];
    if (i > 0) doc.addPage();

    const { year, month, fundSource, transactions, schoolInfo } = data;
    const monthName = getMonthName(month);

    let currentY = MARGIN;

    // TITLE
    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor('#6B21A8')
      .text('BUKU PEMBANTU PAJAK', 0, currentY, { align: 'center', width: PAGE_WIDTH });
    currentY += 20;

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('black')
      .text(`BULAN : ${monthName.toUpperCase()}   TAHUN : ${year}`, 0, currentY, {
        align: 'center',
        width: PAGE_WIDTH,
      });
    currentY += 25;

    // SCHOOL INFO
    doc.font('Helvetica').fontSize(9);
    const infoData = [
      ['NPSN', schoolInfo?.npsn || '-'],
      ['Nama Sekolah', schoolInfo?.nama_sekolah || schoolInfo?.nama || '-'],
      ['Sumber Dana', fundSource || 'SEMUA'],
    ];
    infoData.forEach(([label, value]) => {
      doc.text(label, MARGIN, currentY);
      doc.text(':', MARGIN + 80, currentY);
      doc.text(value, MARGIN + 90, currentY);
      currentY += 14;
    });
    currentY += 10;

    // TABLE HEADER
    const colWidths = [60, 80, 200, 65, 65, 65, 65, 65, 80, 80]; // Total ~825
    const headers = [
      'TANGGAL',
      'NO. KODE',
      'URAIAN',
      'PPN',
      'PPh 21',
      'PPh 23',
      'PPh 4',
      'SSPD',
      'KREDIT',
      'SALDO',
    ];

    let xPos = MARGIN;
    doc.font('Helvetica-Bold').fontSize(7).fillColor('#6B21A8');
    headers.forEach((h, idx) => {
      doc.rect(xPos, currentY, colWidths[idx], 20).stroke();
      doc.text(h, xPos + 2, currentY + 6, { width: colWidths[idx] - 4, align: 'center' });
      xPos += colWidths[idx];
    });
    currentY += 20;

    // DATA ROWS
    doc.font('Helvetica').fontSize(7).fillColor('black');
    let runningTaxBalance = 0;
    let totalPPN = 0,
      totalPPh21 = 0,
      totalPPh23 = 0,
      totalPPh4 = 0,
      totalSSPD = 0,
      totalKredit = 0;

    transactions.forEach((tx) => {
      const taxComps = getTaxComponentsForExport(tx);
      const penerimaan =
        taxComps.ppn + taxComps.pph21 + taxComps.pph23 + taxComps.pph4 + taxComps.sspd;
      runningTaxBalance = runningTaxBalance + penerimaan - taxComps.kredit;

      totalPPN += taxComps.ppn;
      totalPPh21 += taxComps.pph21;
      totalPPh23 += taxComps.pph23;
      totalPPh4 += taxComps.pph4;
      totalSSPD += taxComps.sspd;
      totalKredit += taxComps.kredit;

      // Format date
      const dateStr = tx.tanggal_transaksi
        ? new Date(tx.tanggal_transaksi)
            .toLocaleDateString('id-ID', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
            .replace(/\//g, '-')
        : '';

      const rowData = [
        dateStr,
        tx.no_bukti || tx.kode_rekening || '-',
        tx.uraian || '',
        taxComps.ppn > 0 ? formatRp(taxComps.ppn) : '',
        taxComps.pph21 > 0 ? formatRp(taxComps.pph21) : '',
        taxComps.pph23 > 0 ? formatRp(taxComps.pph23) : '',
        taxComps.pph4 > 0 ? formatRp(taxComps.pph4) : '',
        taxComps.sspd > 0 ? formatRp(taxComps.sspd) : '',
        taxComps.kredit > 0 ? formatRp(taxComps.kredit) : '',
        formatRp(runningTaxBalance),
      ];

      xPos = MARGIN;

      // Calculate dynamic row height based on Uraian text
      const uraianWidth = colWidths[2] - 4;
      const uraianHeight = doc.heightOfString(tx.uraian || '', { width: uraianWidth });
      const rowHeight = Math.max(15, uraianHeight + 8); // Min height 15, padding 8

      // Page break check before drawing row
      if (currentY + rowHeight > 550) {
        doc.addPage();
        currentY = MARGIN;

        // Redraw Header on new page
        let hXPos = MARGIN;
        doc.font('Helvetica-Bold').fontSize(7).fillColor('#6B21A8');
        headers.forEach((h, idx) => {
          doc.rect(hXPos, currentY, colWidths[idx], 20).stroke();
          doc.text(h, hXPos + 2, currentY + 6, { width: colWidths[idx] - 4, align: 'center' });
          hXPos += colWidths[idx];
        });
        currentY += 20;
        doc.font('Helvetica').fontSize(7).fillColor('black');
      }

      rowData.forEach((val, idx) => {
        doc.rect(xPos, currentY, colWidths[idx], rowHeight).stroke();
        const align = idx >= 3 ? 'right' : idx === 0 ? 'center' : 'left';

        // Vertical alignment: middle for single line, top for wrapped text
        const cellPadding = 4;
        const textY = currentY + cellPadding;

        doc.text(val, xPos + 2, textY, {
          width: colWidths[idx] - 4,
          align: align,
          lineBreak: true, // Allow text wrapping
        });
        xPos += colWidths[idx];
      });
      currentY += rowHeight;
    });

    // JUMLAH ROW
    doc.font('Helvetica-Bold');
    xPos = MARGIN;
    const jumlahData = [
      '',
      '',
      'JUMLAH',
      formatRp(totalPPN),
      formatRp(totalPPh21),
      formatRp(totalPPh23),
      formatRp(totalPPh4),
      formatRp(totalSSPD),
      formatRp(totalKredit),
      formatRp(runningTaxBalance),
    ];
    jumlahData.forEach((val, idx) => {
      doc.rect(xPos, currentY, colWidths[idx], 18).stroke();
      const align = idx >= 3 ? 'right' : idx === 2 ? 'center' : 'left';
      doc.text(val, xPos + 2, currentY + 5, { width: colWidths[idx] - 4, align });
      xPos += colWidths[idx];
    });
  }

  doc.end();
  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

/**
 * GENERATE KWITANSI PDF (A2 BOS Format)
 */
async function generateKwitansiPdf(transaction, schoolInfo, filePath) {
  const PDFDocument = require('pdfkit');
  const terbilang = require('../utils/terbilang');
  const writeStream = fs.createWriteStream(filePath);

  // Custom Page Size A4 / F4 (Portrait)
  // Custom Page Size F4 (21.5cm x 33cm) -> [610, 936] points
  const doc = new PDFDocument({
    margin: 40,
    size: [610, 936], // F4 Portrait
    autoFirstPage: true,
  });
  doc.pipe(writeStream);

  const MARGIN = 40;
  const PAGE_WIDTH = 610; // F4 Width (was 595.28 for A4)
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
  let currentY = MARGIN;

  // Header
  doc.font('Helvetica-Bold').fontSize(14).text('BUKTI PENGELUARAN UANG', 0, currentY, {
    align: 'center',
    width: PAGE_WIDTH,
    characterSpacing: 2,
  });
  currentY += 18;
  doc
    .font('Helvetica')
    .fontSize(10)
    .text(`No : ${transaction.no_bukti || '-'}`, 0, currentY, {
      align: 'center',
      width: PAGE_WIDTH,
    });
  currentY += 30;

  // Content Box (Border)
  const boxTop = currentY;

  // Right Column (Summary) - Rendered FIRST to ensure absolute positioning
  const rightX = PAGE_WIDTH - MARGIN - 140; // Shifted right (was 160) for narrower table
  const rightY = boxTop + 10;
  const rightLabelW = 60;
  const rightValW = 70; // Reduced from 90 to 70 to minimize gap between colon and number

  doc.font('Helvetica').fontSize(9);
  // Penerimaan
  doc.text('Penerimaan', rightX, rightY);
  doc.text(':', rightX + rightLabelW, rightY);
  doc.text(formatRp(transaction.nominal), rightX + rightLabelW + 5, rightY, {
    width: rightValW,
    align: 'right',
  });

  // Calculate Taxes - use actual from DB first, fallback to calculated
  const actualTax = transaction.actualTax || {};

  const taxes = [
    {
      label: 'PPN',
      val:
        actualTax.ppn > 0
          ? actualTax.ppn
          : transaction.is_ppn
            ? Math.round(transaction.nominal * 0.11)
            : 0,
    },
    {
      label: 'PPh 21',
      val:
        actualTax.pph21 > 0
          ? actualTax.pph21
          : transaction.is_pph_21
            ? Math.round(transaction.nominal * 0.05)
            : 0,
    },
    {
      label: 'PPh 23',
      val:
        actualTax.pph23 > 0
          ? actualTax.pph23
          : transaction.is_pph_23
            ? Math.round(transaction.nominal * 0.02)
            : 0,
    },
    {
      label: 'Pajak Daerah',
      val:
        actualTax.sspd > 0
          ? actualTax.sspd
          : transaction.is_sspd
            ? Math.round(transaction.nominal * 0.1)
            : 0,
    },
  ];

  let totalPajak = 0;
  let rY = rightY + 11;

  taxes.forEach((tax) => {
    totalPajak += tax.val;
    doc.text(tax.label, rightX, rY);
    doc.text(':', rightX + rightLabelW, rY);
    const displayVal = tax.val > 0 ? formatRp(tax.val) : '-';
    doc.text(displayVal, rightX + rightLabelW + 5, rY, {
      width: rightValW,
      align: 'right',
    });
    rY += 11;
  });

  const netAmount = transaction.nominal - totalPajak;

  // Separator Line above Jumlah Bersih
  doc
    .moveTo(rightX, rY - 2)
    .lineTo(rightX + rightLabelW + 5 + rightValW, rY - 2)
    .lineWidth(1)
    .stroke();

  // Jumlah Bersih
  doc.font('Helvetica-Bold');
  doc.text('Jumlah Bersih', rightX, rY, { lineBreak: false });
  doc.text(':', rightX + rightLabelW, rY);
  doc.text(formatRp(netAmount), rightX + rightLabelW + 5, rY, { width: rightValW, align: 'right' });

  // Left Content
  doc.font('Helvetica');
  currentY = boxTop + 10;
  const labelWidth = 100;
  const sepWidth = 10;

  const rowHeight = 16;
  const leftX = MARGIN + 10;

  const dataRows = [
    ['Dinas/Instansi', ':', schoolInfo?.nama_sekolah || schoolInfo?.nama || '-'],
    [
      'Tahun Anggaran',
      ':',
      transaction.printDate
        ? new Date(transaction.printDate).getFullYear()
        : transaction.year || new Date().getFullYear(),
    ],
    ['Kode Rekening', ':', transaction.kode_rekening || '-'],
    ['Uraian Kode Rek', ':', transaction.nama_rekening || transaction.uraian || '-'], // Account Name from ref_rekening
    [
      'Terima Dari',
      ':',
      `Bendahara Pengeluaran ${schoolInfo?.nama_sekolah || schoolInfo?.nama || ''}`,
    ],
  ];

  doc.font('Helvetica').fontSize(9);
  dataRows.forEach(([label, sep, val]) => {
    const textWidth = 330;
    const textHeight = doc.heightOfString(val, { width: textWidth });
    const actualRowHeight = Math.max(rowHeight, textHeight); // Ensure min height

    doc.text(label, leftX, currentY);
    doc.text(sep, leftX + labelWidth, currentY);
    doc.text(val, leftX + labelWidth + sepWidth, currentY, { width: textWidth });

    currentY += actualRowHeight + 4; // Add small padding
  });

  // Uang Sebesar Box
  currentY += 5;
  doc.text('Uang Sebesar', leftX, currentY);
  doc.text(':', leftX + labelWidth, currentY);

  const valStartX = leftX + labelWidth + sepWidth;
  const amountBoxX = valStartX;
  const amountBoxY = currentY - 4;
  const boxW = 150;
  const boxH = 20;
  const skew = 5;
  doc
    .save()
    .moveTo(amountBoxX + skew, amountBoxY)
    .lineTo(amountBoxX + boxW + skew, amountBoxY)
    .lineTo(amountBoxX + boxW, amountBoxY + boxH)
    .lineTo(amountBoxX, amountBoxY + boxH)
    .fill('#f0f0f0');
  doc.restore();

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('black')
    .text(`Rp ${formatRp(transaction.nominal)}`, amountBoxX + skew, amountBoxY + 6, {
      width: boxW - skew,
      align: 'center',
    });

  currentY += 30;

  // Terbilang
  doc.font('Helvetica').fontSize(9);
  doc.text('Terbilang', leftX, currentY);
  doc.text(':', leftX + labelWidth, currentY);
  doc
    .font('Helvetica-Oblique')
    .text(`${terbilang(transaction.nominal)}`, leftX + labelWidth + sepWidth, currentY, {
      width: 330,
    });

  // Adjust Y based on text wrap
  const textHeight = doc.heightOfString(terbilang(transaction.nominal), { width: 330 });
  currentY += Math.max(rowHeight, textHeight) + 5;

  // Untuk Kepentingan
  doc.font('Helvetica').font('Helvetica');
  const txItems = transaction.items || [transaction];
  const uraianForKepentingan = txItems.map((item) => item.uraian).join(', ');
  const uraianClean = uraianForKepentingan
    .replace(/\s*[\r\n]+\s*/g, ' ')
    .replace(/^\d{2}\.\d{2}\.\d{2}\.\d{4,}\s*/g, '')
    .replace(/^-$/, '')
    .trim();
  doc.text('Untuk Kepentingan', leftX, currentY);
  doc.text(':', leftX + labelWidth, currentY);
  doc.text('Belanja ' + uraianClean, leftX + labelWidth + sepWidth, currentY, { width: 330 });

  const uraianHeight = doc.heightOfString(uraianClean, { width: 330 });
  currentY += Math.max(rowHeight, uraianHeight) + 20;

  // SIGNATURES SECTION WITH BORDERS
  currentY += 20;
  const sigY = currentY;
  const sigHeight = 130;
  const startX = MARGIN;
  const colW = CONTENT_WIDTH / 4;

  // Draw outer border for signature section
  doc.rect(startX, sigY, CONTENT_WIDTH, sigHeight).stroke();

  // Draw vertical dividers (3 lines for 4 columns)
  for (let i = 1; i < 4; i++) {
    doc
      .moveTo(startX + i * colW, sigY)
      .lineTo(startX + i * colW, sigY + sigHeight)
      .stroke();
  }

  const dateToUse = transaction.printDate || transaction.tanggal_transaksi;
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];

  // Helper to format date
  const formatDate = (d) => {
    if (!d) return '';
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return '';
    return `Tgl, ${dateObj.getDate()}-${months[dateObj.getMonth()]}-${dateObj.getFullYear()}`;
  };

  // Main signatures (KS, Bendahara, Pemegang Barang) ALWAYS use Transaction Date
  const dateStr = formatDate(transaction.tanggal_transaksi);
  // Receiver uses Nota Date (user override or DB), fallback to Transaction Date
  const dateStrReceiver = formatDate(
    transaction.printDate || transaction.tanggal_nota || transaction.tanggal_transaksi
  );

  const signatures = [
    {
      label: 'MENGETAHUI',
      sub: `Kepala ${schoolInfo?.nama_sekolah || schoolInfo?.nama || ''}`,
      name: schoolInfo?.nama_kepsek || schoolInfo?.kepala_sekolah || '___________________',
      nip: schoolInfo?.nip_kepsek || schoolInfo?.nip_kepala || '-',
    },
    {
      label: 'Dibayar oleh',
      sub: 'Bendahara Pengeluaran',
      sub2: schoolInfo?.nama_sekolah || schoolInfo?.nama || '',
      name: schoolInfo?.nama_bendahara || schoolInfo?.bendahara || '___________________',
      nip: schoolInfo?.nip_bendahara || '-',
    },
    {
      label: 'Barang telah diterima',
      sub: 'Pemegang Barang',
      sub2: schoolInfo?.nama_sekolah || schoolInfo?.nama || '',
      name:
        schoolInfo?.nama_pemegang_barang || schoolInfo?.pemegang_barang || '___________________',
      nip: schoolInfo?.nip_pemegang_barang || '-',
    },
    { label: 'Yang menerima uang', isReceiver: true },
  ];

  doc.font('Helvetica').fontSize(8);

  signatures.forEach((sig, idx) => {
    let lx = startX + idx * colW;
    let ly = sigY + 8;
    const cellWidth = colW - 6;

    // Date - Use Receiver Date if applicable
    const dateText = sig.isReceiver ? dateStrReceiver : dateStr;
    doc.text(dateText, lx + 3, ly, { width: cellWidth, align: 'center' });
    ly += 10;

    // Label (Bold)
    if (sig.label) {
      doc.font('Helvetica-Bold').text(sig.label, lx + 3, ly, { width: cellWidth, align: 'center' });
    }
    ly += 10;

    // Sub lines
    doc.font('Helvetica');
    if (sig.sub) doc.text(sig.sub, lx + 3, ly, { width: cellWidth, align: 'center' });
    ly += 10;
    if (sig.sub2) doc.text(sig.sub2, lx + 3, ly, { width: cellWidth, align: 'center' });

    // Special handling for "Yang menerima uang" column
    // Special handling for "Yang menerima uang" column
    if (sig.isReceiver) {
      ly += 15;
      doc.fontSize(7);
      const namaToko = transaction.nama_toko
        ? transaction.nama_toko.substring(0, 25)
        : '______________';
      const alamatToko =
        transaction.is_badan_usaha === 1 && transaction.alamat_toko
          ? transaction.alamat_toko.substring(0, 25)
          : '______________';

      doc.text(`Nama : ${namaToko}`, lx + 8, ly);
      ly += 10;
      doc.text(`Alamat : ${alamatToko}`, lx + 8, ly);
      doc.fontSize(8);
    }

    // Name & NIP at bottom
    let bottomY = sigY + sigHeight - 25;
    if (sig.name) {
      doc
        .font('Helvetica-Bold')
        .text(sig.name, lx + 3, bottomY, { width: cellWidth, align: 'center', underline: true });
    }
    if (sig.nip) {
      doc
        .font('Helvetica')
        .text(`NIP. ${sig.nip}`, lx + 3, bottomY + 12, { width: cellWidth, align: 'center' });
    } else if (sig.isReceiver) {
      // Underline for receiver signature (Name or Line)
      const receiverName = transaction.nama_toko ? transaction.nama_toko.substring(0, 25) : '';
      if (receiverName) {
        doc.font('Helvetica-Bold').text(receiverName, lx + 3, bottomY, {
          width: cellWidth,
          align: 'center',
          underline: true,
        });
      } else {
        doc
          .moveTo(lx + 20, bottomY + 5)
          .lineTo(lx + colW - 20, bottomY + 5)
          .stroke();
      }
    }
  });

  // PARAF FOOTER
  currentY = sigY + sigHeight;
  doc.rect(startX, currentY, CONTENT_WIDTH, 25).stroke();
  doc.font('Helvetica').fontSize(8);
  doc.text('Paraf Pencatat Pembukuan', startX + 10, currentY + 8);
  doc.rect(startX + 130, currentY + 5, 100, 15).stroke();

  doc.end();
  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

/**
 * Helper: Get Tax Components from transaction for Export
 */
function getTaxComponentsForExport(tx) {
  // Use nominal, fallback to absolute value of signed_amount
  const nominal = tx.nominal || Math.abs(tx.signed_amount) || 0;
  const idBku = tx.id_ref_bku;

  // Handle MANUAL tax entries (from Input Pajak Manual)
  // Manual entries use jenis_pajak to determine tax column
  if (tx.is_manual && tx.jenis_pajak) {
    const isSetor = idBku === 11 || tx.pengeluaran > 0;
    const jenisMap = {
      PPN: 'ppn',
      'PPh 21': 'pph21',
      'PPh 23': 'pph23',
      'PPh 4(2)': 'pph4',
      'Pajak Daerah': 'sspd',
    };
    const taxCol = jenisMap[tx.jenis_pajak] || 'sspd';
    const result = { ppn: 0, pph21: 0, pph23: 0, pph4: 0, sspd: 0, kredit: 0 };
    if (isSetor) {
      result.kredit = nominal;
    } else {
      result[taxCol] = nominal;
    }
    return result;
  }

  // Expense (Setor) -> Kredit column
  if ([11, 6, 7, 25].includes(idBku)) {
    return { ppn: 0, pph21: 0, pph23: 0, pph4: 0, sspd: 0, kredit: nominal };
  }

  // Income (Pungut) -> check tax flags
  if (tx.is_ppn === 1) return { ppn: nominal, pph21: 0, pph23: 0, pph4: 0, sspd: 0, kredit: 0 };
  if (tx.is_pph_21 === 1) return { ppn: 0, pph21: nominal, pph23: 0, pph4: 0, sspd: 0, kredit: 0 };
  if (tx.is_pph_23 === 1) return { ppn: 0, pph21: 0, pph23: nominal, pph4: 0, sspd: 0, kredit: 0 };
  if (tx.is_pph_4 === 1) return { ppn: 0, pph21: 0, pph23: 0, pph4: nominal, sspd: 0, kredit: 0 };
  if (tx.is_sspd === 1) return { ppn: 0, pph21: 0, pph23: 0, pph4: 0, sspd: nominal, kredit: 0 };
  if (tx.is_siplah === 1) return { ppn: nominal, pph21: 0, pph23: 0, pph4: 0, sspd: 0, kredit: 0 };

  // Default to SSPD for unknown tax types
  return { ppn: 0, pph21: 0, pph23: 0, pph4: 0, sspd: nominal, kredit: 0 };
}

/**
 * GENERATE BUKTI PENGELUARAN PDF (Table Format with Items)
 * Different from A2 - shows table of items with 3 signatures
 */
async function generateBuktiPengeluaranPdf(data, schoolInfo, filePath) {
  const PDFDocument = require('pdfkit');
  const terbilang = require('../utils/terbilang');
  const writeStream = fs.createWriteStream(filePath);

  // A4 Portrait
  const doc = new PDFDocument({
    margin: 40,
    size: 'A4',
    autoFirstPage: true,
  });
  doc.pipe(writeStream);

  const MARGIN = 40;
  const PAGE_WIDTH = 595.28;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
  let currentY = MARGIN;

  // Header
  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .text('BUKTI PENGELUARAN UANG', 0, currentY, { align: 'center', width: PAGE_WIDTH });
  currentY += 25;

  // School Info
  doc
    .font('Helvetica')
    .fontSize(10)
    .text(schoolInfo?.nama_sekolah || '-', 0, currentY, { align: 'center', width: PAGE_WIDTH });
  currentY += 14;
  doc
    .fontSize(9)
    .text(schoolInfo?.alamat || '-', 0, currentY, { align: 'center', width: PAGE_WIDTH });
  currentY += 25;

  // Nota Info (left side)
  const leftColX = MARGIN;
  doc.font('Helvetica').fontSize(9);
  doc.text(`No. Nota`, leftColX, currentY);
  doc.text(`: ${data.noNota || data.no_bukti || '-'}`, leftColX + 60, currentY);
  currentY += 14;
  doc.text(`Toko/Vendor`, leftColX, currentY);
  doc.text(`: ${data.namaToko || data.uraian?.split(' - ')[0] || '-'}`, leftColX + 60, currentY);

  // Date (right side)
  const dateStr = data.tanggalNota || data.tanggal_transaksi;
  const formattedDate = dateStr
    ? new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';
  doc.text(`Tanggal: ${formattedDate}`, PAGE_WIDTH - MARGIN - 150, currentY - 14, {
    align: 'right',
    width: 150,
  });

  currentY += 25;

  // Table Headers
  const tableTop = currentY;
  const colNo = MARGIN;
  const colUraian = MARGIN + 30;
  const colNoBukti = PAGE_WIDTH - MARGIN - 150;
  const colNominal = PAGE_WIDTH - MARGIN - 70;

  doc.font('Helvetica-Bold').fontSize(9);

  // Draw header background
  doc.rect(MARGIN, tableTop, CONTENT_WIDTH, 20).stroke();
  doc.text('No', colNo + 5, tableTop + 6);
  doc.text('Uraian', colUraian + 5, tableTop + 6);
  doc.text('No. Bukti', colNoBukti + 5, tableTop + 6);
  doc.text('Jumlah (Rp)', colNominal - 10, tableTop + 6, { width: 80, align: 'right' });

  currentY = tableTop + 20;

  // Table Content
  doc.font('Helvetica').fontSize(9);
  const items = data.items || [];
  let totalNominal = 0;
  const PAGE_HEIGHT = 841.89; // A4 height in points
  const BOTTOM_MARGIN = 60;
  const MAX_Y = PAGE_HEIGHT - BOTTOM_MARGIN;

  // Helper: draw table header row
  const drawTableHeader = () => {
    doc.font('Helvetica-Bold').fontSize(9);
    doc.rect(MARGIN, currentY, CONTENT_WIDTH, 20).stroke();
    doc.text('No', colNo + 5, currentY + 6);
    doc.text('Uraian', colUraian + 5, currentY + 6);
    doc.text('No. Bukti', colNoBukti + 5, currentY + 6);
    doc.text('Jumlah (Rp)', colNominal - 10, currentY + 6, { width: 80, align: 'right' });
    currentY += 20;
    doc.font('Helvetica').fontSize(9);
  };

  items.forEach((item, idx) => {
    // Check if we need a new page (need space for at least 1 row + header)
    if (currentY + 18 > MAX_Y) {
      doc.addPage();
      currentY = MARGIN;
      drawTableHeader();
    }

    const rowHeight = 18;
    const nominal = item.nominal || 0;
    totalNominal += nominal;

    // Draw row
    doc.rect(MARGIN, currentY, CONTENT_WIDTH, rowHeight).stroke();
    doc.text(String(idx + 1), colNo + 5, currentY + 5);
    doc.text(item.uraian || '-', colUraian + 5, currentY + 5, {
      width: colNoBukti - colUraian - 10,
    });
    doc.text(item.no_bukti || '-', colNoBukti + 5, currentY + 5);
    doc.text(formatRp(nominal), colNominal - 10, currentY + 5, { width: 80, align: 'right' });

    currentY += rowHeight;
  });

  // Check if we need a new page for summary rows (Total + PPN + Jumlah Bersih = ~78pt)
  if (currentY + 80 > MAX_Y) {
    doc.addPage();
    currentY = MARGIN;
  }

  // Total Row
  doc.font('Helvetica-Bold');
  doc.rect(MARGIN, currentY, CONTENT_WIDTH, 20).stroke();
  doc.text('Total Belanja', colNoBukti - 50, currentY + 6, { width: 60, align: 'right' });
  doc.text(formatRp(totalNominal), colNominal - 10, currentY + 6, { width: 80, align: 'right' });
  currentY += 20;

  // PPN Row (if applicable)
  const ppn = data.calculatedPPN || Math.round((totalNominal * 11) / 111);
  if (data.hasPPN) {
    doc.font('Helvetica');
    doc.rect(MARGIN, currentY, CONTENT_WIDTH, 18).stroke();
    doc.text('PPN (11%)', colNoBukti - 50, currentY + 5, { width: 60, align: 'right' });
    doc
      .fillColor('#16a34a')
      .text(formatRp(ppn), colNominal - 10, currentY + 5, { width: 80, align: 'right' });
    doc.fillColor('black');
    currentY += 18;

    // Jumlah Bersih
    const jumlahBersih = totalNominal - ppn;
    doc.font('Helvetica-Bold');
    doc.rect(MARGIN, currentY, CONTENT_WIDTH, 20).stroke();
    doc.text('Jumlah Bersih', colNoBukti - 70, currentY + 6, { width: 70, align: 'right' });
    doc.text(formatRp(jumlahBersih), colNominal - 10, currentY + 6, { width: 80, align: 'right' });
    currentY += 20;
  }

  // Check if we need a new page for Terbilang + Signatures (~140pt)
  if (currentY + 140 > MAX_Y) {
    doc.addPage();
    currentY = MARGIN;
  }

  currentY += 25;

  // Terbilang box
  const jumlahBersih = data.hasPPN ? totalNominal - ppn : totalNominal;
  const terbilangText = terbilang(jumlahBersih);

  doc.font('Helvetica-Oblique').fontSize(9);
  // Use text box to handle long text wrap
  doc.text(`Terbilang: ${terbilangText} Rupiah`, MARGIN, currentY, {
    width: CONTENT_WIDTH,
    align: 'left',
  });

  currentY += 40;

  // Signatures (3 columns)
  const sigY = currentY;
  const sigWidth = CONTENT_WIDTH / 3;
  const sigHeight = 70;

  // Penerima
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('Penerima', MARGIN, sigY, { width: sigWidth, align: 'center' });

  doc
    .font('Helvetica')
    .fontSize(9)
    .text('................................', MARGIN, sigY + sigHeight - 15, {
      width: sigWidth,
      align: 'center',
    });

  doc
    .moveTo(MARGIN + 20, sigY + sigHeight)
    .lineTo(MARGIN + sigWidth - 20, sigY + sigHeight)
    .stroke();

  // Bendahara
  const bendaharaName = schoolInfo?.nama_bendahara || schoolInfo?.bendahara || '.......................';
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('Bendahara', MARGIN + sigWidth, sigY, { width: sigWidth, align: 'center' });

  doc
    .font('Helvetica')
    .fontSize(9)
    .text(bendaharaName, MARGIN + sigWidth, sigY + sigHeight - 15, {
      width: sigWidth,
      align: 'center',
    });

  doc
    .moveTo(MARGIN + sigWidth + 20, sigY + sigHeight)
    .lineTo(MARGIN + sigWidth * 2 - 20, sigY + sigHeight)
    .stroke();

  if (schoolInfo?.nip_bendahara) {
    doc
      .font('Helvetica')
      .fontSize(8)
      .text(`NIP. ${schoolInfo.nip_bendahara}`, MARGIN + sigWidth, sigY + sigHeight + 5, {
        width: sigWidth,
        align: 'center',
      });
  }

  // Kepala Sekolah
  const kepsekName = schoolInfo?.kepala_sekolah || '.......................';
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .text('Kepala Sekolah', MARGIN + sigWidth * 2, sigY, { width: sigWidth, align: 'center' });

  doc
    .font('Helvetica')
    .fontSize(9)
    .text(kepsekName, MARGIN + sigWidth * 2, sigY + sigHeight - 15, {
      width: sigWidth,
      align: 'center',
    });

  doc
    .moveTo(MARGIN + sigWidth * 2 + 20, sigY + sigHeight)
    .lineTo(PAGE_WIDTH - MARGIN - 20, sigY + sigHeight)
    .stroke();

  if (schoolInfo?.nip_kepsek) {
    doc
      .font('Helvetica')
      .fontSize(8)
      .text(`NIP. ${schoolInfo.nip_kepsek}`, MARGIN + sigWidth * 2, sigY + sigHeight + 5, {
        width: sigWidth,
        align: 'center',
      });
  }

  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(filePath));
    writeStream.on('error', reject);
  });
}

module.exports = { exportData, generateKwitansiPdf, generateBuktiPengeluaranPdf, exportAllReports };

/**
 * EXPORT ALL REPORTS - Multi-Sheet Excel with all BKU types
 * Creates one workbook with sheets: BKU Umum (12 months), Tunai (12 months), Bank (12 months), Pajak (12 months)
 */
async function exportAllReports(allData, options) {
  const { dialog } = require('electron');
  const ExcelJS = require('exceljs');

  const defaultName = 'SmartSPJ_All_BKU_' + (options.fundSource || 'SEMUA') + '_TA' + options.year;

  const result = await dialog.showSaveDialog({
    title: 'Export Semua Laporan BKU',
    defaultPath: defaultName + '.xlsx',
    filters: [{ name: 'Excel', extensions: ['xlsx'] }],
  });

  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true };
  }

  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Smart SPJ';
    workbook.created = new Date();

    const reportTypes = [
      { type: 'UMUM', label: 'BKU Umum', isPajak: false },
      { type: 'TUNAI', label: 'BKU Tunai', isPajak: false },
      { type: 'BANK', label: 'BKU Bank', isPajak: false },
      { type: 'PAJAK', label: 'Buku Pajak', isPajak: true },
    ];

    const monthNames = [
      '',
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

    for (const report of reportTypes) {
      const datasets = allData[report.type] || [];
      const hasData = datasets.some((d) => d.transactions && d.transactions.length > 0);
      if (!hasData) continue;

      const ws = workbook.addWorksheet(report.label, {
        pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
      });

      ws.columns = [
        { width: 12 },
        { width: 14 },
        { width: 16 },
        { width: 16 },
        { width: 12 },
        { width: 45 },
        { width: 16 },
        { width: 16 },
        { width: 16 },
      ];

      let rowNum = 1;
      const isPajak = report.isPajak;
      const titleColor = isPajak ? 'FF6B21A8' : 'FF800020';

      ws.mergeCells('A1:I1');
      const titleRow = ws.getRow(1);
      titleRow.getCell(1).value = report.label.toUpperCase();
      titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: titleColor } };
      titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      titleRow.height = 28;
      rowNum = 2;

      ws.mergeCells('A2:I2');
      const subRow = ws.getRow(2);
      subRow.getCell(1).value =
        'TAHUN ANGGARAN : ' + options.year + '    SUMBER DANA : ' + (options.fundSource || 'SEMUA');
      subRow.getCell(1).font = { bold: true, size: 10 };
      subRow.getCell(1).alignment = { horizontal: 'center' };
      rowNum = 3;

      const schoolInfo = options.schoolInfo || {};
      const infoItems = [
        ['Nama Sekolah', schoolInfo.nama_sekolah || schoolInfo.nama || '-'],
        ['NPSN', schoolInfo.npsn || '-'],
        ['Kabupaten/Kota', schoolInfo.kabupaten || '-'],
      ];
      for (const [label, val] of infoItems) {
        const row = ws.getRow(rowNum);
        row.getCell(1).value = label;
        row.getCell(1).font = { size: 9, bold: true };
        ws.mergeCells('B' + rowNum + ':I' + rowNum);
        row.getCell(2).value = val;
        row.getCell(2).font = { size: 9 };
        rowNum++;
      }
      rowNum++;

      for (const data of datasets) {
        if (!data.transactions || data.transactions.length === 0) continue;
        const monthName = monthNames[data.month] || 'Bulan ' + data.month;

        ws.mergeCells('A' + rowNum + ':I' + rowNum);
        const sepRow = ws.getRow(rowNum);
        sepRow.getCell(1).value = 'BULAN : ' + monthName.toUpperCase();
        sepRow.getCell(1).font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        sepRow.getCell(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: titleColor },
        };
        sepRow.getCell(1).alignment = { horizontal: 'center' };
        sepRow.height = 22;
        rowNum++;

        const headerRow = ws.getRow(rowNum);
        [
          'BULAN',
          'TANGGAL',
          'KODE KEGIATAN',
          'KODE REKENING',
          'NO. BUKTI',
          'URAIAN',
          'PENERIMAAN',
          'PENGELUARAN',
          'SALDO',
        ].forEach((h, i) => {
          const cell = headerRow.getCell(i + 1);
          cell.value = h;
          cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: titleColor } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
        headerRow.height = 20;
        rowNum++;

        let totalPenerimaan = 0;
        let totalPengeluaran = 0;

        for (const tx of data.transactions) {
          totalPenerimaan += tx.penerimaan || 0;
          totalPengeluaran += tx.pengeluaran || 0;

          const row = ws.getRow(rowNum);
          row.getCell(1).value = monthName.substring(0, 3);
          row.getCell(2).value = tx.tanggal_transaksi || '';
          row.getCell(3).value = tx.kode_kegiatan || '';
          row.getCell(4).value = tx.kode_rekening || '';
          row.getCell(5).value = tx.no_bukti || '';
          row.getCell(6).value = tx.uraian || '';
          row.getCell(7).value = tx.penerimaan > 0 ? tx.penerimaan : '';
          row.getCell(8).value = tx.pengeluaran > 0 ? tx.pengeluaran : '';
          row.getCell(9).value = tx.saldo_berjalan;

          for (let i = 1; i <= 9; i++) {
            const cell = row.getCell(i);
            cell.font = { size: 9 };
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
              left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
              bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
              right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            };
            if (i >= 7) {
              cell.alignment = { horizontal: 'right' };
              if (typeof cell.value === 'number') cell.numFmt = '#,##0';
            }
          }
          rowNum++;
        }

        const jumlahRow = ws.getRow(rowNum);
        jumlahRow.getCell(6).value = 'JUMLAH ' + monthName.toUpperCase();
        jumlahRow.getCell(7).value = totalPenerimaan;
        jumlahRow.getCell(8).value = totalPengeluaran;
        jumlahRow.getCell(9).value = data.calculatedSaldo;
        for (let i = 1; i <= 9; i++) {
          const cell = jumlahRow.getCell(i);
          cell.font = { bold: true, size: 9 };
          cell.border = { top: { style: 'medium' }, bottom: { style: 'medium' } };
          if (i >= 7) {
            cell.alignment = { horizontal: 'right' };
            cell.numFmt = '#,##0';
          }
        }
        rowNum += 2;
      }
    }

    await workbook.xlsx.writeFile(result.filePath);
    return { success: true, filePath: result.filePath };
  } catch (err) {
    console.error('Export All Error:', err);
    return { success: false, error: err.message };
  }
}
