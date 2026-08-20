/**
 * يحقن modulepreload لحزمة HomePage بعد البناء — يُسرّع LCP (p.hsh-lead) بلا استيراد
 * ساكن في main.tsx (محظور في tbt-split-worker-gate).
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const distDir = resolve(appRoot, "dist");
const indexPath = resolve(distDir, "index.html");

const assetsDir = resolve(distDir, "assets");
const files = await readdir(assetsDir);
const homeChunk = files.find(
  (f) =>
    f.endsWith(".js") &&
    !f.endsWith(".map") &&
    (/HomePage|HomeView|account.*Home/i.test(f) || f.includes("HomePage")),
);

if (!homeChunk) {
  console.warn("[inject-home-chunk-preload] لم تُعثر على حزمة HomePage — تخطّي");
  process.exit(0);
}

const preloadTag = `<link rel="modulepreload" crossorigin href="/assets/${homeChunk}">`;
let html = await readFile(indexPath, "utf8");

if (html.includes(homeChunk)) {
  console.log("[inject-home-chunk-preload] موجود مسبقاً:", homeChunk);
  process.exit(0);
}

if (/<link rel="modulepreload"[^>]*Home/i.test(html)) {
  console.log("[inject-home-chunk-preload] modulepreload Home موجود");
  process.exit(0);
}

const anchor = /<script type="module"/i;
if (!anchor.test(html)) {
  console.error("[inject-home-chunk-preload] لم يُعثر على script module في index.html");
  process.exit(1);
}

html = html.replace(anchor, `${preloadTag}\n    <script type="module"`);
await writeFile(indexPath, html, "utf8");
console.log("[inject-home-chunk-preload] ok:", homeChunk);
