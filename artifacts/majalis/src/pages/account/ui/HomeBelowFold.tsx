/**
 * جزيرة تحت الطية — تُحمَّل بعد الخمول/الظهور حتى لا تنافس رسم الرئيسية.
 */
import { Suspense, useEffect, useState } from "react";
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
import { HomeLearningSeasonsWidget } from "@/components/home/HomeLearningSeasonsWidget";
import { FridayBanner } from "@/components/FridayBanner";
import { toArabicDigits } from "@/lib/utils";
import { HomeCustomizeSheet } from "@/components/home/HomeCustomizeSheet";
import { HomeRecentPagesBar } from "@/components/home/HomeRecentPagesBar";
import { HomeExplorePlatform } from "@/components/home/HomeExplorePlatform";
import { HomeContentHub } from "@/components/home/HomeContentHub";
import { HomeMostReadBand } from "@/components/home/HomeMostReadBand";
import { lazyWithRetry } from "@/lib/lazy-with-retry";
import { ShareFaida } from "@/components/ShareFaida";
import { QUICK_LINKS } from "@/lib/home-feature-catalog";
import { IA_HOME_PRIMARY } from "@/lib/ia-final-structure";
import {
  HOME_WIDGET_DEFS,
  getLocalHomepagePrefs,
  saveLocalHomepagePrefs,
  fetchRemoteHomepagePrefs,
  visibleWidgetOrder,
  type HomepagePrefs,
} from "@/lib/homepage-layout";
/** CSS قديم لأقسام تحت الطية فقط — لا يدخل حزمة فوق الطية / LCP. */
import "@/styles/pages/home-legacy.css";

const HomeUpcomingLessons = lazyWithRetry(
  () => import("@/components/home/HomeUpcomingLessons").then((m) => ({ default: m.HomeUpcomingLessons })),
  "HomeUpcomingLessons",
);
const HomeUpcomingCourses = lazyWithRetry(
  () => import("@/components/home/HomeUpcomingCourses").then((m) => ({ default: m.HomeUpcomingCourses })),
  "HomeUpcomingCourses",
);
const HomeCompactPrayer = lazyWithRetry(() => import("@/components/home/HomeCompactPrayer").then((m) => ({ default: m.HomeCompactPrayer })), "HomeCompactPrayer");
const HomeDailyBenefits = lazyWithRetry(() => import("@/components/home/HomeDailyBenefits").then((m) => ({ default: m.HomeDailyBenefits })), "HomeDailyBenefits");
const HomeUpcomingEvents = lazyWithRetry(() => import("@/components/home/HomeUpcomingEvents").then((m) => ({ default: m.HomeUpcomingEvents })), "HomeUpcomingEvents");
const HomeSunnahByTime = lazyWithRetry(() => import("@/components/home/HomeSunnahByTime").then((m) => ({ default: m.HomeSunnahByTime })), "HomeSunnahByTime");
const HomeIslamicOccasions = lazyWithRetry(() => import("@/components/home/HomeIslamicOccasions").then((m) => ({ default: m.HomeIslamicOccasions })), "HomeIslamicOccasions");
const HomePrayerRanks = lazyWithRetry(() => import("@/components/home/HomePrayerRanks").then((m) => ({ default: m.HomePrayerRanks })), "HomePrayerRanks");
const HomeQuizCard = lazyWithRetry(() => import("@/components/home/HomeQuizCard").then((m) => ({ default: m.HomeQuizCard })), "HomeQuizCard");
const HomeWeekStreak = lazyWithRetry(() => import("@/components/home/HomeWeekStreak").then((m) => ({ default: m.HomeWeekStreak })), "HomeWeekStreak");
const HomeInterestingTopics = lazyWithRetry(() => import("@/components/home/HomeInterestingTopics").then((m) => ({ default: m.HomeInterestingTopics })), "HomeInterestingTopics");
const HomeMindMapSection = lazyWithRetry(() => import("@/components/home/HomeMindMapSection").then((m) => ({ default: m.HomeMindMapSection })), "HomeMindMapSection");

function SafeHomeSection({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <SectionErrorBoundary name={name}>
      <Suspense fallback={<div className="skeleton-base hp-skel" aria-label={`تحميل ${name}`} />}>
        {children}
      </Suspense>
    </SectionErrorBoundary>
  );
}

const WIDGET_RENDERERS: Record<string, () => React.ReactNode> = {
  lessons: () => (<><HomeUpcomingLessons /><HomeUpcomingCourses /></>),
  prayer: () => <HomeCompactPrayer />,
  continue: () => <HomeContinueWidget />,
  "daily-progress": () => <HomeDailyProgress />,
  "week-streak": () => <HomeWeekStreak />,
  "sunnah-time": () => <HomeSunnahByTime />,
  explore: () => <HomeExplorePlatform />,
  "learning-seasons": () => <HomeLearningSeasonsWidget />,
  occasions: () => <HomeIslamicOccasions />,
  quiz: () => <HomeQuizCard />,
  "daily-benefits": () => <HomeDailyBenefits />,
  "upcoming-events": () => <HomeUpcomingEvents />,
  "prayer-ranks": () => <HomePrayerRanks />,
  "interesting-topics": () => <HomeInterestingTopics />,
  "mind-map": () => <HomeMindMapSection />,
};

