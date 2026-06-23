import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { Card, Empty, ErrorMessage, Loading, PageHeader } from "@/components/ui-common";
import { C, GOVERNORATES } from "@/lib/theme";
import { getMyAchievements, getMyFavoriteLessons, getMyRegisteredLessons, getSupabaseErrorMessage, updateMyProfile } from "@/lib/supabase";

export default function ProfilePage() {
  const { user, isLoggedIn } = useAuth() as any;
  const [profile, setProfile] = useState<any>(user?.profile || null);
  const [registeredLessons, setRegisteredLessons] = useState<any[]>([]);
  const [favoriteLessons, setFavoriteLessons] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [fullName, setFullName] = useState(user?.profile?.full_name || "");
  const [city, setCity] = useState(user?.profile?.city || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.profile?.avatar_url || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    if (!isLoggedIn || !user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    setProfile(user.profile);
    setFullName(user.profile?.full_name || "");
    setCity(user.profile?.city || "");
    setAvatarUrl(user.profile?.avatar_url || "");
    try {
      const [registered, favorites, achievementRes] = await Promise.all([
        getMyRegisteredLessons(user.id),
        getMyFavoriteLessons(user.id),
        getMyAchievements(user.id),
      ]);
      if (registered.error) setError(getSupabaseErrorMessage(registered.error, "تعذّر تحميل دروسك المسجلة."));
      if (favorites.error) setError(getSupabaseErrorMessage(favorites.error, "تعذّر تحميل المفضلة."));
      if (achievementRes.error) setError(getSupabaseErrorMessage(achievementRes.error, "تعذّر تحميل الإنجازات."));
      setRegisteredLessons(registered.data);
      setFavoriteLessons(favorites.data);
      setAchievements(achievementRes.data);
    } catch (err) {
      setError(getSupabaseErrorMessage(err, "تعذّر تحميل الملف الشخصي."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [isLoggedIn, user?.id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    setError("");
    setSuccess("");
    const { data, error } = await updateMyProfile(user.id, {
      full_name: fullName.trim(),
      city: city || null,
      avatar_url: avatarUrl.trim() || null,
    });
    setSaving(false);
    if (error) {
      setError(getSupabaseErrorMessage(error, "تعذّر تحديث الملف الشخصي."));
      return;
    }
    setProfile(data);
    setSuccess("تم تحديث الملف الشخصي بنجاح.");
  };

  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: "32rem", margin: "4rem auto", padding: "0 1.25rem" }}>
        <Card>
          <Empty text="يرجى تسجيل الدخول لعرض الملف الشخصي." />
          <Link href="/login" style={{ display: "block", textAlign: "center", color: C.emeraldDeep, fontWeight: 700 }}>تسجيل الدخول</Link>
        </Card>
      </div>
    );
  }

  if (loading) return <Loading />;

  return (
    <div style={{ maxWidth: "58rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <PageHeader eyebrow="حسابي" title="الملف الشخصي" subtitle="إدارة بياناتك، متابعة نقاطك وإنجازاتك، والوصول إلى دروسك المسجلة والمفضلة." />
      {error && <ErrorMessage text={error} onRetry={load} />}
      {success && <p style={{ padding: "0.75rem 1rem", background: C.sage, color: C.emeraldDeep, borderRadius: "0.5rem", marginBottom: "1rem", fontSize: "0.875rem" }}>{success}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
        <Card>
          <form onSubmit={save} style={{ display: "grid", gap: "0.8rem" }}>
            <label style={{ color: C.ink, fontSize: "0.875rem", fontWeight: 700 }}>الاسم الكامل</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ padding: "0.65rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.parchment, color: C.ink, fontFamily: "inherit" }} />
            <label style={{ color: C.ink, fontSize: "0.875rem", fontWeight: 700 }}>المحافظة</label>
            <select value={city} onChange={(e) => setCity(e.target.value)} style={{ padding: "0.65rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.parchment, color: C.ink, fontFamily: "inherit" }}>
              <option value="">غير محدد</option>
              {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <label style={{ color: C.ink, fontSize: "0.875rem", fontWeight: 700 }}>رابط الصورة الشخصية</label>
            <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." style={{ padding: "0.65rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.parchment, color: C.ink, fontFamily: "inherit" }} />
            <button disabled={saving} type="submit" style={{ padding: "0.65rem 1rem", borderRadius: "0.5rem", border: "none", background: C.emerald, color: C.parchment, fontFamily: "inherit", fontWeight: 700, opacity: saving ? 0.7 : 1 }}>{saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}</button>
          </form>
        </Card>

        <Card>
          <h2 style={{ margin: "0 0 1rem", color: C.emeraldDeep, fontFamily: "Amiri, serif" }}>النقاط والإنجازات</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ padding: "1rem", borderRadius: "0.5rem", background: C.parchmentDeep, textAlign: "center" }}>
              <strong style={{ color: C.brassDeep, fontSize: "1.8rem" }}>{profile?.points ?? 0}</strong>
              <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.8rem" }}>نقطة</p>
            </div>
            <div style={{ padding: "1rem", borderRadius: "0.5rem", background: C.sage, textAlign: "center" }}>
              <strong style={{ color: C.emeraldDeep, fontSize: "1.8rem" }}>{profile?.level ?? 1}</strong>
              <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.8rem" }}>المستوى</p>
            </div>
          </div>
          {achievements.length === 0 ? (
            <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.875rem" }}>لا توجد إنجازات مسجلة بعد.</p>
          ) : (
            <div style={{ display: "grid", gap: "0.45rem" }}>
              {achievements.slice(0, 5).map((achievement: any) => (
                <div key={achievement.id} style={{ padding: "0.55rem 0.75rem", borderRadius: "0.5rem", background: C.parchment }}>
                  <p style={{ margin: 0, color: C.ink, fontWeight: 700 }}>{achievement.badge}</p>
                  <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.75rem" }}>{new Date(achievement.earned_at).toLocaleDateString("ar-KW")}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
        <Card>
          <h2 style={{ margin: "0 0 1rem", color: C.emeraldDeep, fontFamily: "Amiri, serif" }}>آخر الدروس المسجلة</h2>
          {registeredLessons.length === 0 ? <p style={{ color: C.inkSoft, margin: 0 }}>لا توجد دروس مسجلة.</p> : registeredLessons.slice(0, 4).map((lesson: any) => (
            <Link key={lesson.id} href={`/lessons/${lesson.id}`} style={{ display: "block", padding: "0.65rem 0", borderBottom: `1px solid ${C.line}`, color: C.ink }}>{lesson.title}</Link>
          ))}
          <Link href="/my-lessons" style={{ display: "inline-block", marginTop: "0.75rem", color: C.brassDeep, fontWeight: 700 }}>عرض كل دروسي</Link>
        </Card>
        <Card>
          <h2 style={{ margin: "0 0 1rem", color: C.emeraldDeep, fontFamily: "Amiri, serif" }}>المفضلة</h2>
          {favoriteLessons.length === 0 ? <p style={{ color: C.inkSoft, margin: 0 }}>لا توجد دروس مفضلة.</p> : favoriteLessons.slice(0, 4).map((lesson: any) => (
            <Link key={lesson.id} href={`/lessons/${lesson.id}`} style={{ display: "block", padding: "0.65rem 0", borderBottom: `1px solid ${C.line}`, color: C.ink }}>{lesson.title}</Link>
          ))}
        </Card>
      </div>
    </div>
  );
}
