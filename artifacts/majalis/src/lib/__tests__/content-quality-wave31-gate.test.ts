/**
 * Wave 31 — فراغات الفقه/الأقسام/الصلاة/قفز السور + ScreenShell + SEO قصير.
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

const seo = read("src/lib/seo-routes.json");
assert.match(seo, /ضبط أصوات الأذان القصيرة وتنبيهات الصلوات/);
assert.match(seo, /مواقيت الصلاة حسب موقعك مع العد التنازلي/);
assert.match(seo, /قواعد التجويد ودروس مختصرة مع أمثلة صوتية/);
assert.doesNotMatch(seo, /ضبط إعدادات الأذان والتنبيهات لأوقات الصلاة في سُنّة\./);

console.log("content-quality-wave31-gate.test.ts: ok");
