/**
 * بطاقة متابعة محلية (بلا تسجيل دخول) — مصحف / استماع من localStorage.
 */
import { useMemo } from "react";
import { Link } from "wouter";
import { BookOpen, Headphones } from "lucide-react";
import { getSurahMeta, loadPagePosition, loadReadingAyahKey } from "@/lib/quran-api";
import { loadAudioResumeState } from "@/lib/quran-audio-resume";
import { getReadingProgress } from "@/lib/reading-progress";
import { getRecentPages } from "@/lib/recent-pages";
import { ayahKeyToPage } from "@/lib/quran-my-bookmarks";
import { toArabicDigits } from "@/lib/utils";
import "@/styles/components/home-local-resume.css";

type ResumeItem = {
  id: string;
  kind: "mushaf" | "listen" | "adhkar" | "book";
  href: string;
  title: string;
  meta: string;
};

function buildItems(): ResumeItem[] {
  const items: ResumeItem[] = [];
  const page = loadPagePosition();
  const ayahKey = loadReadingAyahKey();
  const audio = loadAudioResumeState();
  const adhkar = getReadingProgress("adhkar");

  if (page != null && page >= 1) {
    const surahHint = (() => {
      if (!ayahKey) return "";
      const [s] = ayahKey.split(":").map(Number);
      if (!s || s < 1 || s > 114) return "";
      return getSurahMeta(s).name.replace(/^سُورَةُ\s*/u, "");
    })();
    items.push({
      id: "mushaf",
      kind: "mushaf",
      href: ayahKey ? `/mushaf/page/${page}?ayah=${ayahKey}` : `/mushaf/page/${page}`,
      title: "متابعة القراءة",
      meta: surahHint
        ? `${surahHint} · ص ${toArabicDigits(page)}`
        : `المصحف · ص ${toArabicDigits(page)}`,
    });
  }

  if (audio && audio.surah >= 1 && audio.ayah >= 1) {
    const name = getSurahMeta(audio.surah).name.replace(/^سُورَةُ\s*/u, "");
    const p = ayahKeyToPage(`${audio.surah}:${audio.ayah}`);
    items.push({
      id: "listen",
      kind: "listen",
      href: `/mushaf/page/${p}?ayah=${audio.surah}:${audio.ayah}`,
      title: "متابعة الاستماع",
      meta: `${name} · آية ${toArabicDigits(audio.ayah)}`,
    });
  }

  if (adhkar?.id) {
    const slugOk = !adhkar.id.startsWith("scroll-");
    items.push({
      id: "adhkar",
      kind: "adhkar",
      href: slugOk ? `/adhkar/${encodeURIComponent(adhkar.id)}` : "/adhkar",
      title: "متابعة الأذكار",
      meta: adhkar.title || "الأذكار",
    });
  }

  const recentBook = getRecentPages(8).find(
    (p) => p.href.startsWith("/library/") && p.href !== "/library",
  );
  if (recentBook) {
    items.push({
      id: "book",
      kind: "book",
      href: recentBook.href,
      title: "متابعة قراءة الكتاب",
      meta: recentBook.label || "المكتبة",
    });
  }

  return items.slice(0, 3);
}

export function HomeLocalResumeCard() {
  const items = useMemo(() => buildItems(), []);

  if (items.length === 0) return null;

  return (
    <div className="hlr" dir="rtl" aria-label="متابعة القراءة والاستماع">
      <p className="hlr__eyebrow">متابعة القراءة / الاستماع</p>
      <ul className="hlr__list">
        {items.map((item) => {
          const Icon = item.kind === "listen" ? Headphones : BookOpen;
          return (
            <li key={item.id}>
              <Link href={item.href} className="hlr__card">
                <span className="hlr__icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <span className="hlr__body">
                  <strong>{item.title}</strong>
                  <span>{item.meta}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default HomeLocalResumeCard;
