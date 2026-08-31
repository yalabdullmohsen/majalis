/**
 * يحوّل <link rel="stylesheet"> الحاجب في HTML المُنتَج إلى تحميل غير حاجب
 * (media="print" + script مُجزّأ بلا onload مضمّن — متوافق مع CSP بدون unsafe-hashes)
 * ويحقن CSS حجز CLS للشاشة الأولى.
 *
 * يُستورد من vite.config.ts ويُختبر مباشرة دون بناء.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CRITICAL_PATH = resolve(appRoot, "src/styles/critical-first-paint.css");
export const INLINE_CSS_BUDGET = 14 * 1024;

/** نص السكربت حرفياً — أي تغيير يتطلب تحديث hash في vercel.json CSP */
export const DEFER_CSS_BOOT_SCRIPT =
  "(function(){document.querySelectorAll('link[data-mj-css-defer]').forEach(function(l){function a(){l.media='all';l.removeAttribute('data-mj-css-defer')}if(l.sheet)a();else l.addEventListener('load',a);});})();";

export function deferCssBootScriptSha256() {
  return createHash("sha256").update(DEFER_CSS_BOOT_SCRIPT, "utf8").digest("base64");
}

export function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,])\s*/g, "$1")
    .trim();
}

export function readCriticalCss() {
  return minifyCss(readFileSync(CRITICAL_PATH, "utf8"));
}

/**
 * أي stylesheet بلا media (أو media=all) يصبح print + data-mj-css-defer.
 * لا يُمسّ preload/modulepreload ولا ما له media غير all.
 */
export function deferStylesheets(html) {
  let changed = false;
  const next = html.replace(/<link\b[^>]*>/gi, (tag) => {
    if (!/\brel\s*=\s*["']stylesheet["']/i.test(tag)) return tag;
    if (/\bdata-mj-css-defer\b/i.test(tag)) return tag;

    // ترحيل نمط onload القديم → data-attribute
    if (/\bonload\s*=/i.test(tag)) {
      changed = true;
      const cleaned = tag
        .replace(/\s*\/\s*>$/, "")
        .replace(/\s+onload\s*=\s*["'][^"']*["']/i, "")
        .replace(/>$/, "")
        .trimEnd();
      const withMedia = /\bmedia\s*=/i.test(cleaned)
        ? cleaned
        : `${cleaned} media="print"`;
      const deferred = /\bdata-mj-css-defer\b/i.test(withMedia)
        ? `${withMedia}>`
        : `${withMedia} data-mj-css-defer>`;
      const noscriptTag = `${cleaned
        .replace(/\s+media\s*=\s*["'][^"']*["']/i, "")
        .trimEnd()}>`;
      return `${deferred}<noscript>${noscriptTag}</noscript>`;
    }

    const media = tag.match(/\bmedia\s*=\s*["']([^"']+)["']/i);
    if (media && media[1].trim().toLowerCase() !== "all") return tag;

    changed = true;
    const withoutMedia = tag
      .replace(/\s*\/\s*>$/, "")
      .replace(/\s+media\s*=\s*["'][^"']*["']/i, "")
      .replace(/>$/, "")
      .trimEnd();
    const deferred = `${withoutMedia} media="print" data-mj-css-defer>`;
    const noscriptInner = `${withoutMedia}>`;
    return `${deferred}<noscript>${noscriptInner}</noscript>`;
  });

  if (!changed || next.includes('id="data-mj-css-boot"')) return next;
  const boot = `<script id="data-mj-css-boot">${DEFER_CSS_BOOT_SCRIPT}</script>`;
  return next.replace(/<\/head>/i, `    ${boot}\n  </head>`);
}

export function injectCriticalReserve(html, css = readCriticalCss()) {
  if (!css) return html;
  if (html.includes('id="mj-cls-reserve"')) {
    return html.replace(
      /<style id="mj-cls-reserve">[\s\S]*?<\/style>/,
      `<style id="mj-cls-reserve">${css}</style>`,
    );
  }
  const tag = `<style id="mj-cls-reserve">${css}</style>`;
  if (html.includes('id="mj-lcp-critical"')) {
    return html.replace(
      /(<style id="mj-lcp-critical">[\s\S]*?<\/style>)/,
      `$1\n    ${tag}`,
    );
  }
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

export function applyEntryCssDefer(html) {
  return deferStylesheets(injectCriticalReserve(html));
}

export function inlineStyleBytes(html) {
  let n = 0;
  for (const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    n += Buffer.byteLength(m[1], "utf8");
  }
  return n;
}

export function hasBlockingStylesheet(html) {
  const head = (html.split(/<\/head>/i)[0] || html).replace(
    /<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi,
    "",
  );
  return [...head.matchAll(/<link\b[^>]*>/gi)].some((m) => {
    const tag = m[0];
    if (!/\brel\s*=\s*["']stylesheet["']/i.test(tag)) return false;
    const media = tag.match(/\bmedia\s*=\s*["']([^"']+)["']/i);
    return !media || media[1].trim().toLowerCase() === "all";
  });
}

export function deferEntryCssPlugin() {
  return {
    name: "majalis-defer-entry-css",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        return applyEntryCssDefer(html);
      },
    },
  };
}
