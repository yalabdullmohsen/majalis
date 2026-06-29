"use client";

import { useEffect, useMemo, useState } from "react";
import { Loading, Empty } from "@/components/ui-common";
import { ContentDetailLayout, RelatedLinks } from "@/components/platform/ContentDetailLayout";
import { FavoriteButton } from "@/components/FavoriteButton";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";
import { usePageView } from "@/hooks/usePageView";
import {
  PC_BASE_PATH,
  PC_SOURCE_NAME,
  getPermanentCommitteeFatwaById,
  getRelatedPermanentCommitteeFatwas,
} from "@/lib/permanent-committee";

const LAST_READ_KEY = "majalis-pc-last-read";

function saveLastRead(id: string, title: string) {
  try {
    localStorage.setItem(LAST_READ_KEY, JSON.stringify({ id, title, at: Date.now() }));
  } catch {
    /* ignore */
  }
}

export default function PermanentCommitteeDetailPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inTextQuery, setInTextQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    getPermanentCommitteeFatwaById(params.id)
      .then(({ data }) => {
        setItem(data);
        if (data) {
          saveLastRead(data.id, data.title || data.question);
          return getRelatedPermanentCommitteeFatwas(data.id, data.category).then(setRelated);
        }
        return undefined;
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  usePageView("permanent_committee_fatwa", params.id);

  useEffect(() => {
    if (!item) return;
    const path = `${PC_BASE_PATH}/${item.id}`;
    applyPageSeo({
      path,
      title: `${item.title || item.question} | اللجنة الدائمة — المجلس العلمي`,
      description: item.summary || item.answer?.slice(0, 160) || item.question,
      keywords: [...(item.keywords || []), item.category, "فتوى", "اللجنة الدائمة"],
      ogType: "article",
      canonicalPath: path,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: {
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          },
        },
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "اللجنة الدائمة", path: PC_BASE_PATH },
          { name: (item.title || item.question).slice(0, 60), path },
        ]),
      ],
    });
  }, [item]);

  const highlightedAnswer = useMemo(() => {
    if (!item?.answer) return "";
    const q = inTextQuery.trim();
    if (!q || q.length < 2) return item.answer;
    try {
      const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
      return item.answer.replace(re, "**$1**");
    } catch {
      return item.answer;
    }
  }, [item, inTextQuery]);

  if (loading) return <Loading />;
  if (!item) return <Empty text="الفتوى غير موجودة." />;

  const path = `${PC_BASE_PATH}/${item.id}`;
  const copyText = `السؤال: ${item.question}\n\nالجواب: ${item.answer}\n\nالمصدر: ${item.source_name || PC_SOURCE_NAME}${item.source_url ? `\n${item.source_url}` : ""}`;
  const metaParts = [
    item.category,
    item.subcategory,
    item.fatwa_number ? `رقم ${item.fatwa_number}` : null,
    item.issued_at ? new Date(item.issued_at).toLocaleDateString("ar-SA") : null,
    item.reference,
  ].filter(Boolean);

  return (
    <>
      <ContentDetailLayout
        breadcrumbs={[
          { label: "الرئيسية", href: "/" },
          { label: "اللجنة الدائمة", href: PC_BASE_PATH },
          { label: (item.title || item.question).slice(0, 50) + ((item.title || item.question).length > 50 ? "…" : "") },
        ]}
        title={item.title || item.question}
        subtitle={item.summary}
        meta={metaParts.join(" · ")}
        tags={item.keywords}
        body={highlightedAnswer}
        sourceUrls={item.source_url ? [item.source_url] : undefined}
        copyText={copyText}
        shareUrl={typeof window !== "undefined" ? window.location.href : path}
        related={
          <RelatedLinks
            items={related.map((r) => ({
              href: `${PC_BASE_PATH}/${r.id}`,
              title: r.title || r.question,
              meta: r.category,
            }))}
          />
        }
      >
        <section className="pc-detail-toolbar ui-card">
          <div className="pc-detail-actions">
            <FavoriteButton contentType="permanent_committee_fatwa" contentId={item.id} />
            <button
              type="button"
              className="content-detail-action-btn"
              onClick={() => window.print()}
            >
              طباعة
            </button>
            <button
              type="button"
              className="content-detail-action-btn"
              onClick={async () => {
                await navigator.clipboard.writeText(typeof window !== "undefined" ? window.location.href : path);
              }}
            >
              نسخ الرابط
            </button>
          </div>
          <label className="pc-in-text-search">
            <span>بحث داخل النص</span>
            <input
              value={inTextQuery}
              onChange={(e) => setInTextQuery(e.target.value)}
              placeholder="ابحث في الجواب..."
            />
          </label>
        </section>

        <section className="pc-original-notice ui-card">
          <h2>المصدر الرسمي</h2>
          <p>
            <strong>{item.source_name || PC_SOURCE_NAME}</strong>
            {item.reference && <> — {item.reference}</>}
          </p>
          {item.source_url && (
            <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="pc-source-link">
              عرض المصدر الأصلي ↗
            </a>
          )}
          <p className="pc-immutable-note">النص الأصلي للفتوى محفوظ دون تعديل.</p>
        </section>

        {item.question && (
          <section className="ui-card pc-question-block">
            <h2>السؤال</h2>
            <p>{item.question}</p>
          </section>
        )}
      </ContentDetailLayout>

      <div className="page-shell narrow">
        <RelatedKnowledge
          kind="permanent_committee_fatwa"
          recordId={item.id}
          query={item.question}
          title="محتوى ذو صلة من المنصة"
          limit={8}
        />
      </div>
    </>
  );
}
