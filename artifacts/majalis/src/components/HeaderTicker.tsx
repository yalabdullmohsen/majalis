import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Link } from "wouter";
import { BookOpen, Heart, Megaphone, Repeat2, ScrollText, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  buildTickerPool,
  marqueeDurationSec,
  pickNextBatch,
  readRecent,
  writeRecent,
  type TickerContentItem,
  type TickerKind,
} from "@/lib/ticker-content";
import "@/styles/components/header-ticker-polish.css";

type TickerItem = {
  key: string;
  Icon: LucideIcon;
  label: string;
  /** النص الكامل المعروض — بلا قصّ أثناء الحركة */
  displayText: string;
  source?: string;
  href: string;
  kind?: TickerKind;
};

const KIND_ICON: Record<TickerKind, LucideIcon> = {
  hadith: ScrollText,
  dhikr: Repeat2,
  ayah: BookOpen,
  faida: Heart,
  promo: Megaphone,
};

/** تكرار المسار داخل الشريط — يمنع فراغ نهاية الدورة */
const TRACK_COPIES = 3;
/** فاصل بصري بسيط بين العناصر */
const ITEM_SEPARATOR = " • ";

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

/** إيقاف مؤقت أثناء التفاعل فقط — يُستأنف من نفس الموضع عبر animation-play-state */
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

function waitUntilBootSettled(): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const tryReady = () => {
      if (!document.documentElement.classList.contains("app-booting")) {
        done();
        return;
      }
      window.setTimeout(tryReady, 50);
    };
    if (document.fonts?.ready) {
      void document.fonts.ready.then(tryReady).catch(tryReady);
    } else {
      tryReady();
    }
    window.setTimeout(done, 1600);
  });
}

function toTickerItem(c: TickerContentItem): TickerItem | null {
  const displayText = (c.text || c.previewText || "").trim();
  if (!displayText) return null;
  return {
    key: c.id,
    Icon: KIND_ICON[c.kind] ?? Sparkles,
    label: c.label,
    displayText,
    source: c.source,
    href: c.href,
    kind: c.kind,
  };
}

/** دفعة عناصر للمسار المتواصل — بلا عنصر احتياطي يملأ شريطًا فارغًا */
function useTickerItems(): TickerItem[] {
  return useMemo(() => {
    let pool: TickerContentItem[];
    try {
      pool = buildTickerPool();
    } catch {
      return [];
    }
    if (pool.length === 0) return [];
    const recent = readRecent();
    const picked = pickNextBatch(pool, recent);
    writeRecent(picked.recent);
    return picked.batch.map(toTickerItem).filter((x): x is TickerItem => x != null);
  }, []);
}

function TickerEntry({ item }: { item: TickerItem }) {
  const ariaLabel = item.source
    ? `${item.label} — ${item.displayText} — المصدر: ${item.source}`
    : `${item.label} — ${item.displayText}`;
  return (
    <Link href={item.href} className="header-ticker__item" dir="rtl" aria-label={ariaLabel}>
      <item.Icon size={13} strokeWidth={1.8} className="header-ticker__icon" aria-hidden="true" />
      <span className="header-ticker__label">{item.label}</span>
      <span className="header-ticker__text" aria-hidden="true">
        {item.displayText}
      </span>
      {item.source ? (
        <span className="header-ticker__source" aria-hidden="true">
          — {item.source}
        </span>
      ) : null}
    </Link>
  );
}

function TickerSegment({ items, copyIndex }: { items: TickerItem[]; copyIndex: number }) {
  return (
    <div className="header-ticker__segment" data-copy={copyIndex} dir="rtl">
      {items.map((item, idx) => (
        <span key={`${copyIndex}-${item.key}-${idx}`} className="header-ticker__slot">
          {idx > 0 ? (
            <span className="header-ticker__sep" aria-hidden="true">
              {ITEM_SEPARATOR}
            </span>
          ) : null}
          <TickerEntry item={item} />
        </span>
      ))}
    </div>
  );
}

/**
 * شريط علوي متواصل: العناصر مكرَّرة داخل المسار (×3) مع فاصل " • "
 * وحركة لا نهائية بلا فراغ بين نهاية الدورة وبدايتها.
 */
export function HeaderTicker() {
  const items = useTickerItems();
  const reducedMotion = useReducedMotion();
  const { paused, handlers: pauseHandlers } = useTransientPause();

  const [bootReady, setBootReady] = useState(false);
  const [durationSec, setDurationSec] = useState(28);
  const [measureEpoch, setMeasureEpoch] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const segmentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void waitUntilBootSettled().then(() => {
      if (!cancelled) setBootReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalChars = useMemo(
    () => items.reduce((n, it) => n + it.displayText.length + it.label.length, 0),
    [items],
  );

  const measureDuration = useCallback(() => {
    const segment = segmentRef.current;
    const viewport = viewportRef.current;
    if (!segment || !viewport) {
      setDurationSec(marqueeDurationSec(items.length, totalChars));
      return;
    }
    const segmentW = segment.scrollWidth;
    const vpW = viewport.clientWidth;
    if (segmentW < 8 || vpW < 8) {
      setDurationSec(marqueeDurationSec(items.length, totalChars));
      return;
    }
    // ~90px/ث — مسار متواصل بلا توقف؛ مدة دورة = عرض مقطع واحد
    const sec = Math.max(12, Math.min(72, segmentW / 90));
    setDurationSec(sec);
  }, [items.length, totalChars]);

  useEffect(() => {
    if (!bootReady || reducedMotion || items.length === 0) return;
    let raf1 = 0;
    let raf2 = 0;
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(measureDuration);
    });
    const onOrient = () => setMeasureEpoch((n) => n + 1);
    window.addEventListener("orientationchange", onOrient);
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.removeEventListener("orientationchange", onOrient);
    };
  }, [bootReady, reducedMotion, items, measureDuration, measureEpoch]);

  // لا شريط فارغ
  if (items.length === 0) return null;

  if (reducedMotion) {
    return (
      <div
        className={`header-ticker header-ticker--static${paused ? " header-ticker--paused" : ""}`}
        aria-live="polite"
        {...pauseHandlers}
      >
        <div className="header-ticker__single-item">
          <TickerEntry item={items[0]!} />
        </div>
      </div>
    );
  }

  const running = bootReady;
  const trackStyle: CSSProperties = {
    ["--ticker-loop-duration" as string]: `${durationSec}s`,
    ["--ticker-loop-shift" as string]: `${-(100 / TRACK_COPIES)}%`,
  };

  return (
    <div
      className={`header-ticker header-ticker--marquee${running ? " is-running" : ""}${paused ? " header-ticker--paused" : ""}`}
      aria-live="off"
      {...pauseHandlers}
    >
      <div className="header-ticker__viewport" ref={viewportRef} dir="ltr">
        <div
          ref={trackRef}
          className="header-ticker__track header-ticker__runner"
          style={trackStyle}
          data-copies={TRACK_COPIES}
        >
          {Array.from({ length: TRACK_COPIES }, (_, copyIndex) => (
            <div
              key={`copy-${copyIndex}`}
              className="header-ticker__segment-wrap"
              ref={copyIndex === 0 ? segmentRef : undefined}
            >
              <TickerSegment items={items} copyIndex={copyIndex} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
