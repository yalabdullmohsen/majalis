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
  const src = read("src/views/IslamicSectsPage.tsx");
  assert.doesNotMatch(src, /وُسمت needs_specialist_review/);
  assert.doesNotMatch(src, /حالة المحتوى: needs_specialist_review/);
  assert.match(src, /يحتاج تحققًا من مختص/);
  assert.match(src, /التعريف/);
  assert.match(src, /النشأة/);
  assert.match(src, /EMPTY\.searchShort/);
  assert.match(src, /href="\/tawhid\/ahl-sunnah"/);
  assert.doesNotMatch(src, /85-90%/);
}

console.log("=== sects dark pills ===");
{
  const css = read("src/styles/pages/islamic-sects.css");
  assert.match(css, /html\.dark \.sect-card__pill/);
}

console.log("content-quality-wave9-gate: ok");
