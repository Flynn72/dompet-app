import React, { useState } from 'react';
import { supabase, usernameToEmail } from '../lib/supabaseClient';
import PostLoginLoading from '../components/Loading/PostLoginLoading';

export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // login | register
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberNode, setRememberNode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSuccessLoading, setIsSuccessLoading] = useState(false);
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
          setIsSuccessLoading(true);
          setTimeout(() => {
            onAuthSuccess();
          }, 1500);
        } else {
          setError('Pendaftaran berhasil. Silakan login.');
          setMode('login');
          setLoading(false);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError('Username atau password salah.');
          setLoading(false);
          return;
        }
        setIsSuccessLoading(true);
        setTimeout(() => {
          onAuthSuccess();
        }, 1500);
      }
    } catch (err) {
      setError('Terjadi kesalahan. Periksa koneksi internet.');
      setLoading(false);
    }
  }

  if (isSuccessLoading) {
    return <PostLoginLoading userEmail={username} />;
  }

  return (
    <div className="min-h-screen w-full bg-[#101415] text-[#e0e3e5] font-['Work_Sans',sans-serif] flex flex-col justify-center items-center overflow-x-hidden relative selection:bg-[#00E5FF] selection:text-[#101415]">
      {/* Background Circuit Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(182, 198, 240, 0.15) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-[#101415]"></div>
        <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 100 L200 100 L250 50 L400 50" fill="none" opacity="0.3" stroke="#00E5FF" strokeWidth="1" />
          <path d="M0 150 L100 150 L150 200 L400 200" fill="none" opacity="0.2" stroke="#b6c6f0" strokeWidth="1" />
        </svg>
      </div>

      {/* Main Content Container */}
      <main className="w-full max-w-md px-6 flex flex-col items-center justify-center z-10 relative py-8 my-auto">
        
        {/* Security Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-[#191c1e] border border-[#1a2b4c] rounded-full shadow-sm mb-6 sm:mb-8 transition-all">
          <span className="w-2 h-2 rounded-full bg-[#00e3fd] animate-pulse shrink-0"></span>
          <span className="font-['JetBrains_Mono',monospace] text-[10px] sm:text-xs text-[#c5c6cf] tracking-wider uppercase whitespace-nowrap">
            Secured Connection Active
          </span>
        </div>

        {/* Branding */}
        <div className="flex flex-col items-center w-full mb-8 sm:mb-10">
          <div className="relative flex items-center justify-center mb-4 sm:mb-6">
            <div className="absolute w-24 h-24 sm:w-28 sm:h-28 bg-[#7fe8a4] opacity-20 rounded-full blur-3xl animate-pulse"></div>
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbXLrsOj2NzaeCpebyNiwNu47cYEnHIKuQxVMGaoa7q7_nKhI7or3yna4B3hJhV2MabwBgs3f8n3d4VfFswtUsi31WlySxGdNYa4uFeytmSb_7zJku9PUeULrQYvEfIN5koE_ZguYFGG_r_pSY_EEypeJ7ROIcqnyaHiNtwnaH3wm1lANLSm3N1GXS-klHrosX6feUfCfFwHvQZy6SMlAv86Oc07v6IsRlYXexH8HkOjHKS-BDYrkyTuJLKOyQPagmGvljsEZD67RUtw" 
              alt="Dompet App Logo" 
              className="w-auto h-20 sm:h-28 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(127,232,164,0.4)]"
            />
          </div>
          <h1 className="font-['Manrope',sans-serif] text-3xl sm:text-4xl font-bold text-center flex items-center gap-2 tracking-tight">
            <span className="text-[#e0e3e5]">Dompet</span>
            <span className="text-[#00e3fd]">App</span>
          </h1>
        </div>

        {/* Login/Register Form Card */}
        <form 
          onSubmit={handleSubmit}
          className="w-full flex flex-col gap-6 bg-[#101415]/80 rounded-2xl border border-[#1a2b4c]/60 backdrop-blur-md shadow-2xl relative p-6 sm:p-10"
        >
          {/* Bevel Edge Simulation */}
          <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none"></div>

          <div className="flex flex-col gap-5">
            {/* Username */}
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-0 top-3 text-[#c5c6cf] group-focus-within:text-[#00e3fd] transition-colors">
                person
              </span>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username" 
                required
                autoCapitalize="none"
                autoCorrect="off"
                className="w-full bg-transparent border-0 border-b-2 border-[#44474e] pl-10 py-3 text-[#e0e3e5] focus:outline-none focus:ring-0 focus:border-b-[#00E5FF] transition-all font-['Work_Sans',sans-serif] placeholder-[#c5c6cf]/50 text-sm sm:text-base"
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-0 top-3 text-[#c5c6cf] group-focus-within:text-[#00e3fd] transition-colors">
                lock
              </span>
              <input 
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" 
                required
                className="w-full bg-transparent border-0 border-b-2 border-[#44474e] pl-10 pr-8 py-3 text-[#e0e3e5] focus:outline-none focus:ring-0 focus:border-b-[#00E5FF] transition-all font-['Work_Sans',sans-serif] placeholder-[#c5c6cf]/50 text-sm sm:text-base"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-3 text-[#c5c6cf] hover:text-[#e0e3e5] transition-colors"
              >
                <span className="material-symbols-outlined text-sm">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            {/* Confirm Password */}
            {mode === 'register' && (
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-0 top-3 text-[#c5c6cf] group-focus-within:text-[#00e3fd] transition-colors">
                  lock_reset
                </span>
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi Password" 
                  required
                  className="w-full bg-transparent border-0 border-b-2 border-[#44474e] pl-10 py-3 text-[#e0e3e5] focus:outline-none focus:ring-0 focus:border-b-[#00E5FF] transition-all font-['Work_Sans',sans-serif] placeholder-[#c5c6cf]/50 text-sm sm:text-base"
                />
              </div>
            )}
          </div>

          {/* Alert Message Error */}
          {error && (
            <div className="flex items-center gap-2 bg-[#93000a]/30 border border-[#93000a] text-[#ffb4ab] text-xs px-3 py-2.5 rounded-lg">
              <span className="material-symbols-outlined text-base shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Action Section */}
          <div className="flex flex-col gap-4 mt-1">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#00E5FF] hover:bg-[#00daf3] disabled:opacity-50 text-[#101415] font-['Manrope',sans-serif] text-base sm:text-lg font-bold py-3.5 rounded-xl shadow-[0_4px_20px_rgba(0,229,255,0.25)] hover:shadow-[0_4px_30px_rgba(0,229,255,0.45)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              {loading ? 'Memproses...' : mode === 'login' ? 'Login' : 'Daftar'}
            </button>

            {/* Checkbox Remember Node */}
            {mode === 'login' && (
              <div className="flex items-center justify-center w-full px-2">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={rememberNode}
                    onChange={(e) => setRememberNode(e.target.checked)}
                    className="rounded border-[#44474e] bg-transparent text-[#00e3fd] focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                  />
                  <span className="font-['JetBrains_Mono',monospace] text-xs text-[#c5c6cf] group-hover:text-[#e0e3e5] transition-colors">
                    Remember Node
                  </span>
                </label>
              </div>
            )}

            {/* Toggle Mode Login / Register */}
            <div className="text-center mt-2">
              <p className="font-['JetBrains_Mono',monospace] text-xs text-[#c5c6cf]">
                {mode === 'login' ? (
                  <>
                    Belum punya akun?{' '}
                    <button 
                      type="button" 
                      onClick={() => { setMode('register'); setError(''); }} 
                      className="text-[#00e3fd] hover:text-[#b6c6f0] transition-colors underline underline-offset-2 font-semibold bg-transparent border-0 p-0 cursor-pointer"
                    >
                      Daftar di sini
                    </button>
                  </>
                ) : (
                  <>
                    Sudah punya akun?{' '}
                    <button 
                      type="button" 
                      onClick={() => { setMode('login'); setError(''); }} 
                      className="text-[#00e3fd] hover:text-[#b6c6f0] transition-colors underline underline-offset-2 font-semibold bg-transparent border-0 p-0 cursor-pointer"
                    >
                      Masuk di sini
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
