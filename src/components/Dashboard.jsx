import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend, Dot } from 'recharts';
import {
  Plus, Trash2, TrendingUp, TrendingDown, PiggyBank, Wallet, X, Check,
  AlertTriangle, Settings, Pencil, LogOut, ShoppingCart, Car, Wifi, Zap,
  Coffee, Heart, BookOpen, Home, Music, Plane, Gift, Phone, CreditCard,
  Briefcase, Star, DollarSign, Utensils, Bus, Shirt, Monitor, Dumbbell,
  Baby, Dog, Leaf, Fuel, Wrench, Landmark, CircleDollarSign,
  Banknote, ArrowLeftRight, ShieldCheck, Smartphone, Receipt, Calculator,
  Vault, BadgeDollarSign, WalletCards, Building2, HandCoins, BadgePercent,
  Coins, PiggyBank as PiggyBankIcon, Clock, Globe, Umbrella, Lock,
  QrCode, Nfc, BarChart2, TrendingDown as TrendingDownIcon, Package
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const COLOR_PALETTE = ['#7FE8A4','#6FB7E8','#F5C95D','#C99FE8','#FF9466','#6FE8D4','#E89FC9','#E8846F','#A8A89C','#E8C26F'];
const MONTHS_ID = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
const chartTheme = { bg: 'var(--chart-bg)', grid: 'var(--chart-grid)', tooltip: 'var(--chart-tooltip)', text: 'var(--chart-text)', subtext: 'var(--chart-subtext)' };

// Daftar ikon yang bisa dipilih untuk kategori — dikelompokkan
const ICON_LIST = [
  // Banking & Keuangan
  { id: 'banknote', label: 'Uang Tunai', Icon: Banknote },
  { id: 'creditcard', label: 'Kartu Kredit', Icon: CreditCard },
  { id: 'walletcards', label: 'Dompet', Icon: WalletCards },
  { id: 'landmark', label: 'Bank', Icon: Landmark },
  { id: 'building2', label: 'Gedung', Icon: Building2 },
  { id: 'circledollar', label: 'Tabungan', Icon: CircleDollarSign },
  { id: 'badgedollar', label: 'Nominal', Icon: BadgeDollarSign },
  { id: 'coins', label: 'Koin', Icon: Coins },
  { id: 'handcoins', label: 'Transfer', Icon: HandCoins },
  { id: 'arrowleftright', label: 'Transaksi', Icon: ArrowLeftRight },
  { id: 'receipt', label: 'Struk', Icon: Receipt },
  { id: 'calculator', label: 'Kalkulator', Icon: Calculator },
  { id: 'vault', label: 'Brankas', Icon: Vault },
  { id: 'shieldcheck', label: 'Proteksi', Icon: ShieldCheck },
  { id: 'badgepercent', label: 'Cicilan/Bunga', Icon: BadgePercent },
  { id: 'umbrella', label: 'Asuransi', Icon: Umbrella },
  { id: 'lock', label: 'Keamanan', Icon: Lock },
  { id: 'qrcode', label: 'QR Pay', Icon: QrCode },
  { id: 'nfc', label: 'Tap Pay', Icon: Nfc },
  { id: 'barchart2', label: 'Investasi', Icon: BarChart2 },
  // Kehidupan sehari-hari
  { id: 'utensils', label: 'Makan', Icon: Utensils },
  { id: 'coffee', label: 'Kopi', Icon: Coffee },
  { id: 'car', label: 'Motor/Mobil', Icon: Car },
  { id: 'fuel', label: 'Bensin', Icon: Fuel },
  { id: 'bus', label: 'Transport', Icon: Bus },
  { id: 'wifi', label: 'Wifi', Icon: Wifi },
  { id: 'phone', label: 'Pulsa', Icon: Phone },
  { id: 'smartphone', label: 'Mobile', Icon: Smartphone },
  { id: 'zap', label: 'Listrik', Icon: Zap },
  { id: 'home', label: 'Rumah', Icon: Home },
  { id: 'heart', label: 'Kesehatan', Icon: Heart },
  { id: 'dumbbell', label: 'Olahraga', Icon: Dumbbell },
  { id: 'book', label: 'Pendidikan', Icon: BookOpen },
  { id: 'shirt', label: 'Belanja', Icon: Shirt },
  { id: 'shopping', label: 'Belanja', Icon: ShoppingCart },
  { id: 'monitor', label: 'Elektronik', Icon: Monitor },
  { id: 'music', label: 'Hiburan', Icon: Music },
  { id: 'plane', label: 'Liburan', Icon: Plane },
  { id: 'gift', label: 'Hadiah', Icon: Gift },
  { id: 'baby', label: 'Anak', Icon: Baby },
  { id: 'dog', label: 'Hewan', Icon: Dog },
  { id: 'leaf', label: 'Investasi', Icon: Leaf },
  { id: 'briefcase', label: 'Kerja', Icon: Briefcase },
  { id: 'wrench', label: 'Service', Icon: Wrench },
  { id: 'package', label: 'Belanja Online', Icon: Package },
  { id: 'globe', label: 'Internet', Icon: Globe },
  { id: 'clock', label: 'Langganan', Icon: Clock },
  { id: 'piggybankicon', label: 'Celengan', Icon: PiggyBankIcon },
  { id: 'star', label: 'Favorit', Icon: Star },
  { id: 'dollar', label: 'Lainnya', Icon: DollarSign },
];

function getIconComponent(iconId) {
  const found = ICON_LIST.find((i) => i.id === iconId);
  return found ? found.Icon : DollarSign;
}

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

const ONBOARDING_STEPS = [
  {
    emoji: '👋',
    title: 'Selamat datang!',
    desc: 'Mulai setup keuangan kamu dalam 4 langkah singkat.',
    hint: null,
    color: '#7FE8A4',
    // posisi pop-up: center (tidak ada spotlight)
    position: 'center',
  },
  {
    emoji: '⚙️',
    title: 'Buat kategori dulu',
    desc: 'Klik ikon pengaturan di pojok kanan atas untuk tambah kategori Expense & Saving.',
    hint: null,
    color: '#C99FE8',
    // spotlight di pojok kanan atas (settings button)
    position: 'top-right',
    // pop-up muncul di bawah elemen
    popupAlign: 'below-settings',
  },
  {
    emoji: '💰',
    title: 'Catat transaksi',
    desc: 'Tekan tombol + di pojok kanan bawah untuk catat Income, Expense, atau Saving.',
    hint: null,
    color: '#7FE8A4',
    position: 'bottom-right',
    popupAlign: 'above-fab',
  },
  {
    emoji: '📊',
    title: 'Atur budget',
    desc: 'Klik "Atur budget" di tab Dashboard untuk tentukan batas pengeluaran per kategori.',
    hint: null,
    color: '#F5C95D',
    position: 'center',
    popupAlign: 'center',
  },
  {
    emoji: '🎯',
    title: 'Cek laporan',
    desc: 'Buka tab Laporan untuk lihat pie chart dan tren 6 bulan keuangan kamu.',
    hint: null,
    color: '#6FB7E8',
    position: 'top-left',
    popupAlign: 'below-tab',
  },
];

export default function Dashboard({ user, onLogout }) {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [activeMonth, setActiveMonth] = useState(monthKey(todayStr()));
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [tab, setTab] = useState('overview');

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  const [form, setForm] = useState({ type: 'expense', amount: '', categoryId: null, note: '', date: todayStr() });
  const [catEditType, setCatEditType] = useState('expense');
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('dollar');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatLabel, setEditingCatLabel] = useState('');
  const [editingCatIcon, setEditingCatIcon] = useState('dollar');
  const [showIconPicker, setShowIconPicker] = useState(false); // untuk tambah
  const [showEditIconPicker, setShowEditIconPicker] = useState(false); // untuk edit

  // Navigasi bulan: dropdown selalu 12 bulan tahun aktif
  const activeYear = parseInt(activeMonth.slice(0, 4));
  const activeMonthIdx = parseInt(activeMonth.slice(5, 7)) - 1;

  function shiftMonth(delta) {
    let newIdx = activeMonthIdx + delta;
    let newYear = activeYear;
    if (newIdx > 11) { newIdx = 0; newYear++; }
    if (newIdx < 0) { newIdx = 11; newYear--; }
    setActiveMonth(`${newYear}-${String(newIdx + 1).padStart(2, '0')}`);
  }

  function monthLabel(key) {
    const d = new Date(key + '-01T00:00:00');
    return MONTHS_ID[d.getMonth()] + ' ' + d.getFullYear();
  }

  // Dropdown: 12 bulan tahun aktif
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const key = `${activeYear}-${String(i + 1).padStart(2, '0')}`;
    return { key, label: MONTHS_ID[i] + ' ' + activeYear };
  });

  const expenseCategories = useMemo(() => categories.filter((c) => c.type === 'expense'), [categories]);
  const savingCategories = useMemo(() => categories.filter((c) => c.type === 'saving'), [categories]);

  const loadAll = useCallback(async () => {
    try {
      const [{ data: cats, error: catErr }, { data: txs, error: txErr }, { data: bgs, error: bgErr }] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order'),
        supabase.from('transactions').select('*').order('tx_date', { ascending: false }),
        supabase.from('budgets').select('*'),
      ]);
      if (catErr || txErr || bgErr) { setSaveError(true); }
      else {
        setCategories(cats || []);
        setTransactions((txs || []).map((t) => ({ id: t.id, type: t.type, amount: Number(t.amount), category: t.category_id, note: t.note || '', date: t.tx_date })));
        setBudgets(bgs || []);
        setSaveError(false);
        // Tampilkan onboarding hanya untuk user baru (belum punya kategori sama sekali)
        if ((cats || []).length === 0) {
          const doneKey = `onboarding_done_${user.id}`;
          const alreadyDone = localStorage.getItem(doneKey);
          if (!alreadyDone) setShowOnboarding(true);
        }
      }
    } catch (e) { setSaveError(true); }
    setLoaded(true);
  }, [user.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (categories.length > 0 && !form.categoryId) {
      const defaultCat = form.type === 'saving' ? savingCategories[0] : expenseCategories[0];
      if (defaultCat) setForm((f) => ({ ...f, categoryId: defaultCat.id }));
    }
  }, [categories]);

  function catLookup(id) { return categories.find((c) => c.id === id); }

  function switchType(type) {
    const defaultCat = type === 'saving' ? savingCategories[0] : type === 'expense' ? expenseCategories[0] : null;
    setForm({ ...form, type, categoryId: defaultCat ? defaultCat.id : null });
  }

  async function addTransaction() {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return;
    if (form.type !== 'income' && !form.categoryId) return;
    const payload = { user_id: user.id, type: form.type, category_id: form.type === 'income' ? null : form.categoryId, amount: amt, note: form.note.trim(), tx_date: form.date };
    const { data, error } = await supabase.from('transactions').insert(payload).select().single();
    if (error) { setSaveError(true); return; }
    setTransactions((prev) => [{ id: data.id, type: data.type, amount: Number(data.amount), category: data.category_id, note: data.note || '', date: data.tx_date }, ...prev]);
    setForm({ type: 'expense', amount: '', categoryId: expenseCategories[0] ? expenseCategories[0].id : null, note: '', date: todayStr() });
    setShowAddModal(false);
  }

  async function deleteTransaction(id) {
    const prev = transactions;
    setTransactions((p) => p.filter((t) => t.id !== id));
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) { setSaveError(true); setTransactions(prev); }
  }

  function getBudgetAmount(categoryId, mk) {
    const b = budgets.find((b) => b.category_id === categoryId && b.month_key === mk);
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
      const { data, error } = await supabase.from('budgets').insert({ user_id: user.id, category_id: categoryId, month_key: activeMonth, amount: amt }).select().single();
      if (error) { setSaveError(true); } else { setBudgets((prev) => [...prev, data]); }
    }
  }

  async function addCategory() {
    const label = newCatLabel.trim();
    if (!label) return;
    const list = catEditType === 'saving' ? savingCategories : expenseCategories;
    const color = COLOR_PALETTE[list.length % COLOR_PALETTE.length];
    const { data, error } = await supabase.from('categories').insert({ user_id: user.id, type: catEditType, label, color, icon: newCatIcon, sort_order: list.length + 1 }).select().single();
    if (error) { setSaveError(true); return; }
    setCategories((prev) => [...prev, data]);
    setNewCatLabel('');
    setNewCatIcon('dollar');
    setShowIconPicker(false);
  }

  function startEditCategory(c) {
    setEditingCatId(c.id);
    setEditingCatLabel(c.label);
    setEditingCatIcon(c.icon || 'dollar');
    setShowEditIconPicker(false);
  }

  async function saveEditCategory() {
    const label = editingCatLabel.trim();
    if (!label) return;
    const { error } = await supabase.from('categories').update({ label, icon: editingCatIcon }).eq('id', editingCatId);
    if (error) { setSaveError(true); } else {
      setCategories((prev) => prev.map((c) => (c.id === editingCatId ? { ...c, label, icon: editingCatIcon } : c)));
    }
    setEditingCatId(null);
    setShowEditIconPicker(false);
  }

  async function setCategoryColor(catId, color) {
    const { error } = await supabase.from('categories').update({ color }).eq('id', catId);
    if (error) { setSaveError(true); } else { setCategories((prev) => prev.map((c) => (c.id === catId ? { ...c, color } : c))); }
  }

  async function deleteCategory(catId) {
    const { error } = await supabase.from('categories').delete().eq('id', catId);
    if (error) { setSaveError(true); return; }
    setCategories((prev) => prev.filter((c) => c.id !== catId));
  }

  const monthTx = useMemo(() => transactions.filter((t) => monthKey(t.date) === activeMonth), [transactions, activeMonth]);
  const totalIncome = useMemo(() => monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0), [monthTx]);
  const totalExpense = useMemo(() => monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [monthTx]);
  const totalSaving = useMemo(() => monthTx.filter((t) => t.type === 'saving').reduce((s, t) => s + t.amount, 0), [monthTx]);
  const balance = totalIncome - totalExpense - totalSaving;
  const totalUsed = totalExpense + totalSaving;

  const spendByCat = useCallback((type) => {
    const map = {};
    monthTx.filter((t) => t.type === type).forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return map;
  }, [monthTx]);

  const expenseSpend = useMemo(() => spendByCat('expense'), [spendByCat]);
  const savingSpend = useMemo(() => spendByCat('saving'), [spendByCat]);

  // Transaksi per kategori (sub-kategori untuk dashboard)
  const txByCat = useCallback((catId) => {
    return monthTx.filter((t) => t.category === catId).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [monthTx]);

  const pieData = useMemo(() => expenseCategories.filter((c) => expenseSpend[c.id] > 0).map((c) => ({ name: c.label, value: expenseSpend[c.id] || 0, color: c.color })), [expenseSpend, expenseCategories]);

  const trendData = useMemo(() => {
    const [yr, mo] = activeMonth.split('-').map(Number);
    // Hitung total saving kumulatif sampai setiap bulan dari SELURUH transaksi (bukan hanya 6 bulan)
    return Array.from({ length: 6 }, (_, i) => {
      let m = mo - (5 - i);
      let y = yr;
      while (m < 1) { m += 12; y -= 1; }
      while (m > 12) { m -= 12; y += 1; }
      const key = `${y}-${String(m).padStart(2, '0')}`;

      // Income & Expense: total bulan itu saja
      const monthTxList = transactions.filter((t) => monthKey(t.date) === key);
      const inc = monthTxList.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = monthTxList.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      // Saving: akumulatif dari semua transaksi sampai akhir bulan ini
      const savCumulative = transactions
        .filter((t) => t.type === 'saving' && t.date <= `${y}-${String(m).padStart(2, '0')}-31`)
        .reduce((s, t) => s + t.amount, 0);

      return {
        label: MONTHS_ID[m - 1] + ' ' + y,
        key,
        inc,
        exp,
        sav: savCumulative,
      };
    });
  }, [transactions, activeMonth]);

  async function handleLogout() { await supabase.auth.signOut(); onLogout(); }

  function finishOnboarding() {
    localStorage.setItem(`onboarding_done_${user.id}`, '1');
    setShowOnboarding(false);
    setOnboardingStep(0);
  }

  function nextStep() {
    if (onboardingStep < ONBOARDING_STEPS.length - 1) {
      setOnboardingStep((s) => s + 1);
    } else {
      finishOnboarding();
    }
  }

  function prevStep() {
    if (onboardingStep > 0) setOnboardingStep((s) => s - 1);
  }

  if (!loaded) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#7FE8A4', animation: 'pulse 1.2s ease-in-out infinite' }} />
        <p style={{ color: 'var(--text-secondary)', marginTop: 16, fontFamily: 'Inter, sans-serif' }}>Memuat data...</p>
      </div>
    );
  }

  const activeCatList = catEditType === 'saving' ? savingCategories : expenseCategories;

  return (
    <div className="dompet-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }

        /* ===== CSS VARIABLES — TEMA NAVY ===== */
        :root {
          --bg-base: #0B0F1A;
          --bg-card: #131929;
          --bg-card2: #1A2238;
          --bg-input: #0B0F1A;
          --border: #1E2D4A;
          --border2: #2A3B5C;
          --text-primary: #E8EDF8;
          --text-secondary: #7A90B8;
          --text-muted: #4A5A7A;
          --accent: #7FE8A4;
          --accent-text: #0B0F1A;
          --scrollbar: #1E2D4A;
          /* ===== CHART ===== */
          --chart-bg: #131929;
          --chart-grid: #24314D;
          --chart-tooltip: #182238;
          --chart-text: #E8EDF8;
          --chart-subtext: #9CB2D8;
        }

        /* Light mode — base navy terang */
        @media (prefers-color-scheme: light) {
          :root {
            --bg-base: #EEF2FA;
            --bg-card: #FFFFFF;
            --bg-card2: #F0F4FF;
            --bg-input: #F5F7FF;
            --border: #C8D4EC;
            --border2: #A8BCDC;
            --text-primary: #0D1B3E;
            --text-secondary: #3D5A8A;
            --text-muted: #7A90B8;
            --accent: #1A6B4A;
            --accent-text: #FFFFFF;
            --scrollbar: #C8D4EC;

            /* ===== CHART ===== */
            --chart-bg: #FFFFFF;
            --chart-grid: #D6E1F5;
            --chart-tooltip: #FFFFFF;
            --chart-text: #10254F;
            --chart-subtext: #6079A3;
          }
        }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 3px; }
        body { font-family: 'Inter', sans-serif; background: var(--bg-base); margin: 0; color: var(--text-primary); }
        input, select { font-family: 'Inter', sans-serif; }
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }

        .dompet-page { min-height: 100vh; background: var(--bg-base); color: var(--text-primary); padding-bottom: 90px; max-width: 480px; margin: 0 auto; position: relative; }
        .dompet-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 20px 12px; background: var(--bg-base); }
        .dompet-tabbar { display: flex; align-items: center; gap: 4px; padding: 0 20px 16px; border-bottom: 1px solid var(--border); }
        .dompet-content { padding: 16px 20px 0; }
        .dompet-columns { display: block; }
        .dompet-col-left { width: 100%; }
        .dompet-col-right { width: 100%; }
        .dompet-fab { position: fixed; bottom: 24px; right: 24px; width: 54px; height: 54px; border-radius: 16px; background: var(--accent); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 20px rgba(127,232,164,0.30); z-index: 40; }

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

      {/* Header */}
      <div className="dompet-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={styles.logoMark}><Wallet size={18} color="#0F1410" /></div>
          <span style={styles.logoText}>Dompet</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => shiftMonth(-1)} style={styles.monthBtn}>‹</button>
          <select
            value={activeMonth}
            onChange={(e) => setActiveMonth(e.target.value)}
            style={styles.monthSelect}
          >
            {monthOptions.map((m) => (
              <option key={m.key} value={m.key} style={{ background: 'var(--bg-card)' }}>{m.label}</option>
            ))}
          </select>
          <button onClick={() => shiftMonth(1)} style={styles.monthBtn}>›</button>
          <button onClick={handleLogout} style={{ ...styles.monthBtn, marginLeft: 4 }} aria-label="Keluar"><LogOut size={14} color="#9CA89F" /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="dompet-tabbar">
        {[
          { id: 'overview', label: 'Dashboard' },
          { id: 'transactions', label: 'Transaksi' },
          { id: 'reports', label: 'Laporan' },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ ...styles.tabBtn, ...(tab === t.id ? styles.tabBtnActive : {}) }}>{t.label}</button>
        ))}
        <button onClick={() => setShowCategoryModal(true)} style={styles.settingsBtn} aria-label="Kelola kategori"><Settings size={16} color="#9CA89F" /></button>
      </div>

      <div className="dompet-content">

        {/* ====== TAB DASHBOARD ====== */}
        {tab === 'overview' && (
          <div className="dompet-columns">
            {/* Kolom kiri: ringkasan + kartu budget expense */}
            <div className="dompet-col-left">
              {/* Ringkasan saldo */}
              <div style={styles.summaryGrid}>
                <div style={{ ...styles.summaryCard, gridColumn: '1 / -1' }}>
                  <span style={styles.summaryLabel}>Sisa saldo bulan ini</span>
                  <span style={{ ...styles.balanceNumber, color: balance >= 0 ? '#7FE8A4' : '#FF9466' }}>{formatRupiah(balance)}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Income dikurangi expense dan saving/investasi</span>
                </div>
                <div style={styles.summaryCard}>
                  <div style={styles.summaryIconRow}><TrendingUp size={14} color="#7FE8A4" /><span style={styles.summaryLabel}>Income</span></div>
                  <span style={{ ...styles.summaryNumber, color: '#7FE8A4' }}>{formatRupiah(totalIncome)}</span>
                </div>
                <div style={styles.summaryCard}>
                  <span style={styles.summaryLabel}>Total terpakai</span>
                  <span style={{ ...styles.summaryNumber, color: 'var(--text-primary)' }}>{formatRupiah(totalUsed)}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Expense + saving</span>
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

              {/* Kartu budget expense per kategori + sub-transaksi */}
              <div style={{ ...styles.sectionHeader, marginTop: 24 }}>
                <span style={styles.sectionTitle}>Budget expense</span>
                <button onClick={() => setShowBudgetModal(true)} style={styles.linkBtn}>Atur budget</button>
              </div>
              {expenseCategories.length === 0 ? (
                <div style={styles.emptyCard}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Belum ada kategori expense.</span>
                  <button onClick={() => setShowCategoryModal(true)} style={{ ...styles.linkBtn, marginTop: 8, display: 'block' }}>+ Tambah kategori</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {expenseCategories.map((c) => {
                    const spent = expenseSpend[c.id] || 0;
                    const budget = getBudgetAmount(c.id, activeMonth);
                    const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;
                    const over = budget > 0 && spent > budget;
                    let barColor = '#7FE8A4';
                    if (pct > 70) barColor = '#F5C95D';
                    if (pct >= 100) barColor = '#FF9466';
                    const CatIcon = getIconComponent(c.icon);
                    const subTx = txByCat(c.id);
                    return (
                      <div key={c.id} style={styles.budgetCard}>
                        {/* Header kategori */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: c.color + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <CatIcon size={16} color={c.color} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.label}</div>
                            <div style={{ fontSize: 11, color: over ? '#FF9466' : 'var(--text-muted)' }}>
                              {formatRupiah(spent)}{budget > 0 ? ` / ${formatRupiah(budget)}` : ''}
                              {over && ' — Lewat!'}
                            </div>
                          </div>
                          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, color: over ? '#FF9466' : 'var(--text-primary)', flexShrink: 0 }}>
                            {formatRupiah(spent)}
                          </span>
                        </div>
                        {/* Progress bar */}
                        {budget > 0 && (
                          <div style={styles.barTrack}>
                            <div style={{ ...styles.barFill, width: pct + '%', background: barColor }} />
                          </div>
                        )}
                        {/* Sub-transaksi */}
                        {subTx.length > 0 && (
                          <div style={{ marginTop: 10, borderTop: '1px solid #22291F', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {subTx.map((t) => (
                              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {t.note || c.label}
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                                  {new Date(t.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#FF9466', flexShrink: 0 }}>-{formatRupiah(t.amount)}</span>
                                <button onClick={() => deleteTransaction(t.id)} style={styles.deleteBtn}><Trash2 size={12} color="#6B7568" /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Kolom kanan: kartu budget saving per kategori + sub-transaksi */}
            <div className="dompet-col-right">
              <div style={{ ...styles.sectionHeader, marginTop: 24 }}>
                <span style={styles.sectionTitle}>Target saving & investasi</span>
                <button onClick={() => setShowBudgetModal(true)} style={styles.linkBtn}>Atur target</button>
              </div>
              {savingCategories.length === 0 ? (
                <div style={styles.emptyCard}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Belum ada kategori saving.</span>
                  <button onClick={() => setShowCategoryModal(true)} style={{ ...styles.linkBtn, marginTop: 8, display: 'block' }}>+ Tambah kategori</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {savingCategories.map((c) => {
                    const spent = savingSpend[c.id] || 0;
                    const target = getBudgetAmount(c.id, activeMonth);
                    const pct = target > 0 ? Math.min(100, (spent / target) * 100) : 0;
                    const CatIcon = getIconComponent(c.icon);
                    const subTx = txByCat(c.id);
                    return (
                      <div key={c.id} style={styles.budgetCard}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: c.color + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <CatIcon size={16} color={c.color} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{c.label}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                              {formatRupiah(spent)}{target > 0 ? ` / ${formatRupiah(target)}` : ''}
                            </div>
                          </div>
                          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, color: '#6FB7E8', flexShrink: 0 }}>
                            {formatRupiah(spent)}
                          </span>
                        </div>
                        {target > 0 && (
                          <div style={styles.barTrack}>
                            <div style={{ ...styles.barFill, width: pct + '%', background: '#6FB7E8' }} />
                          </div>
                        )}
                        {subTx.length > 0 && (
                          <div style={{ marginTop: 10, borderTop: '1px solid #22291F', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {subTx.map((t) => (
                              <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.note || c.label}</span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{new Date(t.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#6FB7E8', flexShrink: 0 }}>-{formatRupiah(t.amount)}</span>
                                <button onClick={() => deleteTransaction(t.id)} style={styles.deleteBtn}><Trash2 size={12} color="#6B7568" /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====== TAB TRANSAKSI ====== */}
        {tab === 'transactions' && (
          <div style={styles.txList}>
            {monthTx.length === 0 && <div style={styles.emptyHint}>Belum ada transaksi bulan ini.</div>}
            {monthTx.map((t) => (<TxRow key={t.id} t={t} onDelete={deleteTransaction} catLookup={catLookup} />))}
          </div>
        )}

        {/* ====== TAB LAPORAN ====== */}
        {tab === 'reports' && (
          <>
            {/* Ringkasan saldo */}
            <div style={{ ...styles.summaryGrid, marginBottom: 28 }}>
              <div style={{ ...styles.summaryCard, gridColumn: '1 / -1' }}>
                <span style={styles.summaryLabel}>Sisa saldo bulan ini</span>
                <span style={{ ...styles.balanceNumber, color: balance >= 0 ? '#7FE8A4' : '#FF9466' }}>{formatRupiah(balance)}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Income dikurangi expense dan saving/investasi</span>
              </div>
              <div style={styles.summaryCard}>
                <div style={styles.summaryIconRow}><TrendingUp size={14} color="#7FE8A4" /><span style={styles.summaryLabel}>Income</span></div>
                <span style={{ ...styles.summaryNumber, color: '#7FE8A4' }}>{formatRupiah(totalIncome)}</span>
              </div>
              <div style={styles.summaryCard}>
                <span style={styles.summaryLabel}>Total terpakai</span>
                <span style={{ ...styles.summaryNumber, color: 'var(--text-primary)' }}>{formatRupiah(totalUsed)}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Expense + saving</span>
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

            {/* 3 Pie chart — stack vertikal di HP, 3 kolom di desktop */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, marginBottom: 32 }} className="pie-grid">
              <style>{`.pie-grid { } @media(min-width:900px){.pie-grid{grid-template-columns:1fr 1fr 1fr !important;}}`}</style>
              {[
                { label: 'Income', color: '#7FE8A4', total: totalIncome, data: totalIncome > 0 ? [{ name: 'Income', value: totalIncome, color: '#7FE8A4' }] : [] },
                { label: 'Expense', color: '#FF9466', total: totalExpense, data: pieData },
                { label: 'Saving', color: '#6FB7E8', total: totalSaving, data: savingCategories.filter((c) => savingSpend[c.id] > 0).map((c) => ({ name: c.label, value: savingSpend[c.id], color: c.color })) },
              ].map((section) => (
                <div key={section.label} style={{ background: chartTheme.bg, border: "1px solid var(--border)", borderRadius: 14, padding: '20px 18px' }}>
                  <div style={styles.sectionHeader}>
                    <span style={styles.sectionTitle}>{section.label}</span>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: section.color }}>{formatRupiah(section.total)}</span>
                  </div>
                  {section.total > 0 ? (
                    <>
                      <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie data={section.data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                              {section.data.map((entry, i) => (<Cell key={i} fill={entry.color} stroke="var(--chart-bg)" strokeWidth={3} />))}
                            </Pie>
                            <Tooltip formatter={(v) => formatRupiah(v)} contentStyle={{ background: chartTheme.tooltip, border: '1px solid var(--border)', borderRadius: 8, color: chartTheme.text, fontSize: 13, fontWeight: 600 }} itemStyle={{ color: chartTheme.text }} labelStyle={{ color: chartTheme.subtext }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 12 }}>
                        {section.data.map((p) => (
                          <div key={p.name} style={styles.legendItem}>
                            <span style={{ width: 9, height: 9, borderRadius: 2, background: p.color, display: 'inline-block', flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: 'var(--chart-subtext)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                            <span style={{ fontSize: 12, color: 'var(--chart-text)', flexShrink: 0, fontWeight: 600 }}>{formatRupiah(p.value)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ ...styles.emptyHint, padding: '40px 0' }}>Belum ada data {section.label.toLowerCase()} bulan ini.</div>
                  )}
                </div>
              ))}
            </div>

            {/* Tren 6 bulan */}
            <div style={{ background: 'var(--chart-bg)', border:'1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 32 }}>
              <div style={styles.sectionHeader}><span style={styles.sectionTitle}>Tren 6 bulan</span></div>
              {(() => {
                const allVals = trendData.flatMap((d) => [d.inc, d.exp, d.sav]).filter((v) => v > 0);
                const maxVal = allVals.length > 0 ? Math.max(...allVals) : 0;
                const minVal = allVals.length > 0 ? Math.min(...allVals) : 0;
                // domain: 0 sampai 110% dari nilai max agar bar tidak menyentuh tepi atas
                const yMax = maxVal > 0 ? (dataMax) => Math.ceil(dataMax * 1.1) : 'auto';
                return (
                  <>
                    {maxVal > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--chart-subtext)' }}>
                          Min: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                            {minVal >= 1000000 ? (minVal / 1000000).toFixed(2) + ' jt' : minVal >= 1000 ? (minVal / 1000).toFixed(0) + ' rb' : formatRupiah(minVal)}
                          </span>
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--chart-subtext)' }}>
                          Max: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                            {maxVal >= 1000000 ? (maxVal / 1000000).toFixed(2) + ' jt' : maxVal >= 1000 ? (maxVal / 1000).toFixed(0) + ' rb' : formatRupiah(maxVal)}
                          </span>
                        </span>
                      </div>
                    )}
                    <div style={{ width: '100%', height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={trendData.map((d) => ({ ...d, label: d.label.slice(0, 3) }))}
                          margin={{ top: 12, right: 16, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                          <XAxis
                            dataKey="label"
                            stroke="var(--chart-subtext)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: "var(--chart-grid)" }}
                          />
                          <YAxis
                            stroke="var(--chart-subtext)"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            width={48}
                            domain={[0, (dataMax) => dataMax > 0 ? Math.ceil(dataMax * 1.15 / 500000) * 500000 : 1000000]}
                            tickFormatter={(v) => {
                              if (v === 0) return '0';
                              if (v >= 1000000) return (v / 1000000).toFixed(v % 1000000 === 0 ? 0 : 1) + 'jt';
                              if (v >= 1000) return (v / 1000).toFixed(0) + 'rb';
                              return v;
                            }}
                          />
                          <Tooltip
                            formatter={(v, name) => [formatRupiah(v), name]}
                            contentStyle={{ background: 'var(--chart-tooltip)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--chart-text)', fontSize: 13 }}
                            labelStyle={{ color: 'var(--chart-subtext)', marginBottom: 4, fontWeight: 600 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="inc"
                            stroke="#7FE8A4"
                            strokeWidth={2.5}
                            name="Income"
                            dot={{ r: 5, fill: '#7FE8A4', stroke: '#0F1410', strokeWidth: 2 }}
                            activeDot={{ r: 7, fill: '#7FE8A4', stroke: '#0F1410', strokeWidth: 2 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="exp"
                            stroke="#FF9466"
                            strokeWidth={2.5}
                            name="Expense"
                            dot={{ r: 5, fill: '#FF9466', stroke: '#0F1410', strokeWidth: 2 }}
                            activeDot={{ r: 7, fill: '#FF9466', stroke: '#0F1410', strokeWidth: 2 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="sav"
                            stroke="#6FB7E8"
                            strokeWidth={2.5}
                            name="Saving"
                            dot={{ r: 5, fill: '#6FB7E8', stroke: '#0F1410', strokeWidth: 2 }}
                            activeDot={{ r: 7, fill: '#6FB7E8', stroke: '#0F1410', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                );
              })()}
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                {[['#7FE8A4','Income'],['#FF9466','Expense'],['#6FB7E8','Saving']].map(([color, name]) => (
                  <span key={name} style={styles.legendItem2}><span style={{ width: 9, height: 9, borderRadius: 2, background: color, display: 'inline-block' }} />{name}</span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setShowAddModal(true)} className="dompet-fab" aria-label="Tambah transaksi"><Plus size={24} color="#0F1410" /></button>

      {/* ====== ONBOARDING OVERLAY ====== */}
      {showOnboarding && (() => {
        const step = ONBOARDING_STEPS[onboardingStep];
        const isLast = onboardingStep === ONBOARDING_STEPS.length - 1;
        const isFirst = onboardingStep === 0;

        // Posisi pop-up dan spotlight berdasarkan step
        const spotlightMap = {
          'top-right':    { top: 140, right: 20, width: 40, height: 40, label: '⬆️', labelPos: { top: 190, right: 14 } },
          'bottom-right': { bottom: 80, right: 20, width: 58, height: 58, label: '⬇️', labelPos: { bottom: 148, right: 26 } },
          'top-left':     { top: 162, left: 20, width: 80, height: 36, label: '⬆️', labelPos: { top: 206, left: 28 } },
          'center':       null,
        };
        const spotlight = spotlightMap[step.position];

        // Pop-up kecil di pojok atau tengah
        const popupStyleMap = {
          'above-fab':      { position: 'fixed', bottom: 148, right: 16, width: 240 },
          'below-settings': { position: 'fixed', top: 190, right: 12, width: 240 },
          'below-tab':      { position: 'fixed', top: 200, left: 16, width: 240 },
          'center':         { position: 'fixed', bottom: '40%', left: '50%', transform: 'translateX(-50%)', width: 280 },
        };
        const popupStyle = popupStyleMap[step.popupAlign || 'center'];

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, pointerEvents: 'none' }}>
            <style>{`
              @keyframes obFadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
              @keyframes obPulseRing { 0%,100% { box-shadow: 0 0 0 0 ${step.color}66; } 50% { box-shadow: 0 0 0 8px ${step.color}00; } }
              .ob-popup { animation: obFadeIn 0.25s cubic-bezier(0.34,1.56,0.64,1); }
              .ob-ring { animation: obPulseRing 1.8s ease-in-out infinite; }
            `}</style>

            {/* Overlay gelap dengan "lubang" spotlight */}
            {spotlight && (
              <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
                {/* Overlay atas */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0,
                  height: spotlight.top ?? (spotlight.bottom ? `calc(100vh - ${spotlight.bottom + spotlight.height + 20}px)` : 0),
                  background: 'rgba(0,0,0,0.72)' }} />
                {/* Overlay bawah */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: spotlight.bottom ?? 0,
                  background: 'rgba(0,0,0,0.72)' }} />
                {/* Kiri dari spotlight */}
                <div style={{
                  position: 'absolute',
                  top: spotlight.top ?? `calc(100vh - ${(spotlight.bottom || 0) + spotlight.height + 20}px)`,
                  left: 0,
                  width: spotlight.left ?? (spotlight.right ? `calc(100vw - ${spotlight.right + spotlight.width + 8}px)` : 0),
                  height: spotlight.height + 16,
                  background: 'rgba(0,0,0,0.72)',
                }} />
                {/* Kanan dari spotlight */}
                <div style={{
                  position: 'absolute',
                  top: spotlight.top ?? `calc(100vh - ${(spotlight.bottom || 0) + spotlight.height + 20}px)`,
                  right: 0,
                  width: spotlight.right ?? 0,
                  height: spotlight.height + 16,
                  background: 'rgba(0,0,0,0.72)',
                }} />
                {/* Ring pulsing di sekitar spotlight */}
                <div className="ob-ring" style={{
                  position: 'absolute',
                  top: (spotlight.top != null ? spotlight.top - 4 : undefined),
                  bottom: (spotlight.bottom != null ? spotlight.bottom - 4 : undefined),
                  left: (spotlight.left != null ? spotlight.left - 4 : undefined),
                  right: (spotlight.right != null ? spotlight.right - 4 : undefined),
                  width: spotlight.width + 8,
                  height: spotlight.height + 8,
                  borderRadius: 12,
                  border: `2px solid ${step.color}`,
                }} />
              </div>
            )}

            {/* Overlay gelap penuh untuk step tanpa spotlight */}
            {!spotlight && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(3px)' }} />
            )}

            {/* Pop-up kecil */}
            <div className="ob-popup" key={onboardingStep} style={{
              ...popupStyle,
              pointerEvents: 'all',
              background: 'var(--bg-card)',
              borderRadius: 18,
              padding: '16px 18px',
              boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${step.color}33`,
              border: `1px solid ${step.color}44`,
            }}>
              {/* Header: emoji + dots + skip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 28 }}>{step.emoji}</span>
                <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                  {ONBOARDING_STEPS.map((_, i) => (
                    <div key={i} onClick={() => setOnboardingStep(i)} style={{
                      width: i === onboardingStep ? 18 : 5,
                      height: 5, borderRadius: 3,
                      background: i === onboardingStep ? step.color : 'var(--bg-card2)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                    }} />
                  ))}
                </div>
                <button onClick={finishOnboarding} style={{
                  background: 'transparent', border: 'none',
                  color: 'var(--text-muted)', fontSize: 12,
                  cursor: 'pointer', padding: '2px 6px', borderRadius: 6,
                }}>✕</button>
              </div>

              {/* Judul */}
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700, fontSize: 15,
                color: step.color, marginBottom: 6,
              }}>{step.title}</div>

              {/* Deskripsi */}
              <p style={{
                fontSize: 12.5, color: 'var(--text-secondary)',
                lineHeight: 1.6, margin: '0 0 14px',
              }}>{step.desc}</p>

              {/* Tombol */}
              <div style={{ display: 'flex', gap: 8 }}>
                {!isFirst && (
                  <button onClick={prevStep} style={{
                    flex: 1, padding: '8px 0', borderRadius: 10,
                    border: '1px solid var(--border)', background: 'transparent',
                    color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
                  }}>←</button>
                )}
                <button onClick={nextStep} style={{
                  flex: 3, padding: '9px 0', borderRadius: 10, border: 'none',
                  background: step.color, color: '#0B0F1A',
                  fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                  boxShadow: `0 4px 12px ${step.color}44`,
                }}>
                  {isLast ? '🚀 Mulai!' : 'Lanjut →'}
                </button>
              </div>

              {/* Step counter */}
              <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
                {onboardingStep + 1} / {ONBOARDING_STEPS.length}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: tambah transaksi */}
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
            {(form.type === 'expense' || form.type === 'saving') && (
              <>
                <label style={styles.formLabel}>Kategori</label>
                {(form.type === 'expense' ? expenseCategories : savingCategories).length === 0 ? (
                  <div style={styles.emptyHint}>Belum ada kategori. Tambahkan lewat ikon pengaturan di atas.</div>
                ) : (
                  <div style={styles.catGrid}>
                    {(form.type === 'expense' ? expenseCategories : savingCategories).map((c) => {
                      const CatIcon = getIconComponent(c.icon);
                      return (
                        <button key={c.id} onClick={() => setForm({ ...form, categoryId: c.id })} style={{ ...styles.catChip, borderColor: form.categoryId === c.id ? c.color : '#2A332C', background: form.categoryId === c.id ? c.color + '22' : 'transparent' }}>
                          <CatIcon size={13} color={c.color} />
                          {c.label}
                        </button>
                      );
                    })}
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

      {/* Modal: atur budget */}
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
              {expenseCategories.map((c) => {
                const CatIcon = getIconComponent(c.icon);
                return (
                  <div key={c.id} style={styles.budgetInputRow}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-primary)', minWidth: 150 }}>
                      <CatIcon size={14} color={c.color} />{c.label}
                    </span>
                    <input type="number" inputMode="numeric" placeholder="0" defaultValue={getBudgetAmount(c.id, activeMonth) || ''} onBlur={(e) => setBudgetAmount(c.id, e.target.value)} style={{ ...styles.input, marginBottom: 0 }} />
                  </div>
                );
              })}
              <div style={{ ...styles.budgetGroupLabel, marginTop: 16 }}>Saving & investasi</div>
              {savingCategories.length === 0 && <div style={styles.emptyHint}>Belum ada kategori saving.</div>}
              {savingCategories.map((c) => {
                const CatIcon = getIconComponent(c.icon);
                return (
                  <div key={c.id} style={styles.budgetInputRow}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-primary)', minWidth: 150 }}>
                      <CatIcon size={14} color={c.color} />{c.label}
                    </span>
                    <input type="number" inputMode="numeric" placeholder="0" defaultValue={getBudgetAmount(c.id, activeMonth) || ''} onBlur={(e) => setBudgetAmount(c.id, e.target.value)} style={{ ...styles.input, marginBottom: 0 }} />
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowBudgetModal(false)} style={styles.submitBtn}><Check size={16} color="#0F1410" />Selesai</button>
          </div>
        </div>
      )}

      {/* Modal: kelola kategori */}
      {showCategoryModal && (
        <div style={styles.modalOverlay} onClick={() => { setShowCategoryModal(false); setEditingCatId(null); setNewCatLabel(''); setShowIconPicker(false); setShowEditIconPicker(false); }}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Kelola kategori</span>
              <button onClick={() => { setShowCategoryModal(false); setEditingCatId(null); setNewCatLabel(''); setShowIconPicker(false); setShowEditIconPicker(false); }} style={styles.iconBtn}><X size={18} color="#9CA89F" /></button>
            </div>
            <div style={styles.typeToggle}>
              <button onClick={() => { setCatEditType('expense'); setEditingCatId(null); }} style={{ ...styles.typeBtn, ...(catEditType === 'expense' ? styles.typeBtnExpenseActive : {}) }}>Expense</button>
              <button onClick={() => { setCatEditType('saving'); setEditingCatId(null); }} style={{ ...styles.typeBtn, ...(catEditType === 'saving' ? styles.typeBtnSavingActive : {}) }}>Saving</button>
            </div>

            {/* Daftar kategori */}
            <div style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 4, marginBottom: 16 }}>
              {activeCatList.length === 0 && <div style={styles.emptyHint}>Belum ada kategori. Tambahkan di bawah.</div>}
              {activeCatList.map((c) => {
                const CatIcon = getIconComponent(c.icon);
                return (
                  <div key={c.id} style={{ ...styles.categoryRow, flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                    {editingCatId === c.id ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button onClick={() => setShowEditIconPicker(!showEditIconPicker)} style={{ width: 34, height: 34, borderRadius: 8, background: c.color + '25', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                            {React.createElement(getIconComponent(editingCatIcon), { size: 16, color: c.color })}
                          </button>
                          <input type="text" value={editingCatLabel} onChange={(e) => setEditingCatLabel(e.target.value)} style={{ ...styles.input, marginBottom: 0, flex: 1 }} autoFocus />
                          <button onClick={saveEditCategory} style={styles.smallIconBtn}><Check size={15} color="#7FE8A4" /></button>
                          <button onClick={() => { setEditingCatId(null); setShowEditIconPicker(false); }} style={styles.smallIconBtn}><X size={15} color="#9CA89F" /></button>
                        </div>
                        {showEditIconPicker && (
                          <div style={styles.iconGrid}>
                            {ICON_LIST.map((ic) => (
                              <button key={ic.id} onClick={() => { setEditingCatIcon(ic.id); setShowEditIconPicker(false); }}
                                style={{ ...styles.iconChip, borderColor: editingCatIcon === ic.id ? '#7FE8A4' : '#2A332C', background: editingCatIcon === ic.id ? '#7FE8A422' : 'transparent' }}
                                title={ic.label}>
                                <ic.Icon size={16} color={editingCatIcon === ic.id ? '#7FE8A4' : 'var(--text-muted)'} />
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: c.color + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <CatIcon size={14} color={c.color} />
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 88 }}>
                          {COLOR_PALETTE.map((col) => (
                            <button key={col} onClick={() => setCategoryColor(c.id, col)} style={{ width: 14, height: 14, borderRadius: '50%', background: col, border: c.color === col ? '2px solid #EAF0EA' : '2px solid transparent', cursor: 'pointer', padding: 0, flexShrink: 0 }} />
                          ))}
                        </div>
                        <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</span>
                        <button onClick={() => startEditCategory(c)} style={styles.smallIconBtn}><Pencil size={14} color="#9CA89F" /></button>
                        <button onClick={() => deleteCategory(c.id)} style={styles.smallIconBtn}><Trash2 size={14} color="#FF9466" /></button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tambah kategori baru */}
            <label style={styles.formLabel}>Tambah kategori baru</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <button onClick={() => setShowIconPicker(!showIconPicker)}
                style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                title="Pilih ikon">
                {React.createElement(getIconComponent(newCatIcon), { size: 18, color: 'var(--text-secondary)' })}
              </button>
              <input type="text" placeholder={catEditType === 'saving' ? 'Contoh: Emergency Fund' : 'Contoh: Belanja Bulanan'} value={newCatLabel} onChange={(e) => setNewCatLabel(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addCategory(); }} style={{ ...styles.input, marginBottom: 0, flex: 1 }} />
              <button onClick={addCategory} style={{ ...styles.smallIconBtn, width: 38, height: 38, background: '#7FE8A4', flexShrink: 0 }}><Plus size={18} color="#0F1410" /></button>
            </div>
            {showIconPicker && (
              <div style={styles.iconGrid}>
                {ICON_LIST.map((ic) => (
                  <button key={ic.id} onClick={() => { setNewCatIcon(ic.id); setShowIconPicker(false); }}
                    style={{ ...styles.iconChip, borderColor: newCatIcon === ic.id ? '#7FE8A4' : '#2A332C', background: newCatIcon === ic.id ? '#7FE8A422' : 'transparent' }}
                    title={ic.label}>
                    <ic.Icon size={16} color={newCatIcon === ic.id ? '#7FE8A4' : 'var(--text-muted)'} />
                  </button>
                ))}
              </div>
            )}

            <button onClick={() => { setShowCategoryModal(false); setEditingCatId(null); setNewCatLabel(''); setShowIconPicker(false); setShowEditIconPicker(false); }} style={styles.submitBtn}><Check size={16} color="#0F1410" />Selesai</button>
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
  const CatIcon = cat ? getIconComponent(cat.icon) : null;
  let iconEl = <TrendingDown size={15} color={cat ? cat.color : '#A8A89C'} />;
  let iconBg = cat ? cat.color + '22' : '#A8A89C22';
  let amountColor = '#FF9466'; let sign = '-';
  if (isIncome) { iconEl = <TrendingUp size={15} color="#7FE8A4" />; iconBg = '#7FE8A422'; amountColor = '#7FE8A4'; sign = '+'; }
  else if (isSaving) { iconEl = <PiggyBank size={15} color={cat ? cat.color : '#6FB7E8'} />; amountColor = '#6FB7E8'; }
  if (cat && CatIcon) iconEl = <CatIcon size={15} color={cat.color} />;
  return (
    <div style={styles.txRow}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{iconEl}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.note || (isIncome ? 'Income' : cat ? cat.label : 'Lainnya')}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{new Date(t.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: amountColor }}>{sign}{formatRupiah(t.amount)}</span>
        <button onClick={() => onDelete(t.id)} style={styles.deleteBtn}><Trash2 size={14} color="#6B7568" /></button>
      </div>
    </div>
  );
}

const styles = {
  errorBanner: { background: '#3A1A18', color: '#FF9466', fontSize: 12, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6 },
  logoMark: { width: 30, height: 30, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', color: 'var(--text-primary)' },
  monthBtn: { width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  monthSelect: { background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 7, padding: '5px 8px', fontSize: 12, cursor: 'pointer' },
  tabBtn: { background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 13, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 500 },
  tabBtnActive: { background: 'var(--bg-card)', color: 'var(--text-primary)' },
  settingsBtn: { marginLeft: 'auto', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  summaryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 },
  summaryCard: { background: 'var(--bg-card)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 },
  summaryLabel: { fontSize: 12, color: 'var(--text-secondary)' },
  summaryIconRow: { display: 'flex', alignItems: 'center', gap: 6 },
  balanceNumber: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 28, letterSpacing: '-0.02em' },
  summaryNumber: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' },
  linkBtn: { background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: 12, cursor: 'pointer', fontWeight: 500 },
  budgetCard: { background: 'var(--bg-card)', borderRadius: 14, padding: '14px 16px' },
  emptyCard: { background: 'var(--bg-card)', borderRadius: 14, padding: '20px 16px', textAlign: 'center' },
  barTrack: { height: 5, borderRadius: 3, background: 'var(--bg-card2)', overflow: 'hidden', marginBottom: 2 },
  barFill: { height: '100%', borderRadius: 3, transition: 'width 0.4s ease' },
  txList: { display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 20 },
  txRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' },
  deleteBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' },
  emptyHint: { fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' },
  legendWrap: { display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, marginBottom: 24 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 8 },
  legendItem2: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 },
  modalCard: { background: 'var(--bg-card)', borderRadius: '20px 20px 0 0', padding: 20, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 -8px 30px rgba(0,0,0,0.4)' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' },
  iconBtn: { background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 },
  typeToggle: { display: 'flex', gap: 6, marginBottom: 18 },
  typeBtn: { flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' },
  typeBtnExpenseActive: { background: '#FF946622', borderColor: '#FF9466', color: '#FF9466' },
  typeBtnSavingActive: { background: '#6FB7E822', borderColor: '#6FB7E8', color: '#6FB7E8' },
  typeBtnIncomeActive: { background: '#7FE8A422', borderColor: '#7FE8A4', color: '#7FE8A4' },
  formLabel: { display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, marginTop: 14 },
  input: { width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 12px', color: 'var(--text-primary)', fontSize: 14, outline: 'none', marginBottom: 4 },
  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 },
  catChip: { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 10px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer', textAlign: 'left' },
  submitBtn: { width: '100%', marginTop: 20, padding: '13px 0', borderRadius: 12, border: 'none', background: 'var(--accent)', color: 'var(--accent-text)', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  budgetInputRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 },
  budgetGroupLabel: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 },
  categoryRow: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)' },
  smallIconBtn: { background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, flexShrink: 0 },
  iconGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, padding: '10px 0', marginBottom: 8, maxHeight: 220, overflowY: 'auto' },
  iconChip: { width: 36, height: 36, borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
};
