#!/usr/bin/env node
/**
 * بوابة «لا أسود على الأخضر» — تحليل ساكن لكل CSS/TSX في src/.
 *
 * تكتشف ثلاث فئات لا تكتشفها بوابة التباين المتصفّحية:
 *
 *  ١) سطح علامة غامق (brand-600 فما فوق) ولون نصّه أغمق من #E5E5E5.
 *  ٢) سطح علامة غامق بلا ‎color‎ إطلاقًا — النص يرث ما لا يُعرف.
 *  ٣) نصّ فوق سطح علامة مخفَّت بـ‎opacity‎ بدل لون صريح. هذه أخطرها:
 *     ‎getComputedStyle(color)‎ يقول ‎#FFFFFF‎ فتمرّ بوابة المتصفح، والبكسل
 *     المرسوم أخفت بكثير. هكذا نجا سطر «حيَّ على الصلاة» باهتًا.
 *
 * الاستعمال:
 *   node scripts/verify-on-brand-contrast.mjs
 *   node scripts/verify-on-brand-contrast.mjs --json
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(APP_ROOT, "src");
const JSON_OUT = process.argv.includes("--json");

/** ملفات الرموز نفسها مستثناة: هي *مصدر* التعريف لا مستهلك له. */
const TOKEN_FILES = new Set(["src/styles/tokens.css", "src/styles/brand-v4.css"]);

/* ── مقياس الأخضر: brand-600 فما فوق = سطح علامة غامق ──────────────── */
const DARK_BRAND_HEXES = new Set(
  [
    "#1e5f4b", "#174a3a", "#12362c", "#0e241e", "#091814", // em-600..950
    "#173d35", "#12362a", "#0b5c4a", "#147a5f", "#115e59",
    "#134e4a", "#14532d", "#0f3d2e", "#2e8b6f", "#267a61",
    "#1a3e34", "#173028",
  ].map((h) => h.toLowerCase()),
);

const DARK_BRAND_VARS = [
  "--em-600", "--em-700", "--em-800", "--em-900", "--em-950",
  "--brand", "--brand-deep", "--brand-active",
  "--mj-brand", "--mj-brand-deep",
  "--surface-brand-solid", "--surface-brand-strong", "--surface-brand-deepest",
  "--surface-inverse", "--color-primary", "--color-primary-deep",
  "--color-primary-dark", "--color-primary-strong",
];

/** أفتح لون مقبول فوق سطح علامة. أي شيء أغمق = فشل. */
const MIN_LUMA_HEX = "#e5e5e5";

const ON_BRAND_VARS = new Set([
  "--on-brand", "--on-brand-secondary", "--on-brand-tertiary",
  "--on-brand-muted", "--mj-on-brand",
  "--on-brand-disabled", "--on-brand-focus-ring",
  "--text-on-brand", "--text-on-dark",
  "--on-dark-strong", "--on-dark-body", "--on-dark-secondary", "--color-on-dark",
]);

