/**
 * صفحة مسار حفظ — ملخص · وحدات · مصدر · السابق/التالي.
 * لا نص شرعي مخزّن هنا؛ الوحدات عبر مراجع موثّقة فقط.
 */
import { useEffect, useMemo } from "react";
import { Link, Redirect, useParams } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { UtilityScreen } from "@/components/design-system/screens";
import {
  ContentRow,
  DetailSection,
  EmptyStateV2,
  PageHeaderV2,
  StatusNotice,
} from "@/components/design-system";
import {
  HIFZ_PATH_USER_TAGLINE,
  getPublishedHifzPathBySlug,
  hifzCategoryLabel,
  hifzLevelLabel,
  isHifzPathEnabled,
  listPublishedHifzPaths,
  listPublishedUnitsForPath,
} from "@/lib/memorization-path";

const PATH = "/hifz-path";

export default function HifzPathDetailPage() {
  if (!isHifzPathEnabled()) {
    return <Redirect to="/memorization" />;
  }
  return <HifzPathDetailShell />;
}

function HifzPathDetailShell() {
  const params = useParams<{ slug?: string }>();
  const slug = params.slug ?? "";
  const path = useMemo(
    () => (slug ? getPublishedHifzPathBySlug(slug) : null),
    [slug],
  );

  const allPublished = useMemo(() => listPublishedHifzPaths(), []);
  const nav = useMemo(() => {
    if (!path) return { prev: null as string | null, next: null as string | null };
    const idx = allPublished.findIndex((p) => p.id === path.id);
    return {
      prev: idx > 0 ? allPublished[idx - 1]?.slug ?? null : null,
      next:
        idx >= 0 && idx < allPublished.length - 1
          ? allPublished[idx + 1]?.slug ?? null
          : null,
    };
  }, [allPublished, path]);

  const units = useMemo(
    () => (path ? listPublishedUnitsForPath(path) : []),
    [path],
  );

  useEffect(() => {
    applyPageSeo({
      path: `${PATH}/p/${slug || "unknown"}`,
      title: path
        ? `${path.title} | مسار الحفظ | سُنّة`
        : "مسار غير متاح | سُنّة",
      description: path?.shortDescription ?? HIFZ_PATH_USER_TAGLINE,
      robots: "noindex, follow",
    });
  }, [path, slug]);

  if (!path) {
    return (
      <UtilityScreen compose="mark">
        <main className="mx-auto w-full max-w-3xl px-4 py-4" dir="rtl">
          <EmptyStateV2
            title="المسار غير متاح"
            description="لا يُعرض للعامة إلا المسارات المنشورة بعد اعتماد المصدر والترخيص."
            ctaLabel="العودة لمسار الحفظ"
            href={PATH}
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
          eyebrow={hifzCategoryLabel(path.category)}
          title={path.title}
          description={path.shortDescription ?? HIFZ_PATH_USER_TAGLINE}
        />

        <DetailSection title="ملخص">
          <p className="text-sm text-muted-foreground">
            المستوى: {hifzLevelLabel(path.level)}
            {path.estimatedUnits > 0
              ? ` · ${path.estimatedUnits} وحدة تقديرية`
              : ""}
          </p>
          {path.learningObjectives && path.learningObjectives.length > 0 ? (
            <ul className="mt-2 list-disc pr-5 text-sm">
              {path.learningObjectives.map((obj) => (
                <li key={obj}>{obj}</li>
              ))}
            </ul>
          ) : null}
        </DetailSection>

        <DetailSection title="التقدم والمراجعة">
          <StatusNotice tone="neutral">
            لا تقدّم مسجّل بعد. عند توفر تجربة الوحدة يمكنك استخدام «أتممت هذه
            الوحدة» أو «سجلتها ضمن محفوظاتي» — بلا شهادة حفظ.
          </StatusNotice>
        </DetailSection>

        <DetailSection title="خطة الوحدات">
          {units.length === 0 ? (
            <EmptyStateV2
              title="لا وحدات منشورة بعد"
              description="الوحدات تُنشر بعد مطابقة النص بالمصدر المعتمد."
            />
          ) : (
            <div className="flex flex-col gap-1">
              {units.map((unit) => (
                <ContentRow
                  key={unit.unitId}
                  href={`${PATH}/p/${path.slug}/u/${unit.unitId}`}
                  title={unit.title}
                  meta={`الوحدة ${unit.sequence}`}
                  description="ابدأ الحفظ"
                />
              ))}
            </div>
          )}
        </DetailSection>

        <DetailSection title="المصدر والنسخة">
          <dl className="grid gap-1 text-sm">
            <div>
              <dt className="inline font-medium">المرجع: </dt>
              <dd className="inline">
                {path.sourceReference ?? "يُحدَّد قبل النشر"}
              </dd>
            </div>
            {path.edition ? (
              <div>
                <dt className="inline font-medium">الطبعة/النسخة: </dt>
                <dd className="inline">{path.edition}</dd>
              </div>
            ) : null}
            {path.revisionPlan ? (
              <div>
                <dt className="inline font-medium">خطة المراجعة: </dt>
                <dd className="inline">{path.revisionPlan}</dd>
              </div>
            ) : null}
          </dl>
        </DetailSection>

        <nav
          className="mt-6 flex items-center justify-between gap-3 text-sm"
          aria-label="تنقّل المسارات"
        >
          {nav.prev ? (
            <Link
              href={`${PATH}/p/${nav.prev}`}
              className="text-primary underline-offset-2 hover:underline"
            >
              السابق
            </Link>
          ) : (
            <span className="text-muted-foreground">السابق</span>
          )}
          <Link
            href={PATH}
            className="text-muted-foreground underline-offset-2 hover:underline"
          >
            كل المسارات
          </Link>
          {nav.next ? (
            <Link
              href={`${PATH}/p/${nav.next}`}
              className="text-primary underline-offset-2 hover:underline"
            >
              التالي
            </Link>
          ) : (
            <span className="text-muted-foreground">التالي</span>
          )}
        </nav>
      </main>
    </UtilityScreen>
  );
}
