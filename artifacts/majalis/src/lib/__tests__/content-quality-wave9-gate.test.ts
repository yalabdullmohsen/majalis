/**
 * Content quality Wave 9 — aqeedah / hadith / usul / sects.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

console.log("=== hadith by-id H1 is not raw corpus id ===");
{
  const src = read("src/pages/hadith/ui/HadithByIdView.tsx");
  assert.doesNotMatch(src, /title: `\$\{hadith\.id\}/);
  assert.match(src, /hadith-by-id__title/);
  assert.match(src, /مرجع النسخ/);
}

console.log("=== hadith modal hides opaque book index ===");
{
  const src = read("src/pages/hadith/ui/HadithView.tsx");
  assert.doesNotMatch(src, /<strong>رقم الكتاب<\/strong>/);
}

console.log("=== tawhid path not general lessons ===");
{
  const src = read("src/views/TawhidPage.tsx");
  assert.match(src, /مسار تعلّم العقيدة/);
  assert.match(src, /href: "\/tawhid\/ahl-sunnah"/);
  assert.doesNotMatch(src, /id: "aqeedah-path"[\s\S]*?href: "\/lessons"/);
}

console.log("=== usul qawaid link ===");
{
  const src = read("src/lib/fiqh/fiqh-usul-topics.ts");
  assert.match(src, /href: "\/fiqh-qawaid"/);
}

console.log("=== sects: arabic review + structure + empty + related ===");
{
  const list = read("src/views/IslamicSectsPage.tsx");
  const detail = read("src/views/IslamicSectsDetailPage.tsx");
  assert.doesNotMatch(list, /وُسمت needs_specialist_review/);
  assert.doesNotMatch(list, /حالة المحتوى: needs_specialist_review/);
  assert.match(detail, /EMPTY\.recordNotPublic|غير متاح للعامة/);
  assert.doesNotMatch(detail, /حتى حالة PUBLISHED|حالة العقد|<code>PUBLISHED<\/code>/);
  assert.match(list, /EMPTY\.sectionPreparing|hasPublished/);
  assert.match(detail, /التعريف/);
  assert.match(detail, /النشأة/);
  assert.match(list, /EMPTY\.searchShort/);
  assert.match(detail, /href="\/tawhid\/ahl-sunnah"/);
  assert.doesNotMatch(list + detail, /85-90%/);
  assert.match(list, /KnowledgeSummaryCard/);
  assert.doesNotMatch(list, /aria-expanded/);
  assert.doesNotMatch(list, /sect-card__detail/);
  assert.doesNotMatch(detail, /الغالبية العظمى من المسلمين في العالم/);
  assert.doesNotMatch(detail, /الخوارج \(أهل الوعيد\)/);
}

console.log("=== sects dark pills ===");
{
  const css =
    read("src/styles/pages/islamic-sects.css") +
    read("src/styles/components/knowledge-summary-card.css");
  assert.match(css, /html\.dark \.(?:sect-card|kx-summary-card)__pill/);
}

console.log("content-quality-wave9-gate: ok");
