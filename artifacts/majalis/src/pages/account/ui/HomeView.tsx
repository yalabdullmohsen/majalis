import { Suspense, useEffect, useId, useMemo, useState } from "react";
import { applyPageSeo } from "@/lib/seo";
import { defaultSiteJsonLd } from "@/lib/seo-structured-data";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeUniversalSearch } from "@/components/home/HomeUniversalSearch";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
import { scheduleOnIdle } from "@/lib/yield-to-main";
import { getSurahMeta, loadPagePosition, loadReadingAyahKey } from "@/lib/quran-api";
import { toArabicDigits } from "@/lib/utils";
import { StartHeader } from "@/components/home/start/StartHeader";
import { PrayerSummaryCard } from "@/components/home/start/PrayerSummaryCard";
import { DhikrSummaryCard } from "@/components/home/start/DhikrSummaryCard";
import { HomeFeaturedSections } from "@/components/home/start/HomeFeaturedSections";
import "@/styles/components/home/home-start.css";

const HomeBelowFold = lazyWithRetry(
  () => import("./HomeBelowFold"),
  "HomeBelowFold",
);

const HomeAuthStrip = lazyWithRetry(
  () =>
    import("@/components/home/start/HomeAuthStrip").then((m) => ({
      default: m.HomeAuthStrip,
    })),
  "HomeAuthStrip",
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
        scheduleOnIdle(reveal, 320);
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
      scheduleOnIdle(reveal, 800);
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

function resolveMushafHref(): string {
  const page = loadPagePosition();
  if (page != null && page >= 1) {
    const ayahKey = loadReadingAyahKey();
    return ayahKey ? `/mushaf/page/${page}?ayah=${ayahKey}` : `/mushaf/page/${page}`;
  }
  return "/mushaf";
}

function resolveMushafLabel(): string {
  const page = loadPagePosition();
  if (page == null || page < 1) return "المصحف";
  const ayahKey = loadReadingAyahKey();
  if (!ayahKey) return `صفحة ${toArabicDigits(page)}`;
  const [s] = ayahKey.split(":").map(Number);
  if (!s || s < 1 || s > 114) return `صفحة ${toArabicDigits(page)}`;
  const name = getSurahMeta(s).name.replace(/^سُورَةُ\s*/u, "");
  return name ? `متابعة ${name}` : `صفحة ${toArabicDigits(page)}`;
}

export default function HomePage() {
  const searchInputId = useId();
  const [mushafHref] = useState(resolveMushafHref);
  const [mushafLabel] = useState(resolveMushafLabel);

  useEffect(() => {
    scheduleOnIdle(() => {
      applyPageSeo({
        path: "/",
        title: "المجلس العلمي، منصة العلوم الإسلامية",
        description:
          "منصة إسلامية شاملة للعلوم الشرعية: القرآن الكريم، الأذكار، الدروس العلمية، الأحكام الشرعية، والفقه المعاصر.",
        keywords: ["المجلس العلمي", "علوم إسلامية", "قرآن كريم", "أذكار", "أحكام شرعية", "دروس علمية"],
        jsonLd: defaultSiteJsonLd(),
      });
    }, 0);
  }, []);

  useEffect(() => {
    const paint = () => window.dispatchEvent(new Event("mj:home-painted"));
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(paint);
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  const brand = useMemo(
    () => (
      <section className="mj-home-start__brand" aria-label="المجلس العلمي">
        <div className="mj-home-start__logo-wrap">
          <img
            src="/brand/splash-logo.webp"
            alt=""
            className="mj-home-start__logo"
            width={72}
            height={72}
            decoding="async"
            fetchPriority="high"
          />
        </div>
        <h1 className="mj-home-start__title">المجلس العلمي</h1>
        <p className="mj-home-start__tagline">علم نافع، محتوى موثوق، ودروس ميسرة</p>
      </section>
    ),
    [],
  );

  return (
    <div className="mj-home-start m2030-home" dir="rtl">
      {isMaintenanceMode() && (
        <div role="status" className="home-maintenance-banner">
          {getSiteSettings().maintenanceMessage}
        </div>
      )}

      <StartHeader searchInputId={searchInputId} mushafHref={mushafHref} mushafLabel={mushafLabel} />

      {brand}

      <SectionErrorBoundary name="PrayerSummary">
        <PrayerSummaryCard />
      </SectionErrorBoundary>

      <SectionErrorBoundary name="DhikrSummary">
        <DhikrSummaryCard />
      </SectionErrorBoundary>

      <SectionErrorBoundary name="HomeUniversalSearch">
        <HomeUniversalSearch inputId={searchInputId} variant="start" />
      </SectionErrorBoundary>

      <SectionErrorBoundary name="HomeFeatured">
        <HomeFeaturedSections />
      </SectionErrorBoundary>

      <SectionErrorBoundary name="HomeAuthStrip">
        <Suspense fallback={<section className="mj-app-card mj-home-auth mj-home-auth--ph" aria-hidden="true" />}>
          <HomeAuthStrip />
        </Suspense>
      </SectionErrorBoundary>

      <HomeBelowFoldGate />
    </div>
  );
}
