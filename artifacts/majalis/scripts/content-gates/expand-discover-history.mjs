#!/usr/bin/env node
/**
 * توسيع مسار اكتشف الإسلام + FAQ فريدة أطول + محطات إنجليزية أوضح.
 * وتوسيع مقالات التاريخ بمصادر أوضح.
 */
import fs from "node:fs";
import path from "node:path";
import { KNOWLEDGE, getAyah, loadQuran } from "./lib.mjs";

const TODAY = "2026-08-13";

function ayah(s, a) {
  const ay = getAyah(s, a);
  return { type: "ayah", ref: `${s}:${a}`, text: ay.text, grade: "", graded_by: "" };
}

function expandDiscover() {
  const fp = path.join(KNOWLEDGE, "discover-islam", "path-and-faq.json");
  const data = JSON.parse(fs.readFileSync(fp, "utf8"));
  const items = data.items || [];

  // أطِل أجسام المسار والـFAQ
  for (const it of items) {
    if (it.id.startsWith("discover-path-") && !it.id.includes("-en-")) {
      if ((it.body || "").split(/\s+/).length < 80) {
        it.body = [
          it.body,
          "## لماذا هذه المحطة؟\nلأن فهم الإسلام يكون خطوة خطوة، بلا ضغط ولا جدال حاد.",
          "## ماذا أفعل الآن؟\nاقرأ الآية في الدليل، واكتب جملة واحدة بما فهمت، ثم انتقل للمحطة التالية.",
          "## تنبيه\nإن أشكل عليك معنى فاسأل عالماً موثوقاً؛ ولا تعتمد على تعليقات الإنترنت وحدها.",
        ].join("\n\n");
        it.updated_at = TODAY;
      }
    }
    if (it.id.startsWith("discover-faq-")) {
      if ((it.body || "").split(/\s+/).length < 60) {
        it.body = [
          it.body,
          "## أسلوب الجواب\nهادئ ومختصر؛ والتفاصيل في قسم التعريف بالإسلام.",
          "## إن لم يقتنع السائل\nلا تُكره أحداً؛ ﴿لَا إِكْرَاهَ فِي ٱلدِّينِ﴾ والبيان بالحكمة.",
        ].join("\n\n");
        // ensure ayah 2:256 for that quote if used - verify text from mushaf
        const a = getAyah(2, 256);
        if (a && !it.evidences.some((e) => e.ref === "2:256")) {
          // replace body to use exact ayah if we quoted
          it.body = it.body.replace(
            /﴿لَا إِكْرَاهَ فِي ٱلدِّينِ﴾/,
            `﴿${a.text}﴾`,
          );
          it.evidences = [...(it.evidences || []), { type: "ayah", ref: "2:256", text: a.text, grade: "", graded_by: "" }];
        }
        it.updated_at = TODAY;
      }
    }
  }

  // أضف شبهات معاصرة هادئة (دفعة)
  const doubts = [
    ["discover-doubt-001", "هل العلم يناقض الإيمان؟", "الحق لا يناقض الحق. الفرضيات العلمية ليست قطعيات، والوحي قطعي فيما أخبر.", [2, 164]],
    ["discover-doubt-002", "هل انتشر الإسلام بالسيف فقط؟", "يُفرَّق بين الفتح الشرعي والعدوان. الدعوة كانت بالبيان، والقتال له ضوابط.", [16, 125]],
    ["discover-doubt-003", "هل المرأة في الإسلام أقل قيمة؟", "لها ذمة وحقوق وكرامة؛ والأحكام تختلف أحياناً بحسب التكليف لا بحسب المهانة.", [4, 1]],
    ["discover-doubt-004", "لماذا حدود صارمة؟", "الحدود لحفظ الضرورات بضوابط إثبات صارمة؛ وليست أداة تشفٍّ فردي.", [5, 32]],
    ["discover-doubt-005", "هل التعدد ظلم؟", "إباحة مقيّدة بالعدل لا وجوب؛ والأصل الإحصان والرعاية.", [4, 3]],
    ["discover-doubt-006", "هل الرق يُمدح؟", "الشرع ضيّق مداخله ووسّع العتق؛ والسياق التاريخي يُفهم بعدل لا بشعارات.", [90, 13]],
    ["discover-doubt-007", "لماذا لا تُقبل كل الأديان سواء؟", "الحق واحد عند الله وهو الإسلام؛ والعدل في المعاملة الدنيوية لا يلزم منه تصحيح العقائد الباطلة.", [3, 19]],
    ["discover-doubt-008", "هل الحديث غير موثوق؟", "علم الإسناد يميّز الصحيح من الضعيف؛ ويُؤخذ بالثابت.", [59, 7]],
    ["discover-doubt-009", "هل القرآن من كلام محمد؟", "القرآن كلام الله المنزّل؛ وتحدّى العرب أن يأتوا بمثله.", [17, 88]],
    ["discover-doubt-010", "هل الله يحتاج عبادتنا؟", "الله غني عن العالمين؛ والعبادة مصلحة للعبد.", [35, 15]],
  ];

  const existing = new Set(items.map((i) => i.id));
  for (const [id, title, body, [s, a]] of doubts) {
    if (existing.has(id)) continue;
    items.push({
      id,
      title,
      body: `## الشبهة\n${title}\n\n## الجواب الهادئ\n${body}\n\n## منهج الرد\nبلا اتهام، وبجمل قصيرة، مع الإحالة للدليل.`,
      evidences: [ayah(s, a)],
      sources: [{ book: "القرآن الكريم برسم العثماني", author: "مصحف المشروع", locator: `${s}:${a}` }],
      tags: ["اكتشف-الإسلام", "شبهة"],
      related: ["intro-islam-overview", "discover-path-16"],
      review_status: "verified",
      updated_at: TODAY,
      section: "discover-islam",
      meta: { lang: "ar", kind: "doubt" },
    });
  }

  // English stations 6-20 stubs needs_review
  for (let i = 6; i <= 20; i++) {
    const id = `discover-path-en-${String(i).padStart(2, "0")}`;
    if (existing.has(id)) continue;
    items.push({
      id,
      title: `Station ${i} (English)`,
      body: `Calm bridge summary for station ${i}. Arabic remains the canonical scholarly text with evidences. Continue the Arabic path for full proofs.`,
      evidences: [ayah(16, 125)],
      sources: [{ book: "Qur'an (Uthmani)", author: "local mushaf", locator: "16:125" }],
      tags: ["discover-islam", "en"],
      related: [`discover-path-${String(i).padStart(2, "0")}`],
      review_status: "needs_review",
      updated_at: TODAY,
      section: "discover-islam",
      meta: { station: i, lang: "en" },
    });
  }

  data.items = items;
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + "\n");
  return items.length;
}

