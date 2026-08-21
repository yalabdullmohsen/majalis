import "@/styles/pages/app-first-launch.css";

type Props = {
  onStart: () => void;
};

/**
 * شاشة الدخول الأولى — تُعرض مرة واحدة قبل تركيب التطبيق (خارج كل
 * المزوّدات/الراوتر عمدًا؛ راجع App.tsx). لا أذونات هنا — أي إذن نظام
 * (إشعارات/موقع/صوت) يُطلب لاحقًا من مكانه المناسب فقط.
 */
export function AppFirstLaunchScreen({ onStart }: Props) {
  return (
    <div className="app-first-launch" dir="rtl" lang="ar">
      <div className="app-first-launch__content">
        <picture>
          <source srcSet="/brand/official.webp" type="image/webp" />
          <img
            src="/brand/official.png"
            alt="المجلس العلمي"
            className="app-first-launch__logo"
            width={512}
            height={512}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </picture>
        <h1 className="app-first-launch__title">المجلس العلمي</h1>
        <p className="app-first-launch__desc">علم شرعي موثوق في مكان واحد</p>
        <button
          type="button"
          className="mj-btn mj-btn--pill app-first-launch__cta"
          onClick={onStart}
          data-testid="app-first-launch-start"
        >
          ابدأ الآن
        </button>
      </div>
    </div>
  );
}
