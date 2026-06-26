import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { verifyLearningCertificate } from "@/lib/digital-learning-service";

export default function CertificateVerifyPage() {
  const params = useParams();
  const code = params.code || "";
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) {
      setLoading(false);
      return;
    }
    verifyLearningCertificate(code)
      .then(setResult)
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div className="page-shell narrow" style={{ textAlign: "center", paddingTop: "3rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>التحقق من الشهادة</h1>

      {loading ? (
        <p>جاري التحقق...</p>
      ) : result?.valid ? (
        <div style={{ padding: "2rem", borderRadius: "0.5rem", border: "2px solid var(--emerald-deep)", background: "var(--panel)" }}>
          <p style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>✓</p>
          <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>شهادة صالحة</h2>
          <p style={{ color: "var(--ink-soft)" }}>{result.certificate?.title}</p>
          <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>رمز: {code}</p>
        </div>
      ) : (
        <div style={{ padding: "2rem", borderRadius: "0.5rem", border: "1px solid var(--line)" }}>
          <p style={{ color: "var(--ink-soft)" }}>{result?.message || "لم يتم العثور على شهادة بهذا الرمز"}</p>
        </div>
      )}

      <Link href="/learning/paths" style={{ display: "inline-block", marginTop: "2rem" }}>المسارات العلمية</Link>
    </div>
  );
}
