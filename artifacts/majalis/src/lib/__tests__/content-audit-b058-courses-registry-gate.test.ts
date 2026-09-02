/**
 * بوابة b058: دورات سنوية بلا حشو قالبي، وكل دورة لها body؛ وأقسام اللغة/المقاصد/دلائل في السجل.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b058-courses-registry-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ANNUAL_COURSES_SEED } from "../annual-courses-seed";
import { getSectionById } from "@/config/sections.registry";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

const FORBIDDEN = [
  "والعمدة فيها الفهم والعمل لا الحفظ وحده",
  "مع متابعة التطبيق والمراجعة بين الدروس",
  "تقريب الهداية لا تكثير الحشو بلا فائدة",
  "ويُراعى الأدب مع النصوص والتاريخ فلا يُزاد على ما ثبت",
];

assert.equal(ANNUAL_COURSES_SEED.length, 63, "63 دورة");
for (const c of ANNUAL_COURSES_SEED) {
  assert.ok(String(c.body || "").trim().length > 40, `${c.id}: body ناقص`);
  const blob = `${c.summary || ""}\n${c.body || ""}`;
  for (const ph of FORBIDDEN) {
    assert.equal(blob.includes(ph), false, `${c.id}: بقايا «${ph.slice(0, 30)}…»`);
  }
}

const seedSrc = readFileSync(resolve(root, "src/lib/annual-courses-seed.ts"), "utf8");
for (const ph of FORBIDDEN) {
  assert.equal(seedSrc.split(ph).length - 1, 0, `ملف البذرة: بقايا ${ph.slice(0, 24)}`);
}

for (const id of ["arabic-language", "maqasid-sharia", "dalail-nubuwwah"] as const) {
  const s = getSectionById(id);
  assert.ok(s, `قسم ${id} في السجل`);
  assert.equal(s!.status, "live", `${id}: live`);
}

console.log("content-audit-b058-courses-registry-gate: ok");
