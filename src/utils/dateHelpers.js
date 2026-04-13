const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/**
 * Format a YYYY-MM-DD date string to Indonesian long date format.
 * Uses manual parsing to avoid timezone issues with new Date('YYYY-MM-DD').
 */
export function formatDateIndonesian(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTH_NAMES_ID[m - 1]} ${y}`;
}

export { MONTH_NAMES_ID };
