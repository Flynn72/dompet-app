// ============================================================
// Serverless Function (dipicu Vercel/cron-job.org tiap 30 menit) untuk sinkronisasi
// harga Emas (digital & Logam Mulia fisik) & NAV Reksadana Syariah ke Supabase.
//
// SUMBER HARGA EMAS -- dua-duanya lewat https://logam-mulia-api.iamutaki.workers.dev
// (proyek open-source MIT, github.com/iamutaki/logam-mulia-api, gratis & TANPA API key):
//   1. Emas DIGITAL (asset_name 'gold_pluang', dipakai akun emas yang sudah ada -- Pluang dkk)
//      -> sumber "treasury" (platform emas digital, model bisnisnya sama kayak Pluang:
//      tracking harga spot + margin, bukan harga cetak fisik). Dulu sempat coba scrape
//      Pluang langsung (kena block 403 Cloudflare) lalu GoldAPI.io (butuh API key
//      berbayar/signup yang belum pernah beneran diisi) -- keduanya sudah ditinggalkan.
//   2. Logam Mulia FISIK Antam (asset_name 'gold_logam_mulia_antam', BELUM dipakai
//      akun manapun sekarang -- disimpan buat jaga-jaga kalau user nanti beli emas
//      batangan fisik dan bikin akun baru untuk itu)
//      -> sumber "logammulia" (situs resmi Logam Mulia/Antam)
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
      .select('created_at, updated_at')
      .eq('asset_name', 'gold_pluang')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const lastTs = lastRow?.created_at || lastRow?.updated_at;
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

  // Helper kecil dipakai 2x (emas digital & logam mulia) -- keduanya API yang sama,
  // beda cuma nama "source"-nya di URL dan asset_name tujuan penyimpanan di Supabase.
  async function fetchLogamMuliaApiPrice(sourceName) {
    const res2 = await fetch(`https://logam-mulia-api.iamutaki.workers.dev/api/prices/${sourceName}`);
    if (!res2.ok) throw new Error(`HTTP ${res2.status} dari logam-mulia-api (${sourceName})`);
    const json = await res2.json();
    if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
      throw new Error(`Response logam-mulia-api (${sourceName}) tidak sesuai format: ${JSON.stringify(json).slice(0, 300)}`);
    }
    const harga = json.data[0].sellPrice;
    if (!harga || harga < 100000) throw new Error(`Harga hasil API (${sourceName}) tidak masuk akal: ${harga}`);
    return { harga, raw: json.data[0] };
  }

  // ===== 1. Emas DIGITAL (dipakai akun Pluang dkk yang sudah ada) — sumber logammulia =====
  // RIWAYAT: sempat dicoba sumber "treasury" (platform emas digital) supaya beda dari
  // Logam Mulia fisik, tapi ternyata datanya SALAH SKALA (~Rp1,34jt, padahal harga emas
  // asli ~Rp2,3-2,5jt/gram -- hampir setengahnya), bikin akun user kelihatan rugi -47%
  // padahal tidak. Balik ke sumber "logammulia" yang sudah terbukti akurat, sampai ada
  // sumber emas-digital-spesifik lain yang terverifikasi benar datanya. Sementara ini
  // 'gold_pluang' dan 'gold_logam_mulia_antam' nyimpen angka yang SAMA PERSIS (satu kali
  // fetch, dua kali insert) -- redundan secara nilai, tapi sengaja dipertahankan sebagai
  // 2 baris/asset_name terpisah supaya gampang di-swap lagi nanti kalau ketemu sumber
  // emas-digital yang akurat, tanpa perlu ubah skema atau RPC yang sudah ada.
  try {
    const { harga, raw } = await fetchLogamMuliaApiPrice('logammulia');
    const rawPayload = { fetched_from: 'https://logam-mulia-api.iamutaki.workers.dev/api/prices/logammulia', response: raw };

    const { error: errDigital } = await supabaseAdmin.from('asset_prices').insert({
      asset_name: 'gold_pluang',
      price: harga,
      source: 'logam-mulia-api-logammulia',
      raw: rawPayload,
    });
    if (errDigital) throw errDigital;
    results.goldDigital = { success: true, price: harga };

    const { error: errFisik } = await supabaseAdmin.from('asset_prices').insert({
      asset_name: 'gold_logam_mulia_antam',
      price: harga,
      source: 'logam-mulia-api-logammulia',
      raw: rawPayload,
    });
    if (errFisik) throw errFisik;
    results.goldLogamMulia = { success: true, price: harga };

    console.log('[cron-sync-prices] Harga emas (logammulia) berhasil disimpan ke gold_pluang & gold_logam_mulia_antam:', harga);
  } catch (err) {
    console.error('[cron-sync-prices] Emas gagal:', err.message);
    if (!results.goldDigital) results.goldDigital = { success: false, error: err.message };
    if (!results.goldLogamMulia) results.goldLogamMulia = { success: false, error: err.message };
    results.errors.push(`Emas: ${err.message}`);
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
