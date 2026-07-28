/**
 * ReligiousContentValidator — طبقة تحقق مستقلة قبل عرض أي بطاقة شرعية/تاريخية.
 * ترفض النشر عند نقص المصادر، أو العلاقات الزمنية غير المسجّلة، أو العبارات المضللة.
 */
import type {
  ConfidenceLevel,
  ValidationRejection,
  ValidationResult,
  VerifiedReligiousRecord,
} from "./types";
import {
  FORBIDDEN_TEMPORAL_LINKS,
  getVerifiedRecordById,
} from "./verified-calendar";

const MIN_PUBLISH_CONFIDENCE: ConfidenceLevel[] = ["high", "medium", "disputed"];

/** عبارات مضللة شائعة تُرفض إن رُبطت بسياق عبادة مخصوصة لرأس السنة */
const MISLEADING_NEW_YEAR_WORSHIP =
  /احتفال\s*برأس\s*السنة|عبادة\s*مخصوصة\s*(ب)?رأس\s*السنة|سنة\s*رأس\s*السنة\s*الهجرية/;

/** صياغات مضلّلة صريحة تربط الهجرة بوقوعها في محرّم أو بنعمته فيه */
const MISLEADING_MUHARRAM_HIJRA =
  /استحضار\s*نعمة\s*الهجرة|شهر\s*الهجرة|وقوع\s*الهجرة.{0,20}محر|محرم.{0,20}وقوع\s*الهجر|محرّم.{0,20}وقوع\s*الهجر|الهجرة\s*النبوية.{0,30}محر|محرم.{0,30}الهجرة\s*النبوية|محرّم.{0,30}الهجرة\s*النبوية/;

function isCorrectiveHijraMuharramText(text: string): boolean {
  return /لا\s*تُنسب\s*الهجر|ليس\s*وقوع\s*الهجر|لا\s*يُخلط\s*بين|لا\s*يُخلط\s*بوقوع|بُدئ\s*العدّ\s*من\s*محر|فلا\s*تُنسب\s*الهجر|ولا\s*ربطًا\s*بوقوع\s*الهجر|وليس\s*احتفال/.test(
    text,
  );
}

const rejectionLog: ValidationRejection[] = [];

function reject(
  recordId: string,
  rule: string,
  reason: string,
): ValidationRejection {
  const entry: ValidationRejection = {
    recordId,
    rule,
    reason,
    at: new Date().toISOString(),
  };
  rejectionLog.push(entry);
  return entry;
}

export function getValidationRejectionLog(): readonly ValidationRejection[] {
  return rejectionLog;
}

export function clearValidationRejectionLog(): void {
  rejectionLog.length = 0;
}

function hasTrustedSource(record: VerifiedReligiousRecord): boolean {
  return Boolean(
    record.evidence?.trim() &&
      record.sourceName?.trim() &&
      record.verifiedDescription?.trim(),
  );
}

function confidenceAllowsPublish(level: ConfidenceLevel): boolean {
  return MIN_PUBLISH_CONFIDENCE.includes(level);
}

/**
 * يتحقق من أن أي ذكر لحدث في النص لا يخالف علاقات الأشهر المسموحة في السجل
 * ولا يقع تحت الروابط المحظورة العامة.
 */
export function assertTemporalClaimsAllowed(
  text: string,
  record: VerifiedReligiousRecord,
): ValidationRejection[] {
  const rejections: ValidationRejection[] = [];
  const corpus = `${record.eventName}\n${text}\n${record.verifiedDescription}`;

  for (const ban of FORBIDDEN_TEMPORAL_LINKS) {
    if (!ban.eventMarkers.test(corpus)) continue;
    const month = record.hijriMonth;
    if (month != null && ban.forbiddenMonths.includes(month)) {
      rejections.push(
        reject(record.id, "forbidden-temporal-link", ban.reason),
      );
    }
    // نص يربط الحدث بشهر محظور حتى لو السجل لشهر آخر (مع استثناء التصحيح الصريح)
    if (
      ban.id === "hijra-not-in-muharram" &&
      MISLEADING_MUHARRAM_HIJRA.test(corpus) &&
      !isCorrectiveHijraMuharramText(corpus)
    ) {
      rejections.push(
        reject(
          record.id,
          "misleading-muharram-hijra",
          "النص يوهم وقوع الهجرة أو ربط نعمتها بشهر محرّم.",
        ),
      );
    }
  }

  // علاقات الشهر: إن ذُكر رقم شهر في السجل فيجب أن يكون ضمن allowedMonthLinks
  if (
    record.hijriMonth != null &&
    record.allowedMonthLinks.length > 0 &&
    !record.allowedMonthLinks.includes(record.hijriMonth)
  ) {
    rejections.push(
      reject(
        record.id,
        "month-not-in-allowed-links",
        `الشهر ${record.hijriMonth} غير مسجّل في allowedMonthLinks.`,
      ),
    );
  }

  return rejections;
}

