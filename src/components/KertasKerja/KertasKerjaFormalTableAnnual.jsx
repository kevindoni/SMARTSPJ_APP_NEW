import React from 'react';
import { formatRupiah } from '../../utils/transactionHelpers';
import { STANDARDS_MAP, SOURCE_COLUMNS } from '../../utils/kertasKerjaHelpers';

export default function KertasKerjaFormalTableAnnual({
  processedData,
  year: _year,
  fundSource,
  reportTitle,
  schoolInfo,
}) {
  // 1. Group Data Logic (Same as Monthly)
  const grouped = {};

  // Total Aggregators
  const grandTotals = {}; // { 'BOSP REGULER-OPS': 0, 'BOSP REGULER-MOD': 0, ... }
  let totalAll = 0;

  processedData.forEach((item) => {
    const parts = (item.kode_kegiatan || '').split('.');
    const codeL1 = parts[0] || 'XX';
    const codeL2 = parts[1] ? `${parts[0]}.${parts[1]}` : `${codeL1}.XX`;
    const codeL3 = item.kode_kegiatan;

    if (!grouped[codeL1])
      grouped[codeL1] = { name: STANDARDS_MAP[codeL1] || `Standar ${codeL1}`, l2: {} };
    if (!grouped[codeL1].l2[codeL2]) grouped[codeL1].l2[codeL2] = { name: '', l3: {} };
    if (!grouped[codeL1].l2[codeL2].l3[codeL3])
      grouped[codeL1].l2[codeL2].l3[codeL3] = { name: item.nama_kegiatan, items: [] };

    // Enrich Item with Annual Flags
    const isModal = (item.kode_rekening || '').startsWith('5.2');
    const typeKey = isModal ? 'MOD' : 'OPS';

    let sourceKey = 'LAINNYA';
    const src = (item.sumber_dana || fundSource || '').toUpperCase();
    if (src.includes('REGULER')) sourceKey = 'BOSP REGULER';
    else if (src.includes('DAERAH')) sourceKey = 'BOSP DAERAH';
    else if (src.includes('AFIRMASI') || src.includes('KINERJA')) sourceKey = 'AFIRMASI';
    else if (src.includes('SILPA')) sourceKey = 'SILPA';

    const enrichedItem = { ...item, annualType: typeKey, annualSource: sourceKey };

    grouped[codeL1].l2[codeL2].l3[codeL3].items.push(enrichedItem);

    // Add to Grand Totals
    const grandKey = `${sourceKey}-${typeKey}`;
    grandTotals[grandKey] = (grandTotals[grandKey] || 0) + item.total;
    totalAll += (item.total || 0);
  });

  // Helper to calculate row columns
  const calculateRowColumns = (items) => {
    const cols = {}; // { 'BOSP REGULER-OPS': 1000, ... }
    items.forEach((item) => {
      const k = `${item.annualSource}-${item.annualType}`;
      cols[k] = (cols[k] || 0) + item.total;
    });
    return cols;
  };

  // Helper to render the 10 columns (5 Sources x 2 Types)
  const renderDataColumns = (columnData, isHeader = false) => {
    return SOURCE_COLUMNS.flatMap((src) => {
      const valOps = columnData[`${src.key}-OPS`] || 0;
      const valMod = columnData[`${src.key}-MOD`] || 0;
      return [
        <td
          key={`${src.key}-OPS`}
          className="border border-black px-1 py-1 text-right whitespace-nowrap"
        >
          {valOps > 0 ? formatRupiah(valOps) : isHeader ? formatRupiah(0) : '0'}
        </td>,
        <td
          key={`${src.key}-MOD`}
          className="border border-black px-1 py-1 text-right whitespace-nowrap"
        >
          {valMod > 0 ? formatRupiah(valMod) : isHeader ? formatRupiah(0) : '0'}
        </td>,
      ];
    });
  };

  // Calculate Recursive Totals
  const getGroupTotal = (groupLevel, level) => {
    if (level === 1) {
      // L1
      const allItems = Object.values(groupLevel.l2).flatMap((l2) =>
        Object.values(l2.l3).flatMap((l3) => l3.items)
      );
      return {
        total: allItems.reduce((s, i) => s + i.total, 0),
        cols: calculateRowColumns(allItems),
      };
    }
    if (level === 2) {
      // L2
      const allItems = Object.values(groupLevel.l3).flatMap((l3) => l3.items);
      return {
        total: allItems.reduce((s, i) => s + i.total, 0),
        cols: calculateRowColumns(allItems),
      };
    }
    if (level === 3) {
      // L3
      return {
        total: groupLevel.items.reduce((s, i) => s + i.total, 0),
        cols: calculateRowColumns(groupLevel.items),
      };
    }
  };

  let noUrut = 1;
  const npsn = schoolInfo?.npsn || '-';
  const sekolah = schoolInfo?.nama || '-';

  return (
    <div className="bg-white p-6 rounded-none shadow-none text-black text-xs overflow-x-auto">
      {/* HEADERS */}
      <div className="mb-4">
        <h3 className="font-bold text-sm uppercase mb-2">A. PENERIMAAN</h3>
        <h4 className="font-bold mb-2">Sumber Dana : {fundSource}</h4>
        <table className="w-full border-collapse border border-black mb-6 max-w-xl">
          <thead>
            <tr>
              <th className="border border-black px-2 py-1 bg-white text-left w-24">No. Kode</th>
              <th className="border border-black px-2 py-1 bg-white text-center">Penerimaan</th>
              <th className="border border-black px-2 py-1 bg-white text-center w-32">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black px-2 py-1 text-center">4.3.1.01.</td>
              <td className="border border-black px-2 py-1">{fundSource}</td>
              <td className="border border-black px-2 py-1 text-right font-bold">
                {formatRupiah(totalAll)}
              </td>
            </tr>
            <tr className="font-bold bg-slate-100">
              <td className="border border-black px-2 py-1" colSpan="2">
                Total Penerimaan
              </td>
              <td className="border border-black px-2 py-1 text-right">{formatRupiah(totalAll)}</td>
            </tr>
          </tbody>
        </table>

        <h3 className="font-bold text-sm uppercase mb-2">B. BELANJA</h3>
        <table className="min-w-full border-collapse border border-black">
          <thead className="text-center font-bold bg-white">
            <tr>
              <th className="border border-black px-1 py-2 w-8" rowSpan="3">
                No.
                <br />
                Urut
              </th>
              <th className="border border-black px-1 py-2 w-20" rowSpan="3">
                Kode Rekening
              </th>
              <th className="border border-black px-1 py-2 w-20" rowSpan="3">
                Kode Program
              </th>
              <th className="border border-black px-1 py-2 min-w-[200px]" rowSpan="3">
                Uraian Kegiatan
              </th>
              <th className="border border-black px-1 py-2 w-24" rowSpan="3">
                Jumlah
              </th>
              <th className="border border-black px-1 py-1" colSpan={10}>
                Sumber Dana dan Alokasi Anggaran
              </th>
            </tr>
            <tr>
              {SOURCE_COLUMNS.map((col) => (
                <th key={col.key} className="border border-black px-1 py-1" colSpan="2">
                  {col.label}
                </th>
              ))}
            </tr>
            <tr>
              {SOURCE_COLUMNS.map((col) => (
                <React.Fragment key={col.key}>
                  <th className="border border-black px-1 py-1 text-[10px]">Belanja Operasi</th>
                  <th className="border border-black px-1 py-1 text-[10px]">Belanja Modal</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* GRAND TOTAL ROW */}
            <tr className="bg-red-100 font-bold">
              <td className="border border-black px-1 py-1" colSpan="4">
                TOTAL BELANJA
              </td>
              <td className="border border-black px-1 py-1 text-right">{formatRupiah(totalAll)}</td>
              {renderDataColumns(grandTotals, true)}
            </tr>

            {Object.keys(grouped)
              .sort()
              .map((l1Code) => {
                const l1 = grouped[l1Code];
                const { total: t1, cols: c1 } = getGroupTotal(l1, 1);

                return (
                  <React.Fragment key={l1Code}>
                    {/* LEVEL 1 ROW (Pink) */}
                    <tr className="bg-red-50 font-bold">
                      <td className="border border-black px-1 py-1 text-center">{noUrut++}.</td>
                      <td className="border border-black px-1 py-1"></td>
                      <td className="border border-black px-1 py-1">{l1Code}.</td>
                      <td className="border border-black px-1 py-1">{l1.name}</td>
                      <td className="border border-black px-1 py-1 text-right">
                        {formatRupiah(t1)}
                      </td>
                      {renderDataColumns(c1)}
                    </tr>

                    {Object.keys(l1.l2)
                      .sort()
                      .map((l2Code) => {
                        const l2 = l1.l2[l2Code];
                        const { total: t2, cols: c2 } = getGroupTotal(l2, 2);

                        return (
                          <React.Fragment key={l2Code}>
                            {/* LEVEL 2 ROW (Green) */}
                            <tr className="bg-green-100 font-bold">
                              <td className="border border-black px-1 py-1 text-center">
                                {noUrut++}.
                              </td>
                              <td className="border border-black px-1 py-1"></td>
                              <td className="border border-black px-1 py-1">{l2Code}.</td>
                              <td className="border border-black px-1 py-1">
                                {l2.name || `Kegiatan ${l2Code}`}
                              </td>
                              <td className="border border-black px-1 py-1 text-right">
                                {formatRupiah(t2)}
                              </td>
                              {renderDataColumns(c2)}
                            </tr>

                            {Object.keys(l2.l3)
                              .sort()
                              .map((l3Code) => {
                                const l3 = l2.l3[l3Code];
                                const { total: t3, cols: c3 } = getGroupTotal(l3, 3);

                                return (
                                  <React.Fragment key={l3Code}>
                                    {/* LEVEL 3 ROW (Light Green) */}
                                    <tr className="bg-green-50 font-bold">
                                      <td className="border border-black px-1 py-1 text-center">
                                        {noUrut++}.
                                      </td>
                                      <td className="border border-black px-1 py-1"></td>
                                      <td className="border border-black px-1 py-1">{l3Code}.</td>
                                      <td className="border border-black px-1 py-1">{l3.name}</td>
                                      <td className="border border-black px-1 py-1 text-right">
                                        {formatRupiah(t3)}
                                      </td>
                                      {renderDataColumns(c3)}
                                    </tr>

                                    {/* ITEMS */}
                                    {l3.items.map((item, idx) => {
                                      const colData = {};
                                      colData[`${item.annualSource}-${item.annualType}`] =
                                        item.total;

                                      return (
                                        <tr key={`${l3Code}-${idx}`}>
                                          <td className="border border-black px-1 py-1 text-center">
                                            {noUrut++}.
                                          </td>
                                          <td className="border border-black px-1 py-1 text-center">
                                            {item.kode_rekening}
                                          </td>
                                          <td className="border border-black px-1 py-1 text-center">
                                            {l3Code}.
                                          </td>
                                          <td className="border border-black px-1 py-1 pl-4">
                                            {item.nama_barang || item.nama_barang_clean}
                                          </td>
                                          <td className="border border-black px-1 py-1 text-right tabular-nums">
                                            {formatRupiah(item.total)}
                                          </td>
                                          {renderDataColumns(colData)}
                                        </tr>
                                      );
                                    })}
                                  </React.Fragment>
                                );
                              })}
                          </React.Fragment>
                        );
                      })}
                  </React.Fragment>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="flex justify-between items-center italic text-slate-500 mt-2 text-[10px]">
        <span>
          {reportTitle} - NPSN : {npsn}, Nama Sekolah : {sekolah}
        </span>
        <span>Halaman 1 dari X</span>
      </div>
    </div>
  );
}
