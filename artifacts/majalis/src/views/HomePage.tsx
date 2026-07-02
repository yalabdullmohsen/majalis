"use client";

import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { SectionErrorBoundary } from "@/components/ErrorBoundary";
import { HomeUpcomingLessons } from "@/components/home/HomeUpcomingLessons";
import { HomeUpcomingCourses } from "@/components/home/HomeUpcomingCourses";
import { HomeCompactPrayer } from "@/components/home/HomeCompactPrayer";
import { HomeQuizCard } from "@/components/home/HomeQuizCard";
import { HomeAboutSection } from "@/components/home/HomeAboutSection";
import { HomeDailyFaida } from "@/components/home/HomeDailyFaida";
import { HomeDailyDhikr } from "@/components/home/HomeDailyDhikr";
import { HomeDailyQuestion } from "@/components/home/HomeDailyQuestion";
import { HomeDailyHadith } from "@/components/home/HomeDailyHadith";
import { HomePrayerRanks } from "@/components/home/HomePrayerRanks";
import { HomePrayerTimes } from "@/components/home/HomePrayerTimes";
import { HomeFeaturedLibrary } from "@/components/home/HomeFeaturedLibrary";
import { HomeLatestUpdates } from "@/components/home/HomeLatestUpdates";
import { HomeMoreSections } from "@/components/home/HomeMoreSections";
import { HomeTawheed } from "@/components/home/HomeTawheed";
import { HomeLearningSeasonsWidget } from "@/components/home/HomeLearningSeasonsWidget";
import { HomeRecommendations } from "@/components/home/HomeRecommendations";
import { IslamicDivider } from "@/components/design/IslamicDivider";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import { HomeAdhanWidget } from "@/components/home/HomeAdhanWidget";
import { HomeContinueReading } from "@/components/home/HomeContinueReading";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";
import { Search } from "lucide-react";

const QUICK_LINKS = [
  { href: "/quran",     label: "القرآن",            meta: "مصحف وتلاوة" },
  { href: "/qa",        label: "الأسئلة التعليمية", meta: "فتاوى وإجابات" },
  { href: "/rulings",   label: "الأحكام",           meta: "موسوعة شرعية" },
  { href: "/library",   label: "المكتبة",           meta: "كتب ومتون" },
  { href: "/fawaid",    label: "الفوائد",           meta: "مختصرات" },
  { href: "/hadith",    label: "الأحاديث",          meta: "موثّقة" },
  { href: "/stories",   label: "القصص",             meta: "إسلامية" },
  { href: "/adhkar",    label: "الأذكار",           meta: "يومي" },
  { href: "/miracles",  label: "الإعجاز العلمي",   meta: "علم وإيمان" },
  { href: "/fatwa",     label: "الفتاوى",           meta: "شرعية" },
  { href: "/tasbih",    label: "التسبيح",           meta: "عداد" },
  { href: "/prayer-times", label: "الصلاة",        meta: "مواقيت" },
  { href: "/calendar",  label: "التقويم",           meta: "دروس" },
  { href: "/quiz",      label: "المسابقات",         meta: "اختبر نفسك" },
  { href: "/search",    label: "البحث",             meta: "ذكي" },
  { href: "/assistant", label: "المساعد",           meta: "علمي" },
];

