import { useEffect, useState } from "react";
import type { QuranReciter } from "@/lib/quran-audio";
import { getVerifiedReciters, getVerifiedRecitersSyncFallback } from "@/lib/audio-registry";

/** قائمة القرّاء المُحقَّقين QA — fallback فوري ثم تحديث من السجل. */
export function useVerifiedReciters(): QuranReciter[] {
  const [reciters, setReciters] = useState(() => getVerifiedRecitersSyncFallback());

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const list = await getVerifiedReciters();
      if (!cancelled) setReciters(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return reciters;
}
