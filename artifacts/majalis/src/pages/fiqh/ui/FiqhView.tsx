import { useEffect, useState, type ReactNode } from "react";
import { Scale } from "lucide-react";
import { usePageView } from "@/hooks/usePageView";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/seo-structured-data";
import { ShareButtons } from "@/components/ContentActions";
import { ExploreAlsoNav } from "@/components/ExploreAlsoNav";
import { SectionLobby } from "@/components/lobby/SectionLobby";
import type { LobbySpec } from "@/config/section-lobbies";
import { FIQH_HUB_STATS } from "@/lib/fiqh-hub-stats";
import { formatAbwabCount, formatMasailCount } from "@/lib/arabic-count";
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
          بوابة فقهية مرتّبة للقراءة والتدرج: عبادات، معاملات، أسرة، وجنايات — كتب وأبواب ومسائل مع ملخص وأدلة وأقوال أهل العلم.
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

function FiqhLobbyBody({ lobby }: { lobby: LobbySpec }) {
  const [quiz, setQuiz] = useState<ReactNode>(null);
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
    <SectionLobby
      lobbyId="fiqh"
      title={lobby.title}
      chips={lobby.chips}
      groups={lobby.groups}
      className="fiqh-lux-page"
    >
      {quiz}
      <div className="twh-share">
        <ShareButtons title="الفقه الإسلامي — سُنّة" url="https://majlisilm.com/fiqh" />
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
        "أبواب ومسائل فقهية مرتبة: عبادات ومعاملات وأسرة وجنايات — كتب وأبواب ومسائل للقراءة والتدرج.",
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
