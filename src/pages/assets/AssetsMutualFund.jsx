import React, { useState, useEffect, useCallback } from 'react';
import AssetPageShell from './AssetPageShell';
import AssetAccountCard from './AssetAccountCard';
import { fetchAssetAccounts, fetchAccountStats, fetchAccountTransactions, addAssetAccount, fetchMutualFunds, addMutualFund } from '../../lib/assetsApi';

export default function AssetsMutualFund({ user }) {
  const [accounts, setAccounts] = useState([]);
  const [statsMap, setStatsMap] = useState({});
  const [txMap, setTxMap] = useState({});
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newName, setNewName] = useState('');
  const [newInstitution, setNewInstitution] = useState('');
  const [selectedFundId, setSelectedFundId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(''); // '' = semua kategori
  const [savingAccount, setSavingAccount] = useState(false);
  const [showAddFund, setShowAddFund] = useState(false);
  const [newFundName, setNewFundName] = useState('');
  const [newFundManager, setNewFundManager] = useState('');
  const [newFundCategory, setNewFundCategory] = useState('');
  const [newFundProvider, setNewFundProvider] = useState('');
  const [savingFund, setSavingFund] = useState(false);
  const [fundError, setFundError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [accs, fundList] = await Promise.all([fetchAssetAccounts('mutual_fund'), fetchMutualFunds()]);
      setAccounts(accs);
      setFunds(fundList);
      if (fundList.length > 0 && !selectedFundId) setSelectedFundId(fundList[0].id);
      const stats = {};
      const txs = {};
      for (const acc of accs) {
        stats[acc.id] = await fetchAccountStats(acc.id);
        txs[acc.id] = await fetchAccountTransactions(acc.id);
      }
      setStatsMap(stats);
      setTxMap(txs);
    } catch (e) {
      setError(e.message || 'Gagal memuat data reksa dana');
    } finally {
      setLoading(false);
    }
  }, [selectedFundId]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const createAccount = async () => {
    if (!newName.trim() || !selectedFundId) return;
    setSavingAccount(true);
    try {
      await addAssetAccount({
        user_id: user.id,
        asset_type: 'mutual_fund',
        fund_id: selectedFundId,
        name: newName.trim(),
        institution: newInstitution.trim() || null,
      });
      setShowAddAccount(false);
      setNewName('');
      setNewInstitution('');
      await load();
    } catch (e) {
      alert(e.message || 'Gagal menambah akun reksa dana');
    } finally {
      setSavingAccount(false);
    }
  };

  const createFund = async () => {
    setFundError('');
    if (!newFundName.trim()) { setFundError('Nama produk wajib diisi'); return; }
    setSavingFund(true);
    try {
      const created = await addMutualFund({
        name: newFundName.trim(),
        manager: newFundManager.trim() || null,
        category: newFundCategory.trim() || null,
        provider: newFundProvider.trim() || null,
      });
      const fundList = await fetchMutualFunds();
      setFunds(fundList);
      setSelectedFundId(created.id); // langsung pilih produk yang baru dibuat
      setShowAddFund(false);
      setNewFundName(''); setNewFundManager(''); setNewFundCategory(''); setNewFundProvider('');
    } catch (e) {
      setFundError(e.message || 'Gagal menambah produk');
    } finally {
      setSavingFund(false);
    }
  };

  const categories = [...new Set(funds.map((f) => f.category).filter(Boolean))].sort();
  const filteredFunds = selectedCategory ? funds.filter((f) => f.category === selectedCategory) : funds;

  return (
    <AssetPageShell title="Reksa Dana">
      {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>Memuat...</div>}
      {error && <div style={{ color: '#FF9466', fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {!loading && accounts.length === 0 && !showAddAccount && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0' }}>
          Belum ada akun reksa dana.
        </div>
      )}

      {!loading && accounts.map((acc) => {
        const fund = funds.find((f) => f.id === acc.fund_id);
        return (
          <AssetAccountCard
            key={acc.id}
            account={{ ...acc, institution: acc.institution || fund?.name }}
            stats={statsMap[acc.id]}
            transactions={txMap[acc.id] || []}
            unitLabel="unit"
            unitBased
            onChanged={load}
          />
        );
      })}

      {!loading && !showAddAccount && (
        <button onClick={() => { setShowAddAccount(true); if (funds.length === 0) setShowAddFund(true); }} style={styles.addAccountBtn}>+ Tambah akun reksa dana</button>
      )}

      {showAddAccount && (
        <div style={styles.formBox}>
          {funds.length > 0 && !showAddFund && (
            <>
              {categories.length > 0 && (
                <div style={styles.chipRow}>
                  {['', ...categories].map((c) => {
                    const active = selectedCategory === c;
                    return (
                      <button
                        key={c || 'semua'}
                        onClick={() => {
                          setSelectedCategory(c);
                          const list = c ? funds.filter((f) => f.category === c) : funds;
                          if (list.length > 0) setSelectedFundId(list[0].id);
                        }}
                        style={{ ...styles.chip, ...(active ? styles.chipActive : {}) }}
                      >
                        {c || 'Semua'}
                      </button>
                    );
                  })}
                </div>
              )}
              <select value={selectedFundId} onChange={(e) => setSelectedFundId(e.target.value)} style={styles.input}>
                {filteredFunds.length === 0 && <option value="">Tidak ada produk di kategori ini</option>}
                {filteredFunds.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}{f.manager ? ` — ${f.manager}` : ''}</option>
                ))}
              </select>
              <button onClick={() => setShowAddFund(true)} style={styles.linkBtn}>+ Produk belum ada di daftar? Tambah produk baru</button>
            </>
          )}

          {showAddFund && (
            <div style={styles.subFormBox}>
              <div style={styles.subFormTitle}>Produk reksa dana baru</div>
              <input placeholder="Nama produk, mis. Sucorinvest Money Market Fund" value={newFundName} onChange={(e) => setNewFundName(e.target.value)} style={styles.input} />
              <input placeholder="Manajer investasi (opsional)" value={newFundManager} onChange={(e) => setNewFundManager(e.target.value)} style={styles.input} />
              <input placeholder="Kategori (opsional), mis. Pasar Uang" value={newFundCategory} onChange={(e) => setNewFundCategory(e.target.value)} style={styles.input} list="mutual-fund-categories" />
              <datalist id="mutual-fund-categories">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
              <input placeholder="Platform (opsional), mis. Bareksa" value={newFundProvider} onChange={(e) => setNewFundProvider(e.target.value)} style={styles.input} />
              {fundError && <div style={{ color: '#FF9466', fontSize: 11.5 }}>{fundError}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={createFund} disabled={savingFund} style={styles.saveBtn}>{savingFund ? 'Menyimpan...' : 'Simpan produk'}</button>
                {funds.length > 0 && (
                  <button onClick={() => setShowAddFund(false)} style={styles.cancelBtn}>Batal</button>
                )}
              </div>
            </div>
          )}

          {!showAddFund && (
            <>
              <input placeholder="Nama akun, mis. Reksa Dana Ajaib" value={newName} onChange={(e) => setNewName(e.target.value)} style={styles.input} />
              <input placeholder="Platform (opsional), mis. Ajaib" value={newInstitution} onChange={(e) => setNewInstitution(e.target.value)} style={styles.input} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={createAccount} disabled={savingAccount} style={styles.saveBtn}>{savingAccount ? 'Menyimpan...' : 'Simpan'}</button>
                <button onClick={() => setShowAddAccount(false)} style={styles.cancelBtn}>Batal</button>
              </div>
            </>
          )}
        </div>
      )}
    </AssetPageShell>
  );
}

const styles = {
  addAccountBtn: { width: '100%', padding: 14, borderRadius: 14, border: '1px dashed #2A332B', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  formBox: { background: 'var(--bg-card)', borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #2A332B', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box' },
  saveBtn: { flex: 1, padding: '10px 12px', borderRadius: 10, border: 'none', background: 'var(--accent)', color: '#0B0F0C', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  cancelBtn: { flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid #2A332B', background: 'transparent', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  linkBtn: { background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', textAlign: 'left', padding: 0 },
  chipRow: { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' },
  chip: {
    flexShrink: 0, padding: '7px 14px', borderRadius: 999, border: '1px solid #2A332B',
    background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
  },
  chipActive: { background: 'var(--accent)', color: '#0B0F0C', border: '1px solid var(--accent)' },
  subFormBox: { background: 'var(--bg-base)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid #2A332B' },
  subFormTitle: { fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 2 },
};
