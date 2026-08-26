import { useEffect, useMemo } from "react";
import { Scale } from "lucide-react";
import { usePageView } from "@/hooks/usePageView";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { SectionLobby } from "@/components/lobby/SectionLobby";
import { getLobby } from "@/config/section-lobbies";
import {
  fiqhBookCounts,
  listPublishedLessons,
  publishedBooks,
} from "@/lib/fiqh-books";
import { formatAbwabCount, formatMasailCount } from "@/lib/arabic-count";
import "@/styles/pages/fiqh-hub.css";

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
    <header className="fiqh-lux-hero" data-section-hero="1" aria-labelledby="fiqh-lux-title">
      <div className="fiqh-lux-hero__icon" aria-hidden="true">
        <Scale size={28} strokeWidth={1.6} />
      </div>
      <div className="fiqh-lux-hero__content">
        <span className="fiqh-lux-hero__badge">فقه العبادات والمعاملات</span>
        <h1 id="fiqh-lux-title" className="fiqh-lux-hero__title">
          الفقه
        </h1>
        <p className="fiqh-lux-hero__sub">أبواب ومسائل فقهية مرتبة للقراءة والتدرج</p>
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

export default function FiqhPage() {
  const lobby = useMemo(() => getLobby("fiqh"), []);
  const stats = useMemo(() => {
    const books = publishedBooks();
    let chapters = 0;
    for (const book of books) {
      chapters += fiqhBookCounts(book).chapters;
    }
    return {
      books: books.length,
      chapters,
      lessons: listPublishedLessons().length,
    };
  }, []);

  usePageView("fiqh", null);

  useEffect(() => {
    applyPageSeo({
      path: "/fiqh",
      title: "الفقه الإسلامي | المجلس العلمي",
      description: "كتب الفقه وأبوابها ومسائلها: عبادات ومعاملات وأسرة وجنايات وقضاء، مع مباحث مساندة.",
      keywords: ["فقه إسلامي", "كتب الفقه", "مسائل فقهية", "المجلس العلمي"],
    });
  }, []);

  return (
    <div className="fiqh-lux-shell" dir="rtl">
      <FiqhLuxHero
        bookCount={stats.books}
        chapterCount={stats.chapters}
        lessonCount={stats.lessons}
      />
      <SectionLobby
        lobbyId="fiqh"
        title={lobby.title}
        chips={lobby.chips}
        groups={lobby.groups}
        className="fiqh-lux-page"
      >
        <SectionQuiz sectionId="fiqh" title="اختبر معلوماتك في الفقه الإسلامي" count={4} />
        <div className="twh-share">
          <ShareButtons title="الفقه الإسلامي — المجلس العلمي" url="https://majlisilm.com/fiqh" />
        </div>
      </SectionLobby>
    </div>
  );
}
