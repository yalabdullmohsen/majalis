/**
 * صفحات فرعية لمسار الحفظ — خلف العلم؛ المحتوى التفصيلي في PR-2/3.
 */
import { Redirect } from "wouter";
import { isHifzPathEnabled } from "@/lib/memorization-path";
import HifzPathPage from "./HifzPathPage";

/** محفوظاتي / تصنيف / مسار / وحدة — حتى تتوفر الصفحات التفصيلية تُعرض الهيكلة أو تُحوَّل. */
export function HifzPathGatedRedirect({ to = "/hifz-path" }: { to?: string }) {
  if (!isHifzPathEnabled()) {
    return <Redirect to="/memorization" />;
  }
  return <Redirect to={to} />;
}

/** مؤقتًا: نفس غلاف القسم حتى PR-2 يفصل الصفحات. */
export default function HifzPathChildPage() {
  if (!isHifzPathEnabled()) {
    return <Redirect to="/memorization" />;
  }
  return <HifzPathPage />;
}
