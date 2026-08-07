import { useEffect } from "react";
import { Link } from "wouter";
import { BookMarked, BookOpen, Home } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/pages/kids.css";

/**
 * المصحف — متوقف مؤقتًا بواجهة «قريبًا» دون حذف المسارات أو المحتوى.
 * الروابط القديمة (/mushaf، /quran، /mushaf/:surah…) تبقى وتعرض هذه الصفحة.
 */
export default function MushafComingSoonPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/mushaf",
      title: "المصحف الشريف (قريبًا) | المجلس العلمي",
      description: "المصحف الرقمي في المجلس العلمي قيد التجهيز مؤقتًا — سيعود قريبًا بإذن الله.",
      keywords: ["المصحف", "القرآن", "قريبًا"],
      robots: "noindex, follow",
    });
  }, []);

  return (
    <div className="kids-hub-page kids-hub-page--soon" dir="rtl">
      <section className="kids-hub-intro kids-hub-soon" aria-labelledby="mushaf-soon-title">
        <span className="kids-hub-soon__badge">قريبًا</span>
        <BookOpen size={36} className="kids-hub-intro__icon" aria-hidden="true" />
        <h1 id="mushaf-soon-title" className="kids-hub-intro__title">المصحف الشريف</h1>
        <p className="kids-hub-intro__sub">
          المصحف الرقمي متوقف مؤقتًا للصيانة والتجهيز —
          وسيُعاد فتحه قريبًا بإذن الله.
        </p>
        <p className="kids-hub-soon__note">
          في الوقت الحالي يمكنك الاستفادة من علوم القرآن والأقسام الأخرى،
          دون فقدان أي روابط محفوظة للمصحف.
        </p>
        <div className="kids-hub-soon__actions">
          <Link href="/quran-knowledge" className="kids-hub-soon__btn kids-hub-soon__btn--primary">
            <BookMarked size={18} strokeWidth={1.8} aria-hidden="true" />
            القرآن وعلومه
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
