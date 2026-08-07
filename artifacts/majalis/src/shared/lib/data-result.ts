/**
 * مغلّف نداء موحّد — كل قراءة/كتابة تُرجع { data, error } بلا try/catch متناثر.
 */
export type DataResult<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; cause?: unknown } };

export function okData<T>(data: T): DataResult<T> {
  return { data, error: null };
}

export function errData<T = never>(message: string, cause?: unknown): DataResult<T> {
  if (typeof console !== "undefined" && console.warn) {
    console.warn("[data]", message, cause ?? "");
  }
  return { data: null, error: { message, cause } };
}

export async function wrapAsync<T>(fn: () => Promise<T>): Promise<DataResult<T>> {
  try {
    return okData(await fn());
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    return errData(message, cause);
  }
}
