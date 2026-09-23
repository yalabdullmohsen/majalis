/**
 * وحدة حفظ — تجربة التكرار والتقدم خلف hifzPathPracticeEnabled.
 * لا تعديل لنص القرآن · لا إخفاء يوهم صفحة مصحف.
 */
import { useEffect, useMemo } from "react";
import { Link, Redirect, useParams } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { UtilityScreen } from "@/components/design-system/screens";
import { EmptyStateV2, PageHeaderV2 } from "@/components/design-system";
import {
  getPublishedHifzPathBySlug,
  isHifzPathEnabled,
  listPublishedUnitsForPath,
} from "@/lib/memorization-path";
import { HifzUnitPracticePanel } from "./HifzUnitPracticePanel";

const PATH = "/hifz-path";

export default function HifzPathUnitPage() {
  if (!isHifzPathEnabled()) {
    return <Redirect to="/memorization" />;
  }
  return <HifzPathUnitShell />;
}

function HifzPathUnitShell() {
  const params = useParams<{ slug?: string; unitId?: string }>();
  const slug = params.slug ?? "";
  const unitId = params.unitId ?? "";

  const path = useMemo(
    () => (slug ? getPublishedHifzPathBySlug(slug) : null),
    [slug],
  );
  const unit = useMemo(() => {
    if (!path || !unitId) return null;
    return listPublishedUnitsForPath(path).find((u) => u.unitId === unitId) ?? null;
  }, [path, unitId]);

  useEffect(() => {
    applyPageSeo({
      path: `${PATH}/p/${slug}/u/${unitId}`,
      title: unit
        ? `${unit.title} | ${path?.title ?? "مسار الحفظ"} | سُنّة`
        : "وحدة غير متاحة | سُنّة",
      description: unit
        ? `وحدة حفظ ضمن ${path?.title ?? "مسار الحفظ"} — تدريب ذاتي بلا شهادة حفظ.`
        : "الوحدة غير متاحة للعامة حتى اعتماد النشر.",
      robots: "noindex, follow",
    });
  }, [path?.title, slug, unit, unitId]);

  if (!path || !unit) {
    return (
      <UtilityScreen compose="mark">
        <main className="mx-auto w-full max-w-3xl px-4 py-4" dir="rtl">
          <EmptyStateV2
            title="الوحدة غير متاحة"
            description="تُعرض الوحدات المنشورة فقط."
            ctaLabel="العودة للمسار"
            href={slug ? `${PATH}/p/${slug}` : PATH}
          />
        </main>
      </UtilityScreen>
    );
  }

  return (
    <UtilityScreen compose="mark">
      <main className="mx-auto w-full max-w-3xl px-4 py-4" dir="rtl">
        <PageHeaderV2
          className="mb-4"
          eyebrow={path.title}
          title={unit.title}
          description={`الوحدة ${unit.sequence}`}
        />
        <HifzUnitPracticePanel path={path} unit={unit} />
        <p className="mt-4 text-center text-sm">
          <Link
            href={`${PATH}/p/${path.slug}`}
            className="text-primary underline-offset-2 hover:underline"
          >
            العودة لصفحة المسار
          </Link>
        </p>
      </main>
    </UtilityScreen>
  );
}
