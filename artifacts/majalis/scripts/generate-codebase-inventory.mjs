#!/usr/bin/env node
/**
 * جرد الهيكلة الكبرى v7 — الحزمة A
 * توليد docs/refactor/* دون حذف أي شيء.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname, join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const repoRoot = resolve(appRoot, "../..");
const srcRoot = resolve(appRoot, "src");
const outDir = resolve(repoRoot, "docs/refactor");
mkdirSync(outDir, { recursive: true });

const require = createRequire(import.meta.url);

function walk(dir, pred, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, pred, out);
    else if (pred(p, name)) out.push(p);
  }
  return out;
}

function rel(p) {
  return relative(appRoot, p).replace(/\\/g, "/");
}

function read(p) {
  try { return readFileSync(p, "utf8"); } catch { return ""; }
}

const IMPORT_RE = /(?:import|export)\s+(?:type\s+)?(?:[^'"\n]+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)|require\(\s*["']([^"']+)["']\s*\)/g;

function resolveImport(fromFile, spec) {
  if (!spec.startsWith(".") && !spec.startsWith("@/")) return null;
  let base;
  if (spec.startsWith("@/")) base = join(srcRoot, spec.slice(2));
  else base = resolve(dirname(fromFile), spec);
  const candidates = [
    base,
    base + ".ts",
    base + ".tsx",
    base + ".js",
    base + ".jsx",
    base + ".css",
    base + ".json",
    join(base, "index.ts"),
    join(base, "index.tsx"),
    join(base, "index.js"),
  ];
  for (const c of candidates) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

// ── Reachability from main.tsx ──────────────────────────────────────────
const entry = resolve(srcRoot, "main.tsx");
const reachable = new Set();
const queue = [entry];
const codeExt = new Set([".ts", ".tsx", ".js", ".jsx"]);

while (queue.length) {
  const file = queue.pop();
  if (reachable.has(file)) continue;
  reachable.add(file);
  if (!codeExt.has(extname(file))) continue;
  const src = read(file);
  IMPORT_RE.lastIndex = 0;
  let m;
  while ((m = IMPORT_RE.exec(src))) {
    const spec = m[1] || m[2] || m[3];
    if (!spec) continue;
    const resolved = resolveImport(file, spec);
    if (resolved && !reachable.has(resolved)) queue.push(resolved);
  }
}

const allSrcFiles = walk(srcRoot, (p) => /\.(ts|tsx|js|jsx)$/.test(p));
const unusedFiles = allSrcFiles
  .filter((f) => !reachable.has(f))
  .map(rel)
  .sort();

// Also pull App.tsx lazy routes into reachable note (dynamic import already handled)

// ── Unused exports (lightweight: export symbols never referenced as string) ─
const exportRe = /^export\s+(?:async\s+)?(?:function|const|class|type|interface|enum)\s+(\w+)/gm;
const namedExportRe = /^export\s+\{\s*([^}]+)\s*\}/gm;
const exported = []; // {file, name}
for (const f of allSrcFiles) {
  const src = read(f);
  let m;
  exportRe.lastIndex = 0;
  while ((m = exportRe.exec(src))) exported.push({ file: rel(f), name: m[1] });
  namedExportRe.lastIndex = 0;
  while ((m = namedExportRe.exec(src))) {
    for (const part of m[1].split(",")) {
      const name = part.trim().split(/\s+as\s+/).pop()?.trim();
      if (name && name !== "default" && /^\w+$/.test(name)) {
        exported.push({ file: rel(f), name });
      }
    }
  }
}

// Build corpus of all src text for crude usage check (exclude defining file)
const corpusByFile = new Map(allSrcFiles.map((f) => [f, read(f)]));
const allCorpus = [...corpusByFile.values()].join("\n");

const unusedExports = [];
const usedOnceExports = [];
for (const { file, name } of exported) {
  if (name === "default" || name.startsWith("_")) continue;
  // count word-boundary occurrences across src excluding the defining file roughly
  const re = new RegExp(`\\b${name}\\b`, "g");
  let count = 0;
  for (const [f, text] of corpusByFile) {
    if (rel(f) === file) continue;
    const hits = text.match(re);
    if (hits) count += hits.length;
  }
  if (count === 0) unusedExports.push({ file, name });
  else if (count === 1) usedOnceExports.push({ file, name, count });
}

// ── CSS class usage ─────────────────────────────────────────────────────
const cssFiles = [
  "src/index.css",
  "src/styles/brand-v4.css",
  "src/styles/design-system.css",
  "src/styles/final-release.css",
  "src/styles/ios-edge.css",
  "src/app/styles/theme.css",
].concat(
  walk(resolve(srcRoot, "styles/m2030"), (p) => p.endsWith(".css")).map((p) => rel(p))
);

const classDefRe = /\.([a-zA-Z_][a-zA-Z0-9_-]*)\s*[{:,]/g;
const cssClasses = new Map(); // name -> {defs: [], count}

for (const relCss of cssFiles) {
  const full = resolve(appRoot, relCss);
  if (!existsSync(full)) continue;
  const src = read(full);
  classDefRe.lastIndex = 0;
  let m;
  while ((m = classDefRe.exec(src))) {
    const name = m[1];
    if (name.includes("\\") || name.length < 2) continue;
    if (!cssClasses.has(name)) cssClasses.set(name, { defs: [], count: 0 });
    cssClasses.get(name).defs.push(relCss);
  }
}

const jsxCorpus = allSrcFiles.map((f) => read(f)).join("\n");
for (const [name, meta] of cssClasses) {
  const re = new RegExp(`["'\`\\s]${name.replace(/-/g, "\\-")}["'\`\\s]`, "g");
  const hits = jsxCorpus.match(re);
  meta.count = hits ? hits.length : 0;
}

const cssUsed = [];
const cssOnce = [];
const cssDead = [];
for (const [name, meta] of [...cssClasses.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  const row = { name, count: meta.count, defs: [...new Set(meta.defs)] };
  if (meta.count === 0) cssDead.push(row);
  else if (meta.count === 1) cssOnce.push(row);
  else cssUsed.push(row);
}

// ── Routes from App.tsx ─────────────────────────────────────────────────
const appSrc = read(resolve(srcRoot, "App.tsx"));
const routePathRe = /<Route\s+[^>]*path=["']([^"']+)["'][^>]*>/g;
const lazyViewRe = /lazy\(\s*\(\)\s*=>\s*import\(["'](@\/views\/[^"']+)["']\)/g;
const routes = [];
let rm;
routePathRe.lastIndex = 0;
while ((rm = routePathRe.exec(appSrc))) routes.push(rm[1]);

const lazyViews = new Set();
lazyViewRe.lastIndex = 0;
while ((rm = lazyViewRe.exec(appSrc))) lazyViews.add(rm[1].replace("@/views/", "src/views/"));

// Also capture: const X = lazy(() => import("@/views/...
const lazyAssignRe = /import\(["'](@\/views\/[^"']+)["']\)/g;
while ((rm = lazyAssignRe.exec(appSrc))) {
  lazyViews.add(rm[1].replace("@/views/", "src/views/") + (rm[1].endsWith(".tsx") ? "" : ""));
}

const viewFiles = walk(resolve(srcRoot, "views"), (p) => /\.tsx$/.test(p)).map(rel);
const viewBase = (p) => p.replace(/\.tsx$/, "").replace(/^src\/views\//, "");

const linkedViews = new Set();
for (const v of lazyViews) {
  const candidates = [
    v.endsWith(".tsx") ? v : v + ".tsx",
    v.replace(/\.tsx$/, "") + "/index.tsx",
  ];
  for (const c of candidates) {
    if (existsSync(resolve(appRoot, c))) linkedViews.add(c);
  }
}
// Normalize lazy paths without extension
for (const raw of [...lazyViews]) {
  const noAt = raw.replace(/^src\/views\//, "");
  const tryPaths = [
    `src/views/${noAt}.tsx`,
    `src/views/${noAt}/index.tsx`,
    `src/views/${noAt}`,
  ];
  for (const t of tryPaths) {
    if (existsSync(resolve(appRoot, t)) && t.endsWith(".tsx")) linkedViews.add(t);
  }
}

const orphanViews = viewFiles.filter((v) => !linkedViews.has(v));
const liveViews = viewFiles.filter((v) => linkedViews.has(v));

// Duplicate components heuristic: similar filenames
const components = walk(resolve(srcRoot, "components"), (p) => /\.tsx$/.test(p)).map(rel);
const byStem = new Map();
for (const c of components) {
  const stem = c.split("/").pop().replace(/\.tsx$/, "").toLowerCase()
    .replace(/(card|header|sheet|empty|banner|list|item|page|section|panel|rail)$/i, "");
  if (!byStem.has(stem)) byStem.set(stem, []);
  byStem.get(stem).push(c);
}
const duplicateCandidates = [...byStem.entries()]
  .filter(([, files]) => files.length >= 2)
  .filter(([stem]) => stem.length >= 3)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 40);

// ── deps audit ──────────────────────────────────────────────────────────
const pkg = JSON.parse(read(resolve(appRoot, "package.json")));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
const depNames = Object.keys(deps).sort();
const allText = walk(srcRoot, () => true).map(read).join("\n")
  + read(resolve(appRoot, "vite.config.ts"))
  + read(resolve(appRoot, "package.json"));

const unusedDeps = [];
const usedDeps = [];
for (const name of depNames) {
  if (name.startsWith("@types/")) { usedDeps.push(name); continue; }
  // root package name usage
  const bare = name.startsWith("@") ? name : name;
  const re = new RegExp(`["']${bare.replace("/", "\\/")}(/|["'])`);
  if (re.test(allText) || allText.includes(`from "${bare}`) || allText.includes(`from '${bare}`)) {
    usedDeps.push(name);
  } else if (["vite", "typescript", "eslint", "tsx", "postcss", "autoprefixer", "tailwindcss", "@tailwindcss/vite"].includes(name)
    || name.includes("eslint") || name.includes("vite") || name.includes("capacitor")
    || name.includes("playwright") || name.includes("rollup")) {
    usedDeps.push(name); // tooling
  } else {
    unusedDeps.push(name);
  }
}

// Functional duplicates
const duplicateLibs = [];
const iconLibs = depNames.filter((d) => /icon|lucide|heroicon|radix-icons/i.test(d));
if (iconLibs.length > 1) duplicateLibs.push({ kind: "icons", packages: iconLibs });
const dateLibs = depNames.filter((d) => /date-fns|dayjs|moment|luxon/i.test(d));
if (dateLibs.length > 1) duplicateLibs.push({ kind: "dates", packages: dateLibs });
const httpLibs = depNames.filter((d) => /^(axios|ky|got)$|node-fetch|ofetch/i.test(d));
if (httpLibs.length > 1) duplicateLibs.push({ kind: "http", packages: httpLibs });

// ── Write markdown ──────────────────────────────────────────────────────
const now = new Date().toISOString().slice(0, 10);

writeFileSync(join(outDir, "unused-files.md"), `# ملفات غير وصلها مسار استيراد من main.tsx

> توليد آلي ${now} — الحزمة A (Grand Refactor v7)
> الملفات المحسوبة: ${allSrcFiles.length} · قابلة للوصول: ${reachable.size} · يتيمة: ${unusedFiles.length}

## تحذير
هذه القائمة إرشادية: الاستيراد الديناميكي بأسماء متغيّرة، ومداخل الاختبارات، وسكربتات البناء قد تستخدم ملفًا يبدو يتيمًا. **لا تحذف دون تحقق يدوي.**

## الملفات اليتيمة (${unusedFiles.length})

${unusedFiles.map((f) => `- \`${f}\``).join("\n") || "_لا يوجد_"}
`);

writeFileSync(join(outDir, "unused-exports.md"), `# تصديرات يُحتمل عدم استخدامها

> توليد آلي ${now} — تحليل نصي تقريبي (بديل knip/ts-prune المحلي)
> تصديرات مفحوصة: ${exported.length} · بلا استخدام خارج الملف: ${unusedExports.length} · مرة واحدة: ${usedOnceExports.length}

## بلا استخدام ظاهر خارج الملف المعرِّف (${unusedExports.length})

| الملف | الرمز |
|---|---|
${unusedExports.slice(0, 400).map((e) => `| \`${e.file}\` | \`${e.name}\` |`).join("\n")}
${unusedExports.length > 400 ? `\n… و${unusedExports.length - 400} أخرى\n` : ""}

## مستخدمة مرة واحدة فقط (مرشّحة للمراجعة)

| الملف | الرمز |
|---|---|
${usedOnceExports.slice(0, 100).map((e) => `| \`${e.file}\` | \`${e.name}\` |`).join("\n")}
`);

writeFileSync(join(outDir, "css-usage.md"), `# استخدام أصناف CSS

> توليد آلي ${now}
> ملفات مفحوصة: ${cssFiles.filter((f) => existsSync(resolve(appRoot, f))).join(", ")}
> أصناف: ${cssClasses.size} · مستخدمة: ${cssUsed.length} · مرة واحدة: ${cssOnce.length} · ميتة: ${cssDead.length}

## ميتة (عدّ JSX = 0) — أعلى أولوية للحذف في D3/D4

| الصنف | التعريف في |
|---|---|
${cssDead.slice(0, 300).map((r) => `| \`.${r.name}\` | ${r.defs.map((d) => `\`${d}\``).join(", ")} |`).join("\n")}
${cssDead.length > 300 ? `\n… و${cssDead.length - 300} أخرى\n` : ""}

## مستخدمة مرة واحدة

عدد: ${cssOnce.length} (انظر الجرد الخام عند الحاجة)

## مستخدمة (≥2)

عدد: ${cssUsed.length}
`);

writeFileSync(join(outDir, "duplicate-components.md"), `# مكوّنات متشابهة مرشّحة للدمج

> توليد آلي ${now} — تجميع بالاسم الجذعي (Card/Header/Sheet/Empty…)
> ليس قياس تشابه AST بنسبة 80٪؛ مرحلة لاحقة يمكن إضافة jscpd.

## مجموعات بالاسم الجذعي

${duplicateCandidates.map(([stem, files]) => `### \`${stem || "(فارغ)"}\` (${files.length})
${files.map((f) => `- \`${f}\``).join("\n")}`).join("\n\n")}

## مرشّحون يدويون معروفون من الهيكلة
- بطاقات المحتوى: ContentCard / HubCard / LessonCard / BookCard
- حالات فارغة: EmptyState / NoResults / Placeholder
- الشيتات: AppBottomSheet / MoreBottomSheet / ayah-action-sheet
- الترويسات: SectionHeader / PageHero / ContentHubLayout
`);

writeFileSync(join(outDir, "route-map.md"), `# خريطة المسارات ↔ الصفحات

> توليد آلي ${now}
> مسارات \`<Route path>\` في App.tsx: **${routes.length}**
> ملفات \`src/views/**/*.tsx\`: **${viewFiles.length}**
> مربوطة بـ lazy/import من App: **${liveViews.length}**
> يتيمة (لا استيراد ظاهر من App): **${orphanViews.length}**

## المسارات الحيّة في App.tsx

${routes.map((r) => `- \`${r}\``).join("\n")}

