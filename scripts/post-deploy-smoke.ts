/**
 * فحص سريع بعد النشر — production smoke.
 * التشغيل: pnpm run smoke:production
 * اختياري: SMOKE_BASE=https://majlisilm.com
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = (process.env.SMOKE_BASE || "https://majlisilm.com").replace(/\/$/, "");

const CORE_PATHS = [
  "/",
  "/lessons",
  "/mushaf",
  "/adhkar",
  "/library",
  "/scholars",
  "/prophets",
  "/fiqh",
  "/rulings",
  "/quiz",
  "/more",
  "/quran-hub",
] as const;

const REDIRECT_PATHS: Array<{ path: string; expectLocation: string }> = [
  { path: "/qa", expectLocation: "/quiz" },
  { path: "/quran", expectLocation: "/quran-hub" },
  { path: "/prophets/zakariya", expectLocation: "/prophets/zakariyya" },
  { path: "/prophets/zakaria", expectLocation: "/prophets/zakariyya" },
];

const BAD_SNIPPETS = [
  "Cache miss",
  "homepage fallback",
  "TODO: remove",
  "undefined is not",
  "null is not",
  "@example.com",
  "test@test.com",
];

type Finding = { severity: "P0" | "P1"; message: string };
const findings: Finding[] = [];

function fail(message: string) {
  findings.push({ severity: "P0", message });
}
function warn(message: string) {
  findings.push({ severity: "P1", message });
}

function countProphetsInSource(): number {
  const src = readFileSync(resolve(ROOT, "artifacts/majalis/src/lib/prophets-data.ts"), "utf8");
  const start = src.indexOf("export const PROPHETS");
  if (start < 0) return -1;
  const slice = src.slice(start, start + 120_000);
  const end = slice.indexOf("\n];");
  const body = end > 0 ? slice.slice(0, end) : slice;
  return (body.match(/^\s*slug:\s*"/gm) || []).length;
}

async function fetchRes(path: string, redirect: RequestRedirect = "manual") {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { redirect, headers: { "user-agent": "majlisilm-smoke/1.0" } });
  return { url, res };
}

async function checkCore() {
  for (const path of CORE_PATHS) {
    const { res } = await fetchRes(path, "follow");
    if (res.status !== 200) {
      fail(`${path} → HTTP ${res.status}`);
      continue;
    }
    const text = await res.text();
    if (path === "/") {
      if (text.includes("/src/main.tsx")) fail("الرئيسية تخدم Vite غير مُجمَّع (main.tsx)");
      if (!/\/assets\/index[^"']*/.test(text)) fail("الرئيسية بلا حزمة /assets/index");
      for (const bad of BAD_SNIPPETS) {
        if (text.includes(bad)) fail(`الرئيسية تحتوي نصًا غير مقبول: ${bad}`);
      }
      if (/لا يوجد محتوى|صفحة غير متاحة مؤقتًا|Something went wrong/i.test(text) && text.length < 800) {
        warn("الرئيسية قصيرة جدًا وقد تبدو كـ fallback");
      }
    }
    console.log(`✓ ${path} → 200`);
  }
}

async function checkRedirects() {
  for (const row of REDIRECT_PATHS) {
    const { res } = await fetchRes(row.path, "manual");
    const loc = res.headers.get("location") || "";
    const okStatus = res.status === 301 || res.status === 302 || res.status === 307 || res.status === 308;
    if (!okStatus) {
      fail(`${row.path} → متوقع redirect، حصل ${res.status}`);
      continue;
    }
    if (!loc.includes(row.expectLocation)) {
      fail(`${row.path} → location="${loc}" متوقع يتضمن ${row.expectLocation}`);
      continue;
    }
    console.log(`✓ ${row.path} → ${res.status} ${loc}`);
  }
}

async function checkVersion() {
  const { res } = await fetchRes("/version.json", "follow");
  if (res.status !== 200) {
    fail(`/version.json → HTTP ${res.status}`);
    return null;
  }
  const json = (await res.json()) as { shortCommit?: string; ref?: string; commit?: string };
  if (!json.shortCommit && !json.commit) fail("version.json بلا commit");
  if (json.ref && json.ref !== "main") warn(`version.json ref=${json.ref} (ليس main)`);
  console.log(`✓ version.json → ${json.shortCommit || json.commit} (${json.ref || "?"})`);
  return json;
}

async function main() {
  console.log(`smoke:production — ${BASE}\n`);

  const prophets = countProphetsInSource();
  if (prophets !== 25) {
    fail(`عدد الأنبياء في البيانات ${prophets} ≠ 25`);
  } else {
    console.log("✓ الأنبياء في البيانات = 25");
  }

  const version = await checkVersion();
  await checkCore();
  await checkRedirects();

  const p0 = findings.filter((f) => f.severity === "P0");
  const p1 = findings.filter((f) => f.severity === "P1");
  const result = {
    merge_ok: p0.length === 0,
    P0: p0.length,
    P1: p1.length,
    base: BASE,
    prophets,
    version,
    findings,
  };

  console.log("\n" + JSON.stringify(result, null, 2));
  if (p0.length) {
    console.error("smoke:production FAILED");
    process.exit(1);
  }
  console.log("smoke:production: OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
