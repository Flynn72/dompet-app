import { supabase } from './supabaseClient';

// ============================================================
// Lapisan akses data untuk modul Assets (Task 3.3).
// Semua fungsi di sini murni membungkus supabase.from()/rpc() --
// tidak ada logic bisnis di sini (itu sudah di RPC Phase 2 / trigger
// Phase 2 di server), supaya komponen halaman tetap tipis.
// ============================================================

export async function fetchAssetAccounts(assetType) {
  const { data, error } = await supabase
    .from('asset_accounts')
    .select('*')
    .eq('asset_type', assetType)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function fetchAccountStats(assetAccountId) {
  const { data, error } = await supabase
    .rpc('get_asset_account_stats', { p_asset_account_id: assetAccountId })
    .single();
  if (error) throw error;
  return data;
}

export async function fetchAccountTransactions(assetAccountId) {
  const { data, error } = await supabase
    .from('asset_transactions')
    .select('*')
    .eq('asset_account_id', assetAccountId)
    .order('tx_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addAssetTransaction(payload) {
  // payload: { asset_account_id, action, units, price_at_tx, amount, tx_date, note }
  const { data, error } = await supabase.from('asset_transactions').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function deleteAssetTransaction(id) {
  const { error } = await supabase.from('asset_transactions').delete().eq('id', id);
  if (error) throw error;
}

export async function deactivateAssetAccount(id) {
  // Soft-delete: is_active=false, BUKAN hapus baris beneran -- supaya
  // riwayat transaksi (asset_transactions) yang sudah tercatat tetap
  // aman/tidak yatim-piatu, dan datanya masih bisa diaktifkan lagi
  // lewat SQL Editor kalau ternyata salah hapus.
  const { error } = await supabase.from('asset_accounts').update({ is_active: false }).eq('id', id);
  if (error) throw error;
}

export async function addAssetAccount(payload) {
  // payload: { user_id, asset_type, fund_id, name, goal_amount, goal_date, ... }
  const { data, error } = await supabase.from('asset_accounts').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function fetchMutualFunds() {
  const { data, error } = await supabase
    .from('mutual_funds')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function addMutualFund(payload) {
  // payload: { name, manager, category, provider }
  const { data, error } = await supabase.from('mutual_funds').insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function fetchCurrentPrice(assetAccountId) {
  const { data, error } = await supabase.rpc('get_current_price_for_account', {
    p_asset_account_id: assetAccountId,
  });
  if (error) throw error;
  return data;
}
