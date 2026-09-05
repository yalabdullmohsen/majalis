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

/** هيكل ناعم لـ «ابدأ من هنا» — بدون مربع أبيض فارغ */
export function HomeStartHereSoftSkeleton() {
  return (
    <section
      aria-label="ابدأ من هنا"
      aria-busy="true"
      className="home-start-here mj-home-lcp-ph__start-here mj-home-lcp-ph__start-here--soft"
    >
      <div className="hsh-header" aria-hidden="true">
        <span className="hsh-eyebrow mj-home-lcp-ph__kicker skeleton-base">&nbsp;</span>
        <span className="hsh-title mj-home-lcp-ph__section-title skeleton-base">&nbsp;</span>
        <p className="hsh-lead mj-home-lcp-ph__lead skeleton-base">&nbsp;</p>
        <div className="hsh-actions">
          <span className="mj-home-lcp-ph__action skeleton-base" />
          <span className="mj-home-lcp-ph__action skeleton-base" />
        </div>
      </div>
      <ol className="hsh-steps" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, idx) => (
          <li key={idx} className="hsh-step">
            <span className="hsh-step__num" aria-hidden="true">
              {idx + 1}
            </span>
            <div className="hsh-step__body">
              <span className="mj-home-lcp-ph__step-title skeleton-base" />
              <span className="mj-home-lcp-ph__step-desc skeleton-base" />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function HomeHeroLcp() {
  const greeting = resolveDailyContext().greeting;
  // أظهر التحية والأزرار فورًا — تأخير 4ث كان يترك شعارًا فقط ومربعات فارغة.
  const [showEyebrow, setShowEyebrow] = useState(true);
  const [showActions, setShowActions] = useState(true);
  const [isFirstVisit] = useState(() => {
    try {
      return !hasSeenFirstVisitIntroSync() && localStorage.getItem("majlis-home-welcomed-v1") !== "1";
    } catch {
      return true;
    }
  });
  const [continueHref, setContinueHref] = useState("/lessons");

  useEffect(() => {
    let cancelled = false;
    let clearDefer: (() => void) | undefined;
    const reveal = () => {
      if (cancelled) return;
      setShowEyebrow(true);
      setShowActions(true);
    };
    const onPainted = () => {
      clearDefer?.();
      clearDefer = deferAfterPaint(reveal, 80);
    };
    window.addEventListener("mj:app-painted", onPainted, { once: true });
    window.addEventListener("app:first-paint", onPainted, { once: true });
    clearDefer = deferAfterPaint(reveal, 320);
    return () => {
      cancelled = true;
      clearDefer?.();
      window.removeEventListener("mj:app-painted", onPainted);
      window.removeEventListener("app:first-paint", onPainted);
    };
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
        <HomeStartHereSoftSkeleton />
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
        <div className="home-daily-wird__grid" aria-hidden="true">
          {Array.from({ length: 2 }).map((_, idx) => (
            <article key={idx} className="home-daily-wird__card mj-card mj-home-lcp-ph__daily-card">
              <div className="home-daily-wird__text mj-home-lcp-ph__daily-line skeleton-base" />
              <div className="home-daily-wird__text mj-home-lcp-ph__daily-line skeleton-base" />
              <div className="home-daily-wird__meta mj-home-lcp-ph__daily-meta skeleton-base" />
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
