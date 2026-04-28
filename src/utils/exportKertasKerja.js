import ExcelJS from 'exceljs';

/**
 * Format number as Rupiah currency
 */
const _formatRupiah = (num) => {
  if (num === null || num === undefined || isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const MONTHS_ID = [
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

const STANDARDS_MAP = {
  '01': 'Standar Kompetensi Lulusan',
  '02': 'Standar Isi',
  '03': 'Standar Proses',
  '04': 'Standar Pendidik dan Tenaga Kependidikan',
  '05': 'Standar Sarana dan Prasarana',
  '06': 'Standar Pengelolaan',
  '07': 'Standar Pembiayaan',
  '08': 'Standar Penilaian Pendidikan',
};

/**
 * Group data by L1 > L2 > L3 hierarchy
 */
const groupData = (data) => {
  const grouped = {};
  let totalAll = 0;

  data.forEach((item) => {
    const parts = (item.kode_kegiatan || '').split('.');
    const codeL1 = parts[0] || 'XX';
    const codeL2 = parts[1] ? `${parts[0]}.${parts[1]}` : `${codeL1}.XX`;
    const codeL3 = item.kode_kegiatan;

    if (!grouped[codeL1])
      grouped[codeL1] = { name: STANDARDS_MAP[codeL1] || `Standar ${codeL1}`, l2: {} };
    if (!grouped[codeL1].l2[codeL2]) grouped[codeL1].l2[codeL2] = { name: '', l3: {} };
    if (!grouped[codeL1].l2[codeL2].l3[codeL3])
      grouped[codeL1].l2[codeL2].l3[codeL3] = { name: item.nama_kegiatan, items: [] };

    const price = item.harga_satuan || 0;
    item.q1 = ((item.v1 || 0) + (item.v2 || 0) + (item.v3 || 0)) * price;
    item.q2 = ((item.v4 || 0) + (item.v5 || 0) + (item.v6 || 0)) * price;
    item.q3 = ((item.v7 || 0) + (item.v8 || 0) + (item.v9 || 0)) * price;
    item.q4 = ((item.v10 || 0) + (item.v11 || 0) + (item.v12 || 0)) * price;
    item.totalYear = item.q1 + item.q2 + item.q3 + item.q4;

    grouped[codeL1].l2[codeL2].l3[codeL3].items.push(item);
    totalAll += item.total || item.totalYear || 0;
  });

  return { grouped, totalAll };
};

/**
 * Aggregate data for Lembar format (by Kode Rekening categories)
 */
const aggregateLembarData = (data) => {
  const safeData = Array.isArray(data) ? data : [];
  const aggs = {
    belanja: 0,
    operasi: 0,
    barangJasa: 0,
    barang: 0,
    jasa: 0,
    pemeliharaan: 0,
    perjalanan: 0,
    modal: 0,
    modalPeralatan: 0,
    modalAset: 0,
    q_operasi: [0, 0, 0, 0],
    q_modal: [0, 0, 0, 0],
  };
  let totalQ1 = 0,
    totalQ2 = 0,
    totalQ3 = 0,
    totalQ4 = 0;

  safeData.forEach((item) => {
    const total = Number(item.total) || 0;
    const koderek = item.kode_rekening || '';
    const price = Number(item.harga_satuan) || 0;
    const q1 = ((Number(item.v1) || 0) + (Number(item.v2) || 0) + (Number(item.v3) || 0)) * price;
    const q2 = ((Number(item.v4) || 0) + (Number(item.v5) || 0) + (Number(item.v6) || 0)) * price;
    const q3 = ((Number(item.v7) || 0) + (Number(item.v8) || 0) + (Number(item.v9) || 0)) * price;
    const q4 =
      ((Number(item.v10) || 0) + (Number(item.v11) || 0) + (Number(item.v12) || 0)) * price;

    totalQ1 += q1;
    totalQ2 += q2;
    totalQ3 += q3;
    totalQ4 += q4;
    aggs.belanja += total;

    if (koderek.startsWith('5.1')) {
      aggs.operasi += total;
      aggs.q_operasi[0] += q1;
      aggs.q_operasi[1] += q2;
      aggs.q_operasi[2] += q3;
      aggs.q_operasi[3] += q4;
      if (koderek.startsWith('5.1.02')) {
        aggs.barangJasa += total;
        if (koderek.startsWith('5.1.02.01')) aggs.barang += total;
        else if (koderek.startsWith('5.1.02.02')) aggs.jasa += total;
        else if (koderek.startsWith('5.1.02.03')) aggs.pemeliharaan += total;
        else if (koderek.startsWith('5.1.02.04')) aggs.perjalanan += total;
      }
    } else if (koderek.startsWith('5.2')) {
      aggs.modal += total;
      aggs.q_modal[0] += q1;
      aggs.q_modal[1] += q2;
      aggs.q_modal[2] += q3;
      aggs.q_modal[3] += q4;
      if (koderek.startsWith('5.2.02')) aggs.modalPeralatan += total;
      else if (koderek.startsWith('5.2.05')) aggs.modalAset += total;
    }
  });

  return { aggs, totalQ: [totalQ1, totalQ2, totalQ3, totalQ4] };
};

/**
 * Export Lembar Kertas Kerja to Excel - matches app view exactly
 */
async function exportLembarToExcel(data, metadata) {
  const { year, fundSource, schoolInfo } = metadata;
  const schoolName = schoolInfo?.nama_sekolah || schoolInfo?.nama || 'Sekolah';
  const npsn = schoolInfo?.npsn || '-';
  const kabupaten = schoolInfo?.kabupaten_kota || schoolInfo?.kabupaten || '-';

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SmartSPJ';
  const worksheet = workbook.addWorksheet('Lembar Kertas Kerja');

  // Styles
  const boldCenter = {
    font: { bold: true, size: 11 },
    alignment: { horizontal: 'center', vertical: 'middle' },
  };
  const boldLeft = {
    font: { bold: true, size: 10 },
    alignment: { horizontal: 'left', vertical: 'middle' },
  };
  const normalLeft = { font: { size: 10 }, alignment: { horizontal: 'left', vertical: 'middle' } };
  const numRight = {
    font: { size: 10 },
    alignment: { horizontal: 'right', vertical: 'middle' },
    numFmt: '#,##0',
  };
  const numRightBold = {
    font: { bold: true, size: 10 },
    alignment: { horizontal: 'right', vertical: 'middle' },
    numFmt: '#,##0',
  };
  const headerBg = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
  const border = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } },
  };

  let row = 1;

  // === HEADER (Row 1-4) ===
  worksheet.mergeCells(`A${row}:C${row}`);
  worksheet.getCell(`A${row}`).value = 'LEMBAR KERTAS KERJA';
  worksheet.getCell(`A${row}`).style = { ...boldCenter, border };
  row++;

  worksheet.mergeCells(`A${row}:C${row}`);
  worksheet.getCell(`A${row}`).value = 'UNIT KERJA';
  worksheet.getCell(`A${row}`).style = { ...boldCenter, border };
  row++;

  worksheet.mergeCells(`A${row}:C${row}`);
  worksheet.getCell(`A${row}`).value = `PEMERINTAH KAB. ${kabupaten}`;
  worksheet.getCell(`A${row}`).style = { ...boldCenter, border };
  row++;

  worksheet.mergeCells(`A${row}:C${row}`);
  worksheet.getCell(`A${row}`).value = `TAHUN ANGGARAN ${year}`;
  worksheet.getCell(`A${row}`).style = { ...boldCenter, border };
  row++;

  // === INFO SECTION (Row 5-7) ===
  row++; // Empty row

  worksheet.getCell(`A${row}`).value = 'Urusan Pemerintahan :';
  worksheet.getCell(`A${row}`).style = boldLeft;
  worksheet.getCell(`C${row}`).value = '1.01 - PENDIDIKAN';
  worksheet.getCell(`C${row}`).style = normalLeft;
  row++;

  worksheet.getCell(`A${row}`).value = 'Organisasi :';
  worksheet.getCell(`A${row}`).style = boldLeft;
  worksheet.getCell(`C${row}`).value = `${npsn} - ${schoolName}`;
  worksheet.getCell(`C${row}`).style = normalLeft;
  row++;

  row++; // Empty row

  // === TABLE 1: Rincian Anggaran ===
  worksheet.mergeCells(`A${row}:C${row}`);
  worksheet.getCell(`A${row}`).value = 'Rincian Anggaran Pendapatan dan Belanja Unit Kerja';
  worksheet.getCell(`A${row}`).style = { ...boldCenter, border };
  row++;

  // Table Headers
  worksheet.getCell(`A${row}`).value = 'Kode Rekening';
  worksheet.getCell(`A${row}`).style = { ...boldCenter, border, fill: headerBg };
  worksheet.getCell(`B${row}`).value = 'Uraian';
  worksheet.getCell(`B${row}`).style = { ...boldCenter, border, fill: headerBg };
  worksheet.getCell(`C${row}`).value = 'Jumlah (Rp)';
  worksheet.getCell(`C${row}`).style = { ...boldCenter, border, fill: headerBg };
  row++;

  // Aggregate data
  const { aggs, totalQ } = aggregateLembarData(data);

  // Data rows - matching app view exactly
  const lembarRows = [
    { kode: '', uraian: 'JUMLAH PENDAPATAN', jumlah: '', bold: true },
    { kode: '5', uraian: 'BELANJA', jumlah: aggs.belanja, bold: true },
    { kode: '5.1', uraian: '    BELANJA OPERASI', jumlah: aggs.operasi },
    { kode: '5.1.02', uraian: '        BELANJA BARANG DAN JASA', jumlah: aggs.barangJasa },
    { kode: '5.1.02.01', uraian: '            BELANJA BARANG', jumlah: aggs.barang },
    { kode: '5.1.02.02', uraian: '            BELANJA JASA', jumlah: aggs.jasa },
    { kode: '5.1.02.03', uraian: '            BELANJA PEMELIHARAAN', jumlah: aggs.pemeliharaan },
    { kode: '5.1.02.04', uraian: '            BELANJA PERJALANAN DINAS', jumlah: aggs.perjalanan },
    { kode: '5.2', uraian: '    BELANJA MODAL', jumlah: aggs.modal },
    {
      kode: '5.2.02',
      uraian: '        BELANJA MODAL PERALATAN DAN MESIN',
      jumlah: aggs.modalPeralatan,
    },
    { kode: '5.2.05', uraian: '        BELANJA MODAL ASET TETAP LAINNYA', jumlah: aggs.modalAset },
    { kode: '', uraian: 'Jumlah BELANJA', jumlah: aggs.belanja, bold: true, highlight: true },
  ];

  lembarRows.forEach((r) => {
    worksheet.getCell(`A${row}`).value = r.kode;
    worksheet.getCell(`A${row}`).style = { ...normalLeft, border };
    worksheet.getCell(`B${row}`).value = r.uraian;
    worksheet.getCell(`B${row}`).style = r.bold
      ? { ...boldLeft, border }
      : { ...normalLeft, border };
    worksheet.getCell(`C${row}`).value = r.jumlah || '';
    worksheet.getCell(`C${row}`).style = r.bold
      ? { ...numRightBold, border }
      : { ...numRight, border };
    if (r.highlight) {
      worksheet.getCell(`A${row}`).fill = headerBg;
      worksheet.getCell(`B${row}`).fill = headerBg;
      worksheet.getCell(`C${row}`).fill = headerBg;
    }
    row++;
  });

  row += 2; // Gap before Table 2

  // === TABLE 2: Triwulan ===
  worksheet.mergeCells(`A${row}:G${row}`);
  worksheet.getCell(`A${row}`).value = 'Rencana Pelaksanaan Anggaran Unit Kerja per Triwulan';
  worksheet.getCell(`A${row}`).style = { ...boldCenter, border };
  row++;

  // Table 2 Headers
  const twHeaders = ['No', 'Uraian', 'TW I', 'TW II', 'TW III', 'TW IV', 'Jumlah'];
  twHeaders.forEach((h, i) => {
    const col = String.fromCharCode(65 + i);
    worksheet.getCell(`${col}${row}`).value = h;
    worksheet.getCell(`${col}${row}`).style = { ...boldCenter, border, fill: headerBg };
  });
  row++;

  // Triwulan Data
  const twData = [
    {
      no: '1',
      uraian: 'Pendapatan',
      q1: totalQ[0],
      q2: totalQ[1],
      q3: totalQ[2],
      q4: totalQ[3],
      total: aggs.belanja,
    },
    {
      no: '2.1',
      uraian: 'Belanja Operasi',
      q1: aggs.q_operasi[0],
      q2: aggs.q_operasi[1],
      q3: aggs.q_operasi[2],
      q4: aggs.q_operasi[3],
      total: aggs.operasi,
    },
    {
      no: '2.2',
      uraian: 'Belanja Modal',
      q1: aggs.q_modal[0],
      q2: aggs.q_modal[1],
      q3: aggs.q_modal[2],
      q4: aggs.q_modal[3],
      total: aggs.modal,
    },
  ];

  twData.forEach((r) => {
    worksheet.getCell(`A${row}`).value = r.no;
    worksheet.getCell(`A${row}`).style = {
      ...normalLeft,
      border,
      alignment: { horizontal: 'center' },
    };
    worksheet.getCell(`B${row}`).value = r.uraian;
    worksheet.getCell(`B${row}`).style = { ...normalLeft, border };
    worksheet.getCell(`C${row}`).value = r.q1;
    worksheet.getCell(`C${row}`).style = { ...numRight, border };
    worksheet.getCell(`D${row}`).value = r.q2;
    worksheet.getCell(`D${row}`).style = { ...numRight, border };
    worksheet.getCell(`E${row}`).value = r.q3;
    worksheet.getCell(`E${row}`).style = { ...numRight, border };
    worksheet.getCell(`F${row}`).value = r.q4;
    worksheet.getCell(`F${row}`).style = { ...numRight, border };
    worksheet.getCell(`G${row}`).value = r.total;
    worksheet.getCell(`G${row}`).style = { ...numRightBold, border, fill: headerBg };
    row++;
  });

  // Column widths matching app
  worksheet.columns = [
    { width: 15 }, // A: Kode Rekening / No
    { width: 50 }, // B: Uraian
    { width: 18 }, // C: Jumlah / TW I
    { width: 18 }, // D: TW II
    { width: 18 }, // E: TW III
    { width: 18 }, // F: TW IV
    { width: 18 }, // G: Jumlah (TW table)
  ];

  // Download
  const filename = `Lembar_Kertas_Kerja_${fundSource}_${year}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);

  return true;
}

/**
 * Export Kertas Kerja to Excel with ExcelJS styling
 */
export async function exportToExcel(data, metadata) {
  const {
    year,
    fundSource,
    schoolInfo,
    reportTitle = 'Kertas Kerja',
    selectedFormat,
    selectedMonth,
    months,
  } = metadata;

  const schoolName = schoolInfo?.nama_sekolah || schoolInfo?.nama || 'Sekolah';
  const npsn = schoolInfo?.npsn || '-';

  const isLembar = (selectedFormat || '').toLowerCase().includes('lembar');
  const isQuarterly = (selectedFormat || '').toLowerCase().includes('triwulan') && !isLembar;
  const isMonthly = (selectedFormat || '').toLowerCase().includes('bulanan');
  const monthName = isMonthly
    ? months?.[selectedMonth - 1] || MONTHS_ID[selectedMonth - 1] || ''
    : '';

  // Handle Lembar format separately
  if (isLembar) {
    return exportLembarToExcel(data, metadata);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SmartSPJ';
  workbook.created = new Date();

  const sheetName = isQuarterly ? 'Triwulan' : isMonthly ? `Bulanan-${monthName}` : 'Tahunan';
  const worksheet = workbook.addWorksheet(sheetName);

  // Styles
  const headerStyle = {
    font: { bold: true, size: 14 },
    alignment: { horizontal: 'center' },
  };
  const subHeaderStyle = {
    font: { bold: true, size: 11 },
    alignment: { horizontal: 'left' },
  };
  const tableHeaderStyle = {
    font: { bold: true, size: 10, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
  };
  const l1Style = {
    font: { bold: true, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4EC' } },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
  };
  const l2Style = {
    font: { bold: true, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
  };
  const l3Style = {
    font: { bold: true, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
  };
  const dataStyle = {
    font: { size: 10 },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
  };
  const totalStyle = {
    font: { bold: true, size: 11 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1D5DB' } },
    border: {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
  };

  // === HEADER SECTION ===
  let row = 1;

  // Title
  worksheet.mergeCells(`A${row}:I${row}`);
  const titleCell = worksheet.getCell(`A${row}`);
  titleCell.value = `${reportTitle} - ${fundSource}`;
  titleCell.style = headerStyle;
  row++;

  // Subtitle with year and month
  worksheet.mergeCells(`A${row}:I${row}`);
  const subtitleCell = worksheet.getCell(`A${row}`);
  subtitleCell.value = isMonthly
    ? `Tahun Anggaran: ${year} - Bulan: ${monthName}`
    : `Tahun Anggaran: ${year}`;
  subtitleCell.style = subHeaderStyle;
  row++;

  // School info
  worksheet.mergeCells(`A${row}:I${row}`);
  worksheet.getCell(`A${row}`).value = `Sekolah: ${schoolName} (NPSN: ${npsn})`;
  worksheet.getCell(`A${row}`).style = subHeaderStyle;
  row++;

  // Format info
  worksheet.mergeCells(`A${row}:I${row}`);
  worksheet.getCell(`A${row}`).value = `Format: ${selectedFormat || 'Rincian'}`;
  worksheet.getCell(`A${row}`).style = subHeaderStyle;
  row += 2; // Empty row

  // === TABLE HEADERS ===
  let headers = [];
  if (isQuarterly) {
    headers = [
      'No',
      'Kode Kegiatan',
      'Nama Kegiatan',
      'Uraian',
      'Vol',
      'Satuan',
      'Harga Satuan',
      'Jumlah',
      'TW 1',
      'TW 2',
      'TW 3',
      'TW 4',
    ];
  } else if (isMonthly) {
    headers = [
      'No',
      'Kode Kegiatan',
      'Nama Kegiatan',
      'Kode Rekening',
      'Uraian',
      'Vol',
      'Satuan',
      'Harga Satuan',
      'Jumlah',
    ];
  } else {
    headers = [
      'No',
      'Kode Kegiatan',
      'Nama Kegiatan',
      'Kode Rekening',
      'Uraian',
      'Vol',
      'Satuan',
      'Harga Satuan',
      'Total',
    ];
  }

  const headerRow = worksheet.getRow(row);
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    Object.assign(cell, { style: tableHeaderStyle });
  });
  headerRow.height = 25;
  row++;

  // === DATA ROWS ===
  const { grouped, totalAll } = groupData(data);
  let no = 1;

  const addDataRow = (values, style) => {
    const dataRow = worksheet.getRow(row);
    values.forEach((v, idx) => {
      const cell = dataRow.getCell(idx + 1);
      cell.value = v;
      Object.assign(cell, { style });
      if (idx >= 5 && typeof v === 'number') {
        cell.numFmt = '#,##0';
      }
    });
    row++;
  };

  Object.keys(grouped)
    .sort()
    .forEach((l1Code) => {
      const l1 = grouped[l1Code];
      const l1Items = Object.values(l1.l2).flatMap((l2) =>
        Object.values(l2.l3).flatMap((l3) => l3.items)
      );
      const l1Total = l1Items.reduce((s, i) => s + (i.total || i.totalYear), 0);
      const l1Q = [
        l1Items.reduce((s, i) => s + (i.q1 || 0), 0),
        l1Items.reduce((s, i) => s + (i.q2 || 0), 0),
        l1Items.reduce((s, i) => s + (i.q3 || 0), 0),
        l1Items.reduce((s, i) => s + (i.q4 || 0), 0),
      ];

      if (isQuarterly) {
        addDataRow(
          [no++, l1Code, l1.name, '', '', '', '', l1Total, l1Q[0], l1Q[1], l1Q[2], l1Q[3]],
          l1Style
        );
      } else {
        addDataRow([no++, l1Code, l1.name, '', '', '', '', '', l1Total], l1Style);
      }

      Object.keys(l1.l2)
        .sort()
        .forEach((l2Code) => {
          const l2 = l1.l2[l2Code];
          const l2Items = Object.values(l2.l3).flatMap((l3) => l3.items);
          const l2Total = l2Items.reduce((s, i) => s + (i.total || i.totalYear), 0);
          const l2Q = [
            l2Items.reduce((s, i) => s + (i.q1 || 0), 0),
            l2Items.reduce((s, i) => s + (i.q2 || 0), 0),
            l2Items.reduce((s, i) => s + (i.q3 || 0), 0),
            l2Items.reduce((s, i) => s + (i.q4 || 0), 0),
          ];

          if (isQuarterly) {
            addDataRow(
              [
                no++,
                l2Code,
                l2.name || `Kegiatan ${l2Code}`,
                '',
                '',
                '',
                '',
                l2Total,
                l2Q[0],
                l2Q[1],
                l2Q[2],
                l2Q[3],
              ],
              l2Style
            );
          } else {
            addDataRow(
              [no++, l2Code, l2.name || `Kegiatan ${l2Code}`, '', '', '', '', '', l2Total],
              l2Style
            );
          }

          Object.keys(l2.l3)
            .sort()
            .forEach((l3Code) => {
              const l3 = l2.l3[l3Code];
              const l3Total = l3.items.reduce((s, i) => s + (i.total || i.totalYear), 0);
              const l3Q = [
                l3.items.reduce((s, i) => s + (i.q1 || 0), 0),
                l3.items.reduce((s, i) => s + (i.q2 || 0), 0),
                l3.items.reduce((s, i) => s + (i.q3 || 0), 0),
                l3.items.reduce((s, i) => s + (i.q4 || 0), 0),
              ];

              if (isQuarterly) {
                addDataRow(
                  [no++, l3Code, l3.name, '', '', '', '', l3Total, l3Q[0], l3Q[1], l3Q[2], l3Q[3]],
                  l3Style
                );
              } else {
                addDataRow([no++, l3Code, l3.name, '', '', '', '', '', l3Total], l3Style);
              }

              l3.items.forEach((item) => {
                const vol = isQuarterly
                  ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].reduce(
                    (s, i) => s + (item[`v${i}`] || 0),
                    0
                  )
                  : item.volume || 0;

                if (isQuarterly) {
                  addDataRow(
                    [
                      no++,
                      l3Code,
                      item.nama_kegiatan || '',
                      item.nama_barang || '',
                      vol,
                      item.satuan || '',
                      item.harga_satuan || 0,
                      item.totalYear || item.total || 0,
                      item.q1 || 0,
                      item.q2 || 0,
                      item.q3 || 0,
                      item.q4 || 0,
                    ],
                    dataStyle
                  );
                } else {
                  addDataRow(
                    [
                      no++,
                      item.kode_kegiatan || '',
                      item.nama_kegiatan || '',
                      item.kode_rekening || '',
                      item.nama_barang || '',
                      vol,
                      item.satuan || '',
                      item.harga_satuan || 0,
                      item.total || 0,
                    ],
                    dataStyle
                  );
                }
              });
            });
        });
    });

  // === TOTAL ROW ===
  const totalRow = worksheet.getRow(row);
  const colSpan = isQuarterly ? 7 : 8;
  worksheet.mergeCells(`A${row}:${String.fromCharCode(64 + colSpan)}${row}`);
  totalRow.getCell(1).value = 'TOTAL BELANJA';
  totalRow.getCell(1).style = totalStyle;
  totalRow.getCell(colSpan + 1).value = totalAll;
  totalRow.getCell(colSpan + 1).style = totalStyle;
  totalRow.getCell(colSpan + 1).numFmt = '#,##0';

  // === COLUMN WIDTHS ===
  worksheet.columns = [
    { width: 5 }, // No
    { width: 14 }, // Kode Kegiatan
    { width: 35 }, // Nama Kegiatan
    { width: 14 }, // Kode Rekening / Uraian
    { width: 30 }, // Uraian
    { width: 8 }, // Vol
    { width: 10 }, // Satuan
    { width: 15 }, // Harga Satuan
    { width: 18 }, // Total/Jumlah
    { width: 14 }, // TW1
    { width: 14 }, // TW2
    { width: 14 }, // TW3
    { width: 14 }, // TW4
  ];

  // === DOWNLOAD ===
  const formatSuffix = isQuarterly ? 'Triwulan' : isMonthly ? `Bulanan-${monthName}` : 'Tahunan';
  const filename = `${reportTitle}_${fundSource}_${year}_${formatSuffix}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);

  return true;
}

