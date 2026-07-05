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
import { HomeFeaturedLibrary } from "@/components/home/HomeFeaturedLibrary";
import { HomeLatestUpdates } from "@/components/home/HomeLatestUpdates";
import { HomeMoreSections } from "@/components/home/HomeMoreSections";
import { HomeTawheed } from "@/components/home/HomeTawheed";
import { HomeLearningSeasonsWidget } from "@/components/home/HomeLearningSeasonsWidget";
import { HomeRecommendations } from "@/components/home/HomeRecommendations";
import { IslamicDivider } from "@/components/design/IslamicDivider";
import { IslamicOrnament } from "@/components/design/IslamicOrnament";
import { getSiteSettings, isMaintenanceMode } from "@/lib/site-settings";
import { HomeAdhanWidget } from "@/components/home/HomeAdhanWidget";
import { HomeContinueReading } from "@/components/home/HomeContinueReading";
import { HijriSacredMonthBanner } from "@/components/HijriSacredMonthBanner";
import type { KuwaitLessonRecord } from "@/lib/kuwait-lessons";

function HomeQuranCirclesPreview() {
  return (
    <section className="home-section" aria-labelledby="circles-home-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">حفظ القرآن</p>
          <h2 id="circles-home-heading">حلقات التحفيظ</h2>
          <p>انضم لحلقة علمية متخصصة في حفظ القرآن ومراجعته.</p>
        </div>
        <Link href="/quran-circles" className="home-section-link">عرض الكل</Link>
      </div>
      <p style={{ color: "var(--majalis-ink-soft)", fontSize: "0.9rem", textAlign: "center", padding: "2rem 0" }}>
        🕌 سيتوفر هنا عرض للحلقات القادمة — تواصل مع الإدارة لإضافة حلقتك.
      </p>
    </section>
  );
}

