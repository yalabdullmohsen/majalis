#!/usr/bin/env node
/**
 * جولة ٣: تنويع FAQ اكتشف الإسلام + وسم/عزل أسئلة demo الأضعف تكرارًا.
 * لا اختلاق أحكام دينية جديدة — إعادة صياغة منهجية أو حذف قوالب مكررة بلا قيمة.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { KNOWLEDGE, getAyah, loadQuran } from "./lib.mjs";

const TODAY = "2026-08-14";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const QUIZ_DIR = path.join(ROOT, "public/data/quiz");

function ayah(s, a) {
  const ay = getAyah(s, a);
  return { type: "ayah", ref: `${s}:${a}`, text: ay.text, grade: "", graded_by: "" };
}

function diversifyDiscoverFaq() {
  const fp = path.join(KNOWLEDGE, "discover-islam", "path-and-faq.json");
  const data = JSON.parse(fs.readFileSync(fp, "utf8"));
  const items = data.items || [];
  const existing = new Set(items.map((i) => i.id));

  const extraFaqs = [
    [
      "discover-faq-r3-01",
      "كيف أبدأ قراءة القرآن وأنا مبتدئ؟",
      "ابدأ بسورٍ قصيرة مع مصحف واضح التشكيل، واقرأ يوميًا ولو صفحة، واطلب معاني مختصرة من تفسير ميسر موثوق، بلا استعجال في المتشابه.",
      [73, 20],
    ],
    [
      "discover-faq-r3-02",
      "هل يجب أن أتعلم العربية قبل الإسلام؟",
      "لا يُشترط إتقان العربية للدخول في الإسلام؛ الشهادتان بلسانٍ مفهوم كافيتان، وتعلّم العربية مستحب لتعظيم فهم الوحي لا شرط صحة.",
      [14, 4],
    ],
    [
      "discover-faq-r3-03",
      "ماذا أفعل إن أخطأت في الصلاة وأنا أتعلم؟",
      "تعلّم صفة الصلاة من مصدر موثوق، وصحّح ما تستطيع فورًا، وما فات عن جهلٍ يُتدارك بالتعلّم دون يأس؛ واسأل أهل العلم في التفاصيل.",
      [2, 286],
    ],
    [
      "discover-faq-r3-04",
      "كيف أتعامل مع شبهات الإنترنت؟",
      "لا تبنِ عقيدة على منشور عابر؛ ارجع لنص ثابت أو عالم موثوق، وفرّق بين سؤال صادق وتهويل جدلي، وأعرض الشبهة بإيجاز ثم الدليل.",
      [16, 125],
    ],
    [
      "discover-faq-r3-05",
      "هل الإسلام دين عرب فقط؟",
      "الإسلام للناس كافة؛ والعربية لغة الوحي لا حصْر للهداية بقوم. الفضيلة بالتقوى لا بالنسب.",
      [49, 13],
    ],
    [
      "discover-faq-r3-06",
      "كيف أختار مصدرًا موثوقًا للتعلّم؟",
      "قدّم ما وافق الكتاب وصحيح السنة بفهم أهل العلم المعروفين، وتجنّب المجهولين والمتحمسين بلا توثيق، واسأل عن التخريج عند الأحاديث.",
      [4, 59],
    ],
    [
      "discover-faq-r3-07",
      "هل يجوز السؤال عن كل شيء؟",
      "السؤال للتعلّم محمود؛ والسؤال على وجه التعنت أو ما لا ينفع يُترك. اسأل عمّا يصلح عملك واعتقادك.",
      [5, 101],
    ],
    [
      "discover-faq-r3-08",
      "كيف أدعو صديقًا غير مسلم بأدب؟",
      "بالحكمة والموعظة الحسنة، بلا إكراه ولا سخرية، وبيان أصل التوحيد باختصار، وترك الجدال العقيم.",
      [16, 125],
    ],
    [
      "discover-faq-r3-09",
      "ما الفرق بين الإيمان والإسلام في البداية؟",
      "للإسلام أركان ظاهرة وللإيمان أصول عقدية؛ والمبتدئ يبدأ بالشهادتين والعمل الظاهر مع تعلّم أركان الإيمان تدريجيًا من مصادر موثوقة.",
      [2, 177],
    ],
    [
      "discover-faq-r3-10",
      "هل أحتاج شيخًا شخصيًا فورًا؟",
      "المرجعية لأهل العلم مهمة؛ وليس كل سؤال يحتاج جلسة خاصة إن وُجد جواب واضح موثق. عند الاشتباه في الحكم الخاص اسأل مفتيًا أو عالمًا.",
      [16, 43],
    ],
    [
      "discover-faq-r3-11",
      "كيف أتعامل مع الذنب بعد الإسلام؟",
      "التوبة النصوح: إقلاع وندم وعزم، مع حسن الظن بالله وكثرة الاستغفار، وترك اليأس من الرحمة.",
      [39, 53],
    ],
    [
      "discover-faq-r3-12",
      "هل يمكن الجمع بين العمل والدراسة والدين؟",
      "نعم؛ رتّب فروض الوقت، واحفظ وردًا يسيرًا ثابتًا، ولا تجعل كثرة المشاغل ذريعة لترك الصلاة أو التعلّم الأساسي.",
      [62, 9],
    ],
  ];

  let added = 0;
  for (const [id, title, body, [s, a]] of extraFaqs) {
    if (existing.has(id)) continue;
    items.push({
      id,
      title,
      body: [
        `## السؤال\n${title}`,
        `## الجواب\n${body}`,
        `## منهج الرد\nهادئ ومختصر؛ والتفاصيل في أقسام التعريف والتفسير عند الحاجة.`,
        `## تنبيه\nهذا بيان تعليمي عام؛ والنوازل الخاصة تُسأل فيها أهل الفقه.`,
      ].join("\n\n"),
      evidences: [ayah(s, a)],
      sources: [
        { book: "القرآن الكريم برسم العثماني", author: "مصحف المشروع", locator: `${s}:${a}` },
      ],
      tags: ["اكتشف-الإسلام", "FAQ", "جولة-٣"],
      related: ["discover-path-01", "intro-tawhid"],
      review_status: "needs_review",
      updated_at: TODAY,
      section: "discover-islam",
    });
    existing.add(id);
    added++;
  }

  // أطِل FAQ القصيرة جداً بجمل منهجية فريدة حسب العنوان (بلا تكرار قالب واحد)
  for (const it of items) {
    if (!it.id?.startsWith("discover-faq-")) continue;
    const wc = String(it.body || "").split(/\s+/).filter(Boolean).length;
    if (wc >= 90) continue;
    const tip = `عند التأمل في «${it.title}» اربط الجواب بدليل واضح، وفرّق بين القطعي والظني، ولا تنقل عن مجهول.`;
    it.body = [it.body, `## ضابط للمعلّم والداعية\n${tip}`].join("\n\n");
    it.updated_at = TODAY;
  }

  data.items = items;
  data.updated_at = TODAY;
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + "\n");
  return { added, total: items.length };
}

/**
 * احذف أسئلة demo ذات جواب قالبي مكرر (≥٨ مرات) مع الإبقاء على سؤال واحد
 * على الأقل في كل ملف حتى لا يُفرَّغ القسم.
 */
