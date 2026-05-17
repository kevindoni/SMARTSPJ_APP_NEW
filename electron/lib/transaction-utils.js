const fs = require('fs');
const path = require('path');
const os = require('os');

const PENERIMAAN_IDS = [2, 4, 10, 12, 14, 26, 28];
const PENGELUARAN_IDS = [1, 3, 5, 11, 13];
const NEUTRAL_IDS = [8, 9];

function atomicWriteJson(filePath, data) {
  const tmpDir = os.tmpdir();
  const tmpFile = path.join(tmpDir, `spj_${Date.now()}_${Math.random().toString(36).slice(2)}.tmp`);
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmpFile, filePath);
}

function isPenerimaan(tx) {
  const desc = (tx.uraian || '').toLowerCase();
  if (desc.includes('saldo')) return true;
  if (desc.includes('setor tunai')) return true;
  if (desc.includes('pergeseran uang ke bank')) return false;
  if (desc.includes('pergeseran uang di bank')) return true;
  const noBukti = (tx.no_bukti || '').toUpperCase();
  if (noBukti.startsWith('BPU') || noBukti.startsWith('BNU')) return false;
  if (PENGELUARAN_IDS.some((id) => id == tx.id_ref_bku)) return false;
  if (PENERIMAAN_IDS.some((id) => id == tx.id_ref_bku)) return true;
  if (desc.includes('terima') || desc.includes('penerimaan')) return true;
  if (desc.includes('giro') || desc.includes('bunga bank')) return true;
  if (desc.includes('pengembalian') || desc.includes('pungut')) return true;
  return false;
}

function idList(ids) {
  return ids.join(', ');
}

module.exports = {
  PENERIMAAN_IDS,
  PENGELUARAN_IDS,
  NEUTRAL_IDS,
  atomicWriteJson,
  isPenerimaan,
  idList,
};
