import { useState, useCallback, useEffect, useRef } from "react";
import { CalendarDays, Heart, HelpCircle, LayoutList } from "lucide-react";
import { Link } from "wouter";
import { PROPHETS, getProphet, searchProphets, type ProphetRecord } from "@/lib/prophets-data";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { prophetArticleJsonLd, breadcrumbJsonLd, defaultSiteJsonLd } from "@/lib/seo-structured-data";
import { supabase } from "@/lib/supabase";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

type Citation = { surah: string; ayahs: string; note: string };

// ── Palette & Helpers ────────────────────────────────────────────────────────

const PROPHET_HUE: Record<string, string> = {
  adam: "#5D726A", idris: "#4A6B6B", nuh: "#3D6560", hud: "#5A7066",
  salih: "#5B6B60", ibrahim: "#18362A", lut: "#3A6A4A", ismail: "#2A5E42",
  "is-haq": "#3D6050", yaqub: "#356055", yusuf: "#2D5545", ayyub: "#4A6055",
  shuayb: "#25504A", musa: "#18362A", harun: "#1E4A38", "dhul-kifl": "#354A42",
  dawud: "#2A3E35", sulayman: "#153025", ilyas: "#3A5548", "al-yasa": "#266050",
  yunus: "#1A5555", zakariyya: "#2A503C", yahya: "#205540", isa: "#1E3F50",
  muhammad: "#18362A",
};

const IVORY = "#BEC7C3";

/* بيانات تكميلية: عدد الذكر، المعجزة، الكتاب، المواضع القرآنية */
type Supplement = { mentioned: number; miracle?: string; book?: string; quranRef?: string };
const SUPPLEMENT: Record<string, Supplement> = {
  adam:        { mentioned: 25, miracle: "خُلق من طين وعُلِّم الأسماء كلها",                    quranRef: "البقرة: ٣٠-٣٩، طه: ١١٥-١٢٣" },
  idris:       { mentioned: 2,  miracle: "رُفع إلى السماء مكاناً علياً",                         quranRef: "مريم: ٥٦-٥٧، الأنبياء: ٨٥" },
  nuh:         { mentioned: 43, miracle: "السفينة والطوفان، أنجاه الله والمؤمنين",               quranRef: "هود: ٢٥-٤٨، نوح: ١-٢٨" },
  hud:         { mentioned: 7,  miracle: "نجاه الله من الريح العقيم التي أهلكت عاداً",            quranRef: "هود: ٥٠-٦٠، الأحقاف: ٢١-٢٦" },
  salih:       { mentioned: 9,  miracle: "ناقة الله، خرجت من صخرة صمّاء",                      quranRef: "الأعراف: ٧٣-٧٩، هود: ٦١-٦٨" },
  ibrahim:     { mentioned: 69, miracle: "لم تحرقه نار نمرود، ﴿كُونِي بَرْدًا وَسَلَامًا﴾",   book: "الصحف", quranRef: "البقرة: ١٢٤-١٣٢، الأنبياء: ٥١-٧١" },
  lut:         { mentioned: 27, miracle: "نجاه الله وقلب المدينة على أهلها",                     quranRef: "هود: ٧٧-٨٣، الحجر: ٥٨-٧٧" },
  ismail:      { mentioned: 12, miracle: "الذبح العظيم، فداه الله بكبش",                        quranRef: "الصافات: ١٠١-١١١، إبراهيم: ٣٧" },
  "is-haq":    { mentioned: 17,                                                                   quranRef: "هود: ٧١، الصافات: ١١٢-١١٣" },
  yaqub:       { mentioned: 16,                                                                   quranRef: "يوسف: ٤-٨٣" },
  yusuf:       { mentioned: 27, miracle: "أُوتي تأويل الأحاديث وحسن الخُلق",                     quranRef: "سورة يوسف كاملة" },
  ayyub:       { mentioned: 4,  miracle: "شُفي بعد ١٨ سنة من البلاء الشديد",                     quranRef: "الأنبياء: ٨٣-٨٤، ص: ٤١-٤٤" },
  shuayb:      { mentioned: 9,                                                                    quranRef: "الأعراف: ٨٥-٩٣، هود: ٨٤-٩٥" },
  musa:        { mentioned: 136, miracle: "العصا، يده البيضاء، انفلاق البحر، التوراة",           book: "التوراة", quranRef: "القصص: ٣-٤٠، طه: ٩-٩٨" },
  harun:       { mentioned: 20,                                                                   quranRef: "طه: ٢٩-٣٦، الأعراف: ١٤٢" },
  "dhul-kifl": { mentioned: 2,                                                                    quranRef: "الأنبياء: ٨٥، ص: ٤٨" },
  dawud:       { mentioned: 16, miracle: "أُلين له الحديد وسبَّحت معه الجبال",                   book: "الزبور", quranRef: "البقرة: ٢٥١، سبأ: ١٠-١١" },
  sulayman:    { mentioned: 17, miracle: "تسخير الريح والجن وفهم لغة الطير",                     quranRef: "النمل: ١٥-٤٤، سبأ: ١٢-١٤" },
  ilyas:       { mentioned: 2,                                                                    quranRef: "الصافات: ١٢٣-١٣٢، الأنعام: ٨٥" },
  "al-yasa":   { mentioned: 2,                                                                    quranRef: "الأنعام: ٨٦، ص: ٤٨" },
  yunus:       { mentioned: 4,  miracle: "بقاؤه حياً في بطن الحوت ثم نجاته",                    quranRef: "يونس: ٩٨، الأنبياء: ٨٧-٨٨" },
  zakariyya:   { mentioned: 7,  miracle: "وُهب له يحيى وهو شيخ وامرأته عاقر",                  quranRef: "آل عمران: ٣٧-٤١، مريم: ١-١١" },
  yahya:       { mentioned: 2,                                                                    quranRef: "مريم: ١٢-١٥، آل عمران: ٣٩" },
  isa:         { mentioned: 25, miracle: "إبراء الأكمه والأبرص وإحياء الموتى والكلام في المهد", book: "الإنجيل", quranRef: "آل عمران: ٤٥-٥٩، مريم: ١٦-٣٤" },
  muhammad:    { mentioned: 4,  miracle: "القرآن الكريم، المعجزة الخالدة الباقية",              book: "القرآن الكريم", quranRef: "الأحزاب: ٤٠، الأنبياء: ١٠٧" },
};