/**
 * Export Kertas Kerja to PDF by printing actual DOM content
 * This ensures output matches exactly what's shown in the app
 */
export function exportToPDF(data, metadata) {
  const { year, fundSource, schoolInfo, reportTitle = 'Kertas Kerja', selectedFormat } = metadata;

  const schoolName = schoolInfo?.nama_sekolah || schoolInfo?.nama || 'Sekolah';
  const npsn = schoolInfo?.npsn || '-';
  const kabupaten = schoolInfo?.kabupaten_kota || schoolInfo?.kabupaten || '-';
  const alamat = schoolInfo?.alamat || schoolInfo?.alamat_jalan || '-';

  const isLembar = (selectedFormat || '').toLowerCase().includes('lembar');
  const isQuarterly = (selectedFormat || '').toLowerCase().includes('triwulan') && !isLembar;
  const isAnnual = (selectedFormat || '').toLowerCase().includes('tahunan');

  // Paper size based on format
  const paperSize = isLembar ? 'A4 portrait' : '33cm 21.5cm landscape';
  const titleText = isLembar
    ? 'LEMBAR KERTAS KERJA'
    : `RKAS - ${isQuarterly ? 'TRIWULAN' : isAnnual ? 'TAHUNAN' : 'BULANAN'}`;

  // Find the table container in the DOM
  const tableContainer = document.querySelector('.bg-white.p-6');
  const tableContent = tableContainer ? tableContainer.innerHTML : '';

  // Handle Lembar format separately
  if (isLembar) {
    const { aggs, totalQ } = aggregateLembarData(data);
    const formatNum = (n) => new Intl.NumberFormat('id-ID').format(n || 0);

    const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Lembar Kertas Kerja - ${fundSource} ${year}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: Arial, sans-serif; font-size: 10pt; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .header h1 { font-size: 14pt; font-weight: bold; }
                    .header h2 { font-size: 12pt; }
                    .info { margin-bottom: 15px; }
                    .info td { padding: 2px 5px; }
                    table.main { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    table.main th, table.main td { border: 1px solid #333; padding: 4px 8px; }
                    table.main th { background: #f0f0f0; text-align: center; font-weight: bold; }
                    .num { text-align: right; }
                    .bold { font-weight: bold; }
                    @media print { 
                        body { padding: 0; } 
                        @page { margin: 1cm; size: A4 portrait; } 
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>LEMBAR KERTAS KERJA</h1>
                    <h2>UNIT KERJA</h2>
                    <h2>PEMERINTAH KAB. ${kabupaten}</h2>
                    <h2>TAHUN ANGGARAN ${year}</h2>
                </div>
                <table class="info">
                    <tr><td>Urusan Pemerintahan</td><td>:</td><td>1.01 - PENDIDIKAN</td></tr>
                    <tr><td>Organisasi</td><td>:</td><td>${npsn} - ${schoolName}</td></tr>
                </table>
                <div style="text-align:center;font-weight:bold;margin-bottom:10px;">Rincian Anggaran Pendapatan dan Belanja Unit Kerja</div>
                <table class="main">
                    <thead><tr><th>Kode Rekening</th><th>Uraian</th><th>Jumlah (Rp)</th></tr></thead>
                    <tbody>
                        <tr><td></td><td class="bold">JUMLAH PENDAPATAN</td><td class="num"></td></tr>
                        <tr><td>5</td><td class="bold">BELANJA</td><td class="num bold">${formatNum(aggs.belanja)}</td></tr>
                        <tr><td>5.1</td><td>BELANJA OPERASI</td><td class="num">${formatNum(aggs.operasi)}</td></tr>
                        <tr><td>5.1.02</td><td>BELANJA BARANG DAN JASA</td><td class="num">${formatNum(aggs.barangJasa)}</td></tr>
                        <tr><td>5.1.02.01</td><td style="padding-left:20px">BELANJA BARANG</td><td class="num">${formatNum(aggs.barang)}</td></tr>
                        <tr><td>5.1.02.02</td><td style="padding-left:20px">BELANJA JASA</td><td class="num">${formatNum(aggs.jasa)}</td></tr>
                        <tr><td>5.1.02.03</td><td style="padding-left:20px">BELANJA PEMELIHARAAN</td><td class="num">${formatNum(aggs.pemeliharaan)}</td></tr>
                        <tr><td>5.1.02.04</td><td style="padding-left:20px">BELANJA PERJALANAN DINAS</td><td class="num">${formatNum(aggs.perjalanan)}</td></tr>
                        <tr><td>5.2</td><td>BELANJA MODAL</td><td class="num">${formatNum(aggs.modal)}</td></tr>
                        <tr><td>5.2.02</td><td style="padding-left:20px">BELANJA MODAL PERALATAN DAN MESIN</td><td class="num">${formatNum(aggs.modalPeralatan)}</td></tr>
                        <tr><td>5.2.05</td><td style="padding-left:20px">BELANJA MODAL ASET TETAP LAINNYA</td><td class="num">${formatNum(aggs.modalAset)}</td></tr>
                        <tr><td></td><td class="bold">Jumlah BELANJA</td><td class="num bold">${formatNum(aggs.belanja)}</td></tr>
                    </tbody>
                </table>
                <div style="text-align:center;font-weight:bold;margin-bottom:10px;">Rencana Pelaksanaan Anggaran Unit Kerja per Triwulan</div>
                <table class="main">
                    <thead><tr><th>No</th><th>Uraian</th><th>TW I</th><th>TW II</th><th>TW III</th><th>TW IV</th><th>Jumlah</th></tr></thead>
                    <tbody>
                        <tr><td>1</td><td>Pendapatan</td><td class="num">${formatNum(totalQ[0])}</td><td class="num">${formatNum(totalQ[1])}</td><td class="num">${formatNum(totalQ[2])}</td><td class="num">${formatNum(totalQ[3])}</td><td class="num bold">${formatNum(aggs.belanja)}</td></tr>
                        <tr><td>2.1</td><td>Belanja Operasi</td><td class="num">${formatNum(aggs.q_operasi[0])}</td><td class="num">${formatNum(aggs.q_operasi[1])}</td><td class="num">${formatNum(aggs.q_operasi[2])}</td><td class="num">${formatNum(aggs.q_operasi[3])}</td><td class="num bold">${formatNum(aggs.operasi)}</td></tr>
                        <tr><td>2.2</td><td>Belanja Modal</td><td class="num">${formatNum(aggs.q_modal[0])}</td><td class="num">${formatNum(aggs.q_modal[1])}</td><td class="num">${formatNum(aggs.q_modal[2])}</td><td class="num">${formatNum(aggs.q_modal[3])}</td><td class="num bold">${formatNum(aggs.modal)}</td></tr>
                    </tbody>
                </table>
            </body>
            </html>
        `;

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
    return true;
  }

  // For non-Lembar formats, print DOM content directly (exact match to app view)
  const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${reportTitle} - ${fundSource} ${year}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: Arial, sans-serif; 
                    font-size: 9pt; 
                    padding: 10px; 
                    color: #000;
                    background: #fff;
                }
                
                /* Header section */
                .print-header {
                    text-align: center;
                    padding: 10px 0 15px 0;
                    border-bottom: 2px solid #8B7355;
                    margin-bottom: 10px;
                }
                .print-header h1 { font-size: 18pt; font-weight: bold; margin-bottom: 3px; }
                .print-header h2 { font-size: 14pt; font-weight: bold; color: #8B7355; margin-bottom: 5px; }
                .print-header p { font-size: 10pt; color: #333; }
                
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 5px 0;
                    font-size: 10pt;
                    margin-bottom: 10px;
                }
                
                /* Table Styles - exact Tailwind match */
                table { width: 100%; border-collapse: collapse; font-size: 8pt; }
                th, td { border: 1px solid #000; padding: 3px 5px; text-align: left; vertical-align: top; }
                th { background: #fff; font-weight: bold; text-align: center; }
                
                /* Tailwind color classes */
                .bg-red-50, tr.bg-red-50 td { background-color: #FEF2F2 !important; }
                .bg-red-100, tr.bg-red-100 td { background-color: #FEE2E2 !important; }
                .bg-green-50, tr.bg-green-50 td { background-color: #F0FDF4 !important; }
                .bg-green-100, tr.bg-green-100 td { background-color: #DCFCE7 !important; }
                .bg-slate-100, tr.bg-slate-100 td { background-color: #F1F5F9 !important; }
                .bg-slate-200, tr.bg-slate-200 td { background-color: #E2E8F0 !important; }
                
                .text-right { text-align: right !important; }
                .text-center { text-align: center !important; }
                .font-bold { font-weight: bold !important; }
                .pl-4 { padding-left: 16px !important; }
                
                @media print {
                    body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    @page { margin: 0.5cm; size: ${paperSize}; }
                    thead { display: table-header-group; }
                    tr { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h1>${titleText}</h1>
                <h2>${schoolName} (NPSN: ${npsn})</h2>
                <p>${alamat}</p>
            </div>
            <div class="info-row">
                <span><strong>Sumber Dana:</strong> ${fundSource}</span>
                <span><strong>Tahun Anggaran:</strong> ${year}</span>
            </div>
            ${tableContent}
        </body>
        </html>
    `;

  const printWindow = window.open('', '_blank', 'width=1400,height=900');
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
  return true;
}
