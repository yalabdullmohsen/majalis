import { useEffect, useState } from "react";
import { Link, Redirect } from "wouter";
import { Loading, Empty } from "@/components/ui-common";
import { ContentDetailLayout, RelatedLinks } from "@/components/platform/ContentDetailLayout";
import { getLibraryItemById } from "@/lib/supabase";
import {
  getRelatedLibraryItems,
  isCatalogBookId,
  type LibraryItem,
} from "@/lib/library-service";
import {
  type ContentType,
  detailPath,
  listPath,
  hubLabel,
  validateContentTypeForSection,
  LIBRARY_ROUTES,
} from "@/lib/library/content-types";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";
import { usePageView } from "@/hooks/usePageView";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";

type Props = {
  params: { id: string };
  contentType: ContentType;
};

export function LibraryItemDetailPage({ params, contentType }: Props) {
  const [item, setItem] = useState<LibraryItem | null>(null);
  const [related, setRelated] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeMismatch, setTypeMismatch] = useState(false);

  useEffect(() => {
    setLoading(true);
    getLibraryItemById(params.id)
      .then(({ data }) => {
        if (!data) {
          setItem(null);
          return;
        }
        const check = validateContentTypeForSection(data.content_type, contentType);
        if (!check.ok && data.content_type && data.content_type !== contentType) {
          setTypeMismatch(true);
          setItem(data);
          return;
        }
        setTypeMismatch(false);
        setItem(data);
        setRelated(getRelatedLibraryItems(data, contentType));
      })
      .finally(() => setLoading(false));
  }, [params.id, contentType]);

  usePageView("library", params.id);

  useEffect(() => {
    if (!item || typeMismatch) return;
    const path = detailPath(contentType, item.id);
    const schemaType = contentType === "book" ? "Book" : "Article";
    applyPageSeo({
      path,
      title: `${item.title} | ${hubLabel(contentType)} — المجلس العلمي`,
      description: item.description || item.title,
      keywords: [...(item.keywords || []), item.category, item.author, hubLabel(contentType)],
      ogType: contentType === "article" ? "article" : "book",
      canonicalPath: path,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": schemaType,
          name: item.title,
          author: { "@type": "Person", name: item.author },
          description: item.description,
          inLanguage: item.language || "ar",
          ...(contentType === "book" && item.page_count ? { numberOfPages: item.page_count } : {}),
          ...(contentType === "article" && item.reading_minutes
            ? { timeRequired: `PT${item.reading_minutes}M` }
            : {}),
        },
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "المكتبة العلمية", path: LIBRARY_ROUTES.hub },
          { name: hubLabel(contentType), path: listPath(contentType) },
          { name: item.title, path },
        ]),
      ],
    });
  }, [item, contentType, typeMismatch]);

  if (loading) return <Loading />;
  if (!item) return <Empty text="المحتوى غير موجود." />;
  if (typeMismatch && item.content_type) {
    return <Redirect to={detailPath(item.content_type, item.id)} />;
  }

  const readUrl = item.external_url || item.file_url;
  const isBook = contentType === "book";
  const metaParts = [
    item.category,
    item.type,
    item.parts_label,
    item.page_count ? `${item.page_count} صفحة` : null,
    item.reading_minutes ? `${item.reading_minutes} دقيقة` : null,
    item.publish_year ? String(item.publish_year) : null,
  ].filter(Boolean);

  const extraBody = [
    item.publisher && `الناشر: ${item.publisher}`,
    item.language && `اللغة: ${item.language}`,
    item.references?.length ? `المراجع:\n${item.references.join("\n")}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    <>
      <ContentDetailLayout
        breadcrumbs={[
          { label: "الرئيسية", href: "/" },
          { label: "المكتبة العلمية", href: LIBRARY_ROUTES.hub },
          { label: hubLabel(contentType), href: listPath(contentType) },
          { label: item.category, href: `${listPath(contentType)}?category=${encodeURIComponent(item.category)}` },
          { label: item.title },
        ]}
        title={item.title}
        subtitle={item.author}
        meta={metaParts.join(" · ")}
        tags={item.keywords}
        body={[item.description, extraBody].filter(Boolean).join("\n\n")}
        copyText={[item.title, item.author, item.description].filter(Boolean).join("\n\n")}
        related={
          related.length > 0 ? (
            <RelatedLinks
              items={related.map((row) => ({
                href: detailPath(contentType, row.id),
                title: row.title,
                meta: [row.author, row.category].filter(Boolean).join(" · "),
              }))}
            />
          ) : undefined
        }
      >
        {readUrl && (
          <div className="library-detail-read">
            <a href={readUrl} target="_blank" rel="noreferrer" className="library-read-btn">
              {isBook ? "قراءة / تحميل" : "قراءة المقال"}
            </a>
          </div>
        )}
        {!isCatalogBookId(item.id) && (
          <p className="library-detail-note">
            <Link href={listPath(contentType)}>← العودة إلى {hubLabel(contentType)}</Link>
          </p>
        )}
      </ContentDetailLayout>
      <div className="page-shell narrow">
        <RelatedKnowledge
          kind="library"
          recordId={item.id}
          query={item.title}
          title="محتوى ذو صلة"
          limit={8}
        />
      </div>
    </>
  );
}

export default LibraryItemDetailPage;
