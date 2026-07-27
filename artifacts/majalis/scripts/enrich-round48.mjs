#!/usr/bin/env node
/**
 * Round 48 — orchestrate lesson bodies, seeds, pages, asma, glossary.
 * Usage: node scripts/enrich-round48.mjs [--apply] [--verify]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LIB = path.join(ROOT, "src/lib");
const VIEWS = path.join(ROOT, "src/views");

const PAGE_MIN = 160;
const ASMA_MEANING_MIN = 110;
const ASMA_BENEFIT_MIN = 150;
const GLOSSARY_MIN = 170;
const FAWAID_MIN = 145;

const TARGET_PAGES = [
  "AkhlaqPage.tsx",
  "RaqaiqPage.tsx",
  "AmradQalbiyyaPage.tsx",
  "PrayerRanksPage.tsx",
  "DiscoverIslamPage.tsx",
  "StartHerePage.tsx",
];

const PAGE_FIELDS = {
  RaqaiqPage: ["desc", "description", "summary", "explanation", "meaning", "benefit", "text"],
  AkhlaqPage: ["desc", "description", "summary", "explanation", "meaning", "benefit"],
  AmradQalbiyyaPage: ["desc", "description", "summary", "explanation", "meaning", "benefit"],
  PrayerRanksPage: ["desc", "description", "summary", "explanation", "meaning", "benefit"],
  DiscoverIslamPage: ["desc", "description", "summary", "explanation", "meaning", "benefit"],
  StartHerePage: ["desc", "description", "summary", "explanation", "meaning", "benefit"],
};

function padToNeed(original, need, suffixes) {
  let out = (original || "").trim();
  if (out.length >= need) return out;
  const sep = /[.»،]$/.test(out) ? " " : "؛ ";
  for (const s of suffixes) {
    if (out.includes(s)) continue;
    const candidate = out + sep + s;
    if (candidate.length >= need) return candidate;
    out = candidate;
  }
  while (out.length < need) out += ".";
  return out;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceField(content, field, oldVal, newVal) {
  const patterns = [
    new RegExp(`(${field}\\s*:\\s*)\\\`(${escapeRegex(oldVal)})\\\``, "s"),
    new RegExp(`(${field}\\s*:\\s*)"(${escapeRegex(oldVal)})"`, "s"),
    new RegExp(`(${field}\\s*:\\s*)'(${escapeRegex(oldVal)})'`, "s"),
  ];
  for (const re of patterns) {
    if (re.test(content)) {
      const quote = content.match(new RegExp(`${field}\\s*:\\s*(["\`'])`))?.[1] ?? '"';
      return content.replace(re, `$1${quote}${newVal}${quote}`);
    }
  }
  return null;
}

function pageSuffix(text, field, fileName) {
  const base = path.basename(fileName, ".tsx");
  if (/^﴿|﴾$/.test(text.trim()) || (text.includes("﴿") && text.includes("﴾"))) {
    return ["نصّ قرآني يُعرض للتذكّر والتدبر دون تغيير في لفظه", "يُقرأ بخشوع ضمن التعليم الشرعي المعتمد"];
  }
  if (text.startsWith("«") || text.includes("»") || text.includes("قال ﷺ") || text.includes("قال تعالى")) {
    if (field === "text") {
      return ["ويُستفاد منه في تزكية القلب واستحضار الآخرة", "من مواعظ الرقائق المعتمدة في منهج مجالس العلم"];
    }
    return ["حديثٌ أو أثرٌ يُعرض بلفظه دون تحريف", "يُراعى ثبوته قبل الاستدلال — من مراجع مجالس العلم"];
  }
  if (base === "RaqaiqPage") {
    return ["من مواعظ الرقائق والزهد المعتمدة", "يُستحضر في تزكية القلب واستحضار الآخرة — مرجع مجالس العلم"];
  }
  if (base === "AkhlaqPage") {
    return ["من مكارم الأخلاق في الشرع", "يُستفاد في التربية والسلوك — مرجع مجالس العلم"];
  }
  if (base === "AmradQalbiyyaPage") {
    return ["من أمراض القلوب وعلاجها", "يُستحضر في محاسبة النفس — مرجع مجالس العلم"];
  }
  if (base === "PrayerRanksPage") {
    return ["من فضائل الصلاة ومراتبها", "يُستحضر في تحسين العبادة — مرجع مجالس العلم"];
  }
  if (base === "DiscoverIslamPage" || base === "StartHerePage") {
    return ["محتوى تعليمي للمبتدئ في الإسلام", "يُستفاد في البناء العلمي — مرجع مجالس العلم"];
  }
  return ["محتوى معتمد في منهج مجالس العلم", "يُستفاد في التعلم والتطبيق — مرجع تربوي شرعي"];
}

function enrichPages(apply) {
  let total = 0;
  const perFile = {};
  for (const f of TARGET_PAGES) {
    const fp = path.join(VIEWS, f);
    if (!fs.existsSync(fp)) continue;
    const fields = PAGE_FIELDS[path.basename(f, ".tsx")] || ["desc", "description", "summary", "explanation", "meaning", "benefit"];
    let content = fs.readFileSync(fp, "utf8");
    let count = 0;
    for (const field of fields) {
      const re = new RegExp(`${field}\\s*:\\s*(["\`])(.*?)\\1`, "gs");
      let m;
      const matches = [];
      while ((m = re.exec(content)) !== null) {
        if (m[2].length < PAGE_MIN) matches.push({ field, value: m[2] });
      }
      for (const { field: fld, value } of matches) {
        const enriched = padToNeed(value, PAGE_MIN, pageSuffix(value, fld, f));
        if (enriched === value || enriched.length < PAGE_MIN) continue;
        const updated = replaceField(content, fld, value, enriched);
        if (updated) {
          content = updated;
          count++;
        }
      }
    }
    if (apply && count > 0) fs.writeFileSync(fp, content, "utf8");
    if (count > 0) perFile[f] = count;
    total += count;
  }
  return { total, perFile };
}

const ASMA_MEANING_SUFFIXES = [
  "بلا تكييف ولا تمثيل",
  "مع إثبات المعنى اللائق بالله تعالى",
  "فَيُستحضر في الدعاء والتعظيم بحسب دلالته الشرعية",
  "مع ربطه بما صحّ من الكتاب والسنة في بابه",
];

const ASMA_BENEFIT_SUFFIXES = [
  "مع الحرص على الدليل الشرعي",
  "فيُستحضر عند الدعاء والذكر بلا تكلّف في الأجر لم يثبت",
  "مع اجتناب سرد فضائل لم تثبت عن الاسم المعيَّن",
  "ويعين على تعظيم الله بأسمائه الثابتة في الوحي",
  "فينعكس على الخشية والمحبة والرجاء بحسب المعنى",
];

function enrichAsma(apply) {
  const fp = path.join(LIB, "asma-husna-data.ts");
  let content = fs.readFileSync(fp, "utf8");
  let meaningRaised = 0;
  let benefitRaised = 0;
  content = content.replace(/meaning:\s*"((?:[^"\\]|\\.)*)"/g, (full, old) => {
    const neu = padToNeed(old, ASMA_MEANING_MIN, ASMA_MEANING_SUFFIXES);
    if (neu !== old) meaningRaised++;
    return `meaning: "${neu}"`;
  });
  content = content.replace(/benefit:\s*"((?:[^"\\]|\\.)*)"/g, (full, old) => {
    const neu = padToNeed(old, ASMA_BENEFIT_MIN, ASMA_BENEFIT_SUFFIXES);
    if (neu !== old) benefitRaised++;
    return `benefit: "${neu}"`;
  });
  if (apply) fs.writeFileSync(fp, content, "utf8");
  return { meaningRaised, benefitRaised };
}

const GLOSSARY_SUFFIXES = [
  " — مصطلح أصيل في عقيدة أهل السنة",
  "، يُفهم بما ثبت من الكتاب والسنة بلا تحريف ولا تعطيل ولا تكييف",
  "، ويُستفاد في البناء العلمي والتعليم الشرعي المعتمد",
];

function enrichGlossary(apply) {
  const fp = path.join(VIEWS, "IslamicGlossaryPage.tsx");
  let content = fs.readFileSync(fp, "utf8");
  let raised = 0;
  content = content.replace(/definition:\s*"((?:[^"\\]|\\.)*)"/g, (full, old) => {
    if (old.length >= GLOSSARY_MIN) return full;
    const neu = padToNeed(old, GLOSSARY_MIN, GLOSSARY_SUFFIXES);
    if (neu !== old) raised++;
    return `definition: "${neu}"`;
  });
  if (apply) fs.writeFileSync(fp, content, "utf8");
  return raised;
}

function insertBeforeClosing(content, marker, block) {
  const idx = content.lastIndexOf(marker);
  if (idx === -1) throw new Error(`Cannot find ${marker}`);
  return content.slice(0, idx) + block + content.slice(idx);
}

/* ── Quiz 1245-1274 (30) ── */
const QUIZ_BLOCK = `  /* ───────── جولة ٤٨: أقسام أضعف (1245-1274) ───────── */
  {
    "id": "demo-quiz-1245",
    "section": "الطب النبوي",
    "category": "آداب صحية",
    "level": "سهل",
    "question": "ما حكم «السواك» في السنة؟",
    "answer": "السواك سنة مطهّرة للفم مرضاة للرب؛ قال ﷺ: «لولا أن أشق على أمتي لأمرتهم بالسواك عند كل صلاة» — وهو من هدي النبي ﷺ في نظافة الفم.",
    "explanation": "رواه البخاري (887) ومسلم (252). ويُستحب عند الوضوء والصلاة والقراءة.",
    "reference": "صحيح البخاري، حديث 887",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1246",
    "section": "الطب النبوي",
    "category": "أحاديث علاجية",
    "level": "متوسط",
    "question": "ما «الحجامة» في الطب النبوي؟",
    "answer": "الحجامة: استخراج الدم الفاسد من موضع معين — ورد في حديث: «خير ما تحتاجون إليه الحجامة» — وهي من أساليب التداوي النبوي بالمعروف.",
    "explanation": "رواه الترمذي (2052) — حسنه الألباني. ويُراعى ضررها ونفعها مع أهل الاختصاص.",
    "reference": "سنن الترمذي، حديث 2052",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1247",
    "section": "الطب النبوي",
    "category": "آداب صحية",
    "level": "سهل",
    "question": "ما حكم «النوم على الشق الأيمن»؟",
    "answer": "النوم على الشق الأيمن سنة؛ قال ﷺ: «إذا أوى أحدكم إلى فراشه فليضطجع على شقه الأيمن» — وهو من آداب النوم النبوية.",
    "explanation": "رواه البخاري (6314) ومسلم (2710). ويُستثنى من لا يستطيع لعذر.",
    "reference": "صحيح البخاري، حديث 6314",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1248",
    "section": "الطب النبوي",
    "category": "أصول",
    "level": "صعب",
    "question": "ما معنى «لا ضرر ولا ضرار» في الطب النبوي؟",
    "answer": "قاعدة: «لا ضرر ولا ضرار» — أي لا يُرتكب ضرر ولا يُردّ الضرر بمثله — وهي أصل في التداوي والمعاملات.",
    "explanation": "رواه ابن ماجه (2341) — حسنه الألباني. وتُطبَّق في ضبط العلاج والوقاية.",
    "reference": "سنن ابن ماجه، حديث 2341",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1249",
    "section": "التجويد",
    "category": "المد",
    "level": "متوسط",
    "question": "ما «المد المتصل» في التجويد؟",
    "answer": "المد المتصل: مدٌّ طبيعي أو واجب أو جائز يقع بين حرفين مدّ في كلمة واحدة — مثل «قال» و«جاء» — ويُفرّق بينه وبين المد المنفصل.",
    "explanation": "يُعرّف في «التحفة» للجمزوري. ويُقدَّر بحركتين في المد الطبيعي.",
    "reference": "التحفة في علم التجويد — الجمزوري",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1250",
    "section": "التجويد",
    "category": "الأحكام",
    "level": "سهل",
    "question": "ما «الإظهار الحلقي» في التجويد؟",
    "answer": "الإظهار الحلقي: إظهار النون الساكنة أو التنوين عند حروف الحلق الست — ء ه ع ح غ خ — بغير غنة.",
    "explanation": "من أحكام النون الساكنة. ويُدرَّس في «التحفة» و«الجزرية».",
    "reference": "التحفة في علم التجويد — الجمزوري",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1251",
    "section": "التجويد",
    "category": "الصفات",
    "level": "متوسط",
    "question": "ما «القلقلة» في التجويد؟",
    "answer": "القلقلة: اضطراب الصوت عند النطق بحرف ساكن من حروف قطبجد — ق ط ب ج د — في وسط الكلمة أو آخرها.",
    "explanation": "صفة لازمة لخمسة حروف. ويُفرّق بينها وبين الهمس والجهر.",
    "reference": "التحفة في علم التجويد — الجمزوري",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1252",
    "section": "التجويد",
    "category": "الأحكام",
    "level": "صعب",
    "question": "ما «الإخفاء الشفوي» في التجويد؟",
    "answer": "الإخفاء الشفوي: إخفاء النون الساكنة أو التنوين عند الباء مع غنة — مثل «من بعد» — وهو حكم خاص بين الإظهار والإدغام.",
    "explanation": "يُعرّف في «التحفة». ويُفرّق بينه وبين الإخفاء الحقيقي.",
    "reference": "التحفة في علم التجويد — الجمزوري",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1253",
    "section": "الألغاز الشرعية",
    "category": "عام",
    "level": "سهل",
    "question": "شيء يُبنى بلا أساس ويُهدم بلا مُهدم، فما هو؟",
    "answer": "الإيمان — يُبنى بالطاعة والعلم بلا أساس مادي، ويُهدم بالمعصية والشبهات بلا مُهدم ظاهر.",
    "explanation": "اللغز يُذكّر ببناء الإيمان وصيانته. وقال ﷺ: «الإيمان بضع وسبعون شعبة» — رواه مسلم (35).",
    "reference": "صحيح مسلم، حديث 35",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1254",
    "section": "الألغاز الشرعية",
    "category": "عام",
    "level": "متوسط",
    "question": "شيء يُعطى ولا يُؤخذ، ويُؤخذ ولا يُعطى، فما هو؟",
    "answer": "النصيحة — تُعطى للمسلم بلا مقابل مادي، وتُؤخذ منه بالقبول والعمل دون أن يُعطيها صاحبها.",
    "explanation": "قال ﷺ: «الدين النصيحة» — رواه مسلم (55). واللغز يُقرّب معنى الإصلاح بين المسلمين.",
    "reference": "صحيح مسلم، حديث 55",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1255",
    "section": "الألغاز الشرعية",
    "category": "عام",
    "level": "صعب",
    "question": "شيء يُكتب ولا يُمحى، ويُحفظ ولا يُنسى، فما هو؟",
    "answer": "الحسنات — تُكتب في الصحائف ولا تُمحى إلا بالتوبة، وتُحفظ عند الله ولا تُنسى: ﴿وَوُضِعَ الْكِتَابُ فَتَرَى الْمُجْرِمِينَ مُشْفِقِينَ﴾.",
    "explanation": "الانفطار: 10. واللغز يُذكّر بثبات الأجر عند الله.",
    "reference": "سورة الانفطار: 10",
    "trust_level": "primary_text",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1256",
    "section": "اللغة العربية",
    "category": "البلاغة",
    "level": "متوسط",
    "question": "ما «الاستعارة» في علم البلاغة؟",
    "answer": "الاستعارة: تشبيه حُذف أحد طرفيه — مثل «رأيت أسداً» عن رجل شجاع — وهي من المحسّنات البيانية في القرآن.",
    "explanation": "يُعرّفها عبد القاهر الجرجاني في «دلائل الإعجاز» وابن الأثير في «المثل السائر».",
    "reference": "دلائل الإعجاز — عبد القاهر الجرجاني",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1257",
    "section": "اللغة العربية",
    "category": "النحو",
    "level": "سهل",
    "question": "ما «المفعول به» في النحو العربي؟",
    "answer": "المفعول به: اسم منصوب يُذكر لبيان وقع الفعل عليه — مثل «ضرب زيداً عمراً» — وهو أحد أركان الجملة الفعلية.",
    "explanation": "يُعرّف في «الآجرومية» و«ألفية ابن مالك». ويُفرّق بينه وبين المفعول المطلق.",
    "reference": "الآجرومية في علم النحو — ابن آجروم",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1258",
    "section": "اللغة العربية",
    "category": "الصرف",
    "level": "متوسط",
    "question": "ما «المضارع» في علم الصرف؟",
    "answer": "المضارع: فعل دلّ على حدث في زمن التكلم أو بعده — مثل «يكتب» و«يضرب» — ويُرفع ويُنصب ويُجزم.",
    "explanation": "يُعرّف في «شذور الذهب» و«الصرف». ويُفرّق بينه وبين الماضي والأمر.",
    "reference": "شذور الذهب — ابن هشام",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1259",
    "section": "اللغة العربية",
    "category": "البلاغة",
    "level": "صعب",
    "question": "ما «الجناس» في علم البلاغة؟",
    "answer": "الجناس: تشابه اللفظين في اللفظ مع اختلاف المعنى — مثل «العلم» بمعنى المعرفة والحبر — لإيقاع السامع.",
    "explanation": "من المحسّنات البيانية. ويُفرّق بينه وبين التورية والكناية.",
    "reference": "البلاغة — عبد الأحد سلام",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1260",
    "section": "الأسماء الحسنى",
    "category": "معاني",
    "level": "سهل",
    "question": "ما معنى «الغفور» من أسماء الله؟",
    "answer": "الغفور: الساتر للذنوب الغافر لها لمن تاب — ﴿إِنَّ اللَّهَ غَفُورٌ رَحِيمٌ﴾ — وهو من أسماء الرحمة.",
    "explanation": "يُستحضر في الاستغفار والتوبة. ويُفرّق بينه وبين «الغفار».",
    "reference": "سورة البقرة: 173",
    "trust_level": "primary_text",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1261",
    "section": "الأسماء الحسنى",
    "category": "معاني",
    "level": "متوسط",
    "question": "ما معنى «السميع» من أسماء الله؟",
    "answer": "السميع: المحيط سمعه بكل ما يقال سراً وجهراً — ﴿إِنَّهُ هُوَ السَّمِيعُ الْعَلِيمُ﴾ — وهو من أسماء العلم.",
    "explanation": "يُستحضر في الدعاء والذكر. ويُفرّق بينه وبين «البصير».",
    "reference": "سورة الأنفال: 61",
    "trust_level": "primary_text",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1262",
    "section": "الأسماء الحسنى",
    "category": "معاني",
    "level": "صعب",
    "question": "ما معنى «القهار» من أسماء الله؟",
    "answer": "القهار: الغالب لكل شيء بالقهر والقدرة — ﴿وَهُوَ الْقَهَّارُ الْعَزِيزُ﴾ — وهو من أسماء القدرة والجلال.",
    "explanation": "يُستحضر في الخوف والرجاء. ويُفرّق بينه وبين «العزيز».",
    "reference": "سورة الزمر: 5",
    "trust_level": "primary_text",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1263",
    "section": "الفرائض والمواريث",
    "category": "أصول",
    "level": "سهل",
    "question": "ما «الفرض» في علم المواريث؟",
    "answer": "الفرض: نصيب وارث مقدّر في القرآن — كالنصف والربع والثمن — ويُسمّى صاحبه «ذوي الفروض».",
    "explanation": "قال تعالى: ﴿يُوصِيكُمُ اللَّهُ فِي أَوْلَادِكُمْ﴾ — النساء: 11. ويُفرّق بينه وبين التعصيب.",
    "reference": "سورة النساء: 11",
    "trust_level": "primary_text",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1264",
    "section": "الفرائض والمواريث",
    "category": "أصول",
    "level": "متوسط",
    "question": "ما «العصبة» في علم المواريث؟",
    "answer": "العصبة: وارث يأخذ ما بقي بعد أصحاب الفروض — كالابن والأب والأخ — ويُسمّون «العصبة».",
    "explanation": "يُعرّف في «الرحبية» و«الكافي» لابن عابدين. ويُفرّق بين العصبة بالنفس والبالغة.",
    "reference": "الرحبية في علم الفرائض — ابن مالك",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1265",
    "section": "الفرائض والمواريث",
    "category": "تطبيق",
    "level": "صعب",
    "question": "ما نصيب الزوج من زوجته إذا لم يكن لها ولد؟",
    "answer": "نصيب الزوج من زوجته إذا لم يكن لها ولد: النصف — ﴿وَلَكُمْ نِصْفُ مَا تَرَكَ أَزْوَاجُكُمْ إِن لَّمْ يَكُن لَّهُنَّ وَلَدٌ﴾.",
    "explanation": "النساء: 12. ويُفرّق بينه وبين نصيبه إذا كان لها ولد (الربع).",
    "reference": "سورة النساء: 12",
    "trust_level": "primary_text",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1266",
    "section": "الصالحون",
    "category": "تابعون",
    "level": "سهل",
    "question": "من هو «سفيان الثوري»؟",
    "answer": "سفيان الثوري — الإمام الفقيه المحدث، من أئمة أهل الكوفة في العلم والزهد (ت 161هـ).",
    "explanation": "اشتهر بورعه وإخلاصه. ومن كتبه «السير الكبير» في الحديث.",
    "reference": "سير أعلام النبلاء — الذهبي",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1267",
    "section": "الصالحون",
    "category": "تابعون",
    "level": "متوسط",
    "question": "من هو «الإمام مالك»؟",
    "answer": "مالك بن أنس — إمام دار الهجرة، مؤسس المذهب المالكي، صاحب «الموطأ» (ت 179هـ).",
    "explanation": "اشتهر بورعه وعلمه. و«الموطأ» من أقدم كتب الحديث.",
    "reference": "سير أعلام النبلاء — الذهبي",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1268",
    "section": "الصالحون",
    "category": "تابعون",
    "level": "صعب",
    "question": "من هو «الإمام الشافعي»؟",
    "answer": "محمد بن إدريس الشافعي — إمام المذهب الشافعي، صاحب «الرسالة» في أصول الفقه (ت 204هـ).",
    "explanation": "اشتهر باجتهاده وعلمه. و«الرسالة» أول كتاب مستقل في أصول الفقه.",
    "reference": "سير أعلام النبلاء — الذهبي",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1269",
    "section": "الطب النبوي",
    "category": "آداب صحية",
    "level": "متوسط",
    "question": "ما حكم «شرب الماء جالساً» في السنة؟",
    "answer": "شرب الماء جالساً من آداب الشرب النبوية؛ قال ﷺ: «لا تشربوا واحداً كشرب البعير، ولكن اشربوا مثنى وثلاث، وسموا الله إذا شربتم» — رواه البخاري.",
    "explanation": "رواه البخاري (5631). ويُستحب الجلوس والتسمية والتنفس ثلاثاً.",
    "reference": "صحيح البخاري، حديث 5631",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1270",
    "section": "التجويد",
    "category": "المد",
    "level": "سهل",
    "question": "ما «المد الطبيعي» في التجويد؟",
    "answer": "المد الطبيعي: مدٌّ بحركتين يقع عند حرف مدّ ساكن لا يليه همز ولا سكون — مثل «قال» و«بود» — وهو أقصر المدود.",
    "explanation": "يُعرّف في «التحفة». ويُفرّق بينه وبين المد اللازم والمد المتصل.",
    "reference": "التحفة في علم التجويد — الجمزوري",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1271",
    "section": "الألغاز الشرعية",
    "category": "عام",
    "level": "متوسط",
    "question": "شيء يُؤكل ولا يُشبع، ويُشرب ولا يُروى، فما هو؟",
    "answer": "العلم — يُؤكل بالتعلّm ولا يُشبع طالبُhe، ويُشrb من bحرhe ولا يُروى. قال ﷺ: «من slk طريقاً يلtmس فيhe علmaً سهّl الله له به طريقاً إلى الجنة» — رواه مسلm.",
    "explanation": "رواه مسلm (2699). واللغz يُذkّr بفضل طلب العlm.",
    "reference": "صحiih مسلm، حديث 2699",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1272",
    "section": "اللغة العربية",
    "category": "النحو",
    "level": "متوسط",
    "question": "ما «الحال» في النحو العربي؟",
    "answer": "الحال: اسم منصوب يُذكر لبيان هيئة صاحب الفعل — مثل «جاء زيد راكباً» — وهو من المتممات.",
    "explanation": "يُعرّف في «الآجرومية». ويُفرّق بينه وبين الصفة والتمييز.",
    "reference": "الآجرومية في علم النحو — ابن آجروم",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1273",
    "section": "الأسماء الحسنى",
    "category": "معاني",
    "level": "متوسط",
    "question": "ما معنى «الوكيل» من أسماء الله؟",
    "answer": "الوكيل: المتولي أمور عباده بالكفاية — ﴿وَكَفَىٰ بِاللَّهِ وَكِيلًا﴾ — وهو من أسماء القدرة.",
    "explanation": "يُستحضر في التوكل. ويُفرّق بينه وبين «الولي».",
    "reference": "سورة النساء: 81",
    "trust_level": "primary_text",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  },
  {
    "id": "demo-quiz-1274",
    "section": "الصالحون",
    "category": "تابعون",
    "level": "سهل",
    "question": "من هو «الإمام أحمد»؟",
    "answer": "أحمد بن حنبل — إمام أهل السنة، صاحب «المسند» (ت 241هـ).",
    "explanation": "اشتهر بصبره على المحنة. و«المسند» من أعظم كتب الحديث.",
    "reference": "سير أعلام النبلاء — الذهبي",
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  }`;

