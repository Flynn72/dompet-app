import { createClient } from '@supabase/supabase-js';

// ============================================================
// Serverless Function (dipicu Vercel Cron 1x sehari) untuk sinkronisasi
// harga Emas Antam ke Supabase.
//
// CATATAN: sinkronisasi NAV Reksadana lewat scraping Bareksa SUDAH DIHAPUS —
// fitur reksadana sekarang pakai rate tetap 5,3%/tahun yang dihitung
// langsung di frontend (Dashboard.jsx), tidak butuh data harian.
//
// ENV VARS yang wajib diisi di Vercel (Project Settings > Environment Variables):
// - SUPABASE_URL                -> URL project Supabase (sama seperti di supabaseClient.js)
// - SUPABASE_SERVICE_ROLE_KEY   -> "service_role" secret key (BUKAN anon key!),
//                                  ambil dari Supabase > Project Settings > API.
//                                  Ini WAJIB rahasia, jangan pernah dipakai di kode frontend.
// - CRON_SECRET                 -> harus Anda buat & set sendiri (string acak),
//                                  dipakai untuk verifikasi request ini benar dari Vercel Cron.
// ============================================================

export default async function handler(req, res) {
  // Pastikan request ini benar dari Vercel Cron (atau seseorang yang tahu CRON_SECRET),
  // bukan sembarang orang yang menembak endpoint ini langsung dari browser.
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum di-set di Environment Variables Vercel.' });
  }

  const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const results = { gold: null, errors: [] };

  // ===== Harga Emas Antam — lewat logam-mulia-api (komunitas, scraping resmi logammulia.com) =====
  try {
    const goldRes = await fetch('https://logam-mulia-api.iamutaki.workers.dev/api/prices/logammulia');
    if (!goldRes.ok) throw new Error(`HTTP ${goldRes.status} dari logam-mulia-api`);
    const goldJson = await goldRes.json();
    const goldData = goldJson?.data?.[0];
    if (!goldData || !goldData.sellPrice) throw new Error('Format response emas tidak sesuai / data kosong');

    const { error } = await supabaseAdmin.from('asset_prices').insert({
      asset_name: 'gold_antam',
      price: goldData.sellPrice,
      source: 'logam-mulia-api',
      raw: goldJson,
    });
    if (error) throw error;
    console.log('[cron-sync-prices] Harga emas berhasil disimpan:', goldData.sellPrice);
    results.gold = { success: true, price: goldData.sellPrice };
  } catch (err) {
    console.error('[cron-sync-prices] Emas gagal:', err.message);
    results.gold = { success: false, error: err.message };
    results.errors.push(`Emas: ${err.message}`);
  }

  const statusCode = results.errors.length === 0 ? 200 : 207;
  return res.status(statusCode).json(results);
}