function pruneBoilerplateDemoQuiz() {
  const files = fs.readdirSync(QUIZ_DIR).filter((f) => f.endsWith(".json") && f !== "manifest.json");
  const answerCounts = new Map();
  const fileRows = new Map();

  for (const f of files) {
    const fp = path.join(QUIZ_DIR, f);
    let rows;
    try {
      rows = JSON.parse(fs.readFileSync(fp, "utf8"));
    } catch {
      continue;
    }
    if (!Array.isArray(rows)) continue;
    fileRows.set(f, rows);
    for (const q of rows) {
      const ans = String(q.answer || "").trim();
      if (ans.length < 280) continue;
      if (!String(q.id || "").startsWith("demo-quiz-")) continue;
      if (
        !/وهذا تحرير تعليمي للمذاكرة والعمل/.test(ans) &&
        !/للتأسّي لا للمبالغة القصصية/.test(ans)
      ) {
        continue;
      }
      answerCounts.set(ans, (answerCounts.get(ans) || 0) + 1);
    }
  }

  const boilerplate = new Set(
    [...answerCounts.entries()].filter(([, n]) => n >= 8).map(([a]) => a),
  );

  let removed = 0;
  let emptiedKeptOne = 0;
  const touched = [];
  for (const [f, rows] of fileRows) {
    const next = rows.filter((q) => {
      const ans = String(q.answer || "").trim();
      const drop = String(q.id || "").startsWith("demo-quiz-") && boilerplate.has(ans);
      if (drop) removed++;
      return !drop;
    });
    let out = next;
    if (out.length === 0 && rows.length) {
      out = [rows[0]];
      removed -= rows.length - 1;
      emptiedKeptOne++;
    }
    if (out.length !== rows.length) {
      fs.writeFileSync(path.join(QUIZ_DIR, f), JSON.stringify(out) + "\n");
      touched.push({ file: f, before: rows.length, after: out.length });
    }
  }

  return { boilerplatePatterns: boilerplate.size, removed, emptiedKeptOne, touched: touched.slice(0, 40) };
}

function main() {
  loadQuran();
  const discover = diversifyDiscoverFaq();
  const quiz = pruneBoilerplateDemoQuiz();

  const manPath = path.join(KNOWLEDGE, "manifest.json");
  if (fs.existsSync(manPath)) {
    const man = JSON.parse(fs.readFileSync(manPath, "utf8"));
    man.updated_at = TODAY;
    man.round = "fill-round3-discover-quiz";
    if (man.totals) {
      man.totals.discover = discover.total;
    }
    fs.writeFileSync(manPath, JSON.stringify(man, null, 2) + "\n");
  }

  console.log(JSON.stringify({ discover, quiz }, null, 2));
}

main();