const ULUL_AZM_SLUGS = ["nuh", "ibrahim", "musa", "isa", "muhammad"];

const MIRACLES_LIST = [
  { nabi: "محمد ﷺ",   miracle: "القرآن الكريم، المعجزة الخالدة",                ayah: "البقرة: ٢٣" },
  { nabi: "موسى ﷺ",   miracle: "انفلاق البحر الأحمر لبني إسرائيل",               ayah: "الشعراء: ٦٣" },
  { nabi: "عيسى ﷺ",   miracle: "إحياء الموتى وإبراء الأكمه والأبرص",             ayah: "آل عمران: ٤٩" },
  { nabi: "إبراهيم ﷺ", miracle: "النار لم تحرقه، ﴿كُونِي بَرْدًا وَسَلَامًا﴾", ayah: "الأنبياء: ٦٩" },
  { nabi: "صالح ﷺ",   miracle: "الناقة من الصخرة الصمّاء",                       ayah: "الأعراف: ٧٣" },
  { nabi: "سليمان ﷺ", miracle: "تسخير الجن والريح وفهم لغة الطير",               ayah: "الأنبياء: ٨١" },
  { nabi: "يونس ﷺ",   miracle: "الحياة في بطن الحوت ثم النجاة",                  ayah: "الأنبياء: ٨٧" },
  { nabi: "داود ﷺ",   miracle: "تليين الحديد بيديه والزبور",                      ayah: "سبأ: ١٠" },
  { nabi: "زكريا ﷺ",  miracle: "الولد من زوجة عاقر على كبر السن",                ayah: "مريم: ٨" },
  { nabi: "يعقوب ﷺ",  miracle: "عودة البصر من قميص يوسف",                        ayah: "يوسف: ٩٦" },
  { nabi: "نوح ﷺ",    miracle: "السفينة والطوفان، نجاة المؤمنين",               ayah: "هود: ٤٠" },
  { nabi: "آدم ﷺ",    miracle: "خُلق من طين وعُلِّم الأسماء كلها",               ayah: "البقرة: ٣١" },
  { nabi: "يوسف ﷺ",  miracle: "تأويل الأحلام وإخبار بالغيب",                    ayah: "يوسف: ٤٣-٤٩" },
  { nabi: "لوط ﷺ",   miracle: "النجاة من العذاب مع أهله إلا زوجته",             ayah: "هود: ٨١" },
  { nabi: "شعيب ﷺ",  miracle: "نجاته مع المؤمنين من حجارة الصيحة",              ayah: "هود: ٩٤" },
  { nabi: "إلياس ﷺ", miracle: "رفعه إلى السماء وإهلاك قومه الكافرين",           ayah: "الصافات: ١٢٤" },
];

