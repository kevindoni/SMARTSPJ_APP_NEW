import ExcelJS from 'exceljs';

/**
 * Export Generic Tables to Excel (Bunga, Pajak, Fund Sources)
 */
export const exportTableToExcel = async (
  type,
  data,
  signatoryData,
  schoolInfo,
  year,
  activeTabLabel
) => {
  if (!data) return;

  const workbook = new ExcelJS.Workbook();
  // Clean sheet name (max 31 chars)
  const sheetName = (activeTabLabel || 'Export').replace(/[\\/?*[\]]/g, '').substring(0, 30);
  const sheet = workbook.addWorksheet(sheetName);

  // Default properties
  sheet.properties.defaultRowHeight = 15;

  // Header Style
  const addHeaderRow = (text, size = 11, bold = false) => {
    sheet.mergeCells(`A${r}:E${r}`); // Merge wider for safety
    const cell = sheet.getCell(`A${r}`);
    cell.value = text;
    cell.alignment = { horizontal: 'center' };
    cell.font = { name: 'Times New Roman', size, bold };
    r++;
  };

  let r = 1;

  // Common Header
  addHeaderRow(signatoryData.header1 || '', 12, true);
  addHeaderRow(signatoryData.header2 || '', 12, true);
  addHeaderRow(signatoryData.headerAlamat || '', 9);
  r++;

  addHeaderRow(`REKAPITULASI ${activeTabLabel.toUpperCase()}`, 11, true);
  addHeaderRow(schoolInfo.nama || 'SEKOLAH', 11, true);
  addHeaderRow(`TAHUN ANGGARAN ${year}`, 11, true);
  r++;

  const borderAll = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };
  const fontBold = { name: 'Times New Roman', bold: true };
  const fontNormal = { name: 'Times New Roman' };

  // --- TYPE SWITCH ---
  if (type === 'rekap-bunga') {
    const { rows } = data;

    // Columns: No, Uraian, Bunga Bank, Biaya Adm, Saldo
    sheet.columns = [{ width: 5 }, { width: 35 }, { width: 18 }, { width: 18 }, { width: 18 }];

    // Table Header
    const headers = ['NO', 'URAIAN', 'BUNGA BANK', 'BIAYA ADM', 'SALDO'];
    headers.forEach((h, i) => {
      const cell = sheet.getCell(r, i + 1);
      cell.value = h;
      cell.font = fontBold;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = borderAll;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6FA' } }; // Light Gray
    });
    r++;

    // Rows
    rows.forEach((row) => {
      const isSummary = row.isSummary;
      const style = isSummary ? fontBold : fontNormal;
      const fill = isSummary
        ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF0F5' } }
        : null;

      sheet.getCell(r, 1).value = isSummary ? '' : row.month || '';
      sheet.getCell(r, 2).value = row.monthName || row.label;

      [row.values.bunga, row.values.adm, row.values.saldo].forEach((val, i) => {
        const cell = sheet.getCell(r, i + 3);
        cell.value = val;
        cell.numFmt = '#,##0';
      });

      // Styling
      for (let c = 1; c <= 5; c++) {
        const cell = sheet.getCell(r, c);
        cell.border = borderAll;
        cell.font = style;
        if (fill) cell.fill = fill;
      }
      r++;
    });
  } else if (type === 'rekap-pajak') {
    const { rows } = data;
    // Complex Header
    // 1: NO
    // 2: BULAN
    // 3: SALDO AWAL
    // 4-9: PENERIMAAN (PPN, PPh21, PPh22, PPh23, PjDaerah, Total)
    // 10-15: PENGELUARAN (PPN, PPh21, PPh22, PPh23, PjDaerah, Total)
    // 16: SALDO AKHIR

    sheet.mergeCells(`A${r}:A${r + 1}`);
    sheet.getCell(`A${r}`).value = 'NO';
    sheet.mergeCells(`B${r}:B${r + 1}`);
    sheet.getCell(`B${r}`).value = 'URAIAN';
    sheet.mergeCells(`C${r}:C${r + 1}`);
    sheet.getCell(`C${r}`).value = 'SALDO AWAL';

    sheet.mergeCells(`D${r}:I${r}`);
    sheet.getCell(`D${r}`).value = 'PENERIMAAN (PUNGUT)';
    sheet.mergeCells(`J${r}:O${r}`);
    sheet.getCell(`J${r}`).value = 'PENGELUARAN (SETOR)';

    sheet.mergeCells(`P${r}:P${r + 1}`);
    sheet.getCell(`P${r}`).value = 'SALDO AKHIR';

    // Styling Header Row 1
    for (let c = 1; c <= 16; c++) {
      const cell = sheet.getCell(r, c);
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.font = fontBold;
      cell.border = borderAll;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCCCCC' } };
    }
    r++;

    // Header Row 2
    const subHeaders = [
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
    ];
    subHeaders.forEach((h, i) => {
      const cell = sheet.getCell(r, i + 4);
      cell.value = h;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.font = fontBold;
      cell.border = borderAll;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6E6' } };
    });
    r++;

    // Rows
    rows.forEach((row) => {
      const isSummary = row.isSummary;
      const style = isSummary ? fontBold : fontNormal;
      const fill = isSummary
        ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF0F5' } }
        : null;
      const v = row.values;

      sheet.getCell(r, 1).value = isSummary ? '' : row.month || '';
      sheet.getCell(r, 2).value = row.monthName || row.label;
      sheet.getCell(r, 3).value = v.saldoAwal;

      // Pungut
      sheet.getCell(r, 4).value = v.pungut.ppn;
      sheet.getCell(r, 5).value = v.pungut.pph21;
      sheet.getCell(r, 6).value = v.pungut.pph22;
      sheet.getCell(r, 7).value = v.pungut.pph23;
      sheet.getCell(r, 8).value = v.pungut.pajakDaerah;
      sheet.getCell(r, 9).value = v.totalPungut;

      // Setor
      sheet.getCell(r, 10).value = v.setor.ppn;
      sheet.getCell(r, 11).value = v.setor.pph21;
      sheet.getCell(r, 12).value = v.setor.pph22;
      sheet.getCell(r, 13).value = v.setor.pph23;
      sheet.getCell(r, 14).value = v.setor.pajakDaerah;
      sheet.getCell(r, 15).value = v.totalSetor;

      sheet.getCell(r, 16).value = v.saldoAkhir;

      // Apply formatting
      for (let c = 1; c <= 16; c++) {
        const cell = sheet.getCell(r, c);
        cell.border = borderAll;
        cell.font = style;
        if (c > 2) cell.numFmt = '#,##0';
        if (fill) cell.fill = fill;
      }
      r++;
    });

    // Set Widths
    sheet.getColumn(2).width = 25;
    for (let c = 3; c <= 16; c++) sheet.getColumn(c).width = 15;
  } else if (type === 'smart-table') {
    const { rows, columns } = data;

    // --- Helper to process columns ---
    // Flattens columns for data row rendering and calculates header structure
    const flattenColumns = (cols) => {
      let flat = [];
      cols.forEach((col) => {
        if (col.subColumns) {
          flat = [...flat, ...flattenColumns(col.subColumns)];
        } else {
          flat.push(col);
        }
      });
      return flat;
    };

    const leafColumns = flattenColumns(columns);

    // --- HEADER GENERATION (3 Levels) ---
    // Level 1
    let c = 1;
    columns.forEach((col) => {
      const cell = sheet.getCell(r, c);
      cell.value = col.label;
      const width = col.width ? parseInt(col.width) / 7 : col.id === 'bulan' ? 20 : 12; // approx px to char width
      sheet.getColumn(c).width = width;

      // Merging
      const colSpan = col.colSpan || 1;
      const rowSpan = col.subColumns ? 1 : col.rowSpan || 1;

      if (colSpan > 1 || rowSpan > 1) {
        sheet.mergeCells(r, c, r + rowSpan - 1, c + colSpan - 1);
      }

      // Styling
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.font = { name: 'Times New Roman', bold: true, color: { argb: 'FFFFFFFF' } }; // White text
      cell.border = borderAll;

      // Color Map
      let argb = 'FF334155'; // Slate-700 default
      if (col.color === 'blue') argb = 'FF1D4ED8';
      else if (col.color === 'orange') argb = 'FFC2410C';
      else if (col.color === 'emerald') argb = 'FF047857';
      else if (col.color === 'slate') argb = 'FF334155';

      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };

      c += colSpan;
    });
    r++;

    // Level 2 (Assume max 3 levels for now as per config)
    c = 1;
    let hasLevel2 = false;
    columns.forEach((parent) => {
      if (parent.subColumns) {
        hasLevel2 = true;
        parent.subColumns.forEach((sub) => {
          const cell = sheet.getCell(r, c);
          cell.value = sub.label;

          const colSpan = sub.colSpan || 1;
          const rowSpan = sub.subColumns ? 1 : sub.rowSpan || 1;

          if (colSpan > 1 || rowSpan > 1) {
            sheet.mergeCells(r, c, r + rowSpan - 1, c + colSpan - 1);
          }

          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { name: 'Times New Roman', bold: true, color: { argb: 'FFFFFFFF' } };
          cell.border = borderAll;

          // Parent color inheritance
          let argb = 'FF475569'; // Slate-600
          if (parent.color === 'blue') argb = 'FF2563EB';
          else if (parent.color === 'orange') argb = 'FFEA580C';
          else if (parent.color === 'emerald') argb = 'FF059669';

          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };

          c += colSpan;
        });
      } else {
        c += parent.colSpan || 1;
      }
    });
    if (hasLevel2) r++;

    // Level 3
    c = 1;
    let hasLevel3 = false;
    columns.forEach((parent) => {
      if (parent.subColumns) {
        parent.subColumns.forEach((sub) => {
          if (sub.subColumns) {
            hasLevel3 = true;
            sub.subColumns.forEach((leaf) => {
              const cell = sheet.getCell(r, c);
              cell.value = leaf.label;
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
              cell.font = { name: 'Times New Roman', bold: true, color: { argb: 'FFFFFFFF' } };
              cell.border = borderAll;

              let argb = 'FF475569';
              if (parent.color === 'blue') argb = 'FF2563EB';
              else if (parent.color === 'orange') argb = 'FFEA580C';
              else if (parent.color === 'emerald') argb = 'FF059669';

              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };

              c++;
            });
          } else {
            c += sub.colSpan || 1;
          }
        });
      } else {
        c += parent.colSpan || 1;
      }
    });
    if (hasLevel3) r++;

    // --- ROWS ---
    rows.forEach((row) => {
      const isSummary = ['quarter', 'semester', 'annual'].includes(row.type);
      const isAnnual = row.type === 'annual';

      // Row Background
      let fill = null;
      if (isAnnual)
        fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Slate 800
      else if (row.type === 'quarter')
        fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE68A' } }; // Amber 200
      else if (row.type === 'semester')
        fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC7D2FE' } }; // Indigo 200

      // Font Style
      const font = {
        name: 'Times New Roman',
        bold: isSummary,
        color: { argb: isAnnual ? 'FFFFFFFF' : 'FF000000' },
      };

      leafColumns.forEach((col, i) => {
        const cell = sheet.getCell(r, i + 1);

        // Get Value
        let val;
        if (typeof col.accessor === 'function') {
          val = col.accessor(row);
        } else if (typeof col.accessor === 'string') {
          // unexpected dot notation manual handling if generic helper not available
          val = col.accessor
            .split('.')
            .reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : 0), row);
        }

        cell.value = val;
        if (col.format === 'currency') {
          cell.numFmt = '#,##0';
        }

        cell.border = borderAll;
        cell.font = font;
        if (fill) cell.fill = fill;
      });
      r++;
    });
  }
  else if (type === 'fund-source') {
    // ─── DINAS Format: Fund Source Table Export ──────────────────────
    const { columns, rows } = data;
    const isSC = (c) => c.isSummaryColumn;

    // Compute group header spans (summary cols merge into preceding group)
    const groupSpans = (() => {
      const res = []; let cur = null, sp = 0;
      columns.forEach((col) => {
        if (isSC(col)) { sp++; }
        else if (col.group !== cur) {
          if (cur !== null) res.push({ group: cur, span: sp });
          cur = col.group; sp = 1;
        } else { sp++; }
      });
      if (cur !== null) res.push({ group: cur, span: sp });
      return res;
    })();

    // DINAS Color Scheme (ARGB)
    const HG = 'FFC5E0B3', PG = 'FFE2EFD9', TY = 'FFFFFF00';
    const TB = 'FF00B0F0', SV = 'FFC7D2FE', SG = 'FFDCFFDC';
    const GC = { BARANG_JASA: 'FF1E40AF', MODAL_MESIN: 'FFC2410C', MODAL_LAINNYA: 'FF7C3AED' };
    const GL = {
      BARANG_JASA: 'BARANG & JASA (5.1.02)',
      MODAL_MESIN: 'MODAL ALAT & MESIN (5.2.02+5.2.04)',
      MODAL_LAINNYA: 'MODAL ASET LAINNYA (5.2.05)',
    };
    const FC = 3; // NO, BULAN, ANGGARAN

    // Column widths
    sheet.getColumn(1).width = 5;
    sheet.getColumn(2).width = 22;
    sheet.getColumn(3).width = 16;
    columns.forEach((col, i) => {
      sheet.getColumn(FC + i + 1).width = isSC(col) ? 14 : 10;
    });

    // ─── HEADER ROW 0: Group Headers ────────────────────────────────
    ['NO', 'BULAN', 'ANGGARAN'].forEach((lb, i) => {
      const cell = sheet.getCell(r, i + 1);
      cell.value = lb;
      cell.font = fontBold;
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = borderAll;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HG } };
    });
    sheet.mergeCells(r, 1, r + 4, 1);
    sheet.mergeCells(r, 2, r + 4, 2);
    sheet.mergeCells(r, 3, r + 4, 3);

    let co = FC;
    groupSpans.forEach((gs) => {
      const s = co + 1, e = co + gs.span;
      if (e > s) sheet.mergeCells(r, s, r, e);
      const cell = sheet.getCell(r, s);
      cell.value = GL[gs.group] || gs.group;
      cell.font = { name: 'Times New Roman', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GC[gs.group] || 'FF334155' } };
      for (let x = s; x <= e; x++) sheet.getCell(r, x).border = borderAll;
      co = e;
    });
    r++;

    // ─── HEADER ROW 1: Column Numbers / Summary Names ──────────────
    co = FC;
    columns.forEach((col) => {
      const cell = sheet.getCell(r, co + 1);
      if (isSC(col)) {
        cell.value = col.nama_rekening;
        cell.font = { name: 'Times New Roman', bold: true, size: 7 };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SG } };
      } else {
        cell.value = col.displayIdx || '';
        cell.font = { name: 'Times New Roman', bold: true, size: 8 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HG } };
      }
      cell.border = borderAll;
      co++;
    });
    sheet.getRow(r).height = 30;
    r++;

    // ─── HEADER ROW 2: Kode Rekening ───────────────────────────────
    co = FC;
    columns.forEach((col) => {
      const cell = sheet.getCell(r, co + 1);
      cell.value = isSC(col) ? '' : col.kode_rekening;
      cell.font = { name: 'Times New Roman', size: 7 };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = borderAll;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isSC(col) ? SG : HG } };
      co++;
    });
    r++;

    // ─── HEADER ROW 3: Nama Rekening ───────────────────────────────
    co = FC;
    columns.forEach((col) => {
      const cell = sheet.getCell(r, co + 1);
      cell.value = isSC(col) ? '' : col.nama_rekening;
      cell.font = { name: 'Times New Roman', size: 6 };
      cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      cell.border = borderAll;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isSC(col) ? SG : HG } };
      co++;
    });
    sheet.getRow(r).height = 40;
    r++;

    // ─── HEADER ROW 4: Pagu Anggaran ───────────────────────────────
    co = FC;
    columns.forEach((col) => {
      const cell = sheet.getCell(r, co + 1);
      cell.value = col.total_anggaran || 0;
      cell.numFmt = '#,##0';
      cell.font = { name: 'Times New Roman', bold: true, size: 8 };
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      cell.border = borderAll;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isSC(col) ? SG : PG } };
      co++;
    });
    r++;

    // ─── DATA ROWS ─────────────────────────────────────────────────
    rows.forEach((row) => {
      const lb = row.label || '';
      const isM = !row.isSummary;
      const isTW = lb.includes('TRIWULAN');
      const isSM = lb.includes('SEMESTER');
      const isAN = lb.includes('JUMLAH');

      let fillS = null, fontC = 'FF000000';
      if (isAN) {
        fillS = { type: 'pattern', pattern: 'solid', fgColor: { argb: TB } };
        fontC = 'FFFFFFFF';
      } else if (isTW) {
        fillS = { type: 'pattern', pattern: 'solid', fgColor: { argb: TY } };
      } else if (isSM) {
        fillS = { type: 'pattern', pattern: 'solid', fgColor: { argb: SV } };
      }
      const rowFont = { name: 'Times New Roman', bold: !isM, size: 8, color: { argb: fontC } };

      // NO
      const nc = sheet.getCell(r, 1);
      nc.value = isM ? row.month : '';
      nc.font = rowFont;
      nc.alignment = { horizontal: 'center' };
      nc.border = borderAll;
      if (fillS) nc.fill = fillS;

      // BULAN
      const bc = sheet.getCell(r, 2);
      bc.value = row.monthName || row.label;
      bc.font = rowFont;
      bc.alignment = { horizontal: 'left' };
      bc.border = borderAll;
      if (fillS) bc.fill = fillS;

      // ANGGARAN
      const ac = sheet.getCell(r, 3);
      ac.value = isM ? '' : (row.total || 0);
      if (!isM) ac.numFmt = '#,##0';
      ac.font = rowFont;
      ac.alignment = { horizontal: 'right' };
      ac.border = borderAll;
      if (fillS) ac.fill = fillS;

      // Data columns
      co = FC;
      columns.forEach((col) => {
        const cell = sheet.getCell(r, co + 1);
        cell.value = (row.values && row.values[col.kode_rekening]) || 0;
        cell.numFmt = '#,##0';
        cell.font = rowFont;
        cell.alignment = { horizontal: 'right' };
        cell.border = borderAll;
        if (fillS) {
          cell.fill = fillS;
        } else if (isSC(col) && isM) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SG } };
        }
        co++;
      });
      r++;
    });
  }
  // DOWNLOAD
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Rekap_${activeTabLabel}_${year}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);

  return true;
};
