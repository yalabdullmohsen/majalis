#!/usr/bin/env node
/**
 * يكتب قائمة المسارات المعروفة لـ middleware (404 حقيقي).
 * المصادر: seo-prerender + seo-routes + بادئات ديناميكية.
 */
import { readdirSync, existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const prerender = resolve(appRoot, "seo-prerender");
const routes = new Set(["/"]);

function walk(dir, base = dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, base);
    else if (name === "index.html") {
      const rel = relative(base, dir).replace(/\\/g, "/");
      routes.add(rel ? `/${rel}` : "/");
    }
  }
}
walk(prerender);

try {
  const seo = JSON.parse(readFileSync(resolve(appRoot, "src/lib/seo-routes.json"), "utf8"));
  for (const r of seo.routes || []) {
    if (r.path && !r.path.includes(":")) routes.add(r.path.replace(/\/$/, "") || "/");
  }
} catch { /* ignore */ }

const dynamicPrefixes = [
  "/library/",
  "/scholars/",
  "/lessons/",
  "/rulings/",
  "/prophets/",
  "/nations/",
  "/topics/",
  "/annual-courses/",
  "/universities/",
  "/sins-and-rights/",
  "/learning/paths/",
  "/learning/quiz/",
  "/learning/certificates/",
  "/quran/surah-stories/",
  "/fiqh-council/",
  "/mushaf/",
  "/quran/",
  "/c/",
  "/updates/",
  "/scientific-announcements/",
  "/discover-islam/",
  "/admin/",
];

const exactAllow = [
  "/login", "/register", "/auth/callback", "/search", "/settings",
  "/account-deletion", "/404", "/api",
];

const out = {
  generatedAt: new Date().toISOString().slice(0, 10),
  exact: [...routes, ...exactAllow].sort(),
  prefixes: dynamicPrefixes,
};

const outDir = resolve(appRoot, "public/data");
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "known-routes.json"), JSON.stringify(out), "utf8");
// نسخة لـ middleware على الحافة (يُقرأ من جذر المشروع عند النشر)
writeFileSync(resolve(appRoot, "known-routes.json"), JSON.stringify(out), "utf8");
console.log(`✓ known-routes: ${out.exact.length} مسارًا ثابتًا + ${out.prefixes.length} بادئة`);
