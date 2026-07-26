#!/usr/bin/env node
/**
 * حارس يمنع رجوع أعطال التباين النهاري:
 * - قائمة المزيد: نص أبيض على سطح فاتح
 * - NavBar: فرض زمردي داكن غير مقيَّد بالسمة
 * - Toast: محدِّد [class*="toast"] يضرب msk/reminder الفاتحة
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(resolve(root, rel), "utf8");

let failed = false;
function fail(msg) {
  console.error("✗", msg);
  failed = true;
}

const elite = read("src/styles/elite-2026.css");
const moreCss = read("src/styles/components/more-bottom-sheet.css");
const moreTsx = read("src/components/MoreBottomSheet.tsx");
const navTsx = read("src/components/NavBar.tsx");
const darkMenusPath = "src/styles/components/dark-emerald-menus.css";
const darkMenus = existsSync(resolve(root, darkMenusPath)) ? read(darkMenusPath) : "";

// ── More sheet ──
{
  const idx = elite.indexOf(".bottom-sheet,");
  if (idx !== -1) {
    const window = elite.slice(idx, idx + 6000);
    if (/color:\s*#(?:FFFFFF|fff)\s*!important/i.test(window)) {
      fail("elite يعيد إدراج .bottom-sheet في قائمة النص الأبيض.");
    }
  }
  if (!/color:\s*var\(--color-text/i.test(moreCss) || !/background:\s*var\(--color-surface/i.test(moreCss)) {
    fail("more-bottom-sheet.css ناقص رموز السمة (--color-text/--color-surface).");
  }
  const withoutDark = moreCss.replace(/html\[data-theme=["']dark["']\][\s\S]*?(?=html\[data-theme|\z)/g, "");
  if (/\.more-sheet-item\s*\{[^}]*color:\s*#(?:FFFFFF|fff)/i.test(withoutDark)) {
    fail("more-bottom-sheet.css يفرض نصًا أبيضًا خارج الوضع الليلي.");
  }
  if (!moreTsx.includes("more-bottom-sheet.css")) {
    fail("MoreBottomSheet.tsx لا يستورد more-bottom-sheet.css.");
  }
  if (moreTsx.includes("dark-emerald-menus.css")) {
    fail("MoreBottomSheet.tsx عاد لاستيراد dark-emerald-menus.css.");
  }
}

// ── NavBar: لا فرض زمردي داكن غير مقيَّد ──
{
  if (navTsx.includes("dark-emerald-menus.css")) {
    fail("NavBar.tsx يستورد dark-emerald-menus.css — يفرض شريطًا داكنًا في النهاري.");
  }
  // إن بقي الملف، يجب ألا يحتوي قواعد .navbar-v3 غير مقيَّدة بـ dark
  if (darkMenus) {
    const unscoped = darkMenus
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/html\[data-theme=["']dark["']\][\s\S]*?(?=html\[data-theme|\.|\z)/g, "");
    if (/\.navbar-v3\s*\{/.test(unscoped) && /#143F35|linear-gradient/.test(unscoped)) {
      fail("dark-emerald-menus.css ما زال يفرض خلفية داكنة على .navbar-v3 بلا تقييد سمة.");
    }
    if (/\.bottom-sheet\s*\{|\.more-sheet-item\s*\{/.test(darkMenus)) {
      fail("dark-emerald-menus.css عاد لأنماط ورقة المزيد.");
    }
  }
  // elite mega لا تضمّن .navbar-v3 قبل color:#fff
  const navIdx = elite.indexOf(".navbar-v3,");
  if (navIdx !== -1) {
    const window = elite.slice(navIdx, navIdx + 8000);
    if (/color:\s*#(?:FFFFFF|fff)\s*!important/i.test(window) && !window.includes("display: none")) {
      fail("elite يعيد إدراج .navbar-v3 في قائمة النص الأبيض الإجباري.");
    }
  }
}

// ── Toast: ممنوع [class*="toast"] مع نص أبيض إجباري ──
{
  if (/\[class\*=["']toast["']\]\s*[,{]/.test(elite)) {
    const reBlocks = elite.matchAll(/\[class\*=["']toast["']\][\s\S]{0,400}?\{[\s\S]{0,400}?\}/g);
    for (const m of reBlocks) {
      const block = m[0];
      if (/color:\s*#(?:FFFFFF|fff)\s*!important/i.test(block) || /color:\s*#fff\s*!important/i.test(block)) {
        fail("elite يستخدم [class*=\"toast\"] مع نص أبيض — يضرب msk-toast وreminder الفاتحة.");
        break;
      }
    }
  }
  if (/\.toast\s*,\s*\[class\*=["']toast["']\]\s*\{[\s\S]{0,200}?color:\s*#fff/i.test(elite)) {
    fail("عادت قاعدة 77u العامة .toast,[class*=\"toast\"] بنص أبيض.");
  }
}

// ── SideNav: ممنوع [class*="side-nav"] (يلطّخ كل أبناء الدرج) ──
{
  if (/\[class\*=["']side-nav["']\]/.test(elite)) {
    fail('elite عاد لـ [class*="side-nav"] — يجب .side-nav-drawer / --v2 فقط.');
  }
}

// ── قائمة mega البيضاء: سطوح فاتحة ممنوعة ──
{
  const tag = ".tag-new {\n  color: #FFFFFF !important;\n}";
  const end = elite.indexOf(tag);
  if (end === -1) {
    fail("لم يُعثر على كتلة mega (.tag-new + color:#FFFFFF) — تغيّر الشكل؟");
  } else {
    // خذ حتى ~500 سطر قبل النهاية كنافذة القائمة
    const from = Math.max(0, end - 18000);
    const mega = elite.slice(from, end);
    const banned = [
      ".hit-card,",
      ".hac__benefit-label,",
      ".hac__category-badge,",
      ".hnh__num,",
      ".nf2-btn--outline,",
      ".ftw-type-badge--fatwa,",
      ".ads-perm--ok,",
      ".lsw-option--active,",
      ".hadith-index-card--books,",
      ".sh-cta__btn--secondary,",
      ".offline-banner--back,",
      ".set-section--security,",
      ".asp-notice,",
      ".an-card,",
      ".settings-choice.is-active,",
      ".navbar-v3,",
      ".bottom-sheet,",
    ];
    const megaLines = new Set(
      mega
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    );
    for (const b of banned) {
      if (megaLines.has(b)) {
        fail(`قائمة mega البيضاء تضم السطح الفاتح ${b}`);
      }
    }
  }
}

if (failed) {
  console.error("✗ حارس أمان السمة/القوائم فشل.");
  process.exit(1);
}

console.log("✓ حارس السمة: المزيد + NavBar + toast + side-nav + mega فاتحة.");
