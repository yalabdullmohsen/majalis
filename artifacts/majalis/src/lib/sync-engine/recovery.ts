import { computeBackoffDelayMs } from "@/lib/retry-policy";

export type RecoveryKind =
  | "transient"
  | "file"
  | "sync"
  | "index"
  | "assistant"
  | "secondary_ui";

export type RecoveryPlan = {
  kind: RecoveryKind;
  retry: boolean;
  retryDelayMs: number;
  useCacheFallback: boolean;
  userMessageAr: string;
  dropTempFile?: boolean;
  keepMetadata?: boolean;
};

export function planRecovery(kind: RecoveryKind, attempt = 1): RecoveryPlan {
  const delay = computeBackoffDelayMs(attempt, {
    maxRetries: 6,
    baseDelayMs: 500,
    maxDelayMs: 60_000,
  });

  switch (kind) {
    case "transient":
      return {
        kind,
        retry: attempt < 5,
        retryDelayMs: delay,
        useCacheFallback: true,
        userMessageAr: "تعذّر الاتصال مؤقتًا. نعيد المحاولة دون إعاقة التصفح.",
      };
    case "file":
      return {
        kind,
        retry: attempt < 3,
        retryDelayMs: delay,
        useCacheFallback: false,
        dropTempFile: true,
        keepMetadata: true,
        userMessageAr: "الملف غير مكتمل. يمكن إعادة التنزيل دون فقد البيانات الوصفية.",
      };
    case "sync":
      return {
        kind,
        retry: attempt < 8,
        retryDelayMs: delay,
        useCacheFallback: true,
        userMessageAr: "المزامنة مؤجلة. تبقى التغييرات محليًا بأمان.",
      };
    case "index":
      return {
        kind,
        retry: attempt < 2,
        retryDelayMs: delay,
        useCacheFallback: true,
        userMessageAr: "نستخدم آخر فهرس صالح. إعادة البناء اختيارية وآمنة.",
      };
    case "assistant":
      return {
        kind,
        retry: false,
        retryDelayMs: 0,
        useCacheFallback: true,
        userMessageAr: "تعذّر الجواب الموثّق. يمكنك استخدام البحث العادي.",
      };
    case "secondary_ui":
    default:
      return {
        kind: "secondary_ui",
        retry: true,
        retryDelayMs: 0,
        useCacheFallback: true,
        userMessageAr: "تعذّر تحميل هذا القسم. بقية التطبيق متاحة.",
      };
  }
}
