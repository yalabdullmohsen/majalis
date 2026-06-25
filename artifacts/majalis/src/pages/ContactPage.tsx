import { LegalBackLink, LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";

export default function ContactPage() {
  return (
    <LegalPageLayout eyebrow="التواصل" title="تواصل معنا">
      <LegalSection title="نرحّب بتواصلك">
        <p>
          للاستفسارات العامة، اقتراحات المحتوى، أو الإبلاغ عن مشكلة في المنصة،
          يمكنك التواصل عبر القنوات التالية:
        </p>
      </LegalSection>

      <LegalSection title="البريد الإلكتروني">
        <p>
          <a href="mailto:info@majlisilm.com">info@majlisilm.com</a>
        </p>
      </LegalSection>

      <LegalSection title="ما الذي يمكننا مساعدتك فيه؟">
        <ul>
          <li>الإبلاغ عن خطأ في درس أو محتوى.</li>
          <li>اقتراح درس أو شيخ لإضافته.</li>
          <li>استفسارات تقنية عن استخدام المنصة.</li>
          <li>طلبات تحديث أو حذف بيانات الحساب.</li>
        </ul>
      </LegalSection>

      <LegalSection title="وقت الرد">
        <p>نسعى للرد خلال أيام العمل. شكرًا لصبرك وتعاونك.</p>
      </LegalSection>

      <LegalBackLink />
    </LegalPageLayout>
  );
}
