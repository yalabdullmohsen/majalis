import { Link } from "wouter";

type Faq = { q: string; a: string };

const META: Record<
  "sahih" | "daif" | "mawdu" | "hub",
  {
    definition: string;
    examples: string[];
    sources: string[];
    links: { href: string; label: string }[];
    faq: Faq[];
  }
> = {
  hub: {
    definition:
      "الحديث النبوي هو ما أُضيف إلى النبي ﷺ من قول أو فعل أو تقرير أو صفة. يُدرَس سندًا ومتنًا لتمييز المقبول من المردود على منهج أهل الحديث.",
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
      { href: "/scholars/bukhari", label: "الإمام البخاري" },
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
    definition:
      "الحديث الصحيح: ما اتصل سنده بنقل العدل الضابط عن مثله إلى منتهاه، من غير شذوذ ولا علّة. يُحتج به في العقائد والأحكام على منهج أهل السنة.",
    examples: [
      "ما أخرجه البخاري ومسلم أو أحدهما في الصحيح.",
      "ما صححه الأئمة بشروطهم وإن لم يكن في الصحيحين.",
    ],
    sources: [
      "البخاري، الجامع الصحيح",
      "مسلم، الجامع الصحيح",
      "ابن حجر، نزهة النظر",
    ],
    links: [
      { href: "/hadith-science", label: "مصطلح الحديث" },
      { href: "/hadith/daif", label: "الضعيف" },
      { href: "/scholars/bukhari", label: "البخاري" },
      { href: "/scholars/muslim", label: "مسلم" },
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
    definition:
      "الحديث الضعيف: ما فقد شرطًا من شروط القبول (كانقطاع أو ضعف راوٍ أو شذوذ أو علّة). يُعرض للتمييز والتخريج، لا للاحتجاج في العقائد والأحكام على منهج هذه المنصة.",
    examples: [
      "مرسل التابعي إذا لم يعتضد.",
      "رواية مجهول أو شديد الضعف دون متابعات.",
    ],
    sources: [
      "ابن الصلاح، علوم الحديث",
      "الذهبي، الميزان",
      "ابن حجر، تقريب التهذيب",
    ],
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
    definition:
      "الحديث الموضوع: المختلق المنسوب كذبًا إلى النبي ﷺ. أشد مراتب الرد؛ يُذكر للتحذير مع بيان واضعه أو حكم الأئمة عليه.",
    examples: [
      "روايات عُرف واضعها واعترف بالوضع.",
      "متون تناقض القطعي من الشرع مع إسناد تالف.",
    ],
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

export function HadithClassGuide({ kind }: { kind: keyof typeof META }) {
  const m = META[kind];
  return (
    <section className="hadith-class-guide" dir="rtl" aria-label="تعريف ومصادر">
      <h2 className="hadith-class-guide__title">تعريف</h2>
      <p className="hadith-class-guide__p">{m.definition}</p>

      <h3 className="hadith-class-guide__h">أمثلة</h3>
      <ul className="hadith-class-guide__list">
        {m.examples.map((ex) => (
          <li key={ex}>{ex}</li>
        ))}
      </ul>

      <h3 className="hadith-class-guide__h">مصادر</h3>
      <ul className="hadith-class-guide__list">
        {m.sources.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>

      <h3 className="hadith-class-guide__h">روابط داخلية</h3>
      <nav className="hadith-class-guide__nav" aria-label="روابط ذات صلة">
        {m.links.map((l) => (
          <Link key={l.href} href={l.href} className="hadith-class-guide__link">
            {l.label}
          </Link>
        ))}
      </nav>

      <h3 className="hadith-class-guide__h">أسئلة مختصرة</h3>
      <dl className="hadith-class-guide__faq">
        {m.faq.map((item) => (
          <div key={item.q}>
            <dt>{item.q}</dt>
            <dd>{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
