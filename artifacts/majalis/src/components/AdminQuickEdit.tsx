import { Pencil } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

type AdminQuickEditProps = {
  /** اسم القسم في لوحة التحكم (مثال: "lessons", "sheikhs", "library") */
  section: string;
  /** نص البحث المراد تعبئته مسبقاً عند الانتقال للإدارة */
  searchTerm?: string;
  /** التسمية التوضيحية (اختياري) */
  label?: string;
};

/**
 * زر تعديل سريع يظهر فقط للمشرفين — ينقل مباشرةً لقسم الإدارة مع تعبئة البحث
 */
export function AdminQuickEdit({ section, searchTerm, label }: AdminQuickEditProps) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;

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
