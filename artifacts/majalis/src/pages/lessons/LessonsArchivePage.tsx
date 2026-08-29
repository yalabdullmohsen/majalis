import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import { PageLoadingGuard } from "@/components/PageLoadingGuard";
import { PageShell } from "@/components/layout/PageShell";
import { UnifiedLessonCard } from "@/components/lessons/UnifiedLessonCard";
import { ExploreAlsoNav } from "@/components/ExploreAlsoNav";
import { applyPageSeo } from "@/lib/seo";
import { getUnifiedLessonsSplit } from "@/lib/lessons-service";
import { RequestManager } from "@/lib/request-manager";
import {
  DEFAULT_KUWAIT_FILTERS,
  filterKuwaitLessons,
  sortKuwaitLessons,
  type KuwaitLessonFilters,
  type KuwaitLessonRecord,
} from "@/lib/kuwait-lessons";
import { fromKuwaitLesson } from "@/lib/unified-lesson-card";
import { toArabicDigits } from "@/lib/utils";
import "@/styles/pages/lessons.css";

/**
 * أرشيف الدروس المنتهية — مسار مستقل /lessons/archive.
 * القائمة النشطة في /lessons لا تعرض المنتهي.
 */
export default function LessonsArchivePage() {
  const [archived, setArchived] = useState<KuwaitLessonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<KuwaitLessonFilters>({
    ...DEFAULT_KUWAIT_FILTERS,
  });

  useEffect(() => {
    applyPageSeo({
      path: "/lessons/archive",
      canonicalPath: "/lessons/archive",
      title: "أرشيف الدروس السابقة | سُنّة",
      description:
        "دروس ودورات انتهت مواعيدها — مؤرشفة تلقائياً من القائمة النشطة في سُنّة.",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "الرئيسية", item: "https://majlisilm.com/" },
            { "@type": "ListItem", position: 2, name: "الدروس", item: "https://majlisilm.com/lessons" },
            {
              "@type": "ListItem",
              position: 3,
              name: "الأرشيف",
              item: "https://majlisilm.com/lessons/archive",
            },
          ],
        },
      ],
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    setLoadError(null);
    RequestManager.run("lessons:archive-split", () => getUnifiedLessonsSplit())
      .then(({ archived: rows }) => setArchived(rows))
      .catch((err) => {
        setLoadError(String((err as Error)?.message || err));
        setArchived([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => sortKuwaitLessons(filterKuwaitLessons(archived, filters)),
    [archived, filters],
  );

  return (
    <PageShell density="medium" variant="wide" className="lessons-archive-page">
      <PageHeader
        title="أرشيف الدروس"
        subtitle="دروس ودورات انتهت مواعيدها. القائمة النشطة لا تعرض المنتهي."
        showBack={false}
      />

      <p className="lessons-archive-back">
        <Link href="/lessons">← العودة إلى الدروس النشطة</Link>
        {archived.length > 0 ? (
          <span className="lessons-archive-count">
            {" "}
            · {toArabicDigits(archived.length)} مؤرشَف
          </span>
        ) : null}
      </p>

      <label className="lessons-archive-search">
        <span className="sr-only">بحث في الأرشيف</span>
        <input
          type="search"
          className="adm-input"
          placeholder="بحث في العنوان أو الشيخ أو المسجد…"
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
          enterKeyHint="search"
          autoComplete="off"
        />
      </label>

      <PageLoadingGuard loading={loading} error={loadError} onRetry={() => window.location.reload()}>
        {filtered.length === 0 ? (
          <div className="lessons-empty-state lessons-archive-empty" style={{ minHeight: 240 }}>
            <p>لا دروس مؤرشفة حالياً{filters.search.trim() ? " تطابق البحث" : ""}.</p>
            <Link href="/lessons" className="m2030-tile">
              تصفّح الدروس النشطة
            </Link>
          </div>
        ) : (
          <div className="page-card-grid lesson-unified-grid">
            {filtered.map((lesson) => (
              <UnifiedLessonCard
                key={`archive-${lesson.id}`}
                lesson={fromKuwaitLesson(lesson, true)}
                compact
              />
            ))}
          </div>
        )}
      </PageLoadingGuard>

      <ExploreAlsoNav
        links={[
          { href: "/lessons", label: "الدروس النشطة" },
          { href: "/calendar", label: "التقويم" },
          { href: "/tarikh-islami", label: "التاريخ الإسلامي" },
        ]}
      />
    </PageShell>
  );
}
