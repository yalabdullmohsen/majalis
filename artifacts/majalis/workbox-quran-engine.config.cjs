/**
 * Workbox generateSW config for Quran Engine offline shell.
 *
 * Build (optional):
 *   npx workbox-cli generateSW workbox-quran-engine.config.cjs
 *
 * The generated SW precaches the app shell and applies runtime caching
 * for mushaf JSON / fonts. User data stays in IndexedDB (DatabaseManager).
 */
module.exports = {
  globDirectory: "dist/",
  globPatterns: [
    "**/*.{js,css,html,svg,png,woff2,webmanifest,json}",
  ],
  swDest: "dist/quran-engine-sw.js",
  skipWaiting: true,
  clientsClaim: true,
  navigateFallback: "/index.html",
  navigateFallbackAllowlist: [/^\/quran-engine/],
  runtimeCaching: [
    {
      urlPattern: ({ url }) =>
        url.pathname.startsWith("/data/quran") ||
        url.pathname.startsWith("/data/quran-v2") ||
        url.pathname.startsWith("/fonts/"),
      handler: "CacheFirst",
      options: {
        cacheName: "quran-engine-static-v1",
        expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      urlPattern: ({ url }) =>
        url.hostname.includes("everyayah.com") ||
        url.hostname.includes("mp3quran.net") ||
        url.hostname.includes("api.alquran.cloud"),
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "quran-engine-cdn-v1",
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
  ],
};
