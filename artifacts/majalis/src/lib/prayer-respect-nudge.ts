/**
 * تذكير احترام وقت الصلاة: من الأذان حتى ١٠ دقائق بعده.
 * رسائل قصيرة متنوعة (صامت / إغلاق الجوال) بلا إزعاج متكرر لنفس الصلاة.
 */

/** دقائق بقاء التذكير بعد دخول وقت الصلاة. */
export const PRAYER_RESPECT_POST_MINUTES = 10;

export type PrayerRespectMessage = {
  title: string;
  body: string;
};

export const PRAYER_RESPECT_MESSAGES: readonly PrayerRespectMessage[] = [
  {
    title: "وقت الصلاة",
    body: "أغلق الجوال وقت الصلاة حتى لا يشغلك أو يشغل غيرك.",
  },
  {
    title: "وقت الصلاة",
    body: "لا تنسَ وضع الصامت قبل الدخول في الصلاة.",
  },
  {
    title: "وقت الصلاة",
    body: "ضع هاتفك على الصامت وأغلقه أثناء الصلاة.",
  },
  {
    title: "وقت الصلاة",
    body: "احفظ خشوعك: صامت أو إغلاق للجوال حتى تنتهي الصلاة.",
  },
  {
    title: "وقت الصلاة",
    body: "إن كنت تصلّي أو في المسجد، أبقِ الجوال صامتًا.",
  },
] as const;

/** هل نحن داخل نافذة التذكير بعد الأذان (٠ … ١٠ دقائق)؟ */
export function isWithinPrayerRespectWindow(sinceSeconds: number | null | undefined): boolean {
  if (sinceSeconds == null || !Number.isFinite(sinceSeconds)) return false;
  if (sinceSeconds < 0) return false;
  return sinceSeconds <= PRAYER_RESPECT_POST_MINUTES * 60;
}

/**
 * اختيار رسالة مستقرة لنفس الصلاة في نفس اليوم، مع تدوير عند تغيّر الدقيقة
 * كل دقيقتين داخل النافذة لإحساس التنوّع دون قفز مستمر.
 */
export function pickPrayerRespectMessage(
  prayerKey: string,
  sinceSeconds = 0,
  dateKey = "",
): PrayerRespectMessage {
  const pool = PRAYER_RESPECT_MESSAGES;
  if (!pool.length) {
    return {
      title: "وقت الصلاة",
      body: "لا تنسَ وضع الصامت وقت الصلاة.",
    };
  }
  const slot = Math.max(0, Math.floor(sinceSeconds / 120));
  let hash = 0;
  const seed = `${dateKey}|${prayerKey}|${slot}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return pool[hash % pool.length]!;
}
