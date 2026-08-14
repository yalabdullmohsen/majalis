#!/usr/bin/env node
/**
 * يحدّث المانيفست + CONTENT_REVIEW_QUEUE + تقرير التدقيق الحي من جرد المعرفة.
 * لا يعدّل نصوصًا علمية — metadata/تقارير فقط.
 */
import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  KNOWLEDGE,
  loadKnowledgeItems,
  wordCount,
  sectionOf,
  ok,
} from "./lib.mjs";

const TODAY = new Date().toISOString().slice(0, 10);
const DOCS = path.join(ROOT, "docs");
const QUIZ_DIR = path.join(ROOT, "public/data/quiz");

function repeatedLineFindings(items) {
  const out = [];
  for (const it of items) {
    if (it.review_status !== "verified") continue;
    if (sectionOf(it) === "quiz") continue;
    const lines = String(it.body || "")
      .split(/\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 24);
    const freq = new Map();
    for (const l of lines) freq.set(l, (freq.get(l) || 0) + 1);
    let max = 0;
    let sample = "";
    for (const [l, c] of freq) {
      if (c > max) {
        max = c;
        sample = l;
      }
    }
    if (max >= 8) out.push({ id: it.id, section: sectionOf(it), repeats: max, sample: sample.slice(0, 72) });
  }
  return out.sort((a, b) => b.repeats - a.repeats);
}

function israiliyatMentionsWithoutField(items) {
  const hint = /إسرائيلي(?:ات)?|أهل الكتاب/i;
  const disclaimer = /يُطرح|لا يُجزم|مسكوت|يُؤخَّر|لا يعتمد|تحذير|يُميَّز|ممنوع الجزم/;
  const out = [];
  for (const it of items) {
    const sec = sectionOf(it);
    if (!["prophets", "nations", "quran-people", "history"].includes(sec)) continue;
    if (it.israiliyat === "مسكوت_عنه") continue;
    const body = String(it.body || "");
    if (!hint.test(body)) continue;
    // ذكر منهجي مع ضابط = سليم؛ غياب أي ضابط قريب = إشارة للمراجعة
    if (disclaimer.test(body)) continue;
    out.push(it.id);
  }
  return out;
}

function shortVerified(items, sec, min) {
  return items
    .filter((i) => sectionOf(i) === sec && i.review_status === "verified" && wordCount(i.body) < min)
    .map((i) => ({ id: i.id, words: wordCount(i.body) }))
    .sort((a, b) => a.words - b.words);
}

function legacyQuizStats() {
  if (!fs.existsSync(QUIZ_DIR)) return null;
  let total = 0;
  let demo = 0;
  let noExp = 0;
  let files = 0;
  for (const name of fs.readdirSync(QUIZ_DIR)) {
    if (!name.endsWith(".json") || name === "manifest.json") continue;
    files++;
    const raw = JSON.parse(fs.readFileSync(path.join(QUIZ_DIR, name), "utf8"));
    const qs = Array.isArray(raw) ? raw : raw.questions || [];
    for (const q of qs) {
      total++;
      const id = String(q.id || "");
      if (id.includes("demo") || q.demo === true) demo++;
      if (!q.explanation || String(q.explanation).trim().length < 20) noExp++;
    }
  }
  return { files, total, demo, noExp };
}

const items = loadKnowledgeItems();
const bySec = Object.create(null);
for (const it of items) {
  const sec = sectionOf(it);
  if (!bySec[sec]) bySec[sec] = { all: 0, verified: 0, needs_review: 0, ids: [] };
  bySec[sec].all++;
  if (it.review_status === "verified") bySec[sec].verified++;
  else {
    bySec[sec].needs_review++;
    bySec[sec].ids.push(it.id);
  }
}

const liveV = items.filter((i) => i.review_status === "verified").length;
const liveN = items.filter((i) => i.review_status === "needs_review").length;
const repeats = repeatedLineFindings(items);
const shortPeople = shortVerified(items, "quran-people", 400);
const israSoft = israiliyatMentionsWithoutField(items);
const legacy = legacyQuizStats();

