import { LegalBackLink, LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";

export default function TermsPage() {
  return (
    <LegalPageLayout eyebrow="الاستخدام" title="شروط الاستخدام">
      <LegalSection title="قبول الشروط">
        <p>
          باستخدامك منصة المجلس العلمي فإنك توافق على هذه الشروط. إن لم توافق، يرجى
          التوقف عن استخدام المنصة.
        </p>
      </LegalSection>

      <LegalSection title="طبيعة المحتوى">
        <p>
          المحتوى العلمي المعروض للتعلم والانتفاع العام. الأسئلة الفقهية الخاصة يُحال فيها
          إلى أهل العلم المختصين، ولا تُعد المنصة مصدرًا للفتاوى الخاصة.
        </p>
      </LegalSection>

      <LegalSection title="سلوك المستخدم">
        <ul>
          <li>عدم نشر محتوى مخالف للشريعة أو مسيء.</li>
          <li>عدم محاولة اختراق المنصة أو إساءة استخدام واجهات البرمجة.</li>
          <li>احترام حقوق النشر والمصادر العلمية.</li>
        </ul>
      </LegalSection>

      <LegalSection title="المحتوى المقدّم من المستخدم">
        <p>
          الفوائد والاقتراحات المقدّمة تخضع للمراجعة قبل النشر. يحق للإدارة رفض أو إزالة
          أي محتوى لا يتوافق مع سياسة المنصة.
        </p>
      </LegalSection>

      <LegalSection title="إخلاء المسؤولية">
        <p>
          نبذل جهدنا لدقة المحتوى، دون ضمان خلو الأخطاء. استخدام المنصة على مسؤوليتك
          الشخصية ضمن ما يسمح به النظام.
        </p>
      </LegalSection>

      <LegalBackLink />
    </LegalPageLayout>
  );
}
