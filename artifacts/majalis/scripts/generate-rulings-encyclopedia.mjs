#!/usr/bin/env node
/**
 * Generates موسوعة الأحكام JSON chunks from trusted in-repo sources.
 * Does NOT invent fatwas — only transforms documented seed content + curated registry.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { CONTENT_CURRICULUM_ENABLED } from "../lib/content-flags.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.resolve(ROOT, "content/archive/rulings-encyclopedia/data");
const SEED_ARCHIVE = path.resolve(ROOT, "content/archive/rulings-encyclopedia/seeds");
const CHUNKS_DIR = path.resolve(OUT_DIR, "chunks");

// طابع وقت ثابت للسجلات التي لا يحمل مصدرها أي تاريخ. ثابت مقصود (لا new Date())
// حتى يكون توليد الموسوعة حتميًا: نفس المدخلات ⇒ نفس المخرجات بايتًا ببايت.
const FALLBACK_TIMESTAMP = "2026-07-25T00:00:00.000Z";

const QA_FIQH_SLUGS = new Set(["tahara", "salah", "zakat", "sawm", "hajj", "aqeedah", "adhkar", "adab", "quran", "hadith"]);

const QA_CAT_MAP = {
  tahara: { category: "الطهارة", subcategory: "أحكام الطهارة" },
  salah: { category: "الصلاة", subcategory: "أحكام الصلاة" },
  zakat: { category: "الزكاة", subcategory: "زكاة المال" },
  sawm: { category: "الصيام", subcategory: "صيام رمضان" },
  hajj: { category: "الحج والعمرة", subcategory: "أحكام الحج" },
  aqeedah: { category: "العقيدة", subcategory: "الإيمان" },
  quran: { category: "القرآن والحديث", subcategory: "أحكام القرآن" },
  hadith: { category: "القرآن والحديث", subcategory: "أحكام الحديث" },
  adhkar: { category: "الأذكار والدعاء", subcategory: "الأذكار" },
  adab: { category: "الأخلاق والآداب", subcategory: "الآداب" },
};

const LEGACY_CAT = {
  العقيدة: "العبادات",
  الطهارة: "الطهارة",
  الصلاة: "الصلاة",
  الزكاة: "الزكاة",
  الصيام: "الصيام",
  "الحج والعمرة": "الحج",
  المعاملات: "المعاملات",
  "الأطعمة والأشربة": "المعاملات",
  "اللباس والزينة": "البيوت",
  الأسرة: "الأسرة",
  "المواريث والوصايا": "المواريث",
  "القضاء والحدود": "القضاء",
  "الأيمان والنذور": "العبادات",
  "الجهاد والسياسة الشرعية": "السياسة الشرعية",
  "الأخلاق والآداب": "البيوت",
  "الأذكار والدعاء": "العبادات",
  "القرآن والحديث": "العبادات",
  "طلب العلم والدعوة": "العبادات",
  "النوازل المعاصرة": "النوازل",
  الجنائز: "العبادات",
};

function slugify(s) {
  return createHash("md5").update(s).digest("hex").slice(0, 12);
}

function readTsExport(filePath, exportName) {
  const src = fs.readFileSync(filePath, "utf8");
  const marker = `export const ${exportName}`;
  const start = src.indexOf(marker);
  if (start < 0) return [];
  const eq = src.indexOf("=", start);
  const arrStart = src.indexOf("[", eq);
  let depth = 0;
  for (let i = arrStart; i < src.length; i++) {
    if (src[i] === "[") depth++;
    if (src[i] === "]") {
      depth--;
      if (depth === 0) {
        return JSON.parse(
          src
            .slice(arrStart, i + 1)
            .replace(/(\w+):/g, '"$1":')
            .replace(/,\s*]/g, "]")
            .replace(/'/g, '"'),
        );
      }
    }
  }
  return [];
}

function parseSeedArray(filePath, exportName) {
  const src = fs.readFileSync(filePath, "utf8");
  const re = new RegExp(`export const ${exportName}[^=]*=\\s*(\\[[\\s\\S]*?\\n\\]);`, "m");
  const m = src.match(re);
  if (!m) return [];
  return eval(`(${m[1]})`);
}

function splitEvidence(text, reference) {
  const evidence = [];
  if (text) {
    if (/سورة|آية|قوله تعالى|قرآن/i.test(text)) {
      evidence.push({ type: "قرآن", text, source: reference || undefined });
    } else if (/رواه|حديث|ﷺ/i.test(text)) {
      evidence.push({ type: "حديث", text, source: reference || undefined });
    } else {
      evidence.push({ type: "دليل", text, source: reference || undefined });
    }
  }
  return evidence;
}

/**
 * مصادر «ذاتية» — المنصة نفسها ليست مصدرًا خارجيًا يُعتمد عليه في التوثيق.
 * أي مرجع يطابق هذه الأنماط لا يُحتسب مصدرًا خارجيًا.
 */
