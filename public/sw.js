// ============================================================
// Service Worker — Dompet App Notification Engine (Phase 1)
// File ini WAJIB ada di /public/sw.js supaya browser bisa akses di
// https://<domain>/sw.js — jangan dipindah ke folder src/.
// ============================================================

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Menerima push notification dari server (dikirim lewat /api/send-reminders)
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Dompet App', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Dompet App';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' },
    tag: data.tag || undefined, // kalau ada tag sama, notifikasi lama ke-replace (hindari numpuk)
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Waktu notifikasi diklik — buka/fokus ke tab Dompet App yang sudah ada,
// atau buka tab baru kalau belum ada yang terbuka.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
