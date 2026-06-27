import {
  babSection,
  chapter,
  createBook,
  introSection,
  section,
} from "./book-factory";
import type { LibraryBook } from "./types";

const INTRO_READING =
  "هذا الكتاب من المراجع العلمية المعتمدة عند أهل العلم. نعرض هنا مقدمة منظمة وفهرساً للأبواب مع نماذج من المحتوى، ويُستكمل النص تدريجياً.";

function hadithBabs(titles: string[]) {
  return titles.map((title, i) => ({
    id: `bab-${i + 1}`,
    title,
    content:
      i === 0
        ? [
            "باب في بيان أهمية هذا العلم وطريقته.",
            "يُستفاد من هذا الباب أصول التعامل مع الأحاديث: الصحيح والحسن والضعيف، والعمل بالحديث في بابه.",
          ]
        : undefined,
  }));
}

function tafsirBabs() {
  return [
    { id: "muqaddimah", title: "المقدمة في التفسير", content: ["التفسير: علم يُعرف به فهم كتاب الله وتبيين معانيه.", "أهم أصول المفسر: التفسير بالقرآن، وبالسنة، وأقوال الصحابة والتابعين."] },
    { id: "surah-1", title: "سورة الفاتحة", content: ["بسم الله الرحمن الرحيم — افتتاح السورة بالبسملة.", "الحمد لله رب العالمين — ثناء على الله بصفات الكمال.", "الصراط المستقيم — الدعاء بالهداية إلى طريق الأنبياء والصالحين."] },
    { id: "surah-2-start", title: "سورة البقرة — أولاً", placeholder: true as const },
    { id: "juz-1", title: "الجزء الأول — مواضيع عامة", placeholder: true as const },
  ].map((b) => ({
    id: b.id,
    title: b.title,
    content: "content" in b && b.content ? b.content : undefined,
  }));
}

function fiqhBabs(titles: string[]) {
  return titles.map((title, i) => ({
    id: `bab-${i + 1}`,
    title,
    content: i === 0 ? ["باب التعريف بالكتاب ومنهجه.", "يُعرض في هذا الباب أهم القواعد التي يُبنى عليها الفهم."] : undefined,
  }));
}

