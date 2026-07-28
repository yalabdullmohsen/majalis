/**
 * Quran Engine surface — dashboard + viewer under one Provider + ErrorBoundary.
 * Supports Focus Mode: hides engine nav while the mushaf fills the viewport.
 */
import { useState } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QuranEngineProvider } from "@/core/quran/QuranEngineContext";
import { HomeDashboard } from "@/components/HomeDashboard";
import { QuranViewer } from "@/components/QuranViewer";
import "@/styles/quran-engine-ui.css";

export default function QuranEnginePage() {
  const [mode, setMode] = useState<"dash" | "viewer">("dash");
  const [surah, setSurah] = useState<number | undefined>(undefined);
  const [focusMode, setFocusMode] = useState(false);

  return (
    <ErrorBoundary>
      <QuranEngineProvider>
        <main
          className={`qe-page${focusMode ? " qe-page--focus" : ""}`}
          dir="rtl"
          data-focus={focusMode ? "1" : "0"}
        >
          {!focusMode ? (
            <nav className="qe-page__nav" aria-label="محرك القرآن">
              <button
                type="button"
                className={mode === "dash" ? "is-on" : undefined}
                onClick={() => {
                  setFocusMode(false);
                  setMode("dash");
                }}
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
          ) : null}
          {mode === "dash" ? (
            <HomeDashboard
              onOpenViewer={(s) => {
                setFocusMode(false);
                setSurah(s);
                setMode("viewer");
              }}
              onContinue={(p) => {
                setFocusMode(false);
                setSurah(p.lastSurah);
                setMode("viewer");
              }}
            />
          ) : (
            <QuranViewer initialSurah={surah} onFocusModeChange={setFocusMode} />
          )}
        </main>
      </QuranEngineProvider>
    </ErrorBoundary>
  );
}
