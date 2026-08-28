import { Suspense, useEffect, useMemo, useState } from "react";
import { applyPageSeo } from "@/lib/seo";
import { defaultSiteJsonLd } from "@/lib/seo-structured-data";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeUniversalSearch } from "@/components/home/HomeUniversalSearch";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
import { scheduleOnIdle } from "@/lib/yield-to-main";
import { toArabicDigits } from "@/lib/utils";
import { StartHeader } from "@/components/home/start/StartHeader";
import { HOME_SEARCH_INPUT_ID } from "@/lib/home-search-id";
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

const PrayerSummaryCard = lazyWithRetry(
  () =>
    import("@/components/home/start/PrayerSummaryCard").then((m) => ({
      default: m.PrayerSummaryCard,
    })),
  "PrayerSummaryCard",
);

const DhikrSummaryCard = lazyWithRetry(
  () =>
    import("@/components/home/start/DhikrSummaryCard").then((m) => ({
      default: m.DhikrSummaryCard,
    })),
  "DhikrSummaryCard",
);

const HomeFeaturedSections = lazyWithRetry(
  () =>
    import("@/components/home/start/HomeFeaturedSections").then((m) => ({
      default: m.HomeFeaturedSections,
    })),
  "HomeFeaturedSections",
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

function PrayerSkeleton() {
  return (
    <section className="mj-app-card mj-prayer-summary mj-prayer-summary--ph" aria-label="مواقيت الصلاة" aria-busy="true">
      <div className="mj-prayer-summary__hero mj-prayer-summary__hero--ph">
        <span className="mj-home-start-ph__line mj-home-start-ph__line--md" />
        <span className="mj-home-start-ph__line mj-home-start-ph__line--lg" />
      </div>
      <div className="mj-prayer-summary__row mj-prayer-summary__row--ph" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="mj-home-start-ph__chip" />
        ))}
      </div>
    </section>
  );
}

function FeaturedSkeleton() {
  return (
    <section className="mj-app-card mj-home-featured mj-home-featured--ph" aria-label="أقسام بارزة" aria-busy="true">
      <div className="mj-app-section-header">
        <h2 className="mj-app-section-header__title">استكشف</h2>
      </div>
      <div className="mj-home-featured__grid" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className="mj-home-start-ph__action mj-home-start-ph__chip" />
        ))}
      </div>
    </section>
  );
}

function DhikrSkeleton() {
  return (
    <section className="mj-app-card mj-dhikr-summary mj-dhikr-summary--ph" aria-label="الأذكار" aria-busy="true">
      <div className="mj-app-section-header">
        <h2 className="mj-app-section-header__title">الأذكار</h2>
      </div>
      <div className="mj-dhikr-summary__list" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <span key={i} className="mj-dhikr-summary__row-ph mj-home-start-ph__chip" />
        ))}
      </div>
    </section>
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
        <Suspense fallback={<PrayerSkeleton />}>
          <PrayerSummaryCard />
        </Suspense>
      </SectionErrorBoundary>

      <SectionErrorBoundary name="DhikrSummary">
        <Suspense fallback={<DhikrSkeleton />}>
          <DhikrSummaryCard />
        </Suspense>
      </SectionErrorBoundary>

      <SectionErrorBoundary name="HomeUniversalSearch">
        <HomeUniversalSearch inputId={HOME_SEARCH_INPUT_ID} variant="start" />
      </SectionErrorBoundary>

      <SectionErrorBoundary name="HomeFeatured">
        <Suspense fallback={<FeaturedSkeleton />}>
          <HomeFeaturedSections />
        </Suspense>
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
