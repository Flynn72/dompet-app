import React, { useState, useEffect } from 'react';

// Loading screen yang tampil saat App.jsx sedang cek sesi login
// (menggantikan kotak pulse sederhana yang lama). Desain diadaptasi dari
// mockup HTML yang diberikan -- dikonversi ke inline style React (bukan
// Tailwind CDN) supaya konsisten dengan pola styling yang sudah dipakai
// di seluruh Dompet App, dan tidak menambah dependency baru.
const STATUS_TEXTS = [
  'INITIALIZING SECURE PROTOCOLS...',
  'CONNECTING TO LEDGER...',
  'VERIFYING INSTITUTIONAL KEYS...',
  'SYNCHRONIZING DATA VAULTS...',
  'ESTABLISHING ENCRYPTED TUNNEL...',
];

// Ganti URL ini kapan saja kalau mau pakai gambar sendiri -- URL asli dari
// mockup ini di-hosting Google (bucket desain sementara), berisiko suatu
// saat bisa hilang/expired karena bukan milik Dompet App sendiri.
const BACKGROUND_IMAGE_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBTPo9-49fVJ08CbMm3wQe5Rp_S5Cvbz-h1evIuRyDY-sjMgzWI1j0OMEqDm4fi15e6mWcjlTkmz3g6BruxGnqfxrIgILVVt2EbJ-NVZsca0HsbJd06q7mBovGoNqBhi9VCaxLhR0TshNj_gLPHaOoXImoXaD-ul3NJPO1sVatv6cPM5dg7kE7SFM3h_nAvmHF3-WO7L4swhzMDZQ9nUzHGdjwyT46jtfy5t_v1q8rwy6V_JhpX-iSj1FfXgOE2jSX1sg';

export default function SplashScreen() {
  const [textIndex, setTextIndex] = useState(0);
  const [textVisible, setTextVisible] = useState(false);

  useEffect(() => {
    // Fade-in teks pertama sedikit setelah mount, biar tidak "kedip" instan
    const fadeInTimer = setTimeout(() => setTextVisible(true), 200);

    // Ganti teks status tiap 1.8 detik, siklus ulang dari awal
    const cycleTimer = setInterval(() => {
      setTextIndex((i) => (i + 1) % STATUS_TEXTS.length);
    }, 1800);

    return () => {
      clearTimeout(fadeInTimer);
      clearInterval(cycleTimer);
    };
  }, []);

  return (
    <div style={styles.root}>
      <div style={styles.bgLayer}>
        <div
          style={{
            ...styles.bgImage,
            backgroundImage: `url('${BACKGROUND_IMAGE_URL}')`,
          }}
        />
        <div style={styles.bgGradient} />
      </div>

      <main style={styles.main}>
        <div style={styles.progressWrap}>
          <div style={styles.progressTrack}>
            <div style={styles.progressBar} />
          </div>
          <div style={{ ...styles.statusText, opacity: textVisible ? 0.8 : 0 }}>
            {STATUS_TEXTS[textIndex]}
          </div>
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400..800&display=swap');
        @keyframes dompet-splash-loading {
          0% { width: 0%; left: 0%; right: 100%; }
          50% { width: 100%; left: 0%; right: 0%; }
          100% { width: 0%; left: 100%; right: 0%; }
        }
        @keyframes dompet-splash-pulse {
          0% { opacity: 0.3; }
          100% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'var(--bg-base, #0B0F1A)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    fontFamily: "'Inter', sans-serif",
  },
  bgLayer: {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
  },
  bgImage: {
    width: '100%',
    height: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'contrast(1.2) brightness(0.8) hue-rotate(-10deg)',
    animation: 'dompet-splash-pulse 4s ease-in-out infinite alternate',
  },
  bgGradient: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, var(--bg-base, #0B0F1A), transparent, var(--bg-base, #0B0F1A))',
    opacity: 0.9,
  },
  main: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: 1200,
    margin: '0 auto',
    padding: '0 24px 48px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  progressWrap: {
    width: '100%',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    width: '100%',
    height: 2,
    background: '#323537',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 999,
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    background: '#7FE8A4',
    boxShadow: '0 0 10px #7FE8A4',
    animation: 'dompet-splash-loading 3s ease-in-out infinite',
  },
  statusText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: 'var(--text-secondary, #7A90B8)',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    marginTop: 8,
    transition: 'opacity 0.6s ease',
    textAlign: 'center',
  },
};
