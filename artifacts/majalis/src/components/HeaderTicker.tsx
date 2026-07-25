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
  truncateForTicker,
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
 * اليوم) بنصوصها الكاملة — فبدا متكررًا، وعنصر واحد بطول ١٣٦٩ حرفًا كان
 * يزحف وحده نحو ٢٥ ثانية. الآن: مجمّع ١٧٨ عنصرًا محليًا، دفعة من ٤ تتبدّل
 * كل ٤٥–٩٠ ثانية بلا إعادة تحميل، ولا يتكرر عنصر ضمن آخر ٢٠ عرضًا.
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

function TickerEntry({ item }: { item: TickerItem }) {
  return (
    <Link href={item.href} className="header-ticker__item">
      <item.Icon size={13} strokeWidth={1.8} className="header-ticker__icon" aria-hidden="true" />
      <span className="header-ticker__label">{item.label}:</span>
      <span className="header-ticker__text">{truncateForTicker(item.text)}</span>
      {item.source && <span className="header-ticker__source">— {item.source}</span>}
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
  const [staticIndex, setStaticIndex] = useState(0);

  const items = useMemo<TickerItem[]>(() => {
    const mapped: TickerItem[] = contentItems.map((c) => ({
      key: c.id,
      Icon: KIND_ICON[c.kind] ?? Sparkles,
      label: c.label,
      text: c.text,
      source: c.source,
      href: c.href,
    }));
    return prayerItem ? [prayerItem, ...mapped] : mapped;
  }, [prayerItem, contentItems]);

  useEffect(() => {
    if (!reducedMotion || items.length === 0) return;
    const t = setInterval(() => setStaticIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [reducedMotion, items.length]);

  if (items.length === 0) {
    return <div className="header-ticker header-ticker--empty" aria-hidden="true" />;
  }

  if (reducedMotion) {
    return (
      <div className="header-ticker header-ticker--static" role="status" aria-live="polite">
        <TickerEntry item={items[staticIndex % items.length]} />
      </div>
    );
  }

  /* نسختان متطابقتان بالضبط: الحركة تُزيح المسار بمقدار 50% من عرضه، فتحلّ
     النسخة الثانية محل الأولى تمامًا عند نهاية الدورة — حلقة بلا فراغ ولا
     قفزة مرئية. أي عدد غير مزدوج من النسخ يكسر هذا التطابق.
     مفتاح المسار مشتق من معرّفات الدفعة: عند التدوير يُعاد بناء المسار
     فتبدأ الحركة من نقطة متسقة بدل أن تقفز في منتصفها. */
  const trackKey = items.map((i) => i.key).join("|");
  return (
    <div className="header-ticker" role="status" aria-label="شريط معلومات متحرك">
      <div className="header-ticker__track" key={trackKey}>
        {[...items, ...items].map((item, i) => (
          <TickerEntry key={`${item.key}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}
