"use client";

import { useEffect, useRef, useState } from "react";

export default function QuranPage() {
  const [loaded, setLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", flexDirection: "column",
      background: "#0a1810", zIndex: 200, direction: "rtl",
    }}>
      {/* شريط علوي */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.6rem",
        padding: "0.65rem 1rem", paddingTop: "max(0.65rem, env(safe-area-inset-top))",
        background: "linear-gradient(to bottom, rgba(10,24,16,0.98) 0%, rgba(10,24,16,0.85) 100%)",
        borderBottom: "1px solid rgba(106,181,142,0.18)", flexShrink: 0,
      }}>
        <button
          onClick={() => window.history.back()}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.3rem",
            minWidth: 44, minHeight: 44, padding: "0.35rem 0.75rem",
            border: "none", borderRadius: "0.65rem",
            background: "rgba(255,255,255,0.1)", color: "#fff",
            fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 700,
            cursor: "pointer", backdropFilter: "blur(8px)", flexShrink: 0,
          }}
        >
          ← رجوع
        </button>

        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#fff" }}>
            المصحف الشريف
          </div>
          <div style={{ fontSize: "0.72rem", color: "rgba(168,232,200,0.65)" }}>
            برواية حفص عن عاصم
          </div>
        </div>

        <a
          href="/quran.pdf"
          download="المصحف الشريف.pdf"
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.3rem",
            minWidth: 44, minHeight: 44, padding: "0.35rem 0.75rem",
            border: "none", borderRadius: "0.65rem",
            background: "rgba(106,181,142,0.15)", color: "#a8e8c8",
            fontFamily: "inherit", fontSize: "0.8rem", fontWeight: 700,
            cursor: "pointer", textDecoration: "none", flexShrink: 0,
          }}
        >
          ⬇ تحميل
        </a>
      </div>

      {/* المحتوى الرئيسي */}
      {isMobile ? (
        /* على الجوال: زر لفتح الـ PDF في المتصفح (أفضل تجربة) */
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "1.5rem",
          padding: "2rem", textAlign: "center",
        }}>
          <div style={{ fontSize: "4rem", lineHeight: 1 }}>📖</div>
          <div style={{ color: "#fff", fontSize: "1.125rem", fontWeight: 700 }}>
            المصحف الشريف
          </div>
          <div style={{ color: "rgba(168,232,200,0.7)", fontSize: "0.9rem", maxWidth: 280 }}>
            برواية حفص عن عاصم — ٦٠٤ صفحة
          </div>
          <a
            href="/quran.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              padding: "0.85rem 2rem", borderRadius: "0.75rem",
              background: "rgba(106,181,142,0.2)", border: "1px solid rgba(106,181,142,0.4)",
              color: "#a8e8c8", fontFamily: "inherit", fontSize: "1rem",
              fontWeight: 700, textDecoration: "none", cursor: "pointer",
            }}
          >
            📖 فتح المصحف
          </a>
          <a
            href="/quran.pdf"
            download="المصحف الشريف.pdf"
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              padding: "0.65rem 1.5rem", borderRadius: "0.75rem",
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.7)", fontFamily: "inherit", fontSize: "0.875rem",
              fontWeight: 600, textDecoration: "none", cursor: "pointer",
            }}
          >
            ⬇ تحميل PDF
          </a>
        </div>
      ) : (
        /* على الحاسوب: عرض مدمج كامل */
        <>
          {!loaded && (
            <div style={{
              position: "absolute", inset: "60px 0 0",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: "1rem", color: "rgba(255,255,255,0.5)", fontSize: "0.875rem",
              zIndex: 1,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                border: "3px solid rgba(106,181,142,0.2)",
                borderTopColor: "rgba(106,181,142,0.8)",
                animation: "mf-spin 0.75s linear infinite",
              }} />
              جاري تحميل المصحف…
            </div>
          )}
          <iframe
            ref={iframeRef}
            src="/quran.pdf"
            title="المصحف الشريف"
            onLoad={() => setLoaded(true)}
            style={{
              flex: 1, border: "none", opacity: loaded ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          />
        </>
      )}
    </div>
  );
}
