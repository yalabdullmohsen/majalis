/**
 * نظام إشعارات سُنّة — نقطة تصدير موحّدة.
 */

export * from "./channels";
export * from "./preferences";
export * from "./quiet-hours";
export * from "./deduplicator";
export * from "./deep-links";
export * from "./rate-limit";
export * from "./composer";
export * from "./eligibility";
export * from "./dispatcher";
export * from "./telemetry";
export * from "./permission";
export * from "./learning";
export * from "./new-content";
export * from "./kill-switch";
export * from "./digest";
export * from "./inbox";

import { migrateLegacyNotificationConsent } from "./preferences";

/** ترحيل آمن عند إقلاع طبقة الإشعارات — بلا طلب إذن نظام */
export function bootstrapSunnahNotifications(): void {
  migrateLegacyNotificationConsent({ hadAmbiguousLegacyConsent: true });
}
