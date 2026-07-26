import { useEffect } from "react";
import { PageHeader } from "@/components/ui-common";
import { applyPageSeo } from "../lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";

type Disease = {
  id: string;
  name: string;
  arabic: string;
  definition: string;
  signs: string[];
  remedy: string;
  evidence: string;
  color: string;
};

const DISEASES: Disease[] = [
  {
    id: "kibr",
    name: "الكبر والعجب",
    arabic: "كِبر وعُجب",
    definition: "الكبر: بطر الحق وغمط الناس. والعجب: الإعجاب بالنفس مع نسيان أن النعمة من الله.",
    signs: [
      "رفض الحق أو التساهل في قبوله",
      "احتقار من دونه في مال أو علم أو منزلة",
      "الامتعاض من النقد والنصيحة",
      "طلب العلو على الناس في المجالس والرأي",
    ],
    remedy: "تذكّر الأصل والمآل؛ خُلق من تراب وسيعود إليه، والتفكّر في نعم الله، ومجالسة المساكين، وقراءة سير المتواضعين من السلف.",
    evidence: "قال ﷺ: «لا يدخل الجنة من كان في قلبه مثقال ذرة من كبر» — مسلم ٩١. وقال تعالى: ﴿إِنَّهُ لَا يُحِبُّ الْمُسْتَكْبِرِينَ﴾.",
    color: "#dc2626",
  },
  {
    id: "hasad",
    name: "الحسد",
    arabic: "حسد",
    definition: "تمنّي زوال نعمة الغير، أو كراهة ما أنعم الله به عليه.",
    signs: [
      "الانقباض عند رؤية نعمة على الغير",
      "الفرح بمصيبة المحسود",
      "السعي إلى إيذائه بالكلام أو الفعل",
      "التشكيك في عدل الله في قسمة الأرزاق",
    ],
    remedy: "الإيمان بأن الرازق هو الله، والدعاء للمحسود بالبركة، وشكر الله على ما أعطى، والتعوّذ من شر الحاسد.",
    evidence: "قال تعالى: ﴿وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ﴾. وقال ﷺ: «لا تحاسدوا ولا تناجشوا… وكونوا عباد الله إخواناً» — مسلم ٢٥٦٣.",
    color: "#7c3aed",
  },
  {
    id: "riyaa",
    name: "الرياء والسمعة",
    arabic: "رياء",
    definition: "إظهار العبادة أو الفضيلة ابتغاء ثناء الناس لا رضا الله، وهو من الشرك الأصغر.",
    signs: [
      "زيادة الاجتهاد حين يُرى ونقصه عند الخلوة",
      "حب المدح والتألّم من الذم",
      "إخبار الناس بالعبادات الخفية",
      "تزيين العمل للخلق لا للخالق",
    ],
    remedy: "تجديد النية قبل العمل، والإسرار بالطاعات ما أمكن، وتذكّر أن الناس لا يملكون نفعاً ولا ضراً.",
    evidence: "قال ﷺ فيمن يرائي: «أنا أغنى الشركاء عن الشرك؛ من عمل عملاً أشرك فيه معي غيري تركته وشركه» — مسلم ٢٩٨٥.",
    color: "#0284c7",
  },
  {
    id: "ghadhab",
    name: "الغضب",
    arabic: "غضب",
    definition: "انفعال يدفع إلى إيذاء عند مخالفة الهوى؛ مذموم إذا خرج عن حدّ العدل الشرعي.",
    signs: [
      "سرعة الانفعال لأسباب يسيرة",
      "قول أو فعل يُندم عليه",
      "الثأر والانتقام بغير حق",
      "إيذاء النفس أو الغير قولًا أو فعلًا",
    ],
    remedy: "الاستعاذة بالله من الشيطان، والصمت، وتغيير الهيئة (قيام/قعود/اضطجاع)، وتذكّر فضل كظم الغيظ.",
    evidence: "قال ﷺ لرجل: «لا تغضب» وكرّرها — البخاري ٦١١٦. وقال تعالى: ﴿وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ﴾.",
    color: "#ea580c",
  },
  {
    id: "hiqd",
    name: "الحقد",
    arabic: "حقد",
    definition: "إضمار العداوة وتربّص الفرصة للانتقام، وهو ضدّ سلامة الصدر.",
    signs: [
      "استحضار أخطاء الآخرين وتضخيمها",
      "السرور بمصيبة من يُبغض",
      "الهجر بلا مسوّغ شرعي",
      "الإصرار على الشحناء رغم فرص الصلح",
    ],
    remedy: "مجاهدة النفس على العفو، وتذكّر قِصَر الأجل، وترك الهجر المحرّم، والدعاء لمن أساء.",
    evidence: "قال ﷺ: «لا يحل لمسلم أن يهجر أخاه فوق ثلاث ليالٍ… وخيرهما الذي يبدأ بالسلام» — متفق عليه.",
    color: "#9f1239",
  },
  {
    id: "dunya",
    name: "حب الدنيا وطول الأمل",
    arabic: "حب الدنيا",
    definition: "جعل الدنيا أكبر همّ القلب مع إغفال الآخرة؛ ليس العمل للدنيا محرّماً لذاته، بل تقديمها على ما فرض الله.",
    signs: [
      "الانشغال الدائم بتحصيل المال والجاه عن الفرائض",
      "تأجيل التوبة إلى «وقت فراغ»",
      "قلّة البركة في الوقت مع كثرة الشواغل",
      "الحزن الشديد على فوات حظ دنيوي",
    ],
    remedy: "تذكّر الموت، وزيارة القبور، وموازنة السعي المشروع بحقوق الله، ومجالسة الزاهدين الصادقين.",
    evidence: "قال تعالى: ﴿أَلْهَاكُمُ التَّكَاثُرُ﴾. وقال ﷺ: «كن في الدنيا كأنك غريب أو عابر سبيل» — البخاري ٦٤١٦.",
    color: "#854d0e",
  },
  {
    id: "ghiba",
    name: "الغيبة والنميمة",
    arabic: "غيبة ونميمة",
    definition: "الغيبة: ذكر أخيك بما يكره. والنميمة: نقل الكلام للإفساد بين الناس.",
    signs: [
      "ذكر عيوب الغائبين في المجالس",
      "الانجذاب لأخبار الناس الخاصة",
      "نقل ما يُقال في شخص إلى آخر للإفساد",
      "التلذّذ بما يمسّ عرض المسلم",
    ],
    remedy: "حفظ اللسان، واستبداله بالذكر، والاستغفار لمن اغتيب، والامتناع عن سماع النميمة.",
    evidence: "قال تعالى: ﴿وَلَا يَغْتَب بَّعْضُكُم بَعْضًا﴾. وقال ﷺ: «لا يدخل الجنة نمّام» — متفق عليه.",
    color: "#0f766e",
  },
  {
    id: "bukhl",
    name: "الشحّ والبخل",
    arabic: "بخل وشح",
    definition: "البخل: الإمساك عن الواجب أو المستحب المشروع. والشح: شدة الحرص مع منع الحقوق.",
    signs: [
      "التحسّر على ما أُنفق في الحقوق الواجبة",
      "الإحجام عن الصدقة والصلة",
      "الضيق من إكرام الضيف",
      "تمنّي ما في يد الغير مع المنع",
    ],
    remedy: "الإيمان بأن الله يخلف النفقة، والتدرّج في الإنفاق، وتذكّر وعيد مانعي الزكاة وفضل المنفقين.",
    evidence: "قال تعالى: ﴿وَمَن يُوقَ شُحَّ نَفْسِهِ فَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ﴾. وقال ﷺ: «اتقوا الشح فإن الشح أهلك من كان قبلكم» — مسلم ٢٥٧٨.",
    color: "#1d4ed8",
  },
];

