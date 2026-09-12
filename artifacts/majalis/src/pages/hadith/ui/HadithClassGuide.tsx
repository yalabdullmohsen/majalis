import { KnowledgeLayout } from "@/components/knowledge";
import {
  HadithDefinitionCard,
  HadithWarningCard,
  HadithSourcesCard,
  HadithInternalLinks,
} from "@/components/hadith/HadithKnowledgeBlocks";
import { HadithFaq } from "@/components/hadith/HadithFaq";
import { HadithInfoHero, HadithReaderSection } from "@/components/hadith/HadithReaderSection";
import "@/styles/pages/hadith-design-language.css";

type Faq = { q: string; a: string };

const META: Record<
  "sahih" | "daif" | "mawdu" | "hub",
  {
    eyebrow: string;
    title: string;
    lead: string;
    definition: string;
    notice: string;
    examples: string[];
    sources: string[];
    links: { href: string; label: string }[];
    faq: Faq[];
  }
> = {
  hub: {
    eyebrow: "الحديث وعلومه",
    title: "مدخل إلى الحديث النبوي",
    lead: "المتن أولًا، ثم الراوي والمصدر والتخريج والحكم — بلغة بصرية تميّز كل عنصر.",
    definition:
      "الحديث النبوي هو ما أُضيف إلى النبي ﷺ من قول أو فعل أو تقرير أو صفة. يُدرَس سندًا ومتنًا لتمييز المقبول من المردود على منهج أهل الحديث.",
    notice:
      "لا يُنسب إلى النبي ﷺ إلا ما ثبت؛ والضعيف والموضوع هنا للتمييز والتحذير لا للاحتجاج.",
    examples: [
      "الصحيحان: البخاري ومسلم — أعلى مراتب الصحة عند الجمهور.",
      "الأربعون النووية: مختصر تعليمي في جوامع الكلم.",
      "كتب التخريج والجرح تُبيّن درجة الرواية عند أهل الاختصاص.",
    ],
    sources: [
      "ابن الصلاح، مقدمة في علوم الحديث",
      "النووي، التقريب والتيسير",
      "ابن حجر، نزهة النظر",
    ],
    links: [
      { href: "/hadith/sahih", label: "الصحيح" },
      { href: "/hadith/daif", label: "الضعيف" },
      { href: "/hadith/mawdu", label: "الموضوع" },
      { href: "/hadith-science", label: "مصطلح الحديث" },
    ],
    faq: [
      {
        q: "من أين تبدأ قراءة الحديث؟",
        a: "من الصحيحين والمتون المختصرة المعتمدة، مع الرجوع إلى مصطلح الحديث لفهم الدرجات.",
      },
      {
        q: "هل كل حديث في السنن صحيح؟",
        a: "لا؛ السنن تجمع الصحيح والحسن والضعيف بحسب شرط كل إمام، ويُحتاج إلى التخريج.",
      },
    ],
  },
  sahih: {
    eyebrow: "الحديث وعلومه",
    title: "الأحاديث الصحيحة",
    lead: "ما ثبت إسناده بشروط القبول — يُحتج به في العقائد والأحكام على منهج أهل السنة.",
    definition:
      "الحديث الصحيح: ما اتصل سنده بنقل العدل الضابط عن مثله إلى منتهاه، من غير شذوذ ولا علّة.",
    notice:
      "الصحة حكم على ثبوت النسبة؛ والفقه يجمع بين النصوص والقواعد، فيُستفتى أهل العلم في التطبيق.",
    examples: [
      "ما أخرجه البخاري ومسلم أو أحدهما في الصحيح.",
      "ما صححه الأئمة بشروطهم وإن لم يكن في الصحيحين.",
    ],
    sources: ["البخاري، الجامع الصحيح", "مسلم، الجامع الصحيح", "ابن حجر، نزهة النظر"],
    links: [
      { href: "/hadith-science", label: "مصطلح الحديث" },
      { href: "/hadith/daif", label: "الضعيف" },
      { href: "/hadith/books", label: "كتب الحديث" },
    ],
    faq: [
      {
        q: "هل الصحة تعني العمل بكل حديث صحيح في كل باب؟",
        a: "الصحة حكمٌ على ثبوت النسبة؛ والفقه يجمع بين النصوص والقواعد، فيُستفتى أهل العلم في التطبيق.",
      },
      {
        q: "لماذا يُقدَّم الصحيحان؟",
        a: "لتلقي الأمة لهما بالقبول وشدة شرطهما في الاتصال والعدالة والضبط.",
      },
    ],
  },
  daif: {
    eyebrow: "الحديث وعلومه",
    title: "الأحاديث الضعيفة",
    lead: "للتمييز والتخريج — لا للاحتجاج في العقائد والأحكام على منهج هذه المنصة.",
    definition:
      "الحديث الضعيف: ما فقد شرطًا من شروط القبول (كانقطاع أو ضعف راوٍ أو شذوذ أو علّة).",
    notice:
      "منهج سُنّة: لا يُحتج بالضعيف في العقائد ولا الأحكام ولا الترغيب؛ الاستغناء بالثابت أولى، ويُعرض هنا للتخريج والتمييز فقط.",
    examples: ["مرسل التابعي إذا لم يعتضد.", "رواية مجهول أو شديد الضعف دون متابعات."],
    sources: ["ابن الصلاح، علوم الحديث", "الذهبي، الميزان", "ابن حجر، تقريب التهذيب"],
    links: [
      { href: "/hadith/sahih", label: "الصحيح" },
      { href: "/hadith/mawdu", label: "الموضوع" },
      { href: "/hadith-science", label: "مصطلح الحديث" },
    ],
    faq: [
      {
        q: "هل يُعمل بالضعيف في الفضائل؟",
        a: "منهج سُنّة: الاستغناء بالثابت أولى، ولا يُحتج بالضعيف في العقائد ولا الأحكام ولا يُنسب إلى النبي ﷺ دون بيان.",
      },
    ],
  },
  mawdu: {
    eyebrow: "الحديث وعلومه",
    title: "الأحاديث الموضوعة",
    lead: "للتحذير وبيان الوضع — يحرم نسبتها إلى النبي ﷺ دون بيان.",
    definition:
      "الحديث الموضوع: المختلق المنسوب كذبًا إلى النبي ﷺ. أشد مراتب الرد.",
    notice: "يحرم رواية الموضوع إلا مقرونة ببيان وضعه، ويحرم نسبته إلى النبي ﷺ.",
    examples: ["روايات عُرف واضعها واعترف بالوضع.", "متون تناقض القطعي من الشرع مع إسناد تالف."],
    sources: [
      "ابن الجوزي، الموضوعات",
      "الشوكاني، الفوائد المجموعة",
      "الألباني، سلسلة الأحاديث الضعيفة والموضوعة",
    ],
    links: [
      { href: "/hadith/sahih", label: "الصحيح" },
      { href: "/hadith-science", label: "مصطلح الحديث" },
      { href: "/hadith/daif", label: "الضعيف" },
    ],
    faq: [
      {
        q: "هل تجوز رواية الموضوع؟",
        a: "لا إلا مقرونة ببيان وضعه، ويحرم نسبته إلى النبي ﷺ.",
      },
    ],
  },
};

/**
 * Knowledge Reader Pattern:
 * تعريف → تنبيه علمي → أمثلة → مصادر → روابط داخلية → أسئلة مختصرة
 */
export function HadithClassGuide({ kind }: { kind: keyof typeof META }) {
  const m = META[kind];
  return (
    <KnowledgeLayout kind="reader" className="hdl-reader hadith-class-guide" data-hdl="class-guide" data-knowledge-reader="1" data-kx="1">
      <HadithInfoHero eyebrow={m.eyebrow} title={m.title} lead={m.lead} />
      <HadithDefinitionCard>{m.definition}</HadithDefinitionCard>
      <HadithWarningCard>{m.notice}</HadithWarningCard>
      <HadithReaderSection title="أمثلة" examples={m.examples} />
      <HadithSourcesCard sources={m.sources} />
      <HadithInternalLinks links={m.links} />
      <HadithFaq items={m.faq} />
    </KnowledgeLayout>
  );
}
