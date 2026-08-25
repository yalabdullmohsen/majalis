import { useEffect, useState } from "react";
import { getPowerSaverState } from "@/lib/power-saver-engine";

const loaded = new Set<number>();

function fontFamilyName(pageNumber: number): string {
  return `qpc-v2-p${pageNumber}`;
}

async function waitUntilReady(pageNumber: number): Promise<boolean> {
  if (typeof document === "undefined" || !document.fonts) return true;
  const family = fontFamilyName(pageNumber);
  const spec = `16px "${family}"`;
  try {
    await document.fonts.load(spec);
    await document.fonts.ready;
  } catch {
    /* يُعاد الفحص أدناه */
  }
  return Boolean(
    document.fonts.check(spec) || document.fonts.check(`16px ${family}`),
  );
}

function loadFace(pageNumber: number): Promise<boolean> {
  if (pageNumber < 1 || pageNumber > 604) return Promise.resolve(false);
  if (loaded.has(pageNumber)) return waitUntilReady(pageNumber);

  const fontFamily = fontFamilyName(pageNumber);
  const url = `/fonts/qpc-v2/p${pageNumber}.woff2`;
  const face = new FontFace(fontFamily, `url(${url})`, {
    display: "block",
    style: "normal",
    weight: "400",
  });
  return face
    .load()
    .then(async (loadedFace) => {
      document.fonts.add(loadedFace);
      const ok = await waitUntilReady(pageNumber);
      if (ok) loaded.add(pageNumber);
      return ok;
    })
    .catch(async () => {
      const ok = await waitUntilReady(pageNumber);
      if (ok) loaded.add(pageNumber);
      return ok;
    });
}

/** يحمّل خط QPC V2 الخاص بالصفحة (`/fonts/qpc-v2/pN.woff2`) ويُحمّل مسبقاً ±١. */
export function useQpcPageFont(pageNumber: number): { fontFamily: string; ready: boolean } {
  const fontFamily = fontFamilyName(pageNumber);
  const [ready, setReady] = useState(() => loaded.has(pageNumber));

  useEffect(() => {
    let cancelled = false;
    setReady(loaded.has(pageNumber));
    void loadFace(pageNumber).then((ok) => {
      if (!cancelled && ok) setReady(true);
    });
    const saver = getPowerSaverState();
    if (saver.mode !== "aggressive") {
      void loadFace(pageNumber - 1);
      void loadFace(pageNumber + 1);
    }
    /* بسملة المطلع تستخدم دائماً محارف الصفحة ١ → جهّز الخط مسبقاً */
    void loadFace(1);
    return () => {
      cancelled = true;
    };
  }, [pageNumber]);

  return { fontFamily: `"${fontFamily}"`, ready };
}
