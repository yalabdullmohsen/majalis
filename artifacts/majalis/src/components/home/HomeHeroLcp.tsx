/**
 * هيرو الرئيسية خارج Suspense — يبقى h1 «سُنّة» في DOM من أول رسم App
 * حتى لا يُعاد قياس LCP عند استبدال HomePage الكسول.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PageHero } from "@/components/ui/PageHero";
import { resolveDailyContext } from "@/lib/daily-context";
import { hasSeenFirstVisitIntroSync } from "@/lib/first-visit-intro-state";
import { getRecentPages } from "@/lib/recent-pages";
import "@/styles/components/home-brand-title.css";
import "@/styles/m2030/home.css";

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
  const [continueHref] = useState(() => {
    try {
      return getRecentPages(2).find((p) => p.href !== "/")?.href || "/lessons";
    } catch {
      return "/lessons";
    }
  });

  return (
    <PageHero
      className="m2030-hero home-page-hero home-page-hero--eyebrow-ready home-page-hero--actions-ready"
      fullBleed={false}
      withPattern={false}
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
    />
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
      className="home-sacred-day home-sacred-day--ph"
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
