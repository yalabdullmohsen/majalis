import { useEffect, useState, type FormEvent } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import {
  RESEARCH_CATEGORIES,
  RESEARCH_KIND_LABELS,
  ACADEMIC_LEVEL_LABELS,
  LICENSE_LABELS,
  REVIEW_STATUS_LABELS,
  PERSONAL_RESEARCH_NOTICE,
  RIGHTS_DISCLAIMER,
  submitResearch,
  listMySubmissions,
  type ResearchKind,
  type AcademicLevel,
  type LicenseType,
  type SubmitterRole,
  type ResearchSubmissionInput,
} from "@/lib/researches";
import "@/styles/pages/researches.css";

const initial: ResearchSubmissionInput = {
  title: "",
  kind: "undergraduate",
  categoryId: "fiqh",
  authorName: "",
  authorEmail: "",
  submitterRole: "author",
  language: "ar",
  abstract: "",
  keywords: "",
  license: "all_rights_reserved",
  acceptTerms: false,
  attestOwnership: false,
};

export default function ResearchSubmitPage() {
  const [form, setForm] = useState<ResearchSubmissionInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);
  const mine = listMySubmissions();

  useEffect(() => {
    applyPageSeo({
      path: "/academic-research/submit",
      title: "أضف بحثًا | الأبحاث الشرعية",
      description: "قدّم بحثًا شرعيًا للمراجعة. لا يُنشر أي بحث مباشرة.",
      robots: "noindex,follow",
    });
  }, []);

  const set = <K extends keyof ResearchSubmissionInput>(key: K, value: ResearchSubmissionInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = submitResearch(form);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDoneId(res.submission.id);
    setForm(initial);
  };

  return (
    <div className="sr-page">
      <p><Link href="/academic-research" className="sr-section__link">← الأبحاث الشرعية</Link></p>
      <h1 className="sr-detail__h1">أضف بحثًا</h1>
      <p className="sr-notice">
        لا يُنشر أي بحث مباشرة. الطلب يمر بفحص آلي ثم مراجعة. الأبحاث الشخصية لا تُعرض للعامة إلا بعد اعتماد مراجع مخوّل.
        {" "}{PERSONAL_RESEARCH_NOTICE}
      </p>
      <p className="sr-notice">{RIGHTS_DISCLAIMER}</p>

      {doneId && (
        <div className="sr-notice" role="status">
          تم استلام الطلب ({doneId}). الحالة الحالية: {REVIEW_STATUS_LABELS[listMySubmissions().find((s) => s.id === doneId)?.status || "submitted"]}.
          ستصلك تحديثات الحالة عند تغيّرها (محليًا في سجل طلباتك أدناه؛ والإشعارات عبر الخادم عند تفعيل قاعدة البيانات).
        </div>
      )}
      {error && <div className="sr-error" role="alert">{error}</div>}

      <form className="sr-form" onSubmit={onSubmit}>
        <label>عنوان البحث *
          <input required value={form.title} onChange={(e) => set("title", e.target.value)} />
        </label>
        <label>العنوان بالإنجليزية
          <input value={form.titleEn || ""} onChange={(e) => set("titleEn", e.target.value)} />
        </label>
        <label>نوع البحث *
          <select value={form.kind} onChange={(e) => set("kind", e.target.value as ResearchKind)}>
            {Object.entries(RESEARCH_KIND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>التخصص الرئيسي *
          <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            {RESEARCH_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <label>التخصص الفرعي
          <select value={form.subcategoryId || ""} onChange={(e) => set("subcategoryId", e.target.value || undefined)}>
            <option value="">—</option>
            {RESEARCH_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <label>اسم الباحث *
          <input required value={form.authorName} onChange={(e) => set("authorName", e.target.value)} />
        </label>
        <label>البريد الإلكتروني (لا يُعرض للعامة) *
          <input required type="email" value={form.authorEmail} onChange={(e) => set("authorEmail", e.target.value)} />
        </label>
        <label>صفتك
          <select value={form.submitterRole} onChange={(e) => set("submitterRole", e.target.value as SubmitterRole)}>
            <option value="author">الباحث نفسه</option>
            <option value="coauthor">مؤلف مشارك</option>
            <option value="supervisor">مشرف</option>
            <option value="university">جامعة</option>
            <option value="publisher">ناشر</option>
            <option value="aggregator">ناقل / مفهرس</option>
          </select>
        </label>
        <label>الباحثون المشاركون
          <input value={form.coauthors || ""} onChange={(e) => set("coauthors", e.target.value)} />
        </label>
        <label>المشرف
          <input value={form.supervisor || ""} onChange={(e) => set("supervisor", e.target.value)} />
        </label>
        <label>الجامعة
          <input value={form.university || ""} onChange={(e) => set("university", e.target.value)} />
        </label>
        <label>الكلية
          <input value={form.college || ""} onChange={(e) => set("college", e.target.value)} />
        </label>
        <label>القسم
          <input value={form.department || ""} onChange={(e) => set("department", e.target.value)} />
        </label>
        <label>الدرجة العلمية
          <select value={form.academicLevel || ""} onChange={(e) => set("academicLevel", (e.target.value || undefined) as AcademicLevel | undefined)}>
            <option value="">—</option>
            {Object.entries(ACADEMIC_LEVEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>الدولة
          <input value={form.country || ""} onChange={(e) => set("country", e.target.value)} />
        </label>
        <label>سنة الإنجاز / النشر
          <input type="number" value={form.year || ""} onChange={(e) => set("year", e.target.value ? Number(e.target.value) : undefined)} />
        </label>
        <label>اللغة
          <select value={form.language} onChange={(e) => set("language", e.target.value as "ar" | "en" | "other")}>
            <option value="ar">العربية</option>
            <option value="en">الإنجليزية</option>
            <option value="other">أخرى</option>
          </select>
        </label>
        <label>الملخص *
          <textarea required value={form.abstract} onChange={(e) => set("abstract", e.target.value)} />
        </label>
        <label>الكلمات المفتاحية (مفصولة بفاصلة)
          <input value={form.keywords} onChange={(e) => set("keywords", e.target.value)} />
        </label>
        <label>أهداف البحث
          <textarea value={form.objectives || ""} onChange={(e) => set("objectives", e.target.value)} />
        </label>
        <label>منهج البحث
          <textarea value={form.methodology || ""} onChange={(e) => set("methodology", e.target.value)} />
        </label>
        <label>النتائج
          <textarea value={form.findings || ""} onChange={(e) => set("findings", e.target.value)} />
        </label>
        <label>التوصيات
          <textarea value={form.recommendations || ""} onChange={(e) => set("recommendations", e.target.value)} />
        </label>
        <label>رابط المصدر الأصلي
          <input type="url" value={form.sourceUrl || ""} onChange={(e) => set("sourceUrl", e.target.value)} />
        </label>
        <label>DOI
          <input value={form.doi || ""} onChange={(e) => set("doi", e.target.value)} />
        </label>
        <label>نوع الترخيص
          <select value={form.license} onChange={(e) => set("license", e.target.value as LicenseType)}>
            {Object.entries(LICENSE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>بيانات حقوق النشر
          <textarea value={form.copyrightNote || ""} onChange={(e) => set("copyrightNote", e.target.value)} />
        </label>
        <label>إذن النشر / إثبات الملكية (ملاحظة للإدارة — لا تُعرض للعامة)
          <textarea value={form.permissionProofNote || ""} onChange={(e) => set("permissionProofNote", e.target.value)} />
        </label>
        <p className="sr-notice">رفع ملف PDF متاح بعد تهيئة التخزين الآمن على الخادم، وفقط عند وجود إذن قانوني صريح. لا تُرفع ملفات محمية بلا ترخيص.</p>
        <label className="sr-form__check">
          <input type="checkbox" checked={form.acceptTerms} onChange={(e) => set("acceptTerms", e.target.checked)} />
          أوافق على شروط الاستخدام وسياسة حقوق الباحثين.
        </label>
        <label className="sr-form__check">
          <input type="checkbox" checked={form.attestOwnership} onChange={(e) => set("attestOwnership", e.target.checked)} />
          أُقرّ بصحة المعلومات وعدم الاعتداء على حقوق الآخرين، وأنني مخوّل بتقديم هذا العمل.
        </label>
        <button type="submit" className="sr-btn sr-btn--outline">إرسال للمراجعة</button>
      </form>

      {mine.length > 0 && (
        <section className="sr-section" style={{ marginTop: "2rem" }}>
          <h2 className="sr-section__title">طلباتك</h2>
          <div className="sr-list">
            {mine.map((s) => (
              <div key={s.id} className="sr-card">
                <h3 className="sr-card__title">{s.title}</h3>
                <p className="sr-card__meta">
                  <span className="sr-badge">{REVIEW_STATUS_LABELS[s.status]}</span>
                  {s.isPersonal && <span className="sr-badge">شخصي</span>}
                  <span>{new Date(s.updatedAt).toLocaleString("ar")}</span>
                </p>
                {s.statusNote && <p className="sr-card__abs">{s.statusNote}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
