import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "./AuthProvider";
import { ADMIN_ACCESS_DENIED_MESSAGE } from "@/lib/auth-messages";

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
  const { isAdmin, isLoggedIn, loading, refreshUser } = useAuth();
  const [, navigate] = useLocation();
  const [denied, setDenied] = useState(false);

  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [graceExpired, setGraceExpired] = useState(false);

  // AuthProvider يستخدم getSession() المحلي السريع على المسارات العامة
  // (تحسين أداء: getUser() وحده كان مصدر بطء 9-11 ثانية على iOS)، وهذا
  // لا يكتشف جلسة أُلغيت من الخادم. صفحات الأدمن حسّاسة، فنطلب هنا تحقّقًا
  // فعليًا من الخادم (getCurrentUser داخليًا يتحول لـgetUser() تلقائيًا
  // لأن المسار الحالي يبدأ بـ/admin) فور دخول الحارس — دون حجب العرض إن
  // كانت الحالة المحلية صحيحة أصلاً، فقط تصحيحها إن اختلف الخادم.
  useEffect(() => {
    void refreshUser();
  }, []);

  // نسجّل أول تحقق ناجح — يلغي أي مؤقت انتظار قائم إن عادت الجلسة
  useEffect(() => {
    if (isAdmin) {
      setGraceExpired(false);
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    }
  }, [isAdmin]);

  useEffect(() => {
    if (loading) return;

    if (!isLoggedIn) {
      // فترة الانتظار تُطبَّق دومًا الآن، وليس فقط لمن كان أدمن من قبل.
      // السبب: مؤقّت أمان في AuthProvider (`PAGE_LOAD_TIMEOUT_MS`) قد يجبر
      // `loading=false` قبل اكتمال التحقق الفعلي من الجلسة تحت حِمل شبكة/خادم
      // عالٍ — فتكون `isLoggedIn=false` مؤقّتًا وخاطئة حتى تصل نتيجة الفحص
      // الحقيقية بعد لحظات. اكتُشف حيًّا: هذا بالضبط ما يجعل الدخول لأول مرة
      // إلى /admin "يطرد المستخدم فورًا ثم يعيده" — لأن صفحة الدخول تُعيد
      // التوجيه تلقائيًا لـ/admin بمجرد أن تصل جلسة المستخدم الحقيقية متأخرة.
      // الانتظار هنا (بدل التوجيه الفوري) يمنع هذا السباق من الأساس.
      if (!graceExpired) {
        if (!redirectTimerRef.current) {
          redirectTimerRef.current = setTimeout(() => {
            setGraceExpired(true);
            redirectTimerRef.current = null;
          }, GRACE_MS);
        }
        return;
      }
      // انتهت فترة الانتظار فعليًا بلا أي تحقّق ناجح → أعد التوجيه
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
  if (loading) {
    return (
      <div className="login-page">
        <div className="login-card" role="status" aria-live="polite">
          <p className="ds-empty">جارٍ التحقق من تسجيل الدخول وصلاحية الوصول…</p>
        </div>
      </div>
    );
  }

  // ── فترة انتظار قبل الجزم بعدم تسجيل الدخول (أولى أو بعد اختفاء مؤقت) ──
  if (!isLoggedIn && !graceExpired) {
    return (
      <div className="login-page">
        <div className="login-card" role="status" aria-live="polite">
          <p className="ds-empty">جارٍ التحقق من تسجيل الدخول وصلاحية الوصول…</p>
        </div>
      </div>
    );
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
          <h1 className="access-denied__title">غير مصرح</h1>
          <p className="access-denied__body">{ADMIN_ACCESS_DENIED_MESSAGE}</p>
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
