/**
 * بيانات مسارات التعلم الثابتة — تُستخدم عند غياب بيانات قاعدة البيانات
 */

import type { LPScience, LPLevel } from "@/lib/learning-path-service";

export const STATIC_SCIENCES: LPScience[] = [
  { id: "s-aqeedah",  name: "علم العقيدة",        slug: "aqeedah",  description: "دراسة أصول الإيمان وتوحيد الله وصفاته وأحكام الأسماء والصفات.",         why_study: "العقيدة أساس الدين وأول ما يجب تعلّمه، فبها يصحّ الإيمان وتُبنى العبادات.", icon: "🌟", color: "#059669", sort_order: 1 },
  { id: "s-fiqh",     name: "علم الفقه",           slug: "fiqh",     description: "معرفة الأحكام الشرعية العملية من الطهارة والصلاة والزكاة والصيام والحج وسائر العبادات والمعاملات.", why_study: "الفقه يُعلّمك كيف تؤدي عباداتك ومعاملاتك وفق ما أمر الله.", icon: "⚖️", color: "#7c3aed", sort_order: 2 },
  { id: "s-hadith",   name: "علم الحديث",          slug: "hadith",   description: "دراسة السنة النبوية متناً وسنداً، ومعرفة الأحاديث الصحيحة ودرجاتها ومصطلح الحديث.", why_study: "الحديث النبوي وحيٌ من الله وبيانٌ للقرآن الكريم لا يُستغنى عنه.", icon: "📜", color: "#0284c7", sort_order: 3 },
  { id: "s-tafsir",   name: "علم التفسير",         slug: "tafsir",   description: "فهم معاني القرآن الكريم وبيان مقاصده وأحكامه واستخراج الفوائد منه.", why_study: "القرآن الكريم كتاب الله المُنزَّل؛ تفسيره طريق الفهم والعمل.", icon: "📖", color: "#b45309", sort_order: 4 },
  { id: "s-seerah",   name: "السيرة النبوية",      slug: "seerah",   description: "دراسة حياة النبي ﷺ من المولد حتى الوفاة، وغزواته وأخلاقه وهديه في كل شأن.", why_study: "محبة النبي ﷺ فرضٌ، والتأسي به واجب، ولا يُحقَّق ذلك إلا بمعرفة سيرته.", icon: "🕌", color: "#0f766e", sort_order: 5 },
  { id: "s-nahw",     name: "النحو والصرف",        slug: "nahw",     description: "أصول اللغة العربية من إعراب وبناء وصرف، وهي آلة الفهم لكل العلوم الشرعية.", why_study: "بدون النحو والصرف لا يُفهم القرآن والحديث فهماً صحيحاً.", icon: "✍️", color: "#b91c1c", sort_order: 6 },
  { id: "s-tazkiyah", name: "التزكية والأخلاق",    slug: "tazkiyah", description: "تزكية النفس وتهذيبها، وتعلُّم الأخلاق الإسلامية والسلوك القلبي الصحيح.", why_study: "إصلاح القلب وتزكية النفس هدف الرسالات وغاية العبادات.", icon: "❤️", color: "#be123c", sort_order: 7 },
];

export type StaticScienceDetail = { science: LPScience; levels: LPLevel[] };