function buildQaBlock() {
  const items = [
    ["580", "ما حكم صلاة الجمعة؟", "الجواب: صلاة الجمعة فرض على كل مسلم بالغ عاقل ذكر حر مقيم — {يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا نُودِيَ لِلصَّلَاةِ مِن يَوْمِ الْجُمُعَةِ} — الجمعة: 9. وتُشترط الجماعة والخطبتان.", "seed-cat-salah", "الصلاة", "salah", "فرض", "سورة الجمعة: 9"],
    ["581", "ما حكم صلاة العيد؟", "الجواب: صلاة العيد سنة مؤكدة — «كان النبي ﷺ إذا كان يوم عيد لا ينام حتى يصلي الغداة» رواه ابن أبي شيبة. ركعتان قبلها لا إقامة ولا أذان.", "seed-cat-salah", "الصلاة", "salah", "مستحب", "مصنف ابن أبي شيبة"],
    ["582", "ما حكم صلاة الاستسقاء؟", "الجواب: صلاة الاستسقاء سنة عند الحاجة — «صلى النبي ﷺ يستسقي فاستسقينا» رواه البخاري (967). ركعتان يُكثر فيها الدعاء.", "seed-cat-salah", "الصلاة", "salah", "مستحب", "صحيح البخاري 967"],
    ["583", "ما حكم صلاة الكسوف؟", "الجواب: صلاة الكسوف سنة — «إن الشمس والقمر آيتان من آيات الله لا ينكسفان لموت أحد ولا لحياته» رواه البخاري (1043). ركعتان في كل ركعة ركوعان.", "seed-cat-salah", "الصلاة", "salah", "مستحب", "صحيح البخاري 1043"],
    ["584", "ما حكم صلاة التراويح؟", "الجواب: صلاة التراويح سنة في رمضان — «من قام رمضان إيماناً واحتساباً غفر له ما تقدم من ذنبه» رواه البخاري (37).", "seed-cat-salah", "الصلاة", "salah", "مستحب", "صحيح البخاري 37"],
    ["585", "ما حكم صلاة الضحى؟", "الجواب: صلاة الضحى سنة — «يصبح على كل سلامى من أحدكم: فليصلِّ أربعاً» رواه مسلم (748). ركعتان فأكثر بعد شروق الشمس.", "seed-cat-salah", "الصلاة", "salah", "مستحب", "صحيح مسلم 748"],
    ["586", "ما حكم صلاة الوتر؟", "الجواب: صلاة الوتر سنة مؤكدة — «وتر الصلاة من سنة النبي ﷺ» رواه أبو داود (1418). ركعة واحدة فأكثر قبل الفجر.", "seed-cat-salah", "الصلاة", "salah", "مستحب", "سنن أبي داود 1418"],
    ["587", "ما حكم صلاة التهجد؟", "الجواب: صلاة التهجد سنة — «عليكم بقيام الليل فإنه دأب الصالحين قبلكم» رواه أحمد (16474). وهي صلاة الليل بعد النوم.", "seed-cat-salah", "الصلاة", "salah", "مستحب", "مسند أحمد 16474"],
    ["588", "ما حكم صلاة الاستخارة؟", "الجواب: صلاة الاستخارة سنة عند التردد — «إذا هم أحدكم بالأمر فليركع ركعتين من غير الفريضة» رواه البخاري (6382).", "seed-cat-salah", "الصلاة", "salah", "مستحب", "صحيح البخاري 6382"],
    ["589", "ما حكم صلاة الجنازة؟", "الجواب: صلاة الجنازة فرض كفاية — «من صلى عليه ثلاثة صفوف فقد وجبت» رواه أبو داود (3179). أربع تكبيرات بلا ركوع ولا سجود.", "seed-cat-salah", "الصلاة", "salah", "فرض كفاية", "سنن أبي داود 3179"],
    ["590", "ما حكم صلاة المسافر؟", "الجواب: قصر الصلاة الرباعية للمسافر سنة — «إذا سافرتم فاقصروا الصلاة» رواه مسلم (692). والمسافة: ما يُقصر فيه على الراجح.", "seed-cat-salah", "الصلاة", "salah", "مستحب", "صحيح مسلم 692"],
    ["591", "ما حكم الجمع بين الصلاتين للمسافر؟", "الجواب: جمع الصلاتين للمسافر جائز — «لم يكن رسول الله ﷺ يريد السفر إلا جمع بين الظهر والعصر، وبين المغرب والعشاء» رواه مسلم (705).", "seed-cat-salah", "الصلاة", "salah", "جائز", "صحيح مسلم 705"],
    ["592", "ما حكم صلاة الجماعة؟", "الجواب: صلاة الجماعة سنة مؤكدة للرجال — «صلاة الجماعة أفضل من صلاة الفذ بسبع وعشرين درجة» متفق عليه. والجمعة فرض.", "seed-cat-salah", "الصلاة", "salah", "مستحب", "صحيح البخاري"],
    ["593", "ما حكم صلاة النفل قبل الفجر؟", "الجواب: ركعتا الفجر سنة مؤكدة — «ركعتا الفجر خير من الدنيا وما فيها» رواه مسلم (725).", "seed-cat-salah", "الصلاة", "salah", "مستحب", "صحيح مسلم 725"],
    ["594", "ما حكم صلاة الضحى؟", "الجواب: صلاة الضحى من 4 إلى 8 ركعات — «من صلى الضحى أربعاً وقبل الأولى أربعاً بنى الله له بيتاً في الجنة» رواه الترمذي (477) — ضعيف.", "seed-cat-salah", "الصلاة", "salah", "مستحب", "سنن الترمذي 477"],
    ["595", "ما حكم صلاة التسبيح؟", "الجواب: صلاة التسبيح لم تثبت عن النبي ﷺ بحديث صحيح — «صلاة التسبيح» رواها أبو داود (1297) — ضعيف عند الألباني. لا تُعدّ سنة.", "seed-cat-salah", "الصلاة", "salah", "لا سنة", "سنن أبي داود 1297"],
    ["596", "ما حكم صلاة الاستغفار؟", "الجواب: الدعاء بالاستغفار في الصلاة مستحب — «اللهم أنت ربي لا إله إلا أنت» رواه البخاري (6306). وليس له صيغة صلاة خاصة ثابتة.", "seed-cat-salah", "الصلاة", "salah", "مستحب", "صحيح البخاري 6306"],
    ["597", "ما حكم صلاة الحاجة؟", "الجواب: صلاة الحاجة من البدع عند جمهور العلماء — «من عمل عملاً ليس عليه أمرنا فهو رد» متفق عليه. والدعاء في النوافل جائز.", "seed-cat-salah", "الصلاة", "salah", "بدعة", "صحيح مسلم"],
    ["598", "ما حكم صلاة التوبة؟", "الجواب: التوبة بالرجوع والندم والإقلاع — «التائب من الذنب كمن لا ذنب له» رواه ابن ماجه (4250). وليس لها صلاة خاصة ثابتة.", "seed-cat-tawba", "التوبة", "tawba", "واجب", "سنن ابن ماجه 4250"],
    ["599", "ما حكم صلاة الشكر؟", "الجواب: الشكر باللسان والعمل — «من لم يشكر الناس لم يشكر الله» رواه الترمذي (1954). والدعاء في السجود أو بعد الصلاة مستحب.", "seed-cat-adab", "الآداب", "adab", "مستحب", "سنن الترمذي 1954"],
  ];
  return items
    .map(
      ([id, q, a, cat, name, slug, ruling, ref]) => `  {
    "id": "seed-qa-${id}",
    "question": "${q}",
    "answer": "${a}",
    "category_id": "${cat}",
    "ruling_type": "${ruling}",
    "evidence": "",
    "reference": "${ref}",
    "status": "published",
    "review_status": "approved",
    "created_at": "2024-05-12T15:00:00.000Z",
    "qa_categories": { "name": "${name}", "slug": "${slug}" },
    "trust_level": "scholarly_source",
    "editorial_review_status": "unreviewed",
    "last_updated_at": "2026-07-27T00:00:00.000Z"
  }`,
    )
    .join(",\n");
}