function prophetColor(slug: string) { return PROPHET_HUE[slug] || IVORY; }

function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("prophet-bookmarks") || "[]"); }
    catch { return []; }
  });
  const toggle = useCallback((slug: string) => {
    setBookmarks(prev => {
      const next = prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug];
      try { localStorage.setItem("prophet-bookmarks", JSON.stringify(next)); } catch { /* localStorage unavailable */ }
      return next;
    });
  }, []);
  const has = useCallback((slug: string) => bookmarks.includes(slug), [bookmarks]);
  return { toggle, has, count: bookmarks.length };
}

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
  { q: "ما معجزة نبي الله داود؟", a: "تليين الحديد والزبور", opts: ["انفلاق البحر", "ناقة من صخرة", "تليين الحديد والزبور", "الكلام في المهد"] },
  { q: "كم عدد الأنبياء المذكورين بأسمائهم في القرآن الكريم؟", a: "٢٥ نبياً", opts: ["١٨ نبياً", "٢٠ نبياً", "٢٥ نبياً", "٣٠ نبياً"] },
  { q: "من النبي الذي ابتُلي بالمرض سنوات طويلة ثم عافاه الله؟", a: "أيوب", opts: ["يونس", "أيوب", "يعقوب", "يوسف"] },
  { q: "ما الكتاب المنزَّل على نبي الله عيسى عليه السلام؟", a: "الإنجيل", opts: ["التوراة", "الزبور", "الإنجيل", "الصحف"] },
  { q: "أيُّ الأنبياء لُقِّب بـ «ذي الكفل»؟", a: "ذو الكفل", opts: ["ذو النون", "ذو الكفل", "ذو القرنين", "صدّيق"] },
];

// ── ProphetCard ──────────────────────────────────────────────────────────────

function ProphetCard({
  prophet,
  onSelect,
  isBookmarked,
  onBookmark,
}: {
  prophet: ProphetRecord;
  onSelect: () => void;
  isBookmarked: boolean;
  onBookmark: (e: React.MouseEvent) => void;
}) {
  const color = prophetColor(prophet.slug);
  const sup = SUPPLEMENT[prophet.slug];
  const [hovered, setHovered] = useState(false);
  const isUlulAzm = ULUL_AZM_SLUGS.includes(prophet.slug);

  return (
    <article
      className={`prophet-lux-card${isUlulAzm ? " prophet-lux-card--azm" : ""}`}
      style={{
        "--prophet-color": color,
        "--prophet-color-light": color + "30",
      } as React.CSSProperties}
      onClick={onSelect}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && onSelect()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      tabIndex={0}
      role="button"
      aria-label={`عرض قصة ${prophet.arabicName} عليه السلام`}
    >
      <div className="prophet-lux-card__num">{prophet.id}</div>

      <div className="prophet-lux-card__star">
        <IslamicStar size={36} color={color} opacity={hovered ? 1 : 0.7} />
      </div>

      <div className="prophet-lux-card__body">
        <h3 className="prophet-lux-card__name">
          {prophet.arabicName}
          <span className="prophet-lux-card__pbuh"> عليه السلام</span>
        </h3>
        {prophet.quranTitle && (
          <div className="prophet-lux-card__quran">﴾ {prophet.quranTitle} ﴿</div>
        )}
        <p className="prophet-lux-card__title">{prophet.title}</p>
        <p className="prophet-lux-card__place">{prophet.peopleOrPlace}</p>
        <p className="prophet-lux-card__bio">{prophet.briefBio.slice(0, 100)}…</p>

        <div className="prophet-lux-card__footer">
          {sup && (
            <span className="prophet-lux-card__surahs">
              ذُكر {sup.mentioned} مرة
              {sup.book && ` · ${sup.book}`}
            </span>
          )}
          <span className="prophet-lux-card__read">اقرأ القصة ←</span>
        </div>
      </div>

      <button
        type="button"
        className="prophet-lux-card__bookmark"
        onClick={onBookmark}
        aria-label={isBookmarked ? "إزالة من المفضلة" : "إضافة للمفضلة"}
      >
        {isBookmarked
          ? <Heart size={16} className="icon-danger--filled" />
          : <Heart size={16} />}
      </button>

      {isUlulAzm && <div className="prophet-lux-card__azm-tag">أولو العزم</div>}
      <div className="prophet-lux-card__border" />
    </article>
  );
}

