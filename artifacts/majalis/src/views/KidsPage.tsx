import { useEffect } from "react";
import { Link } from "wouter";
import { Baby, BookOpen, Home, Star } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/pages/kids.css";

/**
 * ركن الأطفال — معروض كـ«قريبًا» حتى يكتمل محتوى مخصّص للأطفال
 * (بدل مجرد روابط لصفحات عامة). المسار يبقى حيًا بروابط قديمة.
 */
export default function KidsPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/kids",
      title: "ركن الأطفال (قريبًا) | المجلس العلمي",
      description: "ركن الأطفال في المجلس العلمي قيد التجهيز — محتوى تعليمي ميسّر وآمن قريبًا. محتوى معتمد في منهج مجالس العلم",
      keywords: ["الأطفال", "تعليم الأطفال", "قريبًا"],
      robots: "noindex, follow",
    });
  }, []);

  return (
    <div className="kids-hub-page kids-hub-page--soon" dir="rtl">
      <section className="kids-hub-intro kids-hub-soon" aria-labelledby="kids-soon-title">
        <span className="kids-hub-soon__badge">قريبًا</span>
        <Baby size={36} className="kids-hub-intro__icon" aria-hidden="true" />
        <h1 id="kids-soon-title" className="kids-hub-intro__title">ركن الأطفال</h1>
        <p className="kids-hub-intro__sub">
          نجهّز ركنًا تعليميًا ميسّرًا وآمنًا للأطفال بمحتوى مخصّص —
          بلا مسائل خلافية وبأسلوب يناسب صغار السن.
        </p>
        <p className="kids-hub-soon__note">
          يمكنك الآن الاستفادة من الأقسام العامة للمنصة، وسيُفتح ركن الأطفال
          الكامل عند اكتمال التجهيز.
        </p>
        <div className="kids-hub-soon__actions">
          <Link href="/quran-hub" className="kids-hub-soon__btn kids-hub-soon__btn--primary">
            <BookOpen size={18} strokeWidth={1.8} aria-hidden="true" />
            مركز القرآن
          </Link>
          <Link href="/" className="kids-hub-soon__btn">
            <Home size={18} strokeWidth={1.8} aria-hidden="true" />
            الرئيسية
          </Link>
          <Link href="/prophets" className="kids-hub-soon__btn">
            <Star size={18} strokeWidth={1.8} aria-hidden="true" />
            قصص الأنبياء
          </Link>
        </div>
      </section>
    </div>
  );
}