const manifestPath = path.join(KNOWLEDGE, "manifest.json");
const man = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  : { version: 2, sections: [] };
man.updated_at = TODAY;
man.round = "audit-expand";
man.totals = {
  all: items.length,
  verified: liveV,
  needs_review: liveN,
  quiz: bySec.quiz?.all || 0,
  prophets: bySec.prophets?.all || 0,
  nations: bySec.nations?.all || 0,
  people: bySec["quran-people"]?.all || 0,
  tafsir: bySec.tafsir?.all || 0,
  discover: bySec["discover-islam"]?.all || 0,
  history: bySec.history?.all || 0,
  "intro-islam": bySec["intro-islam"]?.all || 0,
};
man.audit = {
  generated_at: TODAY,
  gates: [
    "schema",
    "ayah",
    "hadith",
    "dupes",
    "links",
    "quality",
    "lang",
    "audit",
  ],
  soft_findings: {
    repeated_blocks: repeats.length,
    quran_people_under_400: shortPeople.length,
    israiliyat_mention_no_field_no_disclaimer: israSoft.length,
    legacy_quiz_demo: legacy?.demo ?? null,
  },
};
fs.writeFileSync(manifestPath, JSON.stringify(man, null, 2) + "\n");

const secRows = Object.keys(bySec)
  .sort()
  .map((sec) => {
    const b = bySec[sec];
    return `| ${sec} | ${b.all} | ${b.verified} | ${b.needs_review} |`;
  })
  .join("\n");

const queueRows = Object.keys(bySec)
  .filter((s) => bySec[s].needs_review > 0)
  .sort((a, b) => bySec[b].needs_review - bySec[a].needs_review)
  .map((sec) => {
    const b = bySec[sec];
    const reason =
      sec === "tafsir"
        ? "مقدمات/معاني بانتظار نسبة صريحة للميسّر أو السعدي آيةً آية"
        : sec === "history"
          ? "مقالات إطار تحتاج مصادر فقرة-فقرة"
          : sec === "discover-islam"
            ? "تنويع الأجوبة وتدقيق الشبهات المعاصرة / ترجمات"
            : sec === "quran-people"
              ? "تسمية تفسيرية غير مصرّح بها في النص"
              : "مراجعة بشرية مطلوبة قبل العرض القطعي";
    return `| ${sec} | ${b.needs_review} | ${reason} |`;
  })
  .join("\n");

const sampleIds = Object.keys(bySec)
  .filter((s) => bySec[s].needs_review > 0)
  .sort((a, b) => bySec[b].needs_review - bySec[a].needs_review)
  .map((sec) => {
    const ids = bySec[sec].ids.slice(0, 12);
    return `### ${sec} (${bySec[sec].needs_review})\n\n${ids.map((id) => `- \`${id}\``).join("\n")}${
      bySec[sec].needs_review > 12 ? `\n- … و${bySec[sec].needs_review - 12} أخرى` : ""
    }`;
  })
  .join("\n\n");

const queueMd = `# طابور مراجعة المحتوى — CONTENT_REVIEW_QUEUE

