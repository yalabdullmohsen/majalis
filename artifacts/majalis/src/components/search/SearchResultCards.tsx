/**
 * بطاقات نتائج بحث — هوية سُنّة موحّدة (أيقونة + نوع + وصف + مصدر + سهم).
 */
import { memo, type ReactNode } from "react";
import { Link } from "wouter";
import {
  BookMarked,
  BookOpen,
  Building2,
  ChevronLeft,
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
import { isUnusableSearchHref } from "@/features/search/search-sanitize";

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
    status === "pending_review" ||
    status === "pending" ||
    status === "needs_review" ||
    status === "draft" ||
    status === "archived" ||
    status === "disabled"
  ) {
    return null;
  }
  if (hasSource || status === "verified") {
    return "موثّق بمصدر";
  }
  return null;
}

function resultHref(item: SearchResultItem): string {
  if (item.href) return item.href;
  if (item.kind === "qa") return `/quiz?qa=${encodeURIComponent(item.id)}`;
  if (item.kind === "fawaid") return `/fawaid#${encodeURIComponent(item.id)}`;
  return "";
}

export function isBlockedSearchHref(href?: string | null): boolean {
  if (!href) return false;
  // مسارات إدارية + مجمع ملغى — تُستبعد من نتائج البحث العامة
  if (/^\/(admin|dashboard|internal|login|register|auth|fiqh-council)(\/|$)/i.test(href)) {
    return true;
  }
  return isUnusableSearchHref(href);
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
  if (!href || isBlockedSearchHref(href)) return null;
  if (
    item.verification_status === "draft" ||
    item.verification_status === "archived" ||
    item.verification_status === "disabled" ||
    item.verification_status === "pending_review" ||
    item.verification_status === "pending" ||
    item.verification_status === "needs_review" ||
    item.verification_status === "needs_scholar_review" ||
    item.verification_status === "NEEDS_SCHOLAR_REVIEW" ||
    item.verification_status === "partial" ||
    item.partial
  ) {
    return null;
  }

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
        <span className="srch-result-card__icon" aria-hidden="true">
          <Icon size={18} strokeWidth={1.85} />
        </span>
        <span className="srch-result-card__body">
          <span className="srch-result-card__top">
            <span className="srch-result-card__kind" data-family={family}>
              {kindLabel}
            </span>
            {verified ? <span className="srch-result-card__status">{verified}</span> : null}
          </span>
          <h3 className="srch-result-card__title">{highlightText(item.title, query)}</h3>
          {snippet ? (
            <p className="srch-result-card__excerpt">{highlightText(snippet, query)}</p>
          ) : (
            <p className="srch-result-card__reason">{reason.label}</p>
          )}
          {source ? (
            <p className="srch-result-card__source">المصدر: {highlightText(source, query)}</p>
          ) : null}
        </span>
        <span className="srch-result-card__chevron" aria-hidden="true">
          <ChevronLeft size={18} strokeWidth={2} />
        </span>
      </Link>
    </article>
  );
});
