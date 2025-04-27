// app/lib/push.ts

export function urlBase64ToUint8Array(base64: string) {
    const pad = "=".repeat((4 - base64.length % 4) % 4);
    const raw = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
    return Uint8Array.from(atob(raw), c => c.charCodeAt(0));
  }
  
  export async function subscribePush() {
    console.log('[Push] subscribePush() start');
    console.log('[Push] SW supported?', !!navigator.serviceWorker);
    console.log('[Push] PushManager supported?', !!window.PushManager);
    if (!navigator.serviceWorker || !window.PushManager) {
      console.log('[Push] Early return: SW or PushManager not supported');
      return;
    }
  
    const reg = await navigator.serviceWorker.ready;
    console.log('[Push] serviceWorker ready:', reg);
  
    const perm = await Notification.requestPermission();
    console.log('[Push] Notification permission:', perm);
    if (perm !== 'granted') {
      console.log('[Push] Early return: Notification permission not granted');
      return;
    }
  
    let sub;
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });
      console.log('[Push] pushManager.subscribe() success:', sub);
    } catch (err) {
      console.error('[Push] pushManager.subscribe() error:', err);
      return;
    }
  
    try {
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ subscription: sub }),
      });
      console.log('[Push] subscribe API response:', res.status, await res.text());
    } catch (err) {
      console.error('[Push] subscribe API request error:', err);
    }
  }
  
  export async function unsubscribePush() {
    console.log('[Push] unsubscribePush() start');
    const reg = await navigator.serviceWorker.ready;
    console.log('[Push] serviceWorker ready for unsubscribe:', reg);
  
    const sub = await reg.pushManager.getSubscription();
    console.log('[Push] existing subscription:', sub);
    if (!sub) {
      console.log('[Push] Early return: no existing subscription');
      return;
    }
  
    try {
      const res = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      console.log('[Push] unsubscribe API response:', res.status, await res.text());
    } catch (err) {
      console.error('[Push] unsubscribe API request error:', err);
    }
  }
  