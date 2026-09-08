/**
 * يضيف كتاب الآداب الشرعية، يُثري المسائل بحقول تعليمية، ويُزيل التكرار في المصادر.
 * التشغيل: node scripts/fiqh-expand-adab-and-enrich.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const booksPath = resolve(root, "content/fiqh/books.json");

const SRC_ADAB = {
  book: "الآداب الشرعية والمنح المرعية",
  author: "محمد بن مفلح المقدسي",
  ref: "كتاب الآداب",
};
const SRC_RIYADH = {
  book: "رياض الصالحين",
  author: "يحيى بن شرف النووي",
  ref: "أبواب الآداب",
};
const SRC_ZAD = {
  book: "زاد المستقنع",
  author: "شرف الدين الحجاوي",
  ref: "مباحث الآداب المتعلقة",
};

function src(book, author, ref) {
  return { book, author, ref };
}

function lesson(partial) {
  const title = partial.title;
  return {
    id: partial.id,
    title,
    bookId: "adab",
    chapterId: partial.chapterId,
    level: partial.level ?? "مبتدئ",
    madhhabNotes:
      partial.madhhabNotes ??
      "يُعرض الأدب هنا على طريقة فقهاء الحنابلة مع الاستناد إلى النصوص، دون اختراع أحكام.",
    sources: partial.sources ?? [SRC_ADAB, SRC_RIYADH],
    status: "published",
    summary: partial.summary,
    evidence: partial.evidence,
    preferred: partial.preferred,
    definition: partial.definition,
    ruling: partial.ruling ?? partial.preferred,
    notes: partial.notes,
    practicalSummary: partial.practicalSummary,
    keywords: partial.keywords ?? [title, "آداب", "فقه"],
    needsReview: false,
    scholarlyNotes: partial.scholarlyNotes ?? partial.madhhabNotes,
    commonMistakes: partial.commonMistakes ?? [],
    examples: partial.examples ?? [],
    reviewQuestions: partial.reviewQuestions ?? [
      `عرّف مسألة «${title}» باختصار.`,
      "ما الحكم أو الأدب المطلوب هنا؟",
      "اذكر دليلًا أو مرجعًا تعتمد عليه.",
    ],
  };
}

function chapter(id, title, order, definition, summary, evidence, lessons) {
  return {
    id,
    title,
    order,
    status: "published",
    definition,
    summary,
    evidence,
    topics: lessons.map((l) => l.title),
    notes: "الآداب تُطلب مع الأحكام؛ والمروءة جزء من كمال الشرع.",
    sources: [SRC_ADAB, SRC_RIYADH],
    lessons,
  };
}

const adabBook = {
  id: "adab",
  title: "كتاب الآداب الشرعية",
  description:
    "آداب المسلم في السلام والمجلس والطعام وصلة الرحم والجوار والطريق والصدق، مستمدة من كتب الآداب المعتمدة عند أهل السنة.",
  orderReason: "يُختم فقه الفروع بآداب السلوك لأنها ثمرة العلم والعمل.",
  category: "ibadat",
  order: 19,
  status: "published",
  aliases: ["الآداب", "آداب شرعية"],
  sources: [SRC_ADAB, SRC_RIYADH, SRC_ZAD],
  chapters: [
    chapter(
      "salam",
      "باب آداب السلام والتحية",
      1,
      "السلام تحية الإسلام وسنة مؤكدة عند اللقاء والمفارقة.",
      "يُشرع إفشاء السلام، وابتداؤه سنة، وردّه واجب، مع مراعاة آداب الدخول والخروج.",
      "قال تعالى: ﴿وَإِذَا حُيِّيتُم بِتَحِيَّةٍ فَحَيُّوا بِأَحْسَنَ مِنْهَا أَوْ رُدُّوهَا﴾ النساء: 86. وقال ﷺ: «أفشوا السلام بينكم» رواه مسلم.",
      [
        lesson({
          id: "adab-salam-ifsha",
          chapterId: "salam",
          title: "إفشاء السلام",
          definition: "نشر تحية الإسلام بين المسلمين عند اللقاء.",
          summary:
            "إفشاء السلام سنة عظيمة تورث المودة وتزيل الوحشة. يُستحب الابتداء به، ويُكره تركه بلا عذر. والسلام حق المسلم على المسلم كما في الصحيح.",
          evidence:
            "حديث أبي هريرة: «حق المسلم على المسلم ست… وإذا لقيته فسلّم عليه» رواه مسلم. وحديث «أفشوا السلام بينكم» رواه مسلم.",
          preferred: "يُسنّ إفشاء السلام، ويُستحب الابتداء به للقادر.",
          notes: "لا يُسلَّم على من يُخشى منه أذى ظاهر في غير ضرورة، ويُراعى حال النائم والمصلّي.",
          practicalSummary: "إذا لقيت مسلمًا فابدأ بالسلام بصوت مسموع واضح دون مبالغة.",
          commonMistakes: [
            "الاقتصار على إشارة اليد دون لفظ السلام بلا عذر.",
            "رفع الصوت بما يؤذي في مجالس الذكر أو الصلاة.",
          ],
          examples: ["في الطريق أو العمل: قل «السلام عليكم ورحمة الله» ثم أكمل حديثك."],
          sources: [
            SRC_ADAB,
            SRC_RIYADH,
            src("صحيح مسلم", "مسلم بن الحجاج", "كتاب السلام"),
          ],
          keywords: ["سلام", "تحية", "إفشاء"],
        }),
        lesson({
          id: "adab-salam-radd",
          chapterId: "salam",
          title: "رد السلام",
          definition: "إجابة تحية المسلم بمثلها أو بأحسن منها.",
          summary:
            "ردّ السلام واجب على الكفاية، ويتعيّن على المنفرد. والأفضل الزيادة: ورحمة الله وبركاته. ولا يكفي الصمت مع القدرة.",
          evidence:
            "قوله تعالى: ﴿وَإِذَا حُيِّيتُم بِتَحِيَّةٍ فَحَيُّوا بِأَحْسَنَ مِنْهَا أَوْ رُدُّوهَا﴾ النساء: 86.",
          preferred: "يجب رد السلام، والأفضل الزيادة في التحية.",
          notes: "إن سلّم جماعة ف suffices ردّ واحد منهم على المشهور في كثير من المذاهب؛ والحذر من تجاهل السلام عمدًا.",
          practicalSummary: "إذا سُلِّم عليك فردّ فورًا بصوت يُسمع السالم.",
          commonMistakes: ["التجاهل المتعمد", "الرد بإشارة فقط مع القدرة على اللفظ"],
          examples: ["إن قيل: السلام عليكم → الرد: وعليكم السلام ورحمة الله وبركاته."],
          sources: [SRC_ADAB, SRC_RIYADH, src("تفسير القرآن", "ابن كثير", "النساء: 86")],
          keywords: ["رد السلام", "تحية"],
        }),
        lesson({
          id: "adab-salam-istiqbal",
          chapterId: "salam",
          title: "السلام عند دخول البيت والمجلس",
          definition: "تقديم السلام عند دخول المنزل أو المجلس حتى لو كان فارغًا.",
          summary:
            "يُشرع السلام عند دخول البيت؛ قال تعالى: ﴿فَإِذَا دَخَلْتُم بُيُوتًا فَسَلِّمُوا عَلَىٰ أَنفُسِكُمْ﴾. وكذلك عند دخول المجلس خروجًا ودخولًا على ما ورد.",
          evidence:
            "الآية في النور: 61، وحديث أنس في السلام عند الدخول والخروج من المجلس في السنن.",
          preferred: "يُسنّ السلام عند دخول البيت والمجلس وعند الانصراف.",
          notes: "الاستئذان قبل الدخول واجب في بيوت الغير؛ والسلام بعد الإذن.",
          practicalSummary: "قبل دخول بيت غيرك: استأذن، ثم سلّم، ثم ادخل.",
          commonMistakes: ["الدخول بلا استئذان", "ترك السلام داخل البيت"],
          examples: ["طرق الباب، الاستئذان ثلاثًا، ثم السلام بعد الإذن."],
          sources: [SRC_ADAB, SRC_RIYADH],
          keywords: ["استئذان", "دخول", "بيت"],
        }),
        lesson({
          id: "adab-salam-rukban",
          chapterId: "salam",
          title: "من يبدأ بالسلام",
          definition: "أدب ترتيب ابتداء السلام بين الصغير والكبير والماشي والراكب.",
          summary:
            "يُسنّ أن يسلّم الصغير على الكبير، والماشي على القاعد، والقليل على الكثير، والراكب على الماشي، كما في الصحيح، تعليمًا للتواضع.",
          evidence: "حديث أبي هريرة في الصحيحين فيمن يبدأ بالسلام.",
          preferred: "يُعمل بترتيب ابتداء السلام الوارد في السنة.",
          notes: "إن خالف الترتيب فلا حرج في الرد؛ والمقصود التواضع لا المشاحنة.",
          practicalSummary: "إن كنت مارًا على جالسين فابدأ بالسلام.",
          commonMistakes: ["المشاحنة على من يبدأ", "ترك السلام جملة"],
          examples: ["شاب يمر بكبار جالسين فيبدأهم بالسلام."],
          sources: [
            SRC_ADAB,
            SRC_RIYADH,
            src("صحيح البخاري", "محمد بن إسماعيل البخاري", "كتاب الاستئذان"),
          ],
          keywords: ["ابتداء السلام"],
        }),
      ],
    ),
    chapter(
      "majlis",
      "باب آداب المجلس والحديث",
      2,
      "مجلس المسلم مكان ذكر وأدب: لا يؤذي جليسًا ولا ينتهك عرضًا.",
      "يُطلب حسن الاستماع، وترك التنمّر، وحفظ أسرار المجلس، والبعد عن الغيبة.",
      "قال ﷺ: «إذا كنتم ثلاثة فلا يتناجى اثنان دون الآخر» متفق عليه. ونهى عن الغيبة في الكتاب والسنة.",
      [
        lesson({
          id: "adab-majlis-istima",
          chapterId: "majlis",
          title: "حسن الاستماع في المجلس",
          definition: "إقبال المستمع على المتحدث بأدب دون مقاطعة مؤذية.",
          summary:
            "من الأدب الإنصات للمتحدث وعدم قطع كلامه بلا حاجة، وترك السخرية، وإعطاء كل ذي حق حقه في الكلام.",
          evidence: "أدب النبي ﷺ في الإنصات لأصحابه ثابت في السيرة والسنن.",
          preferred: "يُستحب حسن الاستماع وترك المقاطعة بلا مصلحة.",
          notes: "يجوز التنبيه الرفيق عند الخطأ العلمي أو الضرورة.",
          practicalSummary: "انظر إلى المتحدث، ولا ترفع صوت هاتفك في المجلس.",
          commonMistakes: ["المقاطعة المتكررة", "الانشغال بالهاتف أثناء الحديث"],
          examples: ["في درس علم: أنصت، واسأل بعد انتهاء الفقرة."],
          sources: [SRC_ADAB, SRC_RIYADH],
          keywords: ["مجلس", "استماع"],
        }),
        lesson({
          id: "adab-majlis-sirr",
          chapterId: "majlis",
          title: "حفظ سر المجلس",
          definition: "عدم إفشاء ما يُتداول في المجلس مما يُكره نشره.",
          summary:
            "المجالس بالأمانة؛ فلا يُنقل كلام الناس على وجه الإضرار. ويستثنى ما فيه مصلحة شرعية راجحة كالتحذير من ضرر محقق.",
          evidence: "حديث «إنما المجالس بالأمانة» عند أبي داود وغيره.",
          preferred: "يحرم إفشاء السر على وجه الإضرار بلا مسوّغ شرعي.",
          notes: "نقل المنكر لمن يقدر على تغييره ليس خيانة للأمانة.",
          practicalSummary: "ما سمعته في مجلس خاص لا تنشره في المجموعات.",
          commonMistakes: ["تصوير المجلس دون إذن", "نقل الخصومات للقيل والقال"],
          examples: ["صديق أخبرك بهمّ خاص → لا تذكره لغيره."],
          sources: [SRC_ADAB, SRC_RIYADH],
          keywords: ["سر", "أمانة المجلس"],
        }),
        lesson({
          id: "adab-majlis-ghiba",
          chapterId: "majlis",
          title: "تحريم الغيبة والنميمة",
          definition: "الغيبة ذكرك أخاك بما يكره، والنميمة نقل الكلام للإفساد.",
          summary:
            "الغيبة والنميمة من كبائر الآفات الاجتماعية. تُجتنب في المجالس والقنوات. والاستثناءات ضيقة كالتظلم والاستفتاء والنصيحة.",
          evidence:
            "قوله تعالى: ﴿وَلَا يَغْتَب بَّعْضُكُم بَعْضًا﴾ الحجرات: 12. وحديث مسلم في تعريف الغيبة.",
          preferred: "تحرم الغيبة والنميمة إلا في مواطن الاستثناء المعتبرة عند أهل العلم.",
          notes: "المزاح الجارح قد يدخل في الغيبة إن كُره.",
          practicalSummary: "إن بدأ المجلس بالغيبة فغيّر الموضوع أو انصرف.",
          commonMistakes: ["تسمية الغيبة «تحليل شخصية»", "النميمة بحجة الإصلاح بلا ضوابط"],
          examples: ["بدل ذكر عيب غائب: ادعُ له أو اسكت."],
          sources: [
            SRC_ADAB,
            SRC_RIYADH,
            src("صحيح مسلم", "مسلم بن الحجاج", "كتاب البر والصلة"),
          ],
          keywords: ["غيبة", "نميمة"],
        }),
        lesson({
          id: "adab-majlis-tanaaj",
          chapterId: "majlis",
          title: "النهي عن تناجي الاثنين دون الثالث",
          definition: "ترك مسارّة اثنين بحضور ثالث يُوحشه.",
          summary:
            "إذا كنتم ثلاثة فلا يتناجى اثنان دون صاحبهما؛ لما فيه من الإيحاش. وإن كانوا أكثر جاز مع مراعاة الأدب.",
          evidence: "حديث ابن مسعود في الصحيحين.",
          preferred: "يُكره أو يُمنع تناجي الاثنين دون الثالث بحسب الحال على ما قرره أهل العلم.",
          notes: "إن أَذِن الثالث أو كان الحديث لا يخصّه زال المحذور.",
          practicalSummary: "في جلسة ثلاثة أشخاص: لا تُسارّ أحدهم دون الآخر.",
          commonMistakes: ["الهمس الطويل أمام ثالث", "الضحك المتبادل بما يُشعر بالإقصاء"],
          examples: ["إن احتجت لحديث خاص: اخرجا معًا أو أجّلا الحديث."],
          sources: [SRC_ADAB, SRC_RIYADH, src("صحيح البخاري", "البخاري", "كتاب الاستئذان")],
          keywords: ["تناجي", "مجلس"],
        }),
      ],
    ),
    chapter(
      "taam",
      "باب آداب الطعام والشراب",
      3,
      "الأكل والشرب عبادتان إن صُحبتا باسم الله وحمدِه وتركِ الإسراف.",
      "يُشرع التسمية، والأكل باليمين، والاعتدال، وحمد الله بعد الطعام.",
      "قال ﷺ: «يا غلام سمّ الله، وكل بيمينك، وكل مما يليك» متفق عليه.",
      [
        lesson({
          id: "adab-taam-tasmiya",
          chapterId: "taam",
          title: "التسمية عند الطعام",
          definition: "قول بسم الله عند ابتداء الأكل أو الشرب.",
          summary:
            "تُسنّ التسمية عند الطعام؛ وإن نسيها في أوله قال: بسم الله أوله وآخره، كما ورد.",
          evidence: "حديث عمر بن أبي سلمة في الصحيحين، وحديث عائشة في التسمية عند النسيان.",
          preferred: "تُسنّ التسمية، ويُشرع تداركها عند النسيان.",
          notes: "ترك التسمية يفوّت بركة الطعام كما في بعض الروايات.",
          practicalSummary: "قبل أول لقمة: بسم الله.",
          commonMistakes: ["النسيان المتكرر بلا تدارك", "الاستهزاء بمن يسمّي"],
          examples: ["على المائدة: سمّ، ثم كل مما يليك."],
          sources: [SRC_ADAB, SRC_RIYADH, src("صحيح البخاري", "البخاري", "كتاب الأطعمة")],
          keywords: ["تسمية", "طعام"],
        }),
        lesson({
          id: "adab-taam-yamin",
          chapterId: "taam",
          title: "الأكل والشرب باليمين",
          definition: "استعمال اليد اليمنى في الأكل والشرب إلا لعذر.",
          summary:
            "يُشرع الأكل والشرب باليمين؛ والشرب أو الأكل بالشمال منهي عنه لغير عذر، لما ورد أن الشيطان يأكل ويشرب بشماله.",
          evidence: "حديث ابن عمر عند مسلم وغيره.",
          preferred: "يُسنّ اليمين، ويُكره الشمال بلا عذر.",
          notes: "المريض أو من بيده علة معذور.",
          practicalSummary: "أمسك الكأس واللقمة بيمينك.",
          commonMistakes: ["الاعتياد على الشمال بلا عذر"],
          examples: ["اشرب الماء بيمينك ولو كنت أعسر إن أمكن."],
          sources: [SRC_ADAB, SRC_RIYADH],
          keywords: ["يمين", "أكل"],
        }),
        lesson({
          id: "adab-taam-israf",
          chapterId: "taam",
          title: "ترك الإسراف في الطعام",
          definition: "الاعتدال في الأكل دون تبذير أو تخمة.",
          summary:
            "الإسراف منهي عنه. وأدب الشبع: ثلث للطعام وثلث للشراب وثلث للنفس كما في الترمذي. وإكرام الضيف لا يعني التبذير المحرّم.",
          evidence:
            "قوله تعالى: ﴿وَكُلُوا وَاشْرَبُوا وَلَا تُسْرِفُوا﴾ الأعراف: 31. وحديث المقدام في سنن الترمذي.",
          preferred: "يُكره الإسراف، ويُستحب الاعتدال.",
          notes: "رمي الطعام الصالح إضاعة مال.",
          practicalSummary: "خُذ قدر حاجتك، واحفظ بقايا الطعام الصالح.",
          commonMistakes: ["تكديس الأطباق ثم رميها", "المباهاة بكثرة الألوان بلا حاجة"],
          examples: ["وليمة: قدّر الضيوف، وتصدّق بالفائض الصالح."],
          sources: [SRC_ADAB, SRC_RIYADH, SRC_ZAD],
          keywords: ["إسراف", "اعتدال"],
        }),
        lesson({
          id: "adab-taam-hamd",
          chapterId: "taam",
          title: "حمد الله بعد الطعام",
          definition: "الثناء على الله بعد الفراغ من الأكل.",
          summary:
            "يُحمد الله بعد الطعام بأدعية واردة مثل: الحمد لله الذي أطعمنا وسقانا وجعلنا مسلمين.",
          evidence: "أحاديث الحمد بعد الطعام في السنن ورياض الصالحين.",
          preferred: "يُسنّ الحمد بعد الطعام.",
          notes: "لا يُشترط لفظ واحد إن أتى بالمعنى الوارد.",
          practicalSummary: "بعد آخر لقمة قل دعاء الحمد الوارد.",
          commonMistakes: ["الانصراف فورًا بلا حمد مع التذكّر"],
          examples: ["في المطعم أو المنزل: اختم بالحمد."],
          sources: [SRC_ADAB, SRC_RIYADH],
          keywords: ["حمد", "دعاء الطعام"],
        }),
      ],
    ),
    chapter(
      "walidayn",
      "باب بر الوالدين وصلة الرحم",
      4,
      "بر الوالدين من أعظم القربات، وصلة الرحم سبب للبركة في الرزق والعمر.",
      "يُطاع الوالدان في غير معصية، وتُوصل الرحم ولو بالسلام والدعاء.",
      "قال تعالى: ﴿وَقَضَىٰ رَبُّكَ أَلَّا تَعْبُدُوا إِلَّا إِيَّاهُ وَبِالْوَالِدَيْنِ إِحْسَانًا﴾ الإسراء: 23.",
      [
        lesson({
          id: "adab-birr-walidayn",
          chapterId: "walidayn",
          title: "بر الوالدين",
          definition: "الإحسان إلى الأبوين قولًا وعملًا ودعاءً.",
          summary:
            "بر الوالدين واجب عظيم، ويشمل اللين في القول، والنفقة عند الحاجة، والدعاء، وترك التأفيف. ولا طاعة لمخلوق في معصية الخالق.",
          evidence:
            "آية الإسراء: 23–24، وحديث ابن مسعود في أحب الأعمال: الصلاة لوقتها ثم بر الوالدين — متفق عليه.",
          preferred: "يجب بر الوالدين، ويحرم عقوقهما.",
          notes: "خلاف الوالدين في المباح يُدارى بالحسنى ما أمكن.",
          practicalSummary: "اتصلت اليوم بوالديك؟ افعل، واسأل عن حاجتهما.",
          commonMistakes: ["الجفاء بحجة الانشغال", "رفع الصوت عليهما"],
          examples: ["زيارة أسبوعية أو اتصال يومي مع دعاء لهما."],
          sources: [SRC_ADAB, SRC_RIYADH, src("صحيح البخاري", "البخاري", "كتاب الأدب")],
          keywords: ["بر", "والدين"],
        }),
        lesson({
          id: "adab-silat-rahim",
          chapterId: "walidayn",
          title: "صلة الرحم",
          definition: "الإحسان إلى الأقارب ووصلهم بما يُستطاع.",
          summary:
            "صلة الرحم واجبة في الجملة، وتكون بالزيارة والسلام والنفقة والدعاء. وقاطع الرحم متوعَّد. والصلة لا تشترط المماثلة دائمًا.",
          evidence:
            "حديث «من أحب أن يُبسط له في رزقه… فليصل رحمه» متفق عليه. وحديث «ليس الواصل بالمكافئ…».",
          preferred: "تجب صلة الرحم، وتحرم قطيعتها.",
          notes: "إن كان في الوصل ضرر محقق يُقدَّر بقدره مع عدم القطيعة التامة إن أمكن.",
          practicalSummary: "صل رحمك برسالة أو زيارة ولو قصرت.",
          commonMistakes: ["القطيعة لخلاف مالي", "الاكتفاء بتهنئة العيد فقط مع القدرة على أكثر"],
          examples: ["عم أو خال بعيد: رسالة دورية ودعاء."],
          sources: [SRC_ADAB, SRC_RIYADH],
          keywords: ["رحم", "صلة"],
        }),
        lesson({
          id: "adab-uqooq",
          chapterId: "walidayn",
          title: "تحريم العقوق",
          definition: "إيذاء الوالدين أو ترك حقوقهما بلا عذر.",
          summary:
            "العقوق من الكبائر. يشمل السب والضرب والهجر المؤذي ومنع النفقة الواجبة. والتوبة منه واجبة مع إصلاح الحال.",
          evidence: "أحاديث الكبائر في الصحيحين وفيها عقوق الوالدين.",
          preferred: "يحرم العقوق، ويجب التخلص منه بالتوبة والإحسان.",
          notes: "نصح الوالدين برفق ليس عقوقًا.",
          practicalSummary: "إن وقع تقصير فاعتذر اليوم وأحسن.",
          commonMistakes: ["تسمية العقوق «استقلالية»", "هجر الوالدين لسنوات"],
          examples: ["بعد خلاف: ارجع بسلام واعتذر."],
          sources: [SRC_ADAB, SRC_RIYADH],
          keywords: ["عقوق"],
        }),
        lesson({
          id: "adab-dua-walidayn",
          chapterId: "walidayn",
          title: "الدعاء للوالدين",
          definition: "سؤال الله الرحمة والمغفرة للأبوين.",
          summary:
            "من البر الدعاء لهما في الحياة وبعد الممات، خصوصًا الاستغفار والصدقة الجارية عنهما عند مشروعيته.",
          evidence: "قوله تعالى: ﴿وَقُل رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا﴾ الإسراء: 24.",
          preferred: "يُسنّ الإكثار من الدعاء للوالدين.",
          notes: "الدعاء لا يغني عن البر العملي في حياتهما.",
          practicalSummary: "اجعل في وردك اليومي دعاءً لوالديك.",
          commonMistakes: ["الاكتفاء بالدعاء مع الإساءة العملية"],
          examples: ["بعد كل صلاة: رب اغفر لي ولوالدي."],
          sources: [SRC_ADAB, SRC_RIYADH],
          keywords: ["دعاء", "والدين"],
        }),
      ],
    ),
    chapter(
      "jar",
      "باب حق الجار والضيف",
      5,
      "الجار له حق عظيم في الإسلام، والضيافة من شيم المؤمنين.",
      "يُكف الأذى عن الجار، ويُحسن إليه، ويُكرم الضيف.",
      "قال ﷺ: «ما زال جبريل يوصيني بالجار حتى ظننت أنه سيورثه» متفق عليه.",
      [
        lesson({
          id: "adab-jar-haqq",
          chapterId: "jar",
          title: "حق الجار",
          definition: "رعاية الجار بكف الأذى والإحسان إليه.",
          summary:
            "للجار حق في الإسلام عظيم: لا يُؤذى، ويُعان عند الحاجة، ويُشارك في الأفراح والأتراح بما يُستطاع.",
          evidence: "حديث الوصية بالجار في الصحيحين.",
          preferred: "يجب كف الأذى عن الجار، ويُستحب الإحسان إليه.",
          notes: "الجار يشمل المسلم وغيره في كف الأذى، مع تفاوت مراتب الإحسان.",
          practicalSummary: "لا ترفع صوتًا يؤذي جارك، وساعده عند الحاجة.",
          commonMistakes: ["الضوضاء الليلية", "رمي القمامة عند بابه"],
          examples: ["عند الطبخ الكثير: أهدِ جارك شيئًا يسيرًا."],
          sources: [SRC_ADAB, SRC_RIYADH],
          keywords: ["جار"],
        }),
        lesson({
          id: "adab-jar-adha",
          chapterId: "jar",
          title: "تحريم أذية الجار",
          definition: "منع كل ضرر يلحق الجار بلا حق.",
          summary:
            "من لا يأمن جاره بوائقه لا يدخل الجنة كما في الحديث. الأذية بالقول أو الفعل محرمة.",
          evidence: "حديث «والله لا يؤمن… من لا يأمن جاره بوائقه» متفق عليه.",
          preferred: "تحرم أذية الجار.",
          notes: "المطالبة بالحق برفق ليست أذية.",
          practicalSummary: "راجع عاداتك المنزلية إن اشتكى الجار بحق.",
          commonMistakes: ["الاستخفاف بشكاوى الجيران"],
          examples: ["خفض صوت التلفاز بعد العشاء."],
          sources: [SRC_ADAB, SRC_RIYADH, src("صحيح البخاري", "البخاري", "كتاب الأدب")],
          keywords: ["أذية الجار"],
        }),
        lesson({
          id: "adab-diyafa",
          chapterId: "jar",
          title: "إكرام الضيف",
          definition: "حسن استقبال الضيف وإطعامه بما تيسّر.",
          summary:
            "الضيافة من الإيمان. يُكرم الضيف يومه وليلته، والضيافة ثلاثة أيام، وما زاد فصدقة، على ما ورد.",
          evidence: "حديث أبي شريح في الصحيحين في الضيافة.",
          preferred: "يُسنّ إكرام الضيف، ويجب كف الأذى عنه.",
          notes: "لا يُكلَّف المضيف فوق طاقته.",
          practicalSummary: "استقبل ضيفك بوجه طلق وقدّم ما تيسّر.",
          commonMistakes: ["التكلّف المرهق", "إهمال الضيف"],
          examples: ["ماء وتمر وطيب كلام خير من تكلّف ثقيل."],
          sources: [SRC_ADAB, SRC_RIYADH],
          keywords: ["ضيف", "ضيافة"],
        }),
      ],
    ),
    chapter(
      "tariq",
      "باب آداب الطريق والأسواق",
      6,
      "الطريق له حق: غض البصر، وكف الأذى، ورد السلام، والأمر بالمعروف.",
      "يُترك الجلوس في الطرقات إلا مع أداء حق الطريق.",
      "قال ﷺ: «إياكم والجلوس في الطرقات…» متفق عليه.",
      [
        lesson({
          id: "adab-tariq-haqq",
          chapterId: "tariq",
          title: "حق الطريق",
          definition: "واجبات من جلس أو مرّ في الطريق تجاه المارة.",
          summary:
            "حق الطريق: غض البصر، وكف الأذى، ورد السلام، والأمر بالمعروف والنهي عن المنكر.",
          evidence: "حديث أبي سعيد في الصحيحين.",
          preferred: "يجب أداء حق الطريق على من جلس فيه.",
          notes: "إعاقة الطريق بلا حاجة من الأذى.",
          practicalSummary: "لا تسدّ الممر بسيارتك أو جلوسك.",
          commonMistakes: ["التحديق المؤذي", "رمي المخلفات في الشارع"],
          examples: ["إن جلست على الرصيف فاترك ممرًا واضحًا."],
          sources: [SRC_ADAB, SRC_RIYADH, src("صحيح البخاري", "البخاري", "كتاب المظالم")],
          keywords: ["طريق"],
        }),
        lesson({
          id: "adab-tariq-adha",
          chapterId: "tariq",
          title: "إماطة الأذى عن الطريق",
          definition: "إزالة ما يؤذي المارة من الطريق.",
          summary:
            "إماطة الأذى صدقة وشعبة من الإيمان. تشمل إزالة الزجاج والحفر الظاهرة وما يعطل الناس.",
          evidence: "حديث «الإيمان بضع وسبعون شعبة… وإماطة الأذى عن الطريق» رواه مسلم.",
          preferred: "تُسنّ إماطة الأذى، وقد تجب إذا ترتب ضرر محقق مع القدرة.",
          notes: "لا تُعرّض نفسك لخطر لإزالة أذى.",
          practicalSummary: "إن رأيت زجاجًا في الممر فأزله بحذر إن أمنت.",
          commonMistakes: ["ترك الأذى مع القدرة واليسر"],
          examples: ["إزاحة حجر في ممر المشاة."],
          sources: [SRC_ADAB, SRC_RIYADH],
          keywords: ["إماطة الأذى"],
        }),
        lesson({
          id: "adab-suq",
          chapterId: "tariq",
          title: "آداب السوق",
          definition: "الصدق في البيع، وترك الغش، والرفق في الزحام.",
          summary:
            "السوق موضع فتنة للسان والمعاملة. يُطلب الصدق وبيان العيب وترك الحلف الكاذب والرحمة بالضعفاء في الزحام.",
          evidence: "أحاديث النهي عن الغش في البيع في الصحيح، وآداب الذكر في السوق.",
          preferred: "يجب الصدق وتحريم الغش، ويُستحب ذكر الله في السوق.",
          notes: "تفاصيل البيوع في كتاب البيوع؛ وهنا الأدب العام.",
          practicalSummary: "إن بعت فبيّن العيب، ولا تضغط على المارة.",
          commonMistakes: ["إخفاء العيب", "رفع الصوت بالخصومة في السوق"],
          examples: ["بائع يوضّح عيب السلعة قبل العقد."],
          sources: [SRC_ADAB, SRC_RIYADH, SRC_ZAD],
          keywords: ["سوق", "صدق"],
        }),
      ],
    ),
    chapter(
      "sidq",
      "باب الصدق والأمانة وحفظ العهد",
      7,
      "الصدق والأمانة أساس المروءة والعقود.",
      "يُؤمر بالصدق، وتُحفظ الأمانات، وتُوفى العهود.",
      "قال تعالى: ﴿يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَكُونُوا مَعَ الصَّادِقِينَ﴾ التوبة: 119.",
      [
        lesson({
          id: "adab-sidq",
          chapterId: "sidq",
          title: "وجوب الصدق",
          definition: "مطابقة الخبر للواقع وترك الكذب.",
          summary:
            "الصدق يهدي إلى البر، والكذب يهدي إلى الفجور. ويُستثنى ما رخّص فيه أهل العلم من المعاريض والحرب والإصلاح بين الناس بشروطه.",
          evidence: "حديث «عليكم بالصدق…» رواه مسلم.",
          preferred: "يجب الصدق، ويحرم الكذب إلا في الرخص المبيّنة عند أهل العلم.",
          notes: "المزاح الكاذب مذموم.",
          practicalSummary: "إن لم تستطع الوفاء بوعد فلا تعد.",
          commonMistakes: ["الكذب «المزاح» المتكرر", "الوعود الكاذبة"],
          examples: ["بدل اختلاق عذر: اعتذر بصدق."],
          sources: [SRC_ADAB, SRC_RIYADH],
          keywords: ["صدق"],
        }),
        lesson({
          id: "adab-amana",
          chapterId: "sidq",
          title: "أداء الأمانة",
          definition: "حفظ ما اؤتمن عليه الإنسان وردّه لأهله.",
          summary:
            "الأمانة من صفات المؤمنين. تشمل الودائع والوظائف وأسرار العمل. وخيانة الأمانة علامة نفاق عملي.",
          evidence:
            "قوله تعالى: ﴿إِنَّ اللَّهَ يَأْمُرُكُمْ أَن تُؤَدُّوا الْأَمَانَاتِ إِلَىٰ أَهْلِهَا﴾ النساء: 58.",
          preferred: "يجب أداء الأمانة وتحرم الخيانة.",
          notes: "تأخير رد الوديعة بلا عذر من التقصير.",
          practicalSummary: "إن استُودعت مالًا فردّه كما هو.",
          commonMistakes: ["استخدام مال الغير بلا إذن", "إفشاء بيانات العمل"],
          examples: ["زميل أعطاك جهازًا → أعده سالمًا."],
          sources: [SRC_ADAB, SRC_RIYADH],
          keywords: ["أمانة"],
        }),
        lesson({
          id: "adab-ahd",
          chapterId: "sidq",
          title: "الوفاء بالعهد",
          definition: "التزام المسلم بما عاهد عليه في غير معصية.",
          summary:
            "الوفاء بالعهد من صفات الأبرار. ونقض العهد بلا عذر شرعي مذموم. والعقود المالية لها تفصيل في فقه المعاملات.",
          evidence: "قوله تعالى: ﴿يَا أَيُّهَا الَّذِينَ آمَنُوا أَوْفُوا بِالْعُقُودِ﴾ المائدة: 1.",
          preferred: "يجب الوفاء بالعهد والعقد الصحيح.",
          notes: "العهد على معصية لا يُوفى.",
          practicalSummary: "اكتب مواعيدك والتزاماتك والتزم بها.",
          commonMistakes: ["إخلاف المواعيد بلا إبلاغ", "نقض الاتفاقات لأتفه سبب"],
          examples: ["وعدت بمساعدة → أنجز أو اعتذر مبكرًا."],
          sources: [SRC_ADAB, SRC_RIYADH],
          keywords: ["عهد", "وفاء"],
        }),
      ],
    ),
    chapter(
      "nawm",
      "باب آداب النوم والاستئذان",
      8,
      "للنوم آداب: الذكر، والوضوء، والنوم على الجنب الأيمن، والاستئذان في الأوقات الثلاثة.",
      "يُستحب ذكر النوم، ويُشرع الاستئذان في الأوقات الواردة في سورة النور.",
      "آيات الاستئذان في النور: 58، وأحاديث أذكار النوم في الصحيح.",
      [
        lesson({
          id: "adab-nawm-dhikr",
          chapterId: "nawm",
          title: "أذكار النوم",
          definition: "الأذكار المشروعة قبل النوم.",
          summary:
            "يُستحب الوضوء عند النوم، والنوم على اليمين، وقراءة ما ورد كآية الكرسي والمعوذات، والدعاء الوارد.",
          evidence: "أحاديث أذكار النوم في الصحيحين ورياض الصالحين.",
          preferred: "تُسنّ أذكار النوم والهيئة الواردة.",
          notes: "لا يُجعل الذكر واجبًا لم يثبت وجوبه.",
          practicalSummary: "قبل النوم: توضأ إن تيسّر، واذكر الله بما ورد.",
          commonMistakes: ["النوم على عادة سيئة مع ترك الذكر بلا عذر"],
          examples: ["اقرأ آية الكرسي ثم نم على يمينك."],
          sources: [SRC_ADAB, SRC_RIYADH],
          keywords: ["نوم", "أذكار"],
        }),
        lesson({
          id: "adab-istidhan-awqat",
          chapterId: "nawm",
          title: "الاستئذان في الأوقات الثلاثة",
          definition: "استئذان الخدم والصغار في أوقات الخلوة الواردة.",
          summary:
            "أوجب الله الاستئذان قبل الفجر، وعند الظهيرة، وبعد العشاء؛ حماية للخصوصية داخل البيوت.",
          evidence: "قوله تعالى في النور: 58.",
          preferred: "يجب العمل بآية الاستئذان في الأوقات الثلاثة.",
          notes: "التفاصيل المنزلية تُراعى بالعرف الحسن مع النص.",
          practicalSummary: "علّم أهل بيتك الاستئذان في هذه الأوقات.",
          commonMistakes: ["دخول غرف النوم فجأة في هذه الأوقات"],
          examples: ["بعد العشاء: طرق الباب قبل الدخول."],
          sources: [SRC_ADAB, SRC_RIYADH, src("تفسير القرآن", "ابن كثير", "النور: 58")],
          keywords: ["استئذان", "خصوصية"],
        }),
        lesson({
          id: "adab-istidhan-thalath",
          chapterId: "nawm",
          title: "الاستئذان ثلاثًا",
          definition: "طلب الإذن بالدخول ثلاث مرات ثم الانصراف إن لم يُؤذن.",
          summary:
            "الاستئذان ثلاثًا؛ فإن لم يُؤذن له انصرف. ولا ينظر في بيت الغير من ثقب الباب.",
          evidence: "حديث أبي موسى وحديث سعد في الصحيحين.",
          preferred: "يُسنّ الاستئذان ثلاثًا، ويجب ترك التجسّس.",
          notes: "الطرق العنيف من سوء الأدب.",
          practicalSummary: "اطرق ثلاثًا بهدوء؛ إن لم يُجب فارجع.",
          commonMistakes: ["الدخول مع السكوت الطويل", "النظر من فتحات الباب"],
          examples: ["زيارة صديق: استأذن وانصرف إن لم يُؤذن."],
          sources: [SRC_ADAB, SRC_RIYADH, src("صحيح البخاري", "البخاري", "كتاب الاستئذان")],
          keywords: ["استئذان ثلاثًا"],
        }),
      ],
    ),
  ],
};

function dedupeSources(sources) {
  if (!Array.isArray(sources)) return [];
  const seen = new Set();
  const out = [];
  for (const s of sources) {
    const key = `${s.book}|${s.author}|${s.ref}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function enrichLesson(l) {
  const title = l.title;
  const sources = dedupeSources(l.sources);
  const scholarlyNotes = l.scholarlyNotes || l.madhhabNotes || "";
  const examples =
    Array.isArray(l.examples) && l.examples.length
      ? l.examples
      : l.practicalSummary
        ? [`تطبيق عملي: ${String(l.practicalSummary).slice(0, 220)}`]
        : [];
  const commonMistakes =
    Array.isArray(l.commonMistakes) && l.commonMistakes.length
      ? l.commonMistakes
      : l.notes
        ? [`يُراعى التنبيه التالي لتفادي الخلط: ${String(l.notes).slice(0, 220)}`]
        : [];
  const reviewQuestions =
    Array.isArray(l.reviewQuestions) && l.reviewQuestions.length
      ? l.reviewQuestions
      : [
          `عرّف مسألة «${title}» باختصار.`,
          "ما الحكم المختصر المعتمد في هذه المسألة؟",
          "اذكر دليلًا أو مرجعًا تعتمد عليه في فهم المسألة.",
        ];

  let summary = l.summary || "";
  if (summary.length < 120 && l.definition) {
    summary = `${l.definition} ${summary}`.trim();
  }

  return {
    ...l,
    summary,
    sources,
    scholarlyNotes,
    examples,
    commonMistakes,
    reviewQuestions,
    needsReview: false,
  };
}

const raw = JSON.parse(readFileSync(booksPath, "utf8"));
if (!Array.isArray(raw.books)) throw new Error("books.json: missing books[]");

raw.books = raw.books.filter((b) => b.id !== "adab");
raw.books = raw.books.map((book) => ({
  ...book,
  chapters: (book.chapters || []).map((ch) => ({
    ...ch,
    sources: dedupeSources(ch.sources),
    lessons: (ch.lessons || []).map(enrichLesson),
  })),
}));

raw.books.push(adabBook);
raw.books.sort((a, b) => a.order - b.order);
raw.version = 5;
raw.generatedAt = new Date().toISOString();
raw.madhhab = raw.madhhab || "hanbali";
raw.notes =
  "كتالوج حنبلّي تعليمي: مصادر في آخر كل مسألة فقط. أُضيف كتاب الآداب الشرعية وأُثريت المسائل بحقول تعليمية.";

writeFileSync(booksPath, `${JSON.stringify(raw, null, 2)}\n`, "utf8");

const lessons = raw.books.reduce(
  (n, b) => n + b.chapters.reduce((m, c) => m + c.lessons.length, 0),
  0,
);
console.log(
  JSON.stringify(
    {
      books: raw.books.length,
      chapters: raw.books.reduce((n, b) => n + b.chapters.length, 0),
      lessons,
      adabChapters: adabBook.chapters.length,
      adabLessons: adabBook.chapters.reduce((n, c) => n + c.lessons.length, 0),
    },
    null,
    2,
  ),
);
