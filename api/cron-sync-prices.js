// ============================================================
// Serverless Function (dipicu Vercel Cron 1x sehari) untuk sinkronisasi
// harga Emas & NAV Reksadana Syariah ke Supabase.
//
// SUMBER HARGA EMAS: scrape langsung dari halaman publik resmi Pluang
// (https://pluang.com/en/asset/gold) — harga yang benar-benar ditampilkan
// Pluang ke user, bukan estimasi/turunan.
//
// SUMBER NAV REKSADANA (BARU): scrape dari https://akufrugal.com/reksadana/insight-money-syariah
// — NAV asli reksadana Insight Money Syariah (I-Money Syariah), BUKAN lagi
// simulasi rate tetap 5,3%/tahun. Total Return reksadana sekarang bisa
// naik-turun sesuai NAV asli, bukan cuma naik terus.
//
// CATATAN PENTING soal risiko kedua sumber ini: keduanya scraping HTML
// (bukan API resmi), jadi kalau situs sumbernya berubah struktur, regex
// pengambil harga bisa gagal (errornya kelihatan di response cron ini, harga
// lama di Supabase TIDAK akan tertimpa data salah). Khusus akufrugal.com,
// perlu diwaspadai juga: situs ini kadang tidak update NAV setiap hari
// (pernah ditemukan selisih ~2 bulan dari tanggal aktual) — jadi NAV reksadana
// di Dompet App bisa saja "diam" beberapa hari sampai situsnya update lagi.
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

  const results = { gold: null, reksadana: null, errors: [] };

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

  // ===== NAV Reksadana Insight Money Syariah — scrape dari akufrugal.com =====
  try {
    const rdRes = await fetch('https://akufrugal.com/reksadana/insight-money-syariah', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DompetAppCron/1.0)' },
    });
    if (!rdRes.ok) throw new Error(`HTTP ${rdRes.status} dari akufrugal.com`);
    const html = await rdRes.text();

    // NAV muncul paling konsisten di <title>/meta description dengan format Indonesia:
    // "Harga Reksadana Insight Money Syariah Hari Ini IDR = 1.763,22"
    // (regex sebelumnya nyari pola di teks body "adalah Rp...", tapi itu sering kepisah
    // tag HTML di antaranya sehingga gagal — title/meta description lebih polos & stabil)
    const match = html.match(/IDR\s*=\s*([\d.,]+)/);
    if (!match) throw new Error('Format NAV di halaman akufrugal.com tidak ditemukan (mungkin struktur halaman berubah)');

    // Format Indonesia: titik = pemisah ribuan, koma = desimal. Contoh "1.763,22" -> 1763.22
    const navReksadana = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
    if (!navReksadana || navReksadana < 100) throw new Error(`NAV hasil scrape tidak masuk akal: ${navReksadana}`);

    const { error } = await supabaseAdmin.from('asset_prices').insert({
      asset_name: 'reksadana_insight_syariah',
      price: navReksadana,
      source: 'akufrugal-scrape-insight-money-syariah',
      raw: { scraped_from: 'https://akufrugal.com/reksadana/insight-money-syariah' },
    });
    if (error) throw error;
    console.log('[cron-sync-prices] NAV Reksadana berhasil disimpan:', navReksadana);
    results.reksadana = { success: true, price: navReksadana };
  } catch (err) {
    console.error('[cron-sync-prices] Reksadana gagal:', err.message);
    results.reksadana = { success: false, error: err.message };
    results.errors.push(`Reksadana: ${err.message}`);
  }

  const statusCode = results.errors.length === 0 ? 200 : 207;
  return res.status(statusCode).json(results);
}
