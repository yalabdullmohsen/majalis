import { Link, useRoute } from "wouter";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader, Loading } from "@/components/ui-common";
import { ResearchCard } from "@/components/scientific-research/ResearchCard";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";
import {
  buildResearchJsonLd,
  buildThesisJsonLd,
} from "@/lib/scientific-research/service";
import { applyPageSeo } from "@/lib/seo";
import type { ResearchPaper } from "@/lib/scientific-research/types";
import {
  RESEARCH_BASE_PATH,
  DEGREE_LABELS,
  COPYRIGHT_LABELS,
} from "@/lib/scientific-research/constants";
import { ContactChatReportButton } from "@/components/ContactChatReportButton";

export default function ScientificResearchDetailPage() {
  const [, params] = useRoute(`${RESEARCH_BASE_PATH}/:slug`);
  const slug = params?.slug || "";
  const [paper, setPaper] = useState<ResearchPaper | null>(null);
  const [similar, setSimilar] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/scientific-research?action=get&slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.paper) {
          setPaper(d.paper);
          setSimilar(d.similar || []);
          applyPageSeo({
            path: `${RESEARCH_BASE_PATH}/${slug}`,
            title: `${d.paper.title} | الأبحاث العلمية`,
            description: d.paper.abstract_short || d.paper.abstract_full?.slice(0, 160),
            jsonLd: [buildResearchJsonLd(d.paper), buildThesisJsonLd(d.paper)],
          });
          fetch("/api/scientific-research?action=view", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
          }).catch(() => {});
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async () => {
    if (navigator.share && paper) {
      await navigator.share({ title: paper.title, url: window.location.href });
    } else {
      copyLink();
    }
  };

  const trackDownload = () => {
    if (!paper) return;
    fetch("/api/scientific-research?action=download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paper_id: paper.id }),
    }).catch(() => {});
  };

  if (loading) return <PageShell><Loading /></PageShell>;
  if (!paper) {
    return (
      <PageShell>
        <PageHeader title="البحث غير موجود" subtitle="تأكد من الرابط أو عد للقائمة." />
        <Link href={RESEARCH_BASE_PATH}>← العودة للأبحاث</Link>
      </PageShell>
    );
  }

  const cover = paper.cover_url || "/images/research/default-cover.svg";
  const authorSlug = paper.author_name?.replace(/\s+/g, "-").toLowerCase();

  return (
    <PageShell className="research-detail-page">
      <nav style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
        <Link href={RESEARCH_BASE_PATH}>الأبحاث العلمية</Link>
        {" / "}
        <span>{paper.title.slice(0, 40)}...</span>
      </nav>

      <div className="research-detail-hero">
        <img src={cover} alt="" className="research-detail-cover" />
        <div>
          <PageHeader
            eyebrow={DEGREE_LABELS[paper.degree_type]}
            title={paper.title}
            subtitle={`${paper.author_name}${paper.university ? ` — ${paper.university}` : ""}`}
          />
          <span className="research-copyright-badge">{COPYRIGHT_LABELS[paper.copyright_type]}</span>

          <div className="research-detail-actions">
            {paper.pdf_url && paper.pdf_url !== "#" && (
              <>
                <a href={paper.pdf_url} target="_blank" rel="noopener noreferrer" className="page-action-btn">
                  قراءة PDF
                </a>
                <a
                  href={paper.pdf_url}
                  download
                  className="page-action-btn"
                  onClick={trackDownload}
                >
                  تحميل
                </a>
              </>
            )}
            <button type="button" className="page-action-btn" onClick={share}>مشاركة</button>
            <button type="button" className="page-action-btn" onClick={copyLink}>
              {copied ? "✓ تم النسخ" : "نسخ الرابط"}
            </button>
            <ContactChatReportButton contentId={paper.id} contentTitle={paper.title} label="ملاحظة على البحث" messageType="تصحيح معلومة" className="page-action-btn" />
            <button
              type="button"
              className="page-action-btn"
              onClick={() => alert("شكراً — سيُراجع بلاغك")}
            >
              إبلاغ
            </button>
          </div>

          <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.35rem 1rem", fontSize: "0.875rem" }}>
            {paper.supervisor_name && (<><dt>المشرف</dt><dd>{paper.supervisor_name}</dd></>)}
            {paper.faculty && (<><dt>الكلية</dt><dd>{paper.faculty}</dd></>)}
            {paper.department && (<><dt>القسم</dt><dd>{paper.department}</dd></>)}
            {paper.country && (<><dt>الدولة</dt><dd>{paper.country}</dd></>)}
            {paper.publication_year && (<><dt>السنة</dt><dd>{paper.publication_year}</dd></>)}
            {paper.page_count && (<><dt>الصفحات</dt><dd>{paper.page_count}</dd></>)}
            {paper.language && (<><dt>اللغة</dt><dd>{paper.language === "ar" ? "العربية" : paper.language}</dd></>)}
            {paper.specialization && (<><dt>التخصص</dt><dd>{paper.specialization}</dd></>)}
          </dl>
        </div>
      </div>

      {paper.keywords && paper.keywords.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <strong>الكلمات المفتاحية: </strong>
          {paper.keywords.map((k) => (
            <span key={k} className="research-copyright-badge" style={{ marginInlineStart: "0.35rem" }}>{k}</span>
          ))}
        </div>
      )}

      {paper.abstract_short && (
        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem" }}>نبذة مختصرة</h2>
          <p>{paper.abstract_short}</p>
        </section>
      )}

      {paper.abstract_full && (
        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.1rem" }}>الملخص الكامل</h2>
          <p style={{ lineHeight: 1.8 }}>{paper.abstract_full}</p>
        </section>
      )}

      <div style={{ fontSize: "0.8rem", color: "var(--majalis-ink-soft)", marginBottom: "2rem" }}>
        👁 {paper.views_count} مشاهدة · ⬇ {paper.downloads_count} تحميل · ★ {paper.rating_avg || "—"}
        {authorSlug && (
          <>
            {" · "}
            <Link href={`${RESEARCH_BASE_PATH}/author/${authorSlug}`}>ملف الباحث</Link>
          </>
        )}
      </div>

      {similar.length > 0 && (
        <section>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>أبحاث مشابهة</h2>
          <div className="research-grid">
            {similar.map((p) => (
              <ResearchCard key={p.id} paper={p} />
            ))}
          </div>
        </section>
      )}

      <RelatedKnowledge kind="research" recordId={paper.id} query={paper.title} title="محتوى ذو صلة" limit={8} />
    </PageShell>
  );
}
