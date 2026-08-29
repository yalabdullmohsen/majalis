/**
 * توافق خلفي: تحويلات /scholars القديمة.
 * المعرّفات المعروفة → صفحة العالِم؛ المزالة → null (404/410 في الواجهة/الـedge).
 */
import { resolveScholarSlug } from "@/data/scholars-profiles";

export function redirectScholarPath(id?: string | null): string | null {
  const resolved = resolveScholarSlug(id);
  if (resolved.kind === "profile" || resolved.kind === "alias") {
    return `/scholars/${resolved.slug}`;
  }
  if (resolved.kind === "gone") return null;
  return null;
}
