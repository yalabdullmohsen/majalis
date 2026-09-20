import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, HelpCircle, LayoutList, Sparkles, Square, Volume2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { PROPHETS, getProphet, resolveProphetSlug, searchProphets, type ProphetRecord } from "@/lib/prophets-data";
import { applyPageSeo } from "@/lib/seo";
import { EMPTY } from "@/lib/ui-copy";
import { ShareButtons } from "@/components/ContentActions";
import { prophetArticleJsonLd, breadcrumbJsonLd } from "@/lib/seo-structured-data";
import { supabase } from "@/lib/supabase";
import { getKnowledgeItem, type KnowledgeItem } from "@/lib/knowledge-loader";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import { truncateAtWord } from "@/lib/utils";
import { ScholarlyTrustBadge } from "@/components/ScholarlyTrustBadge";
import { GraphRelatedRail } from "@/widgets/RelatedRail";
import { navigateTo } from "@/lib/navigation-intent";
import { goBackOrFallback } from "@/lib/navigation-back";
import { isSpeechReadAloudSupported } from "@/lib/speech-read-aloud";
import {
  playAiNarration,
  stopAiNarration,
  type NarrationEngine,
} from "@/lib/ai-narration";
import { unlockAudioOnUserGesture } from "@/lib/quran/quranRecitationService";
import "@/styles/pages/prophet-stories.css";
import { UtilityScreen } from "@/components/design-system/screens";
import { ProphetMushafMentions } from "@/components/prophets/ProphetMushafMentions";
import { PROPHET_MUSHAF_MENTIONS, PROPHET_MUSHAF_NAV_SOURCE } from "@/lib/prophet-mushaf-mentions";

