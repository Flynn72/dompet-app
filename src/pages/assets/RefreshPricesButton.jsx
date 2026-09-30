import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { refreshPrices } from '../../lib/assetsApi';

// Tombol kecil di header halaman Emas/Reksa Dana buat trigger sync harga manual,
// tanpa nunggu cron 30 menit. Dipasang lewat prop `rightAction` di AssetPageShell.
export default function RefreshPricesButton({ onRefreshed }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    setMessage('');
    try {
      const result = await refreshPrices();
      if (result.cooldown) {
        setMessage(result.message || 'Baru saja di-refresh, coba lagi sebentar.');
      } else if (result.errors && result.errors.length > 0) {
        setMessage('Sebagian gagal: ' + result.errors.join('; '));
      } else {
        setMessage('Harga berhasil di-update.');
        onRefreshed && onRefreshed();
      }
    } catch (e) {
      setMessage(e.message || 'Gagal refresh harga.');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 6000);
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{ ...styles.btn, opacity: loading ? 0.6 : 1 }}
        aria-label="Refresh harga"
        title="Refresh harga sekarang"
      >
        <RefreshCw size={16} color="var(--text-primary)" style={loading ? { animation: 'spin 1s linear infinite' } : undefined} />
      </button>
      {message && <div style={styles.toast}>{message}</div>}
    </div>
  );
}

const styles = {
  btn: {
    width: 36, height: 36, borderRadius: 12, border: 'none', background: 'var(--bg-card)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  toast: {
    position: 'absolute', top: 42, right: 0, background: 'var(--bg-card)', border: '1px solid #2A332B',
    borderRadius: 8, padding: '8px 10px', fontSize: 11, color: 'var(--text-secondary)',
    width: 180, textAlign: 'right', zIndex: 5,
  },
};
