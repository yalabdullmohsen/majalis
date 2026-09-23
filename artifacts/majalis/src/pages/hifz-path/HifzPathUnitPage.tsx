/**
 * وحدة حفظ — هيكل فقط في PR-2؛ تجربة التكرار/التقدم في PR-3.
 * لا تعديل لنص القرآن · لا إخفاء يوهم صفحة مصحف.
 */
import { useEffect, useMemo } from "react";
import { Link, Redirect, useParams } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { UtilityScreen } from "@/components/design-system/screens";
import {
  EmptyStateV2,
  PageHeaderV2,
  StatusNotice,
} from "@/components/design-system";
import {
  getPublishedHifzPathBySlug,
  isHifzPathEnabled,
  listPublishedUnitsForPath,
} from "@/lib/memorization-path";

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
        ? `وحدة حفظ ضمن ${path?.title ?? "مسار الحفظ"} — تجربة التدريب تُكمَل لاحقًا.`
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
            description="تُعرض الوحدات المنشورة فقط. تجربة الحفظ التفصيلية تُفعَّل بعد اعتماد المحتوى."
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
        <StatusNotice tone="info" title="تجربة الوحدة قادمة">
          عرض النص والتكرار والاختبار الذاتي وتسجيل «أتممت هذه الوحدة» يُكمَل في
          موجة لاحقة. القرآن يُعرض عبر المرجع المعتمد فقط — خارج قارئ المصحف
          الأساسي ودون تعديل الرسم أو التشكيل.
        </StatusNotice>
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
