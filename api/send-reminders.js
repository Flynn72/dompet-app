// ============================================================
// Serverless Function — dipicu cron 1x sehari (jam 08:00 WIB) buat cek
// tagihan (recurring_transactions dengan notify_enabled = true) yang jatuh
// tempo H-7/H-3/H-1/Hari-H, lalu kirim Web Push Notification.
//
// SETUP YANG WAJIB DILAKUKAN DI VERCEL (Project Settings > Environment Variables):
// - SUPABASE_URL                -> sama seperti punya cron-sync-prices.js
// - SUPABASE_SERVICE_ROLE_KEY   -> sama seperti punya cron-sync-prices.js
// - CRON_SECRET                 -> boleh pakai yang sama dengan cron-sync-prices.js
// - VAPID_PUBLIC_KEY            -> BPXt-tipZMff068raKkiPUu9rb2Fyp30QgV9dAZ2ENztKZxMIADo-b6h4sAVCGcmaKT_jU85JXczEPM7EgWAfck
// - VAPID_PRIVATE_KEY           -> QR1bCv-XmEugnHw2vSLz1KlQ3ioODKG40mpfbSHKWAM
// - VAPID_SUBJECT                -> mailto:alamat-email-kamu@contoh.com (wajib format mailto: atau https:)
//
// PENTING: generate ulang VAPID key sendiri untuk production (jangan pakai contoh
// di atas apa adanya) -- lihat instruksi generate-nya di penjelasan chat.
// ============================================================

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    return res.status(500).json({ error: `Env var belum di-set: ${missing.join(', ')}` });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const webpush = (await import('web-push')).default;

  webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);

  const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const results = { checked: 0, sent: 0, skipped: 0, errors: [] };

  try {
    const { data: bills, error: billsErr } = await supabaseAdmin
      .from('recurring_transactions')
      .select('*')
      .eq('is_active', true)
      .eq('notify_enabled', true);

    if (billsErr) throw billsErr;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const bill of bills || []) {
      results.checked++;

      // Hitung tanggal jatuh tempo BULAN INI, dengan aturan yang sama seperti
      // generateDueRecurringTransactions() di Dashboard.jsx: kalau tanggalnya
      // lebih besar dari jumlah hari di bulan ini, dipakai tanggal terakhir bulan itu.
      const y = today.getFullYear();
      const m = today.getMonth();
      const lastDayOfMonth = new Date(y, m + 1, 0).getDate();
      const dueDay = Math.min(bill.day_of_month, lastDayOfMonth);
      const dueDate = new Date(y, m, dueDay);
      dueDate.setHours(0, 0, 0, 0);

      const diffDays = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));

      const daysBeforeList = bill.notify_days_before || [];
      if (!daysBeforeList.includes(diffDays)) {
        results.skipped++;
        continue;
      }

      // Cek supaya tidak kirim reminder yang SAMA 2x (idempotency)
      const dueDateStr = dueDate.toISOString().slice(0, 10);
      const { data: existingLog } = await supabaseAdmin
        .from('notification_log')
        .select('id')
        .eq('recurring_id', bill.id)
        .eq('notify_for_date', dueDateStr)
        .eq('days_before', diffDays)
        .maybeSingle();

      if (existingLog) {
        results.skipped++;
        continue;
      }

      const { data: subs, error: subsErr } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', bill.user_id);

      if (subsErr || !subs || subs.length === 0) {
        results.skipped++;
        continue;
      }

      const label = diffDays === 0 ? 'HARI INI' : `${diffDays} hari lagi`;
      const title = diffDays === 0 ? 'Tagihan Jatuh Tempo Hari Ini!' : 'Pengingat Tagihan';
      const body = `"${bill.note || 'Tagihan'}" sebesar Rp${Number(bill.amount).toLocaleString('id-ID')} jatuh tempo ${label}.`;

      const payload = JSON.stringify({
        title,
        body,
        icon: '/icon-192.png',
        url: '/',
        tag: `bill-${bill.id}`,
      });

      let sentToAny = false;
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
            },
            payload
          );
          sentToAny = true;
        } catch (pushErr) {
          // Subscription kedaluwarsa/tidak valid lagi (410 Gone) -> hapus dari DB
          if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
            await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
          } else {
            results.errors.push(`push ke ${bill.id}: ${pushErr.message}`);
          }
        }
      }

      if (sentToAny) {
        await supabaseAdmin.from('notification_log').insert({
          user_id: bill.user_id,
          recurring_id: bill.id,
          notify_for_date: dueDateStr,
          days_before: diffDays,
        });
        results.sent++;
      }
    }

    return res.status(results.errors.length > 0 ? 207 : 200).json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message, results });
  }
}
