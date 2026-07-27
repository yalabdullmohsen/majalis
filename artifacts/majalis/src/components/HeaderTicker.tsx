import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Clock, Repeat2, ScrollText, Heart, BookOpen, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { fetchPrayerTimes, computePrayerCountdown, type PrayerCountdown, type PrayerSlot } from "@/lib/prayer-times";
import {
  buildTickerPool,
  pickNextBatch,
  readRecent,
  writeRecent,
  nextRotationDelayMs,
  REFRESH_ON_RETURN_AFTER_MS,
  type TickerContentItem,
  type TickerKind,
} from "@/lib/ticker-content";

type TickerItem = {
  key: string;
  Icon: LucideIcon;
  label: string;
  text: string;
  source?: string;
  href: string;
};

const MAX_TICKER_TEXT_LENGTH = 72;

/* عدّاد الصلاة القادمة — نفس منطق PrayerChip في NavBar.tsx حرفيًا (فترة
   السماح 30 دقيقة بعد الأذان)، بتحديث كل دقيقة بدل كل ثانية (كافٍ لشريط
   نصي متحرك، ويتجنّب عرض ثوانٍ متجمّدة بين كل تحديث). */
function usePrayerTickerItem(): TickerItem | null {
  const [cd, setCd] = useState<PrayerCountdown | null>(null);
  useEffect(() => {
    let prayers: PrayerSlot[] = [];
    let interval: ReturnType<typeof setInterval> | undefined;
    fetchPrayerTimes()
      .then((payload) => {
        prayers = payload.prayers;
        setCd(computePrayerCountdown(prayers));
        interval = setInterval(() => setCd(computePrayerCountdown(prayers)), 60_000);
      })
      .catch(() => {});
    return () => { if (interval) clearInterval(interval); };
  }, []);

  if (!cd?.next) return null;
  const inGrace = cd.sinceSeconds != null;
  const name = inGrace && cd.graceNextSlot ? cd.graceNextSlot.name : cd.next.name;
  const hms = inGrace && cd.graceNextHms ? cd.graceNextHms : cd.remainingHms;
  const hm = hms.split(":").slice(0, 2).join(":");
  return {
    key: "prayer",
    Icon: Clock,
    label: `المتبقي على صلاة ${name}`,
    text: hm,
    href: "/prayer-times",
  };
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

const KIND_ICON: Record<TickerKind, LucideIcon> = {
  hadith: ScrollText,
  dhikr: Repeat2,
  ayah: BookOpen,
  faida: Heart,
};

/**
 * دفعة المحتوى المعروضة، مع تدوير دوري ومنع تكرار.
 *
 * سابقًا كان الشريط يعرض ٣ عناصر «يومية» ثابتة (نفس الحديث والذكر طوال
 * اليوم) فبدا متكررًا. الآن: مجمّع محلي كبير (buildTickerPool، بلا تكرار
 * نصّي)، دفعة من ٤ تتبدّل كل ٤٥–٩٠ ثانية بلا إعادة تحميل، ولا يتكرر عنصر
 * ضمن آخر ٢٠ عرضًا. كل نص يُعرض كاملًا من مصدره دون أي قصّ.
 */
function useRotatingContent(): TickerContentItem[] {
  const pool = useMemo(() => buildTickerPool(), []);
  const recentRef = useRef<string[]>([]);
  const [batch, setBatch] = useState<TickerContentItem[]>([]);
  const lastPickAtRef = useRef(0);

  const rotate = useCallback(() => {
    const { batch: next, recent } = pickNextBatch(pool, recentRef.current);
    recentRef.current = recent;
    writeRecent(recent);
    lastPickAtRef.current = Date.now();
    setBatch(next);
  }, [pool]);

  // أول تحميل: يُقرأ السجل من الجلسات السابقة كي لا يعيد الشريط نفس
  // المحتوى بعد كل فتح للتطبيق.
  useEffect(() => {
    recentRef.current = readRecent();
    rotate();
  }, [rotate]);

  // تدوير دوري بفاصل عشوائي 45–90ث. يُعاد جدولته بعد كل دورة كي لا يكون
  // الإيقاع رتيبًا ومتوقَّعًا.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        rotate();
        schedule();
      }, nextRotationDelayMs());
    };
    schedule();
    return () => clearTimeout(timer);
  }, [rotate]);

  // العودة من الخلفية: تُحدَّث الدفعة فقط إن مرّ وقت كافٍ — بلا هذا الشرط
  // يتبدّل المحتوى مع كل تبديل تبويب، وهو مزعج.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastPickAtRef.current < REFRESH_ON_RETURN_AFTER_MS) return;
      rotate();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [rotate]);

  return batch;
}

// المصدر/التخريج ورقم الحديث لا يُعرضان في الواجهة (طلب مباشر)؛ يبقيان في
// TickerContentItem.source للتحقق الداخلي فقط — النص المعروض هو المتن الكامل.
function TickerEntry({ item }: { item: TickerItem }) {
  return (
    <Link href={item.href} className="header-ticker__item">
      <item.Icon size={13} strokeWidth={1.8} className="header-ticker__icon" aria-hidden="true" />
      <span className="header-ticker__label">{item.label}:</span>
      <span className="header-ticker__text">{item.text}</span>
    </Link>
  );
}

/** شريط علوي متحرك يعرض عدّاد الصلاة القادمة بالتناوب مع محتوى معتمد
    (ذكر/حديث/فائدة من نفس مصدر «مجلس اليوم»)، بدل زر البحث في الهيدر.
    CSS Marquee بلا مكتبات؛ يتوقف عند hover/لمس، ويتحول لتناوب ثابت بلا
    حركة عند prefers-reduced-motion. */
export function HeaderTicker() {
  const prayerItem = usePrayerTickerItem();
  const contentItems = useRotatingContent();
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const items = useMemo<TickerItem[]>(() => {
    const rejected: string[] = [];
    const mapped: TickerItem[] = contentItems.flatMap((c) => {
      if (!c.text?.trim() || c.text.length > MAX_TICKER_TEXT_LENGTH) {
        rejected.push(c.id);
        return [];
      }
      return [{
      key: c.id,
      Icon: KIND_ICON[c.kind] ?? Sparkles,
      label: c.label,
      text: c.text,
      source: c.source,
      href: c.href,
      }];
    });
    if (rejected.length > 0 && typeof window !== "undefined") {
      console.warn("[majalis:ticker:review]", {
        reason: "excluded-long-or-empty",
        ids: rejected,
      });
    }
    return prayerItem ? [prayerItem, ...mapped] : mapped;
  }, [prayerItem, contentItems]);

  useEffect(() => {
    if (items.length === 0 || paused) return;
    const t = setInterval(() => setActiveIndex((i) => (i + 1) % items.length), reducedMotion ? 6000 : 8000);
    return () => clearInterval(t);
  }, [reducedMotion, items.length, paused]);

  useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [activeIndex, items.length]);

  if (items.length === 0) {
    return <div className="header-ticker header-ticker--empty" aria-hidden="true" />;
  }

  const activeItem = items[activeIndex % items.length];
  return (
    <div
      className={`header-ticker${reducedMotion ? " header-ticker--static" : " header-ticker--single"}${paused ? " header-ticker--paused" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="شريط معلومات متحرك"
      onPointerDown={() => setPaused(true)}
      onPointerUp={() => setPaused(false)}
      onPointerCancel={() => setPaused(false)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={`header-ticker__single-item${reducedMotion ? "" : " header-ticker__single-item--animate"}`} key={activeItem.key}>
        <TickerEntry item={activeItem} />
      </div>
    </div>
  );
}
