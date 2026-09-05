/**
 * بوابة مشاركة «فائدة من سُنّة» — عبر SectionShareActions في نهاية القسم فقط.
 * node --import tsx src/lib/__tests__/share-faida-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildFaidaShareText, whatsappShareUrl } from "../share-faida";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const text = buildFaidaShareText("كتاب الصلاة", "https://www.ssunnah.com/fiqh/books/salah");
assert.match(text, /فائدة من سُنّة/);
assert.match(text, /كتاب الصلاة/);
assert.match(text, /https:\/\/www\.ssunnah\.com/);
assert.doesNotMatch(text, /www\.majlisilm/);

const wa = whatsappShareUrl(text);
assert.match(wa, /^https:\/\/wa\.me\/\?text=/);

const shareFaida = read("src/components/ShareFaida.tsx");
assert.match(shareFaida, /Share2/);
assert.match(shareFaida, /واتساب/);
assert.match(shareFaida, /\{copied \? "تم" : "نسخ"\}/);
assert.match(shareFaida, /مشاركة/);
assert.match(shareFaida, /واتساب/);

const contentActions = read("src/components/ContentActions.tsx");
assert.match(contentActions, /SectionShareActions/);
assert.match(contentActions, /فائدة من سُنّة/);

const section = read("src/components/common/SectionShareActions.tsx");
assert.match(section, /ShareFaida/);
assert.match(section, /data-section-share-actions/);
assert.match(section, /section-share-actions--dup/);

const contact = read("src/views/ContactPage.tsx");
assert.doesNotMatch(contact, /ShareFaida/, "صفحة التواصل بلا ShareFaida");

const adhkarSheet = read("src/pages/worship/ui/AdhkarDhikrSheet.tsx");
assert.doesNotMatch(adhkarSheet, /from ["']@\/components\/ShareButton["']/, "شيت الذكر بلا مشاركة داخلية");

const seerah = read("src/views/SeerahPage.tsx");
assert.doesNotMatch(seerah, /from ["']@\/components\/ShareButton["']/, "مراحل السيرة بلا مشاركة داخل اللوحة");
assert.match(seerah, /ShareButtons/);

const lessonCard = read("src/components/lessons/UnifiedLessonCard.tsx");
assert.doesNotMatch(lessonCard, />\s*مشاركة\s*</);
assert.doesNotMatch(lessonCard, /نسخ الرابط/);
assert.doesNotMatch(lessonCard, /نسخ البيانات/);

const hadithCard = read("src/components/hadith/HadithCard.tsx");
assert.doesNotMatch(hadithCard, /Share2/);
assert.doesNotMatch(hadithCard, /handleShare/);
assert.doesNotMatch(hadithCard, /نسخ المتن/);

console.log("share-faida-gate.test.ts: ok");
