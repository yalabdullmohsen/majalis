import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { usePageView } from "@/hooks/usePageView";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/seo-structured-data";
import { ShareButtons } from "@/components/ContentActions";
import { ExploreAlsoNav } from "@/components/ExploreAlsoNav";
import { SectionLobby } from "@/components/lobby/SectionLobby";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import type { LobbySpec } from "@/config/section-lobbies";
import { FIQH_HUB_STATS } from "@/lib/fiqh-hub-stats";
import { formatAbwabCount, formatMasailCount } from "@/lib/arabic-count";
import { FiqhCategoryCard } from "@/components/fiqh/FiqhCategoryCard";
import { FiqhFilters } from "@/components/fiqh/FiqhFilters";
import { FiqhIssueCard } from "@/components/fiqh/FiqhIssueCard";
import {
  buildFiqhDoorSummaries,
  expandFiqhGroupFilter,
  listPublishedLessonHits,
  FIQH_HUB_DOOR_ORDER,
  FIQH_START_HERE_DOORS,
  type FiqhHubGroupFilter,
  type FiqhDoorSummary,
} from "@/lib/fiqh/fiqhNormalize";
import { filterLessonsByDoor } from "@/lib/fiqh/fiqhFilters";
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
            placeholder="بحث في المسائل…"
            autoComplete="off"
            enterKeyHint="search"
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

function pickDoors(order: readonly string[], doors: FiqhDoorSummary[]): FiqhDoorSummary[] {
  return order
    .map((id) => doors.find((d) => d.id === id))
    .filter((d): d is FiqhDoorSummary => Boolean(d));
}

function FiqhLobbyBody({ lobby }: { lobby: LobbySpec | null }) {
  const [quiz, setQuiz] = useState<ReactNode>(null);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<FiqhHubGroupFilter>("all");

  const doors = useMemo(() => buildFiqhDoorSummaries(), []);
  const startHere = useMemo(() => pickDoors(FIQH_START_HERE_DOORS, doors), [doors]);
  const hubDoors = useMemo(() => {
    const hub = pickDoors(FIQH_HUB_DOOR_ORDER, doors).sort((a, b) => a.sortOrder - b.sortOrder);
    const expanded = expandFiqhGroupFilter(group);
    if (expanded === "all") return hub;
    const allowed = new Set(expanded);
    return hub.filter((d) => allowed.has(d.id));
  }, [doors, group]);

  const searchResults = useMemo(
    () => searchFiqhIssues(query, { door: "all", limit: query.trim() ? 12 : 0 }),
    [query],
  );

  const featuredIssues = useMemo(() => {
    if (query.trim()) return searchResults;
    return filterLessonsByDoor(listPublishedLessonHits(), "all").slice(0, 6);
  }, [query, searchResults]);

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
      <section className="fiqh-hub-section fiqh-hub-section--start" aria-labelledby="fiqh-start-title">
        <header className="fiqh-hub-section__head">
          <h2 id="fiqh-start-title" className="fiqh-hub-section__title">
            ابدأ من هنا
          </h2>
        </header>
        <div className="fiqh-category-grid fiqh-category-grid--start">
          {startHere.map((item) => (
            <FiqhCategoryCard key={item.id} door={item} featured />
          ))}
        </div>
      </section>

      <div className="fiqh-hub-controls">
        <FiqhFilters value={group} onChange={setGroup} />
        <FiqhHubSearch query={query} onQueryChange={setQuery} />
      </div>

      <section className="fiqh-hub-section fiqh-hub-section--doors" aria-labelledby="fiqh-doors-title">
        <header className="fiqh-hub-section__head">
          <h2 id="fiqh-doors-title" className="fiqh-hub-section__title">
            أبواب الفقه
          </h2>
        </header>
        <div className="fiqh-category-grid">
          {hubDoors.map((item) => (
            <FiqhCategoryCard key={item.id} door={item} />
          ))}
        </div>
        {hubDoors.length === 0 ? (
          <p className="fiqh-lux-empty">لا أبواب في هذا التصنيف — جرّب «الكل».</p>
        ) : null}
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
              ? "لا نتائج مطابقة — جرّب كلمة أخرى."
              : "سيُعرض هنا مسائل مختارة بعد اكتمال الفهرس."}
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
        "أبواب مرتبة للمبتدئ في الطهارة، الصلاة، الزكاة، الصيام، الحج، المعاملات والأسرة.",
      keywords: ["فقه إسلامي", "كتب الفقه", "مسائل فقهية", "سُنّة"],
      jsonLd: [
        webPageJsonLd(
          "الفقه",
          "أبواب مرتبة للمبتدئ في الطهارة والصلاة والزكاة والصيام والحج والمعاملات والأسرة.",
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
    <SectionTemplatePage
      route="/fiqh"
      title="الفقه"
      subtitle="أبواب مرتبة للمبتدئ في الطهارة، الصلاة، الزكاة، الصيام، الحج، المعاملات والأسرة."
      eyebrow="العلوم الشرعية"
      groupTitle="أبواب الفقه"
    >
      <div className="fiqh-lux-shell" dir="rtl">
        <FiqhLobbyBody lobby={lobby} />
        <section className="fiqh-hub-stats" aria-label="حجم المحتوى">
          {headerStats.map((stat) => (
            <p key={stat.id} className="fiqh-hub-stats__item">
              {stat.label}
            </p>
          ))}
        </section>
      </div>
    </SectionTemplatePage>
  );
}
