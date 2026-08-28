import { useEffect, useMemo } from "react";
import { Link, useRoute } from "wouter";
import { PageShell } from "@/components/layout/PageShell";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import {
  getHistoryItem,
  HISTORY_CATEGORIES,
  ISLAMIC_HISTORY_ITEMS,
  type HistoryCategory,
  type VerificationLevel,
} from "@/data/islamic-history";
import "@/styles/pages/tarikh-islami.css";

const VERIFICATION_LABEL: Record<VerificationLevel, string> = {
  confirmed: "مؤكد",
  likely: "راجح",
  disputed: "مختلف فيه",
  "needs-review": "راجح",
};

export default function TarikhIslamiDetailPage() {
  const [, params] = useRoute("/tarikh-islami/:id");
  const id = params?.id ?? "";
  const item = getHistoryItem(id);

  const related = useMemo(() => {
    if (!item) return [];
    return ISLAMIC_HISTORY_ITEMS.filter(
      (x) =>
        x.id !== item.id &&
        (x.category === item.category ||
          x.relatedPersons?.some((p) => item.relatedPersons?.includes(p))),
    ).slice(0, 6);
  }, [item]);

  useEffect(() => {
    if (!item) {
      applyPageSeo({
        path: `/tarikh-islami/${id}`,
        title: "عنصر غير موجود | التاريخ الإسلامي",
        description: "لم يُعثر على هذا العنصر في فهرس التاريخ الإسلامي.",
        robots: "noindex, follow",
      });
      return;
    }
    applyPageSeo({
      path: `/tarikh-islami/${item.id}`,
      title: `${item.title} | التاريخ الإسلامي | المجلس العلمي`,
      description: item.summary,
      keywords: [item.title, "التاريخ الإسلامي", HISTORY_CATEGORIES[item.category]],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: item.title,
          description: item.summary,
          inLanguage: "ar",
          about: HISTORY_CATEGORIES[item.category],
        },
      ],
    });
  }, [id, item]);

  if (!item) {
    return (
      <PageShell variant="narrow" className="tarikh-page">
        <p className="tarikh-empty">لم يُعثر على هذا العنصر.</p>
        <Link href="/tarikh-islami" className="tarikh-link">
          العودة إلى التاريخ الإسلامي
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell variant="narrow" className="tarikh-page tarikh-detail" as="article">
      <nav className="tarikh-breadcrumbs" aria-label="مسار التصفح">
        <Link href="/">الرئيسية</Link>
        <span aria-hidden="true">›</span>
        <Link href="/tarikh-islami">التاريخ الإسلامي</Link>
        <span aria-hidden="true">›</span>
        <span>{item.title}</span>
      </nav>

      <header className="tarikh-detail__head">
        <p className="tarikh-detail__eyebrow">{HISTORY_CATEGORIES[item.category]}</p>
        <h1 className="tarikh-detail__title">{item.title}</h1>
        <p className="tarikh-detail__summary">{item.summary}</p>
        <div className="tarikh-detail__meta">
          {item.hijriDate ? <span>هـ: {item.hijriDate}</span> : null}
          {item.gregorianDate ? <span>م: {item.gregorianDate}</span> : null}
          {item.place ? <span>{item.place}</span> : null}
          <span className={`tarikh-badge tarikh-badge--${item.verification}`}>
            {VERIFICATION_LABEL[item.verification]}
          </span>
        </div>
        {item.portalHref ? (
          <Link href={item.portalHref} className="tarikh-chip tarikh-chip--portal">
            {item.portalLabel || "ادخل القسم التفصيلي"}
          </Link>
        ) : null}
        <ShareButtons title={item.title} />
      </header>

      <section className="tarikh-detail__section">
        <h2>الشرح</h2>
        <p className="tarikh-detail__body">{item.detail}</p>
      </section>

      {item.causes ? (
        <section className="tarikh-detail__section">
          <h2>الأسباب</h2>
          <p className="tarikh-detail__body">{item.causes}</p>
        </section>
      ) : null}

      {item.outcomes ? (
        <section className="tarikh-detail__section">
          <h2>النتائج</h2>
          <p className="tarikh-detail__body">{item.outcomes}</p>
        </section>
      ) : null}

      {item.lessons ? (
        <section className="tarikh-detail__section">
          <h2>العبر والفوائد</h2>
          <p className="tarikh-detail__body">{item.lessons}</p>
        </section>
      ) : null}

      {item.relatedPersons?.length ? (
        <section className="tarikh-detail__section">
          <h2>شخصيات مرتبطة</h2>
          <ul className="tarikh-detail__list">
            {item.relatedPersons.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="tarikh-detail__section">
        <h2>المصادر</h2>
        <ul className="tarikh-detail__list">
          {item.sources.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      {item.relatedLinks?.length ? (
        <section className="tarikh-detail__section">
          <h2>روابط ذات صلة</h2>
          <div className="tarikh-related-links">
            {item.relatedLinks.map((l) => (
              <Link key={l.href} href={l.href} className="tarikh-chip">
                {l.label}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="tarikh-detail__section">
          <h2>اقرأ أيضًا</h2>
          <ul className="tarikh-card-list">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`/tarikh-islami/${r.id}`} className="tarikh-card">
                  <span className="tarikh-card__cat">{HISTORY_CATEGORIES[r.category as HistoryCategory]}</span>
                  <span className="tarikh-card__title">{r.title}</span>
                  <span className="tarikh-card__summary">{r.summary}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <footer className="tarikh-detail__foot">
        <Link href="/tarikh-islami" className="tarikh-link">
          العودة إلى فهرس التاريخ الإسلامي
        </Link>
      </footer>
    </PageShell>
  );
}
