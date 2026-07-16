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
    console.log('[cron-sync-prices] Harga emas berhasil disimpan:', goldData.sellPrice);
    results.gold = { success: true, price: goldData.sellPrice };
  } catch (err) {
    console.error('[cron-sync-prices] Emas gagal:', err.message);
    results.gold = { success: false, error: err.message };
    results.errors.push(`Emas: ${err.message}`);
  }

  // ===== 2. NAV Reksadana Insight Money Syariah — scraping halaman Bareksa =====
  // CATATAN: ini scraping HTML (bukan API resmi), jadi lebih rapuh — kalau Bareksa
  // mengubah struktur halamannya, regex di bawah bisa gagal dan perlu diperbarui.
  try {
    const pageRes = await fetch('https://www.bareksa.com/id/data/reksadana/2024/insight-money-syariah', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    if (!pageRes.ok) throw new Error(`HTTP ${pageRes.status} dari Bareksa`);
    const html = await pageRes.text();
    console.log('[cron-sync-prices] Panjang HTML Bareksa diterima:', html.length, 'karakter');

    // Coba beberapa pola sekaligus, dari yang paling spesifik ke paling umum,
    // karena kita tidak selalu tahu persis struktur HTML asli (beda dari versi "dirender" browser).
    const patterns = [
      /Nilai Aktiva Bersih\/Unit[\s\S]{0,200}?([\d]{1,3}(?:\.\d{3})*,\d{2})\s*IDR/i, // label lengkap + IDR
      /Insight Money Syariah[\s\S]{0,200}?([\d]{1,3}(?:\.\d{3})*,\d{2})\s*IDR/i,     // nama produk + IDR
      /([\d]{1,3}(?:\.\d{3})*,\d{2})IDR/,                                          // angka nempel langsung ke "IDR" tanpa spasi
    ];
    let navStr = null;
    for (const p of patterns) {
      const m = html.match(p);
      if (m) { navStr = m[1]; break; }
    }
    if (!navStr) {
      console.error('[cron-sync-prices] Tidak ada pola yang cocok. Cuplikan HTML (2000 karakter pertama):', html.slice(0, 2000));
      throw new Error('Pola NAB tidak ditemukan di halaman — kemungkinan halaman butuh JavaScript untuk render datanya (bukan cuma HTML statis), atau struktur halaman Bareksa sudah berubah.');
    }

    const navValue = parseFloat(navStr.replace(/\./g, '').replace(',', '.'));
    if (!navValue || isNaN(navValue)) throw new Error(`Gagal parse angka NAB dari teks: "${navStr}"`);
    console.log('[cron-sync-prices] NAV reksadana ditemukan:', navValue);

    const { error } = await supabaseAdmin.from('asset_prices').insert({
      asset_name: 'reksadana_insight_money_syariah',
      price: navValue,
      source: 'bareksa-scrape',
      raw: { matchedText: navStr },
    });
    if (error) throw error;
    results.reksadana = { success: true, price: navValue };
  } catch (err) {
    console.error('[cron-sync-prices] Reksadana gagal:', err.message);
    results.reksadana = { success: false, error: err.message };
    results.errors.push(`Reksadana: ${err.message}`);
  }

  // 200 kalau semua berhasil, 207 (partial) kalau salah satu gagal —
  // supaya bisa dipantau lewat log Vercel tanpa satu kegagalan menutupi yang lain.
  const statusCode = results.errors.length === 0 ? 200 : 207;
  return res.status(statusCode).json(results);
}
