/**
 * بوابة: الرئيسية (مناسبات/مستجدات) + دليل الجهات + أرشيف الدروس — keep-previous.
 * node --import tsx src/lib/__tests__/home-sources-keep-previous-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const occasions = read("src/components/home/HomeIslamicOccasions.tsx");
assert.doesNotMatch(occasions, /setItems\(\[\]\)/, "Occasions: لا تفرّغ عند الخطأ");
assert.match(occasions, /loading\s*&&\s*items\.length\s*===\s*0/, "Occasions: هيكل فقط بلا عناصر");
assert.match(occasions, /aria-busy=\{loading\}/, "Occasions: aria-busy");

const updates = read("src/components/home/HomeLatestUpdates.tsx");
assert.doesNotMatch(updates, /setItems\(\[\]\)/, "Updates: لا تفرّغ عند الخطأ");
assert.match(updates, /aria-busy=\{loading\}/, "Updates: aria-busy");

const sources = read("src/pages/sources/SourcesDirectoryPage.tsx");
assert.doesNotMatch(sources, /setAccounts\(\[\]\)/, "SourcesDirectory: لا تفرّغ الحسابات عند الخطأ");
assert.match(sources, /aria-busy=\{loading\}/, "SourcesDirectory: aria-busy");

const detail = read("src/pages/sources/SourceDetailPage.tsx");
assert.doesNotMatch(detail, /setAccounts\(\[\]\)/, "SourceDetail: لا تفرّغ عند الخطأ");
assert.match(detail, /accounts\.length\s*===\s*0/, "SourceDetail: لا «غير موجودة» أثناء التحميل الأول");

const archive = read("src/pages/lessons/LessonsArchivePage.tsx");
assert.doesNotMatch(archive, /setArchived\(\[\]\)/, "LessonsArchive: لا تفرّغ عند الخطأ");
assert.match(archive, /keepPrevious/, "LessonsArchive: keepPrevious على PageLoadingGuard");

const guard = read("src/components/PageLoadingGuard.tsx");
assert.match(
  guard,
  /error\s*&&\s*!\(keepPrevious\s*&&\s*hasContent\)/,
  "PageLoadingGuard: خطأ كامل فقط بلا محتوى سابق",
);

const lessonsView = read("src/pages/lessons/ui/LessonsView.tsx");
assert.match(lessonsView, /keepPrevious/, "LessonsView: keepPrevious");

const homeUpcoming = read("src/components/home/HomeUpcomingLessons.tsx");
assert.match(homeUpcoming, /keepPrevious/, "HomeUpcomingLessons: keepPrevious");

const qa = read("src/views/QaPage.tsx");
assert.match(qa, /keepPrevious/, "QaPage: keepPrevious");

console.log("home-sources-keep-previous-gate.test.ts: ok");