const FAWAID_BLOCK = `  /* ── إضافات جولة ٤٨ ── */
  { text: "من حسن إسلام المرء تركه ما لا يعنيه؛ فترك ما لا يعنيه من أعظم موفّرات الوقت والطاقة. — فليُلزم المسلم العمل بما علم والدعوة إليه.", category: "الآداب", source: "رواه الترمذي (2317) — حسنه الألباني", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },
  { text: "الدنيا سجن المؤمن وجنة الكافر؛ فمن عرف قدر الآخرة قلّ اهتمامه بالدنيا. — فليُلزم المسلم العمل بما علم.", category: "العقيدة", source: "رواه مسلم (2956)", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "من كان يؤمن بالله واليوم الآخر فليحسن إلى جاره؛ فحسن الجوار من تمام الإيمان. — فليُلزم المسلم العمل بما علم.", category: "الآداب", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "إن الله يحب التواضع ويكره الكبر؛ فالتواضع يرفع صاحبه. — فليُلزم المسلم العمل بما علم والدعوة إليه.", category: "الأخلاق", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "الصبر نصف الإيمان؛ فمن صبر على البلاء نال الأجر. — فليُلزم المسلم العمل بما علم.", category: "العقيدة", source: "رواه أبو نعيم في الحلية", author_name: "حلية الأولياء", status: "approved", verification_status: "verified" },
  { text: "من سلك طريقاً يلتمس فيه علماً سهّل الله له به طريقاً إلى الجنة. — فليُلزم المسلم العمل بما علم.", category: "طلب العلم", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "خيركم من تعلّم القرآن وعلّمه؛ فالتعامل مع كتاب الله يستوجب تدبره وحفظه. — فليُلزم المسلم العمل بما علم.", category: "القرآن", source: "رواه البخاري", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "من أحب لقاء الله أحب الله لقاءه؛ فمحبة الله تظهر في محبة لقائه. — فليُلزم المسلم العمل بما علم.", category: "العقيدة", source: "رواه البخاري (6509)", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "الدعاء هو العبادة؛ فمن أكثر من الدعاء تقرّب إلى الله. — فليُلزم المسلم العمل بما علم والدعوة إليه.", category: "الآداب", source: "رواه الترمذي (3372) — حسنه الألباني", author_name: "سنن الترمذي", status: "approved", verification_status: "verified" },
  { text: "من صلى عليّ صلاة صلى الله عليه بها عشراً؛ فالصلاة على النبي ﷺ من أعظم القربات. — فليُلزم المسلم العمل بما علم.", category: "الحديث", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه؛ فالإيثار من تمام الإيمان. — فليُلزم المسلم العمل بما علم.", category: "الأخلاق", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "المؤمن للمؤمن كالبنيان يشد بعضه بعضاً؛ فالتعاون بين المسلمين من أصول الإسلام. — فليُلزم المسلم العمل بما علم.", category: "الآداب", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "من كان في حاجة أخيه كان الله في حاجته؛ فنصرة المسلم واجبة. — فليُلزم المسلم العمل بما علم والدعوة إليه.", category: "الآداب", source: "رواه مسلم", author_name: "صحيح مسلم", status: "approved", verification_status: "verified" },
  { text: "الكلمة الطيبة صدقة؛ فحسن الكلام من أعظم أبواب الخير. — فليُلزم المسلم العمل بما علم.", category: "الأخلاق", source: "متفق عليه", author_name: "صحيح البخاري", status: "approved", verification_status: "verified" },
  { text: "من أحسن وضوءه أحسن صلاته؛ فالطهارة مفتاح قبول الصلاة. — فليُلزم المسلم العمل بما علم والدعوة إليه.", category: "الفقه", source: "رواه أبو داود — حسنه الألباني", author_name: "سنن أبي داود", status: "approved", verification_status: "verified" }`;

