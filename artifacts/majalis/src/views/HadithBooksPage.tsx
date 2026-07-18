import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Link } from "wouter";
import { ArrowRight, BookOpen, ChevronRight, Loader2, Search, X, AlertTriangle } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import {
  HADITH_COLLECTIONS,
  fetchAllHadiths,
  fetchMutafaqAlayhHadiths,
  type CdnHadith,
  type HadithCollection,
  type CdnCollectionMeta,
} from "@/lib/hadith-cdn-service";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

// ─── Chapter index built from hadith data ─────────────────────────────────────

interface Chapter {
  no: number;
  name: string;
  hadiths: CdnHadith[];
}

function buildChapters(hadiths: CdnHadith[]): Chapter[] {
  const map = new Map<number, Chapter>();
  for (const h of hadiths) {
    const no: number = (h as any).chapterno ?? 0;
    const name: string = (h as any).chapter ?? `الكتاب ${no}`;
    if (!map.has(no)) map.set(no, { no, name, hadiths: [] });
    map.get(no)!.hadiths.push(h);
  }
  return Array.from(map.values()).sort((a, b) => a.no - b.no);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CollectionTab({
  meta,
  active,
  onClick,
}: {
  meta: CdnCollectionMeta;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={`hb-tab-${meta.id}`}
      aria-selected={active}
      aria-controls={`hb-panel-${meta.id}`}
      onClick={onClick}
      className={`hb-tab${active ? " hb-tab--active" : ""}`}
    >
      <span className="hb-tab__name">{meta.name}</span>
      <span className="hb-tab__total">{meta.totalHadiths.toLocaleString("ar-EG")}</span>
    </button>
  );
}

function ChapterList({
  chapters,
  activeNo,
  onSelect,
}: {
  chapters: Chapter[];
  activeNo: number | null;
  onSelect: (no: number) => void;
}) {
  return (
    <nav className="hb-chapter-list" aria-label="قائمة الكتب والأبواب">
      {chapters.map((ch) => (
        <button
          key={ch.no}
          type="button"
          className={`hb-chapter-item${activeNo === ch.no ? " hb-chapter-item--active" : ""}`}
          onClick={() => onSelect(ch.no)}
        >
          <span className="hb-chapter-item__name">{ch.name}</span>
          <span className="hb-chapter-item__count">{ch.hadiths.length}</span>
        </button>
      ))}
    </nav>
  );
}

function HadithRow({ h, index }: { h: CdnHadith; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const chapter: string = (h as any).chapter ?? "";

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(h.text).then(() => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setCopied(true);
      timerRef.current = setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div
      className={`hb-hadith-row${expanded ? " hb-hadith-row--expanded" : ""}`}
      onClick={() => setExpanded((x) => !x)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setExpanded((x) => !x)}
      tabIndex={0}
      role="button"
      aria-expanded={expanded}
      aria-label={`الحديث ${h.hadithnumber}`}
    >
      <div className="hb-hadith-row__head">
        <span className="hb-hadith-row__num">{index}</span>
        <p className="hb-hadith-row__preview">
          {expanded ? h.text : h.text.slice(0, 140) + (h.text.length > 140 ? "…" : "")}
        </p>
        <ChevronRight
          size={14}
          className={`hb-hadith-row__chevron${expanded ? " hb-hadith-row__chevron--open" : ""}`}
          aria-hidden="true"
        />
      </div>
      {expanded && (
        <div className="hb-hadith-row__detail" onClick={(e) => e.stopPropagation()}>
          <div className="hb-hadith-row__meta">
            {chapter && <span className="hb-hadith-row__chapter">{chapter}</span>}
            {(h as any)._source && (
              <span className="hb-hadith-row__chapter">{(h as any)._source}</span>
            )}
            <span className="hb-hadith-row__badge">حديث {h.hadithnumber > 100000 ? h.hadithnumber - 100000 : h.hadithnumber}</span>
          </div>
          <button
            type="button"
            className="hb-hadith-row__copy"
            onClick={handleCopy}
            aria-label="نسخ نص الحديث"
          >
            {copied ? "✓ تم النسخ" : "⎘ نسخ"}
          </button>
        </div>
      )}
    </div>
  );
}

const PAGE_SIZE = 50;

function HadithViewer({
  hadiths,
  searchQuery,
}: {
  hadiths: CdnHadith[];
  searchQuery: string;
}) {
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return hadiths;
    return hadiths.filter((h) => h.text.includes(q));
  }, [hadiths, searchQuery]);

  useEffect(() => { setPage(1); }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="hb-hadith-viewer">
      <p className="hb-hadith-viewer__count">
        {filtered.length.toLocaleString("ar-EG")} حديث
        {searchQuery.trim() && ` — نتائج «${searchQuery.trim()}»`}
      </p>
      <div className="hb-hadith-list">
        {slice.map((h, i) => (
          <HadithRow key={h.hadithnumber} h={h} index={(page - 1) * PAGE_SIZE + i + 1} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="hb-pagination" role="navigation" aria-label="التنقل بين الصفحات">
          <button
            type="button"
            className="hb-pagination__btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            السابق
          </button>
          <span className="hb-pagination__info">
            {page.toLocaleString("ar-EG")} / {totalPages.toLocaleString("ar-EG")}
          </span>
          <button
            type="button"
            className="hb-pagination__btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Collection Browser ───────────────────────────────────────────────────────

function CollectionBrowser({ meta }: { meta: CdnCollectionMeta }) {
  const [hadiths, setHadiths]     = useState<CdnHadith[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);
  const [chapters, setChapters]   = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = useState<number | null>(null);
  const [search, setSearch]       = useState("");
  const [showAllChapters, setShowAllChapters] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setHadiths([]);
    setChapters([]);
    setActiveChapter(null);
    setSearch("");

    const fetchFn = meta.id === "mutafaq"
      ? fetchMutafaqAlayhHadiths()
      : fetchAllHadiths(meta.id);

    fetchFn
      .then((data) => {
        setHadiths(data);
        if (meta.id !== "mutafaq") {
          const chs = buildChapters(data);
          setChapters(chs);
          if (chs.length > 0) setActiveChapter(chs[0].no);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [meta.id]);

  const displayHadiths = useMemo(() => {
    if (search.trim()) return hadiths;
    if (activeChapter === null) return hadiths;
    return chapters.find((c) => c.no === activeChapter)?.hadiths ?? hadiths;
  }, [hadiths, chapters, activeChapter, search]);

  const visibleChapters = showAllChapters ? chapters : chapters.slice(0, 30);

  if (loading) {
    return (
      <div className="hb-loading" aria-live="polite">
        <Loader2 size={28} className="hb-loading__icon" aria-hidden="true" />
        <p>جاري تحميل {meta.name}…</p>
        <p className="hb-loading__note">قد يستغرق التحميل لحظات للمجموعات الكبيرة.</p>
      </div>
    );
  }

  if (error || hadiths.length === 0) {
    return (
      <div className="hb-error" role="alert">
        <AlertTriangle size={22} className="inline ml-2" />
        تعذّر تحميل {meta.name}. تحقق من الاتصال بالإنترنت وحاول مجدداً.
      </div>
    );
  }

  return (
    <div className="hb-browser" dir="rtl">
      {/* رأس المجموعة */}
      <div className="hb-browser__head">
        <div>
          <h2 className="hb-browser__title">{meta.name}</h2>
          <p className="hb-browser__author">{meta.arabicName}</p>
        </div>
        <div className="hb-browser__stats">
          <span>{hadiths.length.toLocaleString("ar-EG")} حديث</span>
          {chapters.length > 1 && <span>{chapters.length} كتاباً</span>}
        </div>
      </div>

      {/* توضيح مفهوم المتفق عليه */}
      {meta.id === "mutafaq" && (
        <div className="hb-mutafaq-info" role="note">
          <strong>ما هو المتفق عليه؟</strong>
          <p>
            الحديث المتفق عليه هو ما اتفق على روايته البخاري ومسلم في صحيحَيهما — وهو من أعلى درجات الصحة لأن كلا الإمامَين اشترطا الصحة العالية.
            هذه الصفحة تعرض كامل أحاديث البخاري وأحاديث مسلم بحسب مصدر كل حديث.
            العلامة <strong>البخاري</strong> أو <strong>مسلم</strong> تظهر في تفاصيل كل حديث.
          </p>
        </div>
      )}

      {/* البحث */}
      <div className="hb-search-wrap">
        <Search size={14} className="hb-search__icon" aria-hidden="true" />
        <input
          type="search"
          className="hb-search-input"
          placeholder={`ابحث في ${meta.name}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={`بحث في ${meta.name}`}
        />
        {search && (
          <button
            type="button"
            className="hb-search__clear"
            onClick={() => setSearch("")}
            aria-label="مسح البحث"
          >
            <X size={13} />
          </button>
        )}
      </div>

      <div className="hb-layout">
        {/* قائمة الكتب — يُخفى عند البحث */}
        {!search.trim() && chapters.length > 1 && (
          <aside className="hb-sidebar">
            <p className="hb-sidebar__label">الكتب والأبواب</p>
            <ChapterList
              chapters={visibleChapters}
              activeNo={activeChapter}
              onSelect={setActiveChapter}
            />
            {chapters.length > 30 && (
              <button
                type="button"
                className="hb-sidebar__more"
                onClick={() => setShowAllChapters((x) => !x)}
              >
                {showAllChapters ? "عرض أقل" : `عرض الكل (${chapters.length})`}
              </button>
            )}
          </aside>
        )}

        {/* عارض الأحاديث */}
        <main className="hb-main">
          {!search.trim() && activeChapter !== null && chapters.length > 1 && (
            <h3 className="hb-chapter-title">
              {chapters.find((c) => c.no === activeChapter)?.name}
            </h3>
          )}
          <HadithViewer hadiths={displayHadiths} searchQuery={search} />
        </main>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HadithBooksPage() {
  const [activeId, setActiveId] = useState<HadithCollection>("nawawi");

  const activeMeta = useMemo(
    () => HADITH_COLLECTIONS.find((c) => c.id === activeId) ?? HADITH_COLLECTIONS[0],
    [activeId],
  );

  const handleTabClick = useCallback((id: HadithCollection) => setActiveId(id), []);

  useEffect(() => {
    applyPageSeo({
      path: "/hadith/books",
      title: "الكتب الحديثية الكاملة — البخاري ومسلم وغيرهما | المجلس العلمي",
      description:
        "تصفّح الكتب الحديثية الكاملة: صحيح البخاري (7563 حديثاً)، صحيح مسلم (3033)، الأربعون النووية، الأحاديث القدسية، والسنن الأربعة — مع البحث والتصفح بالكتاب والباب.",
      keywords: ["صحيح البخاري كامل", "صحيح مسلم كامل", "الأربعون النووية", "أحاديث قدسية", "سنن أبي داود", "سنن الترمذي"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "DataCatalog",
          name: "الكتب الحديثية الكاملة",
          description: "مكتبة الأحاديث النبوية الكاملة من المصادر الموثوقة",
          url: "https://www.majlisilm.com/hadith/books",
          dataset: HADITH_COLLECTIONS.map((c) => ({
            "@type": "Dataset",
            name: c.name,
            description: `${c.totalHadiths} حديث — ${c.arabicName}`,
          })),
        },
      ],
    });
  }, []);

  return (
    <div className="page-shell hb-page" dir="rtl">
      {/* التنقل */}
      <nav className="hb-breadcrumb" aria-label="مسار التنقل">
        <Link href="/hadith" className="hb-breadcrumb__link">
          الأحاديث النبوية
        </Link>
        <ArrowRight size={12} className="hb-breadcrumb__sep" aria-hidden="true" />
        <span>الكتب الكاملة</span>
      </nav>

      {/* الرأس */}
      <header className="hb-header">
        <BookOpen size={28} className="hb-header__icon" aria-hidden="true" />
        <h1 className="hb-header__title">الكتب الحديثية الكاملة</h1>
        <p className="hb-header__subtitle">
          تصفّح صحيح البخاري وصحيح مسلم والسنن الأربعة والأربعين النووية بأكملها — مع البحث والتصفح بالكتاب والباب.
        </p>
        <p className="hb-header__source">
          المصدر:{" "}
          <a
            href="https://github.com/fawazahmed0/hadith-api"
            target="_blank" rel="noopener noreferrer"
            className="hb-header__source-link"
          >
            fawazahmed0/hadith-api
          </a>{" "}
          — مرخّص MIT، نصوص عربية موثوقة
        </p>
      </header>

      {/* إشعار الضعيف والموضوع */}
      <div className="hb-notice" role="note" dir="rtl">
        <AlertTriangle size={14} className="inline ml-1" />
        <strong>الأحاديث الضعيفة والموضوعة:</strong> تُضاف من خلال لوحة التحكم فقط بعد التحقق من المصادر
        المتخصصة. لا يُولَّد أي محتوى شرعي بالذكاء الاصطناعي.{" "}
        <Link href="/hadith/daif" className="hb-notice__link">تصفّح الضعيفة</Link>
        {" · "}
        <Link href="/hadith/mawdu" className="hb-notice__link">تصفّح الموضوعة</Link>
      </div>

      {/* تبويبات المجموعات */}
      <div className="hb-tabs-wrap">
        <div className="hb-tabs" role="tablist" aria-label="اختر مجموعة الأحاديث">
          {HADITH_COLLECTIONS.map((c) => (
            <CollectionTab
              key={c.id}
              meta={c}
              active={activeId === c.id}
              onClick={() => handleTabClick(c.id)}
            />
          ))}
        </div>
      </div>

      {/* متصفح المجموعة */}
      <div
        className="hb-content"
        role="tabpanel"
        id={`hb-panel-${activeId}`}
        aria-labelledby={`hb-tab-${activeId}`}
      >
        <CollectionBrowser key={activeId} meta={activeMeta} />
      </div>

      {/* اختبار معلوماتك */}
      <div className="px-4 pb-6 mt-8">
        <SectionQuiz
          categoryId="hadith"
          title="اختبر معلوماتك في الحديث"
          count={4}
        />
      </div>
    </div>
  );
}
