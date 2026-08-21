import "@/styles/components/app-start.css";

type Props = {
  onStart: () => void;
};

/** شاشة بدء واحدة: شعار، عنوان، وصف، زر. بلا صلاحيات. */
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
        <h1 id="app-start-title" className="app-start__title">
          المجلس العلمي
        </h1>
        <p className="app-start__desc">علم شرعي موثوق في مكان واحد</p>
        <button type="button" className="app-start__btn" onClick={onStart}>
          ابدأ الآن
        </button>
      </div>
    </div>
  );
}
