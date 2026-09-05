#!/usr/bin/env node
/**
 * بوابة قبول مرشّح الإطلاق (Release Candidate)
 * pnpm run verify:rc
 *
 * فحوصات استقرار فقط — بلا ميزات جديدة.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const REPO = resolve(ROOT, "../..");
const FULL = process.argv.includes("--full");
const failures = [];

function fail(msg) {
  failures.push(msg);
  console.error(`✗ ${msg}`);
}
function ok(msg) {
  console.log(`✓ ${msg}`);
}
function read(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}
function walk(dir, pred, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === ".git") continue;
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(p, pred, acc);
    else if (pred(p)) acc.push(p);
  }
  return acc;
}
function runPnpm(script) {
  const r = spawnSync("pnpm", ["run", script], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 40 * 1024 * 1024,
    env: process.env,
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if ((r.status ?? 1) !== 0) fail(`pnpm run ${script} فشل (exit ${r.status})`);
  else ok(`pnpm run ${script}`);
  return r.status ?? 1;
}

console.log("═══ Release Candidate Gate ═══");
console.log(`root: ${ROOT}`);

/* 1) Capacitor / production URL */
{
  const cap = read("capacitor.config.ts");
  if (!/url:\s*"https:\/\/www\.ssunnah\.com"/.test(cap)) {
    fail('capacitor.config.ts يجب أن يفتح https://www.ssunnah.com');
  } else ok("Capacitor server.url → https://www.ssunnah.com");

  const iosCap = join(ROOT, "ios/App/App/capacitor.config.json");
  if (existsSync(iosCap)) {
    const j = JSON.parse(readFileSync(iosCap, "utf8"));
    const url = j?.server?.url || "";
    if (url !== "https://www.ssunnah.com") fail(`ios capacitor.config.json server.url=${url || "(فارغ)"}`);
    else ok("iOS capacitor.config.json → www.ssunnah.com");
  }
}

