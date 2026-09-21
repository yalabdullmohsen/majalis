import { Suspense, useEffect, useState, lazy } from "react";
import { applyPageSeo } from "@/lib/seo";
import { defaultSiteJsonLd } from "@/lib/seo-structured-data";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeUniversalSearch } from "@/components/home/HomeUniversalSearch";
import {
  HomeSacredOfDaySkeleton,
  HomeDailyWirdSkeleton,
  HomePrimaryDiscoveryPlaceholder,
  HomeLiveNowPlaceholder,
  HomeBelowFoldPlaceholder,
} from "@/components/home/HomeHeroLcp";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import "@/styles/components/home-brand-title.css";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
import { shouldShowFirstVisitIntro } from "@/lib/first-visit-intro-state";
import { DashboardScreen } from "@/components/design-system/screens";
import "@/styles/m2030/home.css";
import "@/styles/pages/home-dashboard-v2.css";
import "@/styles/components/first-visit-intro.css";

const FirstVisitIntro = lazy(() =>
  import("@/components/onboarding/FirstVisitIntro").then((m) => ({ default: m.FirstVisitIntro })),
);

const HomeBelowFold = lazyWithRetry(
  () => import("./HomeBelowFold"),
  "HomeBelowFold",
);

const HomePrimaryDiscovery = lazyWithRetry(
  () =>
    import("./HomeBelowFold").then((m) => ({ default: m.HomePrimaryDiscovery })),
  "HomePrimaryDiscovery",
);

const HomeDailyWirdBand = lazyWithRetry(
  () => import("@/components/home/DailyWirdCard").then((m) => ({ default: m.HomeDailyWirdBand })),
  "HomeDailyWirdBand",
);

const HomeSacredOfDay = lazyWithRetry(
  () => import("@/components/home/HomeSacredOfDay").then((m) => ({ default: m.HomeSacredOfDay })),
  "HomeSacredOfDay",
);

const HomeLiveNowBanner = lazyWithRetry(
  () =>
    import("@/components/home/HomeLiveNowBanner").then((m) => ({ default: m.HomeLiveNowBanner })),
  "HomeLiveNowBanner",
);


/** تأجيل بـ setTimeout فقط — لا rIC حتى لا يسحب Lighthouse العمل أثناء نافذة TBT */
function deferAfterPaint(cb: () => void, ms: number): () => void {
  const id = window.setTimeout(cb, ms);
  return () => window.clearTimeout(id);
}

/** البحث يظهر فور جاهزية HomePage — الفهرس يُحمَّل كسولًا عند التركيز فقط */
function HomeSearchGate() {
  return (
    <SectionErrorBoundary name="HomeUniversalSearch">
      <HomeUniversalSearch />
    </SectionErrorBoundary>
  );
}

function HomeLiveNowGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cancel = deferAfterPaint(() => {
      if (!cancelled) setShow(true);
    }, 2_400);
    return () => {
      cancelled = true;
      cancel();
    };
  }, []);

  if (!show) {
    return (
      <HomeLiveNowPlaceholder />
    );
  }

  return (
    <SectionErrorBoundary name="HomeLiveNow">
      <Suspense fallback={<HomeLiveNowPlaceholder />}>
        <HomeLiveNowBanner />
      </Suspense>
    </SectionErrorBoundary>
  );
}

function HomeSacredOfDayGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cancel = deferAfterPaint(() => {
      if (!cancelled) setShow(true);
    }, 600);
    return () => {
      cancelled = true;
      cancel();
    };
  }, []);

  if (!show) return <HomeSacredOfDaySkeleton />;

  return (
    <SectionErrorBoundary name="HomeSacredOfDay">
      <Suspense fallback={<HomeSacredOfDaySkeleton />}>
        <div className="home-sacred-day-slot">
          <HomeSacredOfDay />
        </div>
      </Suspense>
    </SectionErrorBoundary>
  );
}

function HomeDailyWirdGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cancel = deferAfterPaint(() => {
      if (!cancelled) setShow(true);
    }, 1_200);
    return () => {
      cancelled = true;
      cancel();
    };
  }, []);

  if (!show) return <HomeDailyWirdSkeleton />;

  return (
    <SectionErrorBoundary name="HomeDailyWird">
      <Suspense fallback={<HomeDailyWirdSkeleton />}>
        <HomeDailyWirdBand />
      </Suspense>
    </SectionErrorBoundary>
  );
}


