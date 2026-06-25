import type { FiqhCouncilIssue, FiqhTimelineEvent } from "./fiqh-council-types";

export const FIQH_ISSUES_PUBLISHED_SEED: FiqhCouncilIssue[] = [
  {
    id: "seed-issue-crypto",
    slug: "crypto-currency",
    title: "التعامل بالعملات الرقمية (المشفّرة)",
    summary: "مسألة فقهية تجمع قرارات وبحوث المجمع حول العملات الرقمية والمعاملات المالية المعاصرة.",
    description:
      "تتناول هذه المسألة حكم التعامل بالعملات الرقمية من حيث كونها نقوداً شرعية، والتداول والاستثمار فيها، وما يترتب على ذلك من أحكام.",
    category: "الاقتصاد الإسلامي",
    subcategory: "الاقتصاد",
    ruling_summary:
      "لا تُعدّ العملات الرقمية غير المُغطّاة بأصول حقيقية نقوداً شرعية؛ والتداول المضاربي فيها فيه غرر وجهالة.",
    evidence_summary: "الاستدلال من نهي أكل المال بالباطل، وأحكام البيع والغرر في المعاملات.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 890,
    published_at: "2024-03-15T10:00:00Z",
    updated_at: "2024-03-15T10:00:00Z",
    created_at: "2024-03-15T10:00:00Z",
  },
  {
    id: "seed-issue-organ-donation",
    slug: "organ-donation",
    title: "التبرع بالأعضاء بعد الوفاة",
    summary: "مسألة فقهية حول جواز التبرع بالأعضاء لإنقاذ حياة المرضى وفق ضوابط شرعية وطبية.",
    category: "الطب والنوازل",
    subcategory: "الطب",
    ruling_summary: "يجوز التبرع بالأعضاء بعد الوفاة عند تحقق الشروط الشرعية والطبية.",
    evidence_summary: "الاستدلال بمقصد إحياء النفس وحفظ الكرامة الإنسانية.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 620,
    published_at: "2023-11-08T09:00:00Z",
    updated_at: "2023-11-08T09:00:00Z",
    created_at: "2023-11-08T09:00:00Z",
  },
  {
    id: "seed-issue-minorities",
    slug: "muslim-minorities-rights",
    title: "حقوق الأقليات المسلمة",
    summary: "مسألة فقهية حول حقوق المسلمين في البلدان غير الإسلامية وممارسة شعائرهم.",
    category: "الأقليات المسلمة",
    ruling_summary: "للمسلمين حق ممارسة العبادات مع الالتزام بعقودهم وعهودهم مع الدول التي يقيمون فيها.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 540,
    published_at: "2023-06-20T08:00:00Z",
    updated_at: "2023-06-20T08:00:00Z",
    created_at: "2023-06-20T08:00:00Z",
  },
  {
    id: "seed-issue-zakat-stocks",
    slug: "zakat-stocks",
    title: "زكاة الأسهم والصناديق الاستثمارية",
    summary: "مسألة فقهية في كيفية إخراج زكاة الأسهم والصناديق الاستثمارية.",
    category: "الزكاة والوقف",
    ruling_summary: "تُزكّى الأسهم التجارية بقيمتها السوقية؛ والاستثمارية أرباحها عند بلوغ النصاب.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 1100,
    published_at: "2022-12-05T06:00:00Z",
    updated_at: "2022-12-05T06:00:00Z",
    created_at: "2022-12-05T06:00:00Z",
  },
  {
    id: "seed-issue-hajj",
    slug: "hajj-delay",
    title: "تأخير الحج لمن استطاع مادياً",
    summary: "مسألة فقهية في وجوب الحج على الفور لمن توفرت شروطه.",
    category: "الحج والعمرة",
    ruling_summary: "الحج واجب على الفور لمن استطاع إليه سبيلاً بلا عذر شرعي.",
    documentation_level: "official_verified",
    status: "published",
    views_count: 780,
    published_at: "2022-08-01T05:00:00Z",
    updated_at: "2022-08-01T05:00:00Z",
    created_at: "2022-08-01T05:00:00Z",
  },
];

/** ربط المسائل بعناصر البذور عبر slug */
export const FIQH_ISSUE_ITEM_LINKS: Record<string, string[]> = {
  "crypto-currency": ["fiqh-crypto-2024"],
  "organ-donation": ["fiqh-organ-donation"],
  "muslim-minorities-rights": ["fiqh-minorities-rights"],
  "zakat-stocks": ["fiqh-zakat-stocks"],
  "hajj-delay": ["fiqh-collective-fatwa-hajj"],
};

export const FIQH_ISSUE_TIMELINE_SEED: Record<string, Omit<FiqhTimelineEvent, "id" | "issue_id">[]> = {
  "crypto-currency": [
    {
      event_type: "first_resolution",
      title: "قرار المجمع في العملات الرقمية",
      description: "بيان حول حكم التعامل بالعملات الرقمية.",
      event_date: "2024-03-15",
      sort_order: 1,
    },
  ],
  "organ-donation": [
    {
      event_type: "recommendation",
      title: "توصية المجمع بالتبرع بالأعضاء",
      description: "توصية بشروط التبرع بعد الوفاة.",
      event_date: "2023-11-08",
      sort_order: 1,
    },
  ],
  "muslim-minorities-rights": [
    {
      event_type: "statement",
      title: "بيان حقوق الأقليات المسلمة",
      event_date: "2023-06-20",
      sort_order: 1,
    },
  ],
  "zakat-stocks": [
    {
      event_type: "first_resolution",
      title: "قرار زكاة الأسهم",
      event_date: "2022-12-05",
      sort_order: 1,
    },
  ],
  "hajj-delay": [
    {
      event_type: "first_resolution",
      title: "فتوى جماعية: وجوب الحج على الفور",
      event_date: "2022-08-01",
      sort_order: 1,
    },
  ],
};

export function findFiqhIssueBySlug(slug: string) {
  return FIQH_ISSUES_PUBLISHED_SEED.find((i) => i.slug === slug) || null;
}
