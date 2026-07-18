// ============================================================
// Serverless Function (dipicu Vercel Cron 1x sehari) untuk sinkronisasi
// harga Emas ke Supabase.
//
// SUMBER HARGA (update terakhir): sebelumnya pakai estimasi dari harga spot
// PAX Gold (CoinGecko) + spread asumsi. Sekarang diganti SCRAPE LANGSUNG dari
// halaman publik resmi Pluang (https://pluang.com/en/asset/gold) — harga yang
// benar-benar ditampilkan Pluang ke user, bukan estimasi/turunan lagi.
//
// CATATAN PENTING soal risiko: ini scraping HTML (bukan API resmi/didukung
// Pluang), jadi kalau Pluang mengubah struktur halamannya, regex pengambil
// harga di bawah bisa gagal (errornya akan kelihatan di response cron ini,
// harga lama di Supabase tidak akan tertimpa data salah). Kalau suatu saat
// gagal terus-menerus, cek dulu manual halaman https://pluang.com/en/asset/gold
// masih menampilkan format harga yang sama atau tidak.
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

  const { createClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const results = { gold: null, errors: [] };

  // ===== Harga Emas — scrape langsung dari halaman resmi Pluang =====
  try {
    const goldRes = await fetch('https://pluang.com/en/asset/gold', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DompetAppCron/1.0)' },
    });
    if (!goldRes.ok) throw new Error(`HTTP ${goldRes.status} dari halaman Pluang`);
    const html = await goldRes.text();

    // Harga muncul di <title>/meta og:title dengan format "...Rp2,351,508/g | Pluang"
    const match = html.match(/Rp([\d,]+)\/g/);
    if (!match) throw new Error('Format harga di halaman Pluang tidak ditemukan (mungkin struktur halaman berubah)');

    const hargaPluang = parseInt(match[1].replace(/,/g, ''), 10);
    if (!hargaPluang || hargaPluang < 100000) throw new Error(`Harga hasil scrape tidak masuk akal: ${hargaPluang}`);

    const { error } = await supabaseAdmin.from('asset_prices').insert({
      asset_name: 'gold_pluang',
      price: hargaPluang,
      source: 'pluang-scrape-asset-gold-page',
      raw: { scraped_from: 'https://pluang.com/en/asset/gold' },
    });
    if (error) throw error;
    console.log('[cron-sync-prices] Harga emas Pluang (scrape) berhasil disimpan:', hargaPluang);
    results.gold = { success: true, price: hargaPluang };
  } catch (err) {
    console.error('[cron-sync-prices] Emas gagal:', err.message);
    results.gold = { success: false, error: err.message };
    results.errors.push(`Emas: ${err.message}`);
  }

  const statusCode = results.errors.length === 0 ? 200 : 207;
  return res.status(statusCode).json(results);
}
