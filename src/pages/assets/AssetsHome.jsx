import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, Plus, Trash2, X, TrendingUp as GainIcon, TrendingDown as LossIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import AssetPageShell from './AssetPageShell';
import RefreshPricesButton from './RefreshPricesButton';
import { supabase } from '../../lib/supabaseClient';
import { INSTRUMENT_ORDER, INSTRUMENT_META, fetchInstrumentTypes, addInstrument, removeInstrument } from '../../lib/assetInstruments';

function formatRupiah(n) {
  return 'Rp' + Math.round(n || 0).toLocaleString('id-ID');
}

// Metadata 5 instrumen (Tabungan, Emas, Reksa Dana, Deposito, Obligasi) dipakai bareng
// dengan kartu Aset di Dashboard -- lihat src/lib/assetInstruments.js.
const TYPE_META = INSTRUMENT_META;

export default function AssetsHome({ user }) {
  const navigate = useNavigate();
  // marketByType = nilai PASAR sekarang per jenis aset (dipakai di breakdown list &
  // pie chart di bawah). Beda dari totalModal/totalMarket yang dipakai cuma buat
  // headline "Total Modal Keseluruhan" + untung/rugi keseluruhan di atas.
  const [marketByType, setMarketByType] = useState({});
  const [totalModal, setTotalModal] = useState(0);
  const [totalMarket, setTotalMarket] = useState(0);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  // Instrumen yang sudah ditambahkan user (tabel asset_instruments) + jumlah akun aktif per tipe.
  // Sebuah instrumen tampil kalau ada di daftar ini ATAU sudah punya akun aktif.
  const [instrumentTypes, setInstrumentTypes] = useState([]);
  const [accountCountByType, setAccountCountByType] = useState({});
  const [pickerOpen, setPickerOpen] = useState(!!(location.state && location.state.openPicker));
  const [pickerBusy, setPickerBusy] = useState(null);
  const [pickerError, setPickerError] = useState('');

  // Datang dari tombol "Tambah instrumen" di Dashboard -> picker sudah dibuka lewat state
  // awal di atas; bersihkan state navigasinya supaya tidak terbuka lagi saat refresh/back.
  useEffect(() => {
    if (location.state && location.state.openPicker) navigate('/aset', { replace: true, state: null });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Logika fetch diekstrak jadi fungsi biasa (dipakai bareng oleh fetch awal & tombol
  // "Refresh harga") supaya tidak duplikasi perhitungan modal/market di 2 tempat.
  async function fetchSummary() {
    // 1. Ambil harga pasar dari RPC untuk menghitung Return/Gain
    const { data: rpcData } = await supabase.rpc('get_portfolio_summary');

    // 2. Ambil raw data akun dan transaksi untuk menghitung Modal Bersih
    const { data: accounts } = await supabase.from('asset_accounts').select('id, asset_type, is_active');
    const { data: txs } = await supabase.from('asset_transactions').select('asset_account_id, amount, action');

    let modalSummary = { saving: 0, gold: 0, mutual_fund: 0, deposit: 0, bond: 0 };
    let marketSummary = { saving: 0, gold: 0, mutual_fund: 0, deposit: 0, bond: 0 };
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
            modalSummary[assetType] = (modalSummary[assetType] || 0) + amt;
          } else if (action === 'sell' || action === 'withdraw') {
            modalSummary[assetType] = (modalSummary[assetType] || 0) - amt;
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

    // Jumlah akun aktif per tipe + daftar instrumen yang sudah ditambahkan user. Kalau tabel
    // asset_instruments belum ada / query gagal, tetap jalan: daftar tampil berdasar akun saja.
    const accountCounts = {};
    (accounts || []).forEach((acc) => {
      if (acc.is_active !== false) accountCounts[acc.asset_type] = (accountCounts[acc.asset_type] || 0) + 1;
    });
    let instruments = [];
    try {
      instruments = await fetchInstrumentTypes();
    } catch (e) {
      console.warn('Gagal baca asset_instruments (tabel belum dibuat?):', e);
    }

    return { marketSummary, calcTotalModal, calcTotalMarket, accountCounts, instruments };
  }

  // Dipakai tombol "Refresh harga" -- selalu update state (aman, komponen pasti masih
  // mounted karena dipicu klik user, bukan efek awal yang bisa ke-interupsi navigasi).
  const load = React.useCallback(async () => {
    setLoading(true);
    const { marketSummary, calcTotalModal, calcTotalMarket, accountCounts, instruments } = await fetchSummary();
    setMarketByType(marketSummary);
    setTotalModal(calcTotalModal);
    setTotalMarket(calcTotalMarket);
    setAccountCountByType(accountCounts);
    setInstrumentTypes(instruments);
    setLoading(false);
  }, []);

  // Fetch awal saat halaman dibuka -- pakai guard `mounted` sendiri, beda dari load()
  // di atas, supaya tidak setState kalau user keburu pindah halaman sebelum query selesai.
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { marketSummary, calcTotalModal, calcTotalMarket, accountCounts, instruments } = await fetchSummary();
      if (!mounted) return;
      setMarketByType(marketSummary);
      setTotalModal(calcTotalModal);
      setTotalMarket(calcTotalMarket);
      setAccountCountByType(accountCounts);
      setInstrumentTypes(instruments);
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

  // Instrumen yang tampil di daftar: yang sudah ditambahkan user ATAU sudah punya akun aktif.
  const visibleTypes = INSTRUMENT_ORDER.filter((t) => instrumentTypes.includes(t) || (accountCountByType[t] || 0) > 0);

  async function handlePick(type) {
    setPickerError('');
    if (!visibleTypes.includes(type)) {
      setPickerBusy(type);
      try {
        await addInstrument(user && user.id, type);
        setInstrumentTypes((prev) => (prev.includes(type) ? prev : [...prev, type]));
      } catch (e) {
        console.error('Gagal menambah instrumen:', e);
        setPickerError('Gagal menyimpan instrumen. Pastikan SQL tabel asset_instruments sudah dijalankan di Supabase.');
        setPickerBusy(null);
        return;
      }
      setPickerBusy(null);
    }
    setPickerOpen(false);
    navigate(TYPE_META[type].to);
  }

  async function handleRemove(type) {
    if (!confirm(`Hapus instrumen "${TYPE_META[type].label}" dari daftar? Instrumen ini masih kosong, jadi tidak ada data yang hilang. Kamu bisa menambahkannya lagi kapan saja.`)) return;
    try {
      await removeInstrument(user && user.id, type);
      setInstrumentTypes((prev) => prev.filter((t) => t !== type));
    } catch (e) {
      alert(e.message || 'Gagal menghapus instrumen');
    }
  }

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
        {!loading && visibleTypes.length === 0 && (
          <div style={styles.emptyCard}>
            Belum ada instrumen aset. Tambahkan instrumen pertamamu, lalu isi akunnya di dalamnya.
          </div>
        )}
        {visibleTypes.map((type) => {
          const meta = TYPE_META[type];
          const count = accountCountByType[type] || 0;
          return (
            <div key={type} style={styles.rowWrap}>
              <button style={styles.row} onClick={() => navigate(meta.to)}>
                <div style={{ ...styles.iconWrap, background: `${meta.color}22`, color: meta.color }}>
                  <meta.icon size={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.rowLabel}>{meta.label}</div>
                  {/* Menampilkan NILAI PASAR sekarang (bukan modal) pada list */}
                  {!loading && (
                    <div style={styles.rowValue}>
                      {count === 0 ? 'Belum ada akun, buka untuk menambah' : formatRupiah(marketByType[type] || 0)}
                    </div>
                  )}
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </button>
              {!loading && count === 0 && (
                <button style={styles.removeBtn} onClick={() => handleRemove(type)} aria-label={`Hapus instrumen ${meta.label} dari daftar`}>
                  <Trash2 size={16} color="#6B7568" />
                </button>
              )}
            </div>
          );
        })}
        <button style={styles.addBtn} onClick={() => { setPickerError(''); setPickerOpen(true); }}>
          <Plus size={16} /> Tambah instrumen
        </button>
      </div>

      {pickerOpen && (
        <div style={styles.overlay} onClick={() => setPickerOpen(false)}>
          <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={styles.sheetHeader}>
              <span style={styles.sheetTitle}>Tambah instrumen</span>
              <button onClick={() => setPickerOpen(false)} style={styles.sheetClose} aria-label="Tutup"><X size={18} color="#9CA89F" /></button>
            </div>
            <div style={styles.sheetHint}>Pilih instrumen, lalu isi akunnya di halaman berikutnya.</div>
            {INSTRUMENT_ORDER.map((type) => {
              const meta = TYPE_META[type];
              const already = visibleTypes.includes(type);
              return (
                <button key={type} disabled={pickerBusy !== null} style={{ ...styles.pickRow, opacity: pickerBusy !== null && pickerBusy !== type ? 0.5 : 1 }} onClick={() => handlePick(type)}>
                  <div style={{ ...styles.iconWrap, background: `${meta.color}22`, color: meta.color }}>
                    <meta.icon size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.rowLabel}>
                      {meta.label}
                      {already && <span style={styles.chip}>Sudah ada</span>}
                    </div>
                    <div style={styles.rowValue}>{meta.desc}</div>
                  </div>
                  {pickerBusy === type ? <span style={styles.rowValue}>Menyimpan...</span> : <ChevronRight size={18} color="var(--text-muted)" />}
                </button>
              );
            })}
            {pickerError && <div style={styles.errText}>{pickerError}</div>}
          </div>
        </div>
      )}
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
  rowWrap: { display: 'flex', alignItems: 'stretch', gap: 8 },
  row: {
    flex: 1,
    minWidth: 0,
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
  emptyCard: { background: 'var(--bg-card)', borderRadius: 14, padding: '18px 16px', fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6, textAlign: 'center' },
  removeBtn: { width: 46, flexShrink: 0, background: 'var(--bg-card)', border: 'none', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  addBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '14px 16px', borderRadius: 14, border: '1.5px dashed var(--border2, #2A332B)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 60 },
  sheet: { background: 'var(--bg-card)', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 -8px 30px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: 8 },
  sheetHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' },
  sheetClose: { background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 },
  sheetHint: { fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 },
  pickRow: { display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card2)', border: 'none', borderRadius: 14, padding: '12px 14px', cursor: 'pointer', textAlign: 'left' },
  chip: { marginLeft: 8, fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', border: '1px solid var(--border, #2A332B)', borderRadius: 6, padding: '1px 6px' },
  errText: { fontSize: 11.5, color: '#FF9466', marginTop: 4 },
};
