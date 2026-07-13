import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { ArrowRight, BookOpen, MapPin, Star, ChevronLeft } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { SCHOLARS, findScholarById } from "@/lib/scholars-data";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

// ── تحويل أرقام عربية-هندية إلى رقم ─────────────────────────────────────
const AR_DIGITS: Record<string, number> = {
  "٠": 0, "١": 1, "٢": 2, "٣": 3, "٤": 4,
  "٥": 5, "٦": 6, "٧": 7, "٨": 8, "٩": 9,
};

function parseHijriYear(died: string): number | null {
  const chars = [...died.replace(/[^٠-٩0-9]/g, "")];
  if (!chars.length) return null;
  const n = chars.reduce((acc, ch) => acc * 10 + (AR_DIGITS[ch] ?? parseInt(ch, 10)), 0);
  return n > 0 ? n : null;
}

function toArabicOrdinal(n: number): string {
  const map: Record<number, string> = {
    1: "الأول", 2: "الثاني", 3: "الثالث", 4: "الرابع", 5: "الخامس",
    6: "السادس", 7: "السابع", 8: "الثامن", 9: "التاسع", 10: "العاشر",
    11: "الحادي عشر", 12: "الثاني عشر", 13: "الثالث عشر",
    14: "الرابع عشر", 15: "الخامس عشر",
  };
  return map[n] ?? String(n);
}

