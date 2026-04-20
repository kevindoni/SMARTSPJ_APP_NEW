import {
  LayoutDashboard,
  BookOpen,
  PieChart,
  Printer,
  Settings,
  Receipt,
  Landmark,
  FileBarChart,
  Wallet,
  FileSignature,
  Table,
  ClipboardList,
  FileStack,
  Scale,
  Info,
  HardDrive,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const isElectron = typeof window !== 'undefined' && window.arkas;

export default function Sidebar({ activeTab, setActiveTab }) {
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    if (!isElectron) return;
    window.arkas?.getAppVersion?.()
      .then((v) => setAppVersion(v.appVersion))
      .catch(() => setAppVersion(''));
  }, []);

  const menuGroups = [
    {
      title: null,
      items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      title: 'PENGANGGARAN',
      items: [
        { id: 'kertas-kerja', label: 'Kertas Kerja (RKAS)', icon: Table },
        { id: 'realisasi-belanja', label: 'Realisasi Belanja', icon: PieChart },
      ],
    },
    {
      title: 'PENATAUSAHAAN',
      items: [
        { id: 'transactions', label: 'Buku Kas Umum', icon: BookOpen },
        { id: 'cash-report', label: 'Buku Pembantu Tunai', icon: Wallet },
        { id: 'bank-report', label: 'Buku Pembantu Bank', icon: Landmark },
        { id: 'tax-report', label: 'Buku Pembantu Pajak', icon: PieChart },
        { id: 'nota-groups', label: 'Bukti Transaksi', icon: FileStack },
      ],
    },
    {
      title: 'LAPORAN',
      items: [
        { id: 'reconciliation', label: 'BA Rekonsiliasi', icon: FileBarChart },
        { id: 'bank-reconciliation', label: 'Rekonsiliasi Bank', icon: Scale },
        { id: 'sptjm', label: 'Cetak SPTJM', icon: FileSignature },
        { id: 'k7-report', label: 'Laporan K7 / K7a', icon: ClipboardList },
        { id: 'register-kas', label: 'Register Kas', icon: Printer },
      ],
    },
    {
      title: 'LAINNYA',
      items: [
        { id: 'backup-restore', label: 'Backup & Restore', icon: HardDrive },
        { id: 'settings', label: 'Pengaturan', icon: Settings },
        { id: 'about', label: 'Tentang Aplikasi', icon: Info },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
      {/* Brand */}
      <div className="p-5 h-[72px] flex items-center gap-3 border-b border-slate-100/60">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30 ring-1 ring-white/20">
          S
        </div>
        <div>
          <h1 className="text-slate-800 font-bold text-base tracking-tight leading-none">SmartSPJ</h1>
          {isElectron && (
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">
              Desktop Edition
            </p>
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 custom-scrollbar">
        {menuGroups.map((group, idx) => (
          <div key={idx}>
            {group.title && (
              <h3 className="px-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                {group.title}
              </h3>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 group relative overflow-hidden ${isActive ? 'text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                  >
                    {isActive && <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 z-0" />}
                    <Icon size={17} className={`relative z-10 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105 text-slate-400 group-hover:text-blue-500'}`} strokeWidth={isActive ? 2.5 : 2} />
                    <span className={`relative z-10 ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {isElectron && appVersion && (
        <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-[10px] text-center text-slate-400">
          <p className="font-medium text-slate-500">SmartSPJ v{appVersion}</p>
        </div>
      )}
    </aside>
  );
}