import { useMemo, useState } from "react";
import { Link } from "wouter";
import { PageHeader, Loading, Empty, Chip } from "@/components/ui-common";
import { getLibraryBookSummaries, searchLibraryCatalog } from "@/lib/library/catalog";
import { arabicMatchAny } from "@/lib/arabic-search";

const CATEGORIES = ["الكل", "تفسير", "حديث", "عقيدة", "فقه", "سيرة", "آداب", "أذكار", "لغة", "تأصيل"];
const TYPES = ["الكل", "كتاب", "متن", "تفريغ", "ملخص"];

function BookCard({
  slug,
  title,
  author,
  category,
  type,
  description,
  coverHue,
  chapterCount,
}: {
  slug: string;
  title: string;
  author: string;
  category: string;
  type: string;
  description: string;
  coverHue: number;
  chapterCount: number;
}) {
  const initial = title.replace(/^[\s«»"]+/, "").slice(0, 1);
  return (
    <Link href={`/library/${slug}`} className="lib-card">
      <div className="lib-card__cover" style={{ background: `linear-gradient(145deg, hsl(${coverHue} 42% 34%), hsl(${coverHue} 36% 24%))` }}>
        <span>{initial}</span>
      </div>
      <div className="lib-card__body">
        <div className="lib-card__head">
          <strong>{title}</strong>
          <span className="page-tag">{type}</span>
        </div>
        <p className="lib-card__author">{author}</p>
        <p className="page-meta">{category} · {chapterCount} باب</p>
        <p className="page-desc lib-card__desc">{description}</p>
        <span className="lib-card__cta">فتح الكتاب ←</span>
      </div>
    </Link>
  );
}

export default function LibraryPage() {
  const books = useMemo(() => getLibraryBookSummaries(), []);
  const [category, setCategory] = useState("الكل");
  const [type, setType] = useState("الكل");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = books;
    if (category !== "الكل") list = list.filter((b) => b.category === category);
    if (type !== "الكل") list = list.filter((b) => b.type === type);
    const q = search.trim();
    if (!q) return list;
    const catalogHits = new Set(searchLibraryCatalog(q, 50).map((h) => h.bookSlug));
    return list.filter(
      (b) =>
        catalogHits.has(b.slug) ||
        arabicMatchAny([b.title, b.author, b.description, b.category], q),
    );
  }, [books, category, type, search]);

  return (
    <div className="page-shell lib-page">
      <PageHeader
        eyebrow="الأرشيف العلمي"
        title="المكتبة العلمية"
        subtitle={`${books.length} كتاب ومرجع — كل كتاب له صفحة منظمة وفهرس وأبواب.`}
      />

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في المكتبة..."
        className="page-search-input full"
      />

      <div className="page-chip-row lib-filters">
        {CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} onClick={() => setCategory(c)}>{c}</Chip>
        ))}
      </div>
      <div className="page-chip-row lib-filters lib-filters--secondary">
        {TYPES.map((t) => (
          <Chip key={t} active={type === t} onClick={() => setType(t)}>{t}</Chip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Empty text="لا توجد نتائج مطابقة." />
      ) : (
        <div className="lib-grid">
          {filtered.map((b) => (
            <BookCard key={b.slug} {...b} />
          ))}
        </div>
      )}
    </div>
  );
}
