/**
 * مسار الحفظ — صفحة القسم (Hub).
 * خلف Feature Flag · لا مسارات منشورة بعد · Empty states حقيقية.
 */
import { useEffect, useMemo } from "react";
import { Link, Redirect } from "wouter";
import { BookMarked, Library } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { UtilityScreen } from "@/components/design-system/screens";
import {
  CompactNavigationCard,
  ContentRow,
  EmptyStateV2,
  PageHeaderV2,
  StatusNotice,
} from "@/components/design-system";
import {
  HIFZ_CATEGORIES,
  HIFZ_PATH_USER_TAGLINE,
  countPublishedHifzPaths,
  getHifzContinueTarget,
  hifzCategoryLabel,
  isHifzPathEnabled,
  listHifzDueReviewsToday,
  listPublishedHifzPaths,
  listPublishedHifzPathsByCategory,
} from "@/lib/memorization-path";
import { HifzPathRow } from "./HifzPathRow";

const PATH = "/hifz-path";

export default function HifzPathPage() {
  if (!isHifzPathEnabled()) {
    return <Redirect to="/memorization" />;
  }
  return <HifzPathHub />;
}

function HifzPathHub() {
  const published = useMemo(() => listPublishedHifzPaths(), []);
  const publishedCount = countPublishedHifzPaths();
  const continueTarget = getHifzContinueTarget();
  const dueToday = listHifzDueReviewsToday();

  useEffect(() => {
    applyPageSeo({
      path: PATH,
      title: "مسار الحفظ | سُنّة",
      description: HIFZ_PATH_USER_TAGLINE,
      keywords: ["مسار الحفظ", "حفظ", "سُنّة"],
      robots: "noindex, follow",
    });
  }, []);

  return (
    <UtilityScreen compose="mark">
      <main className="mx-auto w-full max-w-3xl px-4 py-4" dir="rtl">
        <PageHeaderV2
          className="mb-4"
          title="مسار الحفظ"
          description={HIFZ_PATH_USER_TAGLINE}
        />

        <section className="mb-5" aria-labelledby="hifz-continue">
          <h2 id="hifz-continue" className="mb-2 text-base font-semibold">
            متابعة الحفظ
          </h2>
          {continueTarget ? (
            <CompactNavigationCard
              href={
                continueTarget.unitId
                  ? `${PATH}/p/${continueTarget.pathSlug}/u/${continueTarget.unitId}`
                  : `${PATH}/p/${continueTarget.pathSlug}`
              }
              title={continueTarget.pathTitle}
              description={
                continueTarget.unitTitle
                  ? `تابع: ${continueTarget.unitTitle}`
                  : "تابع من حيث توقفت"
              }
              icon={<Library size={20} strokeWidth={1.8} aria-hidden />}
            />
          ) : (
            <StatusNotice tone="neutral" title="لا متابعة جارية">
              ابدأ مسارًا منشورًا أو سجّل وحدة ضمن محفوظاتك عند توفرها.
            </StatusNotice>
          )}
        </section>

        <section className="mb-5" aria-labelledby="hifz-reviews">
          <h2 id="hifz-reviews" className="mb-2 text-base font-semibold">
            مراجعات اليوم
          </h2>
          {dueToday.length === 0 ? (
            <EmptyStateV2
              title="لا مراجعات مستحقة اليوم"
              description="تظهر هنا الوحدات المستحقة للمراجعة بعد تسجيل التقدم."
            />
          ) : (
            <div className="flex flex-col gap-1">
              {dueToday.map((item) => (
                <ContentRow
                  key={`${item.pathSlug}-${item.unitId}`}
                  href={`${PATH}/p/${item.pathSlug}/u/${item.unitId}`}
                  title={item.unitTitle}
                  meta={item.pathTitle}
                  description="مستحقة للمراجعة"
                />
              ))}
            </div>
          )}
        </section>

        <section className="mb-5" aria-labelledby="hifz-suggested">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 id="hifz-suggested" className="text-base font-semibold">
              المسارات المقترحة
            </h2>
            <Link
              href={`${PATH}/my`}
              className="text-sm text-primary underline-offset-2 hover:underline"
            >
              محفوظاتي
            </Link>
          </div>
          {published.length === 0 ? (
            <EmptyStateV2
              title="لا مسارات منشورة بعد"
              description="مسارات الحفظ تُفتح للعامة بعد اعتماد المصدر والترخيص والمراجعة."
            />
          ) : (
            <div className="flex flex-col gap-1">
              {published.map((path) => (
                <HifzPathRow key={path.id} path={path} />
              ))}
            </div>
          )}
        </section>

        <section className="mb-5" aria-labelledby="hifz-categories">
          <h2 id="hifz-categories" className="mb-2 text-base font-semibold">
            التصنيفات
          </h2>
          <div className="flex flex-col gap-1">
            {HIFZ_CATEGORIES.map((category) => {
              const count = listPublishedHifzPathsByCategory(category).length;
              return (
                <ContentRow
                  key={category}
                  href={`${PATH}/c/${category}`}
                  title={hifzCategoryLabel(category)}
                  meta={
                    count > 0
                      ? `${count} مسار منشور`
                      : "لا مسارات منشورة بعد"
                  }
                />
              );
            })}
          </div>
        </section>

        <section className="mb-2" aria-labelledby="hifz-mine-entry">
          <h2 id="hifz-mine-entry" className="sr-only">
            محفوظاتي
          </h2>
          <CompactNavigationCard
            href={`${PATH}/my`}
            title="محفوظاتي"
            description="متابعة الوحدات التي سجّلتها للمراجعة"
            icon={<BookMarked size={20} strokeWidth={1.8} aria-hidden />}
          />
        </section>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {publishedCount === 0
            ? "لا محتوى منشور للعامة في هذا القسم حاليًا."
            : `${publishedCount} مسار منشور.`}
        </p>
      </main>
    </UtilityScreen>
  );
}
