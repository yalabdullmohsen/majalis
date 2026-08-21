import "@/styles/components/app-start.css";

type Props = {
  onStart: () => void;
};

const FEATURES = [
  { title: "القرآن", desc: "مصحف واضح وتلاوة" },
  { title: "الفقه والدروس", desc: "مسائل مرتبة ودروس علمية" },
  { title: "البحث الشرعي", desc: "بحث في القرآن والفقه" },
  { title: "الأذكار والصلاة", desc: "أذكار يومية ومواقيت" },
] as const;

/** شاشة بدء واحدة: اسم، عنوان، وصف، أربع مميزات، زر ورابط. بلا صلاحيات. */
export function AppStartView({ onStart }: Props) {
  return (
    <div className="app-start" dir="rtl" role="dialog" aria-modal="true" aria-labelledby="app-start-title">
      <div className="app-start__inner">
        <div className="app-start__logo" aria-hidden="true">
          <svg viewBox="0 0 100 100" width="100%" height="100%">
            <g fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="miter">
              <rect x="25" y="25" width="50" height="50" />
              <rect x="25" y="25" width="50" height="50" transform="rotate(45 50 50)" />
            </g>
          </svg>
        </div>
        <p className="app-start__name">المجلس العلمي</p>
        <h1 id="app-start-title" className="app-start__title">
          علم شرعي موثوق في مكان واحد
        </h1>
        <p className="app-start__desc">
          قرآن، فقه، دروس، أذكار، ومواقيت صلاة بتجربة هادئة وسريعة.
        </p>
        <ul className="app-start__features">
          {FEATURES.map((f) => (
            <li key={f.title} className="app-start__feature">
              <strong>{f.title}</strong>
              <span>{f.desc}</span>
            </li>
          ))}
        </ul>
        <button type="button" className="app-start__btn" onClick={onStart}>
          ابدأ الآن
        </button>
        <button type="button" className="app-start__skip" onClick={onStart}>
          تصفح مباشرة
        </button>
      </div>
    </div>
  );
}
