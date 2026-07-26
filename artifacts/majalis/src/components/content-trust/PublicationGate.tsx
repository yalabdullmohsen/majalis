/**
 * إخفاء/وسم المحتوى المحجوب — ملف جديد فقط.
 * publication_gate === "blocked" أو text_flags يتضمن SUSPECT_TEXT.
 */
import type { ReactNode } from "react";

export type PublicationGateProps = {
  publicationGate?: "open" | "blocked" | null;
  textFlags?: string[] | null;
  /** إن true يُرجع null (إخفاء كامل) بدل رسالة */
  hideWhenBlocked?: boolean;
  children?: ReactNode;
  className?: string;
};

export function isPublicationBlocked(
  publicationGate?: string | null,
  textFlags?: string[] | null,
): boolean {
  if (publicationGate === "blocked") return true;
  return Array.isArray(textFlags) && textFlags.includes("SUSPECT_TEXT");
}

export function PublicationGate({
  publicationGate,
  textFlags,
  hideWhenBlocked = true,
  children,
  className,
}: PublicationGateProps) {
  if (isPublicationBlocked(publicationGate, textFlags)) {
    if (hideWhenBlocked) return null;
    return (
      <p
        className={["ct-publication-blocked", className].filter(Boolean).join(" ")}
        role="status"
      >
        هذا المحتوى موقوف عن العرض حتى مراجعة علمية بشرية.
      </p>
    );
  }
  return <>{children}</>;
}

export default PublicationGate;
