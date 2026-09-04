/**
 * تصنيف فشل التحميل — لا تُعرَض «تحقق من الإنترنت» إلا عند offline مؤكد.
 */
export type LoadFailureKind = "offline" | "timeout" | "not_found" | "server" | "unknown";

export function classifyLoadFailure(err: unknown): LoadFailureKind {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "offline";
  }
  const name = err instanceof Error ? err.name : "";
  const msg = err instanceof Error ? err.message : String(err ?? "");
  const lower = msg.toLowerCase();

  if (
    name === "RequestTimeoutError" ||
    lower.includes("timed out") ||
    lower.includes("timeout") ||
    lower.includes("انتهت مهلة")
  ) {
    return "timeout";
  }
  if (
    lower.includes("404") ||
    lower.includes("not found") ||
    lower.includes("لم يتم العثور") ||
    name === "NotFoundError"
  ) {
    return "not_found";
  }
  if (/\b5\d\d\b/.test(msg) || lower.includes("internal server") || lower.includes("bad gateway")) {
    return "server";
  }
  // Failed to fetch قد يكون انقطاعًا مؤقتًا وليس offline مؤكدًا
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("load failed") ||
    lower.includes("network request failed")
  ) {
    return typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "unknown";
  }
  return "unknown";
}

export function messageForLoadFailure(kind: LoadFailureKind): string {
  switch (kind) {
    case "offline":
      return "أنت غير متصل بالإنترنت. اتصل بالشبكة ثم أعد المحاولة.";
    case "timeout":
      return "التحميل يستغرق وقتًا أطول من المعتاد. أعد المحاولة.";
    case "not_found":
      return "لم يتم العثور على هذا المحتوى.";
    case "server":
      return "تعذّر الوصول إلى الخادم مؤقتًا. أعد المحاولة بعد لحظات.";
    default:
      return "تعذّر تحميل المحتوى مؤقتًا. أعد المحاولة.";
  }
}

export function userMessageFromLoadError(err: unknown): string {
  return messageForLoadFailure(classifyLoadFailure(err));
}