export const LIBRARY_BOOKS: LibraryBook[] = [
  // ── قرآن وعلومه ──
  createBook({
    id: "lib-tafsir-tabari",
    slug: "tafsir-tabari",
    title: "جامع البيان عن تأويل آي القرآن — الطبري",
    author: "ابن جرير الطبري",
    category: "تفسير",
    description: "من أوائل وأوسع التفاسير بالمأثور؛ يُعد مرجعاً في تأويل القرآن.",
    coverHue: 145,
    sections: [introSection([INTRO_READING, "جمع الإمام الطبري أقوال السلف في التفسير مع ترجيح وبيان."]), babSection("tafsir", "التفسير", tafsirBabs())],
  }),
  createBook({
    id: "lib-tafsir-qurtubi",
    slug: "tafsir-qurtubi",
    title: "الجامع لأحكام القرآن — القرطبي",
    author: "القرطبي",
    category: "تفسير",
    description: "تفسير فقهي أحكامي؛ يربط الآيات بالأحكام الشرعية.",
    sections: [introSection([INTRO_READING]), babSection("tafsir", "التفسير", tafsirBabs())],
  }),
  createBook({
    id: "lib-tafsir-baghawi",
    slug: "tafsir-baghawi",
    title: "معالم التنزيل — البغوي",
    author: "البغوي",
    category: "تفسير",
    description: "تفسير مختصر معتمد على أقوال السلف.",
    sections: [introSection([INTRO_READING]), babSection("tafsir", "التفسير", tafsirBabs())],
  }),
  createBook({
    id: "lib-tafsir-jalalayn",
    slug: "tafsir-jalalayn",
    title: "تفسير الجلالين",
    author: "جلال الدين المحلي والسيوطي",
    category: "تفسير",
    description: "من أشهر التفاسير المختصرة؛ معتمد في التعليم.",
    sections: [
      introSection(["تفسير الجلالين: مختصر واضح يُقرأ في الحلقات والمدارس."]),
      babSection("tafsir", "التفسير", [
        { id: "fatihah", title: "سورة الفاتحة", content: ["بسم الله الرحمن الرحيم: افتتاح بالبسملة.", "الرحمن الرحيم: صفتان من صفات رحمة الله.", "مالك يوم الدين: الله هو مالك يوم الجزاء."] },
        { id: "baqarah-1", title: "سورة البقرة — البداية", content: undefined },
      ]),
    ],
  }),
  createBook({
    id: "lib-tafsir-ibn-kathir",
    slug: "tafsir-ibn-kathir",
    title: "تفسير ابن كثير",
    author: "ابن كثير",
    category: "تفسير",
    description: "تفسير بالمأثور؛ يعتمد على الآيات والأحاديث الصحيحة.",
    sections: [introSection([INTRO_READING]), babSection("tafsir", "التفسير", tafsirBabs())],
  }),
  createBook({
    id: "lib-adwa-al-bayan",
    slug: "adwa-al-bayan",
    title: "أضواء البيان",
    author: "محمد الشنقيطي",
    category: "تفسير",
    description: "تفسير معاصر يركز على إعراب القرآن وبيان معانيه.",
    sections: [introSection([INTRO_READING]), babSection("tafsir", "التفسير", tafsirBabs())],
  }),
  createBook({
    id: "lib-tahrir-tanwir",
    slug: "tahrir-tanwir",
    title: "التحرير والتنوير",
    author: "محمد الطاهر ابن عاشور",
    category: "تفسير",
    description: "تفسير معاصر يجمع بين المأثور والمعقول.",
    sections: [introSection([INTRO_READING]), babSection("tafsir", "التفسير", tafsirBabs())],
  }),

  // ── حديث ──
  createBook({
    id: "lib-001",
    slug: "sahih-bukhari",
    title: "صحيح البخاري",
    author: "الإمام البخاري",
    category: "حديث",
    description: "أصح كتاب بعد القرآن؛ جمع أحاديث النبي ﷺ بأعلى معايير الجرح والتعديل.",
    externalUrl: "https://sunnah.com/bukhari",
    sections: [
      introSection(["صحيح البخاري: أجمع كتب الحديث على الصحة.", "رتّبه البخاري على الأبواب الفقهية."]),
      babSection("ahadith", "الأبواب", hadithBabs(["كتاب بدء الوحي", "كتاب الإيمان", "كتاب العلم", "كتاب الوضوء", "كتاب الصلاة", "كتاب الزكاة", "كتاب الصيام", "كتاب الحج"])),
    ],
  }),
  createBook({
    id: "lib-002",
    slug: "sahih-muslim",
    title: "صحيح مسلم",
    author: "الإمام مسلم",
    category: "حديث",
    description: "ثاني أصح كتب الحديث؛ مرتب حسب الأبواب الفقهية.",
    externalUrl: "https://sunnah.com/muslim",
    sections: [introSection([INTRO_READING]), babSection("ahadith", "الأبواب", hadithBabs(["المقدمة", "كتاب الإيمان", "كتاب الطهارة", "كتاب الصلاة", "كتاب الزكاة"]))],
  }),
  createBook({
    id: "lib-sunan-abu-dawud",
    slug: "sunan-abu-dawud",
    title: "سنن أبي داود",
    author: "أبو داود السجستاني",
    category: "حديث",
    description: "من كتب السنن الأربعة؛ يركز على الأحكام.",
    externalUrl: "https://sunnah.com/abudawud",
    sections: [introSection([INTRO_READING]), babSection("ahadith", "الأبواب", hadithBabs(["كتاب الطهارة", "كتاب الصلاة", "كتاب الزكاة", "كتاب الصيام"]))],
  }),
  createBook({
    id: "lib-sunan-tirmidhi",
    slug: "sunan-tirmidhi",
    title: "سنن الترمذي",
    author: "الترمذي",
    category: "حديث",
    description: "جمع بين الحديث والعلل والحكم على الأحاديث.",
    externalUrl: "https://sunnah.com/tirmidhi",
    sections: [introSection([INTRO_READING]), babSection("ahadith", "الأبواب", hadithBabs(["كتاب الإيمان", "كتاب الطهارة", "كتاب الصلاة"]))],
  }),
  createBook({
    id: "lib-sunan-nasai",
    slug: "sunan-nasai",
    title: "سنن النسائي",
    author: "النسائي",
    category: "حديث",
    description: "من السنن المعتمدة؛ يتميز بالتدقيق في الصحيح.",
    externalUrl: "https://sunnah.com/nasai",
    sections: [introSection([INTRO_READING]), babSection("ahadith", "الأبواب", hadithBabs(["كتاب الطهارة", "كتاب الصلاة"]))],
  }),
  createBook({
    id: "lib-sunan-ibn-majah",
    slug: "sunan-ibn-majah",
    title: "سنن ابن ماجه",
    author: "ابن ماجه",
    category: "حديث",
    description: "أحد كتب السنن الستة.",
    externalUrl: "https://sunnah.com/ibnmajah",
    sections: [introSection([INTRO_READING]), babSection("ahadith", "الأبواب", hadithBabs(["كتاب الطهارة", "كتاب الصلاة"]))],
  }),
  createBook({
    id: "lib-013",
    slug: "muwatta-malik",
    title: "موطأ الإمام مالك",
    author: "الإمام مالك",
    category: "حديث",
    description: "أقدم كتاب حديث وصل إلينا؛ رواية مالك.",
    sections: [introSection([INTRO_READING]), babSection("ahadith", "الأبواب", hadithBabs(["كتاب الوضوء", "كتاب الصلاة", "كتاب الزكاة"]))],
  }),
  createBook({
    id: "lib-musnad-ahmad",
    slug: "musnad-ahmad",
    title: "مسند الإمام أحمد",
    author: "الإمام أحمد بن حنبل",
    category: "حديث",
    description: "من أكبر المسانيد؛ مرتب على الصحابة.",
    sections: [introSection([INTRO_READING]), babSection("musnad", "المسانيد", hadithBabs(["مسند أبي بكر", "مسند عمر", "مسند عثمان", "مسند علي"]))],
  }),
  createBook({
    id: "lib-arbaeen",
    slug: "arbaeen-nawawi",
    title: "الأربعون النووية",
    author: "النووي",
    category: "حديث",
    description: "أربعون حديثاً جامعة لأصول الدين.",
    sections: [
      introSection(["الأربعون النووية: اختار النووي أحاديث تشتمل على أصول الدين كله."]),
      section("ahadith", "الأحاديث", [
        chapter("h1", "الحديث 1 — الإعمال بالنيات", ["إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى."]),
        chapter("h2", "الحديث 2 — أركان الإسلام", ["بني الإسلام على خمس: شهادة أن لا إله إلا الله..."]),
        chapter("h3", "الحديث 3 — الإيمان", ["الإيمان أن تؤمن بالله وملائكته وكتبه ورسله واليوم الآخر..."]),
        ...Array.from({ length: 37 }, (_, i) =>
          chapter(`h${i + 4}`, `الحديث ${i + 4}`, undefined, { placeholder: true }),
        ),
      ]),
    ],
  }),
  createBook({
    id: "lib-umdat-ahkam",
    slug: "umdat-al-ahkam",
    title: "عمدة الأحكام",
    author: "عبد الغني المقدسي",
    category: "حديث",
    description: "أحاديث الأحكام من صحيح البخاري ومسلم.",
    sections: [introSection([INTRO_READING]), babSection("ahadith", "الأبواب", hadithBabs(["كتاب الطهارة", "كتاب الصلاة", "كتاب الزكاة"]))],
  }),
  createBook({
    id: "lib-004",
    slug: "riyadh-al-salihin",
    title: "رياض الصالحين",
    author: "النووي",
    category: "حديث",
    description: "مختارات من الأحاديث في الأخلاق والآداب.",
    sections: [
      introSection(["رياض الصالحين: جمع النووي أحاديث الأخلاق والآداب مرتبة على الأبواب."]),
      babSection("chapters", "الأبواب", hadithBabs(["كتاب الإخلاص", "كتاب التوبة", "كتاب الصبر", "كتاب الحلم", "كتاب الصدق"])),
    ],
  }),
  createBook({
    id: "lib-006",
    slug: "bulugh-al-maram",
    title: "بلوغ المرام",
    author: "ابن حجر العسقلاني",
    category: "حديث",
    description: "جمع أحاديث الأحكام مع بيان درجة كل حديث.",
    sections: [introSection([INTRO_READING]), babSection("ahadith", "الأبواب", hadithBabs(["كتاب الطهارة", "كتاب الصلاة"]))],
  }),
  createBook({
    id: "lib-014",
    slug: "jami-ulum-hikam",
    title: "جامع العلوم والحكم",
    author: "ابن رجب",
    category: "حديث",
    description: "شرح الأربعين النووية مع فوائد عقدية وفقهية.",
    sections: [introSection([INTRO_READING]), babSection("sharh", "الشروح", hadithBabs(["شرح حديث النية", "شرح حديث جبريل"]))],
  }),
  createBook({
    id: "lib-015",
    slug: "lulul-marjan",
    title: "اللؤلؤ والمرجان",
    author: "محمد فؤاد عبد الباقي",
    category: "حديث",
    description: "متفق عليه من البخاري ومسلم.",
    sections: [introSection([INTRO_READING]), babSection("ahadith", "الأحاديث", hadithBabs(["باب الإيمان", "باب الصلاة"]))],
  }),

  // ── عقيدة ──
  createBook({
    id: "lib-kitab-tawhid",
    slug: "kitab-al-tawhid",
    title: "كتاب التوحيد",
    author: "محمد بن عبد الوهاب",
    category: "عقيدة",
    description: "كتاب في توحيد الله وإخلاص العبادة.",
    sections: [
      introSection(["كتاب التوحيد: بيان معنى لا إله إلا الله ونواقضها."]),
      babSection("bab", "الأبواب", [
        { id: "b1", title: "باب فضل التوحيد", content: ["التوحيد: إفراد الله بالعبادة.", "هو أعظم أصول الإسلام."] },
        { id: "b2", title: "باب الشرك", content: undefined },
        { id: "b3", title: "باب التوسل", content: undefined },
      ]),
    ],
  }),
  createBook({
    id: "lib-009",
    slug: "aqeedah-wasitiyyah",
    title: "العقيدة الواسطية",
    author: "شيخ الإسلام ابن تيمية",
    category: "عقيدة",
    description: "عقيدة أهل السنة والجماعة باختصار ووضوح.",
    sections: [
      introSection(["الواسطية: عقيدة معتدلة بين الغلو والجفاء."]),
      section("main", "متن العقيدة", [
        chapter("names", "أسماء الله وصفاته", ["نؤمن بأسماء الله الحسنى وصفاته العلا من غير تحريف ولا تعطيل."]),
        chapter("qadar", "القدر", ["نؤمن بالقدر خيره وشره، وأن ما شاء الله كان وما لم يشأ لم يكن."]),
        chapter("sahabah", "الصحابة", ["خير القرون قرن الصحابة رضي الله عنهم."]),
      ]),
    ],
  }),
  createBook({
    id: "lib-016",
    slug: "aqeedah-tahawiyyah",
    title: "العقيدة الطحاوية",
    author: "الإمام الطحاوي",
    category: "عقيدة",
    description: "متن عقدي جامع لعقيدة أهل السنة.",
    sections: [
      introSection(["الطحاوية: متن مختصر في العقيدة على منهج السلف."]),
      section("matn", "المتن", [
        chapter("p1", "باب التوحيد", ["نقول في توحيد الله: إن الله واحد لا شريك له."]),
        chapter("p2", "باب الرسالة", ["محمد ﷺ رسول الله خاتم الأنبياء."]),
        chapter("p3", "باب الإيمان", ["الإيمان: قول وعمل واعتقاد، يزيد وينقص."]),
      ]),
    ],
  }),
  createBook({
    id: "lib-kashf-shubahat",
    slug: "kashf-al-shubahat",
    title: "كشف الشبهات",
    author: "محمد بن عبد الوهاب",
    category: "عقيدة",
    description: "كتاب في بيان التوحيد ورد الشبهات.",
    sections: [introSection([INTRO_READING]), babSection("bab", "الأبواب", fiqhBabs(["التوحيد", "الشرك", "الرد على المشركين"]))],
  }),
  createBook({
    id: "lib-usul-thalatha",
    slug: "al-usul-al-thalatha",
    title: "الأصول الثلاثة",
    author: "محمد بن عبد الوهاب",
    category: "عقيدة",
    description: "معرفة العبد ربه ودينه ونبيه.",
    sections: [
      introSection(["الأصول الثلاثة: معرفة الله، ومعرفة الدين، ومعرفة النبي ﷺ."]),
      section("main", "الأصول", [
        chapter("rabb", "معرفة الله", ["السؤال: من ربك؟ الجواب: ربي الله الذي رباني وربى جميع العالمين."]),
        chapter("din", "معرفة الدين", ["السؤال: ما دينك؟ الجواب: ديني الإسلام."]),
        chapter("nabi", "معرفة النبي", ["السؤال: من نبيك؟ الجواب: محمد ﷺ."]),
      ]),
    ],
  }),
  createBook({
    id: "lib-qawaid-arba",
    slug: "al-qawaid-al-arba",
    title: "القواعد الأربع",
    author: "محمد بن عبد الوهاب",
    category: "عقيدة",
    description: "قواعد أربع في التوحيد.",
    sections: [
      introSection(["القواعد الأربع: أصول ينبغي للعبد معرفتها."]),
      section("rules", "القواعد", [
        chapter("q1", "القاعدة الأولى", ["معرفة الكفر وشعائره."]),
        chapter("q2", "القاعدة الثانية", ["معرفة الشرك وشعائره."]),
        chapter("q3", "القاعدة الثالثة", ["معرفة أن من ترك نوعاً من أنواع الكفر..."]),
        chapter("q4", "القاعدة الرابعة", ["معرفة أن أعداء الدين."]),
      ]),
    ],
  }),

  // ── فقه ──
  createBook({
    id: "lib-zad-mustaqni",
    slug: "zad-al-mustaqni",
    title: "زاد المستقنع",
    author: "الحجawi",
    category: "فقه",
    description: "متن فقهي حنبلي في العبادات والمعاملات.",
    sections: [introSection([INTRO_READING]), babSection("fiqh", "الأبواب", fiqhBabs(["كتاب الطهارة", "كتاب الصلاة", "كتاب الزكاة", "كتاب الصيام", "كتاب الحج"]))],
  }),
  createBook({
    id: "lib-dalil-talib",
    slug: "dalil-al-talib",
    title: "دليل الطالب",
    author: "مرعي بن يوسف",
    category: "فقه",
    description: "مختصر في الفقه الحنبلي.",
    sections: [introSection([INTRO_READING]), babSection("fiqh", "الأبواب", fiqhBabs(["الطهارة", "الصلاة", "الزكاة"]))],
  }),
  createBook({
    id: "lib-raud-murabba",
    slug: "al-raud-al-murabba",
    title: "الروض المربع",
    author: "منصور البهوتي",
    category: "فقه",
    description: "شرح زاد المستقنع.",
    sections: [introSection([INTRO_READING]), babSection("fiqh", "الأبواب", fiqhBabs(["كتاب الطهارة", "كتاب الصلاة"]))],
  }),
  createBook({
    id: "lib-umdat-fiqh",
    slug: "umdat-al-fiqh",
    title: "عمدة الفقه",
    author: "ابن قدامة",
    category: "فقه",
    description: "مختصر في الفقه الحنبلي.",
    sections: [introSection([INTRO_READING]), babSection("fiqh", "الأبواب", fiqhBabs(["الطهارة", "الصلاة", "الزكاة"]))],
  }),
  createBook({
    id: "lib-manar-sabil",
    slug: "manar-al-sabil",
    title: "منار السبيل",
    author: "ابن ضويان",
    category: "فقه",
    description: "مختصر في الفقه الحنبلي.",
    sections: [introSection([INTRO_READING]), babSection("fiqh", "الأبواب", fiqhBabs(["الطهارة", "الصلاة"]))],
  }),
  createBook({
    id: "lib-al-kafi",
    slug: "al-kafi",
    title: "الكافي",
    author: "ابن قدامة",
    category: "فقه",
    description: "مختصر في الفقه الحنبلي.",
    sections: [introSection([INTRO_READING]), babSection("fiqh", "الأبواب", fiqhBabs(["الطهارة", "الصلاة"]))],
  }),
  createBook({
    id: "lib-al-mughni",
    slug: "al-mughni",
    title: "المغني",
    author: "ابن قدامة",
    category: "فقه",
    description: "من أكبر كتب الفقه الحنبلي.",
    sections: [introSection([INTRO_READING]), babSection("fiqh", "الأبواب", fiqhBabs(["كتاب الطهارة", "كتاب الصلاة", "كتاب البيوع"]))],
  }),
  createBook({
    id: "lib-007",
    slug: "al-muntaqa",
    title: "المنتقى — ابن الجوزي",
    author: "ابن الجوزي",
    category: "فقه",
    description: "مختصر في الفقه الحنبلي.",
    sections: [introSection([INTRO_READING]), babSection("fiqh", "الأبواب", fiqhBabs(["الطهارة", "الصلاة"]))],
  }),
  createBook({
    id: "lib-012",
    slug: "fiqh-as-sunnah",
    title: "فقه السنة",
    author: "سيد سابق",
    category: "فقه",
    description: "فقه مقارن مبسّط للعبادات والمعاملات.",
    sections: [introSection([INTRO_READING]), babSection("fiqh", "الأبواب", fiqhBabs(["الطهارة", "الصلاة", "الزكاة", "الصيام"]))],
  }),

  // ── سيرة ──
  createBook({
    id: "lib-raheeq",
    slug: "ar-raheeq-al-makhtum",
    title: "الرحيق المختوم",
    author: "صفي الرحمن المباركفوري",
    category: "سيرة",
    description: "سيرة النبي ﷺ مختصرة شاملة.",
    sections: [
      introSection(["الرحيق المختوم: من أشهر كتب السيرة المعاصرة."]),
      babSection("seerah", "المراحل", [
        { id: "pre", title: "العصر الجاهلي", content: ["بيئة مكة قبل البعثة.", "نسب النبي ﷺ."] },
        { id: "bath", title: "البعثة", content: undefined },
        { id: "makkah", title: "دعوة مكة", content: undefined },
        { id: "madinah", title: "دعوة المدينة", content: undefined },
      ]),
    ],
  }),
  createBook({
    id: "lib-008",
    slug: "zad-al-maad",
    title: "زاد المعاد",
    author: "ابن القيم",
    category: "سيرة",
    description: "طب النبوي في السيرة والفقه والآداب.",
    sections: [introSection([INTRO_READING]), babSection("seerah", "الأبواب", fiqhBabs(["طب النبوي", "السيرة", "الآداب"]))],
  }),
  createBook({
    id: "lib-005",
    slug: "sira-ibn-hisham",
    title: "السيرة النبوية — ابن هشام",
    author: "ابن هشام",
    category: "سيرة",
    description: "من أشهر كتب السيرة؛ اعتمد على سيرة ابن إسحاق.",
    sections: [introSection([INTRO_READING]), babSection("seerah", "المراحل", fiqhBabs(["مكة", "الهجرة", "المدينة"]))],
  }),
  createBook({
    id: "lib-shamail",
    slug: "al-shamail-al-muhammadiyyah",
    title: "الشمائل المحمدية",
    author: "الترمذي",
    category: "سيرة",
    description: "صفات النبي ﷺ الخَلقية والخُلقية.",
    sections: [
      introSection(["الشمائل: وصف النبي ﷺ وصفاً شاملاً."]),
      babSection("shamail", "الأبواب", [
        { id: "s1", title: "باب ما جاء في صفة خلق النبي ﷺ", content: ["كان ﷺ أوسط الناس طولاً."] },
        { id: "s2", title: "باب في ترجل النبي ﷺ", content: undefined },
      ]),
    ],
  }),

  // ── آداب وأذكار ──
  createBook({
    id: "lib-adab-mufrad",
    slug: "al-adab-al-mufrad",
    title: "الأدب المفرد",
    author: "البخاري",
    category: "آداب",
    description: "آداب وأخلاق من السنة.",
    sections: [introSection([INTRO_READING]), babSection("adab", "الأبواب", hadithBabs(["باب بر الوالدين", "باب صلة الرحم", "باب حسن الجوار"]))],
  }),
  createBook({
    id: "lib-010",
    slug: "hisn-al-muslim",
    title: "حصn المسلم",
    author: "سعيد القحطاني",
    category: "أذكار",
    description: "جمع أذكار النبي ﷺ من الكتاب والسنة.",
    sections: [introSection([INTRO_READING]), babSection("adhkar", "الأبواب", hadithBabs(["أذكار الصباح", "أذكار المساء", "أذكار النوم"]))],
  }),
  createBook({
    id: "lib-011",
    slug: "al-adhkar-nawawi",
    title: "الأذكار — النووي",
    author: "النووي",
    category: "أذكار",
    description: "موسوعة الأذكار والأدعية المأثورة.",
    sections: [introSection([INTRO_READING]), babSection("adhkar", "الأبواب", hadithBabs(["أذكار الصباح", "أذكار المساء"]))],
  }),

  // ── أخرى ──
  createBook({
    id: "lib-017",
    slug: "al-ajrumiyyah",
    title: "متن الآجرومية",
    author: "ابن آجروم",
    category: "لغة",
    type: "متن",
    description: "متن كلاسيكي في النحو العربي.",
    sections: [
      introSection(["الآجرومية: متن نحوي يُقرأ في البدايات."]),
      section("bab", "الأبواب", [
        chapter("b1", "باب الكلام", ["الكلام: لفظ مركب أفيد."]),
        chapter("b2", "باب الإعراب", undefined, { placeholder: true }),
      ]),
    ],
  }),
  createBook({
    id: "lib-018",
    slug: "usul-talab-ilm",
    title: "تفريغ: أصول طلب العلم",
    author: "مجلس علمي",
    category: "تأصيل",
    type: "تفريغ",
    description: "تفريغ درس علمي عن آداب طلب العلم.",
    sections: [
      introSection(["آداب طلب العلم: إخلاص وصبر ومرافقة العلماء."]),
      section("main", "الفصول", [
        chapter("f1", "مراتب طلب العلم", ["العلم مراتب: سماع، فهم، حفظ، عمل."]),
      ]),
    ],
  }),
];
