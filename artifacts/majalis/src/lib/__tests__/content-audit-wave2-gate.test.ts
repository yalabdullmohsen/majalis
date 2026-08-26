/**
 * بوابة موجة تدقيق المحتوى ٢: قصص السور مربوطة بالميتا الموسّع بلا قوالب فارغة.
 * node --import tsx src/lib/__tests__/content-audit-wave2-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getAllSurahStories, getSurahStory } from "@/lib/surah-stories";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const storiesSrc = readFileSync(resolve(root, "src/lib/surah-stories.ts"), "utf8");
assert.match(storiesSrc, /getSurahExtendedMeta/);
assert.match(storiesSrc, /isSurahMetaReady/);

const all = getAllSurahStories();
assert.equal(all.length, 114);
for (const s of all) {
  assert.ok(s.mainThemes.length >= 1, `سورة ${s.number}: محاور`);
  assert.ok(s.lessons.length >= 2, `سورة ${s.number}: دروس`);
  assert.ok(s.mainStories.length >= 1, `سورة ${s.number}: قصص/محاور`);
  assert.doesNotMatch(s.lessons.join(" "), /تأمّل قصص سورة|العبرة بمنهج الأنبياء/);
  assert.ok(s.namingReason.trim().length > 20, `سورة ${s.number}: سبب تسمية`);
}

const fatiha = getSurahStory(1);
assert.ok(fatiha.mainThemes.includes("التوحيد"));
assert.match(fatiha.lessons.join(" "), /الحمد|الهداية|العبادة/);

const kahf = getSurahStory(18);
assert.ok(kahf.mainStories.some((x) => /الكهف|الخضر|القرنين/.test(x)));

const curatedKeys = [...storiesSrc.matchAll(/^\s+(\d+):\s+\[/gm)].map((m) => Number(m[1]));
assert.ok(curatedKeys.length >= 55, `قصص سردية مخصّصة ≥55 (الآن ${curatedKeys.length})`);

console.log("content-audit-wave2-gate.test.ts: ok");
