/**
 * جزيرة تحت الطية — رئيسية مبسّطة بلا «مواسم التعلم».
 * HomePrimaryDiscovery: بوابات + محتوى أساسي (قبل الورد/المباشر في HomeView).
 * الافتراضي: تقدم مختصر → آخر الدروس → متابعة → زرت مؤخراً.
 */
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import {
  BookMarked,
  BookOpen,
  Clock,
  GraduationCap,
  LayoutGrid,
  Scale,
  Wrench,
} from "lucide-react";
import contentCounts from "@/data/content-counts.json";
import { useAuth } from "@/components/AuthProvider";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeDailyProgress } from "@/components/home/HomeDailyProgress";
import { HomeContinueWidget } from "@/components/home/HomeContinueWidget";
import { HomeLocalResumeCard } from "@/components/home/HomeLocalResumeCard";
import { FridayBanner } from "@/components/FridayBanner";
import { toArabicDigits } from "@/lib/utils";
import { HomeCustomizeSheet } from "@/components/home/HomeCustomizeSheet";
import { HomeRecentPagesBar } from "@/components/home/HomeRecentPagesBar";
import { HomeExplorePlatform } from "@/components/home/HomeExplorePlatform";
import { HomeContentHub } from "@/components/home/HomeContentHub";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
import { ShareFaida } from "@/components/ShareFaida";
import { SunnahCardV2 } from "@/components/design-system";
import { HomeQuickAccessV2 } from "@/components/home/HomeQuickAccessV2";
import { IA_HOME_PRIMARY } from "@/lib/ia-final-structure";
import { prefetchHomeWarmRoutes, prefetchRoute } from "@/lib/prefetch-route";
import {
  HOME_WIDGET_DEFS,
  getLocalHomepagePrefs,
  saveLocalHomepagePrefs,
  fetchRemoteHomepagePrefs,
  visibleWidgetOrder,
  type HomepagePrefs,
  type HomeWidgetId,
} from "@/lib/homepage-layout";
/** CSS قديم لأقسام تحت الطية فقط — لا يدخل حزمة فوق الطية / LCP. */
import "@/styles/pages/home-legacy.css";

const HomeUpcomingLessons = lazyWithRetry(
  () => import("@/components/home/HomeUpcomingLessons").then((m) => ({ default: m.HomeUpcomingLessons })),
  "HomeUpcomingLessons",
);
const HomeCompactPrayer = lazyWithRetry(
  () => import("@/components/home/HomeCompactPrayer").then((m) => ({ default: m.HomeCompactPrayer })),
  "HomeCompactPrayer",
);
const HomeDailyBenefits = lazyWithRetry(
  () => import("@/components/home/HomeDailyBenefits").then((m) => ({ default: m.HomeDailyBenefits })),
  "HomeDailyBenefits",
);
const HomeUpcomingEvents = lazyWithRetry(
  () => import("@/components/home/HomeUpcomingEvents").then((m) => ({ default: m.HomeUpcomingEvents })),
  "HomeUpcomingEvents",
);
const HomeSunnahByTime = lazyWithRetry(
  () => import("@/components/home/HomeSunnahByTime").then((m) => ({ default: m.HomeSunnahByTime })),
  "HomeSunnahByTime",
);
const HomeIslamicOccasions = lazyWithRetry(
  () => import("@/components/home/HomeIslamicOccasions").then((m) => ({ default: m.HomeIslamicOccasions })),
  "HomeIslamicOccasions",
);
const HomePrayerRanks = lazyWithRetry(
  () => import("@/components/home/HomePrayerRanks").then((m) => ({ default: m.HomePrayerRanks })),
  "HomePrayerRanks",
);
const HomeQuizCard = lazyWithRetry(
  () => import("@/components/home/HomeQuizCard").then((m) => ({ default: m.HomeQuizCard })),
  "HomeQuizCard",
);
const HomeWeekStreak = lazyWithRetry(
  () => import("@/components/home/HomeWeekStreak").then((m) => ({ default: m.HomeWeekStreak })),
  "HomeWeekStreak",
);
const HomeInterestingTopics = lazyWithRetry(
  () => import("@/components/home/HomeInterestingTopics").then((m) => ({ default: m.HomeInterestingTopics })),
  "HomeInterestingTopics",
);
const HomeMindMapSection = lazyWithRetry(
  () => import("@/components/home/HomeMindMapSection").then((m) => ({ default: m.HomeMindMapSection })),
  "HomeMindMapSection",
);

