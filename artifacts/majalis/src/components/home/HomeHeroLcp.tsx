/**
 * هيرو الرئيسية خارج Suspense — يبقى h1 «سُنّة» في DOM من أول رسم App
 * حتى لا يُعاد قياس LCP عند استبدال HomePage الكسول.
 * V3: Welcome Experience — متابعة / قراءة / ورد / تقدم / إجراءات سريعة.
 * Startup PR-5: لا تُعرض نسبة ٠٪ قبل استعادة التخزين؛ شرائح primary/meta بهندسة ثابتة.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHero } from "@/components/ui/PageHero";
import { resolveDailyContext } from "@/lib/daily-context";
import { hasSeenFirstVisitIntroSync } from "@/lib/first-visit-intro-state";
import { getRecentPages } from "@/lib/recent-pages";
import { getLatestContinueReading } from "@/lib/continue-reading";
import { invalidateLastPageMemCache, loadLastPageSync } from "@/lib/quran-last-page";
import {
  getTaskStats,
  getTodayProgress,
  PROGRESS_TASKS,
} from "@/lib/daily-progress";
import { getBootFlags } from "@/lib/boot-readiness";
import { isNative } from "@/lib/capacitor-utils";
import { toArabicDigits } from "@/lib/utils";
import "@/styles/components/home-brand-title.css";
import "@/styles/m2030/home.css";
import "@/styles/sunnah-identity-home-hub.css";

type WelcomeSnapshot = {
  continueHref: string;
  continueLabel: string | null;
  mushafPage: number | null;
  progressPct: number;
  doneCount: number;
  totalTasks: number;
};

const HERO_STORAGE_EVENTS = ["mj:boot-ready", "mj:feature-tour-storage-ready"] as const;

const HERO_LS_HINT_KEYS = [
  "majalis-continue-reading-v1",
  "lastPage",
  "majalis-daily-progress-v1",
] as const;

function heroStorageLooksReady(): boolean {
  try {
    if (getBootFlags().storageReady) return true;
  } catch {
    /* ignore */
  }
  if (!isNative) return true;
  try {
    if (typeof localStorage === "undefined") return false;
    return HERO_LS_HINT_KEYS.some((key) => {
      const v = localStorage.getItem(key);
      return v != null && v !== "";
    });
  } catch {
    return false;
  }
}

function readWelcomeSnapshot(): WelcomeSnapshot {
  let continueHref = "/lessons";
  let continueLabel: string | null = null;
  try {
    const latest = getLatestContinueReading();
    if (latest?.route) {
      continueHref = latest.route;
      continueLabel = latest.title;
    } else {
      const recent = getRecentPages(2).find((p) => p.href !== "/");
      if (recent) {
        continueHref = recent.href;
        continueLabel = recent.label;
      }
    }
  } catch {
    /* ignore */
  }

  let mushafPage: number | null = null;
  try {
    mushafPage = loadLastPageSync();
  } catch {
    /* ignore */
  }

  let progressPct = 0;
  let doneCount = 0;
  const totalTasks = PROGRESS_TASKS.length;
  try {
    const progress = getTodayProgress();
    doneCount = PROGRESS_TASKS.filter(
      (task) => getTaskStats(task, progress).percent >= 100,
    ).length;
    progressPct = totalTasks ? Math.round((doneCount / totalTasks) * 100) : 0;
  } catch {
    /* ignore */
  }

  return {
    continueHref,
    continueLabel,
    mushafPage,
    progressPct,
    doneCount,
    totalTasks,
  };
}

