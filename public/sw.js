const CACHE = "kareerhub-v2";
const PRECACHE = ["/", "/jobs"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // Never intercept navigation requests — Next.js App Router needs
  // server-side auth checks and RSC rendering to work unobstructed.
  if (e.request.mode === "navigate") return;

  // Skip API, Next.js internals, and cross-origin requests.
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname.startsWith("/_next/")) return;
  if (url.origin !== self.location.origin) return;

  // Cache-first for static assets (icons, images, manifest).
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});

// ── Push notifications ────────────────────────────────────────────────────────

self.addEventListener("push", (e) => {
  let data = { title: "KareerHub", body: "You have a new notification.", url: "/notifications" };
  try { data = { ...data, ...e.data.json() }; } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { url: data.url },
      vibrate: [100, 50, 100],
    }).then(() =>
      // Tell all open tabs to refresh the unread count
      clients.matchAll({ type: "window" }).then((list) =>
        list.forEach((c) => c.postMessage({ type: "push" }))
      )
    )
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data?.url ?? "/notifications";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(self.location.origin) && "focus" in c);
      if (existing) return existing.focus().then((c) => c.navigate(url));
      return clients.openWindow(url);
    })
  );
});
