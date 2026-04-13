import { formatRupiah } from '../../utils/transactionHelpers';

export default function TransactionClosing({
  year,
  selectedMonth,
  stats,
  calculatedSaldo,
  reportType,
}) {
  if (selectedMonth === 'SEMUA') return null;

  const lastDayOfMonth = new Date(year, parseInt(selectedMonth), 0).getDate();

  // Date formatting
  const dateObj = new Date(year, parseInt(selectedMonth) - 1, lastDayOfMonth);
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const dateString = dateObj.toLocaleDateString('id-ID', options);

  // Custom Footer for Tunai/Bank specific reports
  if (reportType === 'TUNAI') {
    return (
      <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-slate-800 font-semibold mb-1">
            Pada hari ini <span className="font-bold text-slate-900">{dateString}</span> Buku Kas
            Umum Ditutup dengan keadaan/posisi buku sebagai berikut :
          </h3>
        </div>
        <div className="grid grid-cols-[220px_10px_1fr] gap-y-1 text-sm font-bold text-slate-900">
          <div>Saldo Buku Kas Pembantu Tunai</div>
          <div>:</div>
          <div>{formatRupiah(stats?.saldo_tunai || 0)}</div>
        </div>
      </div>
    );
  }

  if (reportType === 'BANK') {
    return (
      <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-slate-800 font-semibold mb-1">
            Pada hari ini <span className="font-bold text-slate-900">{dateString}</span> Buku Kas
            Umum Ditutup dengan keadaan/posisi buku sebagai berikut :
          </h3>
        </div>
        <div className="grid grid-cols-[220px_10px_1fr] gap-y-1 text-sm font-bold text-slate-900">
          <div>Saldo Buku Kas Pembantu Bank</div>
          <div>:</div>
          <div>{formatRupiah(stats?.saldo_bank || 0)}</div>
        </div>
      </div>
    );
  }

  if (reportType === 'PAJAK') {
    return (
      <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-slate-800 font-semibold mb-1">
            Pada hari ini <span className="font-bold text-slate-900">{dateString}</span> Buku
            Pembantu Pajak Ditutup dengan keadaan/posisi buku sebagai berikut :
          </h3>
        </div>
        <div className="grid grid-cols-[220px_10px_1fr] gap-y-1 text-sm font-bold text-slate-900">
          <div>Saldo Buku Pembantu Pajak</div>
          <div>:</div>
          <div>{formatRupiah(calculatedSaldo || 0)}</div>
        </div>
      </div>
    );
  }

  // Default BKU Footer (Full Detail)
  // - Total (calculatedSaldo) is the accurate running balance from table
  // - Tunai comes from dashboard stats (cash flow calculation)
  // - Bank = Total - Tunai
  const saldoTunai = stats?.saldo_tunai || 0;
  const saldoBank = calculatedSaldo - saldoTunai;

  return (
    <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-slate-800 font-semibold mb-1">
          Pada hari ini <span className="font-bold text-slate-900">{dateString}</span> Buku Kas Umum
          Ditutup dengan keadaan/posisi buku sebagai berikut :
        </h3>
      </div>

      <div className="grid grid-cols-[180px_10px_1fr] gap-y-1 text-xs">
        {/* Saldo BKU */}
        <div className="font-bold">Saldo Buku Kas Umum</div>
        <div className="font-bold">:</div>
        <div className="font-bold">{formatRupiah(calculatedSaldo)}</div>
        {/* Terdiri Dari */}
        <div className="col-span-3 py-1 pl-4 italic text-slate-600">Terdiri Dari :</div>
        {/* Saldo Bank */}
        <div className="pl-4"> - Saldo Bank</div>
        <div>:</div>
        <div className="font-bold">{formatRupiah(saldoBank)}</div>
        {/* Saldo Tunai */}
        <div className="pl-4"> - Saldo Kas Tunai</div>
        <div>:</div>
        <div className="font-bold">{formatRupiah(saldoTunai)}</div>
        {/* Jumlah */}
        <div className="col-span-3 h-2"></div> {/* Spacer */}
        <div className="font-bold">Jumlah</div>
        <div className="font-bold">:</div>
        <div className="font-bold">{formatRupiah(calculatedSaldo)}</div>
      </div>
    </div>
  );
}
