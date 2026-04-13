import { useState, useEffect, useRef } from 'react';
import { X, Download, Printer, FileText } from 'lucide-react';

// Helper: Convert number to Indonesian words with proper spacing
function terbilang(angka) {
  const huruf = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  if (angka < 12) {
    return huruf[angka];
  } else if (angka < 20) {
    return terbilang(angka - 10) + ' Belas';
  } else if (angka < 100) {
    const puluh = Math.floor(angka / 10);
    const sisa = angka % 10;
    return terbilang(puluh) + ' Puluh' + (sisa > 0 ? ' ' + terbilang(sisa) : '');
  } else if (angka < 200) {
    const sisa = angka - 100;
    return 'Seratus' + (sisa > 0 ? ' ' + terbilang(sisa) : '');
  } else if (angka < 1000) {
    const ratus = Math.floor(angka / 100);
    const sisa = angka % 100;
    return terbilang(ratus) + ' Ratus' + (sisa > 0 ? ' ' + terbilang(sisa) : '');
  } else if (angka < 2000) {
    const sisa = angka - 1000;
    return 'Seribu' + (sisa > 0 ? ' ' + terbilang(sisa) : '');
  } else if (angka < 1000000) {
    const ribu = Math.floor(angka / 1000);
    const sisa = angka % 1000;
    return terbilang(ribu) + ' Ribu' + (sisa > 0 ? ' ' + terbilang(sisa) : '');
  } else if (angka < 1000000000) {
    const juta = Math.floor(angka / 1000000);
    const sisa = angka % 1000000;
    return terbilang(juta) + ' Juta' + (sisa > 0 ? ' ' + terbilang(sisa) : '');
  } else if (angka < 1000000000000) {
    const milyar = Math.floor(angka / 1000000000);
    const sisa = angka % 1000000000;
    return terbilang(milyar) + ' Milyar' + (sisa > 0 ? ' ' + terbilang(sisa) : '');
  }
  return '';
}

