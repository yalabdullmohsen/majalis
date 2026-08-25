/**
 * بوابة صفحة التواصل: بنية نظيفة + FAQ بإجابات + بريد رسمي.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const contact = readFileSync(resolve(root, "src/views/ContactPage.tsx"), "utf8");
const css = readFileSync(resolve(root, "src/styles/pages/contact.css"), "utf8");
const globalBack = readFileSync(resolve(root, "src/components/GlobalBackButton.tsx"), "utf8");

assert.match(contact, /styles\/pages\/contact\.css/, "استيراد أنماط التواصل مباشرة");
assert.match(contact, /CONTACT_EMAIL/);
assert.match(contact, /mailtoWithSubject/);
assert.match(contact, /إرسال بريد/);
assert.match(contact, /يسعدنا استقبال ملاحظاتك واقتراحاتك وتصحيحاتك/);
assert.match(contact, /كيف نساعدك؟/);
assert.match(contact, /يمكنك مراسلتنا مباشرة عبر البريد الرسمي/);
assert.match(contact, /Accordion/);
assert.doesNotMatch(contact, /InstagramAcademyLink/, "لا بقايا إنستغرام أكاديمية في صفحة التواصل");
assert.doesNotMatch(contact, /ShareButtons/, "لا أزرار مشاركة زائدة");
assert.doesNotMatch(contact, /LegalBackLink/, "لا زر رجوع مكرر أسفل الصفحة");

for (const q of [
  "كيف أبلغ عن خطأ في حديث أو فتوى؟",
  "هل يمكنني اقتراح شيخ أو عالم؟",
  "كيف أطلب حذف بيانات حسابي؟",
  "هل يمكنني المساهمة في المحتوى؟",
  "هل تقبلون شراكات أو إعلانات؟",
]) {
  assert.match(contact, new RegExp(q.replace(/[؟?]/g, "\\$&")), `سؤال FAQ: ${q}`);
}

assert.match(css, /\.contact-email-card/, "بطاقة البريد في CSS");
assert.match(css, /@media \(max-width: 390px\)/, "ضبط عرض الجوال 390");
assert.match(globalBack, /path === "\/support"/, "إخفاء الرجوع العائم على /support");
assert.match(globalBack, /path === "\/contact"/, "إخفاء الرجوع العائم على /contact");

console.log("contact-page-rebuild-gate.test.ts: ok");
