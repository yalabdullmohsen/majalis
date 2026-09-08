/**
 * /more ملغاة — التحويل إلى الأقسام (المسار في AppRoutes يحوّل أيضًا).
 */
import { useEffect } from "react";
import { Redirect } from "wouter";

export default function MorePage() {
  useEffect(() => {
    try {
      window.history.replaceState(null, "", "/sections");
    } catch {
      /* ignore */
    }
  }, []);
  return <Redirect to="/sections" />;
}