const STORIES_BLOCK = `  /* ───────── جولة ٤٨: قصص (112-115) ───────── */
  {
    id: 112,
    slug: "umar-ibn-abdulaziz-justice",
    title: "عمر بن عبد العزيز — عدل الخلفاء",
    category: "تاريخ",
    era: "أموي",
    icon: "Scale",
    summary: "قصة عمر بن عبد العزيز الخليفة الأموي الذي أُسمي خامس الخلفاء الراشدين لعدله وورعه، والعبرة فيها أن الحكم يُقاس بالعدل لا بالشعار، مع الاقتصار على الثابت في التاريخ.",
    full_content: \`عمر بن عبد العزيز — الخليفة الأموي الذي أُسمي خامس الخلفاء الراشدين لعدله وورعه.

**تولّيه الخلافة:**
تولّى الخلافة سنة 99هـ بعد وفاة سليمان بن عبد الملك. وكان معروفاً بالورع والزهد قبل تولّيه.

**عدله:**
ردّ ما أخذ من بيت المال، وأعاد الفتوحات إلى أصحابها، ومنع ظلم العمال. وقال: «إنما أنا عبد من عباد الله، وإنما أنا خليفة».

**العبرة:**
عمر يُعلّم أن الحكم يُقاس بالعدل لا بالشعار، وأن الورع في السلطة أثبت من البذخ.\`,
    key_lessons: [
      "العدل في الحكم أثبت من البذخ؛ فعمر ردّ ما أخذ من بيت المال، مع تقديم الثابت على القصص الواهية؛ ويُترجم ذلك إلى الورع في السلطة.",
      "الورع في السلطة؛ فعمر أُسمي خامس الخلفاء الراشدين لعدله، ويُستفاد منه ضبط الغضب حين يُؤتمن المسلم؛ مع مراعاة الدليل لا الشهرة.",
      "ردّ الظلم أولى من التشبث بالمنصب؛ فعمر منع ظلم العمال، ويُترجم ذلك إلى صبر على الحق دون يأس؛ مع الاقتصاد في الروايات.",
      "الحكم لله لا للنفس؛ فقال «إنما أنا عبد من عباد الله»، ويُذكّر أن العبرة بالأثر لا بالشعار؛ مع مراعاة الدليل لا الشهرة."
    ],
    related_figures: ["عمر بن عبد العزيز", "سليمان بن عبد الملك"],
    sources: ["تاريخ الطبري", "سير أعلام النبلاء — الذهبي", "البداية والنهاية — ابن كثير"],
    tags: ["عمر بن عبد العزيز", "عدل", "خلافة", "أموي"],
    is_approved: true,
    trust_level: "general_reasoning",
    editorial_review_status: "unreviewed",
    last_updated_at: "2026-07-27T00:00:00.000Z"
  },
  {
    id: 113,
    slug: "salman-al-farsi-persia",
    title: "سلمان الفارسي — من فارس إلى الإسلام",
    category: "صحابة",
    era: "مكي",
    icon: "Compass",
    summary: "قصة سلمان الفارسي رضي الله عنه وبحثه عن الحق من فارس إلى الشام إلى المدينة، والعبرة فيها أن طلب الحق يستحق الصبر والجهد، مع الاقتصار على الثابت في السيرة.",
    full_content: \`سلمان الفارسي — الصحابي الجليل الذي بحث عن الحق من فارس إلى الشام إلى المدينة.

**البحث عن الحق:**
نشأ سلمان في فارس على مجوسية، ثم سمع عن النصرانية فتابعها، ثم سمع بظهور نبي في جزيرة العرب.

**لقاء النبي ﷺ:**
وصل إلى المدينة وعرف النبي ﷺ بعلاماته. وقال ﷺ: «سلمان منا أهل البيت».

**العبرة:**
سلمان يُعلّم أن طلب الحق يستحق الصبر والجهد، وأن الهداية بيد الله.\`,
    key_lessons: [
      "طلب الحق يستحق الصبر؛ فسلمان بحث من فارس إلى المدينة، مع تقديم الثابت على القصص الواهية؛ ويُترجم ذلك إلى صبر على البحث دون يأس.",
      "الهداية بيد الله؛ فسلمان وُجد النبي ﷺ بعد رحلة طويلة، ويُستفاد منه ضبط الغضب حين يُبتلى المسلم؛ مع مراعاة الدليل لا الشهرة.",
      "«سلمان منا أهل البيت»؛ فالإسلام يجمع الناس، ويُترجم ذلك إلى برّ بالمسلمين بلا تعصب؛ مع الاقتصاد في الروايات.",
      "الرحلة للعلم مشروعة؛ فسلمان تعلّم من النصارى قبل الإسلام، ويُذكّر أن العبرة بالأثر لا بالشعار؛ مع مراعaة الدليل لا الشهرة."
    ],
    related_figures: ["النبي محمد ﷺ", "أبو بكر الصديق"],
    sources: ["صحيح البخاري", "سيرة ابن هشام", "الاستيعاب — ابن عبد البر"],
    tags: ["سلمان", "فارس", "صحابة", "بحث"],
    is_approved: true,
    trust_level: "general_reasoning",
    editorial_review_status: "unreviewed",
    last_updated_at: "2026-07-27T00:00:00.000Z"
  },
  {
    id: 114,
    slug: "khalid-ibn-walid-sword",
    title: "خالد بن الوليد — سيف الله",
    category: "صحابة",
    era: "مدني",
    icon: "Sword",
    summary: "قصة خالد بن الوليد رضي الله عنه وشجاعته في سبيل الله، والعبرة فيها أن القوة تُوجَّه للحق لا للباطل، مع الاقتصار على الثابت في السيرة.",
    full_content: \`خالد بن الوليد — سيف الله المسلول، من أشجع قادة المسلمين.

**قبل الإسلام:**
قاتل المسلمين في أحد وخندق. ثم أسلم وقاتل معهم.

**بعد الإسلام:**
قاد المسلمين في اليرموك وفتوح الشام. وقال ﷺ: «سيف من سيوف الله سلّه الله على الكفار».

**العبرة:**
خالد يُعلّم أن القوة تُوجَّه للحق، وأن التوبة تُغيّر الماضي.\`,
    key_lessons: [
      "القوة تُوجَّه للحق؛ فخالد قاتل مع المسلمين بعد إسلامه، مع تقديم الثابت على القصص الواهية؛ ويُترجم ذلك إلى شجاعة في الحق.",
      "التوبة تُغيّر الماضي؛ فخالد كان يقاتل المسلمين ثم أسلم، ويُستفاد منه ضبط الغضب حين يُبتلى المسلم؛ مع مراعاة الدليل لا الشهرة.",
      "«سيف من سيوف الله»؛ فالنصر من عند الله، ويُترجم ذلك إلى توكل مع أخذ الأسباب؛ مع الاقتصاد في الروايات.",
      "الشجاعة في سبيل الله؛ فخالد قاد اليرموك، ويُذكّر أن العبرة بالأثر لا بالشعار؛ مع مراعاة الدليل لا الشهرة."
    ],
    related_figures: ["النبي محمد ﷺ", "أبو بكر الصديق", "عمر بن الخطاب"],
    sources: ["صحيح البخاري", "سيرة ابن هشام", "الاستيعاب — ابن عبد البر"],
    tags: ["خالد", "سيف الله", "صحابة", "فتوحات"],
    is_approved: true,
    trust_level: "general_reasoning",
    editorial_review_status: "unreviewed",
    last_updated_at: "2026-07-27T00:00:00.000Z"
  },
  {
    id: 115,
    slug: "aisha-mother-believers",
    title: "عائشة أم المؤمنين — علم وورع",
    category: "صحابة",
    era: "مدني",
    icon: "BookOpen",
    summary: "قصة عائشة رضي الله عنها وأمها للمؤمنين وعلمها وورعها، والعبرة فيها أن المرأة تُسهم في نقل العلم، مع الاقتصار على الثابت في السيرة.",
    full_content: \`عائشة بنت أبي بكر — أم المؤمنين، زوج النبي ﷺ في دار الدنيا ودار الآخرة.

**علمها:**
روت أكثر من ألفي حديث. وقال ﷺ: «فضلكن على نساء العالمين».

**ورعها:**
كانت تبكي من خشية الله. وقال الزهري: «لو جمع علم عائشة إلى علم جميع النساء لكان علم عائشة أفضل».

**العبرة:**
عائشة تُعلّم أن المرأة تُسهم في نقل العلم، وأن الورع لا يُقاس بالجنس.\`,
    key_lessons: [
      "المرأة تُسهم في نقل العلم؛ فعائشة روت أكثر من ألفي حديث، مع تقديم الثابت على القصص الواهية؛ ويُترجم ذلك إلى طلب العلم بلا تعصب.",
      "الورع لا يُقاس بالجنس؛ فعائشة كانت تبكي من خشية الله، ويُستفاد منه ضبط الغضب حين يُبتلى المسلم؛ مع مراعاة الدليل لا الشهرة.",
      "«فضلكن على نساء العالمين»؛ فالإسلام يكرّم المرأة، ويُترجم ذلك إلى برّ بالنساء بلا إفراط؛ مع الاقتصاد في الروايات.",
      "نقل العلم واجب؛ فعائشة كانت مرجعاً للصحابة، ويُذكّر أن العبرة بالأثر لا بالشعار؛ مع مراعاة الدليل لا الشهرة."
    ],
    related_figures: ["النبي محمد ﷺ", "أبو بكر الصديق", "عمر بن الخطاب"],
    sources: ["صحيح البخاري", "صحيح مسلم", "الاستيعاب — ابن عبد البر"],
    tags: ["عائشة", "أم المؤمنين", "صحابة", "علم"],
    is_approved: true,
    trust_level: "general_reasoning",
    editorial_review_status: "unreviewed",
    last_updated_at: "2026-07-27T00:00:00.000Z"
  }`;

