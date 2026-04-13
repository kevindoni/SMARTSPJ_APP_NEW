export const RECONCILIATION_COLUMNS = [
  // --- FIXED COLUMNS ---
  {
    id: 'no',
    label: 'NO',
    accessor: (row) => row.month || row.quarter || row.semester || '',
    sticky: 'left',
    width: '40px',
    rowSpan: 3,
    className: 'text-center',
  },
  {
    id: 'bulan',
    label: 'BULAN',
    accessor: (row) => row.monthName || row.label,
    sticky: 'left',
    leftOffset: '40px',
    width: '120px',
    rowSpan: 3,
    className: 'text-left font-medium',
  },

  // --- SALDO AWAL (GROUP) ---
  {
    id: 'saldo_awal',
    label: 'SALDO AWAL',
    colSpan: 12,
    color: 'slate',
    subColumns: [
      {
        id: 'sa_pjk',
        label: 'Pjk Htg',
        accessor: 'pajakHutang.opening',
        format: 'currency',
        width: '60px',
        rowSpan: 2,
      },
      {
        id: 'sa_kinerja',
        label: 'KINERJA',
        colSpan: 2,
        subColumns: [
          {
            id: 'sa_kin_bank',
            label: 'Bank',
            accessor: 'opening.details.kinerja.bank',
            format: 'currency',
          },
          {
            id: 'sa_kin_tunai',
            label: 'Tunai',
            accessor: 'opening.details.kinerja.tunai',
            format: 'currency',
          },
        ],
      },
      {
        id: 'sa_lainnya',
        label: 'DANA LAINNYA',
        colSpan: 2,
        subColumns: [
          {
            id: 'sa_lain_bank',
            label: 'Bank',
            accessor: 'opening.details.lainnya.bank',
            format: 'currency',
          },
          {
            id: 'sa_lain_tunai',
            label: 'Tunai',
            accessor: 'opening.details.lainnya.tunai',
            format: 'currency',
          },
        ],
      },
      {
        id: 'sa_reguler',
        label: 'BOS REGULER',
        colSpan: 2,
        subColumns: [
          {
            id: 'sa_reg_bank',
            label: 'Bank',
            accessor: 'opening.details.reguler.bank',
            format: 'currency',
          },
          {
            id: 'sa_reg_tunai',
            label: 'Tunai',
            accessor: 'opening.details.reguler.tunai',
            format: 'currency',
          },
        ],
      },
      {
        id: 'sa_silpa',
        label: 'SILPA KINERJA',
        colSpan: 2,
        subColumns: [
          {
            id: 'sa_silpa_bank',
            label: 'Bank',
            accessor: 'opening.details.silpaKinerja.bank',
            format: 'currency',
          },
          {
            id: 'sa_silpa_tunai',
            label: 'Tunai',
            accessor: 'opening.details.silpaKinerja.tunai',
            format: 'currency',
          },
        ],
      },
      {
        id: 'sa_total_split',
        label: 'SALDO BOS',
        colSpan: 2,
        subColumns: [
          {
            id: 'sa_tot_bank',
            label: 'Bank',
            accessor: 'opening.bank',
            format: 'currency',
            className: 'bg-slate-50',
          },
          {
            id: 'sa_tot_tunai',
            label: 'Tunai',
            accessor: 'opening.tunai',
            format: 'currency',
            className: 'bg-slate-50',
          },
        ],
      },
      {
        id: 'sa_total',
        label: 'JUMLAH',
        accessor: 'opening.total',
        rowSpan: 2,
        format: 'currency',
        className: 'font-bold bg-slate-100',
      },
    ],
  },

  // --- PENAMBAHAN (GROUP) ---
  {
    id: 'penambahan',
    label: 'PENAMBAHAN',
    colSpan: 6,
    color: 'blue',
    subColumns: [
      {
        id: 'in_reg1',
        label: 'Reg T1',
        accessor: 'income.regulerT1',
        rowSpan: 2,
        format: 'currency',
      },
      {
        id: 'in_reg2',
        label: 'Reg T2',
        accessor: 'income.regulerT2',
        rowSpan: 2,
        format: 'currency',
      },
      {
        id: 'in_kin',
        label: 'Kinerja',
        accessor: 'income.kinerja',
        rowSpan: 2,
        format: 'currency',
      },
      { id: 'in_bunga', label: 'Bunga', accessor: 'income.bunga', rowSpan: 2, format: 'currency' },
      {
        id: 'in_pajak',
        label: 'Pajak',
        accessor: 'income.pajakPungut',
        rowSpan: 2,
        format: 'currency',
      },
      {
        id: 'in_total',
        label: 'TOTAL',
        accessor: 'income.total',
        rowSpan: 2,
        format: 'currency',
        className: 'font-bold bg-blue-50',
      },
    ],
  },

  // --- PENGURANGAN (GROUP) ---
  {
    id: 'pengurangan',
    label: 'PENGURANGAN',
    colSpan: 19,
    color: 'orange',
    subColumns: [
      // Belanja Barang Jasa
      {
        id: 'exp_bj',
        label: 'BELANJA BARANG JASA',
        colSpan: 5,
        subColumns: [
          {
            id: 'bj_lain',
            label: 'Lainnya',
            accessor: 'expenses.lainnya.barangJasa',
            format: 'currency',
          },
          {
            id: 'bj_reg',
            label: 'Reguler',
            accessor: 'expenses.reguler.barangJasa',
            format: 'currency',
          },
          {
            id: 'bj_silpa',
            label: 'Silpa',
            accessor: 'expenses.silpaKinerja.barangJasa',
            format: 'currency',
          },
          {
            id: 'bj_kin',
            label: 'Kinerja',
            accessor: 'expenses.kinerja.barangJasa',
            format: 'currency',
          },
          {
            id: 'bj_total',
            label: 'JML',
            accessor: 'expenses.barangJasa',
            format: 'currency',
            className: 'font-bold bg-orange-50',
          },
        ],
      },
      // Belanja Modal Mesin
      {
        id: 'exp_mm',
        label: 'BELANJA MODAL MESIN',
        colSpan: 5,
        subColumns: [
          {
            id: 'mm_lain',
            label: 'Lainnya',
            accessor: 'expenses.lainnya.modalMesin',
            format: 'currency',
          },
          {
            id: 'mm_reg',
            label: 'Reguler',
            accessor: 'expenses.reguler.modalMesin',
            format: 'currency',
          },
          {
            id: 'mm_silpa',
            label: 'Silpa',
            accessor: 'expenses.silpaKinerja.modalMesin',
            format: 'currency',
          },
          {
            id: 'mm_kin',
            label: 'Kinerja',
            accessor: 'expenses.kinerja.modalMesin',
            format: 'currency',
          },
          {
            id: 'mm_total',
            label: 'JML',
            accessor: 'expenses.modalMesin',
            format: 'currency',
            className: 'font-bold bg-orange-50',
          },
        ],
      },
      // Belanja Modal Aset
      {
        id: 'exp_ma',
        label: 'BELANJA MODAL ASET',
        colSpan: 5,
        subColumns: [
          {
            id: 'ma_lain',
            label: 'Lainnya',
            accessor: 'expenses.lainnya.modalAset',
            format: 'currency',
          },
          {
            id: 'ma_reg',
            label: 'Reguler',
            accessor: 'expenses.reguler.modalAset',
            format: 'currency',
          },
          {
            id: 'ma_silpa',
            label: 'Silpa',
            accessor: 'expenses.silpaKinerja.modalAset',
            format: 'currency',
          },
          {
            id: 'ma_kin',
            label: 'Kinerja',
            accessor: 'expenses.kinerja.modalAset',
            format: 'currency',
          },
          {
            id: 'ma_total',
            label: 'JML',
            accessor: 'expenses.modalAset',
            format: 'currency',
            className: 'font-bold bg-orange-50',
          },
        ],
      },
      {
        id: 'exp_jml_blj',
        label: 'JML BLJ',
        accessor: 'expenses.totalBelanja',
        rowSpan: 2,
        format: 'currency',
        className: 'font-bold bg-orange-100',
      },
      { id: 'exp_adm', label: 'Adm', accessor: 'expenses.admBank', rowSpan: 2, format: 'currency' },
      {
        id: 'exp_pajak',
        label: 'Pjk',
        accessor: 'expenses.pajakSetor',
        rowSpan: 2,
        format: 'currency',
      },
      {
        id: 'exp_total',
        label: 'TOTAL',
        accessor: 'expenses.total',
        rowSpan: 2,
        format: 'currency',
        className: 'font-bold bg-orange-200',
      },
    ],
  },

  // --- SALDO AKHIR (GROUP) ---
  {
    id: 'saldo_akhir',
    label: 'SALDO AKHIR',
    colSpan: 13,
    color: 'emerald',
    subColumns: [
      {
        id: 'sk_utang',
        label: 'Utang Pjk',
        accessor: 'pajakHutang.closing',
        format: 'currency',
        rowSpan: 2,
        width: '60px',
      },
      { id: 'sk_selisih', label: 'Selisih', accessor: (row) => (row.income?.bunga || 0) - (row.expenses?.admBank || 0), rowSpan: 2, width: '60px', format: 'currency' },
      {
        id: 'sk_lainnya',
        label: 'Lainnya',
        colSpan: 2,
        subColumns: [
          {
            id: 'sk_lain_bank',
            label: 'Bank',
            accessor: 'closing.details.lainnya.bank',
            format: 'currency',
          },
          {
            id: 'sk_lain_tunai',
            label: 'Tunai',
            accessor: 'closing.details.lainnya.tunai',
            format: 'currency',
          },
        ],
      },
      {
        id: 'sk_reguler',
        label: 'Reguler',
        colSpan: 2,
        subColumns: [
          {
            id: 'sk_reg_bank',
            label: 'Bank',
            accessor: 'closing.details.reguler.bank',
            format: 'currency',
          },
          {
            id: 'sk_reg_tunai',
            label: 'Tunai',
            accessor: 'closing.details.reguler.tunai',
            format: 'currency',
          },
        ],
      },
      {
        id: 'sk_silpa',
        label: 'Silpa',
        colSpan: 2,
        subColumns: [
          {
            id: 'sk_silpa_bank',
            label: 'Bank',
            accessor: 'closing.details.silpaKinerja.bank',
            format: 'currency',
          },
          {
            id: 'sk_silpa_tunai',
            label: 'Tunai',
            accessor: 'closing.details.silpaKinerja.tunai',
            format: 'currency',
          },
        ],
      },
      {
        id: 'sk_kinerja',
        label: 'Kinerja',
        colSpan: 2,
        subColumns: [
          {
            id: 'sk_kin_bank',
            label: 'Bank',
            accessor: 'closing.details.kinerja.bank',
            format: 'currency',
          },
          {
            id: 'sk_kin_tunai',
            label: 'Tunai',
            accessor: 'closing.details.kinerja.tunai',
            format: 'currency',
          },
        ],
      },
      {
        id: 'sk_total',
        label: 'TOTAL',
        colSpan: 3,
        subColumns: [
          {
            id: 'sk_tot_bank',
            label: 'Bank',
            accessor: 'closing.bank',
            format: 'currency',
            className: 'bg-emerald-50',
          },
          {
            id: 'sk_tot_tunai',
            label: 'Tunai',
            accessor: 'closing.tunai',
            format: 'currency',
            className: 'bg-emerald-50',
          },
          {
            id: 'sk_tot_total',
            label: 'TOTAL',
            accessor: 'closing.total',
            format: 'currency',
            className: 'font-bold bg-emerald-100',
          },
        ],
      },
    ],
  },
];
