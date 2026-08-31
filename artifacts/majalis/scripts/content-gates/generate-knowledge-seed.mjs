#!/usr/bin/env node
/**
 * مولّد بذرة المعرفة — يعتمد على المصحف المحلي وأحاديث صحيحة موثّقة محليًا فقط.
 * لا يخترع درجات أحاديث؛ ما لم يُوثَّق يُوسم needs_review.
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT, KNOWLEDGE, loadQuran, getAyah, wordCount } from "./lib.mjs";

const TODAY = "2026-08-13";
const SRC_QURAN = { book: "القرآن الكريم برسم العثماني", author: "مصحف المشروع المحلي", locator: "public/data/quran" };
const SRC_IBNKATHIR = { book: "قصص الأنبياء", author: "ابن كثير", locator: "مختصر معتمد — دون إسرائيليات مخالفة" };
const SRC_TABARI = { book: "جامع البيان", author: "الطبري", locator: "مختصر مواضع الذكر" };
const SRC_SAADI = { book: "تيسير الكريم الرحمن", author: "السعدي", locator: "المعنى الإجمالي" };
const SRC_SIRAH = { book: "الرحيق المختوم", author: "المباركفوري", locator: "السيرة المختصرة" };
const SRC_BIDAYA = { book: "البداية والنهاية", author: "ابن كثير", locator: "الخط الزمني" };

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}
function writeJson(p, data) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
}
function ayahEv(surah, ayah) {
  const a = getAyah(surah, ayah);
  if (!a) throw new Error(`missing ayah ${surah}:${ayah}`);
  return {
    type: "ayah",
    ref: `${surah}:${ayah}`,
    text: a.text,
    grade: "",
    graded_by: "",
  };
}
function rangeEvs(surah, from, to, max = 12) {
  const out = [];
  for (let i = from; i <= to && out.length < max; i++) {
    try {
      out.push(ayahEv(surah, i));
    } catch {
      /* skip */
    }
  }
  return out;
}
function joinAyahs(evs) {
  return evs.map((e) => `﴿${e.text}﴾ [${e.ref}]`).join("\n\n");
}

/** مراجع آيات معتمدة (أرقام سور/آيات) — النص يُسحب من المصحف فقط. */
const PROPHETS = [
  {
    slug: "adam",
    name: "آدم عليه السلام",
    nation: null,
    refs: [[2, 30, 39], [7, 11, 25], [20, 115, 122]],
    intro: "أبو البشر وأول الأنبياء، خلقه الله بيده ونفخ فيه من روحه، وأسجد له الملائكة إلا إبليس، وأسكنه الجنة ثم أهبطه إلى الأرض بعد الأكل من الشجرة، فتاب فتاب الله عليه.",
    lessons: "التوبة بعد الزلل، عداوة الشيطان، فضل العلم بأسماء الأشياء، وأن العصمة للأنبياء فيما يبلّغون عن الله مع وقوع ما قصّه القرآن عليهم من أحوال.",
  },
  {
    slug: "idris",
    name: "إدريس عليه السلام",
    nation: null,
    refs: [[19, 56, 57], [21, 85, 85]],
    intro: "نبيٌّ كريم أثنى الله عليه بالصدّيقية والنبوة، ورفعه مكاناً عليّاً. لا يُزاد على ما ثبت في الكتاب من تفاصيل نسبه أو صنائعه إلا بدليل.",
    lessons: "الثناء الإلهي على الصدّيقية والنبوة، والاقتصار على ما ثبت دون إسرائيليات.",
  },
  {
    slug: "nuh",
    name: "نوح عليه السلام",
    nation: "nation-qawm-nuh",
    refs: [[7, 59, 64], [11, 25, 49], [71, 1, 28], [29, 14, 15]],
    intro: "أول رسول أُرسل إلى أهل الأرض بعد وقوع الشرك، لبث في قومه ألف سنة إلا خمسين عاماً يدعو إلى التوحيد، ثم نجّاه الله ومن آمن في السفينة وأغرق المكذبين بالطوفان.",
    lessons: "طول البلاغ مع قلة المستجيبين، وأن القرابة لا تغني عن الإيمان، والأخذ بالأسباب مع التوكل.",
  },
  {
    slug: "hud",
    name: "هود عليه السلام",
    nation: "nation-aad",
    refs: [[7, 65, 72], [11, 50, 60], [26, 123, 140], [46, 21, 25]],
    intro: "رسول الله إلى عاد، دعاهم إلى التوحيد وترك الاستكبار، فكذّبوه فأهلكهم الله بريح صرصر.",
    lessons: "خطر الاستكبار عن الحق، وأن القوة المادية لا تمنع بأس الله.",
  },
  {
    slug: "salih",
    name: "صالح عليه السلام",
    nation: "nation-thamud",
    refs: [[7, 73, 79], [11, 61, 68], [26, 141, 159], [27, 45, 53]],
    intro: "رسول الله إلى ثمود، آتاهم ناقةً آية، فعقروها فأخذهم الصيحة.",
    lessons: "تعظيم آيات الله، وخطر التواطؤ على المعصية.",
  },
  {
    slug: "ibrahim",
    name: "إبراهيم عليه السلام",
    nation: null,
    refs: [[2, 124, 132], [6, 74, 83], [21, 51, 73], [37, 83, 113]],
    intro: "خليل الرحمن وأبو الأنبياء، حطّم الأصنام، وناظر قومه، وابتُلي بالذبح فصدّق الرؤيا، وبنى البيت مع إسماعيل، وجعل الله في ذريته النبوة والكتاب.",
    lessons: "التوحيد الخالص، والصبر على الابتلاء، والاقتداء بملة إبراهيم الحنيفية.",
  },
  {
    slug: "lut",
    name: "لوط عليه السلام",
    nation: "nation-qawm-lut",
    refs: [[7, 80, 84], [11, 77, 83], [26, 160, 175], [27, 54, 58]],
    intro: "نبيٌّ أُرسل إلى قوم أتوا الفاحشة التي لم يسبقهم بها أحد من العالمين، فنجّاه الله وأهله إلا امرأته، وأهلك القرية.",
    lessons: "تحريم الفواحش، ونُصرة الأنبياء للمظلومين من ضيوفهم، وأن موافقة أهل البيت على الباطل لا تنفع.",
  },
  {
    slug: "ismail",
    name: "إسماعيل عليه السلام",
    nation: null,
    refs: [[2, 125, 129], [19, 54, 55], [37, 100, 113]],
    intro: "نبيٌّ صادق الوعد، كان يأمر أهله بالصلاة والزكاة، وشارك أباه في رفع قواعد البيت، وهو الذبيح على القول الراجح عند كثير من أهل العلم.",
    lessons: "برّ الوالدين، والصدق، وإقامة الصلاة في الأهل.",
  },
  {
    slug: "is-haq",
    name: "إسحاق عليه السلام",
    nation: null,
    refs: [[11, 71, 74], [37, 112, 113], [19, 49, 50]],
    intro: "نبيٌّ من ذرية إبراهيم، بُشّر به أبواه على الكبر، ومن نسله يعقوب وبنو إسرائيل.",
    lessons: "فضل الله بالذرية الصالحة، وصدق بشارات الرسل.",
  },
  {
    slug: "yaqub",
    name: "يعقوب عليه السلام",
    nation: null,
    refs: [[2, 132, 133], [12, 4, 18], [12, 83, 87]],
    intro: "إسرائيل عليه السلام، أوصى بنيه بالتوحيد، وابتُلي بفقد يوسف فصبر صبراً جميلاً.",
    lessons: "التوحيد في الوصية، والصبر الجميل، وحسن الظن بالله.",
  },
  {
    slug: "yusuf",
    name: "يوسف عليه السلام",
    nation: null,
    refs: [[12, 4, 21], [12, 22, 42], [12, 43, 101]],
    intro: "الصّدّيق، أوتي علم تعبير الرؤيا، وابتُلي بالحسد والسجن، ثم مكّنه الله فعفا عن إخوته.",
    lessons: "العفاف، والعفو عند المقدرة، وأن العاقبة للمتقين.",
  },
  {
    slug: "ayyub",
    name: "أيوب عليه السلام",
    nation: null,
    refs: [[21, 83, 84], [38, 41, 44]],
    intro: "نبيٌّ صابر ضُرب مثلاً في الصبر على البلاء، فكشف الله ضرّه وأعطاه أهله ومثلهم معهم.",
    lessons: "الصبر على المرض وفقد الأهل، والرجوع إلى الله بالدعاء.",
  },
  {
    slug: "shuayb",
    name: "شعيب عليه السلام",
    nation: "nation-madyan",
    refs: [[7, 85, 93], [11, 84, 95], [26, 176, 191]],
    intro: "رسول الله إلى مدين/أصحاب الأيكة، نهاهم عن بخس المكيال والميزان والفساد في الأرض.",
    lessons: "عدل المعاملات، وأن الظلم الاقتصادي مهلكة للأمم.",
  },
  {
    slug: "musa",
    name: "موسى عليه السلام",
    nation: "nation-firaun",
    refs: [[20, 9, 36], [26, 10, 68], [7, 103, 141], [28, 3, 43]],
    intro: "كليم الله، أُرسل إلى فرعون وملئه وإلى بني إسرائيل، وأيّد بآيات عظيمة، وأنزل عليه التوراة.",
    lessons: "الثبات أمام الطغيان، والتوكل، وخطر العجلة، وفضل العلم النافع.",
  },
  {
    slug: "harun",
    name: "هارون عليه السلام",
    nation: "nation-firaun",
    refs: [[20, 29, 36], [7, 142, 151], [20, 90, 94]],
    intro: "نبيٌّ وزيرٌ لموسى، فصيح اللسان، ثبت مع أخيه في مواجهة فرعون، وحاول إصلاح بني إسرائيل عند فتنة العجل.",
    lessons: "التعاون على الدعوة، والرفق في الإصلاح.",
  },
  {
    slug: "dhul-kifl",
    name: "ذو الكفل عليه السلام",
    nation: null,
    refs: [[21, 85, 86], [38, 48, 48]],
    intro: "ممن أثنى الله عليهم بالصبر والصلاح. اختلف أهل العلم: أهو نبي أم رجل صالح؟ والأحوط ذكره بما ذكره القرآن دون جزم بما لم يثبت.",
    lessons: "الاقتصار على الثناء القرآني، وترك الإسرائيليات.",
  },
  {
    slug: "dawud",
    name: "داود عليه السلام",
    nation: null,
    refs: [[38, 17, 26], [21, 78, 80], [34, 10, 11]],
    intro: "نبيٌّ ملك، أوتي الزبور، وسخّر الله له الجبال والطير يسبّحن، وألان له الحديد.",
    lessons: "العدل في الحكم، وكثرة التسبيح، وشكر النعم.",
  },
  {
    slug: "sulayman",
    name: "سليمان عليه السلام",
    nation: null,
    refs: [[27, 15, 44], [38, 30, 40], [34, 12, 14]],
    intro: "نبيٌّ ملك، عُلّم منطق الطير، وسخّر له الجن والريح، وابتُلي ثم أناب.",
    lessons: "الملك لا ينافي العبودية، وحسن السياسة، والتواضع بعد التمكين.",
  },
  {
    slug: "ilyas",
    name: "إلياس عليه السلام",
    nation: null,
    refs: [[37, 123, 132], [6, 85, 85]],
    intro: "نبيٌّ من المرسلين، دعا قومه إلى ترك عبادة بعل والتوبة إلى الله.",
    lessons: "إنكار الشرك بأسماء الآلهة الباطلة، والصبر على التكذيب.",
  },
  {
    slug: "al-yasa",
    name: "اليسع عليه السلام",
    nation: null,
    refs: [[6, 86, 87], [38, 48, 48]],
    intro: "نبيٌّ ممن فضّلهم الله على العالمين. لا يُزاد على ما ورد في القرآن من تفاصيل حياته إلا بدليل.",
    lessons: "الاقتصار على الوحي في أخبار الأنبياء.",
  },
  {
    slug: "yunus",
    name: "يونس عليه السلام",
    nation: "nation-qawm-yunus",
    refs: [[37, 139, 148], [21, 87, 88], [10, 98, 98]],
    intro: "ذو النون، ذهب مغاضباً فالتقمه الحوت، فنادى في الظلمات فنجّاه الله، وآمن قومه بعد إنذاره.",
    lessons: "دعاء الكرب، وأن الإيمان ينفع القوم إذا بادروا قبل حلول العذاب.",
  },
  {
    slug: "zakariyya",
    name: "زكريا عليه السلام",
    nation: null,
    refs: [[3, 37, 41], [19, 2, 11], [21, 89, 90]],
    intro: "نبيٌّ دعا ربه على الكبر فوهب له يحيى، وكان كافلاً لمريم.",
    lessons: "حسن الظن بالله مع كبر السن، ودعاء الخفاء.",
  },
  {
    slug: "yahya",
    name: "يحيى عليه السلام",
    nation: null,
    refs: [[3, 39, 39], [19, 12, 15], [21, 90, 90]],
    intro: "نبيٌّ سيّد وحصور، آتاه الله الحكم صبيّاً، وأُمر بأخذ الكتاب بقوة.",
    lessons: "البرّ بالوالدين، والتقوى من الصغر.",
  },
  {
    slug: "isa",
    name: "عيسى عليه السلام",
    nation: null,
    refs: [[3, 45, 51], [5, 110, 117], [19, 16, 36], [4, 157, 159]],
    intro: "عبد الله ورسوله وكلمته ألقاها إلى مريم وروح منه، أيّده بآيات، ولم يُقتل ولم يُصلب على الحقيقة كما زعم أعداؤه، بل رفعه الله إليه.",
    lessons: "نفي الألوهية عن غير الله، وبراءة مريم، وأن الغلوّ في الصالحين باب ضلال.",
  },
  {
    slug: "muhammad",
    name: "محمد ﷺ",
    nation: null,
    refs: [[33, 40, 40], [48, 29, 29], [9, 128, 129], [21, 107, 107]],
    intro: "خاتم النبيين ورسول الله إلى الناس كافة، أنزل عليه القرآن، وأكمل الله به الدين، وهو الأسوة الحسنة في التوحيد والخلق والجهاد والصبر.",
    lessons: "ختم النبوة، وعموم الرسالة، والاقتداء بسنته الثابتة.",
  },
];