export function detectMisleadingPhrases(
  record: VerifiedReligiousRecord,
): ValidationRejection[] {
  const rejections: ValidationRejection[] = [];
  const text = [
    record.verifiedDescription,
    ...record.recommendedActions,
    record.caveat ?? "",
  ].join("\n");

  if (MISLEADING_NEW_YEAR_WORSHIP.test(text)) {
    rejections.push(
      reject(
        record.id,
        "misleading-new-year-worship",
        "صياغة توحي بعبادة أو احتفال مشروع مخصوص برأس السنة الهجرية.",
      ),
    );
  }

  if (
    MISLEADING_MUHARRAM_HIJRA.test(text) &&
    record.hijriMonth === 1 &&
    !isCorrectiveHijraMuharramText(text)
  ) {
    rejections.push(
      reject(
        record.id,
        "misleading-muharram-hijra",
        "لا تُذكر الهجرة كواقعة في محرّم ولا تُربط نعمتها بهذا الشهر.",
      ),
    );
  }

  // تحويل اقتراح شخصي إلى حكم شرعي
  if (
    record.contentKind === "personal_suggestion" &&
    record.actionsAreRitualClaims
  ) {
    rejections.push(
      reject(
        record.id,
        "personal-as-ritual",
        "لا يجوز عرض الاقتراح الشخصي كأنه حكم شرعي أو سنة ثابتة.",
      ),
    );
  }

  return rejections;
}

/**
 * التحقق الكامل قبل السماح بالنشر/العرض.
 */
export function validateReligiousRecord(
  record: VerifiedReligiousRecord,
): ValidationResult {
  const rejections: ValidationRejection[] = [];

  if (record.reviewStatus === "rejected") {
    rejections.push(
      reject(record.id, "review-rejected", "السجل مرفوض من المراجعة."),
    );
  }

  if (record.reviewStatus === "draft" || record.reviewStatus === "needs_review") {
    rejections.push(
      reject(
        record.id,
        "needs-review",
        "المحتوى بانتظار المراجعة ولا يُنشر للعامة.",
      ),
    );
  }

  if (!hasTrustedSource(record)) {
    rejections.push(
      reject(
        record.id,
        "missing-source",
        "لا مصدر موثوق (evidence/sourceName/description).",
      ),
    );
  }

  if (record.confidenceLevel === "low") {
    rejections.push(
      reject(
        record.id,
        "low-confidence",
        "درجة الثقة منخفضة — يُرسل للمراجعة ولا يُنشر.",
      ),
    );
  }

  if (!confidenceAllowsPublish(record.confidenceLevel) && record.reviewStatus === "approved") {
    // low already handled; keep extensible
  }

  rejections.push(...assertTemporalClaimsAllowed(
    `${record.verifiedDescription}\n${record.recommendedActions.join("\n")}`,
    record,
  ));
  rejections.push(...detectMisleadingPhrases(record));

  // عند الخلاف يجب وجود تحفظ ظاهر
  if (
    (record.confidenceLevel === "disputed" ||
      record.dateCertainty === "disputed" ||
      record.eventType === "disputed") &&
    !record.caveat?.trim()
  ) {
    rejections.push(
      reject(
        record.id,
        "disputed-without-caveat",
        "المعلومة محل خلاف وتفتقد عبارة تحفظ واضحة.",
      ),
    );
  }

  const unique = dedupeRejections(rejections);
  const blocked = unique.some((r) =>
    [
      "review-rejected",
      "needs-review",
      "missing-source",
      "low-confidence",
      "forbidden-temporal-link",
      "misleading-muharram-hijra",
      "misleading-new-year-worship",
      "personal-as-ritual",
      "month-not-in-allowed-links",
      "disputed-without-caveat",
    ].includes(r.rule),
  );

  return {
    ok: unique.length === 0,
    publishable: record.reviewStatus === "approved" && !blocked,
    record: blocked ? null : record,
    rejections: unique,
  };
}

function dedupeRejections(items: ValidationRejection[]): ValidationRejection[] {
  const seen = new Set<string>();
  const out: ValidationRejection[] = [];
  for (const item of items) {
    const key = `${item.recordId}:${item.rule}:${item.reason}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** التحقق من نص حر (اقتراح موسم / بطاقة ديناميكية) مقابل سجل مرجعي */
export function validateFreeTextAgainstRecord(
  text: string,
  recordId: string,
): ValidationResult {
  const base = getVerifiedRecordById(recordId);
  if (!base) {
    const r = reject(recordId, "unknown-record", "لا يوجد سجل موثّق بهذا المعرّف.");
    return { ok: false, publishable: false, record: null, rejections: [r] };
  }
  const probe: VerifiedReligiousRecord = {
    ...base,
    verifiedDescription: text,
    recommendedActions: [text],
  };
  return validateReligiousRecord(probe);
}

/**
 * يمنع إنشاء رسالة مناسبة دينية جديدة خارج القاعدة.
 */
export function assertNoInventedOccasion(candidateId: string): boolean {
  return Boolean(getVerifiedRecordById(candidateId));
}

export const ReligiousContentValidator = {
  validate: validateReligiousRecord,
  validateFreeText: validateFreeTextAgainstRecord,
  assertTemporalClaimsAllowed,
  detectMisleadingPhrases,
  assertNoInventedOccasion,
  getRejectionLog: getValidationRejectionLog,
  clearRejectionLog: clearValidationRejectionLog,
};

export default ReligiousContentValidator;
