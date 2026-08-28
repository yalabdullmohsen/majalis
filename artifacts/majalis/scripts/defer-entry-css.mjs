/**
 * يحوّل <link rel="stylesheet"> الحاجب في HTML المُنتَج إلى تحميل غير حاجب
 * (media="print" + onload) ويحقن CSS حجز CLS للشاشة الأولى.
 *
 * يُستورد من vite.config.ts ويُختبر مباشرة دون بناء.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CRITICAL_PATH = resolve(appRoot, "src/styles/critical-first-paint.css");
export const INLINE_CSS_BUDGET = 14 * 1024;

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
 * أي stylesheet بلا media (أو media=all) يصبح print+onload.
 * لا يُمسّ preload/modulepreload ولا ما له media غير all.
 */
export function deferStylesheets(html) {
  return html.replace(/<link\b[^>]*>/gi, (tag) => {
    if (!/\brel\s*=\s*["']stylesheet["']/i.test(tag)) return tag;
    if (/\bonload\s*=/i.test(tag)) return tag;
    const media = tag.match(/\bmedia\s*=\s*["']([^"']+)["']/i);
    if (media && media[1].trim().toLowerCase() !== "all") return tag;

    const withoutMedia = tag
      .replace(/\s*\/\s*>$/, "")
      .replace(/\s+media\s*=\s*["'][^"']*["']/i, "")
      .replace(/>$/, "")
      .trimEnd();
    const deferred = `${withoutMedia} media="print" onload="this.onload=null;this.media='all'">`;
    const noscriptInner = `${withoutMedia}>`;
    return `${deferred}<noscript>${noscriptInner}</noscript>`;
  });
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

function injectBuildCommit(html) {
  const commit =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.GIT_COMMIT ||
    "dev";
  return html.replace(/__MJ_BUILD_COMMIT__/g, commit);
}

export function deferEntryCssPlugin() {
  return {
    name: "majalis-defer-entry-css",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        return injectBuildCommit(applyEntryCssDefer(html));
      },
    },
  };
}