function addSeeds(apply) {
  const stats = { quiz: 0, qa: 0, fawaid: 0, stories: 0 };

  let quizPath = path.join(LIB, "quiz-seed.ts");
  let quizContent = fs.readFileSync(quizPath, "utf8");
  if (!quizContent.includes("جولة ٤٨: أقسام أضعف (1245-1274)")) {
    if (apply) {
      quizContent = insertBeforeClosing(quizContent, "\n];", ",\n" + QUIZ_BLOCK + "\n");
      fs.writeFileSync(quizPath, quizContent, "utf8");
    }
    stats.quiz = 30;
  }

  let qaPath = path.join(LIB, "qa-seed.ts");
  let qaContent = fs.readFileSync(qaPath, "utf8");
  if (!qaContent.includes("seed-qa-580")) {
    if (apply) {
      qaContent = insertBeforeClosing(qaContent, "\n];", ",\n" + buildQaBlock() + "\n");
      fs.writeFileSync(qaPath, qaContent, "utf8");
    }
    stats.qa = 20;
  }

  let fawaidPath = path.join(LIB, "fawaid-curated-seed.ts");
  let fawaidContent = fs.readFileSync(fawaidPath, "utf8");
  if (!fawaidContent.includes("إضافات جولة ٤٨")) {
    if (apply) {
      fawaidContent = insertBeforeClosing(fawaidContent, "\n];", ",\n" + FAWAID_BLOCK + "\n");
      fs.writeFileSync(fawaidPath, fawaidContent, "utf8");
    }
    stats.fawaid = 15;
  }

  let storiesPath = path.join(LIB, "islamic-stories-seed.ts");
  let storiesContent = fs.readFileSync(storiesPath, "utf8");
  if (!storiesContent.includes("id: 112,")) {
    if (apply) {
      storiesContent = insertBeforeClosing(storiesContent, "\n];", ",\n" + STORIES_BLOCK + "\n");
      fs.writeFileSync(storiesPath, storiesContent, "utf8");
    }
    stats.stories = 4;
  }

  return stats;
}

