import { useEffect, useState } from "react";

const loaded = new Set<number>();

function fontFamilyName(pageNumber: number): string {
  return `qpc-v2-p${pageNumber}`;
}

async function waitUntilReady(pageNumber: number): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  const family = fontFamilyName(pageNumber);
  const spec = `16px "${family}"`;
  try {
    await document.fonts.load(spec);
    await document.fonts.ready;
  } catch {
    /* يُعاد الفحص أدناه */
  }
  if (!document.fonts.check(spec) && !document.fonts.check(`16px ${family}`)) {
    throw new Error(`الخط ${family} لم يُحمَّل`);
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
      await waitUntilReady(pageNumber);
      loaded.add(pageNumber);
    })
    .catch(async () => {
      try {
        await waitUntilReady(pageNumber);
        loaded.add(pageNumber);
      } catch {
        /* لا نعلن الجاهزية بخط احتياطي — القياس عندها ينفجر */
      }
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
    /* بسملة المطلع تستخدم دائماً محارف الصفحة ١ → جهّز الخط مسبقاً */
    void loadFace(1);
    return () => {
      cancelled = true;
    };
  }, [pageNumber]);

  return { fontFamily: `"${fontFamily}"`, ready };
}
