import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatRupiah } from './reconciliationHelpers';

/**
 * Export Generic Tables to PDF (Bunga, Pajak, Fund Sources)
 */
export const exportTableToPdf = (type, data, signatoryData, schoolInfo, year, activeTabLabel) => {
  if (!data) return;

  // Determine Orientation
  // Pajak & some Fund Sources might need Landscape
  let isLandscape = type === 'rekap-pajak' || type === 'fund-source';

  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [215, 330], // F4
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 10;

  let cursorY = 15;

  // --- HEADER ---
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.text(signatoryData.header1 || '', pageWidth / 2, cursorY, { align: 'center' });
  doc.text(signatoryData.header2 || '', pageWidth / 2, cursorY + 6, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('times', 'normal');
  doc.text(signatoryData.headerAlamat || '', pageWidth / 2, cursorY + 11, { align: 'center' });

  cursorY += 15;
  doc.setLineWidth(0.5);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  doc.setLineWidth(0.2);
  doc.line(margin, cursorY + 1, pageWidth - margin, cursorY + 1);

  cursorY += 8;

  // TITLE
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.text(`REKAPITULASI ${activeTabLabel.toUpperCase()}`, pageWidth / 2, cursorY, {
    align: 'center',
  });
  doc.text(schoolInfo.nama || 'SEKOLAH', pageWidth / 2, cursorY + 5, { align: 'center' });
  doc.text(`TAHUN ANGGARAN ${year}`, pageWidth / 2, cursorY + 10, { align: 'center' });

  cursorY += 15;

  // --- TABLE DATA PREP ---
  let head = [];
  let body = [];
  let colStyles = {};

  if (type === 'rekap-bunga') {
    head = [['NO', 'URAIAN', 'BUNGA BANK', 'BIAYA ADM', 'SALDO']];
    body = data.rows.map((row) => [
      row.isSummary ? '' : row.month || '',
      row.monthName || row.label,
      formatRupiah(row.values.bunga),
      formatRupiah(row.values.adm),
      formatRupiah(row.values.saldo),
    ]);
    colStyles = {
      0: { halign: 'center', cellWidth: 15 },
      1: { cellWidth: 'auto' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
    };
  } else if (type === 'rekap-pajak') {
    // Complex Head
    head = [
      [
        { content: 'NO', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'URAIAN', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        { content: 'SALDO AWAL', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
        {
          content: 'PENERIMAAN (PUNGUT)',
          colSpan: 6,
          styles: { halign: 'center', fillColor: [200, 200, 255] },
        },
        {
          content: 'PENGELUARAN (SETOR)',
          colSpan: 6,
          styles: { halign: 'center', fillColor: [255, 200, 200] },
        },
        { content: 'SALDO AKHIR', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      ],
      [
        'PPN',
        'PPh21',
        'PPh22',
        'PPh23',
        'Lainnya',
        'JUMLAH',
        'PPN',
        'PPh21',
        'PPh22',
        'PPh23',
        'Lainnya',
        'JUMLAH',
      ],
    ];

    body = data.rows.map((row) => [
      row.isSummary ? '' : row.month || '',
      row.monthName || row.label,
      formatRupiah(row.values.saldoAwal),
      // Pungut
      formatRupiah(row.values.pungut.ppn),
      formatRupiah(row.values.pungut.pph21),
      formatRupiah(row.values.pungut.pph22),
      formatRupiah(row.values.pungut.pph23),
      formatRupiah(row.values.pungut.pajakDaerah),
      formatRupiah(row.values.totalPungut),
      // Setor
      formatRupiah(row.values.setor.ppn),
      formatRupiah(row.values.setor.pph21),
      formatRupiah(row.values.setor.pph22),
      formatRupiah(row.values.setor.pph23),
      formatRupiah(row.values.setor.pajakDaerah),
      formatRupiah(row.values.totalSetor),
      formatRupiah(row.values.saldoAkhir),
    ]);
  } else if (type === 'smart-table') {
    const { rows, columns } = data;
    isLandscape = true; // Force landscape

    // Flatten columns for body
    const flattenColumns = (cols) => {
      let flat = [];
      cols.forEach((col) => {
        if (col.subColumns) flat = [...flat, ...flattenColumns(col.subColumns)];
        else flat.push(col);
      });
      return flat;
    };
    const leafColumns = flattenColumns(columns);

    // HEAD Construction for AutoTable (Array of Arrays)
    // Row 1
    const headRow1 = columns.map((col) => ({
      content: col.label,
      rowSpan: col.subColumns ? 1 : col.rowSpan || 1,
      colSpan: col.colSpan || 1,
      styles: {
        halign: 'center',
        valign: 'middle',
        fillColor:
          col.color === 'blue'
            ? [29, 78, 216]
            : col.color === 'orange'
              ? [194, 65, 12]
              : col.color === 'emerald'
                ? [4, 120, 87]
                : [51, 65, 85],
        textColor: [255, 255, 255],
      },
    }));

    // Row 2
    let headRow2 = [];
    columns.forEach((col) => {
      if (col.subColumns) {
        col.subColumns.forEach((sub) => {
          headRow2.push({
            content: sub.label,
            rowSpan: sub.subColumns ? 1 : sub.rowSpan || 1,
            colSpan: sub.colSpan || 1,
            styles: {
              halign: 'center',
              valign: 'middle',
              fillColor:
                col.color === 'blue'
                  ? [37, 99, 235]
                  : col.color === 'orange'
                    ? [234, 88, 12]
                    : col.color === 'emerald'
                      ? [5, 150, 105]
                      : [71, 85, 105],
              textColor: [255, 255, 255],
            },
          });
        });
      }
    });

    // Row 3
    let headRow3 = [];
    columns.forEach((col) => {
      if (col.subColumns) {
        col.subColumns.forEach((sub) => {
          if (sub.subColumns) {
            sub.subColumns.forEach((leaf) => {
              headRow3.push({
                content: leaf.label,
                styles: {
                  halign: 'center',
                  valign: 'middle',
                  fillColor:
                    col.color === 'blue'
                      ? [37, 99, 235]
                      : col.color === 'orange'
                        ? [234, 88, 12]
                        : col.color === 'emerald'
                          ? [5, 150, 105]
                          : [71, 85, 105],
                  textColor: [255, 255, 255],
                },
              });
            });
          }
        });
      }
    });

    head = [headRow1];
    if (headRow2.length > 0) head.push(headRow2);
    if (headRow3.length > 0) head.push(headRow3);

    // BODY Construction
    body = rows.map((row) => {
      return leafColumns.map((col) => {
        let val;
        if (typeof col.accessor === 'function') {
          val = col.accessor(row);
        } else if (typeof col.accessor === 'string') {
          val = col.accessor
            .split('.')
            .reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : 0), row);
        }
        return col.format === 'currency' ? formatRupiah(val) : val;
      });
    });

    // Col Styles
    leafColumns.forEach((col, i) => {
      if (i === 0)
        colStyles[i] = { halign: 'center', cellWidth: 8 }; // No
      else if (i === 1)
        colStyles[i] = { halign: 'left', cellWidth: 25 }; // Bulan
      else colStyles[i] = { halign: 'right', cellWidth: 'auto' };
    });
  } else if (type === 'fund-source') {
    const { columns, rows } = data;
    const isSC = (c) => c.isSummaryColumn;

    // Build header: NO | BULAN | ANGGARAN | ...kode_rekening columns
    // Row 1: Column numbers / summary names
    const headerRow1 = ['NO', 'BULAN', 'ANGGARAN'];
    const headerRow2 = ['', '', ''];
    columns.forEach((col) => {
      if (isSC(col)) {
        headerRow1.push(col.nama_rekening);
        headerRow2.push('');
      } else {
        headerRow1.push(String(col.displayIdx || ''));
        headerRow2.push(col.kode_rekening);
      }
    });
    head = [headerRow1, headerRow2];

    // Build body
    body = rows.map((row) => {
      const lb = row.label || '';
      const isM = !row.isSummary;
      const arr = [
        isM ? String(row.month || '') : '',
        row.monthName || row.label,
        isM ? '' : formatRupiah(row.total || 0),
      ];
      columns.forEach((col) => {
        const val = (row.values && row.values[col.kode_rekening]) || 0;
        arr.push(formatRupiah(val));
      });
      return arr;
    });

    // Column styles
    colStyles[0] = { halign: 'center', cellWidth: 8 };
    colStyles[1] = { halign: 'left', cellWidth: 22 };
    colStyles[2] = { halign: 'right', cellWidth: 18 };
    columns.forEach((col, i) => {
      colStyles[3 + i] = { halign: 'right', cellWidth: isSC(col) ? 18 : 'auto' };
    });
  }

  // GENERATE TABLE
  autoTable(doc, {
    startY: cursorY,
    head: head,
    body: body,
    theme: 'grid',
    styles: {
      font: 'times',
      fontSize: type === 'rekap-pajak' ? 6 : 8, // Smaller font for big tables
      cellPadding: 1,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      valign: 'middle',
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [220, 220, 220],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    columnStyles: colStyles,
    margin: { left: margin, right: margin },
    didParseCell: (data) => {
      // Apply highlighting logic similar to Excel
      if (data.section === 'body') {
        // Row data available via data.row.raw if needed
        // Since row.raw is an array of values, we check the label column (usually index 1)
        // BUT wait, jspdf autotable raw is the array we pushed.
        // We need to know if it is a summary row.
        // In ExcelJS we iterate source data. Here we rely on content or pre-processing.
        // Let's rely on string content for now: "JUMLAH", "TRIWULAN", "SEMESTER"
        const labelCell = data.row.raw[1]; // Usually label
        if (data.row.index > -1 && typeof labelCell === 'string') {
          if (labelCell.includes('JUMLAH')) {
            data.cell.styles.fillColor = [220, 255, 220]; // Greenish or Beige
            data.cell.styles.fontStyle = 'bold';
          } else if (labelCell.includes('TRIWULAN')) {
            data.cell.styles.fillColor = [255, 250, 240];
          }
        }
      }
    },
  });

  // FOOTER (Signatures) - Simplified
  const finalY = doc.lastAutoTable.finalY + 10;
  if (pageHeight - finalY < 50) doc.addPage();

  doc.setFontSize(9);
  doc.text(
    `${signatoryData?.kabupaten || schoolInfo?.kabupaten || ''}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
    pageWidth - margin - 40,
    finalY
  );

  doc.text('Mengetahui,', margin + 20, finalY + 10);
  doc.text('Kepala Sekolah', margin + 20, finalY + 15);
  doc.text('Bendahara', pageWidth - margin - 50, finalY + 15);

  doc.text(`(${schoolInfo.kepala_sekolah || '.......................'})`, margin + 20, finalY + 35);
  doc.text(
    `(${schoolInfo.bendahara || '.......................'})`,
    pageWidth - margin - 50,
    finalY + 35
  );

  doc.save(`Rekap_${activeTabLabel}_${year}.pdf`);
};
