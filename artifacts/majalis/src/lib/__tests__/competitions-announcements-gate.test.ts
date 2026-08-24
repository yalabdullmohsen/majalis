/**
 * بوابة إعلانات المسابقات الخارجية — تمنع العودة لمفهوم الأسئلة.
 * تشغيل: node --import tsx src/lib/__tests__/competitions-announcements-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getLobby } from "@/config/section-lobbies";
import { NOUN_ASILA, NOUN_MUSABAQAT, pluralAr } from "@/lib/arabic-count";
import {
  COMPETITION_FILTERS,
  canPublishCompetition,
  categoryFromType,
  classifyCompetitionType,
  countPublishedCompetitions,
  filterCompetitions,
  looksLikeCompetitionAnnouncement,
  type ExternalCompetition,
} from "@/lib/competitions";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

console.log("\n=== لوبي الدروس: مسابقات لا أسئلة ===");
{
  const lessons = getLobby("lessons");
  const cell = lessons.quad?.find((q) => q.id === "competitions");
  assert.ok(cell, "خلية المسابقات في لوبي الدروس");
  assert.equal(cell.noun, NOUN_MUSABAQAT, "عدّاد المسابقات = NOUN_MUSABAQAT");
  assert.notEqual(cell.noun, NOUN_ASILA, "لا يستخدم عدّاد الأسئلة");
  const label = pluralAr(cell.count, cell.noun);
  assert.doesNotMatch(label, /سؤال/, `العدّاد بلا كلمة سؤال: ${label}`);
  assert.doesNotMatch(label, /180/, "لا يظهر 180");
  assert.equal(cell.count, countPublishedCompetitions());
}

console.log("\n=== واجهة المسابقات بلا /quiz وأسئلة ===");
{
  const hub = read("src/pages/competitions/ui/CompetitionsHubView.tsx");
  const detail = read("src/pages/competitions/ui/CompetitionDetailView.tsx");
  const cfg = read("src/config/competitions-hub.ts");
  for (const [name, src] of [
    ["hub", hub],
    ["detail", detail],
    ["cfg", cfg],
  ] as const) {
    assert.doesNotMatch(src, /\/quiz\?/, `${name}: لا يوجّه إلى /quiz?`);
    assert.doesNotMatch(src, /NOUN_ASILA/, `${name}: بلا NOUN_ASILA`);
    assert.doesNotMatch(src, /180\s*سؤال/, `${name}: بلا 180 سؤال`);
  }
  assert.match(hub, /data-competitions-empty/);
  assert.match(hub, /لا مسابقات منشورة حاليًا/);
  assert.match(hub, /href="\/quiz"/);
  assert.match(hub, /href="\/lessons"/);
  assert.match(hub, /COMPETITION_FILTERS/);
  assert.match(detail, /data-competition-detail|انتهى التسجيل/);
}

console.log("\n=== فلاتر ===");
{
  assert.deepEqual(
    COMPETITION_FILTERS.map((f) => f.id),
    ["all", "quran", "hadith", "tajweed", "prizes", "open", "men", "women", "remote"],
  );
  const sample: ExternalCompetition = {
    id: "t1",
    title: "مسابقة تجريبية",
    organizerName: "جهة",
    competitionType: "quran_memorization",
    category: "quran",
    genderTarget: "الكل",
    prizeText: "جوائز",
    registrationStatus: "مفتوح",
    registrationUrl: "https://example.com/r",
    isRemote: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    sourcePlatform: "manual",
  };
  assert.equal(filterCompetitions([sample], "quran").length, 1);
  assert.equal(filterCompetitions([sample], "hadith").length, 0);
  assert.equal(filterCompetitions([sample], "prizes").length, 1);
  assert.equal(filterCompetitions([sample], "open").length, 1);
  assert.equal(filterCompetitions([sample], "remote").length, 1);
}

console.log("\n=== رفض النشر الناقص ===");
{
  assert.equal(canPublishCompetition({ title: "مسابقة", organizerName: "جهة" }), false);
  assert.equal(
    canPublishCompetition({
      title: "مسابقة الماهر",
      organizerName: "جمعية",
      registrationUrl: "https://example.com",
    }),
    true,
  );
}

console.log("\n=== تصنيف الأتمتة ===");
{
  assert.equal(looksLikeCompetitionAnnouncement("مسابقة الماهر بالقرآن"), true);
  assert.equal(classifyCompetitionType("مسابقة الماهر بالقرآن"), "quran_memorization");
  assert.equal(categoryFromType("quran_memorization"), "quran");
  assert.equal(classifyCompetitionType("تسميع الأحاديث النبوية"), "hadith_memorization");
  assert.equal(categoryFromType("hadith_memorization"), "hadith");
}

console.log("\n=== السجل ===");
{
  const reg = read("src/config/sections.registry.ts");
  assert.match(reg, /id:\s*"competitions"[\s\S]*?subtitle:\s*"إعلانات مسابقات/);
  assert.doesNotMatch(reg, /id:\s*"competitions"[\s\S]{0,350}سين جيم/);
}

console.log("\ncompetitions-announcements-gate.test.ts: ok");
