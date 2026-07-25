/**
 * Quran text API — local-first with live AlQuran Cloud fallback.
 * Source: https://alquran.cloud/api — open, free, no API key required.
 * Edition used: quran-uthmani (Uthmanic script, Hafs ʿan ʿĀṣim)
 *
 * نص السورة (fetchSurahDetail) يُقرأ أولًا من public/data/quran/ (نسخة
 * مُجلَّبة مسبقًا عبر scripts/fetch-quran-data.mjs ومُتحقَّق من سلامتها عبر
 * scripts/verify-quran-integrity.mjs بمطابقة SHA-256 وعدد الآيات)، وعند
 * غياب الملف المحلي أو تعذّر قراءته يرجع تلقائيًا للطلب الحي من الـ API —
 * راجع docs/quran-data-source.md لتفاصيل المصدر والترخيص وآلية التحديث.
 *
 * ⚠️ Never generate or modify Quran text manually.
 *    All content comes from the API (live or its verbatim local snapshot) only.
 */

const BASE = "https://api.alquran.cloud/v1";
const LOCAL_QURAN_DATA_BASE = "/data/quran";
const CACHE_PREFIX = "mj-quran-v3-";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type SurahSummary = {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: "Meccan" | "Medinan";
};

export type Ayah = {
  number: number;
  numberInSurah: number;
  text: string;
  juz: number;
  page: number;
  /** ربع الحزب (1–240 عبر كامل المصحف) — من public/data/quran المحلي فقط؛ قد يغيب من نتائج الـAPI الحي. */
  hizbQuarter?: number;
  surahNumber?: number;
  sajda: boolean | { id: number; recommended: boolean; obligatory: boolean };
};

export type SurahDetail = SurahSummary & { ayahs: Ayah[] };

export type TafsirAyah = { numberInSurah: number; text: string };

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, at } = JSON.parse(raw) as { data: T; at: number };
    if (Date.now() - at > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, at: Date.now() }));
  } catch {
    // localStorage quota exceeded — ignore
  }
}

export async function fetchSurahList(): Promise<SurahSummary[]> {
  const cached = readCache<SurahSummary[]>("surah-list");
  if (cached) return cached;

  const res = await fetch(`${BASE}/surah`, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`AlQuran Cloud: HTTP ${res.status}`);
  const json = await res.json();
  if (json.code !== 200 || !Array.isArray(json.data)) throw new Error("AlQuran Cloud: unexpected response");
  const list: SurahSummary[] = json.data;
  writeCache("surah-list", list);
  return list;
}

