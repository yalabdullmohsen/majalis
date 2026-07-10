import { useEffect, useState } from "react";
import { BookOpen, Building2, GraduationCap, Globe, Library, MapPin, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";

// ─── Seed Data ────────────────────────────────────────────────────────────────

type Institution = {
  id: string;
  name: string;
  type: "mosque" | "center" | "university" | "library";
  city: string;
  country: string;
  description: string;
  website?: string;
  mapQuery?: string;
};

const INSTITUTIONS: Institution[] = [
  // مساجد
  {
    id: "masjid-haram",
    name: "المسجد الحرام",
    type: "mosque",
    city: "مكة المكرمة",
    country: "المملكة العربية السعودية",
    description: "أقدس المساجد وقبلة المسلمين، يضم الكعبة المشرفة والمسعى وبئر زمزم.",
    website: "https://www.gph.gov.sa",
    mapQuery: "المسجد الحرام مكة",
  },
  {
    id: "masjid-nabawi",
    name: "المسجد النبوي الشريف",
    type: "mosque",
    city: "المدينة المنورة",
    country: "المملكة العربية السعودية",
    description: "ثاني أشرف المساجد، يضم قبر النبي ﷺ والروضة الشريفة ومنبره.",
    website: "https://www.gph.gov.sa",
    mapQuery: "المسجد النبوي المدينة المنورة",
  },
  {
    id: "masjid-aqsa",
    name: "المسجد الأقصى",
    type: "mosque",
    city: "القدس",
    country: "فلسطين",
    description: "ثالث الحرمين الشريفين وأولى القبلتين وقبلة الأنبياء والمرسلين.",
    mapQuery: "المسجد الأقصى القدس",
  },
  {
    id: "masjid-quba",
    name: "مسجد قباء",
    type: "mosque",
    city: "المدينة المنورة",
    country: "المملكة العربية السعودية",
    description: "أول مسجد بُني في الإسلام، والصلاة فيه كعمرة كاملة.",
    mapQuery: "مسجد قباء المدينة المنورة",
  },
  // مراكز إسلامية
  {
    id: "rabita",
    name: "رابطة العالم الإسلامي",
    type: "center",
    city: "مكة المكرمة",
    country: "المملكة العربية السعودية",
    description: "منظمة إسلامية دولية تعنى بشؤون المسلمين ونشر الوسطية وتعزيز الحوار.",
    website: "https://www.themwl.org",
    mapQuery: "رابطة العالم الإسلامي مكة",
  },
  {
    id: "ium",
    name: "الجامعة الإسلامية العالمية في ماليزيا",
    type: "university",
    city: "كوالالمبور",
    country: "ماليزيا",
    description: "مؤسسة أكاديمية رائدة تجمع الدراسات الإسلامية مع العلوم الحديثة.",
    website: "https://www.iium.edu.my",
    mapQuery: "الجامعة الإسلامية ماليزيا",
  },
  {
    id: "azhar",
    name: "الجامع الأزهر الشريف",
    type: "university",
    city: "القاهرة",
    country: "مصر",
    description: "أعرق المؤسسات التعليمية الإسلامية في العالم، تأسس عام 970م.",
    website: "https://www.azhar.eg",
    mapQuery: "الجامع الأزهر القاهرة",
  },
  {
    id: "medina-university",
    name: "الجامعة الإسلامية بالمدينة المنورة",
    type: "university",
    city: "المدينة المنورة",
    country: "المملكة العربية السعودية",
    description: "جامعة متخصصة في الشريعة والقرآن وعلوم الدين، تستقبل طلاباً من شتى أنحاء العالم.",
    website: "https://www.iu.edu.sa",
    mapQuery: "الجامعة الإسلامية المدينة",
  },
  {
    id: "umm-alqura",
    name: "جامعة أم القرى",
    type: "university",
    city: "مكة المكرمة",
    country: "المملكة العربية السعودية",
    description: "من أعرق الجامعات السعودية، متخصصة في الشريعة والعلوم الإسلامية واللغة العربية.",
    website: "https://www.uqu.edu.sa",
    mapQuery: "جامعة أم القرى مكة",
  },
  // مكتبات
  {
    id: "king-fahad-library",
    name: "مكتبة الملك فهد الوطنية",
    type: "library",
    city: "الرياض",
    country: "المملكة العربية السعودية",
    description: "أكبر مكتبات المملكة العربية السعودية، تضم ملايين الوثائق والمخطوطات والكتب.",
    website: "https://www.kfnl.gov.sa",
    mapQuery: "مكتبة الملك فهد الرياض",
  },
  {
    id: "dar-kutub",
    name: "دار الكتب المصرية",
    type: "library",
    city: "القاهرة",
    country: "مصر",
    description: "أقدم مكتبة وطنية في الشرق الأوسط، تأسست عام 1870م، تحتوي على نفائس المخطوطات.",
    website: "https://www.darelkotob.org",
    mapQuery: "دار الكتب المصرية القاهرة",
  },
  {
    id: "maktabah-shamila",
    name: "الموسوعة الشاملة، المكتبة الشاملة",
    type: "library",
    city: "عبر الإنترنت",
    country: "عالمي",
    description: "أكبر مكتبة إسلامية رقمية مجانية، تضم آلاف الكتب والمتون الشرعية المُحققة.",
    website: "https://shamela.ws",
  },
  {
    id: "islamweb-library",
    name: "مكتبة إسلام ويب",
    type: "library",
    city: "الدوحة",
    country: "قطر",
    description: "مكتبة رقمية إسلامية شاملة تتبع منظومة قطر للشؤون الدينية.",
    website: "https://www.islamweb.net",
  },
  // مراكز بحثية وهيئات
  {
    id: "ifta-saudi",
    name: "هيئة كبار العلماء",
    type: "center",
    city: "الرياض",
    country: "المملكة العربية السعودية",
    description: "أعلى هيئة دينية في المملكة، تتولى إصدار الفتاوى في القضايا الكبرى.",
    website: "https://www.ssa.gov.sa",
    mapQuery: "هيئة كبار العلماء الرياض",
  },
  {
    id: "fiqh-council-mecca",
    name: "مجمع الفقه الإسلامي الدولي",
    type: "center",
    city: "جدة",
    country: "المملكة العربية السعودية",
    description: "مؤسسة فقهية دولية تابعة لمنظمة التعاون الإسلامي، تُصدر قرارات في النوازل المعاصرة.",
    website: "https://www.iifa-aifi.org",
    mapQuery: "مجمع الفقه الإسلامي جدة",
  },
  // إضافات، مساجد
  {
    id: "masjid-kabir-kuwait",
    name: "المسجد الكبير",
    type: "mosque",
    city: "الكويت",
    country: "الكويت",
    description: "أكبر مساجد الكويت وأبرزها، يستوعب آلاف المصلين ويُقام فيه دروس علمية أسبوعية.",
    mapQuery: "المسجد الكبير الكويت",
  },
  {
    id: "masjid-ali-kuwait",
    name: "مسجد علي بن أبي طالب، الروضة",
    type: "mosque",
    city: "الكويت",
    country: "الكويت",
    description: "من أبرز مساجد الكويت العلمية، يُعقد فيه درس منتظم للشيخ عبدالله المطلق.",
    mapQuery: "مسجد علي بن أبي طالب الروضة الكويت",
  },
  {
    id: "masjid-sultan-brunei",
    name: "مسجد السلطان عمر علي سيف الدين",
    type: "mosque",
    city: "بندر سري بكاوان",
    country: "بروناي",
    description: "من أجمل المساجد في جنوب شرق آسيا، بمعمار إسلامي بديع ومئذنة تطل على بحيرة.",
    mapQuery: "مسجد السلطان عمر بروناي",
  },
  {
    id: "masjid-hassan-2-morocco",
    name: "مسجد الحسن الثاني",
    type: "mosque",
    city: "الدار البيضاء",
    country: "المغرب",
    description: "ثالث أكبر مساجد العالم، يضم مئذنة بارتفاع 210م، وقاعات تعليمية ومركزاً ثقافياً.",
    mapQuery: "مسجد الحسن الثاني الدار البيضاء",
  },
  // إضافات، جامعات
  {
    id: "kuwait-univ-sharia",
    name: "كلية الشريعة والدراسات الإسلامية، جامعة الكويت",
    type: "university",
    city: "الكويت",
    country: "الكويت",
    description: "تُخرّج المتخصصين في الفقه وأصوله والشريعة والقرآن وعلوم الدين، وتُصدر أبحاثاً شرعية محكّمة.",
    website: "https://www.ku.edu.kw",
    mapQuery: "كلية الشريعة جامعة الكويت",
  },
  {
    id: "imam-univ",
    name: "جامعة الإمام محمد بن سعود الإسلامية",
    type: "university",
    city: "الرياض",
    country: "المملكة العربية السعودية",
    description: "مؤسسة علمية رائدة في الشريعة والأصول والحديث والدعوة، لها فروع في أنحاء العالم.",
    website: "https://www.imamu.edu.sa",
    mapQuery: "جامعة الإمام محمد بن سعود الرياض",
  },
  {
    id: "jordan-univ-sharia",
    name: "كلية الشريعة، الجامعة الأردنية",
    type: "university",
    city: "عمّان",
    country: "الأردن",
    description: "من أعرق كليات الشريعة في المشرق، تتبنى منهج الوسطية وتُصدر مجلة البحوث الإسلامية.",
    website: "https://www.ju.edu.jo",
    mapQuery: "الجامعة الأردنية عمان",
  },
  // إضافات، مراكز
  {
    id: "darul-ifta-egypt",
    name: "دار الإفتاء المصرية",
    type: "center",
    city: "القاهرة",
    country: "مصر",
    description: "أقدم دور الإفتاء الرسمية في العالم الإسلامي، تأسست 1895م، وتُصدر الفتاوى الشرعية للجمهور.",
    website: "https://www.dar-alifta.org",
    mapQuery: "دار الإفتاء المصرية القاهرة",
  },
  {
    id: "kuwait-awqaf",
    name: "وزارة الأوقاف والشؤون الإسلامية، الكويت",
    type: "center",
    city: "الكويت",
    country: "الكويت",
    description: "تشرف على إدارة المساجد والدروس الشرعية وشؤون الزكاة والأوقاف وتقييم الكتب الإسلامية.",
    website: "https://www.islam.gov.kw",
    mapQuery: "وزارة الأوقاف الكويت",
  },
  // إضافات، مكتبات
  {
    id: "haj-library-mecca",
    name: "مكتبة الحج، وزارة الشؤون الإسلامية",
    type: "library",
    city: "مكة المكرمة",
    country: "المملكة العربية السعودية",
    description: "تضم آلاف الكتب والمخطوطات المتعلقة بشعائر الحج والسيرة النبوية وفضائل الأماكن.",
    mapQuery: "مكتبة الحج مكة",
  },
  {
    id: "dorar",
    name: "موقع الدُّرر السنية",
    type: "library",
    city: "عبر الإنترنت",
    country: "عالمي",
    description: "موسوعة إسلامية ضخمة تشمل الموسوعة الفقهية الكبرى وعشرات الآلاف من الفتاوى وشروح الأحاديث.",
    website: "https://dorar.net",
  },
  // مراكز إسلامية إضافية
  {
    id: "rabitat-alam-islami",
    name: "رابطة العالم الإسلامي",
    type: "center",
    city: "مكة المكرمة",
    country: "المملكة العربية السعودية",
    description: "منظمة إسلامية دولية تأسست عام 1382هـ، تضطلع بنشر الإسلام وتوحيد الجهود الإسلامية ودعم المسلمين في العالم.",
    website: "https://www.themwl.org",
    mapQuery: "رابطة العالم الإسلامي مكة",
  },
  {
    id: "oxford-islamic-studies",
    name: "مركز الدراسات الإسلامية، أكسفورد",
    type: "center",
    city: "أكسفورد",
    country: "المملكة المتحدة",
    description: "مركز أكاديمي رائد يتبع جامعة أكسفورد، يُجري أبحاثاً في الشريعة والحضارة الإسلامية ويعزز الحوار الثقافي.",
    website: "https://www.oxfordislamicstudies.com",
    mapQuery: "Oxford Centre for Islamic Studies",
  },
  {
    id: "irshad-turkey",
    name: "رئاسة الشؤون الدينية التركية (ديانت)",
    type: "center",
    city: "أنقرة",
    country: "تركيا",
    description: "أكبر مؤسسة إسلامية رسمية في العالم من حيث الميزانية والانتشار، تشرف على أكثر من ثمانين ألف مسجد وتُصدر الفتاوى.",
    website: "https://www.diyanet.gov.tr",
    mapQuery: "Diyanet İşleri Başkanlığı Ankara",
  },
  // مكتبات إضافية
  {
    id: "shamela",
    name: "المكتبة الشاملة",
    type: "library",
    city: "عبر الإنترنت",
    country: "عالمي",
    description: "برنامج المكتبة الشاملة يحتوي على أكثر من ستة آلاف كتاب إسلامي رقمي قابل للبحث، ويُعدّ المرجع الرقمي الأول للباحثين.",
    website: "https://shamela.ws",
  },
  {
    id: "maktaba-islamiya-istanbul",
    name: "مكتبة السليمانية، إسطنبول",
    type: "library",
    city: "إسطنبول",
    country: "تركيا",
    description: "أعظم مستودعات المخطوطات الإسلامية في العالم، تضم أكثر من مئة وثمانين ألف مخطوطة في مختلف علوم الشريعة واللغة والتاريخ.",
    mapQuery: "Süleymaniye Kütüphanesi Istanbul",
  },
];

const TYPE_LABELS: Record<Institution["type"], string> = {
  mosque: "المساجد",
  center: "المراكز الإسلامية",
  university: "الجامعات",
  library: "المكتبات",
};

const TYPE_ICONS: Record<Institution["type"], LucideIcon> = {
  mosque: Building2,
  center: Library,
  university: GraduationCap,
  library: BookOpen,
};

const TYPE_FILTERS: { key: Institution["type"] | "all"; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "mosque", label: "المساجد" },
  { key: "university", label: "الجامعات" },
  { key: "center", label: "المراكز" },
  { key: "library", label: "المكتبات" },
];

