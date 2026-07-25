import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { ScrollText, BookMarked, Repeat2, Hand, Lightbulb, BookOpen, Compass } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  buildTickerPool,
  pickNextItem,
  createShuffleBag,
  readRecent,
  writeRecent,
  KIND_LABEL,
  ROTATION_INTERVAL_MS,
  REFRESH_ON_RETURN_AFTER_MS,
  type TickerContentItem,
  type TickerKind,
  type ShuffleBagState,
} from "@/lib/ticker-content";

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
  sunnah: BookMarked,
  dhikr: Repeat2,
  dua: Hand,
  faida: Lightbulb,
  ayah: BookOpen,
  feature: Compass,
};

/**
 * العنصر المعروض حاليًا، مع تدوير كل 25 ثانية بالضبط ومنع تكرار.
 *
 * سابقًا (حتى 2026-07-25) كان الشريط CSS-marquee بعرض 4 عناصر متتالية،
 * فكان النص يزحف أفقيًا ويُقصّ عند عرض ضيق أو تداخل مع أزرار الهيدر.
 * الآن: عنصر واحد كامل النص، بديل عبر Shuffle Bag من مجمّع محلي (انظر
 * lib/ticker-content.ts)، مع بطاقة نوع صغيرة، وانتقال Fade هادئ بدل الحركة
 * الأفقية. لا يتكرر عنصر ضمن آخر 15 عرضًا، ولا يتكرر نفس النوع أكثر من
 * مرتين متتاليتين.
 */
function useTickerItem(): TickerContentItem | null {
  const pool = useMemo(() => buildTickerPool(), []);
  const recentRef = useRef<string[]>([]);
  const bagRef = useRef<ShuffleBagState>(createShuffleBag());
  const [current, setCurrent] = useState<TickerContentItem | null>(null);
  const lastPickAtRef = useRef(0);

  const advance = useCallback(() => {
    if (pool.length === 0) return;
    const { item, recent, bag } = pickNextItem(pool, recentRef.current, bagRef.current);
    recentRef.current = recent;
    bagRef.current = bag;
    writeRecent(recent);
    lastPickAtRef.current = Date.now();
    setCurrent(item);
  }, [pool]);

  // أول تحميل: يُقرأ السجل من الجلسات السابقة كي لا يعيد الشريط نفس
  // المحتوى بعد كل فتح للتطبيق.
  useEffect(() => {
    recentRef.current = readRecent();
    advance();
  }, [advance]);

  // تدوير دوري كل 25 ثانية بالضبط.
  useEffect(() => {
    if (pool.length === 0) return;
    const timer = window.setInterval(advance, ROTATION_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [advance, pool.length]);

  // العودة من الخلفية: تُحدَّث فقط إن مرّ وقت كافٍ — بلا هذا الشرط يتبدّل
  // المحتوى مع كل تبديل تبويب، وهو مزعج.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastPickAtRef.current < REFRESH_ON_RETURN_AFTER_MS) return;
      advance();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [advance]);

  return current;
}

/** شريط نصي أعلى التطبيق: يعرض عنصرًا واحدًا كاملًا (حديث/ذكر/دعاء/سنة/
    فائدة/آية/ميزة تطبيق)، بلا تخريج أو مصدر ظاهر في الواجهة. صف مستقل
    بعرض كامل تحت navbar-v3__inner (لا يتشارك المساحة مع أزرار الحساب/
    القائمة)، مع انتقال Fade عند كل تبديل، ويتوقف عن الحركة فقط عند
    prefers-reduced-motion (الفيد نفسه حركة بسيطة تخضع لنفس القاعدة). */
export function HeaderTicker() {
  const item = useTickerItem();
  const reducedMotion = useReducedMotion();

  if (!item) {
    return <div className="header-ticker header-ticker--empty" aria-hidden="true" />;
  }

  const Icon = KIND_ICON[item.kind] ?? BookOpen;

  return (
    <div className="header-ticker" role="status" aria-live="polite" aria-label="محتوى متجدد">
      <Link
        href={item.href}
        className="header-ticker__item"
        key={item.id}
        style={reducedMotion ? { animation: "none" } : undefined}
      >
        <span className="header-ticker__meta">
          <Icon size={14} strokeWidth={1.8} className="header-ticker__icon" aria-hidden="true" />
          <span className="header-ticker__badge">{KIND_LABEL[item.kind]}</span>
        </span>
        <span className="header-ticker__text">{item.text}</span>
      </Link>
    </div>
  );
}
