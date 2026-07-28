/**
 * Flutter `MainNavigationScreen` + `MajlisIlmApp` shell:
 * bottom nav (مصحف / مسارات) · search · endDrawer settings · RTL parchment.
 */
import { useMemo, useState } from "react";
import { BookOpen, School, Search, Settings2 } from "lucide-react";
import { createQuranAppController } from "@/lib/quran-app-controller";
import { createEducationalProgressController } from "@/lib/educational-progress-controller";
import { useQuranAppController } from "@/hooks/useQuranAppController";
import { useImmersiveSystemUi } from "@/hooks/useImmersiveSystemUi";
import { QuranReaderWidget } from "@/components/majlis/QuranReaderWidget";
import { EducationalCoursesWidget } from "@/components/majlis/EducationalCoursesWidget";
import { SmartSearchPanel } from "@/components/majlis/SmartSearchPanel";
import { ImmersivePrefsDrawer } from "@/components/quran/ImmersivePrefsDrawer";
import {
  QURAN_APP_FONT_MAX,
  QURAN_APP_FONT_MIN,
} from "@/lib/quran-app-controller";
import "@/styles/majlisilm-shell.css";

export type MajlisIlmAppProps = {
  className?: string;
  /** Skip fixed immersive shell (embed in existing route). */
  embedded?: boolean;
};

export function MajlisIlmApp({ className, embedded = false }: MajlisIlmAppProps) {
  const quranController = useMemo(() => createQuranAppController(), []);
  const eduController = useMemo(() => createEducationalProgressController(), []);

  const {
    backgroundColor,
    isDarkMode,
    textColor,
    fontSize,
    updateFontSize,
    toggleTheme,
  } = useQuranAppController(quranController);

  useImmersiveSystemUi(!embedded, backgroundColor);

  const [tab, setTab] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const title = tab === 0 ? "المصحف الشريف" : "المسارات والأذكار";
  const ink = isDarkMode ? "#ffffff" : "rgba(0,0,0,0.87)";

  return (
    <div
      className={`majlisilm-app${embedded ? " majlisilm-app--embedded" : ""}${className ? ` ${className}` : ""}`}
      dir="rtl"
      style={{
        backgroundColor,
        color: ink,
        ["--majlis-ink" as string]: textColor,
      }}
      data-dark={isDarkMode ? "1" : "0"}
    >
      <header className="majlisilm-app__bar">
        <h1 className="majlisilm-app__title" style={{ color: ink }}>
          {title}
        </h1>
        <div className="majlisilm-app__actions">
          <button
            type="button"
            aria-label="بحث"
            onClick={() => setSearchOpen(true)}
            style={{ color: ink }}
          >
            <Search size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="إعدادات القراءة"
            onClick={() => setDrawerOpen(true)}
            style={{ color: ink }}
          >
            <Settings2 size={20} aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="majlisilm-app__body">
        {tab === 0 ? (
          <div className="majlisilm-app__reader">
            <QuranReaderWidget controller={quranController} />
          </div>
        ) : (
          <EducationalCoursesWidget controller={eduController} />
        )}
      </main>

      <nav className="majlisilm-app__nav" aria-label="التنقل الرئيسي">
        <button
          type="button"
          className={tab === 0 ? "is-on" : undefined}
          onClick={() => setTab(0)}
        >
          <BookOpen size={20} aria-hidden="true" />
          المصحف
        </button>
        <button
          type="button"
          className={tab === 1 ? "is-on" : undefined}
          onClick={() => setTab(1)}
        >
          <School size={20} aria-hidden="true" />
          المسارات
        </button>
      </nav>

      <SmartSearchPanel open={searchOpen} onClose={() => setSearchOpen(false)} />

      <ImmersivePrefsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        fontSize={fontSize}
        onFontSizeChange={updateFontSize}
        fontMin={QURAN_APP_FONT_MIN}
        fontMax={QURAN_APP_FONT_MAX}
        fontStep={1}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => toggleTheme(!isDarkMode)}
        paperBg={backgroundColor}
        title="إعدادات القراءة"
      />
    </div>
  );
}

/** Alias Flutter `MainNavigationScreen`. */
export const MainNavigationScreen = MajlisIlmApp;

export default MajlisIlmApp;
