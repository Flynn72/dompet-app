import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Plus, Trash2, TrendingUp, TrendingDown, PiggyBank, Wallet, X, Check, AlertTriangle, Settings, Pencil, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const COLOR_PALETTE = ['#7FE8A4', '#6FB7E8', '#F5C95D', '#C99FE8', '#FF9466', '#6FE8D4', '#E89FC9', '#E8846F', '#A8A89C', '#E8C26F'];
const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

function formatRupiah(n) {
  const v = Math.round(Number(n) || 0);
  return 'Rp' + v.toLocaleString('id-ID');
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function monthKey(dateStr) {
  return dateStr.slice(0, 7);
}

export default function Dashboard({ user, onLogout }) {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]); // array of {id, category_id, month_key, amount}
  const [categories, setCategories] = useState([]); // array of {id, type, label, color}
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [activeMonth, setActiveMonth] = useState(monthKey(todayStr()));
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [tab, setTab] = useState('overview');

  const [form, setForm] = useState({ type: 'expense', amount: '', categoryId: null, note: '', date: todayStr() });
  const [catEditType, setCatEditType] = useState('expense');
  const [newCatLabel, setNewCatLabel] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatLabel, setEditingCatLabel] = useState('');

  const expenseCategories = useMemo(() => categories.filter((c) => c.type === 'expense'), [categories]);
  const savingCategories = useMemo(() => categories.filter((c) => c.type === 'saving'), [categories]);

  // ---- Load semua data dari Supabase ----
  const loadAll = useCallback(async () => {
    try {
      const [{ data: cats, error: catErr }, { data: txs, error: txErr }, { data: bgs, error: bgErr }] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('transactions').select('*').order('tx_date', { ascending: false }),
        supabase.from('budgets').select('*'),
      ]);
      if (catErr || txErr || bgErr) {
        setSaveError(true);
      } else {
        setCategories(cats || []);
        setTransactions(
          (txs || []).map((t) => ({ id: t.id, type: t.type, amount: Number(t.amount), category: t.category_id, note: t.note || '', date: t.tx_date }))
        );
        setBudgets(bgs || []);
        setSaveError(false);
      }
    } catch (e) {
      setSaveError(true);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (categories.length > 0 && !form.categoryId) {
      const defaultCat = form.type === 'saving' ? savingCategories[0] : expenseCategories[0];
      if (defaultCat) setForm((f) => ({ ...f, categoryId: defaultCat.id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  function catLookup(id) {
    return categories.find((c) => c.id === id);
  }

  function switchType(type) {
    const defaultCat = type === 'saving' ? savingCategories[0] : type === 'expense' ? expenseCategories[0] : null;
    setForm({ ...form, type, categoryId: defaultCat ? defaultCat.id : null });
  }

  // ---- Transaksi ----
  async function addTransaction() {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return;
    if (form.type !== 'income' && !form.categoryId) return;

    const payload = {
      user_id: user.id,
      type: form.type,
      category_id: form.type === 'income' ? null : form.categoryId,
      amount: amt,
      note: form.note.trim(),
      tx_date: form.date,
    };
    const { data, error } = await supabase.from('transactions').insert(payload).select().single();
    if (error) {
      setSaveError(true);
      return;
    }
    setTransactions((prev) => [{ id: data.id, type: data.type, amount: Number(data.amount), category: data.category_id, note: data.note || '', date: data.tx_date }, ...prev]);
    setForm({ type: 'expense', amount: '', categoryId: expenseCategories[0] ? expenseCategories[0].id : null, note: '', date: todayStr() });
    setShowAddModal(false);
  }

  async function deleteTransaction(id) {
    const prev = transactions;
    setTransactions((p) => p.filter((t) => t.id !== id));
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      setSaveError(true);
      setTransactions(prev);
    }
  }

  // ---- Budget ----
  function getBudgetAmount(categoryId, monthKeyVal) {
    const b = budgets.find((b) => b.category_id === categoryId && b.month_key === monthKeyVal);
    return b ? Number(b.amount) : 0;
  }

  async function setBudgetAmount(categoryId, value) {
    const amt = parseFloat(value) || 0;
    const existing = budgets.find((b) => b.category_id === categoryId && b.month_key === activeMonth);
    if (existing) {
      setBudgets((prev) => prev.map((b) => (b.id === existing.id ? { ...b, amount: amt } : b)));
      const { error } = await supabase.from('budgets').update({ amount: amt }).eq('id', existing.id);
      if (error) setSaveError(true);
    } else {
      const { data, error } = await supabase
        .from('budgets')
        .insert({ user_id: user.id, category_id: categoryId, month_key: activeMonth, amount: amt })
        .select()
        .single();
      if (error) {
        setSaveError(true);
      } else {
        setBudgets((prev) => [...prev, data]);
      }
    }
  }

  // ---- Kategori ----
  async function addCategory() {
    const label = newCatLabel.trim();
    if (!label) return;
    const list = catEditType === 'saving' ? savingCategories : expenseCategories;
    const color = COLOR_PALETTE[list.length % COLOR_PALETTE.length];
    const { data, error } = await supabase
      .from('categories')
      .insert({ user_id: user.id, type: catEditType, label, color, sort_order: list.length + 1 })
      .select()
      .single();
    if (error) {
      setSaveError(true);
      return;
    }
    setCategories((prev) => [...prev, data]);
    setNewCatLabel('');
  }

  function startEditCategory(c) {
    setEditingCatId(c.id);
    setEditingCatLabel(c.label);
  }

  async function saveEditCategory() {
    const label = editingCatLabel.trim();
    if (!label) return;
    const { error } = await supabase.from('categories').update({ label }).eq('id', editingCatId);
    if (error) {
      setSaveError(true);
    } else {
      setCategories((prev) => prev.map((c) => (c.id === editingCatId ? { ...c, label } : c)));
    }
    setEditingCatId(null);
    setEditingCatLabel('');
  }

  async function setCategoryColor(catId, color) {
    const { error } = await supabase.from('categories').update({ color }).eq('id', catId);
    if (error) {
      setSaveError(true);
    } else {
      setCategories((prev) => prev.map((c) => (c.id === catId ? { ...c, color } : c)));
    }
  }

  async function deleteCategory(catId) {
    const { error } = await supabase.from('categories').delete().eq('id', catId);
    if (error) {
      setSaveError(true);
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== catId));
  }

  // ---- Data turunan ----
  const monthTx = useMemo(() => transactions.filter((t) => monthKey(t.date) === activeMonth), [transactions, activeMonth]);
  const totalIncome = useMemo(() => monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0), [monthTx]);
  const totalExpense = useMemo(() => monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [monthTx]);
  const totalSaving = useMemo(() => monthTx.filter((t) => t.type === 'saving').reduce((s, t) => s + t.amount, 0), [monthTx]);
  const balance = totalIncome - totalExpense - totalSaving;
  const totalUsed = totalExpense + totalSaving;

  const spendByCat = useCallback(
    (type) => {
      const map = {};
      monthTx.filter((t) => t.type === type).forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
      return map;
    },
    [monthTx]
  );
  const expenseSpend = useMemo(() => spendByCat('expense'), [spendByCat]);
  const savingSpend = useMemo(() => spendByCat('saving'), [spendByCat]);

  const pieData = useMemo(
    () => expenseCategories.filter((c) => expenseSpend[c.id] > 0).map((c) => ({ name: c.label, value: expenseSpend[c.id] || 0, color: c.color })),
    [expenseSpend, expenseCategories]
  );

  const trendData = useMemo(() => {
    const now = new Date(activeMonth + '-01T00:00:00');
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      const tx = transactions.filter((t) => monthKey(t.date) === key);
      result.push({
        label: MONTHS_ID[d.getMonth()],
        inc: tx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        exp: tx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        sav: tx.filter((t) => t.type === 'saving').reduce((s, t) => s + t.amount, 0),
      });
    }
    return result;
  }, [transactions, activeMonth]);

  const availableMonths = useMemo(() => {
    const set = new Set(transactions.map((t) => monthKey(t.date)));
    set.add(activeMonth);
    return Array.from(set).sort().reverse();
  }, [transactions, activeMonth]);

  function shiftMonth(delta) {
    const d = new Date(activeMonth + '-01T00:00:00');
    d.setMonth(d.getMonth() + delta);
    setActiveMonth(d.toISOString().slice(0, 7));
  }
  function monthLabel(key) {
    const d = new Date(key + '-01T00:00:00');
    return MONTHS_ID[d.getMonth()] + ' ' + d.getFullYear();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    onLogout();
  }

  if (!loaded) {
    return (
      <div style={styles.page}>
        <div style={{ ...styles.center, height: '100vh' }}>
          <div style={styles.loadingPulse} />
          <p style={{ color: '#9CA89F', marginTop: 16 }}>Memuat data...</p>
        </div>
      </div>
    );
  }

  const activeCatList = catEditType === 'saving' ? savingCategories : expenseCategories;

  return (
    <div className="dompet-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: #2A332C; border-radius: 3px; }
        body { font-family: 'Inter', sans-serif; background: #0F1410; margin: 0; }
        input, select { font-family: 'Inter', sans-serif; }
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }

        .dompet-page { min-height: 100vh; background: #0F1410; color: #EAF0EA; padding-bottom: 90px; max-width: 480px; margin: 0 auto; position: relative; }
        .dompet-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 20px 12px; }
        .dompet-tabbar { display: flex; align-items: center; gap: 4px; padding: 0 20px 16px; border-bottom: 1px solid #1E261F; }
        .dompet-content { padding: 16px 20px 0; }
        .dompet-columns { display: block; }
        .dompet-col-left { width: 100%; }
        .dompet-col-right { width: 100%; }
        .dompet-fab { position: fixed; bottom: 24px; right: 24px; width: 54px; height: 54px; border-radius: 16px; background: #7FE8A4; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 16px rgba(127,232,164,0.35); z-index: 40; }

        @media (min-width: 900px) {
          .dompet-page { max-width: 100%; padding-bottom: 40px; }
          .dompet-header { max-width: 1280px; margin: 0 auto; padding: 24px 48px 16px; }
          .dompet-tabbar { max-width: 1280px; margin: 0 auto; padding: 0 48px 16px; }
          .dompet-content { max-width: 1280px; margin: 0 auto; padding: 24px 48px 48px; }
          .dompet-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; align-items: start; }
          .dompet-fab { right: 48px; bottom: 48px; width: 58px; height: 58px; }
        }

        @media (min-width: 1280px) {
          .dompet-columns { grid-template-columns: 1.15fr 0.85fr; }
        }
      `}</style>

      {saveError && (
        <div style={styles.errorBanner}>
          <AlertTriangle size={14} />
          <span>Gagal menyimpan/memuat data. Periksa koneksi internet.</span>
        </div>
      )}

      <div className="dompet-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={styles.logoMark}><Wallet size={18} color="#0F1410" /></div>
          <span style={styles.logoText}>Dompet</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={styles.monthSwitcher}>
            <button onClick={() => shiftMonth(-1)} style={styles.monthBtn}>‹</button>
            <select value={activeMonth} onChange={(e) => setActiveMonth(e.target.value)} style={styles.monthSelect}>
              {availableMonths.map((m) => (
                <option key={m} value={m} style={{ background: '#1A211C' }}>{monthLabel(m)}</option>
              ))}
            </select>
            <button onClick={() => shiftMonth(1)} style={styles.monthBtn}>›</button>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn} aria-label="Keluar"><LogOut size={15} color="#9CA89F" /></button>
        </div>
      </div>

      <div className="dompet-tabbar">
        {[
          { id: 'overview', label: 'Ringkasan' },
          { id: 'transactions', label: 'Transaksi' },
          { id: 'reports', label: 'Laporan' },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ ...styles.tabBtn, ...(tab === t.id ? styles.tabBtnActive : {}) }}>{t.label}</button>
        ))}
        <button onClick={() => setShowCategoryModal(true)} style={styles.settingsBtn} aria-label="Kelola kategori"><Settings size={16} color="#9CA89F" /></button>
      </div>

      <div className="dompet-content">
        {tab === 'overview' && (
          <div className="dompet-columns">
            {/* Kolom kiri: ringkasan saldo + budget */}
            <div className="dompet-col-left">
              <div style={styles.summaryGrid}>
                <div style={{ ...styles.summaryCard, gridColumn: '1 / -1' }}>
                  <span style={styles.summaryLabel}>Sisa saldo bulan ini</span>
                  <span style={{ ...styles.balanceNumber, color: balance >= 0 ? '#7FE8A4' : '#FF9466' }}>{formatRupiah(balance)}</span>
                  <span style={{ fontSize: 11, color: '#6B7568' }}>Income dikurangi expense dan saving/investasi</span>
                </div>
                <div style={styles.summaryCard}>
                  <div style={styles.summaryIconRow}><TrendingUp size={14} color="#7FE8A4" /><span style={styles.summaryLabel}>Income</span></div>
                  <span style={{ ...styles.summaryNumber, color: '#7FE8A4' }}>{formatRupiah(totalIncome)}</span>
                </div>
                <div style={styles.summaryCard}>
                  <span style={styles.summaryLabel}>Total terpakai</span>
                  <span style={{ ...styles.summaryNumber, color: '#EAF0EA' }}>{formatRupiah(totalUsed)}</span>
                  <span style={{ fontSize: 10, color: '#6B7568' }}>Expense + saving</span>
                </div>
                <div style={styles.summaryCard}>
                  <div style={styles.summaryIconRow}><TrendingDown size={14} color="#FF9466" /><span style={styles.summaryLabel}>Expense</span></div>
                  <span style={{ ...styles.summaryNumber, color: '#FF9466' }}>{formatRupiah(totalExpense)}</span>
                </div>
                <div style={styles.summaryCard}>
                  <div style={styles.summaryIconRow}><PiggyBank size={14} color="#6FB7E8" /><span style={styles.summaryLabel}>Saving</span></div>
                  <span style={{ ...styles.summaryNumber, color: '#6FB7E8' }}>{formatRupiah(totalSaving)}</span>
                </div>
              </div>

              <div style={styles.sectionHeader}>
                <span style={styles.sectionTitle}>Budget expense</span>
                <button onClick={() => setShowBudgetModal(true)} style={styles.linkBtn}>Atur budget</button>
              </div>
              <div style={styles.budgetList}>
                {expenseCategories.filter((c) => getBudgetAmount(c.id, activeMonth) > 0 || expenseSpend[c.id] > 0).length === 0 && (
                  <div style={styles.emptyHint}>Belum ada budget expense. Atur budget untuk mulai memantau.</div>
                )}
                {expenseCategories.filter((c) => getBudgetAmount(c.id, activeMonth) > 0 || expenseSpend[c.id] > 0).map((c) => {
                  const spent = expenseSpend[c.id] || 0;
                  const budget = getBudgetAmount(c.id, activeMonth);
                  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
                  const over = budget > 0 && spent > budget;
                  let barColor = '#7FE8A4';
                  if (pct > 70) barColor = '#F5C95D';
                  if (pct >= 100) barColor = '#FF9466';
                  return (
                    <div key={c.id} style={styles.budgetRow}>
                      <div style={styles.budgetRowTop}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#EAF0EA' }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, display: 'inline-block' }} />{c.label}
                        </span>
                        <span style={{ fontSize: 12, color: over ? '#FF9466' : '#9CA89F' }}>{formatRupiah(spent)} {budget > 0 ? `/ ${formatRupiah(budget)}` : ''}</span>
                      </div>
                      <div style={styles.barTrack}><div style={{ ...styles.barFill, width: pct + '%', background: barColor }} /></div>
                      {over && <span style={styles.overText}>Lewat {formatRupiah(spent - budget)} dari budget</span>}
                    </div>
                  );
                })}
              </div>

              <div style={styles.sectionHeader}><span style={styles.sectionTitle}>Target saving & investasi</span></div>
              <div style={styles.budgetList}>
                {savingCategories.filter((c) => getBudgetAmount(c.id, activeMonth) > 0 || savingSpend[c.id] > 0).length === 0 && (
                  <div style={styles.emptyHint}>Belum ada target saving/investasi bulan ini.</div>
                )}
                {savingCategories.filter((c) => getBudgetAmount(c.id, activeMonth) > 0 || savingSpend[c.id] > 0).map((c) => {
                  const spent = savingSpend[c.id] || 0;
                  const target = getBudgetAmount(c.id, activeMonth);
                  const pct = target > 0 ? Math.min(100, (spent / target) * 100) : 0;
                  return (
                    <div key={c.id} style={styles.budgetRow}>
                      <div style={styles.budgetRowTop}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#EAF0EA' }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, display: 'inline-block' }} />{c.label}
                        </span>
                        <span style={{ fontSize: 12, color: '#9CA89F' }}>{formatRupiah(spent)} {target > 0 ? `/ ${formatRupiah(target)}` : ''}</span>
                      </div>
                      <div style={styles.barTrack}><div style={{ ...styles.barFill, width: pct + '%', background: '#6FB7E8' }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Kolom kanan: transaksi terbaru */}
            <div className="dompet-col-right">
              <div style={styles.sectionHeader}><span style={styles.sectionTitle}>Transaksi terbaru</span></div>
              <div style={styles.txList}>
                {monthTx.slice(0, 8).map((t) => (<TxRow key={t.id} t={t} onDelete={deleteTransaction} catLookup={catLookup} />))}
                {monthTx.length === 0 && <div style={styles.emptyHint}>Belum ada transaksi bulan ini.</div>}
              </div>
            </div>
          </div>
        )}

        {tab === 'transactions' && (
          <div style={styles.txList}>
            {monthTx.length === 0 && <div style={styles.emptyHint}>Belum ada transaksi bulan ini.</div>}
            {monthTx.map((t) => (<TxRow key={t.id} t={t} onDelete={deleteTransaction} catLookup={catLookup} />))}
          </div>
        )}

        {tab === 'reports' && (
          <div className="dompet-columns">
            <div className="dompet-col-left">
              <div style={styles.sectionHeader}><span style={styles.sectionTitle}>Expense per kategori</span></div>
              {pieData.length > 0 ? (
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={100} paddingAngle={2}>
                        {pieData.map((entry, i) => (<Cell key={i} fill={entry.color} stroke="#0F1410" strokeWidth={2} />))}
                      </Pie>
                      <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={{ background: '#1A211C', border: '1px solid #2A332C', borderRadius: 8, color: '#EAF0EA' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div style={styles.emptyHint}>Belum ada pengeluaran untuk ditampilkan.</div>
              )}
              <div style={styles.legendWrap}>
                {pieData.map((p) => (
                  <div key={p.name} style={styles.legendItem}>
                    <span style={{ width: 9, height: 9, borderRadius: 2, background: p.color, display: 'inline-block' }} />
                    <span style={{ fontSize: 12, color: '#9CA89F' }}>{p.name}</span>
                    <span style={{ fontSize: 12, color: '#EAF0EA', marginLeft: 'auto' }}>{formatRupiah(p.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="dompet-col-right">
              <div style={styles.sectionHeader}><span style={styles.sectionTitle}>Tren 6 bulan</span></div>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={trendData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#22291F" vertical={false} />
                    <XAxis dataKey="label" stroke="#9CA89F" fontSize={11} tickLine={false} axisLine={{ stroke: '#22291F' }} />
                    <YAxis stroke="#9CA89F" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1000000 ? (v / 1000000).toFixed(0) + 'jt' : v >= 1000 ? (v / 1000).toFixed(0) + 'rb' : v)} />
                    <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={{ background: '#1A211C', border: '1px solid #2A332C', borderRadius: 8, color: '#EAF0EA' }} />
                    <Bar dataKey="inc" fill="#7FE8A4" radius={[3, 3, 0, 0]} name="Income" />
                    <Bar dataKey="exp" fill="#FF9466" radius={[3, 3, 0, 0]} name="Expense" />
                    <Bar dataKey="sav" fill="#6FB7E8" radius={[3, 3, 0, 0]} name="Saving" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                <span style={styles.legendItem2}><span style={{ width: 9, height: 9, borderRadius: 2, background: '#7FE8A4', display: 'inline-block' }} />Income</span>
                <span style={styles.legendItem2}><span style={{ width: 9, height: 9, borderRadius: 2, background: '#FF9466', display: 'inline-block' }} />Expense</span>
                <span style={styles.legendItem2}><span style={{ width: 9, height: 9, borderRadius: 2, background: '#6FB7E8', display: 'inline-block' }} />Saving</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <button onClick={() => setShowAddModal(true)} className="dompet-fab" aria-label="Tambah transaksi"><Plus size={24} color="#0F1410" /></button>

      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Tambah transaksi</span>
              <button onClick={() => setShowAddModal(false)} style={styles.iconBtn}><X size={18} color="#9CA89F" /></button>
            </div>
            <div style={styles.typeToggle}>
              <button onClick={() => switchType('expense')} style={{ ...styles.typeBtn, ...(form.type === 'expense' ? styles.typeBtnExpenseActive : {}) }}>Expense</button>
              <button onClick={() => switchType('saving')} style={{ ...styles.typeBtn, ...(form.type === 'saving' ? styles.typeBtnSavingActive : {}) }}>Saving</button>
              <button onClick={() => switchType('income')} style={{ ...styles.typeBtn, ...(form.type === 'income' ? styles.typeBtnIncomeActive : {}) }}>Income</button>
            </div>
            <label style={styles.formLabel}>Jumlah (Rp)</label>
            <input type="number" inputMode="numeric" placeholder="50000" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={styles.input} autoFocus />

            {form.type === 'expense' && (
              <>
                <label style={styles.formLabel}>Kategori</label>
                {expenseCategories.length === 0 ? (
                  <div style={styles.emptyHint}>Belum ada kategori expense. Tambahkan lewat ikon pengaturan di atas.</div>
                ) : (
                  <div style={styles.catGrid}>
                    {expenseCategories.map((c) => (
                      <button key={c.id} onClick={() => setForm({ ...form, categoryId: c.id })} style={{ ...styles.catChip, borderColor: form.categoryId === c.id ? c.color : '#2A332C', background: form.categoryId === c.id ? c.color + '22' : 'transparent' }}>
                        <span style={{ width: 7, height: 7, borderRadius: 2, background: c.color, display: 'inline-block' }} />{c.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            {form.type === 'saving' && (
              <>
                <label style={styles.formLabel}>Kategori tabungan/investasi</label>
                {savingCategories.length === 0 ? (
                  <div style={styles.emptyHint}>Belum ada kategori saving. Tambahkan lewat ikon pengaturan di atas.</div>
                ) : (
                  <div style={styles.catGrid}>
                    {savingCategories.map((c) => (
                      <button key={c.id} onClick={() => setForm({ ...form, categoryId: c.id })} style={{ ...styles.catChip, borderColor: form.categoryId === c.id ? c.color : '#2A332C', background: form.categoryId === c.id ? c.color + '22' : 'transparent' }}>
                        <span style={{ width: 7, height: 7, borderRadius: 2, background: c.color, display: 'inline-block' }} />{c.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            <label style={styles.formLabel}>Catatan (opsional)</label>
            <input type="text" placeholder="Contoh: bayar wifi bulan ini" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} style={styles.input} />
            <label style={styles.formLabel}>Tanggal</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={styles.input} />
            <button onClick={addTransaction} style={styles.submitBtn}><Check size={16} color="#0F1410" />Simpan transaksi</button>
          </div>
        </div>
      )}

      {showBudgetModal && (
        <div style={styles.modalOverlay} onClick={() => setShowBudgetModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Atur budget — {monthLabel(activeMonth)}</span>
              <button onClick={() => setShowBudgetModal(false)} style={styles.iconBtn}><X size={18} color="#9CA89F" /></button>
            </div>
            <div style={{ maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
              <div style={styles.budgetGroupLabel}>Expense</div>
              {expenseCategories.length === 0 && <div style={styles.emptyHint}>Belum ada kategori expense.</div>}
              {expenseCategories.map((c) => (
                <div key={c.id} style={styles.budgetInputRow}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#EAF0EA', minWidth: 150 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, display: 'inline-block' }} />{c.label}
                  </span>
                  <input type="number" inputMode="numeric" placeholder="0" defaultValue={getBudgetAmount(c.id, activeMonth) || ''} onBlur={(e) => setBudgetAmount(c.id, e.target.value)} style={{ ...styles.input, marginBottom: 0 }} />
                </div>
              ))}
              <div style={{ ...styles.budgetGroupLabel, marginTop: 16 }}>Saving & investasi</div>
              {savingCategories.length === 0 && <div style={styles.emptyHint}>Belum ada kategori saving.</div>}
              {savingCategories.map((c) => (
                <div key={c.id} style={styles.budgetInputRow}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#EAF0EA', minWidth: 150 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, display: 'inline-block' }} />{c.label}
                  </span>
                  <input type="number" inputMode="numeric" placeholder="0" defaultValue={getBudgetAmount(c.id, activeMonth) || ''} onBlur={(e) => setBudgetAmount(c.id, e.target.value)} style={{ ...styles.input, marginBottom: 0 }} />
                </div>
              ))}
            </div>
            <button onClick={() => setShowBudgetModal(false)} style={styles.submitBtn}><Check size={16} color="#0F1410" />Selesai</button>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div style={styles.modalOverlay} onClick={() => { setShowCategoryModal(false); setEditingCatId(null); setNewCatLabel(''); }}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Kelola kategori</span>
              <button onClick={() => { setShowCategoryModal(false); setEditingCatId(null); setNewCatLabel(''); }} style={styles.iconBtn}><X size={18} color="#9CA89F" /></button>
            </div>
            <div style={styles.typeToggle}>
              <button onClick={() => { setCatEditType('expense'); setEditingCatId(null); }} style={{ ...styles.typeBtn, ...(catEditType === 'expense' ? styles.typeBtnExpenseActive : {}) }}>Expense</button>
              <button onClick={() => { setCatEditType('saving'); setEditingCatId(null); }} style={{ ...styles.typeBtn, ...(catEditType === 'saving' ? styles.typeBtnSavingActive : {}) }}>Saving</button>
            </div>
            <div style={{ maxHeight: 340, overflowY: 'auto', paddingRight: 4, marginBottom: 16 }}>
              {activeCatList.length === 0 && <div style={styles.emptyHint}>Belum ada kategori. Tambahkan di bawah.</div>}
              {activeCatList.map((c) => (
                <div key={c.id} style={styles.categoryRow}>
                  {editingCatId === c.id ? (
                    <>
                      <input type="text" value={editingCatLabel} onChange={(e) => setEditingCatLabel(e.target.value)} style={{ ...styles.input, marginBottom: 0, flex: 1 }} autoFocus />
                      <button onClick={saveEditCategory} style={styles.smallIconBtn} aria-label="Simpan"><Check size={15} color="#7FE8A4" /></button>
                      <button onClick={() => setEditingCatId(null)} style={styles.smallIconBtn} aria-label="Batal"><X size={15} color="#9CA89F" /></button>
                    </>
                  ) : (
                    <>
                      <div style={styles.colorDotRow}>
                        {COLOR_PALETTE.map((col) => (
                          <button key={col} onClick={() => setCategoryColor(c.id, col)} style={{ width: 16, height: 16, borderRadius: '50%', background: col, border: c.color === col ? '2px solid #EAF0EA' : '2px solid transparent', cursor: 'pointer', padding: 0, flexShrink: 0 }} aria-label={'Warna ' + col} />
                        ))}
                      </div>
                      <span style={{ flex: 1, fontSize: 13, color: '#EAF0EA', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.label}</span>
                      <button onClick={() => startEditCategory(c)} style={styles.smallIconBtn} aria-label="Ubah nama"><Pencil size={14} color="#9CA89F" /></button>
                      <button onClick={() => deleteCategory(c.id)} style={styles.smallIconBtn} aria-label="Hapus kategori"><Trash2 size={14} color="#FF9466" /></button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <label style={styles.formLabel}>Tambah kategori baru</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" placeholder={catEditType === 'saving' ? 'Contoh: Emergency Fund' : 'Contoh: Belanja Bulanan'} value={newCatLabel} onChange={(e) => setNewCatLabel(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addCategory(); }} style={{ ...styles.input, marginBottom: 0, flex: 1 }} />
              <button onClick={addCategory} style={{ ...styles.smallIconBtn, width: 38, height: 38, background: '#7FE8A4' }} aria-label="Tambah"><Plus size={18} color="#0F1410" /></button>
            </div>
            <button onClick={() => { setShowCategoryModal(false); setEditingCatId(null); setNewCatLabel(''); }} style={styles.submitBtn}><Check size={16} color="#0F1410" />Selesai</button>
          </div>
        </div>
      )}
    </div>
  );
}

function TxRow({ t, onDelete, catLookup }) {
  const isIncome = t.type === 'income';
  const isSaving = t.type === 'saving';
  const cat = isIncome ? null : catLookup(t.category);
  let icon = <TrendingDown size={15} color={cat ? cat.color : '#A8A89C'} />;
  let iconBg = cat ? cat.color + '22' : '#A8A89C22';
  let amountColor = '#FF9466';
  let sign = '-';
  if (isIncome) { icon = <TrendingUp size={15} color="#7FE8A4" />; iconBg = '#7FE8A422'; amountColor = '#7FE8A4'; sign = '+'; }
  else if (isSaving) { icon = <PiggyBank size={15} color={cat ? cat.color : '#6FB7E8'} />; amountColor = '#6FB7E8'; sign = '-'; }
  return (
    <div style={styles.txRow}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: '#EAF0EA', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.note || (isIncome ? 'Income' : cat ? cat.label : 'Lainnya')}</div>
          <div style={{ fontSize: 11, color: '#9CA89F' }}>{new Date(t.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: amountColor }}>{sign}{formatRupiah(t.amount)}</span>
        <button onClick={() => onDelete(t.id)} style={styles.deleteBtn} aria-label="Hapus"><Trash2 size={14} color="#6B7568" /></button>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0F1410', fontFamily: "'Inter', sans-serif", color: '#EAF0EA', paddingBottom: 90, maxWidth: 480, margin: '0 auto', position: 'relative' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  loadingPulse: { width: 36, height: 36, borderRadius: 10, background: '#7FE8A4', animation: 'pulse 1.2s ease-in-out infinite' },
  errorBanner: { background: '#3A2418', color: '#FF9466', fontSize: 12, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 12px' },
  logoMark: { width: 30, height: 30, borderRadius: 8, background: '#7FE8A4', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em' },
  monthSwitcher: { display: 'flex', alignItems: 'center', gap: 4 },
  monthBtn: { width: 26, height: 26, borderRadius: 6, border: '1px solid #2A332C', background: 'transparent', color: '#9CA89F', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  monthSelect: { background: 'transparent', color: '#EAF0EA', border: '1px solid #2A332C', borderRadius: 6, padding: '5px 8px', fontSize: 12, cursor: 'pointer' },
  logoutBtn: { width: 30, height: 30, borderRadius: 8, border: '1px solid #2A332C', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  tabBar: { display: 'flex', alignItems: 'center', gap: 4, padding: '0 20px 16px', borderBottom: '1px solid #1E261F' },
  tabBtn: { background: 'transparent', border: 'none', color: '#6B7568', fontSize: 13, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 500 },
  tabBtnActive: { background: '#1A211C', color: '#EAF0EA' },
  settingsBtn: { marginLeft: 'auto', background: 'transparent', border: '1px solid #2A332C', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  content: { padding: '16px 20px 0' },
  summaryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 },
  summaryCard: { background: '#1A211C', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 },
  summaryLabel: { fontSize: 12, color: '#9CA89F' },
  summaryIconRow: { display: 'flex', alignItems: 'center', gap: 6 },
  balanceNumber: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 30, letterSpacing: '-0.02em' },
  summaryNumber: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 13, fontWeight: 600, color: '#9CA89F', textTransform: 'uppercase', letterSpacing: '0.04em' },
  linkBtn: { background: 'transparent', border: 'none', color: '#7FE8A4', fontSize: 12, cursor: 'pointer', fontWeight: 500 },
  budgetList: { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 },
  budgetRow: { display: 'flex', flexDirection: 'column', gap: 6 },
  budgetRowTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  barTrack: { height: 6, borderRadius: 3, background: '#1E261F', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3, transition: 'width 0.4s ease' },
  overText: { fontSize: 11, color: '#FF9466' },
  txList: { display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 20 },
  txRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1A211C' },
  deleteBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' },
  emptyHint: { fontSize: 13, color: '#6B7568', textAlign: 'center', padding: '24px 0' },
  legendWrap: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, marginBottom: 24 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 8 },
  legendItem2: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9CA89F' },
  fab: { position: 'fixed', bottom: 24, right: 'calc(50% - 240px + 24px)', width: 54, height: 54, borderRadius: 16, background: '#7FE8A4', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 16px rgba(127,232,164,0.35)' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 },
  modalCard: { background: '#161C17', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 -8px 30px rgba(0,0,0,0.4)' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16 },
  iconBtn: { background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 },
  typeToggle: { display: 'flex', gap: 6, marginBottom: 18 },
  typeBtn: { flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid #2A332C', background: 'transparent', color: '#9CA89F', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' },
  typeBtnExpenseActive: { background: '#FF946622', borderColor: '#FF9466', color: '#FF9466' },
  typeBtnSavingActive: { background: '#6FB7E822', borderColor: '#6FB7E8', color: '#6FB7E8' },
  typeBtnIncomeActive: { background: '#7FE8A422', borderColor: '#7FE8A4', color: '#7FE8A4' },
  formLabel: { display: 'block', fontSize: 12, color: '#9CA89F', marginBottom: 6, marginTop: 14 },
  input: { width: '100%', background: '#0F1410', border: '1px solid #2A332C', borderRadius: 10, padding: '11px 12px', color: '#EAF0EA', fontSize: 14, outline: 'none', marginBottom: 4 },
  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 },
  catChip: { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 10px', borderRadius: 9, border: '1px solid #2A332C', background: 'transparent', color: '#EAF0EA', fontSize: 12, cursor: 'pointer', textAlign: 'left' },
  submitBtn: { width: '100%', marginTop: 20, padding: '13px 0', borderRadius: 12, border: 'none', background: '#7FE8A4', color: '#0F1410', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  budgetInputRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 },
  budgetGroupLabel: { fontSize: 11, color: '#6B7568', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 },
  categoryRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #1E261F' },
  colorDotRow: { display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 90 },
  smallIconBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, flexShrink: 0 },
};