const SELF_SOURCE_RE = /سُنّة|المجمع الفقهي — مسائل فقهية|qa-seed|fawaid-seed|rulings-seed|fatwa-seed|fiqh-issues-seed|quiz_questions/i;

function hasExternalSource(partial) {
  const refs = [...(partial.references || []), ...(partial.evidence || [])];
  return refs.some((r) => {
    if (!r) return false;
    const text = `${r.source || ""} ${r.text || ""}`.trim();
    if (!text) return false;
    return !SELF_SOURCE_RE.test(text);
  });
}

/**
 * لا يُوسم أي سجل «approved» إلا إذا راجعه إنسان مُسمّى (reviewed_by + reviewed_at)
 * وكان له مصدر خارجي غير ذاتي. وإلا فهو «pending_review».
 */
function resolveReviewState(partial) {
  const reviewedBy = partial.reviewed_by || null;
  const reviewedAt = partial.reviewed_at || null;
  const approved = Boolean(reviewedBy && reviewedAt && hasExternalSource(partial));
  return {
    reviewed_by: reviewedBy,
    reviewed_at: reviewedAt,
    status: approved ? "approved" : "pending_review",
    verification_status: approved ? "approved" : "pending_review",
  };
}


/** وسمُ موضع الآية الذي يلي ﴾ مباشرةً: [البقرة: ٤٣] أو [النساء: ٤٨ و١١٦] */
const AYAH_TAG_RE = /^\s*\[[^\[\]]+?:\s*[٠-٩0-9\sو-]+\]/;

/**
 * اقتطاع ملخص عند حدود كلمة عربية/مسافة — يمنع بتر منتصف كلمة.
 *
 * ويمنع كذلك **بتر الآية نفسها**: القطعُ عند حدِّ كلمةٍ قد يقع داخل ﴿…﴾
 * فيُعرَض المصحفُ ناقصًا بلا ﴾ تُغلقه (﴿لَّا يَمَسُّهُ إِلَّا الْمُ…). فإن
 * وقع القطعُ داخل اقتباس: يُمَدُّ الاقتطاعُ حتى ينغلقَ الاقتباسُ بـ﴾ ومعه
 * وسمُ موضعه إن تلاه، فإن لم يوجد إغلاقٌ في النصّ أصلًا رُدَّ القطعُ إلى ما
 * قبل ﴿ فلا يُعرَض شطرُ آية. والزيادةُ في الطول مقصودةٌ: تمامُ الآية أولى
 * من التزام الحدّ.
 */
function summarizeText(text, max = 160) {
  const s = String(text || "").trim();
  if (s.length <= max) return s;
  const slice = s.slice(0, max);
  const breakAt = Math.max(slice.lastIndexOf(" "), slice.lastIndexOf("،"), slice.lastIndexOf("؛"), slice.lastIndexOf("."));
  let cut = breakAt >= Math.floor(max * 0.6) ? breakAt : max;

  // وقع القطعُ داخل ﴿…﴾؟ (عددُ ﴿ قبله يزيد على عدد ﴾)
  const opens = (t) => (t.match(/﴿/g) || []).length - (t.match(/﴾/g) || []).length;
  if (opens(s.slice(0, cut)) > 0) {
    const close = s.indexOf("﴾", cut);
    if (close < 0) {
      cut = s.lastIndexOf("﴿", cut);          // لا إغلاقَ في النصّ ⇒ اطرح الشطر
    } else {
      cut = close + 1;
      const tag = AYAH_TAG_RE.exec(s.slice(cut));
      if (tag) cut += tag[0].length;
    }
  }
  const out = s.slice(0, cut).trimEnd();
  return cut >= s.trimEnd().length ? out : out + "…";
}

