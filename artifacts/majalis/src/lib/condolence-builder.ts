// ─── Types ──────────────────────────────────────────────────────────────────

export type TemplateId =
  | "classic-elegant"
  | "dark-luxury"
  | "islamic-green"
  | "modern-minimal"
  | "warm-cream"
  | "blue-calm"
  | "soft-rose"
  | "balanced-gray";

export type FontId =
  | "amiri" | "scheherazade" | "noto-naskh" | "cairo"
  | "tajawal" | "lateef" | "reem-kufi" | "aref-ruqaa";

export type PaletteId =
  | "classic-black" | "islamic-green" | "royal-blue" | "rich-brown" | "modern-gray";

export type ImageFilter = "none" | "bw" | "sepia" | "warm";

export type BuilderForm = {
  templateId: TemplateId;
  fontId: FontId;
  headingSize: number;
  bodySize: number;
  paletteId: PaletteId;
  phrase: string;
  name: string;
  date: string;
  familyName: string;
  imageDataUrl: string | null;
  imageFilter: ImageFilter;
  imageBrightness: number;
  extraText: string;
};

// ─── Templates ──────────────────────────────────────────────────────────────

export type Template = {
  id: TemplateId;
  label: string;
  description: string;
  bgColor: string;
  accentColor: string;
  textColor: string;
};

export const TEMPLATES: Template[] = [
  {
    id: "classic-elegant",
    label: "الكلاسيكي الأنيق",
    description: "أبيض ناعم مع لمسات ذهبية",
    bgColor: "#ffffff",
    accentColor: "#c8a84b",
    textColor: "#1a1a1a",
  },
  {
    id: "dark-luxury",
    label: "الأسود الفاخر",
    description: "خلفية غامقة بنص ذهبي",
    bgColor: "#0e0e0e",
    accentColor: "#d4af37",
    textColor: "#d4af37",
  },
  {
    id: "islamic-green",
    label: "الأخضر الإسلامي",
    description: "زخارف إسلامية وألوان الطبيعة",
    bgColor: "#eaf4ea",
    accentColor: "#1b5e20",
    textColor: "#1b5e20",
  },
  {
    id: "modern-minimal",
    label: "البسيط الحديث",
    description: "نص أبيض على صورة أو gradient",
    bgColor: "#1f1f1f",
    accentColor: "#ffffff",
    textColor: "#ffffff",
  },
  {
    id: "warm-cream",
    label: "الزعفراني الرقيق",
    description: "بيج دافئ بإطارات فخمة",
    bgColor: "#f5ede0",
    accentColor: "#c8874a",
    textColor: "#3e2210",
  },
  {
    id: "blue-calm",
    label: "الياقوتي الهادئ",
    description: "gradient أزرق كلاسيكي",
    bgColor: "#0d2b5e",
    accentColor: "#90caf9",
    textColor: "#ffffff",
  },
  {
    id: "soft-rose",
    label: "الزهري الرقيق",
    description: "gradient وردي ناعم",
    bgColor: "#fde8ef",
    accentColor: "#c2185b",
    textColor: "#880e4f",
  },
  {
    id: "balanced-gray",
    label: "الرمادي المتوازن",
    description: "تصميم متناسق هادئ",
    bgColor: "#555555",
    accentColor: "#d0d0d0",
    textColor: "#ffffff",
  },
];

// ─── Fonts ──────────────────────────────────────────────────────────────────

export type Font = { id: FontId; label: string; css: string };

export const FONTS: Font[] = [
  { id: "amiri",        label: "أميري",       css: "'Amiri', 'Times New Roman', serif" },
  { id: "scheherazade", label: "شهرزاد",      css: "'Scheherazade New', 'Amiri', serif" },
  { id: "noto-naskh",   label: "نوتو نسخ",    css: "'Noto Naskh Arabic', serif" },
  { id: "cairo",        label: "القاهرة",     css: "'Cairo', sans-serif" },
  { id: "tajawal",      label: "تجوّل",       css: "'Tajawal', sans-serif" },
  { id: "lateef",       label: "لطيف",        css: "'Lateef', 'Scheherazade New', serif" },
  { id: "reem-kufi",    label: "ريم كوفي",    css: "'Reem Kufi', sans-serif" },
  { id: "aref-ruqaa",   label: "عارف رقعة",  css: "'Aref Ruqaa', serif" },
];

// ─── Color Palettes ─────────────────────────────────────────────────────────

export type ColorPalette = {
  id: PaletteId;
  label: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
};

export const PALETTES: ColorPalette[] = [
  { id: "classic-black",  label: "الكلاسيكي",  primary: "#1a1a1a", secondary: "#555555", accent: "#d4af37", background: "#ffffff" },
  { id: "islamic-green",  label: "الإسلامي",   primary: "#1b5e20", secondary: "#4caf50", accent: "#d4e8b8", background: "#f1f8f1" },
  { id: "royal-blue",     label: "الملكي",     primary: "#0d47a1", secondary: "#1976d2", accent: "#e3f2fd", background: "#f5f9ff" },
  { id: "rich-brown",     label: "البني الفخم", primary: "#3e2723", secondary: "#795548", accent: "#ffd54f", background: "#fdf6ee" },
  { id: "modern-gray",    label: "الرمادي",    primary: "#424242", secondary: "#757575", accent: "#b0bec5", background: "#fafafa" },
];

// ─── Phrase Categories ───────────────────────────────────────────────────────

