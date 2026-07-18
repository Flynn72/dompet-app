import { createClient } from '@supabase/supabase-js';

// ============================================================
// Serverless Function (dipicu Vercel Cron 1x sehari) untuk sinkronisasi
// harga Emas ke Supabase.
//
// SUMBER HARGA (update): sebelumnya pakai logam-mulia-api (harga Emas Antam
// fisik). Sekarang diganti jadi ESTIMASI harga beli Emas Digital Pluang,
// dihitung dari harga spot PAX Gold (PAXG) via CoinGecko + spread estimasi
// Pluang, karena user investasi emasnya lewat aplikasi Pluang (digital),
// bukan Antam fisik — dua harga ini bisa beda cukup jauh.
//
// CATATAN PENTING soal akurasi: ini TETAP ESTIMASI, bukan harga resmi Pluang
// (Pluang tidak punya API publik). Spread 1.75% adalah asumsi kasar dan bisa
// meleset dari harga asli di app Pluang kapan saja. Kalau nanti ketemu selisih
// yang konsisten terlalu jauh, angka SPREAD_PLUANG di bawah tinggal disesuaikan.
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

const GRAM_PER_TROY_OUNCE = 31.1035;
const SPREAD_PLUANG = 0.0175; // estimasi spread beli Pluang di atas harga spot dunia (+1.75%)

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

  // ===== Harga Emas — estimasi Pluang, dari harga spot PAX Gold (PAXG) via CoinGecko =====
  try {
    const goldRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=idr');
    if (!goldRes.ok) throw new Error(`HTTP ${goldRes.status} dari CoinGecko`);
    const goldJson = await goldRes.json();
    const hargaSpotPerTroyOunce = goldJson?.['pax-gold']?.idr;
    if (!hargaSpotPerTroyOunce) throw new Error('Format response CoinGecko tidak sesuai / data kosong');

    const hargaSpotPerGram = hargaSpotPerTroyOunce / GRAM_PER_TROY_OUNCE;
    const estimasiHargaBeliPluang = Math.round(hargaSpotPerGram * (1 + SPREAD_PLUANG));

    const { error } = await supabaseAdmin.from('asset_prices').insert({
      asset_name: 'gold_pluang',
      price: estimasiHargaBeliPluang,
      source: 'coingecko-paxg-estimasi-pluang',
      raw: goldJson,
    });
    if (error) throw error;
    console.log('[cron-sync-prices] Estimasi harga emas Pluang berhasil disimpan:', estimasiHargaBeliPluang);
    results.gold = { success: true, price: estimasiHargaBeliPluang };
  } catch (err) {
    console.error('[cron-sync-prices] Emas gagal:', err.message);
    results.gold = { success: false, error: err.message };
    results.errors.push(`Emas: ${err.message}`);
  }

  const statusCode = results.errors.length === 0 ? 200 : 207;
  return res.status(statusCode).json(results);
}
