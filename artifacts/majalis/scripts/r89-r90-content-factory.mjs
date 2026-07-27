const domains = [
  {
    section: "العقيدة",
    qaKey: "aqeedah",
    references: ["النحل: 36؛ تفسير الطبري", "البينة: 5؛ جامع العلوم", "الحديد: 22؛ مدارج السالكين", "الأعراف: 180؛ تفسير ابن كثير", "المائدة: 8؛ العقيدة الطحاوية"],
  },
  {
    section: "الفقه",
    qaKey: "fiqh",
    references: ["المائدة: 6؛ كتب الطهارة", "صحيح البخاري؛ صحيح مسلم", "النساء: 29؛ إعلام الموقعين", "التوبة: 60؛ كتب الزكاة", "الأشباه والنظائر؛ القواعد الفقهية"],
  },
  {
    section: "القرآن",
    qaKey: "quran",
    references: ["ص: 29؛ تفسير السعدي", "آل عمران: 7؛ البرهان", "الإتقان؛ أصول الفقه", "البرهان؛ تفسير الطبري", "مقدمة التفسير؛ الإسراء: 36"],
  },
  {
    section: "السنة",
    qaKey: "sunnah",
    references: ["نخبة الفكر؛ مقدمة ابن الصلاح", "نزهة النظر؛ تدريب الراوي", "مقدمة مسلم؛ تدريب الراوي", "فتح الباري؛ شرح النووي", "جامع بيان العلم؛ الرسالة"],
  },
  {
    section: "السيرة",
    qaKey: "seerah",
    references: ["سيرة ابن هشام؛ الرحيق المختوم", "التوبة: 40؛ صحيح البخاري", "صحيح البخاري؛ سيرة ابن هشام", "آل عمران: 152؛ تفسير ابن كثير", "الفتح: 1؛ زاد المعاد"],
  },
  {
    section: "الأخلاق",
    qaKey: "akhlaq",
    references: ["متفق عليه؛ رياض الصالحين", "النساء: 58؛ جامع العلوم", "صحيح البخاري؛ سنن أبي داود", "صحيح مسلم؛ رياض الصالحين", "الشورى: 40؛ تفسير القرطبي"],
  },
  {
    section: "التزكية",
    qaKey: "tazkiyah",
    references: ["الحشر: 18؛ مدارج السالكين", "الكهف: 110؛ جامع العلوم", "البقرة: 153؛ عدة الصابرين", "إبراهيم: 7؛ مدارج السالكين", "الحجر: 49-50؛ الوابل الصيب"],
  },
  {
    section: "التاريخ",
    qaKey: "history",
    references: ["العواصم من القواصم؛ منهاج السنة", "مقدمة مسلم؛ الكفاية للخطيب", "تاريخ بغداد؛ سير أعلام النبلاء", "نفح الطيب؛ البداية والنهاية", "جامع بيان العلم؛ سير أعلام النبلاء"],
  },
  {
    section: "اللغة",
    qaKey: "language",
    references: ["الرسالة؛ الخصائص", "أصول الفقه؛ الإحكام", "روضة الناظر؛ البحر المحيط", "مقدمة التفسير؛ أصول الفقه", "دلائل الإعجاز؛ البرهان"],
  },
  {
    section: "المقاصد",
    qaKey: "maqasid",
    references: ["المائدة: 32؛ الموافقات", "النساء: 29؛ الموافقات", "الموافقات؛ إعلام الموقعين", "الأشباه والنظائر؛ القواعد الفقهية", "البقرة: 185؛ الموافقات"],
  },
];

const qaCategories = {
  aqeedah: ["seed-cat-aqeedah", "العقيدة", "aqeedah"],
  fiqh: ["seed-cat-fiqh", "الفقه", "fiqh"],
  quran: ["seed-cat-quran", "القرآن", "quran"],
  sunnah: ["seed-cat-hadith", "السنة", "hadith"],
  seerah: ["seed-cat-seerah", "السيرة", "seerah"],
  akhlaq: ["seed-cat-akhlaq", "الأخلاق", "akhlaq"],
  tazkiyah: ["seed-cat-tazkiyah", "التزكية", "tazkiyah"],
  history: ["seed-cat-history", "التاريخ", "history"],
  language: ["seed-cat-language", "اللغة", "language"],
  maqasid: ["seed-cat-maqasid", "المقاصد", "maqasid"],
};

