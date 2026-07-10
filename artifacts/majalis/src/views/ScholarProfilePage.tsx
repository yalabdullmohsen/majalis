import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { ArrowRight, BookOpen, MapPin, Star, ChevronLeft } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { SCHOLARS, findScholarById } from "@/lib/scholars-data";

export default function ScholarProfilePage() {
  const { id } = useParams<{ id: string }>();
  const scholar = findScholarById(id ?? "");

  useEffect(() => {
    if (!scholar) return;
    applyPageSeo({
      path: `/scholars/${scholar.id}`,
      title: `${scholar.name} — سيرة العالم | مجالس`,
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
          title={`${scholar.name} — مجالس العلم`}
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

      <div className="sch-profile-back">
        <Link href="/scholars" className="sch-related-link">
          <BookOpen size={16} /> كل العلماء <ChevronLeft size={14} />
        </Link>
      </div>
    </div>
  );
}