function knowledgeBodyBlocks(body: string): { title?: string; paragraphs: string[] }[] {
  const chunks = body.split(/\n(?=##\s)/);
  return chunks
    .map((chunk) => {
      const lines = chunk.trim().split("\n").filter(Boolean);
      if (!lines.length) return null;
      const title = lines[0].startsWith("##")
        ? lines[0].replace(/^##\s*/, "").trim()
        : undefined;
      const paragraphs = (title ? lines.slice(1) : lines)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("###"))
        .filter((l) => !l.startsWith("- ") || l.length > 20);
      return paragraphs.length ? { title, paragraphs } : null;
    })
    .filter(Boolean) as { title?: string; paragraphs: string[] }[];
}

type Citation = { surah: string; ayahs: string; note: string };

// ── Palette & Helpers ────────────────────────────────────────────────────────

/* تنوّع ضمن هوية المنصة فقط: زمرد / فيروز / زيتوني / بحري-زمردي.
   أولو العزم يبقون على var(--mj-brand-deep) مع لمسة نحاسية (--prophet-accent) للتميّز. */
const PROPHET_HUE: Record<string, string> = {
  adam: "#3D6B52",
  idris: "#2A6B68",
  nuh: "#0E6B58",
  hud: "#4A6B3A",
  salih: "#3A6450",
  ibrahim: "var(--mj-brand-deep)",
  lut: "#1E6A48",
  ismail: "#1A6B40",
  "is-haq": "#2E6058",
  yaqub: "#245C55",
  yusuf: "#1B6B4A",
  ayyub: "#3A5C48",
  shuayb: "#17605A",
  musa: "var(--mj-brand-deep)",
  harun: "#1A5C4A",
  "dhul-kifl": "#2C5044",
  dawud: "#254A3C",
  sulayman: "var(--mj-brand-deep)",
  ilyas: "#2E5542",
  "al-yasa": "#186650",
  yunus: "#0F5C60",
  zakariyya: "#1A5A42",
  yahya: "#165840",
  isa: "#164A58",
  muhammad: "var(--mj-brand-deep)",
};

/** لمسة ثانوية (نحاسي أو فيروزي فاتح) — ضمن هوية المنصة */
const PROPHET_ACCENT: Record<string, string> = {
  adam: "#6B8F72",
  idris: "#4A9A92",
  nuh: "#2A9A80",
  hud: "#7A9A4A",
  salih: "#6A8A68",
  ibrahim: "#B8963F",
  lut: "#3A9A68",
  ismail: "#3A9A58",
  "is-haq": "#4A8A80",
  yaqub: "#3A8880",
  yusuf: "#2A9A68",
  ayyub: "#6A8A60",
  shuayb: "#2A8A82",
  musa: "#B8963F",
  harun: "#3A8A70",
  "dhul-kifl": "#5A7A68",
  dawud: "#B8963F",
  sulayman: "#C4A24A",
  ilyas: "#5A8A58",
  "al-yasa": "#2A9A70",
  yunus: "#2A8A90",
  zakariyya: "#3A8A58",
  yahya: "#2A8050",
  isa: "#3A7A90",
  muhammad: "#B8963F",
};

const IVORY = "#FAFAF8";
const MAX_MENTIONS = 136; /* موسى — أعلى ذِكر في اللوحة */

function prophetAccent(slug: string) {
  return PROPHET_ACCENT[slug] || "#B8963F";
}

/* بيانات تكميلية: عدد الذكر، المعجزة، الكتاب، المواضع القرآنية */
type Supplement = { mentioned: number; miracle?: string; book?: string; quranRef?: string };
const SUPPLEMENT: Record<string, Supplement> = {
  adam:        { mentioned: 25, miracle: "خُلق من طين وعُلِّم الأسماء كلها",                    quranRef: "البقرة: ٣٠-٣٩، طه: ١١٥-١٢٣" },
  idris:       { mentioned: 2,  miracle: "رفعه الله مكاناً علياً — كما في القرآن دون تفصيل زائد", quranRef: "مريم: ٥٦-٥٧، الأنبياء: ٨٥" },
  nuh:         { mentioned: 43, miracle: "السفينة والطوفان، أنجاه الله والمؤمنين",               quranRef: "هود: ٢٥-٤٨، نوح: ١-٢٨" },
  hud:         { mentioned: 7,  miracle: "نجاه الله من الريح العقيم التي أهلكت عاداً",            quranRef: "هود: ٥٠-٦٠، الأحقاف: ٢١-٢٦" },
  salih:       { mentioned: 9,  miracle: "ناقة الله آيةً لثمود — دون تفاصيل لم تثبت في الوحي",   quranRef: "الأعراف: ٧٣-٧٩، هود: ٦١-٦٨" },
  ibrahim:     { mentioned: 69, miracle: "لم تحرقه النار بعد أن أُلقي فيها، ﴿كُونِي بَرْدًا وَسَلَامًا﴾", book: "الصحف", quranRef: "البقرة: ١٢٤-١٣٢، الأنبياء: ٥١-٧١" },
  lut:         { mentioned: 27, miracle: "نجاه الله وقلب المدينة على أهلها",                     quranRef: "هود: ٧٧-٨٣، الحجر: ٥٨-٧٧" },
  ismail:      { mentioned: 12, miracle: "الرؤيا والذبح والفداء العظيم — كما في القرآن",           quranRef: "الصافات: ١٠١-١١١، إبراهيم: ٣٧" },
  "is-haq":    { mentioned: 17, miracle: "بُشّر به إبراهيم ووُصف بالنبوة في القرآن",              quranRef: "هود: ٧١، الصافات: ١١٢-١١٣" },
  yaqub:       { mentioned: 16, miracle: "عُلم من قصة يوسف ورُدّ بصره بقميصه",                   quranRef: "يوسف: ٤-٩٦" },
  yusuf:       { mentioned: 27, miracle: "أُوتي تأويل الأحاديث وحسن الخُلق",                     quranRef: "سورة يوسف كاملة" },
  ayyub:       { mentioned: 4,  miracle: "كشف الله ضرّه بعد بلاء شديد — بلا تحديد مدة لم تثبت",  quranRef: "الأنبياء: ٨٣-٨٤، ص: ٤١-٤٤" },
  shuayb:      { mentioned: 9,  miracle: "دعا إلى إيفاء الكيل والميزان ونجّاه الله مع المؤمنين", quranRef: "الأعراف: ٨٥-٩٣، هود: ٨٤-٩٥" },
  musa:        { mentioned: 136, miracle: "العصا، يده البيضاء، انفلاق البحر، التوراة",           book: "التوراة", quranRef: "القصص: ٣-٤٠، طه: ٩-٩٨" },
  harun:       { mentioned: 20, miracle: "وزير موسى ونبيّ معه في الدعوة",                       quranRef: "طه: ٢٩-٣٦، الأعراف: ١٤٢" },
  "dhul-kifl": { mentioned: 2,  miracle: "أثنى الله عليه في جملة الصابرين من الأنبياء",         quranRef: "الأنبياء: ٨٥، ص: ٤٨" },
  dawud:       { mentioned: 16, miracle: "أُلين له الحديد وسبَّحت معه الجبال",                   book: "الزبور", quranRef: "البقرة: ٢٥١، سبأ: ١٠-١١" },
  sulayman:    { mentioned: 17, miracle: "تسخير الريح والجن وفهم لغة الطير",                     quranRef: "النمل: ١٥-٤٤، سبأ: ١٢-١٤" },
  ilyas:       { mentioned: 2,  miracle: "دعا قومه إلى توحيد الله وترك عبادة البعل",            quranRef: "الصافات: ١٢٣-١٣٢، الأنعام: ٨٥" },
  "al-yasa":   { mentioned: 2,  miracle: "مذكور في القرآن مع الأخيار من الأنبياء",               quranRef: "الأنعام: ٨٦، ص: ٤٨" },
  yunus:       { mentioned: 4,  miracle: "بقاؤه حيًا في بطن الحوت ثم نجاته",                    quranRef: "يونس: ٩٨، الأنبياء: ٨٧-٨٨" },
  zakariyya:   { mentioned: 7,  miracle: "وُهب له يحيى وهو شيخ وامرأته عاقر",                  quranRef: "آل عمران: ٣٧-٤١، مريم: ١-١١" },
  yahya:       { mentioned: 2,  miracle: "النبوة والكتاب والحنان من لدن الله وهو صبي",           quranRef: "مريم: ١٢-١٥، آل عمران: ٣٩" },
  isa:         { mentioned: 25, miracle: "إبراء الأكمه والأبرص وإحياء الموتى والكلام في المهد", book: "الإنجيل", quranRef: "آل عمران: ٤٥-٥٩، مريم: ١٦-٣٤" },
  muhammad:    { mentioned: 4,  miracle: "القرآن الكريم، المعجزة الخالدة الباقية",              book: "القرآن الكريم", quranRef: "الأحزاب: ٤٠، الأنبياء: ١٠٧" },
};

const ULUL_AZM_SLUGS = ["nuh", "ibrahim", "musa", "isa", "muhammad"];

/** قائمة المعجزات/الآيات — مرتبة كترتيب الأنبياء، والنص من SUPPLEMENT لتفادي التعارض. */
const MIRACLE_AYAH_HINT: Record<string, string> = {
  adam: "البقرة: ٣١",
  idris: "مريم: ٥٦",
  nuh: "هود: ٤٠",
  hud: "هود: ٥٠",
  salih: "الأعراف: ٧٣",
  ibrahim: "الأنبياء: ٦٩",
  lut: "هود: ٨١",
  ismail: "الصافات: ١٠٢",
  "is-haq": "الصافات: ١١٢",
  yaqub: "يوسف: ٩٦",
  yusuf: "يوسف: ٤٣",
  ayyub: "الأنبياء: ٨٣",
  shuayb: "هود: ٩٤",
  musa: "الشعراء: ٦٣",
  harun: "طه: ٢٩",
  "dhul-kifl": "الأنبياء: ٨٥",
  dawud: "سبأ: ١٠",
  sulayman: "الأنبياء: ٨١",
  ilyas: "الصافات: ١٢٣",
  "al-yasa": "الأنعام: ٨٦",
  yunus: "الأنبياء: ٨٧",
  zakariyya: "مريم: ٨",
  yahya: "مريم: ١٢",
  isa: "آل عمران: ٤٩",
  muhammad: "البقرة: ٢٣",
};

const MIRACLES_LIST = PROPHETS.map((p) => {
  const sup = SUPPLEMENT[p.slug];
  return {
    slug: p.slug,
    nabi: `${p.arabicName} ﷺ`,
    miracle: (sup?.miracle ?? p.title).trim(),
    ayah: MIRACLE_AYAH_HINT[p.slug] ?? (sup?.quranRef?.split("،")[0]?.trim() || ""),
  };
}).filter((m) => m.miracle.length > 0);

function prophetColor(slug: string) { return PROPHET_HUE[slug] || IVORY; }

// ── Geometric SVG Components ────────────────────────────────────────────────

function IslamicStar({ size = 32, color = IVORY, opacity = 1 }: { size?: number; color?: string; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" opacity={opacity} aria-hidden="true">
      <polygon
        points="50,2 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35"
        fill={color}
      />
    </svg>
  );
}

function GeometricBorder({ color = IVORY, size = 18 }: { color?: string; size?: number }) {
  return (
    <div className="prophet-geo-border">
      {[...Array(3)].map((_, i) => (
        <IslamicStar key={i} size={size} color={color} opacity={0.8 - i * 0.2} />
      ))}
    </div>
  );
}

// ── Quiz Data ────────────────────────────────────────────────────────────────

const QUIZ_QUESTIONS = [
  { q: "من هو أكثر الأنبياء ذكراً في القرآن الكريم؟", a: "موسى", opts: ["إبراهيم", "موسى", "محمد", "عيسى"] },
  { q: "ما لقب نبي الله إبراهيم عليه السلام؟", a: "خليل الله", opts: ["صفيّ الله", "كليم الله", "خليل الله", "روح الله"] },
  { q: "من بنى الكعبة المشرفة مع أبيه إبراهيم؟", a: "إسماعيل", opts: ["إسحاق", "إسماعيل", "يعقوب", "يوسف"] },
  { q: "ما لقب نبي الله يونس عليه السلام؟", a: "ذو النون", opts: ["ذو الكفل", "ذو النون", "كليم الله", "صدّيق"] },
  { q: "من هو خاتم الأنبياء والمرسلين؟", a: "محمد ﷺ", opts: ["عيسى", "إبراهيم", "محمد ﷺ", "موسى"] },
  { q: "كم مرة ذُكر موسى في القرآن الكريم؟", a: "١٣٦ مرة", opts: ["٢٥ مرة", "٦٩ مرة", "١٣٦ مرة", "٢٧ مرة"] },
  { q: "من النبي الذي مكث في دعوة قومه ٩٥٠ سنة؟", a: "نوح", opts: ["إبراهيم", "نوح", "موسى", "هود"] },
  { q: "ما معجزة نبي الله داود؟", a: "تليين الحديد والزبور", opts: ["انفلاق البحر", "ناقة الله آية لثمود", "تليين الحديد والزبور", "الكلام في المهد"] },
  { q: "كم عدد الأنبياء المذكورين بأسمائهم في القرآن الكريم؟", a: "٢٥ نبياً", opts: ["١٨ نبياً", "٢٠ نبياً", "٢٥ نبياً", "٣٠ نبياً"] },
  { q: "من النبي الذي ابتُلي بالمرض ثم عافاه الله؟", a: "أيوب", opts: ["يونس", "أيوب", "يعقوب", "يوسف"] },
  { q: "ما الكتاب المنزَّل على نبي الله عيسى عليه السلام؟", a: "الإنجيل", opts: ["التوراة", "الزبور", "الإنجيل", "الصحف"] },
  { q: "أيُّ الأنبياء لُقِّب بـ «ذي الكفل»؟", a: "ذو الكفل", opts: ["ذو النون", "ذو الكفل", "ذو القرنين", "صدّيق"] },
  { q: "ما لقب نبي الله يوسف عليه السلام؟", a: "الصدّيق", opts: ["الحليم", "الصدّيق", "الكليم", "الأواه"] },
  { q: "ما لقب نبي الله موسى عليه السلام؟", a: "كليم الله", opts: ["خليل الله", "روح الله", "كليم الله", "صفيّ الله"] },
  { q: "من النبي الذي سُخِّر له الريح وعُلِّم منطق الطير وأُسيلت له الشياطين؟", a: "سليمان", opts: ["داود", "سليمان", "ذو القرنين", "إدريس"] },
];

// ── ProphetCard ──────────────────────────────────────────────────────────────

function ProphetCard({
  prophet,
  onSelect,
  index = 0,
}: {
  prophet: ProphetRecord;
  onSelect: () => void;
  index?: number;
}) {
  const color = prophetColor(prophet.slug);
  const accent = prophetAccent(prophet.slug);
  const sup = SUPPLEMENT[prophet.slug];
  const isUlulAzm = ULUL_AZM_SLUGS.includes(prophet.slug);
  const trait = prophet.keyAttributes?.[0]
    ? truncateAtWord(prophet.keyAttributes[0], 28)
    : prophet.peopleOrPlace
      ? truncateAtWord(prophet.peopleOrPlace, 28)
      : null;

  return (
    <div
      className={`prophet-lux-card${isUlulAzm ? " prophet-lux-card--azm" : ""}`}
      style={{
        "--prophet-color": color,
        "--prophet-accent": accent,
        "--card-i": index,
      } as React.CSSProperties}
      onClick={onSelect}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && onSelect()}
      tabIndex={0}
      role="button"
      aria-label={`عرض قصة ${prophet.arabicName} عليه السلام`}
    >
      <div className="prophet-lux-card__glow prophet-lux-card__glow--off" aria-hidden="true" hidden />
      <div className="prophet-lux-card__num">{prophet.id}</div>

      <div className="prophet-lux-card__star">
        <IslamicStar size={18} color={color} opacity={0.45} />
      </div>

      <div className="prophet-lux-card__body">
        <h3 className="prophet-lux-card__name">
          {prophet.arabicName}
          <span className="prophet-lux-card__pbuh"> عليه السلام</span>
        </h3>
        <p className="prophet-lux-card__title">{prophet.title}</p>
        <p className="prophet-lux-card__bio">{truncateAtWord(prophet.briefBio, 36)}</p>

        <div className="prophet-lux-card__chips" aria-label="بيانات ثانوية">
          {trait ? (
            <span className="prophet-lux-card__chip">{trait}</span>
          ) : null}
          {sup ? (
            <span className="prophet-lux-card__chip prophet-lux-card__chip--stat">
              ذُكر {sup.mentioned} مرة
            </span>
          ) : null}
          {isUlulAzm ? (
            <span className="prophet-lux-card__chip prophet-lux-card__chip--azm">أولو العزم</span>
          ) : null}
        </div>

        <div className="prophet-lux-card__footer">
          <span className="prophet-lux-card__read">اقرأ القصة</span>
        </div>
      </div>

      <span className="prophet-lux-card__go" aria-hidden="true">
        <ChevronLeft size={16} strokeWidth={2.5} />
      </span>
      <div className="prophet-lux-card__border" />
    </div>
  );
}

// ── ProphetDetailView ────────────────────────────────────────────────────────

type DetailSection = { id: string; label: string };

function ProphetDetailView({
  slug,
  onBack,
  onNavigate,
}: {
  slug: string;
  onBack: () => void;
  onNavigate: (slug: string) => void;
}) {
  const p = getProphet(slug);
  const canonicalSlug = p?.slug ?? resolveProphetSlug(slug);
  const sup = SUPPLEMENT[canonicalSlug];
  const [fontSize, setFontSize] = useState(16);
  const [dbStory, setDbStory] = useState<{ content: string; citations: Citation[] } | null>(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [knowledge, setKnowledge] = useState<KnowledgeItem | null>(null);
  const [knowledgeLoading, setKnowledgeLoading] = useState(true);
  const [readPct, setReadPct] = useState(0);
  const [activeSection, setActiveSection] = useState("bio");
  const [speechPlaying, setSpeechPlaying] = useState(false);
  const [speechEngine, setSpeechEngine] = useState<NarrationEngine>("none");
  const [speechUnsupported, setSpeechUnsupported] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const articleRef = useRef<HTMLElement>(null);
  const prevProphet = p && p.id > 1 ? PROPHETS[p.id - 2] : null;
  const nextProphet = p && p.id < PROPHETS.length ? PROPHETS[p.id] : null;
  const knowledgeBlocks = knowledge?.body ? knowledgeBodyBlocks(knowledge.body) : [];

  /**
   * نص الاستماع من مصدر العرض الأساسي فقط (prophets-data + معجزة مكمّلة).
   * لا نخلط معرفة موسّعة/Supabase في الصوت حتى لا ينفصل عن البطاقات الظاهرة،
   * ولا تُفرَّغ القراءة بسبب آيات محمية في JSON.
   */
  const speakableText = useMemo(() => {
    if (!p) return "";
    const parts: string[] = [
      `${p.arabicName} عليه السلام`,
      p.title,
      p.briefBio,
      ...p.keyAttributes,
      ...p.lessons,
    ];
    if (sup?.miracle) parts.push(sup.miracle);
    return parts.filter(Boolean).join(". ");
  }, [p, sup]);

  useEffect(() => {
    stopAiNarration();
    setSpeechPlaying(false);
    setSpeechEngine("none");
    setSpeechUnsupported(false);
    setSpeechError(null);
    return () => {
      stopAiNarration();
    };
  }, [slug]);

  const toggleSpeech = useCallback(() => {
    if (speechPlaying) {
      stopAiNarration();
      setSpeechPlaying(false);
      setSpeechEngine("none");
      return;
    }
    setSpeechError(null);
    if (!speakableText.trim()) {
      setSpeechError("لا يوجد نص قابل للقراءة الصوتية");
      return;
    }
    unlockAudioOnUserGesture();
    if (!isSpeechReadAloudSupported()) {
      setSpeechUnsupported(true);
      setSpeechError("القراءة الصوتية غير متاحة على هذا الجهاز");
      return;
    }
    void (async () => {
      const result = await playAiNarration({
        contentId: `prophet:${canonicalSlug || slug}`,
        title: p?.arabicName,
        body: speakableText,
        mode: "immersive",
        contentKind: "prophet_story",
        onEnd: () => {
          setSpeechPlaying(false);
          setSpeechEngine("none");
        },
        onError: () => {
          setSpeechPlaying(false);
          setSpeechEngine("none");
          setSpeechUnsupported(true);
          setSpeechError("تعذر تشغيل التعليق الصوتي");
        },
      });
      if (result.ok) {
        setSpeechPlaying(true);
        setSpeechEngine(result.engine);
        setSpeechError(null);
      } else if (result.reason === "device_unsupported") {
        setSpeechUnsupported(true);
        setSpeechError(result.userLabel);
      } else {
        setSpeechError(result.userLabel || "تعذر بدء القراءة الصوتية");
      }
    })();
  }, [speechPlaying, speakableText, slug, canonicalSlug, p?.arabicName]);

  const sections: DetailSection[] = [
    { id: "bio", label: "نبذة" },
    ...(p?.mainSurahs?.length ? [{ id: "quran-loci", label: "مواضع في القرآن" }] : []),
    ...(sup?.miracle ? [{ id: "miracle", label: "المعجزة" }] : []),
    { id: "surahs", label: "السور" },
    { id: "attrs", label: "الصفات" },
    { id: "lessons", label: "العبر" },
    ...(!knowledgeLoading && knowledgeBlocks.length ? [{ id: "knowledge", label: "عرض موسّع" }] : []),
    ...(!dbLoading && dbStory?.content ? [{ id: "story", label: "القصة" }] : []),
    ...(!dbLoading && dbStory?.citations?.length ? [{ id: "citations", label: "الاستشهادات" }] : []),
  ];

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [slug]);

  useEffect(() => {
    if (!p) return;
    if (slug !== p.slug) {
      const next = `/prophets/${p.slug}`;
      if (window.location.pathname !== next) {
        window.history.replaceState(null, "", next);
      }
    }
  }, [slug, p]);

  useEffect(() => {
    if (!p) return;
    const jsonLd = [
      prophetArticleJsonLd({ name: p.arabicName, slug: p.slug, description: p.briefBio }),
      breadcrumbJsonLd([
        { name: "الرئيسية", path: "/" },
        { name: "قصص الأنبياء", path: "/prophets" },
        { name: p.arabicName, path: `/prophets/${p.slug}` },
      ]),
    ];
    applyPageSeo({
      path: `/prophets/${p.slug}`,
      title: `قصة ${p.arabicName} عليه السلام | سُنّة`,
      description: p.briefBio ? truncateAtWord(p.briefBio, 160) : `قصة نبي الله ${p.arabicName} عليه السلام من القرآن والسنة.`,
      keywords: ["قصص الأنبياء", p.arabicName, "أنبياء الإسلام", "معجزات الأنبياء"],
      ogType: "article",
      jsonLd,
    });
  }, [slug, p]);

  useEffect(() => {
    let cancelled = false;
    setDbStory(null);
    setDbLoading(true);
    void Promise.resolve(
      supabase
        .from("prophet_stories")
        .select("content, citations")
        .eq("slug", canonicalSlug)
        .eq("is_approved", true)
        .maybeSingle(),
    )
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error && import.meta.env.DEV) {
          console.warn("[prophets] db story", error.message);
        }
        setDbStory(data ?? null);
        setDbLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (import.meta.env.DEV) {
          console.warn("[prophets] db story failed", err);
        }
        setDbStory(null);
        setDbLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [canonicalSlug]);

  useEffect(() => {
    let cancelled = false;
    setKnowledge(null);
    setKnowledgeLoading(true);
    void getKnowledgeItem("prophets", `prophet-${canonicalSlug}`)
      .then((item) => {
        if (!cancelled) {
          setKnowledge(item);
          setKnowledgeLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (import.meta.env.DEV) {
          console.warn("[prophets] knowledge failed", err);
        }
        setKnowledge(null);
        setKnowledgeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [canonicalSlug]);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setReadPct(max > 0 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [slug]);

  useEffect(() => {
    const nodes = articleRef.current?.querySelectorAll<HTMLElement>("[data-ps-section]");
    if (!nodes?.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target) {
          const id = (visible[0].target as HTMLElement).dataset.psSection;
          if (id) setActiveSection(id);
        }
        entries.forEach(e => {
          if (e.isIntersecting) e.target.classList.add("is-inview");
        });
      },
      { rootMargin: "-18% 0px -55% 0px", threshold: [0.15, 0.4, 0.7] },
    );
    nodes.forEach(n => io.observe(n));
    return () => io.disconnect();
  }, [slug, dbLoading, dbStory, knowledgeLoading, knowledge]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === "ArrowRight" && prevProphet) {
        e.preventDefault();
        onNavigate(prevProphet.slug);
      } else if (e.key === "ArrowLeft" && nextProphet) {
        e.preventDefault();
        onNavigate(nextProphet.slug);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onBack();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevProphet, nextProphet, onNavigate, onBack]);

  const scrollToSection = useCallback((id: string) => {
    const el = articleRef.current?.querySelector(`[data-ps-section="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  }, []);

  if (!p) {
    return (
      <div className="prophet-detail-lux prophet-not-found" data-prophets-shell="1">
        <p className="prophet-not-found__msg" role="status">
          لم يتم العثور على هذا المحتوى.
        </p>
        <p className="prophet-not-found__hint">تأكد من رابط النبي أو اختر من قائمة الأنبياء والرسل.</p>
        <Link href="/prophets" className="prophet-action-btn prophet-not-found__cta">
          عرض قائمة الأنبياء
        </Link>
      </div>
    );
  }

  const color = prophetColor(p.slug);
  const accent = prophetAccent(p.slug);
  const isUlulAzm = ULUL_AZM_SLUGS.includes(p.slug);
  const mentionPct = Math.min(100, Math.round(((sup?.mentioned ?? 0) / MAX_MENTIONS) * 100));

  return (
    <div
      className="prophet-detail-lux"
      data-prophets-shell="1"
      style={{
        "--prophet-color": color,
        "--prophet-accent": accent,
      } as React.CSSProperties}
    >
      <div
        className="prophet-detail-lux__progress"
        role="progressbar"
        aria-valuenow={readPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="تقدّم القراءة"
      >
        <div className="prophet-detail-lux__progress-fill" style={{ width: `${readPct}%` }} />
      </div>

      <div className="prophet-detail-lux__topbar">
        <div className="prophet-detail-lux__actions">
          <button
            type="button"
            className={`prophet-speech-btn${speechPlaying ? " prophet-speech-btn--active" : ""}`}
            onClick={toggleSpeech}
            aria-pressed={speechPlaying}
            aria-label={speechPlaying ? "إيقاف القراءة" : "استماع لنص القصة"}
          >
            {speechPlaying ? <Square size={14} strokeWidth={2} aria-hidden="true" /> : <Volume2 size={14} strokeWidth={2} aria-hidden="true" />}
            <span>{speechPlaying ? "إيقاف" : "استماع"}</span>
            {speechPlaying && speechEngine === "device-speech" ? (
              <span className="prophet-speech-btn__engine" data-engine="device">صوت الجهاز</span>
            ) : null}
            {speechPlaying && speechEngine === "azure-neural" ? (
              <span className="prophet-speech-btn__engine" data-engine="neural">سرد عصبي</span>
            ) : null}
          </button>
          <div className="prophet-font-controls">
            <button type="button" onClick={() => setFontSize(s => Math.max(13, s - 1))} aria-label="تصغير الخط">أ−</button>
            <button type="button" onClick={() => setFontSize(s => Math.min(22, s + 1))} aria-label="تكبير الخط">أ+</button>
          </div>
        </div>
      </div>
      {speechUnsupported || speechError ? (
        <p className="prophet-speech-unsupported" role="status">
          {speechError || "القراءة الصوتية غير مدعومة على هذا الجهاز"}
        </p>
      ) : null}

      <div className="prophet-detail-lux__hero">
        <div className="prophet-detail-lux__hero-pattern" aria-hidden="true">
          {[...Array(12)].map((_, i) => (
            <IslamicStar key={i} size={28} color={IVORY} opacity={0.06 + (i % 4) * 0.02} />
          ))}
        </div>
        <div className="prophet-detail-lux__hero-content">
          <div className="prophet-detail-lux__hero-star prophet-detail-lux__hero-star--pulse">
            <IslamicStar size={28} color="var(--prophet-color-on-dark)" opacity={0.5} />
          </div>
          <span className="prophet-detail-lux__num-badge">النبي {p.id} من {PROPHETS.length}</span>
          {isUlulAzm && <span className="prophet-detail-lux__azm-badge">أولو العزم</span>}
          <h1 className="prophet-detail-lux__name">{p.arabicName}</h1>
          <p className="prophet-detail-lux__pbuh">صلوات الله وسلامه عليه</p>
          {p.quranTitle && (
            <div className="prophet-detail-lux__quran-title">﴿ {p.quranTitle} ﴾</div>
          )}
          <p className="prophet-detail-lux__hero-title">{p.title}</p>
          <GeometricBorder color="var(--prophet-color-on-dark)" size={20} />
          <p className="prophet-detail-lux__keys-hint">التنقل: السهم للتالي أو السابق · زر الرجوع للقائمة</p>
        </div>
      </div>

      <div className="prophet-facts-grid">
        <div className="prophet-fact-card prophet-fact-card--interactive">
          <span className="prophet-fact-card__label">القوم / البلد</span>
          <span className="prophet-fact-card__value">{p.peopleOrPlace}</span>
        </div>
        <div className="prophet-fact-card prophet-fact-card--interactive">
          <span className="prophet-fact-card__label">الحقبة</span>
          <span className="prophet-fact-card__value">{p.era}</span>
        </div>
        {sup && (
          <div className="prophet-fact-card prophet-fact-card--interactive prophet-fact-card--meter">
            <span className="prophet-fact-card__label">الذِّكر في القرآن</span>
            <span className="prophet-fact-card__value">{sup.mentioned} مرة</span>
            <div className="prophet-fact-card__ring" style={{ "--meter": `${mentionPct}%` } as React.CSSProperties} aria-hidden="true" />
          </div>
        )}
        <div className="prophet-fact-card prophet-fact-card--interactive">
          <span className="prophet-fact-card__label">أبرز سورة</span>
          <span className="prophet-fact-card__value">{p.mainSurahs[0] || "—"}</span>
        </div>
        {sup?.book && (
          <div className="prophet-fact-card prophet-fact-card--interactive">
            <span className="prophet-fact-card__label">الكتاب المنزَّل</span>
            <span className="prophet-fact-card__value">{sup.book}</span>
          </div>
        )}
        {sup?.quranRef && (
          <div className="prophet-fact-card prophet-fact-card--wide prophet-fact-card--interactive">
            <span className="prophet-fact-card__label">مواضع في القرآن</span>
            <span className="prophet-fact-card__value">{sup.quranRef}</span>
          </div>
        )}
      </div>

      <nav className="prophet-detail-toc" aria-label="أقسام القصة">
        {sections.map(s => (
          <button
            key={s.id}
            type="button"
            className={`prophet-detail-toc__btn${activeSection === s.id ? " prophet-detail-toc__btn--active" : ""}`}
            onClick={() => scrollToSection(s.id)}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <article ref={articleRef} className="prophet-story-lux" style={{ "--pstory-fs": `${fontSize}px` } as React.CSSProperties}>

        <section className="prophet-section-lux prophet-section-lux--reveal" data-ps-section="bio">
          <div className="prophet-section-lux__header">
            <IslamicStar size={22} color="var(--prophet-color-on-dark)" />
            <h2 className="prophet-section-lux__title">نبذة تعريفية</h2>
          </div>
          <p className="prophet-section-lux__text">{p.briefBio}</p>
        </section>

        {p.mainSurahs?.length ? (
          <section className="prophet-section-lux prophet-section-lux--reveal" data-ps-section="quran-loci">
            <div className="prophet-section-lux__header">
              <IslamicStar size={22} color="var(--prophet-color-on-dark)" />
              <h2 className="prophet-section-lux__title">مواضع في القرآن</h2>
            </div>
            <p className="prophet-section-lux__text">
              من أبرز السور التي ورد فيها ذكر {p.arabicName} عليه السلام: {p.mainSurahs.slice(0, 8).join("، ")}.
              يُقتصر على نص القرآن وما صحّ من السنة عند إيراده، دون الجزم بما سكت عنه الوحي.
            </p>
          </section>
        ) : null}

        <ScholarlyTrustBadge
          compact
          data={{ contentType: "نقل", source: "القرآن الكريم وكتب التفسير والسيرة", methodologyPath: "/methodology", reportContentType: "prophet", reportContentId: p.slug }}
        />

        {sup?.miracle && (
          <section className="prophet-section-lux prophet-section-lux--reveal" data-ps-section="miracle">
            <div className="prophet-section-lux__header">
              <Sparkles size={20} color="var(--prophet-accent, var(--prophet-color-on-dark))" aria-hidden="true" />
              <h2 className="prophet-section-lux__title">المعجزة الكبرى</h2>
            </div>
            <div className="prophet-miracle-box">
              <span className="prophet-miracle-box__icon">✦</span>
              <p className="prophet-miracle-box__text">{sup.miracle}</p>
            </div>
          </section>
        )}

        <section className="prophet-section-lux prophet-section-lux--reveal" data-ps-section="surahs">
          <div className="prophet-section-lux__header">
            <IslamicStar size={22} color="var(--prophet-color-on-dark)" />
            <h2 className="prophet-section-lux__title">أبرز السور القرآنية</h2>
          </div>
          <div className="prophet-chips-lux">
            {p.mainSurahs.map(s => (
              <button
                key={s}
                type="button"
                className="prophet-chip-lux prophet-chip-lux--interactive"
                onClick={() => scrollToSection("citations")}
                title="الانتقال إلى الاستشهادات إن وُجدت"
              >
                سورة {s}
              </button>
            ))}
          </div>
        </section>

        <section className="prophet-section-lux prophet-section-lux--reveal" data-ps-section="attrs">
          <div className="prophet-section-lux__header">
            <IslamicStar size={22} color="var(--prophet-color-on-dark)" />
            <h2 className="prophet-section-lux__title">أبرز الصفات والمعجزات</h2>
          </div>
          <ul className="prophet-attrs-list">
            {p.keyAttributes.map((a, i) => (
              <li key={i} className="prophet-attrs-list__item" style={{ "--i": i } as React.CSSProperties}>
                <span className="prophet-attrs-list__bullet">✦</span>
                {a}
              </li>
            ))}
          </ul>
        </section>

        <section className="prophet-section-lux prophet-section-lux--reveal" data-ps-section="lessons">
          <div className="prophet-section-lux__header">
            <IslamicStar size={22} color="var(--prophet-color-on-dark)" />
            <h2 className="prophet-section-lux__title">الدروس والعبر</h2>
          </div>
          <div className="prophet-lessons-grid">
            {p.lessons.map((l, i) => (
              <div key={i} className="prophet-lesson-card prophet-lesson-card--interactive" style={{ "--i": i } as React.CSSProperties}>
                <span className="prophet-lesson-card__num">{i + 1}</span>
                <p className="prophet-lesson-card__text">{l}</p>
              </div>
            ))}
          </div>
        </section>

        {!knowledgeLoading && knowledgeBlocks.length > 0 && (
          <section className="prophet-section-lux prophet-section-lux--reveal" data-ps-section="knowledge">
            <div className="prophet-section-lux__header">
              <IslamicStar size={22} color="var(--prophet-color-on-dark)" />
              <h2 className="prophet-section-lux__title">عرض موسّع من طبقة المعرفة</h2>
            </div>
            <div className="prophet-db-story">
              {knowledgeBlocks.map((block, bi) => (
                <div key={bi} className="prophet-knowledge-block">
                  {block.title ? (
                    <h3 className="prophet-section-lux__title">{block.title}</h3>
                  ) : null}
                  {block.paragraphs.map((para, pi) => (
                    <p key={pi} className="prophet-section-lux__text prophet-db-para">
                      {para}
                    </p>
                  ))}
                </div>
              ))}
            </div>
            {knowledge?.review_status === "verified" ? (
              <p className="prophet-section-lux__text">مصدر محلي موثّق — يُراجع عند أي توسع علمي.</p>
            ) : null}
          </section>
        )}

        {!dbLoading && dbStory?.content && (
          <section className="prophet-section-lux prophet-section-lux--reveal" data-ps-section="story">
            <div className="prophet-section-lux__header">
              <IslamicStar size={22} color="var(--prophet-color-on-dark)" />
              <h2 className="prophet-section-lux__title">القصة بالتفصيل</h2>
            </div>
            <div className="prophet-db-story">
              {dbStory.content.split("\n").filter(Boolean).map((para, i) => (
                <p key={i} className="prophet-section-lux__text prophet-db-para">{para}</p>
              ))}
            </div>
          </section>
        )}

        {PROPHET_MUSHAF_MENTIONS[canonicalSlug]?.length ? (
          <ProphetMushafMentions
            prophetSlug={canonicalSlug}
            mentions={PROPHET_MUSHAF_MENTIONS[canonicalSlug]}
            navigationSource={PROPHET_MUSHAF_NAV_SOURCE}
          />
        ) : null}

        {!dbLoading && dbStory?.citations && dbStory.citations.length > 0 && (
          <section className="prophet-section-lux prophet-section-lux--reveal" data-ps-section="citations">
            <div className="prophet-section-lux__header">
              <IslamicStar size={22} color="var(--prophet-color-on-dark)" />
              <h2 className="prophet-section-lux__title">الاستشهادات القرآنية</h2>
            </div>
            <div className="prophet-citations">
              {dbStory.citations.map((c, i) => (
                <div key={i} className="prophet-citation-card prophet-citation-card--interactive">
                  <span className="prophet-citation-card__surah">سورة {c.surah}</span>
                  {c.ayahs && <span className="prophet-citation-card__ayahs">الآيات: {c.ayahs}</span>}
                  {c.note && <p className="prophet-citation-card__note">{c.note}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="prophet-story-lux__footer">
          <IslamicStar size={18} color={IVORY} opacity={0.6} />
          <span>المصدر: القرآن الكريم وكتب التفسير والسيرة الموثوقة</span>
          <IslamicStar size={18} color={IVORY} opacity={0.6} />
        </footer>
      </article>

      <ShareButtons title={`${p.arabicName} — قصص الأنبياء | سُنّة`} url={`https://www.ssunnah.com/prophets/${canonicalSlug}`} />

      <GraphRelatedRail kind="prophet" slug={slug} titleAr="من الرسم البياني" />

      <div className="prophet-nav-lux">
        {prevProphet ? (
          <button type="button" className="prophet-nav-lux__btn" onClick={() => onNavigate(prevProphet.slug)}>
            <span className="prophet-nav-lux__dir"><ChevronRight size={14} aria-hidden="true" /> السابق</span>
            <span className="prophet-nav-lux__pname">{prevProphet.arabicName}</span>
          </button>
        ) : <span />}
        {nextProphet ? (
          <button type="button" className="prophet-nav-lux__btn prophet-nav-lux__btn--next" onClick={() => onNavigate(nextProphet.slug)}>
            <span className="prophet-nav-lux__dir">التالي <ChevronLeft size={14} aria-hidden="true" /></span>
            <span className="prophet-nav-lux__pname">{nextProphet.arabicName}</span>
          </button>
        ) : <span />}
      </div>
    </div>
  );
}

// ── Timeline View ────────────────────────────────────────────────────────────

function TimelineView({ onSelect }: { onSelect: (slug: string) => void }) {
  return (
    <div className="prophet-timeline">
      <div className="prophet-timeline__line" aria-hidden="true" />
      {PROPHETS.map((p, idx) => {
        const color = prophetColor(p.slug);
        const accent = prophetAccent(p.slug);
        const side = idx % 2 === 0 ? "right" : "left";
        return (
          <div
            key={p.slug}
            className={`prophet-timeline__item prophet-timeline__item--${side}`}
            style={{ "--item-color": color, "--prophet-accent": accent, "--card-i": idx } as React.CSSProperties}
          >
            <button
              type="button"
              className="prophet-timeline__dot"
              onClick={() => onSelect(p.slug)}
              aria-label={`قصة ${p.arabicName}`}
            >
              <IslamicStar size={16} color="#fff" />
            </button>
            <div
              className="prophet-timeline__card"
              onClick={() => onSelect(p.slug)}
              role="button"
              tabIndex={0}
              aria-label={`عرض قصة ${p.arabicName}`}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(p.slug)}
            >
              <h3 className="prophet-timeline__name">{p.arabicName}</h3>
              <p className="prophet-timeline__title">{p.title}</p>
              <p className="prophet-timeline__era">{p.era}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── UlulAzmView ──────────────────────────────────────────────────────────────

function UlulAzmView({ onSelect }: { onSelect: (slug: string) => void }) {
  const prophets = PROPHETS.filter(p => ULUL_AZM_SLUGS.includes(p.slug));
  return (
    <div>
      <div className="nb-intro-box">
        <p>أولو العزم من الرسل خمسة: نوح وإبراهيم وموسى وعيسى ومحمد ﷺ. ذكرهم الله في قوله: ﴿فَاصْبِرْ كَمَا صَبَرَ أُولُو الْعَزْمِ مِنَ الرُّسُلِ﴾ (الأحقاف: ٣٥)، ويُقتصر على ما دلّ عليه الوحي دون توسع فيما لم يثبت.</p>
      </div>
      <div className="nb-azm-grid">
        {prophets.map((p, i) => {
          const sup = SUPPLEMENT[p.slug];
          const color = prophetColor(p.slug);
          const accent = prophetAccent(p.slug);
          return (
            <button
              type="button"
              key={p.slug}
              className="nb-azm-card"
              style={{
                "--prophet-color": color,
                "--prophet-accent": accent,
                "--card-i": i,
              } as React.CSSProperties}
              onClick={() => onSelect(p.slug)}
              aria-label={`قصة ${p.arabicName}`}
            >
              <div className="nb-azm-rank">{i + 1}</div>
              <div className="nb-azm-star"><IslamicStar size={32} color={color} /></div>
              <h3 className="nb-azm-name">{p.arabicName} ﷺ</h3>
              <div className="nb-azm-book">{sup?.book ? `كتابه: ${sup.book}` : "لا كتاب مستقل"}</div>
              <p className="nb-azm-story">{truncateAtWord(p.briefBio, 140)}</p>
              {sup?.miracle && (
                <div className="nb-azm-miracle">
                  <strong>معجزته:</strong> {sup.miracle}
                </div>
              )}
              {sup && (
                <div className="nb-azm-mentions">ذُكر في القرآن {sup.mentioned} مرة</div>
              )}
              <span className="nb-azm-cta" aria-hidden="true">اقرأ القصة <ChevronLeft size={14} aria-hidden="true" /></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── MiraclesView ─────────────────────────────────────────────────────────────

function MiraclesView({ onSelect }: { onSelect: (slug: string) => void }) {
  return (
    <div>
      <div className="nb-intro-box">
        <p>المعجزة: أمر خارق للعادة يُجريه الله على يد النبي تحدياً للمكذِّبين وتأييداً للداعية. وأعظم المعجزات وأخلدها القرآن الكريم. اضغط على البطاقة لقراءة قصة النبي.</p>
      </div>
      <div className="nb-miracles-grid">
        {MIRACLES_LIST.map((m, i) => (
          <button
            key={m.slug + m.ayah}
            type="button"
            className="nb-miracle-card"
            style={{
              "--prophet-color": prophetColor(m.slug),
              "--prophet-accent": prophetAccent(m.slug),
              "--card-i": i,
            } as React.CSSProperties}
            onClick={() => onSelect(m.slug)}
            aria-label={`قصة ${m.nabi} — ${m.miracle}`}
          >
            <div className="nb-miracle-nabi">{m.nabi}</div>
            <p className="nb-miracle-text">{m.miracle}</p>
            <div className="nb-miracle-ref">{m.ayah}</div>
            <span className="nb-miracle-cta">عرض القصة <ChevronLeft size={13} aria-hidden="true" /></span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── CompareView ──────────────────────────────────────────────────────────────

function CompareView({ onSelect }: { onSelect: (slug: string) => void }) {
  return (
    <div className="nb-compare-wrap">
      <div className="nb-intro-box">
        <p>جدول مقارنة بين أنبياء القرآن الكريم من حيث عدد الذكر والقوم والكتاب. اضغط على اسم النبي لقراءة قصته.</p>
      </div>
      <div className="nb-table-scroll">
        <table className="nb-table">
          <thead>
            <tr>
              <th>#</th>
              <th>الاسم</th>
              <th>القوم / المنطقة</th>
              <th>عدد الذِّكر</th>
              <th>الكتاب</th>
              <th>الحقبة</th>
            </tr>
          </thead>
          <tbody>
            {PROPHETS.map(p => {
              const sup = SUPPLEMENT[p.slug];
              const isAzm = ULUL_AZM_SLUGS.includes(p.slug);
              return (
                <tr
                  key={p.slug}
                  className={`${isAzm ? "nb-table__row--azm" : ""} nb-table__row--clickable`}
                  style={{
                    "--prophet-color": prophetColor(p.slug),
                    "--prophet-accent": prophetAccent(p.slug),
                  } as React.CSSProperties}
                  onClick={() => onSelect(p.slug)}
                  onKeyDown={e => (e.key === "Enter" || e.key === " ") && onSelect(p.slug)}
                  tabIndex={0}
                  role="link"
                  aria-label={`قصة ${p.arabicName}`}
                >
                  <td>{p.id}</td>
                  <td className="nb-table__name">
                    {p.arabicName}
                    {isAzm && <span className="nb-table__azm"> ★</span>}
                  </td>
                  <td>{p.peopleOrPlace}</td>
                  <td className="nb-table__count">{sup?.mentioned ?? "—"}</td>
                  <td>{sup?.book ?? "—"}</td>
                  <td>{p.era}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="nb-table-note">★ = من أولي العزم · اضغط على أي صف للاطلاع على القصة</p>
    </div>
  );
}

// ── Quiz View ────────────────────────────────────────────────────────────────

function QuizView({ onClose }: { onClose: () => void }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const q = QUIZ_QUESTIONS[idx];

  const answer = (opt: string) => {
    if (answered) return;
    setAnswered(opt);
    if (opt === q.a) setScore(s => s + 1);
    setTimeout(() => {
      if (idx + 1 >= QUIZ_QUESTIONS.length) { setDone(true); }
      else { setIdx(i => i + 1); setAnswered(null); }
    }, 1000);
  };

  if (done) {
    const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100);
    return (
      <div className="prophet-quiz">
        <div className="prophet-quiz__done">
          <IslamicStar size={28} color={IVORY} opacity={0.45} />
          <h2>انتهى الاختبار!</h2>
          <p className="prophet-quiz__score">{score} / {QUIZ_QUESTIONS.length} ({pct}%)</p>
          <p className="prophet-quiz__remark">
            {pct >= 80 ? "ممتاز! أنت عارف بقصص الأنبياء ✦" : pct >= 60 ? "جيد! استمر في التعلم" : "واصل القراءة لتتعلم أكثر"}
          </p>
          <button type="button" className="prophet-quiz__btn" onClick={onClose}>العودة للقائمة</button>
        </div>
      </div>
    );
  }

  return (
    <div className="prophet-quiz">
      <div className="prophet-quiz__header">
        <span>سؤال {idx + 1} من {QUIZ_QUESTIONS.length}</span>
        <div className="prophet-quiz__progress">
          <div className="prophet-quiz__progress-bar" style={{ "--quiz-pct": `${(idx / QUIZ_QUESTIONS.length) * 100}%` } as React.CSSProperties} />
        </div>
        <button type="button" aria-label="إغلاق الاختبار" className="prophet-quiz__close" onClick={onClose}>✕</button>
      </div>
      <div className="prophet-quiz__body">
        <IslamicStar size={36} color={IVORY} />
        <p className="prophet-quiz__question">{q.q}</p>
        <div className="prophet-quiz__opts">
          {q.opts.map(opt => {
            let cls = "prophet-quiz__opt";
            if (answered) {
              if (opt === q.a) cls += " prophet-quiz__opt--correct";
              else if (opt === answered) cls += " prophet-quiz__opt--wrong";
            }
            return (
              <button type="button" key={opt} className={cls} onClick={() => answer(opt)}>{opt}</button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

type View = "grid" | "timeline" | "ulul-azm" | "miracles" | "compare" | "quiz";

const TABS: { id: View; label: string }[] = [
  { id: "grid",      label: "القائمة" },
  { id: "timeline",  label: "الخط الزمني" },
  { id: "ulul-azm",  label: "أولو العزم" },
  { id: "miracles",  label: "المعجزات" },
  { id: "compare",   label: "مقارنة" },
  { id: "quiz",      label: "اختبر نفسك" },
];

export default function ProphetStoriesPage({
  params,
}: {
  params?: { slug?: string };
}) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<View>("grid");
  const searchRef = useRef<HTMLInputElement>(null);
  const [location] = useLocation();

  /** slug من المسار فور الرسم — بلا انتظار useEffect (يمنع وميض القائمة/الخطأ) */
  const routeSlug = useMemo(() => {
    const raw = params?.slug;
    if (raw) return resolveProphetSlug(raw);
    const match = location.match(
      /\/(?:prophets|prophet-stories|prophets-stories|anbiya)\/([^/?#]+)/,
    );
    return match ? resolveProphetSlug(match[1]) : null;
  }, [params?.slug, location]);

  const openProphet = useCallback((slug: string) => {
    const next = resolveProphetSlug(slug);
    navigateTo(`/prophets/${next}`, { mode: "screen" });
  }, []);

  const backToList = useCallback(() => {
    goBackOrFallback(window.location.pathname || "/prophets", "/prophets");
  }, []);

  useEffect(() => {
    if (routeSlug) return;
    applyPageSeo({
      path: "/prophets",
      title: "الأنبياء والرسل | سُنّة",
      description:
        "قصص ٢٥ نبياً ورسولاً مذكورين في القرآن الكريم: سيرهم ومعجزاتهم وأقوامهم والدروس المستفادة، مع خط زمني ومقارنة وأولو العزم.",
      keywords: ["قصص الأنبياء", "الأنبياء في القرآن", "معجزات الأنبياء", "أولو العزم", "أنبياء الإسلام"],
    });
  }, [routeSlug]);

  // sessionStorage mj.last-path يُحدَّث عالميًا من SeoManager

  const results = searchProphets(search);

  if (routeSlug) {
    return (
      <ProphetDetailView
        slug={routeSlug}
        onBack={backToList}
        onNavigate={openProphet}
      />
    );
  }

  if (view === "quiz") {
    return <QuizView onClose={() => setView("grid")} />;
  }

  return (
    <UtilityScreen compose="mark">
    <SectionTemplatePage
      route="/prophets"
      className="topic-page--prophets"
      layoutIntegrity="prophets-v1"
      title="الأنبياء والرسل"
      subtitle={`أحسن القصص — ${PROPHETS.length} نبيًا مذكورًا في القرآن · خمسة من أولي العزم`}
      eyebrow="القصص والأعلام"
      groupTitle="عرض قصص الأنبياء"
    >
    <div className="prophets-lux-page prophets-lux-page--embedded" data-prophets-shell="1">
      <p className="prophets-page-lead">
        هؤلاء الأنبياء والرسل الذين ذكرهم الله بأسمائهم في القرآن الكريم؛ وقد أخبر سبحانه أنه أرسل رسلاً آخرين لم يقصصهم علينا: ﴿وَرُسُلًا قَدْ قَصَصْنَاهُمْ عَلَيْكَ مِن قَبْلُ وَرُسُلًا لَّمْ نَقْصُصْهُمْ عَلَيْكَ﴾ [النساء: 164].
      </p>

      {/* تبويبات العرض */}
      <div className="prophets-light-section">
        <div className="prophets-lux-tabs" role="tablist" aria-label="طريقة عرض قصص الأنبياء">
          {TABS.map(t => (
            <button
              key={t.id}
              id={`pst-tab-${t.id}`}
              type="button"
              role="tab"
              className={`prophets-lux-tab ${view === t.id ? "prophets-lux-tab--active" : ""}`}
              onClick={() => setView(t.id)}
              aria-selected={view === t.id}
              aria-controls={`pst-panel-${t.id}`}
            >
              {t.id === "grid"      && <><LayoutList size={14} strokeWidth={1.8} aria-hidden="true" /> {t.label}</>}
              {t.id === "timeline"  && <><CalendarDays size={14} strokeWidth={1.8} aria-hidden="true" /> {t.label}</>}
              {t.id === "quiz"      && <><HelpCircle size={14} strokeWidth={1.8} aria-hidden="true" /> {t.label}</>}
              {!["grid","timeline","quiz"].includes(t.id) && t.label}
            </button>
          ))}
        </div>

        {/* خط الزمني */}
        {view === "timeline" && (
          <div role="tabpanel" id="pst-panel-timeline" aria-labelledby="pst-tab-timeline" className="prophets-lux-container">
            <TimelineView onSelect={openProphet} />
          </div>
        )}

        {/* أولو العزم */}
        {view === "ulul-azm" && (
          <div className="prophets-lux-container nb-container">
            <UlulAzmView onSelect={openProphet} />
          </div>
        )}

        {/* المعجزات */}
        {view === "miracles" && (
          <div role="tabpanel" id="pst-panel-miracles" aria-labelledby="pst-tab-miracles" className="prophets-lux-container nb-container">
            <MiraclesView onSelect={openProphet} />
          </div>
        )}

        {/* مقارنة */}
        {view === "compare" && (
          <div role="tabpanel" id="pst-panel-compare" aria-labelledby="pst-tab-compare" className="prophets-lux-container nb-container">
            <CompareView onSelect={openProphet} />
          </div>
        )}

        {/* قائمة */}
        {view === "grid" && (
          <div className="prophets-lux-container">
            <div className="prophets-lux-search-wrap">
              <input
                ref={searchRef}
                className="prophets-lux-search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث في الأنبياء بالاسم أو القوم أو الخاصية..."
                aria-label="بحث في قصص الأنبياء"
              />
              {search && (
                <button type="button" aria-label="مسح البحث" className="prophets-lux-search-clear" onClick={() => setSearch("")}>✕</button>
              )}
            </div>

            {search && (
              <p className="prophets-lux-count" aria-live="polite" aria-atomic="true">{results.length} نتيجة</p>
            )}

            {results.length === 0 ? (
              <div className="prophets-lux-empty">
                <IslamicStar size={24} color={IVORY} opacity={0.3} />
                <p>{EMPTY.search}</p>
              </div>
            ) : (
              <>
                <div className="prophets-lux-grid">
                  {results.map((p, i) => (
                    <ProphetCard
                      key={p.slug}
                      prophet={p}
                      index={i}
                      onSelect={() => openProphet(p.slug)}
                    />
                  ))}
                </div>
                {!search && (
                  <Link href="/prophets/tree" className="prophets-seerah-link">
                    <div className="prophets-seerah-bridge">
                      <div className="prophets-seerah-bridge__ornament" aria-hidden="true">
                        <IslamicStar size={28} color={IVORY} opacity={0.7} />
                      </div>
                      <div className="prophets-seerah-bridge__body">
                        <div className="prophets-seerah-bridge__eyebrow">عرض تفاعلي</div>
                        <h3 className="prophets-seerah-bridge__title">شجرة أنساب الأنبياء</h3>
                        <p className="prophets-seerah-bridge__desc">
                          صلة النسب من آدم إلى محمد ﷺ في شجرة تفاعلية واحدة.
                        </p>
                      </div>
                      <div className="prophets-seerah-bridge__arrow" aria-hidden="true">←</div>
                    </div>
                  </Link>
                )}
                {!search && (
                  <section className="prophets-seerah-brief" aria-labelledby="prophets-seerah-brief-title">
                    <h2 id="prophets-seerah-brief-title" className="prophets-seerah-brief__title">
                      السيرة النبوية المختصرة
                    </h2>
                    <p className="prophets-seerah-brief__lead">
                      محطات مختارة من حياة خاتم النبيين ﷺ — للتفاصيل الكاملة انتقل إلى قسم السيرة.
                    </p>
                    <ol className="prophets-seerah-timeline">
                      {[
                        ["عام الفيل", "سنة ولادة النبي ﷺ في مكة."],
                        ["المولد", "وُلد محمد بن عبد الله ﷺ في مكة المكرمة."],
                        ["البعثة", "نزول الوحي في غار حراء وبدء الرسالة."],
                        ["الدعوة", "دعوة سرّية ثم جهرية في مكة."],
                        ["الهجرة", "الهجرة إلى المدينة وبداية المجتمع المسلم."],
                        ["بدر", "أول نصر عظيم للمسلمين."],
                        ["الحديبية", "صلح فتح به الله أبواب الدعوة."],
                        ["فتح مكة", "دخول مكة بلا قتال وإتمام النعمة."],
                        ["حجة الوداع", "خطبة جامعة وأداء مناسك الحج."],
                        ["الوفاة", "انتقال النبي ﷺ إلى الرفيق الأعلى."],
                      ].map(([title, line]) => (
                        <li key={title} className="prophets-seerah-timeline__item">
                          <span className="prophets-seerah-timeline__dot" aria-hidden="true" />
                          <div className="prophets-seerah-timeline__body">
                            <strong className="prophets-seerah-timeline__name">{title}</strong>
                            <p className="prophets-seerah-timeline__line">{line}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                    <Link href="/seerah" className="prophets-seerah-full-cta">
                      <span className="prophets-seerah-full-cta__label">اقرأ السيرة النبوية الكاملة</span>
                      <span className="prophets-seerah-full-cta__hint" aria-hidden="true">←</span>
                    </Link>
                  </section>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <SectionQuiz sectionId="prophets" title="اختبر معلوماتك في قصص الأنبياء" count={4} />

      <div className="twh-share">
        <ShareButtons title="قصص الأنبياء — سُنّة" url="https://www.ssunnah.com/prophets" />
      </div>
    </div>
    </SectionTemplatePage>
  
    </UtilityScreen>
  );
}