/* ── أدوات لون ────────────────────────────────────────────────────── */
function hexToRgb(hex) {
  let h = hex.replace("#", "").toLowerCase();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return null;
  const n = Number.parseInt(h, 16);
  if (Number.isNaN(n)) return null;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relLuminance([r, g, b]) {
  const f = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

const MIN_LUMA = relLuminance(hexToRgb(MIN_LUMA_HEX));

/**
 * جدول حلّ المتغيرات إلى hex — لحساب تباين *حقيقي* لا تقدير بالسطوع وحده.
 * السبب: قاعدة «أغمق من #E5E5E5 ⇒ فشل» تُسقط ‎#6ee7b7‎ فوق ‎#12362C‎ خطأً،
 * وتباينه الفعلي ‎9.0:1‎ — مقروء تمامًا. الحكم الصحيح نسبة التباين.
 */
const VAR_HEX = {
  "--em-50": "#eef3f0", "--em-100": "#dce7e1", "--em-200": "#b7cdc3",
  "--em-300": "#82a998", "--em-400": "#4f8772", "--em-500": "#2f735c",
  "--em-600": "#1e5f4b", "--em-700": "#174a3a", "--em-800": "#12362c",
  "--em-900": "#0e241e", "--em-950": "#091814",
  "--brand": "#1e5f4b", "--brand-deep": "#12362c", "--brand-active": "#174a3a",
  "--mj-brand": "#1e5f4b", "--mj-brand-deep": "#12362c",
  "--surface-brand-solid": "#1e5f4b", "--surface-brand-strong": "#12362c",
  "--surface-brand-deepest": "#0e241e", "--surface-inverse": "#0e241e",
  "--color-primary": "#1e5f4b", "--color-primary-deep": "#12362c",
  "--color-primary-dark": "#12362c", "--color-primary-strong": "#12362c",
  "--mj-ink": "#0e241e", "--text": "#121916", "--text-2": "#3e3a35",
  "--text-muted": "#57534c", "--text-title": "#0e241e",
  "--on-brand": "#ffffff", "--text-on-brand": "#fffefb",
  "--on-brand-secondary": "#f8fafc",
  "--on-brand-tertiary": "#e8eeec",
  "--text-on-dark": "#ffffff",
  "--text-on-dark-secondary": "#e8eeec",
  "--text-primary-inverse": "#ffffff",
  "--on-dark-strong": "#ffffff",
  "--on-dark-body": "#f8fafc",
  "--on-dark-secondary": "#e8eeec",
  "--color-on-dark": "#ffffff",
};

/** يستخرج أول لون قابل للحلّ من تصريح CSS، أو null. */
function resolveColor(value) {
  const v = value.toLowerCase();
  const hex = v.match(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/);
  if (hex) return hexToRgb(hex[0]);
  if (/\bwhite\b/.test(v)) return [255, 255, 255];
  if (/\bblack\b/.test(v)) return [0, 0, 0];
  const rgba = v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgba) return [Number(rgba[1]), Number(rgba[2]), Number(rgba[3])];
  // أول متغير معروف في سلسلة var(--a, var(--b, #hex)).
  // الأطول أولًا + حدّ صريح بعد الاسم: بدون ذلك كان ‎--text‎ يطابق
  // ‎--text-on-brand‎ (‎\b‎ يتحقّق قبل الشرطة) فيُقلب أبيضُ النص إلى داكن
  // ويُبلَّغ عن انتهاك وهمي 2.37:1 في كل زرّ أساسي.
  for (const name of VAR_NAMES_LONGEST_FIRST) {
    if (new RegExp(`var\\(\\s*${name}(?=\\s*[,)])`).test(v)) return hexToRgb(VAR_HEX[name]);
  }
  return null;
}

const VAR_NAMES_LONGEST_FIRST = Object.keys(VAR_HEX).sort((a, b) => b.length - a.length);

/** شفافية أبيض على سطح معلوم ⇒ لون مُركَّب فعلي. */
function composite(fg, alpha, bg) {
  return fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha)));
}

