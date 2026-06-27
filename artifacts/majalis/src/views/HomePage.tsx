"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeLatestLessons } from "@/components/home/HomeLatestLessons";
import { HomeUpcomingLessons } from "@/components/home/HomeUpcomingLessons";
import { HomeUpcomingCourses } from "@/components/home/HomeUpcomingCourses";
import { HomeMediaSection } from "@/components/home/HomeMediaSection";
import { HomeCalendarSection } from "@/components/home/HomeCalendarSection";
import { HomeLatestUpdates } from "@/components/home/HomeLatestUpdates";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

type RailItem = { title: string; href: string; meta: string; summary: string };

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
  items: RailItem[];
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

const SCHOLAR_ITEMS: RailItem[] = [
  { title: "دروس المشايخ", href: "/lessons", meta: "المشايخ", summary: "تصفّح الدروس حسب الشيخ والسلسلة." },
  { title: "مسارات التعلم", href: "/learning/paths", meta: "تعلم", summary: "مسارات منظمة من المبتدئ إلى المتقدم." },
  { title: "المكتبة", href: "/library", meta: "كتب", summary: "كتب ومتون مرتبطة بالدروس." },
];

const QURAN_ITEMS: RailItem[] = [
  { title: "المصحف الشريف", href: "/quran", meta: "قراءة", summary: "114 سورة بالرسم العثماني." },
  { title: "علم التجويد", href: "/quran/tajweed", meta: "تجويد", summary: "دروس وأمثلة صوتية." },
  { title: "قصص السور", href: "/quran/surah-stories", meta: "موسوعة", summary: "قصص السور الموثقة." },
];

const ADHKAR_ITEMS: RailItem[] = [
  { title: "أذكار الصباح", href: "/adhkar?cat=morning", meta: "صباح", summary: "أذكار يومية مع التكرار." },
  { title: "أذكار المساء", href: "/adhkar?cat=evening", meta: "مساء", summary: "ورد المساء." },
  { title: "عداد التسبيح", href: "/tasbih", meta: "Offline", summary: "أوراد وإحصاءات يومية." },
];

const QA_ITEMS: RailItem[] = [
  { title: "الأسئلة الشرعية", href: "/qa", meta: "أسئلة", summary: "إجابات مصنّفة وموثقة." },
  { title: "أسئلة الصلاة", href: "/qa?q=الصلاة", meta: "الصلاة", summary: "مسائل الصلاة والوضوء." },
  { title: "أسئلة العقيدة", href: "/qa?q=العقيدة", meta: "العقيدة", summary: "أسئلة التوحيد والإيمان." },
];

const FAWAID_ITEMS: RailItem[] = [
  { title: "الفوائد العلمية", href: "/fawaid", meta: "فوائد", summary: "فوائد مختصرة للمراجعة." },
  { title: "فوائد القرآن", href: "/search/فوائد القرآن", meta: "قرآن", summary: "لطائف مرتبطة بالآيات." },
  { title: "الأربعون النووية", href: "/arbaeen-nawawi", meta: "حديث", summary: "أحاديث جامعة منظمة." },
];

const LIBRARY_ITEMS: RailItem[] = [
  { title: "المكتبة العلمية", href: "/library", meta: "كتب", summary: "كتب ومتون وروابط بحث." },
  { title: "كتب التفسير", href: "/search/تفسير", meta: "تفسير", summary: "بحث في كتب التفسير." },
  { title: "المجمع الفقهي", href: "/fiqh-council", meta: "فتاوى", summary: "قرارات وفتاوى جماعية." },
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
                alt="المجلس العلمي"
                className="home-hero-logo"
                width={88}
                height={88}
                loading="eager"
                decoding="async"
              />
            </div>
            <p className="home-kicker home-kicker--v3">المنصة العلمية الشرعية</p>
            <h1 className="home-hero-title home-hero-title--v3">المجلس العلمي</h1>
            <p className="home-hero-lead home-hero-lead--v3">
              دروس وفتاوى وقرآن وأذكار ومحتوى موثّق في مكان واحد.
            </p>
            <form onSubmit={submitSearch} className="home-search home-search--v3" aria-label="البحث في المنصة">
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="ابحث عن درس، ذكر، سورة، فائدة..."
              />
              <button type="submit">بحث</button>
            </form>
            <Link href="/assistant" className="home-hero-assistant-link home-hero-assistant-link--v3">
              المساعد العلمي
            </Link>
          </div>
        </div>
      </section>

      <main className="home-container home-main home-main--v3">
        <SafeHomeSection name="أحدث الدروس" band="odd">
          <HomeLatestLessons initialLessons={initialFeaturedLessons} />
        </SafeHomeSection>

        <SafeHomeSection name="الدروس القادمة" band="even">
          <HomeUpcomingLessons initialLessons={initialFeaturedLessons} />
        </SafeHomeSection>

        <SafeHomeSection name="الدورات العلمية" band="odd">
          <HomeUpcomingCourses />
        </SafeHomeSection>

        <SafeHomeSection name="المشايخ" band="even">
          <HomeContentRail
            kicker="العلماء"
            title="المشايخ"
            subtitle="الوصول إلى المشايخ والدروس المرتبطة بهم."
            items={SCHOLAR_ITEMS}
            moreHref="/lessons"
          />
        </SafeHomeSection>

        <SafeHomeSection name="القرآن الكريم" band="odd">
          <HomeContentRail
            kicker="الكتاب العزيز"
            title="القرآن الكريم"
            subtitle="قراءة وتجويد وقصص السور."
            items={QURAN_ITEMS}
            moreHref="/quran"
          />
        </SafeHomeSection>

        <SafeHomeSection name="الأذكار" band="even">
          <HomeContentRail
            kicker="العبادة اليومية"
            title="الأذكار"
            subtitle="أوراد يومية وعداد تسبيح."
            items={ADHKAR_ITEMS}
            moreHref="/adhkar"
          />
        </SafeHomeSection>

        <SafeHomeSection name="الأسئلة الشرعية" band="odd">
          <HomeContentRail
            kicker="فتاوى وأسئلة"
            title="الأسئلة الشرعية"
            subtitle="أسئلة وأجوبة مصنّفة."
            items={QA_ITEMS}
            moreHref="/qa"
          />
        </SafeHomeSection>

        <SafeHomeSection name="الفوائد" band="even">
          <HomeContentRail
            kicker="لطائف علمية"
            title="الفوائد"
            subtitle="فوائد مختصرة لطالب العلم."
            items={FAWAID_ITEMS}
            moreHref="/fawaid"
          />
        </SafeHomeSection>

        <SafeHomeSection name="المكتبة" band="odd">
          <HomeContentRail
            kicker="مراجع"
            title="المكتبة"
            subtitle="كتب ومتون ومسارات علمية."
            items={LIBRARY_ITEMS}
            moreHref="/library"
          />
        </SafeHomeSection>

        <SafeHomeSection name="الإذاعات والبث" band="even">
          <HomeMediaSection />
        </SafeHomeSection>

        <SafeHomeSection name="التقويم" band="odd">
          <HomeCalendarSection />
        </SafeHomeSection>

        <SafeHomeSection name="آخر الإضافات" band="even">
          <HomeLatestUpdates />
        </SafeHomeSection>
      </main>
    </div>
  );
}