function makeRuling(partial) {
  const category = partial.category;
  const refs = partial.references || [];
  const evidence = partial.evidence || [];
  const quran = partial.quran_evidence || [];
  const sunnah = partial.sunnah_evidence || [];
  const hasRef = refs.length > 0 || evidence.length > 0 || quran.length > 0 || sunnah.length > 0;
  if (!partial.title || !partial.body || !hasRef) return null;

  const review = resolveReviewState(partial);
  const id = partial.external_key || `ruling-${slugify(partial.title)}`;
  return {
    id,
    external_key: id,
    title: partial.title,
    summary: partial.summary || summarizeText(partial.body, 160),
    body: partial.body,
    category,
    subcategory: partial.subcategory,
    subcategories: partial.subcategories || (partial.subcategory ? [partial.subcategory] : []),
    quran_evidence: partial.quran_evidence || [],
    sunnah_evidence: partial.sunnah_evidence || [],
    scholar_opinions: partial.scholar_opinions || [],
    prevailing_view: partial.prevailing_view,
    evidence: partial.evidence || [],
    references: refs,
    hadith_grade: partial.hadith_grade,
    keywords: partial.keywords || [],
    benefits: partial.benefits || [],
    importance_score: partial.importance_score ?? 50,
    // عدّادات التفاعل تبدأ من صفر دائمًا. أي رقم قادم من البذور أرقامٌ ملفّقة
    // (لا تُقاس من استخدام حقيقي) وكانت تُبثّ إلى schema.org — فلا تُمرَّر.
    popularity_score: 0,
    view_count: 0,
    search_count: 0,
    status: review.status,
    verification_status: review.verification_status,
    reviewed_by: review.reviewed_by,
    reviewed_at: review.reviewed_at,
    provenance: partial.provenance || "seed_transform",
    source_origin: partial.source_origin,
    linked_qa_ids: partial.linked_qa_ids || [],
    linked_fatwa_ids: partial.linked_fatwa_ids || [],
    linked_fiqh_ids: partial.linked_fiqh_ids || [],
    // التواريخ تشتقّ من بيانات المصدر لا من لحظة البناء: كانت new Date() تكتب
    // طابع وقت البناء على الحقول الثلاثة في كل بناء، فتُظهر صفحة الحكم
    // (RulingDetailPage) «آخر تحديث» = آخر مرة بُني فيها الموقع لا آخر تعديل
    // فعلي على الحكم — معلومة مضلِّلة على منصة علمية، وتُحدث ضجيج diff في كل بناء.
    published_at: partial.created_at || partial.published_at || FALLBACK_TIMESTAMP,
    created_at: partial.created_at || partial.published_at || FALLBACK_TIMESTAMP,
    updated_at: partial.updated_at || partial.created_at || partial.published_at || FALLBACK_TIMESTAMP,
  };
}

// ملاحظة حوكمة: أُزيلت decomposeListRuling() — كانت تُقطّع القوائم المرقّمة إلى «أحكام»
// مستقلة، فيرث كل بندٍ دليلَ الأصل، ما أنتج نسبة أدلة خاطئة. لا يجوز تصنيع أحكام بالتقطيع.

// عنوان الحكم من سؤال البذرة. كان `question.replace(/^ما |^هل |^من /,"").replace(/\?$/,"")`
// وفيه عطبان:
// (١) `/\?$/` علامة استفهام غربية، وأسئلة البذور تنتهي بالعربية (؟ U+061F) ⇒ لم تُحذف
//     قط، فبقي ٣٥٤٣ عنوانًا من ٣٧١١ خبرًا منتهيًا بعلامة سؤال («حكم الغيبة في الإسلام؟»).
// (٢) والأخطر: نزع «هل» يقلب سؤال التصور خبرًا يقرّر نقيض ما يقرره الحكم نفسه —
//     «هل المزاح يبيح الكذب؟» ⇒ «المزاح يبيح الكذب»، و«هل ثبت تحديد يوم مولد النبي ﷺ
//     قطعًا؟» ⇒ «ثبت … قطعًا» والجواب: لم يثبت. ٣٩٣ سؤالًا بهذه الصورة.
// فالقاعدة: «ما/من» وحدهما تُنزعان (يبقى مركّب اسمي صالح عنوانًا) ومعهما علامة
// الاستفهام؛ وما عداهما (هل/كيف/متى/…) يبقى سؤالًا تامًّا بعلامته.
function qaTitleFromQuestion(question) {
  const stripped = question.replace(/^(?:ما|من) /, "");
  if (stripped === question) return question.trim();
  return stripped.replace(/[?؟]\s*$/, "").trim();
}

