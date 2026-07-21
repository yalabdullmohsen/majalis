#!/usr/bin/env node
/**
 * بوابة انحدار تباين دائمة ضمن pnpm run test:regression.
 *
 * لماذا فحص مُستهدَف لا فحصًا شاملًا: تدقيق تباين آلي شامل (عبر Playwright
 * حي، 227 مسارًا حقيقيًا × نمطين × عدة قياسات) نُفِّذ يدويًا هذه الجلسة
 * (2026-07-19) ووجد مئات المخالفات المتراكمة عبر سنوات من الجلسات
 * السابقة — أكبر بكثير مما يمكن إصلاحه دفعة واحدة. ربط بوابة "يجب أن
 * تنجح دومًا" بفحص شامل كهذا يجعلها فاشلة بنيويًا من أول تشغيل (لا
 * علاقة له بأي انحدار حقيقي تسبب به تعديل لاحق) — عديم الفائدة كبوابة.
 *
 * بدلًا من ذلك: هذه البوابة تؤكّد تحديدًا أن أعطال التباين الحقيقية
 * المُصلَحة فعليًا هذه الجلسة (جذر الشكوى: نص أبيض فوق خلفية بيج تقريبًا
 * في .revord-hero، وأمثلة أخرى من نفس نمط الخلل) لا تعود لاحقًا. لإجراء
 * تدقيق شامل جديد لبقية الموقع: node scripts/audit-color-contrast.mjs.
 *
 * كل تأكيد assertion يفحص لون العنصر الفعلي (getComputedStyle) مقابل
 * أقرب خلفية غير شفافة فعليًا (لا افتراضًا)، ويحسب نسبة تباين WCAG
 * الحقيقية، ويقارنها بحد أدنى صريح لكل حالة.
 *
 * لا يُشغَّل ضمن `build` (بيئة نشر Vercel لا تضمن توفر متصفح Chromium أو
 * الوقت الإضافي في كل عملية نشر) — فقط ضمن test:regression كتحقق تطويري.
 *
 * التشغيل المباشر: node scripts/verify-color-contrast-gate.mjs
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = process.env.CONTRAST_GATE_PORT || "24391";
const baseUrl = `http://127.0.0.1:${PORT}`;

/**
 * كل تأكيد: مسار + selector + الوضع (light/dark) + أدنى نسبة تباين
 * مقبولة (عادة نفس عتبة WCAG AA للحجم الفعلي، أحيانًا أقل قليلًا كهامش
 * أمان بسيط لتقلّب رقمي طفيف بلا دلالة).
 */
