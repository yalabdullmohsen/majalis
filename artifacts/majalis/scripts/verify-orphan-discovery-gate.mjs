#!/usr/bin/env node
/**
 * بوابة اكتشاف اليُتم (الجولة الرابعة — R4-1):
 * - تبني مجموعة روابط «سطح الدخول» من الرئيسية / الشريط / المزيد / التذييل / الجانبية.
 * - تفشل إن غاب أي مسار من MUST_DISCOVER عن سطح الدخول.
 * - تفشل إن وُجد مسار ثابت جديد في الراوتر خارج (سطح الدخول ∪ allowlist ∪ استثناءات).
 *
 * التشغيل: node scripts/verify-orphan-discovery-gate.mjs
 * تقرير فقط: node scripts/verify-orphan-discovery-gate.mjs --report
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = join(appRoot, "src");
const reportOnly = process.argv.includes("--report");
const writeAllowlist = process.argv.includes("--write-allowlist");

/** يجب أن تُدرَك بنقرة من سطح الدخول (ثقة + مبتدئ + قانوني) */
const MUST_DISCOVER = [
  "/methodology",
  "/fatwa-policy",
  "/about",
  "/about-us",
  "/privacy",
  "/contact",
  "/terms",
  "/sources",
  "/start-here",
  "/lessons",
  "/account-deletion",
];

const ENTRY_FILES = [
  "pages/account/ui/HomeView.tsx",
  "components/home/HomeStartHereSection.tsx",
  "components/BottomNavBar.tsx",
  "components/MoreBottomSheet.tsx",
  "components/NavBar.tsx",
  "components/SiteFooter.tsx",
  "components/SideNavDrawer.tsx",
  "lib/nav-map.ts",
  "lib/services-center-nav.ts",
  "lib/site-footer-nav.ts",
  // صفحة /more الحقيقية + مصدر الأقسام + خريطة الموقع + مركز علوم القرآن
  "pages/account/MorePage.tsx",
  "features/more/moreSections.ts",
  "pages/account/ui/SiteMapView.tsx",
  "pages/quran/QuranKnowledgeHubPage.tsx",
];

const ALLOWLIST_PATH = join(appRoot, "scripts/orphan-discovery-allowlist.json");
const linkRe = /(?:href|to|route)\s*[:=]\s*["'`](\/[^"'`?#]*)/g;

function linksIn(file) {
  if (!existsSync(file)) return [];
  return [...readFileSync(file, "utf8").matchAll(linkRe)].map(
    (m) => m[1].replace(/\/$/, "") || "/",
  );
}

function collectEntryLinks() {
  const set = new Set(["/"]);
  for (const rel of ENTRY_FILES) {
    for (const l of linksIn(join(srcRoot, rel))) set.add(l);
  }
  return set;
}

function collectStaticRoutesAndRedirects() {
  const app = readFileSync(join(srcRoot, "App.tsx"), "utf8");
  const staticRoutes = [
    ...new Set(
      [...app.matchAll(/path=["'`](\/[^"'`:?*]+)["'`]/g)].map((m) => m[1]),
    ),
  ].sort();
  const redirects = new Set();
  const lines = app.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const pm = lines[i].match(/path=["'`](\/[^"'`]+)["'`]/);
    if (!pm) continue;
    if (lines.slice(i, i + 2).join(" ").includes("<Redirect")) {
      redirects.add(pm[1]);
    }
  }
  return { staticRoutes, redirects };
}

function skipPath(p, redirects) {
  return (
    p === "/404" ||
    p.startsWith("/admin") ||
    p.startsWith("/auth") ||
    redirects.has(p)
  );
}

/** مسار موصول مباشرة أو عبر أب ظاهر على سطح الدخول (R5-2). */
function isOnEntrySurface(p, entry) {
  if (entry.has(p)) return true;
  const parts = p.split("/").filter(Boolean);
  for (let i = parts.length - 1; i >= 1; i--) {
    const parent = `/${parts.slice(0, i).join("/")}`;
    if (entry.has(parent)) return true;
  }
  return false;
}

function loadAllowlist() {
  if (!existsSync(ALLOWLIST_PATH)) return [];
  const data = JSON.parse(readFileSync(ALLOWLIST_PATH, "utf8"));
  return Array.isArray(data.paths) ? data.paths : [];
}

const entry = collectEntryLinks();
const { staticRoutes, redirects } = collectStaticRoutesAndRedirects();

const mustMissing = MUST_DISCOVER.filter((p) => !entry.has(p));
const orphans = staticRoutes.filter(
  (p) => !skipPath(p, redirects) && !isOnEntrySurface(p, entry),
);

if (writeAllowlist) {
  const payload = {
    generatedAt: new Date().toISOString(),
    note: "مسارات ثابتة خارج سطح الدخول عند إنشاء البوابة — يُسمح بها مؤقتاً ويمنع إضافة جديد بلا اكتشاف.",
    paths: orphans.filter((p) => !MUST_DISCOVER.includes(p)).sort(),
  };
  writeFileSync(ALLOWLIST_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`✓ كُتب allowlist: ${payload.paths.length} مسارًا → ${ALLOWLIST_PATH}`);
}

const allowlist = new Set(loadAllowlist());
const unexpected = orphans.filter(
  (p) => !allowlist.has(p) && !MUST_DISCOVER.includes(p),
);

console.log(`سطح الدخول: ${entry.size} مسارًا`);
console.log(`مسارات ثابتة: ${staticRoutes.length} · تحويلات: ${redirects.size}`);
console.log(`يتيم حالي (خارج الدخول، بلا admin/auth/redirect): ${orphans.length}`);
console.log(`MUST_DISCOVER ناقص: ${mustMissing.length}`);
console.log(`يتيم جديد خارج الـallowlist: ${unexpected.length}`);

if (reportOnly) {
  if (mustMissing.length) {
    console.log("\n— MUST_DISCOVER غائب عن سطح الدخول —");
    mustMissing.forEach((p) => console.log(`  ${p}`));
  }
  if (unexpected.length) {
    console.log("\n— يتيم جديد (خارج allowlist) —");
    unexpected.slice(0, 80).forEach((p) => console.log(`  ${p}`));
  }
  process.exit(0);
}

const issues = [];
for (const p of mustMissing) {
  issues.push(`MUST_DISCOVER غير موصول بسطح الدخول: ${p}`);
}
for (const p of unexpected) {
  issues.push(`مسار يتيم جديد (أضفه لسطح الدخول أو حدّث الـallowlist عمدًا): ${p}`);
}
// الـallowlist لا يجوز أن يتضخم بمسارات MUST
for (const p of MUST_DISCOVER) {
  if (allowlist.has(p)) {
    issues.push(`MUST_DISCOVER لا يُسمح ببقائه في الـallowlist: ${p}`);
  }
}

if (issues.length) {
  console.error("\n❌ بوابة اكتشاف اليُتم فشلت:\n");
  for (const issue of issues.slice(0, 60)) console.error(`  - ${issue}`);
  if (issues.length > 60) console.error(`  … و${issues.length - 60} أخرى`);
  process.exit(1);
}

console.log(
  `✓ بوابة اليُتم: ${MUST_DISCOVER.length} مسارًا إلزاميًا موصول · بلا يتيم جديد خارج allowlist (${allowlist.size})`,
);
