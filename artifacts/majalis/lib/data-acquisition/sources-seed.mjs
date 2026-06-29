/** Curated seed sources — 25 for test matrix (5 each category group) */
import { slugify } from "./types.mjs";

function src(partial) {
  return {
    slug: partial.slug || slugify(partial.name),
    status: "active",
    fetch_interval_minutes: 60,
    requires_human_review: partial.publish_policy !== "auto_safe",
    items_extracted_total: 0,
    items_published_total: 0,
    ...partial,
  };
}

export const SEED_SOURCES = [
  // 5 lessons
  src({ name: "مرتقى الدراسات — دروس", source_url: "https://www.murtaqa.com/feed/", source_type: "rss", country: "KW", category: "دروس", content_types: ["lessons"], trust_score: 88, publish_policy: "auto_safe" }),
  src({ name: "درس8 — دروس", source_url: "https://drosq8.com/feed/", source_type: "rss", country: "KW", category: "دروس", content_types: ["lessons"], trust_score: 85, publish_policy: "auto_safe" }),
  src({ name: "جامعة الكويت — علوم", source_url: "https://www.ku.edu.kw/ar/news/rss", source_type: "rss", country: "KW", category: "جامعات", content_types: ["lessons", "announcements"], trust_score: 92, publish_policy: "auto_safe" }),
  src({ name: "وزارة الأوقاف — الكويت", source_url: "https://www.awqaf.gov.kw/", source_type: "official", country: "KW", category: "رسمي", content_types: ["lessons", "announcements"], trust_score: 95, publish_policy: "auto_safe" }),
  src({ slug: "mosque-dasma-lessons", name: "مسجد الدسمة — دروس", source_url: "https://example-mosque-kw.local/lessons.json", source_type: "json", country: "KW", category: "مساجد", content_types: ["lessons"], trust_score: 80, publish_policy: "review" }),

  // 5 research
  src({ name: "مجلة الجamiعة الإسلامية", source_url: "https://journal.iu.edu.sa/feed/", source_type: "journal", country: "SA", category: "أبحاث", content_types: ["research"], trust_score: 90, publish_policy: "review" }),
  src({ name: "ResearchGate — Islamic Studies", source_url: "https://www.researchgate.net/", source_type: "web", country: "INT", category: "أبحاث", content_types: ["research"], trust_score: 75, publish_policy: "review" }),
  src({ name: "دار الأندلس — أبحاث", source_url: "https://www.andalus.com.sa/research.rss", source_type: "rss", country: "SA", category: "أبحاث", content_types: ["research"], trust_score: 82, publish_policy: "review" }),
  src({ name: "جامعة أم القرى — بحث", source_url: "https://uqu.edu.sa/research/feed", source_type: "university", country: "SA", category: "أبحاث", content_types: ["research"], trust_score: 91, publish_policy: "review" }),
  src({ name: "أبحاث PDF — مجلد عام", source_url: "https://drive.google.com/uc?export=download&id=sample-research-pdf", source_type: "pdf", country: "INT", category: "أبحاث", content_types: ["research"], trust_score: 70, publish_policy: "review" }),

  // 5 books
  src({ name: "المكتبة الشاملة — كتب", source_url: "https://shamela.ws/feed", source_type: "rss", country: "INT", category: "كتب", content_types: ["books"], trust_score: 88, publish_policy: "review" }),
  src({ name: "دار ابن كثير", source_url: "https://ibnkatheer.com/books.json", source_type: "json", country: "SA", category: "كتب", content_types: ["books"], trust_score: 86, publish_policy: "review" }),
  src({ name: "مktبة الحرمين", source_url: "https://library.alharamain.gov.sa/feed", source_type: "rss", country: "SA", category: "كتب", content_types: ["books"], trust_score: 94, publish_policy: "review" }),
  src({ name: "Google Drive — كتب CSV", source_url: "https://drive.google.com/uc?export=download&id=sample-books-csv", source_type: "csv", country: "INT", category: "كتب", content_types: ["books"], trust_score: 65, publish_policy: "review" }),
  src({ name: "Excel — فهرس كتب", source_url: "https://example.com/books-catalog.xlsx", source_type: "excel", country: "KW", category: "كتب", content_types: ["books"], trust_score: 60, publish_policy: "review" }),

  // 5 circles (quran/mutoon)
  src({ slug: "quran-circles-kw", name: "حلقات قرآنية — الكويت", source_url: "https://example-kw.local/quran-circles.json", source_type: "json", country: "KW", category: "حلقات", content_types: ["quran_circles"], trust_score: 82, publish_policy: "auto_safe" }),
  src({ name: "حلقات متون — RSS", source_url: "https://example.com/mutoon-circles.rss", source_type: "rss", country: "KW", category: "حلقات", content_types: ["mutoon_circles"], trust_score: 80, publish_policy: "auto_safe" }),
  src({ name: "YouTube — حلقات قرآن", source_url: "https://www.youtube.com/playlist?list=PLsampleQuran", source_type: "youtube_playlist", country: "KW", category: "حلقات", content_types: ["quran_circles", "lectures"], trust_score: 78, publish_policy: "auto_safe" }),
  src({ name: "Telegram — حلقات علم", source_url: "https://t.me/s/sample_islamic_channel", source_type: "telegram", country: "KW", category: "حلقات", content_types: ["quran_circles"], trust_score: 72, publish_policy: "review" }),
  src({ name: "مسجد الحسين — حلقات", source_url: "https://example-mosque.local/circles.rss", source_type: "mosque", country: "KW", category: "مساجد", content_types: ["quran_circles", "mutoon_circles"], trust_score: 84, publish_policy: "auto_safe" }),

  // 5 file sources (pdf/csv/excel/json samples for pipeline test)
  src({ name: "PDF — فتاوى (مراجعة)", source_url: "https://example.com/fatwa-sample.pdf", source_type: "pdf", country: "KW", category: "فتاوى", content_types: ["fatwas"], trust_score: 90, publish_policy: "review" }),
  src({ slug: "lessons-schedule-csv", name: "CSV — مواعيد دروس", source_url: "https://example.com/lessons-schedule.csv", source_type: "csv", country: "KW", category: "دروس", content_types: ["lessons", "calendar"], trust_score: 75, publish_policy: "auto_safe" }),
  src({ name: "JSON — فوائد", source_url: "https://example.com/benefits.json", source_type: "json", country: "KW", category: "فوائد", content_types: ["benefits"], trust_score: 70, publish_policy: "review" }),
  src({ name: "Excel — دورات علمية", source_url: "https://example.com/courses.xlsx", source_type: "excel", country: "KW", category: "دورات", content_types: ["courses"], trust_score: 68, publish_policy: "auto_safe" }),
  src({ name: "Web — إعلانات دعوية", source_url: "https://example.com/dawah-announcements", source_type: "web", country: "KW", category: "دعوة", content_types: ["announcements"], trust_score: 76, publish_policy: "auto_safe" }),
];