export function HomeHeroLcp() {
  // تحية حسب ساعة الجهاز المحلية (لا وقت خادم البناء) — تُزامَن عند التركيب وكل دقيقة
  const [greeting, setGreeting] = useState(() => resolveDailyContext().greeting);
  useEffect(() => {
    const sync = () => setGreeting(resolveDailyContext().greeting);
    sync();
    const id = window.setInterval(sync, 60_000);
    return () => window.clearInterval(id);
  }, []);
  const [isFirstVisit] = useState(() => {
    try {
      return !hasSeenFirstVisitIntroSync() && localStorage.getItem("majlis-home-welcomed-v1") !== "1";
    } catch {
      return true;
    }
  });
  /** null = بانتظار استعادة التخزين — لا تُعرض ٠٪ كقيمة حقيقية */
  const [welcome, setWelcome] = useState<WelcomeSnapshot | null>(() => {
    if (typeof window === "undefined") return null;
    if (!heroStorageLooksReady()) return null;
    return readWelcomeSnapshot();
  });

  useEffect(() => {
    const apply = () => {
      invalidateLastPageMemCache();
      setWelcome(readWelcomeSnapshot());
    };
    if (heroStorageLooksReady()) apply();
    for (const ev of HERO_STORAGE_EVENTS) {
      window.addEventListener(ev, apply);
    }
    return () => {
      for (const ev of HERO_STORAGE_EVENTS) {
        window.removeEventListener(ev, apply);
      }
    };
  }, []);

  const pending = welcome === null;
  const snap = welcome ?? {
    continueHref: "/lessons",
    continueLabel: null,
    mushafPage: null,
    progressPct: 0,
    doneCount: 0,
    totalTasks: PROGRESS_TASKS.length,
  };
  const continueHref = snap.continueHref;
  const totalTasksAr = toArabicDigits(snap.totalTasks);

  return (
    <PageHero
      className="m2030-hero home-page-hero home-page-hero--eyebrow-ready home-page-hero--actions-ready home-welcome-premium home-welcome-v3 sgs-hero-geometry"
      fullBleed={false}
      withPattern={false}
      withCornerMotif={false}
      withOrnament={false}
      showBack={false}
      eyebrow={greeting}
      title="سُنّة"
      description="رفيقك اليومي في العلم والعبادة"
      actions={
        <>
          <Link href={continueHref} className="mj-btn m2030-btn m2030-btn--primary mj-home-lcp-ph__hero-cta">
            {isFirstVisit ? "ابدأ الآن" : "تابع التعلم"}
          </Link>
          <Link href="/sections" className="mj-btn m2030-btn m2030-btn--ghost">
            تصفح الأقسام
          </Link>
        </>
      }
    >
      <nav className="hw3 hw3--identity" aria-label="متابعة سريعة" data-hero-ready={pending ? "0" : "1"}>
        {/* شريحة أولية دائمة — نفس min-height سواء متابعة/قراءة/افتراضي */}
        <div className="hw3-primary" role="list">
          {snap.continueLabel ? (
            <Link
              href={continueHref}
              className="hw3-chip hw3-chip--lead"
              role="listitem"
              aria-label={`آخر متابعة: ${snap.continueLabel}`}
            >
              <span className="hw3-chip__k">متابعة</span>
              <span className="hw3-chip__v">{snap.continueLabel}</span>
            </Link>
          ) : snap.mushafPage != null && snap.mushafPage > 1 ? (
            <Link
              href={`/mushaf?page=${snap.mushafPage}`}
              className="hw3-chip hw3-chip--lead"
              role="listitem"
              aria-label={`آخر قراءة: صفحة ${toArabicDigits(snap.mushafPage)}`}
            >
              <span className="hw3-chip__k">قراءة</span>
              <span className="hw3-chip__v">ص {toArabicDigits(snap.mushafPage)}</span>
            </Link>
          ) : (
            <Link
              href="/lessons"
              className="hw3-chip hw3-chip--lead"
              role="listitem"
              aria-busy={pending || undefined}
              aria-label={pending ? "جاري استعادة المتابعة" : "ابدأ من الدروس"}
            >
              <span className="hw3-chip__k">متابعة</span>
              <span className="hw3-chip__v hw3-chip__v--ph">
                {pending ? "\u00a0" : "ابدأ من الدروس"}
              </span>
            </Link>
          )}
        </div>
        <div className="hw3-meta" role="list" aria-label="ملخص اليوم">
          {pending ? (
            <>
              <span role="listitem" className="hw3-meta__ph" aria-busy="true">
                الورد —/{totalTasksAr}
              </span>
              <span role="listitem" className="hw3-meta__ph" aria-busy="true">
                تقدم —٪
              </span>
            </>
          ) : (
            <>
              <Link
                href="/daily-wird"
                role="listitem"
                aria-label={`الورد اليومي · ${toArabicDigits(snap.doneCount)} من ${totalTasksAr}`}
              >
                الورد {toArabicDigits(snap.doneCount)}/{totalTasksAr}
              </Link>
              <Link
                href="/daily-wird"
                role="listitem"
                aria-label={`تقدمك اليومي ${toArabicDigits(snap.progressPct)}٪`}
              >
                تقدم {toArabicDigits(snap.progressPct)}٪
              </Link>
            </>
          )}
          {snap.mushafPage != null && snap.mushafPage > 1 ? (
            <Link
              href={`/mushaf?page=${snap.mushafPage}`}
              role="listitem"
              aria-label={`آخر قراءة: صفحة ${toArabicDigits(snap.mushafPage)}`}
            >
              مصحف ص {toArabicDigits(snap.mushafPage)}
            </Link>
          ) : (
            <Link
              href="/mushaf"
              role="listitem"
              className={pending ? "hw3-meta__ph" : undefined}
              aria-busy={pending || undefined}
              aria-label="المصحف"
            >
              المصحف
            </Link>
          )}
        </div>
        <div className="hw3-actions" role="list" aria-label="إجراءات سريعة">
          <Link href="/quran-hub" className="hw3-action" role="listitem">
            القرآن
          </Link>
          <Link href="/adhkar" className="hw3-action" role="listitem">
            الأذكار
          </Link>
          <Link href="/lessons" className="hw3-action" role="listitem">
            الدروس
          </Link>
          <Link href="/prayer-times" className="hw3-action" role="listitem">
            الصلاة
          </Link>
        </div>
      </nav>
    </PageHero>
  );
}

