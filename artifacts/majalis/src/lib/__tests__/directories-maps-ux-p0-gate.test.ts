/**
 * بوابة: أدلة / خرائط / تسبيح / جامعات / مساعد — منع انحدارات P0.
 * تشغيل: node --import tsx src/lib/__tests__/directories-maps-ux-p0-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

// ── Map ────────────────────────────────────────────────────────────
const map = read("src/components/landmarks/LandmarksMap.tsx");
assert.match(map, /invalidateSize/, "الخريطة تستدعي invalidateSize");
assert.match(map, /ResizeObserver/, "الخريطة تراقب تغيّر الأبعاد");
assert.match(map, /dir=["']ltr["']/, "حاوية الخريطة LTR");
assert.match(map, /data-map-status/, "حالات الخريطة معرّفة");
assert.match(map, /mapRef\.current/, "مرجع خريطة واحد");
assert.match(map, /empty|error/, "حالات فراغ/فشل");

const mapCss = read("src/styles/islamic-landmarks.css");
assert.match(mapCss, /\.ilm-map-canvas/, "أنماط حاوية الخريطة");
assert.match(mapCss, /direction:\s*ltr/i, "بلاط LTR في CSS");
assert.match(mapCss, /bottom-nav-height|inset-bottom/, "inset أسفل الشريط");
assert.doesNotMatch(
  mapCss,
  /\.ilm-map-canvas[^{]*\{[^}]*transform:\s*scaleX\(-1\)/,
  "لا مرآة RTL على لوحة البلاط",
);

// ── Directory media ───────────────────────────────────────────────
const media = read("src/components/directory/DirectoryMedia.tsx");
assert.match(media, /aspectRatio/, "نسبة أبعاد ثابتة");
assert.match(media, /dir-media__img/, "فئة صورة ثابتة");
assert.match(media, /onError|setFailed|failed/, "معالجة فشل التحميل");
assert.match(media, /sr-only/, "Alt لقارئ الشاشة فقط");

const mediaCss = read("src/styles/components/directory-media.css");
assert.match(mediaCss, /\.dir-media\s*\{/, "أنماط dir-media");
assert.match(mediaCss, /object-fit:\s*cover/, "object-fit cover");
assert.match(mediaCss, /writing-mode:\s*horizontal-tb/, "كتابة أفقية");

const landmarksPage = read("src/views/IslamicLandmarksPage.tsx");
assert.match(landmarksPage, /DirectoryMedia/, "الصفحة تستخدم DirectoryMedia");
assert.match(landmarksPage, /FilterBottomSheet/, "فلاتر في ورقة");
// البطاقة المختصرة: لا capacity داخل LandmarkCard (يُسمح في النافذة التفصيلية)
const cardFn = landmarksPage.slice(
  landmarksPage.indexOf("function LandmarkCard"),
  landmarksPage.indexOf("function LandmarkModal"),
);
assert.doesNotMatch(cardFn, /capacity/, "بطاقة القائمة لا تعرض سعة بلا مصدر");
assert.doesNotMatch(landmarksPage, /FloatingBackButton/, "لا زر رجوع عائم في المشاهد");

// ── Tasbeeh ───────────────────────────────────────────────────────
const tasbeeh = read("src/components/reading/TasbeehCounter.tsx");
assert.match(tasbeeh, /isCustomTarget/, "هدف مخصص منفصل");
assert.match(tasbeeh, /tasbeeh-counter__custom-target--row/, "صف هدف مخصص مستقل");
assert.match(tasbeeh, /window\.confirm\([\s\S]*تصفير/, "تصفير يحتاج تأكيدًا");

const tasbihView = read("src/pages/worship/ui/TasbihView.tsx");
assert.match(tasbihView, /tasbeeh-stats-strip/, "ملخص إحصاء مضغوط");
assert.match(tasbihView, /confirm\([\s\S]*حذف/, "حذف الورد يحتاج تأكيدًا");
assert.doesNotMatch(tasbihView, /FloatingBackButton/, "لا زر رجوع عائم في التسبيح");

// ── Universities ──────────────────────────────────────────────────
const univLabels = read("src/lib/universities-service.ts");
assert.ok(!univLabels.includes("معتمدة رسمي"), "لا ادعاء اعتماد رسمي بلا مصدر");
assert.ok(!univLabels.includes("معتمدة رسميا"), "لا ادعاء اعتماد رسمي بلا مصدر");
assert.match(univLabels, /موثّقة في الدليل|موثقة في الدليل/, "تسمية اعتماد آمنة");

const univCard = read("src/components/universities/UniversityCard.tsx");
assert.match(univCard, /univ-card__name/, "اسم الجامعة بفئة محايدة");
assert.doesNotMatch(
  univCard,
  /univ-card__head[\s\S]{0,200}text-white/,
  "لا نص أبيض فوق رأس أخضر",
);

const univPage = read("src/views/UniversitiesPage.tsx");
assert.match(univPage, /up-alert--notice/, "تنبيه قابل للطي");
assert.doesNotMatch(univPage, /FloatingBackButton/, "لا زر رجوع عائم في الجامعات");

const uniCss = read("src/styles/pages/universities.css");
assert.match(uniCss, /bottom-nav-height|inset-bottom/, "inset الجامعات");

// ── Assistant ─────────────────────────────────────────────────────
const assistant = read("src/pages/assistant/AssistantGate.tsx");
assert.match(assistant, /assistant-soon/, "حالة Coming Soon");
assert.match(assistant, /assistant-title/, "محدد بوابة التباين .assistant-title");
assert.match(assistant, /assistant-intro/, "محدد بوابة التباين .assistant-intro");
assert.match(assistant, /\/search/, "CTA بحث");
assert.doesNotMatch(assistant, /return\s+null\s*;/, "لا إرجاع فارغ");
assert.doesNotMatch(assistant, /FloatingBackButton/, "لا زر رجوع عائم في المساعد");

const asstCss = read("src/styles/pages/assistant.css");
assert.match(asstCss, /bottom-nav-height|inset-bottom/, "inset المساعد");

// ── Floating back ─────────────────────────────────────────────────
const fab = read("src/components/FloatingBackButton.tsx");
assert.match(fab, /FLOATING_BACK_DISABLED/, "FAB معطّل");

console.log("directories-maps-ux-p0-gate.test.ts: ok");
