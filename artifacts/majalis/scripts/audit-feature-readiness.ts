/**
 * بوابة جاهزية الميزات — مرحلة 2.
 * التشغيل: pnpm --filter @workspace/majalis run audit:feature-readiness
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { PROPHETS } from "../src/lib/prophets-data.ts";
import {
  getDailyAyah,
  getDailyHadith,
  DAILY_HADITH_POOL,
} from "../src/lib/daily-content.ts";
import { resolveContinueSection } from "../src/lib/continue-reading.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const errors: string[] = [];
function fail(msg: string) {
  errors.push(msg);
}

// 1) DailyWirdCard — حديث بمصدر + آية برقم
assert.ok(existsSync(resolve(root, "src/components/home/DailyWirdCard.tsx")), "DailyWirdCard موجود");
const wird = read("src/components/home/DailyWirdCard.tsx");
assert.match(wird, /تم اليوم/);
assert.match(wird, /localStorage/);
assert.match(wird, /ayahNumber|ayahRef/);
assert.match(wird, /hadith\.source/);
for (const h of DAILY_HADITH_POOL) {
  if (!h.source?.trim()) fail(`حديث بلا مصدر في daily pool: ${h.id}`);
}
const ayah = getDailyAyah();
if (!ayah.surah || !ayah.ayahNumber) fail("آية اليوم بلا سورة/رقم");
const hadith = getDailyHadith();
if (!hadith.source?.trim()) fail("حديث اليوم بلا مصدر");

// 2) search لا يعرض admin
const searchView = read("src/pages/account/ui/SearchView.tsx");
assert.match(searchView, /isBlockedOrAdminHref/);
assert.match(searchView, /قيد المراجعة|pending_review/);
assert.match(searchView, /قيد الإكمال|partial/);
assert.match(searchView, /highlightText/);

// 3) qa لا يدعي التوثيق بلا مصدر
const dailyQuiz = read("src/components/quiz-game/DailyChallengeQuiz.tsx");
assert.match(dailyQuiz, /قيد إضافة المصدر/);
assert.doesNotMatch(dailyQuiz, /موثق بالأدلة/);

// 4) adhkar غير المراجعة لها badge
const adhkar = read("src/pages/worship/ui/AdhkarView.tsx");
assert.match(adhkar, /needsReview/);
assert.match(adhkar, /IsnadAttributionBar|قيد المراجعة/);

// 5) lessons لا تعرض وقتًا فارغًا
const lessonCard = read("src/components/lessons/UnifiedLessonCard.tsx");
assert.match(lessonCard, /الوقت قيد التأكيد/);
assert.match(lessonCard, /أضف للتقويم|downloadUnifiedCalendar/);

// 6) prophets = 25 + redirects
assert.equal(PROPHETS.length, 25, `عدد الأنبياء ${PROPHETS.length} ≠ 25`);
const app = read("src/App.tsx");
assert.match(app, /\/prophets\/zakariya/);
assert.match(app, /\/prophets\/zakaria/);
assert.match(app, /zakariyya/);
const prophetsPage = read("src/views/ProphetStoriesPage.tsx");
assert.match(prophetsPage, /ما ثبت في القرآن/);
assert.match(prophetsPage, /ما لا يصح الجزم به/);

// 7) quran selection لا يغيّر route عند الآية — onSelectVerse محلي
const mushafVp = read("src/features/mushaf-madinah/MushafViewport.tsx");
assert.match(mushafVp, /onSelectVerse|setSelected/);
const ayahBar = read("src/features/mushaf-madinah/MushafAyahActions.tsx");
assert.match(ayahBar, /نسخ|مشاركة|تفسير|تشغيل|حفظ|bookmark|Bookmark/i);

// 8) mobile nav hide/show
const autoHide = read("src/hooks/useAutoHideBottomNav.ts");
assert.match(autoHide, /translateY|isHidden|DELTA_PX/);
const chromeCss = read("src/styles/components/app-chrome-scroll.css");
assert.match(chromeCss, /bottom-nav--hidden/);
assert.doesNotMatch(chromeCss.replace(/\/\*[\s\S]*?\*\//g, ""), /display\s*:\s*none/);

// 9) continue-reading skips admin
assert.equal(resolveContinueSection("/admin/dashboard"), null);
assert.equal(resolveContinueSection("/search?q=x"), null);
assert.equal(resolveContinueSection("/lessons/abc"), "lessons");
assert.equal(resolveContinueSection("/prophets/nuh"), "prophets");

if (errors.length) {
  console.error("audit:feature-readiness FAILED");
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}

console.log("audit:feature-readiness: OK");
console.log(`  prophets=${PROPHETS.length} · ayah=${ayah.surah}:${ayah.ayahNumber} · hadithSource=${hadith.source}`);
