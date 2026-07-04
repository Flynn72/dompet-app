import { createClient } from '@supabase/supabase-js';

// ============================================================
// PENTING: Ganti dua nilai di bawah ini dengan milik project
// Supabase Anda sendiri. Cara mendapatkannya:
// 1. Buka dashboard Supabase project Anda
// 2. Klik "Project Settings" (ikon gear) di sidebar kiri
// 3. Klik "API"
// 4. Copy "Project URL" -> tempel ke SUPABASE_URL
// 5. Copy "anon public" key -> tempel ke SUPABASE_ANON_KEY
// ============================================================

const SUPABASE_URL = 'https://bmbudqkqlhiwvjxibgpj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uhUdjLNqRRCoXd7eKFpBQg_0hKwnC9v';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Domain palsu untuk memetakan username -> email secara internal.
// User tidak akan pernah melihat ini; mereka hanya mengetik username.
export const USERNAME_DOMAIN = '@dompetapp.local';

export function usernameToEmail(username) {
  return username.trim().toLowerCase().replace(/\s+/g, '') + USERNAME_DOMAIN;
}
