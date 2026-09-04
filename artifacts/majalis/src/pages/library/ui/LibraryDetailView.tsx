/**
 * تفاصيل كتاب المكتبة العامة أُزيلت — التحويل إلى البحث.
 */
import { useEffect } from "react";
import { Redirect } from "wouter";

export default function LibraryDetailView() {
  useEffect(() => {
    try {
      window.history.replaceState(null, "", "/search");
    } catch {
      /* ignore */
    }
  }, []);
  return <Redirect to="/search" />;
}
