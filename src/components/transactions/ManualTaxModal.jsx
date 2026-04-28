import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ManualTaxModal({ isOpen, onClose, year, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    jenis_input: 'saldo_awal_tahun',
    jenis_pajak: 'PPN',
    nominal: '',
    keterangan: '',
    position: 'pungutan',
    tanggal: new Date().toISOString().split('T')[0],
    no_bukti: '',
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm((prev) => ({
        ...prev,
        tanggal: new Date().toISOString().split('T')[0],
        // Keep other defaults or reset if needed, but usually preserving type is fine.
        // Resetting critical fields:
        nominal: '',
        keterangan: '',
        no_bukti: '',
      }));
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-set position logic
      if (name === 'jenis_input' && value !== 'transaksi') {
        updated.position = 'pungutan';
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!form.nominal || parseFloat(form.nominal) <= 0) {
      toast.error('Nominal harus lebih dari 0');
      return;
    }
    if (!form.keterangan.trim()) {
      toast.error('Keterangan tidak boleh kosong');
      return;
    }

    setIsSaving(true);
    try {
      const entry = {
        ...form,
        nominal: parseFloat(form.nominal),
        year: year,
      };

      const result = await window.arkas.saveManualTax(entry);
      if (result.success) {
        toast.success('Data pajak manual berhasil disimpan');
        onSave(); // Refresh parent
        onClose();
      } else {
        toast.error(`Gagal menyimpan: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error menyimpan data pajak manual');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-4 sm:my-8 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[calc(100vh-2rem)]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Input Pajak Manual</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Jenis Input */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Jenis Input</label>
            <select
              name="jenis_input"
              value={form.jenis_input}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            >
              <option value="saldo_awal_tahun">Saldo Awal Tahun (Hutang dari Tahun Lalu)</option>
              <option value="hutang_bulan">Hutang Pajak Bulan (Lupa Bayar)</option>
              <option value="transaksi">Transaksi Manual</option>
            </select>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {form.jenis_input === 'saldo_awal_tahun' && (
                <span>📌 Hutang pajak dari tahun sebelumnya yang terbawa ke tahun ini.</span>
              )}
              {form.jenis_input === 'hutang_bulan' && (
                <span>📌 Pajak bulan tertentu yang lupa/belum dibayar.</span>
              )}
              {form.jenis_input === 'transaksi' && (
                <span>
                  📌 Pungutan (+) untuk pajak tambahan, Setoran (-) untuk pembayaran hutang.
                </span>
              )}
            </p>
          </div>

          {/* Jenis Pajak */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Jenis Pajak</label>
            <select
              name="jenis_pajak"
              value={form.jenis_pajak}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            >
              <option value="PPN">PPN</option>
              <option value="PPh 21">PPh 21</option>
              <option value="PPh 23">PPh 23</option>
              <option value="PPh 4(2)">PPh 4(2)</option>
              <option value="Pajak Daerah">Pajak Daerah</option>
            </select>
          </div>

          {/* Posisi */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Posisi</label>
            {form.jenis_input === 'transaksi' ? (
              <div className="flex gap-3">
                <label
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${form.position === 'pungutan' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300'}`}
                >
                  <input
                    type="radio"
                    name="position"
                    value="pungutan"
                    checked={form.position === 'pungutan'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <span className="font-bold text-emerald-600">+ Pungutan</span>
                </label>
                <label
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${form.position === 'setoran' ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-red-300'}`}
                >
                  <input
                    type="radio"
                    name="position"
                    value="setoran"
                    checked={form.position === 'setoran'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <span className="font-bold text-red-600">- Setoran</span>
                </label>
              </div>
            ) : (
              <div className="p-3 rounded-lg border-2 border-emerald-500 bg-emerald-50 text-center">
                <span className="font-bold text-emerald-600">+ Pungutan</span>
                <span className="text-xs text-slate-500 ml-2">(Hutang)</span>
              </div>
            )}
          </div>

          {/* Tanggal */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Tanggal</label>
            <input
              type="date"
              name="tanggal"
              value={form.tanggal}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
          </div>

          {/* Nominal */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Nominal (Rp)</label>
            <input
              type="number"
              name="nominal"
              value={form.nominal}
              onChange={handleInputChange}
              placeholder="Contoh: 1500000"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
          </div>

          {/* Keterangan */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Keterangan</label>
            <textarea
              name="keterangan"
              value={form.keterangan}
              onChange={handleInputChange}
              placeholder="Contoh: Sisa PPh 21 Bulan Desember 2024"
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
            />
          </div>

          {/* No Bukti (Optional) */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">
              No. Bukti (Opsional)
            </label>
            <input
              type="text"
              name="no_bukti"
              value={form.no_bukti}
              onChange={handleInputChange}
              placeholder="Contoh: MANUAL-001"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-4 flex justify-end gap-3 border-t border-slate-200 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
          >
            <Save size={16} />
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}
