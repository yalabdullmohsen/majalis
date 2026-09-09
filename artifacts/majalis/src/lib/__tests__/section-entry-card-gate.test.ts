/**
 * بوابة بطاقات الدخول الموحّدة SectionEntryCard.
 * تشغيل: node --import tsx src/lib/__tests__/section-entry-card-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const card = read("src/components/ui/HubCard.tsx");
const css = read("src/styles/components/hub-card.css");
const hadith = read("src/pages/hadith/ui/HadithView.tsx");
const merged = read("src/views/MergedSectionHubPage.tsx");
const ds = read("src/components/design-system/index.ts");

console.log("=== المكوّن ===");
assert.match(card, /export const SectionEntryCard/, "SectionEntryCard مُصدَّر");
assert.match(card, /export const HubCard = SectionEntryCard/, "HubCard توافق خلفي");
assert.match(card, /variant\?: SectionEntryVariant/, "variants");
assert.match(card, /"primary"\s*\|\s*"soft"\s*\|\s*"compact"/);
assert.match(card, /prefetchRoute/, "تسخين المسار عند اللمس");
assert.match(card, /data-section-entry/, "سمة بطاقة دخول");
assert.match(card, /aria-hidden="true"/, "السهم زخرفي غير تفاعلي منفصلًا");
assert.match(css, /\.hub-card__go[\s\S]*?pointer-events:\s*none/, "السهم بلا أحداث مؤشر");

console.log("=== الشكل ===");
assert.match(css, /border-radius:\s*var\(--radius-card,\s*24px\)/, "حواف ناعمة 24px");
assert.match(css, /\.hub-card__top/, "رأس أيقونة");
assert.match(css, /\.hub-card__foot/, "تذييل مع سهم مدمج");
assert.doesNotMatch(css, /\.hub-card__go\s*\{[^}]*position:\s*absolute/, "السهم ليس منفصلًا مطلقًا");
assert.match(css, /-webkit-line-clamp:\s*2/, "وصف بحد سطرين");
assert.match(css, /\.hub-card-grid\s*>\s*:last-child:nth-child\(odd\)/, "بطاقة يتيمة في الوسط");
assert.match(css, /padding-bottom:\s*calc\(var\(--nav-h/, "خلوص الشريط السفلي");
assert.match(css, /html\[data-theme="dark"\]\s*\.hub-card/, "وضع ليلي");

console.log("=== التطبيق ===");
assert.match(hadith, /SectionEntryCard/, "الحديث");
assert.match(hadith, /BookOpenCheck|Library|ScrollText/, "أيقونات الحديث");
assert.match(merged, /SectionEntryCard/, "الهوبات المدمجة");
assert.match(ds, /SectionEntryCard/, "نظام التصميم يصدّر البطاقة");

console.log("section-entry-card-gate.test.ts: ok");
