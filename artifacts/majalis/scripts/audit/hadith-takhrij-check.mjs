#!/usr/bin/env node
/**
 * تدقيق تخريج الأحاديث عبر كل ملفات seed المحتوية نصوصاً منسوبة للنبي ﷺ.
 *
 * القاعدة (راجع تعليمات المشروع): كل حديث منسوب صراحة للنبي ﷺ يجب أن يحمل
 * مصدرًا (source/reference/evidence) يذكر كتاباً معروفاً (البخاري، مسلم،
 * الترمذي...) على الأقل. بلا ذلك: "بحاجة لتحقق" ولا يُعرض بصيغة جزم.
 *
 * يفحص: qa-seed.ts (SEED_QA)، fawaid-seed.ts (SEED_FAWAID)،
 * adhkar-seed.ts (ADHKAR_ITEMS)، arbaeen-nawawi-seed.ts (ARBAEEN_NAWAWI)،
 * quiz-seed.ts (DEMO_QUIZ_QUESTIONS) — يعلّم فقط الأسئلة التي تقتبس نصاً
 * حرفياً بصيغة "قال ﷺ" أو «...» منسوبة للنبي دون أي حقل مصدر (quiz-seed لا
 * يملك حقل مصدر أصلاً، فهذا الفحص يكتشف حالات الاقتباس الحرفي فيه تحديداً).
 *
 * التشغيل: node scripts/audit/hadith-takhrij-check.mjs [--json]
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

// ملاحظة: بلا بادئة "ال" التعريف — لأن "لل + البيهقي" تُكتب "للبيهقي" (تسقط
// الألف خطياً)، فمطابقة "البيهقي" حرفياً تفوّت "للبيهقي"/"وبيهقي" وغيرها.
// و"أب[وي] داود" لأن "سنن أبي داود" تُصرَّف بالجر (أبي لا أبو).
const KNOWN_COLLECTIONS =
  /بخاري|مسلم|ترمذي|أب[وي] داود|نسائي|ابن ماجه|أحمد|مالك|الموطأ|دارمي|ابن حبان|ابن خزيمة|حاكم|بيهقي|طبراني|دارقطني|أبو يعلى|بزار|عبد الرزاق|ابن أبي شيبة|ألباني|أرناؤوط|صحيح الجامع|السلسلة الصحيحة|متفق عليه|قرآن|سورة\s|حصن المسلم|ابن السني|بغوي|ابن رجب|الأدعية المأثورة|أثر صحيح/;
// مصادر شرعية معتبرة غير حديثية (كتب أصول/مصطلح/فقه لعلماء معروفين) — تكفي
// مرجعاً لفوائد "فوائد حديثية/فقهية" التي لا تقتبس نص النبي ﷺ حرفياً، إذ لا
// تخريج حديث مطلوب أصلاً هنا (القول لعالم معروف لا للنبي ﷺ).
const KNOWN_SCHOLARLY_WORKS =
  /الشافعي|الذهبي|ابن حجر|ابن الصلاح|السيوطي|ابن عبد البر|ابن قدامة|الزحيلي|القرضاوي|ابن تيمية|ابن القيم|النووي|الغزالي|الرسالة|الموقظة|نخبة الفكر|الأشباه والنظائر|مقدمة/;

// نمط اقتباس حرفي منسوب للنبي ﷺ: "ﷺ" ملاصقة لعلامة اقتباس أو فعل قول
const PROPHETIC_QUOTE_RE = /(قال\s*(?:رسول\s*الله\s*)?ﷺ|ﷺ\s*[:«]|«[^»]*»[^.]{0,20}ﷺ)/;

function fmt(list, label) {
  console.log(`\n${label}: ${list.length}`);
  for (const item of list.slice(0, 40)) console.log(`  [${item.id}] ${item.reason} :: ${item.excerpt}`);
  if (list.length > 40) console.log(`  ... و${list.length - 40} أخرى`);
}

async function main() {
  const jsonOut = process.argv.includes("--json");
  const findings = { qa: [], fawaid: [], adhkar: [], arbaeen: [], quiz: [] };

  // ── qa-seed.ts ──────────────────────────────────────────────────────────
  const { SEED_QA } = await import(path.join(ROOT, "src/lib/qa-seed.ts"));
  for (const q of SEED_QA) {
    const hasQuote = PROPHETIC_QUOTE_RE.test(q.answer || "") || PROPHETIC_QUOTE_RE.test(q.evidence || "");
    const src = [q.evidence, q.reference].filter(Boolean).join(" | ");
    if (hasQuote && !KNOWN_COLLECTIONS.test(src)) {
      findings.qa.push({ id: q.id, reason: "اقتباس نبوي بلا مصدر معروف", excerpt: (q.answer || "").slice(0, 70) });
    }
  }

  // ── fawaid-seed.ts ──────────────────────────────────────────────────────
  // فقط ما يقتبس نص النبي ﷺ حرفياً يحتاج تخريج حديث (مصدر ضمن KNOWN_COLLECTIONS)؛
  // فوائد "حديثية" بمعنى موضوعها علوم الحديث (لا اقتباس نبوي حرفي) يكفيها
  // مرجع علمي معتبر (KNOWN_SCHOLARLY_WORKS) لأن القول لعالم لا للنبي ﷺ.
  const { SEED_FAWAID } = await import(path.join(ROOT, "src/lib/fawaid-seed.ts"));
  for (const f of SEED_FAWAID) {
    const text = f.text || "";
    const hasPropheticQuote = PROPHETIC_QUOTE_RE.test(text);
    if (hasPropheticQuote) {
      if (!f.source || !KNOWN_COLLECTIONS.test(f.source)) {
        findings.fawaid.push({ id: f.id, reason: !f.source ? "اقتباس نبوي بلا حقل مصدر" : "اقتباس نبوي بمصدر غير معروف", excerpt: text.slice(0, 70) });
      }
    } else if (f.category === "فوائد حديثية") {
      if (!f.source || !(KNOWN_COLLECTIONS.test(f.source) || KNOWN_SCHOLARLY_WORKS.test(f.source))) {
        findings.fawaid.push({ id: f.id, reason: "فائدة عن علوم الحديث بلا مرجع علمي معروف", excerpt: text.slice(0, 70) });
      }
    }
  }

  // ── adhkar-seed.ts ──────────────────────────────────────────────────────
  const { ADHKAR_ITEMS } = await import(path.join(ROOT, "src/lib/adhkar-seed.ts"));
  for (const a of ADHKAR_ITEMS) {
    const combinedSrc = [a.source, a.reference].filter(Boolean).join(" | ");
    if (!combinedSrc || !(KNOWN_COLLECTIONS.test(combinedSrc) || KNOWN_SCHOLARLY_WORKS.test(combinedSrc))) {
      findings.adhkar.push({ id: a.id, reason: !combinedSrc ? "لا حقل مصدر" : "مصدر غير معروف", excerpt: (a.text || "").slice(0, 60) });
    }
  }

  // ── arbaeen-nawawi-seed.ts ──────────────────────────────────────────────
  const { ARBAEEN_NAWAWI } = await import(path.join(ROOT, "src/lib/arbaeen-nawawi-seed.ts"));
  for (const h of ARBAEEN_NAWAWI) {
    if (!h.source || !KNOWN_COLLECTIONS.test(h.source)) {
      findings.arbaeen.push({ id: h.id, reason: !h.source ? "لا حقل مصدر" : "مصدر غير معروف", excerpt: h.title || "" });
    }
  }
  console.log(`(معلومة) عدد أحاديث الأربعين النووية المُحمَّلة: ${ARBAEEN_NAWAWI.length} (المعروف تاريخياً 42-43 حديثاً حسب الطبعة)`);
  const ids = ARBAEEN_NAWAWI.map((h) => h.id).sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i <= Math.max(...ids); i++) if (!ids.includes(i)) gaps.push(i);
  if (gaps.length) console.log(`  ⚠ أرقام مفقودة في التسلسل: ${gaps.join(", ")}`);
  const dupIds = ids.filter((v, i) => ids.indexOf(v) !== i);
  if (dupIds.length) console.log(`  ⚠ أرقام مكررة: ${[...new Set(dupIds)].join(", ")}`);

  // ── quiz-seed.ts ────────────────────────────────────────────────────────
  const { DEMO_QUIZ_QUESTIONS } = await import(path.join(ROOT, "src/lib/quiz-seed.ts"));
  for (const q of DEMO_QUIZ_QUESTIONS) {
    const combined = `${q.question || ""} ${q.answer || ""}`;
    if (PROPHETIC_QUOTE_RE.test(combined) && !KNOWN_COLLECTIONS.test(combined)) {
      findings.quiz.push({ id: q.id, reason: "اقتباس نبوي حرفي بلا أي مصدر (لا حقل مصدر في quiz-seed أصلاً)", excerpt: `${q.question} → ${q.answer}`.slice(0, 90) });
    }
  }

  if (jsonOut) {
    console.log(JSON.stringify(findings, null, 2));
    return;
  }

  fmt(findings.qa, "qa-seed.ts — اقتباسات نبوية بلا مصدر معروف");
  fmt(findings.fawaid, "fawaid-seed.ts — فوائد حديثية بلا مصدر معروف");
  fmt(findings.adhkar, "adhkar-seed.ts — أذكار بلا مصدر معروف");
  fmt(findings.arbaeen, "arbaeen-nawawi-seed.ts — أحاديث بلا مصدر معروف");
  fmt(findings.quiz, "quiz-seed.ts — اقتباسات نبوية حرفية (لا حقل مصدر أصلاً)");

  const total = Object.values(findings).reduce((s, v) => s + v.length, 0);
  console.log(`\n═══ الإجمالي: ${total} حالة بحاجة لمراجعة ═══`);
  process.exitCode = total > 0 ? 1 : 0;
}

main();
