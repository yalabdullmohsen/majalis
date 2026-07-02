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
import { HomeLearningSeasonsWidget } from "@/components/home/HomeLearningSeasonsWidget";
import { HomeRecommendations } from "@/components/home/HomeRecommendations";
import { IslamicDivider } from "@/components/design/IslamicDivider";
import { IslamicOrnament } from "@/components/design/IslamicOrnament";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import { HomeAdhanWidget } from "@/components/home/HomeAdhanWidget";
import { HomeContinueReading } from "@/components/home/HomeContinueReading";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

const QUICK_LINKS = [
  { href: "/quran", label: "القرآن", meta: "مصحف وتلاوة" },
  { href: "/lessons", label: "الدروس", meta: "أحدث وقادمة" },
  { href: "/qa", label: "الأسئلة التعليمية", meta: "فتاوى وإجابات" },
  { href: "/rulings", label: "الأحكام", meta: "موسوعة شرعية" },
  { href: "/library", label: "المكتبة", meta: "كتب ومتون" },
  { href: "/fawaid", label: "الفوائد", meta: "مختصرات" },
  { href: "/hadith", label: "الأحاديث", meta: "موثقة" },
  { href: "/stories", label: "القصص", meta: "إسلامية" },
  { href: "/search", label: "البحث", meta: "ذكي" },
  { href: "/assistant", label: "المساعد", meta: "علمي" },
  { href: "/calendar", label: "التقويم", meta: "دروس" },
  { href: "/adhkar", label: "الأذكار", meta: "يومي" },
  { href: "/muezzins", label: "مكتبة المؤذنين", meta: "أذانات العالم" },
  { href: "/upload", label: "ارفع أذانك", meta: "ساهم معنا" },
  { href: "/submit?type=lesson", label: "أضف درس", meta: "شارك علمك" },
  { href: "/learning-plan", label: "خطة التعلّم", meta: "مسار شخصي" },
  { href: "/flashcards", label: "البطاقات", meta: "مراجعة ذكية" },
  { href: "/car-mode", label: "وضع السيارة", meta: "صوتيات أثناء القيادة" },
  { href: "/mosque-mode", label: "وضع المسجد", meta: "وصول سريع" },
  { href: "/study-room", label: "غرفة الدراسة", meta: "مؤقت Pomodoro" },
  { href: "/family", label: "الوضع العائلي", meta: "تابع أبناءك" },
  { href: "/vault", label: "المحفظة العلمية", meta: "محفوظاتك وملاحظاتك" },
  { href: "/researcher", label: "ملف الباحث", meta: "سيرتك البحثية" },
  { href: "/institutions", label: "دليل المؤسسات", meta: "مساجد وجامعات" },
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

      <section className="home-hero home-hero--v3">
        <div className="home-container home-hero-grid home-hero-grid--v3">
          <div className="home-hero-copy home-hero-copy--v3">
            <img
              src="/logo.png"
              alt="المجلس العلمي"
              className="home-hero-logo"
              width={72}
              height={72}
              loading="eager"
              decoding="async"
            />
            <h1 className="home-hero-title home-hero-title--v3">المجلس العلمي</h1>
            <p className="home-hero-lead home-hero-lead--v3">
              دروس وفتاوى وقرآن ومحتوى موثّق في منصة واحدة.
            </p>
            <form onSubmit={submitSearch} className="home-search home-search--v3" aria-label="البحث">
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="ابحث في المنصة..."
              />
              <button type="submit">بحث</button>
            </form>
          </div>
        </div>
        <IslamicOrnament
          className="islamic-ornament-strip"
          style={{ color: "rgba(176, 141, 46, 0.55)", position: "relative", zIndex: 2 }}
        />
      </section>

      <main className="home-container home-main home-main--v3">
        <SafeHomeSection name="لعبة الأسئلة">
          <HomeQuizCard />
        </SafeHomeSection>

        <IslamicDivider />

        <SafeHomeSection name="مواقيت الصلاة المدمجة">
          <HomeCompactPrayer />
        </SafeHomeSection>

        <IslamicDivider />

        <SafeHomeSection name="ويدجت الأذان">
          <HomeAdhanWidget />
        </SafeHomeSection>

        <IslamicDivider />

        <SafeHomeSection name="تابع من حيث توقفت">
          <HomeContinueReading />
        </SafeHomeSection>

        <SafeHomeSection name="توصيات مخصصة">
          <HomeRecommendations />
        </SafeHomeSection>

        <SafeHomeSection name="أحدث الدروس">
          <HomeUpcomingLessons initialLessons={initialFeaturedLessons} />
        </SafeHomeSection>

        <IslamicDivider />

        <SafeHomeSection name="مواسم التعلّم">
          <HomeLearningSeasonsWidget />
        </SafeHomeSection>

        <IslamicDivider />

        {/* بطاقة لعبة سؤال وجواب */}
        <section className="home-section ds-section">
          <Link href="/quiz" style={{ textDecoration: "none", display: "block" }}>
            <div style={{
              background: "#fff",
              border: "1px solid var(--ds-line-color)",
              borderRadius: "var(--ds-radius-lg, 0.625rem)",
              padding: "1.25rem 1.5rem",
              boxShadow: "var(--ds-shadow-sm)",
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
              transition: "box-shadow 0.15s, border-color 0.15s",
              borderRight: "4px solid var(--majalis-brass)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--ds-shadow)";
              (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(176,141,46,0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--ds-shadow-sm)";
              (e.currentTarget as HTMLDivElement).style.borderColor = "var(--ds-line-color)";
            }}
            >
              <div style={{ fontSize: "2.5rem", flexShrink: 0 }}>🕌</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: 800, color: "var(--ds-emerald-deep)" }}>
                  لعبة سؤال وجواب الإسلامية
                </p>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--majalis-ink-soft, #5c564c)", lineHeight: 1.5 }}>
                  تنافس مع فريقك في أسئلة القرآن والحديث والفقه والتاريخ الإسلامي
                </p>
              </div>
              <span style={{
                flexShrink: 0,
                padding: "0.45rem 1.1rem",
                background: "var(--ds-emerald)",
                color: "#fff",
                borderRadius: "var(--ds-radius, 0.5rem)",
                fontSize: "0.82rem",
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}>
                ابدأ اللعب ←
              </span>
            </div>
          </Link>
        </section>

        <IslamicDivider />

        <SafeHomeSection name="الدورات">
          <HomeUpcomingCourses />
        </SafeHomeSection>

        <IslamicDivider />

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

        <section className="home-daily-row">
          <SafeHomeSection name="ذكر اليوم">
            <HomeDailyDhikr />
          </SafeHomeSection>
          <SafeHomeSection name="حديث اليوم">
            <HomeDailyHadith />
          </SafeHomeSection>
          <SafeHomeSection name="سؤال اليوم">
            <HomeDailyQuestion />
          </SafeHomeSection>
          <SafeHomeSection name="فائدة اليوم">
            <HomeDailyFaida />
          </SafeHomeSection>
        </section>

        <IslamicDivider />

        <div className="home-prayer-row">
          <SafeHomeSection name="مواقيت الصلاة">
            <HomePrayerTimes />
          </SafeHomeSection>
          <SafeHomeSection name="مراتب الصلاة">
            <HomePrayerRanks />
          </SafeHomeSection>
        </div>

        <IslamicDivider />


        <SafeHomeSection name="المكتبة">
          <HomeFeaturedLibrary />
        </SafeHomeSection>

        <IslamicDivider />

        <SafeHomeSection name="آخر التحديثات">
          <HomeLatestUpdates />
        </SafeHomeSection>

        <IslamicDivider />

        <SafeHomeSection name="عن المجلس العلمي">
          <HomeAboutSection />
        </SafeHomeSection>

        <IslamicDivider />

        <SafeHomeSection name="المزيد من الأقسام">
          <HomeMoreSections />
        </SafeHomeSection>
      </main>
    </div>
  );
}
