/**
 * يمنع رجوع المكتبة العلمية / صفحة المزيد / Majlisilm في واجهة المستخدم والـSEO.
 * Run: node scripts/test-no-more-library-brand.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const failures = [];

const SKIP = [/\/node_modules\//, /\/dist\//, /\/__tests__\//, /\/scripts\/test-/, /content\/audit\//];
const SCAN_DIRS = [join(root, "src"), join(root, "public")].filter((d) => {
  try {
    return statSync(d).isDirectory();
  } catch {
    return false;
  }
});

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === "dist" || name === "seo-prerender") continue;
      walk(p, out);
    } else if (/\.(tsx|ts|json|html|xml|mjs)$/.test(name)) out.push(p);
  }
  return out;
}

const FORBIDDEN_UI = [
  { re: /المكتبة العلمية/, msg: "المكتبة العلمية" },
  { re: /\bMajlisilm\b/, msg: "Majlisilm" },
  { re: /المجلس العلمي/, msg: "المجلس العلمي" },
];

for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    const rel = relative(root, file);
    if (SKIP.some((r) => r.test(`/${rel}`))) continue;
    // تعليقات التحويل مسموحة في AppRoutes فقط عند ذكر الإزالة
    const text = readFileSync(file, "utf8");
    for (const { re, msg } of FORBIDDEN_UI) {
      if (!re.test(text)) continue;
      // استثناء: تعليقات توثيق الإزالة + بوابات تمنع الرجوع + تحويلات vercel hosts
      if (/AppRoutes\.tsx$/.test(rel) && /أُزيلت|محوَّل|تحويل/.test(text)) {
        const lines = text.split("\n");
        lines.forEach((line, i) => {
          if (re.test(line) && !/^\s*\/\//.test(line) && !/\/\*|أُزيلت|محو/.test(line)) {
            failures.push(`${rel}:${i + 1} ${msg}`);
          }
        });
        continue;
      }
      if (/canonical-apex|identity|kuwait-lessons|fiqh-hub-layout|phase5|no-more-library|test-identity|majlisilm-audit|ScholarlyTrustBadge|navigation-back\.ts|vercel\.json|apple-app-site|site\.config|admin-review-hub|notifications\/copy|main\.tsx/.test(rel)) {
        continue;
      }
      if (extname(file) === ".mjs" && /audit|gate|test/.test(rel)) continue;
      failures.push(`${rel}: ${msg}`);
    }
  }
}

// redirects must not surface /more or /library as pages
const vercel = readFileSync(join(root, "vercel.json"), "utf8");
if (!/"source":\s*"\/more"[\s\S]{0,80}"destination":\s*"\/sections"/.test(vercel)) {
  failures.push("vercel.json: /more يجب أن يحوّل إلى /sections");
}
if (!/"source":\s*"\/library"[\s\S]{0,80}"destination":\s*"\/search"/.test(vercel)) {
  failures.push("vercel.json: /library يجب أن يحوّل إلى /search");
}

const app = readFileSync(join(root, "src/AppRoutes.tsx"), "utf8");
if (!/path="\/more"[\s\S]{0,80}Redirect to="\/sections"/.test(app)) {
  failures.push("AppRoutes: /more → /sections");
}
if (!/path="\/library"[\s\S]{0,80}Redirect to="\/search"/.test(app)) {
  failures.push("AppRoutes: /library → /search");
}

if (failures.length) {
  console.error("test-no-more-library-brand FAIL:\n" + failures.slice(0, 40).join("\n"));
  process.exit(1);
}
console.log("test-no-more-library-brand: ok");
