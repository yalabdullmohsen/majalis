import type { PermanentCommitteeFatwa } from "./types";
import { PC_SOURCE_NAME } from "./types";

/** Seed fatwas — original official wording preserved (representative samples). */
export const PC_FATWA_SEED: PermanentCommitteeFatwa[] = [
  {
    id: "pc-seed-zakat-001",
    external_key: "pc:zakat-001",
    fatwa_number: "13789",
    title: "زكاة المال المودع في البنك",
    question: "ما حكم زكاة المال المودع في البنك؟",
    answer:
      "إذا بلغ المال المودع في البنك النصاب وحال عليه الحول وجبت فيه الزكاة بنسبة 2.5%، سواء كان في حساب جاري أو توفير، ما دام ملكاً للزاكي وقابلاً للتصرف فيه.",
    summary: "وجوب زكاة المال المودع في البنك عند بلوغ النصاب وحولان الحول.",
    category: "الزكاة",
    subcategory: "شروط الزكاة",
    keywords: ["زكاة", "بنك", "نصاب", "مال"],
    reference: "اللجنة الدائمة للبحوث العلمية والإفتاء — فتاوى الزكاة",
    source_url: "https://www.alifta.gov.sa",
    source_name: PC_SOURCE_NAME,
    issued_at: "2010-05-12T00:00:00Z",
    status: "approved",
    view_count: 4200,
    search_count: 890,
  },
  {
    id: "pc-seed-salah-002",
    external_key: "pc:salah-002",
    fatwa_number: "9812",
    title: "حكم ترك صلاة الجمعة",
    question: "ما حكم من ترك صلاة الجمعة بغير عذر؟",
    answer:
      "صلاة الجمعة ركن من أركان الإسلام، وهي واجبة على كل مسلم بالغ عاقل ذكر مقيم، فمن تركها بغير عذر شرعي فقد أتى محرماً عظيماً، وعليه التوبة والإكثار من صلاة الظهر.",
    summary: "وجوب الجمعة وتحريم تركها بغير عذر.",
    category: "الصلاة",
    subcategory: "صلاة الجمعة",
    keywords: ["جمعة", "صلاة", "وجوب"],
    reference: "اللجنة الدائمة — فتاوى الصلاة",
    source_url: "https://www.alifta.gov.sa",
    source_name: PC_SOURCE_NAME,
    view_count: 6100,
    search_count: 1200,
    status: "approved",
  },
  {
    id: "pc-seed-hajj-003",
    external_key: "pc:hajj-003",
    fatwa_number: "15432",
    title: "حكم من مات ولم يحج",
    question: "هل يُحج عن الميت إذا لم يحج في حياته؟",
    answer:
      "إذا كان الميت قد استطاع الحج في حياته ولم يحج حتى مات، وجب أن يُحج عنه من ماله؛ لقول النبي ﷺ: «من مات ولم يحج فليحج عنه وليه».",
    summary: "وجوب الحج عن الميت إذا كان قادراً ولم يحج.",
    category: "الحج والعمرة",
    keywords: ["حج", "ميت", "ولي", "نفل"],
    reference: "اللجنة الدائمة — فتاوى الحج",
    source_url: "https://www.alifta.gov.sa",
    source_name: PC_SOURCE_NAME,
    view_count: 3800,
    status: "approved",
  },
  {
    id: "pc-seed-family-004",
    external_key: "pc:family-004",
    fatwa_number: "11220",
    title: "حكم تأخير النكاح",
    question: "هل يجوز تأخير النكاح لغرض التعلم؟",
    answer:
      "النكاح سنة لمن قدر عليه، ولا ينبغي تأخيره لغير حاجة إذا خيف الوقوع في الحرام؛ أما إن كان الإنسان قادراً على العفاف فلا حرج في تأخيره لمصلحة شرعية كطلب العلم.",
    category: "الأسرة",
    keywords: ["نكاح", "تأخير", "طلب العلم"],
    reference: "اللجنة الدائمة — فتاوى الأسرة",
    source_url: "https://www.alifta.gov.sa",
    source_name: PC_SOURCE_NAME,
    view_count: 2900,
    status: "approved",
  },
  {
    id: "pc-seed-nawazil-005",
    external_key: "pc:nawazil-005",
    fatwa_number: "20145",
    title: "حكم العملات الرقمية",
    question: "ما حكم التعامل بالعملات الرقمية؟",
    answer:
      "لا يجوز التعامل بالعملات الرقمية المجهولة المصدر والمضاربة فيها؛ لما فيها من الغرر والجهالة، وعدم اعتبارها نقوداً معتبرة شرعاً.",
    category: "النوازل",
    keywords: ["عملات رقمية", "بitcoin", "معاملات"],
    reference: "اللجنة الدائمة — نوازل المعاملات",
    source_url: "https://www.alifta.gov.sa",
    source_name: PC_SOURCE_NAME,
    view_count: 8500,
    search_count: 2100,
    status: "approved",
  },
  {
    id: "pc-seed-taharah-006",
    external_key: "pc:taharah-006",
    fatwa_number: "7654",
    title: "حكم التيمم",
    question: "متى يجوز التيمم؟",
    answer:
      "يجوز التيمم عند عدم وجود الماء أو العجز عن استعماله لمرض أو برد شديد، بمسح الوجه والكفين من تراب طاهر، بعد نية التيمم.",
    category: "العبادات",
    subcategory: "الطهارة",
    keywords: ["تيمم", "طهارة", "ماء"],
    reference: "اللجنة الدائمة — فتاوى الطهارة",
    source_url: "https://www.alifta.gov.sa",
    source_name: PC_SOURCE_NAME,
    view_count: 5100,
    status: "approved",
  },
];

export const PC_MEMBERS_SEED = [
  { name: "أعضاء اللجنة الدائمة للبحوث العلمية والإفتاء", role: "هيئة كبار العلماء — المملكة العربية السعودية" },
];

export const PC_ABOUT =
  "اللجنة الدائمة للبحوث العلمية والإفتاء هي مرجع رسمي للفتاوى الشرعية في المملكة العربية السعودية. تُعرض هنا الفتاوى والبحوث الرسمية كما وردت من المصدر دون تعديل على النص الأصلي.";

export function findPcFatwaById(id: string): PermanentCommitteeFatwa | null {
  return PC_FATWA_SEED.find((f) => f.id === id || f.external_key === id) || null;
}

export function getLatestPcFatwas(limit = 10): PermanentCommitteeFatwa[] {
  return [...PC_FATWA_SEED]
    .sort((a, b) => (b.issued_at || "").localeCompare(a.issued_at || ""))
    .slice(0, limit);
}

export function getPopularPcFatwas(limit = 10): PermanentCommitteeFatwa[] {
  return [...PC_FATWA_SEED].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, limit);
}

export function getTopPcTopics(limit = 8): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const f of PC_FATWA_SEED) {
    counts.set(f.category, (counts.get(f.category) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