## صفحات views مربوطة

${liveViews.map((v) => `- \`${v}\``).join("\n")}

## صفحات views يتيمة (مرشّحة للمراجعة — قد تُستورد من صفحات أخرى)

${orphanViews.map((v) => `- \`${v}\``).join("\n") || "_لا يوجد_"}

## ملاحظات
- بعض الـviews تُستورد من صفحات أخرى أو من admin — ليست كلها موتًا.
- توحيد السجل في الحزمة F سيزيل التكرار بين prerender والتنقّل.
`);

writeFileSync(join(outDir, "deps-audit.md"), `# تدقيق الاعتماديات

> توليد آلي ${now}
> إجمالي الحزم في package.json: ${depNames.length}

## يُحتمل عدم استخدامها في src/ (تحقق قبل الحذف)

${unusedDeps.map((d) => `- \`${d}\``).join("\n") || "_لا مرشّحين واضحين_"}

## مكتبات متداخلة وظيفيًا

${duplicateLibs.length
  ? duplicateLibs.map((d) => `- **${d.kind}**: ${d.packages.map((p) => `\`${p}\``).join(", ")}`).join("\n")
  : "_لا تكرار وظيفي واضح بين أيقونات/تواريخ/HTTP_"}

## ملاحظات
- أدوات البناء والاختبار تُستثنى جزئيًا من «غير مستخدم».
- \`rollup-plugin-visualizer\` موجود — تقرير الحزمة في \`bundle-report.md\` (ملخص) وHTML عند تشغيل البناء مع VISUALIZER=1.
`);

