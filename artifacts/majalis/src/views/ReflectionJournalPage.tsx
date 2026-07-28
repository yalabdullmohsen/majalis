/**
 * دفتر التدبّر — تجميع الملاحظات والإشارات الصوتية ومقاطع التفسير حسب السورة/الجزء.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { BookOpen, Mic, StickyNote, ArrowRight } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { toArabicDigits } from "@/lib/utils";
import { findPageForAyah, loadPageJuzIndex } from "@/lib/recitation-ai/page-juz-lookup";
import {
  listTadabburEntries,
  groupTadabburBySurah,
  groupTadabburByJuz,
  type TadabburEntry,
} from "@/lib/quran-tadabbur";

export default function ReflectionJournalPage() {
  const [entries, setEntries] = useState<TadabburEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<"surah" | "juz">("surah");

  useEffect(() => {
    applyPageSeo({
      path: "/mushaf/reflections",
      title: "دفتر التدبّر | المصحف | المجلس العلمي",
      description: "ملاحظاتك الخاصة ومقاطع التفسير والإشارات الصوتية على آيات القرآن، مجمّعة حسب السورة والجزء.",
      keywords: ["تدبّر", "ملاحظات قرآنية", "المصحف"],
    });
  }, []);

  useEffect(() => {
    let alive = true;
    void listTadabburEntries().then((rows) => {
      if (alive) {
        setEntries(rows);
        setLoading(false);
      }
    });
    return () => { alive = false; };
  }, []);

  const grouped = useMemo(() => {
    return groupBy === "surah" ? groupTadabburBySurah(entries) : groupTadabburByJuz(entries);
  }, [entries, groupBy]);

  const keys = useMemo(() => [...grouped.keys()].sort((a, b) => a - b), [grouped]);

  const openAyah = async (e: TadabburEntry) => {
    try {
      const idx = await loadPageJuzIndex();
      const page = findPageForAyah(idx, e.surahNum, e.ayahNum) ?? 1;
      window.location.href = `/mushaf/page/${page}`;
    } catch {
      window.location.href = `/mushaf/${e.surahNum}`;
    }
  };

  return (
    <div className="rj-page" dir="rtl">
      <header className="rj-page__head">
        <Link href="/mushaf" className="rj-page__back">
          <ArrowRight size={16} aria-hidden="true" /> المصحف
        </Link>
        <h1 className="rj-page__title">دفتر التدبّر</h1>
        <p className="rj-page__lead">ملاحظاتك الخاصة ومقاطع التفسير والإشارات الصوتية — مخزّنة محليًا على جهازك.</p>
        <div className="rj-page__tabs" role="tablist">
          <button type="button" role="tab" className={`rj-chip${groupBy === "surah" ? " is-active" : ""}`} aria-selected={groupBy === "surah"} onClick={() => setGroupBy("surah")}>حسب السورة</button>
          <button type="button" role="tab" className={`rj-chip${groupBy === "juz" ? " is-active" : ""}`} aria-selected={groupBy === "juz"} onClick={() => setGroupBy("juz")}>حسب الجزء</button>
        </div>
      </header>

      {loading ? (
        <p className="rj-empty">جارٍ التحميل…</p>
      ) : entries.length === 0 ? (
        <p className="rj-empty">لا ملاحظات بعد. افتح آية من المصحف واكتب تأمّلك أو احفظ مقطع تفسير.</p>
      ) : (
        keys.map((key) => {
          const list = grouped.get(key) ?? [];
          const title = groupBy === "surah" ? `سورة ${list[0]?.surahName ?? key}` : `الجزء ${toArabicDigits(key)}`;
          return (
            <section key={key} className="rj-section">
              <h2 className="rj-section__title">{title}</h2>
              <ul className="rj-list">
                {list.map((e) => (
                  <li key={e.id}>
                    <button type="button" className="rj-card" onClick={() => void openAyah(e)}>
                      <div className="rj-card__meta">
                        <span>{e.surahName} · آية {toArabicDigits(e.ayahNum)}</span>
                        <span className="rj-card__icons">
                          {e.text ? <StickyNote size={13} aria-label="ملاحظة" /> : null}
                          {e.tafsirClip ? <BookOpen size={13} aria-label="تفسير محفوظ" /> : null}
                          {e.hasVoice ? <Mic size={13} aria-label="إشارة صوتية" /> : null}
                        </span>
                      </div>
                      {e.text && <p className="rj-card__text">{e.text}</p>}
                      {e.tafsirClip && <p className="rj-card__clip">{e.tafsirClip}</p>}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
