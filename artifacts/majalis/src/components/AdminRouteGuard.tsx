import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "./AuthProvider";
import { Loading } from "./ui-common";
import { ADMIN_ACCESS_DENIED_MESSAGE } from "@/lib/auth-messages";
import { C } from "@/lib/theme";

/**
 * AdminRouteGuard — حارس صفحات لوحة التحكم
 *
 * سلوك مُحسَّن:
 * - إذا كان المستخدم أدمن ثم اختفت جلسته لحظياً (تجديد توكن، خطأ شبكة) →
 *   انتظر GRACE_MS قبل إعادة التوجيه لمنع الطرد العشوائي
 * - لا يُعيد التوجيه إذا كان `loading` لا يزال صحيحاً
 * - لا يُعيد التوجيه إذا كانت الجلسة تُجدَّد بشكل طبيعي
 */

// مدة الانتظار (بالمللي‌ثانية) قبل القطع بأن الجلسة انتهت فعلاً
const GRACE_MS = 4_000;

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoggedIn, loading } = useAuth();
  const [, navigate] = useLocation();
  const [denied, setDenied] = useState(false);

  // نتتبع إذا كان المستخدم قد حُقِّق منه كأدمن في أي وقت سابق
  const everAuthenticatedRef = useRef(false);
  const redirectTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [graceExpired, setGraceExpired] = useState(false);

  // نسجّل أول تحقق ناجح
  useEffect(() => {
    if (isAdmin) {
      everAuthenticatedRef.current = true;
      setGraceExpired(false);
      // نلغي أي مؤقت انتظار موجود إذا عادت الجلسة
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    }
  }, [isAdmin]);

  useEffect(() => {
    if (loading) return;

    if (!isLoggedIn) {
      // إذا كان المستخدم أدمناً من قبل → انتظر GRACE_MS قبل إعادة التوجيه
      if (everAuthenticatedRef.current && !graceExpired) {
        if (!redirectTimerRef.current) {
          redirectTimerRef.current = setTimeout(() => {
            setGraceExpired(true);
            redirectTimerRef.current = null;
          }, GRACE_MS);
        }
        return;
      }
      // انتهت فترة الانتظار أو لم يسبق توثيق أدمن → أعد التوجيه
      navigate("/login?next=/admin");
      return;
    }

    // المستخدم مسجّل → ألغِ أي مؤقت انتظار قائم
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    setGraceExpired(false);

    if (!isAdmin) {
      setDenied(true);
    }
  }, [isAdmin, isLoggedIn, loading, navigate, graceExpired]);

  // تنظيف عند إلغاء تحميل المكوّن
  useEffect(() => () => {
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
  }, []);

  // ── حالة التحميل ─────────────────────────────────────────
  if (loading) return <Loading />;

  // ── فترة انتظار بعد اختفاء الجلسة مؤقتاً ──────────────
  if (!isLoggedIn && everAuthenticatedRef.current && !graceExpired) {
    return <Loading />;
  }

  // ── غير مسجّل ────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="login-page">
        <div className="login-card">
          <p className="ds-empty">جاري التحويل إلى صفحة الدخول…</p>
          <Link href="/login?next=/admin" className="login-back-link">
            الذهاب لتسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  // ── مسجّل لكن بدون صلاحية أدمن ──────────────────────────
  if (denied || !isAdmin) {
    return (
      <div className="login-page">
        <div className="login-card login-card--denied">
          <h1
            style={{
              color: C.emeraldDeep,
              fontSize: "1.25rem",
              marginBottom: "0.75rem",
              textAlign: "center",
            }}
          >
            غير مصرح
          </h1>
          <p
            style={{
              color: C.inkSoft,
              marginBottom: "1.25rem",
              lineHeight: 1.7,
              textAlign: "center",
            }}
          >
            {ADMIN_ACCESS_DENIED_MESSAGE}
          </p>
          <div className="login-actions">
            <Link href="/login" className="login-back-link">
              العودة لتسجيل الدخول
            </Link>
            <Link href="/" className="login-back-link">
              العودة للصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── الأدمن ← أعرض المحتوى ────────────────────────────────
  return <>{children}</>;
}
