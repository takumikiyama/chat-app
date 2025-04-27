// app/lib/push.ts
export function urlBase64ToUint8Array(base64: string) {
    const pad = "=".repeat((4 - base64.length % 4) % 4);
    const raw = (base64 + pad).replace(/-/g, "+").replace(/_/g, "/");
    return Uint8Array.from(atob(raw), c => c.charCodeAt(0));
  }
  
  export async function subscribePush() {
    if (!navigator.serviceWorker || !PushManager) return;
    const reg = await navigator.serviceWorker.ready;
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return;
  
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      ),
    });
  
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ subscription: sub }),
    });
  }
  
  export async function unsubscribePush() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return;
  
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
  }