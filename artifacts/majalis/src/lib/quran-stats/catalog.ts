/**
 * بطاقات «القرآن في أرقام» — مصادر معتمدة فقط.
 * لا تُستورد أرقام من مواقع الإعجاز العددي.
 */
import type {
  CountBasis,
  QuranComputedStats,
  QuranStat,
  QuranStatGroup,
} from "./types";
import { FORBIDDEN_STAT_SOURCES, FORBIDDEN_USER_FACING_TECH } from "./types";

const HUMAN_COMPUTED =
  "حساب آلي من نص المصحف العثماني المعتمد في التطبيق";
const ABD_BAQI = "المعجم المفهرس لألفاظ القرآن الكريم لمحمد فؤاد عبد الباقي";
const DANI = "البيان في عدّ آي القرآن لأبي عمرو الداني";
const SUYUTI = "الإتقان في علوم القرآن للسيوطي";
const MADINAH = "مصحف المدينة النبوية — مجمع الملك فهد لطباعة المصحف الشريف";
const NAZIMA = "ناظمة الزهر وشروحها";

function s(
  partial: Omit<QuranStat, "group"> & { group: QuranStatGroup; basis?: CountBasis },
): QuranStat {
  return partial;
}

function topicCount(computed: QuranComputedStats, key: string): number {
  return computed.wordFreq?.topicCounts?.[key] ?? 0;
}

