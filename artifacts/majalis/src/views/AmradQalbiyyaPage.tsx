import { PageHeader } from "@/components/ui-common";

type Disease = {
  id: string;
  name: string;
  arabic: string;
  icon: string;
  definition: string;
  signs: string[];
  remedy: string;
  color: string;
};

const DISEASES: Disease[] = [
  {
    id: "kibr",
    name: "الكبر والعجب",
    arabic: "Kibr & 'Ujb",
    icon: "👑",
    definition: "الكبر: رؤية النفس فوق الآخرين واحتقارهم. والعجب: الإعجاب بالنفس وإغفال نعمة الله فيها.",
    signs: [
      "رفض الحق أو التساهل في قبوله",
      "الميل إلى مخالفة الآخرين وإظهار التميّز",
      "الامتعاض من النقد والنصيحة",
      "احتقار من هو دونه في المال أو العلم أو المكانة",
    ],
    remedy: "تذكّر الأصل والمآل — خُلق من تراب وسيعود إليه — والتفكّر في نعم الله التي لا يستحقها، والمجاهدة بمخالطة المساكين وإجلالهم.",
    color: "#dc2626",
  },
  {
    id: "hasad",
    name: "الحسد",
    arabic: "Hasad",
    icon: "👁",
    definition: "تمنّي زوال نعمة الغير وإن لم يتمنّها لنفسه، وهو أشد الأمراض القلبية.",
    signs: [
      "الانقباض عند رؤية ما أُنعم على الغير",
      "الفرح بمصيبة المحسود",
      "السعي إلى إيذائه بالكلام أو الفعل",
      "التشكيك في نعم الله على عباده",
    ],
    remedy: "تذكّر أن الرازق هو الله وليس أحدًا من الخلق، والدعاء للمحسود بالبركة، وشكر الله على ما أعطى، وقراءة المعوّذتين.",
    color: "#7c3aed",
  },
  {
    id: "riyaa",
    name: "الرياء والسمعة",
    arabic: "Riyā'",
    icon: "🎭",
    definition: "إظهار العبادة أو الفضيلة ابتغاء ثناء الناس لا رضا الله تعالى، وهو الشرك الخفي.",
    signs: [
      "زيادة الخشوع والاجتهاد حين يُرى",
      "التباطؤ أو فتور الهمة حين يُخلى",
      "حب المدح والتألّم من الذم",
      "إخبار الناس بعباداته الخفية",
    ],
    remedy: "الإخلاص لله بتجديد النية قبل كل عبادة، والإسرار بالعبادات ما استطاع، والتفكّر في صغر الدنيا وعظم الآخرة.",
    color: "#0284c7",
  },
  {
    id: "ghadhab",
    name: "الغضب",
    arabic: "Ghadab",
    icon: "🔥",
    definition: "انفعال قلبي يدفع إلى الإيذاء عند مخالفة الهوى أو الإحساس بالضرر.",
    signs: [
      "سرعة الانفعال لأسباب تافهة",
      "قول أو فعل ما يُندم عليه",
      "الثأر والانتقام",
      "إيذاء النفس أو الآخرين قولًا أو فعلًا",
    ],
    remedy: "الاستعاذة بالله من الشيطان الرجيم حين الغضب، والصمت أو الانصراف، وتغيير الوضع من قيام إلى قعود أو اضطجاع، وتذكّر ما أُعدّ للكاظمين الغيظ.",
    color: "#ea580c",
  },
  {
    id: "hiqd",
    name: "الحقد",
    arabic: "Hiqd",
    icon: "⚔️",
    definition: "إضمار العداوة والبغضاء في القلب وتربّص الفرصة للانتقام.",
    signs: [
      "استحضار أخطاء الآخرين وتضخيمها",
      "السرور بمصيبة من يحقد عليه",
      "قطيعة الرحم أو الهجر بدون مسوّغ شرعي",
      "الإصرار على الشحناء رغم الإصلاح",
    ],
    remedy: "مجاهدة النفس على العفو والصفح، والتفكّر في قِصَر الأجل وعظم الحساب، والتمسّك بحديث «لا يحلّ لمسلم أن يهجر أخاه فوق ثلاث».",
    color: "#9f1239",
  },
  {
    id: "dunya",
    name: "حب الدنيا وطول الأمل",
    arabic: "Hubb al-Dunyā",
    icon: "💰",
    definition: "جعل الدنيا أكبر همّ القلب وأعظم مطلبه، والاستغراق في التخطيط لها وإغفال الآخرة.",
    signs: [
      "الانشغال الدائم بتحصيل المال والجاه",
      "تأجيل التوبة والعبادة إلى وقت الفراغ",
      "تشابك الهموم وقلّة البركة في الوقت",
      "الحزن الشديد على فوات حظ دنيوي",
    ],
    remedy: "تذكّر الموت وزيارة القبور، والتفكّر في قِصَر أمد الدنيا وطول أمد الآخرة، والتزهّد بمخالطة الزاهدين والقانعين.",
    color: "#854d0e",
  },
  {
    id: "ghiba",
    name: "الغيبة والنميمة",
    arabic: "Ghība & Namīma",
    icon: "👂",
    definition: "الغيبة: ذكر أخيك بما يكره وإن كان فيه. والنميمة: نقل الكلام بين الناس للإفساد بينهم.",
    signs: [
      "ذكر عيوب الغائبين في المجالس",
      "الانجذاب لسماع أخبار الآخرين",
      "نقل ما يُقال في شخص إلى آخر",
      "التلذّذ بما يُؤذي ماء وجه الآخرين",
    ],
    remedy: "حفظ اللسان وملازمة الصمت أو الذكر، وتذكّر أن ما ينقله يُسجَّل عليه، والاستغفار لمن اغتابه والدعاء له سرًا.",
    color: "#0f766e",
  },
  {
    id: "bukhl",
    name: "الشحّ والبخل",
    arabic: "Bukhl & Shuhh",
    icon: "🔒",
    definition: "البخل: الإمساك عن الإنفاق الواجب أو المستحب. والشح: هو حرص النفس على ما في يد الغير.",
    signs: [
      "التحسّر على ما أُنفق في الحقوق الواجبة",
      "الإحجام عن الصدقة والهدية",
      "الضيق من إكرام الضيف",
      "تمنّي ما في يد الغير من مال أو نعمة",
    ],
    remedy: "تذكّر أن المال مستودَع لا ملك وأن الكريم يُخلَف وأن البخيل يُحرم، والتدرّج في الإنفاق حتى يألفه القلب.",
    color: "#1d4ed8",
  },
];

