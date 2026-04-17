import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { terbilang } from '../../utils/terbilang';


// Format date like "25-Jan-2025"
function formatDateShort(dateStr) {
  const date = new Date(dateStr);
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
  return `${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
}

// Format number with comma decimals
function formatNumber(num) {
  return num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ReceiptPreviewModal({ transaction, schoolInfo, year, onClose, onPrint }) {
  const [customDate, setCustomDate] = useState(null);
  const [relatedTaxes, setRelatedTaxes] = useState({
    ppn: 0,
    pph21: 0,
    pph22: 0,
    pph23: 0,
    pph4: 0,
    sspd: 0,
  });
  const [loadingTaxes, setLoadingTaxes] = useState(false);

  useEffect(() => {
    if (transaction) {
      const saved = localStorage.getItem(`custom_date_${transaction.id_kas_umum}`);
      setCustomDate(saved || transaction.tanggal_transaksi);
    }
  }, [transaction]);

  // Fetch related tax entries from BKU
  useEffect(() => {
    const fetchRelatedTaxes = async () => {
      if (!transaction || !window.arkas?.getRelatedTaxes) return;

      setLoadingTaxes(true);
      try {
        const result = await window.arkas.getRelatedTaxes(
          transaction.uraian,
          transaction.tanggal_transaksi,
          transaction.kode_rekening,
          year,
          transaction.nominal
        );
        if (result.success && result.data) {
          setRelatedTaxes(result.data);
        }
      } catch (err) {
        console.error('Failed to fetch related taxes:', err);
      } finally {
        setLoadingTaxes(false);
      }
    };

    fetchRelatedTaxes();
  }, [transaction, year]);

  if (!transaction) return null;

  // Main signatures (cols 1-3) always use transaction date
  const transactionDate = transaction.tanggal_transaksi;
  // Receiver (col 4) uses custom date or tanggal_nota or transaction date
  const receiverDate = customDate || transaction.tanggal_nota || transaction.tanggal_transaksi;
  const displayYear = customDate
    ? new Date(customDate).getFullYear()
    : year || new Date().getFullYear();
  const nominal = transaction.nominal || 0;
  const schoolName = schoolInfo?.nama || schoolInfo?.nama_sekolah || '';

  // Calculate taxes - prioritize BKU entries (relatedTaxes), fallback to flags
  const ppn =
    relatedTaxes.ppn > 0
      ? relatedTaxes.ppn
      : transaction.is_ppn === 1
        ? Math.round(nominal * 0.11)
        : 0;
  const pph21 =
    relatedTaxes.pph21 > 0
      ? relatedTaxes.pph21
      : transaction.is_pph_21 === 1
        ? Math.round(nominal * 0.05)
        : 0;
  const pph23 =
    relatedTaxes.pph23 > 0
      ? relatedTaxes.pph23
      : transaction.is_pph_23 === 1
        ? Math.round(nominal * 0.02)
        : 0;
  const pajakDaerah =
    relatedTaxes.sspd > 0
      ? relatedTaxes.sspd
      : transaction.is_sspd === 1
        ? Math.round(nominal * 0.1)
        : 0;
  const totalPajak = ppn + pph21 + pph23 + pajakDaerah;
  const jumlahBersih = nominal - totalPajak;

  const handlePrint = () => {
    if (onPrint) {
      onPrint(transaction);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[900px] animate-fadeIn">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-t-xl">
          <h3 className="text-lg font-bold text-white">Preview Bukti Pengeluaran Uang</h3>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Receipt Content - Matching Blade Template */}
        <div className="p-6 bg-slate-50">
          <div
            className="bg-white p-4"
            style={{ border: '3px solid #000', fontFamily: 'serif', fontSize: '13px' }}
          >
            {/* Header */}
            <div className="text-center mb-3">
              <h4 className="font-bold mb-1" style={{ letterSpacing: '2px', fontSize: '18px' }}>
                BUKTI PENGELUARAN UANG
              </h4>
              <p className="mb-0" style={{ fontSize: '14px' }}>
                No : {transaction.no_bukti || '-'}
              </p>
            </div>

            {/* Main Content Container - Relative for absolute positioning */}
            <div style={{ position: 'relative', minHeight: '200px' }}>
              {/* Left Column - Data Table */}
              <table className="w-auto" style={{ lineHeight: '1.6' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '140px', padding: '2px 4px', verticalAlign: 'top' }}>
                      Dinas/Instansi
                    </td>
                    <td style={{ width: '10px', padding: '2px 0', verticalAlign: 'top' }}>:</td>
                    <td style={{ padding: '2px 4px', verticalAlign: 'top' }}>{schoolName}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 4px', verticalAlign: 'top' }}>Tahun Anggaran</td>
                    <td style={{ padding: '2px 0', verticalAlign: 'top' }}>:</td>
                    <td style={{ padding: '2px 4px', verticalAlign: 'top' }}>{displayYear}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 4px', verticalAlign: 'top' }}>Kode Rekening</td>
                    <td style={{ padding: '2px 0', verticalAlign: 'top' }}>:</td>
                    <td style={{ padding: '2px 4px', verticalAlign: 'top' }}>
                      {transaction.kode_rekening || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 4px', verticalAlign: 'top' }}>Uraian Kode Rek</td>
                    <td style={{ padding: '2px 0', verticalAlign: 'top' }}>:</td>
                    <td style={{ padding: '2px 4px', verticalAlign: 'top' }}>
                      {transaction.nama_rekening || transaction.uraian || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 4px', verticalAlign: 'top' }}>Terima Dari</td>
                    <td style={{ padding: '2px 0', verticalAlign: 'top' }}>:</td>
                    <td style={{ padding: '2px 4px', verticalAlign: 'top' }}>
                      Bendahara Pengeluaran {schoolName}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 4px', verticalAlign: 'top' }}>Uang Sebesar</td>
                    <td style={{ padding: '2px 0', verticalAlign: 'top' }}>:</td>
                    <td style={{ padding: '2px 4px', verticalAlign: 'top' }}>
                      <div
                        style={{
                          border: '2px solid #000',
                          background: '#f0f0f0',
                          padding: '3px 8px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          transform: 'skewX(-15deg)',
                          display: 'inline-block',
                          minWidth: '150px',
                          fontSize: '13px',
                        }}
                      >
                        Rp {formatNumber(nominal)}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 4px', verticalAlign: 'top' }}>Terbilang</td>
                    <td style={{ padding: '2px 0', verticalAlign: 'top' }}>:</td>
                    <td style={{ padding: '2px 4px', verticalAlign: 'top', fontStyle: 'italic' }}>
                      {terbilang(nominal)} Rupiah
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '2px 4px', verticalAlign: 'top' }}>Untuk Kepentingan</td>
                    <td style={{ padding: '2px 0', verticalAlign: 'top' }}>:</td>
                    <td style={{ padding: '2px 4px', verticalAlign: 'top' }}>
                      {transaction.uraian || '-'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Right Column - Summary Table (Compact) */}
              <div style={{ position: 'absolute', top: 0, right: '15px', fontSize: '11px' }}>
                <table style={{ width: 'auto', lineHeight: '1.2' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '80px', whiteSpace: 'nowrap', padding: '0px 3px' }}>
                        Penerimaan
                      </td>
                      <td style={{ width: '8px', textAlign: 'center', padding: '0px' }}>:</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', padding: '0px 3px' }}>
                        {formatNumber(nominal)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ whiteSpace: 'nowrap', padding: '0px 3px' }}>PPN</td>
                      <td style={{ textAlign: 'center', padding: '0px' }}>:</td>
                      <td style={{ textAlign: 'right', padding: '0px 3px' }}>
                        {ppn > 0 ? formatNumber(ppn) : '-'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ whiteSpace: 'nowrap', padding: '0px 3px' }}>PPh 21</td>
                      <td style={{ textAlign: 'center', padding: '0px' }}>:</td>
                      <td style={{ textAlign: 'right', padding: '0px 3px' }}>
                        {pph21 > 0 ? formatNumber(pph21) : '-'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ whiteSpace: 'nowrap', padding: '0px 3px' }}>PPh 23%</td>
                      <td style={{ textAlign: 'center', padding: '0px' }}>:</td>
                      <td style={{ textAlign: 'right', padding: '0px 3px' }}>
                        {pph23 > 0 ? formatNumber(pph23) : '-'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ whiteSpace: 'nowrap', padding: '0px 3px' }}>Pajak Daerah</td>
                      <td style={{ textAlign: 'center', padding: '0px' }}>:</td>
                      <td style={{ textAlign: 'right', padding: '0px 3px' }}>
                        {pajakDaerah > 0 ? formatNumber(pajakDaerah) : '-'}
                      </td>
                    </tr>
                    <tr style={{ borderTop: '1px solid #000' }}>
                      <td
                        style={{ fontWeight: 'bold', whiteSpace: 'nowrap', padding: '2px 3px 0px' }}
                      >
                        Jumlah
                      </td>
                      <td style={{ textAlign: 'center', padding: '2px 0px 0px' }}>:</td>
                      <td
                        style={{ textAlign: 'right', fontWeight: 'bold', padding: '2px 3px 0px' }}
                      >
                        {formatNumber(jumlahBersih)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signatures Section - 4 Columns with Borders */}
            <div className="flex mt-4" style={{ border: '1px solid #000', minHeight: '180px' }}>
              {/* Column 1: Mengetahui */}
              <div
                className="flex-1 flex flex-col text-center p-2"
                style={{ borderRight: '1px solid #000', fontSize: '11px' }}
              >
                <div>
                  <p className="mb-0">Tgl, {formatDateShort(transactionDate)}</p>
                  <p className="font-bold mb-0">MENGETAHUI</p>
                  <p className="mb-0">Kepala {schoolName}</p>
                </div>
                <div className="mt-auto">
                  <p className="font-bold mb-0">
                    <u>
                      {schoolInfo?.nama_kepsek ||
                        schoolInfo?.kepala_sekolah ||
                        '___________________'}
                    </u>
                  </p>
                  <p className="mb-0">
                    NIP. {schoolInfo?.nip_kepsek || schoolInfo?.nip_kepala || '-'}
                  </p>
                </div>
              </div>

              {/* Column 2: Dibayar oleh */}
              <div
                className="flex-1 flex flex-col text-center p-2"
                style={{ borderRight: '1px solid #000', fontSize: '11px' }}
              >
                <div>
                  <p className="mb-0">Tgl, {formatDateShort(transactionDate)}</p>
                  <p className="mb-0">Dibayar oleh</p>
                  <p className="mb-0">Bendahara Pengeluaran</p>
                  <p className="mb-0">{schoolName}</p>
                </div>
                <div className="mt-auto">
                  <p className="font-bold mb-0">
                    <u>
                      {schoolInfo?.nama_bendahara || schoolInfo?.bendahara || '___________________'}
                    </u>
                  </p>
                  <p className="mb-0">NIP. {schoolInfo?.nip_bendahara || '-'}</p>
                </div>
              </div>

              {/* Column 3: Barang telah diterima */}
              <div
                className="flex-1 flex flex-col text-center p-2"
                style={{ borderRight: '1px solid #000', fontSize: '11px' }}
              >
                <div>
                  <p className="mb-0">Tgl,{formatDateShort(transactionDate)}</p>
                  <p className="mb-0">Barang telah diterima</p>
                  <p className="mb-0">Pemegang Barang</p>
                  <p className="mb-0">{schoolName}</p>
                </div>
                <div className="mt-auto">
                  <p className="font-bold mb-0">
                    <u>
                      {schoolInfo?.nama_pemegang_barang ||
                        schoolInfo?.pemegang_barang ||
                        '___________________'}
                    </u>
                  </p>
                  <p className="mb-0">NIP. {schoolInfo?.nip_pemegang_barang || '-'}</p>
                </div>
              </div>

              {/* Column 4: Yang menerima uang */}
              <div className="flex-1 flex flex-col text-center p-2" style={{ fontSize: '11px' }}>
                <div>
                  <p className="mb-0">Tgl, {formatDateShort(receiverDate)}</p>
                  <p className="mb-1">Yang menerima uang</p>
                  <table className="mx-auto" style={{ fontSize: '10px' }}>
                    <tbody>
                      <tr>
                        <td className="text-left p-0" style={{ width: '40px' }}>
                          Nama
                        </td>
                        <td className="p-0" style={{ width: '5px' }}>
                          :
                        </td>
                        <td
                          className="text-left p-0 whitespace-nowrap overflow-hidden max-w-[100px] text-ellipsis"
                          title={transaction.nama_toko}
                        >
                          {transaction.nama_toko || '______________'}
                        </td>
                      </tr>
                      <tr>
                        <td className="text-left p-0">Alamat</td>
                        <td className="p-0">:</td>
                        <td
                          className="text-left p-0 whitespace-nowrap overflow-hidden max-w-[100px] text-ellipsis"
                          title={transaction.alamat_toko}
                        >
                          {transaction.is_badan_usaha === 1
                            ? transaction.alamat_toko || '______________'
                            : '______________'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-auto">
                  <p className="font-bold mb-0">
                    <u>{transaction.nama_toko || '___________________'}</u>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer - Paraf (Extended width for notes) */}
            <div className="flex items-center p-2 mt-0" style={{ borderTop: '1px solid #000' }}>
              <span style={{ fontSize: '11px', marginRight: '8px' }}>Paraf Pencatat Pembukuan</span>
              <div style={{ border: '1px solid #000', height: '25px', width: '250px' }}></div>
            </div>
          </div>
        </div>

        {/* Modal Footer - Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-200 font-medium"
          >
            <Download size={18} />
            Simpan sebagai PDF
          </button>
        </div>
      </div>
    </div>
  );
}
