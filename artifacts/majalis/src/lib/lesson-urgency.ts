const DAY_INDEX: Record<string, number> = {
  الأحد: 0,
  الاثنين: 1,
  الثلاثاء: 2,
  الأربعاء: 3,
  الخميس: 4,
  الجمعة: 5,
  السبت: 6,
};

export type UrgencyLevel = "urgent" | "soon" | "week" | "later";

export type UrgencyInfo = {
  level: UrgencyLevel;
  label: string;
  hoursUntil: number;
};

function kuwaitWeekdayIndex(): number {
  const en = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kuwait",
    weekday: "long",
  }).format(new Date());
  const map: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  return map[en] ?? 0;
}

export function hoursUntilNextDay(day: string): number {
  const target = DAY_INDEX[day.trim()];
  if (target == null) return 9999;
  const today = kuwaitWeekdayIndex();
  let daysAhead = (target - today + 7) % 7;
  if (daysAhead === 0) daysAhead = 7;
  return daysAhead * 24;
}

export function computeUrgency(day: string): UrgencyInfo {
  const hours = hoursUntilNextDay(day);

  if (hours <= 24) {
    if (hours <= 2) {
      return { level: "urgent", label: "بعد ساعتين تقريبًا", hoursUntil: hours };
    }
    if (hours <= 24 && kuwaitWeekdayIndex() !== (DAY_INDEX[day] ?? -1)) {
      const daysAhead = Math.ceil(hours / 24);
      if (daysAhead === 1) return { level: "urgent", label: "غدًا", hoursUntil: hours };
      if (daysAhead <= 2) return { level: "soon", label: "بعد يومين", hoursUntil: hours };
    }
    return { level: "urgent", label: "خلال 24 ساعة", hoursUntil: hours };
  }

  if (hours <= 48) {
    return { level: "soon", label: "بعد يومين", hoursUntil: hours };
  }

  if (hours <= 168) {
    const days = Math.ceil(hours / 24);
    if (days === 3) return { level: "week", label: "بعد ثلاثة أيام", hoursUntil: hours };
    return { level: "week", label: "الأسبوع القادم", hoursUntil: hours };
  }

  return { level: "later", label: "لاحقًا", hoursUntil: hours };
}

export function urgencyClass(level: UrgencyLevel): string {
  return `lesson-urgency lesson-urgency--${level}`;
}
