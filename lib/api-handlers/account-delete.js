import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export default async function accountDeleteHandler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // التحقق من الـ JWT
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "مطلوب تسجيل الدخول" });
  }
  const token = authHeader.slice(7);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY) {
    console.error("[account-delete] Missing Supabase env vars");
    return res.status(500).json({ error: "إعدادات الخادم غير مكتملة" });
  }

  // التحقق من صلاحية الـ token وجلب userId
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: authErr } = await anonClient.auth.getUser(token);
  if (authErr || !user) {
    return res.status(401).json({ error: "رمز المصادقة غير صالح" });
  }
  const userId = user.id;

  // العميل بصلاحيات الخدمة لحذف البيانات
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    // حذف البيانات المرتبطة بالمستخدم بالتسلسل
    await adminClient.from("user_progress").delete().eq("user_id", userId);
    await adminClient.from("user_quran_position").delete().eq("user_id", userId);
    await adminClient.from("scholar_follows").delete().eq("user_id", userId).throwOnError().catch(() => {});
    await adminClient.from("user_achievements").delete().eq("user_id", userId).throwOnError().catch(() => {});
    await adminClient.from("user_bookmarks").delete().eq("user_id", userId).throwOnError().catch(() => {});

    // حذف حساب المصادقة نهائياً
    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteErr) throw deleteErr;

    console.info(`[account-delete] Deleted user ${userId}`);
    return res.status(200).json({ ok: true, message: "تم حذف الحساب بنجاح" });
  } catch (err) {
    console.error("[account-delete] Error:", err);
    return res.status(500).json({ error: "حدث خطأ أثناء حذف الحساب، يرجى المحاولة لاحقاً" });
  }
}
