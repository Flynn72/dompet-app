import { PiggyBank, Coins, TrendingUp, Landmark, ScrollText } from 'lucide-react';
import { supabase } from './supabaseClient';

// ============================================================
// Daftar instrumen aset + penyimpanan pilihan user ("instrumen yang sudah ditambahkan").
// Dipakai bareng oleh halaman Aset (AssetsHome) dan kartu Aset di Dashboard
// (AssetsSummaryCard) supaya kedua tempat selalu konsisten.
//
// Aturan tampil: sebuah instrumen tampil kalau (a) ada barisnya di tabel
// asset_instruments (user pernah menambahkannya lewat "+ Tambah instrumen"), ATAU
// (b) sudah punya minimal 1 akun aktif di asset_accounts (jaring pengaman buat data
// lama, biar tidak ada akun yang "hilang" dari daftar).
// ============================================================

// Urutan tampil & urutan di pilihan "Tambah instrumen".
export const INSTRUMENT_ORDER = ['saving', 'gold', 'mutual_fund', 'deposit', 'bond'];

export const INSTRUMENT_META = {
  saving: { label: 'Tabungan', icon: PiggyBank, color: '#6FB7E8', to: '/aset/tabungan', desc: 'Dana darurat atau tabungan dengan target' },
  gold: { label: 'Emas', icon: Coins, color: '#F5C95D', to: '/aset/emas', desc: 'Emas digital atau logam mulia' },
  mutual_fund: { label: 'Reksa Dana', icon: TrendingUp, color: '#7FE8A4', to: '/aset/reksadana', desc: 'Pasar uang, pendapatan tetap, saham' },
  deposit: { label: 'Deposito', icon: Landmark, color: '#C99FE8', to: '/aset/deposito', desc: 'Simpanan berjangka dengan bunga tetap' },
  bond: { label: 'Obligasi', icon: ScrollText, color: '#F58FB0', to: '/aset/obligasi', desc: 'Surat utang dengan kupon rutin, mis. ORI, SBR, ST, SR' },
};

// Daftar asset_type yang sudah ditambahkan user. Kalau tabel belum ada (SQL belum
// dijalankan) atau query gagal, lempar error -- caller memutuskan mau fallback apa.
export async function fetchInstrumentTypes() {
  const { data, error } = await supabase.from('asset_instruments').select('asset_type');
  if (error) throw error;
  return (data || []).map((r) => r.asset_type);
}

export async function addInstrument(userId, assetType) {
  const payload = { asset_type: assetType };
  if (userId) payload.user_id = userId;
  const { error } = await supabase.from('asset_instruments').insert(payload);
  // 23505 = unique violation: instrumen ini sudah ada -> anggap sukses, bukan error.
  if (error && error.code !== '23505') throw error;
}

export async function removeInstrument(userId, assetType) {
  let q = supabase.from('asset_instruments').delete().eq('asset_type', assetType);
  if (userId) q = q.eq('user_id', userId);
  const { error } = await q;
  if (error) throw error;
}
