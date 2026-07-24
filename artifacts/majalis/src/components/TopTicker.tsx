import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { useNumerals } from "@/hooks/useNumerals";
import { getDailyHadith, getDailyDhikr } from "@/lib/daily-content";
import { getLocalSunnahPeriod } from "@/lib/sunnah-by-time";

type TickerItem = {
  id: string;
  text: string;
  source?: string;
  href?: string;
};

/* دقيقة واحدة تكفي لعدّاد شريط متحرك (لا حاجة لدقّة الثانية هنا) — يمنع
   إعادة بناء عناصر الشريط 3600 مرة/ساعة، ويكتفي بـ60. القيمة الدقيقة
   بالثانية تبقى معروضة في PrayerTimesPage/NavBar، لا هنا. */
function toMinutePrecision(hms: string | null | undefined): string | null {
  if (!hms) return null;
  const parts = hms.split(":");
  return parts.length === 3 ? `${parts[0]}:${parts[1]}` : hms;
}

/* مؤشرات فعلية لمزايا/أقسام قائمة في الموقع — لا نص تسويقي مُبالَغ فيه،
   ولا صفحات وهمية. قائمة قصيرة عمدًا. */
const FEATURE_HIGHLIGHTS: { id: string; text: string; href: string }[] = [
  { id: "feature-recitation", text: "ميزة: اختبار التسميع بالذكاء الاصطناعي", href: "/quran/recitation-test-ai" },
  { id: "feature-paths", text: "ميزة: مسارات تعلّم منظّمة خطوة بخطوة", href: "/learning/paths" },
];

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

/**
 * شريط متحرك أعلى الشاشة، فوق الهيدر مباشرة. حركة مستمرة بلا توقف (لا
 * إيقاف عند اللمس/التمرير/hover — بطلب مباشر 2026-07-25)، وحلقة Seamless
 * حقيقية عبر مضاعفة عناصر المصدر الواحد مرة واحدة (translateX(-50%) على
 * نسخة مكرَّرة بالضبط — لا فراغ نهاية، لا اعتماد على عرض ثابت). يعرض
 * بالتتابع: عدّ الصلاة القادمة (usePrayerCountdown نفسه المستخدَم في
 * PrayerCountdownBanner/NavBar/PrayerTimesPage)، حديثًا وذكرًا يوميين
 * وفترة السنن العملية الحالية من مصادر مُنسَّقة موجودة مسبقًا
 * (daily-content.ts وsunnah-by-time.ts — نفس مصدر بطاقة "مجلس اليوم"
 * وقسم "سنن حسب الوقت" بالرئيسية)، ثم مؤشرات مزايا/أقسام فعلية. كل عنصر
 * حرفي مع مصدره، بلا أي توليد نص شرعي. عنصر غائب البيانات يُتجاوَز بلا
 * فجوة (لا list.push إن لم توجد بيانات).
 */
export function TopTicker() {
  const { countdown } = usePrayerCountdown();
  const fmt = useNumerals();
  const reducedMotion = usePrefersReducedMotion();
  const [staticIndex, setStaticIndex] = useState(0);

  // تحديث بدقة الدقيقة لا الثانية: كافٍ لشريط متحرك بطيء، ويمنع إعادة
  // بناء عناصر الشريط 3600 مرة/ساعة (العدّاد الدقيق بالثانية يبقى في
  // PrayerTimesPage/NavBar المخصَّصين لذلك).
  const sincePrecise = countdown?.sinceSeconds != null;
  const remainingMin = toMinutePrecision(countdown?.remainingHms);
  const sinceMin = toMinutePrecision(countdown?.sinceHms);

  const items = useMemo<TickerItem[]>(() => {
    const list: TickerItem[] = [];
    const slot = countdown?.next;
    if (slot) {
      // نافذة سماح 35 دقيقة بعد الأذان: عدّاد تصاعدي منذ الأذان بدل القفز
      // فورًا لعدّ الصلاة القادمة — نفس منطق PrayerTimesPage.
      list.push(
        sincePrecise && sinceMin
          ? { id: "prayer", text: `مضى على أذان ${slot.name}: ${fmt(sinceMin)}`, href: "/prayer-times" }
          : { id: "prayer", text: `المتبقي على صلاة ${slot.name}: ${fmt(remainingMin ?? "")}`, href: "/prayer-times" }
      );
    }
    const hadith = getDailyHadith();
    if (hadith?.text) {
      list.push({ id: "hadith", text: hadith.text, source: hadith.source });
    }
    const dhikr = getDailyDhikr();
    if (dhikr?.text) {
      list.push({ id: "dhikr", text: dhikr.text, source: dhikr.source });
    }
    const sunnah = getLocalSunnahPeriod();
    const suggestion = sunnah?.suggestions?.[0];
    if (suggestion) {
      list.push({
        id: "sunnah",
        text: `سنة نبوية عملية (${sunnah.title}): ${suggestion.label}`,
        href: suggestion.href,
      });
    }
    for (const f of FEATURE_HIGHLIGHTS) {
      list.push({ id: f.id, text: f.text, href: f.href });
    }
    return list;
  }, [countdown?.next?.key, sincePrecise, sinceMin, remainingMin, fmt]);

  useEffect(() => {
    if (!reducedMotion || items.length === 0) return;
    const timer = window.setInterval(() => {
      setStaticIndex((i) => (i + 1) % items.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [reducedMotion, items.length]);

  if (items.length === 0) {
    return (
      <div className="top-ticker top-ticker--empty" role="status">
        <span className="top-ticker__empty-text">لا محتوى متاح الآن</span>
      </div>
    );
  }

  if (reducedMotion) {
    const item = items[staticIndex % items.length];
    return (
      <div className="top-ticker top-ticker--static" role="status" aria-live="polite">
        <span className="top-ticker__item">
          {item.text}
          {item.source ? <span className="top-ticker__item-source"> — {item.source}</span> : null}
        </span>
      </div>
    );
  }

  const track = [...items, ...items];

  return (
    <div className="top-ticker" role="status" aria-live="off">
      <div className="top-ticker__track">
        {track.map((item, i) =>
          item.href ? (
            <Link className="top-ticker__item" key={`${item.id}-${i}`} href={item.href} tabIndex={-1}>
              {item.text}
              {item.source ? <span className="top-ticker__item-source"> — {item.source}</span> : null}
            </Link>
          ) : (
            <span className="top-ticker__item" key={`${item.id}-${i}`}>
              {item.text}
              {item.source ? <span className="top-ticker__item-source"> — {item.source}</span> : null}
            </span>
          )
        )}
      </div>
    </div>
  );
}

export default TopTicker;
