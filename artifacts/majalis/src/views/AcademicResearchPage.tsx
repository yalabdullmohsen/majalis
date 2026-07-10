import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import {
  Briefcase, Building2, ExternalLink, Globe,
  GraduationCap, Landmark, Library, PenLine, Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── أنواع ────────────────────────────────────────────────────────────────────

type Tab = "theses" | "institutions" | "personal";
type DegreeType = "ماجستير" | "دكتوراه";

interface Thesis {
  id: string;
  title: string;
  author: string;
  degree: DegreeType;
  university: string;
  year: number;
  specialization: string;
  abstract: string;
  supervisor?: string;
  pages?: number;
  link?: string;
}

// ── بيانات الرسائل ────────────────────────────────────────────────────────────

const THESES: Thesis[] = [
  // ── دكتوراه ──
  {
    id: "d1",
    title: "ضوابط الاجتهاد المعاصر في النوازل الفقهية",
    author: "د. عبدالله بن محمد الحصين",
    degree: "دكتوراه",
    university: "جامعة الإمام محمد بن سعود الإسلامية",
    year: 2019,
    specialization: "الفقه وأصوله",
    abstract: "تناولت الرسالة ضوابط الاجتهاد في النوازل المعاصرة ومناهج الفقهاء في التعامل مع القضايا المستجدة، مع دراسة تطبيقية على النوازل الطبية والاقتصادية.",
    supervisor: "أ.د. يوسف الشبيلي",
    pages: 480,
  },
  {
    id: "d2",
    title: "المعاملات المالية الإلكترونية وأحكامها في الفقه الإسلامي",
    author: "د. نورة بنت سعد العتيبي",
    degree: "دكتوراه",
    university: "جامعة الكويت",
    year: 2021,
    specialization: "الفقه المقارن",
    abstract: "دراسة فقهية مقارنة للمعاملات الإلكترونية الحديثة من عقود ومدفوعات رقمية وعملات مشفرة، مع بيان الحكم الشرعي لكل نوع وفق أدلة الكتاب والسنة وأقوال الفقهاء.",
    supervisor: "أ.د. علي أحمد السالوس",
    pages: 560,
  },
  {
    id: "d3",
    title: "مقاصد الشريعة ودورها في تجديد الفقه الإسلامي",
    author: "د. محمد بن صالح القحطاني",
    degree: "دكتوراه",
    university: "الجامعة الإسلامية بالمدينة المنورة",
    year: 2018,
    specialization: "الفقه وأصوله",
    abstract: "تحليل نظري وتطبيقي لنظرية المقاصد عند الشاطبي وابن عاشور وأثرها في توجيه الاجتهاد المعاصر لمواجهة التحديات المستجدة.",
    supervisor: "أ.د. عمر سليمان الأشقر",
    pages: 620,
  },
  {
    id: "d4",
    title: "علم الرجال وتطبيقاته في نقد الحديث النبوي",
    author: "د. خالد بن عبدالعزيز الدريس",
    degree: "دكتوراه",
    university: "جامعة أم القرى",
    year: 2020,
    specialization: "الحديث وعلومه",
    abstract: "دراسة منهجية في قواعد الجرح والتعديل وتطبيقها على مجموعة من الأحاديث المنتشرة التي اختُلف في صحتها، مع بيان المنهج العلمي في الحكم على الروايات.",
    supervisor: "أ.د. حاتم العوني",
    pages: 720,
  },
  {
    id: "d5",
    title: "الإعجاز العلمي في القرآن الكريم، دراسة نقدية منهجية",
    author: "د. راشد بن أحمد العليوي",
    degree: "دكتوراه",
    university: "جامعة القصيم",
    year: 2017,
    specialization: "الإعجاز العلمي",
    abstract: "مراجعة نقدية لمنهج الإعجاز العلمي وضوابطه الشرعية، مع دراسة تطبيقية على أبرز النظريات العلمية المطابَقة للآيات القرآنية وبيان الصحيح منها.",
    supervisor: "أ.د. عبدالله الطريقي",
    pages: 390,
  },
  {
    id: "d6",
    title: "منهج الإمام أحمد بن حنبل في الرواية والدراية",
    author: "د. سلطان العميري",
    degree: "دكتوراه",
    university: "جامعة الملك عبدالعزيز",
    year: 2016,
    specialization: "الحديث وعلومه",
    abstract: "استقراء شامل لمنهج الإمام أحمد في قبول الأحاديث وردّها وأثر ذلك في مسائل العقيدة والفقه، مع مقارنة منهجه بمناهج أئمة الحديث المعاصرين له.",
    supervisor: "أ.د. أحمد معبد عبدالكريم",
    pages: 680,
  },
  {
    id: "d7",
    title: "الفتوى الجماعية وأثرها في توحيد الموقف الإسلامي من النوازل",
    author: "د. عبدالوهاب الديلمي",
    degree: "دكتوراه",
    university: "الجامعة الأردنية",
    year: 2022,
    specialization: "الفقه المقارن",
    abstract: "دراسة مقارنة لمجامع الفقه الإسلامي ومؤسسات الإفتاء الجماعي وأثرها في تحقيق التوافق الفقهي على النوازل المعاصرة المشتركة.",
    supervisor: "أ.د. عمر عبدالله كامل",
    pages: 510,
  },
  {
    id: "d8",
    title: "التربية الروحية عند الإمام ابن القيم الجوزية",
    author: "د. عائشة محمد النعيمي",
    degree: "دكتوراه",
    university: "جامعة الشارقة",
    year: 2020,
    specialization: "الدعوة والتربية الإسلامية",
    abstract: "استخلاص المنهج التربوي الروحي من مؤلفات ابن القيم وتطبيقاته على مقومات التزكية والسلوك، مع بيان إمكانية تطبيقه في السياق المعاصر.",
    supervisor: "أ.د. محمد عقلة الإبراهيم",
    pages: 445,
  },

  // ── ماجستير ──
  {
    id: "m1",
    title: "أحكام الزكاة في الأسهم والصناديق الاستثمارية",
    author: "عبدالله بن فهد المطيري",
    degree: "ماجستير",
    university: "جامعة الكويت",
    year: 2023,
    specialization: "الفقه وأصوله",
    abstract: "بحث فقهي معاصر في حكم الزكاة على الأسهم المالية وصناديق الاستثمار وكيفية احتساب نصابها ومقدارها وتوقيت إخراجها.",
    supervisor: "د. عمر بن محمد السبيل",
    pages: 210,
  },
  {
    id: "m2",
    title: "الصورة النبوية في السيرة الشعبية، دراسة في المرويات الشفهية بالكويت",
    author: "فاطمة خالد العنزي",
    degree: "ماجستير",
    university: "جامعة الكويت",
    year: 2022,
    specialization: "السيرة والتاريخ الإسلامي",
    abstract: "توثيق وتحليل نقدي للمرويات الشفهية المتعلقة بسيرة النبي ﷺ المتداولة في البيئة الكويتية، مع دراسة مدى توافقها مع المصادر التاريخية الموثوقة.",
    supervisor: "أ.د. حمد العجلان",
    pages: 185,
  },
  {
    id: "m3",
    title: "أثر التقنية الحديثة على عقود الزواج وأحكامه",
    author: "نوف بنت سعود الرشيد",
    degree: "ماجستير",
    university: "جامعة الإمام محمد بن سعود الإسلامية",
    year: 2021,
    specialization: "الفقه المقارن",
    abstract: "دراسة فقهية في أثر الزواج الإلكتروني وعقود الزواج عبر وسائل التواصل الاجتماعي وأحكامها الشرعية من حيث الصحة والنفاذ.",
    supervisor: "د. عبدالعزيز الفوزان",
    pages: 230,
  },
  {
    id: "m4",
    title: "المناهج الحديثة في تعليم القرآن الكريم للناطقين بغير العربية",
    author: "يوسف أحمد سليمان",
    degree: "ماجستير",
    university: "الجامعة الإسلامية بالمدينة المنورة",
    year: 2022,
    specialization: "الدعوة والتربية الإسلامية",
    abstract: "مقارنة بين المناهج المعاصرة في تعليم التلاوة والتجويد للمسلمين الجدد وغير الناطقين بالعربية، مع تقويم هذه المناهج وأثرها في حفظ القرآن وإتقانه.",
    supervisor: "أ.د. عبدالرحمن الحازمي",
    pages: 195,
  },
  {
    id: "m5",
    title: "أحكام العبادات في الفضاء الخارجي",
    author: "سلمى بنت عمر السعدي",
    degree: "ماجستير",
    university: "جامعة الملك عبدالعزيز",
    year: 2023,
    specialization: "الفقه وأصوله",
    abstract: "نازلة فقهية في أحكام الصلاة والصيام والقبلة للمسافر في الفضاء الخارجي، مع بيان المنهج الفقهي في التعامل مع هذه النوازل المعاصرة.",
    supervisor: "د. وليد السعيدان",
    pages: 175,
  },
  {
    id: "m6",
    title: "التفسير الاجتماعي للقرآن الكريم عند سيد قطب",
    author: "علي حسن الزيادي",
    degree: "ماجستير",
    university: "جامعة اليرموك",
    year: 2020,
    specialization: "التفسير وعلوم القرآن",
    abstract: "دراسة تحليلية نقدية للمنهج التفسيري الاجتماعي في ظلال القرآن لسيد قطب، وبيان مواطن الإصابة والإشكال في تعامله مع النص القرآني.",
    supervisor: "أ.د. مساعد الطيار",
    pages: 260,
  },
  {
    id: "m7",
    title: "القواعد الفقهية في أحكام الطوارئ والأوبئة",
    author: "محمد عبدالرحمن الزهراني",
    degree: "ماجستير",
    university: "جامعة أم القرى",
    year: 2021,
    specialization: "الفقه وأصوله",
    abstract: "استنباط وتأصيل القواعد الفقهية المتعلقة بأحكام الطوارئ والأوبئة مستفيداً من الفقه الإسلامي التراثي مع تنزيلها على نوازل جائحة كورونا.",
    supervisor: "أ.د. سعد الشثري",
    pages: 310,
  },
  {
    id: "m8",
    title: "حقوق ذوي الإعاقة في الفقه الإسلامي",
    author: "ريم بنت فيصل الدوسري",
    degree: "ماجستير",
    university: "جامعة الكويت",
    year: 2022,
    specialization: "الفقه المقارن",
    abstract: "رصد وتأصيل فقهي لحقوق ذوي الإعاقة في التشريع الإسلامي من النفقة والكفالة والإدماج الاجتماعي، مع مقارنة بالمواثيق الدولية لحقوق الإنسان.",
    supervisor: "د. عبدالله الطريقي",
    pages: 220,
  },
  {
    id: "m9",
    title: "أسس منهج المحدثين في الحكم على الأسانيد المنقطعة",
    author: "عمر بن إبراهيم الأزهري",
    degree: "ماجستير",
    university: "الجامعة الإسلامية بالمدينة المنورة",
    year: 2019,
    specialization: "الحديث وعلومه",
    abstract: "دراسة استقرائية لمنهج كبار المحدثين في التعامل مع الأسانيد المنقطعة والمعلقة والمرسلة، مع بيان الفروق الدقيقة في تقييم هذه الأنواع.",
    supervisor: "أ.د. إبراهيم اللاحم",
    pages: 285,
  },
  {
    id: "m10",
    title: "الذكاء الاصطناعي وأحكامه الفقهية",
    author: "طارق سعد الغامدي",
    degree: "ماجستير",
    university: "جامعة الملك عبدالعزيز",
    year: 2024,
    specialization: "الفقه وأصوله",
    abstract: "استعراض فقهي معاصر لأبرز المسائل المتعلقة بالذكاء الاصطناعي: التوظيف في الفتوى، والمسؤولية القانونية، واستخدامه في تعليم القرآن والعلوم الشرعية.",
    supervisor: "أ.د. عبدالله المطلق",
    pages: 240,
  },
  {
    id: "m11",
    title: "منهج الغزالي في إحياء علوم الدين",
    author: "سارة بنت محمد الجلاجل",
    degree: "ماجستير",
    university: "جامعة الكويت",
    year: 2020,
    specialization: "العقيدة والكلام",
    abstract: "تحليل منهج الإمام الغزالي في الجمع بين علم الفقه وعلم السلوك في الإحياء، مع نقد مواطن الإشكال في كتابه من منظور أهل السنة والجماعة.",
    supervisor: "أ.د. ناصر العمر",
    pages: 270,
  },
  {
    id: "m12",
    title: "دور العلماء في الإصلاح السياسي في الدولة العثمانية",
    author: "حمود بن سليمان التميمي",
    degree: "ماجستير",
    university: "جامعة القصيم",
    year: 2018,
    specialization: "السيرة والتاريخ الإسلامي",
    abstract: "دراسة تاريخية في دور العلماء والمفتين في إصلاح الشؤون السياسية والاجتماعية في الدولة العثمانية خلال القرنين الثامن عشر والتاسع عشر.",
    supervisor: "أ.د. صالح السلوم",
    pages: 320,
  },
];

const SPECIALIZATIONS = [...new Set(THESES.map(t => t.specialization))].sort();

const TABS: { id: Tab; label: string; Icon: LucideIcon; desc: string }[] = [
  { id: "theses",       label: "الرسائل العلمية",   Icon: GraduationCap, desc: "رسائل الماجستير والدكتوراه في الشريعة" },
  { id: "institutions", label: "أبحاث المؤسسات",   Icon: Landmark,      desc: "أبحاث المراكز والجامعات الإسلامية" },
  { id: "personal",    label: "الأبحاث الشخصية",  Icon: PenLine,       desc: "أبحاث الأعضاء والباحثين" },
];

const INSTITUTION_CATEGORIES: { Icon: LucideIcon; label: string }[] = [
  { Icon: GraduationCap, label: "الجامعات الإسلامية" },
  { Icon: Building2,     label: "المراكز البحثية" },
  { Icon: Globe,         label: "المنظمات الدولية" },
  { Icon: Library,       label: "مجامع الفقه" },
  { Icon: Landmark,      label: "دور الإفتاء" },
  { Icon: Briefcase,     label: "الهيئات الشرعية" },
];

// ── مكوّن بطاقة الرسالة ──────────────────────────────────────────────────────

function ThesisCard({ thesis }: { thesis: Thesis }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="ar-thesis-card">
      <div className="ar-thesis-card__head">
        <span className={`ar-thesis-badge ar-thesis-badge--${thesis.degree === "دكتوراه" ? "phd" : "msc"}`}>
          {thesis.degree === "دكتوراه" ? "دكتوراه" : "ماجستير"}
        </span>
        <span className="ar-thesis-badge ar-thesis-badge--spec">{thesis.specialization}</span>
      </div>

      <h3 className="ar-thesis-card__title">{thesis.title}</h3>

      <div className="ar-thesis-card__meta">
        <span className="ar-thesis-card__author">{thesis.author}</span>
        <span className="ar-thesis-card__sep">·</span>
        <span className="ar-thesis-card__uni">{thesis.university}</span>
        <span className="ar-thesis-card__sep">·</span>
        <span className="ar-thesis-card__year">{thesis.year}م</span>
        {thesis.pages && (
          <>
            <span className="ar-thesis-card__sep">·</span>
            <span className="ar-thesis-card__pages">{thesis.pages} صفحة</span>
          </>
        )}
      </div>

      {thesis.supervisor && (
        <p className="ar-thesis-card__supervisor">المشرف: {thesis.supervisor}</p>
      )}

      <p className={`ar-thesis-card__abstract${expanded ? "" : " ar-thesis-card__abstract--collapsed"}`}>
        {thesis.abstract}
      </p>

      <div className="ar-thesis-card__footer">
        <button
          type="button"
          className="ar-thesis-card__expand-btn"
          onClick={() => setExpanded(p => !p)}
        >
          {expanded ? "إخفاء الملخص" : "قراءة الملخص"}
        </button>
        {thesis.link && (
          <a href={thesis.link} target="_blank" rel="noopener noreferrer" className="ar-thesis-card__link">
            <ExternalLink size={13} strokeWidth={2} />
            عرض الرسالة
          </a>
        )}
      </div>
    </div>
  );
}

