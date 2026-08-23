/**
 * مصدر واحد لأوقات الصلاة والعدّ التنازلي — يمنع ٣ اشتراكات متوازية
 * (NavBar + جدولة الأذان + تنبيهات الصلاة) التي كانت ترفع TBT.
 */
import { createContext, useContext, type ReactNode } from "react";
import {
  usePrayerCountdownState,
  type PrayerCountdownValue,
} from "@/hooks/usePrayerCountdown";

const PrayerCountdownContext = createContext<PrayerCountdownValue | null>(null);

const EMPTY: PrayerCountdownValue = {
  data: null,
  countdown: null,
  loading: false,
  reload: () => {},
};

export function PrayerCountdownProvider({
  children,
  governorateId,
}: {
  children: ReactNode;
  governorateId?: string;
}) {
  const value = usePrayerCountdownState(governorateId);
  return (
    <PrayerCountdownContext.Provider value={value}>{children}</PrayerCountdownContext.Provider>
  );
}

/** يستهلك السياق المشترك فقط — بلا شبكة/نبضة حتى يُفعَّل المزوّد. */
export function useSharedPrayerCountdown(): PrayerCountdownValue {
  return useContext(PrayerCountdownContext) ?? EMPTY;
}

/** نسخة مستقلة لصفحات المواقيت خارج السياق المؤجَّل. */
export function usePrayerCountdown(governorateId?: string): PrayerCountdownValue {
  return usePrayerCountdownState(governorateId);
}
