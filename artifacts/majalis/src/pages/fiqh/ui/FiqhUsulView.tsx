import { Link } from "wouter";
import { useEffect } from "react";
import { applyPageSeo } from "@/lib/seo";
import { usePageView } from "@/hooks/usePageView";
import "@/styles/pages/fiqh-hub.css";

const USUL_ITEMS = [
  {
    title: "الكتاب",
    summary: "القرآن أصل الأدلة، لا يُقدَّم عليه غيره، ويُفهم بعربيته ودلالة السلف.",
    evidence: "قال تعالى: ﴿وَنَزَّلْنَا عَلَيْكَ الْكِتَابَ تِبْيَانًا لِّكُلِّ شَيْءٍ﴾ النحل: 89.",
    source: { book: "روضة الناظر وجنة المناظر", author: "موفق الدين ابن قدامة المقدسي", ref: "باب الأدلة، الكتاب" },
  },
  {
    title: "السنة",
    summary: "السنة وحي بيان، حجة في الأحكام إذا صحت، وتشمل القول والفعل والتقرير.",
    evidence: "قال تعالى: ﴿وَمَا آتَاكُمُ الرَّسُولُ فَخُذُوهُ﴾ الحشر: 7. وقال ﷺ: «عليكم بسنتي» رواه أبو داود والترمذي.",
    source: { book: "روضة الناظر وجنة المناظر", author: "موفق الدين ابن قدامة المقدسي", ref: "باب الأدلة، السنة" },
  },
  {
    title: "الإجماع",
    summary: "إجماع علماء العصر من الأمة على حكم شرعي حجة قاطعة عند أهل السنة، وأعلاه إجماع الصحابة.",
    evidence: "قال ﷺ: «لا تجتمع أمتي على ضلالة» رواه ابن ماجه وغيره بطرق يشد بعضها بعضًا. واستدل الأصوليون بقوله تعالى: ﴿وَمَن يُشَاقِقِ الرَّسُولَ مِن بَعْدِ مَا تَبَيَّنَ لَهُ الْهُدَىٰ وَيَتَّبِعْ غَيْرَ سَبِيلِ الْمُؤْمِنِينَ﴾ النساء: 115.",
    source: { book: "روضة الناظر وجنة المناظر", author: "موفق الدين ابن قدامة المقدسي", ref: "باب الإجماع" },
  },
  {
    title: "القياس",
    summary: "إلحاق فرع بأصل في حكم لعلة جامعة، وهو حجة عند جماهير أهل العلم إذا استوفى أركانه.",
    evidence: "حديث معاذ حين بعثه إلى اليمن: «أجتهد رأيي ولا آلو» رواه أبو داود والترمذي، وتلقاه أهل العلم بالقبول في باب الاجتهاد.",
    source: { book: "الورقات", author: "عبد الملك بن عبد الله الجويني", ref: "باب القياس" },
  },
];

export default function FiqhUsulPage() {
  usePageView("fiqh-usul", null);
  useEffect(() => {
    applyPageSeo({
      path: "/fiqh/usul",
      title: "أصول الفقه | سُنّة",
      description: "أدلة الأحكام: الكتاب والسنة والإجماع والقياس، من مباحث الفقه المساندة.",
      keywords: ["أصول الفقه", "أدلة الأحكام", "سُنّة"],
    });
  }, []);

  return (
    <div className="fqp-root page-shell fiqh-hub" dir="rtl">
      <nav className="fiqh-crumb" aria-label="مسار التنقل">
        <Link href="/fiqh">الفقه</Link>
        <span aria-hidden="true"> ← </span>
        <span>أصول الفقه</span>
      </nav>
      <h1 className="fiqh-book-page__title">أصول الفقه</h1>
      <p className="fiqh-lesson-page__path">مبحث مساند، ليس من كتب الفروع.</p>
      {USUL_ITEMS.map((item) => (
        <section key={item.title} className="fiqh-usul-card">
          <h2>{item.title}</h2>
          <p>{item.summary}</p>
          <p><strong>الدليل: </strong>{item.evidence}</p>
          <p className="fiqh-usul-card__src">
            {item.source.book} — {item.source.author} — {item.source.ref}
          </p>
        </section>
      ))}
      <div className="fiqh-fab-clearance" />
    </div>
  );
}
