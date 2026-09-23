/**
 * لوحة ممارسة وحدة الحفظ — خلف hifzPathPracticeEnabled.
 * القرآن: مرجع + رابط للمصحف فقط (بلا نص مكرر / بلا إخفاء يوهم المصحف).
 * نصوص غير قرآنية: إخفاء تدريجي اختياري إن وُجد نص معتمد لاحقًا.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  DetailSection,
  StatusNotice,
} from "@/components/design-system";
import { resolveCanonicalAyahHref } from "@/lib/quran-navigation/href";
import {
  HIFZ_COMPLETION_CTA,
  HIFZ_PROGRESS_USER_LABELS,
  getUnitProgress,
  isHifzPathPracticeEnabled,
  markHifzUnitReviewed,
  markHifzUnitSelfReported,
  recordHifzRepetition,
  startHifzUnit,
  type HifzPath,
  type HifzUnit,
  type HifzUnitProgressRecord,
  type HifzVerifiedTextReference,
} from "@/lib/memorization-path";

type Props = {
  path: HifzPath;
  unit: HifzUnit;
  /** نص غير قرآني معتمد للعرض فقط — لا يُمرَّر نص قرآن هنا أبدًا. */
  nonQuranPracticeText?: string | null;
};

function describeReference(ref: HifzVerifiedTextReference): string {
  if (ref.kind === "quran") {
    return `مرجع قرآني معتمد: سورة ${ref.surah} · الآيات ${ref.ayahFrom}–${ref.ayahTo}`;
  }
  if (ref.kind === "app_route") {
    return `مصدر داخل التطبيق: ${ref.route}${ref.locator ? ` · ${ref.locator}` : ""}`;
  }
  return `مصدر خارجي موثّق: ${ref.sourceId} · ${ref.locator}`;
}

function mushafHrefFor(ref: HifzVerifiedTextReference, returnTo: string): string | null {
  if (ref.kind !== "quran") return null;
  return resolveCanonicalAyahHref(ref.surah, ref.ayahFrom, "other", {
    returnTo,
    highlight: true,
  });
}

