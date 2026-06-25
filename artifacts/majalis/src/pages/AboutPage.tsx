import { Link } from "wouter";
import { LegalBackLink, LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";

export default function AboutPage() {
  return (
    <LegalPageLayout eyebrow="تعرف علينا" title="من نحن">
      <LegalSection title="المجلس العلمي">
        <p>
          المجلس العلمي منصة علمية شرعية كويتية تجمع الدروس والمحاضرات والفوائد والأذكار
          والأسئلة الشرعية في مكان واحد، بطريقة منظمة وسهلة الوصول.
        </p>
      </LegalSection>

      <LegalSection title="رسالتنا">
        <p>
          نسعى إلى تيسير الوصول إلى العلم الشرعي الموثّق، وربط طالب العلم بالدروس في مساجد الكويت
          والمصادر العلمية المعتمدة، مع مراعاة الدقة والأدب في عرض المحتوى.
        </p>
      </LegalSection>

      <LegalSection title="مبادئنا">
        <ul>
          <li>التوثيق: كل مادة مدعّمة بالمرجع قدر الإمكان.</li>
          <li>الاعتماد: المحتوى يُراجع ويُنظّم قبل العرض.</li>
          <li>الإتاحة: واجهة عربية واضحة ومجانية للجميع.</li>
        </ul>
      </LegalSection>

      <LegalSection title="روابط مفيدة">
        <p>
          <Link href="/lessons">الدروس</Link>
          {" · "}
          <Link href="/kuwait-lessons">دروس الكويت</Link>
          {" · "}
          <Link href="/contact">تواصل معنا</Link>
        </p>
      </LegalSection>

      <LegalBackLink />
    </LegalPageLayout>
  );
}
