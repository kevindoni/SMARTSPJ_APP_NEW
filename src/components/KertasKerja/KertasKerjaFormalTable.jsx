import React from 'react';
import { formatRupiah } from '../../utils/transactionHelpers';
import { STANDARDS_MAP } from '../../utils/kertasKerjaHelpers';

export default function KertasKerjaFormalTable({
  processedData,
  isMonthly: _isMonthly,
  selectedMonth: _selectedMonth,
  months: _months,
  fundSource,
  reportTitle,
  schoolInfo,
}) {
  // 1. Calculate Totals
  const totalBelanja = processedData.reduce((acc, item) => acc + item.total, 0);
  const totalPenerimaan = totalBelanja; // Assume Balanced Budget for now

  // 2. Group Data
  const grouped = {};

  processedData.forEach((item) => {
    const parts = (item.kode_kegiatan || '').split('.'); // ["03", "01", "01"]
    const codeL1 = parts[0] || 'XX';
    const codeL2 = parts[1] ? `${parts[0]}.${parts[1]}` : `${codeL1}.XX`;
    const codeL3 = item.kode_kegiatan; // 03.01.01

    if (!grouped[codeL1])
      grouped[codeL1] = { name: STANDARDS_MAP[codeL1] || `Standar ${codeL1}`, l2: {} };
    if (!grouped[codeL1].l2[codeL2]) grouped[codeL1].l2[codeL2] = { name: '', l3: {} }; // Missing L2 Name
    if (!grouped[codeL1].l2[codeL2].l3[codeL3])
      grouped[codeL1].l2[codeL2].l3[codeL3] = { name: item.nama_kegiatan, items: [] };

    grouped[codeL1].l2[codeL2].l3[codeL3].items.push(item);
  });

  let noUrut = 1;
  const npsn = schoolInfo?.npsn || '-';
  const sekolah = schoolInfo?.nama || '-';

  return (
    <div className="bg-white p-6 rounded-none shadow-none text-black font-sans text-xs">
      {/* HEADERS */}
      <div className="mb-4">
        <h3 className="font-bold text-sm uppercase mb-2">A. PENERIMAAN</h3>
        <h4 className="font-bold mb-2">Sumber Dana : {fundSource}</h4>
        <table className="w-full border-collapse border border-black mb-6">
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
                {formatRupiah(totalPenerimaan)}
              </td>
            </tr>
            <tr className="font-bold bg-slate-100">
              <td className="border border-black px-2 py-1" colSpan="2">
                Total Penerimaan
              </td>
              <td className="border border-black px-2 py-1 text-right">
                {formatRupiah(totalPenerimaan)}
              </td>
            </tr>
          </tbody>
        </table>

        <h3 className="font-bold text-sm uppercase mb-2">B. BELANJA</h3>
        <table className="w-full border-collapse border border-black">
          <thead className="text-center font-bold bg-white">
            <tr>
              <th className="border border-black px-1 py-2 w-10" rowSpan="2">
                No. Urut
              </th>
              <th className="border border-black px-1 py-2 w-24" rowSpan="2">
                Kode Rekening
              </th>
              <th className="border border-black px-1 py-2 w-24" rowSpan="2">
                Kode Program
              </th>
              <th className="border border-black px-1 py-2" rowSpan="2">
                Uraian
              </th>
              <th className="border border-black px-1 py-1" colSpan="3">
                Rincian Perhitungan
              </th>
              <th className="border border-black px-1 py-2 w-28" rowSpan="2">
                Jumlah
              </th>
            </tr>
            <tr>
              <th className="border border-black px-1 py-1 w-16">Volume</th>
              <th className="border border-black px-1 py-1 w-16">Satuan</th>
              <th className="border border-black px-1 py-1 w-24">Tarif Harga</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(grouped)
              .sort()
              .map((l1Code) => {
                const l1 = grouped[l1Code];
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
                        {/* Sum L1 */}
                        {formatRupiah(
                          Object.values(l1.l2).reduce(
                            (sum2, l2) =>
                              sum2 +
                              Object.values(l2.l3).reduce(
                                (sum3, l3) =>
                                  sum3 + l3.items.reduce((sumI, i) => sumI + i.total, 0),
                                0
                              ),
                            0
                          )
                        )}
                      </td>
                    </tr>

                    {Object.keys(l1.l2)
                      .sort()
                      .map((l2Code) => {
                        const l2 = l1.l2[l2Code];
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
                                {formatRupiah(
                                  Object.values(l2.l3).reduce(
                                    (sum3, l3) =>
                                      sum3 + l3.items.reduce((sumI, i) => sumI + i.total, 0),
                                    0
                                  )
                                )}
                              </td>
                            </tr>

                            {Object.keys(l2.l3)
                              .sort()
                              .map((l3Code) => {
                                const l3 = l2.l3[l3Code];
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
                                        {formatRupiah(
                                          l3.items.reduce((sumI, i) => sumI + i.total, 0)
                                        )}
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
                                          {item.volume}
                                        </td>
                                        <td className="border border-black px-1 py-1 text-center">
                                          {item.satuan}
                                        </td>
                                        <td className="border border-black px-1 py-1 text-right tabular-nums">
                                          {formatRupiah(item.harga_satuan)}
                                        </td>
                                        <td className="border border-black px-1 py-1 text-right tabular-nums">
                                          {formatRupiah(item.total)}
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
              <td className="border border-black px-1 py-1 text-right">
                {formatRupiah(totalBelanja)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="flex justify-between items-center italic text-slate-500 mt-2 text-[10px]">
        <span>
          {reportTitle} perBulan - NPSN : {npsn}, Nama Sekolah : {sekolah}
        </span>
        <span>Halaman 1 dari X</span>
      </div>
    </div>
  );
}
