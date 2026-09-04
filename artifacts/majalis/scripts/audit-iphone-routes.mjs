#!/usr/bin/env node
/**
 * تدقيق تقني/بصري شامل لمسارات Majlisilm على مقاسات iPhone.
 * Usage:
 *   node scripts/audit-iphone-routes.mjs [--base=URL] [--widths=390] [--theme=light|dark|both] [--pass=1]
 *   --batch=shared|core|sections|all
 */
import { chromium, devices } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const base = process.argv.find((a) => a.startsWith("--base="))?.slice(7) || "http://127.0.0.1:24216";
const themeArg = process.argv.find((a) => a.startsWith("--theme="))?.slice(8) || "light";
const batch = process.argv.find((a) => a.startsWith("--batch="))?.slice(8) || "all";
const pass = process.argv.find((a) => a.startsWith("--pass="))?.slice(7) || "1";
const widthsArg = process.argv.find((a) => a.startsWith("--widths="))?.slice(9);
const WIDTHS = (widthsArg || "390").split(",").map((n) => Number(n.trim())).filter(Boolean);

/** مسارات عامة ثابتة (بدون params/admin/redirects) — تغطية واجهة المستخدم */
const BATCHES = {
  shared: [
    /* shell يُفحص ضمن أي صفحة؛ نستخدم الرئيسية + إعدادات + بحث */
    "/", "/settings", "/search", "/sitemap", "/about",
  ],
  core: [
    "/", "/quran-hub", "/lessons", "/prayer-times", "/adhkar",
    "/qa", "/library", "/hadith", "/daily-wird",
    "/login", "/register", "/kids", "/start-here", "/contact",
    "/privacy", "/terms", "/methodology",
  ],
  sections: [
    "/tawhid", "/fiqh", "/seerah", "/sections", "/calendar", "/occasions",
    "/miracles", "/prophetic-medicine", "/quran-circles", "/fawaid",
    "/hadith/books", "/hadith/books-and-rulings", "/hadith/sahih",
    "/hadith/daif", "/hadith/mawdu", "/stories", "/nations", "/prophets",
    "/prophets/tree", "/quiz", "/knowledge-graph", "/knowledge-map",
    "/mind-map", "/islamic-landmarks", "/mutashabihat", "/tarikh-islami",
    "/asma-husna", "/akhlaq", "/duas", "/arkan", "/arkan-iman",
    "/hadith-science", "/madhahib", "/islamic-sects", "/fiqh-qawaid",
    "/shamael", "/islam-stats", "/islamic-glossary", "/adab-talab-ilm",
    "/anbiya", "/janna-naar", "/alamat-saah", "/malaika",
    "/wasaya-nabawiyya", "/raqaiq", "/sunan-yawmiyya", "/hikam-salaf",
    "/zakat", "/sawm", "/hajj", "/tahara", "/fadail-aamal", "/janaza",
    "/sahabah", "/tawba", "/sins-and-rights", "/amr-bil-maruf",
    "/ulum-quran", "/mawarith", "/mawarith/calculator", "/salah-guide",
    "/duas-quran", "/submit", "/flashcards", "/car-mode", "/mosque-mode",
    "/notification-settings", "/study-room", "/family", "/vault",
    "/researcher", "/institutions", "/learning/paths", "/learning/quiz",
    "/learning/calendar", "/my-learning", "/my-citations",
    "/academic-research", "/universities", "/universities/compare",
    "/quran/surahs", "/quran/revelation-order", "/quran/makki-madani",
    "/quran-memorization", "/quran/memorization-plans", "/quran/tajweed",
    "/quran/surah-stories", 
    "/discover-islam", "/discover-islam/questions", "/discover-islam/doubts",
    "/discover-islam/how-to-convert", "/discover-islam/new-muslim",
    "/discover-islam/contact", "/prayer-countdown", "/prayer-ranks",
    "/adhan-settings", "/qibla", "/tasbih", "/features-in-progress",
    "/arbaeen-nawawi", "/sujood-sahw", "/amrad-qalbiyya",
    "/durus-imaniyya", "/durus-mutanawwia", "/iman-topics",
    "/quran-studies", "/sunnah-studies", "/tazkiya-topics",
    "/tarikh-islami", "/usra-mujtama", "/fikr-waqia", "/mawsuaat",
    "/masarat", "/cards", "/annual-courses", "/fiqh-council",
    "/fiqh-council/issues", "/fiqh-council/index", "/fiqh-council/stats",
    "/fiqh-council/resolutions", "/fiqh-council/fatwas",
    "/fiqh-council/recommendations", "/fiqh-council/nawazil",
    "/fiqh-council/research", "/fiqh-council/categories",
    "/fiqh-council/search", "/fiqh-council/research-assistant",
    "/fiqh-council/compare", "/fiqh-council/archive", "/fiqh-council/live",
    "/rulings", "/updates", "/assistant", "/account-deletion",
    "/reading-plans", "/learning-plan", "/kuwait-lessons",
    "/mushaf", "/mushaf/page", "/mushaf/about-edition",
    "/hadith/arbaeen-love-of-allah",
  ],
};

