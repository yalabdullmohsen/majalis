import { PageHeader, Card } from "@/components/ui-common";
import { C } from "@/lib/theme";

const TERMS = [
  "تستخدم منصة مجالس لأغراض علمية وتعليمية، ولا تغني المواد المنشورة عن سؤال أهل العلم في النوازل الخاصة.",
  "يلتزم المستخدم بعدم إرسال محتوى مخالف أو منسوب بلا مصدر أو يسيء للأشخاص والجهات.",
  "تحتفظ المنصة بحق مراجعة أو رفض أو حذف أي فائدة أو مادة مرسلة لا تحقق ضوابط النشر.",
  "روابط الملفات أو المصادر الخارجية تقع مسؤولية محتواها على مصادرها الأصلية، وتعرض في المنصة للفائدة العلمية.",
  "يحظر استخدام المنصة لمحاولات الاختراق أو الوصول غير المصرح به أو إساءة استخدام الحسابات.",
];

export default function TermsPage() {
  return (
    <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <PageHeader
        eyebrow="ضوابط الاستخدام"
        title="شروط الاستخدام"
        subtitle="باستخدامك لمنصة مجالس فإنك توافق على الضوابط التالية."
      />
      <Card>
        <ol style={{ margin: 0, paddingInlineStart: "1.25rem", color: C.ink, lineHeight: 2 }}>
          {TERMS.map((term) => <li key={term}>{term}</li>)}
        </ol>
        <p style={{ margin: "1.25rem 0 0", color: C.inkSoft, fontSize: "0.875rem", lineHeight: 1.8 }}>
          نرحب بالملاحظات حول هذه الشروط عبر صفحة التواصل، ونسعى لتطويرها بما يحفظ مقاصد المنصة وحقوق المستخدمين.
        </p>
      </Card>
    </div>
  );
}
