import { useCallback } from "react";
import {
  BookOpen,
  GraduationCap,
  LayoutGrid,
  MoonStar,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { firstVisitIntroConfig } from "@/config/first-visit-intro";
import "@/styles/components/first-visit-intro.css";

type SectionCard = {
  id: string;
  title: string;
  description: string;
  Icon: LucideIcon;
};

const INTRO_SECTIONS: SectionCard[] = [
  {
    id: "quran",
    title: "القرآن",
    description: "قراءة المصحف، التفسير، والتلاوة.",
    Icon: BookOpen,
  },
  {
    id: "lessons",
    title: "الدروس",
    description: "دروس ودورات علمية مرتبة.",
    Icon: GraduationCap,
  },
  {
    id: "fiqh",
    title: "الفقه",
    description: "مسائل فقهية منظمة حسب الأبواب.",
    Icon: Scale,
  },
  {
    id: "prayer",
    title: "الصلاة",
    description: "مواقيت الصلاة والتنبيهات.",
    Icon: MoonStar,
  },
  {
    id: "sections",
    title: "الأقسام",
    description: "قصص الأنبياء، السيرة، الأذكار، والأحاديث.",
    Icon: LayoutGrid,
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
    <div className="first-visit-intro" role="region" aria-label="مرحبًا بك في المجلس العلمي">
      <div className="first-visit-intro__inner">
        <header className="first-visit-intro__hero">
          <p className="first-visit-intro__badge">المجلس العلمي</p>
          <h1 className="first-visit-intro__title">مرحبًا بك في المجلس العلمي</h1>
          <p className="first-visit-intro__lead">
            منصة تجمع القرآن، الدروس، الفقه، الصلاة، والأقسام العلمية في مكان واحد.
          </p>
        </header>

        <ul className="first-visit-intro__cards" aria-label="أقسام التطبيق">
          {INTRO_SECTIONS.map(({ id, title, description, Icon }) => (
            <li key={id} className="first-visit-intro__card">
              <span className="first-visit-intro__card-icon" aria-hidden="true">
                <Icon size={22} strokeWidth={1.75} />
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
