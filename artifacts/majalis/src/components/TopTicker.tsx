import { useEffect, useMemo, useState } from "react";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { useNumerals } from "@/hooks/useNumerals";
import { getDailyHadith, getDailyDhikr } from "@/lib/daily-content";

type TickerItem = {
  id: string;
  text: string;
  source?: string;
};

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
 * شريط متحرك أعلى الشاشة، فوق الهيدر مباشرة. يعرض بالتناوب: العدّ
 * التنازلي للصلاة القادمة (نظام usePrayerCountdown الحيّ نفسه المستخدَم
 * في PrayerCountdownBanner)، وحديثًا وذكرًا يوميين من daily-content.ts —
 * مصدر محتوى مُنسَّق ومُتحقَّق منه مسبقًا (نفس المصدر الذي تستخدمه بطاقة
 * "مجلس اليوم" بالرئيسية)، يُعرَضان حرفيًا مع مصدرهما، بلا أي توليد نص.
 * لا بيانات وهمية: عند غياب عدّ الصلاة (تحميل أولي) يبقى المحتوى الديني
 * وحده؛ حالة فارغة فعلية فقط إن غابت كل العناصر معًا.
 */
export function TopTicker() {
  const { countdown } = usePrayerCountdown();
  const fmt = useNumerals();
  const reducedMotion = usePrefersReducedMotion();
  const [paused, setPaused] = useState(false);
  const [staticIndex, setStaticIndex] = useState(0);

  const items = useMemo<TickerItem[]>(() => {
    const list: TickerItem[] = [];
    const slot = countdown?.next;
    if (slot && countdown) {
      // نافذة سماح 35 دقيقة بعد الأذان: عدّاد تصاعدي منذ الأذان بدل القفز
      // فورًا لعدّ الصلاة القادمة — نفس منطق PrayerTimesPage.
      const inGrace = countdown.sinceSeconds != null;
      list.push(
        inGrace && countdown.sinceHms
          ? { id: "prayer", text: `مضى على أذان ${slot.name}: ${fmt(countdown.sinceHms)}` }
          : { id: "prayer", text: `المتبقي على صلاة ${slot.name}: ${fmt(countdown.remainingHms)}` }
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
    return list;
  }, [countdown?.next?.key, countdown?.remainingHms, countdown?.sinceHms, fmt]);

  /**
   * وضع «تقليل الحركة» يعرض عنصرًا واحدًا في سطر واحد، وكان النص الطويل
   * يُقصّ بـellipsis فيظهر الحديث مبتورًا. بدل القصّ: يُقسَّم النص الطويل إلى
   * شرائح عند حدود الكلمات وتتعاقب، فيصل الحديث كاملًا بلا تغيير في ارتفاع
   * الشريط. الوضع المتحرك يعرض النص كاملًا أصلًا فلا يمسّه هذا.
   */
  const staticSlides = useMemo(() => {
    const MAX = 90;
    const slides: TickerItem[] = [];
    for (const item of items) {
      const full = item.source ? `${item.text} — ${item.source}` : item.text;
      if (full.length <= MAX) {
        slides.push(item);
        continue;
      }
      const words = full.split(/\s+/);
      let buf = "";
      const chunks: string[] = [];
      for (const w of words) {
        if (buf && (buf + " " + w).length > MAX) {
          chunks.push(buf);
          buf = w;
        } else {
          buf = buf ? `${buf} ${w}` : w;
        }
      }
      if (buf) chunks.push(buf);
      chunks.forEach((c, i) => slides.push({ id: `${item.id}-p${i}`, text: c }));
    }
    return slides;
  }, [items]);

  useEffect(() => {
    if (!reducedMotion || staticSlides.length === 0) return;
    const timer = window.setInterval(() => {
      setStaticIndex((i) => (i + 1) % staticSlides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [reducedMotion, staticSlides.length]);

  if (items.length === 0) {
    return (
      <div className="top-ticker top-ticker--empty" role="status">
        <span className="top-ticker__empty-text">لا محتوى متاح الآن</span>
      </div>
    );
  }

  if (reducedMotion) {
    const item = staticSlides[staticIndex % staticSlides.length];
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
    <div
      className="top-ticker"
      role="status"
      aria-live="off"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className={`top-ticker__track${paused ? " is-paused" : ""}`}>
        {track.map((item, i) => (
          <span className="top-ticker__item" key={`${item.id}-${i}`}>
            {item.text}
            {item.source ? <span className="top-ticker__item-source"> — {item.source}</span> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

export default TopTicker;
