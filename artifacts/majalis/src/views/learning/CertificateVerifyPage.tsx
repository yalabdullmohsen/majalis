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
    <div className="page-shell narrow cvp-shell">
      <h1 className="cvp-title">التحقق من الشهادة</h1>

      {loading ? (
        <p>جاري التحقق...</p>
      ) : result?.valid ? (
        <div className="cvp-result cvp-result--valid">
          <p className="cvp-checkmark">✓</p>
          <h2 className="cvp-result-title">شهادة صالحة</h2>
          <p className="cvp-result-desc">{result.certificate?.title}</p>
          <p className="cvp-result-code">رمز: {code}</p>
        </div>
      ) : (
        <div className="cvp-result cvp-result--invalid">
          <p className="cvp-result-msg">{result?.message || "لم يتم العثور على شهادة بهذا الرمز"}</p>
        </div>
      )}

      <Link href="/learning/paths" className="cvp-back-link">المسارات العلمية</Link>
    </div>
  );
}
