// Service worker: keeps the calendar working offline.
//  - the page itself: network first (so a new release is picked up as soon as you are online), cache as the fallback
//  - icons and the manifest: cache first
//  - everything on another site (the license check at Gumroad, for one) is left alone and goes straight to the network
// The cache name changes with every build, which throws away the previous release's copy.
const CACHE = "kb-calendar-{{BUILD}}";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("kb-calendar-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function pageFromNetwork(request) {
  const cache = await caches.open(CACHE);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response && response.ok) {
      cache.put("./index.html", response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match("./index.html", { ignoreSearch: true });
    return cached || new Response("Offline, and the calendar has not been saved on this device yet.", { status: 503 });
  }
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }
  if (request.mode === "navigate") {
    event.respondWith(pageFromNetwork(request));
    return;
  }
  event.respondWith(caches.match(request).then(hit => hit || fetch(request)));
});
