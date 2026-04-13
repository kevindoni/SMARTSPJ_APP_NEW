export const theme = {
  // Layout Containers
  card: 'bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden',
  cardHeader: 'px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white',
  cardBody: 'p-5',

  // Typography
  text: {
    h2: 'text-lg font-bold text-slate-800 tracking-tight',
    h3: 'text-sm font-bold text-slate-700 uppercase tracking-tight',
    label: 'text-[10px] font-bold text-slate-400 uppercase tracking-widest',
    body: 'text-slate-600 text-sm',
    subtle: 'text-slate-400 text-xs',
    mono: 'font-mono text-slate-500',
  },

  // Table Styles
  table: {
    wrapper: 'rounded-lg border border-slate-200 overflow-hidden',
    root: 'w-full text-left text-xs border-collapse table-fixed',
    thead: 'bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-200',
    th: 'px-3 py-3 text-[10px] uppercase tracking-wide font-bold break-words',
    tbody: 'divide-y divide-slate-100 bg-white',
    tr: 'hover:bg-slate-50/50 transition-colors',
    td: 'px-3 py-3 text-slate-600 break-words align-top',
    tdNumber: 'px-3 py-3 text-slate-600 text-right font-mono whitespace-nowrap align-top',
    tdCenter: 'px-3 py-3 text-slate-600 text-center align-top',
  },

  // Badges & Status
  badge: {
    base: 'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide inline-flex items-center justify-center gap-1.5 border',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    warning: 'bg-amber-50 text-amber-600 border-amber-100',
    danger: 'bg-red-50 text-red-600 border-red-100',
    info: 'bg-blue-50 text-blue-600 border-blue-100',
    neutral: 'bg-slate-100 text-slate-500 border-slate-200',
    primary: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  },

  // Buttons
  button: {
    base: 'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border',
    active: 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200',
    inactive:
      'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700',
    primary: 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700',
    ghost: 'bg-transparent text-slate-500 hover:bg-slate-50 border-transparent',
  },

  // Inputs
  input: {
    base: 'bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all',
    select:
      'bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-blue-400 cursor-pointer hover:bg-slate-100',
  },
};
