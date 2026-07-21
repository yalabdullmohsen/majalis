#!/usr/bin/env node
/**
 * تدقيق تباين آلي عبر عيّنة واسعة من الصفحات الحقيقية: يقرأ لون كل عنصر نص
 * ظاهر ولون أقرب خلفية غير شفافة له فعليًا (وليس افتراضًا)، ويحسب نسبة
 * التباين وفق صيغة WCAG (luminance)، ويُبلّغ عن كل مخالفة تحت 4.5:1
 * (النص العادي) أو 3:1 (النص الكبير ≥24px أو ≥19px عريض).
 *
 * التشغيل: node scripts/audit-color-contrast.mjs <baseUrl> <routesFile> [outJson]
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const baseUrl = process.argv[2] || "http://localhost:5178";
const routesFile = process.argv[3];
const outJson = process.argv[4] || "/tmp/contrast-audit-report.json";
// عرض نافذة قابل للتخصيص عبر VIEWPORT_W/VIEWPORT_H (افتراضيًا 390×844 —
// هاتف — كما كان السلوك الأصلي قبل هذا التعديل، للحفاظ على التوافق).
const viewportWidth = Number(process.env.VIEWPORT_W) || 390;
const viewportHeight = Number(process.env.VIEWPORT_H) || 844;

const routes = readFileSync(routesFile, "utf8").split("\n").map((l) => l.trim()).filter(Boolean);

const SCAN_FN = `() => {
  function parseColor(str) {
    const m = str.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }
  function relLum({ r, g, b }) {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }
  function contrast(c1, c2) {
    const l1 = relLum(c1), l2 = relLum(c2);
    const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (a + 0.05) / (b + 0.05);
  }
  // يعيد null إذا كانت الخلفية الفعلية متدرّجة (gradient) أو صورة — لا يمكن
  // أخذ عيّنة لونها بثقة من CSS وحده، فنتجاهل الفحص بدل توليد إنذار كاذب
  // (نمط "بطاقة hero بخلفية متدرجة ونص أبيض" شائع جدًا وصحيح في هذا الموقع).
  function effectiveBg(el) {
    let node = el;
    while (node) {
      const cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== "none") return null;
      const bg = parseColor(cs.backgroundColor);
      if (bg && bg.a > 0.5) return bg;
      node = node.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  }

  const results = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  const seen = new Set();
  let node;
  while ((node = walker.nextNode())) {
    if (node.children.length > 0) continue; // فقط عناصر ورقية (بلا أبناء عناصر) لتفادي الفحص المكرر
    const text = node.textContent?.trim();
    if (!text || text.length < 2) continue;
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const cs = getComputedStyle(node);
    if (cs.visibility === "hidden" || cs.display === "none" || parseFloat(cs.opacity) < 0.2) continue;
    // نص لقارئ الشاشة فقط (sr-only): مخفي بصريًا عمدًا عبر clip/clip-path
    // بعرض/ارتفاع 1px (لا 0)، فيمر من فحص rect أعلاه لكن لا يراه أحد فعليًا
    // — استبعاده يمنع إنذارات كاذبة عن نص لا يُعرَض بصريًا أصلًا.
    if (
      (cs.clipPath && cs.clipPath !== "none") ||
      (cs.clip && cs.clip !== "auto") ||
      (rect.width <= 1 && rect.height <= 1)
    ) continue;
    const fg = parseColor(cs.color);
    if (!fg) continue;
    const bg = effectiveBg(node);
    if (!bg) continue;
    // امزج شفافية النص مع الخلفية الفعلية — نص "أبيض 60%" فوق بطاقة ملوّنة
    // يُعرَض بلون ممزوج فعليًا، لا أبيض خالص؛ تجاهل الشفافية هنا يُولّد
    // إنذارات كاذبة كثيرة على أنماط "شارة" و"تسمية" الشائعة في الموقع.
    const blended = fg.a < 1
      ? { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) }
      : fg;
    const ratio = contrast(blended, bg);
    const fontSize = parseFloat(cs.fontSize);
    const fontWeight = parseInt(cs.fontWeight, 10) || 400;
    const isLarge = fontSize >= 24 || (fontSize >= 19 && fontWeight >= 700);
    const threshold = isLarge ? 3 : 4.5;
    if (ratio < threshold) {
      const cls = node.className && typeof node.className === "string" ? node.className.split(" ")[0] : "";
      const key = cls + "|" + cs.color + "|" + cs.backgroundColor;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({
        tag: node.tagName.toLowerCase(),
        cls,
        text: text.slice(0, 50),
        color: cs.color,
        bg: cs.backgroundColor,
        effectiveBg: \`rgb(\${bg.r},\${bg.g},\${bg.b})\`,
        ratio: Math.round(ratio * 100) / 100,
        threshold,
        fontSize,
      });
    }
  }
  return results;
}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: viewportWidth, height: viewportHeight } });

const allProblems = [];
let i = 0;
for (const route of routes) {
  i++;
  try {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(500);
    const lightProblems = await page.evaluate(`(${SCAN_FN})()`);

    // كرّر الفحص في الوضع الداكن أيضًا
    await page.evaluate(() => { document.documentElement.dataset.theme = "dark"; document.documentElement.classList.add("dark"); localStorage.setItem("majalis-theme", "dark"); });
    await page.waitForTimeout(300);
    const darkProblems = await page.evaluate(`(${SCAN_FN})()`);
    await page.evaluate(() => { document.documentElement.dataset.theme = "light"; document.documentElement.classList.remove("dark"); localStorage.setItem("majalis-theme", "light"); });

    for (const p of lightProblems) allProblems.push({ route, mode: "light", ...p });
    for (const p of darkProblems) allProblems.push({ route, mode: "dark", ...p });
  } catch (e) {
    console.error(`route ${route} failed: ${String(e).slice(0, 150)}`);
  }
  if (i % 10 === 0) console.error(`... ${i}/${routes.length}`);
}

await browser.close();

// تجميع حسب (class + لون + خلفية) بدل تكرار كل مسار — نفس المكوّن يتكرر عبر صفحات كثيرة
const grouped = new Map();
for (const p of allProblems) {
  const key = `${p.mode}|${p.cls}|${p.color}|${p.bg}`;
  if (!grouped.has(key)) grouped.set(key, { ...p, routes: [] });
  grouped.get(key).routes.push(p.route);
}
const uniqueIssues = [...grouped.values()].map((g) => ({ ...g, routeCount: g.routes.length, routes: g.routes.slice(0, 5) }));
uniqueIssues.sort((a, b) => a.ratio - b.ratio);

writeFileSync(outJson, JSON.stringify({ totalRaw: allProblems.length, uniqueIssues: uniqueIssues.length, issues: uniqueIssues }, null, 2));
console.error(`\nإجمالي المخالفات الخام: ${allProblems.length} — بعد التجميع حسب النمط المتكرر: ${uniqueIssues.length}`);
console.error(`التقرير: ${outJson}`);
