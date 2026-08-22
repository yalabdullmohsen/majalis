import { Suspense, useEffect, useState } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { defaultSiteJsonLd } from "@/lib/seo-structured-data";
import { useDailyContext } from "@/lib/daily-context";
import { getRecentPages, type RecentPage } from "@/lib/recent-pages";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeUniversalSearch } from "@/components/home/HomeUniversalSearch";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import { PageHero } from "@/components/ui/PageHero";
import "@/styles/components/home-brand-title.css";
import { HomeStartHereSection } from "@/components/home/HomeStartHereSection";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
import { scheduleOnIdle } from "@/lib/yield-to-main";
import "@/styles/m2030/home.css";
import "@/styles/pages/home-legacy.css";

const HomeBelowFold = lazyWithRetry(
  () => import("./HomeBelowFold"),
  "HomeBelowFold",
);

const HomeDailyWirdBand = lazyWithRetry(
  () => import("@/components/home/DailyWirdCard").then((m) => ({ default: m.HomeDailyWirdBand })),
  "HomeDailyWirdBand",
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

function HomeDailyWirdGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const reveal = () => {
      if (!cancelled) setShow(true);
    };
    scheduleOnIdle(reveal, 900);
    return () => {
      cancelled = true;
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

    const reveal = () => {
      if (!cancelled) setShow(true);
    };

    const watch = () => {
      const el = document.getElementById("mj-home-below-fold");
      if (!el || typeof IntersectionObserver === "undefined") {
        scheduleOnIdle(reveal, 1200);
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
      scheduleOnIdle(reveal, 2500);
    };

    const id = window.requestAnimationFrame(watch);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(id);
      io?.disconnect();
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
  const dailyCtx = useDailyContext();
  const [lastVisited, setLastVisited] = useState<RecentPage | null>(null);
  const [isFirstVisit] = useState(() => {
    try {
      return localStorage.getItem("majlis-home-welcomed-v1") !== "1";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const pages = getRecentPages(2);
    setLastVisited(pages.find((p) => p.href !== "/") ?? null);
    try {
      localStorage.setItem("majlis-home-welcomed-v1", "1");
    } catch {
      /* التخزين معطّل — النص الأول يبقى ثابتاً دون قفزة */
    }
  }, []);

  const continueHref = lastVisited?.href ?? "/lessons";

  useEffect(() => {
    applyPageSeo({
      path: "/",
      title: "المجلس العلمي، منصة العلوم الإسلامية",
      description: "منصة إسلامية شاملة للعلوم الشرعية: القرآن الكريم، الأذكار، الدروس العلمية، الأحكام الشرعية، والفقه المعاصر.",
      keywords: ["المجلس العلمي", "علوم إسلامية", "قرآن كريم", "أذكار", "أحكام شرعية", "دروس علمية"],
      jsonLd: defaultSiteJsonLd(),
    });
  }, []);

  return (
    <div className="m2030-home" dir="rtl">
      {isMaintenanceMode() && (
        <div role="status" className="home-maintenance-banner">
          {getSiteSettings().maintenanceMessage}
        </div>
      )}

      <PageHero
        className="m2030-hero home-page-hero"
        fullBleed={false}
        eyebrow={dailyCtx.greeting}
        title="المجلس العلمي"
        actions={
          <Link
            href={continueHref}
            className="mj-btn m2030-btn m2030-btn--primary"
          >
            {isFirstVisit ? "ابدأ بالدروس" : "تابع التصفح"}
          </Link>
        }
      />

      <SectionErrorBoundary name="HomeUniversalSearch">
        <HomeUniversalSearch />
      </SectionErrorBoundary>

      <section className="m2030-band m2030-band--sage" aria-label="مدخل المبتدئ">
        <HomeStartHereSection />
      </section>

      <HomeDailyWirdGate />
      <HomeBelowFoldGate />
    </div>
  );
}
