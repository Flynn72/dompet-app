import React, { useState } from 'react';
import { Wallet, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { supabase, usernameToEmail } from '../lib/supabaseClient';

export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // login | register
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function validateUsername(u) {
    return /^[a-zA-Z0-9_]{3,20}$/.test(u);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!validateUsername(username)) {
      setError('Username 3-20 karakter, hanya huruf, angka, dan underscore.');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    if (mode === 'register' && password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    const email = usernameToEmail(username);

    try {
      if (mode === 'register') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        });
        if (signUpError) {
          if (signUpError.message.toLowerCase().includes('already registered')) {
            setError('Username sudah dipakai. Coba username lain.');
          } else {
            setError(signUpError.message);
          }
          setLoading(false);
          return;
        }
        if (data.session) {
          onAuthSuccess();
        } else {
          setError('Pendaftaran berhasil. Silakan login.');
          setMode('login');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError('Username atau password salah.');
          setLoading(false);
          return;
        }
        onAuthSuccess();
      }
    } catch (err) {
      setError('Terjadi kesalahan. Periksa koneksi internet.');
    }
    setLoading(false);
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        input { font-family: 'Inter', sans-serif; }
      `}</style>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <div style={styles.logoMark}><Wallet size={22} color="#0F1410" /></div>
          <span style={styles.logoText}>Dompet</span>
        </div>
        <p style={styles.subtitle}>
          {mode === 'login' ? 'Masuk untuk mengelola keuangan Anda' : 'Buat akun baru untuk mulai mencatat'}
        </p>

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Masukan Username"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect="off"
          />

          <label style={styles.label}>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukan Password"
              style={{ ...styles.input, paddingRight: 40 }}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              {showPassword ? <EyeOff size={16} color="#9CA89F" /> : <Eye size={16} color="#9CA89F" />}
            </button>
          </div>

          {mode === 'register' && (
            <>
              <label style={styles.label}>Konfirmasi Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password"
                style={styles.input}
              />
            </>
          )}

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={14} color="#FF9466" style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading} style={{ ...styles.submitBtn, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'}
          </button>
        </form>

        <p style={styles.switchText}>
          {mode === 'login' ? (
            <>Belum punya akun? <span style={styles.switchLink} onClick={() => { setMode('register'); setError(''); }}>Daftar di sini</span></>
          ) : (
            <>Sudah punya akun? <span style={styles.switchLink} onClick={() => { setMode('login'); setError(''); }}>Masuk di sini</span></>
          )}
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', background: '#0F1410', fontFamily: "'Inter', sans-serif", color: '#EAF0EA',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  card: { width: '100%', maxWidth: 380, background: '#161C17', borderRadius: 20, padding: '32px 24px' },
  logoWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 },
  logoMark: { width: 38, height: 38, borderRadius: 10, background: '#7FE8A4', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em' },
  subtitle: { textAlign: 'center', fontSize: 13, color: '#9CA89F', marginBottom: 28 },
  label: { display: 'block', fontSize: 12, color: '#9CA89F', marginBottom: 6, marginTop: 14 },
  input: {
    width: '100%', background: '#0F1410', border: '1px solid #2A332C', borderRadius: 10, padding: '12px 14px',
    color: '#EAF0EA', fontSize: 14, outline: 'none',
  },
  eyeBtn: {
    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent',
    border: 'none', cursor: 'pointer', display: 'flex', padding: 4,
  },
  errorBox: {
    display: 'flex', gap: 8, background: '#3A2418', color: '#FF9466', fontSize: 12.5, padding: '10px 12px',
    borderRadius: 8, marginTop: 16, lineHeight: 1.4,
  },
  submitBtn: {
    width: '100%', marginTop: 24, padding: '13px 0', borderRadius: 12, border: 'none', background: '#7FE8A4',
    color: '#0F1410', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
  switchText: { textAlign: 'center', fontSize: 13, color: '#9CA89F', marginTop: 20 },
  switchLink: { color: '#7FE8A4', cursor: 'pointer', fontWeight: 600 },
};
