import { formatRupiah } from '../../utils/reconciliationHelpers';

/**
 * ReconciliationDocument - Lembar BA Rekonsiliasi BOSP
 * Format sesuai dengan template Excel resmi
 * Mendukung periode: Triwulan I-IV, Semester 1-2, Tahunan
 */
export default function ReconciliationDocument({
  data,
  schoolInfo,
  year,
  period = 'tahunan',
  signatoryData = {},
  pajakData = null,
}) {
  if (!data) return null;

  const today = new Date();
  // Get period label and roman numeral
  const getPeriodInfo = (p) => {
    const periodMap = {
      tw1: { label: 'Triwulan I', roman: 'I', months: [0, 1, 2] },
      tw2: { label: 'Triwulan II', roman: 'II', months: [3, 4, 5] },
      tw3: { label: 'Triwulan III', roman: 'III', months: [6, 7, 8] },
      tw4: { label: 'Triwulan IV', roman: 'IV', months: [9, 10, 11] },
      sm1: { label: 'Semester 1', roman: 'I', months: [0, 1, 2, 3, 4, 5] },
      sm2: { label: 'Semester 2', roman: 'II', months: [6, 7, 8, 9, 10, 11] },
      tahunan: {
        label: 'Tahun Anggaran',
        roman: '',
        months: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      },
    };
    return periodMap[p] || periodMap['tahunan'];
  };

  const _periodInfo = getPeriodInfo(period);

  // Helper to get data from period (quarterly, semester, or annual)
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

  // Calculate totals for BA Document
  // Saldo Awal per sumber dana (from opening balance details)
  const openingDetails = opening.details || {};

  // Saldo awal Dana Lainnya BOSP (sumber dana "lainnya" tahun sebelumnya)
  const saldoAwalDanaLainnya =
    (openingDetails.lainnya?.bank || 0) + (openingDetails.lainnya?.tunai || 0);

  // Saldo awal BOSP Reguler (sisa reguler tahun sebelumnya)
  const saldoAwalReguler =
    (openingDetails.reguler?.bank || 0) + (openingDetails.reguler?.tunai || 0);

  // Saldo awal SiLPA Kinerja (sisa kinerja tahun sebelumnya)
  const saldoAwalKinerja =
    (openingDetails.silpaKinerja?.bank || 0) + (openingDetails.silpaKinerja?.tunai || 0);

  // Saldo awal BOSP Kinerja 2025 (diterima di semester sebelumnya)
  const saldoAwalKinerja2025 =
    (openingDetails.kinerja?.bank || 0) + (openingDetails.kinerja?.tunai || 0);

  // Penerimaan
  const penerimaanRegulerT1 = income.regulerT1 || 0;
  const penerimaanRegulerT2 = income.regulerT2 || 0;
  const penerimaanKinerja = income.kinerja || 0;

  // Total Penerimaan (TIDAK termasuk Bunga - sesuai Excel)
  const totalPenerimaan =
    saldoAwalDanaLainnya +
    saldoAwalReguler +
    saldoAwalKinerja +
    saldoAwalKinerja2025 +
    penerimaanRegulerT1 +
    penerimaanRegulerT2 +
    penerimaanKinerja;

  // Realisasi Belanja per sumber dana
  const realisasiDanaLainnya =
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

  // Total Realisasi
  const totalRealisasi =
    realisasiDanaLainnya + realisasiReguler + realisasiKinerja + realisasiSilpaKinerja;

  // Saldo Akhir (calculated)
  const saldoAkhir = totalPenerimaan - totalRealisasi;

  // Rincian Saldo (from closing balance details)
  const closingDetails = closing.details || {};

  // Saldo Reguler (Tunai + Bank)
  const saldoTunaiReguler = closingDetails.reguler?.tunai || 0;
  const saldoBankReguler = closingDetails.reguler?.bank || 0;

  // Saldo Kinerja/AFKIN
  const saldoTunaiKinerja =
    (closingDetails.kinerja?.tunai || 0) + (closingDetails.silpaKinerja?.tunai || 0);
  const saldoBankKinerja =
    (closingDetails.kinerja?.bank || 0) + (closingDetails.silpaKinerja?.bank || 0);

  // Selisih Bunga Bank
  const selisihBunga = (income.bunga || 0) - (expenses.admBank || 0);

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-4xl mx-auto print:shadow-none print:border-none"
      style={{ fontFamily: "'Times New Roman', serif", fontSize: '12px' }}
    >
      {/* Header */}


      <div className="border-b-4 border-double border-black pb-3 mb-4">
        <div className="flex items-center justify-between">
          {/* Kolom Kiri: Logo */}
          <div className="w-20 flex justify-center items-center flex-shrink-0">
            {signatoryData?.logoBase64 ? (
              <img
                src={signatoryData.logoBase64}
                alt="Logo"
                className="w-auto h-20 object-contain"
              />
            ) : (
              <div className="w-16 h-16 flex items-center justify-center text-[10px] text-slate-300 border border-dashed border-slate-300 rounded">
                Logo
              </div>
            )}
          </div>

          {/* Kolom Tengah: Teks */}
          <div className="flex-grow text-center px-2">
            <h1 className="text-sm font-bold uppercase tracking-tight">
              {signatoryData?.header1 || ''}
            </h1>
            <h2 className="text-sm font-bold uppercase tracking-tight leading-tight">
              {signatoryData?.header2 || ''}
            </h2>
            <p className="text-[11px] mt-1 leading-tight">{signatoryData?.headerAlamat || ''}</p>
            <p className="text-[10px] leading-tight">{signatoryData?.headerTelepon || ''}</p>
            <p className="text-[10px] leading-tight">{signatoryData?.headerLaman || ''}</p>
          </div>

          {/* Kolom Kanan: Spacer Penyeimbang agar Teks tetap Center */}
          <div className="w-20 flex-shrink-0"></div>
        </div>
      </div>

      {/* Document Title */}
      <div className="text-center my-4">
        <h3 className="text-sm font-bold underline">BERITA ACARA REKONSILIASI BOSP</h3>
        <p className="font-bold mt-1">
          {schoolInfo?.nama || schoolInfo?.nama_sekolah || 'SEKOLAH'}
        </p>
        <p className="text-xs mt-1">
          NOMOR: {signatoryData?.nomorBa || '........../......./BOS/' + year}
        </p>
      </div>

      {/* Opening Paragraph */}
      <div className="text-justify leading-relaxed text-xs mb-3">
        <p className="indent-8">
          Pada hari{' '}
          {(() => {
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

            let date = new Date(); // Default today? Or user selected period end date?
            // User wants mirroring PDF logic: if tanggalSurat exists, use it.
            if (signatoryData?.tanggalSurat) {
              date = new Date(signatoryData.tanggalSurat);
            } else {
              // Use current date as default
            }

            return `${days[date.getDay()]} tanggal ${date.getDate()} bulan ${months[date.getMonth()].toLowerCase()} tahun ${date.getFullYear()}`;
          })()}
          , bertempat di {signatoryData?.tempatRekonsiliasi || '...................'}. Yang
          bertanda tangan di bawah ini:
        </p>
      </div>

      {/* Signatories Info */}
      <div className="ml-6 mb-3 text-xs space-y-1">
        <div className="grid grid-cols-[20px_80px_15px_1fr]">
          <span>1</span>
          <span>Nama</span>
          <span>:</span>
          <span className="font-semibold">
            {schoolInfo?.kepala_sekolah || '................................'}
          </span>
        </div>
        <div className="grid grid-cols-[20px_80px_15px_1fr]">
          <span></span>
          <span>NIP</span>
          <span>:</span>
          <span></span>
        </div>
        <div className="grid grid-cols-[20px_80px_15px_1fr]">
          <span></span>
          <span>Jabatan</span>
          <span>:</span>
          <span>Kepala Sekolah {schoolInfo?.nama || schoolInfo?.nama_sekolah || ''}</span>
        </div>
        <div className="grid grid-cols-[20px_80px_15px_1fr] mt-1">
          <span>2</span>
          <span>Nama</span>
          <span>:</span>
          <span className="font-semibold">
            {schoolInfo?.bendahara || '................................'}
          </span>
        </div>
        <div className="grid grid-cols-[20px_80px_15px_1fr]">
          <span></span>
          <span>NIP</span>
          <span>:</span>
          <span></span>
        </div>
        <div className="grid grid-cols-[20px_80px_15px_1fr]">
          <span></span>
          <span>Jabatan</span>
          <span>:</span>
          <span>Bendahara BOS {schoolInfo?.nama || schoolInfo?.nama_sekolah || ''}</span>
        </div>
      </div>

      {/* Statement */}
      <div className="text-justify leading-relaxed text-xs mb-3">
        <p className="indent-8">
          {(() => {
            let reportPeriodText;
            const pInfo = getPeriodInfo(period);
            if (period === 'tahunan') {
              reportPeriodText = `Tahun Anggaran ${year}`;
            } else {
              reportPeriodText = `${pInfo.label} Tahun Anggaran ${year}`;
            }
            return `Menyatakan bahwa kami bertanggung jawab penuh atas kebenaran Laporan Realisasi Penggunaan Dana BOSP ${reportPeriodText} dengan rincian sebagai berikut:`;
          })()}
        </p>
      </div>

      {/* Financial Table */}
      <table className="w-full border-collapse text-xs mb-3" style={{ borderColor: '#000' }}>
        <colgroup>
          <col style={{ width: '50%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '15%' }} />
        </colgroup>
        <tbody>

          {/* === SALDO AWAL === */}
          <tr className="bg-slate-100">
            <td colSpan={5} className="border border-black px-2 py-1 font-bold text-[10px] uppercase tracking-wider text-slate-600">
              Saldo Awal
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 pl-4">Dana Lainnya BOSP</td>
            <td className="border border-black px-1 py-1 text-center">Rp</td>
            <td className="border border-black px-1 py-1 text-right font-mono bg-yellow-50">
              {formatRupiah(saldoAwalDanaLainnya)}
            </td>
            <td className="border border-black px-1 py-1 text-center"></td>
                        <td className="border border-black px-1 py-1"></td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 pl-4">BOSP Reguler {year - 1} (sisa reguler {year - 1})</td>
            <td className="border border-black px-1 py-1 text-center">Rp</td>
            <td className="border border-black px-1 py-1 text-right font-mono bg-yellow-50">
              {formatRupiah(saldoAwalReguler)}
            </td>
            <td className="border border-black px-1 py-1 text-center"></td>
                        <td className="border border-black px-1 py-1"></td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 pl-4">SiLPA Kinerja {year - 1}</td>
            <td className="border border-black px-1 py-1 text-center">Rp</td>
            <td className="border border-black px-1 py-1 text-right font-mono bg-yellow-50">
              {formatRupiah(saldoAwalKinerja)}
            </td>
            <td className="border border-black px-1 py-1 text-center"></td>
                        <td className="border border-black px-1 py-1"></td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 pl-4">BOSP Kinerja {year}</td>
            <td className="border border-black px-1 py-1 text-center">Rp</td>
            <td className="border border-black px-1 py-1 text-right font-mono bg-yellow-50">
              {formatRupiah(saldoAwalKinerja2025)}
            </td>
            <td className="border border-black px-1 py-1 text-center"></td>
                        <td className="border border-black px-1 py-1"></td>
          </tr>

          {/* === PENERIMAAN === */}
          <tr className="bg-slate-100">
            <td colSpan={5} className="border border-black px-2 py-1 font-bold text-[10px] uppercase tracking-wider text-slate-600">
              Penerimaan
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 pl-4">BOSP Reguler Tahap I</td>
            <td className="border border-black px-1 py-1 text-center">Rp</td>
            <td className="border border-black px-1 py-1 text-right font-mono bg-yellow-50">
              {formatRupiah(penerimaanRegulerT1)}
            </td>
            <td className="border border-black px-1 py-1 text-center"></td>
                        <td className="border border-black px-1 py-1"></td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 pl-4">BOSP Reguler Tahap II</td>
            <td className="border border-black px-1 py-1 text-center">Rp</td>
            <td className="border border-black px-1 py-1 text-right font-mono bg-yellow-50">
              {formatRupiah(penerimaanRegulerT2)}
            </td>
            <td className="border border-black px-1 py-1 text-center"></td>
                        <td className="border border-black px-1 py-1"></td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 pl-4">BOSP Kinerja {year}</td>
            <td className="border border-black px-1 py-1 text-center">Rp</td>
            <td className="border border-black px-1 py-1 text-right font-mono bg-yellow-50">
              {formatRupiah(penerimaanKinerja)}
            </td>
            <td className="border border-black px-1 py-1 text-center">+</td>
                        <td className="border border-black px-1 py-1"></td>
          </tr>

          {/* === TOTAL PENERIMAAN === */}
          <tr className="bg-blue-50">
            <td className="border border-black px-2 py-1.5 font-bold">Jumlah Penerimaan</td>
            <td className="border border-black px-1 py-1"></td>
            <td className="border border-black px-1 py-1"></td>
            <td className="border border-black px-1 py-1 text-center font-bold">Rp</td>
            <td className="border border-black px-1 py-1 text-right font-mono font-bold">
              {formatRupiah(totalPenerimaan)}
            </td>
          </tr>

          {/* === REALISASI BELANJA === */}
          <tr className="bg-slate-100">
            <td colSpan={5} className="border border-black px-2 py-1 font-bold text-[10px] uppercase tracking-wider text-slate-600">
              Realisasi Belanja
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 pl-4">BOSP Dana Lainnya</td>
            <td className="border border-black px-1 py-1 text-center">Rp</td>
            <td className="border border-black px-1 py-1 text-right font-mono bg-yellow-50">
              {formatRupiah(realisasiDanaLainnya)}
            </td>
            <td className="border border-black px-1 py-1 text-center"></td>
                        <td className="border border-black px-1 py-1"></td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 pl-4">BOSP Reguler {year}</td>
            <td className="border border-black px-1 py-1 text-center">Rp</td>
            <td className="border border-black px-1 py-1 text-right font-mono bg-yellow-50">
              {formatRupiah(realisasiReguler)}
            </td>
            <td className="border border-black px-1 py-1 text-center"></td>
                        <td className="border border-black px-1 py-1"></td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 pl-4">BOSP Kinerja {year}</td>
            <td className="border border-black px-1 py-1 text-center">Rp</td>
            <td className="border border-black px-1 py-1 text-right font-mono bg-yellow-50">
              {formatRupiah(realisasiKinerja)}
            </td>
            <td className="border border-black px-1 py-1 text-center"></td>
                        <td className="border border-black px-1 py-1"></td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 pl-4">Sisa BOSP Kinerja {year - 1}</td>
            <td className="border border-black px-1 py-1 text-center">Rp</td>
            <td className="border border-black px-1 py-1 text-right font-mono bg-yellow-50">
              {formatRupiah(realisasiSilpaKinerja)}
            </td>
            <td className="border border-black px-1 py-1 text-center">-</td>
                        <td className="border border-black px-1 py-1"></td>
          </tr>

          {/* === TOTAL REALISASI === */}
          <tr className="bg-orange-50">
            <td className="border border-black px-2 py-1.5 font-bold">Jumlah Realisasi</td>
            <td className="border border-black px-1 py-1"></td>
            <td className="border border-black px-1 py-1"></td>
            <td className="border border-black px-1 py-1 text-center font-bold">Rp</td>
            <td className="border border-black px-1 py-1 text-right font-mono font-bold">
              {formatRupiah(totalRealisasi)}
            </td>
          </tr>

          {/* === SALDO AKHIR === */}
          <tr className="bg-green-100">
            <td className="border border-black px-2 py-2 font-bold text-sm">Saldo Akhir</td>
            <td className="border border-black px-1 py-1"></td>
            <td className="border border-black px-1 py-1"></td>
            <td className="border border-black px-1 py-1 text-center font-bold text-sm">Rp</td>
            <td className="border border-black px-1 py-1 text-right font-mono font-bold text-sm">
              {formatRupiah(saldoAkhir)}
            </td>
          </tr>

          {/* === RINCIAN SALDO === */}
          <tr className="bg-slate-100">
            <td colSpan={5} className="border border-black px-2 py-1 font-bold text-[10px] uppercase tracking-wider text-slate-600">
              Rincian Saldo
            </td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 pl-4">Tunai BOSP Reguler</td>
            <td className="border border-black px-1 py-1 text-center">Rp</td>
            <td className="border border-black px-1 py-1 text-right font-mono bg-yellow-50">
              {formatRupiah(saldoTunaiReguler)}
            </td>
            <td className="border border-black px-1 py-1 text-center"></td>
                        <td className="border border-black px-1 py-1"></td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 pl-4">Bank BOSP Reguler</td>
            <td className="border border-black px-1 py-1 text-center">Rp</td>
            <td className="border border-black px-1 py-1 text-right font-mono bg-yellow-50">
              {formatRupiah(saldoBankReguler)}
            </td>
            <td className="border border-black px-1 py-1 text-center">=</td>
                        <td className="border border-black px-1 py-1 text-right font-mono font-semibold">{formatRupiah(saldoTunaiReguler + saldoBankReguler)}</td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 pl-4">Tunai BOSP AFKIN</td>
            <td className="border border-black px-1 py-1 text-center">Rp</td>
            <td className="border border-black px-1 py-1 text-right font-mono bg-yellow-50">
              {formatRupiah(saldoTunaiKinerja)}
            </td>
            <td className="border border-black px-1 py-1 text-center"></td>
                        <td className="border border-black px-1 py-1"></td>
          </tr>
          <tr>
            <td className="border border-black px-2 py-1 pl-4">Bank BOSP AFKIN</td>
            <td className="border border-black px-1 py-1 text-center">Rp</td>
            <td className="border border-black px-1 py-1 text-right font-mono bg-yellow-50">
              {formatRupiah(saldoBankKinerja)}
            </td>
            <td className="border border-black px-1 py-1 text-center">+</td>
                        <td className="border border-black px-1 py-1"></td>
          </tr>

          {/* Hutang Pajak Row */}
          {(() => {
            const manualTaxes = pajakData?.manualTaxes;
            if (!manualTaxes) return null;
            const saldoAwal = manualTaxes.totalSaldoAwal || 0;
            const totalPungut = manualTaxes.totalPungut || 0;
            const totalSetor = manualTaxes.totalSetor || 0;
            const hutangPajakClosing = saldoAwal + totalPungut - totalSetor;
            if (hutangPajakClosing > 0) {
              return (
                <tr className="bg-amber-50">
                  <td className="border border-black px-2 py-1 pl-4 font-semibold">Hutang Pajak *)</td>
                  <td className="border border-black px-1 py-1 text-center">Rp</td>
                  <td className="border border-black px-1 py-1 text-right font-mono font-bold text-amber-800 bg-amber-100">
                    {formatRupiah(hutangPajakClosing)}
                  </td>
                  <td className="border border-black px-1 py-1"></td>
                  <td className="border border-black px-1 py-1"></td>
                </tr>
              );
            }
            return null;
          })()}

          <tr>
            <td className="border border-black px-2 py-1 pl-4">Selisih Bunga Bank dan Biaya Admin Bank</td>
            <td className="border border-black px-1 py-1 text-center">Rp</td>
            <td className="border border-black px-1 py-1 text-right font-mono bg-yellow-50">
              {formatRupiah(selisihBunga)}
            </td>
            <td className="border border-black px-1 py-1 text-center"></td>
                        <td className="border border-black px-1 py-1"></td>
          </tr>

        </tbody>
      </table>

      {/* Note */}
      <div className="text-xs mb-4">
        <p>Laporan Realisasi Belanja tersebut di atas sudah diinput dalam aplikasi ARKAS.</p>
        {/* Footnote for Hutang Pajak */}
        {(() => {
          const manualTaxes = pajakData?.manualTaxes;
          if (!manualTaxes) return null;

          const saldoAwal = manualTaxes.totalSaldoAwal || 0;
          const totalPungut = manualTaxes.totalPungut || 0;
          const totalSetor = manualTaxes.totalSetor || 0;
          const hutangPajakClosing = saldoAwal + totalPungut - totalSetor;

          if (hutangPajakClosing > 0) {
            return (
              <p className="mt-2 italic text-slate-600">
                *) Hutang Pajak adalah saldo akhir pungutan pajak yang belum disetor ke kas negara.
              </p>
            );
          }
          return null;
        })()}
      </div>

      {/* Closing Statement */}
      <div className="text-justify leading-relaxed text-xs mb-6">
        <p className="indent-8">
          Demikian Berita Acara ini dibuat dan ditandatangani bersama, dibuat rangkap secukupnya dan
          untuk dapat dipergunakan seperlunya.
        </p>
      </div>

      {/* Signatures */}
      <div className="text-right text-xs mb-6">
        <p>
          {signatoryData?.kabupaten || schoolInfo?.kabupaten || ''},{' '}
          {(() => {
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

            let date = new Date();
            if (signatoryData?.tanggalSurat) {
              date = new Date(signatoryData.tanggalSurat);
            }

            return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
          })()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 text-center text-xs">
        <div>
          <p>Mengetahui</p>
          <p className="font-bold">Kepala Sekolah</p>
          <p>{schoolInfo?.nama || schoolInfo?.nama_sekolah || ''}</p>
          <div className="h-16"></div>
          <p className="font-bold underline">
            {schoolInfo?.kepala_sekolah || '................................'}
          </p>
          <p>NIP. {schoolInfo?.nip_kepala || '................................'}</p>
        </div>
        <div>
          <p>&nbsp;</p>
          <p className="font-bold">Bendahara BOS</p>
          <p>{schoolInfo?.nama || schoolInfo?.nama_sekolah || ''}</p>
          <div className="h-16"></div>
          <p className="font-bold underline">
            {schoolInfo?.bendahara || '................................'}
          </p>
          <p>NIP. {schoolInfo?.nip_bendahara || '................................'}</p>
        </div>
      </div>

      {/* Third Signature Row */}
      <div className="grid grid-cols-2 gap-6 text-center text-xs mt-6">
        <div>
          <p>PPTK BOSP</p>
          <div className="h-16"></div>
          <p className="font-bold underline">
            {signatoryData?.pptkNama || '................................'}
          </p>
          <p>NIP. {signatoryData?.pptkNip || '................................'}</p>
        </div>
        <div>
          <p>Petugas Rekons,</p>
          <div className="h-16"></div>
          <p className="font-bold underline">
            {signatoryData?.petugasRekonsNama || '................................'}
          </p>
          <p>NIP. {signatoryData?.petugasRekonsNip || '................................'}</p>
        </div>
      </div>
    </div>
  );
}
