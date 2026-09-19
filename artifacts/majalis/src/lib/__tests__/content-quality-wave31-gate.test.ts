/**
 * Wave 31 — فراغات موحّدة (بحث/فلاتر/رئيسية/أذان) + إزالة «قيد الإكمال» من HadithCard + SEO.
 * تشغيل: node --import tsx src/lib/__tests__/content-quality-wave31-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const fiqh = read("src/components/FiqhGuidePage.tsx");
assert.match(fiqh, /EMPTY\.search/);
assert.doesNotMatch(fiqh, /لا نتائج لهذا البحث في الباب الحالي/);

const hub = read("src/components/SectionAccordionLayout.tsx");
assert.match(hub, /EMPTY\.search/);
assert.doesNotMatch(hub, /لا نتائج مطابقة — جرّب كلمات أخرى/);

const loc = read("src/components/prayer/PrayerLocationPicker.tsx");
assert.match(loc, /EMPTY\.search/);
assert.doesNotMatch(loc, /لا نتائج — جرّب دولة أخرى/);

const jump = read("src/components/quran/QuranSurahJumpSearch.tsx");
assert.match(jump, /EMPTY\.searchShort/);
assert.match(jump, /ACTION\.clearSearch/);
assert.doesNotMatch(jump, /لا نتائج لـ/);

const shell = read("src/components/design-system/screens/ScreenShell.tsx");
assert.match(shell, /EMPTY\.offline/);
assert.match(shell, /STATUS\.loadError/);
assert.match(shell, /ACTION\.retry/);
assert.doesNotMatch(shell, /أنت غير متصل بالإنترنت/);

const asst = read("src/components/assistant/AssistantChatView.tsx");
assert.match(asst, /STATUS\.networkError/);
assert.doesNotMatch(asst, /تعذر الاتصال بالخادم/);

const filters = read("src/components/filters/ActiveFilters.tsx");
assert.match(filters, /EMPTY\.search/);
assert.doesNotMatch(filters, /لا توجد نتائج مطابقة\. جرّب تعديل التصفية/);

const lessons = read("src/components/home/HomeUpcomingLessons.tsx");
assert.match(lessons, /EMPTY\.data/);
assert.doesNotMatch(lessons, /لا توجد دروس مجدولة اليوم/);

const courses = read("src/components/home/HomeUpcomingCourses.tsx");
assert.match(courses, /EMPTY\.data/);
assert.doesNotMatch(courses, /لا توجد دورات قادمة حالياً/);

const audioPicker = read("src/components/adhan/PrayerAudioPicker.tsx");
assert.match(audioPicker, /EMPTY\.searchShort/);
assert.doesNotMatch(audioPicker, /لا نتائج لهذا البحث\./);

const muezzin = read("src/components/adhan/MuezzinPicker.tsx");
assert.match(muezzin, /EMPTY\.searchShort/);
assert.doesNotMatch(muezzin, /لا نتائج مطابقة للبحث/);

const hadith = read("src/components/hadith/HadithCard.tsx");
assert.doesNotMatch(hadith, /قيد الإكمال/);

const seo = read("src/lib/seo-routes.json");
assert.match(seo, /ضبط أصوات الأذان القصيرة وتنبيهات الصلوات/);
assert.match(seo, /مواقيت الصلاة حسب موقعك مع العد التنازلي/);
assert.match(seo, /قواعد التجويد ودروس مختصرة مع أمثلة صوتية/);
assert.doesNotMatch(seo, /ضبط إعدادات الأذان والتنبيهات لأوقات الصلاة في سُنّة\./);

console.log("content-quality-wave31-gate.test.ts: ok");