function contrastRatio(a, b) {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const MIN_RATIO_NORMAL = 4.5;
/** نص كبير (أبطال/عناوين ضخمة) — حدّ WCAG له 3:1 لا 4.5:1 */
const MIN_RATIO_LARGE = 3;
const LARGE_TEXT_SELECTOR = /-hero\b|__hero\b|__display\b|__h1\b|-title-xl\b/;

/** هل هذا اللون أغمق من الحد المسموح؟ */
function isTooDark(colorText) {
  const t = colorText.trim().toLowerCase();
  if (!t || t === "inherit" || t === "currentcolor" || t === "transparent" || t === "unset") {
    return false;
  }
  // متغيرات on-brand المعتمدة تمرّ
  for (const v of ON_BRAND_VARS) if (t.includes(v)) return false;
  if (t === "#fff" || t === "#ffffff" || t === "white") return false;

  const rgbaWhite = t.match(/rgba?\(\s*255\s*,\s*255\s*,\s*255\s*(?:,\s*([\d.]+))?\s*\)/);
  if (rgbaWhite) {
    const alpha = rgbaWhite[1] === undefined ? 1 : Number(rgbaWhite[1]);
    // أبيض بشفافية ≥ .62 مقبول (يطابق --on-brand-tertiary = .64)
    return alpha < 0.62;
  }

  const hex = t.match(/#[0-9a-f]{3,8}\b/);
  if (hex) {
    const rgb = hexToRgb(hex[0].slice(0, 7));
    if (rgb) return relLuminance(rgb) < MIN_LUMA - 1e-9;
  }

  // متغيرات نصّ داكنة معروفة
  if (/--(mj-)?(ink|text|text-2|text-muted|text-title|text-brand|em-[0-9]{2,3})\b/.test(t)) {
    // --em-50/100/200 فاتحة؛ ما فوقها داكن
    const em = t.match(/--em-(\d{2,3})/);
    if (em && Number(em[1]) <= 200) return false;
    return true;
  }
  return false;
}

/**
 * عناصر لا تحمل نصًا بنيويًا: أشرطة تقدّم، نقاط، مقابض، أقنعة، هياكل.
 * سطح علامة عليها بلا ‎color‎ ليس عيبًا — لا نص يرث شيئًا.
 */
const NON_TEXT_SELECTOR = new RegExp(
  [
    "::before", "::after", ":before", ":after",
    "__dot\\b", "__bar\\b", "__track\\b", "__thumb\\b", "__ring\\b",
    "__scrim\\b", "__handle\\b", "__fill\\b", "__progress\\b", "__glow\\b",
    "__overlay\\b", "__backdrop\\b", "__divider\\b", "__rule\\b", "__spark\\b",
    "__img\\b", "__image\\b", "__bullet\\b", "__avatar\\b", "__mask\\b",
    "-fill\\b", "-bar\\b", "-dot\\b", "-scrim\\b", "-handle\\b", "-track\\b",
    "skeleton", "shimmer", "spinner", "loader",
    "\\bhr\\b", "\\s+i$", "\\s+i\\s*$",
  ].join("|"),
);

/** يقسّم قائمة وسائط على الفواصل العلوية فقط (يتجاهل ما داخل الأقواس). */
function splitTopLevel(s) {
  const out = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out.map((x) => x.trim());
}

/** هل يحمل هذا الوسيط رمز/قيمة علامة خضراء غامقة؟ */
function argIsBrand(arg) {
  const a = arg.toLowerCase();
  for (const hex of DARK_BRAND_HEXES) if (a.includes(hex)) return true;
  for (const v of DARK_BRAND_VARS) {
    if (new RegExp(`var\\(\\s*${v}(?=\\s*[,)])`).test(a)) return true;
  }
  return false;
}

/**
 * ‎color-mix(...)‎ يكون *سطح علامة* فقط إذا كان نصيب لون العلامة ≥ 50%.
 * ملاحظة: تحليل النسبة بـ‎[^)]*‎ كان يفشل لأن ‎var(--x)‎ يحوي ‎)‎ فيقطع
 * الفئة — فيُبلَّغ عن ‎color-mix(..., var(--mj-brand) 8%, var(--mj-surface))‎
 * (شبه أبيض) كسطح أخضر غامق. القسمة على الفواصل العلوية تحلّ ذلك.
 */
function mixIsBrandSurface(value) {
  const v = value.toLowerCase();
  const at = v.indexOf("color-mix(");
  if (at === -1) return null; // ليس مزيجًا — القرار في مكان آخر
  // استخرج ما بين قوسَي color-mix
  let depth = 0;
  let inner = "";
  for (let i = at + "color-mix".length; i < v.length; i++) {
    const ch = v[i];
    if (ch === "(") {
      depth++;
      if (depth === 1) continue;
    } else if (ch === ")") {
      depth--;
      if (depth === 0) break;
    }
    inner += ch;
  }
  const args = splitTopLevel(inner).filter((a) => !a.startsWith("in "));
  let brandShare = 0;
  let sawBrand = false;
  let explicitTotal = 0;
  for (const arg of args) {
    const pct = arg.match(/(\d{1,3})%\s*$/);
    const share = pct ? Number(pct[1]) : null;
    if (share !== null) explicitTotal += share;
    if (argIsBrand(arg)) {
      sawBrand = true;
      // بلا نسبة صريحة ووسيطان ⇒ 50% لكلٍّ
      brandShare += share ?? (args.length === 2 ? 50 : 0);
    }
  }
  if (!sawBrand) return false;
  // ‎transparent‎ الشقيق يعني صبغة فوق مجهول — غير قابل للحكم ساكنًا
  if (/transparent/.test(v) && brandShare < 60) return false;
  if (explicitTotal === 0) return brandShare >= 50;
  return brandShare >= 50;
}

/** هل تصريح الخلفية هذا سطح علامة غامق *صلب*؟ */
function isDarkBrandBackground(value) {
  const v = value.toLowerCase();
  const mix = mixIsBrandSurface(v);
  if (mix !== null) return mix;
  // شفافية صريحة منخفضة ⇒ ليس سطحًا
  if (/rgba\([^)]*,\s*0?\.[0-5]\d*\s*\)/.test(v)) return false;
  for (const hex of DARK_BRAND_HEXES) if (v.includes(hex)) return true;
  for (const varName of DARK_BRAND_VARS) {
    // تطابق دقيق للاسم لا بادئة (‎--brand-soft‎ فاتح)
    const re = new RegExp(`var\\(\\s*${varName}(?=\\s*[,)])`);
    if (re.test(v)) return true;
  }
  return false;
}

/* ── جمع الملفات ──────────────────────────────────────────────────── */
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "__snapshots__") continue;
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(css|tsx)$/.test(entry)) out.push(p);
  }
  return out;
}

