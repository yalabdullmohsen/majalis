import type { IslamicOccasion } from "@/lib/islamic-occasions-seed";
import type { ReligiousContentKind, VerifiedReligiousRecord } from "./types";
import { ReligiousContentValidator } from "./ReligiousContentValidator";
import {
  VERIFIED_HIJRI_MONTH_CARDS,
  VERIFIED_OCCASION_RECORDS,
  getVerifiedRecordById,
} from "./verified-calendar";

export type PublishableOccasion = IslamicOccasion & {
  verified?: VerifiedReligiousRecord;
  contentKind: ReligiousContentKind;
  caveat: string | null;
  sourceName: string;
  confidenceLevel: VerifiedReligiousRecord["confidenceLevel"];
  reviewStatus: VerifiedReligiousRecord["reviewStatus"];
  publishable: boolean;
};

export type LearningSeasonCard = {
  id: string;
  recordId: string;
  arabicName: string;
  hijriMonth: number;
  description: string;
  suggestion: string;
  href: string;
  contentKind: ReligiousContentKind;
  caveat: string | null;
  sourceName: string;
  /** تواريخ ميلادية تقريبية للعرض فقط — لا تُنشئ علاقة شرعية */
  startDate: Date;
  endDate: Date;
};

const CONTENT_KIND_LABELS: Record<ReligiousContentKind, string> = {
  verified_fact: "معلومة موثقة",
  recommended_deed: "عمل مستحب بدليل",
  personal_suggestion: "اقتراح تنظيمي شخصي",
  historical_event: "حدث تاريخي",
};

export function contentKindLabel(kind: ReligiousContentKind): string {
  return CONTENT_KIND_LABELS[kind];
}

export function listPublishableReligiousRecords(): VerifiedReligiousRecord[] {
  return [...VERIFIED_HIJRI_MONTH_CARDS, ...VERIFIED_OCCASION_RECORDS].filter((r) => {
    const result = ReligiousContentValidator.validate(r);
    return result.publishable;
  });
}

/**
 * يُثري مناسبة من البذرة بسجل التوثيق؛ ويُسقطها إن لم تجتز التحقق.
 */
export function enrichOccasionForPublish(occasion: IslamicOccasion): PublishableOccasion | null {
  const verified = getVerifiedRecordById(occasion.id);

  if (verified) {
    const result = ReligiousContentValidator.validate(verified);
    if (!result.publishable || !result.record) return null;

    // فرض الشهر/اليوم من السجل الموثّق لا من أي تخمين
    return {
      ...occasion,
      name: verified.eventName,
      hijriMonth: verified.hijriMonth ?? occasion.hijriMonth,
      hijriDay: verified.hijriDay ?? occasion.hijriDay,
      summary:
        verified.dateCertainty === "disputed" || verified.confidenceLevel === "disputed"
          ? `${verified.verifiedDescription}${verified.caveat ? ` — ${verified.caveat}` : ""}`
          : verified.verifiedDescription,
      deeds: verified.recommendedActions,
      evidence: `${verified.evidence} — المصدر: ${verified.sourceName}`,
      verified: result.record,
      contentKind: verified.contentKind,
      caveat: verified.caveat,
      sourceName: verified.sourceName,
      confidenceLevel: verified.confidenceLevel,
      reviewStatus: verified.reviewStatus,
      publishable: true,
    };
  }

  // مناسبات بلا سجل موثّق: لا تُعرض للعامة (منع الاختراع)
  ReligiousContentValidator.validate({
    id: occasion.id,
    eventName: occasion.name,
    hijriMonth: occasion.hijriMonth || null,
    hijriDay: occasion.hijriDay || null,
    eventType: "historical_event",
    contentKind: "historical_event",
    verifiedDescription: occasion.summary,
    recommendedActions: occasion.deeds,
    evidence: occasion.evidence,
    sourceName: "",
    sourceUrl: null,
    reviewStatus: "needs_review",
    reviewedBy: "system",
    lastReviewedAt: new Date().toISOString().slice(0, 10),
    confidenceLevel: "low",
    dateCertainty: "not_applicable",
    caveat: "بانتظار التوثيق في قاعدة السجلات المعتمدة.",
    allowedMonthLinks: occasion.hijriMonth ? [occasion.hijriMonth] : [],
    actionsAreRitualClaims: true,
  });
  return null;
}

/** مواسم التعلّم المعتمدة فقط — بلا ربط الهجرة بمحرّم */
export function getPublishableLearningSeasons(yearHint = 1448): LearningSeasonCard[] {
  // تواريخ ميلادية تقريبية للموسم (عرض فقط) — مرتبطة برقم الشهر لا باختراع حدث
  const approx: Record<number, { start: string; end: string; href: string }> = {
    1: { start: "2026-07-01", end: "2026-07-29", href: "/sawm" },
    3: { start: "2026-09-25", end: "2026-10-24", href: "/seerah" },
    7: { start: "2026-12-30", end: "2027-01-28", href: "/adhkar" },
    8: { start: "2027-01-29", end: "2027-02-27", href: "/quran-hub" },
    9: { start: "2027-02-28", end: "2027-03-29", href: "/lessons" },
    12: { start: "2027-05-18", end: "2027-05-27", href: "/adhkar" },
  };

  const seasonRecordIds: Array<{ recordId: string; month: number }> = [
    { recordId: "learning-season-muharram", month: 1 },
    { recordId: "learning-season-rabi-awwal", month: 3 },
    { recordId: "month-rajab", month: 7 },
    { recordId: "month-shaban", month: 8 },
    { recordId: "month-ramadan", month: 9 },
    { recordId: "month-dhul-hijjah", month: 12 },
  ];

  const cards: LearningSeasonCard[] = [];
  for (const { recordId, month } of seasonRecordIds) {
    const record = getVerifiedRecordById(recordId);
    if (!record) continue;
    const result = ReligiousContentValidator.validate(record);
    if (!result.publishable || !result.record) continue;
    const dates = approx[month];
    if (!dates) continue;

    cards.push({
      id: `${recordId}-${yearHint}`,
      recordId,
      arabicName: record.eventName.replace(/^موسم التعلّم — /, ""),
      hijriMonth: month,
      description: record.verifiedDescription,
      suggestion: record.recommendedActions[0] ?? "",
      href: dates.href,
      contentKind: record.contentKind,
      caveat: record.caveat,
      sourceName: record.sourceName,
      startDate: new Date(dates.start),
      endDate: new Date(dates.end),
    });
  }
  return cards;
}