آخر تحديث: ${TODAY} (مولَّد آليًا عبر \`generate-content-audit-report.mjs\`)

القاعدة: كل عنصر \`review_status: needs_review\` في \`public/data/knowledge/**\` يُدرج هنا ولا يُعرض في الواجهة كحقيقة قطعية.

## جرد حي

| القسم | الكل | verified | needs_review |
|---|---:|---:|---:|
${secRows}
| **المجموع** | **${items.length}** | **${liveV}** | **${liveN}** |

## دفعات needs_review

| القسم | العدد | سبب الوسم |
|---|---:|---|
${queueRows}

## عيّنة معرّفات للمراجعة البشرية

${sampleIds}

## بنوك قديمة خارج knowledge

| المسار | حالة المسح ${TODAY} | إجراء |
|---|---|---|
| \`public/data/quiz/**\` | ${legacy ? `${legacy.files} ملفًا · ${legacy.total} سؤالًا · demo≈${legacy.demo} · بلا شرح كافٍ≈${legacy.noExp}` : "غير متاح"} | تنقية تدريجية أو إخفاء من الفهرس الموحّد |
| \`src/lib/nations/data/*\` | حشو نقاط تاريخي | استبدال العرض بـ knowledge/nations |
| \`public/data/stories/*\` | خارج بوابات knowledge | إصلاح اقتباسات الآيات أو حذفها |

## إشارات تدقيق ناعمة (لا تفشل البوابة وحدها)

- كتل مكررة ≥8 مرات في جسم verified: **${repeats.length}** عنصرًا${repeats.length ? ` (أبرزها: ${repeats.slice(0, 5).map((r) => `\`${r.id}\`×${r.repeats}`).join("، ")})` : ""}
- المذكورون في القرآن verified دون 400 كلمة: **${shortPeople.length}** (يُعالَج بتوسيع المحتوى المنفصل)
- ذكر إسرائيليات/أهل الكتاب بلا حقل وبلا ضابط منهجي في النص: **${israSoft.length}**${israSoft.length ? ` (\`${israSoft.slice(0, 8).join("`, `")}\`)` : ""}
- لا يُعرض قطعاً حتى المراجعة: حديث بلا \`ref\`+\`grade\`+\`graded_by\` · آية غير مطابقة للمصحف · إسرائيلية بلا \`israiliyat\`
`;

fs.writeFileSync(path.join(DOCS, "CONTENT_REVIEW_QUEUE.md"), queueMd);

const auditMd = `# تدقيق المحتوى الموسَّع — ${TODAY}

مولَّد آليًا من \`scripts/content-gates/generate-content-audit-report.mjs\`.  
النطاق: طبقة \`public/data/knowledge/**\` + مسح خفيف لبنوك \`public/data/quiz\` القديمة.

## ملخص تنفيذي

| المؤشر | القيمة |
|---|---:|
| عناصر المعرفة | ${items.length} |
| verified | ${liveV} |
| needs_review | ${liveN} |
| بوابات المحتوى | 8 (schema · ayah · hadith · dupes · links · quality · lang · **audit**) |
| كتل مكررة (ناعم) | ${repeats.length} |
| قرآن-people <400 كلمة | ${shortPeople.length} |
| أسئلة demo قديمة | ${legacy?.demo ?? "—"} |

## أقسام المعرفة

| القسم | الكل | verified | needs_review |
|---|---:|---:|---:|
${secRows}

## ما تشدّد في هذه الجولة

1. **بوابة \`test-content-audit\`**: تطابق المانيفست مع الجرد، فريدة \`id\`، أجسام غير فارغة، مصادر \`book/author\`.
2. **\`test-content-ayah\`**: فحص اقتباسات الجسم بين ﴿ ﴾ إضافةً إلى \`evidences\`.
3. **\`test-content-quality\`**: حد أدنى للأنبياء **1800** كلمة وللأمم **1200**.
4. **\`test-content-schema\`**: التحقق من \`book/author\` لكل مصدر + صيغة \`updated_at\`.
5. **\`test-content-lang\`**: أنماط إملائية إضافية (لكن/أنت/عليك، TODO، lorem).
6. **إشارات ناعمة**: كتل مكررة، قصر quran-people، إسرائيليات بلا ضابط — في الطابور دون إسقاط البناء.

## مخالفات منهجية (ثابتة)

1. آيات غير مطابقة للمصحف المحلي → رفض آلي.
2. أحاديث بلا تخريج/درجة في verified → رفض آلي.
3. محتوى \`needs_review\` لا يُعرض كحقيقة قطعية.
4. إسرائيليات بلا حقل \`israiliyat\` في الأقسام القصصية → رفض آلي عند الإشارة الصريحة.

## بنوك quiz القديمة (خارج knowledge)

${
  legacy
    ? `- الملفات: ${legacy.files}\n- الأسئلة: ${legacy.total}\n- demo/غير مراجعة (تقريبي): ${legacy.demo}\n- بلا شرح كافٍ: ${legacy.noExp}\n- البنك الموثّق البديل: \`knowledge/quiz\` (${bySec.quiz?.all || 0} سؤالًا verified)`
    : "- لم يُعثر على المسار"
}

## الخطوة التالية

1. مراجعة بشرية لدفعات \`tafsir\` ثم \`discover-islam\` ثم \`history\` حسب الطابور.
2. توسيع مقالات \`quran-people\` إلى ≥400 كلمة verified (فرع محتوى منفصل إن لزم).
3. تنقية تدريجية لملفات demo في \`public/data/quiz\` ≤40 ملفًا لكل دفعة.
4. معالجة الكتل المكررة في بعض مقالات الأمم عند إعادة التحرير البشري.
`;

fs.writeFileSync(path.join(DOCS, `CONTENT_AUDIT_${TODAY}.md`), auditMd);
fs.writeFileSync(path.join(DOCS, "CONTENT_AUDIT_LATEST.md"), auditMd);

ok(`generate-content-audit-report — ${items.length} عنصرًا · طابور ${liveN} · تقرير ${TODAY}`);
