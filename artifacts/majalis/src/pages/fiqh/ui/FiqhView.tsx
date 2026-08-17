import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Building2,
  FlaskConical,
  Gavel,
  GraduationCap,
  Landmark,
  Scale,
  ScrollText,
  Search,
  Shield,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "wouter";
import { usePageView } from "@/hooks/usePageView";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { PageHero } from "@/components/ui-common";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import {
  FIQH_CATEGORY_LABELS,
  FIQH_CATEGORY_ORDER,
  FIQH_SUPPORTING_TOPICS,
  fiqhBookCounts,
  publishedBooks,
  searchFiqhLessons,
  type FiqhBookCategory,
  type FiqhLessonLevel,
} from "@/lib/fiqh-books";
import "@/styles/pages/fiqh-hub.css";

const GROUP_CHIPS: { id: FiqhBookCategory | "supporting"; label: string; Icon: LucideIcon }[] = [
  { id: "ibadat", label: "العبادات", Icon: BookOpen },
  { id: "muamalat", label: "المعاملات", Icon: Scale },
  { id: "usrah", label: "الأسرة", Icon: Users },
  { id: "jinayat", label: "الجنايات والحدود", Icon: Shield },
  { id: "qada", label: "القضاء", Icon: Gavel },
  { id: "supporting", label: "المباحث المساندة", Icon: Landmark },
];

const SUPPORT_ICONS: Record<string, LucideIcon> = {
  usul: ScrollText,
  qawaid: Scale,
  madhahib: GraduationCap,
  nawazil: FlaskConical,
  majami: Building2,
  fatawa: ScrollText,
};

const LEVELS: FiqhLessonLevel[] = ["مبتدئ", "متوسط", "متقدم"];
const MADHAHIB = ["حنفي", "مالكي", "شافعي", "حنبلي"];

export default function FiqhPage() {
  const books = useMemo(() => publishedBooks(), []);
  const [query, setQuery] = useState("");
  const [bookId, setBookId] = useState("");
  const [level, setLevel] = useState<FiqhLessonLevel | "">("");
  const [madhhab, setMadhhab] = useState("");

  usePageView("fiqh", null);

  useEffect(() => {
    applyPageSeo({
      path: "/fiqh",
      title: "الفقه الإسلامي | المجلس العلمي",
      description: "كتب الفقه وأبوابها ومسائلها: عبادات ومعاملات وأسرة وجنايات وقضاء، مع مباحث مساندة.",
      keywords: ["فقه إسلامي", "كتب الفقه", "مسائل فقهية", "المجلس العلمي"],
    });
  }, []);

  const results = useMemo(
    () => searchFiqhLessons(query, { bookId: bookId || undefined, level, madhhab }),
    [query, bookId, level, madhhab],
  );
  const searching = Boolean(query.trim() || bookId || level || madhhab);

  return (
    <div className="fqp-root page-shell fiqh-hub" dir="rtl">
      <PageHero title="الفقه" />

      <nav className="fiqh-chip-strip" aria-label="مجموعات الفقه" role="navigation">
        {GROUP_CHIPS.map((chip) => (
          <a key={chip.id} className="fiqh-chip" href={`#fiqh-${chip.id}`}>
            <chip.Icon size={15} strokeWidth={1.8} aria-hidden="true" />
            <span className="fiqh-chip__label">{chip.label}</span>
          </a>
        ))}
      </nav>

      <form className="fiqh-search" role="search" onSubmit={(e) => e.preventDefault()}>
        <label className="fiqh-search__field">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">بحث في الفقه</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في الكتب والأبواب والمسائل…"
            aria-label="بحث في أسماء الدروس والأبواب والكتب"
          />
        </label>
        <div className="fiqh-search__filters">
          <label>
            <span className="sr-only">الكتاب</span>
            <select value={bookId} onChange={(e) => setBookId(e.target.value)} aria-label="تصفية حسب الكتاب">
              <option value="">كل الكتب</option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">المستوى</span>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as FiqhLessonLevel | "")}
              aria-label="تصفية حسب المستوى"
            >
              <option value="">كل المستويات</option>
              {LEVELS.map((lv) => (
                <option key={lv} value={lv}>{lv}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">المذهب</span>
            <select value={madhhab} onChange={(e) => setMadhhab(e.target.value)} aria-label="تصفية حسب المذهب">
              <option value="">كل المذاهب</option>
              {MADHAHIB.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
        </div>
      </form>

      {searching ? (
        <section className="fiqh-results" aria-live="polite">
          <h2 className="fiqh-group__title">نتائج البحث</h2>
          {results.length === 0 ? (
            <p className="fiqh-results__empty">لا نتائج مطابقة في المسائل المنشورة.</p>
          ) : (
            <ul className="fiqh-results__list">
              {results.map((hit) => (
                <li key={hit.lesson.id}>
                  <Link href={hit.href} className="fiqh-result">
                    <span className="fiqh-result__title">{hit.lesson.title}</span>
                    <span className="fiqh-result__path">{hit.path}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {FIQH_CATEGORY_ORDER.map((cat) => {
        const group = books.filter((b) => b.category === cat);
        if (group.length === 0) return null;
        return (
          <section key={cat} id={`fiqh-${cat}`} className="fiqh-group">
            <h2 className="fiqh-group__title">{FIQH_CATEGORY_LABELS[cat]}</h2>
            <div className="fiqh-book-grid">
              {group.map((book) => {
                const counts = fiqhBookCounts(book);
                return (
                  <Link key={book.id} href={`/fiqh/books/${book.id}`} className="fiqh-book-card">
                    <h3 className="fiqh-book-card__title">{book.title}</h3>
                    <p className="fiqh-book-card__meta">
                      {counts.chapters} أبواب · {counts.lessons} مسائل
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      <section id="fiqh-supporting" className="fiqh-group fiqh-group--supporting">
        <h2 className="fiqh-group__title">المباحث المساندة</h2>
        <div className="fiqh-book-grid">
          {FIQH_SUPPORTING_TOPICS.map((t) => {
            const Icon = SUPPORT_ICONS[t.id] ?? Landmark;
            return (
              <Link key={t.id} href={t.href} className="fiqh-book-card">
                <h3 className="fiqh-book-card__title">
                  <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                  {t.title}
                </h3>
                <p className="fiqh-book-card__meta">{t.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <SectionQuiz categoryId="fiqh" title="اختبر معلوماتك في الفقه الإسلامي" count={4} />
      <div className="twh-share fiqh-fab-clearance">
        <ShareButtons title="الفقه الإسلامي — المجلس العلمي" url="https://www.majlisilm.com/fiqh" />
      </div>
    </div>
  );
}
