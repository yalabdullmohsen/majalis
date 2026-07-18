import { Link } from "wouter";
import { Clock } from "lucide-react";
import { isFeatureEnabled, type Flag } from "@/lib/feature-flags";

interface FeatureGateProps {
  flag: Flag;
  children: React.ReactNode;
  label?: string;
}

/** يعرض المحتوى إذا كان الـ flag مفعّلاً، وإلا يعرض شاشة "قيد التطوير" */
export function FeatureGate({ flag, children, label }: FeatureGateProps) {
  if (isFeatureEnabled(flag)) return <>{children}</>;

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.2rem",
        padding: "2rem 1rem",
        textAlign: "center",
        direction: "rtl",
      }}
    >
      <span
        style={{
          background: "rgba(31,77,58,0.08)",
          color: "#176B57",
          padding: "1rem",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-hidden="true"
      >
        <Clock size={36} strokeWidth={1.5} />
      </span>

      <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1a1a1a", margin: 0 }}>
        {label ?? "هذه الميزة قيد التطوير"}
      </h1>

      <p style={{ color: "#555", maxWidth: 380, lineHeight: 1.65, margin: 0, fontSize: "0.92rem" }}>
        نعمل على إتاحة هذه الميزة في أقرب وقت. تابع{" "}
        <Link href="/features-in-progress" style={{ color: "#176B57", fontWeight: 700 }}>
          خارطة التطوير
        </Link>{" "}
        لمعرفة آخر التحديثات.
      </p>

      <div style={{ display: "flex", gap: "0.7rem", flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/features-in-progress"
          style={{
            padding: "0.55rem 1.2rem",
            borderRadius: "0.55rem",
            background: "#176B57",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "0.88rem",
          }}
        >
          خارطة التطوير
        </Link>
        <Link
          href="/"
          style={{
            padding: "0.55rem 1.2rem",
            borderRadius: "0.55rem",
            border: "1.5px solid #176B57",
            color: "#176B57",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "0.88rem",
          }}
        >
          الرئيسية
        </Link>
      </div>
    </div>
  );
}
