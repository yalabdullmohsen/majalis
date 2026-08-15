import { useEffect } from "react";
import { Link } from "wouter";
import { BookMarked, BookOpen, Home } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/pages/kids.css";

/**
 * المصحف الجديد قيد التطوير — المسارات القديمة تبقى وتعرض هذه الصفحة فقط.
 * بيانات القرآن محفوظة في src/lib/quran-data و public/data/quran*.
 */
export default function MushafComingSoonPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/mushaf",
      title: "المصحف الجديد قيد التطوير | المجلس العلمي",
      description: "المصحف الجديد في المجلس العلمي قيد التطوير — بيانات القرآن محفوظة وستُعرض بتصميم جديد.",
      keywords: ["المصحف", "القرآن", "قيد التطوير"],
      robots: "noindex, follow",
    });
  }, []);

  return (
    <div className="kids-hub-page kids-hub-page--soon" dir="rtl">
      <section className="kids-hub-intro kids-hub-soon" aria-labelledby="mushaf-soon-title">
        <span className="kids-hub-soon__badge">قيد التطوير</span>
        <BookOpen size={36} className="kids-hub-intro__icon" aria-hidden="true" />
        <h1 id="mushaf-soon-title" className="kids-hub-intro__title">
          المصحف الجديد قيد التطوير
        </h1>
        <p className="kids-hub-intro__sub">
          أُزيلت واجهة المصحف السابقة تمهيدًا لبناء مصحف بتصميم مختلف بالكامل.
          بيانات القرآن الأساسية (السور والآيات والكلمات) محفوظة ولم تُحذف.
        </p>
        <div className="kids-hub-soon__actions">
          <Link href="/quran-knowledge" className="kids-hub-soon__btn kids-hub-soon__btn--primary">
            <BookMarked size={18} strokeWidth={1.8} aria-hidden="true" />
            القرآن وعلومه
          </Link>
          <Link href="/quran-hub" className="kids-hub-soon__btn">
            مركز القرآن
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
