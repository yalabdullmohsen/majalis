import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

/**
 * زر رجوع عام يظهر في كل شاشة غير الرئيسية، بصرف النظر عن امتلاك الصفحة
 * لزر رجوع خاص بها (PageHeader) أم لا — يضمن توفر وسيلة رجوع واحدة على
 * الأقل من كل شاشة (طلب صريح: "زر رجوع ظاهر... من كل شاشة"). عشرات صفحات
 * "أبواب الفقه" (الصيام، الحج، الطهارة...) لها رأس مخصص بلا أي زر رجوع
 * إطلاقًا — هذا يغطيها جميعًا دفعة واحدة بدل تعديل كل صفحة على حدة.
 */
export function GlobalBackButton() {
  const [location] = useLocation();

  if (location === "/") return null;

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "/";
  };

  return (
    <button
      type="button"
      className="global-back-btn"
      onClick={goBack}
      aria-label="رجوع"
      title="رجوع"
    >
      <ArrowLeft size={18} strokeWidth={2.2} aria-hidden="true" />
    </button>
  );
}
