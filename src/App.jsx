import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import AuthPage from './pages/AuthPage';
import AdminPanel from './pages/AdminPanel';
import AppShell from './components/AppShell';
import SplashScreen from './components/SplashScreen';

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

  if (checking) {
    return <SplashScreen />;
  }

if (!session) {
  return <AuthPage onAuthSuccess={() => {}} />;
}

if (isAdmin) {
  return <AdminPanel user={session.user} onLogout={async () => { await supabase.auth.signOut(); setSession(null); }} />;
}

return <AppShell user={session.user} onLogout={async () => { await supabase.auth.signOut(); setSession(null); }} />;
};