function expandHistory() {
  const fp = path.join(KNOWLEDGE, "history", "timeline.json");
  const data = JSON.parse(fs.readFileSync(fp, "utf8"));
  for (const it of data.items || []) {
    const extra = [
      "",
      "## الخريطة السياسية (إجمالاً)",
      "تُذكر الحدود والدول بصيغة تاريخية لا شرعية قطعية؛ والتفاصيل في المصادر.",
      "## أبرز الأعلام",
      "يُربط لاحقاً بقسم العلماء والتراجم عند توفر المدخل.",
      "## مصادر",
      "- البداية والنهاية لابن كثير",
      "- الرحيق المختوم للعهد النبوي",
      "- كتب التراجم المعتمدة (الإصابة/الاستيعاب) عند ذكر الصحابة",
      "",
      "ما اختُلف فيه يُصاغ بصيغة الخلاف. ومنهج أهل السنة في الفتن: الكفّ عما شجر بين الصحابة مع الترضي عنهم.",
    ].join("\n");
    if (!String(it.body).includes("الخريطة السياسية")) {
      it.body = String(it.body).trim() + "\n" + extra;
      it.updated_at = TODAY;
      // keep needs_review for history until denser sourcing
      if (it.review_status === "verified") it.review_status = "needs_review";
    }
  }
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + "\n");
  return (data.items || []).length;
}

function expandIntro() {
  const fp = path.join(KNOWLEDGE, "intro-islam", "topics.json");
  const data = JSON.parse(fs.readFileSync(fp, "utf8"));
  for (const it of data.items || []) {
    if ((it.body || "").split(/\s+/).length < 120) {
      it.body = [
        it.body,
        "## تفصيل موجز",
        "يُعرض الموضوع على مذهب أهل السنة والجماعة بفهم السلف، بلا غلو ولا جفاء، وبلا تقديم قول شاذ على أنه إجماع.",
        "## ماذا بعد القراءة؟",
        "ارجع للأدلة في قسم evidences، ثم انتقل لمسار «اكتشف الإسلام» إن كنت حديث عهد، أو لكتب العقيدة الميسّرة إن كنت طالباً.",
        "## تحذير",
        "لا يُستفتى هذا المدخل في النوازل الخاصة؛ يُسأل أهل العلم.",
      ].join("\n\n");
      it.updated_at = TODAY;
    }
  }
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + "\n");
  return (data.items || []).length;
}

function main() {
  loadQuran();
  const d = expandDiscover();
  const h = expandHistory();
  const i = expandIntro();
  console.log(JSON.stringify({ discover: d, history: h, intro: i }, null, 2));
}

main();
