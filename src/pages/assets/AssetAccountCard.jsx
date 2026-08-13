import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Trash2, Plus, MoreVertical } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { addAssetTransaction, deleteAssetTransaction, deactivateAssetAccount, fetchPriceHistory, fetchDepositInterestEstimate } from '../../lib/assetsApi';

function formatRupiah(n) {
  return 'Rp' + Math.round(n || 0).toLocaleString('id-ID');
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// unitBased = true untuk gold/mutual_fund (punya harga per unit, weighted avg cost)
// unitBased = false untuk saving/deposit (murni akumulasi kas)
export default function AssetAccountCard({ account, stats, transactions, unitLabel, unitBased, onChanged }) {
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(null); // null | 'buy' | 'sell'
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ amount: '', units: '', priceAtTx: '', date: todayStr(), note: '' });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [priceHistory, setPriceHistory] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);
  const [interestEstimate, setInterestEstimate] = useState(null);

  useEffect(() => {
    if (account.asset_type === 'deposit' && stats) {
      fetchDepositInterestEstimate(account.id).then(setInterestEstimate).catch(() => setInterestEstimate(null));
    }
  }, [account.id, account.asset_type, stats?.current_value]);

  // Grafik harga sekarang SELALU tampil (bukan toggle lagi) untuk akun
  // unitBased (Emas/Reksa Dana) -- narik otomatis begitu kartu dimuat.
  useEffect(() => {
    if (unitBased) {
      setChartLoading(true);
      fetchPriceHistory(account, 90)
        .then((data) => setPriceHistory(data.map((d) => ({ date: d.updated_at, price: d.price }))))
        .catch(() => setPriceHistory([]))
        .finally(() => setChartLoading(false));
    }
  }, [account.id, unitBased]);

  if (!stats) return null;

  const gain = unitBased ? stats.total_gain : null;
  const gainPositive = (gain ?? 0) >= 0;

  const removeAccount = async () => {
    const hasHistory = transactions.length > 0;
    const confirmMsg = hasHistory
      ? `Hapus akun "${account.name}"? Akun akan disembunyikan dari daftar, tapi ${transactions.length} riwayat transaksinya TETAP aman tersimpan (tidak ikut terhapus).`
      : `Hapus akun "${account.name}"?`;
    if (!confirm(confirmMsg)) return;
    setDeleting(true);
    try {
      await deactivateAssetAccount(account.id);
      onChanged();
    } catch (e) {
      alert(e.message || 'Gagal menghapus akun');
    } finally {
      setDeleting(false);
      setShowMenu(false);
    }
  };

  const openForm = (mode) => {
    setShowForm(mode);
    setForm({ amount: '', units: '', priceAtTx: stats.current_price ? String(stats.current_price) : '', date: todayStr(), note: '' });
    setErrorMsg('');
  };

  const submitForm = async () => {
    setErrorMsg('');
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) { setErrorMsg('Nominal harus lebih dari 0'); return; }

    const action = unitBased
      ? (showForm === 'buy' ? 'buy' : 'sell')
      : (showForm === 'buy' ? 'deposit' : 'withdraw');

    const payload = {
      asset_account_id: account.id,
      action,
      amount: amt,
      tx_date: form.date,
      note: form.note || '',
      units: unitBased && form.units ? parseFloat(form.units) : null,
      price_at_tx: unitBased && form.priceAtTx ? parseFloat(form.priceAtTx) : null,
    };

    setSaving(true);
    try {
      await addAssetTransaction(payload);
      setShowForm(null);
      onChanged();
    } catch (e) {
      setErrorMsg(e.message || 'Gagal menyimpan transaksi');
    } finally {
      setSaving(false);
    }
  };

  const removeTx = async (id) => {
    if (!confirm('Hapus transaksi ini?')) return;
    try {
      await deleteAssetTransaction(id);
      onChanged();
    } catch (e) {
      alert(e.message || 'Gagal menghapus');
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <div style={{ minWidth: 0 }}>
          <div style={styles.name}>{account.name}</div>
          {account.institution && <div style={styles.institution}>{account.institution}</div>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {unitBased && (
            <div style={{ ...styles.gainBadge, color: gainPositive ? '#7FE8A4' : '#FF9466', background: gainPositive ? '#7FE8A420' : '#FF946620' }}>
              {gainPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {gainPositive ? '+' : ''}{formatRupiah(gain)}
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowMenu((v) => !v)} style={styles.menuBtn} aria-label="Opsi akun">
              <MoreVertical size={16} color="var(--text-muted)" />
            </button>
            {showMenu && (
              <div style={styles.menuDropdown}>
                <button onClick={removeAccount} disabled={deleting} style={styles.menuDeleteBtn}>
                  {deleting ? 'Menghapus...' : 'Hapus akun ini'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {unitBased && (
        <div style={styles.chartBox}>
          {chartLoading && <div style={styles.chartEmptyText}>Memuat grafik...</div>}
          {!chartLoading && priceHistory && priceHistory.length === 0 && (
            <div style={styles.chartEmptyText}>Belum ada cukup data histori harga.</div>
          )}
          {!chartLoading && priceHistory && priceHistory.length > 0 && (() => {
            const trendUp = priceHistory[priceHistory.length - 1].price >= priceHistory[0].price;
            const lineColor = trendUp ? '#7FE8A4' : '#FF6B6B';
            return (
              <ResponsiveContainer width="100%" height={90}>
                <LineChart data={priceHistory}>
                  <YAxis hide domain={['dataMin', 'dataMax']} />
                  <Tooltip
                    formatter={(v) => [formatRupiah(v), 'Harga']}
                    labelFormatter={(d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    contentStyle={{ background: 'var(--bg-card2)', border: '1px solid #2A332B', borderRadius: 8, fontSize: 11 }}
                  />
                  <Line type="monotone" dataKey="price" stroke={lineColor} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            );
          })()}
        </div>
      )}

      <div style={styles.valueRow}>
        <div style={styles.valueLabel}>Nilai Sekarang</div>
        <div style={styles.value}>{formatRupiah(stats.current_value)}</div>
        {account.asset_type === 'deposit' && (
          <div style={styles.disclaimerText}>*Pokok saja — lihat "Bunga berjalan" & "Estimasi Total" di bawah untuk perkiraan dengan bunga</div>
        )}
      </div>

      {unitBased ? (
        <div style={styles.metaGrid}>
          <div>
            <div style={styles.metaLabel}>{unitLabel} dipegang</div>
            <div style={styles.metaValue}>{(stats.held_units ?? 0).toFixed(6)}</div>
          </div>
          <div>
            <div style={styles.metaLabel}>Rata-rata beli</div>
            <div style={styles.metaValue}>{formatRupiah(stats.avg_buy_price)}</div>
          </div>
          <div>
            <div style={styles.metaLabel}>Harga terkini</div>
            <div style={styles.metaValue}>{formatRupiah(stats.current_price)}</div>
          </div>
          <div>
            <div style={styles.metaLabel}>Return</div>
            <div style={{ ...styles.metaValue, color: gainPositive ? '#7FE8A4' : '#FF9466' }}>
              {stats.gain_pct != null ? `${gainPositive ? '+' : ''}${stats.gain_pct}%` : '-'}
            </div>
          </div>
        </div>
      ) : account.asset_type === 'deposit' ? (
        <div style={styles.metaGrid}>
          {account.interest_rate != null && (
            <div>
              <div style={styles.metaLabel}>Bunga</div>
              <div style={styles.metaValue}>{account.interest_rate}% / tahun</div>
            </div>
          )}
          {account.tenor_months != null && (
            <div>
              <div style={styles.metaLabel}>Tenor</div>
              <div style={styles.metaValue}>{account.tenor_months} bulan</div>
            </div>
          )}
          {account.maturity_date && (
            <div>
              <div style={styles.metaLabel}>Jatuh tempo</div>
              <div style={styles.metaValue}>
                {new Date(account.maturity_date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          )}
          {interestEstimate && interestEstimate.gross_interest > 0 && (
            <>
              <div>
                <div style={styles.metaLabel}>Bunga berjalan (net pajak 20%)</div>
                <div style={{ ...styles.metaValue, color: '#7FE8A4' }}>+{formatRupiah(interestEstimate.net_interest)}</div>
              </div>
              <div>
                <div style={styles.metaLabel}>Estimasi Total</div>
                <div style={styles.metaValue}>{formatRupiah(interestEstimate.estimated_total)}</div>
              </div>
            </>
          )}
        </div>
      ) : (
        account.goal_amount ? (
          <div style={styles.metaGrid}>
            <div>
              <div style={styles.metaLabel}>Target</div>
              <div style={styles.metaValue}>{formatRupiah(account.goal_amount)}</div>
            </div>
            <div>
              <div style={styles.metaLabel}>Sisa</div>
              <div style={styles.metaValue}>{formatRupiah(Math.max(0, account.goal_amount - stats.current_value))}</div>
            </div>
          </div>
        ) : null
      )}

      <div style={styles.actionsRow}>
        <button onClick={() => openForm('buy')} style={{ ...styles.actionBtn, ...styles.actionBtnPrimary }}>
          <Plus size={14} /> {unitBased ? 'Beli' : 'Setor'}
        </button>
        <button onClick={() => openForm('sell')} style={{ ...styles.actionBtn, ...styles.actionBtnSecondary }}>
          {unitBased ? 'Jual' : 'Tarik'}
        </button>
      </div>

      {showForm && (
        <div style={styles.formBox}>
          <input
            type="number" inputMode="decimal" placeholder="Nominal (Rp)"
            value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            style={styles.input}
          />
          {unitBased && (
            <>
              <input
                type="number" inputMode="decimal" placeholder={`Jumlah ${unitLabel} (opsional, presisi lebih baik)`}
                value={form.units} onChange={(e) => setForm((f) => ({ ...f, units: e.target.value }))}
                style={styles.input}
              />
              <input
                type="number" inputMode="decimal" placeholder="Harga/NAV saat transaksi"
                value={form.priceAtTx} onChange={(e) => setForm((f) => ({ ...f, priceAtTx: e.target.value }))}
                style={styles.input}
              />
            </>
          )}
          <input
            type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            style={styles.input}
          />
          <input
            type="text" placeholder="Catatan (opsional)"
            value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            style={styles.input}
          />
          {errorMsg && <div style={styles.errorText}>{errorMsg}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={submitForm} disabled={saving} style={{ ...styles.actionBtn, ...styles.actionBtnPrimary, flex: 1 }}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button onClick={() => setShowForm(null)} style={{ ...styles.actionBtn, flex: 1 }}>Batal</button>
          </div>
        </div>
      )}

      {transactions.length > 0 && (
        <>
          <button onClick={() => setExpanded((v) => !v)} style={styles.historyToggle}>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />} Riwayat ({transactions.length})
          </button>
          {expanded && (
            <div style={styles.historyList}>
              {transactions.map((t) => (
                <div key={t.id} style={styles.historyRow}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={styles.historyAction}>
                      {t.action === 'buy' ? 'Beli' : t.action === 'sell' ? 'Jual' : t.action === 'deposit' ? 'Setor' : 'Tarik'}
                      {t.note ? ` — ${t.note}` : ''}
                    </div>
                    <div style={styles.historyDate}>
                      {new Date(t.tx_date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={styles.historyAmount}>{formatRupiah(t.amount)}</div>
                    {t.units && <div style={styles.historyUnits}>{t.units.toFixed(6)} {unitLabel}</div>}
                  </div>
                  <button onClick={() => removeTx(t.id)} style={styles.deleteBtn}><Trash2 size={12} color="#6B7568" /></button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  card: { background: 'var(--bg-card)', borderRadius: 16, padding: 16, marginBottom: 12 },
  headerRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  name: { fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)' },
  institution: { fontSize: 11, color: 'var(--text-muted)', marginTop: 2 },
  gainBadge: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 8, flexShrink: 0 },
  menuBtn: { width: 26, height: 26, borderRadius: 8, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  menuDropdown: { position: 'absolute', top: 30, right: 0, background: 'var(--bg-card2)', border: '1px solid #2A332B', borderRadius: 10, overflow: 'hidden', zIndex: 10, minWidth: 140, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' },
  menuDeleteBtn: { width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: '#FF9466', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', textAlign: 'left', whiteSpace: 'nowrap' },
  valueRow: { marginBottom: 10 },
  valueLabel: { fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 },
  value: { fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Space Grotesk', sans-serif" },
  disclaimerText: { fontSize: 10, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' },
  metaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12, paddingTop: 10, borderTop: '1px solid #22291F' },
  metaLabel: { fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 2 },
  metaValue: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' },
  actionsRow: { display: 'flex', gap: 8 },
  chartBox: { marginBottom: 10, background: 'var(--bg-base)', borderRadius: 10, padding: '6px 4px' },
  chartEmptyText: { fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' },
  actionBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '10px 12px', borderRadius: 10, border: '1px solid #2A332B', background: 'transparent', color: 'var(--text-primary)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' },
  actionBtnPrimary: { background: 'var(--accent)', color: '#0B0F0C', border: 'none' },
  actionBtnSecondary: { color: '#FF9466', borderColor: '#FF946640' },
  formBox: { marginTop: 12, paddingTop: 12, borderTop: '1px solid #22291F', display: 'flex', flexDirection: 'column', gap: 8 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #2A332B', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' },
  errorText: { fontSize: 11.5, color: '#FF9466' },
  historyToggle: { marginTop: 10, display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', padding: 0 },
  historyList: { marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 },
  historyRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: '1px solid #1A201B' },
  historyAction: { fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 600 },
  historyDate: { fontSize: 10.5, color: 'var(--text-muted)' },
  historyAmount: { fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' },
  historyUnits: { fontSize: 10.5, color: 'var(--text-muted)' },
  deleteBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 },
};