const QUICK_LINKS = [
  { href: "/quran",        label: "القرآن",              meta: "مصحف وتلاوة" },
  { href: "/lessons",      label: "الدروس",              meta: "أحدث وقادمة" },
  { href: "/qa",           label: "الأسئلة التعليمية",   meta: "فتاوى وإجابات" },
  { href: "/rulings",      label: "الأحكام",             meta: "موسوعة شرعية" },
  { href: "/library",      label: "المكتبة",             meta: "كتب ومتون" },
  { href: "/fawaid",       label: "الفوائد",             meta: "مختصرات" },
  { href: "/hadith",       label: "الأحاديث",            meta: "موثقة" },
  { href: "/stories",      label: "القصص",               meta: "إسلامية" },
  { href: "/search",       label: "البحث",               meta: "ذكي" },
  { href: "/assistant",    label: "المساعد",             meta: "علمي" },
  { href: "/calendar",     label: "التقويم",             meta: "دروس" },
  { href: "/adhkar",       label: "الأذكار",             meta: "يومي" },
  { href: "/muezzins",     label: "مكتبة المؤذنين",      meta: "أذانات العالم" },
  { href: "/upload",       label: "ارفع أذانك",          meta: "ساهم معنا" },
  { href: "/submit?type=lesson", label: "أضف درس",      meta: "شارك علمك" },
  { href: "/learning-plan", label: "خطة التعلّم",       meta: "مسار شخصي" },
  { href: "/flashcards",   label: "البطاقات",            meta: "مراجعة ذكية" },
  { href: "/car-mode",     label: "وضع السيارة",         meta: "صوتيات أثناء القيادة" },
  { href: "/mosque-mode",  label: "وضع المسجد",          meta: "وصول سريع" },
  { href: "/study-room",   label: "غرفة الدراسة",        meta: "مؤقت Pomodoro" },
  { href: "/family",       label: "الوضع العائلي",       meta: "تابع أبناءك" },
  { href: "/vault",        label: "المحفظة العلمية",     meta: "محفوظاتك وملاحظاتك" },
  { href: "/researcher",   label: "ملف الباحث",          meta: "سيرتك البحثية" },
  { href: "/institutions", label: "دليل المؤسسات",       meta: "مساجد وجامعات" },
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
      <HijriSacredMonthBanner />
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
            <h1 className="home-hero-title home-hero-title--v3" aria-label="المجلس العلمي">
              <svg
                viewBox="0 0 600 220"
                aria-hidden="true"
                className="home-calligraphy-svg"
              >
                <defs>
                  <linearGradient id="hero-gold" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3d2405"/>
                    <stop offset="22%" stopColor="#966318"/>
                    <stop offset="48%" stopColor="#e8c040"/>
                    <stop offset="72%" stopColor="#b07c22"/>
                    <stop offset="100%" stopColor="#3d2405"/>
                  </linearGradient>
                  <linearGradient id="hero-gold-v" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f2d060"/>
                    <stop offset="100%" stopColor="#8a5c10"/>
                  </linearGradient>
                </defs>

                {/* Ivory card background */}
                <rect width="600" height="220" rx="18" fill="#FDFCF0"/>

                {/* Subtle center warmth */}
                <ellipse cx="300" cy="112" rx="240" ry="85" fill="#f8f0d8" opacity="0.45"/>

                {/* Islamic 8-pointed star — large, very faint watermark */}
                <g transform="translate(300,112)" opacity="0.07">
                  <polygon
                    points="0,-90 14.2,-34.4 63.6,-63.6 34.4,-14.2 90,0 34.4,14.2 63.6,63.6 14.2,34.4 0,90 -14.2,34.4 -63.6,63.6 -34.4,14.2 -90,0 -34.4,-14.2 -63.6,-63.6 -14.2,-34.4"
                    fill="#c8922a"
                  />
                </g>
                {/* Star outline, slightly more visible */}
                <g transform="translate(300,112)" opacity="0.1">
                  <polygon
                    points="0,-90 14.2,-34.4 63.6,-63.6 34.4,-14.2 90,0 34.4,14.2 63.6,63.6 14.2,34.4 0,90 -14.2,34.4 -63.6,63.6 -34.4,14.2 -90,0 -34.4,-14.2 -63.6,-63.6 -14.2,-34.4"
                    fill="none" stroke="#c8922a" strokeWidth="0.8"
                  />
                </g>

                {/* Horizontal gold rule lines */}
                <line x1="24" y1="112" x2="80" y2="112" stroke="#c8922a" strokeWidth="1.2" opacity="0.28"/>
                <line x1="520" y1="112" x2="576" y2="112" stroke="#c8922a" strokeWidth="1.2" opacity="0.28"/>
                {/* Small diamond tips */}
                <polygon points="83,112 77,107 77,117" fill="#c8922a" opacity="0.28"/>
                <polygon points="517,112 523,107 523,117" fill="#c8922a" opacity="0.28"/>

                {/* Main calligraphic text */}
                <text
                  x="300" y="152"
                  textAnchor="middle"
                  fontFamily="'Amiri', 'Scheherazade New', serif"
                  fontSize="90"
                  fill="url(#hero-gold)"
                  direction="rtl"
                  xmlLang="ar"
                >
                  المجلسُ العلميُّ
                </text>

                {/* Decorative emerald diacritics — left cluster */}
                <path d="M148,68 Q157,60 166,68" stroke="#164E3C" strokeWidth="2.8" fill="none" opacity="0.75" strokeLinecap="round"/>
                <circle cx="175" cy="55" r="4.5" fill="#164E3C" opacity="0.7"/>
                <circle cx="190" cy="64" r="3" fill="#164E3C" opacity="0.55"/>

                {/* Decorative emerald diacritics — right cluster */}
                <path d="M434,68 Q443,60 452,68" stroke="#164E3C" strokeWidth="2.8" fill="none" opacity="0.75" strokeLinecap="round"/>
                <circle cx="425" cy="55" r="4.5" fill="#164E3C" opacity="0.7"/>
                <circle cx="410" cy="64" r="3" fill="#164E3C" opacity="0.55"/>

                {/* Small sukoon dot above center */}
                <circle cx="300" cy="60" r="3" fill="#164E3C" opacity="0.45"/>
              </svg>
            </h1>
            <p className="home-hero-lead home-hero-lead--v3">
              دروس وفتاوى وقرآن ومحتوى موثّق في تطبيق واحد.
            </p>
            <form onSubmit={submitSearch} className="home-search home-search--v3" aria-label="البحث">
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="ابحث في التطبيق..."
                aria-label="البحث في التطبيق"
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

        {/* الدروس أولاً — أهم محتوى في التطبيق */}
        <SafeHomeSection name="أحدث الدروس">
          <HomeUpcomingLessons initialLessons={initialFeaturedLessons} />
        </SafeHomeSection>

        <IslamicDivider />

        {/* معاينة حلقات التحفيظ */}
        <SafeHomeSection name="حلقات التحفيظ">
          <HomeQuranCirclesPreview />
        </SafeHomeSection>

        <IslamicDivider />

        {/* مواقيت الصلاة — مصدر حقيقة واحد */}
        <SafeHomeSection name="مواقيت الصلاة المدمجة">
          <HomeCompactPrayer />
        </SafeHomeSection>

        <IslamicDivider />

        <SafeHomeSection name="تابع من حيث توقفت">
          <HomeContinueReading />
        </SafeHomeSection>

        <SafeHomeSection name="توصيات مخصصة">
          <HomeRecommendations />
        </SafeHomeSection>

        <IslamicDivider />

        <SafeHomeSection name="مواسم التعلّم">
          <HomeLearningSeasonsWidget />
        </SafeHomeSection>

        <IslamicDivider />

        {/* بطاقة خارطة طالب العلم */}
        <section className="home-section ds-section">
          <Link href="/learning-path" style={{ textDecoration: "none", display: "block" }}>
            <div style={{
              background: "linear-gradient(135deg, #064e3b, #065f46)",
              borderRadius: "var(--ds-radius-lg, 0.625rem)",
              padding: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "1.25rem",
              boxShadow: "var(--ds-shadow-sm)",
              transition: "box-shadow 0.15s",
              overflow: "hidden",
              position: "relative",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--ds-shadow)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--ds-shadow-sm)"; }}
            >
              <div style={{ fontSize: "2.8rem", flexShrink: 0 }}>🗺️</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 0.3rem", fontSize: "1.05rem", fontWeight: 800, color: "#fff" }}>
                  ابدأ طلب العلم — خارطة طالب العلم
                </p>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "#a7f3d0", lineHeight: 1.6 }}>
                  مسار علمي منظم في العقيدة والحديث والفقه والتفسير وغيرها،
                  كتاباً كتاباً من المبتدئ إلى المتقدم.
                </p>
              </div>
              <span style={{ flexShrink: 0, color: "#a7f3d0", fontSize: "1.2rem" }}>←</span>
            </div>
          </Link>
        </section>

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
            <h2 className="ds-section__title">أقسام التطبيق</h2>
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

        <SafeHomeSection name="مراتب الصلاة">
          <HomePrayerRanks />
        </SafeHomeSection>

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

        <SafeHomeSection name="التوحيد">
          <HomeTawheed />
        </SafeHomeSection>

        <IslamicDivider />

        <SafeHomeSection name="المزيد من الأقسام">
          <HomeMoreSections />
        </SafeHomeSection>

      </main>
    </div>
  );
}
