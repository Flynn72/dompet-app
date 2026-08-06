import React from 'react';
import MainLayout from './layouts/MainLayout';
import DashboardSection from './sections/DashboardSection';
import { useDashboard } from './hooks/useDashboard';

export default function Dashboard({ session }) {
  const {
    loading,
    transactions,
    activeTab,
    setActiveTab,
    totalBalance,
    totalIncome,
    totalExpense
  } = useDashboard(session);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b19] text-white flex items-center justify-center">
        <p className="animate-pulse">Memuat data...</p>
      </div>
    );
  }

  return (
    <MainLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      username={session?.user?.user_metadata?.username || session?.user?.email}
    >
      {activeTab === 'dashboard' && (
        <DashboardSection 
          totalBalance={totalBalance} 
          totalIncome={totalIncome} 
          totalExpense={totalExpense} 
          transactions={transactions} 
        />
      )}
      {activeTab === 'investment' && <div className="text-white">Halaman Investasi</div>}
      {activeTab === 'budget' && <div className="text-white">Halaman Anggaran</div>}
      {activeTab === 'settings' && <div className="text-white">Halaman Pengaturan</div>}
    </MainLayout>
  );
}