const ASSERTIONS = [
  // .revord-hero — الشكوى الأصلية للمالك بالحرف: "ترتيب نزول القرآن
  // الكريم" بنص أبيض فوق خلفية بيج فاتحة تقريبًا. [class$="-hero"] كانت
  // تفترض خلفية داكنة خطأً لكل صنف ينتهي بـ"-hero" بلا استثناء.
  { route: "/quran/revelation-order", selector: ".revord-hero h1", mode: "light", min: 4.5 },
  { route: "/quran/revelation-order", selector: ".revord-hero p", mode: "light", min: 4.5 },
  { route: "/quran/revelation-order", selector: ".revord-note", mode: "light", min: 4.5 },
  { route: "/quran/revelation-order", selector: ".revord-hero h1", mode: "dark", min: 4.5 },
  // نفس نمط الخلل بالضبط على صفحات "-hero" أخرى ذات خلفية فاتحة فعليًا
  // (.an-hero، .dvp-hero) — مُصلَحة بنفس الآلية (استثناء بالمصدر لا ترقيع لاحق).
  { route: "/arbaeen-nawawi", selector: ".an-hero__title", mode: "light", min: 3 },
  { route: "/arbaeen-nawawi", selector: ".an-hero__eyebrow", mode: "light", min: 4.5 },
  { route: "/developers", selector: ".dvp-title", mode: "light", min: 3 },
  { route: "/developers", selector: ".dvp-intro", mode: "light", min: 4.5 },
  // .fiqh-council-subnav-link — خلفية #fff ثابتة غير مشروطة بالسمة، بقيت
  // بيضاء في الوضع الليلي بينما تحوّل النص لفاتح = نص شبه أبيض على أبيض.
  { route: "/fiqh-council", selector: ".fiqh-council-subnav-link", mode: "dark", min: 4.5 },
  // زر CTA أخضر (.btn-primary وما شابه) كان يفقد لونه الصحيح (أبيض/داكن)
  // أمام قاعدة "كل <a> أخضر في الوضع الليلي" العامة (تخصيص أعلى).
  { route: "/account-deletion", selector: ".btn-primary", mode: "dark", min: 3 },
  // بطاقات الرئيسية الداكنة (.ui-card/.ds-quiz-home-card/.home-library-card)
  // — عناوين h2/h3 بداخلها كانت تُصبح بلون الخلفية نفسه تقريبًا (--elite-forest
  // الداكن) عبر قاعدة `[class*="card"] h*` العامة الأعلى تخصيصًا.
  { route: "/", selector: ".hnh__title", mode: "light", min: 3 },
  { route: "/", selector: ".ds-quiz-home-card__title", mode: "light", min: 3 },
  { route: "/", selector: ".home-library-card__title", mode: "light", min: 3 },
  // ── تكليف ثانٍ (2026-07-19، بند 7): عناوين "شارة" أقسام (نص أبيض/خلفية
  // خضراء داكنة، §4c في elite-2026.css) كانت تخسر لونها الأبيض المقصود أمام
  // قواعد `.home-section h2`/`.page-shell h2:not(...)` عالية التخصيص (بفعل
  // كثرة not()) التي تفتقد بعض أصناف الشارة من قائمة استثنائها — نفس نمط
  // عطل [class$="-hero"] بالضبط (قاعدة عامة تفترض سياقًا خاطئًا). يجب أن
  // تبقى هذه التأكيدات ملاصقة لتأكيدات "/" الأخرى أعلاه — routeCache في
  // main() لا يُعيد زيارة مسار سبقت زيارته، فتأكيد "/" بعيد عن مجموعته هنا
  // يُقاس فعليًا على آخر مسار آخر تمت زيارته (فشل زائف، لا عطل تباين حقيقي). ──
  // "المكتبة العلمية" (HomeFeaturedLibrary) داخل .home-section على الرئيسية
  // — معرِّف فريد #home-library-heading لا الصنف العام (.ds-section__title
  // يطابق أيضًا "مواسم التعلّم" السابق له في DOM، فيختبر عنصرًا مختلفًا خطأً).
  { route: "/", selector: "#home-library-heading", mode: "light", min: 4.5 },
  // "مواسم التعلّم" (.ds-section__title نفسه، بطاقة مختلفة بلا .home-section
  // تعارض) — في الوضع الليلي فقط: --elite-forest يتحوّل لأخضر نعناعي أفتح
  // فلا يكفي نص أبيض ثابت (color:#fff) فوقه.
  { route: "/", selector: ".lsw-section .ds-section__title", mode: "dark", min: 3 },
  // .sq-title (عنوان SectionQuiz داخل .sq-header الداكن) كان يخسر نفس المعركة.
  { route: "/cards", selector: ".sq-title", mode: "light", min: 4.5 },
  // .twh-hub-card__current-tag اكتسب خلفية داكنة بالخطأ (يطابق [class*="-card"]
  // اسميًا رغم أنه شارة صغيرة لا حاوية)، فتطابق لون نصه الخاص تقريبًا.
  { route: "/tawhid", selector: ".twh-hub-card__current-tag", mode: "dark", min: 3 },
  // .notif-row__label و.ads-sunrise-time: لون نص ثابت لا يراعي السمة.
  { route: "/notification-settings", selector: ".notif-row__label", mode: "dark", min: 4.5 },
  { route: "/adhan-settings", selector: ".ads-sunrise-time", mode: "dark", min: 4.5 },
  // .seerah-panel__topic (رقاقة موضوع) كانت مُدرَجة خطأً ضمن قائمة "نص
  // أبيض على كل خلفية خضراء داكنة" الضخمة رغم خلفيتها الشفافة الخاصة.
  { route: "/seerah", selector: ".seerah-panel__topic", mode: "light", min: 4.5 },
  // --ds-text-1/--ds-text-2 متغيّران كانا غير معرَّفين إطلاقًا فسقطا دومًا
  // للقيمة الاحتياطية الداكنة الثابتة بصرف النظر عن السمة.
  { route: "/quran-memorization", selector: ".qmem-section-title", mode: "dark", min: 4.5 },
  // .jnz-subtitle/.jnz-related__title: صفحة /janaza خلفيتها بيضاء ثابتة
  // (لا تتحول للداكن)، فكانت قاعدة "كل h2 أبيض في الوضع الليلي" العامة
  // تفرض نصًا شبه أبيض فوق هذه الخلفية البيضاء الثابتة.
  { route: "/janaza", selector: ".jnz-subtitle", mode: "dark", min: 4.5 },
  // "الأقرب موعدًا"/"جارٍ الآن" و"الدروس السابقة" في صفحة الدروس — نسخة
  // modern-2026.css من قائمة استثناء `.page-shell h2:not(...)` كانت متأخرة
  // عن نظيرتها الكاملة في majalis-v2.css (تفتقد lessons-v2/lessons-past
  // وغيرها).
  { route: "/lessons", selector: ".lessons-v2-section__title", mode: "light", min: 4.5 },
  { route: "/lessons", selector: ".lessons-past-section__title", mode: "light", min: 4.5 },
];