async function fetchLocalSurahDetail(surahNumber: number): Promise<SurahDetail | null> {
  try {
    const padded = String(surahNumber).padStart(3, "0");
    const res = await fetch(`${LOCAL_QURAN_DATA_BASE}/surah-${padded}.json`, {
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const detail = await res.json();
    if (!detail || !Array.isArray(detail.ayahs)) return null;
    return detail as SurahDetail;
  } catch {
    return null;
  }
}

export async function fetchSurahDetail(surahNumber: number): Promise<SurahDetail> {
  const key = `surah-${surahNumber}`;
  const cached = readCache<SurahDetail>(key);
  if (cached) return cached;

  const local = await fetchLocalSurahDetail(surahNumber);
  if (local) {
    writeCache(key, local);
    return local;
  }

  const res = await fetch(`${BASE}/surah/${surahNumber}/quran-uthmani`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`AlQuran Cloud: HTTP ${res.status}`);
  const json = await res.json();
  if (json.code !== 200 || !json.data) throw new Error("AlQuran Cloud: unexpected response");
  const detail: SurahDetail = json.data;
  writeCache(key, detail);
  return detail;
}

export async function fetchTafsirAyahs(
  surahNumber: number,
  edition: string,
): Promise<TafsirAyah[]> {
  const key = `tafsir-${edition}-${surahNumber}`;
  const cached = readCache<TafsirAyah[]>(key);
  if (cached) return cached;

  const res = await fetch(`${BASE}/surah/${surahNumber}/${edition}`, {
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`AlQuran Cloud tafsir: HTTP ${res.status}`);
  const json = await res.json();
  if (json.code !== 200 || !json.data?.ayahs) return [];
  const result: TafsirAyah[] = json.data.ayahs.map((a: { numberInSurah: number; text: string }) => ({
    numberInSurah: a.numberInSurah,
    text: a.text,
  }));
  writeCache(key, result);
  return result;
}

export type SearchMatch = {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  text: string;
};

export async function searchQuran(query: string): Promise<SearchMatch[]> {
  if (!query.trim()) return [];
  const res = await fetch(
    `${BASE}/search/${encodeURIComponent(query.trim())}/all/ar`,
    { signal: AbortSignal.timeout(15_000) },
  );
  if (!res.ok) return [];
  const json = await res.json();
  if (json.code !== 200 || !json.data?.matches) return [];
  return (json.data.matches as Array<{
    surah: { number: number; name: string };
    numberInSurah: number;
    text: string;
  }>).map((m) => ({
    surahNumber: m.surah.number,
    surahName: m.surah.name,
    ayahNumber: m.numberInSurah,
    text: m.text,
  }));
}

export function clearQuranCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(CACHE_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

// ─── Static surah list (correct ayah counts per Hafs ʿan ʿĀṣim) ───────────

const SURAH_NAMES_AR = [
  "الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس",
  "هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه",
  "الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم",
  "لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر",
  "فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق",
  "الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة",
  "الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج",
  "نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس",
  "التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد",
  "الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات",
  "القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر",
  "المسد","الإخلاص","الفلق","الناس",
];

const SURAH_AYAH_COUNTS = [
  7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,
  112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,
  54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,
  14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,
  29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,
  11,8,3,9,5,4,7,3,6,3,5,4,5,6,
];

const MADANI = new Set([2,3,4,5,8,9,22,24,33,47,48,49,57,58,59,60,61,62,63,64,65,66,76,98,99,110]);

// ─── وصف موجز لكل سورة (نبذة عامة) ─────────────────────────────────────────
// **محتوى علمي عام متفق عليه فقط** — لا تفاصيل جدلية دقيقة تحتاج توثيقًا
// خاصًا. كل نبذة: (أ) تصنيف مكية/مدنية (وحيثما وُجد خلاف علمي مشهور موثَّق
// في كتب علوم القرآن — كالفاتحة والرعد والرحمن والإنسان والمطففين وغيرها —
// نُصاغ العبارة بصيغة "قيل...وقيل..." بدل الجزم، حتى لو كان تصنيف الحقل
// البرمجي `revelation` أعلاه (مبني على مجموعة MADANI المحقَّقة مسبقًا)
// قاطعًا لأغراض الفهرسة والعرض التصنيفي)، (ب) الموضوع العام للسورة وأبرز
// مقاصدها كما تُقدَّمه كتب التفسير المرجعية (كمقدمات ابن كثير والسعدي)
// وكتب علوم القرآن، وهي حقائق غير خلافية عن "موضوع" كل سورة (بخلاف مكان
// نزولها الذي قد يُختلَف فيه). الفهرسة: index 0 = سورة رقم 1 (الفاتحة)...
// index 113 = سورة رقم 114 (الناس)، مطابقة تمامًا لترتيب SURAH_NAMES_AR.
const SURAH_DESCRIPTIONS: readonly string[] = [
  `مكية (وقيل مدنية، وقيل نزلت مرتين): أمّ الكتاب وافتتاحية القرآن — حمد الله وتوحيده والاستعانة به وسؤال الهداية إلى الصراط المستقيم.`,
  `مدنية، أطول سور القرآن: تشريعات وأحكام (الصيام والحج والمعاملات والطلاق)، وقصص بني إسرائيل، وآية الدَّين وآية الكرسي.`,
  `مدنية: مناظرة أهل الكتاب، ودروس غزوة أحد، وقصة مريم وعيسى عليهما السلام.`,
  `مدنية: أحكام الأسرة والمواريث والمعاملات، وحقوق النساء واليتامى.`,
  `مدنية: الوفاء بالعقود، وأحكام الطعام والصيد، وقصة قابيل وهابيل، والمائدة النازلة على الحواريين.`,
  `مكية: تقرير التوحيد وإبطال الشرك بالحجاج مع المشركين حول الأنعام والذبائح، وقصة إبراهيم مع قومه.`,
  `مكية: قصص عدد من الأنبياء مع أممهم (نوح وهود وصالح ولوط وشعيب وموسى)، وقصة آدم وإبليس.`,
  `مدنية: أحكام الغنائم والجهاد، ودروس غزوة بدر.`,
  `مدنية، بلا بسملة، وتُعرف أيضًا بـ«براءة»: أحكام الجهاد والمنافقين ونقض العهود.`,
  `مكية: تقرير التوحيد والبعث، وقصة يونس عليه السلام مع قومه.`,
  `مكية: قصص الأنبياء (نوح وهود وصالح وإبراهيم ولوط وشعيب وموسى)، وسنّة الله في إهلاك المكذّبين.`,
  `مكية: قصة يوسف عليه السلام كاملة، «أحسن القصص»، ودروس في الصبر والعفة وتدبير الله.`,
  `قيل مكية وقيل مدنية: تقرير عظمة الله ودلائل قدرته في الكون، وموقف المشركين من القرآن.`,
  `مكية: دعوة إبراهيم عليه السلام وشكره لنعم الله، والتحذير من كفران النعمة.`,
  `مكية: قصة أصحاب الحِجر (ثمود) وإبراهيم ولوط، وتعهّد الله بحفظ القرآن.`,
  `مكية: تعداد نعم الله في الكون (كالنحل والأنعام والنبات) ودلالتها على التوحيد.`,
  `مكية: الإسراء بالنبي ﷺ من المسجد الحرام إلى الأقصى، ووصايا جامعة في الأخلاق.`,
  `مكية: أربع قصص (أصحاب الكهف، وصاحب الجنتين، وموسى والخضر، وذو القرنين) حول الفتن في الدين والمال والعلم والسلطان.`,
  `مكية: قصة مريم وولادة عيسى عليهما السلام، وقصص زكريا ويحيى وإبراهيم.`,
  `مكية: قصة موسى عليه السلام مع فرعون بتفصيل، وتثبيت النبي ﷺ.`,
  `مكية: عرض موجز لقصص عدد من الأنبياء، وتقرير وحدة رسالتهم في التوحيد.`,
  `مدنية (وقيل بعض آياتها مكية): أحكام الحج ومناسكه، والأمر بالجهاد والدفاع عن المستضعفين.`,
  `مكية: صفات المؤمنين الفائزين، ومراحل خلق الإنسان، ودعوة الرسل أقوامهم.`,
  `مدنية: أحكام الحجاب والقذف والاستئذان، وحادثة الإفك، وآداب البيوت.`,
  `مكية: الرد على شبهات المشركين حول القرآن والنبوة، وصفات «عباد الرحمن».`,
  `مكية: قصص عدد من الأنبياء مع أقوامهم المكذّبين، والتفريق بين الشعر والوحي.`,
  `مكية: قصة سليمان عليه السلام مع الهدهد وملكة سبأ، وقصة صالح وموسى ولوط.`,
  `مكية: قصة موسى عليه السلام من الولادة إلى النبوّة بتفصيل، وقصة قارون.`,
  `مكية: الابتلاء والفتنة سنّة ماضية للمؤمنين، ومَثَل أولياء الشيطان بالعنكبوت.`,
  `مكية: الإخبار بغلبة الروم بعد هزيمتهم (نبوءة تحققت)، ودلائل التوحيد في الكون.`,
  `مكية: وصايا لقمان لابنه في التوحيد وبر الوالدين ومكارم الأخلاق.`,
  `مكية: خلق السماوات والأرض، وصفة يوم القيامة، والفرق بين المؤمن والفاسق.`,
  `مدنية: غزوة الأحزاب (الخندق)، وأحكام أزواج النبي ﷺ والحجاب.`,
  `مكية: قصة سبأ وسدّ مأرب، ونعمة داود وسليمان عليهما السلام، وتقرير البعث.`,
  `مكية: عظمة الخلق وقدرة الله، وتفاوت الناس في تلقّي الحق.`,
  `مكية، وتُسمّى «قلب القرآن»: تثبيت الرسالة والبعث، وقصة أصحاب القرية.`,
  `مكية: قصص الأنبياء (نوح، وإبراهيم وذبح إسماعيل، وموسى، وإلياس، ويونس)، ووصف الملائكة والجنة والنار.`,
  `مكية: قصة داود وسليمان عليهما السلام، وصبر أيوب عليه السلام، وقصة آدم وإبليس.`,
  `مكية: الإخلاص لله في العبادة، ورجاء سعة رحمة الله، وأهوال يوم القيامة.`,
  `مكية: مجادلة فرعون وقومه، وقصة «مؤمن آل فرعون»، وسعة رحمة الله ومغفرته.`,
  `مكية: تفصيل آيات القرآن ودلائل إعجازه، وشهادة الجوارح يوم القيامة.`,
  `مكية: مبدأ الشورى، ووحدة رسالة الأنبياء، وتقرير التوحيد.`,
  `مكية: التحذير من الاغترار بزخرف الدنيا، وقصة إبراهيم وموسى مع فرعون.`,
  `مكية: آية الدخان من علامات الساعة، ومصير فرعون وقومه، ونعيم المتقين.`,
  `مكية: مشاهد من يوم القيامة، ودلائل التوحيد في خلق السماوات والأرض.`,
  `مكية: قصة عاد وأحقافهم، والوصية ببر الوالدين، وإيمان نفر من الجن بالقرآن.`,
  `مدنية: أحكام الجهاد والأسرى، وصفة المنافقين، ومَثَل الجنة الموعودة للمتقين.`,
  `مدنية: صلح الحديبية وبيعة الرضوان، والبشارة بالفتح المبين.`,
  `مدنية: آداب التعامل مع النبي ﷺ، والنهي عن الغيبة والسخرية، وأخوّة الإيمان.`,
  `مكية: تقرير البعث والقيامة، وقرب الله من عبده، وأهوال الاحتضار والحساب.`,
  `مكية: أدلة كونية على البعث، وقصة ضيف إبراهيم عليه السلام وإهلاك قوم لوط.`,
  `مكية: القسم بجبل الطور، ووصف نعيم الجنة وأهوال العذاب.`,
  `مكية: تصديق رؤية النبي ﷺ لجبريل عليه السلام، وبطلان عبادة الأصنام، وفيها سجدة تلاوة.`,
  `مكية: انشقاق القمر، وتكرار مصير الأمم المكذّبة (نوح وعاد وثمود ولوط وفرعون).`,
  `قيل مكية وقيل مدنية: تعداد نعم الله («فبأي آلاء ربكما تكذبان»)، ووصف الجنتين.`,
  `مكية: أهوال القيامة، وانقسام الناس ثلاثة أقسام: السابقون، وأصحاب اليمين، وأصحاب الشمال.`,
  `مدنية: الحث على الإنفاق والجهاد، وبيان حقيقة الدنيا، وذكر إنزال الحديد.`,
  `مدنية: قصة المرأة المجادِلة في الظهار، وآداب المجالس، وموالاة المؤمنين لا أعداء الله.`,
  `مدنية: إجلاء بني النضير، وأحكام الفيء، وأسماء الله الحسنى في خاتمتها.`,
  `مدنية: أحكام موالاة الكفار المحاربين، وامتحان المهاجرات.`,
  `مدنية: الحث على الجهاد والثبات في الصف، وبشارة عيسى عليه السلام بالنبي ﷺ.`,
  `مدنية: أحكام صلاة الجمعة، والحث على السعي إليها وترك البيع وقتها.`,
  `مدنية: كشف صفات المنافقين وخطرهم، والتحذير من الغفلة عن ذكر الله.`,
  `مدنية: حقيقة «يوم التغابن» (القيامة)، والحث على الإنفاق والتوكل على الله.`,
  `مدنية: أحكام الطلاق والعدّة والنفقة.`,
  `مدنية: حادثة تحريم النبي ﷺ شيئًا على نفسه، والحث على التوبة النصوح.`,
  `مكية: تقرير أن المُلك لله وحده، والتأمل في خلق السماوات، ومصير المكذّبين.`,
  `مكية: القسم بالقلم، وقصة أصحاب البستان الممتنعين عن الصدقة، والثناء على خُلق النبي ﷺ.`,
  `مكية: أهوال يوم القيامة («الحاقّة»)، ومصير الأمم المكذّبة، وتنزيه القرآن عن الشعر والكهانة.`,
  `مكية: سؤال سائل بعذاب واقع، وصفات المصلّين الفائزين.`,
  `مكية: دعوة نوح عليه السلام لقومه ليلًا ونهارًا، وإصرارهم على الكفر.`,
  `مكية: استماع نفر من الجن للقرآن وإيمانهم به، وإخبارهم قومهم بذلك.`,
  `مكية: الأمر بقيام الليل وتلاوة القرآن، ثم تخفيف ذلك لاحقًا.`,
  `مكية، من أوائل ما نزل: الأمر بالإنذار والدعوة، وقصة الوليد بن المغيرة.`,
  `مكية: تقرير البعث وأهوال القيامة، وتذكير بمراحل خلق الإنسان.`,
  `قيل مدنية وقيل مكية، وتُسمّى أيضًا «الدهر»: خلق الإنسان وابتلاؤه، ووصف نعيم الأبرار في الجنة.`,
  `مكية: القسم بالرياح والملائكة، وتكرار «ويل يومئذ للمكذبين».`,
  `مكية: «النبأ العظيم» (البعث)، ودلائل قدرة الله في الكون، ووصف الجنة والنار.`,
  `مكية: قصة موسى وفرعون، وأهوال يوم القيامة («الطامة الكبرى»).`,
  `مكية: عتاب النبي ﷺ في قصة ابن أم مكتوم، ودرس في تكريم طالب العلم.`,
  `مكية: مشاهد انطواء الكون يوم القيامة، وتبرئة النبي ﷺ من تهمة الجنون.`,
  `مكية: مشاهد انشقاق السماء، وتذكير الإنسان بغروره تجاه ربه الكريم.`,
  `قيل من آخر ما نزل بمكة وقيل من أول ما نزل بالمدينة: التحذير من التطفيف في الكيل والميزان، ومصير الفجار والأبرار.`,
  `مكية: انشقاق السماء وطيّ الأرض، وتلقّي كل إنسان كتابه يوم القيامة.`,
  `مكية: قصة أصحاب الأخدود وابتلاء المؤمنين، وتقرير أن الله بالمرصاد للظالمين.`,
  `مكية: القسم بالنجم الطارق، وحفظ الملائكة للإنسان، وقدرة الله على البعث.`,
  `مكية: تسبيح الله وتيسير القرآن للذكرى، والمفاضلة بين نعيم الآخرة وزينة الدنيا.`,
  `مكية: وصف يوم القيامة («الغاشية»)، والدعوة إلى التفكر في مخلوقات الله.`,
  `مكية: القسم بالفجر وليالٍ معلومة، ومصير الأمم المتكبرة (عاد وثمود وفرعون).`,
  `مكية: القسم بمكة المكرمة، وبيان مشقة الحياة الدنيا، والحث على فكّ الرقاب وإطعام المسكين.`,
  `مكية: القسم بالشمس وتوابعها، وقصة ثمود وناقة صالح عليه السلام.`,
  `مكية: تفاوت الناس بين الإنفاق والبخل، وتيسير كل امرئ لما خُلق له.`,
  `مكية: تسلية النبي ﷺ بعد انقطاع الوحي مؤقتًا، وتذكيره بنعم الله عليه.`,
  `مكية: شرح صدر النبي ﷺ ورفع ذكره، وبشارة «إن مع العسر يسرًا».`,
  `مكية: القسم بالتين والزيتون، وتكريم خلق الإنسان ثم ردّه إلى أسفل سافلين إلا المؤمنين.`,
  `مكية، أول ما نزل من القرآن: الأمر بالقراءة باسم الله، وتقرير نعمة العلم.`,
  `مكية: فضل ليلة القدر، ونزول القرآن فيها.`,
  `مدنية: موقف أهل الكتاب والمشركين من «البيّنة» (الرسول والقرآن)، وجزاء الفريقين.`,
  `مدنية: زلزلة الأرض يوم القيامة، ومحاسبة الإنسان على مثقال ذرة خير أو شر.`,
  `مكية: القسم بخيل الجهاد، والتذكير بكفران الإنسان لنعم ربه.`,
  `مكية: وصف يوم القيامة («القارعة»)، وميزان الأعمال.`,
  `مكية: التحذير من الانشغال بالتكاثر في الدنيا عن الآخرة.`,
  `مكية، سورة جامعة: سبب النجاة من الخسران هو الإيمان والعمل الصالح والتواصي بالحق والتواصي بالصبر.`,
  `مكية: التحذير من الهمز واللمز وجمع المال والتفاخر به.`,
  `مكية: قصة أصحاب الفيل ومحاولتهم هدم الكعبة، وإهلاكهم بطير أبابيل.`,
  `مكية: تذكير قريش بنعمة الأمن ورحلتي الشتاء والصيف، والأمر بعبادة ربّ هذا البيت.`,
  `مكية: صفات المكذّبين بالدين (قسوة القلب، وترك اليتيم، ومنع الماعون)، والمرائين في صلاتهم.`,
  `مكية، أقصر سورة في القرآن: إعطاء النبي ﷺ الكوثر، والأمر بالصلاة والنحر.`,
  `مكية: البراءة من عبادة المشركين وأصنامهم، وإفراد الله بالعبادة.`,
  `مدنية، من آخر ما نزل: البشارة بالفتح ودخول الناس في دين الله أفواجًا، والأمر بالتسبيح والاستغفار.`,
  `مكية: ذمّ أبي لهب وامرأته لعداوتهما الشديدة للنبي ﷺ.`,
  `مكية: تقرير التوحيد الخالص وتنزيه الله عن الشبيه والمثيل، وتَعدِل ثلث القرآن.`,
  `مكية (وقيل مدنية)، إحدى المعوذتين: الاستعاذة بالله من شرّ المخلوقات والحسد والسحر.`,
  `مكية (وقيل مدنية)، إحدى المعوذتين: الاستعاذة بالله من وسواس الشيطان الخنّاس.`,
] as const;

// ─── ترتيب النزول (revelationOrder) ────────────────────────────────────────
// هذا **تصنيف علمي تاريخي معروف**، وليس محتوًى مُولَّدًا آليًا — يوثِّق مكان
// كل سورة في تسلسل نزولها الفعلي على النبي ﷺ (١=أول ما نزل...١١٤=آخر ما
// نزل)، بخلاف رقم السورة في المصحف الحالي وهو ترتيب توقيفي لا علاقة له
// بالنزول. **لا يُستخدَم لإعادة ترتيب أي نص أو بيانات مصحفية مخزَّنة** —
// حقل عرضي/تصنيفي إضافي فقط، تمامًا كحقل "مكية/مدنية" أعلاه.
//
// المصدر: القائمة الزمنية الأشهر تداولًا في المراجع والمواقع الإسلامية
// الحديثة لترتيب النزول (تبدأ: العلق ٩٦، القلم ٦٨، المزمل ٧٣، المدثر ٧٤،
// الفاتحة ١...، وتنتهي: المائدة ٥، التوبة ٩، النصر ١١٠) — وهي مطابقة لِما
// يُنسَب لرواية ابن عباس كما أوردها السيوطي في "الإتقان في علوم القرآن"
// وابن النديم في "الفهرست". تحقَّقتُ من هذه القائمة عمليًا (2026-07-19)
// عبر مطابقتها بمصدرين مستقلّين على الشبكة (مقالتا "ترتيب السور حسب
// النزول" على mawdoo3.com وhodaalquran.com) وتأكَّدت من: (أ) شمولها
// ١١٤ رقمًا فريدًا بلا تكرار ولا نقص، (ب) تطابق ترتيبها الداخلي حرفيًا مع
// كلا المصدرين فيما يخص أول ٣٠ سورة نزولاً وكل السور المدنية الـ٢٨
// (الأخيرة: الحج، النور، المنافقون...، النصر)، عدا اختلافات طفيفة تبيَّن
// أنها أخطاء استخراج من أداة تلخيص الصفحة نفسها لا فروقًا في المصدر
// (تكرار/حذف صف عرَضًا). **تنبيه أمانةً**: السيوطي نفسه ذكر في الإتقان أن
// هناك أكثر من رواية لترتيب النزول (منسوبة لجابر بن زيد والحسين وعكرمة
// وابن عباس، وترتيب رابع مجهول قائله)، وليس هناك اتفاق قطعي بين العلماء
// على ترتيب واحد ملزم — خصوصًا الترتيب الدقيق بين بعض السور المتقاربة
// زمنيًا (كسورتي الدخان/الجاثية، أو مجموعة أواخر السور المدنية). القائمة
// أدناه هي الأشهر والأكثر اعتمادًا في المصاحف والمواقع المرجعية الحديثة،
// وليست الإجماع الحصري الوحيد الممكن لهذه المسألة الاجتهادية جزئيًا.
//
// الفهرسة: index 0 = سورة رقم 1 (الفاتحة)...index 113 = سورة رقم 114
// (الناس)، والقيمة = ترتيب نزولها (1-114).
const REVELATION_ORDER: readonly number[] = [
  5,87,89,92,112,55,39,88,113,51,
  52,53,96,72,54,70,50,69,44,45,
  73,103,74,102,42,47,48,49,85,84,
  57,75,90,58,43,41,56,38,59,60,
  61,62,63,64,65,66,95,111,106,34,
  67,76,23,37,97,46,94,105,101,91,
  110,108,104,109,99,107,77,2,78,79,
  71,40,3,4,31,98,33,80,81,24,
  7,82,86,83,27,36,8,68,10,35,
  26,9,11,12,28,1,25,100,93,14,
  30,16,13,32,19,29,17,15,18,114,
  6,22,20,21,
] as const;

export type StaticSurahMeta = {
  number: number;
  name: string;
  ayahs: number;
  revelation: "مكية" | "مدنية";
  revelationOrder: number;
  /** نبذة موجزة: تصنيف مكية/مدنية (بصياغة "قيل...وقيل..." حيث الخلاف مشهور
   * وموثَّق) + الموضوع العام ومقاصد السورة. راجع تعليق SURAH_DESCRIPTIONS
   * أعلاه لمصدر هذا المحتوى وقيوده. */
  description: string;
};

export function getSurahList(): StaticSurahMeta[] {
  return SURAH_NAMES_AR.map((name, i) => ({
    number: i + 1,
    name,
    ayahs: SURAH_AYAH_COUNTS[i],
    revelation: MADANI.has(i + 1) ? "مدنية" : "مكية",
    revelationOrder: REVELATION_ORDER[i],
    description: SURAH_DESCRIPTIONS[i],
  }));
}

export function getSurahMeta(number: number): StaticSurahMeta {
  const idx = Math.max(0, Math.min(113, number - 1));
  return {
    number: idx + 1,
    name: SURAH_NAMES_AR[idx],
    ayahs: SURAH_AYAH_COUNTS[idx],
    revelation: MADANI.has(idx + 1) ? "مدنية" : "مكية",
    revelationOrder: REVELATION_ORDER[idx],
    description: SURAH_DESCRIPTIONS[idx],
  };
}

// ─── Surah start pages — Mushaf al-Madinah KFGQPC, Hafs ʿan ʿĀṣim ─────────
// Index 0 = Surah 1 (Al-Fatiha, page 1). 114 entries total.
export const SURAH_START_PAGES: readonly number[] = [
    1,   2,  50,  77, 106, 128, 151, 177, 187, 208,
  221, 235, 249, 255, 262, 267, 282, 293, 305, 312,
  322, 332, 342, 350, 359, 367, 377, 385, 396, 404,
  411, 415, 418, 428, 434, 440, 446, 453, 458, 467,
  477, 483, 489, 496, 499, 502, 507, 511, 515, 518,
  520, 523, 526, 528, 531, 534, 537, 542, 545, 549,
  551, 553, 554, 556, 558, 560, 562, 564, 566, 568,
  570, 572, 574, 575, 577, 578, 580, 582, 583, 585,
  586, 587, 587, 589, 590, 591, 591, 592, 593, 594,
  595, 595, 596, 596, 597, 597, 598, 598, 599, 599,
  600, 600, 601, 601, 601, 602, 602, 602, 603, 603,
  603, 604, 604, 604,
] as const;

export function getSurahForPage(page: number): StaticSurahMeta {
  const p = Math.max(1, Math.min(604, page));
  let idx = 0;
  for (let i = 0; i < SURAH_START_PAGES.length; i++) {
    if (SURAH_START_PAGES[i] <= p) idx = i;
    else break;
  }
  return getSurahMeta(idx + 1);
}

const BISMILLAH_WORD_COUNT = 4;

/**
 * البسملة ليست آية منفصلة لكل السور في مصدر البيانات — هي **مدمَجة داخل
 * نص الآية 1** لكل سورة عدا الفاتحة (البسملة = الآية 1 نفسها) والتوبة
 * (لا بسملة إطلاقًا). تحقّق مباشر: سورة 2 آية 1 = "بِسْمِ ٱللَّهِ
 * ٱلرَّحْمَٰنِ ٱلرَّحِيمِ الٓمٓ" (بسملة + بداية الآية الحقيقية متصلتين).
 *
 * يُستخدَم هذا لغرضين منفصلين يجب أن يبقيا متوافقَين: (1) استبعاد البسملة
 * من الكلمات المرجعية القابلة للاختبار في اختبار التسميع
 * (quran-reference-words.ts)، و(2) عرض نص الآية في قارئ المصحف بلا تكرار
 * بصري للبسملة (تُعرض مرة واحدة فقط كعنوان فوق السورة عبر
 * isFirstOfSurah/showBismillah في MushafPage.tsx، لا داخل نص الآية 1
 * أيضًا). **لا يُعدّل النص القرآني المخزَّن أبدًا** — دالة عرض/اشتقاق محضة.
 */
export function stripEmbeddedBismillah(surahNumber: number, ayahNumberInSurah: number, text: string): string {
  if (ayahNumberInSurah !== 1) return text;
  if (surahNumber === 1 || surahNumber === 9) return text; // الفاتحة: البسملة هي الآية ذاتها. التوبة: لا بسملة.
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= BISMILLAH_WORD_COUNT) return text; // احتياط: لا نُفرغ الآية بالخطأ
  return words.slice(BISMILLAH_WORD_COUNT).join(" ");
}

// ─── Qiraat (القراءات العشر) ──────────────────────────────────────────────

export type Qiraat = {
  id: string;
  name: string;
  apiEdition: string | null; // null = uses Hafs fallback
};

export const QIRAAT_LIST: Qiraat[] = [
  { id: "hafs",     name: "حفص عن عاصم",           apiEdition: "quran-uthmani" },
  { id: "warsh",    name: "ورش عن نافع",             apiEdition: "quran-warsh-tanzil" },
  { id: "qaloon",   name: "قالون عن نافع",           apiEdition: null },
  { id: "sousi",    name: "السوسي عن أبي عمرو",      apiEdition: null },
  { id: "duri-k",   name: "الدوري عن الكسائي",       apiEdition: null },
  { id: "kasai",    name: "الكسائي",                  apiEdition: null },
  { id: "hamza",    name: "حمزة الزيات",              apiEdition: null },
  { id: "khuzai",   name: "الخزاعي عن خلف",          apiEdition: null },
  { id: "ibn-zakwan","name": "ابن ذكوان عن ابن عامر", apiEdition: null },
  { id: "hisham",   name: "هشام عن ابن عامر",        apiEdition: null },
];

const QIRAAT_PREF_KEY = "mj-quran-qiraat-v1";
export function getQiraatPref(): string {
  try { return localStorage.getItem(QIRAAT_PREF_KEY) || "hafs"; } catch { return "hafs"; }
}
export function setQiraatPref(id: string) {
  try { localStorage.setItem(QIRAAT_PREF_KEY, id); } catch { /* ignore */ }
}

export async function fetchSurahDetailQiraat(surahNumber: number, qiraatId: string): Promise<SurahDetail> {
  const q = QIRAAT_LIST.find((r) => r.id === qiraatId);
  const edition = q?.apiEdition ?? "quran-uthmani";
  const key = `surah-${surahNumber}-${edition}`;
  const cached = readCache<SurahDetail>(key);
  if (cached) return cached;

  const res = await fetch(`${BASE}/surah/${surahNumber}/${edition}`, {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return fetchSurahDetail(surahNumber); // fallback to Hafs
  const json = await res.json();
  if (json.code !== 200 || !json.data) return fetchSurahDetail(surahNumber);
  const detail: SurahDetail = json.data;
  writeCache(key, detail);
  return detail;
}

// ─── Juz (الأجزاء) ────────────────────────────────────────────────────────

export type JuzData = {
  juzNumber: number;
  ayahs: Ayah[];
  surahs: Array<{ number: number; name: string; start: number; end: number }>;
};

export async function fetchJuz(juzNumber: number, edition = "quran-uthmani"): Promise<JuzData> {
  const key = `juz-${juzNumber}-${edition}`;
  const cached = readCache<JuzData>(key);
  if (cached) return cached;

  const res = await fetch(`${BASE}/juz/${juzNumber}/${edition}`, {
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`AlQuran Cloud juz: HTTP ${res.status}`);
  const json = await res.json();
  if (json.code !== 200 || !json.data) throw new Error("AlQuran Cloud: unexpected juz response");

  const rawAyahs: Array<{
    number: number;
    numberInSurah: number;
    text: string;
    juz: number;
    page: number;
    sajda: Ayah["sajda"];
    surah: { number: number; name: string };
  }> = json.data.ayahs;

  const ayahs: Ayah[] = rawAyahs.map((a) => ({
    number: a.number,
    numberInSurah: a.numberInSurah,
    text: a.text,
    juz: a.juz,
    page: a.page,
    sajda: a.sajda,
    surahNumber: a.surah.number,
  }));

  // Build surah groups
  const surahMap = new Map<number, { number: number; name: string; start: number; end: number }>();
  rawAyahs.forEach((a) => {
    const existing = surahMap.get(a.surah.number);
    if (!existing) {
      surahMap.set(a.surah.number, { number: a.surah.number, name: a.surah.name, start: a.numberInSurah, end: a.numberInSurah });
    } else {
      existing.end = a.numberInSurah;
    }
  });
  const surahs = Array.from(surahMap.values());

  const result: JuzData = { juzNumber, ayahs, surahs };
  writeCache(key, result);
  return result;
}

export async function fetchAyahsOnPage(page: number, edition = "quran-uthmani"): Promise<{ surahNumber: number; ayahNumber: number }[]> {
  const key = `page-${page}-${edition}`;
  const cached = readCache<{ surahNumber: number; ayahNumber: number }[]>(key);
  if (cached) return cached;

  const res = await fetch(`${BASE}/page/${page}/${edition}`, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) return [];
  const json = await res.json();
  if (json.code !== 200 || !json.data?.ayahs) return [];

  const result = (json.data.ayahs as Array<{ surah: { number: number }; numberInSurah: number }>).map((a) => ({
    surahNumber: a.surah.number,
    ayahNumber: a.numberInSurah,
  }));
  writeCache(key, result);
  return result;
}

// ─── Daily Wird state (persisted in localStorage) ─────────────────────────

export type DailyWirdState = {
  pagesPerDay: number;
  currentSurah: number;
  currentAyah: number;
  completedToday: number;
  lastDate: string;
  monthlyTotal: number;
  streak: number;
  weeklyLogs: Record<string, number>;
  totalPagesEver: number;
};

const WIRD_KEY = "mj-quran-wird-v3";

export function getDailyWirdState(): DailyWirdState {
  try {
    const raw = localStorage.getItem(WIRD_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DailyWirdState>;
      return {
        pagesPerDay: parsed.pagesPerDay ?? 2,
        currentSurah: parsed.currentSurah ?? 1,
        currentAyah: parsed.currentAyah ?? 1,
        completedToday: parsed.completedToday ?? 0,
        lastDate: parsed.lastDate ?? "",
        monthlyTotal: parsed.monthlyTotal ?? 0,
        streak: parsed.streak ?? 0,
        weeklyLogs: parsed.weeklyLogs ?? {},
        totalPagesEver: parsed.totalPagesEver ?? 0,
      };
    }
  } catch { /* ignore */ }
  return { pagesPerDay: 2, currentSurah: 1, currentAyah: 1, completedToday: 0, lastDate: "", monthlyTotal: 0, streak: 0, weeklyLogs: {}, totalPagesEver: 0 };
}

export function prevDateStr(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function weeklyTotal(logs: Record<string, number>): number {
  const today = new Date();
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    total += logs[k] ?? 0;
  }
  return total;
}

export function saveDailyWirdState(state: DailyWirdState) {
  try { localStorage.setItem(WIRD_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

// ─── Position persistence ──────────────────────────────────────────────────
const POS_KEY = "mj-quran-pos-v3";

export function savePosition(surah: number, ayah: number) {
  try {
    localStorage.setItem(POS_KEY, JSON.stringify({ surah, ayah, at: Date.now() }));
  } catch {
    // ignore
  }
}

export function loadPosition(): { surah: number; ayah: number } | null {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const surah = Number(parsed?.surah);
    const ayah = Number(parsed?.ayah);
    if (!Number.isFinite(surah) || surah < 1 || surah > 114) return null;
    if (!Number.isFinite(ayah) || ayah < 1) return null;
    return { surah, ayah };
  } catch {
    return null;
  }
}

// ─── Page-view position persistence (وضع "الصفحة" الحقيقي) ────────────────
const PAGE_POS_KEY = "mj-quran-page-pos-v1";

export function savePagePosition(page: number) {
  try {
    localStorage.setItem(PAGE_POS_KEY, JSON.stringify({ page, at: Date.now() }));
  } catch {
    // ignore
  }
}

export function loadPagePosition(): number | null {
  try {
    const raw = localStorage.getItem(PAGE_POS_KEY);
    if (!raw) return null;
    const page = Number(JSON.parse(raw)?.page);
    return Number.isFinite(page) && page >= 1 && page <= 604 ? page : null;
  } catch {
    return null;
  }
}

/** الجزء/الحزب/الربع من hizbQuarter الخام (1–240 عبر كامل المصحف؛ كل حزب = 4 أرباع، كل جزء = حزبان). */
export function deriveHizbRub(hizbQuarter: number): { hizb: number; rubInHizb: number } {
  const hizb = Math.ceil(hizbQuarter / 4);
  const rubInHizb = ((hizbQuarter - 1) % 4) + 1;
  return { hizb, rubInHizb };
}
