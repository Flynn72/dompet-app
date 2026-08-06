import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { 
  Home, 
  PieChart, 
  TrendingUp, 
  Settings, 
  Bell, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  PiggyBank, 
  Utensils,
  Car,
  Briefcase,
  ShoppingBag,
  Plus,
  Sun,
  X,
  Repeat,
  Trash2,
  RefreshCw
} from 'lucide-react';

export default function Dashboard({ session, user, onLogout }) {
  const [activeTab, setActiveTab] = useState('home');

  // ================= STATE GLOBAL APLIKASI =================
  // 1. Kategori & Budget Pengeluaran
  const [categories, setCategories] = useState([
    { id: 'cat-1', name: 'Makanan & Minuman', budget: 1500000, used: 1250000 },
    { id: 'cat-2', name: 'Transportasi', budget: 800000, used: 450000 },
    { id: 'cat-3', name: 'Belanja', budget: 1000000, used: 850000 }
  ]);

  // 2. Kategori & Target Investasi
  const [investCategories, setInvestCategories] = useState([
    { id: 'inv-1', name: 'Emas Antam', assetKey: 'gold_antam', type: 'emas', unitAmount: 2.5, currentUnitPrice: 1300000, target: 50000000 },
    { id: 'inv-2', name: 'Reksadana Insight Money Syariah', assetKey: 'reksadana_insight_money_syariah', type: 'reksadana', unitAmount: 10000, currentUnitPrice: 1500, target: 30000000 }
  ]);

  // 3. Transaksi Berulang (Recurring Transactions)
  const [recurringTransactions, setRecurringTransactions] = useState([
    { id: 'rec-1', name: 'Tagihan WiFi Indihome', categoryId: 'cat-2', amount: 350000, dueDate: '2026-08-10', frequency: 'Bulanan' },
    { id: 'rec-2', name: 'Autodebit Reksadana Rutin', categoryId: 'inv-2', amount: 1000000, dueDate: '2026-08-15', frequency: 'Bulanan' }
  ]);

  // 4. State Push Notification Toggle & Syncing Status
  const [pushEnabled, setPushEnabled] = useState(true);
  const [isSyncingPrices, setIsSyncingPrices] = useState(false);

  // ================= 1. INTEGRASI FETCH HARGA DARI SUPABASE RPC =================
  const fetchLatestPricesFromSupabase = async () => {
    try {
      setIsSyncingPrices(true);
      // Panggil RPC get_latest_prices dari Supabase
      const { data, error } = await supabase.rpc('get_latest_prices');

      if (error) {
        console.error('[Supabase RPC Error]', error.message);
        return;
      }

      if (data && data.length > 0) {
        // Update harga unit di state investCategories berdasarkan asset_name
        setInvestCategories((prevInvest) => 
          prevInvest.map((item) => {
            const priceInfo = data.find((d) => d.asset_name === item.assetKey);
            if (priceInfo) {
              return {
                ...item,
                currentUnitPrice: Number(priceInfo.price)
              };
            }
            return item;
          })
        );
      }
    } catch (err) {
      console.error('[Fetch Latest Prices Error]', err);
    } finally {
      setIsSyncingPrices(false);
    }
  };

  // Trigger sync cron API jika ingin memicu pembaharuan data harga
  const triggerCronSyncAPI = async () => {
    try {
      setIsSyncingPrices(true);
      await fetch('https://dompet-app-two.vercel.app/api/cron-sync-prices');
      await fetchLatestPricesFromSupabase();
    } catch (err) {
      console.error('[Cron Sync Error]', err);
    } finally {
      setIsSyncingPrices(false);
    }
  };

  useEffect(() => {
    fetchLatestPricesFromSupabase();
    // Auto-refresh harga setiap 5 menit
    const interval = setInterval(fetchLatestPricesFromSupabase, 300000);
    return () => clearInterval(interval);
  }, []);

  // ================= 2. INTEGRASI API NOTIFIKASI REMINDER =================
  const sendPushNotificationAPI = async (payload) => {
    if (!pushEnabled) return;
    try {
      const response = await fetch('https://dompet-app-two.vercel.app/api/send-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || session?.user?.id,
          title: payload.title,
          message: payload.message,
          data: payload.data || {}
        })
      });
      const resData = await response.json();
      console.log('[Push Notification Response]', resData);
    } catch (err) {
      console.error('[Push Notification Error]', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1216] text-white pb-24 md:pb-12 font-sans antialiased">
      {/* Top Bar / Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-gray-800/60 bg-[#0F1216]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl w-full mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight text-white">Dompet</h1>
          <div className="flex items-center space-x-3">
            {activeTab === 'home' && (
              <>
                <button className="text-xs px-2 py-1 rounded bg-gray-800 text-gray-300 font-mono">ID</button>
                <button className="p-2 text-gray-400 hover:text-white rounded-full"><Sun size={18} /></button>
              </>
            )}
            <button 
              onClick={() => sendPushNotificationAPI({ title: 'Test Reminder', message: 'Ini uji coba notifikasi reminder' })}
              className="p-2 text-gray-400 hover:text-white rounded-full relative"
              title="Kirim Notifikasi Penguji"
            >
              <Bell size={20} />
              {pushEnabled && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full"></span>}
            </button>
          </div>
        </div>
      </header>

      {/* Dynamic Content */}
      <main className="px-4 pt-4 max-w-4xl mx-auto space-y-4">
        {activeTab === 'home' && (
          <HomeTab 
            categories={categories} 
            recurringTransactions={recurringTransactions} 
          />
        )}
        {activeTab === 'budget' && (
          <BudgetTab categories={categories} />
        )}
        {activeTab === 'invest' && (
          <InvestTab 
            investCategories={investCategories} 
            onRefreshPrices={triggerCronSyncAPI}
            isSyncing={isSyncingPrices}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsTab 
            onLogout={onLogout}
            categories={categories}
            setCategories={setCategories}
            investCategories={investCategories}
            setInvestCategories={setInvestCategories}
            recurringTransactions={recurringTransactions}
            setRecurringTransactions={setRecurringTransactions}
            pushEnabled={pushEnabled}
            setPushEnabled={setPushEnabled}
            sendPushNotificationAPI={sendPushNotificationAPI}
          />
        )}
      </main>

      {/* Floating Action Button (FAB) - Home Only */}
      {activeTab === 'home' && (
        <button className="fixed bottom-20 right-5 md:bottom-8 md:right-8 w-12 h-12 bg-blue-300 text-slate-900 rounded-2xl flex items-center justify-center shadow-lg hover:bg-blue-200 transition-all z-40">
          <Plus size={24} />
        </button>
      )}

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#161B22] border-t border-gray-800 px-6 py-2 flex justify-around md:justify-center md:gap-12 items-center z-50 max-w-4xl mx-auto md:rounded-t-2xl">
        <NavItem icon={<Home size={20} />} label="Beranda" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        <NavItem icon={<PieChart size={20} />} label="Budget" active={activeTab === 'budget'} onClick={() => setActiveTab('budget')} />
        <NavItem icon={<TrendingUp size={20} />} label="Investasi" active={activeTab === 'invest'} onClick={() => setActiveTab('invest')} />
        <NavItem icon={<Settings size={20} />} label="Pengaturan" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </nav>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
        active ? 'bg-blue-500/20 text-blue-300' : 'text-gray-400 hover:text-gray-200'
      }`}
    >
      {icon}
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
  );
}

/* ==================== TAB 1: BERANDA ==================== */
function HomeTab({ categories, recurringTransactions }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1C2331] to-[#121721] border border-gray-800 md:col-span-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-gray-400">Total Saldo</span>
            <Wallet size={18} className="text-blue-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mt-2">Rp 45.230.000</h2>
          <p className="text-xs text-emerald-400 font-mono mt-1">📈 +2.4% dari bulan lalu</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#161B22] border border-gray-800 flex justify-between items-center">
          <div>
            <span className="text-xs font-mono text-gray-400">Pemasukan Bulanan</span>
            <p className="text-lg font-bold text-white mt-1">Rp 12.500.000</p>
          </div>
          <div className="p-2.5 rounded-xl bg-gray-800/80 text-gray-300"><ArrowDownLeft size={18} /></div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161B22] border border-gray-800 flex justify-between items-center">
          <div>
            <span className="text-xs font-mono text-gray-400">Pengeluaran Bulanan</span>
            <p className="text-lg font-bold text-white mt-1">Rp 4.120.000</p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-950/40 text-rose-300"><ArrowUpRight size={18} /></div>
        </div>

        <div className="p-4 rounded-2xl bg-[#161B22] border border-gray-800">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-mono text-gray-400">Tabungan Bersih</span>
              <p className="text-lg font-bold text-white mt-1">Rp 8.380.000</p>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-800/80 text-gray-300"><PiggyBank size={18} /></div>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-300 h-full w-[65%]"></div>
          </div>
        </div>
      </div>

      {/* Info Transaksi Berulang */}
      <div className="p-4 rounded-2xl bg-[#161B22] border border-blue-900/40 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Repeat size={16} className="text-blue-400" />
            <h3 className="font-bold text-sm text-white">Transaksi Berulang Mendatang</h3>
          </div>
          <span className="text-[10px] font-mono bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded">Reminder Active</span>
        </div>
        <div className="space-y-2">
          {recurringTransactions.length === 0 ? (
            <p className="text-xs text-gray-500 italic">Belum ada transaksi berulang diset.</p>
          ) : (
            recurringTransactions.map((item) => (
              <div key={item.id} className="p-3 rounded-xl bg-gray-900/70 border border-gray-800 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-semibold text-white">{item.name}</h4>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">Jatuh Tempo: {item.dueDate} ({item.frequency})</p>
                </div>
                <span className="text-xs font-bold text-rose-300 font-mono">-Rp {Number(item.amount).toLocaleString('id-ID')}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Transaksi Terbaru */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm">Transaksi Terbaru</h3>
        <div className="space-y-2">
          <TransactionItem icon={<Utensils size={16} />} title="Starbucks" category="Makanan" date="Hari ini, 09:41" amount="-Rp 55.000" negative />
          <TransactionItem icon={<Car size={16} />} title="Grab Ride" category="Transport" date="Kemarin, 18:20" amount="-Rp 32.500" negative />
          <TransactionItem icon={<Briefcase size={16} />} title="Gaji" category="Pendapatan" date="25 Mei 2024" amount="+Rp 12.500.000" />
        </div>
      </div>
    </div>
  );
}

function TransactionItem({ icon, title, category, date, amount, negative }) {
  return (
    <div className="p-3 rounded-xl bg-[#161B22] border border-gray-800/80 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-gray-800/80 text-gray-300">{icon}</div>
        <div>
          <h4 className="font-semibold text-xs text-white">{title}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded font-mono">{category}</span>
            <span className="text-[10px] text-gray-500">{date}</span>
          </div>
        </div>
      </div>
      <span className={`text-xs font-bold font-mono ${negative ? 'text-gray-200' : 'text-blue-300'}`}>{amount}</span>
    </div>
  );
}

/* ==================== TAB 2: BUDGET ==================== */
function BudgetTab({ categories }) {
  const totalBudget = categories.reduce((sum, c) => sum + Number(c.budget), 0);
  const totalUsed = categories.reduce((sum, c) => sum + Number(c.used), 0);
  const overallPercentage = totalBudget > 0 ? Math.min(Math.round((totalUsed / totalBudget) * 100), 100) : 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">Anggaran Bulanan</h2>
        <p className="text-xs text-gray-400">Pantau pemakaian budget untuk setiap kategori. Pengaturan budget dapat dilakukan di menu Pengaturan.</p>
      </div>

      <div className="p-4 rounded-2xl bg-[#161B22] border border-gray-800 space-y-2">
        <span className="text-xs font-mono text-gray-400">Total Pengeluaran Kategori</span>
        <h3 className="text-2xl font-bold">
          Rp {totalUsed.toLocaleString('id-ID')} <span className="text-xs text-gray-500 font-normal">/ batas Rp {totalBudget.toLocaleString('id-ID')}</span>
        </h3>
        <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden mt-2">
          <div 
            className={`h-full transition-all duration-500 ${overallPercentage >= 80 ? 'bg-rose-400' : 'bg-blue-400'}`} 
            style={{ width: `${overallPercentage}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {categories.map((cat) => {
          const pct = cat.budget > 0 ? Math.min(Math.round((cat.used / cat.budget) * 100), 100) : 0;
          return (
            <div key={cat.id} className="p-4 rounded-2xl bg-[#161B22] border border-gray-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold">{cat.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${pct >= 80 ? 'bg-rose-950/60 text-rose-300' : 'bg-blue-950/60 text-blue-300'}`}>
                  {pct >= 80 ? 'Mendekati Batas' : 'Aman'}
                </span>
              </div>
              <p className="text-sm font-bold">
                Rp {cat.used.toLocaleString('id-ID')} <span className="text-xs text-gray-500 font-normal">/ Rp {cat.budget.toLocaleString('id-ID')}</span>
              </p>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div className={`h-full ${pct >= 80 ? 'bg-rose-400' : 'bg-blue-400'}`} style={{ width: `${pct}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ==================== TAB 3: INVESTASI ==================== */
function InvestTab({ investCategories, onRefreshPrices, isSyncing }) {
  const calculateTotalValue = (item) => Number(item.unitAmount) * Number(item.currentUnitPrice);

  const totalValue = investCategories.reduce((sum, item) => sum + calculateTotalValue(item), 0);
  const totalTarget = investCategories.reduce((sum, item) => sum + Number(item.target), 0);
  const overallProgress = totalTarget > 0 ? Math.min(Math.round((totalValue / totalTarget) * 100), 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-lg font-bold">Portofolio Investasi</h2>
          <p className="text-xs text-gray-400">Harga investasi diperbarui via Supabase RPC / API Cron.</p>
        </div>
        <button 
          onClick={onRefreshPrices}
          disabled={isSyncing}
          className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs flex items-center gap-1.5 border border-gray-700 transition-all"
        >
          <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Syncing...' : 'Sync Harga'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-[#161B22] border border-gray-800 space-y-2">
          <span className="text-xs font-mono text-gray-400">Total Nilai Portofolio</span>
          <h3 className="text-2xl font-bold mt-1">Rp {totalValue.toLocaleString('id-ID')}</h3>
        </div>

        <div className="p-5 rounded-2xl bg-[#161B22] border border-gray-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold">Total Progres Target</span>
            <span className="text-xs font-mono text-blue-300 font-bold">{overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden mt-2">
            <div className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full" style={{ width: `${overallProgress}%` }}></div>
          </div>
        </div>
      </div>

      {/* Rincian Kategori Investasi */}
      <div className="space-y-3">
        {investCategories.map((item) => {
          const currentTotalVal = calculateTotalValue(item);
          return (
            <div key={item.id} className="p-4 rounded-2xl bg-[#161B22] border border-gray-800 space-y-2">
              <div className="flex justify-between">
                <h4 className="font-semibold text-xs text-white">{item.name} ({item.type.toUpperCase()})</h4>
                <span className="text-xs font-mono text-gray-400">{item.unitAmount} {item.type === 'emas' ? 'Gram' : 'Unit'}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <p className="text-lg font-bold">Rp {currentTotalVal.toLocaleString('id-ID')}</p>
                <span className="text-[10px] text-gray-400 font-mono">@ Rp {Number(item.currentUnitPrice).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-[11px] font-mono text-gray-400 pt-1 border-t border-gray-800/60">
                <span>Asset Key: <strong className="text-blue-300">{item.assetKey}</strong></span>
                <span>Target: <strong>Rp {Number(item.target).toLocaleString('id-ID')}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ==================== TAB 4: PENGATURAN (PUSAT KONTROL) ==================== */
function SettingsTab({ 
  onLogout, 
  categories, 
  setCategories, 
  investCategories, 
  setInvestCategories,
  recurringTransactions,
  setRecurringTransactions,
  pushEnabled,
  setPushEnabled,
  sendPushNotificationAPI
}) {
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [catName, setCatName] = useState('');
  const [catBudget, setCatBudget] = useState('');

  const [showInvestModal, setShowInvestModal] = useState(false);
  const [invName, setInvName] = useState('');
  const [invKey, setInvKey] = useState('gold_antam');
  const [invType, setInvType] = useState('emas');
  const [invTarget, setInvTarget] = useState('');

  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [recName, setRecName] = useState('');
  const [recCategory, setRecCategory] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recDueDate, setRecDueDate] = useState('');

  const handleAddBudgetCategory = (e) => {
    e.preventDefault();
    if (!catName || !catBudget) return;
    setCategories([...categories, {
      id: `cat-${Date.now()}`,
      name: catName,
      budget: Number(catBudget),
      used: 0
    }]);
    setCatName('');
    setCatBudget('');
    setShowBudgetModal(false);
  };

  const handleAddInvestCategory = (e) => {
    e.preventDefault();
    if (!invName || !invTarget) return;
    setInvestCategories([...investCategories, {
      id: `inv-${Date.now()}`,
      name: invName,
      assetKey: invKey,
      type: invType,
      unitAmount: 0,
      currentUnitPrice: 0,
      target: Number(invTarget)
    }]);
    setInvName('');
    setInvTarget('');
    setShowInvestModal(false);
  };

  const handleAddRecurring = (e) => {
    e.preventDefault();
    if (!recName || !recAmount || !recDueDate) return;
    const newRec = {
      id: `rec-${Date.now()}`,
      name: recName,
      categoryId: recCategory || categories[0]?.id,
      amount: Number(recAmount),
      dueDate: recDueDate,
      frequency: 'Bulanan'
    };
    setRecurringTransactions([...recurringTransactions, newRec]);
    sendPushNotificationAPI({
      title: 'Reminder Transaksi Baru',
      message: `Jadwal ${recName} sebesar Rp ${Number(recAmount).toLocaleString('id-ID')} telah diset.`
    });
    setRecName('');
    setRecAmount('');
    setRecDueDate('');
    setShowRecurringModal(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Pengaturan Aplikasi</h2>

      {/* SECTION 1: PUSH NOTIFICATIONS & REMINDER */}
      <div className="space-y-3">
        <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider">Push Notifikasi & Reminder</h3>
        <div className="p-4 rounded-2xl bg-[#161B22] border border-gray-800 flex justify-between items-center">
          <div>
            <h4 className="text-xs font-semibold">Aktifkan Reminder Transaksi</h4>
            <p className="text-[10px] text-gray-500">Notifikasi otomatis via /api/send-reminders</p>
          </div>
          <button 
            onClick={() => setPushEnabled(!pushEnabled)} 
            className={`w-10 h-5 rounded-full p-0.5 transition-colors ${pushEnabled ? 'bg-blue-500 justify-end' : 'bg-gray-700 justify-start'} flex items-center`}
          >
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </button>
        </div>
      </div>

      {/* SECTION 2: KELOLA KATEGORI & BUDGET */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider">Kelola Kategori & Budget</h3>
          <button onClick={() => setShowBudgetModal(true)} className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs flex items-center gap-1 font-medium">
            <Plus size={14} /> Tambah Kategori
          </button>
        </div>

        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="p-3 rounded-xl bg-[#161B22] border border-gray-800 flex justify-between items-center">
              <div>
                <h4 className="text-xs font-semibold text-white">{cat.name}</h4>
                <p className="text-[10px] text-gray-400 font-mono">Batas Budget: Rp {Number(cat.budget).toLocaleString('id-ID')}</p>
              </div>
              <button onClick={() => setCategories(categories.filter(c => c.id !== cat.id))} className="text-gray-500 hover:text-rose-400">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: KELOLA KATEGORI INVESTASI */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider">Kelola Kategori Investasi</h3>
          <button onClick={() => setShowInvestModal(true)} className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs flex items-center gap-1 font-medium">
            <Plus size={14} /> Tambah Investasi
          </button>
        </div>

        <div className="space-y-2">
          {investCategories.map((inv) => (
            <div key={inv.id} className="p-3 rounded-xl bg-[#161B22] border border-gray-800 flex justify-between items-center">
              <div>
                <h4 className="text-xs font-semibold text-white">{inv.name} ({inv.type})</h4>
                <p className="text-[10px] text-gray-400 font-mono">Asset Key: {inv.assetKey} | Target: Rp {Number(inv.target).toLocaleString('id-ID')}</p>
              </div>
              <button onClick={() => setInvestCategories(investCategories.filter(i => i.id !== inv.id))} className="text-gray-500 hover:text-rose-400">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: KELOLA TRANSAKSI BERULANG */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider">Atur Transaksi Berulang</h3>
          <button onClick={() => setShowRecurringModal(true)} className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs flex items-center gap-1 font-medium">
            <Plus size={14} /> Tambah Jadwal
          </button>
        </div>

        <div className="space-y-2">
          {recurringTransactions.map((rec) => (
            <div key={rec.id} className="p-3 rounded-xl bg-[#161B22] border border-gray-800 flex justify-between items-center">
              <div>
                <h4 className="text-xs font-semibold text-white">{rec.name}</h4>
                <p className="text-[10px] text-gray-400 font-mono">Rp {Number(rec.amount).toLocaleString('id-ID')} - Tanggal: {rec.dueDate}</p>
              </div>
              <button onClick={() => setRecurringTransactions(recurringTransactions.filter(r => r.id !== rec.id))} className="text-gray-500 hover:text-rose-400">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* LOGOUT BUTTON */}
      <button onClick={onLogout} className="w-full py-3 bg-rose-950/40 border border-rose-900/50 text-rose-300 rounded-xl font-bold text-xs hover:bg-rose-900/60 transition-all mt-6">
        Keluar Akun
      </button>

      {/* MODALS */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-5 max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm">Tambah Kategori Budget</h3>
              <button onClick={() => setShowBudgetModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleAddBudgetCategory} className="space-y-3">
              <input type="text" placeholder="Nama Kategori" value={catName} onChange={(e) => setCatName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white" required />
              <input type="number" placeholder="Nominal Budget (Rp)" value={catBudget} onChange={(e) => setCatBudget(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white" required />
              <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">Simpan Kategori</button>
            </form>
          </div>
        </div>
      )}

      {showInvestModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-5 max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm">Tambah Kategori Investasi</h3>
              <button onClick={() => setShowInvestModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleAddInvestCategory} className="space-y-3">
              <input type="text" placeholder="Nama Produk" value={invName} onChange={(e) => setInvName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white" required />
              <input type="text" placeholder="Asset Key (misal: reksadana_insight_money_syariah)" value={invKey} onChange={(e) => setInvKey(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white" required />
              <select value={invType} onChange={(e) => setInvType(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white">
                <option value="emas">Emas</option>
                <option value="reksadana">Reksadana</option>
              </select>
              <input type="number" placeholder="Target Nominal (Rp)" value={invTarget} onChange={(e) => setInvTarget(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white" required />
              <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">Simpan Investasi</button>
            </form>
          </div>
        </div>
      )}

      {showRecurringModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-5 max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm">Tambah Transaksi Berulang</h3>
              <button onClick={() => setShowRecurringModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleAddRecurring} className="space-y-3">
              <input type="text" placeholder="Nama Transaksi" value={recName} onChange={(e) => setRecName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white" required />
              <input type="number" placeholder="Nominal (Rp)" value={recAmount} onChange={(e) => setRecAmount(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white" required />
              <input type="date" value={recDueDate} onChange={(e) => setRecDueDate(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white" required />
              <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">Simpan & Kirim Notifikasi</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