// ─── Institution Card ─────────────────────────────────────────────────────────

function InstitutionCard({ inst }: { inst: Institution }) {
  return (
    <div className="inst-card">
      <div className="inst-card__head">
        <span className="inst-card__icon" aria-hidden="true">{(() => { const I = TYPE_ICONS[inst.type]; return <I size={22} strokeWidth={1.5} />; })()}</span>
        <div className="inst-card__meta">
          <h3 className="inst-card__name">{inst.name}</h3>
          <span className="inst-card__location">
            {inst.city}، {inst.country}
          </span>
        </div>
        <span className="inst-card__type-badge">{TYPE_LABELS[inst.type]}</span>
      </div>
      <p className="inst-card__desc">{inst.description}</p>
      <div className="inst-card__links">
        {inst.website && (
          <a
            href={inst.website}
            className="inst-card__link inst-card__link--web"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Globe size={13} strokeWidth={1.8} aria-hidden="true" /> الموقع الرسمي
          </a>
        )}
        {inst.mapQuery && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(inst.mapQuery)}`}
            className="inst-card__link inst-card__link--map"
            target="_blank"
            rel="noopener noreferrer"
          >
            <MapPin size={13} strokeWidth={1.8} aria-hidden="true" /> الموقع على الخريطة
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InstitutionsPage() {
  const [filter, setFilter] = useState<Institution["type"] | "all">("all");

  useEffect(() => {
    applyPageSeo({
      path: "/institutions",
      title: "المؤسسات الإسلامية | المجلس العلمي",
      description: "دليل المؤسسات الإسلامية والمراكز الشرعية، مساجد ومعاهد وجامعات وهيئات إسلامية.",
      keywords: ["مؤسسات إسلامية", "مراكز إسلامية", "معاهد شرعية", "جامعات إسلامية", "هيئات دينية"],
    });
  }, []);
  const [search, setSearch] = useState("");

  const filtered = INSTITUTIONS.filter((inst) => {
    const matchType = filter === "all" || inst.type === filter;
    const matchSearch =
      !search ||
      inst.name.includes(search) ||
      inst.city.includes(search) ||
      inst.country.includes(search) ||
      inst.description.includes(search);
    return matchType && matchSearch;
  });

  return (
    <div className="page-shell inst-page" dir="rtl">
      <div className="home-container">
        <PageHeader
          eyebrow="الدليل الإسلامي"
          title="دليل المؤسسات الإسلامية"
          subtitle="فهرس بأبرز المساجد والجامعات والمراكز البحثية والمكتبات الإسلامية في العالم."
        />

        {/* Search */}
        <div className="inst-search-wrap">
          <input
            type="text"
            className="vault-search"
            placeholder="ابحث باسم المؤسسة أو البلد أو المدينة…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            dir="rtl"
          />
          {search && (
            <button type="button" className="vault-search-clear" onClick={() => setSearch("")} aria-label="مسح البحث">✕</button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="inst-filters" role="tablist">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              className={`vault-tab${filter === f.key ? " vault-tab--active" : ""}`}
              onClick={() => setFilter(f.key as Institution["type"] | "all")}
            >
              {f.label}
              <span className="vault-tab__count">
                {f.key === "all"
                  ? INSTITUTIONS.length
                  : INSTITUTIONS.filter((i) => i.type === f.key).length}
              </span>
            </button>
          ))}
        </div>

        {/* Results count */}
        {search && (
          <p className="inst-results-count">{filtered.length} نتيجة لـ "{search}"</p>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="vault-empty">
            <div className="vault-empty__icon" aria-hidden="true"><Search size={40} strokeWidth={1.3} /></div>
            <p>لا توجد نتائج مطابقة.</p>
          </div>
        ) : (
          <div className="inst-grid">
            {filtered.map((inst) => (
              <InstitutionCard key={inst.id} inst={inst} />
            ))}
          </div>
        )}

        <p className="inst-disclaimer">
          * هذا الدليل مرجعي تعريفي. للتحقق من المعلومات يُرجى مراجعة المواقع الرسمية لكل مؤسسة.
        </p>

        <div className="twh-share">
          <ShareButtons title="المؤسسات الإسلامية — المجلس العلمي" url="https://majlisilm.com/institutions" />
        </div>
      </div>
    </div>
  );
}