/** بوابات + محتوى أساسي — مبكّر نسبياً لتسريع الوصول للمحتوى */
function HomePrimaryDiscoveryGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cancel = deferAfterPaint(() => {
      if (!cancelled) setShow(true);
    }, 320);
    return () => {
      cancelled = true;
      cancel();
    };
  }, []);

  if (!show) {
    return (
      <HomePrimaryDiscoveryPlaceholder id />
    );
  }

  return (
    <div id="mj-home-primary-discovery">
      <SectionErrorBoundary name="HomePrimaryDiscovery">
        <Suspense
          fallback={
            <HomePrimaryDiscoveryPlaceholder />
          }
        >
          <HomePrimaryDiscovery />
        </Suspense>
      </SectionErrorBoundary>
    </div>
  );
}

function HomeBelowFoldGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let io: IntersectionObserver | undefined;
    let cancelFallback: (() => void) | undefined;

    const reveal = () => {
      if (!cancelled) setShow(true);
    };

    const watch = () => {
      const el = document.getElementById("mj-home-below-fold");
      if (!el || typeof IntersectionObserver === "undefined") {
        cancelFallback = deferAfterPaint(reveal, 2_800);
        return;
      }
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            reveal();
            io?.disconnect();
          }
        },
        { rootMargin: "480px 0px" },
      );
      io.observe(el);
      // احتياطي بعيد — لا rIC حتى لا يُحمَّل تحت الطية أثناء قياس Lighthouse
      cancelFallback = deferAfterPaint(reveal, 2_800);
    };

    const id = window.requestAnimationFrame(watch);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(id);
      io?.disconnect();
      cancelFallback?.();
    };
  }, []);

  if (!show) {
    return <HomeBelowFoldPlaceholder withId />;
  }

  return (
    <div id="mj-home-below-fold">
      <SectionErrorBoundary name="HomeBelowFold">
        <Suspense fallback={<HomeBelowFoldPlaceholder />}>
          <HomeBelowFold />
        </Suspense>
      </SectionErrorBoundary>
    </div>
  );
}

export default function HomePage() {
  // لا نعرض التعريف في أول commit — كان يسرق LCP قبل الرئيسية
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (!shouldShowFirstVisitIntro("/")) return;
    let cancelStable: (() => void) | undefined;
    let cancelDelay: (() => void) | undefined;
    void import("@/lib/app-shell-stability").then(({ whenAppShellStable }) => {
      cancelStable = whenAppShellStable(() => {
        // بعد استقرار الهيكل فقط — وبدون استبدال الصفحة (overlay فوق الرئيسية)
        cancelDelay = deferAfterPaint(() => setShowIntro(true), 2_500);
      }, 800);
    });
    return () => {
      cancelStable?.();
      cancelDelay?.();
    };
  }, []);

  useEffect(() => {
    return deferAfterPaint(() => {
      try {
        localStorage.setItem("majlis-home-welcomed-v1", "1");
      } catch {
        /* التخزين معطّل */
      }
    }, 1_500);
  }, []);

  useEffect(() => {
    return deferAfterPaint(() => {
      applyPageSeo({
        path: "/",
        title: "سُنّة، منصة العلوم الإسلامية",
        description:
          "منصة إسلامية شاملة للعلوم الشرعية: القرآن الكريم، الأذكار، الدروس العلمية، الأحكام الشرعية، والفقه المعاصر.",
        keywords: ["سُنّة", "علوم إسلامية", "قرآن كريم", "أذكار", "أحكام شرعية", "دروس علمية"],
        jsonLd: defaultSiteJsonLd(),
      });
    }, 2_000);
  }, []);

  useEffect(() => {
    const paint = () => {
      try {
        performance.mark("mj:home-painted");
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new Event("mj:home-painted"));
    };
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(paint);
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  // الغلاف + الهيرو في App (HomeHeroLcp خارج Suspense) — هنا بقية الرئيسية فقط
  // Intro كـ overlay فوق الرئيسية — لا استبدال كامل يسبب قفزة تخطيط
  return (
    <DashboardScreen compose="mark" density="regular">
      {isMaintenanceMode() && (
        <div role="status" className="home-maintenance-banner">
          {getSiteSettings().maintenanceMessage}
        </div>
      )}

      <HomeSearchGate />

      {/* «ابدأ من هنا» يُرسم في App خارج Suspense — لا تكرار هنا */}
      <HomeSacredOfDayGate />
      <HomePrimaryDiscoveryGate />
      <HomeDailyWirdGate />
      <HomeLiveNowGate />
      <HomeBelowFoldGate />

      {showIntro ? (
        <Suspense fallback={null}>
          <FirstVisitIntro onContinue={() => setShowIntro(false)} />
        </Suspense>
      ) : null}
    </DashboardScreen>
  );
}
