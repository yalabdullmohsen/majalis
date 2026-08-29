import { useCallback, type ReactNode } from "react";
import { firstVisitIntroConfig } from "@/config/first-visit-intro";
import "@/styles/components/first-visit-intro.css";

type SectionCard = {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
};

/** أيقونات SVG مضمّنة — بلا lucide في مسار أول زيارة (LCP). */
function IntroIcon({ d }: { d: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const INTRO_SECTIONS: SectionCard[] = [
  {
    id: "quran",
    title: "القرآن الكريم",
    description: "قراءة المصحف، التفسير، والتلاوة.",
    icon: <IntroIcon d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5zM12 6v12" />,
  },
  {
    id: "lessons",
    title: "الدروس",
    description: "دروس ودورات علمية مرتبة.",
    icon: <IntroIcon d="M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5" />,
  },
  {
    id: "fiqh",
    title: "الفقه",
    description: "مسائل فقهية منظمة حسب الأبواب.",
    icon: <IntroIcon d="M12 3v18M5 8h14M7 8c0 4 2.5 7 5 9 2.5-2 5-5 5-9M9 21h6" />,
  },
  {
    id: "prayer",
    title: "الصلاة",
    description: "مواقيت الصلاة والتنبيهات.",
    icon: <IntroIcon d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />,
  },
  {
    id: "sections",
    title: "الأقسام",
    description: "قصص الأنبياء، السيرة، الأذكار، والأحاديث.",
    icon: <IntroIcon d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" />,
  },
];

type Props = {
  onContinue: () => void;
};

export function FirstVisitIntro({ onContinue }: Props) {
  const handleContinue = useCallback(() => {
    onContinue();
  }, [onContinue]);

  if (!firstVisitIntroConfig.enabled) return null;

  return (
    <div className="first-visit-intro" role="region" aria-label="مرحبًا بك في سُنّة">
      <div className="first-visit-intro__inner">
        <header className="first-visit-intro__hero">
          <p className="first-visit-intro__badge">سُنّة</p>
          <h1 className="first-visit-intro__title">مرحبًا بك في سُنّة</h1>
          <p className="first-visit-intro__lead">
            منصة تجمع القرآن، الدروس، الفقه، الصلاة، والأقسام العلمية في مكان واحد.
          </p>
        </header>

        <ul className="first-visit-intro__cards" aria-label="أقسام التطبيق">
          {INTRO_SECTIONS.map(({ id, title, description, icon }) => (
            <li key={id} className="first-visit-intro__card">
              <span className="first-visit-intro__card-icon" aria-hidden="true">
                {icon}
              </span>
              <div className="first-visit-intro__card-body">
                <h2 className="first-visit-intro__card-title">{title}</h2>
                <p className="first-visit-intro__card-desc">{description}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="first-visit-intro__actions">
          <button type="button" className="first-visit-intro__btn first-visit-intro__btn--primary" onClick={handleContinue}>
            ابدأ الآن
          </button>
          <button type="button" className="first-visit-intro__btn first-visit-intro__btn--ghost" onClick={handleContinue}>
            تصفح مباشرة
          </button>
        </div>
      </div>
    </div>
  );
}
