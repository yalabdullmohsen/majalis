/**
 * بوابة: منع CSS عام خطِر يعيد كسر الواجهة عبر الصفحات.
 * Run: node --import tsx src/lib/__tests__/no-global-dangerous-css-gate.test.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const SCAN_DIRS = [
  "src/styles",
  "src/app/styles",
  "src/index.css",
];

/** ملفات يُسمح فيها بإعادة تعيين عالمي ضيق (user-select / touch فقط) */
const ALLOW_BARE_BUTTON_FILES = new Set([
  "src/styles/capacitor-native-ux.css",
  "src/styles/ios-edge.css",
  "src/styles/components/instant-interaction.css",
  "src/styles/typography-scale.css",
]);

function collectCss(entry: string, out: string[] = []): string[] {
  const abs = resolve(root, entry);
  let st;
  try {
    st = statSync(abs);
  } catch {
    return out;
  }
  if (st.isFile()) {
    if (abs.endsWith(".css")) out.push(abs);
    return out;
  }
  for (const name of readdirSync(abs)) {
    if (name === "node_modules" || name === "dist") continue;
    collectCss(join(entry, name), out);
  }
  return out;
}

function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function splitTopLevelCommas(sel: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of sel) {
    if (ch === "(") depth += 1;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      parts.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

function forEachRule(css: string, fn: (sel: string, body: string, idx: number) => void) {
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(css))) {
    fn(m[1].trim(), m[2], i++);
  }
}

const files = SCAN_DIRS.flatMap((d) => collectCss(d));
assert.ok(files.length > 40, `يُتوقع مسح عشرات ملفات CSS، وُجد ${files.length}`);

const violations: string[] = [];

for (const abs of files) {
  const rel = relative(root, abs).replaceAll("\\", "/");
  const raw = stripComments(readFileSync(abs, "utf8"));

  // button عاري تمامًا (ليس button:not / button.class / داخل :where)
  forEachRule(raw, (sel, body) => {
    const parts = splitTopLevelCommas(sel);
    const hasBareButton = parts.some((p) => p === "button");
    if (!hasBareButton) return;
    if (ALLOW_BARE_BUTTON_FILES.has(rel)) return;
    if (
      /border-radius|^\s*color\s*:|background|min-height|padding|margin|font-size|width\s*:|height\s*:/m.test(
        body,
      )
    ) {
      violations.push(`${rel}: قاعدة تضم button عاريًا وتغيّر الشكل/الحجم — اجعلها scoped`);
    }
  });

  if (/^\s*\.card\s*\{/m.test(raw)) {
    violations.push(`${rel}: قاعدة .card{} عامة`);
  }
  if (/^\s*main\s*\{/m.test(raw)) {
    violations.push(`${rel}: قاعدة main{} عامة`);
  }
  if (/^\s*section\s*\{/m.test(raw)) {
    violations.push(`${rel}: قاعدة section{} عامة`);
  }

  // * { … } يغيّر شكلًا بصريًا خطِرًا (ليس box-sizing/إعادة تعيين هوامش بسيطة)
  forEachRule(raw, (sel, body) => {
    if (!/(^|,\s*)\*\s*$|(^|,\s*)\*\s*,/.test(sel) && sel !== "*" && !sel.split(",").some((s) => s.trim() === "*")) {
      return;
    }
    if (/border-radius|color\s*:|background|font-size|display\s*:|position\s*:|transform|opacity\s*:/.test(body)) {
      violations.push(`${rel}: قاعدة *{} تغيّر عرضًا بصريًا`);
    }
  });

  // محدّدات عائلات البطاقات — ممنوع border-radius/color/background (CLS + كسر صفحات)
  forEachRule(raw, (sel, body) => {
    if (!/\[class\*[=]?["']?-?card|\[class\$=["']-card/.test(sel)) return;
    if (/border-radius|^\s*color\s*:|background(-color|-image)?\s*:/m.test(body)) {
      violations.push(
        `${rel}: [class*=card]/[class$=-card] يفرض شكلًا/لونًا — اجعله scoped لصنف محدد`,
      );
    }
  });
}

assert.equal(
  violations.length,
  0,
  `CSS عام خطِر:\n${violations.slice(0, 30).join("\n")}${violations.length > 30 ? `\n…+${violations.length - 30}` : ""}`,
);

// brand-v4: عائلة البطاقات انتقال فقط (لا نصف قطر متأخر)
const brandV4 = stripComments(readFileSync(resolve(root, "src/styles/brand-v4-components.css"), "utf8"));
assert.match(brandV4, /\[class\$="-card"\]/, "brand-v4 ما زال يذكر عائلة البطاقات");
assert.doesNotMatch(
  brandV4,
  /\[class\$="-card"\][\s\S]{0,200}border-radius/,
  "brand-v4 لا يفرض border-radius على [class$=-card] (CLS)",
);

console.log(`no-global-dangerous-css-gate.test.ts: ok (${files.length} ملفًا)`);
