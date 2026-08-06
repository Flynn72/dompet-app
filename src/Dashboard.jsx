import React, { useState } from 'react';
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
  Search, 
  SlidersHorizontal,
  Utensils,
  Car,
  Briefcase,
  ShoppingBag,
  Plus,
  Globe,
  Sun,
  FileSpreadsheet,
  HelpCircle,
  Target,
  Edit3,
  X
} from 'lucide-react';

export default function Dashboard({ session, user, onLogout }) {
  const [activeTab, setActiveTab] = useState('home');

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
            <button className="p-2 text-gray-400 hover:text-white rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Dynamic Content - Responsive Grid / Max Width */}
      <main className="px-4 pt-4 max-w-4xl mx-auto space-y-4">
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'budget' && <BudgetTab />}
        {activeTab === 'invest' && <InvestTab />}
        {activeTab === 'settings' && <SettingsTab onLogout={onLogout} />}
      </main>

      {/* Floating Action Button (FAB) - Home Only */}
      {activeTab === 'home' && (
        <button className="fixed bottom-20 right-5 md:bottom-8 md:right-8 w-12 h-12 bg-blue-300 text-slate-900 rounded-2xl flex items-center justify-center shadow-lg hover:bg-blue-200 transition-all z-40">
          <Plus size={24} />
        </button>
      )}

      {/* Bottom / Responsive Nav Bar */}
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
function HomeTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Total Saldo */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1C2331] to-[#121721] border border-gray-800 md:col-span-3">
          <div className="flex justify-between items-start">
            <span className="text-xs font-mono text-gray-400">Total Saldo</span>
            <Wallet size={18} className="text-blue-400" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mt-2">Rp 45.230.000</h2>
          <p className="text-xs text-emerald-400 font-mono mt-1">📈 +2.4% dari bulan lalu</p>
        </div>

        {/* Pemasukan & Pengeluaran */}
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

      {/* Grid Tren & Transaksi untuk Layar Besar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tren Bulanan */}
        <div className="p-4 rounded-2xl bg-[#161B22] border border-gray-800 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm">Tren Bulanan</h3>
            <span className="text-[10px] font-mono bg-gray-800 px-2 py-1 rounded text-gray-300">6 Bulan Terakhir</span>
          </div>
          <div className="h-44 w-full flex items-end justify-between px-2 pt-4 border-b border-gray-800">
            <div className="w-full h-full bg-gradient-to-t from-blue-500/10 to-blue-400/30 rounded-lg flex items-center justify-center text-xs text-gray-500 italic">
              [ Graphic Wave ]
            </div>
          </div>
          <div className="flex justify-between text-[10px] font-mono text-gray-500 px-1">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>Mei</span><span>Jun</span>
          </div>
        </div>

        {/* Transaksi Terbaru */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm">Transaksi Terbaru</h3>
          <div className="flex gap-2">
            <div className="flex-1 bg-[#161B22] border border-gray-800 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-gray-400">
              <Search size={14} />
              <span>Cari...</span>
            </div>
            <button className="p-2 bg-[#161B22] border border-gray-800 rounded-xl text-gray-400"><SlidersHorizontal size={16} /></button>
          </div>

          <div className="space-y-2">
            <TransactionItem icon={<Utensils size={16} />} title="Starbucks" category="Makanan" date="Hari ini, 09:41" amount="-Rp 55.000" negative />
            <TransactionItem icon={<Car size={16} />} title="Grab Ride" category="Transport" date="Kemarin, 18:20" amount="-Rp 32.500" negative />
            <TransactionItem icon={<Briefcase size={16} />} title="Gaji" category="Pendapatan" date="25 Mei 2024" amount="+Rp 12.500.000" />
            <TransactionItem icon={<ShoppingBag size={16} />} title="Tokopedia" category="Belanja" date="24 Mei 2024" amount="-Rp 450.000" negative />
          </div>
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
function BudgetTab() {
  const [totalBudget, setTotalBudget] = useState(4500000);
  const [usedBudget, setUsedBudget] = useState(3800000);
  const [showModal, setShowModal] = useState(false);
  const [inputBudget, setInputBudget] = useState(totalBudget);

  const percentage = Math.min(Math.round((usedBudget / totalBudget) * 100), 100);

  const handleSaveBudget = (e) => {
    e.preventDefault();
    if (inputBudget > 0) {
      setTotalBudget(Number(inputBudget));
      setShowModal(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold">Anggaran & Tagihan</h2>
          <p className="text-xs text-gray-400">Atur batas pengeluaran dan pemantauan tagihan bulanan.</p>
        </div>
        <button 
          onClick={() => { setInputBudget(totalBudget); setShowModal(true); }}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
        >
          <Plus size={14} /> Atur Budget
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Total Anggaran Bulanan */}
        <div className="p-4 rounded-2xl bg-[#161B22] border border-gray-800 space-y-2">
          <span className="text-xs font-mono text-gray-400">Total Anggaran Bulanan</span>
          <h3 className="text-2xl font-bold">
            Rp {usedBudget.toLocaleString('id-ID')} <span className="text-xs text-gray-500 font-normal">dari batas Rp {totalBudget.toLocaleString('id-ID')}</span>
          </h3>
          <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden mt-2">
            <div 
              className={`h-full transition-all duration-500 ${percentage >= 80 ? 'bg-rose-400' : 'bg-blue-400'}`} 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] font-mono mt-1">
            <span className="text-gray-400">Terpakai {percentage}%</span>
            <span className={percentage >= 80 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              {percentage >= 80 ? 'Peringatan Mendekati Batas' : 'Aman'}
            </span>
          </div>
        </div>

        {/* Card Kategori Makanan & Minuman */}
        <div className="p-4 rounded-2xl bg-[#161B22] border border-gray-800 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Utensils size={16} className="text-gray-400" />
              <span className="text-xs font-semibold">Makanan & Minuman</span>
            </div>
            <span className="text-[10px] bg-rose-950/60 text-rose-300 px-2 py-0.5 rounded font-mono">Mendekati Batas</span>
          </div>
          <p className="text-sm font-bold">
            Rp 1.250.000 <span className="text-xs text-gray-500 font-normal">/ Rp 1.500.000</span>
          </p>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-rose-400 h-full w-[84%]"></div>
          </div>
          <div className="flex justify-end text-[10px] font-mono text-gray-400">
            <span>84% Terpakai</span>
          </div>
        </div>
      </div>

      {/* Modal / Pop-up Form Atur Budget */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-5 max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm">Tentukan Batas Budget Bulanan</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveBudget} className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Batas Nominal (Rp)</label>
                <input 
                  type="number" 
                  value={inputBudget} 
                  onChange={(e) => setInputBudget(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="Masukkan jumlah budget..."
                  required
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-xs transition-all"
              >
                Simpan Budget
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== TAB 3: INVESTASI ==================== */
function InvestTab() {
  const [investmentTarget, setInvestmentTarget] = useState(100000000); // Target Rp 100 Juta
  const currentInvestment = 45230000;
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [inputTarget, setInputTarget] = useState(investmentTarget);

  const targetProgress = Math.min(Math.round((currentInvestment / investmentTarget) * 100), 100);

  const handleSaveTarget = (e) => {
    e.preventDefault();
    if (inputTarget > 0) {
      setInvestmentTarget(Number(inputTarget));
      setShowTargetModal(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Investasi</h2>
        <button 
          onClick={() => { setInputTarget(investmentTarget); setShowTargetModal(true); }}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-gray-700 transition-all"
        >
          <Target size={14} className="text-blue-400" /> Ubah Target
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Total Nilai Investasi */}
        <div className="p-5 rounded-2xl bg-[#161B22] border border-gray-800 space-y-2">
          <span className="text-xs font-mono text-gray-400">Total Nilai Investasi</span>
          <h3 className="text-2xl font-bold mt-1">Rp {currentInvestment.toLocaleString('id-ID')}</h3>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-950/50 border border-blue-800/40 text-blue-300 text-xs font-mono">
            <span>+Rp 2.150.000 (4.9%)</span>
            <span className="text-gray-400">Floating Gain</span>
          </div>
        </div>

        {/* Card Target Investasi (Progress Bar) */}
        <div className="p-5 rounded-2xl bg-[#161B22] border border-gray-800 space-y-3 flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-blue-400" />
              <span className="text-xs font-semibold">Pencapaian Target</span>
            </div>
            <span className="text-xs font-mono text-blue-300 font-bold">{targetProgress}%</span>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-gray-400">
              Rp {currentInvestment.toLocaleString('id-ID')} / <strong className="text-white">Rp {investmentTarget.toLocaleString('id-ID')}</strong>
            </p>
            <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full transition-all duration-500" 
                style={{ width: `${targetProgress}%` }}
              ></div>
            </div>
          </div>

          <p className="text-[10px] text-gray-500 font-mono">
            Tersisa Rp {(investmentTarget - currentInvestment > 0 ? investmentTarget - currentInvestment : 0).toLocaleString('id-ID')} lagi untuk mencapai target.
          </p>
        </div>
      </div>

      {/* Portfolio Items */}
      <div className="p-4 rounded-2xl bg-[#161B22] border border-gray-800 space-y-2">
        <div className="flex justify-between">
          <h4 className="font-semibold text-xs">Emas Pluang</h4>
          <span className="text-xs font-mono text-gray-400">25.5 Grams</span>
        </div>
        <p className="text-lg font-bold">Rp 25.500.000</p>
        <div className="flex justify-between text-[11px] font-mono text-gray-400 pt-1">
          <span>Floating <strong className="text-emerald-400">+8.5%</strong></span>
          <span>Realized <strong>Rp 1.2M</strong></span>
        </div>
      </div>

      {/* Modal Form Set Target Investasi */}
      {showTargetModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#161B22] border border-gray-800 rounded-2xl p-5 max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm">Tentukan Target Investasi</h3>
              <button onClick={() => setShowTargetModal(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={handleSaveTarget} className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Target Nominal (Rp)</label>
                <input 
                  type="number" 
                  value={inputTarget} 
                  onChange={(e) => setInputTarget(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="Masukkan target investasi..."
                  required
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-xs transition-all"
              >
                Simpan Target
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== TAB 4: PENGATURAN ==================== */
function SettingsTab({ onLogout }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">Preferences</h3>
          <div className="space-y-2">
            <SettingToggle icon={<Bell size={16} />} title="Push Notifications" subtitle="Alerts for transactions" active />
            <SettingOption icon={<Globe size={16} />} title="Language / Bahasa" options={['English', 'Indonesia']} activeIndex={1} />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">Data & Tools</h3>
          <div className="space-y-2">
            <SettingButton icon={<FileSpreadsheet size={16} />} title="Export Excel / Ekspor Excel" />
            <SettingButton icon={<HelpCircle size={16} />} title="Need a refresher? / Butuh penyegaran?" />
          </div>
        </div>
      </div>

      <button 
        onClick={onLogout}
        className="w-full py-3 bg-rose-950/40 border border-rose-900/50 text-rose-300 rounded-xl font-bold text-xs hover:bg-rose-900/60 transition-all"
      >
        Keluar Akun
      </button>
    </div>
  );
}

function SettingToggle({ icon, title, subtitle, active }) {
  return (
    <div className="p-3 rounded-xl bg-[#161B22] border border-gray-800 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="text-gray-400">{icon}</div>
        <div>
          <h4 className="text-xs font-semibold">{title}</h4>
          <p className="text-[10px] text-gray-500">{subtitle}</p>
        </div>
      </div>
      <div className={`w-8 h-4 rounded-full p-0.5 flex items-center ${active ? 'bg-blue-500 justify-end' : 'bg-gray-700 justify-start'}`}>
        <div className="w-3 h-3 bg-white rounded-full"></div>
      </div>
    </div>
  );
}

function SettingOption({ icon, title, options, activeIndex }) {
  return (
    <div className="p-3 rounded-xl bg-[#161B22] border border-gray-800 space-y-2">
      <div className="flex items-center gap-3 text-xs font-semibold text-gray-300">
        {icon}
        <span>{title}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 p-1 bg-gray-900/80 rounded-lg">
        {options.map((opt, idx) => (
          <button 
            key={opt} 
            className={`py-1 text-[11px] font-medium rounded-md transition-all ${
              idx === activeIndex ? 'bg-blue-900/50 text-blue-200 border border-blue-700/50' : 'text-gray-400'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingButton({ icon, title }) {
  return (
    <button className="w-full p-3 rounded-xl bg-[#161B22] border border-gray-800 flex items-center gap-3 text-xs font-semibold text-gray-300 hover:bg-gray-800/50 transition-all">
      {icon}
      <span>{title}</span>
    </button>
  );
}
