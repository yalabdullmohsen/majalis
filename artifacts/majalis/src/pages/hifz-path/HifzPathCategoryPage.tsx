/**
 * تصنيف مسار حفظ — يعرض المسارات المنشورة فقط.
 */
import { useEffect, useMemo } from "react";
import { Link, Redirect, useParams } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { UtilityScreen } from "@/components/design-system/screens";
import { EmptyStateV2, PageHeaderV2 } from "@/components/design-system";
import {
  HIFZ_PATH_USER_TAGLINE,
  hifzCategoryLabel,
  isHifzCategory,
  isHifzPathEnabled,
  listPublishedHifzPathsByCategory,
} from "@/lib/memorization-path";
import { HifzPathRow } from "./HifzPathRow";

const PATH = "/hifz-path";

export default function HifzPathCategoryPage() {
  if (!isHifzPathEnabled()) {
    return <Redirect to="/memorization" />;
  }
  return <HifzPathCategoryShell />;
}

function HifzPathCategoryShell() {
  const params = useParams<{ category?: string }>();
  const raw = params.category ?? "";
  const valid = isHifzCategory(raw);

  const paths = useMemo(
    () => (valid ? listPublishedHifzPathsByCategory(raw) : []),
    [raw, valid],
  );

  const title = valid ? hifzCategoryLabel(raw) : "تصنيف غير معروف";

  useEffect(() => {
    applyPageSeo({
      path: `${PATH}/c/${raw || "unknown"}`,
      title: `${title} | مسار الحفظ | سُنّة`,
      description: HIFZ_PATH_USER_TAGLINE,
      robots: "noindex, follow",
    });
  }, [raw, title]);

  if (!valid) {
    return (
      <UtilityScreen compose="mark">
        <main className="mx-auto w-full max-w-3xl px-4 py-4" dir="rtl">
          <EmptyStateV2
            title="تصنيف غير معروف"
            description="هذا التصنيف ليس ضمن مسارات الحفظ المعتمدة."
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
          eyebrow="مسار الحفظ"
          title={title}
          description={HIFZ_PATH_USER_TAGLINE}
        />
        {paths.length === 0 ? (
          <EmptyStateV2
            title="لا مسارات منشورة في هذا التصنيف"
            description="يُعرض المنشور فقط بعد اعتماد المصدر والترخيص والمراجعة."
            ctaLabel="العودة لمسار الحفظ"
            href={PATH}
          />
        ) : (
          <div className="flex flex-col gap-1">
            {paths.map((path) => (
              <HifzPathRow key={path.id} path={path} />
            ))}
          </div>
        )}
        <p className="mt-4 text-center text-sm">
          <Link href={PATH} className="text-primary underline-offset-2 hover:underline">
            كل المسارات
          </Link>
        </p>
      </main>
    </UtilityScreen>
  );
}
