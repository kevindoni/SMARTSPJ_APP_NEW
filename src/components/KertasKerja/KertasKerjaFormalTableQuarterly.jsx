import React from 'react';
import { formatRupiah } from '../../utils/transactionHelpers';
import { STANDARDS_MAP } from '../../utils/kertasKerjaHelpers';

export default function KertasKerjaFormalTableQuarterly({
  processedData,
  fundSource,
  reportTitle,
  schoolInfo,
}) {
  // 1. Group Data Logic & Calculate Quarters
  const grouped = {};
  let totalAll = 0;

  // Aggregators for Grand Totals
  const grandQ = [0, 0, 0, 0]; // Q1, Q2, Q3, Q4

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

    // Calculate Quarterly Totals (Rupiah)
    const price = item.harga_satuan || 0;
    const q1 = ((item.v1 || 0) + (item.v2 || 0) + (item.v3 || 0)) * price;
    const q2 = ((item.v4 || 0) + (item.v5 || 0) + (item.v6 || 0)) * price;
    const q3 = ((item.v7 || 0) + (item.v8 || 0) + (item.v9 || 0)) * price;
    const q4 = ((item.v10 || 0) + (item.v11 || 0) + (item.v12 || 0)) * price;

    const enrichedItem = { ...item, q1, q2, q3, q4, totalYear: q1 + q2 + q3 + q4 };

    grandQ[0] += q1;
    grandQ[1] += q2;
    grandQ[2] += q3;
    grandQ[3] += q4;
    totalAll += enrichedItem.totalYear;

    grouped[codeL1].l2[codeL2].l3[codeL3].items.push(enrichedItem);
  });

  const getGroupTotal = (groupLevel, level) => {
    let items = [];
    if (level === 1)
      items = Object.values(groupLevel.l2).flatMap((l2) =>
        Object.values(l2.l3).flatMap((l3) => l3.items)
      );
    else if (level === 2) items = Object.values(groupLevel.l3).flatMap((l3) => l3.items);
    else items = groupLevel.items;

    return {
      total: items.reduce((s, i) => s + (Number(i.totalYear) || 0), 0),
      q: [
        items.reduce((s, i) => s + i.q1, 0),
        items.reduce((s, i) => s + i.q2, 0),
        items.reduce((s, i) => s + i.q3, 0),
        items.reduce((s, i) => s + i.q4, 0),
      ],
    };
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
              <th className="border border-black px-1 py-2 w-8" rowSpan="2">
                No.
                <br />
                Urut
              </th>
              <th className="border border-black px-1 py-2 w-20" rowSpan="2">
                Kode Rekening
              </th>
              <th className="border border-black px-1 py-2 w-20" rowSpan="2">
                Kode Program
              </th>
              <th className="border border-black px-1 py-2 min-w-[200px]" rowSpan="2">
                Uraian
              </th>
              <th className="border border-black px-1 py-1" colSpan="3">
                Rincian Perhitungan
              </th>
              <th className="border border-black px-1 py-2 w-24" rowSpan="2">
                Jumlah
              </th>
              <th className="border border-black px-1 py-1" colSpan="4">
                Triwulan
              </th>
            </tr>
            <tr>
              <th className="border border-black px-1 py-1 w-16">Volume</th>
              <th className="border border-black px-1 py-1 w-16">Satuan</th>
              <th className="border border-black px-1 py-1 w-24">Tarif Harga</th>
              <th className="border border-black px-1 py-1 w-24">1</th>
              <th className="border border-black px-1 py-1 w-24">2</th>
              <th className="border border-black px-1 py-1 w-24">3</th>
              <th className="border border-black px-1 py-1 w-24">4</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(grouped)
              .sort()
              .map((l1Code) => {
                const l1 = grouped[l1Code];
                const { total: t1, q: q1 } = getGroupTotal(l1, 1);

                return (
                  <React.Fragment key={l1Code}>
                    {/* LEVEL 1 ROW (Pink) */}
                    <tr className="bg-red-50 font-bold">
                      <td className="border border-black px-1 py-1 text-center">{noUrut++}.</td>
                      <td className="border border-black px-1 py-1"></td>
                      <td className="border border-black px-1 py-1">{l1Code}.</td>
                      <td className="border border-black px-1 py-1">{l1.name}</td>
                      <td className="border border-black px-1 py-1"></td>
                      <td className="border border-black px-1 py-1"></td>
                      <td className="border border-black px-1 py-1"></td>
                      <td className="border border-black px-1 py-1 text-right">
                        {formatRupiah(t1)}
                      </td>
                      <td className="border border-black px-1 py-1 text-right">
                        {formatRupiah(q1[0])}
                      </td>
                      <td className="border border-black px-1 py-1 text-right">
                        {formatRupiah(q1[1])}
                      </td>
                      <td className="border border-black px-1 py-1 text-right">
                        {formatRupiah(q1[2])}
                      </td>
                      <td className="border border-black px-1 py-1 text-right">
                        {formatRupiah(q1[3])}
                      </td>
                    </tr>

                    {Object.keys(l1.l2)
                      .sort()
                      .map((l2Code) => {
                        const l2 = l1.l2[l2Code];
                        const { total: t2, q: q2 } = getGroupTotal(l2, 2);

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
                              <td className="border border-black px-1 py-1"></td>
                              <td className="border border-black px-1 py-1"></td>
                              <td className="border border-black px-1 py-1"></td>
                              <td className="border border-black px-1 py-1 text-right">
                                {formatRupiah(t2)}
                              </td>
                              <td className="border border-black px-1 py-1 text-right">
                                {formatRupiah(q2[0])}
                              </td>
                              <td className="border border-black px-1 py-1 text-right">
                                {formatRupiah(q2[1])}
                              </td>
                              <td className="border border-black px-1 py-1 text-right">
                                {formatRupiah(q2[2])}
                              </td>
                              <td className="border border-black px-1 py-1 text-right">
                                {formatRupiah(q2[3])}
                              </td>
                            </tr>

                            {Object.keys(l2.l3)
                              .sort()
                              .map((l3Code) => {
                                const l3 = l2.l3[l3Code];
                                const { total: t3, q: q3 } = getGroupTotal(l3, 3);

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
                                      <td className="border border-black px-1 py-1"></td>
                                      <td className="border border-black px-1 py-1"></td>
                                      <td className="border border-black px-1 py-1"></td>
                                      <td className="border border-black px-1 py-1 text-right">
                                        {formatRupiah(t3)}
                                      </td>
                                      <td className="border border-black px-1 py-1 text-right">
                                        {formatRupiah(q3[0])}
                                      </td>
                                      <td className="border border-black px-1 py-1 text-right">
                                        {formatRupiah(q3[1])}
                                      </td>
                                      <td className="border border-black px-1 py-1 text-right">
                                        {formatRupiah(q3[2])}
                                      </td>
                                      <td className="border border-black px-1 py-1 text-right">
                                        {formatRupiah(q3[3])}
                                      </td>
                                    </tr>

                                    {/* ITEMS */}
                                    {l3.items.map((item, idx) => (
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
                                        <td className="border border-black px-1 py-1 text-center tabular-nums">
                                          {[
                                            item.v1,
                                            item.v2,
                                            item.v3,
                                            item.v4,
                                            item.v5,
                                            item.v6,
                                            item.v7,
                                            item.v8,
                                            item.v9,
                                            item.v10,
                                            item.v11,
                                            item.v12,
                                          ].reduce((a, b) => a + b, 0)}
                                        </td>
                                        <td className="border border-black px-1 py-1 text-center">
                                          {item.satuan}
                                        </td>
                                        <td className="border border-black px-1 py-1 text-right tabular-nums">
                                          {formatRupiah(item.harga_satuan)}
                                        </td>
                                        <td className="border border-black px-1 py-1 text-right tabular-nums">
                                          {formatRupiah(item.totalYear)}
                                        </td>
                                        <td className="border border-black px-1 py-1 text-right tabular-nums">
                                          {formatRupiah(item.q1)}
                                        </td>
                                        <td className="border border-black px-1 py-1 text-right tabular-nums">
                                          {formatRupiah(item.q2)}
                                        </td>
                                        <td className="border border-black px-1 py-1 text-right tabular-nums">
                                          {formatRupiah(item.q3)}
                                        </td>
                                        <td className="border border-black px-1 py-1 text-right tabular-nums">
                                          {formatRupiah(item.q4)}
                                        </td>
                                      </tr>
                                    ))}
                                  </React.Fragment>
                                );
                              })}
                          </React.Fragment>
                        );
                      })}
                  </React.Fragment>
                );
              })}
            {/* TOTAL ROW */}
            <tr className="font-bold bg-slate-200">
              <td className="border border-black px-1 py-1" colSpan="7">
                Total Belanja
              </td>
              <td className="border border-black px-1 py-1 text-right">{formatRupiah(totalAll)}</td>
              <td className="border border-black px-1 py-1 text-right">
                {formatRupiah(grandQ[0])}
              </td>
              <td className="border border-black px-1 py-1 text-right">
                {formatRupiah(grandQ[1])}
              </td>
              <td className="border border-black px-1 py-1 text-right">
                {formatRupiah(grandQ[2])}
              </td>
              <td className="border border-black px-1 py-1 text-right">
                {formatRupiah(grandQ[3])}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="flex justify-between items-center italic text-slate-500 mt-2 text-[10px]">
        <span>
          {reportTitle} perTriwulan - NPSN : {npsn}, Nama Sekolah : {sekolah}
        </span>
        <span>Halaman 1 dari X</span>
      </div>
    </div>
  );
}
