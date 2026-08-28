import { useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Loading } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
import { sanitizeAuthNext } from "@/lib/auth-redirect";

export { sanitizeAuthNext } from "@/lib/auth-redirect";

export default function AuthCallbackPage() {
  const [, navigate] = useLocation();

  useEffect(() => {
    applyPageSeo({
      path: "/auth/callback",
      title: "تسجيل الدخول | سُنّة",
      description: "جارٍ إتمام تسجيل الدخول…",
      robots: "noindex, nofollow",
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = sanitizeAuthNext(params.get("next"));

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate("/auth/update-password");
        return;
      }
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        void supabase.auth.getSession().then(({ data }) => {
          if (!data.session) return;
          // إن وُجدت جلسة استعادة عبر hash دون event واضح — احترم next إن كان update-password
          if (next === "/auth/update-password") {
            navigate("/auth/update-password");
            return;
          }
          navigate(next);
        });
      }
    });

    // Fallback: redirect after Supabase processes the hash
    const timer = setTimeout(() => {
      void supabase.auth.getSession().then(({ data }) => {
        if (!data.session) {
          navigate("/login");
          return;
        }
        if (next === "/auth/update-password") {
          navigate("/auth/update-password");
          return;
        }
        navigate(next);
      });
    }, 3000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="auth-callback-loading">
      <Loading />
    </div>
  );
}