/** يقسّم CSS إلى قواعد { selector, body, line } بعد تجريد التعليقات. */
function parseRules(css) {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
  const rules = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(noComments))) {
    const selector = m[1].trim();
    if (!selector || selector.startsWith("@")) continue;
    const line = noComments.slice(0, m.index).split("\n").length;
    rules.push({ selector, body: m[2], line });
  }
  return rules;
}

function decl(body, prop) {
  const re = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, "i");
  const m = body.match(re);
  return m ? m[1].trim() : null;
}

/* ── الفحص ────────────────────────────────────────────────────────── */
const violations = [];
const files = walk(SRC);

for (const file of files) {
  const rel = relative(APP_ROOT, file).replace(/\\/g, "/");
  if (TOKEN_FILES.has(rel)) continue;
  const text = readFileSync(file, "utf8");

  if (file.endsWith(".css")) {
    for (const rule of parseRules(text)) {
      const bg =
        decl(rule.body, "background") ??
        decl(rule.body, "background-color") ??
        decl(rule.body, "background-image");
      if (!bg || !isDarkBrandBackground(bg)) continue;

      const color = decl(rule.body, "color");
      const opacity = decl(rule.body, "opacity");
      const carriesText = !NON_TEXT_SELECTOR.test(rule.selector);
      /* قاعدة حالة (‎:hover/:active/:focus/[disabled]‎) أو تجاوز وضع ليلي
         تُغيّر الخلفية فقط ويورَث لون النص من القاعدة الأساس — لا عيب. */
      const isStateOrThemeVariant =
        /:hover|:active|:focus|:disabled|\[disabled\]|\.is-active|\.is-open/.test(rule.selector) ||
        /data-theme|\bhtml\.dark\b/.test(rule.selector);

      if (!color && carriesText && !isStateOrThemeVariant) {
        violations.push({
          kind: "surface-without-color",
          file: rel,
          line: rule.line,
          selector: rule.selector,
          detail: `سطح علامة غامق بلا color صريح — background: ${bg.slice(0, 70)}`,
        });
      } else if (color) {
        // حكم أساسي: نسبة التباين الحقيقية بين اللونين المحلولين.
        // ‎color-mix(..., transparent)‎ لا يُحسم ساكنًا: السطح الفعلي هو ما
        // تحته في الصفحة. تلك الحالات تُترك لبوابة Playwright المتراكمة.
        const bgUnresolvable = /transparent/i.test(bg);
        const bgRgb = bgUnresolvable ? null : resolveColor(bg);
        let fgRgb = resolveColor(color);
        const whiteAlpha = color
          .toLowerCase()
          .match(/rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*([\d.]+)\s*\)/);
        if (whiteAlpha && bgRgb) {
          fgRgb = composite([255, 255, 255], Number(whiteAlpha[1]), bgRgb);
        }
        if (bgRgb && fgRgb) {
          // عناصر رسومية/نص كبير: حدّ WCAG لها 3:1 لا 4.5:1
          const min =
            !carriesText || LARGE_TEXT_SELECTOR.test(rule.selector)
              ? MIN_RATIO_LARGE
              : MIN_RATIO_NORMAL;
          const ratio = contrastRatio(fgRgb, bgRgb);
          if (ratio < min) {
            violations.push({
              kind: "dark-on-brand",
              file: rel,
              line: rule.line,
              selector: rule.selector,
              detail: `تباين ${ratio.toFixed(2)}:1 < ${min}:1 — color: ${color.slice(0, 48)} فوق ${bg.slice(0, 40)}`,
            });
          }
        } else if (!bgUnresolvable && isTooDark(color)) {
          // لم يُحَلّ أحد اللونين: نعود للحكم الاحتياطي بالسطوع.
          violations.push({
            kind: "dark-on-brand",
            file: rel,
            line: rule.line,
            selector: rule.selector,
            detail: `color: ${color.slice(0, 48)} أغمق من ${MIN_LUMA_HEX} فوق سطح علامة (تباين غير قابل للحلّ ساكنًا)`,
          });
        }
      }

      // opacity: 0 = حالة بداية/نهاية أنيميشن لا تخفيت نص.
      if (opacity && Number(opacity) >= 0.2 && Number(opacity) < 0.8 && carriesText) {
        violations.push({
          kind: "opacity-fade-on-brand",
          file: rel,
          line: rule.line,
          selector: rule.selector,
          detail: `opacity: ${opacity} على سطح علامة — استخدم --on-brand-secondary/tertiary بلون صريح`,
        });
      }
    }

    // نصوص ثانوية داخل أسطح علامة مخفَّتة بـopacity (قاعدة منفصلة)
    for (const rule of parseRules(text)) {
      const opacity = decl(rule.body, "opacity");
      if (!opacity || Number(opacity) >= 0.9) continue;
      // مُحدِّد يقع داخل حاوية علامة معروفة؟
      if (!/--adhan|anb-toast--adhan|pcb-card|surface-brand|on-brand/.test(rule.selector)) continue;
      if (decl(rule.body, "color")) continue;
      violations.push({
        kind: "opacity-fade-on-brand",
        file: rel,
        line: rule.line,
        selector: rule.selector,
        detail: `opacity: ${opacity} بلا لون صريح داخل سطح علامة`,
      });
    }
  } else {
    // TSX: ألوان مضمّنة في style={{ }} فوق أصناف سطح علامة
    const re = /style=\{\{([^}]*)\}\}/g;
    let m;
    while ((m = re.exec(text))) {
      const body = m[1];
      if (!/backgroundColor|background/.test(body)) continue;
      if (!isDarkBrandBackground(body)) continue;
      if (/\bcolor\s*:/.test(body)) continue;
      violations.push({
        kind: "surface-without-color",
        file: rel,
        line: text.slice(0, m.index).split("\n").length,
        selector: "style={{…}}",
        detail: "خلفية علامة مضمّنة بلا لون نص — انقلها إلى .surface-brand",
      });
    }
  }
}

