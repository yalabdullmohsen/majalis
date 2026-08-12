/**
 * يحفظ مسار الدخول إلى المصحف (رئيسية / فهرس / بحث) لإعادته عند الخروج.
 */
import { normalizeNavPath } from "@/lib/navigation-back";

const KEY = "majalis:mushaf-entry-origin:v1";

export function captureMushafEntryOrigin(fromPath: string | null | undefined): void {
  const from = normalizeNavPath(fromPath || "/");
  if (from.startsWith("/mushaf")) return;
  try {
    if (!sessionStorage.getItem(KEY)) {
      sessionStorage.setItem(KEY, from);
    }
  } catch {
    /* ignore */
  }
}

export function peekMushafEntryOrigin(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function consumeMushafEntryOrigin(): string | null {
  try {
    const v = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return v;
  } catch {
    return null;
  }
}

export function clearMushafEntryOrigin(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
