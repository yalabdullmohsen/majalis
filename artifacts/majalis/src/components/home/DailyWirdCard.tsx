/**
 * DailyWirdCard — ورد اليوم: آية + حديث بمصدر + ذكر + فائدة + «تم اليوم».
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { BookOpen, Check, Heart, MessageCircle, Sparkles } from "lucide-react";
import {
  getDailyAyah,
  getDailyDhikr,
  getDailyFaida,
  getDailyHadith,
  getDayIndex,
} from "@/lib/daily-content";
import { toArabicDigits } from "@/lib/utils";

const DONE_KEY = "majalis-daily-wird-done-v1";

function doneStorageKey(dayIndex = getDayIndex()): string {
  return `${DONE_KEY}:${dayIndex}`;
}

function readDone(): boolean {
  try {
    return localStorage.getItem(doneStorageKey()) === "1";
  } catch {
    return false;
  }
}

function writeDone(done: boolean) {
  try {
    const key = doneStorageKey();
    if (done) {
      localStorage.setItem(key, "1");
      void import("@/lib/native-storage").then(({ storageSetSync }) => storageSetSync(key, "1"));
    } else {
      localStorage.removeItem(key);
      void import("@/lib/native-storage").then(({ storageRemoveSync }) => storageRemoveSync(key));
    }
  } catch {
    /* ignore */
  }
}

export function DailyWirdCard() {
  const ayah = getDailyAyah();
  const dhikr = getDailyDhikr();
  const hadith = getDailyHadith();
  const faida = getDailyFaida();
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(readDone());
  }, []);

  const toggleDone = useCallback(() => {
    setDone((prev) => {
      const next = !prev;
      writeDone(next);
      return next;
    });
  }, []);

  // لا نعرض حديثًا بلا مصدر
  const hadithOk = Boolean(hadith.source?.trim());
  const ayahRef = `${ayah.surah} · آية ${toArabicDigits(ayah.ayahNumber)}`;

  return (
    <section
      className={`m2030-band m2030-band--sage home-daily-wird daily-wird-card${done ? " daily-wird-card--done" : ""}`}
      aria-label="ورد اليوم"
      data-testid="daily-wird-card"
    >
      <div className="m2030-band__head">
        <h2 className="m2030-band__title">ورد اليوم</h2>
        <div className="daily-wird-card__actions">
          <button
            type="button"
            className={`daily-wird-card__done-btn${done ? " is-done" : ""}`}
            onClick={toggleDone}
            aria-pressed={done}
          >
            <Check size={16} aria-hidden="true" />
            {done ? "أُنجز اليوم" : "تم اليوم"}
          </button>
          <Link href="/daily-wird" className="m2030-band__link">
            الورد الكامل
          </Link>
        </div>
      </div>

      <div className="home-daily-wird__grid">
        <article className="home-daily-wird__card mj-card">
          <header className="home-daily-wird__card-head">
            <BookOpen size={16} aria-hidden="true" />
            <span>آية</span>
          </header>
          <p className="home-daily-wird__text" dir="rtl">
            {ayah.text}
          </p>
          <p className="home-daily-wird__meta">{ayahRef}</p>
          <Link href="/mushaf" className="home-daily-wird__cta">
            افتح المصحف
          </Link>
        </article>

        <article className="home-daily-wird__card mj-card">
          <header className="home-daily-wird__card-head">
            <Heart size={16} aria-hidden="true" />
            <span>ذكر</span>
          </header>
          <p className="home-daily-wird__text">{dhikr.text}</p>
          <p className="home-daily-wird__meta">{dhikr.source || dhikr.category || "أذكار"}</p>
          <Link href="/adhkar" className="home-daily-wird__cta">
            الأذكار
          </Link>
        </article>

        {hadithOk ? (
          <article className="home-daily-wird__card mj-card">
            <header className="home-daily-wird__card-head">
              <MessageCircle size={16} aria-hidden="true" />
              <span>حديث</span>
            </header>
            <p className="home-daily-wird__text">{hadith.text}</p>
            <p className="home-daily-wird__meta">
              {[hadith.source, hadith.grade].filter(Boolean).join(" · ")}
            </p>
            <Link href="/hadith" className="home-daily-wird__cta">
              المزيد من الأحاديث
            </Link>
          </article>
        ) : null}

        <article className="home-daily-wird__card mj-card">
          <header className="home-daily-wird__card-head">
            <Sparkles size={16} aria-hidden="true" />
            <span>فائدة</span>
          </header>
          <p className="home-daily-wird__text">{faida.text}</p>
          <p className="home-daily-wird__meta">
            {[faida.author_name, faida.source, faida.category].filter(Boolean).join(" · ")}
          </p>
          <Link href="/fawaid" className="home-daily-wird__cta">
            الفوائد
          </Link>
        </article>
      </div>
    </section>
  );
}

/** توافق خلفي مع الاستيراد السابق */
export function HomeDailyWirdBand() {
  return <DailyWirdCard />;
}
