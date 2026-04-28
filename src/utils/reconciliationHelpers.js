export const formatRupiah = (value) => {
  if (value === undefined || value === null || value === 0) return '-';
  return new Intl.NumberFormat('id-ID').format(value);
};

export const getNestedValue = (obj, path) => {
  if (typeof path === 'function') return path(obj);
  if (!path) return 0;
  return path
    .split('.')
    .reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : 0), obj);
};

export const flattenReconciliationData = (data) => {
  if (!data || !data.monthly) return [];

  const rows = [];

  // Helper to add row with type
  const addRow = (row, type) => {
    rows.push({ ...row, type }); // type: 'month', 'quarter', 'semester', 'annual'
  };

  // Q1
  addRow(data.monthly[0], 'month');
  addRow(data.monthly[1], 'month');
  addRow(data.monthly[2], 'month');
  addRow(data.quarterly[0], 'quarter');

  // Q2
  addRow(data.monthly[3], 'month');
  addRow(data.monthly[4], 'month');
  addRow(data.monthly[5], 'month');
  addRow(data.quarterly[1], 'quarter');

  // S1
  addRow(data.semester[0], 'semester');

  // Q3
  addRow(data.monthly[6], 'month');
  addRow(data.monthly[7], 'month');
  addRow(data.monthly[8], 'month');
  addRow(data.quarterly[2], 'quarter');

  // Q4
  addRow(data.monthly[9], 'month');
  addRow(data.monthly[10], 'month');
  addRow(data.monthly[11], 'month');
  addRow(data.quarterly[3], 'quarter');

  // S2
  addRow(data.semester[1], 'semester');

  // Annual
  addRow(data.annual, 'annual');

  return rows;
};

export const getRowStyle = (type) => {
  switch (type) {
    case 'quarter':
      return 'bg-amber-100 font-semibold';
    case 'semester':
      return 'bg-violet-100 font-bold text-violet-900';
    case 'annual':
      return 'bg-emerald-800 text-white font-bold';
    default:
      return 'hover:bg-slate-50 even:bg-white odd:bg-slate-50/30';
  }
};