export default function AmradQalbiyyaPage() {
  return (
    <div className="page-shell" dir="rtl">
      <PageHeader
        eyebrow="التزكية والأخلاق"
        title="الأمراض القلبية"
        subtitle="أبرز أمراض القلب ومفسداته، وعلامات كل مرض وطريق علاجه."
      />

      {/* مقدمة */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-5">
          <p className="text-rose-900 dark:text-rose-200 text-sm leading-relaxed">
            القلب هو مدار الصلاح والفساد — «ألا وإن في الجسد مُضغة إذا صلحت صلح الجسد كله وإذا فسدت فسد الجسد كله ألا وهي القلب» — فكان علاج أمراضه فريضةً على كل مسلم. وفيما يلي أبرز هذه الأمراض مع علاماتها وطريق علاجها.
          </p>
        </div>
      </div>

      {/* بطاقات الأمراض */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="grid grid-cols-1 gap-5 pb-16">
          {DISEASES.map((d) => (
            <div
              key={d.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm"
            >
              {/* رأس البطاقة */}
              <div
                className="px-5 py-4 flex items-center gap-3"
                style={{ background: `${d.color}15` }}
              >
                <span className="text-3xl">{d.icon}</span>
                <div>
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-base">
                    {d.name}
                  </h3>
                  <span className="text-xs text-gray-400 font-light tracking-wide">{d.arabic}</span>
                </div>
                <div
                  className="mr-auto w-2 h-10 rounded-full flex-shrink-0"
                  style={{ background: d.color }}
                />
              </div>

              <div className="p-5 space-y-4">
                {/* التعريف */}
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {d.definition}
                </p>

                {/* العلامات */}
                <div>
                  <h4
                    className="text-xs font-bold uppercase tracking-wide mb-2"
                    style={{ color: d.color }}
                  >
                    ◆ علامات الإصابة
                  </h4>
                  <ul className="space-y-1">
                    {d.signs.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <span className="mt-0.5 flex-shrink-0" style={{ color: d.color }}>•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* العلاج */}
                <div
                  className="rounded-xl p-3"
                  style={{ background: `${d.color}10`, border: `1px solid ${d.color}30` }}
                >
                  <h4
                    className="text-xs font-bold mb-1"
                    style={{ color: d.color }}
                  >
                    💊 طريق العلاج
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {d.remedy}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
