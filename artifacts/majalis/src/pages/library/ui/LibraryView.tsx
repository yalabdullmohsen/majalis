/**
 * المكتبة العامة أُزيلت — أي استيراد قديم يُحوَّل إلى البحث.
 */
import { useEffect } from "react";
import { Redirect } from "wouter";

export default function LibraryView() {
  useEffect(() => {
    try {
      window.history.replaceState(null, "", "/search");
    } catch {
      /* ignore */
    }
  }, []);
  return <Redirect to="/search" />;
}
