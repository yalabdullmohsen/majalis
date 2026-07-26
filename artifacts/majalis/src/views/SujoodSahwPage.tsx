import { useEffect } from "react";
import { PageHeader } from "@/components/ui-common";
import { applyPageSeo } from "../lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";

type Ruling = {
  id: string;
  title: string;
  timing: "قبل السلام" | "بعد السلام" | "كلاهما";
  description: string;
  detail: string;
  evidence: string;
  color: string;
};

const RULINGS: Ruling[] = [
  {
    id: "r1",
    title: "نسيان التشهد الأول",
    timing: "قبل السلام",
    description: "إذا نسي المصلي الجلوس للتشهد الأول وقام إلى الركعة الثالثة.",
    detail:
      "إن تذكّر قبل انتصابه قائمًا رجع وجلس، وإن انتصب قائمًا استمرّ ولم يرجع، وسجد للسهو قبل السلام — على ما في حديث عبد الله بن بُحينة.",
    evidence: "البخاري ١٢٣٠ ومسلم ٥٧٠ — حديث ابن بحينة فيمن قام عن التشهد الأوسط.",
    color: "#7c3aed",
  },
  {
    id: "r2",
    title: "الزيادة في عدد الركعات",
    timing: "بعد السلام",
    description: "إذا صلّى خمسًا بدلًا من أربع، أو زاد ركعة سهوًا.",
    detail:
      "إذا سلّم ثم تبيّن له أنه زاد، يسجد سجدتين بعد السلام؛ كما في حديث ابن مسعود فيمن صلّى خمسًا.",
    evidence: "البخاري ١٢٢٦ ومسلم ٥٧٢ — «إذا زاد الرجل أو نقص فليسجد سجدتين».",
    color: "#0284c7",
  },
  {
    id: "r3",
    title: "الشك في عدد الركعات",
    timing: "كلاهما",
    description: "إذا شكّ المصلي: هل صلّى ثلاثًا أم أربعًا مثلاً.",
    detail:
      "إن لم يترجّح له شيء بنى على اليقين (الأقل) وسجد قبل السلام. وإن غلب على ظنه أحد الأمرين بنى عليه، ويكون سجوده بعد السلام عند طائفة من أهل العلم.",
    evidence: "مسلم ٥٧١ — «إذا شك أحدكم في صلاته… فليتحرّ الصواب ثم ليسجد سجدتين».",
    color: "#059669",
  },
  {
    id: "r4",
    title: "السلام قبل تمام الصلاة",
    timing: "بعد السلام",
    description: "إذا سلّم قبل إتمام الصلاة ظانًا أنها تمّت، ثم نُبِّه أو تذكّر قريبًا.",
    detail: "يُتمّ ما بقي ثم يسجد للسهو بعد السلام؛ كما في قصة ذي اليدين.",
    evidence: "البخاري ٤٨٢ ومسلم ٥٧٣ — حديث ذي اليدين.",
    color: "#b45309",
  },
  {
    id: "r5",
    title: "القيام في موضع الجلوس",
    timing: "قبل السلام",
    description: "إذا قام إلى ركعة زائدة ظنًا منه أن الصلاة لم تنتهِ.",
    detail:
      "يرجع متى تذكّر، فيجلس للتشهد إن كان موضعه، ثم يسجد للسهو. ولا تُحسب الركعة الزائدة من الصلاة.",
    evidence: "يُلحق بأحاديث الزيادة والنقص في الصحيحين؛ والضابط: السجود لجبر الخلل.",
    color: "#be123c",
  },
  {
    id: "r6",
    title: "الجلوس في موضع القيام",
    timing: "قبل السلام",
    description: "إذا جلس في غير موضع التشهد، أو زاد جلسة ليست من الصلاة.",
    detail: "يقوم حين يتذكّر ويُتمّ صلاته، ثم يسجد للسهو قبل السلام عن الجلوس الزائد عند من يقول بذلك.",
    evidence: "عموم حديث ابن مسعود في السهو عن الزيادة والنقص — البخاري ١٢٢٦.",
    color: "#0f766e",
  },
  {
    id: "r7",
    title: "ترك واجب من واجبات الصلاة",
    timing: "قبل السلام",
    description: "إذا ترك واجبًا عند من يفرّق بين الأركان والواجبات، كالتشهد الأول.",
    detail:
      "يسجد للسهو قبل السلام عن ترك الواجب سهوًا عند الحنابلة ومن وافقهم؛ والمذاهب تختلف في تعداد الواجبات.",
    evidence: "حديث ابن بحينة أصلٌ في السجود قبل السلام عن ترك التشهد الأوسط — البخاري ١٢٣٠.",
    color: "#6d28d9",
  },
  {
    id: "r8",
    title: "كيفية أداء سجود السهو",
    timing: "كلاهما",
    description: "طريقة أداء سجود السهو قبل السلام أو بعده.",
    detail:
      "يسجد سجدتين كسجود الصلاة؛ يكبّر للسجود والرفع، ويقول فيهما ما يقول في سجود الصلاة، ثم يسلّم إن كانتا بعد السلام، أو يسلّم بعدهما إن كانتا قبله بحسب موضع السهو.",
    evidence: "الصحيحان في مواضع السهو؛ وصفة السجود من صفة الصلاة العامة.",
    color: "#1d4ed8",
  },
];

