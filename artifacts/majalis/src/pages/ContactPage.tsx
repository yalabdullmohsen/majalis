import { useState } from "react";
import { PageHeader, Card } from "@/components/ui-common";
import { C } from "@/lib/theme";

export default function ContactPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const mailto = `mailto:info@majalis.example?subject=${encodeURIComponent(subject || "رسالة من منصة مجالس")}&body=${encodeURIComponent(message)}`;

  return (
    <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <PageHeader
        eyebrow="خدمة المستخدمين"
        title="تواصل معنا"
        subtitle="نسعد باستقبال الملاحظات، طلبات التصحيح، واقتراحات تطوير المنصة."
      />

      <Card>
        <div style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.35rem", color: C.ink, fontSize: "0.875rem", fontWeight: 700 }}>عنوان الرسالة</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="مثال: تصحيح معلومة أو اقتراح ميزة"
              style={{ width: "100%", padding: "0.65rem 0.8rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.parchment, color: C.ink, fontFamily: "inherit" }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.35rem", color: C.ink, fontSize: "0.875rem", fontWeight: 700 }}>نص الرسالة</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              placeholder="اكتب رسالتك هنا..."
              style={{ width: "100%", padding: "0.75rem 0.8rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.parchment, color: C.ink, fontFamily: "inherit", resize: "vertical" }}
            />
          </div>
          <a
            href={mailto}
            style={{ display: "inline-flex", justifyContent: "center", padding: "0.7rem 1.25rem", borderRadius: "0.5rem", background: C.emerald, color: C.parchment, fontWeight: 700, fontSize: "0.9rem" }}
          >
            إرسال عبر البريد
          </a>
          <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.8125rem", lineHeight: 1.7 }}>
            ملاحظة: لا يحفظ هذا النموذج أي بيانات داخل المنصة حاليًا، بل يفتح برنامج البريد لديك لإرسال الرسالة.
          </p>
        </div>
      </Card>
    </div>
  );
}
