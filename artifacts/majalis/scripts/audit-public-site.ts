/**
 * زاحف تدقيق للصفحات العامة — يفحص prerender/sitemap بحثًا عن أعطال شائعة.
 * التشغيل: pnpm --filter @workspace/majalis run audit:public-site
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { isPrivateSeoPath, PUBLIC_DESC_MIN_P0 } from "./seo-path-class.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const prerenderDir = resolve(root, "seo-prerender");
const seoRoutes = JSON.parse(readFileSync(resolve(root, "src/lib/seo-routes.json"), "utf8"));
const robots = readFileSync(resolve(root, "public/robots.txt"), "utf8");
const sitemap = readFileSync(resolve(root, "public/sitemap.xml"), "utf8");

type Finding = { level: "error" | "warn" | "info"; msg: string };
const findings: Finding[] = [];

function walkHtml(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkHtml(p, out);
    else if (name === "index.html") out.push(p);
  }
  return out;
}

function pathFromFile(file: string): string {
  const rel = relative(prerenderDir, file).replace(/\\/g, "/");
  const path = "/" + rel.replace(/\/index\.html$/, "").replace(/index\.html$/, "");
  return path === "/" || path === "" ? "/" : path;
}

function extract(html: string, re: RegExp): string | null {
  const m = html.match(re);
  return m ? (m[1] ?? m[0]).trim() : null;
}

const BAD_EMAIL = /@majlis-?ilm\.old|example\.com|noreply@test/i;
const BAD_TOKENS = /\bundefined\b|\bnull\b|\bTODO\b|\bFIXME\b|Cache miss|homepage fallback/i;
const UNVERIFIED_CLAIM = /موثقة بالأدلة|معتمدة بلا مصدر|محتوى موثق بالكامل/i;

if (!/Disallow:\s*\/admin/i.test(robots)) {
  findings.push({ level: "error", msg: "robots.txt لا يمنع /admin" });
}
if (/https?:\/\/[^<\s]+\/admin(\/|"|<)/.test(sitemap)) {
  findings.push({ level: "error", msg: "sitemap يحتوي مسارات /admin" });
}

const files = walkHtml(prerenderDir);
if (files.length < 50) {
  findings.push({ level: "error", msg: `عدد صفحات prerender منخفض: ${files.length}` });
}

let publicShort = 0;
let privateOk = 0;
let claimHits = 0;
let tokenHits = 0;

for (const file of files) {
  const path = pathFromFile(file);
  const html = readFileSync(file, "utf8");
  const privatePath = isPrivateSeoPath(path);
  const desc =
    extract(html, /<meta\s+name="description"\s+content="([^"]+)"/i) ||
    extract(html, /<meta\s+content="([^"]+)"\s+name="description"/i);
  const robotsMeta =
    extract(html, /<meta\s+name="robots"\s+content="([^"]+)"/i) ||
    extract(html, /<meta\s+content="([^"]+)"\s+name="robots"/i);

  if (privatePath) {
    privateOk++;
    if (!String(robotsMeta || "").includes("noindex")) {
      findings.push({ level: "error", msg: `${path}: مسار خاص بلا noindex` });
    }
    continue;
  }

  if (!desc || desc.length < PUBLIC_DESC_MIN_P0) {
    publicShort++;
    findings.push({
      level: "error",
      msg: `${path}: وصف عام قصير (${desc?.length ?? 0})`,
    });
  }

  if (BAD_EMAIL.test(html)) {
    findings.push({ level: "error", msg: `${path}: بريد قديم/اختباري` });
  }
  if (BAD_TOKENS.test(html)) {
    tokenHits++;
    findings.push({ level: "warn", msg: `${path}: أثر undefined/null/TODO/Cache miss` });
  }
  if (UNVERIFIED_CLAIM.test(html) && !/مصدر|تخريج|رواه|متفق عليه/.test(html)) {
    claimHits++;
    findings.push({ level: "warn", msg: `${path}: ادّعاء توثيق بلا مصدر ظاهر في الصفحة` });
  }
}

for (const r of seoRoutes.routes || []) {
  if (!isPrivateSeoPath(r.path)) continue;
  if (!String(r.robots || "").includes("noindex")) {
    findings.push({ level: "error", msg: `seo-routes ${r.path}: بلا noindex` });
  }
  if (r.sitemap !== false) {
    findings.push({ level: "error", msg: `seo-routes ${r.path}: داخل sitemap` });
  }
}

const errors = findings.filter((f) => f.level === "error");
const warns = findings.filter((f) => f.level === "warn");

console.log("═══════════════════════════════════════");
console.log("  audit:public-site");
console.log("═══════════════════════════════════════");
console.log(`صفحات prerender: ${files.length}`);
console.log(`مسارات خاصة فُحصت: ${privateOk}`);
console.log(`أوصاف عامة قصيرة: ${publicShort}`);
console.log(`تحذيرات توثيق بلا مصدر: ${claimHits}`);
console.log(`آثار TODO/undefined: ${tokenHits}`);
console.log(`أخطاء: ${errors.length} · تحذيرات: ${warns.length}`);

for (const f of errors.slice(0, 40)) console.log(`❌ ${f.msg}`);
for (const f of warns.slice(0, 20)) console.log(`⚠️ ${f.msg}`);
if (errors.length > 40) console.log(`… و${errors.length - 40} خطأ إضافي`);

if (errors.length > 0) {
  process.exitCode = 1;
  console.log("\nفشل audit:public-site");
} else {
  console.log("\n✅ اجتاز audit:public-site (بدون أخطاء P0)");
}
