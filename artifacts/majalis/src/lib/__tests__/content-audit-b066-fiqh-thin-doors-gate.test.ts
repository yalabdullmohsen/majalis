/**
 * بوابة b066: توسيع عيّنة أبواب فقه رقيقة (إجارة/شركة/قرض) بفهرس كلاسيكي،
 * وتنظيف بقايا صياغة «مكتبة» العلنية.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b066-fiqh-thin-doors-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildFiqhDoorSummaries } from "../fiqh/fiqhNormalize";
import { listPublishedLessons } from "../fiqh-books";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

const NEW_IDS = [
  "ijara-ma-tasih-fihris",
  "ijara-faskh-fihris",
  "sharika-inan-fihris",
  "sharika-wujuh-abdan-fihris",
  "qard-tawthiq-fihris",
  "qard-inzhar-fihris",
] as const;

const doors = buildFiqhDoorSummaries();
for (const id of ["ijara", "sharika", "qard"] as const) {
  const door = doors.find((d) => d.id === id);
  assert.ok(door, `باب ${id}`);
  assert.ok(door!.issueCount >= 4, `${id}: ≥4 مسائل (الآن ${door!.issueCount})`);
  assert.ok(door!.chapterCount >= 4, `${id}: ≥4 أبواب (الآن ${door!.chapterCount})`);
}

const byId = new Map(listPublishedLessons().map((h) => [h.lesson.id, h.lesson]));
for (const id of NEW_IDS) {
  const lesson = byId.get(id);
  assert.ok(lesson, `درس ${id}`);
  assert.equal(lesson!.status, "published", `${id}: منشور`);
  assert.match(lesson!.summary, /فهرس هيكلي/, `${id}: ملخص فهرسي`);
  assert.match(lesson!.evidence, /إحالة فهرسية/, `${id}: دليل إحالة لا نص محرَّر`);
  assert.match(lesson!.preferred, /لا راجح محرَّر/, `${id}: بلا راجح مخترع`);
  assert.doesNotMatch(lesson!.summary, /مدخل إلى|يتناول هذا المبحث/, `${id}: بلا حشو stub`);
  assert.ok((lesson!.sources?.length || 0) >= 2, `${id}: مصادر ≥2`);
}

const scrubTargets: Array<[string, RegExp]> = [
  ["src/views/SourcesLicensesPage.tsx", /فهرس المصادر المرجعية/],
  ["src/views/SourcesLicensesPage.tsx", /الدروس وفهرس المراجع/],
  ["src/lib/navigation.ts", /روابط المصحف والبحث/],
  ["src/lib/seo.ts", /الدروس والفوائد والأقسام/],
  ["src/pages/fiqh/ui/RulingsView.tsx", /فهرس علمي للأحكام/],
  ["src/lib/tafsir-seed.ts", /\/search\?q=%D8%AA%D9%81%D8%B3%D9%8A%D8%B1/],
  ["src/pages/account/ui/AccountDeletionView.tsx", /الدروس والقرآن والأحكام العامة/],
];

for (const [rel, re] of scrubTargets) {
  const src = readFileSync(resolve(appRoot, rel), "utf8");
  assert.match(src, re, `${rel}: تنظيف صياغة المكتبة`);
}

assert.doesNotMatch(
  readFileSync(resolve(appRoot, "src/lib/tafsir-seed.ts"), "utf8"),
  /\/library\?cat=/,
  "tafsir-seed بلا رابط مكتبة",
);

console.log("content-audit-b066-fiqh-thin-doors-gate: ok");
