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
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", userId)
    .single();

  console.log("PROFILE :", data);
  console.log("ERROR :", error);

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
      console.log("RPC Error:", error);
    }

    const admin = await checkAdmin(s.user.id);

    console.log("User ID:", s.user.id);
    console.log("User Email:", s.user.email);
    console.log("isAdmin:", admin);

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
    return (
      <div style={{ minHeight: '100vh', background: '#0B0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#7FE8A4', animation: 'pulse 1.2s ease-in-out infinite' }} />
        <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
      </div>
    );
  }

if (!session) {
  return <AuthPage onAuthSuccess={() => {}} />;
}

if (isAdmin) {
  return <AdminPanel user={session.user} onLogout={() => setSession(null)} />;
}

return <Dashboard user={session.user} onLogout={() => setSession(null)} />;
};
