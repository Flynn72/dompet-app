import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import AuthPage from './pages/AuthPage';
import Dashboard from './components/Dashboard';
import AdminPanel from './pages/AdminPanel';

export default function App() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  async function checkAdmin(userId) {
    if (!userId) return false;
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("is_admin")
        .eq("id", userId)
        .single();

      if (error) {
        console.error('[App] Gagal ambil profil user:', error.message);
        return false;
      }

      return data?.is_admin ?? false;
    } catch (err) {
      console.error('[App] Error checkAdmin:', err);
      return false;
    }
  }

  async function handleSession(s) {
    setSession(s);

    if (s?.user?.id) {
      const { error } = await supabase.rpc("update_last_login", {
        user_id: s.user.id
      });

      if (error) {
        console.error('[App] Gagal update last_login:', error.message);
      }

      const admin = await checkAdmin(s.user.id);
      setIsAdmin(admin);
    } else {
      setIsAdmin(false);
    }
  }

  async function handleLogout() {
    // 1. Reset state UI secara langsung untuk mencegah race condition/crash
    setSession(null);
    setIsAdmin(false);

    // 2. Clear token/kredensial supabase dari localStorage
    try {
      for (let key in localStorage) {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.error('[App] Clear localStorage error:', e);
    }

    // 3. Eksekusi signOut Supabase
    await supabase.auth.signOut();
  }

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (isMounted) {
        handleSession(s).finally(() => setChecking(false));
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      if (isMounted) {
        handleSession(s);
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#7FE8A4', animation: 'pulse 1.2s ease-in-out infinite' }} />
        <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
      </div>
    );
  }

  // Jika tidak ada session atau user
  if (!session?.user) {
    return <AuthPage onAuthSuccess={() => {}} />;
  }

  // Jika user adalah Admin
  if (isAdmin && session?.user) {
    return <AdminPanel user={session.user} onLogout={handleLogout} />;
  }

  // Jika user biasa
  return <Dashboard user={session.user} onLogout={handleLogout} />;
}