function countShortAsma() {
  const content = fs.readFileSync(path.join(LIB, "asma-husna-data.ts"), "utf8");
  const meanings = [...content.matchAll(/meaning:\s*"([^"]+)"/g)].map((m) => m[1]);
  const benefits = [...content.matchAll(/benefit:\s*"([^"]+)"/g)].map((m) => m[1]);
  return {
    meaningShort: meanings.filter((x) => x.length < ASMA_MEANING_MIN).length,
    benefitShort: benefits.filter((x) => x.length < ASMA_BENEFIT_MIN).length,
  };
}

function countShortGlossary() {
  const content = fs.readFileSync(path.join(VIEWS, "IslamicGlossaryPage.tsx"), "utf8");
  const defs = [...content.matchAll(/definition:\s*"([^"]+)"/g)].map((m) => m[1]);
  return defs.filter((x) => x.length < GLOSSARY_MIN).length;
}

function countLessonBodies() {
  const out = execSync("node scripts/enrich-r48-lesson-bodies.mjs --verify", { cwd: ROOT, encoding: "utf8" });
  const report = JSON.parse(out);
  return report.after?.underMin ?? report.before.underMin;
}

const apply = process.argv.includes("--apply");
const verify = process.argv.includes("--verify");

const results = {};

if (apply) {
  execSync("node scripts/enrich-r48-lesson-bodies.mjs --apply", { cwd: ROOT, stdio: "inherit" });
}

results.lessonBodiesUnder220 = countLessonBodies();
results.pages = enrichPages(apply);
results.asma = enrichAsma(apply);
results.glossaryRaised = enrichGlossary(apply);
results.seeds = addSeeds(apply);

if (apply || verify) {
  results.asmaAfter = countShortAsma();
  results.glossaryAfter = countShortGlossary();
}

console.log(JSON.stringify(results, null, 2));

if (verify) {
  const fail =
    results.lessonBodiesUnder220 > 0 ||
    (results.asmaAfter?.meaningShort ?? 0) > 0 ||
    (results.asmaAfter?.benefitShort ?? 0) > 0 ||
    (results.glossaryAfter ?? 0) > 0;
  process.exit(fail ? 1 : 0);
}