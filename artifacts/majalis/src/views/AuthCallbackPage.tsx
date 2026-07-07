import { useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Loading } from "@/components/ui-common";

export default function AuthCallbackPage() {
  const [, navigate] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || "/";

    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        navigate(next.startsWith("/") ? next : "/");
      }
    });

    // Fallback: redirect after Supabase processes the hash
    const timer = setTimeout(() => navigate(next.startsWith("/") ? next : "/"), 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="auth-callback-loading">
      <Loading />
    </div>
  );
}
