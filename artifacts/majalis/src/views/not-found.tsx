import { useEffect } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";

const SUGGESTIONS = [
  { href: "/quran",        label: "المصحف الشريف" },
  { href: "/adhkar",       label: "الأذكار" },
  { href: "/lessons",      label: "الدروس" },
  { href: "/hadith",       label: "الأحاديث" },
  { href: "/fawaid",       label: "الفوائد" },
  { href: "/prayer-times", label: "مواقيت الصلاة" },
  { href: "/quiz",         label: "المسابقات" },
  { href: "/fatwa",        label: "الفتاوى" },
];

export default function NotFound() {
  useEffect(() => {
    applyPageSeo({
      path: "/404",
      title: "الصفحة غير موجودة | المجلس العلمي",
      description: "الصفحة التي تبحث عنها غير موجودة — استخدم القائمة للوصول إلى أقسام المجلس العلمي.",
      keywords: ["404", "صفحة غير موجودة"],
      robots: "noindex, follow",
    });
  }, []);

  return (
    <div className="nf-page">
      <section className="nf-card">
        <p className="nf-code">404</p>
        <h1 className="nf-title">الصفحة غير موجودة</h1>
        <p className="nf-desc">
          يبدو أن الرابط غير صحيح أو أن الصفحة نُقلت. يمكنك الرجوع للرئيسية
          أو استخدام أحد الأقسام أدناه للوصول إلى ما تبحث عنه.
        </p>
        <div className="nf-links">
          <Link href="/" className="nf-link nf-link--primary">العودة للرئيسية</Link>
          <Link href="/search" className="nf-link nf-link--secondary">البحث الشامل</Link>
        </div>
        <div className="nf-suggestions">
          <p className="nf-suggestions__label">أقسام مقترحة:</p>
          <div className="nf-suggestions__grid">
            {SUGGESTIONS.map(({ href, label }) => (
              <Link key={href} href={href} className="nf-suggestion-item">{label}</Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
