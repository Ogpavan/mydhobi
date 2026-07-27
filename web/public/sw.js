const CACHE_VERSION = "v3";
const STATIC_CACHE = `dhobicart-static-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";

const PRECACHE_ASSETS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/logo.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== STATIC_CACHE)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(networkFirstAsset(request));
    return;
  }

  if (isStaticAsset(request, url)) {
    event.respondWith(cacheFirst(request));
  }
});

async function networkFirstNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    return (
      (await caches.match(OFFLINE_URL)) ??
      new Response("You are offline.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    );
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);

  if (response.ok && response.type === "basic") {
    cache.put(request, response.clone());
  }

  return response;
}

async function networkFirstAsset(request) {
  const cache = await caches.open(STATIC_CACHE);

  try {
    const response = await fetch(request);

    if (response.ok && response.type === "basic") {
      cache.put(request, response.clone());
    }

    return response;
  } catch {
    return (await cache.match(request)) ?? Response.error();
  }
}

function isStaticAsset(request, url) {
  return (
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/logo.png" ||
    url.pathname === "/login-illustration.png" ||
    url.pathname === "/manifest.webmanifest" ||
    request.destination === "font" ||
    request.destination === "image" ||
    request.destination === "script" ||
    request.destination === "style"
  );
}