export function HifzUnitPracticePanel({
  path,
  unit,
  nonQuranPracticeText = null,
}: Props) {
  const practiceOn = isHifzPathPracticeEnabled();
  const returnTo = `/hifz-path/p/${path.slug}/u/${unit.unitId}`;
  const [progress, setProgress] = useState<HifzUnitProgressRecord | null>(() =>
    getUnitProgress(path.slug, unit.unitId),
  );
  const [hideRatio, setHideRatio] = useState(0);
  const [selfChecks, setSelfChecks] = useState({
    aloud: false,
    recall: false,
    review: false,
  });

  useEffect(() => {
    setProgress(getUnitProgress(path.slug, unit.unitId));
  }, [path.slug, unit.unitId]);

  const identity = useMemo(
    () => ({
      pathSlug: path.slug,
      pathTitle: path.title,
      unitId: unit.unitId,
      unitTitle: unit.title,
    }),
    [path.slug, path.title, unit.unitId, unit.title],
  );

  const mushafHref = mushafHrefFor(unit.verifiedTextReference, returnTo);
  const isQuran = unit.verifiedTextReference.kind === "quran";
  const canHideWords =
    !isQuran &&
    typeof nonQuranPracticeText === "string" &&
    nonQuranPracticeText.trim().length > 0;

  const hiddenText = useMemo(() => {
    if (!canHideWords || !nonQuranPracticeText) return null;
    if (hideRatio <= 0) return nonQuranPracticeText;
    const words = nonQuranPracticeText.trim().split(/\s+/);
    const hideCount = Math.floor((words.length * hideRatio) / 100);
    return words
      .map((w, i) => (i < hideCount ? "…" : w))
      .join(" ");
  }, [canHideWords, hideRatio, nonQuranPracticeText]);

  if (!practiceOn) {
    return (
      <StatusNotice tone="info" title="تجربة الوحدة غير مفعّلة بعد">
        التكرار والاختبار الذاتي وتسجيل التقدم خلف علم منفصل. القسم مغلق للعامة
        حتى اكتمال المراجعات.
      </StatusNotice>
    );
  }

  const label = progress
    ? HIFZ_PROGRESS_USER_LABELS[progress.state]
    : HIFZ_PROGRESS_USER_LABELS.NOT_STARTED;

  return (
    <div className="flex flex-col gap-4">
      <DetailSection title="النص والمصدر">
        <p className="text-sm text-muted-foreground">
          {describeReference(unit.verifiedTextReference)}
        </p>
        {unit.sourceReference ? (
          <p className="mt-1 text-sm">المصدر: {unit.sourceReference}</p>
        ) : null}
        {isQuran ? (
          <StatusNotice tone="neutral" title="تدريب خارج قارئ المصحف">
            لا نكرر نص القرآن هنا ولا نخفي أجزاءً بطريقة توهم صفحة المصحف. افتح
            المرجع في المصحف المعتمد ثم عُد لتسجيل التكرار.
            {mushafHref ? (
              <>
                {" "}
                <Link
                  href={mushafHref}
                  className="text-primary underline-offset-2 hover:underline"
                >
                  فتح في المصحف
                </Link>
              </>
            ) : null}
          </StatusNotice>
        ) : null}
        {!isQuran && unit.verifiedTextReference.kind === "app_route" ? (
          <p className="mt-2 text-sm">
            <Link
              href={unit.verifiedTextReference.route}
              className="text-primary underline-offset-2 hover:underline"
            >
              فتح المصدر داخل سُنّة
            </Link>
          </p>
        ) : null}
        {canHideWords && hiddenText ? (
          <div className="mt-3">
            <p className="mb-2 text-sm leading-7" dir="rtl">
              {hiddenText}
            </p>
            <label className="flex items-center gap-2 text-sm">
              <span>إخفاء تدريجي (غير قرآني)</span>
              <input
                type="range"
                min={0}
                max={80}
                step={10}
                value={hideRatio}
                onChange={(e) => setHideRatio(Number(e.target.value))}
                aria-label="نسبة إخفاء الكلمات"
              />
            </label>
          </div>
        ) : null}
        {unit.audioReference ? (
          <p className="mt-2 text-sm text-muted-foreground">
            مصدر صوتي معتمد: {unit.audioReference}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            لا مصدر صوتي معتمد لهذه الوحدة حاليًا — لا تولّد تلاوة.
          </p>
        )}
      </DetailSection>

      <DetailSection title="التقدم">
        <p className="text-sm">
          الحالة: <strong>{label}</strong>
          {progress
            ? ` · تكرارات: ${progress.repetitionCount}`
            : " · لم يبدأ التسجيل"}
        </p>
        {progress?.lastReviewedAt ? (
          <p className="text-sm text-muted-foreground">
            آخر مراجعة:{" "}
            {new Date(progress.lastReviewedAt).toLocaleDateString("ar")}
          </p>
        ) : null}
        {progress?.nextReviewAt ? (
          <p className="text-sm text-muted-foreground">
            المراجعة القادمة:{" "}
            {new Date(progress.nextReviewAt).toLocaleDateString("ar")}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm mj-pressable"
            onClick={() => setProgress(startHifzUnit(identity))}
          >
            ابدأ الحفظ
          </button>
          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm mj-pressable"
            onClick={() => setProgress(recordHifzRepetition(identity))}
          >
            سجّل تكرارًا
          </button>
        </div>
      </DetailSection>

      <DetailSection title="اختبار ذاتي">
        <StatusNotice tone="neutral">
          اختيارك هنا ذاتي — لا يُثبت صحة الحفظ آليًا.
        </StatusNotice>
        <ul className="mt-2 space-y-2 text-sm">
          {(
            [
              ["aloud", "قرأت أو رددت بصوت عالٍ"],
              ["recall", "حاولت الاسترجاع دون النظر"],
              ["review", "راجعت الأخطاء بنفسك"],
            ] as const
          ).map(([key, text]) => (
            <li key={key}>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selfChecks[key]}
                  onChange={(e) =>
                    setSelfChecks((s) => ({ ...s, [key]: e.target.checked }))
                  }
                />
                {text}
              </label>
            </li>
          ))}
        </ul>
      </DetailSection>

      <DetailSection title="تسجيل في محفوظاتي">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground mj-pressable"
            onClick={() =>
              setProgress(
                markHifzUnitSelfReported(identity, {
                  revisionIntervals: unit.revisionIntervals,
                }),
              )
            }
          >
            {HIFZ_COMPLETION_CTA.completedUnit}
          </button>
          <button
            type="button"
            className="rounded-md border px-3 py-2 text-sm mj-pressable"
            onClick={() =>
              setProgress(
                markHifzUnitSelfReported(identity, {
                  revisionIntervals: unit.revisionIntervals,
                }),
              )
            }
          >
            {HIFZ_COMPLETION_CTA.savedToMine}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          هذا تسجيل ذاتي ضمن محفوظاتك — ليس شهادة حفظ.
        </p>
      </DetailSection>

      {(progress?.state === "DUE_FOR_REVIEW" ||
        progress?.state === "MEMORIZED_SELF_REPORTED" ||
        progress?.state === "NEEDS_REINFORCEMENT" ||
        progress?.state === "REVIEWED") && (
        <DetailSection title="المراجعة">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border px-3 py-2 text-sm mj-pressable"
              onClick={() =>
                setProgress(
                  markHifzUnitReviewed(identity, "ok", {
                    revisionIntervals: unit.revisionIntervals,
                  }),
                )
              }
            >
              راجعت وأتممت
            </button>
            <button
              type="button"
              className="rounded-md border px-3 py-2 text-sm mj-pressable"
              onClick={() =>
                setProgress(
                  markHifzUnitReviewed(identity, "needs_reinforcement", {
                    revisionIntervals: unit.revisionIntervals,
                  }),
                )
              }
            >
              تحتاج تثبيتًا
            </button>
          </div>
        </DetailSection>
      )}
    </div>
  );
}