const ROUTES = batch === "all"
  ? [...new Set([...BATCHES.shared, ...BATCHES.core, ...BATCHES.sections])]
  : BATCHES[batch] || BATCHES.core;

const THEMES = themeArg === "both" ? ["light", "dark"] : [themeArg];

async function auditPage(page, path, width, theme) {
  const issues = [];
  const url = new URL(path, base).toString();
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25_000 });
    await page.waitForTimeout(900);
    // انتظر ظهور عنوان دلالي إن وُجد (صفحات async مثل مواقيت الصلاة)
    await page.waitForSelector("h1", { timeout: 4_000 }).catch(() => {});
    // انتظر انتهاء هياكل التحميل الشائعة حتى لا يمرّ تدقيق المحتوى الفارغ زائفًا
    await page.waitForFunction(() => {
      const sk = document.querySelector(".skeleton-card, .ui-skeleton, [data-loading='true']");
      return !sk;
    }, { timeout: 5_000 }).catch(() => {});
    await page.waitForTimeout(250);
  } catch (e) {
    return { issues: [{ code: "NAV_FAIL", detail: String(e.message || e).slice(0, 120) }], metrics: {} };
  }

  await page.evaluate((t) => {
    document.documentElement.setAttribute("data-theme", t);
  }, theme);

  const report = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const out = { flags: [], metrics: {} };

    out.metrics.dir = doc.getAttribute("dir") || body.getAttribute("dir") || getComputedStyle(doc).direction;
    out.metrics.overflowX = doc.scrollWidth > doc.clientWidth + 2;
    out.metrics.scrollW = doc.scrollWidth;
    out.metrics.clientW = doc.clientWidth;
    out.metrics.hasH1 = !!document.querySelector("h1");
    out.metrics.errorBoundary = body.innerText.includes("تعذر عرض هذه الصفحة");
    out.metrics.theme = doc.getAttribute("data-theme") || "light";

    const nav = document.querySelector(".bottom-nav");
    if (nav) {
      const nr = nav.getBoundingClientRect();
      out.metrics.bottomNavGap = window.innerHeight - nr.bottom;
      out.metrics.bottomNavDisplay = getComputedStyle(nav).display;
      out.metrics.bottomNavH = Math.round(nr.height);
    } else {
      out.metrics.bottomNavGap = null;
      // mushaf يخفي الشريط عمدًا
      out.metrics.bottomNavHiddenOk = location.pathname.startsWith("/mushaf");
    }

    const header = document.querySelector(".navbar-v3");
    if (header) {
      const hr = header.getBoundingClientRect();
      out.metrics.headerTop = Math.round(hr.top);
      out.metrics.headerSticky = getComputedStyle(header).position;
    }

    // أهداف لمس صغيرة في المحتوى الرئيسي (تجاهل الفوتر/الـskip)
    // استثناءات مقصودة: آيات المصحف المضمونة (نص قرآني كثيف)، عقد الرسوم البيانية SVG
    const small = [];
    for (const el of document.querySelectorAll("a, button, [role='button']")) {
      if (el.closest(".site-footer, .skip-link, .sr-only, [aria-hidden='true'], .mf2-ayah-group, svg, .knowledge-graph, .kng-canvas, .pft-svg, .prophets-tree")) continue;
      if (el.classList?.contains("mf2-ayah-group")) continue;
      const st = getComputedStyle(el);
      if (st.display === "none" || st.visibility === "hidden" || st.pointerEvents === "none") continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.top > window.innerHeight * 2.5) continue; // خارج منطقة الاهتمام الأولى
      if (r.width < 44 || r.height < 44) {
        const cls = typeof el.className === "string" ? el.className : (el.getAttribute("class") || "");
        small.push({
          cls: cls.slice(0, 48),
          w: Math.round(r.width),
          h: Math.round(r.height),
          t: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 28),
        });
        if (small.length >= 6) break;
      }
    }
    out.metrics.smallTouch = small;

    // تباين تقريبي: نص شبه شفاف فوق خلفية فاتحة
    const lowContrast = [];
    for (const el of document.querySelectorAll("h1, h2, p, a, button, .ds-page-header__title")) {
      const st = getComputedStyle(el);
      const c = st.color;
      if (c.includes("rgba") && /rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0\.[0-3]/.test(c)) {
        lowContrast.push(String(el.className || el.tagName).slice(0, 40));
        if (lowContrast.length >= 3) break;
      }
    }
    out.metrics.lowContrastHints = lowContrast;

    return out;
  });

  if (report.metrics.dir !== "rtl") issues.push({ code: "RTL", detail: `dir=${report.metrics.dir}` });
  if (report.metrics.overflowX) issues.push({ code: "OVERFLOW_X", detail: `${report.metrics.scrollW}>${report.metrics.clientW}` });
  if (report.metrics.errorBoundary) issues.push({ code: "ERROR_BOUNDARY", detail: "تعذر عرض هذه الصفحة" });
  if (!report.metrics.hasH1 && !path.startsWith("/mushaf") && path !== "/auth/callback") {
    issues.push({ code: "NO_H1", detail: "missing h1" });
  }
  if (report.metrics.bottomNavGap != null) {
    if (Math.abs(report.metrics.bottomNavGap) > 1.5) {
      issues.push({ code: "BOTTOM_NAV_GAP", detail: `gap=${report.metrics.bottomNavGap}` });
    }
  } else if (!report.metrics.bottomNavHiddenOk && width <= 879) {
    issues.push({ code: "NO_BOTTOM_NAV", detail: "missing bottom nav" });
  }
  // أهداف لمس: نبلّغ فقط إن وُجد ≥3 أهداف صغيرة في أعلى الصفحة (إشارة منهجية)
  if (report.metrics.smallTouch.length >= 3) {
    issues.push({
      code: "SMALL_TOUCH",
      detail: report.metrics.smallTouch.slice(0, 4).map((s) => `${s.cls||"?"} ${s.w}x${s.h}`).join("; "),
    });
  }

  return { issues, metrics: report.metrics };
}

