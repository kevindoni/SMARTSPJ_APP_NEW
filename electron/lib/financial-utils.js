const fr = (n) => Math.round(Number(n) || 0);
const frMul = (a, b) => Math.round(Number(a) * Number(b));
const frDiv = (a, b) => (b ? Math.round(Number(a) / Number(b)) : 0);

const TAX = {
  PPN: 0.11,
  PPH21: 0.05,
  PPH21_NPWP: 0.06,
  PPH23: 0.02,
  PPH23_4: 0.04,
  PPH4: 0.02,
  PAJAK_DAERAH: 0.10,
  FALLBACK: 0.05,
};

const calcPPN = (nominal) => fr(nominal * TAX.PPN);
const calcPPN_DPP = (nominal) => fr(fr(nominal / 1.11) * TAX.PPN);
const calcPPh21 = (nominal) => fr(nominal * TAX.PPH21);
const calcPPh23 = (nominal) => fr(nominal * TAX.PPH23);
const calcSSPD = (nominal) => fr(nominal * TAX.PAJAK_DAERAH);

function formatRupiah(number) {
  const safe = fr(number);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(safe);
}

const EXPENSE_IDS = [1, 3, 5, 11, 13];
const RECEIPT_IDS = [2, 4, 10, 12, 14, 26, 28];

const isPenerimaan = (tx) => {
  const desc = (tx.uraian || '').toLowerCase();
  if (desc.includes('saldo')) return true;
  if (desc.includes('setor tunai')) return true;
  if (desc.includes('pergeseran uang ke bank')) return false;
  if (desc.includes('pergeseran uang di bank')) return true;
  const noBukti = (tx.no_bukti || '').toUpperCase();
  if (noBukti.startsWith('BPU') || noBukti.startsWith('BNU')) return false;
  if (EXPENSE_IDS.some((id) => id == tx.id_ref_bku)) return false;
  if (RECEIPT_IDS.some((id) => id == tx.id_ref_bku)) return true;
  if (desc.includes('terima') || desc.includes('penerimaan')) return true;
  if (desc.includes('giro') || desc.includes('bunga bank')) return true;
  if (desc.includes('pengembalian') || desc.includes('pungut')) return true;
  return false;
};

module.exports = { fr, frMul, frDiv, TAX, calcPPN, calcPPN_DPP, calcPPh21, calcPPh23, calcSSPD, formatRupiah, isPenerimaan };
