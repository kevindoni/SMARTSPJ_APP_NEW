const MONTHS = [
  '',
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

function safeInList(items) {
  if (!items || items.length === 0) return "''";
  return items.map((id) => "'" + String(id).replace(/'/g, "''") + "'").join(',');
}

module.exports = { MONTHS, safeInList };
