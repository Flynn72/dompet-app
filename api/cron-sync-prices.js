// ============================================================
// Serverless Function (dipicu Vercel/cron-job.org tiap 30 menit) untuk sinkronisasi
// harga Emas (digital & Logam Mulia fisik) & NAV Reksadana Syariah ke Supabase.
//
// SUMBER HARGA EMAS:
//   1. Emas DIGITAL (asset_name 'gold_pluang', dipakai akun emas Pluang di Dompet)
//      -> scrape halaman publik https://pluang.com/en/asset/gold LEWAT proxy ScraperAPI
//      (butuh env var SCRAPERAPI_KEY). Request langsung dari server Vercel ke Pluang kena
//      HTTP 403, jadi dilewatkan proxy supaya IP-nya beda. Kuota proxy terbatas, makanya
//      di-throttle (lihat PLUANG_PROXY_INTERVAL_MIN di bawah). Kalau proxy gagal/dilewati,
//      TIDAK ada baris baru ke gold_pluang -- harga terakhir dipertahankan (sengaja tidak
//      diisi harga Logam Mulia supaya grafik tidak campur 2 sumber beda).
//   2. Logam Mulia FISIK Antam (asset_name 'gold_logam_mulia_antam', BELUM dipakai akun
//      manapun -- disimpan buat jaga-jaga kalau nanti beli emas batangan)
//      -> https://logam-mulia-api.iamutaki.workers.dev (open-source, gratis, tanpa API key)
//      sumber "logammulia".
//
// SUMBER NAV REKSADANA: scrape dari https://www.bareksa.com/id/data/reksadana/2024/insight-money-syariah
// — NAV asli reksadana Insight Money Syariah (I-Money Syariah) dari Bareksa, platform
// reksadana resmi. Sebelumnya pakai akufrugal.com, tapi ternyata datanya BEKU (berhenti
// update sejak 24 Mei 2026, terbukti dari label tanggal di halamannya sendiri) — Bareksa
// terbukti lebih rutin update.
//
// CATATAN PENTING soal risiko: NAV Reksadana masih scraping HTML (bukan API resmi),
// jadi kalau Bareksa berubah struktur atau mulai nge-block, errornya kelihatan jelas di
// response cron ini (harga lama di Supabase TIDAK akan tertimpa data salah). Harga emas
// sekarang sudah lebih aman karena pakai JSON API asli, bukan scraping.
//
// ENV VARS yang wajib diisi di Vercel (Project Settings > Environment Variables):
// - SUPABASE_URL                -> URL project Supabase (sama seperti di supabaseClient.js)
// - SUPABASE_SERVICE_ROLE_KEY   -> "service_role" secret key (BUKAN anon key!),
//                                  ambil dari Supabase > Project Settings > API.
//                                  Ini WAJIB rahasia, jangan pernah dipakai di kode frontend.
// - CRON_SECRET                 -> harus Anda buat & set sendiri (string acak),
//                                  dipakai untuk verifikasi request ini benar dari Vercel Cron.
// ============================================================

