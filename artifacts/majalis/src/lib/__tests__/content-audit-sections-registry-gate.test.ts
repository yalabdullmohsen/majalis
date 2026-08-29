/**
 * بوابة ٢ — اكتمال سجل الأقسام حرفًا/حقلًا لكل قسم حي.
 * تفحص sections.registry + ربط المسار في App/vercel وSEO عند الفهرسة.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-sections-registry-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(appRoot, rel), "utf8");

type SectionRow = {
  id: string;
  label: string;
  subtitle: string;
  route: string;
  group: string;
  status: string;
};

function parseSections(src: string): SectionRow[] {
  const rows: SectionRow[] = [];
  const blockRe =
    /\{\s*id:\s*"([^"]+)"\s*,\s*label:\s*"([^"]*)"\s*,\s*subtitle:\s*"([^"]*)"\s*,\s*route:\s*"([^"]+)"[\s\S]*?group:\s*"([^"]+)"[\s\S]*?status:\s*"(live|beta|hidden)"/g;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(src))) {
    rows.push({
      id: m[1]!,
      label: m[2]!,
      subtitle: m[3]!,
      route: m[4]!,
      group: m[5]!,
      status: m[6]!,
    });
  }
  return rows;
}

/** يمرّ على كل حرف في النص العربي/اللاتيني ويتحقق من عدم فراغ بصري. */
function assertNonEmptyLetters(value: string, field: string, id: string, min: number) {
  const trimmed = value.trim();
  assert.ok(trimmed.length >= min, `${id}.${field}: ≥${min} حرفًا (الآن ${trimmed.length})`);
  let letters = 0;
  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i]!;
    const code = ch.charCodeAt(0);
    const isArabic = code >= 0x0600 && code <= 0x06ff;
    const isLatin = (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
    const isDigit = code >= 0x30 && code <= 0x39;
    const isArDigit = code >= 0x0660 && code <= 0x0669;
    if (isArabic || isLatin || isDigit || isArDigit) letters += 1;
  }
  assert.ok(letters >= Math.min(min, 2), `${id}.${field}: يحتوي حروفًا حقيقية لا مسافات فقط`);
}

const registry = read("src/config/sections.registry.ts");
const sections = parseSections(registry);
assert.ok(sections.length >= 50, `أقسام السجل ≥50 (الآن ${sections.length})`);

const ids = new Set<string>();
const routes = new Set<string>();
const live = sections.filter((s) => s.status === "live");
assert.ok(live.length >= 40, `أقسام live ≥40 (الآن ${live.length})`);

const app = read("src/App.tsx") + "\n" + read("src/AppRoutes.tsx");
const vercel = existsSync(resolve(appRoot, "vercel.json")) ? read("vercel.json") : "";
const seoRoutes = JSON.parse(read("src/lib/seo-routes.json")) as {
  routes?: Array<{ path: string; robots?: string; title?: string; description?: string }>;
};
const seoByPath = new Map((seoRoutes.routes || []).map((r) => [r.path, r]));

const ACCOUNT_OR_SYSTEM = new Set([
  "home",
  "sections",
  "login",
  "register",
  "profile",
  "settings",
  "notifications",
  "delete-account",
  "privacy",
  "terms",
  "contact",
  "about",
  "search",
]);

for (const s of sections) {
  assert.equal(ids.has(s.id), false, `معرّف مكرر: ${s.id}`);
  ids.add(s.id);
  assert.equal(routes.has(s.route), false, `مسار مكرر: ${s.route}`);
  routes.add(s.route);

  assertNonEmptyLetters(s.id, "id", s.id, 2);
  assertNonEmptyLetters(s.label, "label", s.id, 2);
  assertNonEmptyLetters(s.subtitle, "subtitle", s.id, 4);
  assert.ok(s.route.startsWith("/"), `${s.id}.route يبدأ بـ /`);
  assert.ok(
    ["sciences", "stories", "dawah", "library", "worship", "learning", "account"].includes(s.group),
    `${s.id}: مجموعة معروفة (${s.group})`,
  );

  if (s.status !== "live") continue;

  const routeEsc = s.route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const inApp =
    new RegExp(`path="${routeEsc}"`).test(app) ||
    new RegExp(`path={'${routeEsc}'}`).test(app) ||
    new RegExp(`to="${routeEsc}"`).test(app) ||
    s.route === "/" ||
    // مسارات محاور قد تُخدم عبر مكوّن ديناميكي
    app.includes(`"${s.route}"`) ||
    vercel.includes(`"source": "${s.route}"`) ||
    vercel.includes(`"destination": "${s.route}"`);
  assert.ok(inApp, `${s.id}: المسار ${s.route} مربوط في App أو vercel`);

  // SEO: إما مدخل مفهرس بعنوان/وصف، أو noindex، أو قسم نظامي
  if (!ACCOUNT_OR_SYSTEM.has(s.id) && !s.route.startsWith("/admin")) {
    const seo = seoByPath.get(s.route);
    if (seo) {
      const robots = seo.robots || "";
      if (!/noindex/i.test(robots)) {
        assertNonEmptyLetters(seo.title || "", "seo.title", s.id, 4);
        assert.ok(
          (seo.description || "").trim().length >= 40,
          `${s.id}: وصف SEO ≥40 حرفًا`,
        );
        // حرف حرف: لا نقاط حشو ≥4
        assert.equal(/\.{4,}/.test(seo.title || ""), false, `${s.id}: عنوان SEO بلا حشو نقاط`);
        assert.equal(/\.{4,}/.test(seo.description || ""), false, `${s.id}: وصف SEO بلا حشو نقاط`);
      }
    }
  }
}

assert.doesNotMatch(registry, /subtitle:\s*""/, "لا subtitle فارغ في السجل");
assert.doesNotMatch(registry, /label:\s*""/, "لا label فارغ في السجل");

console.log(
  `content-audit-sections-registry-gate: ok — ${sections.length} قسمًا (${live.length} حيًا)`,
);
