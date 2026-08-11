import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './Dashboard';
import BottomNav from './BottomNav';
import AssetsHome from '../pages/assets/AssetsHome';
import AssetsSaving from '../pages/assets/AssetsSaving';
import AssetsGold from '../pages/assets/AssetsGold';
import AssetsMutualFund from '../pages/assets/AssetsMutualFund';
import AssetsDeposit from '../pages/assets/AssetsDeposit';

// AppShell = pembungkus routing untuk user yang sudah login (non-admin).
// Dashboard.jsx TIDAK diubah sama sekali di sini -- tetap dirender persis
// seperti sebelumnya di route "/". Route "/aset/*" murni tambahan baru.
export default function AppShell({ user, onLogout }) {
  const location = useLocation();
  // BottomNav SENGAJA cuma tampil di halaman /aset/* untuk sekarang.
  // Dashboard.jsx sudah punya FAB sendiri di bottom:24px yang akan
  // bentrok visual kalau BottomNav dipaksa tampil di sana juga --
  // integrasi nav ke Dashboard itu jatah Task 3.4 (redesign Dashboard),
  // bukan task ini, supaya Dashboard.jsx benar-benar tidak disentuh dulu.
  const showBottomNav = location.pathname.startsWith('/aset');

  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard user={user} onLogout={onLogout} />} />
        <Route path="/aset" element={<AssetsHome user={user} />} />
        <Route path="/aset/tabungan" element={<AssetsSaving user={user} />} />
        <Route path="/aset/emas" element={<AssetsGold user={user} />} />
        <Route path="/aset/reksadana" element={<AssetsMutualFund user={user} />} />
        <Route path="/aset/deposito" element={<AssetsDeposit user={user} />} />
        {/* Fallback: URL tidak dikenal -> balik ke Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showBottomNav && <BottomNav />}
    </>
  );
}
