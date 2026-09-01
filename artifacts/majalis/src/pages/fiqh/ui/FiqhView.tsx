import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Scale, Search } from "lucide-react";
import { usePageView } from "@/hooks/usePageView";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/seo-structured-data";
import { ShareButtons } from "@/components/ContentActions";
import { ExploreAlsoNav } from "@/components/ExploreAlsoNav";
import { SectionLobby } from "@/components/lobby/SectionLobby";
import type { LobbySpec } from "@/config/section-lobbies";
import { FIQH_HUB_STATS } from "@/lib/fiqh-hub-stats";
import { formatAbwabCount, formatMasailCount } from "@/lib/arabic-count";
import { FiqhCategoryCard } from "@/components/fiqh/FiqhCategoryCard";
import { FiqhFilters } from "@/components/fiqh/FiqhFilters";
import { FiqhIssueCard } from "@/components/fiqh/FiqhIssueCard";
import { buildFiqhDoorSummaries } from "@/lib/fiqh/fiqhNormalize";
import { filterLessonsByDoor, type FiqhDoorFilter } from "@/lib/fiqh/fiqhFilters";
import { searchFiqhIssues } from "@/lib/fiqh/fiqhSearch";
import { listPublishedLessonHits } from "@/lib/fiqh/fiqhNormalize";
import "@/styles/pages/fiqh-hub.css";
import "@/styles/components/safe-hero.css";

function FiqhLuxHero({
  bookCount,
  chapterCount,
  lessonCount,
}: {
  bookCount: number;
  chapterCount: number;
  lessonCount: number;
}) {
  return (
    <header className="fiqh-lux-hero safe-hero" data-section-hero="1" aria-labelledby="fiqh-lux-title">
      <div className="fiqh-lux-hero__content safe-hero__body">
        <div className="fiqh-lux-hero__lead safe-hero__lead">
          <div className="fiqh-lux-hero__icon safe-hero__icon" aria-hidden="true">
            <Scale size={28} strokeWidth={1.6} />
          </div>
          <span className="fiqh-lux-hero__badge safe-hero__badge">فقه العبادات والمعاملات</span>
        </div>
        <h1 id="fiqh-lux-title" className="fiqh-lux-hero__title">
          الفقه
        </h1>
        <p className="fiqh-lux-hero__sub">
          بوابة فقهية مرتّبة للقراءة والتدرج: طهارة وصلاة وزكاة وصيام وحج، ثم معاملات وأسرة وجنايات — مع ملخص وأدلة ومصادر.
        </p>
        <p className="fiqh-lux-hero__stats">
          <span>{bookCount} كتاب</span>
          <span className="fiqh-lux-hero__dot" aria-hidden="true">
            ·
          </span>
          <span>{formatAbwabCount(chapterCount)}</span>
          <span className="fiqh-lux-hero__dot" aria-hidden="true">
            ·
          </span>
          <span>{formatMasailCount(lessonCount)}</span>
        </p>
      </div>
    </header>
  );
}

function FiqhHubSearch({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
}) {
  return (
    <div className="fiqh-hub-search">
      <label className="fiqh-hub-search__label" htmlFor="fiqh-hub-search-input">
        بحث في الفقه
      </label>
      <div className="fiqh-hub-search__field">
        <Search size={18} strokeWidth={2} aria-hidden="true" />
        <input
          id="fiqh-hub-search-input"
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="ابحث عن مسألة أو باب أو مصدر…"
          autoComplete="off"
          enterKeyHint="search"
        />
      </div>
    </div>
  );
}

