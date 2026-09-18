import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

// Ditampilkan Sentry.ErrorBoundary (main.jsx) saat terjadi crash tak tertangani
// di mana pun di dalam app, supaya user tidak lihat layar putih kosong.
export default function ErrorFallback() {
  return (
    <div style={styles.wrap}>
      <AlertTriangle size={40} color="#FF9466" />
      <h2 style={styles.title}>Ups, ada yang error</h2>
      <p style={styles.desc}>
        Aplikasi mengalami masalah tak terduga. Error ini sudah otomatis dilaporkan.
        Coba muat ulang halaman.
      </p>
      <button onClick={() => window.location.reload()} style={styles.btn}>
        <RotateCcw size={14} /> Muat ulang
      </button>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', textAlign: 'center', padding: 24, gap: 10,
    background: 'var(--bg-base, #0F1410)', color: 'var(--text-primary, #EAF0E8)',
  },
  title: { fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, margin: 0 },
  desc: { fontSize: 13, color: 'var(--text-secondary, #9CA89F)', maxWidth: 320, margin: 0 },
  btn: {
    marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px',
    borderRadius: 10, border: 'none', background: 'var(--accent, #7FE8A4)', color: '#0F1410',
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },
};
