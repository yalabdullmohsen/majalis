/**
 * Safe JSON / schema guards for LocalStorage & IndexedDB payloads.
 * Never throws into React lifecycle — returns fallback + optionally clears corrupt keys.
 */

export type SafeParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; value: T };

export type SchemaGuard<T> = (value: unknown) => value is T;

export function safeJsonParse<T>(
  raw: string | null | undefined,
  fallback: T,
  guard?: SchemaGuard<T>,
): SafeParseResult<T> {
  if (raw == null || raw === "") {
    return { ok: true, value: fallback };
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (guard) {
      if (guard(parsed)) return { ok: true, value: parsed };
      return { ok: false, error: "schema_mismatch", value: fallback };
    }
    return { ok: true, value: parsed as T };
  } catch (err) {
    return {
      ok: false,
      error: String((err as Error)?.message || "parse_error"),
      value: fallback,
    };
  }
}

/** Read LS key with schema guard; wipe key if corrupt. */
export function readLocalJson<T>(
  key: string,
  fallback: T,
  guard?: SchemaGuard<T>,
): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    const result = safeJsonParse(raw, fallback, guard);
    if (!result.ok) {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
    return result.value;
  } catch {
    return fallback;
  }
}

/** Write LS with try/catch — never throws. */
export function writeLocalJson(key: string, value: unknown): boolean {
  return writeLocalJsonAtomic(key, value);
}

/**
 * كتابة ذرية تقريبية لـ localStorage:
 * يُكتب المفتاح المؤقت أولًا ثم يُثبَّت النهائي ثم يُمسح المؤقت —
 * يقلّل فساد البيانات عند إنهاء مفاجئ أثناء الكتابة.
 */
export function writeLocalJsonAtomic(key: string, value: unknown): boolean {
  if (typeof localStorage === "undefined") return false;
  const tmpKey = `${key}::__tmp`;
  try {
    const raw = JSON.stringify(value);
    localStorage.setItem(tmpKey, raw);
    localStorage.setItem(key, raw);
    try {
      localStorage.removeItem(tmpKey);
    } catch {
      /* ignore */
    }
    return true;
  } catch {
    try {
      localStorage.removeItem(tmpKey);
    } catch {
      /* ignore */
    }
    return false;
  }
}

/** يستعيد قيمة من مفتاح مؤقت إن وُجد وفشل النهائي (إقلاع بعد قتل مفاجئ). */
export function recoverLocalJsonTmp(key: string): void {
  if (typeof localStorage === "undefined") return;
  const tmpKey = `${key}::__tmp`;
  try {
    const tmp = localStorage.getItem(tmpKey);
    if (tmp == null) return;
    if (localStorage.getItem(key) == null) {
      localStorage.setItem(key, tmp);
    }
    localStorage.removeItem(tmpKey);
  } catch {
    /* ignore */
  }
}

export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

/** Soft-merge object with defaults; drops non-object corrupt roots. */
export function mergeWithDefaults<T extends Record<string, unknown>>(
  raw: unknown,
  defaults: T,
): T {
  if (!isPlainObject(raw)) return { ...defaults };
  return { ...defaults, ...(raw as Partial<T>) };
}
