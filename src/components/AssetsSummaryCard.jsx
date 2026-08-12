import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiggyBank, Coins, TrendingUp, Landmark, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

function formatRupiah(n) {
  return 'Rp' + Math.round(n || 0).toLocaleString('id-ID');
}

const TYPE_META = {
  saving: { label: 'Tabungan', icon: PiggyBank, color: '#6FB7E8', to: '/aset/tabungan' },
  gold: { label: 'Emas', icon: Coins, color: '#F5C95D', to: '/aset/emas' },
  mutual_fund: { label: 'Reksa Dana', icon: TrendingUp, color: '#7FE8A4', to: '/aset/reksadana' },
  deposit: { label: 'Deposito', icon: Landmark, color: '#C99FE8', to: '/aset/deposito' },
};

// Kartu "Assets Summary" untuk Dashboard (Task 3.4) -- menggantikan kartu
// pointer sederhana dari Task 3.3. Narik data asli dari get_portfolio_summary()
// (RPC Phase 2), breakdown per jenis aset + total, tiap baris bisa diklik
// langsung ke halaman detailnya.
export default function AssetsSummaryCard() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase.rpc('get_portfolio_summary');
      if (!mounted) return;
      if (!error && data) {
        setRows(data);
        setTotal(data.reduce((s, r) => s + (r.total_current_value || 0), 0));
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  const valueByType = Object.fromEntries(rows.map((r) => [r.asset_type, r.total_current_value]));

  return (
    <div style={styles.card}>
      <button onClick={() => navigate('/aset')} style={styles.headerBtn}>
        <div>
          <div style={styles.headerLabel}>Total Aset</div>
          <div style={styles.headerValue}>{loading ? '...' : formatRupiah(total)}</div>
        </div>
        <ChevronRight size={18} color="var(--text-muted)" />
      </button>

      <div style={styles.list}>
        {Object.entries(TYPE_META).map(([type, meta]) => (
          <button key={type} onClick={() => navigate(meta.to)} style={styles.row}>
            <div style={{ ...styles.iconWrap, background: `${meta.color}22`, color: meta.color }}>
              <meta.icon size={15} />
            </div>
            <div style={styles.rowLabel}>{meta.label}</div>
            <div style={styles.rowValue}>{loading ? '...' : formatRupiah(valueByType[type] || 0)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  card: { background: 'var(--bg-card)', borderRadius: 16, overflow: 'hidden' },
  headerBtn: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, background: 'transparent', border: 'none', borderBottom: '1px solid #22291F', cursor: 'pointer', textAlign: 'left',
  },
  headerLabel: { fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 },
  headerValue: { fontSize: 21, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" },
  list: { display: 'flex', flexDirection: 'column' },
  row: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px',
    background: 'transparent', border: 'none', borderBottom: '1px solid #1A201B', cursor: 'pointer', textAlign: 'left', width: '100%',
  },
  iconWrap: { width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowLabel: { flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' },
  rowValue: { fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' },
};
