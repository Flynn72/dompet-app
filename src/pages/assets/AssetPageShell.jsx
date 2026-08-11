import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

// Layout bersama untuk semua halaman di bawah /aset/*, supaya konsisten
// dan tidak duplikasi kode header/back-button di tiap file.
export default function AssetPageShell({ title, children }) {
  const navigate = useNavigate();
  return (
    <div className="dompet-page" style={{ paddingBottom: 90 }}>
      <div className="dompet-sticky-top">
        <div style={styles.header}>
          <button onClick={() => navigate(-1)} style={styles.backBtn} aria-label="Kembali">
            <ChevronLeft size={22} />
          </button>
          <h1 style={styles.title}>{title}</h1>
          <div style={{ width: 36 }} />
        </div>
      </div>
      <div style={{ padding: '4px 20px 20px' }}>{children}</div>
    </div>
  );
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 20px 12px',
    background: 'var(--bg-base)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    border: 'none',
    background: 'var(--bg-card)',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  title: {
    fontSize: 17,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0,
  },
};
