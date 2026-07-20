import React, { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import * as XLSX from 'xlsx';
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
  QrCode, Nfc, BarChart2, TrendingDown as TrendingDownIcon, Package,
  Download, Upload, Sun, Moon, Target, HelpCircle
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

const rupiahNumberFormatter = new Intl.NumberFormat('id-ID', {
  style: 'decimal',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
function formatRupiah(n) {
  const v = Math.round(Number(n) || 0);
  // Pakai Intl.NumberFormat (locale-aware, id-ID) untuk grouping ribuan yang benar,
  // lalu taruh "Rp" sebelum tanda minus supaya tampilannya sama seperti sebelumnya (mis. "Rp-5.830.740"),
  // tanpa spasi aneh yang muncul kalau pakai style:'currency' bawaan Intl.
  return 'Rp' + (v < 0 ? '-' : '') + rupiahNumberFormatter.format(Math.abs(v));
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function monthKey(dateStr) {
  return dateStr.slice(0, 7);
}
function lastDayOfMonth(year, month /* 1-12 */) {
  return new Date(year, month, 0).getDate();
}
function pad2(n) { return String(n).padStart(2, '0'); }

// Gaya "aktif" untuk card ringkasan yang berfungsi sebagai shortcut filter (Income/Expense/Saving).
// Tidak mengubah desain dasar card — hanya menambahkan border/background/shadow saat filter tsb aktif.
function summaryCardActiveStyle(isActive, color) {
  return {
    cursor: 'pointer',
    transition: 'border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease, transform 0.2s ease',
    border: isActive ? `1.5px solid ${color}` : '1.5px solid transparent',
    background: isActive ? `linear-gradient(0deg, ${color}14, ${color}14), var(--bg-card)` : 'var(--bg-card)',
    boxShadow: isActive ? `0 6px 20px ${color}33` : 'none',
  };
}

const ONBOARDING_STEPS = [
  {
    emoji: '👋',
    title: 'Selamat datang!',
    desc: 'Yuk kenalan dulu sama Dompet — aplikasi buat catat keuangan kamu sehari-hari. Cuma butuh beberapa langkah singkat untuk mulai.',
    color: '#7FE8A4',
    target: null, // tidak ada spotlight, pop-up di tengah
    tab: 'overview',
  },
  {
    emoji: '⚙️',
    title: 'Buat kategori dulu',
    desc: 'Klik ikon pengaturan ini untuk bikin kategori Expense (pengeluaran) & Saving (tabungan) sesuai kebutuhan kamu.',
    color: '#C99FE8',
    target: 'settings', // ref ke tombol kelola kategori
    tab: 'overview',
    action: 'openCategoryModal',
  },
  {
    emoji: '💰',
    title: 'Catat transaksi pertama',
    desc: 'Tekan tombol + ini untuk catat Income, Expense, atau Saving. Kategori sekarang opsional — bisa langsung simpan walau belum pilih kategori.',
    color: '#7FE8A4',
    target: 'fab', // ref ke tombol tambah transaksi
    tab: 'overview',
    action: 'openAddModal',
  },
  {
    emoji: '🔎',
    title: 'Klik kartu buat filter cepat',
    desc: 'Klik kartu Expense ini buat langsung lihat semua transaksi Expense di tab Transaksi — jadi shortcut, nggak perlu atur filter manual.',
    color: '#FF9466',
    target: 'expenseCard',
    tab: 'overview',
  },
  {
    emoji: '🔍',
    title: 'Cari, filter & export/import',
    desc: 'Di tab Transaksi ini, kamu bisa cari transaksi, filter per tipe, dan export/import data ke Excel — enak buat backup atau input transaksi banyak sekaligus.',
    color: '#6FB7E8',
    target: 'txSearch',
    tab: 'transactions', // otomatis pindah ke tab Transaksi
  },
  {
    emoji: '📊',
    title: 'Atur budget & target saving',
    desc: 'Klik "Atur budget" di kartu Budget Expense untuk tentukan batas pengeluaran per kategori. Ada juga "Atur target" buat goal saving jangka panjang (misal beli motor) lengkap dengan estimasi tercapainya.',
    color: '#F5C95D',
    target: 'budgetLink',
    tab: 'overview', // pindah balik ke Dashboard setelah step sebelumnya sempat ke tab Transaksi
    action: 'openBudgetModal',
  },
  {
    emoji: '🔁',
    title: 'Transaksi berulang',
    desc: 'Punya tagihan rutin kayak gaji, wifi, atau cicilan? Klik "Kelola" di sini buat atur transaksi yang otomatis tercatat sendiri tiap bulan.',
    color: '#C99FE8',
    target: 'recurringKelola',
    tab: 'overview',
    action: 'openRecurringModal',
  },
  {
    emoji: '🎯',
    title: 'Baca laporan bulanan',
    desc: 'Klik tab Laporan ini buat lihat pie chart dan tren 6 bulan keuangan kamu — enak dipantau tiap akhir bulan.',
    color: '#6FB7E8',
    target: 'reportsTab', // ref ke tab Laporan, otomatis pindah tab
    tab: 'reports',
  },
  {
    emoji: '🥇',
    title: 'Lacak investasi Emas & Reksadana',
    desc: 'Klik ikon pengaturan ini, lalu tandai kategori saving sebagai "Emas" atau "Reksadana Syariah". Setelah ditandai, harga emas & NAV reksadana otomatis ter-update tiap hari — nggak perlu isi manual, kecuali mau lebih presisi.',
    color: '#F5C95D',
    target: 'settings',
    tab: 'overview',
    action: 'openCategoryModal',
  },
  {
    emoji: '💸',
    title: 'Jual aset? Pakai tombol khusus',
    desc: 'Buat kategori Emas/Reksadana, klik ikon panah oranye di sini (bukan tombol + biasa) buat catat penjualan — kalau pakai tombol + biasa, nanti nggak kehitung sebagai penjualan. Kalau jual SEMUA aset sekaligus, centang "Jual Semua Aset" biar sisa gram/unit otomatis pas ke 0.',
    color: '#FF9466',
    target: 'sellAssetBtn',
    tab: 'overview',
    action: 'openSellAssetModal',
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
  const [showBudgetModal, setShowBudgetModal] = useState(null); // null | 'expense' | 'saving'
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [recurringList, setRecurringList] = useState([]);
  const [latestGoldPrice, setLatestGoldPrice] = useState(null); // harga emas per gram terbaru, dari asset_prices via RPC
  const [latestReksadanaNav, setLatestReksadanaNav] = useState(null); // NAV reksadana Insight Money Syariah terbaru, dari asset_prices via RPC
  const [recurringForm, setRecurringForm] = useState({ type: 'expense', categoryId: null, amount: '', note: '', dayOfMonth: '1' });
  const [savingRecurring, setSavingRecurring] = useState(false);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('dompet_theme') || 'system'); // system | dark | light
  const [tab, setTab] = useState('overview');

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('all'); // all | income | expense | saving
  const [pendingDelete, setPendingDelete] = useState(null); // { tx, timeoutId } — untuk fitur undo hapus
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null); // { success, failed, errors: [] }
  const importFileRef = useRef(null);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState(null); // posisi presisi elemen target, dihitung langsung dari DOM
  const settingsBtnRef = useRef(null);
  const fabRef = useRef(null);
  const reportsTabRef = useRef(null);
  const budgetLinkRef = useRef(null);
  const expenseCardRef = useRef(null);
  const txSearchRef = useRef(null);
  const recurringKelolaRef = useRef(null);
  const investSectionRef = useRef(null);
  const sellAssetBtnRef = useRef(null); // ref khusus tombol "Jual aset" di kategori aset PERTAMA, buat spotlight onboarding
  const targetRefs = {
    settings: settingsBtnRef, fab: fabRef, reportsTab: reportsTabRef, budgetLink: budgetLinkRef,
    expenseCard: expenseCardRef, txSearch: txSearchRef, recurringKelola: recurringKelolaRef,
    investSection: investSectionRef, sellAssetBtn: sellAssetBtnRef,
  };

  const [form, setForm] = useState({ type: 'expense', amount: '', categoryId: null, note: '', date: todayStr(), unitsOverride: '' });
  const [catEditType, setCatEditType] = useState('expense');
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('dollar');
  const [newCatAssetType, setNewCatAssetType] = useState(null); // null | 'gold' | 'reksadana_syariah'
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatLabel, setEditingCatLabel] = useState('');
  const [editingCatIcon, setEditingCatIcon] = useState('dollar');
  const [editingCatAssetType, setEditingCatAssetType] = useState(null);
  const [showIconPicker, setShowIconPicker] = useState(false); // untuk tambah
  const [previewIconLabel, setPreviewIconLabel] = useState(null); // nama ikon yang sedang disentuh/hover di grid (mobile & desktop)
  const [showEditIconPicker, setShowEditIconPicker] = useState(false); // untuk edit
  const [goalEditingCatId, setGoalEditingCatId] = useState(null); // id kategori saving yang sedang diatur goal-nya
  const [goalForm, setGoalForm] = useState({ amount: '', date: '' });
  const [savingGoal, setSavingGoal] = useState(false);
  const [editingPriceTxId, setEditingPriceTxId] = useState(null); // id transaksi yang sedang diisi harga historisnya
  const [editingPriceValue, setEditingPriceValue] = useState('');
  const [sellingCatId, setSellingCatId] = useState(null); // id kategori yang sedang dijual asetnya
  const [sellForm, setSellForm] = useState({ amount: '', date: todayStr(), note: '', isFullSale: false, unitsOverride: '' });
  const [savingSell, setSavingSell] = useState(false);

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
  const firstAssetCatId = useMemo(() => savingCategories.find((c) => c.asset_type)?.id || null, [savingCategories]);

  // Cek semua aturan transaksi berulang yang aktif; kalau sudah lewat/sama dengan tanggal jatuh temponya
  // di bulan KALENDER SAAT INI (bukan bulan yang sedang dilihat di Dashboard) dan belum pernah dibuat
  // transaksinya bulan ini, buatkan otomatis. Tanggal di-clamp ke tanggal terakhir bulan itu kalau perlu
  // (mis. aturan tanggal 31 tapi bulan berjalan cuma 30/28/29 hari).
  async function generateDueRecurringTransactions(rules, existingTx) {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1; // 1-12
    const currentMonthKey = `${y}-${pad2(m)}`;
    const todayDay = today.getDate();

    const toCreate = [];
    for (const rule of rules) {
      if (!rule.is_active) continue;
      const clampedDay = Math.min(rule.day_of_month, lastDayOfMonth(y, m));
      if (todayDay < clampedDay) continue; // belum jatuh tempo bulan ini

      const alreadyGenerated = existingTx.some((t) => t.recurringId === rule.id && monthKey(t.date) === currentMonthKey);
      if (alreadyGenerated) continue;

      toCreate.push({
        user_id: user.id,
        type: rule.type,
        category_id: rule.category_id,
        amount: rule.amount,
        note: rule.note || '',
        tx_date: `${currentMonthKey}-${pad2(clampedDay)}`,
        recurring_id: rule.id,
      });
    }

    if (toCreate.length === 0) return;

    const { data, error } = await supabase.from('transactions').insert(toCreate).select();
    if (!error && data) {
      setTransactions((prev) => [
        ...data.map((t) => ({ id: t.id, type: t.type, amount: Number(t.amount), category: t.category_id, note: t.note || '', date: t.tx_date, recurringId: t.recurring_id })),
        ...prev,
      ].sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
  }

  const loadAll = useCallback(async () => {
    try {
      const [{ data: cats, error: catErr }, { data: txs, error: txErr }, { data: bgs, error: bgErr }, { data: recs, error: recErr }, { data: prices, error: priceErr }] = await Promise.all([
        supabase.from('categories').select('*').eq('user_id', user.id).order('sort_order'),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('tx_date', { ascending: false }),
        supabase.from('budgets').select('*').eq('user_id', user.id),
        supabase.from('recurring_transactions').select('*').eq('user_id', user.id).order('created_at'),
        supabase.rpc('get_latest_prices'),
      ]);
      if (catErr || txErr || bgErr || recErr) { setSaveError(true); }
      else {
        setCategories(cats || []);
        const txList = (txs || []).map((t) => ({ id: t.id, type: t.type, amount: Number(t.amount), category: t.category_id, note: t.note || '', date: t.tx_date, recurringId: t.recurring_id, assetPriceAtTx: t.asset_price_at_tx ? Number(t.asset_price_at_tx) : null, assetAction: t.asset_action || 'buy', assetUnitsOverride: t.asset_units_override ? Number(t.asset_units_override) : null }));
        setTransactions(txList);
        setBudgets(bgs || []);
        setRecurringList(recs || []);
        if (!priceErr && prices) {
          const gold = prices.find((p) => p.asset_name === 'gold_pluang');
          if (gold) setLatestGoldPrice(Number(gold.price));
          const reksadana = prices.find((p) => p.asset_name === 'reksadana_insight_syariah');
          if (reksadana) setLatestReksadanaNav(Number(reksadana.price));
        }
        setSaveError(false);
        // Tampilkan onboarding hanya untuk user baru (belum punya kategori sama sekali)
        if ((cats || []).length === 0) {
          const doneKey = `onboarding_done_${user.id}`;
          const alreadyDone = localStorage.getItem(doneKey);
          if (!alreadyDone) setShowOnboarding(true);
        }
        // Cek & generate transaksi berulang yang sudah jatuh tempo bulan ini
        if (recs && recs.length > 0) {
          generateDueRecurringTransactions(recs, txList);
        }
      }
    } catch (e) { setSaveError(true); }
    setLoaded(true);
  }, [user.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Terapkan pilihan tema (system/dark/light) ke elemen <html> supaya bisa override
  // prefers-color-scheme sistem. Disimpan di localStorage per-device.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-light');
    if (themeMode === 'dark') root.classList.add('theme-dark');
    else if (themeMode === 'light') root.classList.add('theme-light');
    localStorage.setItem('dompet_theme', themeMode);
  }, [themeMode]);

  function cycleTheme() {
    setThemeMode((m) => (m === 'system' ? 'dark' : m === 'dark' ? 'light' : 'system'));
  }

  // Realtime: begitu ada transaksi/kategori/budget yang berubah (insert/update/delete) —
  // baik dari tab/device lain maupun dari sesi ini sendiri — Dashboard otomatis reload
  // datanya sendiri, tidak perlu refresh manual.
  useEffect(() => {
    const channel = supabase
      .channel(`dashboard-sync-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${user.id}` }, () => loadAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets', filter: `user_id=eq.${user.id}` }, () => loadAll())
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[Dashboard] Gagal subscribe realtime:', status, '— cek Database > Publications di Supabase, pastikan tabel transactions/categories/budgets sudah dicentang.');
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [user.id, loadAll]);

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

    // Kalau kategori tujuannya ditandai sebagai "Emas" atau "Reksadana Syariah", catat
    // harga/NAV per unit saat ini (dari cache harian di Supabase, bukan panggil API tiap transaksi).
    const selectedCat = form.type !== 'income' ? categories.find((c) => c.id === form.categoryId) : null;
    const assetPriceAtTx = selectedCat?.asset_type === 'gold' ? (latestGoldPrice || null)
      : selectedCat?.asset_type === 'reksadana_syariah' ? (latestReksadanaNav || null)
      : null;
    // Gram/unit manual (opsional) — kalau Surya isi persis dari histori Pluang/Ajaib, ini yang dipakai
    // untuk hitung investasi, BUKAN hasil bagi amount/harga (lebih presisi daripada estimasi kita).
    const unitsOverride = selectedCat?.asset_type && form.unitsOverride ? parseFloat(form.unitsOverride) : null;

    const payload = {
      user_id: user.id, type: form.type, category_id: form.type === 'income' ? null : form.categoryId,
      amount: amt, note: form.note.trim(), tx_date: form.date, asset_price_at_tx: assetPriceAtTx,
      asset_action: selectedCat?.asset_type ? 'buy' : null,
      asset_units_override: unitsOverride && unitsOverride > 0 ? unitsOverride : null,
    };
    const { data, error } = await supabase.from('transactions').insert(payload).select().single();
    if (error) { setSaveError(true); return; }
    setTransactions((prev) => [{ id: data.id, type: data.type, amount: Number(data.amount), category: data.category_id, note: data.note || '', date: data.tx_date, assetPriceAtTx: data.asset_price_at_tx ? Number(data.asset_price_at_tx) : null, assetAction: data.asset_action || 'buy', assetUnitsOverride: data.asset_units_override ? Number(data.asset_units_override) : null }, ...prev]);
    setForm({ type: 'expense', amount: '', categoryId: expenseCategories[0] ? expenseCategories[0].id : null, note: '', date: todayStr(), unitsOverride: '' });
    setShowAddModal(false);
  }

  async function deleteTransaction(id) {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    // Hapus dari tampilan dulu (optimistik)
    setTransactions((p) => p.filter((t) => t.id !== id));

    // PENTING: hapus BENERAN dari database sekarang juga (bukan ditunda beberapa detik) —
    // supaya kalau user refresh sebelum sempat klik Undo, datanya tetap kehapus permanen,
    // tidak "balik lagi" cuma karena refresh membatalkan proses hapus yang tertunda.
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      // Gagal hapus di server -> kembalikan lagi ke tampilan
      setTransactions((prev) => [tx, ...prev]);
      setSaveError(true);
      return;
    }

    // Snackbar Undo tetap ada 5 detik — kalau diklik, datanya di-INSERT ULANG (bukan
    // membatalkan proses hapus, karena hapusnya sudah benar-benar selesai di atas).
    if (pendingDelete) clearTimeout(pendingDelete.timeoutId);
    const timeoutId = setTimeout(() => {
      setPendingDelete((cur) => (cur && cur.tx.id === id ? null : cur));
    }, 5000);
    setPendingDelete({ tx, timeoutId });
  }

  async function undoDeleteTransaction() {
    if (!pendingDelete) return;
    clearTimeout(pendingDelete.timeoutId);
    const tx = pendingDelete.tx;
    setPendingDelete(null);

    // Insert ulang datanya (dapat id baru — transaksi lama sudah benar-benar terhapus permanen)
    const { data, error } = await supabase.from('transactions').insert({
      user_id: user.id, type: tx.type, category_id: tx.category, amount: tx.amount,
      note: tx.note, tx_date: tx.date, asset_price_at_tx: tx.assetPriceAtTx, asset_action: tx.assetAction || null,
      asset_units_override: tx.assetUnitsOverride || null,
    }).select().single();
    if (error) { setSaveError(true); return; }

    setTransactions((prev) => [
      { id: data.id, type: data.type, amount: Number(data.amount), category: data.category_id, note: data.note || '', date: data.tx_date, assetPriceAtTx: data.asset_price_at_tx ? Number(data.asset_price_at_tx) : null, assetAction: data.asset_action || 'buy', assetUnitsOverride: data.asset_units_override ? Number(data.asset_units_override) : null },
      ...prev,
    ].sort((a, b) => new Date(b.date) - new Date(a.date)));
  }

  function exportTransactionsExcel() {
    const rows = transactions.map((t) => ({
      Tanggal: t.date,
      Tipe: t.type,
      Kategori: t.type === 'income' ? '' : (catLookup(t.category)?.label || ''),
      Catatan: t.note || '',
      Nominal: t.amount,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 30 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');
    XLSX.writeFile(wb, `dompet-transaksi-${todayStr()}.xlsx`);
  }

  async function handleImportExcel(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setImporting(true);
    setImportSummary(null);

    let json;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      json = XLSX.utils.sheet_to_json(ws, { raw: false, defval: '' });
    } catch (err) {
      setImportSummary({ success: 0, failed: 0, skipped: 0, errors: ['File tidak bisa dibaca. Pastikan formatnya .xlsx yang valid.'] });
      setImporting(false);
      return;
    }

    if (!json || json.length === 0) {
      setImportSummary({ success: 0, failed: 0, skipped: 0, errors: ['File kosong atau tidak ada baris data.'] });
      setImporting(false);
      return;
    }

    // Normalisasi nama kolom (case-insensitive, jaga-jaga kalau user ubah huruf besar/kecil)
    const norm = (row) => {
      const out = {};
      Object.keys(row).forEach((k) => { out[k.trim().toLowerCase()] = row[k]; });
      return out;
    };

    // Kunci unik untuk deteksi duplikat: tanggal + tipe + kategori + nominal + catatan.
    // Dipakai untuk cek terhadap transaksi yang SUDAH ADA di akun, maupun antar baris
    // dalam file yang sama, supaya tidak dobel kalau file yang sama di-import berkali-kali.
    const txKey = (date, type, categoryId, amount, note) =>
      `${date}|${type}|${categoryId || 'none'}|${amount}|${(note || '').trim().toLowerCase()}`;

    const existingKeys = new Set(
      transactions.map((t) => txKey(t.date, t.type, t.category, t.amount, t.note))
    );

    // Kategori yang baru dibuat selama proses import ini (supaya baris berikutnya dengan
    // nama kategori sama tidak bikin kategori duplikat lagi, cukup dipakai ulang)
    const newlyCreatedCategories = [];
    async function findOrCreateCategory(catLabel, type) {
      const existing = [...categories, ...newlyCreatedCategories].find(
        (c) => c.label.toLowerCase() === catLabel.toLowerCase() && c.type === type
      );
      if (existing) return existing;

      // Kategori belum ada -> buat otomatis, supaya import tetap fleksibel (tidak gagal
      // cuma karena kategorinya belum sempat dibuat manual sebelumnya)
      const list = type === 'saving' ? [...categories, ...newlyCreatedCategories].filter((c) => c.type === 'saving') : [...categories, ...newlyCreatedCategories].filter((c) => c.type === 'expense');
      const color = COLOR_PALETTE[list.length % COLOR_PALETTE.length];
      const { data, error } = await supabase.from('categories').insert({
        user_id: user.id, type, label: catLabel, color, icon: 'dollar', sort_order: list.length + 1,
      }).select().single();
      if (error) return null;
      newlyCreatedCategories.push(data);
      return data;
    }

    const toInsert = [];
    const errors = [];
    let skippedDuplicates = 0;
    const batchKeys = new Set(); // cegah duplikat ANTAR baris di file yang sama

    for (let i = 0; i < json.length; i++) {
      const lineNo = i + 2; // baris 1 = header
      const r = norm(json[i]);
      const date = String(r['tanggal'] ?? '').trim();
      const type = String(r['tipe'] ?? '').trim().toLowerCase();
      const catLabel = String(r['kategori'] ?? '').trim();
      const note = String(r['catatan'] ?? '').trim();
      const amount = Number(String(r['nominal'] ?? '').replace(/[^\d.-]/g, ''));

      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { errors.push(`Baris ${lineNo}: format tanggal harus YYYY-MM-DD.`); continue; }
      if (!['income', 'expense', 'saving'].includes(type)) { errors.push(`Baris ${lineNo}: tipe harus income/expense/saving.`); continue; }
      if (!amount || amount <= 0) { errors.push(`Baris ${lineNo}: nominal tidak valid.`); continue; }

      // Kategori sekarang OPSIONAL — kosongkan kolom Kategori untuk transaksi tanpa kategori.
      // Kalau diisi tapi belum ada di akun, otomatis dibuatkan (tidak lagi gagal/ditolak).
      let categoryId = null;
      if (type !== 'income' && catLabel) {
        const cat = await findOrCreateCategory(catLabel, type);
        if (!cat) { errors.push(`Baris ${lineNo}: gagal membuat kategori "${catLabel}".`); continue; }
        categoryId = cat.id;
      }

      const key = txKey(date, type, categoryId, amount, note);
      if (existingKeys.has(key) || batchKeys.has(key)) {
        skippedDuplicates++;
        continue;
      }
      batchKeys.add(key);

      toInsert.push({ user_id: user.id, type, category_id: categoryId, amount, note, tx_date: date });
    }

    if (newlyCreatedCategories.length > 0) {
      setCategories((prev) => [...prev, ...newlyCreatedCategories]);
    }

    let successCount = 0;
    if (toInsert.length > 0) {
      const { data, error } = await supabase.from('transactions').insert(toInsert).select();
      if (error) {
        errors.push(`Gagal menyimpan ke server: ${error.message}`);
      } else {
        successCount = data.length;
        setTransactions((prev) => [
          ...data.map((t) => ({ id: t.id, type: t.type, amount: Number(t.amount), category: t.category_id, note: t.note || '', date: t.tx_date, assetPriceAtTx: t.asset_price_at_tx ? Number(t.asset_price_at_tx) : null, assetAction: t.asset_action || 'buy', assetUnitsOverride: t.asset_units_override ? Number(t.asset_units_override) : null })),
          ...prev,
        ].sort((a, b) => new Date(b.date) - new Date(a.date)));
      }
    }

    setImportSummary({ success: successCount, failed: errors.length, skipped: skippedDuplicates, errors });
    setImporting(false);
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

  // Budget expense GLOBAL — sekali diisi, berlaku terus di semua bulan (disimpan di categories.budget_amount,
  // bukan per-bulan seperti budgets table). Beda dari getBudgetAmount/setBudgetAmount di atas yang masih
  // dipakai untuk target saving bulanan lama (fallback kalau kategori saving belum punya goal_amount).
  function getExpenseBudget(categoryId) {
    return Number(categories.find((c) => c.id === categoryId)?.budget_amount) || 0;
  }

  async function setExpenseBudget(categoryId, value) {
    const amt = value === '' ? null : (parseFloat(value) || 0);
    setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, budget_amount: amt } : c)));
    const { error } = await supabase.from('categories').update({ budget_amount: amt }).eq('id', categoryId);
    if (error) setSaveError(true);
  }

  async function addCategory() {
    const label = newCatLabel.trim();
    if (!label) return;
    const list = catEditType === 'saving' ? savingCategories : expenseCategories;
    const color = COLOR_PALETTE[list.length % COLOR_PALETTE.length];
    const { data, error } = await supabase.from('categories').insert({
      user_id: user.id, type: catEditType, label, color, icon: newCatIcon, sort_order: list.length + 1,
      asset_type: catEditType === 'saving' ? newCatAssetType : null,
    }).select().single();
    if (error) { setSaveError(true); return; }
    setCategories((prev) => [...prev, data]);
    setNewCatLabel('');
    setNewCatIcon('dollar');
    setNewCatAssetType(null);
    setShowIconPicker(false);
  }

  function startEditCategory(c) {
    setEditingCatId(c.id);
    setEditingCatLabel(c.label);
    setEditingCatIcon(c.icon || 'dollar');
    setEditingCatAssetType(c.asset_type || null);
    setShowEditIconPicker(false);
  }

  async function saveEditCategory() {
    const label = editingCatLabel.trim();
    if (!label) return;
    const { error } = await supabase.from('categories').update({ label, icon: editingCatIcon, asset_type: editingCatAssetType }).eq('id', editingCatId);
    if (error) { setSaveError(true); } else {
      setCategories((prev) => prev.map((c) => (c.id === editingCatId ? { ...c, label, icon: editingCatIcon, asset_type: editingCatAssetType } : c)));
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

  async function addRecurring() {
    const amount = Number(recurringForm.amount);
    const day = Number(recurringForm.dayOfMonth);
    if (!amount || amount <= 0) return;
    if (!day || day < 1 || day > 31) return;
    if (recurringForm.type !== 'income' && !recurringForm.categoryId) return;

    setSavingRecurring(true);
    const { data, error } = await supabase.from('recurring_transactions').insert({
      user_id: user.id,
      type: recurringForm.type,
      category_id: recurringForm.type === 'income' ? null : recurringForm.categoryId,
      amount,
      note: recurringForm.note.trim(),
      day_of_month: day,
      is_active: true,
    }).select().single();
    setSavingRecurring(false);

    if (error) { setSaveError(true); return; }
    setRecurringList((prev) => [...prev, data]);
    setRecurringForm({ type: 'expense', categoryId: null, amount: '', note: '', dayOfMonth: '1' });
  }

  async function toggleRecurringActive(id, current) {
    const { error } = await supabase.from('recurring_transactions').update({ is_active: !current }).eq('id', id);
    if (error) { setSaveError(true); return; }
    setRecurringList((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: !current } : r)));
  }

  async function deleteRecurring(id) {
    const { error } = await supabase.from('recurring_transactions').delete().eq('id', id);
    if (error) { setSaveError(true); return; }
    setRecurringList((prev) => prev.filter((r) => r.id !== id));
  }

  const monthTx = useMemo(() => transactions.filter((t) => monthKey(t.date) === activeMonth), [transactions, activeMonth]);

  const filteredMonthTx = useMemo(() => {
    let list = monthTx;
    if (txTypeFilter !== 'all') list = list.filter((t) => t.type === txTypeFilter);
    const q = txSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((t) => {
        const cat = catLookup(t.category);
        const haystack = `${t.note || ''} ${cat ? cat.label : ''} ${t.type}`.toLowerCase();
        return haystack.includes(q);
      });
    }
    return list;
  }, [monthTx, txTypeFilter, txSearch, categories]);
  const totalIncome = useMemo(() => monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0), [monthTx]);
  const totalExpense = useMemo(() => monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [monthTx]);
  // Transaksi "jual aset" (assetAction='sell') MENGURANGI total saving (uang keluar dari tabungan/investasi),
  // bukan menambah — beda dari transaksi saving biasa (beli/nabung) yang menambah.
  const totalSaving = useMemo(() => monthTx.filter((t) => t.type === 'saving').reduce((s, t) => s + t.amount * (t.assetAction === 'sell' ? -1 : 1), 0), [monthTx]);
  // Breakdown kotor (gross) beli vs jual saving bulan ini — dipakai buat nampilin ringkasan yang jelas
  // di Laporan waktu netto-nya negatif (jual lebih besar dari beli), supaya nggak kelihatan "kosong".
  const savingGrossBuy = useMemo(() => monthTx.filter((t) => t.type === 'saving' && t.assetAction !== 'sell').reduce((s, t) => s + t.amount, 0), [monthTx]);
  const savingGrossSell = useMemo(() => monthTx.filter((t) => t.type === 'saving' && t.assetAction === 'sell').reduce((s, t) => s + t.amount, 0), [monthTx]);
  const balance = totalIncome - totalExpense - totalSaving;
  const totalUsed = totalExpense + totalSaving;

  const spendByCat = useCallback((type) => {
    const map = {};
    monthTx.filter((t) => t.type === type).forEach((t) => {
      const sign = t.assetAction === 'sell' ? -1 : 1;
      map[t.category] = (map[t.category] || 0) + t.amount * sign;
    });
    return map;
  }, [monthTx]);

  const expenseSpend = useMemo(() => spendByCat('expense'), [spendByCat]);
  const savingSpend = useMemo(() => spendByCat('saving'), [spendByCat]);

  // Hitung nilai investasi sekarang, REALIZED gain/loss (dari transaksi jual), dan FLOATING
  // gain/loss (dari aset yang masih dipegang) — pakai metode rata-rata biaya (weighted average
  // cost), diproses berurutan sesuai tanggal transaksi (penting untuk akurasi rata-rata beli).
  // Emas: harga per gram dari scrape Pluang. Reksadana: NAV asli dari scrape akufrugal.com
  // (BUKAN lagi rate tetap 5,3%/tahun — itu sudah dihapus, karena tidak bisa mencerminkan rugi).
  function computeInvestmentStats(cat) {
    if (!cat.asset_type) return null;
    if (cat.asset_type === 'gold' && !latestGoldPrice) return null; // harga terbaru belum ke-load
    if (cat.asset_type === 'reksadana_syariah' && !latestReksadanaNav) return null; // NAV terbaru belum ke-load

    const catTx = transactions
      .filter((t) => t.type === 'saving' && t.category === cat.id)
      .slice()
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // urutan kronologis wajib untuk avg cost yang benar
    if (catTx.length === 0) return null;

    let heldUnits = 0;      // gram (emas) atau unit reksadana (nominal / NAV) yang masih dipegang
    let heldCostBasis = 0;  // modal aktif yang masih tertanam (setelah dikurangi yang sudah dijual)
    let realizedGain = 0;   // untung/rugi dari transaksi JUAL yang sudah terjadi, sudah final
    let unpricedAmount = 0; // transaksi lama yang belum ada harga/NAV historisnya, belum ikut dihitung

    catTx.forEach((t) => {
      const priceAtTx = t.assetPriceAtTx;
      // Kalau gram/unit diisi manual (lebih presisi, biasanya nyalin persis dari Pluang/Ajaib),
      // pakai itu langsung — tidak perlu hitung dari amount/priceAtTx lagi.
      const hasManualUnits = t.assetUnitsOverride != null && t.assetUnitsOverride > 0;
      if (!hasManualUnits && !priceAtTx) {
        if (t.assetAction !== 'sell') unpricedAmount += t.amount;
        return; // transaksi tanpa harga/NAV historis DAN tanpa gram/unit manual dilewati dulu
      }
      const units = hasManualUnits ? t.assetUnitsOverride : t.amount / priceAtTx;

      if (t.assetAction === 'sell') {
        const avgCost = heldUnits > 0 ? heldCostBasis / heldUnits : 0;
        const unitsSold = Math.min(units, heldUnits); // tidak bisa jual lebih dari yang benar-benar dipegang
        const costBasisSold = unitsSold * avgCost;
        realizedGain += t.amount - costBasisSold;
        heldUnits -= unitsSold;
        heldCostBasis -= costBasisSold;
      } else {
        heldUnits += units;
        heldCostBasis += t.amount;
      }
    });

    const currentPrice = cat.asset_type === 'gold' ? latestGoldPrice : latestReksadanaNav;
    const currentValue = heldUnits * currentPrice;
    const floatingGain = currentValue - heldCostBasis;
    const totalGain = realizedGain + floatingGain;
    const avgBuyPrice = heldUnits > 0 ? heldCostBasis / heldUnits : 0;

    if (heldCostBasis <= 0 && heldUnits <= 0 && realizedGain === 0 && unpricedAmount > 0) {
      return { totalInvested: 0, currentValue: 0, gain: 0, gainPct: 0, unpricedAmount, noDataYet: true };
    }

    const gainPct = heldCostBasis > 0 ? (floatingGain / heldCostBasis) * 100 : 0;

    return {
      totalInvested: heldCostBasis, // "modal aktif" — sudah dikurangi porsi yang sudah dijual
      currentValue,
      gain: floatingGain,           // floating gain/loss (aset yang masih dipegang)
      gainPct,
      unpricedAmount,
      heldUnits,
      avgBuyPrice,
      realizedGain,
      totalGain,
    };
  }

  // Total akumulasi saving SEPANJANG WAKTU per kategori (bukan cuma bulan aktif) — dipakai untuk goal tracking.
  // Juga hitung tanggal transaksi saving paling awal per kategori, untuk estimasi kecepatan menabung rata-rata.
  const savingGoalStats = useMemo(() => {
    const stats = {}; // { [categoryId]: { cumulative, firstDate } }
    transactions.filter((t) => t.type === 'saving').forEach((t) => {
      if (!stats[t.category]) stats[t.category] = { cumulative: 0, firstDate: t.date };
      stats[t.category].cumulative += t.amount * (t.assetAction === 'sell' ? -1 : 1);
      if (t.date < stats[t.category].firstDate) stats[t.category].firstDate = t.date;
    });
    return stats;
  }, [transactions]);

  // Hitung proyeksi: kapan target tercapai kalau pace menabung rata-rata tetap sama,
  // dan apakah masih sesuai jadwal kalau ada target tanggal.
  function computeGoalProjection(cat) {
    const stat = savingGoalStats[cat.id];

    // Untuk kategori ASET (emas/reksadana): progress goal pakai NILAI ASET SEKARANG,
    // bukan sekadar total kas masuk-keluar historis. Ini penting supaya sinkron dengan
    // card investasi di bawahnya — kalau aset sudah full terjual (currentValue = 0),
    // progress goal-nya ikut balik ke 0, bukan nyangkut di angka rugi yang sudah terealisasi.
    // (Sebelumnya: cumulative = total beli − total jual secara kas, jadi kalau pernah rugi
    // saat jual, "uang yang hilang karena rugi" itu tetap kehitung sebagai progress — padahal
    // aset fisiknya sudah tidak ada.)
    let cumulative = stat?.cumulative || 0;
    if (cat.asset_type === 'gold' || cat.asset_type === 'reksadana_syariah') {
      const invest = computeInvestmentStats(cat);
      if (invest && !invest.noDataYet) cumulative = invest.currentValue;
    }

    const goalAmount = Number(cat.goal_amount) || 0;
    if (!goalAmount) return null;

    const remaining = Math.max(0, goalAmount - cumulative);
    const pct = Math.min(100, (cumulative / goalAmount) * 100);

    if (remaining <= 0) {
      return { cumulative, goalAmount, remaining: 0, pct: 100, achieved: true };
    }

    let monthsElapsed = 1;
    if (stat?.firstDate) {
      const first = new Date(stat.firstDate + 'T00:00:00');
      const now = new Date();
      monthsElapsed = Math.max(1, (now.getFullYear() - first.getFullYear()) * 12 + (now.getMonth() - first.getMonth()) + 1);
    }
    const monthlyPace = cumulative / monthsElapsed;
    const monthsToFinish = monthlyPace > 0 ? Math.ceil(remaining / monthlyPace) : null;

    let projectedDateLabel = null;
    if (monthsToFinish != null) {
      const d = new Date();
      d.setMonth(d.getMonth() + monthsToFinish);
      projectedDateLabel = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }

    let onTrack = null;
    let neededPerMonth = null;
    if (cat.goal_date) {
      const deadline = new Date(cat.goal_date + 'T00:00:00');
      const now = new Date();
      const monthsLeft = Math.max(1, (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth()));
      neededPerMonth = remaining / monthsLeft;
      onTrack = monthlyPace >= neededPerMonth;
    }

    return { cumulative, goalAmount, remaining, pct, achieved: false, monthlyPace, projectedDateLabel, onTrack, neededPerMonth };
  }

  async function saveCategoryGoal() {
    if (!goalEditingCatId) return;
    setSavingGoal(true);
    const amount = goalForm.amount ? Number(goalForm.amount) : null;
    const { error } = await supabase.from('categories').update({
      goal_amount: amount,
      goal_date: goalForm.date || null,
    }).eq('id', goalEditingCatId);
    setSavingGoal(false);
    if (error) { setSaveError(true); return; }
    setCategories((prev) => prev.map((c) => (c.id === goalEditingCatId ? { ...c, goal_amount: amount, goal_date: goalForm.date || null } : c)));
    setGoalEditingCatId(null);
  }

  // Isi harga emas per gram secara manual untuk transaksi LAMA yang dibuat sebelum
  // fitur pelacakan emas ada (jadi belum otomatis tercatat harganya saat itu).
  async function saveHistoricalAssetPrice(txId) {
    const price = parseFloat(editingPriceValue);
    if (!price || price <= 0) return;
    const { error } = await supabase.from('transactions').update({ asset_price_at_tx: price }).eq('id', txId);
    if (error) { setSaveError(true); return; }
    setTransactions((prev) => prev.map((t) => (t.id === txId ? { ...t, assetPriceAtTx: price } : t)));
    setEditingPriceTxId(null);
    setEditingPriceValue('');
  }

  // Catat penjualan aset (emas/reksadana) — dicatat sebagai transaksi saving dengan
  // asset_action='sell', supaya ikut dihitung sebagai pengurang modal aktif (bukan nambah),
  // dan menghasilkan realized gain/loss lewat computeInvestmentStats.
  async function sellAsset() {
    if (!sellingCatId) return;
    const cat = categories.find((c) => c.id === sellingCatId);
    if (!cat) return;

    const invest = computeInvestmentStats(cat);

    // Kalau ditandai "jual semua aset", nominal DIPAKSA sama persis dengan nilai
    // sekarang (dihitung ulang di sini, bukan dari angka yang mungkin sempat
    // diketik manual/basi) — supaya seluruh gram/unit yang dipegang benar-benar
    // habis terjual sampai 0, tidak nyisa sedikit-sedikit karena salah ketik nominal.
    let amt;
    if (sellForm.isFullSale) {
      if (!invest || invest.noDataYet || invest.currentValue <= 0) {
        alert('Belum ada data kepemilikan yang bisa dihitung untuk kategori ini, tidak bisa jual semua otomatis.');
        return;
      }
      amt = Math.round(invest.currentValue);
    } else {
      amt = parseFloat(sellForm.amount);
      if (!amt || amt <= 0) return;
      // Konfirmasi eksplisit untuk penjualan SEBAGIAN, supaya user sadar betul
      // ini bukan jual semua — mencegah kejadian salah catat nominal seperti
      // sebelumnya (nominal jual tidak mencerminkan keseluruhan aset yang dijual).
      const ok = window.confirm(
        'Ini akan dicatat sebagai penjualan SEBAGIAN aset (bukan semua).\n\n' +
        'Pastikan nominal yang diketik memang benar-benar sesuai uang yang diterima saat itu.\n\n' +
        'Kalau sebenarnya ini penjualan SELURUH aset, klik Cancel, lalu centang opsi "Jual semua aset" di form.'
      );
      if (!ok) return;
    }

    // Gram/unit manual (opsional) — cuma relevan untuk jual SEBAGIAN, karena "jual semua"
    // sudah otomatis melikuidasi seluruh heldUnits tanpa perlu input gram lagi.
    const unitsOverride = (!sellForm.isFullSale && sellForm.unitsOverride) ? parseFloat(sellForm.unitsOverride) : null;

    setSavingSell(true);
    const priceAtSell = cat.asset_type === 'gold' ? latestGoldPrice : cat.asset_type === 'reksadana_syariah' ? latestReksadanaNav : null;
    const { data, error } = await supabase.from('transactions').insert({
      user_id: user.id, type: 'saving', category_id: cat.id, amount: amt,
      note: sellForm.note.trim() || 'Jual aset', tx_date: sellForm.date,
      asset_price_at_tx: priceAtSell, asset_action: 'sell',
      asset_units_override: unitsOverride && unitsOverride > 0 ? unitsOverride : null,
    }).select().single();
    setSavingSell(false);
    if (error) { setSaveError(true); return; }

    setTransactions((prev) => [
      { id: data.id, type: data.type, amount: Number(data.amount), category: data.category_id, note: data.note || '', date: data.tx_date, assetPriceAtTx: data.asset_price_at_tx ? Number(data.asset_price_at_tx) : null, assetAction: data.asset_action, assetUnitsOverride: data.asset_units_override ? Number(data.asset_units_override) : null },
      ...prev,
    ].sort((a, b) => new Date(b.date) - new Date(a.date)));

    setSellingCatId(null);
    setSellForm({ amount: '', date: todayStr(), note: '', isFullSale: false, unitsOverride: '' });
  }

  // Transaksi per kategori (sub-kategori untuk dashboard)
  const txByCat = useCallback((catId) => {
    return monthTx.filter((t) => t.category === catId).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [monthTx]);

  const pieData = useMemo(() => {
    const list = expenseCategories.filter((c) => expenseSpend[c.id] > 0).map((c) => ({ name: c.label, value: expenseSpend[c.id] || 0, color: c.color }));
    const uncategorized = monthTx.filter((t) => t.type === 'expense' && !t.category).reduce((s, t) => s + t.amount, 0);
    if (uncategorized > 0) list.push({ name: 'Tanpa kategori', value: uncategorized, color: '#8A8A8A' });
    return list;
  }, [expenseSpend, expenseCategories, monthTx]);

  const savingPieData = useMemo(() => {
    const list = savingCategories.filter((c) => savingSpend[c.id] > 0).map((c) => ({ name: c.label, value: savingSpend[c.id], color: c.color }));
    const uncategorized = monthTx.filter((t) => t.type === 'saving' && !t.category).reduce((s, t) => s + t.amount, 0);
    if (uncategorized > 0) list.push({ name: 'Tanpa kategori', value: uncategorized, color: '#8A8A8A' });
    return list;
  }, [savingSpend, savingCategories, monthTx]);

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

      // Saving: akumulatif dari semua transaksi sampai akhir bulan ini (jual = mengurangi, sama seperti totalSaving)
      const savCumulative = transactions
        .filter((t) => t.type === 'saving' && t.date <= `${y}-${String(m).padStart(2, '0')}-31`)
        .reduce((s, t) => s + t.amount * (t.assetAction === 'sell' ? -1 : 1), 0);

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
    closeAllOnboardingModals();
  }

  // Bisa dibuka ulang kapan saja lewat tombol "?", baik oleh user baru maupun user lama —
  // tidak bergantung pada localStorage flag atau jumlah kategori.
  function openOnboardingTour() {
    setOnboardingStep(0);
    setShowOnboarding(true);
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

  // Modal apa pun yang sempat dibuka otomatis oleh step tour (lihat effect di bawah) perlu
  // ditutup lagi sebelum pindah ke step lain / tur selesai, biar tidak numpuk/nyangkut.
  function closeAllOnboardingModals() {
    setShowCategoryModal(false);
    setShowAddModal(false);
    setShowBudgetModal(null);
    setShowRecurringModal(false);
    setSellingCatId(null);
  }

  // Sebagian step tour "mendemokan" tombolnya langsung dengan otomatis membuka modal terkait,
  // bukan cuma nyorot doang — supaya user beneran lihat hasil klik tombolnya, bukan cuma dikasih tau.
  useEffect(() => {
    if (!showOnboarding) return;
    const step = ONBOARDING_STEPS[onboardingStep];
    closeAllOnboardingModals(); // tutup dulu sisa modal dari step sebelumnya
    if (step.action === 'openCategoryModal') {
      setShowCategoryModal(true);
    } else if (step.action === 'openAddModal') {
      setShowAddModal(true);
    } else if (step.action === 'openBudgetModal') {
      setShowBudgetModal('expense');
    } else if (step.action === 'openRecurringModal') {
      setShowRecurringModal(true);
    } else if (step.action === 'openSellAssetModal' && firstAssetCatId) {
      setSellingCatId(firstAssetCatId);
      setSellForm({ amount: '', date: todayStr(), note: '', isFullSale: false, unitsOverride: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOnboarding, onboardingStep]);

  // Hitung posisi presisi elemen target (spotlight) langsung dari DOM,
  // supaya pop-up onboarding selalu tepat menunjuk ke tombol yang dimaksud
  // di ukuran layar apa pun (mobile/desktop), bukan angka pixel tebakan.
  useLayoutEffect(() => {
    if (!showOnboarding) { setSpotlightRect(null); return; }
    const step = ONBOARDING_STEPS[onboardingStep];

    // Otomatis pindah tab sesuai kebutuhan step ini (eksplisit per step, bukan asumsi urutan sebelumnya)
    if (step.tab && tab !== step.tab) {
      setTab(step.tab);
    }

    if (!step.target) { setSpotlightRect(null); return; }
    setSpotlightRect(null); // reset dulu biar tidak ada ring "nyasar" dari step sebelumnya sesaat

    function measure() {
      const el = targetRefs[step.target]?.current;
      if (el) {
        const r = el.getBoundingClientRect();
        // Kalau elemen belum ke-render sempurna (ukuran 0), jangan dipakai — biar retry berikutnya yang menangkap
        if (r.width > 0 && r.height > 0) {
          setSpotlightRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        }
      }
    }

    // Ukur berkali-kali di beberapa titik waktu berbeda, supaya tetap presisi
    // meskipun ada delay render/transisi tab/animasi pop-up sebelumnya.
    const raf1 = requestAnimationFrame(() => {
      measure();
      requestAnimationFrame(measure); // rAF kedua, jaga-jaga layout belum settle di frame pertama
    });
    const t1 = setTimeout(measure, 80);
    const t2 = setTimeout(measure, 250);

    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [showOnboarding, onboardingStep, tab]);


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

        /* ===== OVERRIDE TEMA MANUAL — menang atas prefers-color-scheme sistem ===== */
        :root.theme-dark {
          --bg-base: #0B0F1A; --bg-card: #131929; --bg-card2: #1A2238; --bg-input: #0B0F1A;
          --border: #1E2D4A; --border2: #2A3B5C; --text-primary: #E8EDF8; --text-secondary: #7A90B8;
          --text-muted: #4A5A7A; --accent: #7FE8A4; --accent-text: #0B0F1A; --scrollbar: #1E2D4A;
          --chart-bg: #131929; --chart-grid: #24314D; --chart-tooltip: #182238;
          --chart-text: #E8EDF8; --chart-subtext: #9CB2D8;
        }
        :root.theme-light {
          --bg-base: #EEF2FA; --bg-card: #FFFFFF; --bg-card2: #F0F4FF; --bg-input: #F5F7FF;
          --border: #C8D4EC; --border2: #A8BCDC; --text-primary: #0D1B3E; --text-secondary: #3D5A8A;
          --text-muted: #7A90B8; --accent: #1A6B4A; --accent-text: #FFFFFF; --scrollbar: #C8D4EC;
          --chart-bg: #FFFFFF; --chart-grid: #D6E1F5; --chart-tooltip: #FFFFFF;
          --chart-text: #10254F; --chart-subtext: #6079A3;
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
        .dompet-filter-card:hover { filter: brightness(1.08); transform: translateY(-2px); }
        .dompet-filter-card:active { transform: translateY(0); filter: brightness(0.97); }

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
          <button key={t.id} ref={t.id === 'reports' ? reportsTabRef : null} onClick={() => setTab(t.id)} style={{ ...styles.tabBtn, ...(tab === t.id ? styles.tabBtnActive : {}) }}>{t.label}</button>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <button onClick={openOnboardingTour} style={{ ...styles.settingsBtn, marginLeft: 0 }} aria-label="Panduan fitur" title="Buka panduan fitur">
            <HelpCircle size={16} color="#9CA89F" />
          </button>
          <button onClick={cycleTheme} style={{ ...styles.settingsBtn, marginLeft: 0 }} aria-label="Ganti tema" title={themeMode === 'system' ? 'Tema: Ikuti sistem' : themeMode === 'dark' ? 'Tema: Gelap' : 'Tema: Terang'}>
            {themeMode === 'system' ? <Monitor size={16} color="#9CA89F" /> : themeMode === 'dark' ? <Moon size={16} color="#9CA89F" /> : <Sun size={16} color="#9CA89F" />}
          </button>
          <button ref={settingsBtnRef} onClick={() => setShowCategoryModal(true)} style={{ ...styles.settingsBtn, marginLeft: 0 }} aria-label="Kelola kategori"><Settings size={16} color="#9CA89F" /></button>
        </div>
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
                <div
                  onClick={() => { setTxTypeFilter('income'); setTab('transactions'); }}
                  className="dompet-filter-card"
                  style={{ ...styles.summaryCard, ...summaryCardActiveStyle(tab === 'transactions' && txTypeFilter === 'income', '#7FE8A4') }}
                >
                  <div style={styles.summaryIconRow}><TrendingUp size={14} color="#7FE8A4" /><span style={styles.summaryLabel}>Income</span></div>
                  <span style={{ ...styles.summaryNumber, color: '#7FE8A4' }}>{formatRupiah(totalIncome)}</span>
                </div>
                <div style={styles.summaryCard}>
                  <span style={styles.summaryLabel}>Total terpakai</span>
                  <span style={{ ...styles.summaryNumber, color: 'var(--text-primary)' }}>{formatRupiah(totalUsed)}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Expense + saving</span>
                </div>
                <div
                  ref={expenseCardRef}
                  onClick={() => { setTxTypeFilter('expense'); setTab('transactions'); }}
                  className="dompet-filter-card"
                  style={{ ...styles.summaryCard, ...summaryCardActiveStyle(tab === 'transactions' && txTypeFilter === 'expense', '#FF9466') }}
                >
                  <div style={styles.summaryIconRow}><TrendingDown size={14} color="#FF9466" /><span style={styles.summaryLabel}>Expense</span></div>
                  <span style={{ ...styles.summaryNumber, color: '#FF9466' }}>{formatRupiah(totalExpense)}</span>
                </div>
                <div
                  onClick={() => { setTxTypeFilter('saving'); setTab('transactions'); }}
                  className="dompet-filter-card"
                  style={{ ...styles.summaryCard, ...summaryCardActiveStyle(tab === 'transactions' && txTypeFilter === 'saving', '#6FB7E8') }}
                >
                  <div style={styles.summaryIconRow}><PiggyBank size={14} color="#6FB7E8" /><span style={styles.summaryLabel}>Saving</span></div>
                  <span style={{ ...styles.summaryNumber, color: '#6FB7E8' }}>{formatRupiah(totalSaving)}</span>
                </div>
              </div>

              {/* Kartu budget expense per kategori + sub-transaksi */}
              <div style={{ ...styles.sectionHeader, marginTop: 24 }}>
                <span style={styles.sectionTitle}>Budget expense</span>
                <button ref={budgetLinkRef} onClick={() => setShowBudgetModal('expense')} style={styles.linkBtn}>Atur budget</button>
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
                    const budget = getExpenseBudget(c.id);
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

                  {/* Card khusus transaksi expense tanpa kategori */}
                  {(() => {
                    const uncatTx = monthTx.filter((t) => t.type === 'expense' && !t.category).sort((a, b) => new Date(b.date) - new Date(a.date));
                    if (uncatTx.length === 0) return null;
                    const uncatTotal = uncatTx.reduce((s, t) => s + t.amount, 0);
                    return (
                      <div style={styles.budgetCard}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#8A8A8A25', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <HelpCircle size={16} color="#8A8A8A" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Tanpa kategori</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatRupiah(uncatTotal)}</div>
                          </div>
                          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', flexShrink: 0 }}>
                            {formatRupiah(uncatTotal)}
                          </span>
                        </div>
                        <div style={{ borderTop: '1px solid #22291F', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {uncatTx.map((t) => (
                            <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {t.note || 'Lainnya'}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                                {new Date(t.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#FF9466', flexShrink: 0 }}>-{formatRupiah(t.amount)}</span>
                              <button onClick={() => deleteTransaction(t.id)} style={styles.deleteBtn}><Trash2 size={12} color="#6B7568" /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Kolom kanan: kartu budget saving per kategori + sub-transaksi */}
            <div className="dompet-col-right">
              <div ref={investSectionRef} style={{ ...styles.sectionHeader, marginTop: 24 }}>
                <span style={styles.sectionTitle}>Target saving & investasi</span>
                <button onClick={() => setShowBudgetModal('saving')} style={styles.linkBtn}>Atur target</button>
              </div>
              {savingCategories.length === 0 ? (
                <div style={styles.emptyCard}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Belum ada kategori saving.</span>
                  <button onClick={() => setShowCategoryModal(true)} style={{ ...styles.linkBtn, marginTop: 8, display: 'block' }}>+ Tambah kategori</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {savingCategories.map((c) => {
                    const spent = savingSpend[c.id] || 0; // bulan aktif (tetap dipakai untuk sub-transaksi bulan ini)
                    const target = getBudgetAmount(c.id, activeMonth); // target bulanan lama (kalau masih dipakai)
                    const pct = target > 0 ? Math.min(100, (spent / target) * 100) : 0;
                    const goal = computeGoalProjection(c); // goal kumulatif jangka panjang (fitur baru)
                    const invest = computeInvestmentStats(c); // pelacakan emas/reksadana (fitur baru)
                    const CatIcon = getIconComponent(c.icon);
                    const subTx = txByCat(c.id);
                    return (
                      <div key={c.id} style={styles.budgetCard}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: c.color + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <CatIcon size={16} color={c.color} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                              {c.label}
                              {c.asset_type === 'gold' && <span style={{ marginLeft: 6, fontSize: 10, color: '#F5C95D' }}>🥇 Emas</span>}
                              {c.asset_type === 'reksadana_syariah' && <span style={{ marginLeft: 6, fontSize: 10, color: '#6FB7E8' }}>📈 Reksadana</span>}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                              {goal
                                ? `${formatRupiah(goal.cumulative)} / ${formatRupiah(goal.goalAmount)} (total)`
                                : `${formatRupiah(spent)}${target > 0 ? ` / ${formatRupiah(target)}` : ''}`}
                            </div>
                          </div>
                          {c.asset_type && (
                            <button
                              ref={c.id === firstAssetCatId ? sellAssetBtnRef : null}
                              onClick={() => { setSellingCatId(c.id); setSellForm({ amount: '', date: todayStr(), note: '' }); }}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#FF9466', display: 'flex', padding: 4, flexShrink: 0 }}
                              title="Jual aset"
                            ><TrendingDown size={15} /></button>
                          )}
                          <button
                            onClick={() => {
                              setGoalEditingCatId(c.id);
                              setGoalForm({ amount: c.goal_amount ? String(c.goal_amount) : '', date: c.goal_date || '' });
                            }}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4, flexShrink: 0 }}
                            title="Atur goal"
                          ><Target size={15} /></button>
                        </div>

                        {/* Progress bar: pakai goal kumulatif kalau ada, kalau tidak fallback ke target bulanan lama */}
                        {goal ? (
                          <div style={styles.barTrack}>
                            <div style={{ ...styles.barFill, width: goal.pct + '%', background: goal.achieved ? '#7FE8A4' : '#6FB7E8' }} />
                          </div>
                        ) : target > 0 && (
                          <div style={styles.barTrack}>
                            <div style={{ ...styles.barFill, width: pct + '%', background: '#6FB7E8' }} />
                          </div>
                        )}

                        {/* Info goal: sisa, proyeksi tanggal tercapai, status on-track */}
                        {goal && !goal.achieved && (
                          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span>Sisa {formatRupiah(goal.remaining)} lagi ({goal.pct.toFixed(0)}%)</span>
                            {goal.projectedDateLabel && <span>Estimasi tercapai: <b style={{ color: 'var(--text-primary)' }}>{goal.projectedDateLabel}</b> (pace saat ini)</span>}
                            {goal.onTrack !== null && (
                              <span style={{ color: goal.onTrack ? '#7FE8A4' : '#FF9466' }}>
                                {goal.onTrack
                                  ? '✓ Sesuai target tanggal'
                                  : `⚠ Perlu nabung ${formatRupiah(goal.neededPerMonth)}/bulan biar sesuai target tanggal`}
                              </span>
                            )}
                          </div>
                        )}
                        {goal && goal.achieved && (
                          <div style={{ marginTop: 8, fontSize: 11.5, color: '#7FE8A4', fontWeight: 600 }}>🎉 Target tercapai!</div>
                        )}

                        {/* Nilai investasi sekarang + untung/rugi, khusus kategori Emas/Reksadana Syariah */}
                        {invest && invest.noDataYet ? (
                          <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: '#2A2410', border: '1px solid #5A4A20', fontSize: 11, color: '#F5C95D' }}>
                            ⚠️ Semua transaksi di kategori ini belum ada data harga emas saat beli. Isi manual dulu di daftar transaksi bawah biar untung/ruginya bisa dihitung.
                          </div>
                        ) : invest && (
                          <div style={{
                            marginTop: 10, padding: '14px 14px', borderRadius: 12,
                            background: 'var(--bg-card2)',
                            border: '1px solid var(--border)',
                          }}>
                            {/* Hero: nilai sekarang (besar) + Total Return, gaya seperti aplikasi investasi */}
                            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5, lineHeight: 1.2 }}>
                              {formatRupiah(invest.currentValue)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total Return</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: invest.gain >= 0 ? '#7FE8A4' : '#FF6B6B' }}>
                                {invest.gain >= 0 ? '+' : '-'}{formatRupiah(Math.abs(invest.gain))} ({invest.gainPct >= 0 ? '+' : ''}{invest.gainPct.toFixed(2)}%)
                              </span>
                            </div>

                            {/* Detail sekunder: modal aktif, rata-rata beli, realized gain, dsb */}
                            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                              {c.asset_type === 'gold' && invest.heldUnits > 0 && (
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                  🪙 {invest.heldUnits.toFixed(6)} gram · rata-rata beli {formatRupiah(invest.avgBuyPrice)}/gram
                                </div>
                              )}
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                Modal aktif: {formatRupiah(invest.totalInvested)}
                              </div>
                              {invest.realizedGain !== 0 && (
                                <div style={{ fontSize: 11, fontWeight: 600, color: invest.realizedGain >= 0 ? '#7FE8A4' : '#FF6B6B' }}>
                                  {invest.realizedGain >= 0 ? '✓ Realized untung ' : '✓ Realized rugi '}
                                  {formatRupiah(Math.abs(invest.realizedGain))} (dari penjualan)
                                </div>
                              )}
                              {invest.realizedGain !== 0 && (
                                <div style={{ fontSize: 11, fontWeight: 700, color: invest.totalGain >= 0 ? '#7FE8A4' : '#FF6B6B' }}>
                                  Total {invest.totalGain >= 0 ? 'untung' : 'kerugian'} keseluruhan: {formatRupiah(Math.abs(invest.totalGain))}
                                </div>
                              )}
                              {c.asset_type === 'gold' && (
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                  Harga emas terkini: {formatRupiah(latestGoldPrice)}/gram
                                </div>
                              )}
                              {c.asset_type === 'reksadana_syariah' && (
                                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                  NAV Insight Money Syariah terkini: {formatRupiah(latestReksadanaNav)}/unit
                                </div>
                              )}
                              {invest.unpricedAmount > 0 && (
                                <div style={{ fontSize: 10, color: '#F5C95D' }}>
                                  ⚠️ {formatRupiah(invest.unpricedAmount)} dari transaksi belum ada harga/NAV historis, belum ikut dihitung di atas — isi manual di daftar transaksi bawah.
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {subTx.length > 0 && (
                          <div style={{ marginTop: 10, borderTop: '1px solid #22291F', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {subTx.map((t) => {
                              const needsPrice = !!c.asset_type && !t.assetPriceAtTx && !t.assetUnitsOverride;
                              return (
                                <div key={t.id}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {t.assetAction === 'sell' && <span style={{ color: '#FF9466' }}>🔻 Jual: </span>}
                                      {t.note || c.label}
                                    </span>
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{new Date(t.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: t.assetAction === 'sell' ? '#FF9466' : '#6FB7E8', flexShrink: 0 }}>
                                      {t.assetAction === 'sell' ? '+' : '-'}{formatRupiah(t.amount)}
                                    </span>
                                    <button onClick={() => deleteTransaction(t.id)} style={styles.deleteBtn}><Trash2 size={12} color="#6B7568" /></button>
                                  </div>
                                  {needsPrice && (
                                    editingPriceTxId === t.id ? (
                                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                        <input
                                          type="number" inputMode="numeric" autoFocus
                                          placeholder={c.asset_type === 'gold' ? 'Harga emas/gram saat itu' : 'NAV reksadana/unit saat itu'}
                                          value={editingPriceValue}
                                          onChange={(e) => setEditingPriceValue(e.target.value)}
                                          onKeyDown={(e) => { if (e.key === 'Enter') saveHistoricalAssetPrice(t.id); }}
                                          style={{ ...styles.input, marginBottom: 0, fontSize: 11, padding: '5px 8px', flex: 1 }}
                                        />
                                        <button onClick={() => saveHistoricalAssetPrice(t.id)} style={{ ...styles.smallIconBtn, background: '#7FE8A4' }}><Check size={13} color="#0F1410" /></button>
                                        <button onClick={() => { setEditingPriceTxId(null); setEditingPriceValue(''); }} style={styles.smallIconBtn}><X size={13} color="#9CA89F" /></button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => { setEditingPriceTxId(t.id); setEditingPriceValue(''); }}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#FF9466', fontSize: 10.5, padding: '2px 0', display: 'flex', alignItems: 'center', gap: 3 }}
                                      >⚠️ Belum ada harga saat beli — klik untuk isi manual</button>
                                    )
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Card khusus transaksi saving tanpa kategori */}
                  {(() => {
                    const uncatTx = monthTx.filter((t) => t.type === 'saving' && !t.category).sort((a, b) => new Date(b.date) - new Date(a.date));
                    if (uncatTx.length === 0) return null;
                    const uncatTotal = uncatTx.reduce((s, t) => s + t.amount, 0);
                    return (
                      <div style={styles.budgetCard}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#8A8A8A25', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <HelpCircle size={16} color="#8A8A8A" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Tanpa kategori</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatRupiah(uncatTotal)}</div>
                          </div>
                          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 13, color: '#6FB7E8', flexShrink: 0 }}>
                            {formatRupiah(uncatTotal)}
                          </span>
                        </div>
                        <div style={{ borderTop: '1px solid #22291F', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {uncatTx.map((t) => (
                            <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {t.note || 'Lainnya'}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                                {new Date(t.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#6FB7E8', flexShrink: 0 }}>-{formatRupiah(t.amount)}</span>
                              <button onClick={() => deleteTransaction(t.id)} style={styles.deleteBtn}><Trash2 size={12} color="#6B7568" /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Ringkasan transaksi berulang */}
              <div style={{ ...styles.sectionHeader, marginTop: 24 }}>
                <span style={styles.sectionTitle}>Transaksi berulang</span>
                <button ref={recurringKelolaRef} onClick={() => setShowRecurringModal(true)} style={styles.linkBtn}>Kelola</button>
              </div>
              {recurringList.length === 0 ? (
                <div style={styles.emptyCard}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Belum ada transaksi berulang (gaji, tagihan, cicilan, dst).</span>
                  <button onClick={() => setShowRecurringModal(true)} style={{ ...styles.linkBtn, marginTop: 8, display: 'block' }}>+ Tambah transaksi berulang</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recurringList.slice(0, 4).map((r) => {
                    const cat = r.category_id ? catLookup(r.category_id) : null;
                    return (
                      <div key={r.id} style={{ ...styles.budgetCard, opacity: r.is_active ? 1 : 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.note || cat?.label || (r.type === 'income' ? 'Income' : '-')}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Tiap tanggal {r.day_of_month} · {formatRupiah(r.amount)}</div>
                        </div>
                        {!r.is_active && <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>Nonaktif</span>}
                      </div>
                    );
                  })}
                  {recurringList.length > 4 && (
                    <button onClick={() => setShowRecurringModal(true)} style={{ ...styles.linkBtn, textAlign: 'left' }}>+{recurringList.length - 4} lainnya</button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {tab === 'transactions' && (
          <div style={styles.txList}>
            {/* Export & Import Excel */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <button onClick={exportTransactionsExcel} style={styles.csvBtn}>
                <Download size={13} /> Export Excel
              </button>
              <button onClick={() => importFileRef.current?.click()} disabled={importing} style={{ ...styles.csvBtn, opacity: importing ? 0.6 : 1 }}>
                <Upload size={13} /> {importing ? 'Mengimpor...' : 'Import Excel'}
              </button>
              <input ref={importFileRef} type="file" accept=".xlsx,.xls" onChange={handleImportExcel} style={{ display: 'none' }} />
            </div>

            {importSummary && (
              <div style={{
                ...styles.errorBox, marginBottom: 12,
                background: importSummary.failed > 0 ? '#3A2418' : '#0D2A1A',
                color: importSummary.failed > 0 ? '#FF9466' : '#7FE8A4',
                flexDirection: 'column', alignItems: 'flex-start', gap: 4,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                  <span style={{ flex: 1 }}>
                    Import selesai: <b>{importSummary.success}</b> berhasil, <b>{importSummary.failed}</b> gagal
                    {importSummary.skipped > 0 && <>, <b>{importSummary.skipped}</b> dilewati (sudah ada/duplikat)</>}.
                  </span>
                  <button onClick={() => setImportSummary(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}><X size={14} /></button>
                </div>
                {importSummary.errors.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5 }}>
                    {importSummary.errors.slice(0, 8).map((e, i) => <li key={i}>{e}</li>)}
                    {importSummary.errors.length > 8 && <li>...dan {importSummary.errors.length - 8} error lainnya.</li>}
                  </ul>
                )}
              </div>
            )}

            {/* Search & filter tipe transaksi */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <input
                ref={txSearchRef}
                type="text"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                placeholder="Cari catatan atau kategori..."
                style={{ ...styles.input, marginBottom: 0, flex: '1 1 180px' }}
              />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'income', label: 'Income' },
                  { id: 'expense', label: 'Expense' },
                  { id: 'saving', label: 'Saving' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setTxTypeFilter(f.id)}
                    style={{
                      padding: '7px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                      border: `1px solid ${txTypeFilter === f.id ? 'var(--accent)' : 'var(--border)'}`,
                      background: txTypeFilter === f.id ? 'var(--accent)' : 'transparent',
                      color: txTypeFilter === f.id ? 'var(--accent-text, #0F1410)' : 'var(--text-secondary)',
                      fontWeight: txTypeFilter === f.id ? 700 : 500,
                    }}
                  >{f.label}</button>
                ))}
              </div>
            </div>

            {filteredMonthTx.length === 0 && (
              <div style={styles.emptyHint}>
                {monthTx.length === 0 ? 'Belum ada transaksi bulan ini.' : 'Tidak ada transaksi yang cocok dengan pencarian.'}
              </div>
            )}
            {filteredMonthTx.map((t) => (<TxRow key={t.id} t={t} onDelete={deleteTransaction} catLookup={catLookup} />))}
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
                { label: 'Saving', color: '#6FB7E8', total: totalSaving, data: savingPieData, isSaving: true },
              ].map((section) => {
                // Saving netto BISA negatif (kalau jual aset lebih besar dari beli bulan ini) — itu VALID,
                // bukan berarti "tidak ada aktivitas". Jadi gate kosongnya beda dari Income/Expense:
                // cek ada gross buy/sell dulu, baru dianggap benar-benar kosong.
                const hasActivity = section.isSaving ? (savingGrossBuy > 0 || savingGrossSell > 0) : section.total > 0;
                const canShowPie = section.isSaving ? section.total > 0 && section.data.length > 0 : section.total > 0;
                return (
                <div key={section.label} style={{ background: chartTheme.bg, border: "1px solid var(--border)", borderRadius: 14, padding: '20px 18px' }}>
                  <div style={styles.sectionHeader}>
                    <span style={styles.sectionTitle}>{section.label}</span>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: section.total < 0 ? '#FF9466' : section.color }}>{formatRupiah(section.total)}</span>
                  </div>
                  {!hasActivity ? (
                    <div style={{ ...styles.emptyHint, padding: '40px 0' }}>Belum ada data {section.label.toLowerCase()} bulan ini.</div>
                  ) : canShowPie ? (
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
                    // Saving ada aktivitas, tapi nettonya negatif/nol atau semua kategori netto <=0 —
                    // nggak bisa digambar pie (nggak ada slice positif), jadi tampilkan breakdown teks.
                    <div style={{ padding: '20px 0' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.6 }}>
                        Bulan ini lebih banyak dana <b>ditarik dari investasi/tabungan</b> (jual aset) daripada yang <b>ditambahkan</b> (beli/setor baru), jadi nggak bisa digambar sebagai pie chart. Rinciannya:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Total setor/beli</span>
                          <span style={{ color: '#6FB7E8', fontWeight: 700 }}>+{formatRupiah(savingGrossBuy)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Total jual/tarik</span>
                          <span style={{ color: '#7FE8A4', fontWeight: 700 }}>+{formatRupiah(savingGrossSell)} (masuk ke saldo)</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 2 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Netto saving bulan ini</span>
                          <span style={{ color: totalSaving < 0 ? '#FF9466' : '#6FB7E8', fontWeight: 700 }}>{formatRupiah(totalSaving)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );})}
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
      <button ref={fabRef} onClick={() => setShowAddModal(true)} className="dompet-fab" aria-label="Tambah transaksi"><Plus size={24} color="#0F1410" /></button>

      {/* ====== SNACKBAR UNDO HAPUS TRANSAKSI ====== */}
      {pendingDelete && (
        <div style={{
          position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)',
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)', zIndex: 60, maxWidth: 'calc(100vw - 32px)',
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Transaksi dihapus
          </span>
          <button onClick={undoDeleteTransaction} style={{
            background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 700,
            fontSize: 13, cursor: 'pointer', flexShrink: 0, padding: '4px 6px',
          }}>Undo</button>
        </div>
      )}

      {/* ====== ONBOARDING OVERLAY ====== */}
      {showOnboarding && (() => {
        const step = ONBOARDING_STEPS[onboardingStep];
        const isLast = onboardingStep === ONBOARDING_STEPS.length - 1;
        const isFirst = onboardingStep === 0;

        const PAD = 8;   // jarak ring spotlight dari tepi elemen asli
        const GAP = 14;  // jarak pop-up dari spotlight
        const POPUP_W = 260;

        let spotlight = null;
        let popupStyle;
        let arrowStyle = null;

        if (spotlightRect) {
          // Spotlight persis mengikuti posisi & ukuran elemen asli (diukur dari DOM)
          spotlight = {
            top: spotlightRect.top - PAD,
            left: spotlightRect.left - PAD,
            width: spotlightRect.width + PAD * 2,
            height: spotlightRect.height + PAD * 2,
          };

          const vh = window.innerHeight;
          const vw = window.innerWidth;
          const rectCenterX = spotlightRect.left + spotlightRect.width / 2;
          const placeBelow = spotlightRect.top < vh / 2; // elemen di atas layar -> pop-up di bawahnya, dst.
          const alignRight = rectCenterX > vw / 2;
          const MARGIN = 12;

          // Selalu hitung posisi lewat 'left' (bukan 'right') supaya tidak ada celah CSS positioning.
          // Kalau target di sisi kanan, sejajarkan tepi KANAN pop-up dengan tepi kanan target.
          // Kalau target di sisi kiri, sejajarkan tepi KIRI pop-up dengan tepi kiri target.
          let popupLeft = alignRight
            ? (spotlightRect.left + spotlightRect.width) - POPUP_W
            : spotlightRect.left;
          // Jangan sampai keluar layar di kanan maupun kiri
          popupLeft = Math.min(popupLeft, vw - POPUP_W - MARGIN);
          popupLeft = Math.max(popupLeft, MARGIN);

          popupStyle = {
            position: 'fixed',
            width: POPUP_W,
            maxWidth: 'calc(100vw - 24px)',
            left: popupLeft,
            ...(placeBelow
              ? { top: spotlightRect.top + spotlightRect.height + GAP }
              : { bottom: vh - spotlightRect.top + GAP }),
          };

          // Panah mengikuti titik tengah horizontal target ASLI, relatif terhadap posisi kiri pop-up
          // (bukan angka tetap), supaya selalu presisi menunjuk ke tombolnya berapa pun lebar pop-up.
          const arrowLeft = Math.min(
            Math.max(rectCenterX - popupLeft - 7, 16),
            POPUP_W - 16 - 14
          );

          arrowStyle = {
            position: 'absolute',
            width: 0, height: 0,
            borderStyle: 'solid',
            left: arrowLeft,
            ...(placeBelow
              ? { top: -7, borderWidth: '0 7px 8px 7px', borderColor: `transparent transparent ${step.color} transparent` }
              : { bottom: -7, borderWidth: '8px 7px 0 7px', borderColor: `${step.color} transparent transparent transparent` }),
          };
        } else {
          popupStyle = { position: 'fixed', bottom: '40%', left: '50%', transform: 'translateX(-50%)', width: 280 };
        }

        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, pointerEvents: 'none' }}>
            <style>{`
              @keyframes obFadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
              @keyframes obPulseRing { 0%,100% { box-shadow: 0 0 0 0 ${step.color}66; } 50% { box-shadow: 0 0 0 8px ${step.color}00; } }
              .ob-popup { animation: obFadeIn 0.25s cubic-bezier(0.34,1.56,0.64,1); }
              .ob-ring { animation: obPulseRing 1.8s ease-in-out infinite; }
            `}</style>

            {/* Overlay gelap dengan "lubang" spotlight persis di elemen target */}
            {spotlight && (
              <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
                {/* Overlay atas */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: Math.max(0, spotlight.top), background: 'rgba(0,0,0,0.72)' }} />
                {/* Overlay bawah */}
                <div style={{ position: 'absolute', top: spotlight.top + spotlight.height, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.72)' }} />
                {/* Kiri dari spotlight */}
                <div style={{ position: 'absolute', top: spotlight.top, left: 0, width: Math.max(0, spotlight.left), height: spotlight.height, background: 'rgba(0,0,0,0.72)' }} />
                {/* Kanan dari spotlight */}
                <div style={{ position: 'absolute', top: spotlight.top, left: spotlight.left + spotlight.width, right: 0, height: spotlight.height, background: 'rgba(0,0,0,0.72)' }} />
                {/* Ring pulsing tepat di sekeliling elemen target */}
                <div className="ob-ring" style={{
                  position: 'absolute',
                  top: spotlight.top, left: spotlight.left,
                  width: spotlight.width, height: spotlight.height,
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
              {/* Panah penunjuk arah ke elemen yang dituju */}
              {arrowStyle && <div style={arrowStyle} />}
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
            {(() => {
              const selectedFormCat = form.type !== 'income' ? categories.find((c) => c.id === form.categoryId) : null;
              if (!selectedFormCat?.asset_type) return null;
              const isGold = selectedFormCat.asset_type === 'gold';
              return (
                <>
                  <label style={styles.formLabel}>{isGold ? 'Jumlah gram (opsional, kalau tau persis dari Pluang)' : 'Jumlah unit (opsional, kalau tau persis dari Ajaib)'}</label>
                  <input type="number" inputMode="decimal" placeholder={isGold ? 'Contoh: 0.343380' : 'Contoh: 56.789'} value={form.unitsOverride || ''}
                    onChange={(e) => setForm({ ...form, unitsOverride: e.target.value })} style={styles.input} />
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: -6, marginBottom: 10 }}>
                    Kalau diisi, ini dipakai langsung sebagai {isGold ? 'gram' : 'unit'} (lebih presisi dari histori {isGold ? 'Pluang' : 'Ajaib'}). Kalau dikosongkan, dihitung otomatis dari nominal ÷ {isGold ? 'harga emas' : 'NAV reksadana'} hari ini.
                  </div>
                </>
              );
            })()}
            {(form.type === 'expense' || form.type === 'saving') && (
              <>
                <label style={styles.formLabel}>Kategori (opsional)</label>
                {(form.type === 'expense' ? expenseCategories : savingCategories).length === 0 ? (
                  <div style={styles.emptyHint}>
                    Belum ada kategori {form.type === 'expense' ? 'expense' : 'saving'}.
                    <button
                      onClick={() => { setShowAddModal(false); setCatEditType(form.type); setShowCategoryModal(true); }}
                      style={{ ...styles.linkBtn, display: 'block', marginTop: 6 }}
                    >+ Buat kategori sekarang</button>
                  </div>
                ) : (
                  <div style={styles.catGrid}>
                    <button onClick={() => setForm({ ...form, categoryId: null })} style={{ ...styles.catChip, borderColor: !form.categoryId ? 'var(--text-muted)' : '#2A332C', background: !form.categoryId ? 'var(--bg-card2)' : 'transparent' }}>
                      Tanpa kategori
                    </button>
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
        <div style={styles.modalOverlay} onClick={() => setShowBudgetModal(null)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>
                {showBudgetModal === 'expense' ? 'Atur budget expense (berlaku semua bulan)' : `Atur target saving — ${monthLabel(activeMonth)}`}
              </span>
              <button onClick={() => setShowBudgetModal(null)} style={styles.iconBtn}><X size={18} color="#9CA89F" /></button>
            </div>
            <div style={{ maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
              {showBudgetModal === 'expense' ? (
                <>
                  {expenseCategories.length === 0 && <div style={styles.emptyHint}>Belum ada kategori expense.</div>}
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Budget di sini berlaku terus tiap bulan sampai Anda ubah lagi — tidak perlu diisi ulang tiap ganti bulan.
                  </div>
                  {expenseCategories.map((c) => {
                    const CatIcon = getIconComponent(c.icon);
                    return (
                      <div key={c.id} style={styles.budgetInputRow}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-primary)', minWidth: 150 }}>
                          <CatIcon size={14} color={c.color} />{c.label}
                        </span>
                        <input type="number" inputMode="numeric" placeholder="0" defaultValue={getExpenseBudget(c.id) || ''} onBlur={(e) => setExpenseBudget(c.id, e.target.value)} style={{ ...styles.input, marginBottom: 0 }} />
                      </div>
                    );
                  })}
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
            <button onClick={() => setShowBudgetModal(null)} style={styles.submitBtn}><Check size={16} color="#0F1410" />Selesai</button>
          </div>
        </div>
      )}

      {/* Modal: atur goal kategori saving */}
      {goalEditingCatId && (
        <div style={styles.modalOverlay} onClick={() => setGoalEditingCatId(null)}>
          <div style={{ ...styles.modalCard, maxWidth: 340 }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Atur goal — {catLookup(goalEditingCatId)?.label}</span>
              <button onClick={() => setGoalEditingCatId(null)} style={styles.iconBtn}><X size={18} color="#9CA89F" /></button>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
              Progress dihitung dari total semua transaksi saving di kategori ini sepanjang waktu (bukan cuma bulan ini).
            </div>

            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Target total (kosongkan untuk hapus goal)</label>
            <input type="number" inputMode="numeric" placeholder="Contoh: 15000000" value={goalForm.amount}
              onChange={(e) => setGoalForm((f) => ({ ...f, amount: e.target.value }))} style={styles.input} />

            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Target tanggal tercapai (opsional)</label>
            <input type="date" value={goalForm.date}
              onChange={(e) => setGoalForm((f) => ({ ...f, date: e.target.value }))} style={styles.input} />

            <button onClick={saveCategoryGoal} disabled={savingGoal} style={{ ...styles.submitBtn, opacity: savingGoal ? 0.6 : 1 }}>
              <Check size={16} color="#0F1410" />{savingGoal ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      )}

      {/* Modal: jual aset (emas/reksadana) */}
      {sellingCatId && (() => {
        const cat = catLookup(sellingCatId);
        const invest = cat ? computeInvestmentStats(cat) : null;
        return (
          <div style={styles.modalOverlay} onClick={() => setSellingCatId(null)}>
            <div style={{ ...styles.modalCard, maxWidth: 340 }} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <span style={styles.modalTitle}>Jual aset — {cat?.label}</span>
                <button onClick={() => setSellingCatId(null)} style={styles.iconBtn}><X size={18} color="#9CA89F" /></button>
              </div>

              {invest && !invest.noDataYet && invest.heldUnits > 0 ? (
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12, background: 'var(--bg-base)', padding: '8px 10px', borderRadius: 8 }}>
                  {cat.asset_type === 'gold' && <>Dipegang saat ini: <b style={{ color: 'var(--text-primary)' }}>{invest.heldUnits.toFixed(6)} gram</b> (nilai ~{formatRupiah(invest.currentValue)})</>}
                  {cat.asset_type === 'reksadana_syariah' && <>Nilai investasi saat ini: <b style={{ color: 'var(--text-primary)' }}>{formatRupiah(invest.currentValue)}</b></>}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: '#F5C95D', marginBottom: 12 }}>⚠️ Belum ada data kepemilikan yang bisa dihitung untuk kategori ini.</div>
              )}

              {invest && !invest.noDataYet && invest.heldUnits > 0 && (
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12, cursor: 'pointer', background: sellForm.isFullSale ? 'rgba(255,148,102,0.12)' : 'transparent', padding: 8, borderRadius: 8, border: `1px solid ${sellForm.isFullSale ? '#FF9466' : 'var(--border)'}` }}>
                  <input type="checkbox" checked={sellForm.isFullSale}
                    onChange={(e) => setSellForm((f) => ({ ...f, isFullSale: e.target.checked, amount: e.target.checked ? String(Math.round(invest.currentValue)) : '' }))}
                    style={{ marginTop: 2 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                    <b>Ini penjualan SELURUH aset saya</b> (habis, sisa jadi 0 gram/unit).
                    <br /><span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Nominal otomatis diisi sesuai nilai sekarang, tidak perlu diketik manual.</span>
                  </span>
                </label>
              )}

              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Nominal hasil jual (Rupiah diterima)</label>
              <input type="number" inputMode="numeric" placeholder="Contoh: 500000" value={sellForm.amount} disabled={sellForm.isFullSale}
                onChange={(e) => setSellForm((f) => ({ ...f, amount: e.target.value }))} style={{ ...styles.input, opacity: sellForm.isFullSale ? 0.6 : 1 }} />
              {sellForm.isFullSale && (
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: -6, marginBottom: 10 }}>
                  Nominal dikunci otomatis karena ini penjualan seluruh aset — kalau ternyata di aplikasi investasi Anda hasil jualnya beda (misal kena potongan/biaya admin), batalkan centang di atas dan isi manual nominal yang benar-benar diterima.
                </div>
              )}

              {!sellForm.isFullSale && cat.asset_type && (
                <>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                    {cat.asset_type === 'gold' ? 'Jumlah gram terjual (opsional, kalau tau persis dari Pluang)' : 'Jumlah unit terjual (opsional, kalau tau persis dari Ajaib)'}
                  </label>
                  <input type="number" inputMode="decimal" placeholder={cat.asset_type === 'gold' ? 'Contoh: 0.343380' : 'Contoh: 56.789'} value={sellForm.unitsOverride}
                    onChange={(e) => setSellForm((f) => ({ ...f, unitsOverride: e.target.value }))} style={styles.input} />
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: -6, marginBottom: 10 }}>
                    Kalau diisi, ini dipakai langsung sebagai {cat.asset_type === 'gold' ? 'gram' : 'unit'} yang terjual (lebih presisi dari histori {cat.asset_type === 'gold' ? 'Pluang' : 'Ajaib'}). Kalau dikosongkan, dihitung otomatis dari nominal ÷ {cat.asset_type === 'gold' ? 'harga emas' : 'NAV reksadana'} saat ini.
                  </div>
                </>
              )}

              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Tanggal jual</label>
              <input type="date" value={sellForm.date}
                onChange={(e) => setSellForm((f) => ({ ...f, date: e.target.value }))} style={styles.input} />

              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Catatan (opsional)</label>
              <input type="text" placeholder="Contoh: Jual sebagian buat dana darurat" value={sellForm.note}
                onChange={(e) => setSellForm((f) => ({ ...f, note: e.target.value }))} style={styles.input} />

              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: -6, marginBottom: 12 }}>
                {cat?.asset_type === 'gold'
                  ? 'Untung/rugi dihitung otomatis pakai harga rata-rata beli (weighted average cost) dibandingkan harga emas terkini saat ini.'
                  : 'Untung/rugi dihitung otomatis berdasarkan estimasi pertumbuhan reksadana sejak tiap transaksi nabung dilakukan.'}
              </div>

              <button onClick={sellAsset} disabled={savingSell} style={{ ...styles.submitBtn, background: '#FF9466', opacity: savingSell ? 0.6 : 1 }}>
                <TrendingDown size={16} color="#0F1410" />{savingSell ? 'Menyimpan...' : 'Catat Penjualan'}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Modal: kelola transaksi berulang */}
      {showRecurringModal && (
        <div style={styles.modalOverlay} onClick={() => setShowRecurringModal(false)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Transaksi berulang</span>
              <button onClick={() => setShowRecurringModal(false)} style={styles.iconBtn}><X size={18} color="#9CA89F" /></button>
            </div>

            <div style={{ maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
              {/* Daftar aturan yang sudah ada */}
              {recurringList.length === 0 && <div style={styles.emptyHint}>Belum ada transaksi berulang.</div>}
              {recurringList.map((r) => {
                const cat = r.category_id ? catLookup(r.category_id) : null;
                return (
                  <div key={r.id} style={{ ...styles.budgetInputRow, opacity: r.is_active ? 1 : 0.5 }}>
                    <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.note || cat?.label || (r.type === 'income' ? 'Income' : '-')}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {r.type === 'income' ? 'Income' : `${r.type === 'expense' ? 'Expense' : 'Saving'} · ${cat?.label || '-'}`} · Tgl {r.day_of_month} · {formatRupiah(r.amount)}
                      </span>
                    </span>
                    <button onClick={() => toggleRecurringActive(r.id, r.is_active)} style={{ ...styles.linkBtn, whiteSpace: 'nowrap' }}>
                      {r.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button onClick={() => deleteRecurring(r.id)} style={styles.deleteBtn}><Trash2 size={12} color="#6B7568" /></button>
                  </div>
                );
              })}

              {/* Form tambah aturan baru */}
              <div style={{ ...styles.budgetGroupLabel, marginTop: 16 }}>Tambah transaksi berulang</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {['expense', 'income', 'saving'].map((t) => (
                  <button key={t} onClick={() => setRecurringForm((f) => ({ ...f, type: t, categoryId: null }))}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                      border: `1px solid ${recurringForm.type === t ? 'var(--accent)' : 'var(--border)'}`,
                      background: recurringForm.type === t ? 'var(--accent)' : 'transparent',
                      color: recurringForm.type === t ? 'var(--accent-text)' : 'var(--text-secondary)',
                      fontWeight: recurringForm.type === t ? 700 : 500,
                    }}>
                    {t === 'expense' ? 'Expense' : t === 'income' ? 'Income' : 'Saving'}
                  </button>
                ))}
              </div>

              {recurringForm.type !== 'income' && (
                <select
                  value={recurringForm.categoryId || ''}
                  onChange={(e) => setRecurringForm((f) => ({ ...f, categoryId: e.target.value }))}
                  style={{ ...styles.input }}
                >
                  <option value="">Pilih kategori...</option>
                  {(recurringForm.type === 'saving' ? savingCategories : expenseCategories).map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              )}

              <input type="text" placeholder="Catatan (mis. Gaji Bulanan, Tagihan Wifi)" value={recurringForm.note}
                onChange={(e) => setRecurringForm((f) => ({ ...f, note: e.target.value }))} style={styles.input} />

              <div style={{ display: 'flex', gap: 10 }}>
                <input type="number" inputMode="numeric" placeholder="Nominal" value={recurringForm.amount}
                  onChange={(e) => setRecurringForm((f) => ({ ...f, amount: e.target.value }))} style={{ ...styles.input, flex: 1 }} />
                <input type="number" inputMode="numeric" min="1" max="31" placeholder="Tgl (1-31)" value={recurringForm.dayOfMonth}
                  onChange={(e) => setRecurringForm((f) => ({ ...f, dayOfMonth: e.target.value }))} style={{ ...styles.input, width: 110 }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: -6, marginBottom: 12 }}>
                Kalau bulan tidak punya tanggal itu (mis. tanggal 31 di bulan 30 hari), otomatis dipakai tanggal terakhir bulan itu.
              </div>

              <button onClick={addRecurring} disabled={savingRecurring} style={{ ...styles.submitBtn, opacity: savingRecurring ? 0.6 : 1 }}>
                <Check size={16} color="#0F1410" />{savingRecurring ? 'Menyimpan...' : 'Tambah'}
              </button>
            </div>
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
                          <span style={styles.iconNameTag}>{ICON_LIST.find((i) => i.id === editingCatIcon)?.label || 'Ikon'}</span>
                          <input type="text" value={editingCatLabel} onChange={(e) => setEditingCatLabel(e.target.value)} style={{ ...styles.input, marginBottom: 0, flex: 1 }} autoFocus />
                          <button onClick={saveEditCategory} style={styles.smallIconBtn}><Check size={15} color="#7FE8A4" /></button>
                          <button onClick={() => { setEditingCatId(null); setShowEditIconPicker(false); }} style={styles.smallIconBtn}><X size={15} color="#9CA89F" /></button>
                        </div>
                        {catEditType === 'saving' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            {[
                              { id: null, label: 'Tidak ada' },
                              { id: 'gold', label: '🥇 Emas' },
                              { id: 'reksadana_syariah', label: '📈 Reksadana Syariah' },
                            ].map((opt) => (
                              <button key={opt.label} onClick={() => setEditingCatAssetType(opt.id)}
                                style={{
                                  flex: 1, padding: '6px 4px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                                  border: `1px solid ${editingCatAssetType === opt.id ? 'var(--accent)' : 'var(--border)'}`,
                                  background: editingCatAssetType === opt.id ? 'var(--accent)' : 'transparent',
                                  color: editingCatAssetType === opt.id ? 'var(--accent-text)' : 'var(--text-secondary)',
                                  fontWeight: editingCatAssetType === opt.id ? 700 : 500,
                                }}>{opt.label}</button>
                            ))}
                          </div>
                        )}
                        {showEditIconPicker && (
                          <>
                            <div style={styles.iconPreviewBar}>{previewIconLabel || 'Sentuh ikon untuk lihat namanya'}</div>
                            <div style={styles.iconGrid}>
                              {ICON_LIST.map((ic) => (
                                <button key={ic.id}
                                  onClick={() => { setEditingCatIcon(ic.id); setShowEditIconPicker(false); setPreviewIconLabel(null); }}
                                  onMouseEnter={() => setPreviewIconLabel(ic.label)}
                                  onMouseLeave={() => setPreviewIconLabel(null)}
                                  onTouchStart={() => setPreviewIconLabel(ic.label)}
                                  style={{ ...styles.iconChip, borderColor: editingCatIcon === ic.id ? '#7FE8A4' : '#2A332C', background: editingCatIcon === ic.id ? '#7FE8A422' : 'transparent' }}
                                  title={ic.label}>
                                  <ic.Icon size={16} color={editingCatIcon === ic.id ? '#7FE8A4' : 'var(--text-muted)'} />
                                </button>
                              ))}
                            </div>
                          </>
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
              <span style={styles.iconNameTag}>{ICON_LIST.find((i) => i.id === newCatIcon)?.label || 'Pilih ikon'}</span>
              <input type="text" placeholder={catEditType === 'saving' ? 'Contoh: Emergency Fund' : 'Contoh: Belanja Bulanan'} value={newCatLabel} onChange={(e) => setNewCatLabel(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addCategory(); }} style={{ ...styles.input, marginBottom: 0, flex: 1 }} />
              <button onClick={addCategory} style={{ ...styles.smallIconBtn, width: 38, height: 38, background: '#7FE8A4', flexShrink: 0 }}><Plus size={18} color="#0F1410" /></button>
            </div>
            {catEditType === 'saving' && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {[
                  { id: null, label: 'Tidak ada' },
                  { id: 'gold', label: '🥇 Emas' },
                  { id: 'reksadana_syariah', label: '📈 Reksadana Syariah' },
                ].map((opt) => (
                  <button key={opt.label} onClick={() => setNewCatAssetType(opt.id)}
                    style={{
                      flex: 1, padding: '6px 4px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                      border: `1px solid ${newCatAssetType === opt.id ? 'var(--accent)' : 'var(--border)'}`,
                      background: newCatAssetType === opt.id ? 'var(--accent)' : 'transparent',
                      color: newCatAssetType === opt.id ? 'var(--accent-text)' : 'var(--text-secondary)',
                      fontWeight: newCatAssetType === opt.id ? 700 : 500,
                    }}>{opt.label}</button>
                ))}
              </div>
            )}
            {showIconPicker && (
              <>
                <div style={styles.iconPreviewBar}>{previewIconLabel || 'Sentuh ikon untuk lihat namanya'}</div>
                <div style={styles.iconGrid}>
                  {ICON_LIST.map((ic) => (
                    <button key={ic.id}
                      onClick={() => { setNewCatIcon(ic.id); setShowIconPicker(false); setPreviewIconLabel(null); }}
                      onMouseEnter={() => setPreviewIconLabel(ic.label)}
                      onMouseLeave={() => setPreviewIconLabel(null)}
                      onTouchStart={() => setPreviewIconLabel(ic.label)}
                      style={{ ...styles.iconChip, borderColor: newCatIcon === ic.id ? '#7FE8A4' : '#2A332C', background: newCatIcon === ic.id ? '#7FE8A422' : 'transparent' }}
                      title={ic.label}>
                      <ic.Icon size={16} color={newCatIcon === ic.id ? '#7FE8A4' : 'var(--text-muted)'} />
                    </button>
                  ))}
                </div>
              </>
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
  else if (isSaving) {
    iconEl = <PiggyBank size={15} color={cat ? cat.color : '#6FB7E8'} />;
    if (t.assetAction === 'sell') {
      // Jual aset = uang MASUK (dari investasi kembali ke saldo utama), bukan keluar
      amountColor = '#7FE8A4'; sign = '+';
    } else {
      amountColor = '#6FB7E8';
    }
  }
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
  errorBox: { display: 'flex', gap: 8, fontSize: 12.5, padding: '10px 12px', borderRadius: 8 },
  csvBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
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
  iconNameTag: { fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  iconPreviewBar: { fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', padding: '6px 0', marginTop: 4, minHeight: 18 },
};
