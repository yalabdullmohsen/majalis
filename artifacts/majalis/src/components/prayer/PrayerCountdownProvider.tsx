import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  usePrayerCountdownState,
  type PrayerCountdownValue,
} from "@/hooks/usePrayerCountdown";
import type { PrayerCountdown, PrayerTimesPayload } from "@/lib/prayer-times";

type PrayerDataValue = {
  data: PrayerTimesPayload | null;
  loading: boolean;
  reload: () => void;
};

const PrayerDataContext = createContext<PrayerDataValue | null>(null);
const PrayerCountdownLiveContext = createContext<PrayerCountdown | null>(null);

const EMPTY_DATA: PrayerDataValue = {
  data: null,
  loading: false,
  reload: () => {},
};

export function PrayerCountdownProvider({
  children,
  governorateId,
  enabled = true,
}: {
  children: ReactNode;
  governorateId?: string;
  /** عند false: لا جلب شبكة ولا عدّ ثانية — لإبقاء الإقلاع خفيفًا على الرئيسية */
  enabled?: boolean;
}) {
  const { data, countdown, loading, reload } = usePrayerCountdownState(governorateId, { enabled });
  const dataValue = useMemo(
    () => ({ data, loading, reload }),
    [data, loading, reload],
  );

  return (
    <PrayerDataContext.Provider value={dataValue}>
      <PrayerCountdownLiveContext.Provider value={countdown}>
        {children}
      </PrayerCountdownLiveContext.Provider>
    </PrayerDataContext.Provider>
  );
}

/** بيانات المواقيت فقط — لا يُعاد الرسم كل ثانية. */
export function useSharedPrayerData(): PrayerDataValue {
  return useContext(PrayerDataContext) ?? EMPTY_DATA;
}

/** العدّ التنازلي الحي — للشريحة/البانر فقط. */
export function useSharedPrayerCountdownLive(): PrayerCountdown | null {
  return useContext(PrayerCountdownLiveContext);
}

export function useSharedPrayerCountdown(): PrayerCountdownValue {
  const { data, loading, reload } = useSharedPrayerData();
  const countdown = useSharedPrayerCountdownLive();
  return { data, countdown, loading, reload };
}

/** نسخة مستقلة لصفحات المواقيت خارج السياق المؤجَّل. */
export function usePrayerCountdown(governorateId?: string): PrayerCountdownValue {
  return usePrayerCountdownState(governorateId);
}
