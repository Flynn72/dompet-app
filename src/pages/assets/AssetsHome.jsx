import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiggyBank, Coins, TrendingUp, Landmark, ChevronRight, TrendingUp as GainIcon, TrendingDown as LossIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import AssetPageShell from './AssetPageShell';
import RefreshPricesButton from './RefreshPricesButton';
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
  // marketByType = nilai PASAR sekarang per jenis aset (dipakai di breakdown list &
  // pie chart di bawah). Beda dari totalModal/totalMarket yang dipakai cuma buat
  // headline "Total Modal Keseluruhan" + untung/rugi keseluruhan di atas.
  const [marketByType, setMarketByType] = useState({});
  const [totalModal, setTotalModal] = useState(0);
  const [totalMarket, setTotalMarket] = useState(0);
  const [loading, setLoading] = useState(true);

  // Logika fetch diekstrak jadi fungsi biasa (dipakai bareng oleh fetch awal & tombol
  // "Refresh harga") supaya tidak duplikasi perhitungan modal/market di 2 tempat.
  async function fetchSummary() {
    // 1. Ambil harga pasar dari RPC untuk menghitung Return/Gain
    const { data: rpcData } = await supabase.rpc('get_portfolio_summary');

    // 2. Ambil raw data akun dan transaksi untuk menghitung Modal Bersih
    const { data: accounts } = await supabase.from('asset_accounts').select('id, asset_type, is_active');
    const { data: txs } = await supabase.from('asset_transactions').select('asset_account_id, amount, action');

    let modalSummary = { saving: 0, gold: 0, mutual_fund: 0, deposit: 0 };
    let marketSummary = { saving: 0, gold: 0, mutual_fund: 0, deposit: 0 };
    let calcTotalModal = 0;
    let calcTotalMarket = 0;

    // Hitung Modal Bersih dari Transaksi
    if (accounts && txs) {
      const typeMap = {};
      accounts.forEach(acc => {
        if (acc.is_active !== false) typeMap[acc.id] = acc.asset_type;
      });

      txs.forEach(tx => {
        const assetType = typeMap[tx.asset_account_id];
        if (assetType) {
          const action = String(tx.action).toLowerCase();
          const amt = Number(tx.amount || 0);

          if (action === 'buy' || action === 'deposit') {
            modalSummary[assetType] += amt;
          } else if (action === 'sell' || action === 'withdraw') {
            modalSummary[assetType] -= amt;
          }
        }
      });
      calcTotalModal = Object.values(modalSummary).reduce((a, b) => a + b, 0);
    }

    // Hitung Nilai Pasar dari RPC (untuk membandingkan untung/rugi)
    if (rpcData) {
      rpcData.forEach(r => {
        if (r.asset_type) {
          marketSummary[r.asset_type] = r.total_current_value || 0;
        }
      });
      calcTotalMarket = Object.values(marketSummary).reduce((a, b) => a + b, 0);
    }

    return { marketSummary, calcTotalModal, calcTotalMarket };
  }

  // Dipakai tombol "Refresh harga" -- selalu update state (aman, komponen pasti masih
  // mounted karena dipicu klik user, bukan efek awal yang bisa ke-interupsi navigasi).
  const load = React.useCallback(async () => {
    setLoading(true);
    const { marketSummary, calcTotalModal, calcTotalMarket } = await fetchSummary();
    setMarketByType(marketSummary);
    setTotalModal(calcTotalModal);
    setTotalMarket(calcTotalMarket);
    setLoading(false);
  }, []);

  // Fetch awal saat halaman dibuka -- pakai guard `mounted` sendiri, beda dari load()
  // di atas, supaya tidak setState kalau user keburu pindah halaman sebelum query selesai.
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { marketSummary, calcTotalModal, calcTotalMarket } = await fetchSummary();
      if (!mounted) return;
      setMarketByType(marketSummary);
      setTotalModal(calcTotalModal);
      setTotalMarket(calcTotalMarket);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  // Kalkulasi Return Keseluruhan (Pasar vs Modal)
  const totalGain = totalMarket - totalModal;
  const gainPct = totalModal > 0 ? (totalGain / totalModal) * 100 : 0;
  const gainPositive = totalGain >= 0;

  // Persiapkan Data untuk Diagram Donat berdasarkan NILAI PASAR (bukan modal lagi)
  const pieData = Object.entries(TYPE_META)
    .map(([type, meta]) => ({ type, name: meta.label, value: marketByType[type] || 0, color: meta.color }))
    .filter((d) => d.value > 0);
  const totalMarketForPct = pieData.reduce((a, d) => a + d.value, 0);

  return (
    <AssetPageShell title="Aset" rightAction={<RefreshPricesButton onRefreshed={load} />}>
      <div style={styles.summaryCard}>
        <div style={styles.summaryLabel}>Total Modal Keseluruhan</div>
        <div style={styles.summaryValue}>{loading ? '...' : formatRupiah(totalModal)}</div>
        {!loading && totalModal > 0 && (
          <div style={{ ...styles.gainRow, color: gainPositive ? '#7FE8A4' : '#FF9466' }}>
            {gainPositive ? <GainIcon size={13} /> : <LossIcon size={13} />}
            {gainPositive ? '+' : ''}{formatRupiah(totalGain)} ({gainPositive ? '+' : ''}{gainPct.toFixed(2)}% estimasi return pasar)
          </div>
        )}
      </div>

      {!loading && pieData.length > 0 && (
        <div style={styles.allocationCard}>
          <div style={styles.allocationHeader}>Alokasi Nilai Aset</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 96, height: 96, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={28} outerRadius={46} paddingAngle={2} stroke="none">
                    {pieData.map((d) => <Cell key={d.type} fill={d.color} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v) => formatRupiah(v)}
                    contentStyle={{ background: 'var(--bg-card2)', border: '1px solid #2A332B', borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pieData.map((d) => (
                <div key={d.type} style={styles.legendRow}>
                  <span style={{ width: 8, height: 8, borderRadius: 4, background: d.color, flexShrink: 0 }} />
                  <span style={styles.legendLabel}>{d.name}</span>
                  <span style={styles.legendPct}>{totalMarketForPct > 0 ? ((d.value / totalMarketForPct) * 100).toFixed(0) : 0}%</span>
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
              {/* Menampilkan NILAI PASAR sekarang (bukan modal) pada list */}
              {!loading && <div style={styles.rowValue}>{formatRupiah(marketByType[type] || 0)}</div>}
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
