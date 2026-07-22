import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, FileText, Gavel, Landmark, Scale } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { PageHeader } from "@/components/ui-common";

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
      title: "المتون الحديثية وأحاديث الأحكام | المجلس العلمي",
      description: "المتون الحديثية وأحاديث الأحكام: الأربعون النووية، وعمدة الأحكام، وبلوغ المرام، والمنتقى من أخبار المصطفى.",
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

      <div className="hadith-index-grid">
        <Link href="/arbaeen-nawawi" className="hadith-index-card hadith-index-card--books">
          <span className="hadith-index-card__icon" aria-hidden="true">
            <FileText size={22} strokeWidth={2} color="#fff" />
          </span>
          <h2 className="hadith-index-card__title">الأربعون النووية</h2>
          <p className="hadith-index-card__desc">
            الأحاديث الأربعون التي جمعها الإمام النووي، مع شرح لكل حديث وتتبّع تقدّمك في حفظها.
          </p>
          <span className="hadith-index-card__count">٤٢ حديثاً</span>
          <span className="hadith-index-card__go">
            تصفّح الأربعين <ArrowLeft size={16} aria-hidden="true" />
          </span>
        </Link>

        <div className="hadith-index-card hadith-index-card--soon" aria-disabled="true">
          <span className="hadith-index-card__icon" aria-hidden="true">
            <Scale size={22} strokeWidth={2} color="#28584D" />
          </span>
          <h2 className="hadith-index-card__title">عمدة الأحكام</h2>
          <p className="hadith-index-card__desc">
            جمع الإمام عبد الغني المقدسي للأحاديث المتفق عليها بين البخاري ومسلم في الأحكام الفقهية.
          </p>
          <span className="hadith-index-card__count">بانتظار مصدر معتمد</span>
        </div>

        <div className="hadith-index-card hadith-index-card--soon" aria-disabled="true">
          <span className="hadith-index-card__icon" aria-hidden="true">
            <Gavel size={22} strokeWidth={2} color="#28584D" />
          </span>
          <h2 className="hadith-index-card__title">بلوغ المرام</h2>
          <p className="hadith-index-card__desc">
            جمع الحافظ ابن حجر العسقلاني لأحاديث الأحكام مع بيان درجتها، من أشهر مراجع فقه الحديث.
          </p>
          <span className="hadith-index-card__count">بانتظار مصدر معتمد</span>
        </div>

        <div className="hadith-index-card hadith-index-card--soon" aria-disabled="true">
          <span className="hadith-index-card__icon" aria-hidden="true">
            <Landmark size={22} strokeWidth={2} color="#28584D" />
          </span>
          <h2 className="hadith-index-card__title">المنتقى من أخبار المصطفى ﷺ</h2>
          <p className="hadith-index-card__desc">
            جمع مجد الدين ابن تيمية (جدّ شيخ الإسلام) لأحاديث الأحكام مرتّبة على أبواب الفقه.
          </p>
          <span className="hadith-index-card__count">بانتظار مصدر معتمد</span>
        </div>
      </div>
    </div>
  );
}