const topicSets = {
  89: [
    ["تعظيم القرآن", "توقير كلام الله بتلاوته وتدبره والعمل به وتلقي معانيه من أهل العلم"],
    ["حفظ اللسان", "صيانة الكلام عن الكذب والغيبة والبهتان والقول على الله بغير علم"],
    ["أداء الأمانة", "رد الحقوق وحفظ العهود والقيام بما استؤمن عليه العبد في السر والعلن"],
    ["بر الوالدين", "الإحسان إليهما قولا وفعلا في غير معصية مع الصبر على خدمتهما"],
    ["صحبة الصالحين", "اختيار من يعين على الطاعة والعلم ويذكر بالله عند الغفلة"],
  ],
  90: [
    ["مراقبة الله", "استحضار اطلاع الله على السر والعلن بما يثمر صدق العمل وترك الخيانة"],
    ["فقه الاختلاف", "رد التنازع إلى العلم والعدل وحفظ الأخوة بلا تعصب ولا تتبع للهوى"],
    ["شكر النعمة", "الاعتراف بفضل الله واستعمال النعم في الطاعة وكفها عن المعصية"],
    ["الرحمة بالخلق", "لين القلب وبذل النفع وكف الأذى مع إقامة الحق بغير ظلم"],
    ["الثبات على السنة", "لزوم الهدي النبوي بلا غلو ولا جفاء وتقديم الدليل على العادة"],
  ],
};

const levels = ["سهل", "متوسط", "صعب", "متوسط", "سهل"];

function roundTopics(round) {
  const base = topicSets[round];
  if (!base) throw new Error(`No topics for round ${round}`);
  return domains.flatMap((domain, domainIndex) =>
    base.map(([title, meaning], topicIndex) => ({
      ...domain,
      category: `${title} في ${domain.section}`,
      level: levels[topicIndex],
      title,
      meaning,
      reference: domain.references[(domainIndex + topicIndex) % domain.references.length],
    })),
  );
}

export function makeQuizItems({ round, start }) {
  const suffix =
    " وهذا الجواب موجز مضبوط بأصله، ولا يغني عن تفصيل العلماء عند اختلاف الصور والوقائع.";
  const explanation =
    "ربط الجواب بالمصدر يحفظ هيبة الدليل، ويمنع تحويل المعاني العامة إلى إطلاقات بلا فقه أو تنزيل بغير علم.";
  return roundTopics(round).map((topic, index) => ({
    id: String(start + index),
    section: topic.section,
    category: topic.category,
    level: topic.level,
    question: `ما خلاصة مسألة ${topic.title} في باب ${topic.section}؟`,
    answer: `${topic.meaning}، مع مراعاة حدود الدليل ومقاصد الباب.${suffix}`,
    explanation,
    reference: topic.reference,
  }));
}

export function makeQaItems({ round, start }) {
  const suffix =
    " ولا تنزل العبارة على الأعيان والنوازل إلا بعد معرفة الحال وسؤال أهل العلم، فهي للتعليم العام لا للفتوى الخاصة.";
  return roundTopics(round)
    .slice(0, 40)
    .map((topic, index) => {
      const [category_id, cat_name, cat_slug] = qaCategories[topic.qaKey];
      return {
        id: String(start + index),
        question: `هل يراعى أصل ${topic.title} عند الكلام في ${topic.section}؟`,
        answer: `نعم، يراعى هذا الأصل لأنه يضبط الفهم والعمل في بابه: ${topic.meaning}.${suffix}`,
        category_id,
        ruling_type: index % 3 === 0 ? "واجب بحسب بابه" : index % 3 === 1 ? "مشروع بضوابطه" : "تفصيل معتبر",
        reference: topic.reference,
        cat_name,
        cat_slug,
      };
    });
}

export function makeFawaidItems({ round }) {
  const suffix =
    " وهذه فائدة تذكيرية موجزة، تفهم في ضوء النصوص وكلام أهل العلم، ولا تحول إلى حكم مطلق على كل واقعة.";
  return roundTopics(round)
    .slice(0, 25)
    .map((topic, index) => ({
      text: `${topic.title} يربي طالب العلم على ضبط باب ${topic.section}: ${topic.meaning}، ومن فقهه أن يجمع بين تعظيم الدليل ومعرفة موضعه دون إفراط أو تفريط.${suffix}`,
      category: index % 2 === 0 ? topic.section : "طلب العلم",
      source: topic.reference,
      author_name: index % 2 === 0 ? "أهل العلم" : "محررو مجالس العلم",
    }));
}
