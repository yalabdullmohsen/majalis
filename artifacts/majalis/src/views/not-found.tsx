import { useEffect } from "react";
import { Link } from "wouter";
import { Compass, BookOpen, BookMarked, MessageCircle, Clock, Scroll, BookText, Scale } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/pages/not-found.css";

const SUGGESTIONS = [
  { href: "/quran-hub",    label: "مركز القرآن الكريم",       Icon: BookOpen   },
  { href: "/adhkar",       label: "الأذكار",           Icon: Scroll     },
  { href: "/lessons",      label: "الدروس",            Icon: BookText   },
  { href: "/hadith",       label: "الحديث وعلومه",          Icon: BookMarked },
  { href: "/flashcards",       label: "الفوائد",           Icon: MessageCircle },
  { href: "/prayer-times", label: "مواقيت الصلاة",     Icon: Clock      },
  { href: "/competitions", label: "المسابقات",         Icon: Compass    },
  { href: "/fiqh",         label: "الفقه والأحكام",    Icon: Scale      },
] as const;

export default function NotFound() {
  useEffect(() => {
    applyPageSeo({
      path: "/404",
      title: "الصفحة غير موجودة | سُنّة",
      description: "الصفحة التي تبحث عنها غير موجودة، استخدم القائمة للوصول إلى أقسام سُنّة.",
      keywords: ["404", "صفحة غير موجودة"],
      robots: "noindex, follow",
    });
  }, []);

  return (
    <div className="nf2-page" dir="rtl" lang="ar">
      <section className="nf2-card">
        <div className="nf2-brand">
          <img src="/favicon.png" width={40} height={40} alt="" className="nf2-brand__logo" loading="eager" decoding="async" />
          <span className="nf2-brand__name">سُنّة</span>
        </div>

        {/* أيقونة زمردية */}
        <div className="nf2-icon-wrap" aria-hidden="true">
          <Compass size={40} strokeWidth={1.4} className="nf2-compass" />
        </div>

        <p className="nf2-code" aria-label="خطأ 404">٤٠٤</p>
        <h1 className="nf2-title">الصفحة غير موجودة</h1>
        <p className="nf2-desc">
          يبدو أن الرابط غير صحيح أو أن الصفحة نُقلت. يمكنك الرجوع للرئيسية
          أو استخدام أحد الأقسام أدناه للوصول إلى ما تبحث عنه.
        </p>

        <div className="nf2-actions">
          <Link href="/" className="nf2-btn nf2-btn--primary">الرئيسية</Link>
          <Link href="/lessons" className="nf2-btn nf2-btn--outline">الدروس</Link>
          <Link href="/search" className="nf2-btn nf2-btn--outline">البحث</Link>
        </div>

        <div className="nf2-suggestions">
          <p className="nf2-suggestions__label">أقسام مقترحة</p>
          <div className="nf2-suggestions__grid">
            {SUGGESTIONS.map(({ href, label, Icon }) => (
              <Link key={href} href={href} className="nf2-sug-item">
                <Icon size={16} strokeWidth={1.6} aria-hidden="true" className="nf2-sug-item__icon" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