// Proxy scraping bisa butuh >10 detik (default timeout Vercel Hobby) -- naikkan batasnya.
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum di-set di Environment Variables Vercel.' });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Endpoint ini boleh dipanggil oleh 2 jalur:
  // (1) Vercel/cron-job.org yang tahu CRON_SECRET (jalur otomatis tiap 30 menit)
  // (2) User Dompet App yang sudah login, lewat tombol "Refresh harga" manual di UI —
  //     diverifikasi pakai access token Supabase-nya sendiri (BUKAN CRON_SECRET, itu
  //     rahasia server yang tidak boleh pernah dikirim ke browser).
  const authHeader = req.headers.authorization || '';
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '');
  const isCronRequest = process.env.CRON_SECRET && bearerToken === process.env.CRON_SECRET;
  let isManualUserRequest = false;

  if (!isCronRequest) {
    const { data: userData, error: userError } = bearerToken
      ? await supabaseAdmin.auth.getUser(bearerToken)
      : { data: null, error: new Error('no token') };
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    isManualUserRequest = true;
  }

  // Cooldown KHUSUS buat trigger manual (bukan cron) — cegah spam klik tombol refresh
  // yang bisa membebani sumber data pihak ketiga tanpa perlu. Cron tetap jalan normal
  // tiap 30 menit terlepas dari cooldown ini.
  if (isManualUserRequest) {
    const COOLDOWN_MS = 3 * 60 * 1000; // 3 menit
    const { data: lastRow } = await supabaseAdmin
      .from('asset_prices')
      .select('updated_at')
      .eq('asset_name', 'gold_logam_mulia_antam')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const lastTs = lastRow?.updated_at;
    if (lastTs) {
      const ageMs = Date.now() - new Date(lastTs).getTime();
      if (ageMs < COOLDOWN_MS) {
        const waitSeconds = Math.ceil((COOLDOWN_MS - ageMs) / 1000);
        return res.status(429).json({
          error: 'cooldown',
          message: `Harga baru saja di-update. Coba lagi dalam ${waitSeconds} detik.`,
          waitSeconds,
        });
      }
    }
  }

  const results = { goldDigital: null, goldLogamMulia: null, reksadana: null, errors: [] };

  // ===== 1. Emas DIGITAL (gold_pluang) — scrape Pluang lewat ScraperAPI =====
  // Throttle supaya kuota proxy tidak habis: free plan ScraperAPI cuma 1.000 credit/bulan,
  // dan situs di balik proteksi bot (Cloudflare dkk) bisa makan ~10+ credit per request.
  // Default 480 menit (3x sehari). Bisa diubah lewat env var PLUANG_PROXY_INTERVAL_MIN.
  // Trigger manual (tombol Refresh) boleh lebih sering, tapi tetap dibatasi 60 menit.
  const PLUANG_PROXY_INTERVAL_MIN = Number(process.env.PLUANG_PROXY_INTERVAL_MIN) || 480;
  const MANUAL_MIN_INTERVAL_MIN = 60;
  try {
    if (!process.env.SCRAPERAPI_KEY) {
      throw new Error('SCRAPERAPI_KEY belum di-set di Environment Variables Vercel (harga Pluang dilewati)');
    }

    const minIntervalMin = isManualUserRequest
      ? Math.min(PLUANG_PROXY_INTERVAL_MIN, MANUAL_MIN_INTERVAL_MIN)
      : PLUANG_PROXY_INTERVAL_MIN;

    const { data: lastPluang, error: lastPluangErr } = await supabaseAdmin
      .from('asset_prices')
      .select('*')
      .eq('asset_name', 'gold_pluang')
      .eq('source', 'pluang-via-scraperapi')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastPluangErr) throw new Error(`Gagal cek riwayat harga Pluang (kolom timestamp asset_prices dipakai: updated_at): ${lastPluangErr.message}`);

    const lastPluangTs = lastPluang ? lastPluang.updated_at : null;
    if (lastPluang && !lastPluangTs) throw new Error('Tidak bisa baca timestamp baris harga Pluang terakhir (dilewati demi hemat kuota)');
    const ageMin = lastPluangTs ? (Date.now() - new Date(lastPluangTs).getTime()) / 60000 : Infinity;

    if (ageMin < minIntervalMin) {
      const msg = `dilewati (hemat kuota proxy): harga Pluang terakhir ${Math.round(ageMin)} menit lalu, interval minimum ${minIntervalMin} menit`;
      console.log('[cron-sync-prices] Emas Pluang', msg);
      results.goldDigital = { success: true, skipped: true, reason: msg };
    } else {
      const target = 'https://pluang.com/en/asset/gold';
      // SCRAPERAPI_EXTRA_PARAMS (opsional) buat eskalasi kalau proxy biasa masih diblok,
      // mis. "&premium=true" -- HATI-HATI: makin mahal credit per request.
      const proxyUrl = `https://api.scraperapi.com/?api_key=${encodeURIComponent(process.env.SCRAPERAPI_KEY)}&url=${encodeURIComponent(target)}${process.env.SCRAPERAPI_EXTRA_PARAMS || ''}`;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 50000);
      let html;
      try {
        const r = await fetch(proxyUrl, { signal: controller.signal });
        if (!r.ok) throw new Error(`HTTP ${r.status} dari ScraperAPI`);
        html = await r.text();
      } catch (e) {
        throw new Error(e.name === 'AbortError' ? 'ScraperAPI timeout (>50 detik)' : e.message);
      } finally {
        clearTimeout(timer);
      }

      // Harga ada di <title>: "...Global Gold Price: Rp2,398,445/g | Pluang". Cari di title dulu,
      // baru di seluruh HTML sebagai cadangan. Regex longgar: titik/koma sebagai pemisah ribuan.
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : '';
      const pricePattern = /Rp\s?([\d.,]+)\s?\/\s?g/i;
      const m = title.match(pricePattern) || html.match(pricePattern);
      if (!m) {
        const challenge = /just a moment|attention required|cf-chl|captcha/i.test(html);
        throw new Error(`Harga tidak ditemukan di halaman Pluang${challenge ? ' (kena halaman tantangan bot/captcha)' : ''}; title="${title.slice(0, 120)}"`);
      }
      const hargaPluang = parseInt(m[1].replace(/[^\d]/g, ''), 10);
      if (!hargaPluang || hargaPluang < 500000 || hargaPluang > 20000000) {
        throw new Error(`Harga Pluang hasil scrape tidak masuk akal: ${hargaPluang}`);
      }

      const { error } = await supabaseAdmin.from('asset_prices').insert({
        asset_name: 'gold_pluang',
        price: hargaPluang,
        source: 'pluang-via-scraperapi',
        raw: { fetched_from: target, title },
      });
      if (error) throw error;
      console.log('[cron-sync-prices] Harga emas Pluang (via ScraperAPI) berhasil disimpan:', hargaPluang);
      results.goldDigital = { success: true, price: hargaPluang };
    }
  } catch (err) {
    console.error('[cron-sync-prices] Emas Pluang gagal:', err.message);
    results.goldDigital = { success: false, error: err.message };
    results.errors.push(`Emas Pluang: ${err.message}`);
  }

  // ===== 2. Logam Mulia FISIK Antam (jaga-jaga, belum dipakai akun manapun) =====
  try {
    const lmRes = await fetch('https://logam-mulia-api.iamutaki.workers.dev/api/prices/logammulia');
    if (!lmRes.ok) throw new Error(`HTTP ${lmRes.status} dari logam-mulia-api`);
    const json = await lmRes.json();
    if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
      throw new Error(`Response logam-mulia-api tidak sesuai format: ${JSON.stringify(json).slice(0, 300)}`);
    }
    const harga = json.data[0].sellPrice;
    if (!harga || harga < 100000) throw new Error(`Harga hasil API tidak masuk akal: ${harga}`);

    const { error } = await supabaseAdmin.from('asset_prices').insert({
      asset_name: 'gold_logam_mulia_antam',
      price: harga,
      source: 'logam-mulia-api-logammulia',
      raw: { fetched_from: 'https://logam-mulia-api.iamutaki.workers.dev/api/prices/logammulia', response: json.data[0] },
    });
    if (error) throw error;
    console.log('[cron-sync-prices] Harga Logam Mulia Antam berhasil disimpan:', harga);
    results.goldLogamMulia = { success: true, price: harga };
  } catch (err) {
    console.error('[cron-sync-prices] Logam Mulia Antam gagal:', err.message);
    results.goldLogamMulia = { success: false, error: err.message };
    results.errors.push(`Logam Mulia Antam: ${err.message}`);
  }

  // ===== NAV Reksadana Insight Money Syariah — scrape dari Bareksa =====
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