// ── خط زمني للقرون الهجرية ────────────────────────────────────────────────
function ScholarTimeline({ died }: { died: string }) {
  const year = parseHijriYear(died);
  if (!year) return null;

  const century = Math.min(Math.max(Math.ceil(year / 100), 1), 15);
  const eraLabels: Record<number, string> = {
    1: "الصحابة", 2: "التابعون", 3: "تدوين السنة",
    5: "العصر الكلاسيكي", 8: "ابن تيمية", 14: "الحديث",
  };

  return (
    <section
      className="sch-profile-section"
      aria-labelledby="timeline-heading"
      style={{ padding: "1rem 1.25rem 0.5rem" }}
    >
      <h2
        id="timeline-heading"
        className="sch-profile-section__title"
        style={{ marginBottom: "0.5rem", fontSize: "0.9rem" }}
      >
        موقع العالم في التاريخ الإسلامي
      </h2>
      <p style={{ fontSize: "0.8rem", color: "var(--ds-ink-soft)", marginBottom: "0.6rem" }}>
        وفاته: {died} — القرن {toArabicOrdinal(century)} الهجري
      </p>

      {/* شريط القرون */}
      <div
        role="img"
        aria-label={`الخط الزمني: القرن ${century} الهجري`}
        style={{ width: "100%" }}
      >
        <div style={{
          display: "flex",
          height: "18px",
          borderRadius: "9px",
          overflow: "hidden",
          border: "1px solid var(--ds-line-color, #d4ccc2)",
        }}>
          {Array.from({ length: 15 }, (_, i) => i + 1).map((c) => (
            <div
              key={c}
              title={`القرن ${toArabicOrdinal(c)}${eraLabels[c] ? " — " + eraLabels[c] : ""}`}
              style={{
                flex: 1,
                background: c === century
                  ? "var(--elite-green, #0E6E52)"
                  : c <= 3
                    ? "var(--ds-parchment-deep, #ede8e0)"
                    : "var(--ds-parchment, #f5f0e8)",
                borderRight: c < 15 ? "1px solid var(--ds-line-color, #d4ccc2)" : "none",
              }}
            />
          ))}
        </div>

        {/* أرقام */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "3px",
          paddingInline: "1px",
        }}>
          {[1, 3, 5, 7, 9, 11, 13, 15].map((c) => (
            <span
              key={c}
              style={{
                fontSize: "0.62rem",
                color: c === century ? "var(--elite-green, #0E6E52)" : "var(--ds-ink-soft, #9ca3af)",
                fontWeight: c === century ? 700 : 400,
                direction: "ltr",
              }}
            >
              {c}هـ
            </span>
          ))}
        </div>

        {/* وسوم الحقب */}
        <div style={{
          marginTop: "0.5rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.3rem",
        }}>
          {Object.entries(eraLabels).map(([c, label]) => (
            <span
              key={c}
              style={{
                fontSize: "0.68rem",
                padding: "1px 6px",
                borderRadius: "4px",
                background: Number(c) === century ? "var(--elite-green, #0E6E52)" : "var(--ds-parchment-deep, #ede8e0)",
                color: Number(c) === century ? "#fff" : "var(--ds-ink-soft, #6b7280)",
                border: "1px solid var(--ds-line-color, #d4ccc2)",
              }}
            >
              ق{c} — {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ScholarProfilePage() {
  const { id } = useParams<{ id: string }>();
  const scholar = findScholarById(id ?? "");

  useEffect(() => {
    if (!scholar) return;
    applyPageSeo({
      path: `/scholars/${scholar.id}`,
      title: `${scholar.name} — سيرة العالم | المجلس العلمي`,
      description: scholar.bio,
      keywords: [scholar.name, scholar.fullName, scholar.era, ...scholar.specialty],
      jsonLd: [{
        "@context": "https://schema.org",
        "@type": "Person",
        name: scholar.fullName,
        alternateName: scholar.name,
        description: scholar.bio,
        knowsAbout: scholar.specialty,
        url: `https://majlisilm.com/scholars/${scholar.id}`,
      }],
    });
  }, [scholar]);

  if (!scholar) {
    return (
      <div className="page-shell">
        <div className="sch-profile-notfound">
          <h1>العالم غير موجود</h1>
          <p>لم يُعثر على هذا العالم في قاعدة بياناتنا.</p>
          <Link href="/scholars" className="btn-primary">العودة لقائمة العلماء</Link>
        </div>
      </div>
    );
  }

  const idx = SCHOLARS.findIndex(s => s.id === scholar.id);
  const prev = idx > 0 ? SCHOLARS[idx - 1] : null;
  const next = idx < SCHOLARS.length - 1 ? SCHOLARS[idx + 1] : null;

  return (
    <div className="page-shell">
      {/* Breadcrumb */}
      <nav className="sch-profile-breadcrumb" aria-label="مسار التنقل">
        <Link href="/scholars">أعلام الإسلام</Link>
        <ChevronLeft size={14} aria-hidden="true" />
        <span>{scholar.name}</span>
      </nav>

      {/* Hero */}
      <header className="sch-profile-hero">
        <div className="sch-profile-avatar" aria-hidden="true">
          <span>{scholar.name[0]}</span>
        </div>
        <div className="sch-profile-hero__body">
          <h1 className="sch-profile-hero__name">{scholar.name}</h1>
          <p className="sch-profile-hero__fullname">{scholar.fullName}</p>
          <div className="sch-profile-hero__meta">
            <span className="sch-tag">{scholar.era}</span>
            {scholar.madhhab && <span className="sch-tag sch-tag--madhhab">{scholar.madhhab}</span>}
            {scholar.specialty.map(sp => (
              <span key={sp} className="sch-tag">{sp}</span>
            ))}
          </div>
          <p className="sch-profile-hero__died">
            <MapPin size={13} aria-hidden="true" /> {scholar.region} · ت {scholar.died}
          </p>
        </div>
      </header>

      {/* خط زمني */}
      <ScholarTimeline died={scholar.died} />

      {/* ملاحظة مصادر الترجمة */}
      <div className="stb-wrap stb-wrap--compact stb-wrap--empty" role="note" dir="rtl">
        <p className="stb-missing" style={{ fontSize: "0.8rem", color: "var(--clr-ink-soft)" }}>
          المعلومات الواردة نُقلت من مصادر التراجم المعتمدة (طبقات ابن سعد، سير أعلام النبلاء، وفيات الأعيان).
          عند وجود نقص أو خطأ يُرجى الإبلاغ.
        </p>
      </div>

      {/* Bio */}
      <section className="sch-profile-section" aria-labelledby="bio-heading">
        <h2 id="bio-heading" className="sch-profile-section__title">نبذة تعريفية</h2>
        <p className="sch-profile-bio">{scholar.bio}</p>
      </section>

      {/* Quote */}
      {scholar.quote && (
        <blockquote className="sch-profile-quote">
          <Star size={16} className="sch-profile-quote__icon" aria-hidden="true" />
          <p>«{scholar.quote}»</p>
          <footer>— {scholar.name}</footer>
        </blockquote>
      )}

      {/* Key Works */}
      <section className="sch-profile-section" aria-labelledby="works-heading">
        <h2 id="works-heading" className="sch-profile-section__title">
          <BookOpen size={16} aria-hidden="true" /> أبرز المؤلفات
        </h2>
        <ul className="sch-profile-works">
          {scholar.key_works.map(w => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </section>

      {/* Share */}
      <div className="twh-share">
        <ShareButtons
          title={`${scholar.name} — المجلس العلمي`}
          url={`https://majlisilm.com/scholars/${scholar.id}`}
        />
      </div>

      {/* Prev / Next */}
      <nav className="sch-profile-pager" aria-label="التنقل بين العلماء">
        {prev && (
          <Link href={`/scholars/${prev.id}`} className="sch-profile-pager__btn sch-profile-pager__btn--prev">
            <ArrowRight size={16} aria-hidden="true" />
            <span>{prev.name}</span>
          </Link>
        )}
        {next && (
          <Link href={`/scholars/${next.id}`} className="sch-profile-pager__btn sch-profile-pager__btn--next">
            <span>{next.name}</span>
            <ChevronLeft size={16} aria-hidden="true" />
          </Link>
        )}
      </nav>

      <div className="px-4 pb-4 mt-2">
        <SectionQuiz categoryId={["tarikh", "akhlaq"]} title="اختبر معلوماتك في التاريخ الإسلامي" count={4} />
      </div>
      <div className="sch-profile-back">
        <Link href="/scholars" className="sch-related-link">
          <BookOpen size={16} /> كل العلماء <ChevronLeft size={14} />
        </Link>
      </div>
    </div>
  );
}
