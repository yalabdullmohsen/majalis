/**
 * كتالوج قائمة الفرق — ملخص فقط + حراسة PUBLISHED.
 * التفاصيل الكاملة تُحمَّل عند فتح السجل المنشور عبر getPublishedIslamicSectById.
 */
import publicMeta from "@/data/islamic-sects-public-meta.json";
import {
  ISLAMIC_SECTS,
  getIslamicSectById,
  type IslamicSect,
} from "@/data/islamic-sects";
import {
  isIslamicSectsPubliclyVisible,
  type IslamicSectsPublicationStatus,
} from "@/lib/islamic-sects/publication-states";
import type { IslamicSectsEntityKind } from "@/lib/islamic-sects/types";
import { arabicMatchAny } from "@/lib/arabic-search";

export type IslamicSectEraBucket = string;

export type IslamicSectSummary = {
  id: string;
  name: string;
  icon: string;
  /** تصنيف واجهة قديم (legacy) */
  legacyCategory: IslamicSect["category"];
  statusLabel: IslamicSect["status"];
  summary: string;
  entityKind: IslamicSectsEntityKind;
  historicalStatus: string;
  eraBucket: IslamicSectEraBucket;
  publicationStatus: IslamicSectsPublicationStatus;
  searchBlob: string[];
};

export type IslamicSectsListFilters = {
  search?: string;
  entityKind?: string; // "الكل" | entityKind id
  historicalStatus?: string;
  eraBucket?: string;
  legacyCategory?: string;
};

type PublicMetaRecord = {
  id: string;
  publicationStatus: IslamicSectsPublicationStatus;
  entityKind: IslamicSectsEntityKind;
  historicalStatus: string;
  alternateNames: string[];
  selfDesignation: string[];
  externalDesignations: string[];
  eraBucket: string;
  searchKeywords: string[];
};

const metaById = new Map(
  (publicMeta.records as PublicMetaRecord[]).map((r) => [r.id, r]),
);

const ENTITY_KIND_LABELS: Record<string, string> = {
  method_intro: "مقدمات ومنهج",
  creedal_school: "مدرسة عقدية",
  kalam_school: "مدرسة كلامية",
  historical_sect: "فرقة تاريخية",
  political_creedal_movement: "حركة سياسية-عقدية",
  shi_i_branch: "فرع شيعي",
  sufi_current: "تيار صوفي",
  philosophical_school: "مدرسة فلسفية",
  reform_trend: "اتجاه إصلاحي",
  fiqh_methodology: "منهج فقهي",
  independent_community: "جماعة مستقلة",
  contemporary_trend: "اتجاه معاصر",
  unclassified_needs_review: "غير مصنَّف",
};

export function entityKindLabelAr(kind: string): string {
  return ENTITY_KIND_LABELS[kind] ?? kind;
}

export function listPublishedIslamicSectSummaries(): IslamicSectSummary[] {
  const out: IslamicSectSummary[] = [];
  for (const sect of ISLAMIC_SECTS) {
    const meta = metaById.get(sect.id);
    if (!meta) continue;
    if (!isIslamicSectsPubliclyVisible(meta.publicationStatus)) continue;
    out.push({
      id: sect.id,
      name: sect.name,
      icon: sect.icon,
      legacyCategory: sect.category,
      statusLabel: sect.status,
      summary: sect.foundingCause,
      entityKind: meta.entityKind,
      historicalStatus: meta.historicalStatus,
      eraBucket: meta.eraBucket,
      publicationStatus: meta.publicationStatus,
      searchBlob: [
        sect.name,
        sect.fullName,
        ...meta.searchKeywords,
        sect.foundingCause,
      ],
    });
  }
  return out;
}

/** للاختبارات والحوكمة: عدد المنشور من الميتا فقط. */
export function countPublishedIslamicSectsFromMeta(): number {
  return (publicMeta.records as PublicMetaRecord[]).filter((r) =>
    isIslamicSectsPubliclyVisible(r.publicationStatus),
  ).length;
}

export function getIslamicSectPublicationStatus(
  id: string,
): IslamicSectsPublicationStatus | null {
  return metaById.get(id)?.publicationStatus ?? null;
}

export function isIslamicSectPubliclyListed(id: string): boolean {
  const st = getIslamicSectPublicationStatus(id);
  return st ? isIslamicSectsPubliclyVisible(st) : false;
}

export function getPublishedIslamicSectById(
  id: string,
): IslamicSect | undefined {
  if (!isIslamicSectPubliclyListed(id)) return undefined;
  return getIslamicSectById(id);
}

export function filterIslamicSectSummaries(
  items: readonly IslamicSectSummary[],
  filters: IslamicSectsListFilters,
): IslamicSectSummary[] {
  const q = filters.search?.trim() ?? "";
  return items.filter((s) => {
    if (
      filters.entityKind &&
      filters.entityKind !== "الكل" &&
      s.entityKind !== filters.entityKind
    ) {
      return false;
    }
    if (
      filters.historicalStatus &&
      filters.historicalStatus !== "الكل" &&
      s.historicalStatus !== filters.historicalStatus
    ) {
      return false;
    }
    if (
      filters.eraBucket &&
      filters.eraBucket !== "الكل" &&
      s.eraBucket !== filters.eraBucket
    ) {
      return false;
    }
    if (
      filters.legacyCategory &&
      filters.legacyCategory !== "الكل" &&
      s.legacyCategory !== filters.legacyCategory
    ) {
      return false;
    }
    if (q && !arabicMatchAny(s.searchBlob, q)) return false;
    return true;
  });
}

/** شرائح فلتر مع إخفاء القيم ذات العدد صفر (ما عدا «الكل»). */
export function buildFilterChips(
  items: readonly IslamicSectSummary[],
  key: keyof Pick<
    IslamicSectSummary,
    "entityKind" | "historicalStatus" | "eraBucket" | "legacyCategory"
  >,
  labelFn?: (value: string) => string,
): Array<{ value: string; label: string; count: number }> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const v = String(item[key]);
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  const chips: Array<{ value: string; label: string; count: number }> = [
    { value: "الكل", label: "الكل", count: items.length },
  ];
  for (const [value, count] of [...counts.entries()].sort((a, b) =>
    a[0].localeCompare(b[0], "ar"),
  )) {
    if (count < 1) continue;
    chips.push({
      value,
      label: labelFn ? labelFn(value) : value,
      count,
    });
  }
  return chips;
}