export type PhraseCategory = { label: string; phrases: string[] };

export const PHRASE_CATEGORIES: PhraseCategory[] = [
  {
    label: "الصبر والرضا",
    phrases: [
      "إنا لله وإنا إليه راجعون",
      "اللهم اجعل مصيبتنا في ديننا لا في أهلينا وأحبتنا",
      "الله يتغمدهم برحمته ويسكنهم فسيح جنته",
      "عزاؤنا أن الله تعالى بحكمته البالغة قد اختارهم",
      "نسأل الله أن يتقبل منا ومنهم وأن يرفع درجاتهم",
    ],
  },
  {
    label: "الموت والحياة",
    phrases: [
      "لا نعلم إلا خيراً، وحسبنا الله ونعم الوكيل",
      "لكل نفس ذائقة الموت، وعند الله تجتمع الأرواح",
      "الحياة ملتقى والموت مفترق، نسأل الله حسن الختام",
      "كل من عليها فان، ويبقى وجه ربك ذو الجلال والإكرام",
      "ذهبوا إلى الله وتركوا خلفهم الذكرى الطيبة والأثر الحسن",
    ],
  },
  {
    label: "الدعاء والمغفرة",
    phrases: [
      "اللهم اغفر لهم وارحمهم وعافهم واعف عنهم",
      "اللهم أسكنهم فسيح جنانك وأنزل عليهم شآبيب رحمتك",
      "اللهم ألحقهم بالصالحين وبوّئهم دار المقيمين",
      "غفر الله له ذنبه وأكرم نزله وأسكنه الفردوس الأعلى",
      "اللهم نقّهم كما ينقى الثوب الأبيض من الدنس",
    ],
  },
  {
    label: "الذكرى الطيبة",
    phrases: [
      "ستبقى ذكراك عطرة في قلوبنا إلى الأبد",
      "نتذكرهم برقة الحنين وصفاء الحب الخالص",
      "رحل من رحل وبقيت السيرة الطيبة والذكرى الجميلة",
      "ما أعظم فقدك، وما أجمل ذكراك في قلوب أحبابك",
      "تتركنا الأجسام وتبقى الروح في القلوب إلى الأبد",
    ],
  },
  {
    label: "التعازي المختصرة",
    phrases: [
      "أحسن الله عزاءكم وغفر للفقيد وأسكنه الجنة",
      "الله يصبركم على فقدكم ويجبر مصابكم الجلل",
      "تقبل الله منا ومنكم وأسكنه فسيح الجنة",
      "عزاؤنا أن الله معنا في كل محنة وابتلاء",
      "ربنا يتغمدهم بواسع رحمته ويرفع درجاتهم",
    ],
  },
  {
    label: "العزاء العام",
    phrases: [
      "الحمد لله على كل حال، والموت حق والحياة أمانة",
      "لا حول ولا قوة إلا بالله العلي العظيم",
      "اللهم إن كان محسناً فزد في حسناته وإن كان مسيئاً فتجاوز عنه",
      "نسأل الله حسن الختام لنا وللمسلمين جميعاً",
      "اللهم ثبّتنا عند الفتن والمصائب وأحسن عزاءنا",
    ],
  },
  {
    label: "معانٍ قرآنية",
    phrases: [
      "إنا لله وإنا إليه راجعون، وإنا إلى ربنا لمنقلبون",
      "كل نفس ذائقة الموت ثم إلينا ترجعون",
      "إن الله مع الصابرين في محنتهم وابتلائهم",
      "الصابرون في البأساء والضراء لهم البشرى والرحمة",
      "يا أيتها النفس المطمئنة ارجعي إلى ربك راضية مرضية",
    ],
  },
  {
    label: "عزاء الصغار",
    phrases: [
      "جزع قلبنا لفقدان البراءة والحنان، الله يصبر قلوبكم",
      "تلك القلوب البريئة الصغيرة صعدت إلى جنة الرحمن",
      "نورهم الصغير أضاء أيامنا رغم قصر اللقاء",
      "ما أعظم فقده وما أجمل ذكراه في قلوب أحبابه",
      "بالصبر الجميل نودّع أحبتنا الصغار إلى رحمة الله",
    ],
  },
];

// ─── Default Form ────────────────────────────────────────────────────────────

export const defaultBuilderForm: BuilderForm = {
  templateId: "classic-elegant",
  fontId: "amiri",
  headingSize: 34,
  bodySize: 22,
  paletteId: "classic-black",
  phrase: "إنا لله وإنا إليه راجعون",
  name: "",
  date: "",
  familyName: "",
  imageDataUrl: null,
  imageFilter: "none",
  imageBrightness: 1,
  extraText: "",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getCssFilter(filter: ImageFilter, brightness: number): string {
  const parts: string[] = [];
  if (filter === "bw")    parts.push("grayscale(100%)");
  if (filter === "sepia") parts.push("sepia(85%)");
  if (filter === "warm")  parts.push("sepia(30%) saturate(140%) hue-rotate(-10deg)");
  if (brightness !== 1)   parts.push(`brightness(${brightness})`);
  return parts.length ? parts.join(" ") : "none";
}

export const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Amiri:ital@0;1&family=Scheherazade+New&family=Noto+Naskh+Arabic:wght@400;600;700&family=Cairo:wght@400;600;700&family=Tajawal:wght@400;500;700&family=Lateef&family=Reem+Kufi:wght@400;700&family=Aref+Ruqaa:ital@0;1&display=swap";
