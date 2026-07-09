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
    if (!item) return;
    const path = `/library/${item.id}`;
    applyPageSeo({
      path,
      title: `${item.title} | المكتبة العلمية — المجلس العلمي`,
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
  }, [item]);

  if (loading) return <SkeletonPage />;
  if (!item) return <Empty text="الكتاب غير موجود." />;

  const readUrl = item.external_url || item.file_url;
  const metaParts = [item.category, item.type, item.parts_label].filter(Boolean);

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
