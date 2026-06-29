import { encodeRouteSegment, normalizeRouteParam } from "./content-id";

export type ContentLinkInput = {
  kind?: string;
  type?: string;
  content_type?: string;
  content_kind?: string;
  id?: string | number;
  slug?: string;
  external_key?: string;
  content_id?: string | number;
  record_id?: string | number;
  target_record_id?: string | number;
  href?: string;
  url?: string;
  source_url?: string;
  name?: string;
  title?: string;
};

function resolveId(content: ContentLinkInput): string {
  const raw =
    content.external_key ??
    content.id ??
    content.content_id ??
    content.record_id ??
    content.target_record_id ??
    content.slug;
  return normalizeRouteParam(raw != null ? String(raw) : "");
}

function resolveKind(content: ContentLinkInput): string {
  return (
    content.kind ||
    content.content_kind ||
    content.content_type ||
    content.type ||
    ""
  ).toLowerCase();
}

function segmentPath(base: string, id: string): string {
  const encoded = encodeRouteSegment(id);
  return encoded ? `${base}/${encoded}` : base;
}

/** Single entry point for public detail/list URLs — always encodes path segments. */
export function buildContentUrl(content: ContentLinkInput): string {
  if (content.href?.startsWith("/")) return content.href;
  if (content.source_url?.startsWith("/")) return content.source_url;
  if (content.url?.startsWith("/")) return content.url;

  const id = resolveId(content);
  const kind = resolveKind(content);

  switch (kind) {
    case "lesson":
    case "lessons":
    case "lecture":
    case "lectures":
      return segmentPath("/lessons", id) || "/lessons";
    case "library":
    case "book":
    case "books":
      return segmentPath("/library", id) || "/library";
    case "fatwa":
    case "fatwas":
      return segmentPath("/fatwa", id) || "/fatwa";
    case "ruling":
    case "rulings":
      return segmentPath("/rulings", id) || "/rulings";
    case "qa":
    case "question":
      return segmentPath("/qa", id) || "/qa";
    case "fawaid":
    case "fawaid_item":
    case "benefit":
    case "benefits":
      return segmentPath("/fawaid", id) || "/fawaid";
    case "adhkar":
      return "/adhkar";
    case "miracle":
    case "miracles":
      return segmentPath("/miracles", id) || "/miracles";
    case "course":
    case "courses":
    case "annual_course":
      return segmentPath("/annual-courses", id) || "/annual-courses";
    case "circle":
    case "circles":
    case "quran_scientific_circle":
      return segmentPath("/quran-scientific-circles", id) || "/quran-scientific-circles";
    case "update":
    case "updates":
    case "article":
      return content.slug ? `/updates/auto/${encodeRouteSegment(content.slug)}` : "/updates";
    case "fiqh_decision":
    case "fiqh_council":
      return segmentPath("/fiqh-council", content.slug || id) || "/fiqh-council";
    case "sheikh":
    case "sheikhs":
      if (content.external_key) return segmentPath("/sheikhs", content.external_key);
      if (id) return segmentPath("/sheikhs", id);
      if (content.name) return `/search/${encodeURIComponent(content.name)}`;
      return "/sheikhs";
    case "research":
      if (content.slug) return `/research/${encodeRouteSegment(content.slug)}`;
      return id ? segmentPath("/research", id) : "/research";
    case "learning_path":
    case "mutoon":
      if (content.slug) return `/learning/paths/${encodeRouteSegment(content.slug)}`;
      return content.href || "/learning/paths";
    case "mosque":
    case "mosques":
      return id ? segmentPath("/lessons", id) : "/lessons";
    case "calendar":
      return id ? `/calendar/${encodeRouteSegment(id)}` : "/calendar";
    case "sin_jeem":
      return "/question-answer";
    case "quran":
      if (String(id).startsWith("surah-")) {
        return `/quran?surah=${encodeURIComponent(String(id).replace("surah-", ""))}`;
      }
      return "/quran";
    case "tafsir":
      return "/quran/tafsir";
    case "hadith":
      return "/arbaeen-nawawi";
    case "scientific_announcement":
      return segmentPath("/scientific-announcements", id) || "/lessons";
    default:
      if (content.slug) return `/updates/auto/${encodeRouteSegment(content.slug)}`;
      if (id && kind) return segmentPath(`/${kind}`, id);
      if (content.title) return `/search/${encodeURIComponent(content.title)}`;
      return "/search";
  }
}

/** Convenience wrapper for lesson detail URLs. */
export function buildLessonUrl(lesson: { id?: string; external_key?: string | null }): string {
  return buildContentUrl({
    kind: "lesson",
    id: lesson.external_key || lesson.id,
  });
}
