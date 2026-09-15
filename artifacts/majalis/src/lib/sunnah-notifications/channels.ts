/**
 * قنوات إشعارات سُنّة — مصدر واحد لكل فئة (local أو push).
 */

export const SUNNAH_NOTIFICATION_CHANNELS = [
  "prayer",
  "learning",
  "new_content",
  "reminders",
  "product_updates",
  "operational",
] as const;

export type SunnahNotificationChannel = (typeof SUNNAH_NOTIFICATION_CHANNELS)[number];

export type DeliveryTransport = "local" | "push";

export type ChannelCadence = "immediate" | "daily_digest" | "weekly_digest";

export type ChannelPolicy = {
  channel: SunnahNotificationChannel;
  transport: DeliveryTransport;
  requiresExplicitOptIn: boolean;
  defaultEnabled: boolean;
  subjectToQuietHours: boolean;
  subjectToNonEssentialCaps: boolean;
  supportedCadences: readonly ChannelCadence[];
  labelAr: string;
  descriptionAr: string;
};

export const CHANNEL_POLICIES: Record<SunnahNotificationChannel, ChannelPolicy> = {
  prayer: {
    channel: "prayer",
    transport: "local",
    requiresExplicitOptIn: true,
    defaultEnabled: false,
    subjectToQuietHours: false,
    subjectToNonEssentialCaps: false,
    supportedCadences: ["immediate"],
    labelAr: "تنبيهات الصلاة",
    descriptionAr: "قناة مستقلة للأذان والتذكير بالصلاة — لا تتأثر بإيقاف المحتوى.",
  },
  learning: {
    channel: "learning",
    transport: "local",
    requiresExplicitOptIn: true,
    defaultEnabled: false,
    subjectToQuietHours: true,
    subjectToNonEssentialCaps: true,
    supportedCadences: ["immediate", "daily_digest"],
    labelAr: "تذكيرات الدروس",
    descriptionAr: "تذكير بدرس أو سلسلة بدأتها واخترت المتابعة.",
  },
  new_content: {
    channel: "new_content",
    transport: "push",
    requiresExplicitOptIn: true,
    defaultEnabled: false,
    subjectToQuietHours: true,
    subjectToNonEssentialCaps: true,
    supportedCadences: ["immediate", "daily_digest", "weekly_digest"],
    labelAr: "المحتوى الجديد",
    descriptionAr: "ملخص لما يُضاف إلى عالم أو سلسلة تتابعها صراحة.",
  },
  reminders: {
    channel: "reminders",
    transport: "local",
    requiresExplicitOptIn: true,
    defaultEnabled: false,
    subjectToQuietHours: true,
    subjectToNonEssentialCaps: true,
    supportedCadences: ["immediate"],
    labelAr: "تذكيراتي",
    descriptionAr: "تذكير حدّدته بنفسك لدرس أو موعد.",
  },
  product_updates: {
    channel: "product_updates",
    transport: "push",
    requiresExplicitOptIn: true,
    defaultEnabled: false,
    subjectToQuietHours: true,
    subjectToNonEssentialCaps: true,
    supportedCadences: ["immediate", "weekly_digest"],
    labelAr: "تحديثات سُنّة المهمة",
    descriptionAr: "تغييرات تؤثر في استخدامك أو تتطلب إجراءً منك.",
  },
  operational: {
    channel: "operational",
    transport: "push",
    requiresExplicitOptIn: false,
    defaultEnabled: true,
    subjectToQuietHours: false,
    subjectToNonEssentialCaps: false,
    supportedCadences: ["immediate"],
    labelAr: "تشغيلية ضرورية",
    descriptionAr: "أمان أو حالة مهمة لحسابك — ليست للتسويق.",
  },
};

export function isSunnahNotificationChannel(value: string): value is SunnahNotificationChannel {
  return (SUNNAH_NOTIFICATION_CHANNELS as readonly string[]).includes(value);
}

export function transportForChannel(channel: SunnahNotificationChannel): DeliveryTransport {
  return CHANNEL_POLICIES[channel].transport;
}
