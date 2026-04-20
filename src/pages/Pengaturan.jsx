import { useState, useEffect } from 'react';
import {
  Save,
  Lock,
  FileSignature,
  Upload,
  Trash2,
  School,
  UserCheck,
  FileText,
  CheckCircle,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { useArkasData } from '../hooks/useArkasData';
import { theme } from '../theme';

export default function Pengaturan() {
  const { school } = useArkasData();

  const [formData, setFormData] = useState({
    kepala_sekolah: '',
    nip_kepala: '',
    bendahara: '',
    nip_bendahara: '',
    nomor_sk: '',
    tanggal_sk: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const [sigData, setSigData] = useState({
    pptkNama: '',
    pptkNip: '',
    petugasRekonsNama: '',
    petugasRekonsNip: '',
    nomorBa: '',
    tanggalSurat: '',
    header1: '',
    header2: '',
    headerAlamat: '',
    headerTelepon: '',
    headerLaman: '',
    logoBase64: null,
    kabupaten: '',
    tempatRekonsiliasi: '',
  });
  const [savingSig, setSavingSig] = useState(false);
  const [sigMsg, setSigMsg] = useState(null);

  useEffect(() => {
    if (school) {
      setFormData({
        kepala_sekolah: school.kepala_sekolah || '',
        nip_kepala: school.nip_kepala || '',
        bendahara: school.bendahara || '',
        nip_bendahara: school.nip_bendahara || '',
        nomor_sk: school.nomor_sk || '',
        tanggal_sk: school.tanggal_sk || '',
      });
    }
  }, [school]);

  useEffect(() => {
    if (window.arkas?.getSignatoryData) {
      window.arkas
        .getSignatoryData()
        .then((res) => {
          if (res.success && res.data) setSigData((prev) => ({ ...prev, ...res.data }));
        })
        .catch((err) => console.error(err));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSigChange = (field, value) => setSigData((prev) => ({ ...prev, [field]: value }));

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSigData((prev) => ({ ...prev, logoBase64: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await window.arkas.saveSchoolInfo(formData);
      if (res.success) {
        setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' });
        if (window.arkas.reloadSchoolData) await window.arkas.reloadSchoolData();
      } else {
        setMessage({ type: 'error', text: 'Gagal menyimpan: ' + res.error });
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan sistem.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSig = async (e) => {
    e.preventDefault();
    setSavingSig(true);
    setSigMsg(null);
    try {
      if (window.arkas?.saveSignatoryData) {
        const result = await window.arkas.saveSignatoryData(sigData);
        if (result.success)
          setSigMsg({ type: 'success', text: 'Penandatangan BA berhasil disimpan!' });
        else setSigMsg({ type: 'error', text: 'Gagal menyimpan: ' + result.error });
      }
    } catch {
      setSigMsg({ type: 'error', text: 'Terjadi kesalahan sistem.' });
    } finally {
      setSavingSig(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Page Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-200">
          <Settings size={20} />
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
            KONFIGURASI SISTEM
          </span>
          <h2 className={theme.text.h2 + ' leading-tight'}>PENGATURAN APLIKASI</h2>
        </div>
      </div>

      {/* Card 1: Info Sekolah */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-blue-50/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <School size={15} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Informasi Sekolah</h3>
              <p className="text-[10px] text-slate-500">Data sekolah dari database ARKAS</p>
            </div>
            <span className={theme.badge.base + ' ' + theme.badge.neutral + ' ml-auto'}>
              READ-ONLY
            </span>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <span className={theme.text.label}>Nama Sekolah</span>
              <div className="font-semibold text-slate-800 text-sm mt-1">
                {school?.nama_sekolah || '-'}
              </div>
            </div>
            <div>
              <span className={theme.text.label}>NPSN</span>
              <div className="font-semibold text-slate-800 text-sm mt-1">{school?.npsn || '-'}</div>
            </div>
            <div>
              <span className={theme.text.label}>Alamat</span>
              <div className="font-semibold text-slate-800 text-sm mt-1">
                {school?.alamat || school?.alamat_jalan || '-'}
              </div>
            </div>
            <div>
              <span className={theme.text.label}>Lokasi</span>
              <div className="font-semibold text-slate-800 text-sm mt-1">
                {[school?.kecamatan, school?.kabupaten].filter(Boolean).join(', ') || '-'}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
            <Lock size={12} className="shrink-0" />
            <span>Data diambil dari database ARKAS dan tidak dapat diubah.</span>
          </div>
        </div>
      </div>

      {/* Card 2: Data Pejabat */}
      <form
        onSubmit={handleSave}
        className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div className="p-4 border-b border-slate-100 bg-indigo-50/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <UserCheck size={15} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Data Pejabat Sekolah</h3>
              <p className="text-[10px] text-slate-500">
                Nama dan NIP penandatangan laporan serta Berita Acara
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-5">
          {message && (
            <div
              className={
                'p-3 rounded-lg flex items-center gap-2 ' +
                (message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-rose-50 text-rose-700 border border-rose-100')
              }
            >
              {message.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              <span className="text-xs font-medium">{message.text}</span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Nama Kepala Sekolah
              </label>
              <input
                name="kepala_sekolah"
                value={formData.kepala_sekolah}
                onChange={handleChange}
                placeholder="Nama Kepala Sekolah"
                className={'w-full ' + theme.input.base}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                NIP Kepala Sekolah
              </label>
              <input
                name="nip_kepala"
                value={formData.nip_kepala}
                onChange={handleChange}
                placeholder="NIP Kepala Sekolah"
                className={'w-full ' + theme.input.base}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Nama Bendahara
              </label>
              <input
                name="bendahara"
                value={formData.bendahara}
                onChange={handleChange}
                placeholder="Nama Bendahara"
                className={'w-full ' + theme.input.base}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">NIP Bendahara</label>
              <input
                name="nip_bendahara"
                value={formData.nip_bendahara}
                onChange={handleChange}
                placeholder="NIP Bendahara"
                className={'w-full ' + theme.input.base}
              />
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nomor SK</label>
                <input
                  name="nomor_sk"
                  value={formData.nomor_sk}
                  onChange={handleChange}
                  placeholder="Contoh: 11.30/SMP.NL/6/VII/2025"
                  className={'w-full ' + theme.input.base}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tanggal SK</label>
                <input
                  name="tanggal_sk"
                  value={formData.tanggal_sk}
                  onChange={handleChange}
                  placeholder="Contoh: 01 Juli 2025"
                  className={'w-full ' + theme.input.base}
                />
              </div>
            </div>
            <div className="mt-3 bg-blue-50 border border-blue-100 p-2.5 rounded-lg text-[11px] text-blue-600 flex items-center gap-2">
              <FileText size={13} className="shrink-0" />
              <span>Data SK muncul otomatis di kalimat pembuka Berita Acara.</span>
            </div>
          </div>
        </div>
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 transition active:scale-95 disabled:opacity-50 shadow-sm"
          >
            {saving ? (
              'Menyimpan...'
            ) : (
              <>
                <Save size={14} /> Simpan Pengaturan
              </>
            )}
          </button>
        </div>
      </form>

      {/* Card 3: Penandatangan BA */}
      <form
        onSubmit={handleSaveSig}
        className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div className="p-4 border-b border-slate-100 bg-emerald-50/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <FileSignature size={15} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Penandatangan Berita Acara</h3>
              <p className="text-[10px] text-slate-500">
                Kop surat, nomor BA, dan penandatangan untuk BA Rekonsiliasi
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-5">
          {sigMsg && (
            <div
              className={
                'p-3 rounded-lg flex items-center gap-2 ' +
                (sigMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-rose-50 text-rose-700 border border-rose-100')
              }
            >
              {sigMsg.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              <span className="text-xs font-medium">{sigMsg.text}</span>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <span className={theme.text.label}>Logo &amp; Kop Surat</span>
              <div className="flex items-center gap-3">
                <label
                  className={
                    'flex items-center gap-2 px-3 py-2 ' +
                    theme.input.base +
                    ' cursor-pointer hover:bg-slate-100'
                  }
                >
                  <Upload size={14} /> <span className="text-xs">Pilih Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {sigData.logoBase64 && (
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    <img
                      src={sigData.logoBase64}
                      alt="Logo"
                      className="h-7 w-auto object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => handleSigChange('logoBase64', null)}
                      className="text-red-400 hover:text-red-600 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Baris 1</label>
                <input
                  value={sigData.header1}
                  onChange={(e) => handleSigChange('header1', e.target.value)}
                  placeholder="PEMERINTAH KABUPATEN TEMANGGUNG"
                  className={'w-full ' + theme.input.base}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Baris 2</label>
                <input
                  value={sigData.header2}
                  onChange={(e) => handleSigChange('header2', e.target.value)}
                  placeholder="DINAS PENDIDIKAN"
                  className={'w-full ' + theme.input.base}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Alamat</label>
                <input
                  value={sigData.headerAlamat}
                  onChange={(e) => handleSigChange('headerAlamat', e.target.value)}
                  placeholder="Jl. Pahlawan No. 100"
                  className={'w-full ' + theme.input.base}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Telepon / Fax
                  </label>
                  <input
                    value={sigData.headerTelepon}
                    onChange={(e) => handleSigChange('headerTelepon', e.target.value)}
                    placeholder="(0293) 491148"
                    className={'w-full ' + theme.input.base}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Laman / Email
                  </label>
                  <input
                    value={sigData.headerLaman}
                    onChange={(e) => handleSigChange('headerLaman', e.target.value)}
                    placeholder="dindikpora.go.id"
                    className={'w-full ' + theme.input.base}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <span className={theme.text.label}>Nomor &amp; Penandatangan</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Nomor Berita Acara
                  </label>
                  <input
                    value={sigData.nomorBa}
                    onChange={(e) => handleSigChange('nomorBa', e.target.value)}
                    placeholder="900/78/XII/BOS/2025"
                    className={'w-full ' + theme.input.base}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Tanggal Surat
                  </label>
                  <input
                    type="date"
                    value={sigData.tanggalSurat}
                    onChange={(e) => handleSigChange('tanggalSurat', e.target.value)}
                    className={'w-full ' + theme.input.base}
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                    <UserCheck size={11} className="text-blue-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">PPTK BOSP</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nama</label>
                    <input
                      value={sigData.pptkNama}
                      onChange={(e) => handleSigChange('pptkNama', e.target.value)}
                      placeholder="Nama PPTK"
                      className={'w-full ' + theme.input.base}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">NIP</label>
                    <input
                      value={sigData.pptkNip}
                      onChange={(e) => handleSigChange('pptkNip', e.target.value)}
                      placeholder="NIP PPTK"
                      className={'w-full ' + theme.input.base}
                    />
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center">
                    <CheckCircle size={11} className="text-emerald-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Petugas Rekonsiliasi</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nama</label>
                    <input
                      value={sigData.petugasRekonsNama}
                      onChange={(e) => handleSigChange('petugasRekonsNama', e.target.value)}
                      placeholder="Nama Petugas"
                      className={'w-full ' + theme.input.base}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">NIP</label>
                    <input
                      value={sigData.petugasRekonsNip}
                      onChange={(e) => handleSigChange('petugasRekonsNip', e.target.value)}
                      placeholder="NIP Petugas"
                      className={'w-full ' + theme.input.base}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="px-5 py-3 bg-emerald-50 border-t border-emerald-100 flex justify-end">
          <button
            type="submit"
            disabled={savingSig}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition active:scale-95 disabled:opacity-50 shadow-sm"
          >
            {savingSig ? (
              'Menyimpan...'
            ) : (
              <>
                <Save size={14} /> Simpan Penandatangan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
