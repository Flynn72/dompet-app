import { createClient } from '@supabase/supabase-js';

// ============================================================
// Serverless Function (dipicu Vercel Cron 1x sehari) untuk sinkronisasi
// harga Emas Antam & NAV Reksadana Insight Money Syariah ke Supabase.
//
// ENV VARS yang wajib diisi di Vercel (Project Settings > Environment Variables):
// - SUPABASE_URL                -> URL project Supabase (sama seperti di supabaseClient.js)
// - SUPABASE_SERVICE_ROLE_KEY   -> "service_role" secret key (BUKAN anon key!),
//                                  ambil dari Supabase > Project Settings > API.
//                                  Ini WAJIB rahasia, jangan pernah dipakai di kode frontend.
// - CRON_SECRET                 -> otomatis di-generate & di-set oleh Vercel begitu
//                                  ada entri "crons" di vercel.json, tidak perlu diisi manual.
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

  const results = { gold: null, reksadana: null, errors: [] };

  // ===== 1. Harga Emas Antam — lewat logam-mulia-api (komunitas, scraping logammulia.com) =====
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
    results.gold = { success: true, price: goldData.sellPrice };
  } catch (err) {
    results.gold = { success: false, error: err.message };
    results.errors.push(`Emas: ${err.message}`);
  }

  // ===== 2. NAV Reksadana Insight Money Syariah — scraping halaman Bareksa =====
  // CATATAN: ini scraping HTML (bukan API resmi), jadi lebih rapuh — kalau Bareksa
  // mengubah struktur halamannya, regex di bawah bisa gagal dan perlu diperbarui.
  try {
    const pageRes = await fetch('https://www.bareksa.com/id/data/reksadana/2024/insight-money-syariah', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DompetAppBot/1.0)' },
    });
    if (!pageRes.ok) throw new Error(`HTTP ${pageRes.status} dari Bareksa`);
    const html = await pageRes.text();

    // Cari pola "Nilai Aktiva Bersih/Unit" diikuti angka format Indonesia, mis. "1.772,41IDR"
    const match = html.match(/Nilai Aktiva Bersih\/Unit[\s\S]{0,80}?([\d.,]+)\s*IDR/i);
    if (!match) throw new Error('Pola NAB tidak ditemukan di halaman — kemungkinan struktur halaman Bareksa sudah berubah, perlu diperbarui regex-nya.');

    const navStr = match[1]; // contoh: "1.772,41"
    const navValue = parseFloat(navStr.replace(/\./g, '').replace(',', '.'));
    if (!navValue || isNaN(navValue)) throw new Error(`Gagal parse angka NAB dari teks: "${navStr}"`);

    const { error } = await supabaseAdmin.from('asset_prices').insert({
      asset_name: 'reksadana_insight_money_syariah',
      price: navValue,
      source: 'bareksa-scrape',
      raw: { matchedText: navStr },
    });
    if (error) throw error;
    results.reksadana = { success: true, price: navValue };
  } catch (err) {
    results.reksadana = { success: false, error: err.message };
    results.errors.push(`Reksadana: ${err.message}`);
  }

  // 200 kalau semua berhasil, 207 (partial) kalau salah satu gagal —
  // supaya bisa dipantau lewat log Vercel tanpa satu kegagalan menutupi yang lain.
  const statusCode = results.errors.length === 0 ? 200 : 207;
  return res.status(statusCode).json(results);
}
