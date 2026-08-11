import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiggyBank, Coins, TrendingUp, Landmark, ChevronRight } from 'lucide-react';
import AssetPageShell from './AssetPageShell';
import { supabase } from '../../lib/supabaseClient';

function formatRupiah(n) {
  return 'Rp' + Math.round(n || 0).toLocaleString('id-ID');
}

const ASSET_CATEGORIES = [
  { to: '/aset/tabungan', label: 'Tabungan', icon: PiggyBank, color: '#6FB7E8' },
  { to: '/aset/emas', label: 'Emas', icon: Coins, color: '#F5C95D' },
  { to: '/aset/reksadana', label: 'Reksa Dana', icon: TrendingUp, color: '#7FE8A4' },
  { to: '/aset/deposito', label: 'Deposito', icon: Landmark, color: '#C99FE8' },
];

export default function AssetsHome({ user }) {
  const navigate = useNavigate();
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.rpc('get_portfolio_total').then(({ data, error }) => {
      if (!mounted) return;
      if (!error) setTotal(data);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  return (
    <AssetPageShell title="Aset">
      <div style={styles.summaryCard}>
        <div style={styles.summaryLabel}>Total Aset</div>
        <div style={styles.summaryValue}>
          {loading ? '...' : formatRupiah(total)}
        </div>
      </div>

      <div style={styles.list}>
        {ASSET_CATEGORIES.map(({ to, label, icon: Icon, color }) => (
          <button key={to} style={styles.row} onClick={() => navigate(to)}>
            <div style={{ ...styles.iconWrap, background: `${color}22`, color }}>
              <Icon size={20} />
            </div>
            <div style={styles.rowLabel}>{label}</div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </button>
        ))}
      </div>
    </AssetPageShell>
  );
}

const styles = {
  summaryCard: {
    background: 'var(--bg-card)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'var(--text-muted)',
    fontWeight: 600,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--text-primary)',
    fontFamily: "'Space Grotesk', sans-serif",
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'var(--bg-card)',
    border: 'none',
    borderRadius: 14,
    padding: '14px 16px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowLabel: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
};
