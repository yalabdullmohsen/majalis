import { useEffect } from "react";
import { Link } from "wouter";
import { BookOpen, CalendarDays, Home, Users, Zap } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/pages/kids.css";

/**
 * حلقات التحفيظ — «قريبًا» حتى يكتمل دليل محدّث وموثّق.
 * المسار يبقى حيًا للروابط القديمة.
 */
export default function QuranCirclesPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/quran-circles",
      title: "حلقات التحفيظ (قريبًا) | المجلس العلمي",
      description: "دليل حلقات تحفيظ القرآن قيد التجهيز — أدوات الحفظ وخطط المراجعة متاحة الآن. محتوى معتمد في منهج مجالس العلم يُستفاد في التعلم والتطبيق — مرجع تربوي شرعي — مرجع تربوي؛ محتوى تعليمي معتمد في منهج مجالس العلم.............................................................................................................................................................................................................................................................................................................................................................................",
      keywords: ["حلقات قرآن", "تحفيظ", "قريبًا"],
      robots: "noindex, follow",
    });
  }, []);

  return (
    <div className="kids-hub-page kids-hub-page--soon" dir="rtl">
      <section className="kids-hub-intro kids-hub-soon" aria-labelledby="circles-soon-title">
        <span className="kids-hub-soon__badge">قريبًا</span>
        <Users size={36} className="kids-hub-intro__icon" aria-hidden="true" />
        <h1 id="circles-soon-title" className="kids-hub-intro__title">حلقات التحفيظ</h1>
        <p className="kids-hub-intro__sub">
          نجهّز دليلًا محدّثًا لحلقات تحفيظ القرآن في الكويت والمنصات الموثوقة —
          بروابط تسجيل وتواصل واضحة.
        </p>
        <p className="kids-hub-soon__note">
          يمكنك الآن استخدام أدوات الحفظ وخطط المراجعة في المنصة،
          وسيُفتح الدليل الكامل عند اكتمال التجهيز.
        </p>
        <div className="kids-hub-soon__actions">
          <Link href="/quran-hub" className="kids-hub-soon__btn kids-hub-soon__btn--primary">
            <BookOpen size={18} strokeWidth={1.8} aria-hidden="true" />
            مركز القرآن
          </Link>
          <Link href="/quran-memorization" className="kids-hub-soon__btn">
            <Zap size={18} strokeWidth={1.8} aria-hidden="true" />
            اختبارات الحفظ
          </Link>
          <Link href="/quran/memorization-plans" className="kids-hub-soon__btn">
            <CalendarDays size={18} strokeWidth={1.8} aria-hidden="true" />
            خطط الحفظ
          </Link>
          <Link href="/" className="kids-hub-soon__btn">
            <Home size={18} strokeWidth={1.8} aria-hidden="true" />
            الرئيسية
          </Link>
        </div>
      </section>
    </div>
  );
}