const TIMING_COLORS: Record<Ruling["timing"], string> = {
  "قبل السلام": "#059669",
  "بعد السلام": "#0284c7",
  كلاهما: "#7c3aed",
};

export default function SujoodSahwPage() {
  useEffect(() => {
    applyPageSeo({
      title: "سجود السهو — أحكامه من السنة",
      description:
        "أحكام سجود السهو وحالات الزيادة والنقص والشك، مع أدلة من الصحيحين ومتى يكون قبل السلام أو بعده.",
      path: "/sujood-sahw",
    });
  }, []);

  return (
    <div className="page-shell" dir="rtl">
      <PageHeader
        eyebrow="الفقه العملي"
        title="سجود السهو"
        subtitle="أحكام سجود السهو وحالاته من السنة الصحيحة، ومتى يكون قبل السلام أو بعده."
      />

      <div className="max-w-3xl mx-auto px-4 mb-8">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5">
          <p className="text-emerald-900 dark:text-emerald-200 text-sm leading-relaxed">
            <strong>سجود السهو</strong> سجدتان يأتي بهما المصلي تداركًا لما وقع من نقص أو زيادة أو شكّ
            سهوًا. وهو مشروع بالسنة الصحيحة؛ قال ﷺ: «إذا زاد الرجل أو نقص فليسجد سجدتين» — متفق عليه.
            ويُؤدَّى قبل السلام أو بعده بحسب نوع السهو، مع مراعاة الخلاف المعتبر بين المذاهب في بعض التفاصيل.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mb-6">
        <div className="flex flex-wrap gap-3">
          {(Object.entries(TIMING_COLORS) as [Ruling["timing"], string][]).map(([timing, color]) => (
            <span
              key={timing}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full text-white"
              style={{ background: color }}
            >
              {timing}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        <div className="space-y-4">
          {RULINGS.map((r) => (
            <article
              key={r.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm"
              style={{ borderRight: `4px solid ${r.color}` }}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className="font-bold text-gray-900 dark:text-white text-base leading-snug">
                    {r.title}
                  </h2>
                  <span
                    className="flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full text-white whitespace-nowrap"
                    style={{ background: TIMING_COLORS[r.timing] }}
                  >
                    {r.timing}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
                  {r.description}
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-3">
                  <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">{r.detail}</p>
                </div>
                <p
                  className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-r-2 pr-3"
                  style={{ borderColor: r.color }}
                >
                  <span className="font-bold text-gray-700 dark:text-gray-300">الدليل: </span>
                  {r.evidence}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <p className="text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
            <strong>ملاحظة:</strong> المسائل تعليمية جامعة مع مراعاة الخلاف المعتبر. لمزيد من التفصيل راجع
            كتب الفقه المعتمدة كـ«الروض المربع» و«المغني» و«المجموع».
          </p>
        </div>

        <div className="mt-6 pb-6">
          <ShareButtons
            title="سجود السهو — المجلس العلمي"
            url="https://www.majlisilm.com/sujood-sahw"
          />
        </div>

        <div className="pb-16">
          <RelatedKnowledge kind="lesson" query="سجود السهو الصلاة" title="مواد ذات صلة بالصلاة" limit={6} />
        </div>
      </div>
    </div>
  );
}
