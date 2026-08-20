#!/usr/bin/env node
/**
 * بوابة: مصدر واحد للإقلاع — أي معرّف محذوف خارج src/boot/ = فشل.
 * node scripts/verify-boot-single-source.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** معرّفات الطبقات القديمة — ممنوعة خارج src/boot/ */
const FORBIDDEN = [
  /mj-boot-skeleton/,
  /\bmj-sk-/,
  /mj-silent-splash/,
  /mj-home-lcp-static/,
  /mj-app-mount/,
  /mj-lcp-critical/,
  /mj-splash-critical/,
  /\bAppSplash\b/,
  /splash-screen\.ts/,
  /__mjSplashStart/,
  /__mjDismissSplash/,
  /mj\.silent-splash\.session/,
  /mj\.native-splash\.session/,
  /MajlisLaunchScreen/,
  /MajalisLaunchScreen/,
  /launch-intro\.ts/,
  /launch-readiness\.ts/,
];

/** مسموح في index.html فقط (نقطة تثبيت + bootstrap) */
const INDEX_ALLOW = [
  /id="mj-boot-layer"/,
  /id="mj-boot-critical"/,
  /__mjBootStart/,
  /__mjBootDismiss/,
  /mj\.boot\.session/,
  /mj-boot-sk-/,
  /mj-boot-native/,
  /mj-boot-web/,
  /mj-boot-layer--out/,
  /Capacitor\.isNativePlatform/,
  /MIN_MS\s*=\s*900/,
  /MAX_MS\s*=\s*1500/,
  /EXIT_MS\s*=\s*250/,
];

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  "seo-prerender",
  "lhci-reports",
  ".lighthouseci",
  "playwright-report",
  "test-results",
]);

const SKIP_PREFIXES = [
  "src/lib/__tests__/",
  "src/boot/boot.test.ts",
  "docs/",
  "ios/App/App/public/",
  "dist/",
  "seo-prerender/",
];

const SKIP_FILES = new Set([
  "scripts/verify-boot-single-source.mjs",
  "scripts/test-no-legacy-flash.mjs",
  "scripts/test-splash-timing.mjs",
  "docs/SPLASH_REPLACEMENT.md",
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(root, full).replace(/\\/g, "/");
    if (SKIP_DIRS.has(name)) continue;
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, out);
    } else if (/\.(html|tsx?|css|mjs|js|cjs|json|xml|java|storyboard|md)$/i.test(name)) {
      out.push(rel);
    }
  }
  return out;
}

const failures = [];

for (const rel of walk(root)) {
  if (SKIP_FILES.has(rel)) continue;
  if (SKIP_PREFIXES.some((p) => rel.startsWith(p))) continue;
  if (rel.startsWith("src/boot/")) continue;

  const text = readFileSync(join(root, rel), "utf8");
  for (const pattern of FORBIDDEN) {
    if (!pattern.test(text)) continue;
    if (rel === "index.html") {
      const allowed = INDEX_ALLOW.some((a) => a.test(text));
      if (allowed && !/(mj-boot-skeleton|mj-silent-splash|mj-sk-|AppSplash|splash-screen)/.test(text)) {
        continue;
      }
    }
    failures.push(`${rel}: ${pattern}`);
  }
}

if (failures.length) {
  console.error("verify-boot-single-source: FAIL\n" + failures.map((f) => `  • ${f}`).join("\n"));
  process.exit(1);
}

console.log("verify-boot-single-source: ok");