function loadQaSeedFromJson() {
  const base = path.resolve(ROOT, "public/data/qa");
  const manifestPath = path.join(base, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    // تراجع للملف القديم إن وُجدت مصفوفة قديمة (مسارات التوليد التاريخية فقط)
    return parseSeedArray(path.resolve(ROOT, "src/lib/qa-seed.ts"), "SEED_QA");
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  return (manifest.chunks || []).flatMap((c) => {
    const file = path.join(base, c.file);
    if (!fs.existsSync(file)) return [];
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return Array.isArray(data) ? data : [];
  });
}

function fromQaSeed() {
  const items = loadQaSeedFromJson();
  return items
    .map((q) => {
      const slug = q.qa_categories?.slug || "";
      const catInfo = QA_CAT_MAP[slug] || { category: "طلب العلم والدعوة", subcategory: "طلب العلم" };
      const question = q.question;
      const answer = (q.answer || "").replace(/^الجواب:\s*/, "");
      const ev = q.evidence;
      const ref = q.reference;
      const quran = ev && /سورة|آية|قرآن|قوله تعالى/i.test(ev) ? splitEvidence(ev, ref) : [];
      const sunnah = ev && /حديث|رواه|ﷺ/i.test(ev) ? splitEvidence(ev, ref) : [];
      const evidenceArr = ev ? splitEvidence(ev, ref) : [];
      const refs = ref
        ? [{ text: ref, source: ref }]
        : [{ text: "سُنّة — الأسئلة والأجوبة", source: "qa-seed" }];

      return makeRuling({
        external_key: `qa-ruling-${q.id}`,
        title: qaTitleFromQuestion(question),
        summary: summarizeText(answer, 160),
        body: `**السؤال:** ${question}\n\n**الجواب:** ${answer}`,
        category: catInfo.category,
        subcategory: catInfo.subcategory,
        prevailing_view: q.ruling_type || undefined,
        quran_evidence: quran,
        sunnah_evidence: sunnah,
        evidence: evidenceArr.length ? evidenceArr : refs,
        references: refs,
        keywords: [catInfo.subcategory, slug, q.qa_categories?.name].filter(Boolean),
        source_origin: "qa-seed",
        linked_qa_ids: [q.id],
        importance_score: ev ? 70 : 50,
      });
    })
    .filter(Boolean);
}

function fromFiqhIssuesSeed() {
  try {
    const items = parseSeedArray(path.resolve(ROOT, "src/lib/fiqh-issues-seed.ts"), "FIQH_ISSUES_PUBLISHED_SEED");
    return items
      .map((issue) =>
        makeRuling({
          external_key: `issue-ruling-${issue.slug || issue.id}`,
          title: issue.title,
          summary: issue.ruling_summary || issue.summary,
          body: `${issue.description || issue.summary}\n\n**الحكم:** ${issue.ruling_summary || ""}\n\n**الأدلة:** ${issue.evidence_summary || ""}`,
          category: "النوازل المعاصرة",
          subcategory: issue.subcategory || "التقنية",
          references: [{ text: "المجمع الفقهي — مسائل فقهية", source: issue.category }],
          keywords: [issue.category, issue.subcategory].filter(Boolean),
          source_origin: "fiqh-issues-seed",
          linked_fiqh_ids: [issue.id],
          importance_score: 78,
        }),
      )
      .filter(Boolean);
  } catch {
    return [];
  }
}

function fromFawaidSeed() {
  try {
    const src = fs.readFileSync(path.resolve(ROOT, "src/lib/fawaid-seed.ts"), "utf8");
    const re = /"title":\s*"((?:\\.|[^"\\])*)"[\s\S]*?"body":\s*"((?:\\.|[^"\\])*)"[\s\S]*?"category":\s*"((?:\\.|[^"\\])*)"/g;
    const out = [];
    let m;
    while ((m = re.exec(src))) {
      const [, title, body, category] = m;
      if (category !== "فوائد فقهية") continue;
      const unesc = (s) => s.replace(/\\"/g, '"').replace(/\\n/g, "\n");
      out.push(
        makeRuling({
          external_key: `fawaid-ruling-${slugify(unesc(title))}`,
          title: unesc(title),
          summary: summarizeText(unesc(body), 160),
          body: unesc(body),
          category: "طلب العلم والدعوة",
          subcategory: "طلب العلم",
          references: [{ text: "فوائد فقهية — سُنّة", source: "fawaid-seed" }],
          keywords: ["فوائد", "فقه"],
          source_origin: "fawaid-seed",
          importance_score: 55,
        }),
      );
    }
    return out.filter(Boolean);
  } catch {
    return [];
  }
}

