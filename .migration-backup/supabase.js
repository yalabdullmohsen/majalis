// =====================================================================
//  lib/supabase.js — طبقة الاتصال بقاعدة البيانات + كل دوال جلب البيانات
//
//  هذا هو "العقل" الذي يربط كل صفحات الموقع بقاعدة Supabase.
//  يقرأ المفاتيح من .env.local تلقائيًا.
// =====================================================================

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn("⚠️ متغيرات Supabase غير مضبوطة. تأكد من ملف .env.local");
}

export const supabase = createClient(url, key);

/* ============================ المصادقة ============================ */

export async function signUp(email, password, fullName) {
  return await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
}

export async function signIn(email, password) {
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
  return { ...user, profile };
}

/* ============================ المشايخ ============================ */

export async function getSheikhs() {
  const { data, error } = await supabase
    .from("sheikhs").select("*").eq("status", "approved").order("name");
  return { data: data || [], error };
}

export async function getAllSheikhs() {
  const { data, error } = await supabase
    .from("sheikhs").select("id, name, status, is_verified, created_at").order("name");
  return { data: data || [], error };
}

export async function deleteSheikh(id) {
  return await supabase.from("sheikhs").delete().eq("id", id);
}

export async function getSheikhById(id) {
  const { data: sheikh } = await supabase
    .from("sheikhs").select("*").eq("id", id).single();
  const { data: lessons } = await supabase
    .from("lessons").select("*").eq("sheikh_id", id).eq("status", "approved");
  return { sheikh, lessons: lessons || [] };
}

/* ============================ الدروس ============================ */

export async function getLessons({ category, city, search } = {}) {
  let q = supabase
    .from("lessons")
    .select("*, sheikhs(name, city)")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  if (category && category !== "الكل") q = q.eq("category", category);
  if (city && city !== "كل المحافظات") q = q.eq("city", city);
  const { data, error } = await q;
  let result = data || [];
  if (search?.trim()) {
    const s = search.trim();
    result = result.filter(
      (l) => l.title?.includes(s) || l.mosque?.includes(s) || l.city?.includes(s)
    );
  }
  return { data: result, error };
}

export async function registerForLesson(userId, lessonId) {
  return await supabase
    .from("lesson_registrations")
    .insert({ user_id: userId, lesson_id: lessonId });
}

export async function unregisterFromLesson(userId, lessonId) {
  return await supabase
    .from("lesson_registrations").delete()
    .eq("user_id", userId).eq("lesson_id", lessonId);
}

export async function getMyRegistrations(userId) {
  const { data } = await supabase
    .from("lesson_registrations")
    .select("lesson_id").eq("user_id", userId);
  return (data || []).map((r) => r.lesson_id);
}

/* ============================ الفوائد ============================ */

export async function getApprovedFawaid() {
  const { data, error } = await supabase
    .from("fawaid").select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  return { data: data || [], error };
}

export async function submitFawaid(userId, text, authorName) {
  return await supabase.from("fawaid").insert({
    text, author_name: authorName, submitted_by: userId, status: "pending",
  });
}

export async function getPendingFawaid() {
  const { data } = await supabase
    .from("fawaid").select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function moderateFawaid(id, status) {
  return await supabase.from("fawaid").update({ status }).eq("id", id);
}

/* ============================ المكتبة العلمية ============================ */

export async function getLibrary({ type, category } = {}) {
  let q = supabase.from("library_items").select("*").eq("status", "approved");
  if (type) q = q.eq("type", type);
  if (category) q = q.eq("category", category);
  const { data, error } = await q.order("created_at", { ascending: false });
  return { data: data || [], error };
}

/* ============================ الإعجاز العلمي ============================ */

export async function getMiracles({ category, sourceType } = {}) {
  let q = supabase.from("scientific_miracles").select("*").eq("status", "approved");
  if (category) q = q.eq("category", category);
  if (sourceType) q = q.eq("source_type", sourceType);
  const { data, error } = await q.order("created_at", { ascending: false });
  return { data: data || [], error };
}

/* ============================ الإنجازات ============================ */

export async function getMyAchievements(userId) {
  const { data } = await supabase
    .from("achievements").select("*")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });
  return data || [];
}

/* ============================ البحث الموحّد ============================ */

export async function searchEverything(term) {
  const q = `%${term}%`;
  const [lessons, library, miracles, sheikhs] = await Promise.all([
    supabase.from("lessons").select("id, title, category").eq("status", "approved").ilike("title", q),
    supabase.from("library_items").select("id, title, type").eq("status", "approved").ilike("title", q),
    supabase.from("scientific_miracles").select("id, title, category").eq("status", "approved").ilike("title", q),
    supabase.from("sheikhs").select("id, name").ilike("name", q),
  ]);
  return {
    lessons: lessons.data || [],
    library: library.data || [],
    miracles: miracles.data || [],
    sheikhs: sheikhs.data || [],
  };
}
