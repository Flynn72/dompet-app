import React from 'react';
import { Home, Wallet, PieChart, Settings, TrendingUp } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'investment', label: 'Investasi', icon: TrendingUp },
    { id: 'budget', label: 'Anggaran', icon: PieChart },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#0a1128] border-r border-blue-900/30 h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
          Dompet App
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 font-medium border border-blue-500/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}