import { useLayoutEffect, useState } from "react";
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
  if (typeof document !== "undefined") {
    const href = `/fonts/qpc-v2/p${pageNumber}.woff2`;
    const marker = `link[data-mushaf-font-preload="${pageNumber}"]`;
    if (!document.querySelector(marker)) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "font";
      link.type = "font/woff2";
      link.crossOrigin = "anonymous";
      link.href = href;
      link.dataset.mushafFontPreload = String(pageNumber);
      document.head.appendChild(link);
    }
  }
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

/** جاهزية متزامنة من كاش الوحدة — بلا حالة React قديمة لصفحة سابقة. */
export function isQpcPageFontReady(pageNumber: number): boolean {
  return loaded.has(pageNumber);
}

/** يضمن تحميل خط الصفحة قبل قلب الواجهة (يمنع FOUT/قفزة المقاسات). */
export function ensureQpcPageFont(pageNumber: number): Promise<boolean> {
  return loadFace(pageNumber);
}

/** يحمّل خط QPC V2 الخاص بالصفحة (`/fonts/qpc-v2/pN.woff2`) ويُحمّل مسبقاً ±١. */
export function useQpcPageFont(pageNumber: number): { fontFamily: string; ready: boolean } {
  const fontFamily = fontFamilyName(pageNumber);
  /** epoch لإعادة الرسم عند اكتمال التحميل؛ الجاهزية تُقرأ من `loaded` كل رسم. */
  const [, setEpoch] = useState(0);
  const ready = loaded.has(pageNumber);

  useLayoutEffect(() => {
    let cancelled = false;
    void loadFace(pageNumber).then((ok) => {
      if (!cancelled && ok) setEpoch((n) => n + 1);
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