/** هيكل بحث موحّد — يطابق ارتفاع HomeUniversalSearch */
export function HomeSearchShell() {
  return (
    <div className="hus mj-home-lcp-ph__search" role="search" aria-label="بحث موحّد" aria-busy="true">
      <div className="hus-field">
        <span className="hus-input mj-home-lcp-ph__search-ph" aria-hidden="true">
          &nbsp;
        </span>
      </div>
    </div>
  );
}

/** هيكل يحجز ارتفاع بطاقة آية/حديث اليوم */
export function HomeSacredOfDaySkeleton() {
  return (
    <div
      className="home-sacred-day home-sacred-day--ph home-sacred-day--compact"
      aria-busy="true"
      aria-label="آية من القرآن"
      data-testid="home-sacred-of-day"
    />
  );
}

export function HomePrimaryDiscoveryPlaceholder({ id = false }: { id?: boolean } = {}) {
  return (
    <div
      className="mj-home-primary-discovery-ph"
      id={id ? "mj-home-primary-discovery" : undefined}
      aria-hidden="true"
    />
  );
}

export function HomeDailyWirdSkeleton() {
  return (
    <section
      className="m2030-band m2030-band--sage home-daily-wird daily-wird-card mj-home-lcp-ph__daily-band"
      aria-label="ورد اليوم"
      aria-busy="true"
      data-testid="daily-wird-card"
    />
  );
}

export function HomeLiveNowPlaceholder() {
  return <div className="home-live-now-ph" aria-hidden="true" />;
}

export function HomeBelowFoldPlaceholder({ withId = false }: { withId?: boolean } = {}) {
  return (
    <div
      className="mj-home-below-fold-ph"
      id={withId ? "mj-home-below-fold" : undefined}
      aria-hidden="true"
    />
  );
}

/**
 * هيكل ما تحت الهيرو أثناء تحميل HomePage.
 * الترتيب يطابق HomePage حرفيًا لمنع قفزة الإدراج عند انتهاء Suspense.
 */
export function HomeRestShell() {
  return (
    <>
      <HomeSearchShell />
      <HomeSacredOfDaySkeleton />
      <HomePrimaryDiscoveryPlaceholder id />
      <HomeDailyWirdSkeleton />
      <HomeLiveNowPlaceholder />
      <HomeBelowFoldPlaceholder withId />
    </>
  );
}
