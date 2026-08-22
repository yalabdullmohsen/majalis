import { Suspense, useEffect, useState } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { defaultSiteJsonLd } from "@/lib/seo-structured-data";
import { getRecentPages, type RecentPage } from "@/lib/recent-pages";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeUniversalSearch } from "@/components/home/HomeUniversalSearch";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import { PageHero } from "@/components/ui/PageHero";
import "@/styles/components/home-brand-title.css";
import { HomeStartHereSection } from "@/components/home/HomeStartHereSection";
import { HomeDailyWirdBand } from "@/components/home/DailyWirdCard";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
import { scheduleOnIdle } from "@/lib/yield-to-main";
import "@/styles/m2030/home.css";
import "@/styles/pages/home-legacy.css";

const HomeBelowFold = lazyWithRetry(
  () => import("./HomeBelowFold"),
  "HomeBelowFold",
);

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

      <SectionErrorBoundary name="HomeUniversalSearch">
        <HomeUniversalSearch />
      </SectionErrorBoundary>

      <PageHero
        className="m2030-hero home-page-hero"
        fullBleed={false}
        withPattern={false}
        title="علم شرعي موثوق في مكان واحد"
        actions={
          <>
            <Link
              href={continueHref}
              className="mj-btn m2030-btn m2030-btn--primary"
            >
              {isFirstVisit ? "ابدأ بالدروس" : "تابع التصفح"}
            </Link>
            <Link
              href="/sections"
              className="mj-btn m2030-btn m2030-btn--ghost"
            >
              تصفح الأقسام
            </Link>
          </>
        }
      />

      <section className="m2030-band m2030-band--sage" aria-label="مدخل المبتدئ">
        <HomeStartHereSection />
      </section>

      <HomeDailyWirdBand />
      <HomeBelowFoldGate />
    </div>
  );
}
