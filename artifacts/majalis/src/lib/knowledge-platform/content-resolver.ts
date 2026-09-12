/**
 * Content Resolver — فتح الكيان الصحيح عبر content-href.
 */

import {
  hrefAdhkar,
  hrefFawaid,
  hrefHadith,
  hrefIslamicHistory,
  hrefLessons,
  hrefQuranHub,
  hrefScholars,
  hrefStories,
} from "@/lib/content-href";
import {
  CONTENT_ENTITY_KINDS,
  SEARCH_KIND_TO_ENTITY,
  type ContentEntityCard,
  type ContentEntityKind,
  type ContentEntityRef,
  type VerificationStatus,
  isPubliclyVisible,
} from "./content-entity";

const KIND_SET = new Set<string>(CONTENT_ENTITY_KINDS);

function card(
  kind: ContentEntityKind,
  id: string,
  title: string,
  href: string,
  opts: {
    shortDescription?: string;
    verificationStatus?: VerificationStatus;
    sourceReference?: string;
    provenance?: string;
  } = {},
): ContentEntityCard {
  return {
    kind,
    id,
    title,
    href,
    shortDescription: opts.shortDescription,
    language: "ar",
    publishStatus: "published",
    verificationStatus: opts.verificationStatus ?? "published",
    sourceReference: opts.sourceReference,
    provenance: opts.provenance ?? "resolver:content-href",
    confidenceStatus: "n/a",
  };
}

export function resolveContentRef(ref: ContentEntityRef, title = ""): ContentEntityCard | null {
  const id = String(ref.id ?? "").trim();
  const { kind } = ref;
  if (!kind) return null;

  switch (kind) {
    case "quran_page": {
      const page = Number(id);
      if (!Number.isFinite(page) || page < 1 || page > 604) return null;
      return card(kind, String(page), title || `صفحة ${page}`, `/mushaf?page=${page}`, {
        sourceReference: "mushaf",
        provenance: "resolver:mushaf-page",
      });
    }
    case "quran_surah":
      return card(
        kind,
        id || "hub",
        title || "المصحف",
        id ? `/mushaf?surah=${encodeURIComponent(id)}` : hrefQuranHub(),
        { sourceReference: "mushaf" },
      );
    case "quran_ayah":
      return card(kind, id, title || "آية", `/mushaf?ayah=${encodeURIComponent(id)}`, {
        sourceReference: "mushaf",
      });
    case "tafsir":
      return card(kind, id, title || "تفسير", id ? `/tafsir/${encodeURIComponent(id)}` : "/tafsir");
    case "hadith":
      return card(kind, id, title || "حديث", hrefHadith(id || null), {
        provenance: "resolver:hadith — لا حكم تخريج من المحلّل",
      });
    case "hadith_book":
      return card(kind, id, title || "كتاب حديث", id ? `/hadith?book=${encodeURIComponent(id)}` : "/hadith");
    case "fiqh_topic":
      return card(kind, id, title || "فقه", id ? `/fiqh/${encodeURIComponent(id)}` : "/fiqh");
    case "aqeedah_topic":
      return card(kind, id, title || "عقيدة", id ? `/tawhid#${encodeURIComponent(id)}` : "/tawhid");
    case "seerah_event":
      return card(kind, id, title || "سيرة", id ? `/seerah#${encodeURIComponent(id)}` : "/seerah");
    case "history_event":
      return card(kind, id, title || "تاريخ", hrefIslamicHistory(id || null));
    case "prophet_story":
      return card(kind, id, title || "قصة نبي", hrefStories(id || null));
    case "scholar":
    case "lecturer":
      return card(kind, id, title || "عالِم", hrefScholars(id || null));
    case "lesson":
    case "lecture":
    case "series":
      return card(kind, id, title || "درس", hrefLessons(id || null));
    case "institution":
    case "mosque":
      return card(kind, id, title || "مؤسسة", id ? `/institutions#${encodeURIComponent(id)}` : "/institutions");
    case "university":
      return card(kind, id, title || "جامعة", id ? `/universities/${encodeURIComponent(id)}` : "/universities");
    case "article":
      return card(kind, id, title || "مقالة", id ? `/search?q=${encodeURIComponent(id)}` : "/search");
    case "dhikr":
    case "dua":
      return card(kind, id, title || "ذكر", hrefAdhkar(id || null));
    case "fawaid":
      return card(kind, id, title || "فائدة", hrefFawaid(id || null));
    case "app_route": {
      const href = id.startsWith("/") ? id : `/${id}`;
      return card(kind, href, title || href, href);
    }
    default:
      return null;
  }
}

export function resolveSearchHit(hit: {
  id: string;
  kind: string;
  title: string;
  href: string;
  summary?: string;
}): ContentEntityCard | null {
  const mapped = SEARCH_KIND_TO_ENTITY[hit.kind];
  const kind = mapped ?? "app_route";
  // لـ app_route: استخدم مسار الفهرس إن وُجد — يمنع فتح كيان خاطئ عبر id خام.
  const id =
    kind === "app_route" && typeof hit.href === "string" && hit.href.startsWith("/")
      ? hit.href
      : hit.id;
  const resolved =
    resolveContentRef({ kind, id }, hit.title) ??
    card("app_route", hit.href || hit.id, hit.title, hit.href || "/search", {
      shortDescription: hit.summary,
    });
  // لا تستبدل رابط المحلّل برابط الفهرس للأنواع المعروفة (غير app_route).
  const withHref =
    !mapped && hit.href && resolved.href !== hit.href
      ? { ...resolved, href: hit.href, shortDescription: hit.summary ?? resolved.shortDescription }
      : { ...resolved, shortDescription: hit.summary ?? resolved.shortDescription };
  return isPubliclyVisible(withHref) ? withHref : null;
}

export function resolveOrNull(kind: string, id: string, title?: string): ContentEntityCard | null {
  const mapped =
    SEARCH_KIND_TO_ENTITY[kind] ?? (KIND_SET.has(kind) ? (kind as ContentEntityKind) : null);
  if (!mapped) return null;
  const c = resolveContentRef({ kind: mapped, id }, title);
  return c && isPubliclyVisible(c) ? c : null;
}