const RATIO_FN = `(selector) => {
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
  const el = document.querySelector(selector);
  if (!el) return { error: "NOT_FOUND" };
  const cs = getComputedStyle(el);
  const fg = parseColor(cs.color);
  const bg = effectiveBg(el);
  if (!fg || !bg) return { error: "NO_COLOR" };
  const blended = fg.a < 1
    ? { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) }
    : fg;
  return { ratio: Math.round(contrast(blended, bg) * 100) / 100, color: cs.color, bg: \`rgb(\${bg.r},\${bg.g},\${bg.b})\` };
}`;

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((res, rej) => {
    const tryOnce = () => {
      fetch(url).then((r) => res(r.status)).catch(() => {
        if (Date.now() - start > timeoutMs) rej(new Error(`Server did not respond at ${url} within ${timeoutMs}ms`));
        else setTimeout(tryOnce, 400);
      });
    };
    tryOnce();
  });
}

async function main() {
  console.log(`▶ تشغيل خادم Vite dev محلي على المنفذ ${PORT} لبوابة انحدار تباين الألوان...`);
  const server = spawn("pnpm", ["run", "dev"], {
    cwd: appRoot,
    env: { ...process.env, PORT },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
  let serverOutput = "";
  server.stdout.on("data", (d) => { serverOutput += d.toString(); });
  server.stderr.on("data", (d) => { serverOutput += d.toString(); });

  const killServer = () => {
    try { process.kill(-server.pid, "SIGTERM"); } catch { /* already dead */ }
  };

  try {
    await waitForServer(baseUrl, 45000);
  } catch (e) {
    console.error(serverOutput.slice(-2000));
    killServer();
    console.error(`❌ تعذّر تشغيل خادم dev: ${e.message}`);
    process.exit(1);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const failures = [];
  const routeCache = new Map();

  for (const a of ASSERTIONS) {
    const cacheKey = `${a.route}|${a.mode}`;
    try {
      if (!routeCache.has(a.route)) {
        await page.goto(`${baseUrl}${a.route}`, { waitUntil: "networkidle", timeout: 15000 });
        await page.waitForTimeout(400);
        routeCache.set(a.route, true);
      }
      const currentMode = await page.evaluate(() => document.documentElement.dataset.theme || "light");
      if (currentMode !== a.mode) {
        await page.evaluate((mode) => {
          document.documentElement.dataset.theme = mode;
          document.documentElement.classList.toggle("dark", mode === "dark");
        }, a.mode);
        await page.waitForTimeout(300);
      }
      // انتظار ظهور العنصر فعليًا قبل القياس — بعض ودجتات الرئيسية (مثل
      // .lsw-section/#home-library-heading) قد تستغرق أطول قليلاً من مهلة
      // الـ400ms العامة أعلاه عند أول تحميل بارد لخادم dev (تصريف Vite
      // للوحدات عند أول طلب)، فيُبلَّغ خطأً بأن العنصر "غير موجود" رغم أنه
      // يظهر فعليًا بعد فاصل بسيط. لا يغيّر هذا نتيجة أي تأكيد آخر — مجرد
      // انتظار إضافي آمن قبل القياس.
      await page.waitForSelector(a.selector, { timeout: 4000 }).catch(() => {});
      const result = await page.evaluate(`(${RATIO_FN})(${JSON.stringify(a.selector)})`);
      if (result.error === "NOT_FOUND") {
        failures.push(`${a.route} [${a.mode}] ${a.selector} — العنصر غير موجود في الصفحة (تغيّر بنيوي؟ راجع يدويًا)`);
      } else if (result.error) {
        failures.push(`${a.route} [${a.mode}] ${a.selector} — تعذّر قياس اللون (${result.error})`);
      } else if (result.ratio < a.min) {
        failures.push(`${a.route} [${a.mode}] ${a.selector} — ${result.color} على ${result.bg} = ${result.ratio}:1 (يلزم ${a.min}:1) — رجوع عطل تباين مُصلَح سابقًا!`);
      }
    } catch (e) {
      failures.push(`${a.route} [${a.mode}] ${a.selector} — خطأ فحص: ${String(e).slice(0, 150)}`);
    }
  }

  await browser.close();
  killServer();

  if (failures.length > 0) {
    console.error(`\n❌ بوابة انحدار تباين الألوان رسبت — ${failures.length}/${ASSERTIONS.length} تأكيدًا فشل:\n`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }

  console.log(`✓ بوابة انحدار تباين الألوان نجحت — كل الأعطال المُصلَحة هذه الجلسة (${ASSERTIONS.length} تأكيدًا) ما زالت مُصلَحة.`);
}

main().catch((e) => {
  console.error("❌ خطأ غير متوقع في بوابة تباين الألوان:", e);
  process.exit(1);
});
