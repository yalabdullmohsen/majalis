import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { useNumerals } from "@/hooks/useNumerals";
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
 * PrayerCountdownBanner/NavBar/PrayerTimesPage)، وفترة السنن العملية
 * الحالية من sunnah-by-time.ts (نفس مصدر قسم "سنن حسب الوقت" بالرئيسية)،
 * ثم مؤشرات مزايا/أقسام فعلية. كل عنصر حرفي مع مصدره، بلا أي توليد نص
 * شرعي. عنصر غائب البيانات يُتجاوَز بلا فجوة (لا list.push إن لم توجد
 * بيانات). ميزة "محتوى اليوم" (حديث/ذكر يوميان دوّاران) أُزيلت نهائيًا
 * من الشريط ومن كل الموقع 2026-07-25 بطلب مباشر — راجع سجل commit للنطاق
 * الكامل (daily-content.ts وHomeMajlisToday وHomeDailyQuestion).
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
