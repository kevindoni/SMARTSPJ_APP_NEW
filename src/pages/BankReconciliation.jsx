import { useState, useEffect } from 'react';
import {
  Loader2,
  AlertCircle,
  Landmark,
  Download,
  Save,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { useFilter } from '../context/FilterContext';
import { formatRupiah } from '../utils/transactionHelpers';
import { toast, ToastContainer } from 'react-toastify';

export default function BankReconciliation() {
  const { year } = useFilter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [bankValues, setBankValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchData();
  }, [year]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await window.arkas.getBankReconciliation(year);
      if (res.success) {
        setData(res.data);
        setBankValues(res.data.savedValues || {});
      } else {
        setError(res.error || 'Gagal mengambil data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (Object.values(bankValues).some(v => v)) {
      toast.info("Menyimpan data rekonsiliasi bank...");
    }
    setSaving(true);
    setSaved(false);
    try {
      const res = await window.arkas.saveBankReconciliation(year, bankValues);
      if (res.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleBankValueChange = (month, rawValue) => {
    const digits = rawValue.replace(/\D/g, '');
    if (!digits) {
      setBankValues((prev) => {
        const next = { ...prev };
        delete next[month];
        return next;
      });
      return;
    }
    const num = parseInt(digits, 10);
    setBankValues((prev) => ({
      ...prev,
      [month]: num,
    }));
  };

  const parseNum = (val) => {
    if (!val && val !== 0) return 0;
    if (typeof val === 'number') return val;
    return parseInt(String(val).replace(/\D/g, ''), 10) || 0;
  };

  const formatInput = (val) => {
    if (!val && val !== 0) return '';
    const num = typeof val === 'number' ? val : parseNum(val);
    if (!num) return '';
    return num.toLocaleString('id-ID');
  };

  const months = data?.months || [];

  const getLastPopulatedMonth = () => {
    for (let i = months.length - 1; i >= 0; i--) {
      if (parseNum(bankValues[months[i].bulan]) > 0) return months[i];
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-red-600">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">
          Coba Lagi
        </button>
      </div>
    );
  }

  const lastPopulated = getLastPopulatedMonth();
  const lastBkuSaldo = lastPopulated
    ? lastPopulated.saldoAkhirBank
    : months.length > 0
      ? months[months.length - 1].saldoAkhirBank
      : 0;
  const lastBankSaldo = lastPopulated ? parseNum(bankValues[lastPopulated.bulan]) : 0;
  const lastSelisih = lastPopulated ? lastPopulated.saldoAkhirBank - lastBankSaldo : 0;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Landmark size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              PENATAUSAHAAN
            </span>
            <h2 className="text-lg font-bold text-slate-800">Rekonsiliasi Bank</h2>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium shadow-sm active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saved ? 'Tersimpan!' : 'Simpan Saldo Bank'}
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Landmark className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-emerald-800">
            <p className="font-semibold mb-1">Cara Menggunakan</p>
            <ol className="list-decimal list-inside space-y-0.5 text-emerald-700 text-xs">
              <li>
                Kolom <strong>Saldo BKU</strong> dihitung otomatis dari data Buku Kas Umum
              </li>
              <li>
                Masukkan <strong>Saldo Rekening Koran</strong> sesuai rekening asli dari bank
              </li>
              <li>
                Kolom <strong>Selisih</strong> akan otomatis menunjukkan perbedaan
              </li>
              <li>
                Klik <strong>Simpan</strong> untuk menyimpan data saldo rekening koran
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Saldo Bank BKU {lastPopulated ? `(${lastPopulated.nama})` : '(Akhir Tahun)'}
          </p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatRupiah(lastBkuSaldo)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Saldo Rekening Koran {lastPopulated ? `(${lastPopulated.nama})` : '(Akhir Tahun)'}
          </p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{formatRupiah(lastBankSaldo)}</p>
        </div>
        <div
          className={`rounded-xl shadow-sm border p-4 ${lastBankSaldo > 0 && Math.abs(lastSelisih) > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}
        >
          <p className="text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
            {lastBankSaldo > 0 && Math.abs(lastSelisih) > 0 ? (
              <>
                <AlertTriangle size={12} className="text-red-500" />
                <span className="text-red-600">
                  Selisih {lastPopulated ? lastPopulated.nama : ''}
                </span>
              </>
            ) : (
              <>
                <CheckCircle size={12} className="text-emerald-500" />
                <span className="text-emerald-600">
                  Selisih {lastPopulated ? lastPopulated.nama : ''}
                </span>
              </>
            )}
          </p>
          <p
            className={`text-2xl font-bold mt-1 ${lastBankSaldo > 0 && Math.abs(lastSelisih) > 0 ? 'text-red-700' : 'text-emerald-700'}`}
          >
            {lastBankSaldo > 0 ? formatRupiah(lastSelisih) : '-'}
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="px-3 py-3 text-left font-bold text-slate-600 w-8">No</th>
                <th className="px-3 py-3 text-left font-bold text-slate-600">Bulan</th>
                <th className="px-3 py-3 text-right font-bold text-slate-600">Saldo Awal Bank</th>
                <th className="px-3 py-3 text-right font-bold text-emerald-600">Penerimaan Bank</th>
                <th className="px-3 py-3 text-right font-bold text-red-600">Pengeluaran Bank</th>
                <th className="px-3 py-3 text-right font-bold text-slate-800 bg-slate-50">
                  Saldo BKU
                </th>
                <th className="px-3 py-3 text-right font-bold text-blue-700 bg-blue-50/50">
                  Saldo Rekening Koran
                </th>
                <th className="px-3 py-3 text-right font-bold">Selisih</th>
                <th className="px-3 py-3 text-center font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m, idx) => {
                const bankSaldo = parseNum(bankValues[m.bulan]);
                const selisih = m.saldoAkhirBank - bankSaldo;
                const isMatch = Math.abs(selisih) === 0 && bankSaldo > 0;
                const hasInput = bankSaldo > 0;

                return (
                  <tr
                    key={m.bulan}
                    className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  >
                    <td className="px-3 py-2.5 text-slate-500">{idx + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-700">{m.nama}</td>
                    <td className="px-3 py-2.5 text-right text-slate-600 tabular-nums">
                      {m.saldoAwalBank > 0 ? formatRupiah(m.saldoAwalBank) : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-emerald-700 tabular-nums">
                      {m.totalPenerimaanBank > 0 ? formatRupiah(m.totalPenerimaanBank) : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-red-700 tabular-nums">
                      {m.totalPengeluaranBank > 0 ? formatRupiah(m.totalPengeluaranBank) : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-800 tabular-nums bg-slate-50/50">
                      {formatRupiah(m.saldoAkhirBank)}
                    </td>
                    <td className="px-3 py-2 bg-blue-50/30">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatInput(bankValues[m.bulan])}
                        onChange={(e) => handleBankValueChange(m.bulan, e.target.value)}
                        placeholder="0"
                        className="w-full px-2 py-1 text-right text-sm border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white tabular-nums placeholder:text-slate-300"
                      />
                    </td>
                    <td
                      className={`px-3 py-2.5 text-right font-semibold tabular-nums ${!hasInput ? 'text-slate-400' : Math.abs(selisih) === 0 ? 'text-emerald-600' : 'text-red-600'}`}
                    >
                      {hasInput ? formatRupiah(selisih) : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {!hasInput ? (
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          Belum input
                        </span>
                      ) : isMatch ? (
                        <CheckCircle size={18} className="text-emerald-500 mx-auto" />
                      ) : (
                        <AlertTriangle size={18} className="text-red-500 mx-auto" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                <td className="px-3 py-3" colSpan="5"></td>
                <td className="px-3 py-3 text-right text-slate-800 tabular-nums">
                  {formatRupiah(lastBkuSaldo)}
                </td>
                <td className="px-3 py-3 text-right text-blue-700 bg-blue-50/50 tabular-nums">
                  {lastBankSaldo > 0 ? formatRupiah(lastBankSaldo) : '-'}
                </td>
                <td
                  className={`px-3 py-3 text-right tabular-nums ${lastBankSaldo > 0 && Math.abs(lastSelisih) > 0 ? 'text-red-700' : 'text-emerald-700'}`}
                >
                  {lastBankSaldo > 0 ? formatRupiah(lastSelisih) : '-'}
                </td>
                <td className="px-3 py-3 text-center">
                  {lastBankSaldo > 0 ? (
                    Math.abs(lastSelisih) === 0 ? (
                      <CheckCircle size={18} className="text-emerald-500 mx-auto" />
                    ) : (
                      <AlertTriangle size={18} className="text-red-500 mx-auto" />
                    )
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Detail Per Month */}
      {months.filter(
        (m) => m.saldoAkhirBank > 0 || m.totalPenerimaanBank > 0 || m.totalPengeluaranBank > 0
      ).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Detail Arus Kas Bank Bulanan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {months
              .filter(
                (m) =>
                  m.saldoAkhirBank > 0 || m.totalPenerimaanBank > 0 || m.totalPengeluaranBank > 0
              )
              .map((m) => {
                const bankSaldo = parseNum(bankValues[m.bulan]);
                const selisih = m.saldoAkhirBank - bankSaldo;

                return (
                  <div
                    key={m.bulan}
                    className={`rounded-lg border p-4 ${Math.abs(selisih) === 0 || !bankSaldo ? 'border-slate-200' : 'border-red-200 bg-red-50/30'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-slate-700">{m.nama}</h4>
                      {bankSaldo > 0 &&
                        (Math.abs(selisih) === 0 ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                            SESUAI
                          </span>
                        ) : (
                          <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                            SELISIH
                          </span>
                        ))}
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Saldo Awal Bank</span>
                        <span className="font-medium tabular-nums">
                          {formatRupiah(m.saldoAwalBank)}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-700">
                        <span>+ Penerimaan Bank</span>
                        <span className="font-medium tabular-nums">
                          {formatRupiah(m.totalPenerimaanBank)}
                        </span>
                      </div>
                      <div className="flex justify-between text-red-700">
                        <span>- Pengeluaran Bank</span>
                        <span className="font-medium tabular-nums">
                          {formatRupiah(m.totalPengeluaranBank)}
                        </span>
                      </div>
                      <div className="border-t border-slate-200 pt-1.5 flex justify-between">
                        <span className="font-semibold text-slate-700">Saldo Akhir BKU</span>
                        <span className="font-bold text-slate-800 tabular-nums">
                          {formatRupiah(m.saldoAkhirBank)}
                        </span>
                      </div>
                      {bankSaldo > 0 && (
                        <>
                          <div className="flex justify-between text-blue-700">
                            <span>Saldo Rekening Koran</span>
                            <span className="font-medium tabular-nums">
                              {formatRupiah(bankSaldo)}
                            </span>
                          </div>
                          <div
                            className={`border-t pt-1.5 flex justify-between font-bold ${Math.abs(selisih) === 0 ? 'text-emerald-600' : 'text-red-600'}`}
                          >
                            <span>Selisih</span>
                            <span className="tabular-nums">{formatRupiah(selisih)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
          <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
