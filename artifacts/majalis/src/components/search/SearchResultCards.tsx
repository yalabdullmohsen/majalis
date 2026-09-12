/**
 * بطاقات نتائج بحث متخصصة حسب عائلة النوع — بلا تسميات إنجليزية.
 */
import { memo, type ReactNode } from "react";
import { Link } from "wouter";
import {
  BookMarked,
  BookOpen,
  Building2,
  GraduationCap,
  Landmark,
  MapPin,
  ScrollText,
  Sparkles,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { highlightOriginalParts, type AppSearchResult } from "@/features/search";
import {
  searchKindFamily,
  searchKindLabelAr,
  type SearchKindFamily,
} from "@/features/search/search-kind-i18n";
import {
  resolveSearchMatchReason,
  type SearchMatchReason,
} from "@/features/search/search-match-reason";

export type SearchResultItem = AppSearchResult & {
  partial?: boolean;
  verification_status?: string | null;
  source_name?: string | null;
};

const FAMILY_ICON: Record<SearchKindFamily, LucideIcon> = {
  quran: BookMarked,
  tafsir: BookOpen,
  hadith: ScrollText,
  lesson: GraduationCap,
  history: Landmark,
  seerah: Sparkles,
  scholar: UserRound,
  university: Building2,
  mosque: Landmark,
  landmark: MapPin,
  institution: Building2,
  fiqh: BookOpen,
  adhkar: Sparkles,
  fawaid: Sparkles,
  prophet: UserRound,
  article: BookOpen,
  generic: BookOpen,
};

function highlightText(text: string, query: string): ReactNode {
  if (!text || !query.trim()) return text;
  const parts = highlightOriginalParts(text, query.trim());
  if (parts.length === 1 && !parts[0]!.hit) return text;
  return parts.map((p, i) =>
    p.hit ? (
      <mark key={i} className="srch-hl">
        {p.text}
      </mark>
    ) : (
      <span key={i}>{p.text}</span>
    ),
  );
}

function verificationLabel(status?: string | null, hasSource?: boolean): string | null {
  if (
    hasSource ||
    status === "verified" ||
    status === "pending_review" ||
    status === "pending" ||
    status === "needs_review"
  ) {
    return "موثّق بمصدر";
  }
  return null;
}

function resultHref(item: SearchResultItem): string {
  if (item.href) return item.href;
  if (item.kind === "qa") return `/quiz?qa=${encodeURIComponent(item.id)}`;
  if (item.kind === "fawaid") return `/fawaid#${encodeURIComponent(item.id)}`;
  return "/search";
}

export function isBlockedSearchHref(href?: string | null): boolean {
  if (!href) return false;
  return /^\/(admin|dashboard|internal|login|register|auth)(\/|$)/i.test(href);
}

export const SearchResultCard = memo(function SearchResultCard({
  item,
  query,
  matchReason,
  onOpen,
}: {
  item: SearchResultItem;
  query: string;
  matchReason?: SearchMatchReason;
  onOpen?: (item: SearchResultItem) => void;
}) {
  const href = resultHref(item);
  if (isBlockedSearchHref(href)) return null;

  const family = searchKindFamily(item.kind);
  const kindLabel = searchKindLabelAr(item.kind);
  const reason =
    matchReason ??
    resolveSearchMatchReason({
      title: item.title,
      summary: item.summary,
      source: item.source_name,
      kind: item.kind,
      query,
      match: item.match,
    });
  const snippet = item.summary?.trim();
  const source = item.source_name?.trim();
  const partial =
    item.partial ||
    item.verification_status === "partial" ||
    item.verification_status === "draft";
  const verified = verificationLabel(item.verification_status, Boolean(source));
  const Icon = FAMILY_ICON[family];

  return (
    <article
      className={`srch-result-card soft-card soft-card--on-light srch-result-card--${family}`}
      data-kind-family={family}
      data-kind={item.kind}
    >
      <Link
        href={href}
        className="srch-result-card__link"
        onClick={() => onOpen?.(item)}
      >
        <div className="srch-result-card__top">
          <span className="srch-result-card__kind" data-family={family}>
            <Icon size={14} strokeWidth={2} aria-hidden="true" />
            {kindLabel}
          </span>
          {partial ? <span className="srch-result-card__status">قيد الإكمال</span> : null}
          {verified ? <span className="srch-result-card__status">{verified}</span> : null}
        </div>
        <h3 className="srch-result-card__title">{highlightText(item.title, query)}</h3>
        <p className="srch-result-card__reason">{reason.label}</p>
        {snippet ? (
          <p className="srch-result-card__excerpt">{highlightText(snippet, query)}</p>
        ) : null}
        {source ? (
          <p className="srch-result-card__source">
            المصدر: {highlightText(source, query)}
          </p>
        ) : null}
        <span className="srch-result-card__open">فتح</span>
      </Link>
    </article>
  );
});
