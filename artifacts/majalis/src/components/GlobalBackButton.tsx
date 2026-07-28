import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { goBackOrFallback } from "@/lib/navigation-back";
import { subscribeScrollBus, setScrollThreshold } from "@/lib/scroll-raf-bus";

/**
 * زر رجوع عام يظهر في كل شاشة غير الرئيسية، بصرف النظر عن امتلاك الصفحة
 * لزر رجوع خاص بها (PageHeader) أم لا — يضمن توفر وسيلة رجوع واحدة على
 * الأقل من كل شاشة (طلب صريح: "زر رجوع ظاهر... من كل شاشة"). عشرات صفحات
 * "أبواب الفقه" (الصيام، الحج، الطهارة...) لها رأس مخصص بلا أي زر رجوع
 * إطلاقًا — هذا يغطيها جميعًا دفعة واحدة بدل تعديل كل صفحة على حدة.
 */
export function GlobalBackButton() {
  const [location] = useLocation();
  // ⚠️ إصلاح جذري (2026-07-23): مُتحقَّق حيًّا (قياس تقاطع مستطيلات لا
  // انطباع بصري) أن هذا الزر الثابت يتراكب فعليًا مع محتوى حقيقي قابل
  // للنقر (بطاقات، تبويبات أفقية) عند وضع التمرير الابتدائي (صفر) في
  // ست صفحات على الأقل من مركز القرآن وحده (علوم القرآن، قصص القرآن،
  // البث المباشر، المعجزات، خطط الحفظ، ترتيب النزول) — لأن أي محتوى
  // عادي في أعلى الصفحة قد يقع صدفة ضمن نطاقه الثابت. إظهاره فقط بعد
  // تمرير طفيف (نمط "زر عائم" معياري وشائع) يزيل التراكب في كل الحالات
  // المرصودة دون إخفاء الزر عن أي شاشة فعليًا (يبقى "متاحًا من كل شاشة"
  // بمجرد أي تفاعل تمرير طبيعي معها).
  const [pastThreshold, setPastThreshold] = useState(false);

  useEffect(() => {
    setScrollThreshold(120);
    setPastThreshold(window.scrollY > 120);
    return subscribeScrollBus((sample) => {
      setPastThreshold(sample.pastThreshold);
    });
  }, [location]);

  if (location === "/") return null;
  // /mushaf/page: قارئ غامر بشريط تنقّل سفلي ثابت بعرض الشاشة كاملاً
  // (z-index أدنى من هذا الزر) يتراكب معه فعليًا — اكتُشف حيًّا أثناء
  // تحقّق Playwright. الصفحة توفّر زر "رجوع" مكافئًا داخل شريطها العلوي
  // (راجع MushafPageView.tsx)، فلا فقدان لوظيفة الرجوع.
  if (location.startsWith("/mushaf/page")) return null;

  const goBack = () => {
    goBackOrFallback(location, "/");
  };

  return (
    <button
      type="button"
      className={`global-back-btn${pastThreshold ? "" : " global-back-btn--hidden"}`}
      onClick={goBack}
      aria-label="رجوع"
      title="رجوع"
    >
      {/* RTL: الرجوع يشير نحو البداية (يمين) — نفس اتّجاه PageHeader */}
      <ArrowRight size={18} strokeWidth={2.2} aria-hidden="true" />
    </button>
  );
}
