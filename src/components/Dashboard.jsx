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
        ...data.map((t) => ({ id: t.id, type: t.type, amount: Number(t.amount), category: t.category_id, no