/* 2) Version / SW / cache */
{
  const html = read("index.html");
  if (!/version\.json/.test(html) || !/majalis_app_version/.test(html)) {
    fail("index.html يفتقد فحص النسخة المبكر");
  } else ok("index.html: فحص نسخة مبكر موجود");

  const afterMismatch = html.includes("if (same) return;")
    ? html.split("if (same) return;")[1] || ""
    : "";
  if (/localStorage\.setItem\(\s*"majalis_app_version"\s*,\s*live\s*\)/.test(afterMismatch)) {
    fail("index.html يكتب live في majalis_app_version عند الاختلاف — يسبب حلقة تحديث");
  } else ok("index.html: لا يكتب live في majalis_app_version عند الاختلاف");

  const sw = read("public/sw.js");
  if (!/networkFirstNavigation/.test(sw) || !/req\.mode === ["']navigate["']/.test(sw)) {
    fail("sw.js: التنقل يجب أن يكون network-first");
  } else ok("sw.js: HTML/navigate network-first");

  if (!/SW_BUILD_ID/.test(sw) || !/ssunnah-v\$\{SW_BUILD_ID\}/.test(sw)) {
    fail("sw.js: أسماء الكاش غير مربوطة بـ SW_BUILD_ID");
  } else ok("sw.js: كاش مربوط بمعرّف البناء");

  const vercel = read("vercel.json");
  if (!/\/version\.json[\s\S]{0,260}no-store/.test(vercel)) {
    fail("vercel.json: /version.json يجب أن يكون no-store");
  } else ok("vercel.json: version.json no-store");

  const purge = read("src/lib/runtime-cache-purge.ts");
  if (!/PURGE_RELOAD_GUARD|majalis_app_version|reloadOnce/.test(purge)) {
    fail("runtime-cache-purge.ts: حراسة إعادة التحميل مرة واحدة ناقصة");
  } else ok("runtime-cache-purge: حراسة reload مرة واحدة");
}

/* 3) Navigation unity */
{
  const fab = read("src/components/FloatingBackButton.tsx");
  if (!/AppBackButton/.test(fab)) fail("FloatingBackButton يجب أن يمر عبر AppBackButton");
  else ok("FloatingBackButton → AppBackButton");

  const hub = read("src/components/ui/HubCard.tsx");
  if (!/isCurrent/.test(hub) || !/nonInteractive/.test(hub) || !/hub-card--current/.test(hub)) {
    fail("HubCard يجب أن يمنع التنقل الذاتي للصفحة الحالية");
  } else ok("HubCard يمنع href الصفحة الحالية");

  const nav = read("src/lib/navigation-back.ts");
  if (!/prophet-stories[\s\S]{0,280}\/prophets/.test(nav)) {
    fail("navigation-back: أسماء الأنبياء المستعارة يجب أن تعود إلى /prophets");
  } else ok("navigation-back: aliases → /prophets");

  const explore = read("src/components/ExploreAlsoNav.tsx");
  if (!/normalizePath/.test(explore) || !/href === current/.test(explore)) {
    fail("ExploreAlsoNav يجب أن يسقط رابط الصفحة الحالية");
  } else ok("ExploreAlsoNav يسقط self-href");
}

/* 4) Share consolidation */
{
  const srcFiles = walk(join(ROOT, "src"), (p) => /\.(tsx|ts)$/.test(p));
  const badShareImports = [];
  for (const p of srcFiles) {
    const rel = relative(ROOT, p);
    if (rel.includes("__tests__") || /ShareButton\.tsx$/.test(rel)) continue;
    const t = readFileSync(p, "utf8");
    if (/from\s+["']@\/components\/ShareButton["']/.test(t)) badShareImports.push(rel);
  }
  if (badShareImports.length) {
    fail(`استيراد ShareButton محظور:\n  - ${badShareImports.join("\n  - ")}`);
  } else ok("لا استيراد ShareButton في صفحات الإنتاج");

  const section = read("src/components/common/SectionShareActions.tsx");
  if (!/data-section-share-actions/.test(section) || !/ShareFaida/.test(section)) {
    fail("SectionShareActions غير مكتمل");
  } else ok("SectionShareActions هو مسار المشاركة الموحّد");
}

/* 5) Critical routes */
{
  const routes = read("src/AppRoutes.tsx");
  const required = ["/tawhid", "/fiqh", "/prophets", "/seerah", "/tarikh-islami", "/miracles", "/lessons", "/hadith"];
  for (const r of required) {
    if (!routes.includes(r)) fail(`مسار مفقود من AppRoutes: ${r}`);
    else ok(`مسار موجود: ${r}`);
  }

  const tawhid = read("src/views/TawhidPage.tsx");
  for (const href of ["/tawhid/tawhid-issues", "/tawhid/aqeedah-foundations"]) {
    if (!tawhid.includes(href)) fail(`TawhidPage يفتقد ${href}`);
    else ok(`TawhidPage → ${href}`);
  }
}

/* 6) Fiqh relatedGuides: no self-href */
{
  const fiqh = read("src/lib/fiqh-hub-topics.ts");
  const blocks = [...fiqh.matchAll(/id:\s*"([^"]+)"[\s\S]*?href:\s*"([^"]+)"([\s\S]*?)(?=\n\s*\{|\n\];)/g)];
  let self = 0;
  for (const m of blocks) {
    const [, id, href, rest] = m;
    const g = rest.match(/relatedGuides:\s*\[([\s\S]*?)\]/);
    if (!g) continue;
    const esc = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`href:\\s*"${esc}"`).test(g[1])) {
      self += 1;
      fail(`fiqh topic ${id}: relatedGuides يشير لنفس href (${href})`);
    }
  }
  if (!self) ok("fiqh relatedGuides بلا self-href");
}

/* 7) Workflows */
{
  const wf = join(REPO, ".github/workflows/auto-deploy.yml");
  if (!existsSync(wf)) fail("auto-deploy.yml مفقود");
  else {
    const y = readFileSync(wf, "utf8");
    if (!/cancel-in-progress:\s*false/.test(y)) fail("auto-deploy.yml يجب cancel-in-progress: false");
    else ok("auto-deploy: cancel-in-progress: false");
    if (!/final-report:/.test(y)) fail("auto-deploy.yml يفتقد final-report");
    else ok("auto-deploy: final-report موجود");
  }
}

/* 8) Package scripts */
{
  const pkg = JSON.parse(read("package.json"));
  for (const s of ["lint", "typecheck", "verify:content", "build", "verify:rc"]) {
    if (!pkg.scripts?.[s]) fail(`package.json يفتقد سكربت ${s}`);
    else ok(`script ${s}`);
  }
}

/* 9) Fast unit gates */
{
  const unit = [
    "src/lib/__tests__/navigation-back.test.ts",
    "src/lib/__tests__/floating-back-button.test.ts",
  ];
  for (const rel of unit) {
    if (!existsSync(join(ROOT, rel))) {
      fail(`اختبار مفقود: ${rel}`);
      continue;
    }
    const r = spawnSync(process.execPath, ["--import", "tsx", rel], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
    if (r.stdout) process.stdout.write(r.stdout);
    if (r.stderr) process.stderr.write(r.stderr);
    if ((r.status ?? 1) !== 0) fail(`${rel} فشل`);
    else ok(rel);
  }
}

/* 10) Optional Playwright */
{
  const pw = join(ROOT, "node_modules", "@playwright", "test");
  const smoke = join(ROOT, "scripts", "rc-mobile-smoke.mjs");
  if (!existsSync(pw)) console.log("· Playwright غير مثبت — تخطي فحص الجوال الاختياري");
  else if (existsSync(smoke)) {
    const r = spawnSync(process.execPath, [smoke], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      env: { ...process.env, RC_SMOKE: "1" },
    });
    if (r.stdout) process.stdout.write(r.stdout);
    if (r.stderr) process.stderr.write(r.stderr);
    if ((r.status ?? 1) !== 0) fail("rc-mobile-smoke فشل");
    else ok("rc-mobile-smoke");
  } else console.log("· لا يوجد scripts/rc-mobile-smoke.mjs — تخطي");
}

if (FULL) {
  for (const s of ["lint", "typecheck", "verify:content", "build"]) runPnpm(s);
}

console.log("═══ الخلاصة ═══");
if (failures.length) {
  console.error(`فشل RC: ${failures.length} مشكلة`);
  for (const f of failures) console.error(` - ${f}`);
  process.exit(1);
}
console.log("Release Candidate gate: PASSED");
process.exit(0);