function SafeHomeSection({ name, children }: { name: string; children: React.ReactNode }) {
  return <SectionErrorBoundary name={name}>{children}</SectionErrorBoundary>;
}

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

      {/* شريط البحث المدمج — بدون Hero ضخم */}
      <div className="home-search-strip">
        <form onSubmit={submitSearch} className="home-search-compact" aria-label="البحث">
          <Search size={16} className="home-search-compact__icon" aria-hidden="true" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="ابحث في المنصة..."
            aria-label="البحث في المنصة"
          />
          <button type="submit">بحث</button>
        </form>
      </div>

      <main className="home-container home-main home-main--v3">

        {/* 1. أحدث الدروس — أهم محتوى للزوار */}
        <SafeHomeSection name="أحدث الدروس">
          <HomeUpcomingLessons initialLessons={initialFeaturedLessons} />
        </SafeHomeSection>

        <IslamicDivider />

        {/* 2. مواقيت الصلاة المدمجة */}
        <SafeHomeSection name="مواقيت الصلاة المدمجة">
          <HomeCompactPrayer />
        </SafeHomeSection>

        <IslamicDivider />

        {/* 3. لعبة سؤال وجواب */}
        <SafeHomeSection name="لعبة الأسئلة">
          <HomeQuizCard />
        </SafeHomeSection>

        <IslamicDivider />

        {/* 4. ذكر وحديث اليوم */}
        <section className="home-daily-row">
          <SafeHomeSection name="ذكر اليوم">
            <HomeDailyDhikr />
          </SafeHomeSection>
          <SafeHomeSection name="حديث اليوم">
            <HomeDailyHadith />
          </SafeHomeSection>
        </section>

        <IslamicDivider />

        {/* 5. أقسام المنصة — شبكة روابط سريعة */}
        <section className="home-section ds-section">
          <div className="ds-section__head">
            <h2 className="ds-section__title">أقسام المنصة</h2>
            <Link href="/settings" className="ds-section__link">
              الإعدادات
            </Link>
          </div>
          <div className="home-quick-grid">
            {QUICK_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="home-quick-link">
                {item.label}
                <span>{item.meta}</span>
              </Link>
            ))}
          </div>
        </section>

        <IslamicDivider />

        {/* 6. الدورات العلمية */}
        <SafeHomeSection name="الدورات">
          <HomeUpcomingCourses />
        </SafeHomeSection>

        <IslamicDivider />

        {/* 7. سؤال وفائدة اليوم */}
        <section className="home-daily-row">
          <SafeHomeSection name="سؤال اليوم">
            <HomeDailyQuestion />
          </SafeHomeSection>
          <SafeHomeSection name="فائدة اليوم">
            <HomeDailyFaida />
          </SafeHomeSection>
        </section>

        <IslamicDivider />

        {/* 8. المكتبة المميزة */}
        <SafeHomeSection name="المكتبة">
          <HomeFeaturedLibrary />
        </SafeHomeSection>

        <IslamicDivider />

        {/* 9. آخر التحديثات */}
        <SafeHomeSection name="آخر التحديثات">
          <HomeLatestUpdates />
        </SafeHomeSection>

        <IslamicDivider />

        {/* 10. مواقيت الصلاة كاملة + مراتب */}
        <div className="home-prayer-row">
          <SafeHomeSection name="مواقيت الصلاة">
            <HomePrayerTimes />
          </SafeHomeSection>
          <SafeHomeSection name="مراتب الصلاة">
            <HomePrayerRanks />
          </SafeHomeSection>
        </div>

        <IslamicDivider />

        {/* 11. ويدجت الأذان */}
        <SafeHomeSection name="ويدجت الأذان">
          <HomeAdhanWidget />
        </SafeHomeSection>

        <IslamicDivider />

        {/* 12. تابع من حيث توقفت + توصيات */}
        <SafeHomeSection name="تابع من حيث توقفت">
          <HomeContinueReading />
        </SafeHomeSection>

        <SafeHomeSection name="توصيات مخصصة">
          <HomeRecommendations />
        </SafeHomeSection>

        <IslamicDivider />

        {/* 13. مواسم التعلّم */}
        <SafeHomeSection name="مواسم التعلّم">
          <HomeLearningSeasonsWidget />
        </SafeHomeSection>

        <IslamicDivider />

        {/* 14. عن المنصة + التوحيد */}
        <SafeHomeSection name="عن المجلس العلمي">
          <HomeAboutSection />
        </SafeHomeSection>

        <IslamicDivider />

        <SafeHomeSection name="التوحيد">
          <HomeTawheed />
        </SafeHomeSection>

        <IslamicDivider />

        {/* 15. المزيد من الأقسام */}
        <SafeHomeSection name="المزيد من الأقسام">
          <HomeMoreSections />
        </SafeHomeSection>
      </main>
    </div>
  );
}