export default function AmradQalbiyyaPage() {
  useEffect(() => {
    applyPageSeo({
      title: "أمراض القلوب وعلاجها",
      description:
        "أبرز أمراض القلب — الكبر والحسد والرياء والغضب وغيرها — بتعريف وعلامات وعلاج، مع أدلة من الكتاب والسنة الصحيحة.",
      path: "/amrad-qalbiyya",
    });
  }, []);

  return (
    <div className="page-shell" dir="rtl">
      <PageHeader
        eyebrow="التزكية والأخلاق"
        title="الأمراض القلبية"
        subtitle="أبرز أمراض القلب ومفسداته، وعلامات كل مرض وطريق علاجه من الكتاب والسنة."
      />

      <div className="max-w-3xl mx-auto px-4 mb-8">
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-5">
          <p className="text-rose-900 dark:text-rose-200 text-sm leading-relaxed">
            القلب مدار الصلاح والفساد؛ قال ﷺ: «ألا وإن في الجسد مضغة إذا صلحت صلح الجسد كله، وإذا فسدت فسد الجسد كله، ألا وهي القلب» — متفق عليه. وفيما يلي أبرز أمراضه مع علاماتها وعلاجها وأدلتها الثابتة.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        <div className="grid grid-cols-1 gap-5 pb-8">
          {DISEASES.map((d) => (
            <article
              key={d.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm"
            >
              <div
                className="px-5 py-4 flex items-center gap-3"
                style={{ background: `${d.color}15` }}
              >
                <div>
                  <h2 className="font-extrabold text-gray-900 dark:text-white text-base">
                    {d.name}
                  </h2>
                  <span className="text-xs text-gray-400 font-light tracking-wide">{d.arabic}</span>
                </div>
                <div
                  className="mr-auto w-2 h-10 rounded-full flex-shrink-0"
                  style={{ background: d.color }}
                  aria-hidden
                />
              </div>

              <div className="p-5 space-y-4">
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {d.definition}
                </p>

                <div>
                  <h3
                    className="text-xs font-bold uppercase tracking-wide mb-2"
                    style={{ color: d.color }}
                  >
                    علامات الإصابة
                  </h3>
                  <ul className="space-y-1">
                    {d.signs.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <span className="mt-0.5 flex-shrink-0" style={{ color: d.color }}>•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className="rounded-xl p-3"
                  style={{ background: `${d.color}10`, border: `1px solid ${d.color}30` }}
                >
                  <h3 className="text-xs font-bold mb-1" style={{ color: d.color }}>
                    طريق العلاج
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {d.remedy}
                  </p>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-r-2 pr-3" style={{ borderColor: d.color }}>
                  <span className="font-bold text-gray-700 dark:text-gray-300">الدليل: </span>
                  {d.evidence}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="pb-6">
          <ShareButtons
            title="الأمراض القلبية — المجلس العلمي"
            url="https://www.majlisilm.com/amrad-qalbiyya"
          />
        </div>

        <div className="pb-16">
          <RelatedKnowledge kind="fawaid" query="أمراض القلوب تزكية" title="مواضيع ذات صلة بالتزكية" limit={6} />
        </div>
      </div>
    </div>
  );
}
