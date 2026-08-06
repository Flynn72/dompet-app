import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import AuthPage from './pages/AuthPage';
import Dashboard from './Dashboard'; 
import AdminPanel from './pages/AdminPanel';
import StartupLoading from './components/Loading/StartupLoading';

export default function App() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  async function checkAdmin(userId) {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error('[App] Gagal ambil profil user:', error.message);
    }

    return data?.is_admin ?? false;
  }

  async function handleSession(s) {
    setSession(s);

    if (s?.user) {
      const { error } = await supabase.rpc(
        "update_last_login",
        {
          user_id: s.user.id
        }
      );

      if (error) {
        console.error('[App] Gagal update last_login:', error.message);
      }

      const admin = await checkAdmin(s.user.id);
      setIsAdmin(admin);
    } else {
      setIsAdmin(false);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      handleSession(s).finally(() => setChecking(false));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      handleSession(s);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  // Menampilkan StartupLoading komponen Tailwind menggantikan indikator inline bawaan
  if (checking) {
    return <StartupLoading message="Memuat Dompet App..." />;
  }

  if (!session) {
    return <AuthPage onAuthSuccess={() => {}} />;
  }

  if (isAdmin) {
    return <AdminPanel user={session.user} onLogout={handleLogout} />;
  }

  return (
    <Dashboard 
      session={session} 
      user={session.user} 
      onLogout={handleLogout} 
    />
  );
}
