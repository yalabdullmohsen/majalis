import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import {
  RESEARCH_KIND_LABELS,
  ACADEMIC_LEVEL_LABELS,
  LICENSE_LABELS,
  REVIEW_STATUS_LABELS,
  RIGHTS_DISCLAIMER,
  PERSONAL_RESEARCH_NOTICE,
  PLATFORM_OWNERSHIP_NOTICE,
  categoryLabel,
  getResearchByIdOrSlug,
  recordResearchView,
  getLocalViewCount,
  similarResearches,
  researchesByAuthor,
  formatCitation,
  canDownloadFile,
  canViewFullText,
  type CitationStyle,
} from "@/lib/researches";
import "@/styles/pages/researches.css";

export default function ResearchDetailPage() {
  const params = useParams<{ id?: string }>();
  const id = params.id || "";
  const research = useMemo(() => getResearchByIdOrSlug(id), [id]);
  const [citeStyle, setCiteStyle] = useState<CitationStyle>("arabic");
  const [copied, setCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");

  useEffect(() => {
    if (!research) return;
    recordResearchView(research.id);
    applyPageSeo({
      path: `/academic-research/${research.slug}`,
      title: `${research.title} | الأبحاث الشرعية`,
      description: research.abstract.slice(0, 160),
      keywords: research.keywords,
      robots: research.reviewStatus !== "published" || research.isPersonal ? "noindex,nofollow" : undefined,
      jsonLd: research.reviewStatus === "published"
        ? [{
            "@context": "https://schema.org",
            "@type": "ScholarlyArticle",
            headline: research.title,
            author: research.authors.map((a) => ({ "@type": "Person", name: a.name })),
            datePublished: research.year ? String(research.year) : undefined,
            abstract: research.abstract,
            inLanguage: research.language,
            url: `https://www.majlisilm.com/academic-research/${research.slug}`,
            identifier: research.doi || undefined,
          }]
        : undefined,
    });
  }, [research]);

  if (!research) {
    return (
      <div className="sr-page">
        <div className="sr-empty">
          <p><strong>البحث غير متاح</strong></p>
          <p>قد يكون قيد المراجعة أو غير موجود.</p>
          <Link href="/academic-research" className="sr-btn sr-btn--outline">العودة للمكتبة</Link>
        </div>
      </div>
    );
  }

  if (research.isPersonal && research.reviewStatus !== "published") {
    return (
      <div className="sr-page">
        <div className="sr-empty">
          <p><strong>بحث شخصي قيد المراجعة</strong></p>
          <p>لا يُعرض للعامة حتى اعتماد مراجع مخوّل.</p>
          <Link href="/academic-research" className="sr-btn sr-btn--outline">العودة</Link>
        </div>
      </div>
    );
  }

  const citation = formatCitation(research, citeStyle);
  const similar = similarResearches(research);
  const byAuthor = researchesByAuthor(research.authors[0]?.name || "", research.id);
  const views = (research.viewCount || 0) + getLocalViewCount(research.id);

  const copyCite = async () => {
    try {
      await navigator.clipboard.writeText(citation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="sr-page">
      <p style={{ marginBottom: "0.75rem" }}>
        <Link href="/academic-research" className="sr-section__link">← الأبحاث الشرعية</Link>
      </p>
      <h1 className="sr-detail__h1">{research.title}</h1>
      {research.titleEn && <p style={{ color: "var(--color-text-muted)" }}>{research.titleEn}</p>}
      <p className="sr-detail__authors" aria-label="الباحثون">
        {research.authors.map((a) => a.name).join("، ")}
        {research.supervisor ? ` — إشراف: ${research.supervisor}` : ""}
      </p>

      <div className="sr-detail__grid">
        <div className="sr-detail__cell"><strong>نوع البحث</strong>{RESEARCH_KIND_LABELS[research.kind]}</div>
        {research.academicLevel && (
          <div className="sr-detail__cell"><strong>المرحلة</strong>{ACADEMIC_LEVEL_LABELS[research.academicLevel]}</div>
        )}
        {research.university && <div className="sr-detail__cell"><strong>الجامعة</strong>{research.university}</div>}
        {research.college && <div className="sr-detail__cell"><strong>الكلية</strong>{research.college}</div>}
        {research.department && <div className="sr-detail__cell"><strong>القسم</strong>{research.department}</div>}
        {research.year && <div className="sr-detail__cell"><strong>سنة النشر</strong>{research.year}</div>}
        {research.country && <div className="sr-detail__cell"><strong>الدولة</strong>{research.country}</div>}
        <div className="sr-detail__cell"><strong>اللغة</strong>{research.language}</div>
        {research.pageCount != null && <div className="sr-detail__cell"><strong>الصفحات</strong>{research.pageCount}</div>}
        <div className="sr-detail__cell"><strong>الترخيص</strong>{LICENSE_LABELS[research.license]}</div>
        <div className="sr-detail__cell"><strong>حالة المراجعة</strong>{REVIEW_STATUS_LABELS[research.reviewStatus]}</div>
        {research.doi && <div className="sr-detail__cell"><strong>DOI</strong>{research.doi}</div>}
        {research.publisher && <div className="sr-detail__cell"><strong>جهة النشر</strong>{research.publisher}</div>}
        {research.volumeIssue && <div className="sr-detail__cell"><strong>المجلد/العدد</strong>{research.volumeIssue}</div>}
        <div className="sr-detail__cell"><strong>المشاهدات</strong>{views}</div>
        <div className="sr-detail__cell">
          <strong>التصنيف</strong>
          {research.categoryIds.map((c) => categoryLabel(c)).join("، ")}
        </div>
      </div>

      <section className="sr-section">
        <h2 className="sr-section__title">الملخص</h2>
        <p className="sr-prose">{research.abstract}</p>
      </section>

      {research.keywords.length > 0 && (
        <p className="sr-card__meta" style={{ marginBottom: "1rem" }}>
          {research.keywords.map((k) => <span key={k} className="sr-badge">{k}</span>)}
        </p>
      )}

      {research.problemStatement && (
        <section className="sr-section"><h2 className="sr-section__title">إشكالية البحث</h2><p className="sr-prose">{research.problemStatement}</p></section>
      )}
      {research.objectives?.length ? (
        <section className="sr-section"><h2 className="sr-section__title">الأهداف</h2><ul className="sr-prose">{research.objectives.map((o) => <li key={o}>{o}</li>)}</ul></section>
      ) : null}
      {research.methodology && (
        <section className="sr-section"><h2 className="sr-section__title">المنهج</h2><p className="sr-prose">{research.methodology}</p></section>
      )}
      {research.findings?.length ? (
        <section className="sr-section"><h2 className="sr-section__title">أهم النتائج</h2><ul className="sr-prose">{research.findings.map((o) => <li key={o}>{o}</li>)}</ul></section>
      ) : null}
      {research.recommendations?.length ? (
        <section className="sr-section"><h2 className="sr-section__title">التوصيات</h2><ul className="sr-prose">{research.recommendations.map((o) => <li key={o}>{o}</li>)}</ul></section>
      ) : null}
      {research.tableOfContents && (
        <section className="sr-section"><h2 className="sr-section__title">الفهرس</h2><pre className="sr-cite-box">{research.tableOfContents}</pre></section>
      )}
      {research.referencesNote && (
        <section className="sr-section"><h2 className="sr-section__title">المراجع</h2><p className="sr-prose">{research.referencesNote}</p></section>
      )}

      {research.sourceUrl && (
        <p>
          <a href={research.sourceUrl} target="_blank" rel="noopener noreferrer" className="sr-btn sr-btn--outline">
            المصدر الأصلي
          </a>
        </p>
      )}

      {!canViewFullText(research) && (
        <p className="sr-notice">
          النص الكامل غير متاح على المنصة وفق حقوق النشر. تُعرض البيانات الوصفية والملخص والرابط الرسمي فقط.
        </p>
      )}
      {canDownloadFile(research) && research.filePath && (
        <p><a className="sr-btn sr-btn--outline" href={research.filePath}>تنزيل الملف (بإذن)</a></p>
      )}

      <section className="sr-section">
        <h2 className="sr-section__title">التوثيق العلمي</h2>
        <div className="sr-filters">
          {(["arabic", "apa", "chicago", "mla"] as CitationStyle[]).map((s) => (
            <button key={s} type="button" className={`sr-btn sr-btn--outline${citeStyle === s ? "" : ""}`} onClick={() => setCiteStyle(s)}>
              {s === "arabic" ? "عربي أكاديمي" : s.toUpperCase()}
            </button>
          ))}
          <button type="button" className="sr-btn sr-btn--outline" onClick={copyCite}>
            {copied ? "تم النسخ" : "نسخ التوثيق"}
          </button>
        </div>
        <div className="sr-cite-box">{citation}</div>
      </section>

      <p className="sr-notice">{RIGHTS_DISCLAIMER} {PLATFORM_OWNERSHIP_NOTICE}</p>
      {research.isPersonal && <p className="sr-notice">{PERSONAL_RESEARCH_NOTICE}</p>}

      <p>
        <button type="button" className="sr-btn sr-btn--outline" onClick={() => setReportOpen((v) => !v)}>
          إبلاغ عن خطأ أو انتهاك حقوق
        </button>
      </p>
      {reportOpen && (
        <div className="sr-form">
          <label>
            تفاصيل البلاغ
            <textarea value={reportText} onChange={(e) => setReportText(e.target.value)} />
          </label>
          <button
            type="button"
            className="sr-btn sr-btn--outline"
            onClick={() => {
              try {
                const key = "majlis:researches:reports:v1";
                const prev = JSON.parse(localStorage.getItem(key) || "[]");
                prev.unshift({ researchId: research.id, details: reportText, at: new Date().toISOString() });
                localStorage.setItem(key, JSON.stringify(prev.slice(0, 50)));
                setReportText("");
                setReportOpen(false);
                alert("تم استلام البلاغ للمراجعة.");
              } catch {
                alert("تعذّر حفظ البلاغ محليًا.");
              }
            }}
          >
            إرسال البلاغ
          </button>
        </div>
      )}

      {similar.length > 0 && (
        <section className="sr-section">
          <h2 className="sr-section__title">أبحاث مشابهة</h2>
          <div className="sr-list">
            {similar.map((r) => (
              <Link key={r.id} href={`/academic-research/${r.slug}`} className="sr-card">
                <h3 className="sr-card__title">{r.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}
      {byAuthor.length > 0 && (
        <section className="sr-section">
          <h2 className="sr-section__title">أبحاث لنفس الباحث</h2>
          <div className="sr-list">
            {byAuthor.map((r) => (
              <Link key={r.id} href={`/academic-research/${r.slug}`} className="sr-card">
                <h3 className="sr-card__title">{r.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ShareButtons title={research.title} url={`https://www.majlisilm.com/academic-research/${research.slug}`} />
    </div>
  );
}
