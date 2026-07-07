import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="nf-page">
      <section className="nf-card">
        <p className="nf-code">404</p>
        <h1 className="nf-title">الصفحة غير موجودة</h1>
        <p className="nf-desc">
          يبدو أن الرابط غير صحيح أو أن الصفحة نُقلت داخل المجلس العلمي. يمكنك الرجوع إلى الصفحة الرئيسية أو استخدام البحث للوصول إلى الدروس والفوائد والكتب.
        </p>
        <div className="nf-links">
          <Link href="/" className="nf-link nf-link--primary">العودة للرئيسية</Link>
          <Link href="/fiqh-council" className="nf-link nf-link--secondary">المجمع الفقهي</Link>
          <Link href="/fatwa" className="nf-link nf-link--secondary">الفتاوى</Link>
        </div>
      </section>
    </div>
  );
}
