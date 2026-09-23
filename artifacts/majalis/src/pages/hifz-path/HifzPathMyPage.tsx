/**
 * محفوظاتي — وحدات مسجّلة محليًا للمراجعة.
 */
import { useEffect, useState } from "react";
import { Link, Redirect } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { UtilityScreen } from "@/components/design-system/screens";
import {
  ContentRow,
  EmptyStateV2,
  PageHeaderV2,
} from "@/components/design-system";
import {
  HIFZ_PATH_USER_TAGLINE,
  HIFZ_PROGRESS_USER_LABELS,
  isHifzPathEnabled,
  listMyHifzUnits,
  refreshDueHifzReviews,
} from "@/lib/memorization-path";

const PATH = "/hifz-path";

export default function HifzPathMyPage() {
  if (!isHifzPathEnabled()) {
    return <Redirect to="/memorization" />;
  }
  return <HifzPathMyShell />;
}

function HifzPathMyShell() {
  const [units, setUnits] = useState(() => {
    refreshDueHifzReviews();
    return listMyHifzUnits();
  });

  useEffect(() => {
    applyPageSeo({
      path: `${PATH}/my`,
      title: "محفوظاتي | مسار الحفظ | سُنّة",
      description: "متابعة الوحدات التي سجّلتها للمراجعة ضمن مسار الحفظ.",
      robots: "noindex, follow",
    });
    refreshDueHifzReviews();
    setUnits(listMyHifzUnits());
  }, []);

  return (
    <UtilityScreen compose="mark">
      <main className="mx-auto w-full max-w-3xl px-4 py-4" dir="rtl">
        <PageHeaderV2
          className="mb-4"
          title="محفوظاتي"
          description="الوحدات التي سجّلتها ضمن محفوظاتك — بلا شهادة حفظ وبلا ادعاء تحقق آلي."
        />
        {units.length === 0 ? (
          <EmptyStateV2
            title="لا وحدات في محفوظاتك بعد"
            description={`${HIFZ_PATH_USER_TAGLINE}. سجّل وحدة بعد بدء مسار منشور.`}
            ctaLabel="العودة لمسار الحفظ"
            href={PATH}
          />
        ) : (
          <div className="flex flex-col gap-1">
            {units.map((u) => (
              <ContentRow
                key={`${u.pathSlug}-${u.unitId}`}
                href={`${PATH}/p/${u.pathSlug}/u/${u.unitId}`}
                title={u.unitTitle}
                meta={`${u.pathTitle} · ${HIFZ_PROGRESS_USER_LABELS[u.state]}`}
                description={
                  u.nextReviewAt
                    ? `المراجعة القادمة: ${new Date(u.nextReviewAt).toLocaleDateString("ar")}`
                    : undefined
                }
              />
            ))}
          </div>
        )}
        <p className="mt-4 text-center text-sm">
          <Link href={PATH} className="text-primary underline-offset-2 hover:underline">
            تصفّح المسارات المقترحة
          </Link>
        </p>
      </main>
    </UtilityScreen>
  );
}
