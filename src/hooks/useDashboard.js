import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useDashboard(session) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [monthKey, setMonthKey] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (!session?.user?.id) return;
    fetchInitialData();
  }, [session, monthKey]);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const [txRes, catRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', session.user.id),
        supabase.from('categories').select('*').eq('user_id', session.user.id)
      ]);
      if (txRes.data) setTransactions(txRes.data);
      if (catRes.data) setCategories(catRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Ringkasan Keuangan
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const totalBalance = totalIncome - totalExpense;

  return {
    loading,
    transactions,
    categories,
    activeTab,
    setActiveTab,
    monthKey,
    setMonthKey,
    totalBalance,
    totalIncome,
    totalExpense,
    refetch: fetchInitialData
  };
}