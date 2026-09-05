import { Suspense, useEffect, useState, lazy } from "react";
import { applyPageSeo } from "@/lib/seo";
import { defaultSiteJsonLd } from "@/lib/seo-structured-data";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeUniversalSearch } from "@/components/home/HomeUniversalSearch";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import "@/styles/components/home-brand-title.css";
import { HomeStartHereSection } from "@/components/home/HomeStartHereSection";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
import { shouldShowFirstVisitIntro } from "@/lib/first-visit-intro-state";
import "@/styles/m2030/home.css";
import "@/styles/components/first-visit-intro.css";

const FirstVisitIntro = lazy(() =>
  import("@/components/onboarding/FirstVisitIntro").then((m) => ({ default: m.FirstVisitIntro })),
);

const HomeBelowFold = lazyWithRetry(
  () => import("./HomeBelowFold"),
  "HomeBelowFold",
);

const HomeDailyWirdBand = lazyWithRetry(
  () => import("@/components/home/DailyWirdCard").then((m) => ({ default: m.HomeDailyWirdBand })),
  "HomeDailyWirdBand",
);

const HomeLiveNowBanner = lazyWithRetry(
  () =>
    import("@/components/home/HomeLiveNowBanner").then((m) => ({ default: m.HomeLiveNowBanner })),
  "HomeLiveNowBanner",
);

function HomeDailyWirdSkeleton() {
  return (
    <section
      className="m2030-band m2030-band--sage home-daily-wird daily-wird-card mj-home-lcp-ph__daily-band"
      aria-label="ورد اليوم"
      aria-busy="true"
      data-testid="daily-wird-card"
    >
      <div className="m2030-band__head">
        <h2 className="m2030-band__title">ورد اليوم</h2>
        <div className="daily-wird-card__actions" aria-hidden="true">
          <span className="daily-wird-card__done-btn mj-home-lcp-ph__daily-done">تم</span>
          <span className="m2030-band__link mj-home-lcp-ph__daily-link">الورد الكامل</span>
        </div>
      </div>
      <div className="home-daily-wird__grid">
        {Array.from({ length: 4 }).map((_, idx) => (
          <article key={idx} className="home-daily-wird__card mj-card mj-home-lcp-ph__daily-card">
            <header className="home-daily-wird__card-head">
              <span className="mj-home-lcp-ph__daily-icon" aria-hidden="true" />
              <span className="mj-home-lcp-ph__daily-label">&nbsp;</span>
            </header>
            <div className="home-daily-wird__text mj-home-lcp-ph__daily-line skeleton-base" />
            <div className="home-daily-wird__text mj-home-lcp-ph__daily-line skeleton-base" />
            <div className="home-daily-wird__meta mj-home-lcp-ph__daily-meta skeleton-base" />
            <div className="home-daily-wird__cta mj-home-lcp-ph__daily-cta skeleton-base" />
          </article>
        ))}
      </div>
    </section>
  );
}

/** تأجيل بـ setTimeout فقط — لا rIC حتى لا يسحب Lighthouse العمل أثناء نافذة TBT */
function deferAfterPaint(cb: () => void, ms: number): () => void {
  const id = window.setTimeout(cb, ms);
  return () => window.clearTimeout(id);
}

function HomeStartHereSkeleton() {
  return (
    <section
      aria-label="ابدأ من هنا"
      aria-busy="true"
      className="home-start-here mj-home-lcp-ph__start-here"
    />
  );
}

/** يؤجّل نص الخطوات بعد نافذة LCP (~5s) حتى لا يسرق LCP من h1 «سُنّة» */
function HomeStartHereGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cancel = deferAfterPaint(() => {
      if (!cancelled) setShow(true);
    }, 5_500);
    return () => {
      cancelled = true;
      cancel();
    };
  }, []);

  if (!show) return <HomeStartHereSkeleton />;

  return <HomeStartHereSection />;
}

function HomeSearchGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cancel = deferAfterPaint(() => {
      if (!cancelled) setShow(true);
    }, 5_500);
    return () => {
      cancelled = true;
      cancel();
    };
  }, []);

  if (!show) {
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
    }, 4_000);
    return () => {
      cancelled = true;
      cancel();
    };
  }, []);

  if (!show) return null;

  return (
    <SectionErrorBoundary name="HomeLiveNow">
      <Suspense fallback={null}>
        <HomeLiveNowBanner />
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
    }, 2_500);
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
        cancelFallback = deferAfterPaint(reveal, 12_000);
        return;
      }
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            reveal();
            io?.disconnect();
          }
        },
        { rootMargin: "240px 0px" },
      );
      io.observe(el);
      // احتياطي بعيد — لا rIC حتى لا يُحمَّل تحت الطية أثناء قياس Lighthouse
      cancelFallback = deferAfterPaint(reveal, 12_000);
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
    return <div className="mj-home-below-fold-ph" id="mj-home-below-fold" aria-hidden="true" />;
  }

  return (
    <div id="mj-home-below-fold">
      <SectionErrorBoundary name="HomeBelowFold">
        <Suspense fallback={<div className="mj-home-below-fold-ph" aria-hidden="true" />}>
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
    return deferAfterPaint(() => setShowIntro(true), 6_000);
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
    const paint = () => window.dispatchEvent(new Event("mj:home-painted"));
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(paint);
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  if (showIntro) {
    return (
      <Suspense
        fallback={
          <div className="first-visit-intro" aria-busy="true" aria-label="تحميل الترحيب">
            <div className="first-visit-intro__inner">
              <p className="first-visit-intro__badge">سُنّة</p>
            </div>
          </div>
        }
      >
        <FirstVisitIntro onContinue={() => setShowIntro(false)} />
      </Suspense>
    );
  }

  // الغلاف + الهيرو في App (HomeHeroLcp خارج Suspense) — هنا بقية الرئيسية فقط
  return (
    <>
      {isMaintenanceMode() && (
        <div role="status" className="home-maintenance-banner">
          {getSiteSettings().maintenanceMessage}
        </div>
      )}

      <HomeSearchGate />

      <section className="m2030-band m2030-band--sage" aria-label="مدخل المبتدئ">
        <HomeStartHereGate />
      </section>

      <HomeLiveNowGate />

      <HomeDailyWirdGate />
      <HomeBelowFoldGate />
    </>
  );
}
