import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet } from 'lucide-react';

// Skeleton navigasi (Task 3.2). Baru 2 item: Dashboard & Aset, karena
// "Transaksi" dan "Laporan" saat ini masih berupa tab internal di dalam
// Dashboard.jsx (lihat state `tab` di Dashboard.jsx). Nav akan diperluas
// jadi 4 item (Dashboard, Transaksi, Aset, Laporan) di Task 3.4 saat
// Dashboard resmi diredesain jadi ringkas & tab-tab tsb dipisah.
const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/aset', label: 'Aset', icon: Wallet, end: false },
];

export default function BottomNav() {
  return (
    <nav style={styles.nav} className="dompet-bottom-nav">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          style={({ isActive }) => ({
            ...styles.item,
            color: isActive ? 'var(--accent)' : 'var(--text-muted)',
          })}
        >
          <Icon size={20} />
          <span style={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

const styles = {
  nav: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    background: 'var(--bg-card)',
    borderTop: '1px solid var(--bg-card2)',
    display: 'flex',
    maxWidth: 480,
    margin: '0 auto',
    zIndex: 50,
  },
  item: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    textDecoration: 'none',
    fontSize: 11,
    fontWeight: 600,
  },
  label: {
    lineHeight: 1,
  },
};