// Bundle summary without full rebuild: parse existing dist if present, else note
let bundleMd = `# تقرير الحزمة (ملخص)

> توليد آلي ${now}
`;

const distDir = resolve(appRoot, "dist/assets");
if (existsSync(distDir)) {
  const assets = readdirSync(distDir)
    .filter((n) => /\.(js|css)$/.test(n))
    .map((n) => {
      const p = join(distDir, n);
      return { name: n, bytes: statSync(p).size };
    })
    .sort((a, b) => b.bytes - a.bytes);
  bundleMd += `\n## أكبر 15 أصلًا في dist/assets (بناء محلي إن وُجد)\n\n| الملف | الحجم (KB) |\n|---|---:|\n`;
  for (const a of assets.slice(0, 15)) {
    bundleMd += `| \`${a.name}\` | ${(a.bytes / 1024).toFixed(1)} |\n`;
  }
  bundleMd += `\nلتوليد \`bundle-report.html\` التفاعلي: \`VISUALIZER=1 pnpm --filter @workspace/majalis run build\` بعد تفعيل المكوّن في vite.config.\n`;
  // Write a minimal HTML table report
  const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><meta charset="utf-8"/><title>Majlisilm Bundle Report</title>
  <body style="font-family:system-ui;padding:1.5rem"><h1>أكبر الأصول</h1><table border="1" cellpadding="6"><tr><th>الملف</th><th>KB</th></tr>
  ${assets.slice(0, 20).map((a) => `<tr><td>${a.name}</td><td>${(a.bytes / 1024).toFixed(1)}</td></tr>`).join("")}
  </table><p>تاريخ: ${now}</p></body></html>`;
  writeFileSync(join(outDir, "bundle-report.html"), html);
} else {
  bundleMd += `\nلم يُعثر على \`dist/assets\`. شغّل البناء ثم أعد الجرد.\n`;
  writeFileSync(join(outDir, "bundle-report.html"), `<!DOCTYPE html><html lang="ar" dir="rtl"><meta charset="utf-8"/><title>Bundle</title><body><p>لا dist بعد — أعد التوليد بعد البناء.</p></body></html>`);
}
writeFileSync(join(outDir, "bundle-report.md"), bundleMd);

