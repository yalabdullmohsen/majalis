/**
 * Resolve content URLs by kind/type for unified search results.
 */

const KIND_LABELS = {
  lesson: "درس",
  lessons: "درس",
  library: "كتاب",
  book: "كتاب",
  fatwa: "فتوى",
  fatwas: "فتوى",
  ruling: "حكم شرعي",
  rulings: "حكم شرعي",
  qa: "سؤال وجواب",
  fawaid: "فائدة",
  fawaid_item: "فائدة",
  adhkar: "ذكر",
  miracle: "إعجاز علمي",
  miracles: "إعجاز علمي",
  course: "دورة",
  courses: "دورة",
  update: "مستجد",
  updates: "مستجد",
  fiqh_decision: "قرار فقهي",
  fiqh_council: "المجمع الفقهي",
  sheikh: "شيخ",
  sheikhs: "شيخ",
  quran: "قرآن",
  tafsir: "تفسير",
  hadith: "حديث",
  mutoon: "متون",
  circle: "حلقة",
  circles: "حلقة",
  mosque: "مسجد",
  mosques: "مسجد",
  research: "بحث علمي",
  learning_path: "مسار تعليمي",
  sin_jeem: "سؤال وجواب",
  article: "مقال",
  knowledge: "محرك المعرفة",
};

export function kindLabel(kind) {
  return KIND_LABELS[kind] || kind || "محتوى";
}

export function resolveContentUrl(item) {
  if (item.href) return item.href;
  if (item.source_url) return item.source_url;
  if (item.url) return item.url;

  const id = item.id || item.content_id || item.target_record_id || item.record_id;
  const kind = item.content_kind || item.kind || item.content_type || item.type;

  switch (kind) {
    case "lesson":
    case "lessons":
      return id ? `/lessons/${id}` : "/lessons";
    case "library":
    case "book":
      return "/library";
    case "fatwa":
    case "fatwas":
      return id ? `/fatwa/${id}` : "/fatwa";
    case "ruling":
    case "rulings":
      return id ? `/rulings/${id}` : "/rulings";
    case "qa":
      return "/qa";
    case "fawaid":
    case "fawaid_item":
      return "/fawaid";
    case "adhkar":
      return "/adhkar";
    case "miracle":
    case "miracles":
      return "/miracles";
    case "course":
    case "courses":
      return id ? `/annual-courses/${id}` : "/annual-courses";
    case "update":
    case "updates":
      return item.slug ? `/updates/auto/${item.slug}` : "/updates";
    case "fiqh_decision":
    case "fiqh_council":
      return id ? `/fiqh-council/${item.slug || id}` : "/fiqh-council";
    case "sheikh":
    case "sheikhs":
      return "/lessons";
    case "quran":
      return item.id?.startsWith("surah-")
        ? `/quran?surah=${String(item.id).replace("surah-", "")}`
        : "/quran";
    case "tafsir":
      return "/quran/tafsir";
    case "hadith":
      return "/arbaeen-nawawi";
    case "mutoon":
      return item.href || "/learning/paths";
    case "circle":
    case "circles":
      return id ? `/quran-scientific-circles/${id}` : "/quran-scientific-circles";
    case "mosque":
    case "mosques":
      return item.href || "/lessons";
    case "research":
      return id ? `/fiqh-council/${item.slug || id}` : "/fiqh-council/research";
    case "learning_path":
      return item.href || (item.slug ? `/learning/paths/${item.slug}` : "/learning/paths");
    case "sin_jeem":
      return "/question-answer";
    case "article":
      return item.slug ? `/updates/auto/${item.slug}` : "/updates";
    case "knowledge":
      if (item.record_id || item.target_record_id) {
        return resolveContentUrl({ ...item, id: item.record_id || item.target_record_id, kind: item.content_kind });
      }
      return `/search/${encodeURIComponent(item.title || item.ai_title || "")}`;
    default:
      if (item.slug) return `/updates/auto/${item.slug}`;
      return id ? `/search/${encodeURIComponent(item.title || "")}` : "/search";
  }
}

export function enrichResult(item) {
  const kind = item.content_kind || item.kind || item.content_type || item.type || "content";
  const title = item.title || item.ai_title || item.question || item.text || item.name || "بدون عنوان";
  const summary = item.summary || item.ai_summary || item.description || item.answer || item.meta || "";
  const href = resolveContentUrl({ ...item, title });

  return {
    ...item,
    id: item.id || item.content_id,
    kind,
    kind_label: kindLabel(kind),
    title: String(title).slice(0, 300),
    summary: String(summary).slice(0, 400),
    href,
    source_name: item.source_name || item.author_name || item.scholar || item.ai_scholar || item.speaker_name,
    verification_status: item.verification_status || item.documentation_status,
    trust_level: item.trust_level ?? item.trust_score,
    quality_score: item.quality_score,
    keywords: item.keywords || item.ai_keywords || [],
    updated_at: item.updated_at || item.last_updated || item.published_at,
  };
}
