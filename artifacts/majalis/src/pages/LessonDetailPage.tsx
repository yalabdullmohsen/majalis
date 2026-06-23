import { useEffect, useState } from "react";
import { Link } from "wouter";
import SheikhAvatar from "@/components/SheikhAvatar";
import { useAuth } from "@/components/AuthProvider";
import { Empty, ErrorMessage, Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import {
  addLessonFavorite,
  deleteLessonRating,
  getLessonById,
  getLessonRatings,
  getMyFavoriteLessonIds,
  getMyLessonRating,
  getMyRegistrations,
  getSupabaseErrorMessage,
  registerForLesson,
  removeLessonFavorite,
  unregisterFromLesson,
  upsertLessonRating,
} from "@/lib/supabase";

export default function LessonDetailPage({ params }: { params: { id: string } }) {
  const { user, isLoggedIn } = useAuth() as any;
  const [lesson, setLesson] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [average, setAverage] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [myRating, setMyRating] = useState<any>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [comment, setComment] = useState("");
  const [registered, setRegistered] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const lessonRes = await getLessonById(params.id);
      if (lessonRes.error) setError(getSupabaseErrorMessage(lessonRes.error, "تعذّر تحميل الدرس."));
      setLesson(lessonRes.data);

      const ratingRes = await getLessonRatings(params.id);
      if (ratingRes.error) setError(getSupabaseErrorMessage(ratingRes.error, "تعذّر تحميل تقييمات الدرس."));
      setRatings(ratingRes.data);
      setAverage(ratingRes.average);
      setRatingCount(ratingRes.count);

      if (isLoggedIn && user?.id) {
        const [regs, favs, mine] = await Promise.all([
          getMyRegistrations(user.id),
          getMyFavoriteLessonIds(user.id),
          getMyLessonRating(user.id, params.id),
        ]);
        setRegistered(regs.includes(params.id));
        setFavorite((favs.data || []).includes(params.id));
        if (mine.data) {
          setMyRating(mine.data);
          setRatingValue(mine.data.rating || 5);
          setComment(mine.data.comment || "");
        } else {
          setMyRating(null);
          setRatingValue(5);
          setComment("");
        }
      }
    } catch (err) {
      setError(getSupabaseErrorMessage(err, "تعذّر تحميل تفاصيل الدرس."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [params.id, isLoggedIn, user?.id]);

  const requireLogin = () => {
    if (!isLoggedIn) {
      setError("يرجى تسجيل الدخول أولًا لاستخدام هذه الميزة.");
      return false;
    }
    return true;
  };

  const toggleRegistration = async () => {
    if (!requireLogin()) return;
    setSaving(true);
    const res = registered ? await unregisterFromLesson(user.id, params.id) : await registerForLesson(user.id, params.id);
    setSaving(false);
    if (res.error) {
      setError(getSupabaseErrorMessage(res.error, registered ? "تعذّر إلغاء التسجيل." : "تعذّر التسجيل في الدرس."));
      return;
    }
    setRegistered(!registered);
  };

  const toggleFavorite = async () => {
    if (!requireLogin()) return;
    setSaving(true);
    const res = favorite ? await removeLessonFavorite(user.id, params.id) : await addLessonFavorite(user.id, params.id);
    setSaving(false);
    if (res.error) {
      setError(getSupabaseErrorMessage(res.error, favorite ? "تعذّر إزالة الدرس من المفضلة." : "تعذّر إضافة الدرس إلى المفضلة."));
      return;
    }
    setFavorite(!favorite);
  };

  const saveRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireLogin()) return;
    setSaving(true);
    const res = await upsertLessonRating(user.id, params.id, ratingValue, comment);
    setSaving(false);
    if (res.error) {
      setError(getSupabaseErrorMessage(res.error, "تعذّر حفظ التقييم."));
      return;
    }
    await load();
  };

  const removeRating = async () => {
    if (!requireLogin()) return;
    setSaving(true);
    const res = await deleteLessonRating(user.id, params.id);
    setSaving(false);
    if (res.error) {
      setError(getSupabaseErrorMessage(res.error, "تعذّر حذف التقييم."));
      return;
    }
    await load();
  };

  if (loading) return <Loading />;
  if (!lesson) return <Empty text="لم يُعثر على الدرس." />;

  return (
    <div style={{ maxWidth: "52rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <Link href="/lessons" style={{ color: C.brassDeep, fontSize: "0.875rem", display: "inline-block", marginBottom: "1.25rem" }}>← العودة إلى الدروس</Link>
      {error && <ErrorMessage text={error} onRetry={load} />}

      <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.75rem", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            {lesson.category && <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.6rem", borderRadius: "999px", background: C.sage, color: C.emeraldDeep }}>{lesson.category}</span>}
            <h1 style={{ margin: "0.75rem 0", fontFamily: "Amiri, serif", color: C.emeraldDeep, fontSize: "2rem", lineHeight: 1.35 }}>{lesson.title}</h1>
            <p style={{ color: C.inkSoft, margin: 0, fontSize: "0.875rem" }}>{[lesson.mosque, lesson.city, lesson.schedule].filter(Boolean).join(" · ")}</p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button onClick={toggleFavorite} disabled={saving} style={{ padding: "0.55rem 0.9rem", borderRadius: "0.5rem", border: `1px solid ${favorite ? C.brass : C.line}`, background: favorite ? "#FEF3C7" : C.panel, color: favorite ? C.brassDeep : C.inkSoft, fontFamily: "inherit" }}>
              {favorite ? "★ في المفضلة" : "☆ أضف للمفضلة"}
            </button>
            <button onClick={toggleRegistration} disabled={saving} style={{ padding: "0.55rem 1rem", borderRadius: "0.5rem", border: `1px solid ${registered ? C.line : C.emerald}`, background: registered ? C.parchmentDeep : C.emerald, color: registered ? C.inkSoft : C.parchment, fontFamily: "inherit", fontWeight: 700 }}>
              {registered ? "إلغاء التسجيل" : "سجّل حضوري"}
            </button>
          </div>
        </div>

        {lesson.sheikhs && (
          <Link href={`/sheikhs/${lesson.sheikh_id}`} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1.25rem", padding: "0.9rem", borderRadius: "0.5rem", background: C.parchment }}>
            <SheikhAvatar sheikh={lesson.sheikhs} size={52} />
            <div>
              <p style={{ margin: 0, color: C.emeraldDeep, fontWeight: 700 }}>{lesson.sheikhs.name}</p>
              <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.75rem" }}>{lesson.sheikhs.city || "شيخ معتمد"}</p>
            </div>
          </Link>
        )}

        {lesson.description && <p style={{ color: C.ink, lineHeight: 1.9, marginTop: "1.25rem", whiteSpace: "pre-wrap" }}>{lesson.description}</p>}
      </section>

      <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.75rem", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ margin: "0 0 0.75rem", color: C.emeraldDeep, fontFamily: "Amiri, serif" }}>تقييم الدرس</h2>
        <p style={{ margin: "0 0 1rem", color: C.inkSoft, fontSize: "0.875rem" }}>
          متوسط التقييم: <strong>{average ? average.toFixed(1) : "لا يوجد"}</strong> من 5 ({ratingCount} تقييم)
        </p>
        <form onSubmit={saveRating} style={{ display: "grid", gap: "0.75rem" }}>
          <select value={ratingValue} onChange={(e) => setRatingValue(Number(e.target.value))} style={{ padding: "0.6rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.parchment, color: C.ink, fontFamily: "inherit" }}>
            {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} نجوم</option>)}
          </select>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="تعليق اختياري على الدرس..." rows={3} style={{ padding: "0.75rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.parchment, color: C.ink, fontFamily: "inherit", resize: "vertical" }} />
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button type="submit" disabled={saving} style={{ padding: "0.55rem 1rem", borderRadius: "0.5rem", border: "none", background: C.emerald, color: C.parchment, fontFamily: "inherit", fontWeight: 700 }}>{myRating ? "تحديث التقييم" : "إرسال التقييم"}</button>
            {myRating && <button type="button" disabled={saving} onClick={removeRating} style={{ padding: "0.55rem 1rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel, color: "#991B1B", fontFamily: "inherit" }}>حذف تقييمي</button>}
          </div>
        </form>
      </section>

      {ratings.length > 0 && (
        <section style={{ display: "grid", gap: "0.75rem" }}>
          {ratings.slice(0, 5).map((row: any) => (
            <article key={`${row.user_id}-${row.lesson_id}`} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1rem" }}>
              <p style={{ margin: "0 0 0.35rem", color: C.brassDeep, fontWeight: 700 }}>{row.rating} / 5</p>
              {row.comment && <p style={{ margin: 0, color: C.ink, lineHeight: 1.8 }}>{row.comment}</p>}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
