import { LegalBackLink, LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";

const CONTACT_EMAIL = "yalabdullmohsen1@gmail.com";
const CONTACT_PHONE_E164 = "+96597400062";
const CONTACT_PHONE_DISPLAY = "+965 97400062";

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
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </LegalSection>

      <LegalSection title="الهاتف">
        <p>
          <a href={`tel:${CONTACT_PHONE_E164}`}>{CONTACT_PHONE_DISPLAY}</a>
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

export { CONTACT_EMAIL, CONTACT_PHONE_E164, CONTACT_PHONE_DISPLAY };
