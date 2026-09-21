/**
 * مدخل /admin بعد Wave 7:
 * - بدون ?section → لوحة v3
 * - مع ?section → Legacy shell (CRUD لم يُرحَّل بعد)
 */
import { Redirect, useSearch } from "wouter";
import AdminPage from "@/views/AdminPage";

export default function AdminEntryBridge() {
  const search = useSearch();
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const section = params.get("section");
  if (section && section.trim()) {
    return <AdminPage />;
  }
  return <Redirect to="/admin/v3" />;
}
