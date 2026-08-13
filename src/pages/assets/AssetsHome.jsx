import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiggyBank, Coins, TrendingUp, Landmark, ChevronRight, TrendingUp as GainIcon, TrendingDown as LossIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import AssetPageShell from './AssetPageShell';
import { supabase } from '../../lib/supabaseClient';

function formatRupiah(n) {
  return 'Rp' + Math.round(n || 0).toLocaleString('id-ID');
}

const TYPE_META = {
  saving: { label: 'Tabungan', icon: PiggyBank, color: '#6FB7E8', to: '/aset/tabungan' },
  gold: { label: 'Emas', icon: Coins, color: '#F5C95D', to: '/aset/emas' },
  mutual_fund: { label: 'Reksa Dana', icon: TrendingUp, color: '#7FE8A4', to: '/aset/reksadana' },
  deposit: { label: 'Deposito', icon: Landmark, color: '#C99FE8', to: '/aset/deposito' },
};

export default function AssetsHome({ user }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.rpc('get_portfolio_summary').then(({ data, error }) => {
      if (!mounted) return;
      if (!error && data) setRows(data);
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const total = rows.reduce((s, r) => s + (r.total_current_value || 0), 0);
  const totalInvested = rows.reduce((s, r) => s + (r.total_invested || 0), 0);
  const totalFloatingGain = rows.reduce((s, r) => s + (r.total_floating_gain || 0), 0);
  const totalRealizedGain = rows.reduce((s, r) => s + (r.total_realized_gain || 0), 0);
  const totalGain = totalFloatingGain + totalRealizedGain;
  const gainPct = totalInvested > 0 ? (totalFloatingGain / totalInvested) * 100 : 0;
  const gainPositive = totalGain >= 0;

  const valueByType = Object.fromEntries(rows.map((r) => [r.asset_type, r.total_current_value]));
  const pieData = Object.entries(TYPE_META)
    .map(([type, meta]) => ({ type, name: meta.label, value: valueByType[type] || 0, color: meta.color }))
    .filter((d) => d.value > 0);

  return (
    <AssetPageShell title="Aset">
      <div style={styles.summaryCard}>
        <div style={styles.summaryLabel}>Total Aset</div>
        <div style={styles.summaryValue}>{loading ? '...' : formatRupiah(total)}</div>
        {!loading && totalInvested > 0 && (
          <div style={{ ...styles.gainRow, color: gainPositive ? '#7FE8A4' : '#FF9466' }}>
            {gainPositive ? <GainIcon size={13} /> : <LossIcon size={13} />}
            {gainPositive ? '+' : ''}{formatRupiah(totalGain)} ({gainPositive ? '+' : ''}{gainPct.toFixed(2)}% belum direalisasi)
          </div>
        )}
      </div>

      {!loading && pieData.length > 0 && (
        <div style={styles.allocationCard}>
          <div style={styles.allocationHeader}>Alokasi Aset</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 96, height: 96, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={28} outerRadius={46} paddingAngle={2} stroke="none">
                    {pieData.map((d) => <Cell key={d.type} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={{ background: 'var(--bg-card2)', border: '1px solid #2A332B', borderRadius: 8, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pieData.map((d) => (
                <div key={d.type} style={styles.legendRow}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: d.color, flexShrink: 0 }} />
                  <span style={styles.legendLabel}>{d.name}</span>
                  <span style={styles.legendPct}>{total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={styles.list}>
        {Object.entries(TYPE_META).map(([type, meta]) => (
          <button key={type} style={styles.row} onClick={() => navigate(meta.to)}>
            <div style={{ ...styles.iconWrap, background: `${meta.color}22`, color: meta.color }}>
              <meta.icon size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.rowLabel}>{meta.label}</div>
              {!loading && <div style={styles.rowValue}>{formatRupiah(valueByType[type] || 0)}</div>}
            </div>
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
  gainRow: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, marginTop: 8 },
  allocationCard: { background: 'var(--bg-card)', borderRadius: 16, padding: 20, marginBottom: 16 },
  allocationHeader: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 14 },
  legendRow: { display: 'flex', alignItems: 'center', gap: 8 },
  legendLabel: { flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' },
  legendPct: { fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' },
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
    fontSize: 14.5,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  rowValue: {
    fontSize: 11.5,
    color: 'var(--text-muted)',
    marginTop: 2,
  },
};
