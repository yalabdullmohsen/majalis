import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { DirectionalIcon } from "@/components/DirectionalIcon";
import { useLocation } from "wouter";
import { isImmersiveChromePath } from "@/lib/immersive-chrome";
import { goBackOrFallback } from "@/lib/navigation-back";

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
    setPastThreshold(window.scrollY > 120);
    const onScroll = () => setPastThreshold(window.scrollY > 120);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location]);

  if (location === "/") return null;
  // مسارات غامرة لها زر رجوع داخل شريطها الخاص — لا نكرّر زرًا عائمًا فوقها.
  if (isImmersiveChromePath(location)) return null;
  // مخفي بصريًا قبل عتبة التمرير: يُزال من شجرة VoiceOver تمامًا (لا opacity فقط).
  if (!pastThreshold) return null;

  const goBack = () => {
    // بدون fallback ثابت "/" — sectionAwareFallback يرجع للقسم الأب.
    goBackOrFallback(location);
  };

  return (
    <button
      type="button"
      className="global-back-btn"
      onClick={goBack}
      aria-label="رجوع"
      title="رجوع"
    >
      {/* RTL-authored: ArrowRight = back; DirectionalIcon mirrors for LTR */}
      <DirectionalIcon icon={ArrowRight} size={18} strokeWidth={2.2} />
    </button>
  );
}
