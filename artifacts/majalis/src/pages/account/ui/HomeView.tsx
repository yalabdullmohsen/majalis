import { Suspense, useEffect, useMemo, useState } from "react";
import { applyPageSeo } from "@/lib/seo";
import { defaultSiteJsonLd } from "@/lib/seo-structured-data";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
import { scheduleOnIdle } from "@/lib/yield-to-main";
import { toArabicDigits } from "@/lib/utils";
import { StartHeader } from "@/components/home/start/StartHeader";
import { HOME_SEARCH_INPUT_ID } from "@/lib/home-search-id";
import { StartSearchCard } from "@/components/home/start/StartSearchCard";
import { PrayerSummaryCard } from "@/components/home/start/PrayerSummaryCard";
import { DhikrSummaryCard } from "@/components/home/start/DhikrSummaryCard";
import { HomeFeaturedSections } from "@/components/home/start/HomeFeaturedSections";
import "@/styles/components/home/home-start.css";

const PAGE_POS_KEY = "majalis-quran-page-pos";

function readLocalMushafResume(): { href: string; label: string } {
  try {
    const raw = localStorage.getItem(PAGE_POS_KEY);
    if (!raw) return { href: "/mushaf", label: "المصحف" };
    const parsed = JSON.parse(raw) as { page?: number; ayahKey?: string };
    const page = Number(parsed?.page);
    if (!Number.isFinite(page) || page < 1 || page > 604) {
      return { href: "/mushaf", label: "المصحف" };
    }
    const ayahKey =
      typeof parsed?.ayahKey === "string" && /^\d{1,3}:\d{1,3}$/.test(parsed.ayahKey)
        ? parsed.ayahKey
        : null;
    return {
      href: ayahKey ? `/mushaf/page/${page}?ayah=${ayahKey}` : `/mushaf/page/${page}`,
      label: `صفحة ${toArabicDigits(page)}`,
    };
  } catch {
    return { href: "/mushaf", label: "المصحف" };
  }
}

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

export default function HomePage() {
  const [{ href: mushafHref, label: mushafLabel }] = useState(readLocalMushafResume);

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
            fetchPriority="low"
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

      <StartHeader searchInputId={HOME_SEARCH_INPUT_ID} mushafHref={mushafHref} mushafLabel={mushafLabel} />

      {brand}

      <SectionErrorBoundary name="PrayerSummary">
        <PrayerSummaryCard />
      </SectionErrorBoundary>

      <SectionErrorBoundary name="DhikrSummary">
        <DhikrSummaryCard />
      </SectionErrorBoundary>

      <SectionErrorBoundary name="HomeStartSearch">
        <StartSearchCard />
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