async function main() {
  console.log(`\n══ iPhone route audit pass=${pass} batch=${batch} themes=${THEMES.join(",")} widths=${WIDTHS.join(",")} ══`);
  console.log(`routes=${ROUTES.length} base=${base}\n`);

  const browser = await chromium.launch();
  const results = [];
  let failCount = 0;

  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      const context = await browser.newContext({
        ...devices["iPhone 14"],
        viewport: { width, height: 844 },
        colorScheme: theme === "dark" ? "dark" : "light",
      });
      const page = await context.newPage();
      for (const path of ROUTES) {
        const { issues, metrics } = await auditPage(page, path, width, theme);
        const ok = issues.length === 0;
        if (!ok) failCount++;
        const row = { path, width, theme, ok, issues, metrics };
        results.push(row);
        const mark = ok ? "✓" : "✗";
        const detail = ok ? "" : " " + issues.map((i) => i.code).join(",");
        console.log(`${mark} [${theme} ${width}] ${path}${detail}`);
      }
      await context.close();
    }
  }

  await browser.close();

  const outDir = join(__dirname, "../.audit");
  mkdirSync(outDir, { recursive: true });
  const outFile = join(outDir, `iphone-pass${pass}-${batch}-${Date.now()}.json`);
  writeFileSync(outFile, JSON.stringify({ base, pass, batch, WIDTHS, THEMES, failCount, results }, null, 2));

  // ملخص حسب نوع المشكلة
  const byCode = {};
  for (const r of results) {
    for (const i of r.issues) {
      byCode[i.code] = byCode[i.code] || [];
      byCode[i.code].push(`${r.theme}@${r.width} ${r.path}: ${i.detail}`);
    }
  }
  console.log("\n── Summary ──");
  console.log(`checked=${results.length} failing=${failCount}`);
  for (const [code, list] of Object.entries(byCode)) {
    console.log(`\n${code} (${list.length}):`);
    list.slice(0, 25).forEach((l) => console.log("  ·", l));
    if (list.length > 25) console.log(`  … +${list.length - 25} more`);
  }
  console.log(`\nreport: ${outFile}`);
  process.exit(failCount ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
