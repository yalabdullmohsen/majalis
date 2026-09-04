/**
 * /more ملغاة — التحويل إلى الرئيسية (المسار في AppRoutes يحوّل أيضًا).
 */
import { useEffect } from "react";
import { Redirect } from "wouter";

export default function MorePage() {
  useEffect(() => {
    try {
      window.history.replaceState(null, "", "/");
    } catch {
      /* ignore */
    }
  }, []);
  return <Redirect to="/" />;
}
