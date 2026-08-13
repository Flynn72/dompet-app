// ============================================================
// Serverless Function (dipicu Vercel Cron 1x sehari) untuk sinkronisasi
// harga Emas & NAV Reksadana Syariah ke Supabase.
//
// SUMBER HARGA EMAS: scrape langsung dari halaman publik resmi Pluang
// (https://pluang.com/en/asset/gold) — harga yang benar-benar ditampilkan
// Pluang ke user, bukan estimasi/turunan.
//
// SUMBER NAV REKSADANA: scrape dari https://www.bareksa.com/id/data/reksadana/2024/insight-money-syariah
// — NAV asli reksadana Insight Money Syariah (I-Money Syariah) dari Bareksa, platform
// reksadana resmi. Sebelumnya pakai akufrugal.com, tapi ternyata datanya BEKU (berhenti
// update sejak 24 Mei 2026, terbukti dari label tanggal di halamannya sendiri) — Bareksa
// terbukti lebih rutin update.
//
// CATATAN PENTING soal risiko kedua sumber ini: keduanya scraping HTML
// (bukan API resmi), jadi kalau situs sumbernya berubah struktur, regex
// pengambil harga bisa gagal (errornya kelihatan di response cron ini, harga
// lama di Supabase TIDAK akan tertimpa data salah). Bareksa juga situs yang lebih
// besar/komersil dibanding akufrugal, jadi ada kemungkinan (walau belum pernah terjadi
// sejauh ini) suatu saat memblokir request otomatis seperti ini — kalau itu terjadi,
// error-nya akan kelihatan jelas di response cron (bukan silent fail).
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

  // ===== NAV Reksadana Insight Money Syariah — scrape dari Bareksa =====
  // Sebelumnya scrape dari akufrugal.com, tapi ternyata datanya BEKU (tidak update
  // sejak 24 Mei 2026, terbukti dari label "Tanggal Update" di halamannya sendiri).
  // Bareksa terbukti lebih update: return 1-bulan/YTD-nya beda & konsisten sama
  // tanggal terkini setiap dicek, tanda datanya memang hidup — meski Bareksa
  // sendiri tidak kasih label "terakhir update jam berapa" secara eksplisit,
  // jadi tetap tidak ada jaminan 100% update SETIAP hari.
  try {
    const rdRes = await fetch('https://www.bareksa.com/id/data/reksadana/2024/insight-money-syariah', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' },
    });
    if (!rdRes.ok) throw new Error(`HTTP ${rdRes.status} dari Bareksa`);
    const html = await rdRes.text();

    // NAV muncul di bawah heading "Nilai Aktiva Bersih/Unit", formatnya "1.779,01IDR"
    // (titik pemisah ribuan, koma desimal, langsung nempel "IDR" tanpa spasi).
    // Cari dalam jarak 300 karakter setelah heading-nya, biar tetap ketemu walau
    // ada tag HTML yang menyela di antara heading dan angkanya.
    const match = html.match(/Nilai Aktiva Bersih\/Unit[\s\S]{0,300}?([\d]{1,3}(?:\.\d{3})*,\d+)[\s\S]{0,30}?IDR/i);
    if (!match) throw new Error('Format NAV di halaman Bareksa tidak ditemukan (mungkin struktur halaman berubah, atau kena blokir bot)');

    // Format Indonesia: titik = pemisah ribuan, koma = desimal. Contoh "1.779,01" -> 1779.01
    const navReksadana = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
    if (!navReksadana || navReksadana < 100) throw new Error(`NAV hasil scrape tidak masuk akal: ${navReksadana}`);

    const { error } = await supabaseAdmin.from('asset_prices').insert({
      asset_name: 'reksadana_insight_syariah',
      price: navReksadana,
      source: 'bareksa-scrape-insight-money-syariah',
      raw: { scraped_from: 'https://www.bareksa.com/id/data/reksadana/2024/insight-money-syariah' },
    });
    if (error) throw error;
    console.log('[cron-sync-prices] NAV Reksadana (Bareksa) berhasil disimpan:', navReksadana);
    results.reksadana = { success: true, price: navReksadana };
  } catch (err) {
    console.error('[cron-sync-prices] Reksadana gagal:', err.message);
    results.reksadana = { success: false, error: err.message };
    results.errors.push(`Reksadana: ${err.message}`);
  }

  const statusCode = results.errors.length === 0 ? 200 : 207;
  return res.status(statusCode).json(results);
}
