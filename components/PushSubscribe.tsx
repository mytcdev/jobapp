"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

function urlBase64ToUint8Array(base64: string) {
  const padded = base64.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4), "=",
  );
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

export default function PushSubscribe() {
  const { data: session } = useSession();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const role = session?.user?.role;
  const eligible = role === "user" || role === "client";

  useEffect(() => {
    if (!eligible || !("Notification" in window) || !("serviceWorker" in navigator)) return;
    setPermission(Notification.permission);

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setSubscribed(!!sub))
    );
  }, [eligible]);

  async function subscribe() {
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });

      await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setSubscribed(true);
    } catch {
      // silently fail — user may have denied
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  }

  if (!eligible || !("Notification" in window) || !("serviceWorker" in navigator)) return null;
  if (permission === "denied") return null;

  return (
    <div className="flex items-center gap-3 text-sm">
      {subscribed ? (
        <>
          <span className="text-gray-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Push notifications on
          </span>
          <button
            onClick={unsubscribe}
            disabled={loading}
            className="text-gray-400 hover:text-gray-700 underline text-xs disabled:opacity-50"
          >
            Turn off
          </button>
        </>
      ) : (
        <button
          onClick={subscribe}
          disabled={loading}
          className="flex items-center gap-2 border px-3 py-1.5 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {loading ? "Enabling…" : "Enable push notifications"}
        </button>
      )}
    </div>
  );
}