function FiqhLobbyBody({ lobby }: { lobby: LobbySpec }) {
  const [quiz, setQuiz] = useState<ReactNode>(null);
  const [query, setQuery] = useState("");
  const [door, setDoor] = useState<FiqhDoorFilter>("all");

  const doors = useMemo(() => buildFiqhDoorSummaries(), []);
  const filteredDoors = useMemo(
    () => (door === "all" ? doors : doors.filter((d) => d.id === door)),
    [door, doors],
  );

  const searchResults = useMemo(
    () => searchFiqhIssues(query, { door, limit: query.trim() ? 12 : 0 }),
    [query, door],
  );

  const featuredIssues = useMemo(() => {
    if (query.trim()) return searchResults;
    return filterLessonsByDoor(listPublishedLessonHits(), door).slice(0, 8);
  }, [query, door, searchResults]);

  useEffect(() => {
    let cancelled = false;
    void import("@/components/ui/SectionQuiz").then((m) => {
      if (!cancelled) {
        setQuiz(<m.SectionQuiz sectionId="fiqh" title="اختبر معلوماتك في الفقه الإسلامي" count={4} />);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="fiqh-lux-page fiqh-hub-layout">
      <FiqhHubSearch query={query} onQueryChange={setQuery} />
      <FiqhFilters value={door} onChange={setDoor} />

      <section className="fiqh-hub-section" aria-labelledby="fiqh-doors-title">
        <h2 id="fiqh-doors-title" className="fiqh-hub-section__title">
          أبواب الفقه
        </h2>
        <div className="fiqh-category-grid">
          {filteredDoors.map((item) => (
            <FiqhCategoryCard key={item.id} door={item} />
          ))}
        </div>
      </section>

      <section className="fiqh-hub-section" aria-labelledby="fiqh-issues-title">
        <h2 id="fiqh-issues-title" className="fiqh-hub-section__title">
          {query.trim() ? "نتائج البحث" : "مسائل مهمة"}
        </h2>
        {featuredIssues.length > 0 ? (
          <div className="fiqh-issue-grid">
            {featuredIssues.map((hit) => (
              <FiqhIssueCard key={hit.lesson.id} hit={hit} />
            ))}
          </div>
        ) : (
          <p className="fiqh-lux-empty">
            {query.trim()
              ? "لا نتائج مطابقة في هذا الباب — جرّب كلمة أخرى أو بابًا مختلفًا."
              : "لا مسائل منشورة في هذا الباب بعد."}
          </p>
        )}
      </section>

      <SectionLobby
        lobbyId="fiqh"
        title="مراجع ومساندة"
        chips={lobby.chips}
        groups={lobby.groups.filter((g) => g.id === "supporting")}
        className="fiqh-lux-page fiqh-lux-support"
      >
        {quiz}
        <div className="twh-share">
          <ShareButtons title="الفقه الإسلامي — سُنّة" url="https://www.ssunnah.com/fiqh" />
        </div>
        <ExploreAlsoNav
          title="استكشف أيضًا"
          links={[
            { href: "/hadith", label: "الحديث وعلومه" },
            { href: "/lessons", label: "الدروس العلمية" },
            { href: "/library", label: "المكتبة" },
            { href: "/salah-guide", label: "دليل الصلاة" },
          ]}
        />
      </SectionLobby>
    </div>
  );
}

export default function FiqhPage() {
  const [lobby, setLobby] = useState<LobbySpec | null>(null);
  usePageView("fiqh", null);

  useEffect(() => {
    applyPageSeo({
      path: "/fiqh",
      title: "الفقه | سُنّة",
      description:
        "أبواب ومسائل فقهية مرتبة: طهارة وصلاة وزكاة وصيام وحج ومعاملات وأسرة وجنايات — كتب وأبواب ومسائل للقراءة والتدرج.",
      keywords: ["فقه إسلامي", "كتب الفقه", "مسائل فقهية", "سُنّة"],
      jsonLd: [
        webPageJsonLd(
          "الفقه",
          "أبواب ومسائل فقهية مرتبة للقراءة والتدرج في العبادات والمعاملات والأسرة.",
          "/fiqh",
        ),
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "الفقه", path: "/fiqh" },
        ]),
      ],
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      void import("@/config/section-lobbies-fiqh").then((m) => {
        if (!cancelled) setLobby(m.getFiqhLobby());
      });
    };
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(run, { timeout: 1200 });
      return () => {
        cancelled = true;
        cancelIdleCallback(id);
      };
    }
    const t = window.setTimeout(run, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  return (
    <div className="fiqh-lux-shell" dir="rtl">
      <FiqhLuxHero
        bookCount={FIQH_HUB_STATS.books}
        chapterCount={FIQH_HUB_STATS.chapters}
        lessonCount={FIQH_HUB_STATS.lessons}
      />
      {lobby ? (
        <FiqhLobbyBody lobby={lobby} />
      ) : (
        <div className="fiqh-lux-page" aria-busy="true">
          <p className="fiqh-lux-empty">جاري تجهيز أبواب الفقه…</p>
        </div>
      )}
    </div>
  );
}
