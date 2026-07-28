/**
 * Quran Engine service worker — Workbox CDN runtime strategies.
 *
 * Register (prod):
 *   navigator.serviceWorker.register('/quran-engine-sw.js')
 *
 * Note: The platform already ships `/sw.js`. This file is a focused SW for the
 * Quran Engine surface and can be merged into the main SW later.
 */
/* eslint-disable no-undef */
importScripts("https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js");

self.skipWaiting();
workbox.core.clientsClaim();

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

workbox.routing.registerRoute(
  ({ request }) => request.mode === "navigate",
  new workbox.strategies.NetworkFirst({
    cacheName: "quran-engine-pages",
    networkTimeoutSeconds: 4,
  }),
);

workbox.routing.registerRoute(
  ({ url }) =>
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/data/quran") ||
      url.pathname.startsWith("/data/quran-v2") ||
      url.pathname.startsWith("/fonts/")),
  new workbox.strategies.CacheFirst({
    cacheName: "quran-engine-static-v1",
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 800,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  }),
);

workbox.routing.registerRoute(
  ({ url }) =>
    /everyayah\.com|mp3quran\.net|api\.alquran\.cloud/.test(url.hostname),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: "quran-engine-cdn-v1",
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 7,
      }),
    ],
  }),
);
