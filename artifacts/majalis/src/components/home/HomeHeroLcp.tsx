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

function deferAfterPaint(cb: () => void, ms: number): () => void {
  const id = window.setTimeout(cb, ms);
  return () => window.clearTimeout(id);
}

export function HomeHeroLcp() {
  const greeting = resolveDailyContext().greeting;
  const [showEyebrow, setShowEyebrow] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isFirstVisit] = useState(() => {
    try {
      return !hasSeenFirstVisitIntroSync() && localStorage.getItem("majlis-home-welcomed-v1") !== "1";
    } catch {
      return true;
    }
  });
  const [continueHref, setContinueHref] = useState("/lessons");

  useEffect(() => {
    return deferAfterPaint(() => {
      setShowEyebrow(true);
      setShowActions(true);
    }, 4_000);
  }, []);

  useEffect(() => {
    return deferAfterPaint(() => {
      const next = getRecentPages(2).find((p) => p.href !== "/")?.href;
      if (next) setContinueHref(next);
    }, 1_500);
  }, []);

  return (
    <PageHero
      className={`m2030-hero home-page-hero${showEyebrow ? " home-page-hero--eyebrow-ready" : ""}${showActions ? " home-page-hero--actions-ready" : ""}`}
      fullBleed={false}
      withPattern={false}
      eyebrow={greeting}
      title="سُنّة"
      actions={
        <>
          <Link href={continueHref} className="mj-btn m2030-btn m2030-btn--primary">
            {isFirstVisit ? "ابدأ الآن" : "تابع التصفح"}
          </Link>
          <Link href="/sections" className="mj-btn m2030-btn m2030-btn--ghost">
            تصفح الأقسام
          </Link>
        </>
      }
    />
  );
}

/** هيكل ما تحت الهيرو أثناء تحميل HomePage — بلا h1 حتى لا يُستبدل عنصر LCP */
export function HomeRestShell() {
  return (
    <>
      <div className="hus mj-home-lcp-ph__search" role="search" aria-label="بحث موحّد" aria-busy="true">
        <div className="hus-field">
          <span className="hus-input mj-home-lcp-ph__search-ph" aria-hidden="true">
            &nbsp;
          </span>
        </div>
      </div>

      <section className="m2030-band m2030-band--sage" aria-label="مدخل المبتدئ">
        <section
          aria-label="ابدأ من هنا"
          aria-busy="true"
          className="home-start-here mj-home-lcp-ph__start-here"
        />
      </section>

      <section
        className="m2030-band m2030-band--sage home-daily-wird daily-wird-card mj-home-lcp-ph__daily-band"
        aria-label="ورد اليوم"
        aria-busy="true"
        data-testid="daily-wird-card"
      >
        <div className="m2030-band__head">
          <h2 className="m2030-band__title">ورد اليوم</h2>
        </div>
      </section>
    </>
  );
}
