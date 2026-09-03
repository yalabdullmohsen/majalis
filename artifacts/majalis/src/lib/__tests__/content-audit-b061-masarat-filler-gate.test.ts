/**
 * بوابة b061: أوصاف خطوات المسارات بلا حشو قالبي مكرر.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-b061-masarat-filler-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MASARAT } from "../masarat-data";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const src = readFileSync(resolve(root, "src/lib/masarat-data.ts"), "utf8");

const FORBIDDEN = [
  "يُراجع التقدم أسبوعيًا ويُعدَّل الجدول عند العجز",
  "يُراجع التقدم أسبوعيًا ويُعدَّل الجدول عند العجز",
  "مع ربط الخطوة بعمل ظاهر لا بالاكتفاء بالقراءة",
  "والعمدة الدليل الصحيح والمصادر المعتمدة في المنصة",
  "العمدة الدليل الصحيح والمصادر المعتمدة في المنصة",
  "ويُبدأ بالأهم فالمهم مع دوام يومي ولو يسيرًا",
  "يُبدأ بالأهم فالمهم مع دوام يومي ولو يسيرًا",
  "مع اجتناب التوسع قبل إتقان الأساس",
];

for (const phrase of FORBIDDEN) {
  assert.equal(src.split(phrase).length - 1, 0, `بقايا الحشو: ${phrase.slice(0, 28)}…`);
}

const descriptions = MASARAT.flatMap((m) => m.steps.map((s) => s.description ?? ""));
assert.ok(descriptions.length >= 40, `عدد الأوصاف: ${descriptions.length}`);
assert.ok(
  descriptions.every((d) => d.length >= 20),
  "كل خطوة لها وصف ذو معنى",
);

const unique = new Set(descriptions);
assert.equal(unique.size, descriptions.length, "أوصاف الخطوات فريدة بلا تكرار حرفي");

assert.equal(MASARAT.length, 6, "ستة مسارات");
assert.ok(
  MASARAT.every((m) => m.steps.length >= 7),
  "كل مسار بسبع خطوات فأكثر",
);

console.log("content-audit-b061-masarat-filler-gate: ok");
