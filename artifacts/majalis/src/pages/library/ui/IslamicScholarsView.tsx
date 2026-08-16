import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ChevronLeft, BookOpen, Star } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { SCHOLARS } from "@/lib/scholars-data";
import {
  inferScholarCautionLevel,
  inferScholarRoleType,
  SCHOLAR_ROLE_FILTERS,
  scholarCautionLabel,
  type ScholarRoleType,
} from "@/lib/scholar-roles";
import { resolveScholarWorkLink } from "@/lib/scholar-library-links";
import { ActiveFilters, FilterBar, SegmentedFilter } from "@/components/filters";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import "@/styles/pages/scholars.css";

import { SITE_URL } from "@/lib/site-config";
const ERAS = ["الكل", "الأئمة الأربعة", "المحدثون", "العلماء الكبار", "المجددون", "المعاصرون"];
const SPECIALTIES = ["الكل", "فقه", "حديث", "عقيدة", "تفسير", "أصول", "مقاصد", "لغة", "سيرة", "رجال"];
const ROLE_ITEMS = SCHOLAR_ROLE_FILTERS.map((r) => ({ id: r, label: r }));

export default function IslamicScholarsPage() {
  const [era, setEra] = useState("الكل");
  const [specialty, setSpecialty] = useState("الكل");
  const [roleType, setRoleType] = useState<ScholarRoleType | "الكل">("الكل");
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/scholars",
      title: "أعلام الإسلام، العلماء والمحدثون والفقهاء | المجلس العلمي",
      description: "سِيَر أبرز علماء الإسلام عبر القرون: الأئمة الأربعة، المحدثون، الفقهاء، والمعاصرون — مع تمييز الدور والتنبيه المنهجي عند الحاجة.",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "أعلام الإسلام عبر القرون",
          description: "سِيَر علماء الإسلام مع تمييز التخصص والدور",
          numberOfItems: SCHOLARS.length,
          itemListElement: SCHOLARS.slice(0, 20).map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: s.fullName || s.name,
            url: `${SITE_URL}/scholars#${s.id}`,
          })),
        },
      ],
    });
  }, []);

  const filtered = useMemo(
    () =>
      SCHOLARS.filter((s) => {
        const matchEra = era === "الكل" || s.era === era;
        const matchSpec = specialty === "الكل" || s.specialty.includes(specialty);
        const matchRole = roleType === "الكل" || inferScholarRoleType(s) === roleType;
        const matchQ = arabicMatchAny([s.name, s.fullName, s.bio, ...s.specialty], debouncedQuery);
        return matchEra && matchSpec && matchRole && matchQ;
      }),
    [era, specialty, roleType, debouncedQuery],
  );

  const activeItems = [
    ...(era !== "الكل" ? [{ id: "era", label: era, onRemove: () => setEra("الكل") }] : []),
    ...(specialty !== "الكل"
      ? [{ id: "spec", label: specialty, onRemove: () => setSpecialty("الكل") }]
      : []),
    ...(roleType !== "الكل"
      ? [{ id: "role", label: roleType, onRemove: () => setRoleType("الكل") }]
      : []),
    ...(debouncedQuery.trim()
      ? [{ id: "q", label: `بحث: ${debouncedQuery.trim()}`, onRemove: () => setQuery("") }]
      : []),
  ];

  return (
    <div className="sch-page" dir="rtl">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="sch-hero">
        <h1 className="sch-hero__title">أعلام الإسلام</h1>
        <p className="sch-hero__sub">
          سِيَر أبرز علماء الإسلام عبر القرون، الأئمة الأربعة والمحدثون والعلماء المعاصرون
        </p>
        <div className="sch-hero__stats">
          <span><strong>{SCHOLARS.length}</strong> عالماً</span>
          <span><strong>{ERAS.length - 1}</strong> حقبة</span>
          <span><strong>١٤٠٠</strong> سنة من العلم</span>
        </div>
      </section>

      {/* ── بحث وتصفية ────────────────────────────────────────── */}
      <div className="sch-controls">
        <FilterBar
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="ابحث في العلماء..."
          searchAriaLabel="ابحث في العلماء"
          activeCount={activeItems.length}
          onClearAll={
            activeItems.length > 0
              ? () => {
                  setEra("الكل");
                  setSpecialty("الكل");
                  setRoleType("الكل");
                  setQuery("");
                }
              : undefined
          }
        />
        <div className="sch-filters">
          <p className="sch-filter-label">الحقبة</p>
          <SegmentedFilter
            ariaLabel="تصفية حسب الحقبة"
            value={era}
            onChange={setEra}
            items={ERAS.map((e) => ({ id: e, label: e }))}
          />
          <p className="sch-filter-label">الدور</p>
          <SegmentedFilter
            ariaLabel="تصفية حسب الدور"
            value={roleType}
            onChange={(v) => setRoleType(v as ScholarRoleType | "الكل")}
            items={ROLE_ITEMS}
          />
          <p className="sch-filter-label">التخصص</p>
          <SegmentedFilter
            ariaLabel="تصفية حسب التخصص"
            value={specialty}
            onChange={setSpecialty}
            items={SPECIALTIES.map((s) => ({ id: s, label: s }))}
          />
        </div>
        <ActiveFilters items={activeItems} resultCount={filtered.length} />
      </div>

      {/* ── شبكة العلماء ──────────────────────────────────────── */}
      <div className="sch-grid">
        {filtered.map(s => {
          const isOpen = expanded === s.id;
          const role = inferScholarRoleType(s);
          const caution = scholarCautionLabel(inferScholarCautionLevel(s));
          return (
            <article key={s.id} className={["sch-card", isOpen ? "sch-card--open" : ""].join(" ")}>
              <div className="sch-card__header" role="button" tabIndex={0}
                onClick={() => setExpanded(isOpen ? null : s.id)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setExpanded(isOpen ? null : s.id)}
                aria-expanded={isOpen} aria-controls={`sch-body-${s.id}`}>
                <div className="sch-card__avatar">
                  <span className="sch-card__initial">{s.name[0]}</span>
                </div>
                <div className="sch-card__meta">
                  <h2 className="sch-card__name">{s.name}</h2>
                  <p className="sch-card__fullname">{s.fullName}</p>
                  <div className="sch-card__tags">
                    <span className="sch-tag sch-tag--role">{role}</span>
                    {s.specialty.map(sp => (
                      <span key={sp} className="sch-tag">{sp}</span>
                    ))}
                    {s.madhhab && <span className="sch-tag sch-tag--madhhab">{s.madhhab}</span>}
                    {caution && <span className="sch-tag sch-tag--caution">{caution}</span>}
                  </div>
                </div>
                <div className="sch-card__right">
                  <span className="sch-card__era">{s.era}</span>
                  <span className="sch-card__died">ت {s.died}</span>
                </div>
              </div>

              <p className="sch-card__bio">{s.bio}</p>

              {isOpen && (
                <div id={`sch-body-${s.id}`} className="sch-card__details">
                  {s.quote && (
                    <blockquote className="sch-card__quote">
                      <Star size={14} className="sch-card__quote-icon" />
                      «{s.quote}»
                    </blockquote>
                  )}
                  <div className="sch-card__works">
                    <h3 className="sch-card__works-title">
                      <BookOpen size={14} /> أبرز المؤلفات
                    </h3>
                    <ul className="sch-card__works-list">
                      {s.key_works.map((w) => {
                        const link = resolveScholarWorkLink(w, s.name);
                        return (
                          <li key={w}>
                            {link.href ? (
                              <Link href={link.href}>{link.label}</Link>
                            ) : (
                              <span className="sch-work--plain">{link.label}</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <p className="sch-card__region">📍 {s.region}</p>
                  <div className="sch-card__actions">
                    <Link href={`/scholars/${s.id}`} className="sch-card__profile-link">
                      الصفحة الكاملة <ChevronLeft size={13} />
                    </Link>
                    <button type="button" className="sch-card__close" onClick={() => setExpanded(null)}>
                      إغلاق التفاصيل
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="sch-empty">
          <BookOpen size={40} />
          <p>لا توجد نتائج للبحث عن «{query}»</p>
          <button type="button" onClick={() => { setQuery(""); setEra("الكل"); setSpecialty("الكل"); setRoleType("الكل"); }}>
            مسح التصفية
          </button>
        </div>
      )}

      <SectionQuiz
        categoryId={["akhlaq", "tarikh"]}
        title="اختبر معلوماتك في تاريخ العلماء والصحابة"
        count={4}
      />

      {/* ── روابط ذات صلة ─────────────────────────────────────── */}
      <div className="twh-share">
        <ShareButtons title="العلماء المسلمون — المجلس العلمي" url={`${SITE_URL}/scholars`} />
      </div>

      <div className="sch-related">
        <Link href="/lessons" className="sch-related-link">
          <BookOpen size={16} /> دروس المشايخ <ChevronLeft size={14} />
        </Link>
        <Link href="/hadith" className="sch-related-link">
          <BookOpen size={16} /> الحديث وعلومه <ChevronLeft size={14} />
        </Link>
      </div>
    </div>
  );
}