function SafeHomeSection({ name, children }: { name: string; children: ReactNode }) {
  return (
    <SectionErrorBoundary name={name}>
      <Suspense fallback={<div className="skeleton-base hp-skel" aria-label={`تحميل ${name}`} />}>
        {children}
      </Suspense>
    </SectionErrorBoundary>
  );
}

const OPTIONAL_WIDGET_RENDERERS: Partial<Record<HomeWidgetId, () => ReactNode>> = {
  prayer: () => <HomeCompactPrayer />,
  "week-streak": () => <HomeWeekStreak />,
  "sunnah-time": () => <HomeSunnahByTime />,
  explore: () => <HomeExplorePlatform />,
  occasions: () => <HomeIslamicOccasions />,
  quiz: () => <HomeQuizCard />,
  "daily-benefits": () => <HomeDailyBenefits />,
  "upcoming-events": () => <HomeUpcomingEvents />,
  "prayer-ranks": () => <HomePrayerRanks />,
  "interesting-topics": () => <HomeInterestingTopics />,
  "mind-map": () => <HomeMindMapSection />,
};

const WIDGET_LABEL: Record<string, string> = Object.fromEntries(
  HOME_WIDGET_DEFS.map((w) => [w.id, w.label]),
);

const HOME_PRIMARY_ICONS = {
  "/quran-hub": BookMarked,
  "/lessons": GraduationCap,
  "/prayer-times": Clock,
  "/fiqh": Scale,
  "/adhkar": BookOpen,
  "/sections": LayoutGrid,
} as const;

const FEATURED_CATS = IA_HOME_PRIMARY.map((item) => ({
  ...item,
  Icon: HOME_PRIMARY_ICONS[item.href as keyof typeof HOME_PRIMARY_ICONS] ?? BookOpen,
}));

const PINNED: ReadonlySet<HomeWidgetId> = new Set(["lessons", "continue", "daily-progress"]);

/** بوابات العلم + المحتوى الأساسي — قبل الورد والدرس المباشر */
export function HomePrimaryDiscovery() {
  useEffect(() => {
    let cancelled = false;
    const warm = () => {
      if (cancelled) return;
      prefetchHomeWarmRoutes();
      for (const { href } of FEATURED_CATS) prefetchRoute(href);
    };
    const idle =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(warm, { timeout: 4_000 })
        : window.setTimeout(warm, 2_200);
    return () => {
      cancelled = true;
      if (typeof window.cancelIdleCallback === "function" && typeof idle === "number") {
        window.cancelIdleCallback(idle);
      } else {
        window.clearTimeout(idle as number);
      }
    };
  }, []);

  return (
    <>
      <HomeQuickAccessV2 />

      <section
        className="m2030-band home-primary-portals home-primary-portals--compact"
        aria-label="الأقسام الرئيسية"
        data-testid="home-primary-portals"
      >
        <div className="m2030-band__head">
          <h2 className="m2030-band__title">الأقسام الرئيسية</h2>
        </div>
        <div className="ss-feature-grid" data-cards-grid="1">
          {FEATURED_CATS.map(({ href, title, desc, Icon }) => (
            <SunnahCardV2
              key={href}
              href={href}
              title={title}
              description={desc}
              ctaLabel="افتح"
              icon={<Icon size={18} strokeWidth={1.8} aria-hidden="true" />}
            />
          ))}
        </div>
      </section>

      <section className="m2030-band" aria-label="المحتوى الأساسي">
        <HomeContentHub />
      </section>
    </>
  );
}

