import { useEffect } from "react";
import { Link } from "wouter";
import { LegalBackLink, LegalPageLayout, LegalSection } from "@/components/LegalPageLayout";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";

/**
 * سياسة الفتوى والمراجعة — صفحة قانونية/منهجية.
 * لا تتضمّن فتاوى ولا ترجيحًا فقهيًا؛ توضّح حدود المنصة وسير الاعتماد.
 */
export default function FatwaPolicyPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/fatwa-policy",
      title: "سياسة الفتوى والمراجعة | المجلس العلمي",
      description:
        "كيف تُعرض الفتاوى والأحكام في المجلس العلمي، وما حدود المنصة، وسير المراجعة والاعتماد.",
      keywords: ["سياسة الفتوى", "مراجعة شرعية", "المجلس العلمي", "توثيق"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "سياسة الفتوى والمراجعة",
          url: "https://majlisilm.com/fatwa-policy",
          about: { "@type": "Organization", name: "المجلس العلمي" },
        },
      ],
    });
  }, []);

  return (
    <LegalPageLayout eyebrow="التوثيق" title="سياسة الفتوى والمراجعة" updatedAt="2026-08-06">
      <LegalSection title="الغرض من هذه السياسة">
        <p>
          توضّح هذه الصفحة كيف تُعرض المسائل والفتاوى والأحكام في المنصة، وما الذي
          لا تقوم به المنصة، وكيف تُراجع المواد الشرعية قبل اعتمادها.
        </p>
      </LegalSection>

      <LegalSection title="ما تعرضه المنصة">
        <ul>
          <li>نقل فتاوى وقرارات من مصادر وهيئات مسمّاة، مع الإحالة الظاهرة.</li>
          <li>مسائل وأحكام للتعليم العام، مرتبطة بمراجعها حين تتوفّر.</li>
          <li>شارات حالة التوثيق حين تكون مفعّلة في النظام (موثّق، قيد المراجعة، يحتاج مصدرًا).</li>
        </ul>
      </LegalSection>

      <LegalSection title="ما لا تقوم به المنصة">
        <ul>
          <li>لا تُصدر فتوى خاصة بنازلة فردية عبر الذكاء الاصطناعي أو تلقائيًا.</li>
          <li>لا ترجّح بين أقوال الفقهاء نيابةً عن أهل العلم.</li>
          <li>لا تحكم على حديث بالصحة أو الضعف من عندها؛ الدرجة تُعرض كما وردت من مصدرها، أو يُصرَّح بغيابها.</li>
          <li>المحتوى المعروض للإرشاد العام لا يغني عن سؤال أهل العلم في النوازل الخاصة.</li>
        </ul>
      </LegalSection>

      <LegalSection title="سير المراجعة والاعتماد">
        <ol>
          <li>يُنشئ المحرّر العلمي المادة أو يستوردها مع حفظ المصدر.</li>
          <li>تبقى بحالة «قيد المراجعة» حتى يراجعها مراجع شرعي مُسمّى.</li>
          <li>لا تُوسم «موثّقة» إلا بعد اعتماد المراجع، مع تسجيل التاريخ والمصدر.</li>
          <li>يمكن للمستخدم الإبلاغ عن خطأ من أسفل صفحة المحتوى لمراجعته.</li>
        </ol>
        <p>
          تفاصيل أوسع عن المصادر والدرجات في{" "}
          <Link href="/methodology">منهجية التوثيق</Link>.
        </p>
      </LegalSection>

      <LegalSection title="المساعد العلمي">
        <p>
          المساعد أداة لإرشادك إلى محتوى الموقع المنشور بمصادره. إن لم يجد مصدرًا في
          الموقع يقول ذلك ولا يولّد نصًا شرعيًا من عنده. لا تُعدّ إجاباته فتوى.
        </p>
      </LegalSection>

      <LegalSection title="التواصل">
        <p>
          للاستفسار عن سياسة المراجعة أو للإبلاغ خارج الواجهة:{" "}
          <Link href="/contact">تواصل معنا</Link>.
        </p>
      </LegalSection>

      <div className="twh-share">
        <ShareButtons title="سياسة الفتوى والمراجعة — المجلس العلمي" url="https://majlisilm.com/fatwa-policy" />
      </div>
      <LegalBackLink />
    </LegalPageLayout>
  );
}
