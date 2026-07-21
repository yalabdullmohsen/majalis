import { useEffect, useState } from "react";
import { Link } from "wouter";
import { SkeletonPage, Empty } from "@/components/ui-common";
import { ContentDetailLayout, RelatedLinks } from "@/components/platform/ContentDetailLayout";
import { getLibraryItemById } from "@/lib/supabase";
import { getRelatedLibraryBooks, isCatalogBookId, type LibraryItem } from "@/lib/library-service";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";
import { usePageView } from "@/hooks/usePageView";
import { KnowledgeRelatedItems } from "@/components/knowledge/KnowledgeRelatedItems";
import { RecommendationWidget } from "@/components/recommendations/RecommendationWidget";
import { ContentMindMap } from "@/components/ContentMindMap";
import { ScholarlyTrustBadge, type TrustData } from "@/components/ScholarlyTrustBadge";

export default function LibraryDetailPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<LibraryItem | null>(null);
  const [related, setRelated] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLibraryItemById(params.id)
      .then(({ data }) => {
        setItem(data);
        if (data) setRelated(getRelatedLibraryBooks(data));
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  usePageView("library", params.id);

  useEffect(() => {
    if (loading) return;
    if (!item) {
      // كتاب غير موجود (حُذف من الكتالوج أو معرّف خاطئ) — لا يجوز ترك
      // عنوان/ميتا الصفحة السابقة كما هي (كانت تُبقي عنوان الرئيسية أو صفحة
      // أخرى ظاهراً للزواحف رغم أن الجسم الفعلي "الكتاب غير موجود").
      applyPageSeo({
        path: `/library/${params.id}`,
        title: "الكتاب غير موجود | المجلس العلمي",
        description: "لم يُعثر على هذا الكتاب في المكتبة العلمية.",
        robots: "noindex, follow",
        jsonLd: [],
      });
      return;
    }
    const path = `/library/${item.id}`;
    applyPageSeo({
      path,
      title: `${item.title} | المكتبة العلمية، المجلس العلمي`,
      description: item.description || item.title,
      keywords: [...(item.keywords || []), item.category, item.author, "مكتبة", "كتب"],
      ogType: "article",
      canonicalPath: path,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Book",
          name: item.title,
          author: { "@type": "Person", name: item.author },
          description: item.description,
          inLanguage: "ar",
        },
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "المكتبة العلمية", path: "/library" },
          { name: item.title, path },
        ]),
      ],
    });
  }, [item, loading, params.id]);

  if (loading) return <SkeletonPage />;
  if (!item) return <Empty text="الكتاب غير موجود." />;

  const readUrl = item.external_url || item.file_url;
  const metaParts = [item.category, item.type, item.parts_label].filter(Boolean);

  // حقول الحوكمة قد لا تكون في نوع LibraryItem بعد — تُقرأ كما هي ولا تُخترع.
  const meta = item as typeof item & {
    reviewed_by?: string | null;
    reviewed_at?: string | null;
    content_type?: string | null;
    provenance?: string | null;
    source_name?: string | null;
    source_url?: string | null;
  };

  const trustData: TrustData = {
    author:      item.author       || null,
    source:      meta.source_name  || null,
    sourceUrl:   meta.source_url   || item.external_url || null,
    // لا نوع مخترع: «نقل» كانت ثابتة لكل كتاب — تأتي الآن من البيانات أو لا تُعرض.
    contentType: meta.content_type || null,
    verifiedBy:  meta.reviewed_by  || null,
    reviewedAt:  meta.reviewed_at  || null,
    provenance:  meta.provenance   || null,
    isApproved:  item.status === "approved",
  };

  return (
    <ContentDetailLayout
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "المكتبة العلمية", href: "/library" },
        { label: item.category, href: `/library?category=${encodeURIComponent(item.category)}` },
        { label: item.title },
      ]}
      title={item.title}
      subtitle={item.author}
      meta={metaParts.join(" · ")}
      tags={item.keywords}
      body={item.description}
      copyText={[item.title, item.author, item.description].filter(Boolean).join("\n\n")}
      adminEdit={{ contentType: "library", contentId: item.id, initialData: { title: item.title, author: item.author, category: item.category, description: item.description } }}
      related={
        related.length > 0 ? (
          <RelatedLinks
            items={related.map((book) => ({
              href: `/library/${book.id}`,
              title: book.title,
              meta: [book.author, book.category].filter(Boolean).join(" · "),
            }))}
          />
        ) : undefined
      }
    >
      {readUrl && (
        <div className="library-detail-read">
          <a href={readUrl} target="_blank" rel="noreferrer" className="library-read-btn">
            قراءة المصدر
          </a>
        </div>
      )}
      <ContentMindMap
        title={item.title}
        category={item.category}
        keywords={item.keywords}
        author={item.author}
        type="book"
      />
      <ScholarlyTrustBadge data={trustData} compact />
      {!isCatalogBookId(item.id) && (
        <p className="library-detail-note">
          <Link href="/library">← العودة إلى المكتبة</Link>
        </p>
      )}
      <KnowledgeRelatedItems sourceType="book" sourceId={String(item.id)} />
      <RecommendationWidget
        useRelated
        contentId={String(item.id)}
        contentType="book"
        context="home"
        limit={4}
        layout="row"
        className="mt-6"
      />
    </ContentDetailLayout>
  );
}
