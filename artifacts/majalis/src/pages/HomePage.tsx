import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
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
  { title: "الفوائد", href: "/fawaid", meta: "فوائد", summary: "فوائد مختصرة قابلة للمراجعة والحفظ." },
  { title: "الأسئلة والأجوبة", href: "/qa", meta: "أسئلة", summary: "إجابات مصنفة مع المراجع والكلمات المفتاحية." },
];

const QURAN_ITEMS = [
  { title: "القرآن الكريم", href: "/quran", meta: "قراءة", summary: "سور القرآن مع بيانات علمية وروابط تفسير." },
  { title: "إذاعة القرآن", href: "/quran-radio", meta: "استماع", summary: "بث مباشر لتلاوات القرآن الكريم." },
  { title: "الورد اليومي", href: "/daily-wird", meta: "متابعة", summary: "خطة قراءة يومية محفوظة محلياً." },
];

export default function HomePage() {
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
        <HomeUpcomingLessons />
        <HomeUpcomingCourses />
        <HomeContentRail title="المحاضرات" subtitle="مختارات حديثة للدروس والمحاضرات الصوتية والمرئية." items={LECTURE_ITEMS} />
        <HomeContentRail title="الخطب" subtitle="محتوى عملي للخطباء والدعاة مرتب حسب الموضوع والموسم." items={KHUTBA_ITEMS} />
        <HomeContentRail title="المشايخ" subtitle="الوصول إلى العلماء والمشايخ والدروس المرتبطة بهم." items={SCHOLAR_ITEMS} />
        <HomeContentRail title="المكتبة والفوائد والأسئلة" subtitle="محتوى معرفي موثق قبل الخدمات والأدوات." items={LIBRARY_ITEMS} />
        <HomeDailyFaida />
        <HomeDailyQuestion />
        <HomeContentRail title="القرآن الكريم" subtitle="قراءة وتدبر واستماع مع روابط تفسير." items={QURAN_ITEMS} />
        <HomeLatestUpdates />
        <HomePrayerTimes />
        <HomeDailyDhikr />
        <HomeDailyHadith />
        <HomeDailyProgress />
        <HomeFeatureCards />
        <HomeMoreSections />
        <HomeSunnahByTime />
        <HomeHeroBanner />
        <HomeIslamicOccasions />
      </main>
    </div>
  );
}
