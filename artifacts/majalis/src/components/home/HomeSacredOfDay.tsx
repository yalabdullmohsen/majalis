/**
 * آية / حديث اليوم — Compact Hadith/Ayah Card (V3).
 * النص من مجمعات محلية موثّقة؛ لا توليد ولا تعديل نص شرعي.
 */
import { Link } from "wouter";
import { getDailyAyah, getDailyHadith, getDayIndex } from "@/lib/daily-content";
import { AppCard } from "@/components/design-system/AppCard";
import { toArabicDigits } from "@/lib/utils";

function todayLabels(): string {
  try {
    const g = new Intl.DateTimeFormat("ar", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date());
    return g;
  } catch {
    return "";
  }
}

export function HomeSacredOfDay() {
  const day = getDayIndex();
  const showHadith = day % 2 === 1;
  const ayah = getDailyAyah();
  const hadith = getDailyHadith();
  const dateLine = todayLabels();

  if (showHadith && hadith?.text) {
    const source = [hadith.narrator, hadith.source].filter(Boolean).join(" — ");
    return (
      <AppCard
        as="section"
        tone="accent"
        className="home-sacred-day home-sacred-day--compact"
        aria-label="حديث اليوم"
        data-testid="home-sacred-of-day"
      >
        <div className="home-sacred-day__head">
          <p className="home-sacred-day__kicker">حديث اليوم</p>
          {dateLine ? <p className="home-sacred-day__date">{dateLine}</p> : null}
        </div>
        <p className="home-sacred-day__text">{hadith.text}</p>
        <div className="home-sacred-day__foot">
          {source ? <p className="home-sacred-day__source">{source}</p> : null}
          <Link href="/hadith" className="home-sacred-day__link mj-pressable">
            المزيد
          </Link>
        </div>
      </AppCard>
    );
  }

  if (!ayah?.text) return null;

  const ref =
    ayah.reference ||
    [ayah.surah, ayah.ayahNumber != null ? `آية ${toArabicDigits(ayah.ayahNumber)}` : null]
      .filter(Boolean)
      .join(" · ");

  return (
    <AppCard
      as="section"
      tone="accent"
      className="home-sacred-day home-sacred-day--compact"
      aria-label="آية اليوم"
      data-testid="home-sacred-of-day"
    >
      <div className="home-sacred-day__head">
        <p className="home-sacred-day__kicker">آية اليوم</p>
        {dateLine ? <p className="home-sacred-day__date">{dateLine}</p> : null}
      </div>
      <p className="home-sacred-day__text home-sacred-day__text--ayah">{ayah.text}</p>
      <div className="home-sacred-day__foot">
        {ref ? <p className="home-sacred-day__source">{ref}</p> : null}
        <Link href="/mushaf" className="home-sacred-day__link mj-pressable">
          المصحف
        </Link>
      </div>
    </AppCard>
  );
}
