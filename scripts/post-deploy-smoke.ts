/**
 * فحص سريع بعد النشر — production smoke لسُنّة.
 * التشغيل: pnpm run smoke:production
 * اختياري: SMOKE_BASE=https://www.ssunnah.com
 */
const BASE = (process.env.SMOKE_BASE || "https://www.ssunnah.com").replace(/\/$/, "");

const CORE_PATHS = [
  "/",
  "/lessons",
  "/fiqh",
  "/hadith",
  "/search",
  "/sections",
  "/prayer-times",
  "/mushaf",
  "/tawhid",
  "/tawhid/tawhid-issues",
  "/tawhid/aqeedah-foundations",
  "/version.json",
  "/manifest.webmanifest",
  "/sitemap.xml",
  "/robots.txt",
  "/healthz",
  "/readyz",
] as const;

const REDIRECT_PATHS: Array<{ path: string; expectLocation: string }> = [
  { path: "/library", expectLocation: "/search" },
  { path: "/more", expectLocation: "/" },
];

const FORBIDDEN_SNIPPETS = ["المكتبة العلمية", "Majlisilm", "majlisilm.com"];

type Finding = { severity: "P0" | "P1"; message: string };
const findings: Finding[] = [];

function fail(message: string) {
  findings.push({ severity: "P0", message });
}

async function fetchRes(path: string, redirect: RequestRedirect = "manual") {
  return fetch(`${BASE}${path}`, {
    redirect,
    headers: { "user-agent": "ssunnah-smoke/1.0" },
  });
}

async function checkCore() {
  for (const path of CORE_PATHS) {
    const res = await fetchRes(path, "follow");
    if (res.status !== 200) {
      fail(`${path} → HTTP ${res.status}`);
      continue;
    }
    const text = await res.text();
    for (const bad of FORBIDDEN_SNIPPETS) {
      if (text.includes(bad)) fail(`${path} يحتوي نصًا ممنوعًا: ${bad}`);
    }
    if (path === "/healthz" || path === "/readyz") {
      try {
        const json = JSON.parse(text) as Record<string, unknown>;
        if (json.ok !== true) fail(`${path} بدون ok:true`);
        const blob = JSON.stringify(json);
        if (/service_role|SUPABASE_SERVICE|BEGIN PRIVATE|api[_-]?key/i.test(blob)) {
          fail(`${path} يسرّب أسرارًا`);
        }
      } catch {
        fail(`${path} ليس JSON صالحًا`);
      }
    }
    if (path === "/version.json") {
      try {
        const json = JSON.parse(text) as { commit?: string };
        if (!json.commit) fail("version.json بلا commit");
        else console.log(`✓ version.json → ${json.commit}`);
      } catch {
        fail("version.json ليس JSON صالحًا");
      }
      continue;
    }
    console.log(`✓ ${path} → 200`);
  }
}

async function checkRedirects() {
  for (const row of REDIRECT_PATHS) {
    const res = await fetchRes(row.path, "manual");
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
    const body = await res.text();
    for (const bad of FORBIDDEN_SNIPPETS) {
      if (body.includes(bad)) fail(`${row.path} جسم التحويل يحتوي ${bad}`);
    }
    console.log(`✓ ${row.path} → ${res.status} ${loc}`);
  }
}

async function main() {
  console.log(`smoke:production base=${BASE}`);
  await checkCore();
  await checkRedirects();
  const p0 = findings.filter((f) => f.severity === "P0");
  for (const f of findings) console.error(`${f.severity}: ${f.message}`);
  if (p0.length) {
    console.error(`smoke:production FAILED (${p0.length} P0)`);
    process.exit(1);
  }
  console.log("smoke:production PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
