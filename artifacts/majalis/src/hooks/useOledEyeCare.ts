import { useCallback, useEffect, useState } from "react";
import {
  applyOledEyeCare,
  beginReadingEyeCareSession,
  endReadingEyeCareSession,
  loadOledEyeCarePrefs,
  paintOledCanvasBackground,
  resolveOledCanvasTextColor,
  resolveOledEyeCareTokens,
  setOledEyeCareMode,
  type OledEyeCareMode,
  type OledEyeCarePrefs,
  type OledEyeCareTokens,
} from "@/lib/oled-eye-care";

/** OLED / eye-care reading logic — no CSS file edits. */
export function useOledEyeCare() {
  const [prefs, setPrefs] = useState<OledEyeCarePrefs>(() => loadOledEyeCarePrefs());
  const [tokens, setTokens] = useState<OledEyeCareTokens>(() =>
    resolveOledEyeCareTokens(loadOledEyeCarePrefs().mode),
  );

  useEffect(() => {
    setTokens(applyOledEyeCare(prefs.mode));
  }, [prefs.mode]);

  const setMode = useCallback((mode: OledEyeCareMode) => {
    setPrefs(setOledEyeCareMode(mode));
  }, []);

  const beginSession = useCallback((preferred?: OledEyeCareMode) => {
    setPrefs(beginReadingEyeCareSession(preferred));
  }, []);

  const endSession = useCallback(() => {
    setPrefs(endReadingEyeCareSession());
  }, []);

  const paintCanvas = useCallback(
    (canvas: HTMLCanvasElement) => paintOledCanvasBackground(canvas, prefs.mode),
    [prefs.mode],
  );

  const releaseCanvas = useCallback((canvas: HTMLCanvasElement | null | undefined) => {
    void import("@/lib/canvas-gl-cleanup").then(({ releaseCanvasResources }) => {
      releaseCanvasResources(canvas);
    });
  }, []);

  const canvasTextColor = resolveOledCanvasTextColor(prefs.mode);

  return {
    prefs,
    tokens,
    setMode,
    beginSession,
    endSession,
    paintCanvas,
    releaseCanvas,
    canvasTextColor,
  };
}