export function buildQuranStatsCatalog(computed: QuranComputedStats): QuranStat[] {
  const m = computed.methodology.arabic;
  const t = computed.totals;
  const e = computed.extremes;
  const wf = computed.wordFreq;
  const methodComputed = m;

  const bunya: QuranStat[] = [
    s({
      id: "surahs",
      group: "bunya",
      label: "عدد السور",
      value: 114,
      kind: "agreed",
      source: MADINAH,
      detail: "إجماع الأمة على أن سور المصحف مئة وأربع عشرة سورة.",
    }),
    s({
      id: "ajza",
      group: "bunya",
      label: "عدد الأجزاء",
      value: 30,
      kind: "agreed",
      source: MADINAH,
      detail: "تقسيم مصحف المدينة إلى ثلاثين جزءًا متقاربة في المقدار للقراءة.",
    }),
    s({
      id: "ahzab",
      group: "bunya",
      label: "عدد الأحزاب",
      value: 60,
      kind: "agreed",
      source: "تقسيم مصحف المدينة: كل جزء حزبان = ستون حزبًا",
      detail: "كل جزء حزبان؛ فيكون مجموع الأحزاب ستين.",
    }),
    s({
      id: "arba",
      group: "bunya",
      label: "أرباع الأحزاب",
      value: 240,
      kind: "agreed",
      source: "تقسيم مصحف المدينة: كل حزب أربعة أرباع = ٢٤٠ ربعًا",
      detail: "كل حزب أربعة أرباع؛ فيبلغ مجموع الأرباع مئتين وأربعين.",
    }),
    s({
      id: "ayat-kufi",
      group: "bunya",
      label: "عدد الآيات — العدّ الكوفي",
      value: 6236,
      kind: "by-school",
      source: `${DANI}؛ ومصحف المدينة برواية حفص على العدّ الكوفي`,
      note:
        "٦٢٣٦ على العدّ الكوفي (عدّ مصحف المدينة برواية حفص). لمدارس العدّ الأخرى أعداد مختلفة؛ والخلاف في مواضع الفواصل لا في زيادة نصّ أو نقصه.",
      detail:
        "اعتنى العلماء بعدّ الآي ومدارسه (المدنيان والمكي والبصري والشامي والكوفي). مصحف المدينة المعتمد يعتمد العدّ الكوفي.",
    }),
    s({
      id: "words-disputed",
      group: "bunya",
      label: "عدد الكلمات — أشهر الأقوال",
      value: 77439,
      kind: "disputed",
      source: `${SUYUTI}؛ ${DANI} — مع اختلاف تعريف «الكلمة»`,
      note:
        "أشهر قول ≈٧٧٤٣٩. الحساب الآلي في التطبيق يعطي ٧٧٤٣٠؛ الفارق المحتمل من احتساب الحروف المقطّعة والبسملات وتعريف الكلمة.",
      detail:
        "لا يُعرض رقم واحد قاطعًا. يُعرض أشهر قول في البطاقة، والحساب الآلي ضمن الأقوال للمقارنة.",
      variants: [
        {
          value: "٧٧٤٣٩",
          attribution: "قول مشهور في عدّ كلمات الرسم",
          source: `${SUYUTI} — باب عدد كلمات القرآن وحروفه`,
        },
        {
          value: String(t.words),
          attribution: "حساب آلي من نص المصحف في التطبيق",
          source: HUMAN_COMPUTED,
        },
        {
          value: "≈٧٧٧٠١",
          attribution: "قول آخر في بعض روايات العدّ",
          source: `${SUYUTI} — سرد الأقوال`,
        },
      ],
    }),
    s({
      id: "letters-disputed",
      group: "bunya",
      label: "عدد الحروف — أشهر الأقوال",
      value: 321000,
      kind: "disputed",
      source: `${SUYUTI}؛ ${NAZIMA}`,
      note: `الخلاف منهجي. الحساب الآلي بعد تجريد التشكيل: ${t.letters}.`,
      detail: "يُعرض أشهر قول تقريبي في البطاقة، والحساب الآلي ضمن الأقوال للمقارنة المنهجية.",
      variants: [
        {
          value: "≈٣٢١٠٠٠",
          attribution: "أحد الأقوال المنقولة في الإتقان",
          source: `${SUYUTI} — باب عدد الحروف`,
        },
        {
          value: String(t.letters),
          attribution: "حساب آلي (حروف هجائية بعد التجريد)",
          source: HUMAN_COMPUTED,
        },
        {
          value: "≈٣٢٣٠١٥",
          attribution: "قول آخر منقول في كتب العدّ",
          source: `${SUYUTI} — سرد الأقوال`,
        },
      ],
    }),
    s({
      id: "pages-madinah",
      group: "bunya",
      label: "صفحات مصحف المدينة",
      value: 604,
      kind: "agreed",
      source: MADINAH,
      note: "إحصاء طباعي لمصحف المدينة، لا يُعرض في بطاقة «فتح المصحف» التسويقية.",
      detail: "ستمائة وأربع صفحات هو ترقيم مصحف المدينة الشائع برواية حفص.",
    }),
    s({
      id: "sajda",
      group: "bunya",
      label: "مواضع سجود التلاوة",
      value: 15,
      kind: "disputed",
      source: "كتب الفقه وعلوم القرآن؛ ومواضع السجدة في مصحف المدينة",
      note: "المشهور خمسة عشر موضعًا، ومنها خلاف في سجدة ص والثانية في الحج.",
      variants: [
        {
          value: "١٥",
          attribution: "المشهور عند جمهور أهل العلم",
          source: "مصحف المدينة — مواضع السجدة المعلَّمة",
        },
        {
          value: "١٤",
          attribution: "قول ينقص سجدة ص أو الثانية في الحج",
          source: "كتب الفقه في سجود التلاوة",
        },
      ],
      detail:
        "المشهور خمسة عشر موضعًا. الخلاف الأشهر في سجدة ص والثانية في الحج؛ التفاصيل في الشيت لا في خانة الرقم.",
      evidence: (computed.sajda ?? []).slice(0, 5).map((x) => ({
        surah: x.surah,
        ayah: x.ayah,
      })),
    }),
    s({
      id: "makki-count",
      group: "bunya",
      label: "السور المكية (حسب بيانات التطبيق)",
      value: t.meccanSurahs,
      kind: "computed",
      source: HUMAN_COMPUTED,
      technicalSource: "revelationType in surah JSON",
      method: methodComputed,
      note: "وفي بعض السور خلاف مشهور بين أهل العلم.",
      detail: "العدّ من تصنيف السور في بيانات المصحف المعتمدة في التطبيق، مع الإقرار بخلاف بعض المواضع.",
    }),
    s({
      id: "madani-count",
      group: "bunya",
      label: "السور المدنية (حسب بيانات التطبيق)",
      value: t.medinanSurahs,
      kind: "computed",
      source: HUMAN_COMPUTED,
      method: methodComputed,
      note: "وفي بعض السور خلاف مشهور بين أهل العلم.",
      detail: "العدّ من تصنيف السور في بيانات المصحف المعتمدة في التطبيق، مع الإقرار بخلاف بعض المواضع.",
    }),
    s({
      id: "nuzul-span",
      group: "bunya",
      label: "مدة نزول القرآن (تقريبًا)",
      value: 23,
      kind: "agreed",
      source: `${SUYUTI} — مباحث نزول القرآن`,
      note: "المشهور نحو ثلاث وعشرين سنة من البعثة إلى اكتمال النزول.",
      detail: "العدد تقريبي بحسب السيرة وكتب علوم القرآن، وليس عدًّا لآيات.",
    }),
    s({
      id: "computed-words",
      group: "bunya",
      label: "كلمات النص (حساب آلي)",
      value: t.words,
      kind: "computed",
      source: HUMAN_COMPUTED,
      method: methodComputed,
      note: `يُقارن بالقول المشهور ٧٧٤٣٩؛ الفارق منهجي لا طعن في النص.`,
      detail: "يُعرض بجانب القول المنقول الأشهر؛ الفارق من تعريف الكلمة والبسملات والحروف المقطّعة.",
    }),
    s({
      id: "computed-letters",
      group: "bunya",
      label: "الحروف بعد التجريد (حساب آلي)",
      value: t.letters,
      kind: "computed",
      source: HUMAN_COMPUTED,
      method: methodComputed,
      detail: "حروف هجائية بعد تجريد التشكيل وعلامات الوقف؛ يُقارن بالأقوال المنقولة في الإتقان.",
    }),
  ];

  const allah = wf?.allahCount ?? 0;
  const rahman = wf?.rahmanCount ?? 0;
  const topContent = wf?.contentTop?.[0];
  const longestW = wf?.longestWords?.[0];

  const alfaz: QuranStat[] = [
    s({
      id: "allah-lafz",
      group: "alfaz",
      label: "عدد ورود لفظ الجلالة (الله)",
      value: allah,
      kind: "computed",
      basis: "exact-form",
      source: HUMAN_COMPUTED,
      method: "عدّ الصيغ المحتوية على لفظ الجلالة بعد تجريد التشكيل في نص المصحف المعتمد.",
      note: `للمقارنة المنهجية يُرجع أيضًا إلى ${ABD_BAQI}.`,
      detail: "العدّ هنا حرفي آلي؛ المعجم المفهرس أدق في تمييز المواد المعجمية.",
    }),
    s({
      id: "rahman-lafz",
      group: "alfaz",
      label: "عدد ورود لفظ (الرحمن)",
      value: rahman,
      kind: "computed",
      basis: "exact-form",
      source: HUMAN_COMPUTED,
      method: "عدّ الصيغ المحتوية على مادة الرحمن بعد التجريد.",
      detail: `عدّ آلي للصيغ؛ للمواضع التفصيلية راجع ${ABD_BAQI}.`,
    }),
    s({
      id: "top-content-word",
      group: "alfaz",
      label: topContent
        ? `أكثر لفظ معجمي تكرارًا: (${topContent.form})`
        : "أكثر لفظ معجمي تكرارًا",
      value: topContent?.count ?? 0,
      kind: "computed",
      basis: "lemma",
      source: HUMAN_COMPUTED,
      method:
        "أعلى تكرار بعد استبعاد أدوات الربط الشائعة؛ ليست قائمة المعجم المفهرس كاملة.",
      note: `المرجع الأصل للمواضع: ${ABD_BAQI}.`,
      detail: "أعلى لفظ معجمي في الحساب الآلي بعد استبعاد الأدوات؛ للتوثيق التفصيلي راجع المعجم المفهرس.",
    }),
    s({
      id: "longest-word",
      group: "alfaz",
      label: longestW
        ? `أطول كلمة بالرسم (حروف): (${longestW.form})`
        : "أطول كلمة بالرسم",
      value: longestW?.letters ?? 0,
      kind: "computed",
      basis: "exact-form",
      source: HUMAN_COMPUTED,
      method: "عدّ الحروف الهجائية بعد التجريد بلا تشكيل ولا علامات وقف.",
      detail: "نتيجة محسوبة من نص المصحف؛ أشهر الأمثلة المنقولة مثل «فأسقيناكموه» تُقارن بهذا الحساب.",
      evidence: longestW
        ? [{ surah: longestW.surah, ayah: longestW.ayah, excerpt: longestW.form }]
        : undefined,
    }),
    s({
      id: "longest-surah-ayahs",
      group: "alfaz",
      label: `أطول سورة بعدد الآيات (${e.longestSurah.name.replace(/^سُورَةُ\s*/u, "")})`,
      value: e.longestSurah.ayahs,
      kind: "computed",
      basis: "exact-form",
      source: HUMAN_COMPUTED,
      method: methodComputed,
      detail: "أطول سورة بعدد الآيات على العدّ في بيانات المصحف (البقرة).",
    }),
    s({
      id: "shortest-surah-ayahs",
      group: "alfaz",
      label: `أقصر سورة بعدد الآيات (${e.shortestSurah.name.replace(/^سُورَةُ\s*/u, "")})`,
      value: e.shortestSurah.ayahs,
      kind: "computed",
      basis: "exact-form",
      source: HUMAN_COMPUTED,
      method: methodComputed,
      detail: "أقصر سورة بعدد الآيات على العدّ في بيانات المصحف (الكوثر).",
    }),
    s({
      id: "longest-ayah",
      group: "alfaz",
      label: "أطول آية (حروف مجرّدة) — آية الدَّين",
      value: e.longestAyah.len,
      kind: "computed",
      basis: "exact-form",
      source: HUMAN_COMPUTED,
      method: methodComputed,
      evidence: [{ surah: e.longestAyah.surah, ayah: e.longestAyah.ayah }],
      note: "الموضع الأشهر: البقرة ٢٨٢.",
      detail: "الطول بعدد الحروف بعد التجريد؛ الموضع آية الدَّين.",
    }),
    s({
      id: "shortest-ayah",
      group: "alfaz",
      label: "أقصر آية (حروف مجرّدة)",
      value: e.shortestAyah.len,
      kind: "computed",
      basis: "exact-form",
      source: HUMAN_COMPUTED,
      method: methodComputed,
      evidence: [{ surah: e.shortestAyah.surah, ayah: e.shortestAyah.ayah }],
      detail: "أقصر آية بعدد الحروف بعد التجريد وفق بيانات المصحف في التطبيق.",
    }),
    s({
      id: "asma-husna-note",
      group: "alfaz",
      label: "أسماء الله الحسنى في القرآن",
      value: 99,
      kind: "by-school",
      basis: "lemma",
      source: `${SUYUTI} وما تبعه من مباحث الأسماء؛ والحديث المشهور في عدّ تسعة وتسعين`,
      method: "العدد المشهور في السنّة للأسماء الحسنى، لا عدًّا آليًا لورود كل اسم في المصحف.",
      note:
        "٩٩ هو العدد المشهور للأسماء الحسنى في السنّة. ورود لفظ الجلالة والرحمن محسوبان أعلاه.",
      detail: "لا تُخلط قائمة الأسماء الحسنى بعدّاد تكرار لفظي بلا منهجية.",
    }),
    // بطاقات من أعلى المحتوى
    ...((wf?.contentTop ?? []).slice(0, 12).map((row, i) =>
      s({
        id: `alfaz-top-${i + 1}`,
        group: "alfaz",
        label: `عدد ورود لفظ (${row.form}) — معجمي`,
        value: row.count,
        kind: "computed",
        basis: "lemma",
        source: HUMAN_COMPUTED,
        method: "تكرار حرفي بعد التجريد مع استبعاد أدوات الربط الشائعة.",
        note: `للمواضع التفصيلية راجع ${ABD_BAQI}.`,
        detail: "بطاقة من قائمة أعلى التكرار المعجمي المحسوب آليًا؛ ليست بديلاً عن المعجم المفهرس.",
      }),
    )),
  ];

  const lexicalTopics: Array<{ id: string; form: string; label: string }> = [
    { id: "jannah", form: "الجنة", label: "عدد ورود لفظ (الجنة)" },
    { id: "nar", form: "النار", label: "عدد ورود لفظ (النار)" },
    { id: "malaika", form: "الملائكة", label: "عدد ورود لفظ (الملائكة)" },
    { id: "shaitan", form: "الشيطان", label: "عدد ورود لفظ (الشيطان)" },
    { id: "akhira", form: "الآخرة", label: "عدد ورود لفظ (الآخرة)" },
    { id: "dunya", form: "الدنيا", label: "عدد ورود لفظ (الدنيا)" },
    { id: "salah", form: "الصلاة", label: "عدد ورود لفظ (الصلاة)" },
    { id: "zakah", form: "الزكاة", label: "عدد ورود لفظ (الزكاة)" },
    { id: "sabr", form: "الصبر", label: "عدد ورود لفظ (الصبر)" },
    { id: "taqwa", form: "التقوى", label: "عدد ورود لفظ (التقوى)" },
    { id: "ilm", form: "العلم", label: "عدد ورود لفظ (العلم)" },
    { id: "rusul", form: "الرسل", label: "عدد ورود لفظ (الرسل)" },
    { id: "nabi", form: "النبي", label: "عدد ورود لفظ (النبي)" },
  ];

  const mawdoo: QuranStat[] = [
    ...lexicalTopics.map((tpc) =>
      s({
        id: `lafz-${tpc.id}`,
        group: "mawdoo",
        label: tpc.label,
        value: topicCount(computed, tpc.form) || topicCount(computed, tpc.form.replace(/^ال/, "")),
        kind: "computed",
        basis: "exact-form",
        source: HUMAN_COMPUTED,
        method: `عدّ الصيغ الحرفية المحتوية على «${tpc.form}» بعد التجريد — ليس عدًّا موضوعيًا.`,
        note: "الموضوع قد يُذكر بألفاظ أخرى؛ هذا عدّ لفظي فقط.",
        detail: `للتوسعة المعجمية والمواضع: ${ABD_BAQI}؛ ومعجم ألفاظ القرآن لمجمع اللغة العربية بالقاهرة.`,
      }),
    ),
    s({
      id: "jannah-names",
      group: "mawdoo",
      label: "الجنة وأسماؤها في القرآن (موضوع)",
      value: topicCount(computed, "الجنة") + topicCount(computed, "جنة"),
      kind: "computed",
      basis: "lemma",
      source: HUMAN_COMPUTED,
      method: "جمع تقريبي لصيغ الجنة/جنّة؛ لا يشمل الفردوس وجنات عدن إلا إن وردت في العدّ الفرعي لاحقًا.",
      note: "ليست حصرًا لكل أسماء الجنة؛ العدّ اللفظي ≠ العدّ الموضوعي.",
      detail: "أسماء أخرى (الفردوس، دار السلام، المأوى…) تستحق بطاقات مستقلة عند توثيقها من المعجم المفهرس.",
    }),
    s({
      id: "topic-adhab-qabr",
      group: "mawdoo",
      label: "عذاب القبر — موضوع لا لفظ",
      value: 3,
      kind: "agreed",
      basis: "topic",
      source: "تقرير أهل السنة في عذاب القبر؛ والآيات التي استُدلّ بها (منها غافر ٤٦، التوبة ١٠١، نوح ٢٥)",
      method: "موضوع لا لفظ — العدّ هنا لعدد الآيات المستدلّ بها في البطاقة، لا لتكرار عبارة «عذاب القبر».",
      note: "«عذاب القبر» ليس لفظًا قرآنيًا صريحًا؛ لا يجوز عرضه كعدّاد لفظي.",
      detail:
        "أهل السنة يثبتون عذاب القبر ونعيمه بالأدلة؛ والآيات المذكورة شواهد استدلال لا حصرًا. راجع كتب العقيدة المعتمدة.",
      evidence: [
        { surah: 40, ayah: 46, excerpt: "النار يعرضون عليها…" },
        { surah: 9, ayah: 101 },
        { surah: 71, ayah: 25 },
      ],
    }),
    s({
      id: "topic-barzakh",
      group: "mawdoo",
      label: "البرزخ — موضوع لا لفظ صريح متكرر",
      value: 1,
      kind: "agreed",
      basis: "topic",
      source: `${SUYUTI} ومباحث البرزخ؛ وآية المؤمنين ١٠٠`,
      method: "موضوع — يُعرض موضع الاستدلال لا عدّاد عبارة.",
      evidence: [{ surah: 23, ayah: 100 }],
      note: "لفظ «برزخ» ورد في مواضع محدودة؛ المعنى الأخروي موضوعي.",
      detail: "البطاقة موضوعية: عدد الشواهد المعروضة للاستدلال لا تكرار عبارة.",
    }),
    s({
      id: "topic-mizan",
      group: "mawdoo",
      label: "الميزان يوم القيامة — موضوع",
      value: 1,
      kind: "agreed",
      basis: "topic",
      source: "آيات الميزان في القرآن؛ وكتب التفسير المعتمدة",
      method: "موضوع — شواهد استدلال.",
      evidence: [{ surah: 21, ayah: 47 }],
      note: "لا يُخلط بعدّاد لفظي بلا أساس.",
      detail: "البطاقة موضوعية: شاهد استدلال على الميزان يوم القيامة.",
    }),
  ];

  const suwar: QuranStat[] = [
    s({
      id: "suwar-table-ayahs",
      group: "suwar",
      label: "مجموع آيات السور (العدّ في البيانات)",
      value: t.ayahs,
      kind: "computed",
      source: HUMAN_COMPUTED,
      method: methodComputed,
      note: "جدول السور التفاعلي يعرض تفصيل كل سورة.",
      detail: "يطابق العدّ الكوفي ٦٢٣٦ في بيانات مصحف المدينة المعتمدة هنا.",
    }),
    s({
      id: "suwar-meccan-share",
      group: "suwar",
      label: "نسبة السور المكية من ١١٤",
      value: t.meccanSurahs,
      kind: "computed",
      source: HUMAN_COMPUTED,
      method: methodComputed,
      detail: "عدد السور المصنّفة مكية في بيانات التطبيق من أصل ١١٤.",
    }),
    s({
      id: "suwar-medinan-share",
      group: "suwar",
      label: "نسبة السور المدنية من ١١٤",
      value: t.medinanSurahs,
      kind: "computed",
      source: HUMAN_COMPUTED,
      method: methodComputed,
      detail: "عدد السور المصنّفة مدنية في بيانات التطبيق من أصل ١١٤.",
    }),
    s({
      id: "baqara-ayahs",
      group: "suwar",
      label: "عدد آيات سورة البقرة",
      value: 286,
      kind: "agreed",
      source: MADINAH,
      detail: "أطول سور المصحف بعدد الآيات على العدّ الكوفي.",
    }),
    s({
      id: "kawthar-ayahs",
      group: "suwar",
      label: "عدد آيات سورة الكوثر",
      value: 3,
      kind: "agreed",
      source: MADINAH,
      detail: "أقصر سور المصحف بعدد الآيات على العدّ الكوفي.",
    }),
    s({
      id: "ikhlas-ayahs",
      group: "suwar",
      label: "عدد آيات سورة الإخلاص",
      value: 4,
      kind: "agreed",
      source: MADINAH,
      detail: "سورة الإخلاص أربع آيات على العدّ الكوفي في مصحف المدينة.",
    }),
    s({
      id: "fatiha-ayahs",
      group: "suwar",
      label: "عدد آيات سورة الفاتحة",
      value: 7,
      kind: "agreed",
      source: MADINAH,
      note: "على العدّ الكوفي المعتمد في مصحف المدينة.",
      detail: "سبع آيات على العدّ الكوفي؛ البسملة آية في هذا العدّ.",
    }),
    s({
      id: "yasin-ayahs",
      group: "suwar",
      label: "عدد آيات سورة يس",
      value: 83,
      kind: "agreed",
      source: MADINAH,
      detail: "ثلاث وثمانون آية على العدّ الكوفي في مصحف المدينة.",
    }),
  ];

  const ajaib: QuranStat[] = [
    s({
      id: "classification",
      group: "ajaib",
      label: "أقسام السور: الطوال والمئون والمثاني والمفصّل",
      value: 4,
      kind: "agreed",
      source: `${SUYUTI} في تقسيم السور`,
      note: "تقسيم اصطلاحي مروي، مع اختلاف يسير في حدود المفصّل.",
      detail: "ليست أرقام إعجاز؛ اصطلاح علوم القرآن.",
    }),
    s({
      id: "huruf-muqatta",
      group: "ajaib",
      label: "السور المفتتحة بالحروف المقطّعة",
      value: 29,
      kind: "agreed",
      source: `${SUYUTI}؛ وكتب علوم القرآن في فواتح السور`,
      note: "تسع وعشرون سورة على المشهور.",
      detail: "الحروف المقطّعة في أوائل السور مبحث مستقل؛ لا يُحمَّل إعجازًا عدديًا.",
    }),
    s({
      id: "prophet-named-surahs",
      group: "ajaib",
      label: "سور بأسماء أنبياء",
      value: 6,
      kind: "agreed",
      source: "فهرس سور المصحف؛ ومباحث أسماء السور",
      note: "مثل يونس · هود · يوسف · إبراهيم · محمد · نوح (على العدّ الشائع للأسماء الصريحة).",
      detail: "العدّ اصطلاحي بحسب الاسم الظاهر للسورة.",
    }),
    s({
      id: "sajda-surahs",
      group: "ajaib",
      label: "عدد مواضع السجدة المعلَّمة في البيانات",
      value: t.sajdaMarksInData,
      kind: "computed",
      source: HUMAN_COMPUTED,
      method: methodComputed,
      note: "يقارب المشهور ١٥ مع خلاف فقهي في بعضها.",
      detail: "عدّ مواضع السجدة المعلَّمة في نص المصحف المعتمد؛ يُقارن بالخلاف الفقهي.",
    }),
    s({
      id: "basmala-twice",
      group: "ajaib",
      label: "سورة تُقرأ فيها البسملة في غير الفاتحة ضمن النص",
      value: 1,
      kind: "agreed",
      source: `${SUYUTI}؛ والنمل ٣٠`,
      note: "سورة النمل فيها بسملة في أثناء السورة (آية ٣٠) إضافة إلى بسملة الافتتاح.",
      evidence: [{ surah: 27, ayah: 30 }],
      detail: "النمل تجمع بسملة الافتتاح وبسملة داخل السورة في آية ٣٠.",
    }),
    s({
      id: "seven-tiwal",
      group: "ajaib",
      label: "السبع الطوال (اصطلاح)",
      value: 7,
      kind: "agreed",
      source: `${SUYUTI} — تقسيم السور`,
      note: "اصطلاح روائي في علوم القرآن.",
      detail: "اصطلاح الطوال/المئون/المثاني/المفصّل مبحث علوم قرآن لا إعجاز عددي.",
    }),
    s({
      id: "basmala-count",
      group: "ajaib",
      label: "بسملات الافتتاح المكتشفة في البيانات",
      value: t.basmalaOccurrencesDetected ?? 113,
      kind: "computed",
      source: HUMAN_COMPUTED,
      method: methodComputed,
      note: "التوبة بلا بسملة افتتاح؛ الفاتحة بسملتها آية على العدّ الكوفي.",
      detail: "كشف آلي لبسملات الافتتاح في البيانات؛ التوبة مستثناة اتفاقًا.",
    }),
  ];

  return [...bunya, ...alfaz, ...mawdoo, ...suwar, ...ajaib];
}

