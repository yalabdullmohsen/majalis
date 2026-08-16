/**
 * بطاقة «ورد اليوم» على الرئيسية — آية وذكر وحديث صحيح وفائدة (من daily-content).
 */
import { Link } from "wouter";
import { BookOpen, Heart, MessageCircle, Sparkles } from "lucide-react";
import {
  getDailyAyah,
  getDailyDhikr,
  getDailyFaida,
  getDailyHadith,
} from "@/lib/daily-content";

export function HomeDailyWirdBand() {
  const ayah = getDailyAyah();
  const dhikr = getDailyDhikr();
  const hadith = getDailyHadith();
  const faida = getDailyFaida();

  return (
    <section className="m2030-band m2030-band--sage home-daily-wird" aria-label="ورد اليوم">
      <div className="m2030-band__head">
        <h2 className="m2030-band__title">ورد اليوم</h2>
        <Link href="/daily-wird" className="m2030-band__link">
          الورد الكامل
        </Link>
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
          <p className="home-daily-wird__meta">{ayah.reference}</p>
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
          <p className="home-daily-wird__meta">{dhikr.source || "من أذكار اليوم"}</p>
          <Link href="/adhkar" className="home-daily-wird__cta">
            الأذكار
          </Link>
        </article>

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
