import { Link } from "wouter";
import { LegalBackLink, LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";

const WHY_ITEMS = [
  "جمع المحتوى الموثوق",
  "سهولة الوصول",
  "البحث الذكي",
  "تنظيم علمي",
  "تحديث مستمر",
  "منصة مجانية",
  "مصادر معروفة",
  "تعلم ذاتي",
];

export default function AboutPage() {
  return (
    <LegalPageLayout eyebrow="تعرف علينا" title="عن المجلس العلمي">
      <LegalSection title="المجلس العلمي">
        <p>
          المجلس العلمي منصة إسلامية معرفية تهدف إلى جمع العلم الشرعي الموثوق في مكان واحد بطريقة
          حديثة وسهلة الوصول.
        </p>
        <p>
          تضم المنصة الدروس العلمية، وحلقات القرآن، والمتون، والمكتبة، والأسئلة والأجوبة، والفوائد،
          والأذكار، والإعجاز العلمي، مع تنظيم المحتوى ليسهل الوصول إليه والبحث فيه.
        </p>
        <p>
          نسعى إلى بناء مرجع علمي موثوق يخدم طالب العلم والعامة، ويجمع المصادر المعتبرة في واجهة
          واحدة متطورة مع تحديث مستمر للمحتوى.
        </p>
      </LegalSection>

      <LegalSection title="لماذا المجلس العلمي؟">
        <ul className="about-values">
          {WHY_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title="رؤيتنا">
        <p>
          أن تصبح المنصة المرجع الإسلامي الرقمي الأول للمحتوى الشرعي العربي الموثوق.
        </p>
      </LegalSection>

      <LegalSection title="رسالتنا">
        <p>
          تقديم العلم الشرعي بطريقة حديثة، مرتبة، وسهلة الوصول، مع المحافظة على موثوقية المصادر.
        </p>
      </LegalSection>

      <LegalSection title="روابط مفيدة">
        <p>
          <Link href="/lessons">الدروس</Link>
          {" · "}
          <Link href="/quran-circles">حلقات القرآن</Link>
          {" · "}
          <Link href="/mutoon">المتون</Link>
          {" · "}
          <Link href="/annual-courses">الدورات</Link>
          {" · "}
          <Link href="/contact">تواصل معنا</Link>
        </p>
      </LegalSection>

      <LegalBackLink />
    </LegalPageLayout>
  );
}
