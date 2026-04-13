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

export default function Sidebar({ activeTab, setActiveTab }) {
  const [appVersion, setAppVersion] = useState('...');

  useEffect(() => {
    const loadVersion = async () => {
      try {
        if (window.arkas?.getAppVersion) {
          const v = await window.arkas.getAppVersion();
          setAppVersion(v.appVersion);
        }
      } catch {
        setAppVersion('1.0.0');
      }
    };
    loadVersion();
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
      <div className="p-6 h-[88px] flex items-center gap-3 border-b border-slate-100/60">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30 ring-1 ring-white/20">
          S
        </div>
        <div>
          <h1 className="text-slate-800 font-bold font-sans text-lg tracking-tight leading-none mb-0.5">
            SmartSPJ
          </h1>
          {typeof window !== 'undefined' && window.arkas && (
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider bg-slate-100 inline-block px-1.5 py-0.5 rounded-md">
              Desktop Edition
            </p>
          )}
        </div>
      </div>

      {/* Menu List */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
        {menuGroups.map((group, idx) => (
          <div key={idx}>
            {group.title && (
              <h3 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">
                {group.title}
              </h3>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden
                                        ${
                                          isActive
                                            ? 'text-white shadow-lg shadow-blue-500/25 ring-1 ring-white/20'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 z-0"></div>
                    )}

                    <Icon
                      size={18}
                      className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 text-slate-400 group-hover:text-blue-500'}`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <span className={`relative z-10 ${isActive ? 'font-semibold' : ''}`}>
                      {item.label}
                    </span>

                    {isActive && (
                      <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse z-10"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      {typeof window !== 'undefined' && window.arkas && (
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-[10px] text-center text-slate-400 backdrop-blur-sm">
          <p className="font-medium text-slate-500">SmartSPJ v{appVersion}</p>
          <p>Terintegrasi dengan ARKAS</p>
        </div>
      )}
    </aside>
  );
}
