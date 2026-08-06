import React from 'react';
import { Search, Bell } from 'lucide-react';

export default function TopNavbar({ username }) {
  return (
    <header className="flex justify-between items-center p-6 md:px-8 border-b border-blue-900/20 bg-[#070b19]">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white">Halo, {username || 'User'}! 👋</h2>
        <p className="text-sm text-slate-400 mt-0.5">Ringkasan keuanganmu hari ini</p>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2.5 bg-[#0f172a] rounded-full text-slate-300 hover:text-white border border-blue-900/30">
          <Search size={18} />
        </button>
        <button className="p-2.5 bg-[#0f172a] rounded-full text-slate-300 hover:text-white border border-blue-900/30 relative">
          <Bell size={18} />
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0f172a]"></span>
        </button>
      </div>
    </header>
  );
}