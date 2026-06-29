"use client";

import { Link } from "wouter";
import { arabicMatchAny } from "@/lib/arabic-search";
import { useEffect, useMemo, useState } from "react";
import { getLibrary } from "@/lib/supabase";
import { RequestManager } from "@/lib/request-manager";
import { LIBRARY_CATEGORIES } from "@/lib/library-catalog";
import { Chip } from "@/components/ui-common";
import { PageLoadingGuard } from "@/components/PageLoadingGuard";
import { ContentHubLayout } from "@/components/layout/ContentHubLayout";
import type { ContentType } from "@/lib/library/content-types";
import { LIBRARY_ROUTES, detailPath, listPath } from "@/lib/library/content-types";
import type { LibraryItem } from "@/lib/library-service";
import "@/styles/library-hub.css";

const BOOK_TYPES = ["الكل", "كتاب", "متن", "شروح", "موسوعة"];
const ARTICLE_TYPES = ["الكل", "مقال", "تفريغ", "ملخص"];
const LANGUAGES = ["الكل", "ar", "en"];

type Props = {
  contentType: ContentType;
  initialItems?: LibraryItem[];
};

export function LibraryTypeListPage({ contentType, initialItems }: Props) {
  const isBook = contentType === "book";
  const basePath = listPath(contentType);

  const [items, setItems] = useState<LibraryItem[]>(initialItems ?? []);
  const [loading, setLoading] = useState(!initialItems);
  const [category, setCategory] = useState("الكل");
  const [bookType, setBookType] = useState("الكل");
  const [language, setLanguage] = useState("الكل");
  const [hasPdf, setHasPdf] = useState(false);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const { data } = await RequestManager.run(`library:${contentType}`, () =>
        getLibrary({
          contentType,
          category: category === "الكل" ? undefined : category,
          type: bookType === "الكل" ? undefined : bookType,
        }),
      );
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialItems && category === "الكل" && bookType === "الكل") return;
    loadLibrary();
  }, [category, bookType, contentType, initialItems]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (language !== "الكل" && it.language !== language) return false;
      if (hasPdf && !it.file_url) return false;
      const s = search.trim();
      if (!s) return true;
      return arabicMatchAny(
        [it.title, it.author, it.author_name, it.description, it.category, it.type, ...(it.keywords || [])],
        s,
      );
    });
  }, [items, search, language, hasPdf]);

  const title = isBook ? "الكتب" : "المقالات";
  const subtitle = isBook
    ? "كتب شرعية · متون · شروح · موسوعات — بدون مقالات أو أبحاث."
    : "مقالات علمية ودعوية — بدون كتب أو رسائل جامعية.";

  const filtersPanel = (
    <>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={isBook ? "ابحث في الكتب..." : "ابحث في المقالات..."}
        className="page-search-input full ds-input"
        aria-label={`بحث في ${title}`}
      />
      <div className="page-chip-row library-category-chips">
        {LIBRARY_CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
            {c}
          </Chip>
        ))}
      </div>
      <div className="page-chip-row">
        {(isBook ? BOOK_TYPES : ARTICLE_TYPES).map((t) => (
          <Chip key={t} active={bookType === t} onClick={() => setBookType(t)}>
            {t}
          </Chip>
        ))}
      </div>
      <div className="page-chip-row">
        {LANGUAGES.map((l) => (
          <Chip key={l} active={language === l} onClick={() => setLanguage(l)}>
            {l === "ar" ? "عربي" : l === "en" ? "English" : l}
          </Chip>
        ))}
        {isBook && (
          <Chip active={hasPdf} onClick={() => setHasPdf((v) => !v)}>
            PDF
          </Chip>
        )}
      </div>
    </>
  );

  return (
    <ContentHubLayout
      className={`content-hub library-type-hub library-type-hub--${contentType}`}
      eyebrow="الأرشيف العلمي"
      title={title}
      subtitle={subtitle}
      stats={[{ label: isBook ? "كتاب" : "مقال", value: filtered.length }]}
      filters={filtersPanel}
      filtersOpen={filtersOpen}
      onFiltersOpenChange={setFiltersOpen}
      toolbar={
        <Link href={LIBRARY_ROUTES.hub} className="page-action-btn">
          ← كل الأقسام
        </Link>
      }
    >
      <PageLoadingGuard
        loading={loading}
        empty={!loading && filtered.length === 0}
        emptyText={items.length === 0 ? `لا توجد ${title} حالياً` : "لا توجد نتائج مطابقة."}
        onRetry={loadLibrary}
      >
        <div className="page-card-grid library-grid">
          {filtered.map((item) => (
            <Link
              key={item.id}
              href={detailPath(contentType, item.id)}
              className={`page-card library-card library-card-link library-card--${contentType}`}
            >
              <div className="page-card-header">
                <p>{item.title}</p>
                <span className="ds-badge">{item.category}</span>
              </div>
              {(item.author || item.author_name) && (
                <p className="page-meta">{item.author || item.author_name}</p>
              )}
              {item.parts_label && <p className="page-meta library-parts">{item.parts_label}</p>}
              {item.reading_minutes && (
                <p className="page-meta">{item.reading_minutes} دقيقة قراءة</p>
              )}
              {item.description && <p className="page-desc">{item.description}</p>}
              <span className="library-card-cta">عرض التفاصيل</span>
            </Link>
          ))}
        </div>
      </PageLoadingGuard>
      <p className="library-type-footer">
        <Link href={basePath}>{title}</Link>
        {" · "}
        <Link href={LIBRARY_ROUTES.hub}>المكتبة</Link>
        {!isBook && (
          <>
            {" · "}
            <Link href={LIBRARY_ROUTES.books}>الكتب</Link>
          </>
        )}
        {isBook && (
          <>
            {" · "}
            <Link href={LIBRARY_ROUTES.articles}>المقالات</Link>
          </>
        )}
        {" · "}
        <Link href={LIBRARY_ROUTES.research}>الأبحاث</Link>
      </p>
    </ContentHubLayout>
  );
}

export default LibraryTypeListPage;
