"use client";

import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeUpcomingLessons } from "@/components/home/HomeUpcomingLessons";
import { HomeUpcomingCourses } from "@/components/home/HomeUpcomingCourses";
import { HomePrayerTimes } from "@/components/home/HomePrayerTimes";
import { HomeDailyFaida } from "@/components/home/HomeDailyFaida";
import { HomeDailyDhikr } from "@/components/home/HomeDailyDhikr";
import { HomeDailyHadith } from "@/components/home/HomeDailyHadith";
import { HomeDailyQuestion } from "@/components/home/HomeDailyQuestion";
import { HomeHeroBanner } from "@/components/home/HomeHeroBanner";
import { HomeSunnahByTime } from "@/components/home/HomeSunnahByTime";
import { HomeFeatureCards } from "@/components/home/HomeFeatureCards";
import { HomeDailyProgress } from "@/components/home/HomeDailyProgress";
import { HomeMoreSections } from "@/components/home/HomeMoreSections";
import { HomeIslamicOccasions } from "@/components/home/HomeIslamicOccasions";
import { HomeLatestUpdates } from "@/components/home/HomeLatestUpdates";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";

function HomeContentRail({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: { title: string; href: string; meta: string; summary: string }[];
}) {
  return (
    <section className="home-section home-content-rail">
      <div className="home-section-head">
        <div>
          <p className="home-section-kicker">المحتوى العلمي</p>
          <h2 className="home-section-title">{title}</h2>
          <p className="home-section-subtitle">{subtitle}</p>
        </div>
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

function SafeHomeSection({ name, children }: { name: string; children: React.ReactNode }) {
  return <SectionErrorBoundary name={name}>{children}</SectionErrorBoundary>;
}

const LECTURE_ITEMS = [
  { title: "محاضرات الأسبوع", href: "/lessons?type=lecture", meta: "محاضرات", summary: "مختارات صوتية ومرئية مرتبة حسب التاريخ والشيخ." },
  { title: "محاضرات العقيدة", href: "/search/محاضرة عقيدة", meta: "العقيدة", summary: "مواد موثقة في أصول الاعتقاد والتوحيد." },
  { title: "محاضرات الآداب", href: "/search/محاضرة آداب", meta: "التزكية", summary: "محاضرات نافعة في السلوك والآداب." },
];

const KHUTBA_ITEMS = [
  { title: "خطب الجمعة", href: "/search/خطبة الجمعة", meta: "الخطب", summary: "موضوعات جاهزة للخطباء والدعاة مع مصادر داخلية." },
  { title: "خطب المناسبات", href: "/occasions", meta: "المواسم", summary: "ربط الخطب بالمناسبات الإسلامية والتقويم." },
  { title: "مواد الخطباء", href: "/library", meta: "المكتبة", summary: "كتب ومتون ومواد مساعدة لإعداد الخطب." },
];

const SCHOLAR_ITEMS = [
  { title: "المشايخ والدروس", href: "/lessons", meta: "المشايخ", summary: "تصفّح الدروس حسب الشيخ والسلسلة والتصنيف." },
  { title: "مسارات التعلم", href: "/learning/paths", meta: "تعلم", summary: "مسارات منظمة لطالب العلم من المبتدئ للمتقدم." },
  { title: "المساعد العلمي", href: "/assistant", meta: "AI", summary: "بحث موثق داخل قاعدة معرفة المجلس العلمي." },
];

const LIBRARY_ITEMS = [
  { title: "المكتبة العلمية", href: "/library", meta: "كتب", summary: "كتب ومتون وروابط بحث داخل المنصة." },
  { title: "كتب التفسير", href: "/search/تفسير", meta: "تفسير", summary: "روابط بحث في كتب التفسير المعتمدة." },
  { title: "متون ودروس", href: "/learning/paths", meta: "مسارات", summary: "ربط المكتبة بالمسارات التعليمية." },
];

const QURAN_ITEMS = [
  { title: "المصحف الشريف", href: "/quran", meta: "قراءة", summary: "114 سورة بالرسم العثماني مع تلاوات وتفسير." },
  { title: "علم التجويد", href: "/quran/tajweed", meta: "تجويد", summary: "دروس التجويد مع أمثلة واختبارات." },
  { title: "قصص السور", href: "/quran/surah-stories", meta: "موسوعة", summary: "موسوعة قصص السور الموثقة." },
  { title: "البث المباشر", href: "/quran-live", meta: "بث", summary: "قنوات القرآن والحرمين الشريفين." },
  { title: "إذاعات القرآن", href: "/quran-radio", meta: "استماع", summary: "إذاعات الكويت والسعودية وغيرها." },
  { title: "الورد اليومي", href: "/daily-wird", meta: "متابعة", summary: "خطة قراءة يومية محفوظة محلياً." },
];

const HADITH_ITEMS = [
  { title: "الأربعون النووية", href: "/arbaeen-nawawi", meta: "حديث", summary: "أحاديث جامعة مع عرض منظم." },
  { title: "بحث في الحديث", href: "/search/حديث", meta: "بحث", summary: "ابحث في الأحاديث والشروح المرتبطة." },
  { title: "المساعد الموثق", href: "/assistant", meta: "استدلال", summary: "إجابات لا تنسب حديثاً بلا مصدر." },
];

const ADHKAR_ITEMS = [
  { title: "أذكار الصباح", href: "/adhkar?cat=morning", meta: "صباح", summary: "أذكار يومية موثقة مع التكرار." },
  { title: "أذكار المساء", href: "/adhkar?cat=evening", meta: "مساء", summary: "ورد المساء محفوظ وميسر." },
  { title: "عداد التسبيح", href: "/tasbih", meta: "Offline", summary: "أوراد متعددة وإحصاءات يومية." },
];

const QA_ITEMS = [
  { title: "الأسئلة الشرعية", href: "/qa", meta: "أسئلة", summary: "إجابات مصنفة مع مراجع وكلمات مفتاحية." },
  { title: "أسئلة الصلاة", href: "/qa?q=الصلاة", meta: "الصلاة", summary: "مسائل الصلاة والوضوء والخشوع." },
  { title: "أسئلة العقيدة", href: "/qa?q=العقيدة", meta: "العقيدة", summary: "أسئلة التوحيد والإيمان." },
];

const FAWAID_ITEMS = [
  { title: "الفوائد العلمية", href: "/fawaid", meta: "فوائد", summary: "فوائد مختصرة قابلة للمراجعة والحفظ." },
  { title: "فوائد القرآن", href: "/search/فوائد القرآن", meta: "قرآن", summary: "لطائف وفوائد مرتبطة بالآيات." },
  { title: "فوائد الحديث", href: "/search/فوائد الحديث", meta: "حديث", summary: "فوائد مستنبطة من السنة." },
];

const WORSHIP_TOOLS_ITEMS = [
  { title: "مواقيت الصلاة", href: "/prayer-times", meta: "الصلاة", summary: "مواقيت وعدّاد وتتبع يومي." },
  { title: "مراتب الناس في الصلاة", href: "/prayer-ranks", meta: "تربية", summary: "مراتب الخشوع وحضور القلب." },
  { title: "القبلة", href: "/qibla", meta: "أداة", summary: "تحديد اتجاه القبلة بسهولة." },
];

const SEARCH_ASSISTANT_ITEMS = [
  { title: "محرك البحث الذكي", href: "/search", meta: "بحث", summary: "بحث عربي في الدروس والأسئلة والكتب والأحاديث." },
  { title: "المساعد الشرعي", href: "/assistant", meta: "AI", summary: "إجابة مختصرة ثم تفصيل مع المصادر عند توفرها." },
];

import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

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

      <section className="home-hero home-hero--v3">
        <div className="home-hero-pattern" aria-hidden="true" />
        <div className="home-container home-hero-grid home-hero-grid--v3">
          <div className="home-hero-copy home-hero-copy--v3">
            <div className="home-hero-logo-card">
              <img
                src="/logo.png"
                alt="المجلس العلمي"
                className="home-hero-logo"
                width={96}
                height={96}
                loading="eager"
                decoding="async"
              />
            </div>
            <p className="home-kicker home-kicker--v3">المنصة العلمية الشرعية</p>
            <h1 className="home-hero-title home-hero-title--v3">المجلس العلمي</h1>
            <p className="home-hero-lead home-hero-lead--v3">
              منصة علمية شرعية تجمع الدروس والفتاوى والقرارات والأذكار والمحتوى الموثّق في مكان واحد.
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
        <SafeHomeSection name="أحدث الدروس"><HomeUpcomingLessons initialLessons={initialFeaturedLessons} /></SafeHomeSection>
        <SafeHomeSection name="الدورات العلمية"><HomeUpcomingCourses /></SafeHomeSection>
        <SafeHomeSection name="المحاضرات"><HomeContentRail title="المحاضرات" subtitle="مختارات حديثة للدروس والمحاضرات الصوتية والمرئية." items={LECTURE_ITEMS} /></SafeHomeSection>
        <SafeHomeSection name="المشايخ"><HomeContentRail title="المشايخ" subtitle="الوصول إلى العلماء والمشايخ والدروس المرتبطة بهم." items={SCHOLAR_ITEMS} /></SafeHomeSection>
        <SafeHomeSection name="القرآن"><HomeContentRail title="القرآن الكريم" subtitle="مصحف — تجويد — تلاوات — بث — إذاعات." items={QURAN_ITEMS} /></SafeHomeSection>
        <SafeHomeSection name="المكتبة"><HomeContentRail title="المكتبة" subtitle="كتب ومتون ومسارات علمية." items={LIBRARY_ITEMS} /></SafeHomeSection>
        <SafeHomeSection name="الفوائد"><HomeContentRail title="الفوائد" subtitle="فوائد مختصرة ومنظمة لطالب العلم." items={FAWAID_ITEMS} /></SafeHomeSection>
        <SafeHomeSection name="الأسئلة الشرعية"><HomeContentRail title="الأسئلة الشرعية" subtitle="أسئلة وأجوبة موثقة ومصنفة." items={QA_ITEMS} /></SafeHomeSection>
        <SafeHomeSection name="أدوات العبادة"><HomeContentRail title="أدوات العبادة" subtitle="أدوات عملية للمتابعة اليومية." items={WORSHIP_TOOLS_ITEMS} /></SafeHomeSection>
        <SafeHomeSection name="مواقيت الصلاة"><HomePrayerTimes /></SafeHomeSection>
        <SafeHomeSection name="ذكر اليوم"><HomeDailyDhikr /></SafeHomeSection>
        <SafeHomeSection name="سؤال اليوم"><HomeDailyQuestion /></SafeHomeSection>
        <SafeHomeSection name="فائدة اليوم"><HomeDailyFaida /></SafeHomeSection>
        <SafeHomeSection name="الأحاديث"><HomeContentRail title="الأحاديث" subtitle="الأحاديث والشروح والبحث في السنة." items={HADITH_ITEMS} /></SafeHomeSection>
        <SafeHomeSection name="الأذكار"><HomeContentRail title="الأذكار" subtitle="أوراد يومية وعداد تسبيح احترافي." items={ADHKAR_ITEMS} /></SafeHomeSection>
        <SafeHomeSection name="الخطب"><HomeContentRail title="الخطب" subtitle="محتوى عملي للخطباء والدعاة." items={KHUTBA_ITEMS} /></SafeHomeSection>
        <SafeHomeSection name="البحث والمساعد"><HomeContentRail title="البحث والمساعد" subtitle="بحث ذكي ومساعد شرعي مقيد بالمصادر." items={SEARCH_ASSISTANT_ITEMS} /></SafeHomeSection>
        <SafeHomeSection name="حديث اليوم"><HomeDailyHadith /></SafeHomeSection>
        <SafeHomeSection name="تقدمك اليومي"><HomeDailyProgress /></SafeHomeSection>
        <SafeHomeSection name="روابط سريعة"><HomeFeatureCards /></SafeHomeSection>
        <SafeHomeSection name="بقية الأقسام"><HomeMoreSections /></SafeHomeSection>
        <SafeHomeSection name="سنن اليوم"><HomeSunnahByTime /></SafeHomeSection>
        <SafeHomeSection name="المساعد"><HomeHeroBanner /></SafeHomeSection>
        <SafeHomeSection name="المناسبات"><HomeIslamicOccasions /></SafeHomeSection>
        <SafeHomeSection name="آخر التحديثات"><HomeLatestUpdates /></SafeHomeSection>
      </main>
    </div>
  );
}
