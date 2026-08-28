import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { Search } from "lucide-react";
import { PageHeader, SkeletonCardGrid } from "@/components/ui-common";
import { PageShell } from "@/components/layout/PageShell";
import { applyPageSeo } from "@/lib/seo";
import { arabicMatchAny } from "@/lib/arabic-search";
import { getUnifiedLessonsSplit } from "@/lib/lessons-service";
import { buildTeachersFromLessons } from "@/lib/teachers-index";
import { hrefTeachers } from "@/lib/content-href";
import { toArabicDigits } from "@/lib/utils";
import "@/styles/pages/teachers.css";

export default function TeachersIndexPage() {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<ReturnType<typeof buildTeachersFromLessons>>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    applyPageSeo({
      path: "/teachers",
      title: "المشايخ المعاصرون — دروس الكويت | سُنّة",
      description:
        "فهرس المشايخ المعاصرين من دروس الكويت المجدولة في سُنّة — أسماء ومواعيد من بيانات الدروس فقط. لعلماء التراث راجع قسم التاريخ الإسلامي.",
      keywords: ["مشايخ", "دروس الكويت", "محاضرات", "سُنّة"],
    });
  }, []);

  useEffect(() => {
    getUnifiedLessonsSplit()
      .then(({ lessons }) => setTeachers(buildTeachersFromLessons(lessons)))
      .catch(() => setTeachers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return teachers;
    return teachers.filter((t) => arabicMatchAny([t.name], search));
  }, [teachers, search]);

  return (
    <PageShell variant="narrow" className="tch-page">
      <PageHeader
        eyebrow="دروس الكويت"
        title="المشايخ المعاصرون"
        subtitle="مشايخ معاصرون من دروس الكويت — أسماء مستخرجة من جدول الدروس المعتمدة دون تراجم إضافية."
      />

      <p className="tch-notice">
        هذا الفهرس للمشايخ الذين تظهر دروسهم في جدول الكويت. لسِيَر علماء التراث والأئمة عبر القرون،
        {" "}
        <Link href="/tarikh-islami">راجع قسم التاريخ الإسلامي</Link>.
      </p>

      <div className="tch-search-wrap">
        <Search size={16} className="sch-search-icon" aria-hidden="true" />
        <input
          className="tch-search-input sch-search-input"
          type="search"
          aria-label="ابحث في المشايخ"
          placeholder="ابحث باسم الشيخ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <SkeletonCardGrid count={8} />
      ) : filtered.length === 0 ? (
        <p className="tch-empty">لا يوجد مشايخ مطابقون للبحث.</p>
      ) : (
        <div className="tch-grid" role="list">
          {filtered.map((teacher) => (
            <Link
              key={teacher.slug}
              href={hrefTeachers(teacher.slug)}
              className="tch-card"
              role="listitem"
            >
              <img
                src={teacher.photoUrl}
                alt=""
                className="tch-card__photo"
                loading="lazy"
                decoding="async"
                width={72}
                height={72}
              />
              <span className="tch-card__name">{teacher.name}</span>
              <span className="tch-card__count">
                {toArabicDigits(String(teacher.lessonCount))} درس
                {teacher.activeCount > 0 && teacher.archivedCount > 0
                  ? ` (${toArabicDigits(String(teacher.activeCount))} نشط)`
                  : ""}
              </span>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
