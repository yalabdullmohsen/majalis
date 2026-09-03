/**
 * بوابة b059 / b010: مصفوفة inventory تغطي الأقسام الحيّة في السجل (غير الحساب).
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b059-coverage-matrix-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SECTIONS } from "@/config/sections.registry";

const majalisRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const invPath = resolve(majalisRoot, "../../docs/content-audit/inventory.json");

const inv = JSON.parse(readFileSync(invPath, "utf8")) as {
  liveContentSections: number;
  auditedInSeriesCount: number;
  records: { sectionId: string; group: string; route: string }[];
};

const liveIds = new Set(
  SECTIONS.filter(
    (s) =>
      s.status === "live" &&
      s.group !== "account" &&
      s.route !== "/" &&
      s.id !== "sections" &&
      s.id !== "home",
  ).map((s) => s.id),
);

assert.ok(inv.liveContentSections >= 50, `تغطية كافية (${inv.liveContentSections})`);
assert.ok(inv.auditedInSeriesCount >= 20, `أقسام مُدقَّقة في السلسلة (${inv.auditedInSeriesCount})`);

const invIds = new Set(inv.records.filter((r) => r.group !== "infra").map((r) => r.sectionId));
for (const id of liveIds) {
  assert.ok(invIds.has(id), `inventory ينقصه القسم الحي: ${id}`);
}

assert.ok(invIds.has("arabic-language"), "اللغة العربية في المصفوفة");
assert.ok(invIds.has("tafsir"), "التفسير في المصفوفة");
assert.ok(invIds.has("prophets"), "الأنبياء في المصفوفة");

console.log("content-audit-b059-coverage-matrix-gate: ok");