const WIDGET_LABEL: Record<string, string> = Object.fromEntries(HOME_WIDGET_DEFS.map((w) => [w.id, w.label]));

const HOME_PRIMARY_ICONS = {
  "/quran-hub": BookMarked,
  "/lessons": GraduationCap,
  "/prayer-times": Clock,
  "/fiqh": Scale,
  "/adhkar": BookOpen,
  "/more": LayoutGrid,
} as const;

const FEATURED_CATS = IA_HOME_PRIMARY.map((item) => ({
  ...item,
  cta: "افتح",
  Icon: HOME_PRIMARY_ICONS[item.href as keyof typeof HOME_PRIMARY_ICONS] ?? BookOpen,
}));

export default function HomeBelowFold() {
  const { isAdmin, user } = useAuth();
  const [homePrefs, setHomePrefs] = useState<HomepagePrefs>(() => getLocalHomepagePrefs());
  const [customizeOpen, setCustomizeOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    fetchRemoteHomepagePrefs(user.id).then((remote) => {
      if (remote) {
        setHomePrefs(remote);
        saveLocalHomepagePrefs(remote);
      }
    });
  }, [user?.id]);

  const visibleWidgets = visibleWidgetOrder(homePrefs);
  const restWidgetOrder = visibleWidgets.filter((id) => id !== "lessons" && id !== "continue");

  return (
    <>
      {visibleWidgets.includes("lessons") && (
        <section className="m2030-band m2030-band--sage m2030-band--defer" aria-label="دروس اليوم">
          <div className="m2030-band__head">
            <h2 className="m2030-band__title">آخر الدروس</h2>
            <Link href="/lessons" className="m2030-band__link">كل الدروس</Link>
          </div>
          <SafeHomeSection name="lessons">
            <HomeUpcomingLessons />
            <HomeUpcomingCourses />
          </SafeHomeSection>
        </section>
      )}

      <section className="m2030-band" aria-label="متابعة القراءة والاستماع">
        <div className="m2030-band__head">
          <h2 className="m2030-band__title">أكمل من حيث توقفت</h2>
        </div>
        <div className="m2030-panel mj-card mj-card--raised">
          <SafeHomeSection name="local-resume">
            <HomeLocalResumeCard />
          </SafeHomeSection>
          <SafeHomeSection name="continue">
            <HomeContinueWidget />
          </SafeHomeSection>
        </div>
      </section>

      <HomeMostReadBand />

      <section className="m2030-band m2030-band--sage" aria-label="إجراءات سريعة">
        <div className="m2030-band__head">
          <h2 className="m2030-band__title">وصول سريع</h2>
        </div>
        <div className="m2030-quick">
          {QUICK_LINKS.map(({ href, Icon: Ico, label, desc }) => (
            <Link key={label + href} href={href} className="m2030-tile" aria-label={label}>
              <span className="m2030-tile__icon" aria-hidden="true">
                <Ico size={14} strokeWidth={2} />
              </span>
              <span className="m2030-tile__label">{label}</span>
              <span className="m2030-tile__desc">{desc}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="m2030-band" aria-label="محتوى أساسي">
        <HomeContentHub />
      </section>

      <section className="m2030-band" aria-label="أقسام علمية">
        <div className="m2030-band__head">
          <h2 className="m2030-band__title">بوابات العلم</h2>
        </div>
        <div className="m2030-featured">
          {FEATURED_CATS.map(({ href, title, desc, cta, Icon }) => (
            <Link key={href} href={href} className="m2030-feature">
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              <h3 className="m2030-feature__title">{title}</h3>
              <p className="m2030-feature__desc">{desc}</p>
              <span className="m2030-feature__cta">{cta}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="m2030-band">
        <SafeHomeSection name="FridayBanner">
          <FridayBanner />
        </SafeHomeSection>
      </div>

      <HomeRecentPagesBar />

      <section className="m2030-band" aria-label="شارك الموقع">
        <ShareFaida title="المجلس العلمي — منصة تعليمية إسلامية" url="https://majlisilm.com/" />
      </section>

      <div className="m2030-band" style={{ textAlign: "center" }}>
        <button type="button" className="m2030-customize" onClick={() => setCustomizeOpen(true)}>
          <Wrench size={13} strokeWidth={2} aria-hidden="true" /> تخصيص الصفحة
        </button>
      </div>

      <div className="home-container home-main">
        {restWidgetOrder.map((id) => (
          <SafeHomeSection key={id} name={WIDGET_LABEL[id] ?? id}>
            {WIDGET_RENDERERS[id]?.()}
          </SafeHomeSection>
        ))}

        {isAdmin && (
          <p className="m2030-band__sub" style={{ textAlign: "center" }}>
            محتوى مرجعي: {toArabicDigits(contentCounts.islamicHistory)} عنصر تاريخ · {toArabicDigits(contentCounts.quizQuestions)} سؤال
          </p>
        )}
      </div>

      <HomeCustomizeSheet
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        onChange={setHomePrefs}
      />
    </>
  );
}
