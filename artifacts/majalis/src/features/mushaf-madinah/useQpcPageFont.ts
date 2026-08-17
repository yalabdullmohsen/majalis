import { useEffect, useState } from "react";

const loaded = new Set<number>();

function fontFamilyName(pageNumber: number): string {
  return `qpc-v2-p${pageNumber}`;
}

async function waitUntilReady(pageNumber: number): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  const family = fontFamilyName(pageNumber);
  try {
    await document.fonts.load(`1em "${family}"`);
    await document.fonts.ready;
  } catch {
    /* الخط الاحتياطي — الملاءمة تعمل بعد ذلك على المقاييس المتاحة */
  }
}

function loadFace(pageNumber: number): Promise<void> {
  if (loaded.has(pageNumber)) return waitUntilReady(pageNumber);
  if (pageNumber < 1 || pageNumber > 604) return Promise.resolve();
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
      loaded.add(pageNumber);
      await waitUntilReady(pageNumber);
    })
    .catch(async () => {
      loaded.add(pageNumber);
      await waitUntilReady(pageNumber);
    });
}

/** يحمّل خط QPC V2 الخاص بالصفحة (`/fonts/qpc-v2/pN.woff2`) ويُحمّل مسبقاً ±١. */
export function useQpcPageFont(pageNumber: number): { fontFamily: string; ready: boolean } {
  const fontFamily = fontFamilyName(pageNumber);
  const [ready, setReady] = useState(() => loaded.has(pageNumber));

  useEffect(() => {
    let cancelled = false;
    if (loaded.has(pageNumber)) {
      void waitUntilReady(pageNumber).then(() => {
        if (!cancelled) setReady(true);
      });
    } else {
      setReady(false);
      void loadFace(pageNumber).then(() => {
        if (!cancelled) setReady(true);
      });
    }
    void loadFace(pageNumber - 1);
    void loadFace(pageNumber + 1);
    return () => {
      cancelled = true;
    };
  }, [pageNumber]);

  return { fontFamily: `"${fontFamily}"`, ready };
}