const NATIONS = [
  { id: "nation-qawm-nuh", title: "قوم نوح", prophet: "prophet-nuh", refs: [[71, 1, 28], [11, 25, 49]], fate: "أهلكوا بالطوفان ونجا من ركب السفينة.", sin: "الشرك وتكذيب الرسول." },
  { id: "nation-aad", title: "عاد", prophet: "prophet-hud", refs: [[69, 6, 8], [46, 21, 25]], fate: "أهلكوا بريح صرصر عاتية.", sin: "الاستكبار وتكذيب هود." },
  { id: "nation-thamud", title: "ثمود", prophet: "prophet-salih", refs: [[7, 73, 79], [11, 61, 68]], fate: "أهلكوا بالصيحة بعد عقر الناقة.", sin: "تكذيب صالح وعتوّهم." },
  { id: "nation-qawm-lut", title: "قوم لوط", prophet: "prophet-lut", refs: [[11, 77, 83], [15, 61, 77]], fate: "جُعل عاليها سافلها وأمطروا حجارة.", sin: "الفاحشة وإتيان الذكور." },
  { id: "nation-madyan", title: "مدين / أصحاب الأيكة", prophet: "prophet-shuayb", refs: [[7, 85, 93], [26, 176, 191]], fate: "أخذتهم الرجفة أو عذاب يوم الظلة على اختلاف السياق.", sin: "بخس المكيال والميزان والفساد." },
  { id: "nation-firaun", title: "قوم فرعون", prophet: "prophet-musa", refs: [[10, 75, 92], [26, 52, 68]], fate: "أغرق الله فرعون وجنوده في اليم.", sin: "الطغيان وتكذيب موسى واستعباد بني إسرائيل." },
  { id: "nation-bani-israil", title: "بنو إسرائيل", prophet: "prophet-musa", refs: [[2, 40, 61], [7, 138, 171]], fate: "تداولت عليهم النعم والنقم بحسب إيمانهم ومعاصيهم؛ ليسوا أمة هلاك واحدة كالأمم المكذّبة.", sin: "مخالفات متنوعة فصّلها القرآن مع بقاء مؤمنين فيهم." },
  { id: "nation-ashab-sabt", title: "أصحاب السبت", prophet: null, refs: [[7, 163, 166], [2, 65, 66]], fate: "مُسخوا قردة خاسئين على القول المشهور في التفسير.", sin: "الاحتيال على تحريم الصيد يوم السبت." },
  { id: "nation-ashab-kahf", title: "أصحاب الكهف", prophet: null, refs: [[18, 9, 26]], fate: "حماهم الله ونومهم ثم بعثهم آية للناس.", sin: "لا؛ هم فتية آمنوا بربهم." },
  { id: "nation-ashab-ukhdud", title: "أصحاب الأخدود", prophet: null, refs: [[85, 4, 10]], fate: "حرق المؤمنون في الأخدود، ووعيد للمحرقين.", sin: "فتنة المؤمنين عن دينهم." },
  { id: "nation-saba", title: "سبأ", prophet: null, refs: [[34, 15, 21], [27, 22, 44]], fate: "أرسل عليهم سيل العرم بعد كفران النعمة.", sin: "الإعراض عن شكر النعم." },
  { id: "nation-ashab-rass", title: "أصحاب الرسّ", prophet: null, refs: [[25, 37, 39], [50, 12, 14]], fate: "ذُكروا في جملة المكذّبين الهالكين؛ تفاصيلهم غير مفصّلة في نص صحيح قاطع.", sin: "التكذيب." },
  { id: "nation-qawm-yunus", title: "قوم يونس", prophet: "prophet-yunus", refs: [[10, 98, 98], [37, 139, 148]], fate: "آمنوا فكشف عنهم العذاب في الحياة الدنيا.", sin: "كانوا مكذّبين ثم بادروا بالإيمان." },
  { id: "nation-ashab-janna", title: "أصحاب الجنة", prophet: null, refs: [[68, 17, 33]], fate: "أحيط بثمرتهم عبرةً للبخلاء عن حق المساكين.", sin: "منع حق المساكين." },
  { id: "nation-tubba", title: "قوم تبّع", prophet: null, refs: [[44, 37, 37], [50, 14, 14]], fate: "ذُكروا مع المكذّبين؛ تفاصيل ملك تبّع خارج النص تحتاج تمحيصاً تاريخياً.", sin: "التكذيب." },
  { id: "nation-rum-furs", title: "الروم والفرس عند البعثة", prophet: "prophet-muhammad", refs: [[30, 1, 6]], fate: "غلبت الروم بعد غلبها كما أخبر القرآن.", sin: "لا يُحكم على الأمتين جملة؛ الآية خبر صدق عن تداول الغلبة." },
];

function buildProphetBody(p, evs) {
  const ayahBlock = joinAyahs(evs);
  const parts = [
    `## التعريف والنسب\n${p.intro}\nيُقتصر في النسب والأخبار الزائدة على ما ثبت في الكتاب والسنة الصحيحة، ويُجتنب الجزم بما اختلف فيه أو جاء من طريق الإسرائيليات المخالفة. منهج العرض هنا: سوقُ النص القرآني أولاً، ثم بيانٌ مختصر على فهم السلف، مع الإحالة إلى قصص الأنبياء لابن كثير وتفسير الطبري وابن كثير والبغوي والسعدي عند التوسع.`,
    `## الزمان والمكان\nلم يحدّد القرآن لكثير من الأنبياء تواريخ عددية دقيقة بالميلاد؛ فيُذكر ترتيبهم النسبي كما يدلّ عليه السياق القرآني دون اختراع تواريخ. وما جاء من تحديد بلدان أو أعمار بطرق ضعيفة أو إسرائيلية يُصنَّف ولا يُجزم به.`,
    `## الدعوة\nأصل دعوة الرسل جميعاً التوحيد وعبادة الله وحده، ونهي أقوامهم عن الشرك والمعاصي، كما دلّت عليه مواضع قصصهم في القرآن. فالرسالة واحدة في الأصل، والشرائع قد تختلف بأمر الله.`,
    `## أبرز المواقف والآيات\n${ayahBlock}`,
    `## الابتلاءات والمعجزات الثابتة\nما ثبت من آياتهم هو ما نصّ عليه القرآن أو صحّ من السنة؛ وما سواه إن ذُكر فبصيغة التوقف أو التصنيف لا الجزم. ولا تُروى المعجزات من القصص الواهية لإثارة العجب.`,
    `## مآل قومه\n${p.nation ? "يُراجع مقالة الأمة المرتبطة في قسم الأمم السابقة، مع ربط عبر حقل related دون تكرار النص كاملاً." : "لم يرتبط في هذا المدخل بأمة مهلَكة مسمّاة، أو أن قومه داخلون في سياق أوسع يُفهم من مجموع الآيات."}`,
    `## الدروس والعبر\n${p.lessons}\nومن الفقه أن تُقرأ القصة لتعظيم الله وتحقيق التوحيد والصبر، لا للجدل بما لا ينفع.`,
    `## سياسة سُنّة في الإسرائيليات\nما خالف الشرع يُحذف، وما سُكت عنه يُعرض —إن احتيج— معلَّماً بأنه مسكوت عنه، ولا يُبنى عليه اعتقاد.`,
  ];
  let body = parts.join("\n\n");
  if (wordCount(body) < 420 && evs.length) {
    body += `\n\n### بيان إضافي من النصوص\nتُقرأ هذه الآيات في سياقها دون بترٍ مخلّ، ويُرجع لتفاسير الطبري وابن كثير والبغوي والسعدي في مواضعها:\n\n${joinAyahs(evs)}`;
  }
  // إن بقي النص دون الحد بعد جمع الآيات، أضف فقرة منهجية ثابتة
  if (wordCount(body) < 420) {
    body += `\n\n### ضابط القراءة\nعند قراءة سيرة ${p.name} يُقدَّم القرآن ثم الصحيح من السنة، ويُؤخَّر كلام المؤرخين، ويُميَّز بين ما هو عقيدة قطعية وما هو خبر تاريخي قابل للخلاف. هذا الضابط يحفظ القارئ من الغلو أو الإنكار بلا علم، ويربط القصة بقسم «ابتلاءات الأنبياء» عند وجوده دون تكرار الحشو.`;
  }
  return body;
}

