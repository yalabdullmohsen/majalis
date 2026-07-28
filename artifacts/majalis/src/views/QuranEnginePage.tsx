/**
 * Quran Engine surface — dashboard + viewer under one Provider.
 */
import { useState } from "react";
import { QuranEngineProvider } from "@/core/quran/QuranEngineContext";
import { HomeDashboard } from "@/components/HomeDashboard";
import { QuranViewer } from "@/components/QuranViewer";

export default function QuranEnginePage() {
  const [mode, setMode] = useState<"dash" | "viewer">("dash");
  const [surah, setSurah] = useState<number | undefined>(undefined);

  return (
    <QuranEngineProvider>
      <main className="qe-page" dir="rtl">
        <nav className="qe-page__nav" aria-label="محرك القرآن">
          <button
            type="button"
            className={mode === "dash" ? "is-on" : undefined}
            onClick={() => setMode("dash")}
          >
            اللوحة
          </button>
          <button
            type="button"
            className={mode === "viewer" ? "is-on" : undefined}
            onClick={() => setMode("viewer")}
          >
            المصحف
          </button>
        </nav>
        {mode === "dash" ? (
          <HomeDashboard
            onOpenViewer={(s) => {
              setSurah(s);
              setMode("viewer");
            }}
            onContinue={(p) => {
              setSurah(p.lastSurah);
              setMode("viewer");
            }}
          />
        ) : (
          <QuranViewer initialSurah={surah} />
        )}
      </main>
    </QuranEngineProvider>
  );
}
