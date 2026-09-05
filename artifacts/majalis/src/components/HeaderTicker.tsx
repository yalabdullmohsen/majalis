import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type AnimationEvent,
  type CSSProperties,
} from "react";
import { Link } from "wouter";
import { BookOpen, Heart, Megaphone, Repeat2, ScrollText, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  buildTickerPool,
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

const FALLBACK_ITEM: TickerItem = {
  key: "fallback",
  Icon: Sparkles,
  label: "سُنّة",
  displayText: "تصفّح المصحف والدروس والفتاوى من مكان واحد",
  href: "/quran-hub",
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
  // النص الكامل أولًا؛ previewText احتياط فقط (بوابة المحتوى تتأكد من وجود المرجع)
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

/**
 * قائمة محلية تُحمَّل مرة — التبديل فقط بعد اكتمال خروج النص الحالي.
 * الطابور في ref يمنع استبدال المحتوى أثناء الـ render / أثناء الحركة.
 */
function useTickerQueue() {
  const poolRef = useRef<TickerContentItem[] | null>(null);
  if (!poolRef.current) {
    try {
      poolRef.current = buildTickerPool();
    } catch {
      poolRef.current = [];
    }
  }
  const recentRef = useRef<string[]>(readRecent());
  const queueRef = useRef<TickerItem[]>([]);

  const refill = useCallback(() => {
    const pool = poolRef.current ?? [];
    if (pool.length === 0) {
      queueRef.current = [];
      return;
    }
    const picked = pickNextBatch(pool, recentRef.current);
    recentRef.current = picked.recent;
    writeRecent(picked.recent);
    queueRef.current = picked.batch
      .map(toTickerItem)
      .filter((x): x is TickerItem => x != null);
  }, []);

  const [current, setCurrent] = useState<TickerItem | null>(() => {
    refill();
    return queueRef.current.shift() ?? (poolRef.current?.length === 0 ? FALLBACK_ITEM : null);
  });
  const [cycle, setCycle] = useState(0);

  const advance = useCallback(() => {
    if (queueRef.current.length === 0) refill();
    const next = queueRef.current.shift() ?? FALLBACK_ITEM;
    // إن فرغ الطابور بعد السحب — عبّئه مسبقًا للدورة التالية بلا فراغ طويل
    if (queueRef.current.length === 0) refill();
    setCurrent(next);
    setCycle((c) => c + 1);
  }, [refill]);

  return {
    current: current ?? FALLBACK_ITEM,
    cycle,
    advance,
    hasContent: current != null,
  };
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

function durationForDistance(distancePx: number): number {
  // ~95px/ث — أسرع من السابق (~50) مع بقاء القراءة ممكنة للنصوص الطويلة
  const sec = distancePx / 95;
  return Math.max(6, Math.min(90, sec));
}

type AnimSpec = { from: string; to: string; dur: string };

/**
 * شريط علوي متحرّك: نص واحد يكمل خروجه بالكامل ثم ينتقل للتالي.
 * بلا setInterval لتبديل النص، وبلا استبدال دفعة أثناء الحركة.
 */
export function HeaderTicker() {
  const { current, cycle, advance, hasContent } = useTickerQueue();
  const reducedMotion = useReducedMotion();
  const { paused, handlers: pauseHandlers } = useTransientPause();

  const [bootReady, setBootReady] = useState(false);
  const [anim, setAnim] = useState<AnimSpec | null>(null);
  /** يُزاد لإعادة القياس (تدوير الشاشة) دون الانتقال للنص التالي */
  const [measureEpoch, setMeasureEpoch] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const runnerRef = useRef<HTMLDivElement>(null);
  const advancingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void waitUntilBootSettled().then(() => {
      if (!cancelled) setBootReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const goNext = useCallback(() => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setAnim(null);
    advance();
    window.requestAnimationFrame(() => {
      advancingRef.current = false;
    });
  }, [advance]);

  // قياس العرض الحقيقي (clientWidth/scrollWidth) ثم حركة واحدة حتى الخروج الكامل
  useEffect(() => {
    if (!bootReady || reducedMotion) return;
    const vp = viewportRef.current;
    const runner = runnerRef.current;
    if (!vp || !runner) return;

    let cancelled = false;
    let raf1 = 0;
    let raf2 = 0;

    const measureAndRun = () => {
      if (cancelled) return;
      const vpW = vp.clientWidth;
      const itemW = runner.scrollWidth;
      if (vpW < 8 || itemW < 8) return;
      // للعربية (RTL): بداية الجملة على يمين الصندوق — لذلك نُدخل الصندوق من اليسار
      // حتى يظهر طرفه الأيمن (بداية النص) أولًا، ثم يتحرّك يسار→يمين حتى يخرج يمينًا.
      // الـviewport direction:ltr يثبّت المحاور الفيزيائية فقط.
      const from = -itemW;
      const to = vpW;
      const dur = durationForDistance(to - from);
      setAnim({ from: `${from}px`, to: `${to}px`, dur: `${dur}s` });
    };

    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(measureAndRun);
    });

    const onOrient = () => {
      // إعادة قياس لنفس النص بعد التدوير — بدون الانتقال للنص التالي
      setAnim(null);
      setMeasureEpoch((n) => n + 1);
    };
    window.addEventListener("orientationchange", onOrient);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.removeEventListener("orientationchange", onOrient);
    };
  }, [bootReady, reducedMotion, current.key, cycle, measureEpoch]);

  // تقليل الحركة: عرض ثابت كامل ثم انتقال بعد وقت القراءة (لا أثناء الحركة)
  useEffect(() => {
    if (!reducedMotion || !current || paused) return;
    const holdMs = Math.min(22_000, Math.max(6_000, current.displayText.length * 70));
    const t = window.setTimeout(goNext, holdMs);
    return () => window.clearTimeout(t);
  }, [reducedMotion, current, paused, goNext, cycle]);

  const onAnimationEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.target !== runnerRef.current) return;
    const name = e.animationName || "";
    if (!name.includes("header-ticker-marquee")) return;
    goNext();
  };

  if (!hasContent && !current) return null;

  if (reducedMotion) {
    return (
      <div
        className={`header-ticker header-ticker--static${paused ? " header-ticker--paused" : ""}`}
        aria-live="polite"
        {...pauseHandlers}
      >
        <div className="header-ticker__single-item">
          <TickerEntry item={current} />
        </div>
      </div>
    );
  }

  const running = Boolean(anim) && bootReady;
  const runnerStyle: CSSProperties | undefined = anim
    ? ({
        ["--ticker-from" as string]: anim.from,
        ["--ticker-to" as string]: anim.to,
        animationDuration: anim.dur,
      } as CSSProperties)
    : {
        // إخفاء حتى القياس — يبدأ من خارج اليسار (نفس اتجاه الحركة المصحّح)
        opacity: 0,
        transform: "translate3d(-100%, 0, 0)",
      };

  return (
    <div
      className={`header-ticker${running ? " header-ticker--marquee" : ""}${paused ? " header-ticker--paused" : ""}`}
      aria-live="off"
      {...pauseHandlers}
    >
      <div className="header-ticker__viewport" ref={viewportRef}>
        <div
          key={`${current.key}-${cycle}-${measureEpoch}`}
          ref={runnerRef}
          className="header-ticker__track header-ticker__runner"
          style={runnerStyle}
          onAnimationEnd={onAnimationEnd}
        >
          <TickerEntry item={current} />
        </div>
      </div>
    </div>
  );
}
