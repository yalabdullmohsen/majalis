import { PageHeader } from "@/components/ui-common";

type Ruling = {
  id: string;
  title: string;
  timing: "قبل السلام" | "بعد السلام" | "كلاهما";
  description: string;
  detail: string;
  color: string;
};

const RULINGS: Ruling[] = [
  {
    id: "r1",
    title: "نسيان التشهد الأول",
    timing: "قبل السلام",
    description: "إذا نسي المصلي الجلوس للتشهد الأول وقام إلى الركعة الثالثة.",
    detail: "إن تذكّر قبل انتصابه قائمًا رجع وجلس، وإن انتصب قائمًا استمرّ ولم يرجع، وسجد للسهو قبل السلام.",
    color: "#7c3aed",
  },
  {
    id: "r2",
    title: "الزيادة في عدد الركعات",
    timing: "بعد السلام",
    description: "إذا صلّى خمسًا بدلًا من أربع، أو ثلاثًا بدلًا من اثنتين.",
    detail: "إذا سلّم ثم تبيّن له أنه زاد ركعة أو أكثر، يسجد سجدتين للسهو بعد السلام مباشرةً.",
    color: "#0284c7",
  },
  {
    id: "r3",
    title: "الشك في عدد الركعات",
    timing: "كلاهما",
    description: "إذا شكّ المصلي في عدد الركعات: هل صلّى ثلاثًا أم أربعًا مثلاً.",
    detail: "إن غلب على ظنه أحد الأمرين بنى عليه وأتم صلاته، ويكون سجوده بعد السلام عند طائفة من أهل العلم. وإن لم يترجح له شيء بنى على اليقين، وهو الأقل، وسجد قبل السلام.",
    color: "#059669",
  },
  {
    id: "r4",
    title: "السلام قبل تمام الصلاة",
    timing: "بعد السلام",
    description: "إذا سلّم المصلي قبل إتمام الصلاة ظاناً أنها تمت، ثم نُبِّه أو تذكّر قريباً.",
    detail: "يتم ما بقي من صلاته ثم يسجد للسهو بعد السلام؛ كما في قصة ذي اليدين في الصحيحين.",
    color: "#b45309",
  },
  {
    id: "r5",
    title: "القيام في موضع الجلوس",
    timing: "قبل السلام",
    description: "إذا قام المصلي إلى ركعة زائدة ظنًا منه أن الصلاة لم تنتهِ.",
    detail: "يرجع متى تذكّر أنها زيادة، فيجلس للتشهد إن كان موضعه، ثم يسجد للسهو. ولا تُحسب الركعة الزائدة من الصلاة.",
    color: "#be123c",
  },
  {
    id: "r6",
    title: "الجلوس في موضع القيام",
    timing: "قبل السلام",
    description: "إذا جلس المصلي في غير موضع التشهد، أو زاد جلسةً ليست من الصلاة.",
    detail: "يقوم حين يتذكّر ويُتمّ صلاته، ثم يسجد للسهو قبل السلام تعويضًا عن الجلوس الزائد.",
    color: "#0f766e",
  },
  {
    id: "r7",
    title: "ترك واجب من واجبات الصلاة",
    timing: "قبل السلام",
    description: "إذا ترك واجبًا عند من يفرّق بين الأركان والواجبات، كالتشهد الأول أو التسبيح الواجب.",
    detail: "يسجد للسهو قبل السلام عن ترك كل واجب سهوًا، وهذا عند من يفرّق بين الفرائض والواجبات.",
    color: "#6d28d9",
  },
  {
    id: "r8",
    title: "كيفية أداء سجود السهو",
    timing: "كلاهما",
    description: "طريقة أداء سجود السهو سواء كان قبل السلام أو بعده.",
    detail: "يسجد سجدتين مثل سجود الصلاة؛ يُكبّر للسجود، ويقول في كل سجدة ما يقول في سجود الصلاة، ثم يرفع ويُسلّم إن كان بعد السلام، أو يُسلّم بعدهما إن كانتا قبل السلام بحسب مذهب المصلي.",
    color: "#1d4ed8",
  },
];

const TIMING_COLORS: Record<Ruling["timing"], string> = {
  "قبل السلام": "#059669",
  "بعد السلام": "#0284c7",
  "كلاهما":     "#7c3aed",
};

export default function SujoodSahwPage() {
  return (
    <div className="page-shell" dir="rtl">
      <PageHeader
        eyebrow="الفقه العملي"
        title="سجود السهو"
        subtitle="أحكام سجود السهو وحالاته ومتى يكون قبل السلام أو بعده."
      />

      {/* مقدمة */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5">
          <p className="text-emerald-900 dark:text-emerald-200 text-sm leading-relaxed">
            <strong>سجود السهو</strong> سجدتان يأتي بهما المصلي تداركًا لما وقع منه من نقص أو زيادة أو شكّ في صلاته سهوًا. وهو مشروع بالسنة النبوية الصحيحة، ويُؤدَّى إمّا قبل السلام أو بعده بحسب نوع السهو.
          </p>
        </div>
      </div>

      {/* مفتاح الألوان */}
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

      {/* بطاقات الأحكام */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="space-y-4">
          {RULINGS.map((r) => (
            <div
              key={r.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm"
              style={{ borderRight: `4px solid ${r.color}` }}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base leading-snug">
                    {r.title}
                  </h3>
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
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                    📌 {r.detail}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ملاحظة */}
        <div className="mt-8 mb-12 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
          <p className="text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
            <strong>ملاحظة:</strong> المسائل المذكورة هي أحكام تعليمية جامعة مع مراعاة الخلاف المعتبر بين المذاهب مع مراعاة الخلاف المعتبر بين المذاهب. لمزيد من التفصيل راجع كتب الفقه المعتمدة كـ«الروض المربع» و«المغني».
          </p>
        </div>
      </div>
    </div>
  );
}
