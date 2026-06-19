/* ═══════════════════════════════════════════════
   RESTART 27 — Service Worker
   Handles background push notifications
   Upload this file to the ROOT of your Netlify site
═══════════════════════════════════════════════ */

const CACHE_NAME = 'r27-v3';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// Handle push events (sent from server or Web Push API)
self.addEventListener('push', e => {
  const data = e.data?.json().catch(() => ({})) || {};
  const title = data.title || 'RESTART 27 ⚡';
  const body  = data.body  || 'You have a new notification.';
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:  '/icon-192.png',
      badge: '/icon-192.png',
      tag:   data.tag || 'r27-notif',
      requireInteraction: false,
      vibrate: [200, 100, 200]
    })
  );
});

// Handle notification click — open/focus the app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const appClient = list.find(c => c.url.includes(self.location.origin));
      if(appClient) return appClient.focus();
      return clients.openWindow('/');
    })
  );
});

// Streak reminder via periodic background sync (if supported)
self.addEventListener('periodicsync', e => {
  if(e.tag === 'streak-reminder') {
    e.waitUntil(checkStreakReminder());
  }
});

async function checkStreakReminder() {
  // Only notify if the user hasn't studied today
  // (App sets r27_lastStudy in cache when a session completes)
  const cache = await caches.open(CACHE_NAME);
  const res   = await cache.match('/__r27_streak');
  if(res) {
    const { date } = await res.json().catch(() => ({}));
    const today    = new Date().toDateString();
    if(date === today) return; // Already studied today
  }
  await self.registration.showNotification('RESTART 27 🔥', {
    body:    "Don't break your streak! Time to study 📚",
    icon:    '/icon-192.png',
    tag:     'streak-reminder',
    vibrate: [300, 100, 300]
  });
}
