import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Clock, Repeat2, ScrollText, Heart, BookOpen, Sparkles, Megaphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { fetchPrayerTimes, computePrayerCountdown, type PrayerCountdown, type PrayerSlot } from "@/lib/prayer-times";
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

type TickerItem = {
  key: string;
  Icon: LucideIcon;
  label: string;
  text: string;
  source?: string;
  href: string;
};

function usePrayerTickerItem(): TickerItem | null {
  const [cd, setCd] = useState<PrayerCountdown | null>(null);
  useEffect(() => {
    let prayers: PrayerSlot[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const schedule = () => {
      if (cancelled || !prayers.length) return;
      const next = computePrayerCountdown(prayers);
      setCd(next);
      const inGrace = next.sinceSeconds != null;
      const preAlert = next.remainingMs > 0 && next.remainingMs <= 15 * 60 * 1000;
      timer = setTimeout(schedule, inGrace || preAlert ? 1_000 : 30_000);
    };

    fetchPrayerTimes()
      .then((payload) => {
        if (cancelled) return;
        prayers = payload.prayers;
        schedule();
      })
      .catch(() => {});

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (timer) clearTimeout(timer);
      schedule();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!cd?.next) return null;
  const inGrace = cd.sinceSeconds != null;
  if (inGrace && cd.sinceHms) {
    return {
      key: "prayer",
      Icon: Clock,
      label: `مضى على أذان ${cd.next.name}`,
      text: cd.sinceHms,
      href: "/prayer-times",
    };
  }
  const hm = cd.remainingHms.split(":").slice(0, 2).join(":");
  return {
    key: "prayer",
    Icon: Clock,
    label: `المتبقي على صلاة ${cd.next.name}`,
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

function TickerEntry({ item }: { item: TickerItem }) {
  return (
    <Link href={item.href} className="header-ticker__item">
      <item.Icon size={13} strokeWidth={1.8} className="header-ticker__icon" aria-hidden="true" />
      <span className="header-ticker__label">{item.label}:</span>
      <span className="header-ticker__text">{item.text}</span>
      {item.source ? (
        <span className="header-ticker__source" aria-label={`المصدر: ${item.source}`}>
          — {item.source}
        </span>
      ) : null}
    </Link>
  );
}

/** شريط إعلان علوي متحرّك مستمر (marquee) — أحاديث وأذكار ونبذ أقسام/مميزات. */
export function HeaderTicker() {
  const prayerItem = usePrayerTickerItem();
  const contentItems = useRotatingContent();
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const items = useMemo<TickerItem[]>(() => {
    const mapped: TickerItem[] = contentItems
      .filter((c) => !!c.text?.trim())
      .map((c) => ({
        key: c.id,
        Icon: KIND_ICON[c.kind] ?? Sparkles,
        label: c.label,
        text: c.text,
        source: c.source,
        href: c.href,
      }));
    return prayerItem ? [prayerItem, ...mapped] : mapped;
  }, [prayerItem, contentItems]);

  // وضع تقليل الحركة: تناوب عنصر واحد بلا تمرير مستمر.
  useEffect(() => {
    if (!reducedMotion || items.length === 0 || paused) return;
    const t = setInterval(() => setActiveIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [reducedMotion, items.length, paused]);

  useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [activeIndex, items.length]);

  if (items.length === 0) {
    return <div className="header-ticker header-ticker--empty" aria-hidden="true" />;
  }

  const pauseHandlers = {
    onPointerDown: () => setPaused(true),
    onPointerUp: () => setPaused(false),
    onPointerCancel: () => setPaused(false),
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onFocusCapture: () => setPaused(true),
    onBlurCapture: () => setPaused(false),
  };

  if (reducedMotion) {
    const activeItem = items[activeIndex % items.length];
    return (
      <div
        className={`header-ticker header-ticker--static${paused ? " header-ticker--paused" : ""}`}
        role="status"
        aria-live="polite"
        aria-label="شريط معلومات"
        {...pauseHandlers}
      >
        <div className="header-ticker__single-item" key={activeItem.key}>
          <TickerEntry item={activeItem} />
        </div>
      </div>
    );
  }

  // مسار مزدوج لحلقة سلسة بلا قفزة (0 → 50%).
  const loop = [...items, ...items];
  const totalChars = items.reduce(
    (sum, it) => sum + it.text.length + (it.source?.length ?? 0) + it.label.length,
    0,
  );
  const durationSec = marqueeDurationSec(items.length, totalChars);

  return (
    <div
      className={`header-ticker header-ticker--marquee${paused ? " header-ticker--paused" : ""}`}
      role="status"
      aria-live="off"
      aria-label="شريط إعلانات متحرّك: أحاديث وأذكار وأقسام"
      {...pauseHandlers}
    >
      <div className="header-ticker__viewport">
        <div
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
