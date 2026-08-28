/**
 * مساعدة الأذان والتنبيهات — إرشادات iOS واضحة للمستخدم.
 */
import { useEffect } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/pages/adhan-settings.css";

const SECTIONS: Array<{ id: string; title: string; body: string }> = [
  {
    id: "no-alerts",
    title: "التنبيهات لا تعمل",
    body:
      "تأكد من تفعيل الإشعارات من إعدادات النظام: الإعدادات > التطبيقات > المجلس العلمي > الإشعارات > تفعيل جميع الخيارات. وتأكد من تفعيل التنبيهات من إعدادات التطبيق.",
  },
  {
    id: "silent",
    title: "التنبيهات تعمل بدون صوت",
    body:
      "تأكد أن الهاتف ليس على الصامت، وأن وضع عدم الإزعاج أو التركيز غير مفعل، وارفع مستوى صوت النغمات والتنبيهات.",
  },
  {
    id: "incomplete",
    title: "الأذان غير كامل",
    body:
      "نظام iOS لا يسمح غالبًا بصوت إشعار طويل. لذلك يستخدم التطبيق تنبيهًا مختصرًا مضمونًا، ويشغّل الأذان الكامل داخل التطبيق أو بطريقة مقاطع متتالية عندما يكون ذلك ممكنًا.",
  },
  {
    id: "stops",
    title: "التنبيهات تتوقف بعد فترة",
    body:
      "بسبب قيود النظام، افتح التطبيق بين فترة وأخرى حتى يتم تحديث أوقات الصلاة وجدولة التنبيهات القادمة.",
  },
  {
    id: "bg-refresh",
    title: "تحديث الخلفية معطل",
    body:
      "فعّل تحديث التطبيقات في الخلفية من: الإعدادات > عام > تحديث التطبيقات في الخلفية > المجلس العلمي.",
  },
  {
    id: "times",
    title: "مواقيت الصلاة غير دقيقة",
    body:
      "تأكد من اختيار المدينة وطريقة الحساب المناسبة. إذا كان هناك فرق كبير عن المسجد القريب، عدّل الإعدادات أو تواصل معنا.",
  },
  {
    id: "volume",
    title: "صوت الأذان ضعيف",
    body: "ارفع مستوى صوت النغمات والتنبيهات من إعدادات iPhone.",
  },
];

export default function AdhanHelpView() {
  useEffect(() => {
    applyPageSeo({
      path: "/adhan-help",
      title: "مساعدة الأذان والتنبيهات | المجلس العلمي",
      description: "حلول لمشكلات تنبيهات الصلاة والأذان على iPhone.",
      keywords: ["أذان", "تنبيهات", "مساعدة", "إشعارات"],
      robots: "noindex, follow",
    });
  }, []);

  return (
    <div className="ads-page" dir="rtl">
      <h1 className="ads-title">مساعدة الأذان والتنبيهات</h1>
      <p className="ads-subtitle">
        إجابات سريعة لأشهر مشكلات التنبيهات والأذان على iPhone.
      </p>

      {SECTIONS.map((s) => (
        <section key={s.id} className="ads-card" aria-labelledby={`help-${s.id}`}>
          <div className="ads-card__head" id={`help-${s.id}`}>
            <span>{s.title}</span>
          </div>
          <div className="ads-card__body">
            <p className="ads-adhan-desc">{s.body}</p>
          </div>
        </section>
      ))}

      <p className="ads-subtitle">
        <Link href="/adhan-settings">العودة إلى تنبيهات الصلاة والأذان</Link>
        {" · "}
        <Link href="/prayer-times">صفحة الصلاة</Link>
        {" · "}
        <Link href="/contact">تواصل معنا</Link>
      </p>
    </div>
  );
}