/* ── التقرير ──────────────────────────────────────────────────────── */
if (JSON_OUT) {
  console.log(JSON.stringify({ total: violations.length, violations }, null, 2));
} else {
  const byKind = violations.reduce((acc, v) => {
    acc[v.kind] = (acc[v.kind] || 0) + 1;
    return acc;
  }, {});
  console.log("=== بوابة «لا أسود على الأخضر» ===");
  console.log(`ملفات مفحوصة: ${files.length}`);
  console.log(`الحد الأدنى المسموح للنص فوق سطح علامة: ${MIN_LUMA_HEX}\n`);
  for (const [k, n] of Object.entries(byKind)) console.log(`  ${k}: ${n}`);
  if (violations.length) {
    console.log("");
    for (const v of violations) {
      console.log(`✗ ${v.file}:${v.line}`);
      console.log(`    ${v.selector}`);
      console.log(`    ${v.detail}`);
    }
  }
}

/* ── سياسة الفشل ──────────────────────────────────────────────────────
   صنفان يعنيان نصًّا غير مقروء فعلًا ⇒ فشل فوري، السقف صفر:
     dark-on-brand        تباين محسوب < الحد
     opacity-fade-on-brand تخفيت بـopacity يخفي العيب عن بوابة المتصفح

   صنف ثالث (surface-without-color) إرشادي بخط أساس مقفل: لا يُسمح بزيادته.
   السبب: ٦٣ سطحًا قائمًا يورث لون نصّه من قاعدة أخرى — كثير منها سليم عمليًا
   ويحتاج مراجعة فردية. قفله يمنع أي سطح أخضر *جديد* بلا لون نص، ويُنقَص
   الرقم تدريجيًا. لا سقف صامت: الرقم مطبوع دائمًا.                     */
