import { PageHeader, Card } from "@/components/ui-common";
import { C } from "@/lib/theme";

const ITEMS = [
  "نجمع بيانات الحساب الأساسية مثل الاسم والبريد الإلكتروني لاستخدامها في تسجيل الدخول وإدارة التسجيلات.",
  "تُستخدم بيانات التسجيل في الدروس والفوائد المرسلة لتحسين تجربة المنصة ومراجعة المحتوى.",
  "لا نبيع بيانات المستخدمين ولا نشاركها تجاريًا مع أطراف خارجية.",
  "قد تستخدم المنصة خدمات Supabase للمصادقة وتخزين البيانات وفق سياسات الأمان المفعلة.",
  "يمكن للمستخدم طلب تحديث بياناته أو حذفها عبر صفحة التواصل.",
];

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <PageHeader
        eyebrow="الثقة والخصوصية"
        title="سياسة الخصوصية"
        subtitle="نوضح هنا كيفية تعامل منصة مجالس مع بيانات المستخدمين وحمايتها."
      />
      <Card>
        <ul style={{ margin: 0, paddingInlineStart: "1.25rem", color: C.ink, lineHeight: 2 }}>
          {ITEMS.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p style={{ margin: "1.25rem 0 0", color: C.inkSoft, fontSize: "0.875rem", lineHeight: 1.8 }}>
          هذه السياسة قابلة للتحديث عند إضافة خدمات جديدة أو متطلبات تنظيمية، وسيتم نشر أي تعديل في هذه الصفحة.
        </p>
      </Card>
    </div>
  );
}
