/**
 * بطاقة متابعة محلية — مصحف / دروس / أنبياء / أذكار / مكتبة.
 */
import { useMemo } from "react";
import { Link } from "wouter";
import { BookOpen, Headphones } from "lucide-react";
import { getSurahMeta, loadPagePosition, loadReadingAyahKey } from "@/lib/quran-api";
import { loadAudioResumeState } from "@/lib/quran-audio-resume";
import { getContinueReadingEntries, type ContinueSection } from "@/lib/continue-reading";
import { ayahKeyToPage } from "@/lib/quran-my-bookmarks";
import { toArabicDigits } from "@/lib/utils";
import "@/styles/components/home-local-resume.css";

type ResumeItem = {
  id: string;
  kind: ContinueSection | "listen";
  href: string;
  title: string;
  meta: string;
};

const SECTION_TITLE: Record<ContinueSection, string> = {
  mushaf: "أكمل المصحف",
  lessons: "أكمل الدرس",
  prophets: "أكمل قصة النبي",
  adhkar: "أكمل الأذكار",
  library: "أكمل الكتاب",
};

function buildItems(): ResumeItem[] {
  const items: ResumeItem[] = [];
  const seen = new Set<string>();
  const page = loadPagePosition();
  const ayahKey = loadReadingAyahKey();
  const audio = loadAudioResumeState();

  if (page != null && page >= 1) {
    const surahHint = (() => {
      if (!ayahKey) return "";
      const [s] = ayahKey.split(":").map(Number);
      if (!s || s < 1 || s > 114) return "";
      return getSurahMeta(s).name.replace(/^سُورَةُ\s*/u, "");
    })();
    const href = ayahKey ? `/mushaf/page/${page}?ayah=${ayahKey}` : `/mushaf/page/${page}`;
    items.push({
      id: "mushaf-pos",
      kind: "mushaf",
      href,
      title: "أكمل من حيث توقفت — المصحف",
      meta: surahHint
        ? `${surahHint} · ص ${toArabicDigits(page)}`
        : `المصحف · ص ${toArabicDigits(page)}`,
    });
    seen.add("mushaf");
  }

  if (audio && audio.surah >= 1 && audio.ayah >= 1) {
    const name = getSurahMeta(audio.surah).name.replace(/^سُورَةُ\s*/u, "");
    const p = ayahKeyToPage(`${audio.surah}:${audio.ayah}`);
    items.push({
      id: "listen",
      kind: "listen",
      href: `/mushaf/page/${p}?ayah=${audio.surah}:${audio.ayah}`,
      title: "أكمل الاستماع",
      meta: `${name} · آية ${toArabicDigits(audio.ayah)}`,
    });
  }

  for (const entry of getContinueReadingEntries(8)) {
    if (seen.has(entry.section)) continue;
    // تجنّب تكرار المصحف إن وُجد موضع أدق أعلاه
    if (entry.section === "mushaf" && seen.has("mushaf")) continue;
    seen.add(entry.section);
    items.push({
      id: `cont-${entry.section}`,
      kind: entry.section,
      href: entry.route,
      title: `أكمل من حيث توقفت — ${SECTION_TITLE[entry.section].replace(/^أكمل\s*/, "")}`,
      meta: entry.title,
    });
  }

  return items.slice(0, 5);
}

export function HomeLocalResumeCard() {
  const items = useMemo(() => buildItems(), []);

  if (items.length === 0) return null;

  return (
    <div className="hlr" dir="rtl" aria-label="أكمل من حيث توقفت">
      <p className="hlr__eyebrow">أكمل من حيث توقفت</p>
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
