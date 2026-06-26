import { Link } from "wouter";
import { LegalBackLink, LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";

export default function PrivacyPage() {
  return (
    <LegalPageLayout eyebrow="الخصوصية" title="سياسة الخصوصية">
      <LegalSection title="البيانات التي نجمعها">
        <p>
          قد نجمع بيانات الحساب (الاسم والبريد) عند التسجيل، وسجل الاستخدام العام لتحسين المنصة.
          لا نبيع بياناتك لأطراف ثالثة.
        </p>
      </LegalSection>

      <LegalSection title="كيف نستخدم البيانات">
        <ul>
          <li>تفعيل حسابك وتخصيص تجربتك.</li>
          <li>إدارة المحتوى والبلاغات في لوحة التحكم.</li>
          <li>تحسين أداء المنصة وأمانها.</li>
        </ul>
      </LegalSection>

      <LegalSection title="التخزين والأمان">
        <p>
          تُخزَّن البيانات عبر مزودي خدمة موثوقين مع تطبيق ضوابط أمنية معقولة.
          مفاتيح الخدمات السرية لا تُعرض في الواجهة العامة.
        </p>
      </LegalSection>

      <LegalSection title="حقوقك">
        <p>
          يمكنك طلب تحديث أو حذف بيانات حسابك عبر صفحة{" "}
          <Link href="/contact">تواصل معنا</Link>.
        </p>
      </LegalSection>

      <LegalSection title="التحديثات">
        <p>قد نحدّث هذه السياسة عند الحاجة. تاريخ آخر مراجعة: يونيو 2026.</p>
      </LegalSection>

      <LegalBackLink />
    </LegalPageLayout>
  );
}
