const domains = [
  {
    section: "العقيدة",
    qaKey: "aqeedah",
    references: ["البينة: 5؛ جامع العلوم والحكم", "هود: 112؛ تفسير ابن كثير", "النساء: 58؛ تفسير الطبري", "النحل: 125؛ تفسير السعدي", "النساء: 142؛ مدارج السالكين"],
  },
  {
    section: "الفقه",
    qaKey: "fiqh",
    references: ["الأعمال بالنيات؛ صحيح البخاري", "القواعد الفقهية؛ الأشباه والنظائر", "المائدة: 6؛ كتب الطهارة", "رفع الحرج؛ الموافقات", "إعلام الموقعين؛ ابن القيم"],
  },
  {
    section: "القرآن",
    qaKey: "quran",
    references: ["الإسراء: 9؛ تفسير الطبري", "ص: 29؛ تفسير السعدي", "آل عمران: 7؛ البرهان", "مقدمة التفسير؛ ابن تيمية", "الإتقان في علوم القرآن؛ السيوطي"],
  },
  {
    section: "السنة",
    qaKey: "sunnah",
    references: ["مقدمة صحيح مسلم", "نخبة الفكر؛ ابن حجر", "تدريب الراوي؛ السيوطي", "شرح النووي على مسلم", "فتح الباري؛ ابن حجر"],
  },
  {
    section: "السيرة",
    qaKey: "seerah",
    references: ["سيرة ابن هشام", "زاد المعاد؛ ابن القيم", "صحيح البخاري؛ كتاب المغازي", "البداية والنهاية؛ ابن كثير", "دلائل النبوة؛ البيهقي"],
  },
  {
    section: "الأخلاق",
    qaKey: "akhlaq",
    references: ["الحجرات: 10؛ تفسير القرطبي", "صحيح مسلم؛ كتاب البر والصلة", "الأدب المفرد؛ البخاري", "رياض الصالحين؛ النووي", "جامع العلوم والحكم؛ ابن رجب"],
  },
  {
    section: "التزكية",
    qaKey: "tazkiyah",
    references: ["الحشر: 18؛ مدارج السالكين", "الكهف: 110؛ جامع العلوم والحكم", "البقرة: 153؛ عدة الصابرين", "إبراهيم: 7؛ مدارج السالكين", "الوابل الصيب؛ ابن القيم"],
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
  91: [
    ["الإخلاص في النية", "تصحيح القصد لله وحده حتى لا يطلب العبد بعمله مدح الناس أو حظوظ النفس"],
    ["الاستقامة على الأمر", "لزوم طاعة الله ظاهرا وباطنا مع دوام المراجعة عند التقصير"],
    ["تعظيم حقوق العباد", "حفظ الدماء والأموال والأعراض ورد المظالم إلى أهلها بقدر الاستطاعة"],
    ["الرفق في الدعوة", "بيان الحق بلين وحكمة مع ترك الفظاظة التي تنفر القلوب عن الخير"],
    ["ترك الرياء", "حراسة العمل من طلب نظر الخلق واستحضار أن القبول بيد الله وحده"],
  ],
  92: [
    ["محاسبة النفس", "مراجعة العبد لقوله وعمله قبل الحساب بما يثمر توبة وإصلاحا وصدق توجه"],
    ["الصبر عند البلاء", "حبس النفس على ما يرضي الله مع الأخذ بالأسباب المشروعة وترك التسخط"],
    ["العلم قبل العمل", "طلب البصيرة من الوحي وكلام أهل العلم حتى يقع العمل على هدى لا على عادة"],
    ["حسن الخلق", "بذل الندى وكف الأذى واحتمال الناس بالعدل والرحمة من غير تضييع للحق"],
    ["تعظيم الوقت", "حفظ العمر فيما ينفع في الدين والدنيا وترك الفضول الذي يذهب البركة"],
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
    " وهذا الجواب تعليمي موجز، يضبط الأصل ولا يغني عن سؤال أهل العلم عند النوازل وتغير الأحوال.";
  const explanation =
    "ذكر الأصل مع مرجعه يعين على فهم الباب بلا إطلاق زائد، ويمنع نقل المعنى من موضعه إلى وقائع تحتاج تحريرا.";
  return roundTopics(round).map((topic, index) => ({
    id: String(start + index),
    section: topic.section,
    category: topic.category,
    level: topic.level,
    question: `ما المقصود بأصل ${topic.title} في باب ${topic.section}؟`,
    answer: `${topic.meaning}، مع مراعاة الدليل والقدرة والمآل في تنزيله.${suffix}`,
    explanation,
    reference: topic.reference,
  }));
}

export function makeQaItems({ round, start }) {
  const suffix =
    " والجواب هنا للتعليم العام لا للفتوى الخاصة؛ لأن تنزيل الأحكام على الأعيان يحتاج معرفة الحال وسؤال المختصين من أهل العلم.";
  return roundTopics(round)
    .slice(0, 40)
    .map((topic, index) => {
      const [category_id, cat_name, cat_slug] = qaCategories[topic.qaKey];
      return {
        id: String(start + index),
        question: `كيف يضبط أصل ${topic.title} الكلام في ${topic.section}؟`,
        answer: `يضبط هذا الأصل الباب بأنه يرد المسألة إلى معناها الشرعي: ${topic.meaning}.${suffix}`,
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
    " وهذه فائدة تربوية محررة، تقرأ مع نصوص الباب وكلام المحققين، ولا تجعل بديلا عن التفصيل العلمي عند اختلاف الصور.";
  return roundTopics(round)
    .slice(0, 25)
    .map((topic, index) => ({
      text: `${topic.title} من مفاتيح ضبط باب ${topic.section}: ${topic.meaning}، ومن فقهه وصل العمل بالدليل ومراعاة مراتب الناس والأحوال دون غلو أو تهاون.${suffix}`,
      category: index % 2 === 0 ? topic.section : "طلب العلم",
      source: topic.reference,
      author_name: index % 2 === 0 ? "أهل العلم" : "محررو سُنّة",
    }));
}
