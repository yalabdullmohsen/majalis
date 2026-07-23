import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Search, ChevronLeft, BookOpen, Star, Filter } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { arabicMatchAny } from "@/lib/arabic-search";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { SCHOLARS } from "@/lib/scholars-data";

const ERAS = ["الكل", "الأئمة الأربعة", "المحدثون", "العلماء الكبار", "المجددون", "المعاصرون"];
const SPECIALTIES = ["الكل", "فقه", "حديث", "عقيدة", "تفسير", "أصول", "مقاصد", "لغة", "سيرة", "رجال"];

export default function IslamicScholarsPage() {
  const [era, setEra] = useState("الكل");
  const [specialty, setSpecialty] = useState("الكل");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/scholars",
      title: "أعلام الإسلام، العلماء والمحدثون والفقهاء | المجلس العلمي",
      description: "سِيَر أبرز علماء الإسلام عبر القرون، الأئمة الأربعة، المحدثون، العلماء المعاصرون",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "أعلام الإسلام عبر القرون",
          description: "سِيَر أبرز علماء الإسلام: الأئمة الأربعة والمحدثون والفقهاء والمعاصرون",
          numberOfItems: SCHOLARS.length,
          itemListElement: SCHOLARS.slice(0, 20).map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: s.fullName || s.name,
            url: `https://www.majlisilm.com/scholars#${s.id}`,
          })),
        },
      ],
    });
  }, []);

  const filtered = SCHOLARS.filter(s => {
    const matchEra = era === "الكل" || s.era === era;
    const matchSpec = specialty === "الكل" || s.specialty.includes(specialty);
    const matchQ = arabicMatchAny([s.name, s.fullName, s.bio, ...s.specialty], query);
    return matchEra && matchSpec && matchQ;
  });

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
        <div className="sch-search-wrap">
          <Search size={16} className="sch-search-icon" />
          <input
            className="sch-search-input"
            type="search"
            aria-label="ابحث في العلماء" placeholder="ابحث في العلماء..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="sch-filters">
          <div className="sch-filter-group" role="tablist" aria-label="تصفية حسب الحقبة">
            <Filter size={13} />
            <span>الحقبة:</span>
            {ERAS.map(e => (
              <button
                key={e}
                role="tab"
                type="button"
                className={["sch-filter-btn", era === e ? "sch-filter-btn--active" : ""].join(" ")}
                onClick={() => setEra(e)}
                aria-selected={era === e}
              >
                {e}
              </button>
            ))}
          </div>
          <div className="sch-filter-group" role="tablist" aria-label="تصفية حسب التخصص">
            <span>التخصص:</span>
            {SPECIALTIES.map(s => (
              <button
                key={s}
                role="tab"
                type="button"
                className={["sch-filter-btn", specialty === s ? "sch-filter-btn--active" : ""].join(" ")}
                onClick={() => setSpecialty(s)}
                aria-selected={specialty === s}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── نتيجة البحث ────────────────────────────────────────── */}
      <p className="sch-results-count" aria-live="polite" aria-atomic="true">
        {filtered.length === SCHOLARS.length
          ? `${SCHOLARS.length} عالماً`
          : `${filtered.length} من ${SCHOLARS.length} عالماً`}
      </p>

      {/* ── شبكة العلماء ──────────────────────────────────────── */}
      <div className="sch-grid">
        {filtered.map(s => {
          const isOpen = expanded === s.id;
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
                    {s.specialty.map(sp => (
                      <span key={sp} className="sch-tag">{sp}</span>
                    ))}
                    {s.madhhab && <span className="sch-tag sch-tag--madhhab">{s.madhhab}</span>}
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
                      {s.key_works.map(w => (
                        <li key={w}>{w}</li>
                      ))}
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
          <Search size={40} />
          <p>لا توجد نتائج للبحث عن «{query}»</p>
          <button type="button" onClick={() => { setQuery(""); setEra("الكل"); setSpecialty("الكل"); }}>
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
        <ShareButtons title="العلماء المسلمون — المجلس العلمي" url="https://www.majlisilm.com/scholars" />
      </div>

      <div className="sch-related">
        <Link href="/lessons" className="sch-related-link">
          <BookOpen size={16} /> دروس المشايخ <ChevronLeft size={14} />
        </Link>
        <Link href="/knowledge-map" className="sch-related-link">
          <Star size={16} /> الخريطة المعرفية <ChevronLeft size={14} />
        </Link>
        <Link href="/library" className="sch-related-link">
          <BookOpen size={16} /> المكتبة الإسلامية <ChevronLeft size={14} />
        </Link>
      </div>
    </div>
  );
}
