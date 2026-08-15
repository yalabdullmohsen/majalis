import { useEffect, useState } from "react";

const loaded = new Set<number>();

/** يحمّل خط QPC V2 الخاص بالصفحة (`/fonts/qpc-v2/pN.woff2`). */
export function useQpcPageFont(pageNumber: number): { fontFamily: string; ready: boolean } {
  const fontFamily = `qpc-v2-p${pageNumber}`;
  const [ready, setReady] = useState(() => loaded.has(pageNumber));

  useEffect(() => {
    let cancelled = false;
    if (loaded.has(pageNumber)) {
      setReady(true);
      return;
    }
    setReady(false);
    const url = `/fonts/qpc-v2/p${pageNumber}.woff2`;
    const face = new FontFace(fontFamily, `url(${url})`, {
      display: "block",
      style: "normal",
      weight: "400",
    });
    face
      .load()
      .then((loadedFace) => {
        if (cancelled) return;
        document.fonts.add(loadedFace);
        loaded.add(pageNumber);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [fontFamily, pageNumber]);

  return { fontFamily: `"${fontFamily}"`, ready };
}
