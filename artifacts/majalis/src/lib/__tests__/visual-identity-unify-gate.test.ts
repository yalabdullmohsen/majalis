/**
 * بوابة: توحيد الهوية البصرية عبر التطبيق (نصف قطر + بطاقات أقسام).
 * تشغيل: node --import tsx src/lib/__tests__/visual-identity-unify-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const calm = read("src/styles/sections-calm-polish.css");
const unify = read("src/styles/visual-identity-unify.css");
const soft = read("src/styles/soft-cards.css");
const ds = read("src/styles/design-system.css");
const miracles = read("src/styles/pages/miracles.css");
const rsc = read("src/styles/components/reading-section-card.css");
const filters = read("src/styles/components/filters.css");

console.log("=== نصف قطر البطاقة موحّد 24px ===");
assert.match(soft, /--radius-card:\s*24px/);
assert.match(unify, /--radius-card:\s*24px/);
assert.match(calm, /--radius-card:\s*24px/, "calm-polish يجب ألا يخفض إلى 18px");
assert.doesNotMatch(calm, /--radius-card:\s*18px/, "لا تعارض 18px في calm-polish");
assert.match(calm, /--radius-tile:\s*24px/);
assert.match(calm, /--radius-button:\s*18px/);

console.log("=== بطاقات الأقسام ضمن طبقة التوحيد ===");
for (const cls of [
  "hadith-card",
  "isp-card",
  "sect-card",
  "akl-card",
  "tarikh-card",
  "mk-card",
  "mk-lane-card",
  "fiqh-book-card",
  "ve-book-card",
  "ve-chapter-card",
  "nation-card",
  "prophet-lux-card",
  "seerah-panel",
  "tf-card",
  "tf-path-card",
  "tf-spotlight-card",
  "tf-edition-card",
  "dii-hub-card",
  "dii-list-card",
  "dii-block",
  "hs-card",
  "hb-hadith-row",
  "quran-hub-card",
  "twh-hub-card",
  "gl-term",
  "uq-fact-item",
  "tawheed-type-card",
]) {
  assert.match(calm, new RegExp(`\\.${cls}`), `calm يشمل .${cls}`);
  assert.match(unify, new RegExp(`\\.${cls}`), `unify يشمل .${cls}`);
}
assert.match(calm, /\.notif-card/);
assert.match(calm, /\.an-card/);
assert.match(calm, /\.hlr__card/);
assert.match(unify, /\.notif-card/);
assert.match(unify, /\.an-card/);
assert.match(unify, /\.hlr__card/);
assert.match(calm, /--section-stack-gap/);
assert.match(calm, /\.scroll-to-top[\s\S]*?border-radius:\s*var\(--radius-pill/);
assert.match(calm, /\.ss-action-btn--sm/);

const notif = read("src/styles/pages/notifications.css");
assert.doesNotMatch(notif, /border-radius:\s*18px\s*!important/);
assert.match(notif, /border-radius:\s*var\(--radius-card/);

const nawawiList = read("src/styles/pages/arbaeen-nawawi.css");
assert.match(nawawiList, /\.an-card[\s\S]*?border-radius:\s*var\(--radius-card/);

const ux = read("src/styles/ssunnah-ux-polish.css");
assert.match(ux, /\.floating-back-btn[\s\S]*?z-index:\s*var\(--z-fab/);
assert.match(ux, /\.ss-action-btn--sm[\s\S]*?min-height:\s*44px/);
assert.match(calm, /\.hadith-detail-card/);
assert.match(calm, /\.rsc\b/);
assert.match(calm, /\.ahd-section/);
assert.match(unify, /\.hadith-detail-card/);
assert.match(unify, /\.rsc\b/);

const mustalah = read("src/styles/pages/hadith-mustalah.css");
const books = read("src/styles/pages/hadith-books.css");
const arbaeen = read("src/styles/pages/arbaeen-detail.css");
const card = read("src/components/hadith/HadithCard.tsx");
assert.match(mustalah, /\.hs-card[\s\S]*?border-radius:\s*var\(--radius-card/);
assert.match(books, /\.hb-hadith-row[\s\S]*?border-radius:\s*var\(--radius-card/);
assert.match(arbaeen, /\.ahd-section[\s\S]*?border-radius:\s*var\(--radius-card/);
assert.match(card, /resolveHadithDetailHref/);
assert.match(calm, /touch-action:\s*manipulation/);
assert.match(calm, /min-height:\s*44px/);
assert.match(calm, /z-index:\s*var\(--z-fab/);
assert.doesNotMatch(
  unify,
  /\.filter-chips__chip[\s\S]{0,120}min-height:\s*36px\s*!important/,
  "شيبس الفلاتر لا تقل عن 44px",
);
assert.match(
  unify,
  /\.filter-chips__chip[\s\S]{0,120}min-height:\s*44px\s*!important/,
);

console.log("=== ds-radius مربوطة بالهوية ===");
assert.match(ds, /--ds-radius-lg:\s*var\(--radius-button/);
assert.match(ds, /--ds-radius-xl:\s*var\(--radius-card/);
assert.match(ds, /--card-radius:\s*var\(--radius-card/);

console.log("=== إعجاز + بطاقات قراءة + فلاتر ===");
assert.match(miracles, /--mk-radius:\s*var\(--radius-card/);
assert.doesNotMatch(miracles, /--mk-radius:\s*18px/);
assert.match(rsc, /border-radius:\s*var\(--radius-card/);
assert.match(filters, /\.ds-filter-toggle[\s\S]*?border-radius:\s*var\(--radius-pill/);

console.log("=== صفحات داخلية: نصف القطر من الهوية ===");
const fiqhHub = read("src/styles/pages/fiqh-hub.css");
const nations = read("src/styles/nations.css");
const prophets = read("src/styles/pages/prophet-stories.css");
const seerah = read("src/styles/pages/seerah.css");
const tafsir = read("src/styles/pages/tafsir.css");
const hubCard = read("src/styles/components/hub-card.css");
assert.match(fiqhHub, /\.fiqh-book-card[\s\S]*?border-radius:\s*var\(--radius-card/);
assert.match(nations, /\.nation-card[\s\S]*?border-radius:\s*var\(--radius-card/);
assert.match(prophets, /\.prophet-lux-card[\s\S]*?border-radius:\s*var\(--radius-card/);
assert.match(seerah, /\.seerah-panel[\s\S]*?border-radius:\s*var\(--radius-card/);
assert.match(tafsir, /\.tf-card[\s\S]*?border-radius:\s*var\(--radius-card/);
assert.match(tafsir, /\.tf-edition-card[\s\S]*?border-radius:\s*var\(--radius-card/);
assert.doesNotMatch(hubCard, /border-radius:\s*22px/);
assert.match(hubCard, /\.quran-hub-card[\s\S]*?border-radius:\s*var\(--radius-card/);

const fiqhView = read("src/pages/fiqh/ui/FiqhView.tsx");
assert.match(fiqhView, /SectionEntryCard/);
assert.match(fiqhView, /hub-card-grid fiqh-book-grid/);


const mainSrc = read("src/main.tsx");
assert.match(mainSrc, /void import\("\.\/styles\/final-release\.css"\)/, "final-release مؤجّل");
assert.match(mainSrc, /void import\("\.\/styles\/visual-identity-unify\.css"\)/, "إعادة هوية بعد final-release");
assert.doesNotMatch(
  mainSrc,
  /final-release\.css"[\s\S]{0,400}section-cards-theme\.css/,
  "لا إعادة تحميل ثيم البطاقات بعد final-release (وميض هوية)",
);
assert.doesNotMatch(
  mainSrc,
  /final-release\.css"[\s\S]{0,400}sections-calm-polish\.css/,
  "لا إعادة تحميل تهدئة الأقسام بعد final-release",
);

console.log("visual-identity-unify-gate.test.ts: ok");

console.log("=== بطاقات الدليل ===");
assert.match(unify, /\.ilm-card/);
assert.match(unify, /\.inst-card/);
