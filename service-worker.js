/* service-worker.js */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

workbox.core.skipWaiting();
workbox.core.clientsClaim();
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

// 今開いているチャットIDを保持する Set
const openChats = new Set();

// BroadcastChannel でチャット開閉イベントを受け取る
const bc = new BroadcastChannel('CHAT_STATUS');
bc.addEventListener('message', event => {
  const { type, chatId } = event.data;
  if (type === 'OPEN_CHAT') {
    openChats.add(chatId);
  } else if (type === 'CLOSE_CHAT') {
    openChats.delete(chatId);
  }
});

self.addEventListener('push', event => {
  const payload = event.data.json();
  console.log('[SW] push payload:', payload);
  const { type, chatId, title, body } = payload;

  event.waitUntil(
    // 「今開いているチャット」に対象 chatId が含まれていれば抑制
    (async () => {
      if (type === 'message' && openChats.has(chatId)) {
        console.log('[SW] suppress notification because chat is open:', chatId);
        return;
      }
      // 通知を表示
      return self.registration.showNotification(title, {
        body,
        tag: type + (chatId || ''),
        data: payload,
      });
    })()
  );
});

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