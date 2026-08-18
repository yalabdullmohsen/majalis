import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Repeat2, ScrollText, Heart, BookOpen, Sparkles, Megaphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PrayerCountdownChip } from "@/components/prayer/PrayerCountdownChip";
import {
  buildTickerPool,
  pickNextBatch,
  readRecent,
  writeRecent,
  nextRotationDelayMs,
  marqueeDurationSec,
  REFRESH_ON_RETURN_AFTER_MS,
  type TickerContentItem,
  type TickerKind,
} from "@/lib/ticker-content";
import "@/styles/components/header-ticker-polish.css";

type TickerItem = {
  key: string;
  Icon: LucideIcon;
  label: string;
  text: string;
  source?: string;
  href: string;
  kind?: TickerKind;
};

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
  promo: Megaphone,
};

/**
 * دفعة مسار الإعلان: مجمّع محلّي كبير، دفعة متنوّعة تتبدّل دوريًا،
 * بلا تكرار ضمن آخر 20 عرضًا.
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

  useEffect(() => {
    recentRef.current = readRecent();
    rotate();
  }, [rotate]);

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

function TickerEntry({ item }: { item: TickerItem & { kind?: TickerKind } }) {
  return (
    <Link href={item.href} className="header-ticker__item">
      <item.Icon size={13} strokeWidth={1.8} className="header-ticker__icon" aria-hidden="true" />
      <span className="header-ticker__label">{item.label}</span>
      {item.kind === "hadith" ? (
        <span className="header-ticker__warn">تنبيه الحديث</span>
      ) : null}
      <span className="header-ticker__text">{item.text}</span>
      {item.source ? (
        <span className="header-ticker__source" aria-label={`المصدر: ${item.source}`}>
          — {item.source}
        </span>
      ) : null}
    </Link>
  );
}

/**
 * إيقاف مؤقت أثناء التفاعل فقط — بلا تبديل دائم عند نقر الروابط
 * (كان onClick على الحاوية يجمّد الأنيميشن بعد أول نقرة).
 */
function useTransientPause() {
  const [paused, setPaused] = useState(false);
  const handlers = useMemo(
    () => ({
      onMouseEnter: () => setPaused(true),
      onMouseLeave: () => setPaused(false),
      onFocusCapture: () => setPaused(true),
      onBlurCapture: () => setPaused(false),
      onPointerDown: () => setPaused(true),
      onPointerUp: () => setPaused(false),
      onPointerCancel: () => setPaused(false),
      onTouchStart: () => setPaused(true),
      onTouchEnd: () => setPaused(false),
      onTouchCancel: () => setPaused(false),
    }),
    [],
  );
  return { paused, handlers };
}

/** شريط إعلان علوي متحرّك مستمر (marquee) — أحاديث وأذكار ونبذ أقسام/مميزات.
 * عدّاد الصلاة مكوّن ابن مستقل — لا اشتراك ثوانٍ هنا حتى لا يُعاد رسم الماركي. */
export function HeaderTicker() {
  const contentItems = useRotatingContent();
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const { paused, handlers: pauseHandlers } = useTransientPause();
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [useRotateFallback, setUseRotateFallback] = useState(false);

  const items = useMemo<TickerItem[]>(() => {
    return contentItems
      .filter((c) => !!c.text?.trim())
      .map((c) => ({
        key: c.id,
        Icon: KIND_ICON[c.kind] ?? Sparkles,
        label: c.label,
        text: c.text,
        source: c.source,
        href: c.href,
        kind: c.kind,
      }));
  }, [contentItems]);

  const [marqueeEnabled, setMarqueeEnabled] = useState(false);
  const preferRotate = reducedMotion || useRotateFallback;

  /** ماركي بعد أول رسم — لا حركة على عنصر LCP */
  useEffect(() => {
    if (reducedMotion) return;
    const enable = () => setMarqueeEnabled(true);
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(enable, { timeout: 1800 });
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(enable, 400);
    return () => window.clearTimeout(t);
  }, [reducedMotion]);

  useEffect(() => {
    if (!preferRotate || items.length === 0 || paused) return;
    const t = setInterval(() => setActiveIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [preferRotate, items.length, paused]);

  useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [activeIndex, items.length]);

  /** إن كان عرض المحتوى ≤ الحاوية فلا مسافة للماركي → تدوير كل ٦ ثوانٍ.
   *  القياس داخل ResizeObserver / rAF فقط — لا قراءة تخطيط متزامنة ثم setState. */
  useEffect(() => {
    if (reducedMotion || items.length === 0) return;
    const vp = viewportRef.current;
    const track = trackRef.current;
    if (!vp || !track) return;

    const measure = () => {
      const contentWidth = track.scrollWidth / 2;
      setUseRotateFallback(contentWidth <= vp.clientWidth + 8);
    };

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(measure);
      ro.observe(vp);
      ro.observe(track);
      return () => ro.disconnect();
    }

    const id = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener("resize", measure);
    };
  }, [reducedMotion, items]);

  /** استئناف صريح عند العودة للتبويب — لا تبقى حالة لمس عالقة */
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        /* pointer handlers يصفّرون الإيقاف؛ إعادة قياس بعد العودة */
        setUseRotateFallback((v) => v);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  if (items.length === 0) {
    return (
      <div className="header-ticker header-ticker--static header-ticker--with-prayer header-ticker--fallback" role="status">
        <PrayerCountdownChip />
        <div className="header-ticker__single-item">
          <TickerEntry
            item={{
              key: "fallback",
              Icon: Sparkles,
              label: "مجالس العلم",
              text: "تصفّح المصحف والدروس والفتاوى",
              href: "/quran-hub",
            }}
          />
        </div>
      </div>
    );
  }

  if (preferRotate) {
    const activeItem = items[activeIndex % items.length];
    return (
      <div
        className={`header-ticker header-ticker--static header-ticker--with-prayer${paused ? " header-ticker--paused" : ""}`}
        aria-live="polite"
        {...pauseHandlers}
      >
        <PrayerCountdownChip />
        {activeItem ? (
          <div className="header-ticker__single-item" key={activeItem.key}>
            <TickerEntry item={activeItem} />
          </div>
        ) : null}
      </div>
    );
  }

  const loop = [...items, ...items];
  const totalChars = items.reduce(
    (sum, it) => sum + it.text.length + (it.source?.length ?? 0) + it.label.length,
    0,
  );
  const durationSec = marqueeDurationSec(Math.max(items.length, 1), totalChars);

  return (
    <div
      className={`header-ticker${marqueeEnabled ? " header-ticker--marquee" : ""} header-ticker--with-prayer${paused ? " header-ticker--paused" : ""}`}
      aria-live="off"
      {...pauseHandlers}
    >
      <PrayerCountdownChip />
      <div className="header-ticker__viewport" ref={viewportRef}>
        <div
          ref={trackRef}
          className="header-ticker__track"
          style={{ animationDuration: `${durationSec}s` }}
        >
          {loop.map((item, i) => (
            <TickerEntry key={`${item.key}-${i}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