/** هل قيمة البطاقة رقمية مسموحة؟ */
export function isNumericCardValue(value: number | string): boolean {
  if (typeof value === "number" && Number.isFinite(value)) return true;
  const s = String(value).trim();
  // نطاق أو رقم عربي/لاتيني قصير فقط
  return /^[\d٠-٩.,≈~\s·×x/-]+$/u.test(s) && /\d|[٠-٩]/u.test(s);
}

export function assertQuranStatsCatalog(stats: QuranStat[]): void {
  if (stats.length < 60) {
    throw new Error(`عدد الإحصاءات ${stats.length} < 60`);
  }
  const groups = new Set(stats.map((x) => x.group));
  for (const g of ["bunya", "alfaz", "mawdoo", "suwar", "ajaib"] as const) {
    if (!groups.has(g)) throw new Error(`مجموعة ناقصة: ${g}`);
  }

  for (const s of stats) {
    if (!s.source?.trim()) throw new Error(`QuranStat بلا مصدر: ${s.id}`);
    if (!s.label?.trim()) throw new Error(`بلا تسمية: ${s.id}`);
    if (!s.detail?.trim() && !s.note?.trim()) {
      throw new Error(`بطاقة بلا وصف (detail/note): ${s.id}`);
    }
    if (!isNumericCardValue(s.value)) {
      throw new Error(`قيمة غير رقمية في البطاقة: ${s.id} = ${String(s.value)}`);
    }
    if (s.kind === "disputed" && (s.variants?.length ?? 0) < 2) {
      throw new Error(`disputed بلا variants كافية: ${s.id}`);
    }
    if (s.basis === "topic" && (s.evidence?.length ?? 0) < 1) {
      throw new Error(`topic بلا evidence: ${s.id}`);
    }
    if ((s.group === "alfaz" || s.group === "mawdoo") && s.basis && !s.method?.trim()) {
      throw new Error(`ألفاظ/موضوعات بلا method: ${s.id}`);
    }
    if ((s.group === "alfaz" || s.group === "mawdoo") && !s.basis) {
      throw new Error(`ألفاظ/موضوعات بلا basis: ${s.id}`);
    }
    if (s.id === "ayat-kufi" && !/كوف/u.test(String(s.label) + (s.note ?? ""))) {
      throw new Error("٦٢٣٦ يجب أن تُوسم بالعدّ الكوفي");
    }

    const userFacing = [s.source, s.note, s.detail, s.label, s.method, ...(s.variants ?? []).flatMap((v) => [v.source, v.attribution])]
      .filter(Boolean)
      .join("\n");
    for (const tech of FORBIDDEN_USER_FACING_TECH) {
      if (userFacing.includes(tech)) {
        throw new Error(`مصطلح تقني في نص المستخدم (${s.id}): ${tech}`);
      }
    }
    const blob = userFacing.toLowerCase();
    for (const bad of FORBIDDEN_STAT_SOURCES) {
      if (blob.includes(bad.toLowerCase())) {
        throw new Error(`مصدر ممنوع في ${s.id}: ${bad}`);
      }
    }
  }
}
