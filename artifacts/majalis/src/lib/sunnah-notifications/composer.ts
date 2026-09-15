/**
 * NotificationComposer — عناوين هادئة بلا ضغط أو إيموجي افتراضي.
 */

import type { SunnahNotificationChannel } from "./channels";
import { sanitizeSunnahDeepLink } from "./deep-links";

export type ComposeInput = {
  channel: SunnahNotificationChannel;
  kind:
    | "lesson_resume"
    | "lesson_reminder"
    | "series_new_lesson"
    | "content_digest"
    | "product_update"
    | "operational_generic"
    | "custom";
  entityTitle?: string;
  count?: number;
  deepLink?: string;
  customTitle?: string;
  customBody?: string;
};

export type ComposedNotification = {
  title: string;
  body: string;
  deepLink: string | null;
};

const PRESSURE = /فاتك|ارجع الآن|آخر فرصة|لماذا توقفت|لدينا شيء|لا تفوّت|عاجل|!!!/i;

function cleanText(input: string, max: number): string {
  return input.replace(/\s+/g, " ").trim().slice(0, max);
}

export function composeSunnahNotification(input: ComposeInput): ComposedNotification {
  const deepLink = input.deepLink ? sanitizeSunnahDeepLink(input.deepLink) : null;
  const entity = cleanText(input.entityTitle || "", 80);

  let title = "";
  let body = "";

  switch (input.kind) {
    case "lesson_resume":
      title = "متابعة الدرس";
      body = entity
        ? `تابع درس ${entity} من موضع توقفك.`
        : "تابع درسك من موضع توقفك.";
      break;
    case "lesson_reminder":
      title = "تذكير بالدرس";
      body = entity ? `تذكيرك بدرس ${entity} جاهز.` : "تذكيرك بدرس اليوم جاهز.";
      break;
    case "series_new_lesson":
      title = "درس جديد في سلسلتك";
      body = entity
        ? `أُضيف درس جديد إلى سلسلة ${entity}.`
        : "أُضيف درس جديد إلى السلسلة التي تتابعها.";
      break;
    case "content_digest": {
      const n = Math.max(1, Number(input.count) || 1);
      title = "ملخص محتوى جديد";
      body =
        n === 1
          ? entity
            ? `أُضيف محتوى جديد إلى ${entity}.`
            : "أُضيف محتوى جديد ضمن ما تتابعه."
          : `أُضيفت ${n} عناوين جديدة ضمن ما تتابعه.`;
      break;
    }
    case "product_update":
      title = "تحديث مهم لـ«سُنّة»";
      body = "يتوفر تحديث مهم لـ«سُنّة». افتح التطبيق للاطلاع عليه.";
      break;
    case "operational_generic":
      title = "تنبيه من سُنّة";
      body = "لديك تنبيه مهم. افتح التطبيق لعرض التفاصيل.";
      break;
    case "custom":
      title = cleanText(input.customTitle || "سُنّة", 60);
      body = cleanText(input.customBody || "", 140);
      break;
  }

  if (PRESSURE.test(title) || PRESSURE.test(body)) {
    title = "سُنّة";
    body = "افتح التطبيق لعرض التفاصيل.";
  }

  title = title.replace(/[\u{1F300}-\u{1FAFF}]/gu, "").trim() || "سُنّة";
  body = body.replace(/[\u{1F300}-\u{1FAFF}]/gu, "").trim();

  return { title: cleanText(title, 60), body: cleanText(body, 160), deepLink };
}
