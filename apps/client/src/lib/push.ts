import { api } from './axios';

/**
 * VAPID Public Key from server environment.
 * Must match VAPID_PUBLIC_KEY in apps/server/.env
 */
const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BJDgKOcaUfpmNW_rw98mspNwNYEVxBKEZx36j5nZtRcgSuViGk0SiGlIm2F4xBRYMvSE67j8SY1P9BMElhlols4';

/**
 * Convert a base64 URL-safe string to a Uint8Array
 * (Required by pushManager.subscribe applicationServerKey)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Request permission and subscribe the browser to Web Push.
 * Sends the subscription to the server to be persisted.
 * Returns true if successfully subscribed.
 */
export async function subscribeToPush(): Promise<boolean> {
  try {
    // 1. Check browser support
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('⚠️ Push notifications are not supported in this browser.');
      return false;
    }

    // 2. Request user permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('⚠️ Push notification permission denied by user.');
      return false;
    }

    // 3. Get the active service worker registration
    const registration = await navigator.serviceWorker.ready;

    // 4. Subscribe to push via PushManager
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
    });

    // 5. Serialize and send subscription to our backend
    const serialized = subscription.toJSON() as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    await api.post('/notifications/subscribe', {
      endpoint: serialized.endpoint,
      keys: {
        p256dh: serialized.keys.p256dh,
        auth: serialized.keys.auth,
      },
    });

    console.log('✅ Web Push subscription saved successfully.');
    return true;
  } catch (err) {
    console.error('❌ Failed to subscribe to push notifications:', err);
    return false;
  }
}

/**
 * Unsubscribe the current browser from Web Push and
 * remove the subscription from the server.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator)) return false;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) return true; // Already unsubscribed

    // Remove from server first
    await api.delete('/notifications/unsubscribe', {
      data: { endpoint: subscription.endpoint },
    });

    // Then unsubscribe locally
    await subscription.unsubscribe();

    console.log('✅ Web Push subscription removed.');
    return true;
  } catch (err) {
    console.error('❌ Failed to unsubscribe from push notifications:', err);
    return false;
  }
}

/**
 * Check if the browser is currently subscribed to push notifications.
 */
export async function isPushSubscribed(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

/**
 * Check the current Notification permission status.
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}
