/**
 * Kertas Kerja Constants and Helpers
 * Extracted from KertasKerja components for code reuse
 */

/**
 * SNP (Standar Nasional Pendidikan) mapping
 * Maps activity code prefix to standard name
 */
export const STANDARDS_MAP = {
  '01': 'Standar Kompetensi Lulusan',
  '02': 'Standar Isi',
  '03': 'Standar Proses',
  '04': 'Standar Pendidik dan Tenaga Kependidikan',
  '05': 'Standar Sarana dan Prasarana',
  '06': 'Standar Pengelolaan',
  '07': 'Standar Pembiayaan',
  '08': 'Standar Penilaian Pendidikan',
};

/**
 * Fund Source column definitions for Annual report
 */
export const SOURCE_COLUMNS = [
  { key: 'BOSP REGULER', label: 'BOSP REGULER' },
  { key: 'BOSP DAERAH', label: 'BOSP DAERAH' },
  { key: 'AFIRMASI', label: 'AFIRMASI / KINERJA' },
  { key: 'SILPA', label: 'SILPA' },
  { key: 'LAINNYA', label: 'BOSP LAINNYA' },
];

/**
 * Group budget items by activity code hierarchy (L1 > L2 > L3)
 * @param {Array} items - Budget items with kode_kegiatan
 * @returns {Object} Grouped data structure
 */
export const groupByActivityCode = (items) => {
  const grouped = {};

  items.forEach((item) => {
    const parts = (item.kode_kegiatan || '').split('.');
    const codeL1 = parts[0] || 'XX';
    const codeL2 = parts[1] ? `${parts[0]}.${parts[1]}` : `${codeL1}.XX`;
    const codeL3 = item.kode_kegiatan;

    if (!grouped[codeL1]) {
      grouped[codeL1] = {
        name: STANDARDS_MAP[codeL1] || `Standar ${codeL1}`,
        l2: {},
      };
    }
    if (!grouped[codeL1].l2[codeL2]) {
      grouped[codeL1].l2[codeL2] = { name: '', l3: {} };
    }
    if (!grouped[codeL1].l2[codeL2].l3[codeL3]) {
      grouped[codeL1].l2[codeL2].l3[codeL3] = {
        name: item.nama_kegiatan,
        items: [],
      };
    }

    grouped[codeL1].l2[codeL2].l3[codeL3].items.push(item);
  });

  return grouped;
};
