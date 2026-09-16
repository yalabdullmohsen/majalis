/**
 * بوابة اكتمال جودة المحتوى r7 — منع رجوع القطع/المجمع/المعرّفات.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-r7-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

console.log("=== لا قطع salutation في أحاديث/اختبارات منشورة ===");
{
  const bad = /صلى الله عليه و\./;
  for (const rel of [
    "public/data/hadith-verified/sahih-004.json",
    "public/data/hadith-verified/sahih-006.json",
    "public/data/hadith-verified/sahih-007.json",
    "public/data/knowledge/quiz/batch-003.json",
    "public/data/knowledge/quiz/batch-004.json",
    "public/data/knowledge/quiz/batch-005.json",
    "src/lib/verified-hadith-fill-sahih-b2.ts",
    "src/lib/verified-hadith-fill-sahih-b3.ts",
  ]) {
    assert.doesNotMatch(read(rel), bad, `${rel}: بلا salutation مقطوع`);
  }
}

console.log("=== علامات الساعة بلا جمل مقطوعة ===");
{
  const page = read("src/views/AlamatSaahPage.tsx");
  assert.doesNotMatch(page, /نقتصر على\./);
  assert.doesNotMatch(page, /ويُقرأ\./);
}

console.log("=== لا علامة مجمع فقه في تحديثات المستخدم ===");
{
  const updates = read("src/lib/updates-seed.ts");
  assert.doesNotMatch(updates, /مجمع الفقه|المجمع الفقهي|\/fiqh-council/);
}

console.log("=== مسار علوم القرآن يشير لمسار حي ===");
{
  const reg = read("src/config/sections.registry.ts");
  assert.doesNotMatch(reg, /quran-sciences-legacy/);
  assert.match(reg, /id:\s*"quran-sciences"[\s\S]{0,220}?route:\s*"\/quran-sciences"/);
}

console.log("=== RelatedRail لا يعرض slug خامًا ===");
{
  const rail = read("src/widgets/RelatedRail.tsx");
  assert.match(rail, /titleAr === L\.to\.slug|!titleAr/);
  assert.doesNotMatch(rail, /\?\? L\.to\.slug/);
}

console.log("=== لوحة الإدارة لا تعرض id كعنوان درس ===");
{
  const sb = read("src/lib/supabase.ts");
  assert.match(sb, /درس بلا عنوان/);
}

console.log("=== تطبيع مرجع الآية موجود ===");
{
  assert.match(read("src/lib/quran-api.ts"), /normalizeAyahKey|normalizeSurahAyah/);
  assert.ok(existsSync(resolve(root, "src/lib/__tests__/ayah-ref-normalize-gate.test.ts")));
}

console.log("=== بوابة المساعد بلا صنف soon ===");
{
  assert.doesNotMatch(read("src/pages/assistant/AssistantGate.tsx"), /assistant-soon/);
  assert.match(read("src/pages/assistant/AssistantGate.tsx"), /assistant-gate/);
}

console.log("content-quality-r7-gate.test.ts: ok");
