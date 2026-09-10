import { useEffect } from "react";
import { FileText, Gavel, Landmark, Scale } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { PageHeader } from "@/components/ui-common";
import { SectionEntryCard } from "@/components/ui/InternalCards";

/**
 * "المتون الحديثية وأحاديث الأحكام" — تصنيف أوسع يجمع الأربعين النووية (المحتوى القائم،
 * بلا أي تغيير عليه) مع كتب أحكام حديثية أخرى معروفة. غيّرنا اسم/تصنيف
 * الملاحة فقط (كانت تشير مباشرة إلى /arbaeen-nawawi باسم "الأربعون
 * النووية") — المحتوى نفسه لم يُمسّ، فقط أُضيف مسار تصنيفي أوسع فوقه.
 *
 * فحصتُ فعليًا مصادر البيانات الحديثية المتوفرة في المشروع (hadith-cdn-
 * service.ts، مصدره fawazahmed0/hadith-api) — لا يوفّر عمدة الأحكام ولا
 * بلوغ المرام ولا المنتقى من أخبار المصطفى (تحقّق مباشر من editions.json:
 * فقط bukhari/muslim/abudawud/tirmidhi/nasai/ibnmajah/malik/nawawi/qudsi/
 * dehlawi). لذا لا نعرض مادة هذه الكتب قبل اعتماد مصدر موثوق —
 * تحتاج استيراد بيانات فعلي من مصدر موثوق لاحقًا قبل تفعيلها.
 */
export default function HadithBooksAndRulingsPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/hadith/books-and-rulings",
      title: "المتون الحديثية وأحاديث الأحكام | سُنّة",
      description: "المتون الحديثية وأحاديث الأحكام: الأربعون النووية، وعمدة الأحكام، وبلوغ المرام، والمنتقى من أخبار المصطفى. محتوى معتمد في منهج سُنّة",
      keywords: ["المتون الحديثية", "أحاديث الأحكام", "الأربعون النووية", "عمدة الأحكام", "بلوغ المرام", "المنتقى من أخبار المصطفى"],
    });
  }, []);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="السنة النبوية الشريفة"
        title="المتون الحديثية وأحاديث الأحكام"
        subtitle="الأربعون النووية متاحة بمادتها المعتمدة؛ ولا يُنشر متن أو حكم على حديث في بقية الكتب حتى اعتماد مصدر موثوق ومراجعة علمية."
      />

      <div className="hadith-index-grid hub-card-grid">
        <SectionEntryCard
          href="/arbaeen-nawawi"
          title="الأربعون النووية"
          description="الأحاديث الأربعون التي جمعها الإمام النووي، مع شرح لكل حديث وتتبّع تقدّمك في حفظها."
          meta="٤٢ حديثاً"
          Icon={FileText}
          className="hadith-index-card hadith-index-card--books"
        />
        <SectionEntryCard
          title="عمدة الأحكام"
          description="جمع الإمام عبد الغني المقدسي للأحاديث المتفق عليها بين البخاري ومسلم في الأحكام الفقهية."
          meta="بانتظار مصدر معتمد"
          Icon={Scale}
          disabled
          className="hadith-index-card hadith-index-card--soon"
        />
        <SectionEntryCard
          title="بلوغ المرام"
          description="جمع الحافظ ابن حجر العسقلاني لأحاديث الأحكام مع بيان درجتها، من أشهر مراجع فقه الحديث."
          meta="بانتظار مصدر معتمد"
          Icon={Gavel}
          disabled
          className="hadith-index-card hadith-index-card--soon"
        />
        <SectionEntryCard
          title="المنتقى من أخبار المصطفى ﷺ"
          description="جمع مجد الدين ابن تيمية (جدّ شيخ الإسلام) لأحاديث الأحكام مرتّبة على أبواب الفقه."
          meta="بانتظار مصدر معتمد"
          Icon={Landmark}
          disabled
          className="hadith-index-card hadith-index-card--soon"
        />
      </div>
    </div>
  );
}
