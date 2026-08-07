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
  // (.an-hero) — مُصلَحة بنفس الآلية (استثناء بالمصدر لا ترقيع لاحق).
  // ملاحظة: /developers (.dvp-*) حُذفت بالكامل في commit 33d87461
  // ("simplify public navigation") — أُزيلت تأكيداتها هنا معه.
  { route: "/arbaeen-nawawi", selector: ".an-hero__title", mode: "light", min: 3 },
  { route: "/arbaeen-nawawi", selector: ".an-hero__eyebrow", mode: "light", min: 4.5 },
  // .fiqh-council-subnav-link — خلفية #fff ثابتة غير مشروطة بالسمة، بقيت
  // بيضاء في الوضع الليلي بينما تحوّل النص لفاتح = نص شبه أبيض على أبيض.
  { route: "/fiqh-council", selector: ".fiqh-council-subnav-link", mode: "dark", min: 4.5 },
  // زر CTA أخضر (.btn-primary وما شابه) كان يفقد لونه الصحيح (أبيض/داكن)
  // أمام قاعدة "كل <a> أخضر في الوضع الليلي" العامة (تخصيص أعلى).
  { route: "/account-deletion", selector: ".btn-primary", mode: "dark", min: 3 },
  // الرئيسية المركّزة في إصدار الإطلاق: نفحص العناصر الثابتة الظاهرة بدل
  // ودجتات الحديث/المسابقة/المكتبة التي أصبحت اختيارية من شاشة التخصيص.
  // لا تتغير عتبات WCAG؛ تغيرت فقط أهداف DOM لتطابق البنية المنشورة فعليًا.
  { route: "/", selector: ".m2030-btn--primary", mode: "light", min: 4.5 },
  { route: "/", selector: ".m2030-btn--primary", mode: "dark", min: 4.5 },
  { route: "/", selector: ".m2030-band__title", mode: "light", min: 4.5 },
  { route: "/", selector: ".m2030-feature__title", mode: "light", min: 4.5 },
  // ── تكليف ثانٍ (2026-07-19، بند 7): عناوين "شارة" أقسام (نص أبيض/خلفية
  // خضراء داكنة، §4c في elite-2026.css) كانت تخسر لونها الأبيض المقصود أمام
  // قواعد `.home-section h2`/`.page-shell h2:not(...)` عالية التخصيص (بفعل
  // كثرة not()) التي تفتقد بعض أصناف الشارة من قائمة استثنائها — نفس نمط
  // عطل [class$="-hero"] بالضبط (قاعدة عامة تفترض سياقًا خاطئًا). يجب أن
  // تبقى هذه التأكيدات ملاصقة لتأكيدات "/" الأخرى أعلاه — routeCache في
  // main() لا يُعيد زيارة مسار سبقت زيارته، فتأكيد "/" بعيد عن مجموعته هنا
  // يُقاس فعليًا على آخر مسار آخر تمت زيارته (فشل زائف، لا عطل تباين حقيقي). ──
  // زر التخصيص ثابت في البنية الجديدة ويجب أن يبقى مقروءًا على السطح العاجي.
  { route: "/", selector: ".m2030-customize", mode: "light", min: 4.5 },
  // "مواسم التعلّم" — شارة عنوان بقسم: نص على خلفية --elite-forest العميقة
  // (تبقى #143F35 في الوضع الليلي؛ لا تُسطَّح إلى نعناعي).
  { route: "/", selector: ".lsw-section .ds-section__title", mode: "dark", min: 3 },
  // ── أبطال الصفحات (2026-08): بطل الرئيسية يعرض title + greeting + أزرار؛
  // شعار «المعرفة الإسلامية الرقمية» انتقل لشريط الترويسة (.navbar-v3__tagline).
  { route: "/", selector: ".page-hero-mj__title", mode: "light", min: 3 },
  { route: "/", selector: ".navbar-v3__tagline", mode: "light", min: 4.5 },
  { route: "/", selector: ".page-hero-mj__desc", mode: "light", min: 4.5 },
  { route: "/", selector: ".page-hero-mj__actions .m2030-btn--primary", mode: "light", min: 4.5 },
  { route: "/", selector: ".page-hero-mj__title", mode: "dark", min: 3 },
  { route: "/", selector: ".navbar-v3__tagline", mode: "dark", min: 4.5 },
  { route: "/", selector: ".page-hero-mj__desc", mode: "dark", min: 4.5 },
  { route: "/", selector: ".page-hero-mj__actions .m2030-btn--primary", mode: "dark", min: 4.5 },
  // .sq-title (عنوان SectionQuiz داخل .sq-header الداكن) كان يخسر نفس المعركة.
  { route: "/cards", selector: ".sq-title", mode: "light", min: 4.5 },
  // .twh-hub-card__current-tag اكتسب خلفية داكنة بالخطأ (يطابق [class*="-card"]
  // اسميًا رغم أنه شارة صغيرة لا حاوية)، فتطابق لون نصه الخاص تقريبًا.
  { route: "/tawhid", selector: ".twh-hub-card__current-tag", mode: "dark", min: 3 },
  { route: "/quran-knowledge", selector: ".hub-card__title", mode: "light", min: 3 },
  { route: "/quran-knowledge", selector: ".hub-card__desc", mode: "light", min: 4.5 },
  { route: "/quran-knowledge", selector: ".hub-card__title", mode: "dark", min: 3 },
  { route: "/fiqh", selector: ".hub-card__title", mode: "light", min: 3 },
  { route: "/quran/surah-stories/1", selector: ".mj-btn", mode: "light", min: 4.5 },
  { route: "/quran/surah-stories/1", selector: ".mj-btn", mode: "dark", min: 4.5 },
  { route: "/quran/surah-stories/1", selector: ".sq-header", mode: "light", min: 4.5 },
  { route: "/quran/surah-stories/1", selector: ".sq-header", mode: "dark", min: 4.5 },
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
  { route: "/lessons", selector: ".page-hero-mj__title", mode: "light", min: 3 },
  { route: "/lessons", selector: ".page-hero-mj__desc", mode: "light", min: 4.5 },
  { route: "/lessons", selector: ".page-hero-mj__title", mode: "dark", min: 3 },
  { route: "/lessons", selector: ".page-hero-mj__desc", mode: "dark", min: 4.5 },
  { route: "/hadith", selector: ".page-hero-mj__title", mode: "light", min: 3 },
  { route: "/hadith", selector: ".page-hero-mj__desc", mode: "light", min: 4.5 },
  { route: "/fiqh", selector: ".page-hero-mj__title", mode: "light", min: 3 },
  { route: "/quran-knowledge", selector: ".page-hero-mj__title", mode: "light", min: 3 },
  // ── تدقيق تباين آلي حي إضافي (2026-07-21، 154 مسارًا عامًا، خارج /admin):
  // اثنان من العطلين المنهجيين الأوسع أثرًا.
  // 1) --txt-muted/--msk-text-3 (#929995) كانت مُحسَبة أصلًا مقابل أبيض
  // نقي (تعليق صريح في modern-2026.css)، لا مقابل --msk-canvas الفعلية
  // (#F7F4ED العاجية) — 48+ عنصر نص خافت بتباين ~2.5:1 فقط. اللون الجديد
  // #5E655F (5.5:1 مقابل #F7F4ED) عُمِّم عبر src/ كاملة (نفس القيمة
  // القديمة كانت مكرَّرة حرفيًا 150+ مرة).
  // صفحة الصلاة أعادت البناء إلى pts-* (لا .pt-date-greg). التأكيد على
  // .pts-dates فوق الخلفية الزمردية الصلبة لـ .pts-screen.
  { route: "/prayer-times", selector: ".pts-dates", mode: "light", min: 4.5 },
  { route: "/prayer-times", selector: ".pts-hero__name", mode: "light", min: 4.5 },
  { route: "/prayer-times", selector: ".pts-row__name", mode: "light", min: 4.5 },
  { route: "/prayer-times", selector: ".pts-hero__name", mode: "dark", min: 4.5 },
  { route: "/prayer-times", selector: ".pts-row__name", mode: "dark", min: 4.5 },
  // 2) نفس نمط "كل <a> أخضر فاتح في الوضع الليلي" الموثَّق أعلاه — 32
  // رابطًا إضافيًا لم يكونا مستثنَيَين (نص شبه غير مرئي فوق خلفيات بيضاء
  // أو خضراء متوسطة خاصة بها، تباين 1.3–2.79:1).
  { route: "/tawba", selector: ".tw-related__link", mode: "dark", min: 4.5 },
  { route: "/hajj", selector: ".hj-related__link", mode: "dark", min: 4.5 },
];