export const STATIC_SCIENCE_DETAILS: Record<string, StaticScienceDetail> = {
  aqeedah: {
    science: STATIC_SCIENCES[0],
    levels: [
      {
        id: "aqeedah-l1", name: "المستوى الأول — التمهيدي", slug: "l1", sort_order: 1, color: "#d1fae5",
        books: [
          { id: "aqeedah-b1", title: "ثلاثة الأصول وأدلتها",         author: "الشيخ محمد بن عبد الوهاب",       cover_image_url: null, summary: "رسالة مختصرة في أصول الدين الثلاثة: معرفة الله، ومعرفة الإسلام، ومعرفة النبي ﷺ بالدليل.", difficulty: "easy",   estimated_hours: 2,  pages_count: 35,  order_in_level: 1 },
          { id: "aqeedah-b2", title: "القواعد الأربع",                author: "الشيخ محمد بن عبد الوهاب",       cover_image_url: null, summary: "رسالة في أربع قواعد يُفرَّق بها بين الموحِّدين والمشركين.",                              difficulty: "easy",   estimated_hours: 1,  pages_count: 15,  order_in_level: 2 },
          { id: "aqeedah-b3", title: "كتاب التوحيد",                  author: "الشيخ محمد بن عبد الوهاب",       cover_image_url: null, summary: "أشهر كتب العقيدة يبيّن معنى التوحيد وأنواعه ونواقضه بالأدلة من القرآن والسنة.",           difficulty: "easy",   estimated_hours: 4,  pages_count: 80,  order_in_level: 3 },
        ],
      },
      {
        id: "aqeedah-l2", name: "المستوى الثاني — المتوسط", slug: "l2", sort_order: 2, color: "#a7f3d0",
        books: [
          { id: "aqeedah-b4", title: "العقيدة الواسطية",              author: "شيخ الإسلام ابن تيمية",           cover_image_url: null, summary: "متن عقدي جامع في عقيدة أهل السنة والجماعة في الصفات والإيمان والقدر والنبوات.",            difficulty: "medium", estimated_hours: 6,  pages_count: 90,  order_in_level: 1 },
          { id: "aqeedah-b5", title: "القواعد المثلى في صفات الله",   author: "الشيخ محمد بن عثيمين",           cover_image_url: null, summary: "رسالة علمية تضع قواعد منضبطة لفهم أسماء الله الحسنى وصفاته العلى وإثباتها.",                difficulty: "medium", estimated_hours: 5,  pages_count: 110, order_in_level: 2 },
          { id: "aqeedah-b6", title: "لمعة الاعتقاد",                 author: "الإمام ابن قدامة المقدسي",       cover_image_url: null, summary: "متن مختصر في عقيدة أهل الأثر يشمل أصول الإيمان وصفات الله والمعاد.",                     difficulty: "medium", estimated_hours: 3,  pages_count: 55,  order_in_level: 3 },
        ],
      },
      {
        id: "aqeedah-l3", name: "المستوى الثالث — المتقدم", slug: "l3", sort_order: 3, color: "#6ee7b7",
        books: [
          { id: "aqeedah-b7", title: "العقيدة الطحاوية (شرح ابن أبي العز)", author: "الإمام الطحاوي / شرح: ابن أبي العز الحنفي", cover_image_url: null, summary: "متن عقدي مع شرحه المفصَّل يجمع عقيدة أهل السنة بأدلتها العقلية والنقلية.",           difficulty: "hard",   estimated_hours: 15, pages_count: 420, order_in_level: 1 },
          { id: "aqeedah-b8", title: "شرح الأصول الستة",              author: "الشيخ محمد بن عثيمين",           cover_image_url: null, summary: "شرح لستة أصول عظيمة أصّلها ابن عبد الوهاب لفهم الإسلام الصحيح.",                         difficulty: "hard",   estimated_hours: 8,  pages_count: 200, order_in_level: 2 },
        ],
      },
    ],
  },

  fiqh: {
    science: STATIC_SCIENCES[1],
    levels: [
      {
        id: "fiqh-l1", name: "المستوى الأول — التمهيدي", slug: "l1", sort_order: 1, color: "#ede9fe",
        books: [
          { id: "fiqh-b1", title: "زاد المستقنع في اختصار المقنع",   author: "الإمام شرف الدين الحجاوي",       cover_image_url: null, summary: "من أشهر المتون الفقهية الحنبلية يشمل الطهارة والعبادات والمعاملات بأسلوب مختصر.", difficulty: "easy",   estimated_hours: 6,  pages_count: 100, order_in_level: 1 },
          { id: "fiqh-b2", title: "عمدة الفقه",                      author: "الإمام ابن قدامة المقدسي",       cover_image_url: null, summary: "متن فقهي مرتَّب يبدأ بالطهارة ويشمل أبواب العبادات والمعاملات والأحوال الشخصية.", difficulty: "easy",   estimated_hours: 5,  pages_count: 95,  order_in_level: 2 },
          { id: "fiqh-b3", title: "آداب المشي إلى الصلاة",           author: "الشيخ محمد بن عبد الوهاب",       cover_image_url: null, summary: "رسالة مختصرة في آداب الصلاة والمشي إليها والذكر بعدها.",                              difficulty: "easy",   estimated_hours: 1,  pages_count: 20,  order_in_level: 3 },
        ],
      },
      {
        id: "fiqh-l2", name: "المستوى الثاني — المتوسط", slug: "l2", sort_order: 2, color: "#ddd6fe",
        books: [
          { id: "fiqh-b4", title: "الروض المربع شرح زاد المستقنع",   author: "الشيخ منصور البهوتي",             cover_image_url: null, summary: "شرح متوسط على زاد المستقنع يفصّل المسائل الفقهية ويبيّن دليلها.", difficulty: "medium", estimated_hours: 15, pages_count: 380, order_in_level: 1 },
          { id: "fiqh-b5", title: "المحرر في الفقه الحنبلي",         author: "الإمام ابن تيمية الجدّ",         cover_image_url: null, summary: "متن فقهي جامع في المذهب الحنبلي يحرّر المسائل الخلافية.", difficulty: "medium", estimated_hours: 12, pages_count: 300, order_in_level: 2 },
        ],
      },
      {
        id: "fiqh-l3", name: "المستوى الثالث — المتقدم", slug: "l3", sort_order: 3, color: "#c4b5fd",
        books: [
          { id: "fiqh-b6", title: "المغني",                           author: "الإمام ابن قدامة المقدسي",       cover_image_url: null, summary: "موسوعة فقهية ضخمة تشمل جميع أبواب الفقه مع المقارنة بين المذاهب والأدلة.", difficulty: "hard",   estimated_hours: 60, pages_count: 1800, order_in_level: 1 },
          { id: "fiqh-b7", title: "كشاف القناع عن متن الإقناع",      author: "الإمام البهوتي",                 cover_image_url: null, summary: "شرح واسع على الإقناع في مسائل الفقه الحنبلي.", difficulty: "hard",   estimated_hours: 40, pages_count: 1200, order_in_level: 2 },
        ],
      },
    ],
  },

  hadith: {
    science: STATIC_SCIENCES[2],
    levels: [
      {
        id: "hadith-l1", name: "المستوى الأول — التمهيدي", slug: "l1", sort_order: 1, color: "#e0f2fe",
        books: [
          { id: "hadith-b1", title: "الأربعون النووية",               author: "الإمام يحيى بن شرف النووي",      cover_image_url: null, summary: "أربعون حديثاً من جوامع الكَلِم النبوي، تُغطي أسس الإسلام وقواعده الكبرى.", difficulty: "easy",   estimated_hours: 2,  pages_count: 40,  order_in_level: 1 },
          { id: "hadith-b2", title: "عمدة الأحكام من كلام خير الأنام", author: "الحافظ عبد الغني المقدسي",     cover_image_url: null, summary: "مختصر يجمع أصح الأحاديث في أبواب الأحكام الفقهية من الصحيحين.",               difficulty: "easy",   estimated_hours: 5,  pages_count: 130, order_in_level: 2 },
          { id: "hadith-b3", title: "اختصار علوم الحديث",             author: "الحافظ ابن كثير",               cover_image_url: null, summary: "مقدمة في مصطلح الحديث ودرجاته وأنواعه ورجاله.", difficulty: "easy",   estimated_hours: 4,  pages_count: 100, order_in_level: 3 },
        ],
      },
      {
        id: "hadith-l2", name: "المستوى الثاني — المتوسط", slug: "l2", sort_order: 2, color: "#bae6fd",
        books: [
          { id: "hadith-b4", title: "رياض الصالحين",                  author: "الإمام يحيى بن شرف النووي",      cover_image_url: null, summary: "جامع من الآيات والأحاديث الصحيحة في الرقائق والآداب والأخلاق.", difficulty: "medium", estimated_hours: 18, pages_count: 500, order_in_level: 1 },
          { id: "hadith-b5", title: "بلوغ المرام من أدلة الأحكام",   author: "الحافظ ابن حجر العسقلاني",       cover_image_url: null, summary: "يجمع أدلة الأحكام الفقهية المختارة من الأحاديث مع بيان درجاتها.", difficulty: "medium", estimated_hours: 15, pages_count: 380, order_in_level: 2 },
          { id: "hadith-b6", title: "نخبة الفكر في مصطلح أهل الأثر", author: "الحافظ ابن حجر العسقلاني",       cover_image_url: null, summary: "متن جامع في مصطلح الحديث يُعدّ من أهم مراجع هذا الفن.", difficulty: "medium", estimated_hours: 5,  pages_count: 80,  order_in_level: 3 },
        ],
      },
      {
        id: "hadith-l3", name: "المستوى الثالث — المتقدم", slug: "l3", sort_order: 3, color: "#7dd3fc",
        books: [
          { id: "hadith-b7", title: "صحيح البخاري",                   author: "الإمام محمد بن إسماعيل البخاري", cover_image_url: null, summary: "أصح كتاب بعد كتاب الله، يضم 7275 حديثاً منتقاة في أبواب العلوم الشرعية.", difficulty: "hard",   estimated_hours: 50, pages_count: 1500, order_in_level: 1 },
          { id: "hadith-b8", title: "فتح الباري شرح صحيح البخاري",   author: "الحافظ ابن حجر العسقلاني",       cover_image_url: null, summary: "أكمل شرح لصحيح البخاري في ثلاثة عشر مجلداً يجمع العلوم الحديثية والفقهية.", difficulty: "hard",   estimated_hours: 120, pages_count: 4000, order_in_level: 2 },
        ],
      },
    ],
  },

  tafsir: {
    science: STATIC_SCIENCES[3],
    levels: [
      {
        id: "tafsir-l1", name: "المستوى الأول — التمهيدي", slug: "l1", sort_order: 1, color: "#fef3c7",
        books: [
          { id: "tafsir-b1", title: "تيسير الكريم الرحمن في تفسير كلام المنان", author: "الشيخ عبد الرحمن السعدي", cover_image_url: null, summary: "تفسير ميسَّر يجمع بين الوضوح والعلم، مناسب للمبتدئ ورفيق القارئ للقرآن.", difficulty: "easy",   estimated_hours: 25, pages_count: 930, order_in_level: 1 },
          { id: "tafsir-b2", title: "تفسير الجزء الثلاثين للمبتدئين",author: "الشيخ محمد بن عثيمين",           cover_image_url: null, summary: "شرح مبسَّط لسور جزء عمّ يُركّز على المعاني والفوائد العملية.",                        difficulty: "easy",   estimated_hours: 6,  pages_count: 180, order_in_level: 2 },
        ],
      },
      {
        id: "tafsir-l2", name: "المستوى الثاني — المتوسط", slug: "l2", sort_order: 2, color: "#fde68a",
        books: [
          { id: "tafsir-b3", title: "تفسير القرآن العظيم",            author: "الحافظ ابن كثير",               cover_image_url: null, summary: "من أشهر التفاسير بالمأثور يعتمد على القرآن والسنة والآثار في بيان المعاني.", difficulty: "medium", estimated_hours: 50, pages_count: 1600, order_in_level: 1 },
          { id: "tafsir-b4", title: "المقدمة في أصول التفسير",        author: "شيخ الإسلام ابن تيمية",          cover_image_url: null, summary: "رسالة ذهبية تُحدد قواعد التفسير الصحيح ومناهجه.",                                     difficulty: "medium", estimated_hours: 4,  pages_count: 80,  order_in_level: 2 },
          { id: "tafsir-b5", title: "أضواء البيان في إيضاح القرآن بالقرآن", author: "الشيخ محمد الأمين الشنقيطي", cover_image_url: null, summary: "تفسير القرآن بالقرآن مع الاستيعاب الفقهي والبياني.", difficulty: "medium", estimated_hours: 40, pages_count: 1200, order_in_level: 3 },
        ],
      },
      {
        id: "tafsir-l3", name: "المستوى الثالث — المتقدم", slug: "l3", sort_order: 3, color: "#fcd34d",
        books: [
          { id: "tafsir-b6", title: "الجامع لأحكام القرآن",           author: "الإمام القرطبي",                 cover_image_url: null, summary: "موسوعة في التفسير الفقهي تستوعب الأحكام الشرعية المستنبطة من القرآن.", difficulty: "hard",   estimated_hours: 80, pages_count: 3000, order_in_level: 1 },
          { id: "tafsir-b7", title: "التحرير والتنوير",               author: "الشيخ الطاهر ابن عاشور",         cover_image_url: null, summary: "تفسير علمي بلاغي ضخم يجمع التحليل اللغوي والبياني والفقهي.",                         difficulty: "hard",   estimated_hours: 100, pages_count: 4000, order_in_level: 2 },
        ],
      },
    ],
  },

  seerah: {
    science: STATIC_SCIENCES[4],
    levels: [
      {
        id: "seerah-l1", name: "المستوى الأول — التمهيدي", slug: "l1", sort_order: 1, color: "#ccfbf1",
        books: [
          { id: "seerah-b1", title: "نور اليقين في سيرة سيد المرسلين", author: "الشيخ محمد الخضري بك",         cover_image_url: null, summary: "سرد سلس لسيرة النبي ﷺ من المولد حتى الوفاة بأسلوب مبسَّط موثَّق.", difficulty: "easy",   estimated_hours: 8,  pages_count: 260, order_in_level: 1 },
          { id: "seerah-b2", title: "مختصر السيرة النبوية",           author: "الشيخ محمد بن عبد الوهاب",       cover_image_url: null, summary: "ملخَّص للسيرة النبوية مع التركيز على العبر والدروس المستفادة.",                          difficulty: "easy",   estimated_hours: 4,  pages_count: 150, order_in_level: 2 },
        ],
      },
      {
        id: "seerah-l2", name: "المستوى الثاني — المتوسط", slug: "l2", sort_order: 2, color: "#99f6e4",
        books: [
          { id: "seerah-b3", title: "الرحيق المختوم",                 author: "الشيخ صفي الرحمن المباركفوري",   cover_image_url: null, summary: "من أوثق كتب السيرة المعاصرة وأكثرها شمولاً، حاز على جائزة عالمية.", difficulty: "medium", estimated_hours: 18, pages_count: 520, order_in_level: 1 },
          { id: "seerah-b4", title: "زاد المعاد في هدي خير العباد",  author: "الإمام ابن قيم الجوزية",         cover_image_url: null, summary: "دراسة فقهية وعقدية تحللية لهدي النبي ﷺ في عباداته ومعاملاته وغزواته.",                  difficulty: "medium", estimated_hours: 30, pages_count: 900, order_in_level: 2 },
        ],
      },
      {
        id: "seerah-l3", name: "المستوى الثالث — المتقدم", slug: "l3", sort_order: 3, color: "#5eead4",
        books: [
          { id: "seerah-b5", title: "السيرة النبوية",                 author: "الإمام ابن هشام (عن ابن إسحاق)", cover_image_url: null, summary: "أقدم مصادر السيرة وأوثقها، وهو تهذيب سيرة ابن إسحاق مع إضافات ابن هشام.", difficulty: "hard",   estimated_hours: 40, pages_count: 1200, order_in_level: 1 },
          { id: "seerah-b6", title: "الشفا بتعريف حقوق المصطفى",    author: "القاضي عياض المالكي",             cover_image_url: null, summary: "كتاب جامع في صفات النبي ﷺ ومعجزاته وحقوقه على أمته.", difficulty: "hard",   estimated_hours: 25, pages_count: 700, order_in_level: 2 },
        ],
      },
    ],
  },

  nahw: {
    science: STATIC_SCIENCES[5],
    levels: [
      {
        id: "nahw-l1", name: "المستوى الأول — التمهيدي", slug: "l1", sort_order: 1, color: "#fee2e2",
        books: [
          { id: "nahw-b1", title: "متن الآجرومية",                    author: "الإمام ابن آجروم الصنهاجي",      cover_image_url: null, summary: "أشهر متن نحوي للمبتدئين يضع أسس الإعراب والبناء بعبارة موجزة.", difficulty: "easy",   estimated_hours: 3,  pages_count: 30,  order_in_level: 1 },
          { id: "nahw-b2", title: "متن الملحة في المدخل إلى علم اللغة العربية", author: "الحريري البصري", cover_image_url: null, summary: "أرجوزة في النحو تسهّل حفظ القواعد الأساسية.", difficulty: "easy",   estimated_hours: 2,  pages_count: 25,  order_in_level: 2 },
          { id: "nahw-b3", title: "شرح الآجرومية",                   author: "الشيخ محمد بن عثيمين",           cover_image_url: null, summary: "شرح مبسَّط ومحبوب للآجرومية بأسلوب واضح مع تمارين تطبيقية.", difficulty: "easy",   estimated_hours: 6,  pages_count: 150, order_in_level: 3 },
        ],
      },
      {
        id: "nahw-l2", name: "المستوى الثاني — المتوسط", slug: "l2", sort_order: 2, color: "#fecaca",
        books: [
          { id: "nahw-b4", title: "قطر الندى وبلّ الصدى",            author: "الإمام ابن هشام الأنصاري",       cover_image_url: null, summary: "متن نحوي متوسط شامل يفيد في فهم الإعراب وأوجهه المختلفة.", difficulty: "medium", estimated_hours: 8,  pages_count: 120, order_in_level: 1 },
          { id: "nahw-b5", title: "متن الألفية (ألفية ابن مالك)",    author: "الإمام ابن مالك الأندلسي",       cover_image_url: null, summary: "ألف بيت في النحو والصرف، أشمل متن نحوي في الموروث العربي.", difficulty: "medium", estimated_hours: 20, pages_count: 100, order_in_level: 2 },
        ],
      },
      {
        id: "nahw-l3", name: "المستوى الثالث — المتقدم", slug: "l3", sort_order: 3, color: "#fca5a5",
        books: [
          { id: "nahw-b6", title: "شرح ابن عقيل على ألفية ابن مالك", author: "الإمام ابن عقيل المصري",         cover_image_url: null, summary: "أشهر شروح الألفية وأيسرها فهماً، مرجع أساسي لطلاب النحو.", difficulty: "hard",   estimated_hours: 30, pages_count: 650, order_in_level: 1 },
          { id: "nahw-b7", title: "أوضح المسالك إلى ألفية ابن مالك", author: "الإمام ابن هشام الأنصاري",       cover_image_url: null, summary: "شرح وافٍ للألفية يتميز بالوضوح والتحرير.", difficulty: "hard",   estimated_hours: 25, pages_count: 600, order_in_level: 2 },
        ],
      },
    ],
  },

  tazkiyah: {
    science: STATIC_SCIENCES[6],
    levels: [
      {
        id: "tazkiyah-l1", name: "المستوى الأول — التمهيدي", slug: "l1", sort_order: 1, color: "#ffe4e6",
        books: [
          { id: "tazkiyah-b1", title: "الوابل الصيب من الكلم الطيب", author: "الإمام ابن قيم الجوزية",         cover_image_url: null, summary: "كتاب جامع في منافع الذكر وفضائله وأثره في تزكية النفس.", difficulty: "easy",   estimated_hours: 4,  pages_count: 110, order_in_level: 1 },
          { id: "tazkiyah-b2", title: "رياض الصالحين",               author: "الإمام يحيى بن شرف النووي",      cover_image_url: null, summary: "جامع في الآداب الإسلامية والأخلاق والرقائق من القرآن والسنة.", difficulty: "easy",   estimated_hours: 15, pages_count: 500, order_in_level: 2 },
          { id: "tazkiyah-b3", title: "الآداب الشرعية والمنح المرعية", author: "الإمام ابن مفلح الحنبلي",     cover_image_url: null, summary: "موسوعة في الأخلاق الإسلامية والآداب الشرعية في كل أحوال المسلم.", difficulty: "easy",   estimated_hours: 12, pages_count: 380, order_in_level: 3 },
        ],
      },
      {
        id: "tazkiyah-l2", name: "المستوى الثاني — المتوسط", slug: "l2", sort_order: 2, color: "#fecdd3",
        books: [
          { id: "tazkiyah-b4", title: "إحياء علوم الدين",            author: "الإمام أبو حامد الغزالي",         cover_image_url: null, summary: "موسوعة ضخمة في تجديد الدين وإحياء معالمه تشمل العبادات والمعاملات وآفات النفس.", difficulty: "medium", estimated_hours: 45, pages_count: 1400, order_in_level: 1 },
          { id: "tazkiyah-b5", title: "عدة الصابرين وذخيرة الشاكرين", author: "الإمام ابن قيم الجوزية",       cover_image_url: null, summary: "كتاب في فضائل الصبر والشكر وأثرهما في تزكية القلب.", difficulty: "medium", estimated_hours: 10, pages_count: 280, order_in_level: 2 },
        ],
      },
      {
        id: "tazkiyah-l3", name: "المستوى الثالث — المتقدم", slug: "l3", sort_order: 3, color: "#fb7185",
        books: [
          { id: "tazkiyah-b6", title: "مدارج السالكين بين منازل إياك نعبد وإياك نستعين", author: "الإمام ابن قيم الجوزية", cover_image_url: null, summary: "شرح علمي عميق على منازل السائرين يُبيّن مراحل تزكية النفس وسلوك القلب.", difficulty: "hard",   estimated_hours: 40, pages_count: 1100, order_in_level: 1 },
          { id: "tazkiyah-b7", title: "الروح",                       author: "الإمام ابن قيم الجوزية",         cover_image_url: null, summary: "كتاب في أحوال الأرواح وحقيقتها ومعرفتها وعلاقتها بالأبدان والآخرة.", difficulty: "hard",   estimated_hours: 20, pages_count: 550, order_in_level: 2 },
        ],
      },
    ],
  },
};
