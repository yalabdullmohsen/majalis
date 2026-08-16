import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "wouter";
import { Clock, Repeat2, ScrollText, Heart, BookOpen, Sparkles, Megaphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePrayerCountdown } from "@/hooks/usePrayerCountdown";
import { buildPrayerTickerCopy } from "@/lib/prayer-ticker-copy";
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

type PrayerSticky = {
  label: string;
  text: string;
  isNow: boolean;
  href: string;
};

/** شريط الصلاة الثابت — ثوانٍ حية كل ثانية، خارج مسار الماركي */
function usePrayerSticky(): PrayerSticky | null {
  const { countdown: cd } = usePrayerCountdown();

  if (!cd?.next) return null;
  const copy = buildPrayerTickerCopy({
    prayerName: cd.next.name,
    remainingHms: cd.remainingHms,
    sinceSeconds: cd.sinceSeconds,
    sinceHms: cd.sinceHms,
  });
  return {
    label: copy.label,
    text: copy.text,
    isNow: copy.isNow,
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

function PrayerStickyStrip({ prayer }: { prayer: PrayerSticky }) {
  return (
    <Link
      href={prayer.href}
      className={`header-ticker__prayer${prayer.isNow ? " header-ticker__prayer--now" : ""}`}
      aria-live="polite"
      aria-atomic="true"
      onClick={(e) => e.stopPropagation()}
    >
      <Clock size={13} strokeWidth={1.8} className="header-ticker__icon" aria-hidden="true" />
      <span className="header-ticker__prayer-label">{prayer.label}</span>
      <span className="header-ticker__prayer-time" data-testid="header-prayer-countdown">
        {prayer.text}
      </span>
    </Link>
  );
}

/** شريط إعلان علوي متحرّك مستمر (marquee) — أحاديث وأذكار ونبذ أقسام/مميزات. */
export function HeaderTicker() {
  const prayer = usePrayerSticky();
  const contentItems = useRotatingContent();
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [stickyPaused, setStickyPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const paused = stickyPaused || hoverPaused;

  // الصلاة ثابتة خارج الماركي حتى تتحدّث الثواني بلا خروج/دخول
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

  // وضع تقليل الحركة: تناوب عنصر واحد بلا تمرير مستمر.
  useEffect(() => {
    if (!reducedMotion || items.length === 0 || paused) return;
    const t = setInterval(() => setActiveIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [reducedMotion, items.length, paused]);

  useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [activeIndex, items.length]);

  const pauseHandlers = {
    tabIndex: 0,
    "aria-pressed": stickyPaused,
    title: stickyPaused ? "استئناف الشريط" : "إيقاف الشريط",
    onClick: () => setStickyPaused((p) => !p),
    onMouseEnter: () => setHoverPaused(true),
    onMouseLeave: () => setHoverPaused(false),
    onFocusCapture: () => setHoverPaused(true),
    onBlurCapture: () => setHoverPaused(false),
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setStickyPaused((p) => !p);
      }
    },
  };

  // حالة fallback: لا شريط فارغ — صلاة ثابتة أو سطر محايد.
  if (items.length === 0 && !prayer) {
    return (
      <div className="header-ticker header-ticker--static header-ticker--fallback" role="status">
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

  if (reducedMotion) {
    const activeItem = items.length > 0 ? items[activeIndex % items.length] : null;
    return (
      <div
        className={`header-ticker header-ticker--static header-ticker--with-prayer${paused ? " header-ticker--paused" : ""}`}
        role="status"
        aria-live="polite"
        aria-label="شريط معلومات"
        {...pauseHandlers}
      >
        {prayer ? <PrayerStickyStrip prayer={prayer} /> : null}
        {activeItem ? (
          <div className="header-ticker__single-item" key={activeItem.key}>
            <TickerEntry item={activeItem} />
          </div>
        ) : null}
      </div>
    );
  }

  const loop = items.length > 0 ? [...items, ...items] : [];
  const totalChars = items.reduce(
    (sum, it) => sum + it.text.length + (it.source?.length ?? 0) + it.label.length,
    0,
  );
  const durationSec = marqueeDurationSec(Math.max(items.length, 1), totalChars);

  return (
    <div
      className={`header-ticker header-ticker--marquee header-ticker--with-prayer${paused ? " header-ticker--paused" : ""}`}
      role="status"
      aria-live="off"
      aria-label="شريط إعلانات متحرّك: أحاديث وأذكار وأقسام"
      {...pauseHandlers}
    >
      {prayer ? <PrayerStickyStrip prayer={prayer} /> : null}
      {loop.length > 0 ? (
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
      ) : null}
    </div>
  );
}
