import { Link } from "wouter";
import { useState } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/ui-common";
import {
  RESEARCH_BASE_PATH,
  DEGREE_FILTERS,
  COPYRIGHT_LABELS,
} from "@/lib/scientific-research/constants";
import type { CopyrightType, ResearchDegreeType } from "@/lib/scientific-research/types";
import "@/styles/scientific-research.css";

const EMPTY = {
  title: "",
  author_name: "",
  author_email: "",
  university: "",
  faculty: "",
  department: "",
  degree_type: "masters" as ResearchDegreeType,
  supervisor_name: "",
  specialization: "",
  category_slug: "fiqh",
  keywords: "",
  abstract_full: "",
  copyright_type: "cite_with_attribution" as CopyrightType,
  copyright_terms: "",
  language: "ar",
  country: "الكويت",
  pdf_url: "",
};

export default function ScientificResearchUploadPage() {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author_name.trim() || !form.abstract_full.trim()) {
      setMsg("يرجى تعبئة العنوان واسم الباحث والملخص");
      return;
    }
    setSubmitting(true);
    setMsg("جاري الرفع...");
    try {
      const res = await fetch("/api/scientific-research?action=submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          keywords: form.keywords.split(/[,،]/).map((k) => k.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setMsg("✓ تم استلام بحثك بنجاح — سيراجعه فريق المجلس قبل النشر");
        setForm(EMPTY);
      } else {
        setMsg(data.error || "فشل الرفع");
      }
    } catch {
      setMsg("فشل الاتصال — حاول لاحقاً");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <Link href={RESEARCH_BASE_PATH}>← الأبحاث العلمية</Link>
      <PageHeader
        eyebrow="مشاركة المعرفة"
        title="رفع بحث علمي"
        subtitle="شارك رسالتك أو بحثك مع المجتمع العلمي — مع حفظ حقوقك الفكرية كاملة."
      />

      <form className="research-upload-form" onSubmit={submit}>
        {[
          ["title", "عنوان الرسالة / البحث", "text"],
          ["author_name", "اسم الباحث", "text"],
          ["author_email", "البريد الإلكتروني", "email"],
          ["university", "الجامعة", "text"],
          ["faculty", "الكلية", "text"],
          ["department", "القسم", "text"],
          ["supervisor_name", "اسم المشرف", "text"],
          ["specialization", "التخصص", "text"],
          ["pdf_url", "رابط ملف PDF (أو ارفع لاحقاً عبر الإدارة)", "url"],
        ].map(([key, label, type]) => (
          <div key={key} style={{ marginBottom: "1rem" }}>
            <label htmlFor={key}>{label}</label>
            <input
              id={key}
              type={type}
              className="ds-input full"
              value={(form as any)[key]}
              onChange={(e) => set(key, e.target.value)}
            />
          </div>
        ))}

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="degree_type">الدرجة العلمية</label>
          <select
            id="degree_type"
            className="ds-input full"
            value={form.degree_type}
            onChange={(e) => set("degree_type", e.target.value)}
          >
            {DEGREE_FILTERS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="copyright_type">حقوق النشر</label>
          <select
            id="copyright_type"
            className="ds-input full"
            value={form.copyright_type}
            onChange={(e) => set("copyright_type", e.target.value)}
          >
            {Object.entries(COPYRIGHT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="keywords">الكلمات المفتاحية (مفصولة بفاصلة)</label>
          <input id="keywords" className="ds-input full" value={form.keywords} onChange={(e) => set("keywords", e.target.value)} />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label htmlFor="abstract_full">الملخص</label>
          <textarea
            id="abstract_full"
            className="ds-input full"
            rows={6}
            value={form.abstract_full}
            onChange={(e) => set("abstract_full", e.target.value)}
          />
        </div>

        <button type="submit" className="page-action-btn" disabled={submitting}>
          {submitting ? "جاري الإرسال..." : "إرسال للمراجعة"}
        </button>
        {msg && <p style={{ marginTop: "1rem", color: "var(--majalis-emerald-deep)" }}>{msg}</p>}
      </form>
    </PageShell>
  );
}
