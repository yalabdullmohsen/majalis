import { useEffect, useState } from "react";

const loaded = new Set<number>();

function loadFace(pageNumber: number): Promise<void> {
  if (loaded.has(pageNumber)) return Promise.resolve();
  if (pageNumber < 1 || pageNumber > 604) return Promise.resolve();
  const fontFamily = `qpc-v2-p${pageNumber}`;
  const url = `/fonts/qpc-v2/p${pageNumber}.woff2`;
  const face = new FontFace(fontFamily, `url(${url})`, {
    display: "block",
    style: "normal",
    weight: "400",
  });
  return face
    .load()
    .then((loadedFace) => {
      document.fonts.add(loadedFace);
      loaded.add(pageNumber);
    })
    .catch(() => {
      loaded.add(pageNumber);
    });
}

/** يحمّل خط QPC V2 الخاص بالصفحة (`/fonts/qpc-v2/pN.woff2`) ويُحمّل مسبقاً ±١. */
export function useQpcPageFont(pageNumber: number): { fontFamily: string; ready: boolean } {
  const fontFamily = `qpc-v2-p${pageNumber}`;
  const [ready, setReady] = useState(() => loaded.has(pageNumber));

  useEffect(() => {
    let cancelled = false;
    if (loaded.has(pageNumber)) {
      setReady(true);
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
