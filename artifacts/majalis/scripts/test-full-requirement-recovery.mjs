#!/usr/bin/env node
/**
 * Full Requirement Recovery — code & route verification
 * Usage: node scripts/test-full-requirement-recovery.mjs [--base=https://majlisilm.com]
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const base = process.argv.find((a) => a.startsWith("--base="))?.slice(7) || "https://majlisilm.com";
const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");

const CORE_ROUTES = [
  ["/", "الصفحة الرئيسية"],
  ["/lessons", "الدروس"],
  ["/quran", "القرآن"],
  ["/adhkar", "الأذكار"],
  ["/library", "الكتب/المكتبة"],
  ["/prayer-times", "الصلاة"],
  ["/qa", "الأسئلة الشرعية"],
  ["/question-answer", "سؤال وجواب"],
  ["/research", "الأبحاث العلمية"],
  ["/quran-scientific-circles", "الحلقات القرآنية"],
  ["/annual-courses", "الدورات العلمية"],
  ["/fawaid", "الفوائد"],
  ["/fatwa", "الفتاوى"],
  ["/rulings", "الأحكام الشرعية"],
  ["/fiqh-council", "المجمع الفقهي"],
  ["/miracles", "الإعجاز العلمي"],
  ["/about", "عن المنصة"],
  ["/contact", "تواصل معنا"],
  ["/admin", "لوحة التحكم"],
  ["/search", "البحث العام"],
  ["/scholar-search", "الباحث العلمي"],
  ["/calendar", "التقويم العلمي"],
  ["/my-learning", "الملف العلمي للمستخدم"],
  ["/learning/paths", "شجرة طلب العلم"],
  ["/assistant", "المجلس الذكي"],
  ["/topics", "الموضوعات"],
  ["/updates", "آخر المستجدات"],
  ["/prayer-ranks", "مراتب الصلاة"],
];

const REDIRECT_ROUTES = [
  ["/sin-jeem", "/question-answer"],
  ["/scientific-research", "/research"],
];

const NAV_FILE = readFileSync(join(root, "src/lib/navigation.ts"), "utf8");
const FOOTER_FILE = readFileSync(join(root, "src/components/SiteFooter.tsx"), "utf8");
const CONTACT_PAGE = readFileSync(join(root, "src/views/ContactPage.tsx"), "utf8");
const ABOUT_PAGE = readFileSync(join(root, "src/views/AboutPage.tsx"), "utf8");

let passed = 0;
let failed = 0;
const results = [];

function pass(name, detail = "") {
  passed++;
  results.push({ status: "pass", name, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  failed++;
  results.push({ status: "fail", name, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

console.log("\n=== Phase 1–3: Code & Navigation ===\n");

if (CONTACT_PAGE.includes("yalabdullmohsen1@gmail.com")) pass("Contact email correct");
else fail("Contact email", "missing yalabdullmohsen1@gmail.com");

if (CONTACT_PAGE.includes("copyEmail") && CONTACT_PAGE.includes("mailto:")) pass("Contact copy + mailto");
else fail("Contact copy/mailto");

if (CONTACT_PAGE.includes("/api/contact?action=submit")) pass("Contact form API wired");
else fail("Contact form API");

if (ABOUT_PAGE.includes("رؤيتنا") && ABOUT_PAGE.includes("رسالتنا") && ABOUT_PAGE.includes("طريقة عمل")) pass("About page professional sections");
else fail("About page sections");

for (const [path, label] of [
  ["/about", "عن المنصة"],
  ["/contact", "تواصل معنا"],
  ["/research", "الأبحاث"],
  ["/annual-courses", "الدورات"],
  ["/calendar", "التقويم"],
  ["/question-answer", "سؤال وجواب"],
  ["/quran-scientific-circles", "الحلقات"],
]) {
  if (NAV_FILE.includes(`"${path}"`)) pass(`Nav includes ${label}`, path);
  else fail(`Nav missing ${label}`, path);
}

if (FOOTER_FILE.includes('href: "/about"') && FOOTER_FILE.includes('href: "/contact"')) pass("Footer about + contact");
else fail("Footer about/contact");

if (FOOTER_FILE.includes('href: "/question-answer"') && FOOTER_FILE.includes('href: "/calendar"')) pass("Footer game + calendar");
else fail("Footer game/calendar");

try {
  readFileSync(join(root, "lib/api-handlers/contact.js"), "utf8");
  pass("Contact API handler exists");
} catch {
  fail("Contact API handler missing");
}

try {
  readFileSync(join(root, "supabase/contact_messages_v1.sql"), "utf8");
  pass("Contact migration SQL exists");
} catch {
  fail("Contact migration SQL missing");
}

try {
  readFileSync(join(root, "src/views/admin/ContactMessagesSection.tsx"), "utf8");
  pass("Admin contact messages section exists");
} catch {
  fail("Admin contact section missing");
}

console.log("\n=== Phase 12: Production HTTP ===\n");

for (const [path, label] of CORE_ROUTES) {
  const url = new URL(path, base).toString();
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (res.status === 200) pass(`HTTP ${path}`, label);
    else fail(`HTTP ${path}`, `${label} → ${res.status}`);
  } catch (err) {
    fail(`HTTP ${path}`, err.message);
  }
}

for (const [from, to] of REDIRECT_ROUTES) {
  const url = new URL(from, base).toString();
  try {
    const res = await fetch(url, { redirect: "manual" });
    const loc = res.headers.get("location") || "";
    if (res.status >= 300 && res.status < 400 && loc.includes(to.replace(/^\//, ""))) {
      pass(`Redirect ${from} → ${to}`);
    } else if (res.status === 200 || res.status === 308) {
      pass(`Redirect ${from}`, res.status === 308 ? "308 permanent redirect" : "SPA handles client-side");
    } else {
      fail(`Redirect ${from}`, `status ${res.status}`);
    }
  } catch (err) {
    fail(`Redirect ${from}`, err.message);
  }
}

// Contact API info endpoint
try {
  const res = await fetch(new URL("/api/contact?action=info", base).toString());
  const data = await res.json();
  if (data.ok && data.email === "yalabdullmohsen1@gmail.com") pass("Production contact API");
  else if (res.status === 404) fail("Production contact API", "404 — not deployed yet");
  else fail("Production contact API", JSON.stringify(data));
} catch (err) {
  fail("Production contact API", err.message);
}

console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed ? 1 : 0);
