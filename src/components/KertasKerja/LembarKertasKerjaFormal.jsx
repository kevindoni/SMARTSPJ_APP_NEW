// Format number: "1.000.000" (without Rp prefix, but with dots)
const formatNumber = (number) =>
  new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(number || 0);

// Helper Components
const Td = ({
  children,
  className = '',
  align = 'left',
  bold = false,
  colSpan = 1,
  rowSpan = 1,
}) => (
  <td
    colSpan={colSpan}
    rowSpan={rowSpan}
    className={`border border-black px-2 py-1 align-top ${({ left: 'text-left', right: 'text-right', center: 'text-center' })[align] || 'text-left'} ${bold ? 'font-bold' : ''} ${className}`}
  >
    {children}
  </td>
);

const Th = ({ children, className = '', width, rowSpan = 1, colSpan = 1 }) => (
  <th
    rowSpan={rowSpan}
    colSpan={colSpan}
    className={`border border-black px-2 py-1 bg-white text-center font-bold align-middle ${className}`}
    style={{ width }}
  >
    {children}
  </th>
);

export default function LembarKertasKerjaFormal({
  processedData,
  fundSource: _fundSource,
  year,
  schoolInfo,
}) {
  // 1. Aggregation Logic
  const safeData = Array.isArray(processedData) ? processedData : [];

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

    // Quarterly Totals
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

    // Categorization
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

  const kabupaten = schoolInfo?.kabupaten_kota || schoolInfo?.kabupaten || '-';
  const npsn = schoolInfo?.npsn || '...';
  const sekolah = schoolInfo?.nama || '...';

  const prov = schoolInfo?.kode_prop || schoolInfo?.propinsi_id || '';
  const kab = schoolInfo?.kode_kab_kota || schoolInfo?.kabupaten_kota_id || '';
  const kec = schoolInfo?.kode_kec || schoolInfo?.kecamatan_id || '';

  // Ensure 2 digits if they are numbers
  const pad = (v) => String(v).padStart(2, '0');
  const regionCode = `${pad(prov)}.${pad(kab)}.${pad(kec)}`;

  return (
    <div className="bg-white p-6 rounded-none shadow-none text-black box-border overflow-x-auto">
      {/* CONTAINER TABLE FOR LAYOUT CONSISTENCY */}
      <div className="min-w-[800px]">
        {/* MAIN TABLE 1 STRUCTURING HEADER + CONTENT */}
        <table className="w-full text-xs border-collapse border border-black mb-8">
          {/* --- HEADER SECTION AS TABLE ROWS -- */}
          <thead>
            {/* Title Row 1 */}
            <tr>
              <th colSpan="3" className="border border-black p-2 text-center font-bold">
                LEMBAR KERTAS KERJA
                <br />
                UNIT KERJA
              </th>
            </tr>
            {/* Title Row 2 */}
            <tr>
              <th colSpan="3" className="border border-black p-2 text-center font-bold">
                PEMERINTAH KAB. {kabupaten}
                <br />
                TAHUN ANGGARAN {year || new Date().getFullYear()}
              </th>
            </tr>
            {/* Info Section Row */}
            <tr>
              <td colSpan="3" className="border border-black p-2">
                <table className="w-full text-xs font-bold">
                  <tbody>
                    <tr>
                      <td className="w-40 align-top">Urusan Pemerintahan</td>
                      <td className="w-4 align-top">:</td>
                      <td>1.01 - PENDIDIKAN</td>
                    </tr>
                    <tr>
                      <td className="w-40 align-top">Organisasi</td>
                      <td className="w-4 align-top">:</td>
                      <td>
                        {npsn} - {sekolah}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            {/* Table Context Title */}
            <tr>
              <th colSpan="3" className="border border-black p-2 text-center font-bold">
                Rincian Anggaran Pendapatan dan Belanja
                <br />
                Unit Kerja
              </th>
            </tr>

            {/* --- DATA TABLE HEADERS --- */}
            <tr>
              <Th width="150px">Kode Rekening</Th>
              <Th>Uraian</Th>
              <Th width="150px">Jumlah (Rp)</Th>
            </tr>
            <tr className="italic bg-slate-50">
              <Th className="font-normal">1</Th>
              <Th className="font-normal">2</Th>
              <Th className="font-normal">3</Th>
            </tr>
          </thead>

          {/* --- DATA TABLE BODY --- */}
          <tbody>
            {/* PENDAPATAN */}
            <tr className="font-bold">
              <Td className="h-6"></Td>
              <Td bold>JUMLAH PENDAPATAN</Td>
              <Td align="right"></Td>
            </tr>

            {/* BELANJA */}
            <tr>
              <Td>5</Td>
              <Td bold>BELANJA</Td>
              <Td align="right" bold>
                {formatNumber(aggs.belanja)}
              </Td>
            </tr>

            {/* 5.1 OPERASI */}
            <tr>
              <Td>5.1</Td>
              <Td className="pl-4">BELANJA OPERASI</Td>
              <Td align="right">{formatNumber(aggs.operasi)}</Td>
            </tr>
            <tr>
              <Td>5.1.02</Td>
              <Td className="pl-6">BELANJA BARANG DAN JASA</Td>
              <Td align="right">{formatNumber(aggs.barangJasa)}</Td>
            </tr>
            {/* DETAILS 5.1 */}
            {[
              { k: '5.1.02.01', n: 'BELANJA BARANG', v: aggs.barang },
              { k: '5.1.02.02', n: 'BELANJA JASA', v: aggs.jasa },
              { k: '5.1.02.03', n: 'BELANJA PEMELIHARAAN', v: aggs.pemeliharaan },
              { k: '5.1.02.04', n: 'BELANJA PERJALANAN DINAS', v: aggs.perjalanan },
            ].map((row) => (
              <tr key={row.k}>
                <Td>{row.k}</Td>
                <Td className="pl-8">{row.n}</Td>
                <Td align="right">{formatNumber(row.v)}</Td>
              </tr>
            ))}

            {/* 5.2 MODAL */}
            <tr>
              <Td>5.2</Td>
              <Td className="pl-4">BELANJA MODAL</Td>
              <Td align="right">{formatNumber(aggs.modal)}</Td>
            </tr>
            {[
              { k: '5.2.02', n: 'BELANJA MODAL PERALATAN DAN MESIN', v: aggs.modalPeralatan },
              { k: '5.2.05', n: 'BELANJA MODAL ASET TETAP LAINNYA', v: aggs.modalAset },
            ].map((row) => (
              <tr key={row.k}>
                <Td>{row.k}</Td>
                <Td className="pl-6">{row.n}</Td>
                <Td align="right">{formatNumber(row.v)}</Td>
              </tr>
            ))}

            {/* TOTAL BELANJA */}
            <tr className="bg-slate-50 font-bold">
              <Td></Td>
              <Td bold>Jumlah BELANJA</Td>
              <Td align="right" bold>
                {formatNumber(aggs.belanja)}
              </Td>
            </tr>

            {/* DEFISIT */}
            <tr>
              <Td></Td>
              <Td bold>DEFISIT</Td>
              <Td align="right"></Td>
            </tr>
          </tbody>
        </table>

        {/* --- TABLE 2: TRIWULAN --- */}
        {/* Independent table but styled to look like part of the set */}
        <div className="border border-black p-0">
          <div className="text-center font-bold text-xs py-2 border-b border-black bg-white">
            Rencana Pelaksanaan Anggaran
            <br />
            Unit Kerja per Triwulan
          </div>

          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <Th rowSpan={2} width="40px">
                  No.
                </Th>
                <Th rowSpan={2}>Uraian</Th>
                <Th colSpan={4}>Triwulan</Th>
                <Th rowSpan={2} width="120px">
                  Jumlah
                </Th>
              </tr>
              <tr>
                <Th width="15%">I</Th>
                <Th width="15%">II</Th>
                <Th width="15%">III</Th>
                <Th width="15%">IV</Th>
              </tr>
              <tr className="italic bg-slate-50">
                <Th className="font-normal">1</Th>
                <Th className="font-normal">2</Th>
                <Th className="font-normal">3</Th>
                <Th className="font-normal">4</Th>
                <Th className="font-normal">5</Th>
                <Th className="font-normal">6</Th>
                <Th className="font-normal">7</Th>
              </tr>
            </thead>
            <tbody>
              {/* 1. Pendapatan */}
              <tr>
                <Td align="center">1</Td>
                <Td>Pendapatan</Td>
                <Td align="right">{formatNumber(totalQ1)}</Td>
                <Td align="right">{formatNumber(totalQ2)}</Td>
                <Td align="right">{formatNumber(totalQ3)}</Td>
                <Td align="right">{formatNumber(totalQ4)}</Td>
                <Td align="right" bold>
                  {formatNumber(aggs.belanja)}
                </Td>
              </tr>

              {/* 2.1 Belanja Operasi */}
              <tr>
                <Td align="center">2.1</Td>
                <Td>Belanja Operasi</Td>
                <Td align="right">{formatNumber(aggs.q_operasi[0])}</Td>
                <Td align="right">{formatNumber(aggs.q_operasi[1])}</Td>
                <Td align="right">{formatNumber(aggs.q_operasi[2])}</Td>
                <Td align="right">{formatNumber(aggs.q_operasi[3])}</Td>
                <Td align="right" bold className="bg-slate-50">
                  {formatNumber(aggs.operasi)}
                </Td>
              </tr>

              {/* 2.2 Belanja Modal */}
              <tr>
                <Td align="center">2.2</Td>
                <Td>Belanja Modal</Td>
                <Td align="right">{formatNumber(aggs.q_modal[0])}</Td>
                <Td align="right">{formatNumber(aggs.q_modal[1])}</Td>
                <Td align="right">{formatNumber(aggs.q_modal[2])}</Td>
                <Td align="right">{formatNumber(aggs.q_modal[3])}</Td>
                <Td align="right" bold className="bg-slate-50">
                  {formatNumber(aggs.modal)}
                </Td>
              </tr>

              {/* 3.1 Penerimaan */}
              <tr>
                <Td align="center">3.1</Td>
                <Td>Penerimaan Pembiayaan</Td>
                <Td align="right">0</Td>
                <Td align="right">0</Td>
                <Td align="right">0</Td>
                <Td align="right">0</Td>
                <Td align="right">0</Td>
              </tr>

              {/* 4.1 Pengeluaran */}
              <tr>
                <Td align="center">4.1</Td>
                <Td>Pengeluaran Pembiayaan</Td>
                <Td align="right">0</Td>
                <Td align="right">0</Td>
                <Td align="right">0</Td>
                <Td align="right">0</Td>
                <Td align="right">0</Td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
