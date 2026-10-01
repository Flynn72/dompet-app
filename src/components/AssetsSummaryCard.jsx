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

export default function AssetsSummaryCard() {
  const navigate = useNavigate();
  // marketByType = nilai PASAR sekarang per jenis aset, dari RPC get_portfolio_summary
  // (sama seperti dipakai di AssetsHome.jsx) -- dipakai buat baris list di bawah.
  // "total" (modal) tetap dipertahankan buat headline "Total Modal Keseluruhan".
  const [marketByType, setMarketByType] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      // 1. Modal Bersih (headline atas) -- dihitung manual dari akun+transaksi
      const { data: accounts } = await supabase.from('asset_accounts').select('id, asset_type, is_active');
      const { data: txs } = await supabase.from('asset_transactions').select('asset_account_id, amount, action');

      // 2. Nilai Pasar sekarang (buat baris per kategori) -- dari RPC yang sama
      //    dipakai halaman Aset, bukan dihitung manual
      const { data: rpcData } = await supabase.rpc('get_portfolio_summary');

      if (!mounted) return;

      let summary = { saving: 0, gold: 0, mutual_fund: 0, deposit: 0 };
      let grandTotal = 0;
      let marketSummary = { saving: 0, gold: 0, mutual_fund: 0, deposit: 0 };

      if (accounts && txs) {
        // Mapping ID akun ke jenis asetnya agar tidak tertukar
        const typeMap = {};
        accounts.forEach(acc => {
          // Hanya hitung akun yang tidak dihapus/dinonaktifkan
          if (acc.is_active !== false) {
             typeMap[acc.id] = acc.asset_type;
          }
        });

        // Kalkulasi Beli/Setor dikurangi Jual/Tarik
        txs.forEach(tx => {
          const assetType = typeMap[tx.asset_account_id];
          if (assetType) {
            const action = String(tx.action).toLowerCase();
            const amt = Number(tx.amount || 0);

            if (action === 'buy' || action === 'deposit') {
              summary[assetType] += amt;
            } else if (action === 'sell' || action === 'withdraw') {
              summary[assetType] -= amt;
            }
          }
        });

        // Menjumlahkan total semua kategori aset
        grandTotal = Object.values(summary).reduce((a, b) => a + b, 0);
      }

      if (rpcData) {
        rpcData.forEach((r) => {
          if (r.asset_type) marketSummary[r.asset_type] = r.total_current_value || 0;
        });
      }

      setMarketByType(marketSummary);
      setTotal(grandTotal);
      setLoading(false);
    })();

    return () => { mounted = false; };
  }, []);

  return (
    <div style={styles.card}>
      <button onClick={() => navigate('/aset')} style={styles.headerBtn}>
        <div>
          <div style={styles.headerLabel}>Total Modal Keseluruhan</div>
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
            {/* Nilai pasar sekarang (bukan modal) */}
            <div style={styles.rowValue}>{loading ? '...' : formatRupiah(marketByType[type] || 0)}</div>
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
