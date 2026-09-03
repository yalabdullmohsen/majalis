const domains = [
  {
    section: "العقيدة",
    qaKey: "aqeedah",
    references: ["البينة: 5؛ تفسير ابن كثير", "الشورى: 11؛ شرح العقيدة الطحاوية", "الحجرات: 6؛ تفسير الطبري", "النساء: 58؛ تفسير السعدي", "الرعد: 28؛ الوابل الصيب"],
  },
  {
    section: "الفقه",
    qaKey: "fiqh",
    references: ["الأعمال بالنيات؛ صحيح البخاري", "رفع الحرج؛ الموافقات", "قواعد الأحكام؛ العز بن عبد السلام", "إعلام الموقعين؛ ابن القيم", "المجموع؛ النووي"],
  },
  {
    section: "القرآن",
    qaKey: "quran",
    references: ["الإسراء: 9؛ تفسير الطبري", "ص: 29؛ تفسير السعدي", "النساء: 82؛ تفسير ابن كثير", "الفرقان: 30؛ تفسير القرطبي", "مقدمة التفسير؛ ابن تيمية"],
  },
  {
    section: "السنة",
    qaKey: "sunnah",
    references: ["صحيح البخاري؛ كتاب العلم", "صحيح مسلم؛ المقدمة", "فتح الباري؛ ابن حجر", "شرح النووي على مسلم", "جامع العلوم والحكم؛ ابن رجب"],
  },
  {
    section: "السيرة",
    qaKey: "seerah",
    references: ["سيرة ابن هشام", "زاد المعاد؛ ابن القيم", "صحيح البخاري؛ كتاب المغازي", "دلائل النبوة؛ البيهقي", "البداية والنهاية؛ ابن كثير"],
  },
  {
    section: "الأخلاق",
    qaKey: "akhlaq",
    references: ["الحجرات: 11؛ تفسير القرطبي", "صحيح مسلم؛ كتاب البر والصلة", "الأدب المفرد؛ البخاري", "رياض الصالحين؛ النووي", "جامع العلوم والحكم؛ ابن رجب"],
  },
  {
    section: "التزكية",
    qaKey: "tazkiyah",
    references: ["الحشر: 18؛ مدارج السالكين", "الكهف: 110؛ جامع العلوم والحكم", "إبراهيم: 7؛ تفسير ابن كثير", "الرعد: 28؛ الوابل الصيب", "عدة الصابرين؛ ابن القيم"],
  },
  {
    section: "التاريخ",
    qaKey: "history",
    references: ["تاريخ الطبري", "البداية والنهاية؛ ابن كثير", "سير أعلام النبلاء؛ الذهبي", "جامع بيان العلم؛ ابن عبد البر", "العواصم من القواصم؛ ابن العربي"],
  },
  {
    section: "اللغة",
    qaKey: "language",
    references: ["الرسالة؛ الشافعي", "الخصائص؛ ابن جني", "دلائل الإعجاز؛ الجرجاني", "المزهر؛ السيوطي", "البحر المحيط؛ الزركشي"],
  },
  {
    section: "المقاصد",
    qaKey: "maqasid",
    references: ["الموافقات؛ الشاطبي", "قواعد الأحكام؛ العز بن عبد السلام", "إعلام الموقعين؛ ابن القيم", "البقرة: 185؛ تفسير السعدي", "الأشباه والنظائر؛ السيوطي"],
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
  95: [
    ["تعظيم النص", "تقديم الوحي على الهوى والعادة، وفهمه بفهم أهل العلم مع توقير دلالته وحدوده"],
    ["فقه الأولويات", "ترتيب الأعمال والمصالح بحسب قدرها الشرعي، فلا يقدم المفضول على الفاضل ولا الجزئي على الكلي"],
    ["حفظ الجماعة", "رعاية وحدة المسلمين على الحق، وترك أسباب الفرقة مع بقاء النصح والبيان بالعدل"],
    ["الإنصاف في الخلاف", "طلب الحق مع معرفة مراتب المسائل، وحفظ قدر المخالف بلا تتبع للزلات أو ظلم"],
    ["إصلاح القلب", "تعاهد النية والخشية والتوبة حتى يصح ظاهر العمل بسلامة الباطن"],
  ],
  96: [
    ["لزوم الصدق", "مطابقة القول والعمل للحق، وترك التزين بالكذب أو المبالغة ولو جلبت منفعة عاجلة"],
    ["أمانة العلم", "نقل العلم بدليله ونسبته إلى أهله، وترك القول بغير بينة أو تصدر ما لا يحسن"],
    ["رحمة الخلق", "إرادة الخير للناس ودفع الأذى عنهم، مع إقامة العدل وترك المداهنة في الحق"],
    ["الورع عن الشبهات", "ترك ما يريب العبد إذا خشي على دينه، من غير تحريم لما لم يحرمه الله"],
    ["حسن التوكل", "اعتماد القلب على الله مع فعل الأسباب المشروعة وترك العجز والتعلق بالمخلوقين"],
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
    " وهذا جواب تعليمي يضبط الأصل بإجمال، ولا يغني عن سؤال أهل العلم في النوازل وتغير الأعراف والأحوال.";
  const explanation =
    "ربط المعنى بدليله ومصدره يمنع التوسع غير المنضبط، ويعين المتعلم على تنزيل القاعدة في موضعها بلا تهويل ولا تساهل.";
  return roundTopics(round).map((topic, index) => ({
    id: String(start + index),
    section: topic.section,
    category: topic.category,
    level: topic.level,
    question: `ما معنى أصل ${topic.title} عند دراسة باب ${topic.section}؟`,
    answer: `${topic.meaning}، مع مراعاة الدليل والقدرة والمصلحة الشرعية عند التطبيق.${suffix}`,
    explanation,
    reference: topic.reference,
  }));
}

export function makeQaItems({ round, start }) {
  const suffix =
    " وهذا البيان للتعليم العام لا للفتوى الخاصة، لأن تنزيل الأحكام على الأشخاص والوقائع يحتاج معرفة التفصيل وسؤال أهل العلم الموثوقين.";
  return roundTopics(round)
    .slice(0, 40)
    .map((topic, index) => {
      const [category_id, cat_name, cat_slug] = qaCategories[topic.qaKey];
      return {
        id: String(start + index),
        question: `كيف يستفاد من أصل ${topic.title} في مسائل ${topic.section}؟`,
        answer: `يستفاد منه برد المسألة إلى معناها الشرعي: ${topic.meaning}. فيراعى الدليل والقدرة والمآل ولا يطلق الحكم على كل صورة بلا تحرير.${suffix}`,
        category_id,
        ruling_type: index % 3 === 0 ? "أصل معتبر" : index % 3 === 1 ? "مشروع بضوابطه" : "تفصيل بحسب الحال",
        reference: topic.reference,
        cat_name,
        cat_slug,
      };
    });
}

export function makeFawaidItems({ round }) {
  const suffix =
    " وهي فائدة تذكيرية موثقة، تفهم مع النصوص وكلام أهل العلم، ولا تجعل حكما عاما على كل واقعة دون نظر في شروطها وموانعها.";
  return roundTopics(round)
    .slice(0, 25)
    .map((topic, index) => ({
      text: `${topic.title} يعين على ضبط باب ${topic.section}: ${topic.meaning}، ومن فقهه الجمع بين تعظيم النص، ومعرفة حال المخاطب، ومراعاة المآلات بلا غلو ولا تضييع.${suffix}`,
      category: index % 2 === 0 ? topic.section : "طلب العلم",
      source: topic.reference,
      author_name: index % 2 === 0 ? "أهل العلم" : "محررو سُنّة",
    }));
}
