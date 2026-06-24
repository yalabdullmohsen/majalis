import { useEffect, useRef, useState } from "react";
import { C } from "@/lib/theme";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SCRIPT_ID = "cloudflare-turnstile-script";
const TURNSTILE_SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim();

function loadTurnstileScript() {
  if (document.getElementById(TURNSTILE_SCRIPT_ID)) return;
  const script = document.createElement("script");
  script.id = TURNSTILE_SCRIPT_ID;
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

export function isCaptchaConfigured() {
  return Boolean(TURNSTILE_SITE_KEY);
}

export function TurnstileCaptcha({ onToken }: { onToken: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) {
      setError("لم يتم ضبط مفتاح CAPTCHA العام.");
      onToken("");
      return;
    }

    loadTurnstileScript();

    let cancelled = false;
    const interval = window.setInterval(() => {
      if (cancelled || widgetIdRef.current || !containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "light",
        callback: (token) => {
          setError("");
          onToken(token);
        },
        "expired-callback": () => {
          onToken("");
          setError("انتهت صلاحية التحقق الأمني، أعد المحاولة.");
        },
        "error-callback": () => {
          onToken("");
          setError("تعذر تحميل التحقق الأمني.");
        },
      });
    }, 250);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [onToken]);

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div ref={containerRef} style={{ display: "flex", justifyContent: "center", minHeight: "65px" }} />
      {error && (
        <p style={{ color: "#b91c1c", background: "#fef2f2", borderRadius: "0.375rem", padding: "0.5rem", fontSize: "0.8rem", textAlign: "center", marginTop: "0.5rem" }}>
          {error}
        </p>
      )}
      {!TURNSTILE_SITE_KEY && (
        <p style={{ color: C.inkSoft, fontSize: "0.78rem", textAlign: "center", marginTop: "0.5rem" }}>
          أضف VITE_TURNSTILE_SITE_KEY لتفعيل تسجيل الدخول والتسجيل.
        </p>
      )}
    </div>
  );
}