export default function HomeBelowFold() {
  const { isAdmin, user } = useAuth();
  const [homePrefs, setHomePrefs] = useState<HomepagePrefs>(() => getLocalHomepagePrefs());
  const [customizeOpen, setCustomizeOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    void fetchRemoteHomepagePrefs(user.id).then((remote) => {
      if (!remote) return;
      setHomePrefs(remote);
      saveLocalHomepagePrefs(remote);
    });
  }, [user?.id]);

  const visibleWidgets = visibleWidgetOrder(homePrefs);
  const optionalWidgets = visibleWidgets.filter((id) => !PINNED.has(id));

  return (
    <>
      {visibleWidgets.includes("daily-progress") ? (
        <section
          className="m2030-band home-daily-progress-band home-daily-progress-band--compact"
          aria-label="تقدمك اليومي"
        >
          <SafeHomeSection name="daily-progress">
            <HomeDailyProgress compact />
          </SafeHomeSection>
        </section>
      ) : null}

      {visibleWidgets.includes("lessons") ? (
        <section className="m2030-band m2030-band--sage m2030-band--defer" aria-label="آخر الدروس">
          <div className="m2030-band__head">
            <h2 className="m2030-band__title">آخر الدروس</h2>
            <Link href="/lessons" className="m2030-band__link">
              كل الدروس
            </Link>
          </div>
          <SafeHomeSection name="lessons">
            {/* قسم واحد فقط للدروس — الدورات عبر /lessons لتفادي التكرار */}
            <HomeUpcomingLessons />
          </SafeHomeSection>
        </section>
      ) : null}

      <section className="m2030-band home-resume-v2" aria-label="متابعة من حيث توقفت">
        <div className="m2030-band__head">
          <h2 className="m2030-band__title">استكمال الرحلة</h2>
        </div>
        <div className="m2030-panel home-resume-v2__panel">
          <SafeHomeSection name="local-resume">
            <HomeLocalResumeCard />
          </SafeHomeSection>
          {visibleWidgets.includes("continue") ? (
            <SafeHomeSection name="continue">
              <HomeContinueWidget />
            </SafeHomeSection>
          ) : null}
        </div>
      </section>

      <HomeRecentPagesBar />

      <div className="m2030-band home-friday-slim">
        <SafeHomeSection name="FridayBanner">
          <FridayBanner />
        </SafeHomeSection>
      </div>

      <section className="m2030-band home-share-slim" aria-label="شارك الموقع">
        <ShareFaida title="سُنّة — منصة تعليمية إسلامية" url="https://www.ssunnah.com/" />
      </section>

      <div className="m2030-band" style={{ textAlign: "center" }}>
        <button type="button" className="m2030-customize" onClick={() => setCustomizeOpen(true)}>
          <Wrench size={13} strokeWidth={2} aria-hidden="true" /> تخصيص الصفحة
        </button>
      </div>

      {optionalWidgets.length > 0 ? (
        <div className="home-container home-main home-optional-widgets">
          {optionalWidgets.map((id) => {
            const render = OPTIONAL_WIDGET_RENDERERS[id];
            if (!render) return null;
            return (
              <SafeHomeSection key={id} name={WIDGET_LABEL[id] ?? id}>
                {render()}
              </SafeHomeSection>
            );
          })}
        </div>
      ) : null}

      {isAdmin ? (
        <p className="m2030-band__sub" style={{ textAlign: "center" }}>
          محتوى مرجعي: {toArabicDigits(contentCounts.islamicHistory)} عنصر تاريخ ·{" "}
          {toArabicDigits(contentCounts.quizQuestions)} سؤال
        </p>
      ) : null}

      <HomeCustomizeSheet
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        onChange={setHomePrefs}
      />
    </>
  );
}
