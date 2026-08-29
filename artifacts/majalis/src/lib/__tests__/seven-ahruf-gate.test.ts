/**
 * بوابة الأحرف السبعة.
 * node --import tsx src/lib/__tests__/seven-ahruf-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { AHRUF_SECTIONS } from "../quran-ahruf/content.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const reg = read("src/config/sections.registry.ts");
const routes = read("src/app/router/routes.ts");
const app = read("src/App.tsx") + "\n" + read("src/AppRoutes.tsx");
const qiraat = read("src/pages/quran/ui/QuranQiraatView.tsx");
const view = read("src/pages/quran/ui/QuranSevenAhrufView.tsx");

assert.match(reg, /id:\s*"quran-seven-ahruf"/);
assert.match(reg, /\/quran-hub\/seven-ahruf/);
assert.match(reg, /سبعة أحرف/);
assert.match(reg, /الأحرف السبعه/);
assert.match(routes, /\/quran-hub\/seven-ahruf/);
assert.match(app, /QuranSevenAhrufPage/);
assert.match(app, /\/quran-hub\/seven-ahruf/);
assert.match(qiraat, /\/quran-hub\/seven-ahruf/);
assert.match(view, /data-quran-seven-ahruf/);
assert.match(read("src/lib/seo-routes.json"), /\/quran-hub\/seven-ahruf/, "مسار SEO/prerender مطلوب وإلا 404 على الإنتاج");

assert.ok(AHRUF_SECTIONS.length >= 7, "أبواب كافية");
for (const s of AHRUF_SECTIONS) {
  assert.ok(s.sources.length >= 1, `بلا مصدر: ${s.id}`);
  assert.ok(s.body.every((p) => p.trim().length > 20), `نص قصير: ${s.id}`);
}

assert.ok(AHRUF_SECTIONS.some((s) => s.id === "vs-qiraat"), "فرق الأحرف/القراءات");
assert.ok(AHRUF_SECTIONS.some((s) => s.id === "hadith-umar"), "حديث عمر");

console.log("seven-ahruf-gate: ok");
