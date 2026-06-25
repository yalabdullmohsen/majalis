/** Contemporary fiqh topics (nawazil) — links to verified items only via tags/slugs */

export type NawazilTopic = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  categoryHints?: string[];
  slugHints?: string[];
};

export const NAWAZIL_TOPICS: NawazilTopic[] = [
  {
    slug: "ai",
    title: "الذكاء الاصطناعي",
    description: "أحكام استخدام الذكاء الاصطناعي في الفتوى والتعليم والمعاملات.",
    tags: ["ذكاء اصطناعي", "AI", "تقنية"],
    categoryHints: ["القضايا المعاصرة", "النوازل المعاصرة"],
  },
  {
    slug: "crypto",
    title: "العملات الرقمية",
    description: "أحكام التعامل بالعملات المشفّرة والاستثمار فيها.",
    tags: ["عملات رقمية", "اقتصاد", "معاملات"],
    slugHints: ["fiqh-crypto"],
    categoryHints: ["الاقتصاد الإسلامي"],
  },
  {
    slug: "bank-cards",
    title: "البطاقات البنكية",
    description: "أحكام بطاقات الائتمان والخصم والمعاملات المصرفية.",
    tags: ["بنوك", "بطاقات", "معاملات"],
    categoryHints: ["المعاملات", "الاقتصاد الإسلامي"],
  },
  {
    slug: "insurance",
    title: "التأمين",
    description: "أحكام التأمين التجاري والتكافلي.",
    tags: ["تأمين", "معاملات"],
    categoryHints: ["المعاملات"],
  },
  {
    slug: "organ-donation",
    title: "زراعة الأعضاء",
    description: "أحكام التبرع بالأعضاء وزراعتها.",
    tags: ["تبرع", "أعضاء", "طب"],
    slugHints: ["fiqh-organ-donation"],
    categoryHints: ["الطب والنوازل"],
  },
  {
    slug: "ivf",
    title: "أطفال الأنابيب",
    description: "أحكام وسائل الإنجاب المساعدة.",
    tags: ["إنجاب", "طب", "أسرة"],
    categoryHints: ["الطب والنوازل", "الأسرة"],
  },
  {
    slug: "genetics",
    title: "الهندسة الوراثية",
    description: "أحكام التعديل الجيني والفحوصات الوراثية.",
    tags: ["وراثة", "طب", "نوازل"],
    categoryHints: ["الطب والنوازل"],
  },
  {
    slug: "modern-medicine",
    title: "الطب الحديث",
    description: "نوازل طبية معاصرة وعلاجات حديثة.",
    tags: ["طب", "نوازل"],
    categoryHints: ["الطب والنوازل"],
  },
  {
    slug: "minorities",
    title: "الأقليات المسلمة",
    description: "أحكام وحقوق المسلمين في البلدان غير الإسلامية.",
    tags: ["أقليات", "حقوق"],
    slugHints: ["fiqh-minorities"],
    categoryHints: ["الأقليات المسلمة"],
  },
];

export function matchNawazilTopic(
  topic: NawazilTopic,
  item: { slug: string; tags?: string[]; category?: string; nawazil_topic?: string },
): boolean {
  if (item.nawazil_topic === topic.slug) return true;
  if (topic.slugHints?.some((h) => item.slug.includes(h))) return true;
  const tags = item.tags || [];
  if (topic.tags.some((t) => tags.some((it) => it.includes(t) || t.includes(it)))) return true;
  if (topic.categoryHints?.includes(item.category || "")) {
    return topic.tags.some((t) => tags.some((it) => it.includes(t)));
  }
  return false;
}
