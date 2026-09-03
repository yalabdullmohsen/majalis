import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Scale, Search, X } from "lucide-react";
import { usePageView } from "@/hooks/usePageView";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/seo-structured-data";
import { ShareButtons } from "@/components/ContentActions";
import { ExploreAlsoNav } from "@/components/ExploreAlsoNav";
import { SectionLobby } from "@/components/lobby/SectionLobby";
import { CompactSectionHeader } from "@/components/ui/CompactSectionHeader";
import type { LobbySpec } from "@/config/section-lobbies";
import { FIQH_HUB_STATS } from "@/lib/fiqh-hub-stats";
import { formatAbwabCount, formatMasailCount } from "@/lib/arabic-count";
import { FiqhCategoryCard } from "@/components/fiqh/FiqhCategoryCard";
import { FiqhFilters } from "@/components/fiqh/FiqhFilters";
import { FiqhIssueCard } from "@/components/fiqh/FiqhIssueCard";
import {
  buildFiqhDoorSummaries,
  expandFiqhFilterDoors,
  FIQH_HUB_DOOR_ORDER,
  listPublishedLessonHits,
} from "@/lib/fiqh/fiqhNormalize";
import { filterLessonsByDoor, type FiqhDoorFilter } from "@/lib/fiqh/fiqhFilters";
import { searchFiqhIssues } from "@/lib/fiqh/fiqhSearch";
import "@/styles/pages/fiqh-hub.css";

function FiqhHubSearch({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(() => Boolean(query.trim()));
  const expanded = open || Boolean(query.trim());

  return (
    <div className="fiqh-hub-search fiqh-hub-search--compact">
      {expanded ? (
        <label className="fiqh-hub-search__field" htmlFor="fiqh-hub-search-input">
          <span className="sr-only">بحث الفقه</span>
          <input
            id="fiqh-hub-search-input"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="بحث…"
            autoComplete="off"
            enterKeyHint="search"
            autoFocus={open}
          />
          <button
            type="button"
            className="fiqh-hub-search__icon-btn"
            aria-label="إغلاق البحث"
            onClick={() => {
              onQueryChange("");
              setOpen(false);
            }}
          >
            <X size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </label>
      ) : (
        <button
          type="button"
          className="fiqh-hub-search__icon-btn"
          aria-label="بحث"
          onClick={() => setOpen(true)}
        >
          <Search size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function FiqhLobbyBody({ lobby }: { lobby: LobbySpec | null }) {
  const [quiz, setQuiz] = useState<ReactNode>(null);
  const [query, setQuery] = useState("");
  const [door, setDoor] = useState<FiqhDoorFilter>("all");

  const doors = useMemo(() => buildFiqhDoorSummaries(), []);
  const filteredDoors = useMemo(() => {
    const hub = FIQH_HUB_DOOR_ORDER
      .map((id) => doors.find((d) => d.id === id))
      .filter((d): d is NonNullable<typeof d> => Boolean(d));
    const expanded = expandFiqhFilterDoors(door);
    if (expanded === "all") return hub;
    const allowed = new Set(expanded);
    return hub.filter((d) => allowed.has(d.id));
  }, [door, doors]);

  const searchResults = useMemo(
    () => searchFiqhIssues(query, { door, limit: query.trim() ? 12 : 0 }),
    [query, door],
  );

  const featuredIssues = useMemo(() => {
    if (query.trim()) return searchResults;
    return filterLessonsByDoor(listPublishedLessonHits(), door).slice(0, 6);
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
      <div className="fiqh-hub-controls">
        <FiqhFilters value={door} onChange={setDoor} />
        <FiqhHubSearch query={query} onQueryChange={setQuery} />
      </div>

      <section className="fiqh-hub-section fiqh-hub-section--doors" aria-labelledby="fiqh-doors-title">
        <h2 id="fiqh-doors-title" className="sr-only">
          أبواب الفقه
        </h2>
        <div className="fiqh-category-grid">
          {filteredDoors.map((item) => (
            <FiqhCategoryCard key={item.id} door={item} />
          ))}
        </div>
      </section>

      <section className="fiqh-hub-section" aria-labelledby="fiqh-issues-title">
        <header className="fiqh-hub-section__head">
          <h2 id="fiqh-issues-title" className="fiqh-hub-section__title">
            {query.trim() ? "نتائج البحث" : "مسائل مختارة"}
          </h2>
        </header>
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

      {lobby ? (
        <SectionLobby
          lobbyId="fiqh"
          title={lobby.title}
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
              { href: "/salah-guide", label: "دليل الصلاة" },
              { href: "/zakat", label: "الزكاة" },
            ]}
          />
        </SectionLobby>
      ) : (
        quiz
      )}
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

  const headerStats = useMemo(
    () => [
      { id: "books", label: `${FIQH_HUB_STATS.books} كتاب` },
      { id: "chapters", label: formatAbwabCount(FIQH_HUB_STATS.chapters) },
      { id: "lessons", label: formatMasailCount(FIQH_HUB_STATS.lessons) },
    ],
    [],
  );

  return (
    <div className="fiqh-lux-shell" dir="rtl">
      <CompactSectionHeader
        title="الفقه"
        icon={Scale}
        titleId="fiqh-compact-title"
      />
      <FiqhLobbyBody lobby={lobby} />
      <section className="fiqh-hub-stats" aria-label="حجم المحتوى">
        {headerStats.map((stat) => (
          <p key={stat.id} className="fiqh-hub-stats__item">
            {stat.label}
          </p>
        ))}
      </section>
    </div>
  );
}