// Format date like "25 Januari 2025"
function formatDateLong(dateStr) {
  const date = new Date(dateStr);
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
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Format number with comma decimals
function formatNumber(num) {
  return num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Format currency without decimals
function formatCurrency(num) {
  return `Rp ${num.toLocaleString('id-ID')}`;
}

/**
 * NotaGroupPreviewModal - Preview for grouped nota transactions
 */
export default function NotaGroupPreviewModal({ notaGroup, schoolInfo, onClose }) {
  const printRef = useRef();

  if (!notaGroup) return null;

  const { namaToko, noNota, tanggalNota, items, totalNominal, calculatedPPN, isSiplah, hasPPN } =
    notaGroup;

  // Calculate net amount (after PPN)
  const ppnAmount = calculatedPPN || 0;
  const netAmount = totalNominal - ppnAmount;

  // Handle print
  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Bukti Pengeluaran - ${noNota || 'Gabungan'}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 4px 6px; }
            th { background: #f0f0f0; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .no-border { border: none !important; }
            .header { text-align: center; margin-bottom: 15px; }
            .title { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
            .subtitle { font-size: 12px; }
            .terbilang { border: 1px solid #000; padding: 8px; margin: 10px 0; font-style: italic; }
            .signature-table { width: 100%; margin-top: 30px; border: none; }
            .signature-table td { border: none; text-align: center; vertical-align: top; padding: 10px; width: 33.33%; }
            .signature-space { height: 60px; }
            .signature-line { border-top: 1px solid #000; display: inline-block; min-width: 150px; padding-top: 5px; }
            @media print {
              body { margin: 10px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-purple-600 to-indigo-600">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-bold text-white">Preview Bukti Pengeluaran</h2>
              <p className="text-sm text-white/80">{namaToko}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div ref={printRef} className="bg-white">
            {/* Document Header */}
            <div className="text-center mb-6">
              <h1 className="text-lg font-bold uppercase">BUKTI PENGELUARAN</h1>
              <p className="text-sm text-slate-600">{schoolInfo?.nama_sekolah || 'SEKOLAH'}</p>
              <p className="text-xs text-slate-500">{schoolInfo?.alamat || ''}</p>
            </div>

            {/* Info Row */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <div className="flex">
                  <span className="w-24 text-slate-600">No. Nota</span>
                  <span>: {noNota || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-slate-600">Toko/Vendor</span>
                  <span>: {namaToko}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex justify-end">
                  <span className="w-24 text-slate-600">Tanggal</span>
                  <span>: {formatDateLong(tanggalNota)}</span>
                </div>
                {isSiplah && (
                  <div className="flex justify-end">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      SIPLah
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse border border-slate-300 text-sm mb-4">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-3 py-2 w-10 text-center">No</th>
                  <th className="border border-slate-300 px-3 py-2 text-left">Uraian</th>
                  <th className="border border-slate-300 px-3 py-2 w-28 text-center">No. Bukti</th>
                  <th className="border border-slate-300 px-3 py-2 w-32 text-right">Jumlah (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id_kas_umum || idx}>
                    <td className="border border-slate-300 px-3 py-2 text-center">{idx + 1}</td>
                    <td className="border border-slate-300 px-3 py-2">{item.uraian}</td>
                    <td className="border border-slate-300 px-3 py-2 text-center text-xs">
                      {item.no_bukti}
                    </td>
                    <td className="border border-slate-300 px-3 py-2 text-right">
                      {formatNumber(item.nominal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold">
                  <td colSpan="3" className="border border-slate-300 px-3 py-2 text-right">
                    Total Belanja
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right">
                    {formatNumber(totalNominal)}
                  </td>
                </tr>
                {ppnAmount > 0 && (
                  <>
                    <tr className="bg-green-50">
                      <td
                        colSpan="3"
                        className="border border-slate-300 px-3 py-2 text-right text-green-700"
                      >
                        PPN (11%)
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right text-green-700">
                        {formatNumber(ppnAmount)}
                      </td>
                    </tr>
                    <tr className="bg-blue-50 font-bold">
                      <td
                        colSpan="3"
                        className="border border-slate-300 px-3 py-2 text-right text-blue-700"
                      >
                        Jumlah Bersih
                      </td>
                      <td className="border border-slate-300 px-3 py-2 text-right text-blue-700">
                        {formatNumber(netAmount)}
                      </td>
                    </tr>
                  </>
                )}
              </tfoot>
            </table>

            {/* Terbilang */}
            <div className="bg-slate-50 border border-slate-300 p-3 mb-6 text-sm">
              <span className="font-medium">Terbilang: </span>
              <span className="italic">
                {terbilang(Math.round(netAmount > 0 ? netAmount : totalNominal))} Rupiah
              </span>
            </div>

            {/* Signatures - Using table for print compatibility */}
            <table
              className="signature-table"
              style={{ width: '100%', marginTop: '30px', borderCollapse: 'collapse' }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      border: 'none',
                      textAlign: 'center',
                      verticalAlign: 'top',
                      padding: '10px',
                      width: '33.33%',
                    }}
                  >
                    <p style={{ fontWeight: 'bold', marginBottom: '60px' }}>Penerima</p>
                    <div
                      style={{
                        borderTop: '1px solid #000',
                        display: 'inline-block',
                        minWidth: '150px',
                        paddingTop: '5px',
                      }}
                    >
                      (................................)
                    </div>
                  </td>
                  <td
                    style={{
                      border: 'none',
                      textAlign: 'center',
                      verticalAlign: 'top',
                      padding: '10px',
                      width: '33.33%',
                    }}
                  >
                    <p style={{ fontWeight: 'bold', marginBottom: '60px' }}>Bendahara</p>
                    <div
                      style={{
                        borderTop: '1px solid #000',
                        display: 'inline-block',
                        minWidth: '150px',
                        paddingTop: '5px',
                      }}
                    >
                      {schoolInfo?.bendahara || '(................................)'}
                    </div>
                  </td>
                  <td
                    style={{
                      border: 'none',
                      textAlign: 'center',
                      verticalAlign: 'top',
                      padding: '10px',
                      width: '33.33%',
                    }}
                  >
                    <p style={{ fontWeight: 'bold', marginBottom: '60px' }}>Kepala Sekolah</p>
                    <div
                      style={{
                        borderTop: '1px solid #000',
                        display: 'inline-block',
                        minWidth: '150px',
                        paddingTop: '5px',
                      }}
                    >
                      {schoolInfo?.kepala_sekolah || '(................................)'}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Cetak
          </button>
        </div>
      </div>
    </div>
  );
}
