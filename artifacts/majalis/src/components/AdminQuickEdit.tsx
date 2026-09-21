import { Pencil } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { isAdminSurfaceAllowed } from "@/lib/admin-surface";

type AdminQuickEditProps = {
  /** اسم القسم في لوحة التحكم (مثال: "lessons", "sheikhs", "library") */
  section: string;
  /** نص البحث المراد تعبئته مسبقاً عند الانتقال للإدارة */
  searchTerm?: string;
  /** التسمية التوضيحية (اختياري) */
  label?: string;
};

/**
 * زر تعديل سريع — داخل `/admin` فقط (لا FABs فوق التطبيق العام).
 */
export function AdminQuickEdit({ section, searchTerm, label }: AdminQuickEditProps) {
  const { isAdmin } = useAuth();
  const [location] = useLocation();
  if (!isAdminSurfaceAllowed(location, isAdmin)) return null;

  const params = new URLSearchParams({ section });
  if (searchTerm?.trim()) params.set("q", searchTerm.trim());
  const href = `/admin?${params.toString()}`;

  return (
    <a href={href} className="admin-quick-edit-fab" title={`إدارة ${label || "القسم"} في لوحة التحكم`} aria-label="تعديل في لوحة التحكم">
      <span className="admin-quick-edit-fab__icon"><Pencil size={16} strokeWidth={1.8} /></span>
      <span className="admin-quick-edit-fab__text">تعديل</span>
    </a>
  );
}