function fromRulingsSeed() {
  const items = parseSeedArray(path.resolve(SEED_ARCHIVE, "rulings-seed.ts"), "RULINGS_SEED");
  const out = [];
  for (const r of items) {
    const base = makeRuling({
      ...r,
      source_origin: "rulings-seed",
      importance_score: 85,
    });
    if (base) out.push(base);
  }
  return out.filter(Boolean);
}

function fromFiqhCouncilSeed() {
  const src = fs.readFileSync(path.resolve(ROOT, "src/lib/fiqh-council-seed.ts"), "utf8");
  const re = /id:\s*"([^"]+)"[\s\S]*?title:\s*"((?:\\.|[^"\\])*)"[\s\S]*?ruling_text:\s*`([\s\S]*?)`[\s\S]*?category:\s*"([^"]+)"[\s\S]*?source_name:\s*"([^"]*)"/g;
  const out = [];
  let m;
  while ((m = re.exec(src))) {
    const [, id, title, rulingText, category, sourceName] = m;
    const catMap = {
      "الاقتصاد الإسلامي": { category: "النوازل المعاصرة", subcategory: "الاقتصاد" },
      "الطب والنوازل": { category: "النوازل المعاصرة", subcategory: "الطب" },
      "الزكاة والوقف": { category: "الزكاة", subcategory: "زكاة المال" },
      "الحج والعمرة": { category: "الحج والعمرة", subcategory: "أحكام الحج" },
    };
    const cat = catMap[category] || { category: "النوازل المعاصرة", subcategory: "التقنية" };
    out.push(
      makeRuling({
        external_key: `fiqh-ruling-${id}`,
        title,
        summary: summarizeText(rulingText, 160),
        body: rulingText,
        category: cat.category,
        subcategory: cat.subcategory,
        references: [{ text: sourceName, source: "المجمع الفقهي" }],
        source_origin: "fiqh-council-seed",
        linked_fiqh_ids: [id],
        importance_score: 80,
      }),
    );
  }
  return out.filter(Boolean);
}

// ملاحظة حوكمة: أُزيلت fromQuizCsv() — أسئلة المسابقة (data/quiz_questions.csv)
// ليست أحكامًا شرعية ولا يجوز تحويلها إلى سجلات في موسوعة الأحكام.

function fromCurriculumRegistry() {
  if (!CONTENT_CURRICULUM_ENABLED) return [];
  const regPath = path.resolve(
    ROOT,
    "content/archive/rulings-encyclopedia/source/curriculum-topics.json",
  );
  if (!fs.existsSync(regPath)) return [];
  const topics = JSON.parse(fs.readFileSync(regPath, "utf8"));
  return topics
    .map((t) =>
      makeRuling({
        external_key: t.external_key,
        title: t.title,
        summary: t.summary,
        body: t.body,
        category: t.category,
        subcategory: t.subcategory,
        quran_evidence: t.quran_evidence,
        sunnah_evidence: t.sunnah_evidence,
        references: t.references,
        evidence: t.evidence,
        prevailing_view: t.prevailing_view,
        hadith_grade: t.hadith_grade,
        keywords: t.keywords,
        scholar_opinions: t.scholar_opinions,
        benefits: t.benefits,
        source_origin: t.source_origin,
        importance_score: t.importance_score ?? 60,
      }),
    )
    .filter(Boolean);
}

function dedupe(items) {
  const seen = new Map();
  for (const item of items) {
    const key = item.external_key || item.title;
    if (!seen.has(key)) seen.set(key, item);
  }
  return [...seen.values()];
}

function main() {
  // حوكمة 2026-08: أسئلة /qa والمسابقة لا تُدمَج في موسوعة /rulings.
  // fromQaSeed() يبقى في الملف للترحيل اليدوي فقط ولا يُستدعى هنا.
  const all = dedupe([
    ...fromRulingsSeed(),
    ...fromFiqhCouncilSeed(),
    ...fromFiqhIssuesSeed(),
    ...fromFawaidSeed(),
    ...fromCurriculumRegistry(),
  ]).filter((row) => {
    const key = String(row.external_key || row.id || "");
    if (key.startsWith("qa-ruling") || key.startsWith("qa-")) return false;
    const title = String(row.title || "").trim();
    if (/[؟?]\s*$/u.test(title)) return false;
    if (/^(هل|كيف|متى|أين|لماذا|كم)\b/u.test(title)) return false;
    return true;
  });

  fs.mkdirSync(CHUNKS_DIR, { recursive: true });

  const byCategory = {};
  for (const item of all) {
    const key = item.category.replace(/\s+/g, "-");
    if (!byCategory[key]) byCategory[key] = [];
    byCategory[key].push(item);
  }

  // ترتيب حتمي داخل كل فئة وبين الفئات — يمنع اختلاف JSON/seed بين بنائين متطابقين.
  const rulingKey = (r) => String(r.id ?? r.slug ?? r.title ?? "");
  for (const key of Object.keys(byCategory)) {
    byCategory[key].sort((a, b) => {
      const d = (b.importance_score ?? 0) - (a.importance_score ?? 0);
      if (d !== 0) return d;
      return rulingKey(a).localeCompare(rulingKey(b), "en");
    });
  }

  // generated_at ثابت لا لحظة البناء: الملف مُتتبَّع في git ولا يقرأه أي كود،
  // فطابع الوقت الحي كان يُنتج تعديلًا وهميًا في كل بناء بلا أي تغيّر محتوى.
  const manifest = { version: 1, generated_at: FALLBACK_TIMESTAMP, total: all.length, chunks: [] };

  for (const catKey of Object.keys(byCategory).sort((a, b) => a.localeCompare(b, "en"))) {
    const items = byCategory[catKey];
    const filename = `${catKey}.json`;
    fs.writeFileSync(path.resolve(CHUNKS_DIR, filename), JSON.stringify(items, null, 0));
    manifest.chunks.push({ category: items[0].category, file: `chunks/${filename}`, count: items.length });
  }

  fs.writeFileSync(path.resolve(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));

  // Compact seed for TS fallback (first 200 by importance, stable ties)
  const top = [...all]
    .sort((a, b) => {
      const d = (b.importance_score ?? 0) - (a.importance_score ?? 0);
      if (d !== 0) return d;
      return rulingKey(a).localeCompare(rulingKey(b), "en");
    })
    .slice(0, 200);
  const seedOut = path.resolve(SEED_ARCHIVE, "rulings-encyclopedia-seed.generated.ts");
  const stubOut = path.resolve(ROOT, "src/lib/rulings-encyclopedia-seed.generated.ts");
  const seedBody = `// AUTO-GENERATED — run: pnpm --filter @workspace/majalis run generate:rulings\n// حوكمة: كل سجل هنا "pending_review" ما لم يحمل reviewed_by + reviewed_at + مصدرًا خارجيًا.\n/* eslint-disable */\nimport type { ShariaRulingExtended } from "../../../src/lib/rulings-types";\n\nexport const RULINGS_ENCYCLOPEDIA_SEED: ShariaRulingExtended[] = ${JSON.stringify(top, null, 2)} as unknown as ShariaRulingExtended[];\n\nexport const RULINGS_ENCYCLOPEDIA_TOTAL = ${all.length};\n`;
  fs.writeFileSync(seedOut, seedBody);
  fs.writeFileSync(
    stubOut,
    `// ARCHIVED — البيانات في content/archive/rulings-encyclopedia/seeds/\n/* eslint-disable */\nimport type { ShariaRulingExtended } from "./rulings-types";\n\nexport const RULINGS_ENCYCLOPEDIA_SEED: ShariaRulingExtended[] = [];\n\nexport const RULINGS_ENCYCLOPEDIA_TOTAL = ${all.length};\n`,
  );

  console.log(`Generated ${all.length} rulings in ${manifest.chunks.length} chunks`);
  console.log(`Manifest: ${path.relative(ROOT, path.resolve(OUT_DIR, "manifest.json"))}`);
}

main();