const RATIO_FN = `(selector) => {
  function parseColor(str) {
    if (!str || str === "transparent") return null;
    // rgb(255, 255, 255) | rgba(255, 255, 255, 0.8) | rgb(255 255 255 / 0.8)
    const m = str.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const body = m[1].trim();
    let r, g, b, a = 1;
    if (body.includes(",")) {
      const parts = body.split(",").map((s) => parseFloat(s.trim()));
      r = parts[0]; g = parts[1]; b = parts[2];
      if (parts.length > 3 && Number.isFinite(parts[3])) a = parts[3];
    } else {
      const [rgbPart, alphaPart] = body.split("/").map((s) => s.trim());
      const parts = rgbPart.split(/\\s+/).map((s) => parseFloat(s));
      r = parts[0]; g = parts[1]; b = parts[2];
      if (alphaPart != null) {
        a = alphaPart.endsWith("%") ? parseFloat(alphaPart) / 100 : parseFloat(alphaPart);
      } else if (parts.length > 3) {
        a = parts[3];
      }
    }
    if (![r, g, b].every(Number.isFinite)) return null;
    return { r, g, b, a: Number.isFinite(a) ? a : 1 };
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
    let solid = null;
    while (node) {
      const cs = getComputedStyle(node);
      const bg = parseColor(cs.backgroundColor);
      const hasImage = cs.backgroundImage && cs.backgroundImage !== "none";
      if (bg && bg.a > 0.5) {
        solid = bg;
        break;
      }
      if (hasImage && !solid) return null;
      node = node.parentElement;
    }
    if (!solid) solid = { r: 255, g: 255, b: 255, a: 1 };
    // إن وُجدت طبقة .pattern-backdrop تحت النص: قِس مقابل أغمق نقطة مركّبة
    // (لون --mj-brand بأعلى كثافة نقش: ٦٪ نهارًا / ٤٪ ليلًا).
    const hero = el.closest(".page-hero-mj");
    const pattern = hero && hero.querySelector(".pattern-backdrop");
    if (pattern) {
      const pcs = getComputedStyle(pattern);
      const brand = parseColor(pcs.color) || parseColor(getComputedStyle(document.documentElement).getPropertyValue("--mj-brand")) || { r: 20, g: 63, b: 53, a: 1 };
      // قراءة opacity المحسوبة للنقش
      let op = parseFloat(pcs.opacity);
      if (!Number.isFinite(op)) op = 0.06;
      // brand فوق solid: darkest = solid*(1-op) + brand*op
      return {
        r: solid.r * (1 - op) + brand.r * op,
        g: solid.g * (1 - op) + brand.g * op,
        b: solid.b * (1 - op) + brand.b * op,
        a: 1,
      };
    }
    return solid;
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
  console.log(`▶ تشغيل خادم Vite dev على 127.0.0.1:${PORT} لبوابة انحدار تباين الألوان...`);
  // تجاوز --host 0.0.0.0 في سكربت dev — البوابة تلزم loopback فقط.
  const server = spawn(
    "pnpm",
    ["exec", "vite", "--config", "vite.config.ts", "--host", "127.0.0.1", "--port", PORT],
    {
      cwd: appRoot,
      env: { ...process.env, PORT, BASE_PATH: process.env.BASE_PATH || "/", HOST: "127.0.0.1" },
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    },
  );
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

  let browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    killServer();
    console.error("❌ متصفح Playwright Chromium غير مثبت أو غير قابل للتشغيل.");
    console.error("   ثبّته صراحة (لا تتجاوز الفشل بصمت):");
    console.error("   pnpm exec playwright install --with-deps chromium");
    console.error(String(e?.message || e).slice(0, 400));
    process.exit(1);
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const failures = [];
  let lastRoute = null;

  for (const a of ASSERTIONS) {
    try {
      if (lastRoute !== a.route) {
        await page.goto(`${baseUrl}${a.route}`, { waitUntil: "networkidle", timeout: 15000 });
        await page.waitForTimeout(400);
        lastRoute = a.route;
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
