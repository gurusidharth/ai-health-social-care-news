import { SUPABASE_URL, SUPABASE_ANON_KEY, VAPID_PUBLIC_KEY } from "@/lib/config";

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

// applicationServerKey must be a Uint8Array backed by a plain ArrayBuffer,
// but the VAPID public key is distributed as a URL-safe base64 string.
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  return navigator.serviceWorker.getRegistration("/sw.js").then((existing) => existing ?? navigator.serviceWorker.register("/sw.js"));
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

const authHeaders = {
  "Content-Type": "application/json",
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported() || !VAPID_PUBLIC_KEY) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const registration = await registerServiceWorker();
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    }));

  const json = subscription.toJSON();
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/push-subscribe`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  const subscription = await getCurrentSubscription();
  if (!subscription) return true;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();

  try {
    await fetch(`${SUPABASE_URL}/functions/v1/push-subscribe`, {
      method: "DELETE",
      headers: authHeaders,
      body: JSON.stringify({ endpoint }),
    });
  } catch {
    // The local unsubscribe already succeeded — a failed cleanup call just
    // leaves a stale row that notify-push will prune on its next 404/410.
  }
  return true;
}
