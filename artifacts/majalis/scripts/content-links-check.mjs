#!/usr/bin/env node
/**
 * content:links — فحص الروابط الداخلية في المحتوى والواجهة
 * → reports/content-links-report.json
 *
 * يفشل (exit 1) فقط إذا وُجدت روابط مكسورة في content/ أو public/data أو seo-prerender.
 * روابط src تُبلَّغ كتحذير ولا تمنع البوابة (كثير منها مسارات ديناميكية/:id).
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, SCAN_DIRS, walkFiles, readText, isTestOrGateFile } from "./lib/content-qa-core.mjs";

function loadKnownPaths() {
  const known = new Set([
    "/",
    "/search",
    "/sections",
    "/lessons",
    "/fiqh",
    "/hadith",
    "/mushaf",
    "/prayer-times",
    "/adhkar",
    "/about",
    "/privacy",
    "/terms",
    "/contact",
    "/login",
    "/settings",
    "/library",
    "/more",
    "/kids",
    "/flashcards",
    "/islamic-glossary",
    "/hadith-science",
    "/quran",
    "/tafsir",
    "/prophets",
    "/seerah",
  ]);

  try {
    const seo = JSON.parse(fs.readFileSync(path.join(ROOT, "src/lib/seo-routes.json"), "utf8"));
    for (const r of seo.routes || []) {
      if (r?.path) known.add(String(r.path).split("?")[0].split("#")[0]);
    }
  } catch {
    /* ignore */
  }

  for (const candidate of ["src/AppRoutes.tsx", "src/app/router/routes.ts"]) {
    try {
      const src = readText(candidate);
      for (const m of src.matchAll(/path\s*[:=]\s*["'`](\/[^"'`]+)["'`]/g)) {
        const p = m[1].split(":")[0].replace(/\*$/, "").replace(/\/$/, "") || "/";
        if (p.startsWith("/")) known.add(p);
      }
    } catch {
      /* ignore */
    }
  }

  // تحويلات معروفة (تبقى «موجودة»)
  known.add("/library");
  known.add("/more");
  return known;
}

const HREF_RE =
  /(?:href|to)\s*=\s*["'`](\/[A-Za-z0-9\-._~/%]*)["'`]|"path"\s*:\s*"(\/[A-Za-z0-9\-._~/%]*)"/g;

const known = loadKnownPaths();
const files = walkFiles(SCAN_DIRS);
const brokenContent = [];
const brokenSrcWarn = [];
let checked = 0;

for (const rel of files) {
  if (isTestOrGateFile(rel)) continue;
  if (!/\.(tsx?|jsx?|json|md|html)$/i.test(rel)) continue;
  let text;
  try {
    text = readText(rel);
  } catch {
    continue;
  }
  HREF_RE.lastIndex = 0;
  let m;
  while ((m = HREF_RE.exec(text)) !== null) {
    const raw = m[1] || m[2];
    if (!raw?.startsWith("/") || raw.startsWith("//")) continue;
    if (raw.includes("${")) continue;
    const clean = (raw.split("?")[0].split("#")[0].replace(/\/$/, "") || "/").split(":")[0];
    if (/^\/(assets|fonts|icons|images|api|static|brand|data|manifest\.webmanifest|robots\.txt|sitemap|favicon|apple-touch|sw\.js|workbox|mj-|og-)/.test(clean)) continue;
    checked += 1;
    let ok = known.has(clean);
    if (!ok) {
      for (const k of known) {
        if (k !== "/" && (clean === k || clean.startsWith(`${k}/`))) {
          ok = true;
          break;
        }
      }
    }
    if (ok) continue;
    const row = {
      file: rel,
      text: clean,
      problem: "رابط داخلي غير معروف",
      suggested: "تصحيح المسار أو تسجيله في التوجيه",
      severity: "high",
      type: "broken-link",
      reason: "المسار الصحيح غير مؤكد تلقائيًا",
      autoFixable: false,
    };
    if (/^(content|public\/data|seo-prerender)\//.test(rel)) brokenContent.push(row);
    else brokenSrcWarn.push(row);
  }
}

function uniq(list) {
  const seen = new Set();
  const out = [];
  for (const x of list) {
    const k = `${x.file}::${x.text}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

const broken = uniq(brokenContent);
const warnings = uniq(brokenSrcWarn).slice(0, 100);

const report = {
  generatedAt: new Date().toISOString(),
  knownPaths: known.size,
  linksChecked: checked,
  brokenCount: broken.length,
  warningCount: warnings.length,
  broken,
  warnings,
};

fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "reports/content-links-report.json"), JSON.stringify(report, null, 2), "utf8");

console.log(
  JSON.stringify(
    {
      ok: broken.length === 0,
      knownPaths: known.size,
      linksChecked: checked,
      brokenCount: broken.length,
      warningCount: warnings.length,
      sampleBroken: broken.slice(0, 12),
      report: "reports/content-links-report.json",
    },
    null,
    2,
  ),
);

if (broken.length > 0) process.exitCode = 1;