writeFileSync(join(outDir, "README.md"), `# جرد الهيكلة الكبرى v7 — الحزمة A

تاريخ التوليد: **${now}**

| الملف | الغرض |
|---|---|
| unused-exports.md | تصديرات بلا استخدام ظاهر |
| unused-files.md | ملفات لا يصلها استيراد من main.tsx |
| css-usage.md | أصناف CSS: مستخدم / مرة / ميت |
| duplicate-components.md | مرشّحو الدمج |
| route-map.md | مسارات ↔ views |
| deps-audit.md | اعتماديات |
| bundle-report.html | أكبر الأصول |

إعادة التوليد:

\`\`\`bash
node artifacts/majalis/scripts/generate-codebase-inventory.mjs
\`\`\`

**قرار:** \`if: false\` على Resolve PR conflicts — **غير موجود** في \`.github/workflows/resolve-pr-conflicts.yml\` (مُزال مسبقًا).
`);

console.log(JSON.stringify({
  outDir: relative(repoRoot, outDir),
  srcFiles: allSrcFiles.length,
  reachable: reachable.size,
  unusedFiles: unusedFiles.length,
  unusedExports: unusedExports.length,
  cssDead: cssDead.length,
  routes: routes.length,
  views: viewFiles.length,
  orphanViews: orphanViews.length,
  unusedDeps: unusedDeps.length,
}, null, 2));
