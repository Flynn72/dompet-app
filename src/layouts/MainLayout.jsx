import React from 'react';
import Sidebar from '../components/Sidebar';
import TopNavbar from '../components/TopNavbar';

export default function MainLayout({ children, activeTab, setActiveTab, username }) {
  return (
    <div className="min-h-screen bg-[#070b19] text-slate-200 font-sans flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
        <TopNavbar username={username} />
        <main className="p-6 md:px-8 space-y-6 overflow-y-auto pb-24 md:pb-6 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}