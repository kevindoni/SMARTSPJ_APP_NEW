/**
 * Transaction Helper Functions
 * Extracted from TransactionList.jsx for cleaner code organization
 */

/**
 * Format number to Indonesian Rupiah currency
 * @param {number} number - The number to format
 * @returns {string} Formatted currency string
 */
export const formatRupiah = (number) => {
  if (number === null || number === undefined || isNaN(number) || !isFinite(number)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number);
};

/**
 * Indonesian month names for display
 */
export const MONTHS = [
  { id: '01', name: 'Januari' },
  { id: '02', name: 'Februari' },
  { id: '03', name: 'Maret' },
  { id: '04', name: 'April' },
  { id: '05', name: 'Mei' },
  { id: '06', name: 'Juni' },
  { id: '07', name: 'Juli' },
  { id: '08', name: 'Agustus' },
  { id: '09', name: 'September' },
  { id: '10', name: 'Oktober' },
  { id: '11', name: 'November' },
  { id: '12', name: 'Desember' },
];

/**
 * Determine if a transaction is a Receipt (Penerimaan) or Expense (Pengeluaran)
 * @param {object} tx - Transaction object with uraian, no_bukti, id_ref_bku
 * @returns {boolean} true = Penerimaan, false = Pengeluaran
 */
export const isPenerimaan = (tx) => {
  const desc = (tx.uraian || '').toLowerCase();

  // 1. Initial Balances are always Penerimaan
  if (desc.includes('saldo')) return true;

  // 2. PRIORITY KEYWORDS (Before ID checks)
  if (desc.includes('setor tunai')) return true; // Cash Deposit = Penerimaan
  if (desc.includes('pergeseran uang ke bank')) return false; // Transfer to Bank = Pengeluaran
  if (desc.includes('pergeseran uang di bank')) return true; // Debit = Penerimaan

  // 3. Strict Expense Prefix Priority: BPU (Pengeluaran), BNU (Nota)
  const noBukti = (tx.no_bukti || '').toUpperCase();
  if (noBukti.startsWith('BPU') || noBukti.startsWith('BNU')) return false;

  // 4. Strict Expense IDs (Takes precedence)
  // 1=Belanja, 3=Tarik Tunai, 5=BPU, 11=Setor Pajak, 13=Pindahan-
  const expenseIds = [1, 3, 5, 11, 13];
  if (expenseIds.some((id) => id == tx.id_ref_bku)) return false;

  // 5. ARKAS Receipt IDs:
  // 2=BOSP, 4=Setor Tunai (ke Bank = Penerimaan), 10=Pungut Pajak, 12=Giro, 14=Pindahan+, 26/28=Bunga Bank
  const receiptIds = [2, 4, 10, 12, 14, 26, 28];
  if (receiptIds.some((id) => id == tx.id_ref_bku)) return true;

  // 6. Keywords Fallback
  if (desc.includes('terima') || desc.includes('penerimaan')) return true;
  if (desc.includes('giro') || desc.includes('bunga bank')) return true;
  if (desc.includes('pengembalian') || desc.includes('pungut')) return true;

  return false;
};

/**
 * Transaction type filter options
 */
export const FILTER_OPTIONS = [
  { id: 'TRANSAKSI', label: 'Transaksi Umum (Non-Pajak)' },
  { id: 'PAJAK_PUNGUT', label: 'Pajak Pungut (Terima)' },
  { id: 'PAJAK_SETOR', label: 'Pajak Setor (Keluar)' },
  { id: 'BUNGA', label: 'Pendapatan Bunga Bank' },
  { id: 'PAJAK_BUNGA', label: 'Pajak Bunga' },
  { id: 'SALDO', label: 'Saldo & Transfer' },
];
