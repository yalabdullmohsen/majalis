"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeUpcomingLessons } from "@/components/home/HomeUpcomingLessons";
import { HomeUpcomingCourses } from "@/components/home/HomeUpcomingCourses";
import { HomeCalendarSection } from "@/components/home/HomeCalendarSection";
import { HomeLatestUpdates } from "@/components/home/HomeLatestUpdates";
import { HomeMoreSections } from "@/components/home/HomeMoreSections";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import { T } from "@/lib/terminology";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

function HomeContentRail({
  title,
  subtitle,
  kicker,
  items,
  moreHref,
  moreLabel = "عرض المزيد",
}: {
  title: string;
  subtitle: string;
  kicker?: string;
  items: { title: string; href: string; meta: string; summary: string }[];
  moreHref?: string;
  moreLabel?: string;
}) {
  return (
    <section className="home-section home-content-rail">
      <div className="home-section-head">
        <div>
          {kicker && <p className="home-section-kicker">{kicker}</p>}
          <h2 className="home-section-title">{title}</h2>
          <p className="home-section-subtitle">{subtitle}</p>
        </div>
        {moreHref && <Link href={moreHref} className="home-section-link">{moreLabel}</Link>}
      </div>
      <div className="home-content-rail__grid">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="home-content-card">
            <span className="home-content-card__meta">{item.meta}</span>
            <strong>{item.title}</strong>
            <p>{item.summary}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function SafeHomeSection({
  name,
  band,
  children,
}: {
  name: string;
  band?: "even" | "odd";
  children: ReactNode;
}) {
  return (
    <div className={band ? `home-section-band home-section-band--${band}` : undefined}>
      <SectionErrorBoundary name={name}>{children}</SectionErrorBoundary>
    </div>
  );
}

const SCHOLAR_ITEMS = [
  { title: "دليل المشايخ", href: "/sheikhs", meta: T.sheikhs, summary: "سير وإجازات وتخصصات العلماء المعتمدين." },
  { title: "دروس حسب الشيخ", href: "/lessons", meta: T.lessons, summary: "تصفّح الدروس حسب الشيخ والسلسلة." },
  { title: "مسارات التعلم", href: "/learning/paths", meta: "تعلم", summary: "مسارات منظمة من المبتدئ إلى المتقدم." },
];

const QURAN_ITEMS = [
  { title: T.mushaf, href: "/quran", meta: "قراءة", summary: "114 سورة بالرسم العثماني." },
  { title: T.tajweed, href: "/quran/tajweed", meta: "تجويد", summary: "دروس وأمثلة صوتية." },
  { title: "قصص السور", href: "/quran/surah-stories", meta: "موسوعة", summary: "قصص السور الموثقة." },
  { title: T.quranLive, href: "/quran-live", meta: "بث", summary: "قنوات القرآن والحرمين." },
  { title: T.quranRadio, href: "/quran-radio", meta: "استماع", summary: "إذاعات قرآنية موثوقة." },
];

const FATWA_ITEMS = [
  { title: T.fatwa, href: "/fatwa", meta: "فتاوى", summary: "مركز الفتاوى الشرعية." },
  { title: T.fiqhCouncil, href: "/fiqh-council", meta: "مجمع", summary: "قرارات وفتاوى جماعية." },
  { title: T.rulings, href: "/rulings", meta: "أحكام", summary: "مكتبة الأحكام والأدلة." },
];

const QA_ITEMS = [
  { title: T.qa, href: "/qa", meta: "أسئلة", summary: "إجابات مصنّفة وموثقة." },
  { title: "أسئلة الصلاة", href: "/qa?q=الصلاة", meta: "الصلاة", summary: "مسائل الصلاة والوضوء." },
  { title: "أسئلة العقيدة", href: "/qa?q=العقيدة", meta: "العقيدة", summary: "أسئلة التوحيد والإيمان." },
];

const LIBRARY_ITEMS = [
  { title: T.library, href: "/library", meta: "كتب", summary: "كتب ومتون وروابط بحث." },
  { title: "كتب التفسير", href: "/search/تفسير", meta: "تفسير", summary: "بحث في كتب التفسير." },
  { title: "متون علمية", href: "/learning/paths", meta: "مسارات", summary: "ربط المكتبة بالمسارات التعليمية." },
];

const FAWAID_ITEMS = [
  { title: T.fawaid, href: "/fawaid", meta: "فوائد", summary: "فوائد مختصرة للمراجعة." },
  { title: "فوائد القرآن", href: "/search/فوائد القرآن", meta: "قرآن", summary: "لطائف مرتبطة بالآيات." },
  { title: "الأربعون النووية", href: "/arbaeen-nawawi", meta: "حديث", summary: "أحاديث جامعة منظمة." },
];

export default function HomePage({
  initialFeaturedLessons,
}: {
  initialFeaturedLessons?: KuwaitLessonRecord[];
} = {}) {
  const [term, setTerm] = useState("");
  const [, navigate] = useLocation();

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    if (q) navigate(`/search/${encodeURIComponent(q)}`);
  };

  return (
    <div className="home-page home-page--v3">
      {isMaintenanceMode() && (
        <div role="status" className="home-maintenance-banner">
          {getSiteSettings().maintenanceMessage}
        </div>
      )}

      <section className="home-hero home-hero--v3 home-section-band home-section-band--hero">
        <div className="home-hero-pattern" aria-hidden="true" />
        <div className="home-container home-hero-grid home-hero-grid--v3">
          <div className="home-hero-copy home-hero-copy--v3">
            <div className="home-hero-logo-card">
              <img
                src="/logo.png"
                alt={T.siteName}
                className="home-hero-logo"
                width={88}
                height={88}
                loading="eager"
                decoding="async"
              />
            </div>
            <p className="home-kicker home-kicker--v3">{T.siteTagline}</p>
            <h1 className="home-hero-title home-hero-title--v3">{T.siteName}</h1>
            <p className="home-hero-lead home-hero-lead--v3">
              دروس وفتاوى وقرآن وأذكار ومحتوى موثّق في مكان واحد.
            </p>
            <form onSubmit={submitSearch} className="home-search home-search--v3" aria-label={`${T.search} في المنصة`}>
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder={T.searchPlaceholder}
              />
              <button type="submit">{T.search}</button>
            </form>
            <Link href="/assistant" className="home-hero-assistant-link home-hero-assistant-link--v3">
              {T.assistant}
            </Link>
          </div>
        </div>
      </section>

      <main className="home-container home-main home-main--v3">
        <SafeHomeSection name={T.lessons} band="odd">
          <HomeUpcomingLessons initialLessons={initialFeaturedLessons} />
        </SafeHomeSection>

        <SafeHomeSection name={T.courses} band="even">
          <HomeUpcomingCourses />
        </SafeHomeSection>

        <SafeHomeSection name={T.sheikhs} band="odd">
          <HomeContentRail
            kicker="العلماء"
            title={T.sheikhs}
            subtitle="الوصول إلى المشايخ والدروس المرتبطة بهم."
            items={SCHOLAR_ITEMS}
            moreHref="/sheikhs"
          />
        </SafeHomeSection>

        <SafeHomeSection name={T.quran} band="even">
          <HomeContentRail
            kicker="الكتاب العزيز"
            title={T.quran}
            subtitle="مصحف — تجويد — تلاوات — بث — إذاعات."
            items={QURAN_ITEMS}
            moreHref="/quran"
          />
        </SafeHomeSection>

        <SafeHomeSection name={T.fatwa} band="odd">
          <HomeContentRail
            kicker="الاستفتاء"
            title={T.fatwa}
            subtitle="فتاوى وأحكام وقرارات علمية موثقة."
            items={FATWA_ITEMS}
            moreHref="/fatwa"
          />
        </SafeHomeSection>

        <SafeHomeSection name={T.qa} band="even">
          <HomeContentRail
            kicker="سؤال وجواب"
            title={T.qa}
            subtitle="أسئلة وأجوبة مصنّفة."
            items={QA_ITEMS}
            moreHref="/qa"
          />
        </SafeHomeSection>

        <SafeHomeSection name={T.library} band="odd">
          <HomeContentRail
            kicker="كتب"
            title={T.library}
            subtitle="كتب ومتون ومسارات علمية."
            items={LIBRARY_ITEMS}
            moreHref="/library"
          />
        </SafeHomeSection>

        <SafeHomeSection name={T.fawaid} band="even">
          <HomeContentRail
            kicker="لطائف علمية"
            title={T.fawaid}
            subtitle="فوائد مختصرة لطالب العلم."
            items={FAWAID_ITEMS}
            moreHref="/fawaid"
          />
        </SafeHomeSection>

        <SafeHomeSection name={T.calendar} band="odd">
          <HomeCalendarSection />
        </SafeHomeSection>

        <SafeHomeSection name={T.updates} band="even">
          <HomeLatestUpdates />
        </SafeHomeSection>

        <SafeHomeSection name="أقسام إضافية" band="odd">
          <HomeMoreSections />
        </SafeHomeSection>
      </main>
    </div>
  );
}
