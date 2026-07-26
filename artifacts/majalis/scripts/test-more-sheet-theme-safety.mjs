#!/usr/bin/env node
/**
 * حارس يمنع رجوع عطل «كل شيء أبيض» في قائمة المزيد بالوضع النهاري.
 *
 * السبب الجذري السابق:
 * 1) elite-2026 يفرض color:#fff !important على .bottom-sheet
 * 2) final-release يضع خلفية سطح فاتحة
 * 3) dark-emerald-menus يفرض نصًا أبيضًا على العناصر دون ربط بالسمة
 *
 * هذا الحارس يفشل البناء إن عاد أي من هذه التعارضات.
 */
import { readFileSync } from "node:fs";
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
const darkMenus = read("src/styles/components/dark-emerald-menus.css");
const moreCss = read("src/styles/components/more-bottom-sheet.css");
const moreTsx = read("src/components/MoreBottomSheet.tsx");

// 1) لا يجوز لـ elite إعادة إدراج .bottom-sheet في قائمة color:#FFFFFF !important
{
  const re =
    /\.bottom-sheet\s*,[\s\S]{0,8000}?\{\s*color:\s*#(?:FFFFFF|fff)\s*!important\s*;?\s*\}/i;
  const re2 =
    /color:\s*#(?:FFFFFF|fff)\s*!important[\s\S]{0,200}?\.bottom-sheet/i;
  // ابحث عن كتلة mega: من .bottom-sheet حتى { color:#FFFFFF !important }
  if (/\.bottom-sheet\s*,/.test(elite) && re.test(elite)) {
    fail("elite-2026.css يعيد إدراج .bottom-sheet في قائمة النص الأبيض الإجباري.");
  }
  // أبسط: إن وُجد السطر `.bottom-sheet,` قرب قائمة 79
  const idx = elite.indexOf(".bottom-sheet,");
  if (idx !== -1) {
    const window = elite.slice(idx, idx + 6000);
    if (/color:\s*#(?:FFFFFF|fff)\s*!important/i.test(window)) {
      fail("وُجد .bottom-sheet, متبوعًا بـ color:#FFFFFF !important في elite — هذا يعيد عطل النهاري.");
    }
  }
}

// 2) dark-emerald لا يجوز أن يفرض أنماط ورقة المزيد (نص أبيض)
{
  if (/\.bottom-sheet\s*\{/.test(darkMenus) || /\.more-sheet-item\s*\{/.test(darkMenus)) {
    fail("dark-emerald-menus.css عاد لفرض أنماط .bottom-sheet/.more-sheet-item — يجب أن تبقى في more-bottom-sheet.css فقط.");
  }
  if (/more-sheet-item[\s\S]{0,200}color:\s*#(?:FFFFFF|fff)/i.test(darkMenus)) {
    fail("dark-emerald-menus.css يفرض نصًا أبيضًا على more-sheet-item.");
  }
}

// 3) مصدر ورقة المزيد يجب أن يفرض نصًا داكنًا في الوضع الافتراضي (نهاري)
{
  if (!/color:\s*var\(--color-text/i.test(moreCss)) {
    fail("more-bottom-sheet.css لا يستخدم --color-text للنص — مطلوب للتباين النهاري.");
  }
  if (!/background:\s*var\(--color-surface/i.test(moreCss)) {
    fail("more-bottom-sheet.css لا يستخدم --color-surface للخلفية.");
  }
  // يجب ألا يفرض أبيضًا على العناصر في الوضع الافتراضي (خارج كتلة dark)
  const withoutDark = moreCss.replace(/html\[data-theme=["']dark["']\][\s\S]*?(?=html\[data-theme|\z)/g, "");
  if (/\.more-sheet-item\s*\{[^}]*color:\s*#(?:FFFFFF|fff)/i.test(withoutDark)) {
    fail("more-bottom-sheet.css يفرض نصًا أبيضًا على العناصر خارج الوضع الليلي.");
  }
}

// 4) المكوّن يستورد SSOT فقط — لا dark-emerald لورقة المزيد
{
  if (!moreTsx.includes('more-bottom-sheet.css')) {
    fail("MoreBottomSheet.tsx لا يستورد more-bottom-sheet.css.");
  }
  if (moreTsx.includes("dark-emerald-menus.css")) {
    fail("MoreBottomSheet.tsx عاد لاستيراد dark-emerald-menus.css — يُعاد عطل النهاري.");
  }
}

if (failed) {
  console.error("✗ حارس أمان قائمة المزيد فشل.");
  process.exit(1);
}

console.log("✓ حارس قائمة المزيد: لا نص أبيض إجباري على سطح نهاري؛ SSOT في more-bottom-sheet.css.");