// ── تبويب الرسائل ─────────────────────────────────────────────────────────────

function ThesesTab() {
  const [search, setSearch] = useState("");
  const [degreeFilter, setDegreeFilter] = useState<DegreeType | "الكل">("الكل");
  const [specFilter, setSpecFilter] = useState<string>("الكل");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return THESES.filter(t => {
      if (degreeFilter !== "الكل" && t.degree !== degreeFilter) return false;
      if (specFilter !== "الكل" && t.specialization !== specFilter) return false;
      if (!q) return true;
      return (
        t.title.includes(q) ||
        t.author.includes(q) ||
        t.university.includes(q) ||
        t.abstract.includes(q) ||
        t.specialization.includes(q)
      );
    });
  }, [search, degreeFilter, specFilter]);

  return (
    <div className="ar-tab-body">
      {/* بحث */}
      <div className="ar-search-bar">
        <Search className="ar-search-bar__icon" size={16} strokeWidth={2} aria-hidden="true" />
        <input
          className="ar-search-bar__input"
          placeholder="ابحث في رسائل الماجستير والدكتوراه…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="بحث في الرسائل العلمية"
        />
      </div>

      {/* فلاتر */}
      <div className="ar-filters">
        <div className="ar-filter-group">
          <span className="ar-filter-group__label">الدرجة:</span>
          {(["الكل", "ماجستير", "دكتوراه"] as const).map(d => (
            <button
              key={d}
              type="button"
              className={`ar-filter-chip${degreeFilter === d ? " ar-filter-chip--active" : ""}`}
              onClick={() => setDegreeFilter(d)}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="ar-filter-group">
          <span className="ar-filter-group__label">التخصص:</span>
          <select
            className="ar-filter-select"
            value={specFilter}
            onChange={e => setSpecFilter(e.target.value)}
            aria-label="تصفية حسب التخصص"
          >
            <option value="الكل">جميع التخصصات</option>
            {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* إحصاء */}
      <p className="ar-results-count">
        {filtered.length === THESES.length
          ? `${THESES.length} رسالة علمية`
          : `${filtered.length} من ${THESES.length} رسالة`}
      </p>

      {/* قائمة الرسائل */}
      {filtered.length > 0 ? (
        <div className="ar-thesis-list">
          {filtered.map(t => <ThesisCard key={t.id} thesis={t} />)}
        </div>
      ) : (
        <div className="ar-empty">
          <div className="ar-empty__icon"><GraduationCap size={44} strokeWidth={1.3} /></div>
          <p className="ar-empty__title">لا توجد نتائج</p>
          <p className="ar-empty__sub">حاول تغيير كلمة البحث أو إزالة الفلاتر</p>
        </div>
      )}

      {/* دعوة للمساهمة */}
      <div className="ar-contribute-banner">
        <GraduationCap size={22} strokeWidth={1.5} className="ar-contribute-banner__icon" />
        <div>
          <p className="ar-contribute-banner__title">هل لديك رسالة علمية؟</p>
          <p className="ar-contribute-banner__sub">شارك رسالتك مع مجتمع الباحثين في العلوم الإسلامية</p>
        </div>
        <Link href="/submit-content" className="ar-contribute-banner__btn">إضافة رسالة</Link>
      </div>
    </div>
  );
}

// ── تبويب أبحاث المؤسسات ─────────────────────────────────────────────────────

function InstitutionsTab() {
  const [search, setSearch] = useState("");
  return (
    <div className="ar-tab-body">
      <div className="ar-search-bar">
        <Search className="ar-search-bar__icon" size={16} strokeWidth={2} aria-hidden="true" />
        <input
          className="ar-search-bar__input"
          placeholder="ابحث في أبحاث المؤسسات والجامعات…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="بحث في أبحاث المؤسسات"
        />
      </div>

      <div className="ar-cats">
        <p className="ar-cats__label">تصفّح حسب المؤسسة</p>
        <div className="ar-cats__grid">
          {INSTITUTION_CATEGORIES.map(c => {
            const I = c.Icon;
            return (
              <button key={c.label} className="ar-cat-item" type="button">
                <span className="ar-cat-item__icon" aria-hidden="true"><I size={16} strokeWidth={1.6} /></span>
                <span className="ar-cat-item__label">{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="ar-empty">
        <div className="ar-empty__icon"><Landmark size={44} strokeWidth={1.3} /></div>
        <p className="ar-empty__title">لا توجد أبحاث مؤسسية بعد</p>
        <p className="ar-empty__sub">نعمل على تجميع أبحاث المراكز والجامعات الإسلامية</p>
        <Link href="/submit-content" className="ar-empty__btn">إرسال بحث</Link>
      </div>
    </div>
  );
}

// ── تبويب الأبحاث الشخصية ──────────────────────────────────────────────────────

function PersonalTab() {
  return (
    <div className="ar-tab-body">
      <div className="ar-submit-prompt">
        <div className="ar-submit-prompt__icon"><PenLine size={40} strokeWidth={1.3} /></div>
        <div className="ar-submit-prompt__body">
          <p className="ar-submit-prompt__title">شارك بحثك مع المجتمع العلمي</p>
          <p className="ar-submit-prompt__sub">يمكنك نشر أبحاثك ودراساتك وتلخيصاتك لتستفيد منها المجتمع المسلم حول العالم.</p>
          <Link href="/submit-content" className="ar-submit-prompt__btn">إضافة بحث</Link>
        </div>
      </div>
      <div className="ar-empty">
        <div className="ar-empty__icon"><PenLine size={44} strokeWidth={1.3} /></div>
        <p className="ar-empty__title">لا توجد أبحاث شخصية بعد</p>
        <p className="ar-empty__sub">شارك بحثك وأضفه لأرشيف المجلس العلمي</p>
      </div>
    </div>
  );
}

// ── الصفحة الرئيسية ───────────────────────────────────────────────────────────

export default function AcademicResearchPage() {
  const [activeTab, setActiveTab] = useState<Tab>("theses");

  useEffect(() => {
    applyPageSeo({
      path: "/academic-research",
      title: "الأبحاث العلمية الإسلامية | المجلس العلمي",
      description: "مستودع شامل للرسائل الجامعية وأبحاث المؤسسات والباحثين في العلوم الإسلامية، ماجستير ودكتوراه وبحوث متخصصة.",
      keywords: ["أبحاث إسلامية", "رسائل جامعية", "رسائل ماجستير", "رسائل دكتوراه", "بحوث شرعية"],
    });
  }, []);

  const phd = THESES.filter(t => t.degree === "دكتوراه").length;
  const msc = THESES.filter(t => t.degree === "ماجستير").length;

  return (
    <div className="ar-page" dir="rtl">
      {/* رأس */}
      <div className="ar-hero">
        <div className="ar-hero__inner">
          <p className="ar-hero__eyebrow">المجلس العلمي</p>
          <h1 className="ar-hero__title">الأبحاث العلمية</h1>
          <p className="ar-hero__sub">
            مستودع للرسائل الجامعية وأبحاث المراكز والجامعات والباحثين في العلوم الإسلامية
          </p>
        </div>
      </div>

      {/* إحصاءات */}
      <div className="ar-stats">
        <div className="ar-stat">
          <span className="ar-stat__n">{THESES.length}+</span>
          <span className="ar-stat__lbl">رسالة علمية</span>
        </div>
        <div className="ar-stat">
          <span className="ar-stat__n">{phd}</span>
          <span className="ar-stat__lbl">رسالة دكتوراه</span>
        </div>
        <div className="ar-stat">
          <span className="ar-stat__n">{msc}</span>
          <span className="ar-stat__lbl">رسالة ماجستير</span>
        </div>
        <div className="ar-stat">
          <span className="ar-stat__n">{SPECIALIZATIONS.length}</span>
          <span className="ar-stat__lbl">تخصص</span>
        </div>
      </div>

      {/* تبويبات */}
      <div className="ar-tabs-bar">
        {TABS.map(t => {
          const I = t.Icon;
          return (
            <button
              key={t.id}
              type="button"
              className={`ar-tab-btn${activeTab === t.id ? " ar-tab-btn--active" : ""}`}
              onClick={() => setActiveTab(t.id)}
              aria-pressed={activeTab === t.id}
            >
              <span className="ar-tab-btn__icon" aria-hidden="true"><I size={16} strokeWidth={1.6} /></span>
              <span className="ar-tab-btn__label">{t.label}</span>
              <span className="ar-tab-btn__sub">{t.desc}</span>
            </button>
          );
        })}
      </div>

      {/* محتوى */}
      <div className="ar-content">
        {activeTab === "theses"       && <ThesesTab />}
        {activeTab === "institutions" && <InstitutionsTab />}
        {activeTab === "personal"     && <PersonalTab />}
      </div>

      {/* رابط الباحث الشرعي */}
      <div className="ar-footer-link">
        <Link href="/scholarly-research" className="ar-footer-link__btn">
          <Search size={16} strokeWidth={2} aria-hidden="true" />
          البحث بالذكاء الاصطناعي في المصادر الشرعية
        </Link>
      </div>

      <div className="twh-share">
        <ShareButtons title="البحث الأكاديمي الإسلامي — المجلس العلمي" url="https://majlisilm.com/academic-research" />
      </div>
    </div>
  );
}