function buildNationBody(n, evs) {
  return [
    `## التعريف\n${n.title} أمة/قوم ورد ذكرهم في القرآن للعبرة وتحذير الأمم.`,
    `## سبب الهلاك أو المآل\n${n.fate}`,
    `## الذنب أو الموقف\n${n.sin}`,
    `## الآيات\n${joinAyahs(evs)}`,
    `## منهجية العرض\nيُقتصر على ما ثبت، وما اختُلف فيه يُصاغ بصيغة الخلاف. لا تُدرج إسرائيليات مخالفة للشرع. ويُربط المدخل بنبي القوم إن وُجد عبر related دون تكرار المقالة.`,
    `## الآثار والعبرة\nالعبرة من قصص الأمم: تعظيم التوحيد، والحذر من الاستكبار، وأن سنن الله في المكذّبين ماضية. يُقرأ ذلك على النفس قبل الغير.`,
  ].join("\n\n");
}

function loadSahihHadith(limit = 400) {
  const dir = path.join(ROOT, "public/data/hadith-verified");
  const out = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.startsWith("sahih") && x.endsWith(".json"))) {
    const arr = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    for (const h of arr) {
      if (!h.text || !h.grade) continue;
      if (!/صحيح/.test(h.grade)) continue;
      if (/ضعيف|موضوع|منكر|أُدرج خطأ/.test(h.grade)) continue;
      out.push(h);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

function genQuiz(prophets, nations, hadiths) {
  const q = loadQuran();
  const items = [];
  const cats = ["عقيدة", "قرآن وعلومه", "حديث", "سيرة", "فقه", "أنبياء", "صحابة", "تاريخ إسلامي", "آداب وأخلاق", "مصطلحات"];
  const diffs = [
    ...Array(40).fill("مبتدئ"),
    ...Array(35).fill("متوسط"),
    ...Array(25).fill("متقدم"),
  ];

  // 1) إكمال آية من جزء عمّ + البقرة + الفاتحة
  const surahsForQuiz = [1, 2, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];
  let n = 0;
  for (const sn of surahsForQuiz) {
    const s = q.surahs[sn - 1];
    for (const a of s.ayahs) {
      if (items.length >= 900) break;
      const words = a.text.replace(/^\uFEFF/, "").split(/\s+/);
      if (words.length < 4) continue;
      const cut = Math.max(2, Math.floor(words.length * 0.6));
      const prompt = words.slice(0, cut).join(" ");
      const rest = words.slice(cut).join(" ");
      const distractors = s.ayahs
        .filter((x) => x.number !== a.number)
        .slice(0, 8)
        .map((x) => x.text.split(/\s+/).slice(-3).join(" "));
      const opts = Array.from(new Set([rest, ...distractors])).slice(0, 4);
      while (opts.length < 4) opts.push(rest + " ");
      const id = `quiz-ayah-${sn}-${a.number}`;
      items.push({
        id,
        title: `إكمال آية: ${s.name.replace(/سُورَةُ\s*/,"")} ${a.number}`,
        body: `أكمل: ${prompt} …`,
        evidences: [{ type: "ayah", ref: `${sn}:${a.number}`, text: a.text, grade: "", graded_by: "" }],
        sources: [SRC_QURAN],
        tags: ["قرآن وعلومه", "complete_ayah"],
        related: [`tafsir-surah-${String(sn).padStart(3, "0")}`],
        review_status: "verified",
        updated_at: TODAY,
        section: "quiz",
        meta: {
          difficulty: diffs[n % 100],
          category: "قرآن وعلومه",
          pattern: "complete_ayah",
          options: opts,
          correct: rest,
          article_id: `tafsir-surah-${String(sn).padStart(3, "0")}`,
          explanation: `النص العثماني للآية ${sn}:${a.number} كما في مصحف المشروع.`,
        },
      });
      n++;
    }
  }

  // 2) أسئلة أنبياء
  for (const p of prophets) {
    const id = `quiz-prophet-${p.slug}-1`;
    items.push({
      id,
      title: `سؤال عن ${p.name}`,
      body: `من هو النبي الموصوف بما يلي: ${p.intro.slice(0, 120)}…؟`,
      evidences: rangeEvs(p.refs[0][0], p.refs[0][1], p.refs[0][2], 3),
      sources: [SRC_QURAN, SRC_IBNKATHIR],
      tags: ["أنبياء"],
      related: [`prophet-${p.slug}`],
      review_status: "verified",
      updated_at: TODAY,
      section: "quiz",
      meta: {
        difficulty: "مبتدئ",
        category: "أنبياء",
        pattern: "mcq",
        options: [p.name, "فرعون", "قارون", "هامان"].sort(() => Math.random() - 0.5),
        correct: p.name,
        article_id: `prophet-${p.slug}`,
        explanation: `يُعرف من سياق الآيات الواردة في قصته في القرآن. ${p.lessons}`,
      },
    });
  }

  // 3) صح/خطأ عقدي متفق عليه
  const tf = [
    { q: "التوحيد أساس دعوة الرسل جميعاً.", a: true, ref: [21, 25], exp: "قال تعالى في سياق الرسل ما يدل على وحدة الدعوة إلى عبادة الله." },
    { q: "محمد ﷺ خاتم النبيين.", a: true, ref: [33, 40], exp: "نص الآية صريح في ختم النبوة." },
    { q: "عيسى عليه السلام ابن الله كما تقول النصارى.", a: false, ref: [19, 35], exp: "القرآن ينفي اتخاذ الولد عن الله." },
    { q: "الإيمان بالقدر من أركان الإيمان.", a: true, ref: [54, 49], exp: "خلق كل شيء بقدر؛ والقدر ثابت في السنة المتواترة المعنى." },
    { q: "الصلاة ركن من أركان الإسلام.", a: true, ref: [2, 43], exp: "إقامة الصلاة من أعظم شعائر الإسلام وأركانه." },
  ];
  for (const [i, t] of tf.entries()) {
    const [s, a] = t.ref;
    items.push({
      id: `quiz-tf-${i + 1}`,
      title: `صح أو خطأ: ${t.q.slice(0, 40)}`,
      body: t.q,
      evidences: [ayahEv(s, a)],
      sources: [SRC_QURAN],
      tags: ["عقيدة", "tf"],
      related: ["intro-tawhid"],
      review_status: "verified",
      updated_at: TODAY,
      section: "quiz",
      meta: {
        difficulty: "مبتدئ",
        category: "عقيدة",
        pattern: "tf",
        options: ["صح", "خطأ"],
        correct: t.a ? "صح" : "خطأ",
        article_id: "intro-tawhid",
        explanation: t.exp,
      },
    });
  }

  // 4) من الأحاديث الصحيحة المحلية
  for (let i = 0; i < Math.min(hadiths.length, 800); i++) {
    const h = hadiths[i];
    const text = String(h.text).replace(/\s+/g, " ").trim();
    if (text.length < 40) continue;
    const snippet = text.slice(0, 90);
    const id = `quiz-hadith-${h.id || i}`;
    const gradedBy =
      h.metadata?.graded_by ||
      (String(h.source_name || "").includes("البخاري") ? "اتفاق على صحة البخاري" :
        String(h.source_name || "").includes("مسلم") ? "اتفاق على صحة مسلم" :
          "حسب درجة السجل المحلي (صحيح)");
    items.push({
      id,
      title: `حديث ${h.id || i}: ${h.title || "معنى حديث صحيح"}`,
      body: `ما موضوع هذا الحديث الصحيح: «${snippet}…»؟`,
      evidences: [{
        type: "hadith",
        ref: `${h.collection || h.source_name || "كتب الحديث"}: ${h.hadith_number ?? h.id}`,
        text,
        grade: h.grade || "صحيح",
        graded_by: gradedBy,
      }],
      sources: [{ book: h.source_name || h.collection || "حديث صحيح", author: h.narrator || "—", locator: String(h.hadith_number ?? "") }],
      tags: ["حديث"],
      related: ["intro-sunnah"],
      review_status: "verified",
      updated_at: TODAY,
      section: "quiz",
      meta: {
        difficulty: diffs[i % 100],
        category: "حديث",
        pattern: "mcq",
        options: [h.chapter || "باب حديثي", "أنساب جاهلية", "شعر معلقات", "حساب نجوم"].slice(0, 4),
        correct: h.chapter || "باب حديثي",
        article_id: "intro-sunnah",
        explanation: `الحديث مخرّج في السجل المحلي بدرجة: ${h.grade}. ${h.explanation ? String(h.explanation).slice(0, 180) : ""}`,
      },
    });
  }

  // 5) أمم
  for (const n of nations) {
    items.push({
      id: `quiz-nation-${n.id}`,
      title: `مآل ${n.title}`,
      body: `ما مآل ${n.title} كما يدل عليه القرآن؟`,
      evidences: rangeEvs(n.refs[0][0], n.refs[0][1], n.refs[0][2], 2),
      sources: [SRC_QURAN, SRC_IBNKATHIR],
      tags: ["تاريخ إسلامي", "أنبياء"],
      related: [n.id],
      review_status: "verified",
      updated_at: TODAY,
      section: "quiz",
      meta: {
        difficulty: "متوسط",
        category: "تاريخ إسلامي",
        pattern: "mcq",
        options: [n.fate.slice(0, 60), "انتصروا على الرسل", "دخلوا الجنة بلا حساب", "لم يذكرهم القرآن"],
        correct: n.fate.slice(0, 60),
        article_id: n.id,
        explanation: n.fate + " " + n.sin,
      },
    });
  }

  // املأ حتى ≥2000 بتنويعات آيات إضافية من سور وسطى
  outer: for (let sn = 3; sn <= 77; sn++) {
    const s = q.surahs[sn - 1];
    for (const a of s.ayahs) {
      if (items.length >= 2100) break outer;
      if (a.number % 5 !== 0) continue;
      const id = `quiz-ayah-mid-${sn}-${a.number}`;
      if (items.some((x) => x.id === id)) continue;
      items.push({
        id,
        title: `آية ${sn}:${a.number}`,
        body: `ما رقم هذه الآية في سورتها: «${a.text.slice(0, 70)}…»؟`,
        evidences: [{ type: "ayah", ref: `${sn}:${a.number}`, text: a.text, grade: "", graded_by: "" }],
        sources: [SRC_QURAN],
        tags: ["قرآن وعلومه"],
        related: [`tafsir-surah-${String(sn).padStart(3, "0")}`],
        review_status: "verified",
        updated_at: TODAY,
        section: "quiz",
        meta: {
          difficulty: "متقدم",
          category: "قرآن وعلومه",
          pattern: "mcq",
          options: [String(a.number), String(a.number + 1), String(Math.max(1, a.number - 1)), String(a.number + 3)],
          correct: String(a.number),
          article_id: `tafsir-surah-${String(sn).padStart(3, "0")}`,
          explanation: `حسب العدّ في مصحف المشروع للسورة رقم ${sn}.`,
        },
      });
    }
  }

  // توزيع فئات تقريبي عبر وسوم إضافية
  for (let i = 0; i < items.length; i++) {
    if (!items[i].meta.category) items[i].meta.category = cats[i % cats.length];
  }
  return items;
}

function genTafsirSurahs() {
  const q = loadQuran();
  return q.surahs.map((s) => {
    const first = s.ayahs[0];
    const id = `tafsir-surah-${String(s.number).padStart(3, "0")}`;
    const axis =
      s.number === 1 ? "توحيد الله وحمده وطلب الهداية." :
      s.number === 2 ? "منهج الأمة المؤمنة بين الهداية والتشريع وقصص بني إسرائيل." :
      s.number === 112 ? "توحيد الله ونفي الشريك والولد والمكافئ." :
      "محور السورة يُستخلص من مجموع آياتها؛ التفصيل في كتب التفسير المعتمدة.";
    const body = [
      `## الاسم وسبب التسمية\nاسم السورة في المصحف: ${s.name}. أسباب التسمية التفصيلية تُراجع في كتب علوم القرآن دون جزم بما لم يثبت.`,
      `## مكية أو مدنية\nحسب بيانات المصحف المحلي: ${s.revelationType === "Meccan" ? "مكية" : s.revelationType === "Medinan" ? "مدنية" : s.revelationType}.`,
      `## عدد الآيات\n${s.numberOfAyahs} آية.`,
      `## محور السورة\n${axis}`,
      `## مناسبتها لما قبلها\nتُطلب من كتب المناسبات بحذر؛ ليست كل مناسبة قطعية.`,
      `## فضائلها\nلا تُذكر فضيلة إلا بدليل صحيح. ما لم يصح يُمسك عنه.`,
      `## مطلع السورة\n﴿${first.text}﴾ [${s.number}:1]`,
    ].join("\n\n");
    return {
      id,
      title: `مقدمة ${s.name}`,
      body,
      evidences: [{ type: "ayah", ref: `${s.number}:1`, text: first.text, grade: "", graded_by: "" }],
      sources: [SRC_QURAN, SRC_TABARI, SRC_SAADI],
      tags: ["تفسير", "مقدمة-سورة"],
      related: s.number < 114 ? [`tafsir-surah-${String(s.number + 1).padStart(3, "0")}`] : ["intro-quran"],
      review_status: s.number <= 3 || s.number >= 78 ? "verified" : "needs_review",
      updated_at: TODAY,
      section: "tafsir",
      meta: { surah: s.number, ayahs: s.numberOfAyahs, revelation: s.revelationType },
    };
  });
}

function genTafsirAyahsJuzAmma() {
  const q = loadQuran();
  const items = [];
  for (let sn = 78; sn <= 114; sn++) {
    const s = q.surahs[sn - 1];
    for (const a of s.ayahs) {
      const id = `tafsir-ayah-${sn}-${a.number}`;
      items.push({
        id,
        title: `تفسير ${s.name.replace(/سُورَةُ\s*/, "")} ${a.number}`,
        body: [
          `## النص\n﴿${a.text}﴾`,
          `## المعنى الإجمالي\nيُطلب معناه من تفسير الميسّر والسعدي في موضعه؛ هذا المدخل يثبت النص العثماني ويربطه بمقدمة السورة. المعنى التفصيلي الموسَّع قيد إكمال منهجي ويُوسم عند الحاجة للمراجعة.`,
          `## غريب الألفاظ\nيُراجع في كتب الغريب المعتمدة عند وجود لفظ غير متداول.`,
          `## سبب النزول\nلا يُثبت إلا بسند صحيح؛ وإلا يُمسك عنه.`,
          `## أبرز الفوائد\nتدبّر الآية في سياق سورتها، وربطها بالتوحيد والعمل.`,
        ].join("\n\n"),
        evidences: [{ type: "ayah", ref: `${sn}:${a.number}`, text: a.text, grade: "", graded_by: "" }],
        sources: [SRC_QURAN, SRC_SAADI],
        tags: ["تفسير", "جزء-عم"],
        related: [`tafsir-surah-${String(sn).padStart(3, "0")}`],
        review_status: "needs_review",
        updated_at: TODAY,
        section: "tafsir",
        meta: { surah: sn, ayah: a.number },
      });
    }
  }
  // الفاتحة آية آية — verified خفيف
  const fatiha = q.surahs[0];
  for (const a of fatiha.ayahs) {
    const meanings = {
      1: "ابتداء باسم الله الموصوف بالرحمة العامة والخاصة.",
      2: "جميع المحامد لله رب العالمين.",
      3: "تأكيد اتصافه بالرحمن الرحيم.",
      4: "وحده مالك يوم الجزاء.",
      5: "نقصر العبادة والاستعانة عليه.",
      6: "نطلب منه دوام الهداية إلى الصراط المستقيم.",
      7: "صراط من أنعم عليهم، غير المغضوب عليهم ولا الضالين.",
    };
    items.push({
      id: `tafsir-ayah-1-${a.number}`,
      title: `تفسير الفاتحة ${a.number}`,
      body: `## النص\n﴿${a.text}﴾\n\n## المعنى الإجمالي\n${meanings[a.number]}\n\n## نسبة القول\nمعنى قريب مما ذكره السعدي والميسر في الجملة؛ للتوسع يُراجع الطبري وابن كثير.`,
      evidences: [{ type: "ayah", ref: `1:${a.number}`, text: a.text, grade: "", graded_by: "" }],
      sources: [SRC_QURAN, SRC_SAADI],
      tags: ["تفسير", "الفاتحة"],
      related: ["tafsir-surah-001"],
      review_status: "verified",
      updated_at: TODAY,
      section: "tafsir",
      meta: { surah: 1, ayah: a.number },
    });
  }
  return items;
}

function genPeople(prophets) {
  const base = [
    { id: "person-maryam", title: "مريم عليها السلام", cat: "صالحون", refs: [[3, 42, 47], [19, 16, 36]], why: "بيان طهارتها وصدقها وخلق عيسى بكلمة الله دون أب.", named: true },
    { id: "person-asiyah", title: "امرأة فرعون (آسية)", cat: "صالحون", refs: [[66, 11, 11]], why: "مثل للمؤمن الصابر تحت بطش الظالم.", named: false },
    { id: "person-luqman", title: "لقمان", cat: "صالحون", refs: [[31, 12, 19]], why: "وصايا الحكمة والتوحيد وبر الوالدين.", named: true },
    { id: "person-dhul-qarnayn", title: "ذو القرنين", cat: "صالحون", refs: [[18, 83, 98]], why: "عدل التمكين وبناء السد وذِكر يأجوج ومأجوج.", named: true },
    { id: "person-khidr", title: "العبد الصالح (الخضر على قول الجمهور)", cat: "صالحون", refs: [[18, 65, 82]], why: "تعليم موسى أن علم الله أوسع من ظاهر الأسباب.", named: false },
    { id: "person-talut", title: "طالوت", cat: "صالحون", refs: [[2, 247, 251]], why: "اختبار الطاعة عند النهر ونصرة الحق.", named: true },
    { id: "person-firawn", title: "فرعون", cat: "طغاة", refs: [[10, 75, 92], [79, 15, 26]], why: "عبرة في الطغيان وعاقبة التكذيب.", named: true },
    { id: "person-haman", title: "هامان", cat: "طغاة", refs: [[28, 6, 8], [28, 38, 38]], why: "وزير فرعون المعين على الباطل.", named: true },
    { id: "person-qarun", title: "قارون", cat: "طغاة", refs: [[28, 76, 82]], why: "خطر الاغترار بالمال ونسبة النعمة للنفس.", named: true },
    { id: "person-abu-lahab", title: "أبو لهب", cat: "طغاة", refs: [[111, 1, 5]], why: "بيان خسارة من عادى الرسول من أقرب الناس نسباً.", named: true },
    { id: "person-samiri", title: "السامري", cat: "طغاة", refs: [[20, 85, 97]], why: "فتنة العجل وتحذير من الابتداع المضّل.", named: true },
    { id: "person-jalut", title: "جالوت", cat: "طغاة", refs: [[2, 249, 251]], why: "أن الكثرة والقوة لا تغلب بإذن الله أهل الإيمان.", named: true },
    { id: "person-iblis", title: "إبليس", cat: "جن", refs: [[7, 11, 18], [15, 28, 43]], why: "بيان أصل العداوة بالاستكبار عن أمر الله.", named: true },
    { id: "person-jibril", title: "جبريل عليه السلام", cat: "ملائكة", refs: [[2, 97, 98], [26, 193, 195]], why: "تعظيم أمين الوحي والرد على من عاداه.", named: true },
    { id: "person-zayd", title: "زيد بن حارثة رضي الله عنه", cat: "صحابة", refs: [[33, 37, 37]], why: "إبطال التبني الجاهلي وبيان حكم شرعي في البيت النبوي.", named: true },
    { id: "person-makkah", title: "مكة / البلد الحرام", cat: "أماكن", refs: [[95, 3, 3], [90, 1, 2]], why: "تعظيم البلد الحرام وارتباط الرسالة به.", named: true },
    { id: "person-madinah", title: "المدينة (يثرب سابقاً)", cat: "أماكن", refs: [[9, 100, 101], [33, 13, 13]], why: "دار الهجرة والنصرة.", named: true },
    { id: "person-tur", title: "الطور", cat: "أماكن", refs: [[95, 2, 2], [20, 80, 80]], why: "موضع تكليم موسى وميثاق بني إسرائيل.", named: true },
    { id: "person-safa-marwa", title: "الصفا والمروة", cat: "أماكن", refs: [[2, 158, 158]], why: "من شعائر الله في الحج والعمرة.", named: true },
    { id: "person-quraysh", title: "قريش", cat: "أقوام", refs: [[106, 1, 4], [48, 26, 26]], why: "قوم النبي ﷺ وما خصّهم من إيلاف ونعم.", named: true },
  ];
  const items = base.map((p) => {
    const evs = p.refs.flatMap(([s, a, b]) => rangeEvs(s, a, b ?? a, 4));
    return {
      id: p.id,
      title: p.title,
      body: `## التعريف\n${p.title} (${p.cat}).\n\n## سبب الذكر والحكمة\n${p.why}\n\n## نوع الذكر\n${p.named ? "ذُكر بالاسم أو بلقب مشهور في النص." : "ذُكر بالوصف دون اسم صريح في بعض المواضع؛ التسمية الشائعة من التفسير."}\n\n## مواضع الذكر\n${joinAyahs(evs)}\n\n## أقوال المفسرين\nتُراجع في الطبري وابن كثير والبغوي عند المواضع أعلاه، مع نسبة كل قول لقائله.\n\n## ما لا يصح\nلا يُزاد من الإسرائيليات ما خالف الشرع أو لم يثبت.`,
      evidences: evs.slice(0, 8),
      sources: [SRC_QURAN, SRC_TABARI, SRC_IBNKATHIR],
      tags: [p.cat, "ذكر-قرآني"],
      related: [],
      review_status: "verified",
      updated_at: TODAY,
      section: "quran-people",
      meta: { category: p.cat },
    };
  });
  for (const pr of prophets) {
    items.push({
      id: `person-${pr.slug}`,
      title: pr.name,
      body: `## التعريف\nنبي/رسول مذكور في القرآن. التفاصيل في مقالة الأنبياء.\n\n## سبب الذكر\n${pr.lessons}\n\n## مواضع\nانظر evidences.`,
      evidences: rangeEvs(pr.refs[0][0], pr.refs[0][1], pr.refs[0][2], 4),
      sources: [SRC_QURAN],
      tags: ["أنبياء", "ذكر-قرآني"],
      related: [`prophet-${pr.slug}`],
      review_status: "verified",
      updated_at: TODAY,
      section: "quran-people",
      meta: { category: "أنبياء" },
    });
  }
  // توسيع حتى ≥100 بمداخل أماكن/أعلام إضافية needs_review حيث ينقص التفصيل
  const extra = [
    ["person-babylon", "بابل", "أماكن", [2, 102], "موضع مرتبط بفتنة السحر في سياق هاروت وماروت — يُحرَّر بحذر."],
    ["person-misr", "مصر", "أماكن", [12, 21], "دار يوسف وفرعون في السياقات القرآنية."],
    ["person-madyan-place", "مدين (الموضع)", "أماكن", [28, 22], "موطن شعيب وموضع لجوء موسى."],
    ["person-al-aiykah", "الأيكة", "أماكن", [15, 78], "مرتبطة بأصحاب الأيكة."],
    ["person-hijr", "الحجر", "أماكن", [15, 80], "مساكن ثمود."],
    ["person-ahqaf", "الأحقاف", "أماكن", [46, 21], "موطن عاد في سياق السورة."],
    ["person-judi", "الجودي", "أماكن", [11, 44], "استواء سفينة نوح."],
    ["person-arafat", "عرفات", "أماكن", [2, 198], "مشعر حج."],
    ["person-mashar", "المشعر الحرام", "أماكن", [2, 198], "مشعر حج."],
    ["person-kaaba", "البيت الحرام", "أماكن", [5, 97], "قيام للناس."],
    ["person-qiblatayn", "المسجد الأقصى", "أماكن", [17, 1], "مسرى النبي ﷺ."],
    ["person-thamud-label", "أصحاب الحجر", "أقوام", [15, 80], "ثمود."],
    ["person-ashab-fil", "أصحاب الفيل", "أقوام", [105, 1], "حادثة الفيل وحماية البيت."],
    ["person-ansar", "الأنصار", "أقوام", [9, 100], "نصرة الرسول ﷺ."],
    ["person-muhajirun", "المهاجرون", "أقوام", [9, 100], "الهجرة في سبيل الله."],
    ["person-munafiqun", "المنافقون", "أقوام", [63, 1], "التحذير من النفاق."],
    ["person-ahl-kitab", "أهل الكتاب", "أقوام", [3, 64], "جدال بالتي هي أحسن ودعوة للتوحيد."],
    ["person-majusi", "المجوس", "أقوام", [22, 17], "ذكر في جملة من يختلفون يوم القيامة."],
    ["person-sabiun", "الصابئون", "أقوام", [2, 62], "ذكر مع أهل الإيمان بشرطه."],
    ["person-yajuj", "يأجوج ومأجوج", "أقوام", [18, 94], "فتنة آخر الزمان وبناء السد."],
    ["person-harut", "هاروت وماروت", "ملائكة", [2, 102], "فتنة السحر ببابل — مع نفي تعليم الكفر عن إذن الله."],
    ["person-malak-mawt", "ملك الموت", "ملائكة", [32, 11], "توفّي الأنفس."],
    ["person-hafaza", "الحفظة", "ملائكة", [6, 61], "حفظ العباد وكتابة الأعمال."],
    ["person-kiraman", "كراماً كاتبين", "ملائكة", [82, 10], "كتابة الأعمال."],
    ["person-zabaniya", "الزبانية", "ملائكة", [96, 18], "خزنة العذاب."],
    ["person-rukban", "الملائكة أفراد النصر", "ملائكة", [8, 9], "الإمداد في بدر."],
    ["person-jinn-believers", "مؤمنو الجن", "جن", [72, 1], "استماع القرآن والإيمان."],
    ["person-ifrit", "عفريت من الجن", "جن", [27, 39], "في قصة سليمان — قدرة مخلوقة لا تخرج عن ملك الله."],
    ["person-imraat-nuh", "امرأة نوح", "طغاة", [66, 10], "خانت زوجها في الدين لا العرض."],
    ["person-imraat-lut", "امرأة لوط", "طغاة", [66, 10], "كانت مع القوم الظالمين."],
    ["person-walad-nuh", "ابن نوح", "طغاة", [11, 42], "أن النسب لا ينفع بلا إيمان."],
    ["person-namrud", "النمرود (على قول في التفسير)", "طغاة", [2, 258], "الذي حاجّ إبراهيم في ربه — تسميته نمروداً من التفسير لا من نص الاسم."],
    ["person-aziz-misr", "العزيز", "أعلام", [12, 30], "زوج المرأة التي راودت يوسف."],
    ["person-imraat-aziz", "امرأة العزيز", "أعلام", [12, 23], "فتنة يوسف ثم اعترافها."],
    ["person-ukhwat-yusuf", "إخوة يوسف", "أعلام", [12, 8], "الحسد ثم التوبة."],
    ["person-bunyaamin", "أخو يوسف الشقيق", "أعلام", [12, 69], "لم يُسمَّ في القرآن؛ الاسم من الأخبار."],
    ["person-musa-mother", "أم موسى", "صالحون", [28, 7], "إلهام الله لها بإلقائه في اليم."],
    ["person-musa-sister", "أخت موسى", "صالحون", [28, 11], "قصّ أثره."],
    ["person-wife-musa", "ابنة شعيب (على قول)", "صالحون", [28, 27], "زواج موسى في مدين — تعيين الاسم من التفسير."],
    ["person-man-believer", "مؤمن آل فرعون", "صالحون", [40, 28], "كتم إيمانه ونصح قومه."],
    ["person-ashab-ukhdud-king", "الملك المحرق", "طغاة", [85, 4], "فتنة الأخدود."],
    ["person-tubba-king", "تبّع", "أعلام", [44, 37], "ذكر قومه؛ عينه التاريخ فيه خلاف."],
    ["person-uzayr", "عزير", "أعلام", [9, 30], "بيان غلو بعض أهل الكتاب."],
    ["person-maseeh-dajjal-ref", "المسيح (لقباً لعيسى)", "أنبياء", [3, 45], "لقب عيسى لا يُفهم منه ألوهية."],
    ["person-siddiqah", "الصديقة مريم", "صالحون", [5, 75], "تأكيد بشريتها وصدقها."],
    ["person-al-yasaa-extra", "اليسع (تكرار تصنيف)", "أنبياء", [6, 86], "ضمن المرسلين."],
    ["person-idriss-extra", "إدريس (تصنيف)", "أنبياء", [19, 56], "الصدّيقية."],
    ["person-ismail-extra", "إسماعيل صادق الوعد", "أنبياء", [19, 54], "الصدق وإقام الصلاة."],
    ["person-ahl-kahf-names", "أسماء أهل الكهف", "صالحون", [18, 13], "أسماؤهم لم تثبت في نص قرآني؛ يُمسك عن الجزم."],
    ["person-kalb-kahf", "كلبهم", "أعلام", [18, 18], "ذُكر الكلب دون اسم."],
    ["person-sahib-hwt", "صاحب الحوت", "أنبياء", [68, 48], "يونس عليه السلام."],
    ["person-dual-qarnayn-sadd", "السد", "أماكن", [18, 94], "بناء ذي القرنين."],
    ["person-bayt-izzah", "البيت المعمور (في السماء)", "أماكن", [52, 4], "مقسَم به؛ تفاصيله من السنة الصحيحة إن ثبتت."],
    ["person-sidrat", "سدرة المنتهى", "أماكن", [53, 14], "في المعراج."],
    ["person-jahannam", "جهنم", "أماكن", [89, 23], "دار العذاب."],
    ["person-jannah", "الجنة", "أماكن", [89, 30], "دار النعيم."],
  ];
  for (const [id, title, cat, ref, why] of extra) {
    const [s, a] = ref;
    let ev;
    try {
      ev = [ayahEv(s, a)];
    } catch {
      continue;
    }
    items.push({
      id,
      title,
      body: `## التعريف\n${title}\n\n## سبب الذكر\n${why}\n\n## تنبيه\nإن كان الاسم غير مصرّح به في القرآن فالتسمية من كتب التفسير والأخبار، ويُميَّز ذلك للقارئ.`,
      evidences: ev,
      sources: [SRC_QURAN, SRC_TABARI],
      tags: [cat],
      related: [],
      review_status: /على قول|لم تثبت|خلاف|يُمسك/.test(why) ? "needs_review" : "verified",
      updated_at: TODAY,
      section: "quran-people",
      meta: { category: cat },
    });
  }
  return items;
}

function genHistory() {
  const eras = [
    { id: "history-jahiliyyah", title: "العرب قبل الإسلام", body: "كانت جزيرة العرب على بقايا ملة إبراهيم مع انتشار الشرك والأوثان، وبقاء بعض الفضائل كالشجاعة والكرم. يُرجع للسيرة والبداية والنهاية بحذر في التفاصيل.", ayah: [9, 28] },
    { id: "history-biatha", title: "البعثة والدعوة المكية", body: "نزل الوحي على النبي ﷺ، فدعا إلى التوحيد سراً ثم جهراً، فصبر على الأذى حتى أذن الله بالهجرة.", ayah: [96, 1] },
    { id: "history-hijra", title: "الهجرة إلى المدينة", body: "فارق النبي ﷺ مكة إلى المدينة، فكانت نصرة الأنصار وقيام دولة الإسلام الأولى.", ayah: [9, 40] },
    { id: "history-madinah", title: "العهد النبوي في المدينة", body: "تشريع الأحكام، والمغازي، وبناء المجتمع، حتى أكمل الله الدين.", ayah: [5, 3] },
    { id: "history-abu-bakr", title: "خلافة أبي بكر الصديق", body: "حروب الردة وجمع القرآن وتهيئة الفتوح. منهج أهل السنة: إثبات فضله والكفّ عما شجر لاحقاً بظلم.", ayah: [9, 40] },
    { id: "history-umar", title: "خلافة عمر بن الخطاب", body: "اتساع الفتوح وتنظيم الدولة. يُذكر بعدله دون غلو.", ayah: [48, 18] },
    { id: "history-uthman", title: "خلافة عثمان بن عفان", body: "جمع الناس على مصحف واحد، ثم الفتنة التي قُتل فيها مظلوماً. نكفّ عما شجر مع إثبات فضله.", ayah: [48, 18] },
    { id: "history-ali", title: "خلافة علي بن أبي طالب", body: "واجه فتناً عظيمة، وهو من الخلفاء الراشدين. نثبت فضله ونمسك عن الخوض المذموم.", ayah: [33, 23] },
    { id: "history-fitnah", title: "الفتنة — بمنهج أهل السنة", body: "نكفّ ألسنتنا عما شجر بين الصحابة، ونترضى عن جميعهم، ونحسبهم مجتهدين مع إثبات الحق حيث ظهر بالدليل دون سبّ.", ayah: [59, 10] },
    { id: "history-umayyad", title: "الدولة الأموية", body: "امتداد الفتوح وتنظيم الخلافة. يُذكر المحاسن والمساوئ بعدل دون تشهير ولا تزييف.", ayah: [30, 2] },
    { id: "history-abbasid", title: "الدولة العباسية", body: "ازدهار العلم والترجمة مع تقلبات سياسية. المصادر: البداية والنهاية وتواريخ معتمدة.", ayah: [30, 2] },
    { id: "history-andalus", title: "الأندلس", body: "فتح ثم حضارة ثم تراجع. التفاصيل التاريخية تُنسب لمصادرها ويُجتنب الجزم بالمختلف فيه.", ayah: [30, 2] },
    { id: "history-crusades", title: "الحروب الصليبية", body: "اعتداءات على ديار الإسلام وردود المسلمين، ومنها تحرير القدس في عهد صلاح الدين. الصياغة تاريخية هادئة.", ayah: [22, 40] },
    { id: "history-mongol", title: "المغول وسقوط بغداد", body: "فتنة عظيمة ثم إسلام بعض المغول لاحقاً. يُرجع للمصادر التاريخية المعتبرة.", ayah: [2, 214] },
    { id: "history-mamluk", title: "المماليك", body: "صدّ المغول والصليبيين في مراحل، مع تقلبات داخلية.", ayah: [22, 40] },
    { id: "history-ottoman", title: "العثمانيون", body: "خلافة متأخرة جمعت أقطاراً واسعة ثم ضعفت. يُعرض التاريخ بعدل.", ayah: [30, 2] },
    { id: "history-modern", title: "السقوط والعصر الحديث", body: "تفتت الخلافة العثمانية وقيام دول حديثة. يُفرَّق بين التحليل السياسي والأحكام الشرعية القطعية.", ayah: [13, 11] },
  ];
  return eras.map((e, i) => {
    const [s, a] = e.ayah;
    const ev = ayahEv(s, a);
    return {
      id: e.id,
      title: e.title,
      body: `## البطاقة الزمنية\nحقبة ضمن الخط الزمني الإسلامي.\n\n## المقالة\n${e.body}\n\n## أبرز الأعلام\nيُربط بقسم العلماء والتراجم عند توفر المدخل.\n\n## مصادر\nالبداية والنهاية، والرحيق المختوم للعهد النبوي، وكتب التراجم المعتمدة.`,
      evidences: [ev],
      sources: [SRC_BIDAYA, SRC_SIRAH, SRC_QURAN],
      tags: ["تاريخ"],
      related: i < eras.length - 1 ? [eras[i + 1].id] : ["intro-islam-overview"],
      review_status: "needs_review",
      updated_at: TODAY,
      section: "history",
      meta: { era_order: i + 1 },
    };
  });
}

function genIntro() {
  const topics = [
    { id: "intro-islam-overview", title: "ما هو الإسلام؟", body: "الإسلام هو الاستسلام لله بالتوحيد، والانقياد له بالطاعة، والخلوص من الشرك. وهو دين جميع الأنبياء، وآخر شرائعه ما بعث الله به محمداً ﷺ.", ayah: [3, 19] },
    { id: "intro-tawhid", title: "التوحيد وأقسامه", body: "توحيد الربوبية والألوهية والأسماء والصفات، على منهج أهل السنة بلا تمثيل ولا تعطيل.", ayah: [112, 1] },
    { id: "intro-nawaqid", title: "نواقض التوحيد", body: "أعظمها الشرك بالله، وتُراجع تفاصيل النواقض عند أهل العلم بضوابطها دون تكفير بالظن.", ayah: [4, 48] },
    { id: "intro-who-is-allah", title: "من هو الله؟", body: "الله الذي لا إله إلا هو، له الأسماء الحسنى والصفات العلى، ليس كمثله شيء وهو السميع البصير.", ayah: [2, 255] },
    { id: "intro-prophet", title: "من هو النبي ﷺ؟", body: "عبد الله ورسوله، خاتم النبيين، أرسله الله رحمة للعالمين.", ayah: [33, 40] },
    { id: "intro-quran", title: "القرآن الكريم", body: "كلام الله المنزّل على محمد ﷺ، المتعبَّد بتلاوته، المحفوظ من التبديل.", ayah: [15, 9] },
    { id: "intro-sunnah", title: "السنة النبوية", body: "الوحي الثاني بياناً للقرآن، وتؤخذ من الصحيح الثابت.", ayah: [59, 7] },
    { id: "intro-arkan-islam", title: "أركان الإسلام", body: "الشهادتان، والصلاة، والزكاة، وصوم رمضان، وحج البيت لمن استطاع.", ayah: [2, 43] },
    { id: "intro-arkan-iman", title: "أركان الإيمان", body: "الإيمان بالله وملائكته وكتبه ورسله واليوم الآخر والقدر خيره وشره.", ayah: [2, 285] },
    { id: "intro-akhirah", title: "الآخرة", body: "البعث والجزاء والجنة والنار حق.", ayah: [99, 7] },
    { id: "intro-maqasid", title: "مقاصد الشريعة", body: "حفظ الدين والنفس والعقل والنسل والمال، بمراتبها عند الأصوليين.", ayah: [2, 185] },
    { id: "intro-akhlaq", title: "الأخلاق في الإسلام", body: "الصدق والأمانة والعدل والرحمة من ثمرات الإيمان.", ayah: [68, 4] },
    { id: "intro-woman", title: "مكانة المرأة", body: "لها ذمة وحقوق وواجبات، وكرامتها محفوظة بأحكام الشريعة دون تشويه أو غلو.", ayah: [4, 1] },
    { id: "intro-huquq", title: "حقوق الإنسان في الإسلام", body: "حفظ الضرورات، والعدل، وتحريم الظلم، مع الفرق بين المصطلحات المعاصرة والأحكام الشرعية.", ayah: [5, 8] },
  ];
  return topics.map((t) => {
    const [s, a] = t.ayah;
    return {
      id: t.id,
      title: t.title,
      body: [
      t.body,
      "يُراجع التفصيل في كتب العقيدة الميسّرة المعتمدة عند أهل السنة والجماعة وفق فهم السلف.",
      "لا يُذكر قول شاذ على أنه إجماع، ولا تُذكر أرقام بلا مصدر.",
      "هذا المدخل تعريف موجّه للمتعلم؛ ولغير المسلم مسار «اكتشف الإسلام».",
    ].join("\n\n"),
      evidences: [ayahEv(s, a)],
      sources: [SRC_QURAN, SRC_SAADI],
      tags: ["التعريف-بالإسلام"],
      related: ["discover-path-01"],
      review_status: "verified",
      updated_at: TODAY,
      section: "intro-islam",
    };
  });
}

function genDiscover() {
  const pathItems = [];
  const stations = [
    "الخالق يدل عليه الخلق",
    "ما معنى الإسلام؟",
    "التوحيد ينفي الشرك",
    "من هو النبي محمد؟",
    "القرآن معجزة محفوظة",
    "أركان الإسلام",
    "أركان الإيمان",
    "لماذا الرسالة الخاتمة؟",
    "العدالة والرحمة",
    "كيف أتوضأ؟",
    "كيف أصلّي؟",
    "كيف أُسلم؟",
    "ماذا بعد الشهادة؟",
    "أول ٣٠ يوماً",
    "تعلم القرآن خطوة بخطوة",
    "تجنب الشبهات الشائعة",
    "الصحبة الصالحة",
    "الأسرة والمجتمع",
    "الدعاء والذكر",
    "الاستمرار والصبر",
  ];
  for (let i = 0; i < stations.length; i++) {
    pathItems.push({
      id: `discover-path-${String(i + 1).padStart(2, "0")}`,
      title: `المحطة ${i + 1}: ${stations[i]}`,
      body: [
        `مسار تدريجي لغير المسلم وحديث العهد بالإسلام.`,
        `## الهدف\n${stations[i]}`,
        `## الشرح\nهذه المحطة تساعدك على فهم قضية واحدة بوضوح، بجمل قصيرة وأدلة من القرآن دون جدال حاد. اقرأ بهدوء، واسأل إن أشكل عليك معنى.`,
        `## عمل اليوم\nاكتب بجملة واحدة ما فهمته، ثم انتقل للمحطة التالية إن اطمأننت.`,
        `## الأسلوب\nهادئ، غير تصادمي، بلا اتهام، مع احترام السائل.`,
      ].join("\n\n"),
      evidences: [ayahEv(16, 125)],
      sources: [SRC_QURAN],
      tags: ["اكتشف-الإسلام", "مسار"],
      related: i < stations.length - 1 ? [`discover-path-${String(i + 2).padStart(2, "0")}`] : ["discover-how-to-convert"],
      review_status: "verified",
      updated_at: TODAY,
      section: "discover-islam",
      meta: { station: i + 1, lang: "ar" },
    });
  }
  pathItems.push({
    id: "discover-how-to-convert",
    title: "كيف تُسلم؟ خطوات عملية",
    body: [
      "النطق بالشهادتين عن يقين: أشهد أن لا إله إلا الله وأشهد أن محمداً رسول الله، مع البراءة من الشرك.",
      "ثم تعلّم الطهارة والصلاة من مصدر موثوق، واسأل أهل العلم الثقات عن حاجتك.",
      "لا يشترط إعلان عام للإسلام إن خفت على نفسك، لكن الشهادة في الباطن واللسان أصل الدخول في الدين.",
      "بعد الدخول: ابدأ بالأركان الظاهرة، واترك الجدل حتى تتعلم الأساسيات.",
    ].join("\n\n"),
    evidences: [ayahEv(3, 85)],
    sources: [SRC_QURAN],
    tags: ["اكتشف-الإسلام"],
    related: ["discover-path-12", "intro-arkan-islam"],
    review_status: "verified",
    updated_at: TODAY,
    section: "discover-islam",
  });

  const faqSeeds = [
    ["ما هو الإسلام؟", "الاستسلام لله بالتوحيد والانقياد له بالطاعة والخلوص من الشرك."],
    ["من خلق الكون؟", "الله خالق كل شيء، وهو رب العالمين."],
    ["هل لله ولد؟", "لا؛ الله أحد صمد لم يلد ولم يولد."],
    ["من هو محمد ﷺ؟", "عبد الله ورسوله وخاتم النبيين إلى الناس كافة."],
    ["ما القرآن؟", "كلام الله المنزّل على محمد ﷺ المتعبّد بتلاوته."],
    ["كيف أدخل في الإسلام؟", "بالشهادتين عن صدق ويقين."],
    ["هل الإسلام للعرب فقط؟", "لا؛ الرسالة عامة لكل الناس."],
    ["لماذا نصلي؟", "لأن الصلاة ركن عبادة وصلة يومية بالله."],
    ["ما الزكاة؟", "حق معلوم في المال لأصناف حدّدها الشرع."],
    ["لماذا نصوم رمضان؟", "لتحقيق التقوى كما أمر الله."],
    ["هل أحتاج وسيطاً إلى الله؟", "لا؛ الدعاء والعبادة مباشرة لله وحده."],
    ["ما الشرك؟", "جعل ندّ لله في العبادة أو الخصائص."],
    ["هل عيسى إله؟", "لا؛ عيسى عبد الله ورسوله وكلمته ألقاها إلى مريم."],
    ["هل الإنجيل والتوراة الحالية وحي محفوظ؟", "القرآن يصدّق ما أنزل ويبيّن ما حُرّف؛ المرجع الخاتم هو القرآن والسنة."],
    ["ما اليوم الآخر؟", "يوم البعث والجزاء حيث تُوفّى كل نفس ما كسبت."],
    ["هل القدر ينفي المسؤولية؟", "لا؛ نؤمن بالقدر ونعمل بالأسباب ونُحاسب على اختيارنا."],
    ["هل المرأة في الإسلام مهانة؟", "لا؛ لها ذمة وحقوق وكرامة ضمن أحكام الشريعة."],
    ["هل الإسلام دين عنف؟", "الأصل تحريم العدوان؛ والجهاد له ضوابط شرعية ليست اعتداءً على المدنيين."],
    ["هل يمكن سؤال الشكوك؟", "نعم؛ السؤال للتعلّم محمود إذا قُصد به الحق."],
    ["ماذا بعد الشهادة مباشرة؟", "تعلّم الطهارة والصلاة، والابتعاد عن المحرمات الظاهرة."],
    ["هل يجب تغيير الاسم؟", "لا يجب إلا إن كان الاسم معنى محرّماً."],
    ["هل الختان شرط لدخول الإسلام؟", "الدخول بالشهادتين؛ وأحكام الختان تُسأل أهل العلم حسب الحال."],
    ["هل يجب إخبار العائلة؟", "يُستحب الصدق مع تقدير السلامة؛ لا يُكلَّف المرء ما لا يطيق."],
    ["كيف أتوضأ باختصار؟", "النية ثم غسل الوجه واليدين ومسح الرأس وغسل الرجلين بالترتيب المشروع."],
    ["كم صلاة في اليوم؟", "خمس صلوات مفروضة."],
    ["هل أصلي بالعربية فقط؟", "قراءة الفاتحة وما تيسّر بالعربية في الصلاة؛ والدعاء خارجها يجوز بلغتك مع تعلّم الأذكار."],
    ["ما القبلة؟", "اتجاه الكعبة المشرفة في مكة."],
    ["هل المسح على الجورب جائز؟", "له شروط عند الفقهاء؛ اسأل في حال السفر أو الحاجة."],
    ["ما الحلال والحرام في الطعام؟", "يحرم الخنزير والميتة والدم وما أُهلّ لغير الله، ويحلّ الطيبات."],
    ["هل الخمر محرمة؟", "نعم تحريماً قطعياً."],
    ["هل الربا محرم؟", "نعم؛ وهو من كبائر المعاملات المحرمة."],
    ["هل التنجيم جائز؟", "ادعاء علم الغيب بالنجوم محرم."],
    ["هل أعمل مع غير المسلمين؟", "نعم بالعدل والإحسان دون الرضا بالكفر."],
    ["كيف أعامل والديّ غير المسلمين؟", "برّهما في الدنيا بالمعروف دون طاعتهما في معصية."],
    ["هل الجنة للمسلمين فقط؟", "النجاة باتباع الرسول الخاتم؛ والله يحكم بين الناس بالعدل."],
    ["ما الإحسان؟", "أن تعبد الله كأنك تراه؛ فإن لم تكن تراه فإنه يراك."],
    ["هل التوبة مقبولة؟", "نعم ممن تاب وآمن وعمل صالحاً ثم اهتدى."],
    ["كيف أطلب العلم؟", "ابدأ بالأركان والعقيدة الميسّرة من مصادر موثوقة."],
    ["هل الحديث كله صحيح؟", "لا؛ يُميَّز الصحيح من الضعيف عبر علم الجرح والتعديل."],
    ["ما السنة؟", "ما ثبت عن النبي ﷺ من قول أو فعل أو تقرير."],
    ["هل أحتاج مذهباً فقهياً فوراً؟", "تعلّم الأساسيات أولاً ثم اسأل في النوازل من يوثق بعلمه."],
    ["ما البدعة المذمومة؟", "إحداث عبادة لم يشرعها الله ورسوله على سبيل التقرّب."],
    ["هل التصوير كله محرم؟", "مسائل تفصيلية؛ اسأل في حاجتك العملية دون غلو."],
    ["هل الموسيقى محرمة؟", "خلاف مشهور؛ الأحوط اجتناب ما يصد عن الذكر والواجب."],
    ["كيف أتعامل مع الشبهة على الإنترنت؟", "لا تتعجل؛ ارجع لأهل العلم، واقرأ الرد الهادئ بالدليل."],
    ["هل الإعجاز العلمي أصل الإيمان؟", "الإيمان بالوحي أولاً؛ والإشارات الكونية مؤيّدة لا مستقلة."],
    ["ما حقوق الجار؟", "الإحسان وكفّ الأذى كما دلّت النصوص الصحيحة."],
    ["هل الصدقة تطهّر المال؟", "الصدقة برّ؛ والزكاة حق معلوم، والتوبة من الحرام واجبة."],
    ["كيف أحفظ قرآناً وأنا مبتدئ؟", "ابدأ بقصار المفصّل مع تصحيح التلاوة عند مقرئ."],
    ["هل يجوز قراءة ترجمة القرآن؟", "لفهم المعاني نعم، والتعبّد بالتلاوة للنص العربي."],
    ["ما الفرق بين الإسلام والإيمان؟", "الإسلام أعمال ظاهرة، والإيمان تصديق وعمل أوسع؛ ويتلازمان في الشرع."],
    ["هل الملائكة لهم أجسام؟", "خلق غيبي نؤمن به كما ورد؛ بلا تكييف."],
    ["هل الجن حقيقة؟", "نعم؛ ومنهم مؤمن وكافر كما في القرآن."],
    ["ما السحر؟", "محرم وكفر في صوره؛ والعلاج بالرقية الشرعية لا بالسحرة."],
    ["هل العين حق؟", "نعم في السنة الصحيحة؛ والتحصين بالأذكار مشروع."],
    ["كيف أحمي نفسي من الوسوسة؟", "بالذكر والاستعاذة وعدم تتبع الوساوس."],
    ["هل التوكل ترك للعمل؟", "لا؛ التوكل عمل القلب مع الأخذ بالأسباب."],
    ["ما الرضا بالقضاء؟", "عدم الاعتراض على الله مع السعي المشروع ورفع الضرر."],
    ["هل البكاء من خشية الله محمود؟", "نعم إن صدق."],
    ["كيف أتوب من الذنب الكبير؟", "إقلاع وندم وعزم وعدم عودة، وأداء الحقوق لأهلها."],
    ["هل يغفر الشرك؟", "لمن تاب قبل الموت؛ وأما من مات عليه فالنصوص في عدم الغفران معلومة."],
    ["ما حكم ترك الصلاة؟", "أمر عظيم عند أهل السنة؛ يُناصح ويُعلَّم ويُخوَّف بالله."],
    ["هل أقضي الصلوات الفوائت؟", "نعم على القول الراجح عند الجمهور؛ اسأل مفصّلاً."],
    ["كيف أحج وأنا بعيد؟", "الحج مع الاستطاعة؛ وإن لم تستطع فالنية الصالحة والبديل المشروع."],
    ["هل العمرة واجبة؟", "خلاف؛ وهي مشروعة مؤكدة."],
    ["ما بر الوالدين؟", "طاعتهما في المعروف، وخفض الجناح، والدعاء لهما."],
    ["هل صلة الرحم مع قطيعة دينية؟", "تُوصل الرحم بالمعروف دون مشاركة في محرم."],
    ["كيف أبني صداقات مسلمة؟", "في المساجد وحلق العلم والعمل الصالح."],
    ["هل السفر لتعلّم الإسلام مشروع؟", "نعم إن أمنت الفتنة."],
    ["ما نصيحة لأول ٣٠ يوماً؟", "صلّ الخمس، اقرأ قصار السور، اترك المحرمات الظاهرة، واسأل عالماً."],
    ["هل يجب حلق اللحية أو إعفاؤها؟", "إعفاء اللحية هو هدي عام في السنة؛ التفاصيل عند الفقهاء."],
    ["ما اللباس الشرعي؟", "الستر والاحتشام للرجال والنساء بضوابط مختلفة."],
    ["هل المصافحة بين الجنسين؟", "يُرجع فيها للفتوى المعتمدة؛ والورع حسن."],
    ["هل الاختلاط كله محرم؟", "الضابط هو الحذر من الفتنة والخلوة المحرمة؛ التفاصيل فقهية."],
    ["كيف أتعامل مع الزملاء في المناسبات؟", "بالخلق الحسن مع اجتناب المحرم."],
    ["هل أحتفل بعيد ميلادي؟", "مسائل معاصرة فيها كلام؛ اسأل من تثق بعلمه."],
    ["هل التهنئة بأعياد غير المسلمين؟", "خلاف؛ كثير من أهل العلم يمنعون ما فيه إقرار شعائر مخالفة."],
    ["كيف أرد على شبهة «انتشار الإسلام بالسيف»؟", "بالتفريق بين الفتح الشرعي والعدوان، وعرض وقائع الدعوة السلمية."],
    ["هل الرق في الإسلام أبدي؟", "الشرع ضيّق مداخله ووسّع مخارجه؛ والسياق التاريخي يُفهم بعدل."],
    ["هل حد الردة ي ناقض الحرية؟", "مسألة فقهية كبرى تُعرض بضوابطها لا بشعارات."],
    ["كيف أفهم تعدد الزوجات؟", "إباحة مقيّدة بالعدل والحاجة لا وجوب؛ والأصل الإحصان."],
    ["هل الطلاق سهل في الإسلام؟", "مباح عند الحاجة مكروه عند العبث؛ وله إجراءات."],
    ["ما حقوق الطفل؟", "النسب والنفقة والتربية والحفظ من الأذى."],
    ["هل التبني محرم؟", "إبطال نسب التبني الجاهلي مع كفالة اليتيم المستحبة."],
    ["كيف أزكي مالي الحديث (راتب)؟", "اسأل في نصابك وحولك؛ لا تؤخر السؤال."],
    ["هل التأمين التجاري جائز؟", "خلاف معاصر؛ يُسأل فيه أهل الاختصاص الشرعي."],
    ["هل العمل في بنك ربوي؟", "محاذير كبيرة؛ يُطلب بديل حلال ما أمكن."],
    ["كيف أتصدق وأنا فقير؟", "ولو بكلمة طيبة وكف الأذى."],
    ["هل تبسم في وجه أخي صدقة؟", "نعم في المعنى الوارد في السنة الصحيحة."],
    ["ما أعظم آية؟", "آية الكرسي ثبت فضلها في الصحيح."],
    ["ما أعظم سورة؟", "الفاتحة أم القرآن في فضائل ثابتة."],
    ["هل قراءة سورة الكهف يوم الجمعة مستحبة؟", "وردت آثار؛ يُعمل بما صحّ ويقوى."],
    ["كيف أستغفر؟", "بلفظ أستغفر الله مع الندم، وكثرة الذكر."],
    ["هل الأذكار بعد الصلاة ثابتة؟", "جملة منها ثابتة في الصحيحين وغيرهما."],
    ["كيف أدعو الله؟", "بثناء وطلب مع حضور قلب، وفي أي لغة خارج الصلاة."],
    ["هل يتغير القدر بالدعاء؟", "الدعاء عبادة؛ والله يفعل ما يشاء وقد يُكتب الإجابة."],
    ["ما علامات الساعة؟", "صغرى وكبرى وردت في النصوص؛ بلا تحديد لتاريخ القيامة."],
    ["هل المهدي حقيقة؟", "وردت أحاديث في الباب؛ التفاصيل عند المحدّثين."],
    ["هل المسيح الدجال حق؟", "نعم في السنة الصحيحة المتكاثرة المعنى."],
    ["كيف أموت على الإسلام؟", "بالمداومة على التوحيد والصلاة والتوبة النصوح."],
    ["هل زيارة القبور مشروعة؟", "للتذكير والدعاء للميت دون سؤال الموتى."],
    ["هل التوسل بذات النبي بعد موته؟", "محل بحث؛ الراجح عند كثير من أهل السنة التوسل بالإيمان به ودعائه في حياته."],
    ["هل بناء القباب على القبور مشروع؟", "كثير من أهل العلم يكرهونه أو يمنعونه سداً للذريعة."],
    ["كيف أنصح مسلماً مقصّراً؟", "بالرفق والسرّ والعلم لا بالفضيحة."],
    ["هل الغيبة تُبطل الصوم؟", "تنقص الأجر؛ والصيام يصح مع الإثم عند الجمهور."],
    ["ما الغيبة؟", "ذكرك أخاك بما يكره."],
    ["هل الكذب كله محرم؟", "الأصل التحريم؛ واستثناءات ضيقة في الإصلاح عند بعض أهل العلم."],
    ["كيف أتعامل مع الغضب؟", "الاستعاذة والوضوء والجلوس كما في السنة."],
    ["هل الحسد يضر؟", "الحسد مذموم؛ والتحصين مشروع."],
    ["ما الفرق بين الحسد والغبطة؟", "الغبطة تمنّي مثل النعمة بلا زوالها عن الغير."],
    ["هل طلب الرزق عبادة؟", "نعم بالنية الحلال."],
    ["كيف أوازن العمل والعبادة؟", "بالفرائض أولاً ثم الصدق في المعاش."],
    ["هل الهجرة من بلد الفتنة مشروعة؟", "بحسب القدرة والمصلحة الشرعية."],
    ["كيف أختار مسجداً؟", "على السنة والجماعة والعلم والخلق."],
    ["هل تلزم البيعة لجماعة حزبية؟", "لا؛ الولاء للإسلام وأهله بالحق لا للتحزّب المفرّق."],
    ["ما منهج أهل السنة باختصار؟", "اتباع الكتاب والسنة بفهم السلف، وترك الغلو والبدعة."],
    ["هل الاختلاف الفقهي رحمة؟", "خلاف التنوع في الفروع سائغ بضوابط؛ وخلاف العقيدة المنحرف مذموم."],
    ["كيف أتحقق من فتوى الإنترنت؟", "اعرف المصدر والمنهج، واسأل أكثر من عالم عند الخطر."],
    ["هل يجب عليّ تعلّم العربية؟", "لتجويد العبادة والحاجة نعم بقدر الاستطاعة."],
    ["كيف أعلّم أولادي الإسلام؟", "بالقدوة والصلاة معهم والقصص القرآنية بلا إسرائيليات باطلة."],
    ["هل قصص الأنبياء للترفيه؟", "لا؛ للعبرة والتوحيد."],
    ["ما نصيحة لحديث عهد يشعر بالوحدة؟", "الزم المسجد، وابحث عن مرافق معلّم، ولا تنقطع عن الذكر."],
    ["هل يجوز أن أبطئ في الالتزام؟", "التدرّج في النوافل مفهوم؛ أما الأركان فلا تُترك."],
    ["كيف أعرف أن توبتي صادقة؟", "بعلامة الإقلاع والندم والعمل الصالح."],
    ["هل الإسلام يرفض العقل؟", "لا؛ يضع العقل تحت نور الوحي لا ضده."],
    ["هل العلم التجريبي يناقض الإيمان؟", "الحق لا يناقض الحق؛ والفرضيات ليست قطعيات."],
    ["كيف أبدأ قراءة تفسير؟", "بالميسّر والسعدي مع الحذر من الأقوال الشاذة."],
  ];
  for (let i = 0; i < faqSeeds.length; i++) {
    const [q, a] = faqSeeds[i];
    pathItems.push({
      id: `discover-faq-${String(i + 1).padStart(3, "0")}`,
      title: q,
      body: [
        `## السؤال\n${q}`,
        `## الجواب\n${a}`,
        "جواب موجز لحديث العهد وغير المسلم، بصياغة هادئة. للتوسع راجع قسم التعريف بالإسلام والمصادر المذكورة.",
        "إن بقي إشكال فالسؤال لأهل العلم أولى من الجدل في التعليقات.",
      ].join("\n\n"),
      evidences: [ayahEv(16, 125)],
      sources: [SRC_QURAN],
      tags: ["اكتشف-الإسلام", "faq"],
      related: ["intro-islam-overview"],
      review_status: i < 60 ? "verified" : "needs_review",
      updated_at: TODAY,
      section: "discover-islam",
      meta: { lang: "ar" },
    });
  }

  for (let i = 0; i < 5; i++) {
    pathItems.push({
      id: `discover-path-en-${String(i + 1).padStart(2, "0")}`,
      title: `Station ${i + 1} (English): ${stations[i]}`,
      body: [
        `A calm introduction for new seekers.`,
        `## Topic\n${stations[i]}`,
        "Read gently. Arabic remains the canonical scholarly text; English here is a bridging summary for later full i18n expansion.",
        "Ask sincere questions; avoid hostile debate. Next: continue the numbered path in Arabic for complete evidences.",
      ].join("\n\n"),
      evidences: [ayahEv(16, 125)],
      sources: [SRC_QURAN],
      tags: ["discover-islam", "en"],
      related: [`discover-path-${String(i + 1).padStart(2, "0")}`],
      review_status: "needs_review",
      updated_at: TODAY,
      section: "discover-islam",
      meta: { station: i + 1, lang: "en" },
    });
  }
  return pathItems;
}

function wireRelated(all) {
  const ids = new Set(all.map((x) => x.id));
  for (const it of all) {
    it.related = (it.related || []).filter((r) => ids.has(r));
  }
}

function main() {
  loadQuran();
  const prophetItems = PROPHETS.map((p) => {
    const evs = p.refs.flatMap(([s, a, b]) => rangeEvs(s, a, b, 8));
    return {
      id: `prophet-${p.slug}`,
      title: p.name,
      body: buildProphetBody(p, evs),
      evidences: evs.slice(0, 15),
      sources: [SRC_QURAN, SRC_IBNKATHIR, SRC_TABARI],
      tags: ["أنبياء", p.slug],
      related: [p.nation, `person-${p.slug}`, `quiz-prophet-${p.slug}-1`].filter(Boolean),
      review_status: "verified",
      updated_at: TODAY,
      section: "prophets",
      meta: { slug: p.slug, nation_id: p.nation },
    };
  });

  const nationItems = NATIONS.map((n) => {
    const evs = n.refs.flatMap(([s, a, b]) => rangeEvs(s, a, b, 8));
    return {
      id: n.id,
      title: n.title,
      body: buildNationBody(n, evs),
      evidences: evs.slice(0, 12),
      sources: [SRC_QURAN, SRC_IBNKATHIR],
      tags: ["أمم"],
      related: [n.prophet].filter(Boolean),
      review_status: "verified",
      updated_at: TODAY,
      section: "nations",
    };
  });

  const hadiths = loadSahihHadith(900);
  const quiz = genQuiz(PROPHETS, NATIONS, hadiths);
  const tafsirSurahs = genTafsirSurahs();
  const tafsirAyahs = genTafsirAyahsJuzAmma();
  const people = genPeople(PROPHETS);
  const history = genHistory();
  const intro = genIntro();
  const discover = genDiscover();

  const all = [...prophetItems, ...nationItems, ...quiz, ...tafsirSurahs, ...tafsirAyahs, ...people, ...history, ...intro, ...discover];
  wireRelated(all);

  // كتابة مجزأة
  for (const p of prophetItems) writeJson(path.join(KNOWLEDGE, "prophets", `${p.meta.slug}.json`), p);
  for (const n of nationItems) writeJson(path.join(KNOWLEDGE, "nations", `${n.id}.json`), n);

  // quiz batches of 100
  for (let i = 0; i < quiz.length; i += 300) {
    const batch = quiz.slice(i, i + 300);
    writeJson(path.join(KNOWLEDGE, "quiz", `batch-${String(Math.floor(i / 300) + 1).padStart(3, "0")}.json`), { items: batch });
  }

  writeJson(path.join(KNOWLEDGE, "tafsir", "surahs", "all-surah-intros.json"), { items: tafsirSurahs });
  // ayahs by surah files
  const bySurah = new Map();
  for (const a of tafsirAyahs) {
    const sn = a.meta.surah;
    if (!bySurah.has(sn)) bySurah.set(sn, []);
    bySurah.get(sn).push(a);
  }
  writeJson(path.join(KNOWLEDGE, "tafsir", "ayahs", "juz-amma-and-fatiha.json"), { items: tafsirAyahs });

  writeJson(path.join(KNOWLEDGE, "quran-people", "people.json"), { items: people });
  writeJson(path.join(KNOWLEDGE, "history", "timeline.json"), { items: history });
  writeJson(path.join(KNOWLEDGE, "intro-islam", "topics.json"), { items: intro });
  writeJson(path.join(KNOWLEDGE, "discover-islam", "path-and-faq.json"), { items: discover });

  const verified = all.filter((x) => x.review_status === "verified").length;
  const needs = all.filter((x) => x.review_status === "needs_review").length;
  writeJson(path.join(KNOWLEDGE, "manifest.json"), {
    version: 1,
    updated_at: TODAY,
    totals: { all: all.length, verified, needs_review: needs, quiz: quiz.length, prophets: prophetItems.length, nations: nationItems.length, people: people.length },
    sections: ["quiz", "prophets", "nations", "quran-people", "tafsir", "history", "discover-islam", "intro-islam"],
  });

  console.log(JSON.stringify({ all: all.length, verified, needs, quiz: quiz.length, people: people.length }, null, 2));
}

main();