const HARD_FAIL_KINDS = new Set(["dark-on-brand", "opacity-fade-on-brand"]);
const SURFACE_WITHOUT_COLOR_BASELINE = 57;

const hardFails = violations.filter((v) => HARD_FAIL_KINDS.has(v.kind));
const advisory = violations.filter((v) => !HARD_FAIL_KINDS.has(v.kind));

if (!JSON_OUT) {
  console.log(
    `إرشادي (surface-without-color): ${advisory.length} / خط أساس ${SURFACE_WITHOUT_COLOR_BASELINE}`,
  );
}

let failed = false;
if (hardFails.length) {
  console.error(
    `\n✗ ${hardFails.length} نص غير مقروء فوق سطح علامة (السقف صفر). أعلاه تفاصيلها.`,
  );
  failed = true;
}
if (advisory.length > SURFACE_WITHOUT_COLOR_BASELINE) {
  console.error(
    `\n✗ أسطح علامة بلا لون نص ارتفعت ${advisory.length} > ${SURFACE_WITHOUT_COLOR_BASELINE}. ` +
      `أضف color صريحًا أو استخدم الصنف .surface-brand.`,
  );
  failed = true;
}
if (!failed && !JSON_OUT) {
  console.log("\n✓ صفر نص غير مقروء فوق الأخضر، والإرشادي لم يزد عن خط الأساس.");
  if (advisory.length < SURFACE_WITHOUT_COLOR_BASELINE) {
    console.log(
      `  ↓ الإرشادي نقص إلى ${advisory.length} — أنزل SURFACE_WITHOUT_COLOR_BASELINE إليه لتثبيت المكسب.`,
    );
  }
}

process.exit(failed ? 1 : 0);
