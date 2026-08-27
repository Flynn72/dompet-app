import React, { useState, useEffect, useMemo, useCallback, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isPushSupported, getNotificationPermissionStatus, enablePushNotifications, disablePushNotifications, checkExistingSubscription } from '../lib/pushClient';
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
  Download, Upload, Sun, Moon, Target, HelpCircle, MessageSquare,
  ChevronDown, ChevronUp, Hand, Search, Repeat, PartyPopper, Rocket, Bug, Lightbulb, Bell, BellOff
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import AssetsSummaryCard from './AssetsSummaryCard';

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
    icon: Hand,
    title: 'Selamat datang!',
    desc: 'Yuk kenalan dulu sama Dompet — aplikasi buat catat keuangan kamu sehari-hari. Cuma butuh beberapa langkah singkat untuk mulai.',
    color: '#7FE8A4',
    target: null, // tidak ada spotlight, pop-up di tengah
    tab: 'overview',
  },
  {
    icon: Settings,
    title: 'Buat kategori dulu',
    desc: 'Klik ikon pengaturan ini untuk bikin kategori Expense (pengeluaran) & Saving (tabungan) sesuai kebutuhan kamu.',
    color: '#C99FE8',
    target: 'settings', // ref ke tombol kelola kategori
    tab: 'overview',
    action: 'openCategoryModal',
  },
  {
    icon: Wallet,
    title: 'Catat transaksi pertama',
    desc: 'Tekan tombol + ini untuk catat Income, Expense, atau Saving. Kategori sekarang opsional — bisa langsung simpan walau belum pilih kategori.',
    color: '#7FE8A4',
    target: 'fab', // ref ke tombol tambah transaksi
    tab: 'overview',
    action: 'openAddModal',
  },
  {
    icon: Search,
    title: 'Klik kartu buat filter cepat',
    desc: 'Klik kartu Expense ini buat langsung lihat semua transaksi Expense di tab Transaksi — jadi shortcut, nggak perlu atur filter manual.',
    color: '#FF9466',
    target: 'expenseCard',
    tab: 'overview',
  },
  {
    icon: Search,
    title: 'Cari, filter & export/import',
    desc: 'Di tab Transaksi ini, kamu bisa cari transaksi, filter per tipe, dan export/import data ke Excel — enak buat backup atau input transaksi banyak sekaligus.',
    color: '#6FB7E8',
    target: 'txSearch',
    tab: 'transactions', // otomatis pindah ke tab Transaksi
  },
  {
    icon: BarChart2,
    title: 'Atur budget & target saving',
    desc: 'Klik "Atur budget" di kartu Budget Expense untuk tentukan batas pengeluaran per kategori. Ada juga "Atur target" buat goal saving jangka panjang (misal beli motor) lengkap dengan estimasi tercapainya.',
    color: '#F5C95D',
    target: 'budgetLink',
    tab: 'overview', // pindah balik ke Dashboard setelah step sebelumnya sempat ke tab Transaksi
    action: 'openBudgetModal',
  },
  {
    icon: Repeat,
    title: 'Transaksi berulang',
    desc: 'Punya tagihan rutin kayak gaji, wifi, atau cicilan? Klik "Kelola" di sini buat atur transaksi yang otomatis tercatat sendiri tiap bulan.',
    color: '#C99FE8',
    target: 'recurringKelola',
    tab: 'overview',
    action: 'openRecurringModal',
  },
  {
    icon: Target,
    title: 'Baca laporan bulanan',
    desc: 'Klik tab Laporan ini buat lihat pie chart dan tren 6 bulan keuangan kamu — enak dipantau tiap akhir bulan.',
    color: '#6FB7E8',
    target: 'reportsTab', // ref ke tab Laporan, otomatis pindah tab
    tab: 'reports',
  },
  {
    icon: Coins,
    title: 'Kelola Tabungan, Emas, Reksa Dana & Deposito',
    desc: 'Klik tab "Aset" ini buat kelola semua investasi kamu — harga emas & NAV reksadana otomatis update tiap hari, tinggal catat beli/jual atau setor/tarik langsung di halamannya masing-masing.',
    color: '#F5C95D',
    target: 'asetTab',
    tab: 'overview',
  },
];

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [assetTransactions, setAssetTransactions] = useState([]); // dari asset_transactions (dipakai kartu Saving & tren di Laporan)
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
  const [recurringForm, setRecurringForm] = useState({ type: 'expense', categoryId: null, amount: '', note: '', dayOfMonth: '1', notifyEnabled: false, notifyDaysBefore: [3, 1, 0] });
  const [savingRecurring, setSavingRecurring] = useState(false);
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem('dompet_theme') || 'system'); // system | dark | light
  const [tab, setTab] = useState('overview');

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('all'); // all | income | expense | saving
  const [pendingDelete, setPendingDelete] = useState(null); // { tx, timeoutId } — untuk fitur undo hapus
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    checkExistingSubscription().then(setPushEnabled);
  }, []);

  async function togglePushNotifications() {
    if (pushLoading) return;
    setPushLoading(true);
    try {
      if (pushEnabled) {
        await disablePushNotifications();
        setPushEnabled(false);
      } else {
        await enablePushNotifications(user.id);
        setPushEnabled(true);
      }
    } catch (err) {
      alert(err.message || 'Gagal mengubah pengaturan notifikasi.');
    }
    setPushLoading(false);
  }
  const [selectedTxDetail, setSelectedTxDetail] = useState(null); // transaksi yang lagi dilihat detailnya (klik dari history)
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null); // { success, failed, errors: [] }
  const importFileRef = useRef(null);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showExportChoice, setShowExportChoice] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ category: 'saran', message: '', rating: 0 });
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackSentMsg, setFeedbackSentMsg] = useState(false);

  async function sendFeedback() {
    if (!feedbackForm.message.trim()) return;
    setSavingFeedback(true);
    const { error } = await supabase.from('feedback').insert({
      user_id: user.id,
      category: feedbackForm.category,
      message: feedbackForm.message.trim(),
      rating: feedbackForm.rating || null,
    });
    setSavingFeedback(false);
    if (error) { setSaveError(true); return; }
    setShowFeedbackModal(false);
    setFeedbackForm({ category: 'saran', message: '', rating: 0 });
    setFeedbackSentMsg(true);
    setTimeout(() => setFeedbackSentMsg(false), 4000);
  }
  // Kategori mana yang sedang di-expand (nampilin SEMUA transaksi) — defaultnya cuma 3 transaksi
  // terakhir yang kelihatan per card, biar card nggak kepanjangan kalau transaksinya banyak.
  const [expandedCatIds, setExpandedCatIds] = useState(() => new Set());
  function toggleCatExpanded(catId) {
    setExpandedCatIds((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId); else next.add(catId);
      return next;
    });
  }
  const [obActionPhase, setObActionPhase] = useState(0); // 0 = spotlight tombol, 1 = modal terkait sudah dibuka
  const [spotlightRect, setSpotlightRect] = useState(null); // posisi presisi elemen target, dihitung langsung dari DOM
  const settingsBtnRef = useRef(null);
  const fabRef = useRef(null);
  const reportsTabRef = useRef(null);
  const budgetLinkRef = useRef(null);
  const expenseCardRef = useRef(null);
  const txSearchRef = useRef(null);
  const recurringKelolaRef = useRef(null);
  const asetTabRef = useRef(null); // ref tombol tab "Aset" di header, buat spotlight onboarding (Task 3.7)
  const targetRefs = {
    settings: settingsBtnRef, fab: fabRef, reportsTab: reportsTabRef, budgetLink: budgetLinkRef,
    expenseCard: expenseCardRef, txSearch: txSearchRef, recurringKelola: recurringKelolaRef,
    asetTab: asetTabRef,
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
  const [editingPriceTxId, setEditingPriceTxId] = useState(null); // id transaksi yang sedang diisi jumlah gram/unit-nya
  const [editingUnitsValue, setEditingUnitsValue] = useState(''); // isi jumlah gram/unit langsung, buat transaksi lama/berulang yang belum tercatat
  const [editingDetailAsset, setEditingDetailAsset] = useState(false); // lagi koreksi harga/unit dari modal Detail Transaksi
  const [detailPriceValue, setDetailPriceValue] = useState('');
  const [detailUnitsValue, setDetailUnitsValue] = useState('');
  function openTxDetail(t) {
    setSelectedTxDetail(t);
    setEditingDetailAsset(false);
    setDetailPriceValue('');
    setDetailUnitsValue('');
    setDetailAmountValue('');
  }
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
  async function generateDueRecurringTransactions(rules, existingTx, catsFresh, goldPriceFresh, reksadanaNavFresh) {
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

      const selectedCat = catsFresh.find((c) => c.id === rule.category_id);
      const assetPriceAtTx = rule.type === 'saving' && selectedCat?.asset_type === 'gold' ? (goldPriceFresh || null)
        : rule.type === 'saving' && selectedCat?.asset_type === 'reksadana_syariah' ? (reksadanaNavFresh || null)
        : null;

      toCreate.push({
        user_id: user.id,
        type: rule.type,
        category_id: rule.category_id,
        amount: rule.amount,
        note: rule.note || '',
        tx_date: `${currentMonthKey}-${pad2(clampedDay)}`,
        recurring_id: rule.id,
        asset_price_at_tx: assetPriceAtTx,
        asset_action: selectedCat?.asset_type ? 'buy' : null,
      });
    }

    if (toCreate.length === 0) return;

    const { data, error } = await supabase.from('transactions').insert(toCreate).select();
    if (!error && data) {
      setTransactions((prev) => [
        ...data.map((t) => ({ id: t.id, type: t.type, amount: Number(t.amount), category: t.category_id, note: t.note || '', date: t.tx_date, createdAt: t.created_at, recurringId: t.recurring_id, assetPriceAtTx: t.asset_price_at_tx ? Number(t.asset_price_at_tx) : null, assetAction: t.asset_action || 'buy', assetUnitsOverride: t.asset_units_override ? Number(t.asset_units_override) : null })),
        ...prev,
      ].sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
  }

  const loadAll = useCallback(async () => {
    try {
      const [{ data: cats, error: catErr }, { data: txs, error: txErr }, { data: bgs, error: bgErr }, { data: recs, error: recErr }, { data: prices, error: priceErr }, { data: assetTxs, error: assetTxErr }] = await Promise.all([
        supabase.from('categories').select('*').eq('user_id', user.id).order('sort_order'),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('tx_date', { ascending: false }),
        supabase.from('budgets').select('*').eq('user_id', user.id),
        supabase.from('recurring_transactions').select('*').eq('user_id', user.id).order('created_at'),
        supabase.rpc('get_latest_prices'),
        // Transaksi Aset (Task Laporan-fix) -- dipakai kartu "Saving" & tren
        // di tab Laporan, supaya ikut data BARU (asset_transactions), bukan
        // data lama yang sudah beku sejak tombol "Saving" di form + dinonaktifkan.
        // RLS asset_transactions otomatis menyaring cuma milik user ini.
        supabase.from('asset_transactions').select('*, asset_accounts(name, asset_type, color)'),
      ]);
      if (catErr || txErr || bgErr || recErr) { setSaveError(true); }
      else {
        setCategories(cats || []);
        const txList = (txs || []).map((t) => ({ id: t.id, type: t.type, amount: Number(t.amount), category: t.category_id, note: t.note || '', date: t.tx_date, createdAt: t.created_at, recurringId: t.recurring_id, assetPriceAtTx: t.asset_price_at_tx ? Number(t.asset_price_at_tx) : null, assetAction: t.asset_action || 'buy', assetUnitsOverride: t.asset_units_override ? Number(t.asset_units_override) : null }));
        setTransactions(txList);
        if (!assetTxErr) {
          const assetTxList = (assetTxs || []).map((t) => ({
            id: t.id,
            amount: Number(t.amount),
            date: t.tx_date,
            action: t.action,
            accountName: t.asset_accounts?.name || 'Tanpa nama',
            accountType: t.asset_accounts?.asset_type || null,
          }));
          setAssetTransactions(assetTxList);
        }
        setBudgets(bgs || []);
        setRecurringList(recs || []);
        let freshGoldPrice = null;
        let freshReksadanaNav = null;
        if (!priceErr && prices) {
          const gold = prices.find((p) => p.asset_name === 'gold_pluang');
          if (gold) { freshGoldPrice = Number(gold.price); setLatestGoldPrice(freshGoldPrice); }
          const reksadana = prices.find((p) => p.asset_name === 'reksadana_insight_syariah');
          if (reksadana) { freshReksadanaNav = Number(reksadana.price); setLatestReksadanaNav(freshReksadanaNav); }
        }
        setSaveError(false);
        // Tampilkan onboarding hanya untuk user baru (belum punya kategori sama sekali)
        if ((cats || []).length === 0) {
          const doneKey = `onboarding_done_${user.id}`;
          const alreadyDone = localStorage.getItem(doneKey);
          if (!alreadyDone) setShowOnboarding(true);
        }
        // Cek & generate transaksi berulang yang sudah jatuh tempo bulan ini
        // (pakai cats/harga yang BARU SAJA di-fetch di atas, bukan state React lama,
        // supaya tidak kena stale closure — loadAll ini di-memo via useCallback
        // dan hanya dibuat ulang saat user.id berubah)
        if (recs && recs.length > 0) {
          generateDueRecurringTransactions(recs, txList, cats || [], freshGoldPrice, freshReksadanaNav);
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
    setTransactions((prev) => [{ id: data.id, type: data.type, amount: Number(data.amount), category: data.category_id, note: data.note || '', date: data.tx_date, createdAt: data.created_at, assetPriceAtTx: data.asset_price_at_tx ? Number(data.asset_price_at_tx) : null, assetAction: data.asset_action || 'buy', assetUnitsOverride: data.asset_units_override ? Number(data.asset_units_override) : null }, ...prev]);
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
      { id: data.id, type: data.type, amount: Number(data.amount), category: data.category_id, note: data.note || '', date: data.tx_date, createdAt: data.created_at, assetPriceAtTx: data.asset_price_at_tx ? Number(data.asset_price_at_tx) : null, assetAction: data.asset_action || 'buy', assetUnitsOverride: data.asset_units_override ? Number(data.asset_units_override) : null },
      ...prev,
    ].sort((a, b) => new Date(b.date) - new Date(a.date)));
  }

  // scope: 'all' = seluruh transaksi dari awal (perilaku lama), 'filtered' = cuma yang lagi
  // ditampilkan di layar sekarang (sudah kefilter bulan aktif + tipe + kata kunci pencarian).
  function exportTransactionsExcel(scope) {
    const source = scope === 'filtered' ? filteredMonthTx : transactions;
    const rows = source.map((t) => ({
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
    const suffix = scope === 'filtered' ? `-filter-${activeMonth}` : '-semua';
    XLSX.writeFile(wb, `dompet-transaksi${suffix}-${todayStr()}.xlsx`);
    setShowExportChoice(false);
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
          ...data.map((t) => ({ id: t.id, type: t.type, amount: Number(t.amount), category: t.category_id, note: t.note || '', date: t.tx_date, createdAt: t.created_at, assetPriceAtTx: t.asset_price_at_tx ? Number(t.asset_price_at_tx) : null, assetAction: t.asset_action || 'buy', assetUnitsOverride: t.asset_units_override ? Number(t.asset_units_override) : null })),
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
      notify_enabled: recurringForm.notifyEnabled,
      notify_days_before: recurringForm.notifyEnabled ? recurringForm.notifyDaysBefore : [],
    }).select().single();
    setSavingRecurring(false);

    if (error) { setSaveError(true); return; }
    setRecurringList((prev) => [...prev, data]);
    setRecurringForm({ type: 'expense', categoryId: null, amount: '', note: '', dayOfMonth: '1', notifyEnabled: false, notifyDaysBefore: [3, 1, 0] });
  }

  async function toggleRecurringActive(id, current) {
    const { error } = await supabase.from('recurring_transactions').update({ is_active: !current }).eq('id', id);
    if (error) { setSaveError(true); return; }
    setRecurringList((prev) => prev.map((r) => (r.id === id ? { ...r, is_active: !current } : r)));
  }

  // Toggle notifikasi ON/OFF untuk 1 transaksi berulang (dipakai buat reminder tagihan).
  // Kalau baru dinyalakan dan belum pernah diatur, default-nya H-3/H-1/Hari-H.
  async function toggleRecurringNotify(id, current, existingDays) {
    const newEnabled = !current;
    const daysBefore = newEnabled && (!existingDays || existingDays.length === 0) ? [3, 1, 0] : (existingDays || []);
    const { error } = await supabase.from('recurring_transactions').update({ notify_enabled: newEnabled, notify_days_before: daysBefore }).eq('id', id);
    if (error) { setSaveError(true); return; }
    setRecurringList((prev) => prev.map((r) => (r.id === id ? { ...r, notify_enabled: newEnabled, notify_days_before: daysBefore } : r)));
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
  // ---- Kartu Saving di Laporan: sumber data DIGANTI ke asset_transactions
  // (bukan lagi transactions lama) -- supaya ikut aktivitas terbaru yang
  // dicatat lewat halaman Aset, bukan cuma data historis sebelum migrasi. ----
  const monthAssetTx = useMemo(() => assetTransactions.filter((t) => monthKey(t.date) === activeMonth), [assetTransactions, activeMonth]);
  const isOutflowAction = (action) => action === 'sell' || action === 'withdraw';
  const totalSaving = useMemo(() => monthAssetTx.reduce((s, t) => s + t.amount * (isOutflowAction(t.action) ? -1 : 1), 0), [monthAssetTx]);
  // Breakdown kotor (gross) beli/setor vs jual/tarik saving bulan ini — dipakai buat nampilin ringkasan yang jelas
  // di Laporan waktu netto-nya negatif (jual lebih besar dari beli), supaya nggak kelihatan "kosong".
  const savingGrossBuy = useMemo(() => monthAssetTx.filter((t) => !isOutflowAction(t.action)).reduce((s, t) => s + t.amount, 0), [monthAssetTx]);
  const savingGrossSell = useMemo(() => monthAssetTx.filter((t) => isOutflowAction(t.action)).reduce((s, t) => s + t.amount, 0), [monthAssetTx]);
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
      .sort((a, b) => {
        // Urutan kronologis WAJIB benar untuk avg cost yang akurat — kalau 2 transaksi
        // (misal jual & beli) terjadi di TANGGAL YANG SAMA, urutan tanggal saja tidak cukup
        // (keduanya dianggap "seri" oleh Date). Makanya pakai created_at (waktu benar-benar
        // disimpan ke database) sebagai penentu urutan kedua, supaya urutan transaksi hari
        // yang sama tetap sesuai urutan aslinya diinput (bug lama: bisa kebalik, bikin
        // "Jual Semua Aset" salah hitung karena avg cost tercampur transaksi beli yang
        // sebetulnya terjadi SESUDAHNYA).
        const dateDiff = new Date(a.date) - new Date(b.date);
        if (dateDiff !== 0) return dateDiff;
        if (a.createdAt && b.createdAt) return new Date(a.createdAt) - new Date(b.createdAt);
        return 0;
      });
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

  // Isi jumlah gram/unit secara LANGSUNG untuk transaksi yang belum tercatat datanya
  // (transaksi lama sebelum fitur ini ada, atau transaksi berulang) — nyalin persis dari
  // histori Pluang/Ajaib. Sengaja tidak minta "harga per unit" di sini karena rawan
  // tertukar (yang diketik user adalah jumlah unit, bukan harga per unit).
  async function saveHistoricalAssetUnits(txId) {
    const units = parseFloat(editingUnitsValue);
    if (!units || units <= 0) return;
    const { error } = await supabase.from('transactions').update({ asset_units_override: units }).eq('id', txId);
    if (error) { setSaveError(true); return; }
    setTransactions((prev) => prev.map((t) => (t.id === txId ? { ...t, assetUnitsOverride: units } : t)));
    setEditingPriceTxId(null);
    setEditingUnitsValue('');
  }

  const [detailAmountValue, setDetailAmountValue] = useState(''); // koreksi nominal (Rp) transaksi kalau ternyata salah input dari awal

  // Koreksi harga/unit/NOMINAL dari modal Detail Transaksi — dipakai untuk MEMPERBAIKI transaksi
  // yang SUDAH punya data tapi salah ketik (beda dengan quick-fix di atas yang hanya muncul
  // saat transaksi belum ada data sama sekali).
  async function saveDetailAssetOverride(txId) {
    const priceVal = detailPriceValue.trim() ? parseFloat(detailPriceValue) : null;
    const unitsVal = detailUnitsValue.trim() ? parseFloat(detailUnitsValue) : null;
    const amountVal = detailAmountValue.trim() ? parseFloat(detailAmountValue) : null;
    const updates = {};
    if (unitsVal && unitsVal > 0) updates.asset_units_override = unitsVal;
    if (priceVal && priceVal > 0) updates.asset_price_at_tx = priceVal;
    if (amountVal && amountVal > 0) updates.amount = amountVal;
    if (Object.keys(updates).length === 0) return;

    const { error } = await supabase.from('transactions').update(updates).eq('id', txId);
    if (error) { setSaveError(true); return; }
    const patch = {};
    if (updates.asset_units_override !== undefined) patch.assetUnitsOverride = updates.asset_units_override;
    if (updates.asset_price_at_tx !== undefined) patch.assetPriceAtTx = updates.asset_price_at_tx;
    if (updates.amount !== undefined) patch.amount = updates.amount;
    setTransactions((prev) => prev.map((t) => (t.id === txId ? { ...t, ...patch } : t)));
    setSelectedTxDetail((prev) => (prev && prev.id === txId ? { ...prev, ...patch } : prev));
    setEditingDetailAsset(false);
    setDetailPriceValue('');
    setDetailUnitsValue('');
    setDetailAmountValue('');
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
      { id: data.id, type: data.type, amount: Number(data.amount), category: data.category_id, note: data.note || '', date: data.tx_date, createdAt: data.created_at, assetPriceAtTx: data.asset_price_at_tx ? Number(data.asset_price_at_tx) : null, assetAction: data.asset_action, assetUnitsOverride: data.asset_units_override ? Number(data.asset_units_override) : null },
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

  const ASSET_TYPE_COLOR = { gold: '#F5C95D', mutual_fund: '#7FE8A4', saving: '#6FB7E8', deposit: '#C99FE8' };
  const savingPieData = useMemo(() => {
    const byAccount = {};
    monthAssetTx.forEach((t) => {
      const net = t.amount * (isOutflowAction(t.action) ? -1 : 1);
      if (!byAccount[t.accountName]) byAccount[t.accountName] = { name: t.accountName, value: 0, color: ASSET_TYPE_COLOR[t.accountType] || '#8A8A8A' };
      byAccount[t.accountName].value += net;
    });
    return Object.values(byAccount).filter((a) => a.value > 0);
  }, [monthAssetTx]);

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

      // Saving: akumulatif dari SEMUA asset_transactions sampai akhir bulan ini
      // (jual/tarik = mengurangi, sama seperti totalSaving) -- ganti sumber dari
      // transactions lama ke asset_transactions, konsisten dengan kartu Saving di atas.
      const savCumulative = assetTransactions
        .filter((t) => t.date <= `${y}-${String(m).padStart(2, '0')}-31`)
        .reduce((s, t) => s + t.amount * (isOutflowAction(t.action) ? -1 : 1), 0);

      return {
        label: MONTHS_ID[m - 1] + ' ' + y,
        key,
        inc,
        exp,
        sav: savCumulative,
      };
    });
  }, [transactions, assetTransactions, activeMonth]);

  async function handleLogout() { await supabase.auth.signOut(); onLogout(); }

  function finishOnboarding() {
    localStorage.setItem(`onboarding_done_${user.id}`, '1');
    setShowOnboarding(false);
    setOnboardingStep(0);
    setObActionPhase(0);
    closeAllOnboardingModals();
  }

  // Bisa dibuka ulang kapan saja lewat tombol "?", baik oleh user baru maupun user lama —
  // tidak bergantung pada localStorage flag atau jumlah kategori.
  function openOnboardingTour() {
    setOnboardingStep(0);
    setObActionPhase(0);
    setShowOnboarding(true);
  }

  // Step yang punya "action" (buka modal) jalan 2 fase:
  // fase 0 = spotlight nyorot tombolnya dulu (modal masih tertutup, jelasin dulu fungsinya)
  // fase 1 = klik "Lanjut" sekali lagi baru modalnya kebuka, pop-up pindah ke samping modal
  // Step tanpa action (cuma spotlight biasa) tetap 1 fase seperti biasa.
  function nextStep() {
    const step = ONBOARDING_STEPS[onboardingStep];
    if (step.action && obActionPhase === 0) {
      setObActionPhase(1); // buka modalnya dulu, belum pindah step
      return;
    }
    if (onboardingStep < ONBOARDING_STEPS.length - 1) {
      setOnboardingStep((s) => s + 1);
      setObActionPhase(0);
    } else {
      finishOnboarding();
    }
  }

  function prevStep() {
    if (obActionPhase === 1) {
      setObActionPhase(0); // mundur ke fase spotlight dulu (tutup modal), bukan langsung pindah step
      return;
    }
    if (onboardingStep > 0) {
      setOnboardingStep((s) => s - 1);
      setObActionPhase(0);
    }
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

  // Sebagian step tour "mendemokan" tombolnya langsung dengan otomatis membuka modal terkait
  // begitu masuk fase 1 (setelah user klik "Lanjut" sekali di fase spotlight) — bukan cuma
  // nyorot doang, supaya user beneran lihat hasil klik tombolnya, bukan cuma dikasih tau.
  useEffect(() => {
    if (!showOnboarding) return;
    const step = ONBOARDING_STEPS[onboardingStep];
    closeAllOnboardingModals(); // tutup dulu sisa modal dari step/fase sebelumnya
    if (obActionPhase !== 1) return; // fase 0 = belum buka apa-apa, cuma spotlight tombolnya
    if (step.action === 'openCategoryModal') {
      setShowCategoryModal(true);
    } else if (step.action === 'openAddModal') {
      setShowAddModal(true);
    } else if (step.action === 'openBudgetModal') {
      setShowBudgetModal('expense');
    } else if (step.action === 'openRecurringModal') {
      setShowRecurringModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOnboarding, onboardingStep, obActionPhase]);

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

    // spotlightRect tetap diukur terus baik di fase 0 maupun fase 1 (dipakai buat posisi
    // pop-up "di samping" lokasi tombol aslinya) — ring & overlay gelapnya yang dikondisikan
    // belakangan di bagian render, bukan di sini.
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
  }, [showOnboarding, onboardingStep, tab, obActionPhase]);


  if (!loaded) {
    return (
      <div style={{ minHeight: '100vh', background: '#0F1410', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#7FE8A4', animation: 'pulse 1.2s ease-in-out infinite' }} />
        <p style={{ color: '#9CA89F', marginTop: 16, fontFamily: 'Inter, sans-serif' }}>Memuat data...</p>
        <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
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
        html { background: var(--bg-base); }
        body { font-family: 'Inter', sans-serif; background: var(--bg-base); margin: 0; color: var(--text-primary); }
        input, select { font-family: 'Inter', sans-serif; }
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }

        .dompet-page { min-height: 100vh; background: var(--bg-base); color: var(--text-primary); padding-bottom: 90px; max-width: 480px; margin: 0 auto; position: relative; }
        .dompet-sticky-top { position: sticky; top: 0; z-index: 40; background: var(--bg-base); }
        .dompet-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 20px 12px; background: var(--bg-base); }
        .dompet-tabbar { display: flex; align-items: center; gap: 4px; padding: 0 20px 16px; border-bottom: 1px solid var(--border); flex-wrap: wrap; row-gap: 8px; }
        @media (max-width: 400px) {
          .dompet-icon-group { gap: 5px !important; }
          .dompet-icon-group button { width: 28px !important; height: 28px !important; }
        }
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

      {/* Header + Tabs — dibungkus sticky biar freeze di atas saat scroll, gampang ganti bulan tanpa scroll ulang */}
      <div className="dompet-sticky-top">
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
          <button
            ref={null}
            onClick={() => setTab('overview')}
            style={{ ...styles.tabBtn, ...(tab === 'overview' ? styles.tabBtnActive : {}) }}
          >
            Dashboard
          </button>
          {/* "Aset" beda dari tab lain: bukan ganti state internal (tab),
              tapi pindah HALAMAN (route) ke /aset. Makanya onClick-nya
              navigate(), bukan setTab(), dan tidak pernah kelihatan
              "aktif" karena begitu diklik langsung keluar dari Dashboard. */}
          <button ref={asetTabRef} onClick={() => navigate('/aset')} style={styles.tabBtn}>Aset</button>
          {[
            { id: 'transactions', label: 'Transaksi' },
            { id: 'reports', label: 'Laporan' },
          ].map((t) => (
            <button key={t.id} ref={t.id === 'reports' ? reportsTabRef : null} onClick={() => setTab(t.id)} style={{ ...styles.tabBtn, ...(tab === t.id ? styles.tabBtnActive : {}) }}>{t.label}</button>
          ))}
          <div className="dompet-icon-group" style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={openOnboardingTour} style={{ ...styles.settingsBtn, marginLeft: 0 }} aria-label="Panduan fitur" title="Buka panduan fitur">
              <HelpCircle size={16} color="#9CA89F" />
            </button>
            <button onClick={cycleTheme} style={{ ...styles.settingsBtn, marginLeft: 0 }} aria-label="Ganti tema" title={themeMode === 'system' ? 'Tema: Ikuti sistem' : themeMode === 'dark' ? 'Tema: Gelap' : 'Tema: Terang'}>
              {themeMode === 'system' ? <Monitor size={16} color="#9CA89F" /> : themeMode === 'dark' ? <Moon size={16} color="#9CA89F" /> : <Sun size={16} color="#9CA89F" />}
            </button>
            <button onClick={togglePushNotifications} disabled={pushLoading} style={{ ...styles.settingsBtn, marginLeft: 0, opacity: pushLoading ? 0.6 : 1 }} aria-label="Pengingat notifikasi" title={pushEnabled ? 'Pengingat notifikasi aktif — klik untuk matikan' : 'Aktifkan pengingat notifikasi'}>
              {pushEnabled ? <Bell size={16} color="#7FE8A4" /> : <BellOff size={16} color="#9CA89F" />}
            </button>
            <button onClick={() => setShowFeedbackModal(true)} style={{ ...styles.settingsBtn, marginLeft: 0 }} aria-label="Kasih masukan" title="Kasih masukan buat Dompet App"><MessageSquare size={16} color="#9CA89F" /></button>
            <button ref={settingsBtnRef} onClick={() => setShowCategoryModal(true)} style={{ ...styles.settingsBtn, marginLeft: 0 }} aria-label="Kelola kategori"><Settings size={16} color="#9CA89F" /></button>
          </div>
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
                            {(expandedCatIds.has(c.id) ? subTx : subTx.slice(0, 3)).map((t) => (
                              <div key={t.id} onClick={() => openTxDetail(t)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, cursor: 'pointer' }}>
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {t.note || c.label}
                                </span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                                  {new Date(t.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </span>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#FF9466', flexShrink: 0 }}>-{formatRupiah(t.amount)}</span>
                                <button onClick={(e) => { e.stopPropagation(); deleteTransaction(t.id); }} style={styles.deleteBtn}><Trash2 size={12} color="#6B7568" /></button>
                              </div>
                            ))}
                            {subTx.length > 3 && (
                              <button onClick={() => toggleCatExpanded(c.id)} style={{ ...styles.linkBtn, alignSelf: 'flex-start', marginTop: 2, fontSize: 11.5 }}>
                                {expandedCatIds.has(c.id) ? (<><ChevronUp size={12} style={{ display: 'inline', verticalAlign: -2 }} /> Sembunyikan</>) : (<><ChevronDown size={12} style={{ display: 'inline', verticalAlign: -2 }} /> Tampilkan semua ({subTx.length})</>)}
                              </button>
                            )}
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

            {/* Kolom kanan: Assets Summary (Task 3.4) -- breakdown per
                jenis aset + total, narik data asli dari get_portfolio_summary().
                Kartu "Target saving & investasi" yang lama sudah DIPINDAH
                ke halaman /aset/* (Emas, Reksa Dana, Tabungan), supaya
                tidak ada data ganda antara Dashboard lama & halaman Aset
                baru. Sub-transaksi tanpa kategori (kalau masih ada sisa
                data lama) tetap ditampilkan di bawah kartu ini. */}
            <div className="dompet-col-right">
              <div style={{ ...styles.sectionHeader, marginTop: 24 }}>
                <span style={styles.sectionTitle}>Aset</span>
              </div>
              <AssetsSummaryCard />

              {/* Card khusus transaksi saving tanpa kategori (sisa data lama, kalau ada) */}
              {(() => {
                const uncatTx = monthTx.filter((t) => t.type === 'saving' && !t.category).sort((a, b) => new Date(b.date) - new Date(a.date));
                if (uncatTx.length === 0) return null;
                const uncatTotal = uncatTx.reduce((s, t) => s + t.amount, 0);
                return (
                  <div style={{ ...styles.budgetCard, marginTop: 12 }}>
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
              <button onClick={() => setShowExportChoice(true)} style={styles.csvBtn}>
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
                  <button onClick={() => setImportSummary(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}><X size={14} /></button>
                </div>
                {importSummary.errors.length > 0 && (
                  <div style={{ fontSize: 11, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {importSummary.errors.map((e, idx) => <span key={idx}>• {e}</span>)}
                  </div>
                )}
              </div>
            )}

            {/* Pencarian + Filter Tipe Transaksi */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              <div ref={txSearchRef} style={{ position: 'relative' }}>
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Cari transaksi (catatan, kategori)..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  style={{ ...styles.input, paddingLeft: 34, fontSize: 12 }}
                />
                {txSearch && (
                  <button onClick={() => setTxSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <X size={14} color="var(--text-muted)" />
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
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
                      padding: '5px 12px', borderRadius: 8, border: '1px solid', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
                      background: txTypeFilter === f.id ? 'var(--text-primary)' : 'transparent',
                      color: txTypeFilter === f.id ? 'var(--bg-base)' : 'var(--text-secondary)',
                      borderColor: txTypeFilter === f.id ? 'var(--text-primary)' : 'var(--border)',
                      fontWeight: txTypeFilter === f.id ? 600 : 400,
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Daftar Transaksi (sudah terfilter) */}
            {filteredMonthTx.length === 0 ? (
              <div style={styles.emptyCard}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {txSearch || txTypeFilter !== 'all' ? 'Tidak ada transaksi yang cocok dengan filter.' : 'Belum ada transaksi di bulan ini.'}
                </span>
              </div>
            ) : (
              filteredMonthTx.map((t) => {
                const cat = catLookup(t.category);
                const CatIcon = cat ? getIconComponent(cat.icon) : (t.type === 'income' ? TrendingUp : HelpCircle);
                const isIncome = t.type === 'income';
                const isExpense = t.type === 'expense';
                const isSell = t.type === 'saving' && t.assetAction === 'sell';
                const color = isIncome ? '#7FE8A4' : isExpense ? '#FF9466' : isSell ? '#FF9466' : '#6FB7E8';
                return (
                  <div key={t.id} onClick={() => openTxDetail(t)} style={styles.txRow}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: (cat?.color || (isIncome ? '#7FE8A4' : '#8A8A8A')) + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CatIcon size={16} color={cat?.color || (isIncome ? '#7FE8A4' : '#8A8A8A')} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.note || cat?.label || (isIncome ? 'Income' : 'Tanpa kategori')}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {new Date(t.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        {cat && ` · ${cat.label}`}
                        {isSell && ' (Jual)'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color }}>
                        {isIncome ? '+' : '-'}{formatRupiah(t.amount)}
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteTransaction(t.id); }} style={styles.deleteBtn} aria-label="Hapus transaksi">
                      <Trash2 size={14} color="#6B7568" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ====== TAB LAPORAN ====== */}
        {tab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Pie Chart Expense */}
            <div style={styles.card}>
              <span style={{ ...styles.sectionTitle, marginBottom: 12, display: 'block' }}>Pengeluaran per Kategori</span>
              {pieData.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Belum ada pengeluaran di bulan ini.</div>
              ) : (
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                        {pieData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatRupiah(value)} contentStyle={{ background: 'var(--chart-tooltip)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--chart-text)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Pie Chart Saving */}
            <div style={styles.card}>
              <span style={{ ...styles.sectionTitle, marginBottom: 12, display: 'block' }}>Alokasi Tabungan & Investasi</span>
              {savingPieData.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Belum ada alokasi tabungan di bulan ini.</div>
              ) : (
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={savingPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                        {savingPieData.map((entry, idx) => (
                          <Cell key={`cell-sav-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatRupiah(value)} contentStyle={{ background: 'var(--chart-tooltip)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--chart-text)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Bar Chart Tren 6 Bulan */}
            <div style={styles.card}>
              <span style={{ ...styles.sectionTitle, marginBottom: 12, display: 'block' }}>Tren 6 Bulan Terakhir</span>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                    <XAxis dataKey="label" stroke="var(--chart-subtext)" fontSize={11} />
                    <YAxis stroke="var(--chart-subtext)" fontSize={11} tickFormatter={(v) => (v >= 1000000 ? (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)} />
                    <Tooltip formatter={(value) => formatRupiah(value)} contentStyle={{ background: 'var(--chart-tooltip)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--chart-text)' }} />
                    <Bar dataKey="inc" name="Income" fill="#7FE8A4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="exp" name="Expense" fill="#FF9466" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="sav" name="Saving (Aset)" fill="#6FB7E8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Floating Action Button (+) */}
      <button ref={fabRef} onClick={() => setShowAddModal(true)} className="dompet-fab" aria-label="Tambah Transaksi">
        <Plus size={24} color="#0F1410" />
      </button>

      {/* Snackbar Undo Hapus */}
      {pendingDelete && (
        <div style={styles.undoSnackbar}>
          <span style={{ fontSize: 13, color: '#E8EDF8' }}>Transaksi dihapus</span>
          <button onClick={undoDeleteTransaction} style={styles.undoBtn}>Batal (Undo)</button>
        </div>
      )}

      {/* Modal Tambah Transaksi */}
      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Tambah Transaksi</span>
              <button onClick={() => setShowAddModal(false)} style={styles.iconBtn}><X size={18} color="var(--text-muted)" /></button>
            </div>

            {/* Switch Tipe: Income / Expense / Saving */}
            <div style={styles.typeSwitcher}>
              <button onClick={() => switchType('expense')} style={{ ...styles.typeBtn, ...(form.type === 'expense' ? styles.typeBtnActiveExpense : {}) }}>Expense</button>
              <button onClick={() => switchType('income')} style={{ ...styles.typeBtn, ...(form.type === 'income' ? styles.typeBtnActiveIncome : {}) }}>Income</button>
              <button onClick={() => switchType('saving')} style={{ ...styles.typeBtn, ...(form.type === 'saving' ? styles.typeBtnActiveSaving : {}) }}>Saving</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              <div>
                <label style={styles.label}>Nominal (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  style={styles.input}
                  autoFocus
                />
              </div>

              {form.type !== 'income' && (
                <div>
                  <label style={styles.label}>Kategori</label>
                  <select
                    value={form.categoryId || ''}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value || null })}
                    style={styles.select}
                  >
                    <option value="">(Tanpa kategori)</option>
                    {activeCatList.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={styles.label}>Tanggal</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Catatan (Opsional)</label>
                <input
                  type="text"
                  placeholder="misal: Beli pulsa, Kopi, dsb"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  style={styles.input}
                />
              </div>

              <button onClick={addTransaction} style={styles.primaryBtn}>Simpan Transaksi</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kelola Kategori */}
      {showCategoryModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCategoryModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Kelola Kategori</span>
              <button onClick={() => setShowCategoryModal(false)} style={styles.iconBtn}><X size={18} color="var(--text-muted)" /></button>
            </div>

            <div style={styles.typeSwitcher}>
              <button onClick={() => setCatEditType('expense')} style={{ ...styles.typeBtn, ...(catEditType === 'expense' ? styles.typeBtnActiveExpense : {}) }}>Expense</button>
              <button onClick={() => setCatEditType('saving')} style={{ ...styles.typeBtn, ...(catEditType === 'saving' ? styles.typeBtnActiveSaving : {}) }}>Saving</button>
            </div>

            {/* Form Tambah Kategori Baru */}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Nama kategori baru..."
                  value={newCatLabel}
                  onChange={(e) => setNewCatLabel(e.target.value)}
                  style={{ ...styles.input, flex: 1 }}
                />
                <button onClick={addCategory} style={styles.primaryBtnSquare}><Plus size={18} /></button>
              </div>
            </div>

            {/* List Kategori Eksisting */}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
              {activeCatList.map((c) => {
                const CatIcon = getIconComponent(c.icon);
                const isEditing = editingCatId === c.id;
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-card2)', borderRadius: 8, gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: c.color + '25', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CatIcon size={14} color={c.color} />
                      </div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingCatLabel}
                          onChange={(e) => setEditingCatLabel(e.target.value)}
                          style={{ ...styles.input, padding: '4px 8px', fontSize: 12 }}
                        />
                      ) : (
                        <span style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {isEditing ? (
                        <button onClick={saveEditCategory} style={styles.iconBtn}><Check size={16} color="#7FE8A4" /></button>
                      ) : (
                        <button onClick={() => startEditCategory(c)} style={styles.iconBtn}><Pencil size={14} color="var(--text-muted)" /></button>
                      )}
                      <button onClick={() => deleteCategory(c.id)} style={styles.iconBtn}><Trash2 size={14} color="#FF9466" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Atur Budget Expense / Saving */}
      {showBudgetModal && (
        <div style={styles.modalOverlay} onClick={() => setShowBudgetModal(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Atur Budget Expense</span>
              <button onClick={() => setShowBudgetModal(null)} style={styles.iconBtn}><X size={18} color="var(--text-muted)" /></button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, marginBottom: 16 }}>
              Tentukan batas maksimal pengeluaran bulanan per kategori.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 350, overflowY: 'auto' }}>
              {expenseCategories.map((c) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>{c.label}</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={getExpenseBudget(c.id) || ''}
                    onChange={(e) => setExpenseBudget(c.id, e.target.value)}
                    style={{ ...styles.input, width: 140, textAlign: 'right' }}
                  />
                </div>
              ))}
            </div>
            <button onClick={() => setShowBudgetModal(null)} style={{ ...styles.primaryBtn, marginTop: 16 }}>Selesai</button>
          </div>
        </div>
      )}

      {/* Modal Kelola Transaksi Berulang */}
      {showRecurringModal && (
        <div style={styles.modalOverlay} onClick={() => setShowRecurringModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Transaksi Berulang</span>
              <button onClick={() => setShowRecurringModal(false)} style={styles.iconBtn}><X size={18} color="var(--text-muted)" /></button>
            </div>

            {/* Form Tambah Baru */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, background: 'var(--bg-card2)', padding: 12, borderRadius: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>+ Tambah Jadwal Rutin</span>
              <div style={styles.typeSwitcher}>
                <button onClick={() => setRecurringForm({ ...recurringForm, type: 'expense' })} style={{ ...styles.typeBtn, ...(recurringForm.type === 'expense' ? styles.typeBtnActiveExpense : {}) }}>Expense</button>
                <button onClick={() => setRecurringForm({ ...recurringForm, type: 'income' })} style={{ ...styles.typeBtn, ...(recurringForm.type === 'income' ? styles.typeBtnActiveIncome : {}) }}>Income</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input
                  type="number"
                  placeholder="Nominal (Rp)"
                  value={recurringForm.amount}
                  onChange={(e) => setRecurringForm({ ...recurringForm, amount: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Tgl (1-31)"
                  value={recurringForm.dayOfMonth}
                  onChange={(e) => setRecurringForm({ ...recurringForm, dayOfMonth: e.target.value })}
                  style={styles.input}
                />
              </div>
              {recurringForm.type !== 'income' && (
                <select
                  value={recurringForm.categoryId || ''}
                  onChange={(e) => setRecurringForm({ ...recurringForm, categoryId: e.target.value || null })}
                  style={styles.select}
                >
                  <option value="">-- Pilih Kategori --</option>
                  {expenseCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              )}
              <input
                type="text"
                placeholder="Catatan (misal: Wifi, Gaji, Cicilan)"
                value={recurringForm.note}
                onChange={(e) => setRecurringForm({ ...recurringForm, note: e.target.value })}
                style={styles.input}
              />
              <button onClick={addRecurring} disabled={savingRecurring} style={styles.primaryBtn}>
                {savingRecurring ? 'Menyimpan...' : 'Simpan Jadwal'}
              </button>
            </div>

            {/* List Transaksi Berulang */}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 250, overflowY: 'auto' }}>
              {recurringList.map((r) => {
                const cat = r.category_id ? catLookup(r.category_id) : null;
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-card2)', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.note || cat?.label || 'Rutin'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Tiap tgl {r.day_of_month} · {formatRupiah(r.amount)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => toggleRecurringActive(r.id, r.is_active)} style={{ ...styles.linkBtn, fontSize: 11, color: r.is_active ? '#7FE8A4' : 'var(--text-muted)' }}>
                        {r.is_active ? 'Aktif' : 'Mati'}
                      </button>
                      <button onClick={() => deleteRecurring(r.id)} style={styles.iconBtn}><Trash2 size={14} color="#FF9466" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Transaksi */}
      {selectedTxDetail && (
        <div style={styles.modalOverlay} onClick={() => setSelectedTxDetail(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Detail Transaksi</span>
              <button onClick={() => setSelectedTxDetail(null)} style={styles.iconBtn}><X size={18} color="var(--text-muted)" /></button>
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div><b>Nominal:</b> {formatRupiah(selectedTxDetail.amount)}</div>
              <div><b>Tipe:</b> {selectedTxDetail.type}</div>
              <div><b>Tanggal:</b> {selectedTxDetail.date}</div>
              <div><b>Catatan:</b> {selectedTxDetail.note || '-'}</div>
            </div>
            <button onClick={() => setSelectedTxDetail(null)} style={{ ...styles.primaryBtn, marginTop: 16 }}>Tutup</button>
          </div>
        </div>
      )}

      {/* Modal Feedback */}
      {showFeedbackModal && (
        <div style={styles.modalOverlay} onClick={() => setShowFeedbackModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Kirim Masukan</span>
              <button onClick={() => setShowFeedbackModal(false)} style={styles.iconBtn}><X size={18} color="var(--text-muted)" /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <select
                value={feedbackForm.category}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value })}
                style={styles.select}
              >
                <option value="saran">Saran Fitur Baru</option>
                <option value="bug">Lapor Bug/Eror</option>
                <option value="lainnya">Lainnya</option>
              </select>
              <textarea
                placeholder="Tuliskan masukan kamu di sini..."
                value={feedbackForm.message}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                style={{ ...styles.input, height: 100, resize: 'none' }}
              />
              <button onClick={sendFeedback} disabled={savingFeedback} style={styles.primaryBtn}>
                {savingFeedback ? 'Mengirim...' : 'Kirim Masukan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pilihan Scope Export Excel */}
      {showExportChoice && (
        <div style={styles.modalOverlay} onClick={() => setShowExportChoice(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Export Transaksi Excel</span>
              <button onClick={() => setShowExportChoice(false)} style={styles.iconBtn}><X size={18} color="var(--text-muted)" /></button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, marginBottom: 16 }}>
              Pilih porsi data yang ingin diunduh ke file Excel.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => exportTransactionsExcel('filtered')} style={styles.primaryBtn}>
                Cuma yang Tampil di Layar ({filteredMonthTx.length} transaksi)
              </button>
              <button onClick={() => exportTransactionsExcel('all')} style={{ ...styles.primaryBtn, background: 'var(--bg-card2)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                Semua Transaksi dari Awal ({transactions.length} transaksi)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop-up Onboarding / Panduan */}
      {showOnboarding && (
        <>
          {spotlightRect && (
            <div
              style={{
                position: 'fixed',
                top: spotlightRect.top - 4,
                left: spotlightRect.left - 4,
                width: spotlightRect.width + 8,
                height: spotlightRect.height + 8,
                borderRadius: 12,
                border: '2px solid #7FE8A4',
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
                pointerEvents: 'none',
                zIndex: 99,
              }}
            />
          )}
          <div style={styles.onboardingCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              {React.createElement(ONBOARDING_STEPS[onboardingStep].icon, { size: 20, color: ONBOARDING_STEPS[onboardingStep].color })}
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{ONBOARDING_STEPS[onboardingStep].title}</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
              {ONBOARDING_STEPS[onboardingStep].desc}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={finishOnboarding} style={styles.linkBtn}>Lewati Tour</button>
              <div style={{ display: 'flex', gap: 6 }}>
                {onboardingStep > 0 && <button onClick={prevStep} style={{ ...styles.primaryBtn, padding: '6px 12px', fontSize: 12 }}>Kembali</button>}
                <button onClick={nextStep} style={{ ...styles.primaryBtn, padding: '6px 12px', fontSize: 12 }}>
                  {onboardingStep === ONBOARDING_STEPS.length - 1 ? 'Selesai' : 'Lanjut'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

const styles = {
  logoMark: { width: 32, height: 32, borderRadius: 10, background: '#7FE8A4', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' },
  monthBtn: { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', width: 28, height: 28, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 },
  monthSelect: { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: 8, fontSize: 12, outline: 'none', cursor: 'pointer' },
  tabBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' },
  tabBtnActive: { background: 'var(--bg-card2)', color: 'var(--text-primary)', fontWeight: 600 },
  settingsBtn: { background: 'var(--bg-card)', border: '1px solid var(--border)', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  summaryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  summaryCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 12, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 4 },
  summaryLabel: { fontSize: 11, color: 'var(--text-muted)' },
  summaryIconRow: { display: 'flex', alignItems: 'center', gap: 4 },
  balanceNumber: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22 },
  summaryNumber: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15 },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' },
  linkBtn: { background: 'none', border: 'none', color: '#7FE8A4', fontSize: 12, cursor: 'pointer', padding: 0 },
  emptyCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 16, borderRadius: 12, textAlign: 'center' },
  budgetCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 12, borderRadius: 12 },
  barTrack: { height: 6, background: 'var(--bg-input)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  txList: { display: 'flex', flexDirection: 'column', gap: 8 },
  txRow: { background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 10, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' },
  deleteBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4 },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 16, borderRadius: 12 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modalContent: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, width: '100%', maxWidth: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4 },
  typeSwitcher: { display: 'flex', gap: 6, background: 'var(--bg-input)', padding: 4, borderRadius: 10, marginTop: 12 },
  typeBtn: { flex: 1, padding: '6px 0', border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: 12, fontWeight: 500, borderRadius: 8, cursor: 'pointer' },
  typeBtnActiveExpense: { background: '#FF9466', color: '#0F1410', fontWeight: 600 },
  typeBtnActiveIncome: { background: '#7FE8A4', color: '#0F1410', fontWeight: 600 },
  typeBtnActiveSaving: { background: '#6FB7E8', color: '#0F1410', fontWeight: 600 },
  label: { fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 },
  input: { width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' },
  select: { width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' },
  primaryBtn: { width: '100%', background: 'var(--accent)', border: 'none', color: 'var(--accent-text)', padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  primaryBtnSquare: { background: 'var(--accent)', border: 'none', color: 'var(--accent-text)', width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  errorBanner: { background: '#3A1818', color: '#FF9466', padding: '8px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 },
  errorBox: { background: '#3A2418', color: '#FF9466', padding: 12, borderRadius: 8, display: 'flex', fontSize: 12 },
  undoSnackbar: { position: 'fixed', bottom: 84, left: '50%', transform: 'translateX(-50%)', background: '#1A2238', border: '1px solid #2A3B5C', padding: '10px 16px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12, zIndex: 90, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' },
  undoBtn: { background: 'none', border: 'none', color: '#7FE8A4', fontWeight: 600, fontSize: 12, cursor: 'pointer' },
  csvBtn: { background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 },
  onboardingCard: { position: 'fixed', bottom: 24, left: 24, right: 24, maxWidth: 360, margin: '0 auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' },
};
