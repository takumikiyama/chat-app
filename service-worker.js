/* public/service-worker.js */
/* global self, clients */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// ① インストール直後に即アクティブ、既存クライアントを制御下に
workbox.core.skipWaiting();
workbox.core.clientsClaim();

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

// プッシュ受信時のハンドラ
self.addEventListener('push', event => {
  const payload = event.data.json();
  console.log('[SW] push payload:', payload);

  const { type, chatId, title, body } = payload;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(winClients => {
      // ② 型と URL を厳密にチェック
      const inChat = winClients.some(c => {
        if (type !== 'message') return false;
        const url = new URL(c.url);
        return (
          url.pathname === `/chat/${chatId}` &&
          c.visibilityState === 'visible'
        );
      });

      if (inChat) {
        // 該当チャット画面を表示中 → 通知しない
        return;
      }

      // 通知を表示
      return self.registration.showNotification(title, {
        body,
        tag: type + (chatId || ''),
        data: payload,
      });
    })
  );
});

// 通知クリック時のハンドラ（そのまま）
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const { type, chatId } = event.notification.data;
  const targetUrl = type === 'match' ? '/notifications' : `/chat/${chatId}`;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(winClients => {
      for (const client of winClients) {
        if (new URL(client.url).pathname === targetUrl) {
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});