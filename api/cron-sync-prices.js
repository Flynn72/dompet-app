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

  // ===== Harga Emas — API publik logam-mulia-api (bukan lagi scrape halaman Pluang) =====
  // RIWAYAT: sebelumnya scrape https://pluang.com/en/asset/gold langsung. Per [cek log Vercel
  // Cron], Pluang mulai balas HTTP 403 ke request dari server Vercel — sudah dicoba ganti
  // User-Agent jadi browser asli, tetap 403. Kesimpulannya ini blokir di level IP/ASN
  // datacenter (Cloudflare bot protection dkk), bukan sekadar soal header, jadi TIDAK bisa
  // diperbaiki dari sisi kita selama masih fetch langsung ke Pluang dari server Vercel.
  //
  // SOLUSI: pindah ke https://logam-mulia-api.iamutaki.workers.dev — proyek open-source
  // (MIT license, github.com/iamutaki/logam-mulia-api) yang menyediakan harga logam mulia
  // dari 18+ sumber dalam format JSON asli (bukan HTML yang perlu di-regex), di-hosting di
  // Cloudflare Workers. Kita pakai source "logammulia" (situs resmi Logam Mulia/Antam) biar
  // tetap merujuk ke harga emas fisik resmi, konsisten dengan semangat harga Pluang yang lama
  // (emas Pluang memang emas fisik Antam, per FAQ resmi Pluang).
  //
  // asset_name TETAP 'gold_pluang' (bukan diganti 'gold_logammulia') SENGAJA, supaya tidak
  // perlu ubah kode lain yang query berdasarkan asset_name ini (RPC get_current_price_for_account
  // dkk) — cuma field `source`/`raw` metadata yang mencerminkan sumber sebenarnya sekarang.
  try {
    const goldRes = await fetch('https://logam-mulia-api.iamutaki.workers.dev/api/prices/logammulia');
    if (!goldRes.ok) throw new Error(`HTTP ${goldRes.status} dari logam-mulia-api`);
    const json = await goldRes.json();

    if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
      throw new Error(`Response logam-mulia-api tidak sesuai format yang diharapkan: ${JSON.stringify(json).slice(0, 300)}`);
    }

    const hargaEmas = json.data[0].sellPrice;
    if (!hargaEmas || hargaEmas < 100000) throw new Error(`Harga hasil API tidak masuk akal: ${hargaEmas}`);

    const { error } = await supabaseAdmin.from('asset_prices').insert({
      asset_name: 'gold_pluang',
      price: hargaEmas,
      source: 'logam-mulia-api-logammulia',
      raw: { fetched_from: 'https://logam-mulia-api.iamutaki.workers.dev/api/prices/logammulia', response: json.data[0] },
    });
    if (error) throw error;
    console.log('[cron-sync-prices] Harga emas (logam-mulia-api) berhasil disimpan:', hargaEmas);
    results.gold = { success: true, price: hargaEmas };
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
    if (!match) {
      // DEBUG SEMENTARA: kalau regex gagal, catat potongan HTML yang beneran
      // diterima server (bukan nebak) -- supaya ketahuan pasti apakah Bareksa
      // ngasih halaman blokir/captcha ke request dari server Vercel, atau
      // sekadar strukturnya beda dari yang diharapkan regex.
      console.error('[cron-sync-prices] DEBUG - 1000 karakter pertama HTML yang diterima dari Bareksa:');
      console.error(html.slice(0, 1000));
      console.error('[cron-sync-prices] DEBUG - apakah ada teks "Nilai Aktiva Bersih" di HTML sama sekali?', html.includes('Nilai Aktiva Bersih'));
      throw new Error('Format NAV di halaman Bareksa tidak ditemukan (mungkin struktur halaman berubah, atau kena blokir bot) — lihat log DEBUG di atas untuk detail');
    }

    // Format Indonesia: titik = pemisah ribuan, koma = desimal. Contoh "1.779,01" -> 1779.01
    const navReksadana = parseFloat(match[1].replace(/\./g, '').replace(',', '.'));
    if (!navReksadana || navReksadana < 100) throw new Error(`NAV hasil scrape tidak masuk akal: ${navReksadana}`);

    // PENTING: fund_id WAJIB diisi, supaya baris harga ini tersambung ke
    // master data mutual_funds -- get_current_price_for_account() dan
    // get_asset_account_stats() (Phase 2) mencari harga BERDASARKAN fund_id,
    // bukan asset_name. Kalau fund_id kosong, akun Reksa Dana user akan
    // terus baca harga LAMA (baris terakhir yang fund_id-nya pernah diisi
    // manual) walau ada baris lebih baru masuk -- ini bug yang sempat
    // kejadian, sudah diperbaiki di sini.
    const { data: fundRow, error: fundLookupError } = await supabaseAdmin
      .from('mutual_funds')
      .select('id')
      .eq('name', 'Insight Money Syariah')
      .single();
    if (fundLookupError) throw new Error(`Gagal cari fund_id: ${fundLookupError.message}`);

    const { error } = await supabaseAdmin.from('asset_prices').insert({
      asset_name: 'reksadana_insight_syariah',
      fund_id: fundRow.id,
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
