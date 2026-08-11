import React, { useState, useEffect, useCallback } from 'react';
import AssetPageShell from './AssetPageShell';
import AssetAccountCard from './AssetAccountCard';
import { fetchAssetAccounts, fetchAccountStats, fetchAccountTransactions, addAssetAccount } from '../../lib/assetsApi';

export default function AssetsGold({ user }) {
  const [accounts, setAccounts] = useState([]);
  const [statsMap, setStatsMap] = useState({});
  const [txMap, setTxMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newName, setNewName] = useState('');
  const [newInstitution, setNewInstitution] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const accs = await fetchAssetAccounts('gold');
      setAccounts(accs);
      const stats = {};
      const txs = {};
      for (const acc of accs) {
        stats[acc.id] = await fetchAccountStats(acc.id);
        txs[acc.id] = await fetchAccountTransactions(acc.id);
      }
      setStatsMap(stats);
      setTxMap(txs);
    } catch (e) {
      setError(e.message || 'Gagal memuat data emas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createAccount = async () => {
    if (!newName.trim()) return;
    setSavingAccount(true);
    try {
      await addAssetAccount({
        user_id: user.id,
        asset_type: 'gold',
        name: newName.trim(),
        institution: newInstitution.trim() || null,
      });
      setShowAddAccount(false);
      setNewName('');
      setNewInstitution('');
      await load();
    } catch (e) {
      alert(e.message || 'Gagal menambah akun emas');
    } finally {
      setSavingAccount(false);
    }
  };

  return (
    <AssetPageShell title="Emas">
      {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>Memuat...</div>}
      {error && <div style={{ color: '#FF9466', fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {!loading && accounts.length === 0 && !showAddAccount && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0' }}>
          Belum ada akun emas.
        </div>
      )}

      {!loading && accounts.map((acc) => (
        <AssetAccountCard
          key={acc.id}
          account={acc}
          stats={statsMap[acc.id]}
          transactions={txMap[acc.id] || []}
          unitLabel="gram"
          unitBased
          onChanged={load}
        />
      ))}

      {!loading && !showAddAccount && (
        <button onClick={() => setShowAddAccount(true)} style={styles.addAccountBtn}>+ Tambah akun emas</button>
      )}

      {showAddAccount && (
        <div style={styles.formBox}>
          <input placeholder="Nama akun, mis. Emas Pluang" value={newName} onChange={(e) => setNewName(e.target.value)} style={styles.input} />
          <input placeholder="Platform (opsional), mis. Pluang" value={newInstitution} onChange={(e) => setNewInstitution(e.target.value)} style={styles.input} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={createAccount} disabled={savingAccount} style={styles.saveBtn}>{savingAccount ? 'Menyimpan...' : 'Simpan'}</button>
            <button onClick={() => setShowAddAccount(false)} style={styles.cancelBtn}>Batal</button>
          </div>
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
};