// ── ProphetDetailView ────────────────────────────────────────────────────────

function ProphetDetailView({
  slug,
  onBack,
  onNavigate,
  isBookmarked,
  onBookmark,
}: {
  slug: string;
  onBack: () => void;
  onNavigate: (slug: string) => void;
  isBookmarked: boolean;
  onBookmark: () => void;
}) {
  const p = getProphet(slug);
  const sup = SUPPLEMENT[slug];
  const [fontSize, setFontSize] = useState(16);
  const [dbStory, setDbStory] = useState<{ content: string; citations: Citation[] } | null>(null);
  const [dbLoading, setDbLoading] = useState(true);
  const prevProphet = p && p.id > 1 ? PROPHETS[p.id - 2] : null;
  const nextProphet = p && p.id < PROPHETS.length ? PROPHETS[p.id] : null;

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [slug]);

  useEffect(() => {
    if (!p) return;
    const jsonLd = [
      prophetArticleJsonLd({ name: p.arabicName, slug: p.slug, description: p.briefBio }),
      breadcrumbJsonLd([
        { name: "الرئيسية", path: "/" },
        { name: "قصص الأنبياء", path: "/prophets" },
        { name: p.arabicName, path: `/prophets/${p.slug}` },
      ]),
      ...defaultSiteJsonLd(),
    ];
    applyPageSeo({
      path: `/prophets/${p.slug}`,
      title: `قصة ${p.arabicName} عليه السلام | المجلس العلمي`,
      description: p.briefBio?.slice(0, 160) || `قصة نبي الله ${p.arabicName} عليه السلام من القرآن والسنة.`,
      keywords: ["قصص الأنبياء", p.arabicName, "أنبياء الإسلام", "معجزات الأنبياء"],
      ogType: "article",
      jsonLd,
    });
  }, [slug, p]);

  useEffect(() => {
    setDbStory(null);
    setDbLoading(true);
    supabase
      .from("prophet_stories")
      .select("content, citations")
      .eq("slug", slug)
      .eq("is_approved", true)
      .maybeSingle()
      .then(({ data }) => {
        setDbStory(data ?? null);
        setDbLoading(false);
      });
  }, [slug]);

  if (!p) {
    return (
      <div className="prophet-not-found">
        <button type="button" className="prophet-lux-back" onClick={onBack}>← العودة</button>
        <p className="prophet-not-found__msg">النبي غير موجود</p>
      </div>
    );
  }

  const color = prophetColor(p.slug);
  const isUlulAzm = ULUL_AZM_SLUGS.includes(p.slug);

  const share = async () => {
    const text = `${p.arabicName} عليه السلام، ${p.title}\n${p.briefBio.slice(0, 200)}…\n\nمن قصص الأنبياء في المجالس العلمية`;
    const url = `https://majlisilm.com/prophets/${p.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `قصة ${p.arabicName}`, text, url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        alert("تم نسخ الرابط إلى الحافظة ✓");
      }
    } catch { /* share cancelled */ }
  };

  return (
    <div className="prophet-detail-lux" style={{ "--prophet-color": color } as React.CSSProperties}>
      <div className="prophet-detail-lux__topbar">
        <button type="button" className="prophet-lux-back" onClick={onBack}>← قائمة الأنبياء</button>
        <div className="prophet-detail-lux__actions">
          <button
            type="button"
            className="prophet-action-btn"
            onClick={onBookmark}
          >
            {isBookmarked
              ? <><Heart size={13} className="inline icon-danger--filled ml-1" />محفوظ</>
              : <><Heart size={13} className="inline ml-1" />احفظ</>}
          </button>
          <button type="button" className="prophet-action-btn" onClick={share}>
            شارك
          </button>
          <div className="prophet-font-controls">
            <button type="button" onClick={() => setFontSize(s => Math.max(13, s - 1))} aria-label="تصغير الخط">أ−</button>
            <button type="button" onClick={() => setFontSize(s => Math.min(22, s + 1))} aria-label="تكبير الخط">أ+</button>
          </div>
        </div>
      </div>

      <div className="prophet-detail-lux__hero">
        <div className="prophet-detail-lux__hero-pattern" aria-hidden="true">
          {[...Array(12)].map((_, i) => (
            <IslamicStar key={i} size={28} color={IVORY} opacity={0.06 + (i % 4) * 0.02} />
          ))}
        </div>
        <div className="prophet-detail-lux__hero-content">
          <div className="prophet-detail-lux__hero-star">
            <IslamicStar size={60} color={color} />
          </div>
          <span className="prophet-detail-lux__num-badge">النبي {p.id} من {PROPHETS.length}</span>
          {isUlulAzm && <span className="prophet-detail-lux__azm-badge">أولو العزم</span>}
          <h1 className="prophet-detail-lux__name">{p.arabicName}</h1>
          <p className="prophet-detail-lux__pbuh">صلوات الله وسلامه عليه</p>
          {p.quranTitle && (
            <div className="prophet-detail-lux__quran-title">﴾ {p.quranTitle} ﴿</div>
          )}
          <p className="prophet-detail-lux__hero-title">{p.title}</p>
          <GeometricBorder color={color} size={20} />
        </div>
      </div>

      {/* بطاقات حقائق سريعة */}
      <div className="prophet-facts-grid">
        <div className="prophet-fact-card">
          <span className="prophet-fact-card__label">القوم / البلد</span>
          <span className="prophet-fact-card__value">{p.peopleOrPlace}</span>
        </div>
        <div className="prophet-fact-card">
          <span className="prophet-fact-card__label">الحقبة</span>
          <span className="prophet-fact-card__value">{p.era}</span>
        </div>
        {sup && (
          <div className="prophet-fact-card">
            <span className="prophet-fact-card__label">الذِّكر في القرآن</span>
            <span className="prophet-fact-card__value">{sup.mentioned} مرة</span>
          </div>
        )}
        <div className="prophet-fact-card">
          <span className="prophet-fact-card__label">أبرز سورة</span>
          <span className="prophet-fact-card__value">{p.mainSurahs[0] || "—"}</span>
        </div>
        {sup?.book && (
          <div className="prophet-fact-card">
            <span className="prophet-fact-card__label">الكتاب المنزَّل</span>
            <span className="prophet-fact-card__value">{sup.book}</span>
          </div>
        )}
        {sup?.quranRef && (
          <div className="prophet-fact-card prophet-fact-card--wide">
            <span className="prophet-fact-card__label">مواضع في القرآن</span>
            <span className="prophet-fact-card__value">{sup.quranRef}</span>
          </div>
        )}
      </div>

      <article className="prophet-story-lux" style={{ "--pstory-fs": `${fontSize}px` } as React.CSSProperties}>

        <section className="prophet-section-lux">
          <div className="prophet-section-lux__header">
            <IslamicStar size={22} color={color} />
            <h2 className="prophet-section-lux__title">نبذة تعريفية</h2>
          </div>
          <p className="prophet-section-lux__text">{p.briefBio}</p>
        </section>

        {sup?.miracle && (
          <section className="prophet-section-lux">
            <div className="prophet-section-lux__header">
              <IslamicStar size={22} color={color} />
              <h2 className="prophet-section-lux__title">المعجزة الكبرى</h2>
            </div>
            <div className="prophet-miracle-box">
              <span className="prophet-miracle-box__icon">✦</span>
              <p className="prophet-miracle-box__text">{sup.miracle}</p>
            </div>
          </section>
        )}

        <section className="prophet-section-lux">
          <div className="prophet-section-lux__header">
            <IslamicStar size={22} color={color} />
            <h2 className="prophet-section-lux__title">أبرز السور القرآنية</h2>
          </div>
          <div className="prophet-chips-lux">
            {p.mainSurahs.map(s => (
              <span key={s} className="prophet-chip-lux">سورة {s}</span>
            ))}
          </div>
        </section>

        <section className="prophet-section-lux">
          <div className="prophet-section-lux__header">
            <IslamicStar size={22} color={color} />
            <h2 className="prophet-section-lux__title">أبرز الصفات والمعجزات</h2>
          </div>
          <ul className="prophet-attrs-list">
            {p.keyAttributes.map((a, i) => (
              <li key={i} className="prophet-attrs-list__item">
                <span className="prophet-attrs-list__bullet">✦</span>
                {a}
              </li>
            ))}
          </ul>
        </section>

        <section className="prophet-section-lux">
          <div className="prophet-section-lux__header">
            <IslamicStar size={22} color={color} />
            <h2 className="prophet-section-lux__title">الدروس والعبر</h2>
          </div>
          <div className="prophet-lessons-grid">
            {p.lessons.map((l, i) => (
              <div key={i} className="prophet-lesson-card">
                <span className="prophet-lesson-card__num">{i + 1}</span>
                <p className="prophet-lesson-card__text">{l}</p>
              </div>
            ))}
          </div>
        </section>

        {!dbLoading && dbStory?.content && (
          <section className="prophet-section-lux">
            <div className="prophet-section-lux__header">
              <IslamicStar size={22} color={color} />
              <h2 className="prophet-section-lux__title">القصة الكاملة</h2>
            </div>
            <div className="prophet-db-story">
              {dbStory.content.split("\n").filter(Boolean).map((para, i) => (
                <p key={i} className="prophet-section-lux__text prophet-db-para">{para}</p>
              ))}
            </div>
          </section>
        )}

        {!dbLoading && dbStory?.citations && dbStory.citations.length > 0 && (
          <section className="prophet-section-lux">
            <div className="prophet-section-lux__header">
              <IslamicStar size={22} color={color} />
              <h2 className="prophet-section-lux__title">الاستشهادات القرآنية</h2>
            </div>
            <div className="prophet-citations">
              {dbStory.citations.map((c, i) => (
                <div key={i} className="prophet-citation-card">
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

      <div className="prophet-nav-lux">
        {prevProphet ? (
          <button type="button" className="prophet-nav-lux__btn" onClick={() => onNavigate(prevProphet.slug)}>
            <span className="prophet-nav-lux__dir">← السابق</span>
            <span className="prophet-nav-lux__pname">{prevProphet.arabicName}</span>
          </button>
        ) : <span />}
        {nextProphet ? (
          <button type="button" className="prophet-nav-lux__btn prophet-nav-lux__btn--next" onClick={() => onNavigate(nextProphet.slug)}>
            <span className="prophet-nav-lux__dir">التالي →</span>
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
        const side = idx % 2 === 0 ? "right" : "left";
        return (
          <div key={p.slug} className={`prophet-timeline__item prophet-timeline__item--${side}`} style={{ "--item-color": color } as React.CSSProperties}>
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
        <p>أولو العزم من الرسل أصحاب الشريعة والكتاب المستقل. ذكرهم الله في قوله: ﴿فَاصْبِرْ كَمَا صَبَرَ أُولُو الْعَزْمِ مِنَ الرُّسُلِ﴾ (الأحقاف: ٣٥).</p>
      </div>
      <div className="nb-azm-grid">
        {prophets.map((p, i) => {
          const sup = SUPPLEMENT[p.slug];
          return (
            <div
              key={p.slug}
              className="nb-azm-card"
              style={{ "--prophet-color": prophetColor(p.slug) } as React.CSSProperties}
              onClick={() => onSelect(p.slug)}
              role="button"
              tabIndex={0}
              onKeyDown={e => (e.key === "Enter" || e.key === " ") && onSelect(p.slug)}
              aria-label={`قصة ${p.arabicName}`}
            >
              <div className="nb-azm-rank">{i + 1}</div>
              <div className="nb-azm-star"><IslamicStar size={32} color={prophetColor(p.slug)} /></div>
              <h3 className="nb-azm-name">{p.arabicName} ﷺ</h3>
              <div className="nb-azm-book">{sup?.book ? `كتابه: ${sup.book}` : "لا كتاب مستقل"}</div>
              <p className="nb-azm-story">{p.briefBio.slice(0, 140)}…</p>
              {sup?.miracle && (
                <div className="nb-azm-miracle">
                  <strong>معجزته:</strong> {sup.miracle}
                </div>
              )}
              {sup && (
                <div className="nb-azm-mentions">ذُكر في القرآن {sup.mentioned} مرة</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── MiraclesView ─────────────────────────────────────────────────────────────

function MiraclesView() {
  return (
    <div>
      <div className="nb-intro-box">
        <p>المعجزة: أمر خارق للعادة يُجريه الله على يد النبي تحدياً للمكذِّبين وتأييداً للداعية. وأعظم المعجزات وأخلدها القرآن الكريم.</p>
      </div>
      <div className="nb-miracles-grid">
        {MIRACLES_LIST.map((m, i) => (
          <div key={i} className="nb-miracle-card">
            <div className="nb-miracle-nabi">{m.nabi}</div>
            <p className="nb-miracle-text">{m.miracle}</p>
            <div className="nb-miracle-ref">{m.ayah}</div>
          </div>
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
                  onClick={() => onSelect(p.slug)}
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
          <IslamicStar size={64} color={IVORY} />
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

type View = "grid" | "timeline" | "ulul-azm" | "miracles" | "compare" | "bookmarks" | "quiz";

const TABS: { id: View; label: string }[] = [
  { id: "grid",      label: "القائمة" },
  { id: "timeline",  label: "الخط الزمني" },
  { id: "ulul-azm",  label: "أولو العزم" },
  { id: "miracles",  label: "المعجزات" },
  { id: "compare",   label: "مقارنة" },
  { id: "bookmarks", label: "المفضلة" },
  { id: "quiz",      label: "اختبر نفسك" },
];

export default function ProphetStoriesPage() {
  const [search, setSearch] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [view, setView] = useState<View>("grid");
  const { toggle: toggleBookmark, has: isBookmarked, count: bookmarkCount } = useBookmarks();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/prophets",
      title: "الأنبياء والرسل | المجالس العلمية",
      description: "قصص ٢٥ نبياً ورسولاً مذكورين في القرآن الكريم، سِيَرهم ومعجزاتهم وأقوامهم والدروس المستفادة، مع خط زمني ومقارنة وأولو العزم.",
      keywords: ["قصص الأنبياء", "الأنبياء في القرآن", "معجزات الأنبياء", "أولو العزم", "أنبياء الإسلام"],
    });
  }, []);

  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/(?:prophets|anbiya)\/([^/]+)$/);
    if (match) setSelectedSlug(match[1]);
  }, []);

  const results = view === "bookmarks"
    ? searchProphets(search).filter(p => isBookmarked(p.slug))
    : searchProphets(search);

  if (selectedSlug) {
    return (
      <ProphetDetailView
        slug={selectedSlug}
        onBack={() => setSelectedSlug(null)}
        onNavigate={setSelectedSlug}
        isBookmarked={isBookmarked(selectedSlug)}
        onBookmark={() => toggleBookmark(selectedSlug)}
      />
    );
  }

  if (view === "quiz") {
    return <QuizView onClose={() => setView("grid")} />;
  }

  return (
    <div className="prophets-lux-page">

      {/* Hero Banner */}
      <div className="prophets-lux-hero">
        <div className="prophets-lux-hero__stars" aria-hidden="true">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="prophets-lux-hero__star-wrap"
              style={{
                "--star-top": `${Math.sin(i * 1.37) * 40 + 50}%`,
                "--star-left": `${(i / 10) * 100}%`,
                "--star-delay": `${i * 0.5}s`,
              } as React.CSSProperties}
            >
              <IslamicStar size={16 + (i % 3) * 10} color={IVORY} opacity={0.07 + (i % 4) * 0.03} />
            </div>
          ))}
        </div>
        <div className="prophets-lux-hero__content">
          <GeometricBorder color={IVORY} size={24} />
          <h1 className="prophets-lux-hero__title">الأنبياء والرسل</h1>
          <p className="prophets-lux-hero__subtitle">
            أحسن القصص، ٢٥ نبياً مذكوراً في القرآن الكريم
          </p>
          <div className="prophets-lux-hero__stats">
            <span>{PROPHETS.length} نبياً</span>
            <span>·</span>
            <span>٥ أولو العزم</span>
            <span>·</span>
            <span>١٢٤٫٠٠٠ نبي (حديث)</span>
          </div>
          <GeometricBorder color={IVORY} size={24} />
        </div>
      </div>

      {/* تبويبات العرض */}
      <div className="prophets-light-section">
        <div className="prophets-lux-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              className={`prophets-lux-tab ${view === t.id ? "prophets-lux-tab--active" : ""}`}
              onClick={() => setView(t.id)}
              aria-pressed={view === t.id}
            >
              {t.id === "grid"      && <><LayoutList size={14} strokeWidth={1.8} aria-hidden="true" /> {t.label}</>}
              {t.id === "timeline"  && <><CalendarDays size={14} strokeWidth={1.8} aria-hidden="true" /> {t.label}</>}
              {t.id === "bookmarks" && <><Heart size={14} strokeWidth={1.8} aria-hidden="true" /> {t.label}{bookmarkCount > 0 ? ` (${bookmarkCount})` : ""}</>}
              {t.id === "quiz"      && <><HelpCircle size={14} strokeWidth={1.8} aria-hidden="true" /> {t.label}</>}
              {!["grid","timeline","bookmarks","quiz"].includes(t.id) && t.label}
            </button>
          ))}
        </div>

        {/* Xط الزمني */}
        {view === "timeline" && (
          <div className="prophets-lux-container">
            <TimelineView onSelect={setSelectedSlug} />
          </div>
        )}

        {/* أولو العزم */}
        {view === "ulul-azm" && (
          <div className="prophets-lux-container nb-container">
            <UlulAzmView onSelect={setSelectedSlug} />
          </div>
        )}

        {/* المعجزات */}
        {view === "miracles" && (
          <div className="prophets-lux-container nb-container">
            <MiraclesView />
          </div>
        )}

        {/* مقارنة */}
        {view === "compare" && (
          <div className="prophets-lux-container nb-container">
            <CompareView onSelect={setSelectedSlug} />
          </div>
        )}

        {/* قائمة + مفضلة */}
        {(view === "grid" || view === "bookmarks") && (
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
                <IslamicStar size={48} color={IVORY} opacity={0.3} />
                <p>لا توجد نتائج لـ «{search}»</p>
              </div>
            ) : (
              <>
                <div className="prophets-lux-grid">
                  {results.map(p => (
                    <ProphetCard
                      key={p.slug}
                      prophet={p}
                      onSelect={() => setSelectedSlug(p.slug)}
                      isBookmarked={isBookmarked(p.slug)}
                      onBookmark={e => { e.stopPropagation(); toggleBookmark(p.slug); }}
                    />
                  ))}
                </div>
                {!search && (
                  <Link href="/seerah" className="prophets-seerah-link">
                    <div className="prophets-seerah-bridge">
                      <div className="prophets-seerah-bridge__ornament" aria-hidden="true">
                        <IslamicStar size={28} color={IVORY} opacity={0.7} />
                      </div>
                      <div className="prophets-seerah-bridge__body">
                        <div className="prophets-seerah-bridge__eyebrow">التسلسل التاريخي · الفصل الأخير</div>
                        <h3 className="prophets-seerah-bridge__title">بداية السيرة النبوية الشريفة</h3>
                        <p className="prophets-seerah-bridge__desc">
                          امتداداً لرسالة الأنبياء، وُلد خاتم النبيين محمد ﷺ، اقرأ سيرته من النسب إلى الرسالة والهجرة والفتح.
                        </p>
                      </div>
                      <div className="prophets-seerah-bridge__arrow" aria-hidden="true">←</div>
                    </div>
                  </Link>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <SectionQuiz
        categoryId={["anbiya", "sira"]}
        title="اختبر معلوماتك في قصص الأنبياء"
        count={4}
      />

      <div className="twh-share">
        <ShareButtons title="قصص الأنبياء — المجلس العلمي" url="https://majlisilm.com/prophet-stories" />
      </div>
    </div>
  );
}
