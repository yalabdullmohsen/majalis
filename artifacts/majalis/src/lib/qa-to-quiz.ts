/**
 * تحويل بنك الأسئلة التعليمية (SEED_QA) إلى صفوف لعبة سين جيم.
 * القرار المنتج: لا واجهة عامة مستقلة لـ /qa — المحتوى يظهر داخل اللعبة فقط.
 */
import { QA_CATEGORIES, loadSeedQa, type SeedQaItem } from "./qa-seed";
import type { QuizQuestion } from "./quiz-seed";

const CAT_TO_SECTION: Record<string, string> = {
  aqeedah: "العقيدة",
  anbiya: "الأنبياء",
  sahabah: "الصحابة",
  fiqh: "الفقه",
  tahara: "الفقه",
  salah: "الفقه",
  zakat: "الفقه",
  sawm: "الفقه",
  hajj: "الفقه",
  seerah: "السيرة",
  quran: "القرآن الكريم",
  hadith: "الحديث",
  adhkar: "الآداب",
  adab: "الآداب",
};

/** Map بمفتاح string صريح — يمنع TS2345 عند البحث بـ category_id النصي. */
const SLUG_BY_CAT_ID: Map<string, string> = new Map(
  QA_CATEGORIES.map((c): [string, string] => [c.id, c.slug]),
);

function stripAnswerPrefix(answer: string): string {
  return String(answer || "")
    .replace(/^\s*الجواب\s*[:：]\s*/u, "")
    .trim();
}

function resolveSection(item: SeedQaItem): string {
  const slug =
    (item.qa_categories && "slug" in item.qa_categories
      ? String((item.qa_categories as { slug?: string }).slug || "")
      : "") ||
    SLUG_BY_CAT_ID.get(String(item.category_id || "")) ||
    "";
  return CAT_TO_SECTION[slug] || (item.qa_categories?.name ? String(item.qa_categories.name) : "الفقه");
}

/** أسئلة تعليمية منشورة فقط — مع المصدر/التصنيف/المستوى/حالة المراجعة عند توفرها. */
export async function qaSeedToQuizQuestions(): Promise<QuizQuestion[]> {
  const seedQa = await loadSeedQa();
  const out: QuizQuestion[] = [];
  const seenQ = new Set<string>();

  for (const item of seedQa) {
    if (item.status && item.status !== "published") continue;
    const question = String(item.question || "").trim();
    const answer = stripAnswerPrefix(String(item.answer || ""));
    if (!question || !answer) continue;
    const key = question.toLowerCase();
    if (seenQ.has(key)) continue;
    seenQ.add(key);

    const section = resolveSection(item);
    const category = item.qa_categories?.name ? String(item.qa_categories.name) : section;
    const reference = [item.reference, item.evidence].filter(Boolean).join(" — ") || undefined;

    out.push({
      id: `qa-${item.id}`,
      section,
      category,
      level: "متوسط",
      question,
      answer,
      status: "published",
      reference,
      explanation: reference,
      documentation_status: item.documentation_status,
      trust_level: item.trust_level,
      editorial_review_status: item.editorial_review_status,
      last_updated_at: item.last_updated_at,
    });
  }

  return out;
}
