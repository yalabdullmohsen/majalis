import { useEffect, useState } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import {
  SINS_TOPICS,
  SINS_CATEGORIES,
  RIGHTS_CATEGORY_LABELS,
  SIN_SEVERITY_LABELS,
  SIN_TYPE_LABELS,
  WHAT_IF_QA,
} from "@/lib/sins-rights-data";
import type { RightsCategory, SinType } from "@/lib/sins-rights-types";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";

type Tab = "overview" | "allah" | "ibad" | "shared" | "guide" | "what-if" | "muhasaba" | "mindmap";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview",  label: "نظرة عامة" },
  { key: "allah",     label: "حق الله" },
  { key: "ibad",      label: "حق العباد" },
  { key: "shared",    label: "حقوق مشتركة" },
  { key: "guide",     label: "دليل التوبة" },
  { key: "what-if",   label: "ماذا أفعل إذا؟" },
  { key: "muhasaba",  label: "محاسبة النفس" },
  { key: "mindmap",   label: "الخريطة المعرفية" },
];

const GUIDE_OPTIONS: { value: string; label: string; steps: string[]; notes?: string[]; needsScholar?: boolean }[] = [
  {
    value: "allah-worship",
    label: "ذنب في حق الله — عبادة",
    steps: [
      "الإقلاع الفوري عن الذنب",
      "الندم الصادق على ما فات",
      "العزم الجازم على عدم العودة",
      "تدارك ما يمكن تداركه من الواجبات (كالصلاة الفائتة والصيام)",
      "الإكثار من الاستغفار والتوبة والأعمال الصالحة",
    ],
    notes: ["التوبة مقبولة في أي وقت ما دام الإنسان حياً قبل الغرغرة.", "بعض المسائل كقضاء الصلوات لها تفصيل فقهي ينبغي سؤال أهل العلم فيه."],
  },
  {
    value: "allah-haram",
    label: "ذنب في حق الله — محرم",
    steps: [
      "الإقلاع التام عن المحرم",
      "الندم الصادق والتألم من الوقوع في المعصية",
      "العزم الصادق على عدم العودة",
      "أداء الكفارة إن كانت منصوصاً عليها",
      "الإكثار من الاستغفار والأعمال الصالحة",
    ],
    notes: ["الله غفور رحيم يقبل توبة عباده متى تابوا صادقين."],
  },
  {
    value: "mali",
    label: "حق مالي لإنسان",
    steps: [
      "الإقلاع فوراً عن أي استمرار في أخذ المال",
      "الندم الصادق",
      "رد المال كاملاً إلى صاحبه أو ورثته",
      "طلب العفو والمسامحة من صاحب الحق",
      "إن تعذر الوصول: التصدق بالمبلغ بنية أنه عن صاحبه",
    ],
    notes: ["رد المال واجب شرعي لا تكتمل التوبة بدونه ما أمكن الوصول لصاحبه."],
    needsScholar: true,
  },
  {
    value: "ird",
    label: "غيبة أو نميمة",
    steps: [
      "الإقلاع فوراً عن الغيبة والنميمة",
      "الندم الصادق",
      "الاستغفار لمن اغتيب",
      "ذكر المغتاب بالخير حيث اغتيب",
      "الاستحلال منه إن أمن المفسدة",
    ],
    notes: ["إن كان في الإخبار مفسدة من عداوة أو أذى فلا يُخبر، ويكتفي بالاستغفار وذكره بالخير."],
  },
  {
    value: "qadhf",
    label: "قذف أو تشهير",
    steps: [
      "الرجوع فوراً والتراجع عن الاتهام الكاذب",
      "الإعلان بكذب ما قيل إن أمكن",
      "الاعتذار لصاحب الحق وطلب مسامحته",
      "الإكثار من الاستغفار والتوبة",
    ],
    notes: ["حد القذف حق آدمي لا يسقط بالتوبة إلا بعفو المقذوف."],
    needsScholar: true,
  },
  {
    value: "dain",
    label: "دَيْن مستحق",
    steps: [
      "السعي في سداد الدين بأقرب وقت ممكن",
      "التواصل مع الدائن وإخباره بوضعك إن كنت معسراً",
      "عدم الإنفاق في غير الضروريات قبل سداد الدين",
      "طلب الإبراء من الدائن إن كنت عاجزاً",
    ],
    notes: ["نفس المؤمن معلقة بدينه حتى يُقضى عنه."],
  },
  {
    value: "bodily",
    label: "ظلم أو اعتداء بدني",
    steps: [
      "الكف عن الاعتداء فوراً",
      "الاعتذار وطلب العفو من المظلوم",
      "تعويضه عن الضرر إن كان مادياً",
      "الإكثار من الاستغفار والتوبة",
    ],
    notes: ["مسائل الجروح والقصاص والديات تحتاج إلى مرجع شرعي وقانوني مختص."],
    needsScholar: true,
  },
  {
    value: "unknown",
    label: "لا أعرف تصنيفه",
    steps: [
      "تب إلى الله توبة شاملة من جميع ذنوبك",
      "حاول تحديد نوع الحق: هل أضررت بأحد مالياً أو معنوياً؟",
      "إن كان ثمة حق لآدمي فاسعَ في رده",
      "اسأل عالماً موثوقاً إن تعذر عليك التحديد",
    ],
    needsScholar: true,
  },
];

const MINDMAP_NODES = [
  {
    id: "allah",
    label: "حق الله تعالى",
    icon: "🕌",
    children: [
      { label: "ترك الصلاة", slug: "tark-salah" },
      { label: "الرياء", slug: "riyaa" },
      { label: "الكبر", slug: "kibr" },
      { label: "الحسد", slug: "hasad" },
      { label: "ترك الصيام الواجب", slug: null },
      { label: "شرب الخمر", slug: null },
      { label: "النظر المحرم", slug: null },
    ],
  },
  {
    id: "ibad-mali",
    label: "حق العباد — الأموال",
    icon: "💰",
    children: [
      { label: "السرقة", slug: "sariqa" },
      { label: "الغصب", slug: "ghasb" },
      { label: "الديون", slug: "dain" },
      { label: "الغش والاحتيال", slug: null },
      { label: "تأخير حقوق العمال", slug: null },
    ],
  },
  {
    id: "ibad-ird",
    label: "حق العباد — العرض",
    icon: "🛡️",
    children: [
      { label: "الغيبة", slug: "ghibah" },
      { label: "النميمة", slug: "namima" },
      { label: "القذف", slug: "qadhf" },
      { label: "الكذب", slug: "kadhib" },
      { label: "التشهير والسخرية", slug: null },
    ],
  },
  {
    id: "ibad-social",
    label: "حق العباد — الاجتماعي",
    icon: "🤝",
    children: [
      { label: "عقوق الوالدين", slug: "uquq-walidayn" },
      { label: "قطع الرحم", slug: "qat-rahim" },
      { label: "خيانة الأمانة", slug: "khiyana-amana" },
      { label: "شهادة الزور", slug: "shahada-zur" },
      { label: "ظلم الجار", slug: null },
    ],
  },
  {
    id: "digital",
    label: "الحقوق الرقمية المعاصرة",
    icon: "💻",
    children: [
      { label: "سرقة المحتوى", slug: "sariqa-muhtawa" },
      { label: "نشر الصور دون إذن", slug: "nashr-suwar-bidun-idhn" },
      { label: "التنمر الإلكتروني", slug: null },
      { label: "انتحال الشخصية", slug: null },
    ],
  },
];

const MUHASABA_CATS = [
  "حقوق الله — الصلاة والعبادات",
  "الأموال والديون",
  "الأمانات",
  "اللسان والكلام",
  "الوالدان",
  "الزوج أو الزوجة",
  "الأبناء",
  "الأقارب والرحم",
  "الجيران",
  "العمل والزملاء",
  "المال العام",
  "الحقوق الرقمية",
];

type MuhasabaStatus = "not_started" | "in_progress" | "done";

function rightsCategoryBadge(cat: RightsCategory) {
  return <span className={`snr-badge snr-badge--${cat}`}>{RIGHTS_CATEGORY_LABELS[cat]}</span>;
}

function sinSeverityBadge(sev: string) {
  const key = sev as keyof typeof SIN_SEVERITY_LABELS;
  const cls = sev === "kabira" ? "kabira" : sev === "saghira" ? "saghira" : "depends";
  return <span className={`snr-badge snr-badge--${cls}`}>{SIN_SEVERITY_LABELS[key]}</span>;
}


function TopicsGrid({ category }: { category: RightsCategory }) {
  const topics = SINS_TOPICS.filter((t) => t.rightsCategory === category);
  if (!topics.length) return <div className="snr-empty">لا توجد موضوعات في هذا التصنيف حالياً.</div>;
  return (
    <div className="snr-topics-grid">
      {topics.map((topic) => (
        <Link key={topic.id} href={`/sins-and-rights/${topic.slug}`} className="snr-topic-card">
          <div className="snr-topic-card-header">
            <span className="snr-topic-title">{topic.title}</span>
            {topic.reviewStatus === "pending" && (
              <span className="snr-badge snr-badge--pending" title="قيد المراجعة الشرعية">⏳</span>
            )}
          </div>
          <p className="snr-topic-desc">{topic.shortDescription}</p>
          <div className="snr-topic-badges">
            {rightsCategoryBadge(topic.rightsCategory)}
            {sinSeverityBadge(topic.sinSeverity)}
            {topic.repentanceConditions.requiresRestitution && (
              <span className="snr-badge snr-badge--restitution" title="يستلزم رد حق">يستلزم رد حق</span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

function RepentanceGuide() {
  const [selected, setSelected] = useState<string | null>(null);
  const result = selected ? GUIDE_OPTIONS.find((o) => o.value === selected) : null;

  return (
    <div className="snr-guide">
      <div className="snr-guide-title">دليل التوبة ورد الحقوق</div>
      <div className="snr-guide-subtitle">
        اختر نوع الحالة للاطلاع على مسار التوبة العام — هذا دليل تعليمي وليس فتوى شخصية
      </div>
      <div className="snr-guide-options">
        {GUIDE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`snr-guide-option${selected === opt.value ? " snr-guide-option--selected" : ""}`}
            onClick={() => setSelected(selected === opt.value ? null : opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {result && (
        <div className="snr-guide-result">
          <div className="snr-guide-result-title">مسار التوبة: {result.label}</div>
          {result.steps.map((step, i) => (
            <div key={i} className="snr-guide-step">
              <div className="snr-guide-step-num">{i + 1}</div>
              <div className="snr-guide-step-text">{step}</div>
            </div>
          ))}
          {result.notes?.map((note, i) => (
            <div key={i} className="snr-guide-note">💡 {note}</div>
          ))}
          {result.needsScholar && (
            <div className="snr-guide-scholar-note">
              <span>⚠️</span>
              <span>هذه المسألة قد تحتاج إلى تفصيل شرعي من عالم موثوق — يُنصح بسؤال أهل العلم.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WhatIfSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="snr-faq">
      <div className="snr-faq-title">ماذا أفعل إذا؟</div>
      {WHAT_IF_QA.map((item, idx) => (
        <div key={idx} className="snr-faq-item">
          <button
            type="button"
            className="snr-faq-q"
            onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
            aria-expanded={openIdx === idx}
          >
            <span>{item.q}</span>
            <span className={`snr-faq-chevron${openIdx === idx ? " snr-faq-chevron--open" : ""}`}>▼</span>
          </button>
          {openIdx === idx && <div className="snr-faq-a">{item.a}</div>}
        </div>
      ))}
    </div>
  );
}

function MuhasabaSection() {
  const [statuses, setStatuses] = useState<Record<string, MuhasabaStatus>>({});

  const setStatus = (cat: string, status: MuhasabaStatus) => {
    setStatuses((prev) => ({ ...prev, [cat]: prev[cat] === status ? "not_started" : status }));
  };

  const statusLabels: Record<MuhasabaStatus, string> = {
    not_started: "لم أبدأ",
    in_progress: "جارٍ",
    done: "تم",
  };

  return (
    <div className="snr-muhasaba">
      <div className="snr-muhasaba-title">محاسبة النفس</div>
      <div className="snr-muhasaba-notice">
        هذه الأداة خاصة بك ومحلية — لا تُرسَل لأي جهة. لا تكتب أسماء أشخاص أو تفاصيل حساسة.
        استخدمها لمراجعة الفئات العامة من حقوق الله وحقوق الناس.
      </div>
      <div className="snr-muhasaba-categories">
        {MUHASABA_CATS.map((cat) => {
          const status = statuses[cat] ?? "not_started";
          return (
            <div key={cat} className="snr-muhasaba-cat">
              <div className="snr-muhasaba-cat-title">{cat}</div>
              <div className="snr-muhasaba-status-row">
                {(["in_progress", "done"] as MuhasabaStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`snr-muhasaba-status-btn snr-muhasaba-status-btn--${s.replace("_", "-")}${status === s ? " snr-muhasaba-status-btn--active" : ""}`}
                    onClick={() => setStatus(cat, s)}
                    aria-pressed={status === s}
                  >
                    {statusLabels[s]}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className="snr-muhasaba-btn"
        onClick={() => setStatuses({})}
      >
        إعادة ضبط
      </button>
    </div>
  );
}

function MindMap() {
  const [openNodes, setOpenNodes] = useState<Record<string, boolean>>({});

  const toggle = (id: string) =>
    setOpenNodes((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="snr-mindmap">
      <div className="snr-mindmap-title">الخريطة المعرفية للذنوب والحقوق</div>
      <div className="snr-mindmap-root">
        {MINDMAP_NODES.map((node) => (
          <div key={node.id} className="snr-mindmap-node">
            <div
              className="snr-mindmap-node-header"
              onClick={() => toggle(node.id)}
              role="button"
              aria-expanded={!!openNodes[node.id]}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && toggle(node.id)}
            >
              <span className={`snr-mindmap-toggle${openNodes[node.id] ? " snr-mindmap-toggle--open" : ""}`}>▶</span>
              <span className="snr-mindmap-node-icon">{node.icon}</span>
              <span className="snr-mindmap-node-label">{node.label}</span>
              <span className="snr-mindmap-node-count">{node.children.length}</span>
            </div>
            {openNodes[node.id] && (
              <div className="snr-mindmap-children">
                {node.children.map((child) =>
                  child.slug ? (
                    <Link
                      key={child.slug}
                      href={`/sins-and-rights/${child.slug}`}
                      className="snr-mindmap-child-link"
                    >
                      <span>{child.label}</span>
                      <span className="snr-mindmap-child-arrow">←</span>
                    </Link>
                  ) : (
                    <div
                      key={child.label}
                      className="snr-mindmap-child-link"
                      style={{ opacity: 0.6, cursor: "default" }}
                      title="قيد الإعداد والمراجعة"
                    >
                      <span>{child.label}</span>
                      <span className="snr-badge snr-badge--pending" style={{ fontSize: "0.65rem" }}>قريباً</span>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SinsAndRightsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useEffect(() => {
    applyPageSeo({
      path: "/sins-and-rights",
      title: "الذنوب والحقوق | المجلس العلمي",
      description: "منظومة معرفية شرعية مترابطة تشرح أنواع الذنوب والتمييز بين حقوق الله وحقوق العباد وشروط التوبة الصحيحة لكل نوع، مع الأدلة من القرآن والسنة.",
      keywords: ["الذنوب والحقوق", "التوبة الصحيحة", "رد المظالم", "حقوق العباد", "حقوق الله", "الكبائر والصغائر", "المجلس العلمي"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "الذنوب والحقوق — منظومة معرفية شرعية",
          description: "شرح أنواع الذنوب والتمييز بين حقوق الله وحقوق العباد وشروط التوبة الصحيحة.",
          url: "https://majlisilm.com/sins-and-rights",
          inLanguage: "ar",
          publisher: { "@type": "Organization", name: "المجلس العلمي", url: "https://majlisilm.com" },
        },
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "الذنوب والحقوق", path: "/sins-and-rights" },
        ]),
      ],
    });
  }, []);

  return (
    <div className="snr-page">
      {/* Hero */}
      <div className="snr-hero">
        <div className="snr-hero-eyebrow">المجلس العلمي</div>
        <h1 className="snr-hero-title">الذنوب والحقوق</h1>
        <p className="snr-hero-desc">
          منظومة معرفية شرعية مترابطة تساعدك على فهم أنواع الذنوب، والتمييز بين الحقوق،
          ومعرفة طريق التوبة الصحيح لكل نوع — بمنهج أهل السنة والجماعة والاعتماد على القرآن والسنة الصحيحة.
        </p>
      </div>

      {/* تنبيه المحتوى */}
      <div className="snr-content-notice">
        <span className="snr-content-notice-icon">ℹ️</span>
        <span>
          المحتوى الشرعي مستند إلى القرآن الكريم والسنة النبوية الصحيحة وأقوال أهل العلم المعتبرين.
          المحتوى المُشار إليه بـ «قيد المراجعة» لم يُعتمَد بعد. لا يُغني هذا القسم عن سؤال العلماء في المسائل الفردية المعقدة.
        </span>
      </div>

      {/* التبويبات */}
      <nav className="snr-tabs" aria-label="أقسام الذنوب والحقوق">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`snr-tab${activeTab === tab.key ? " snr-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
            aria-selected={activeTab === tab.key}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* المحتوى */}
      {activeTab === "overview" && (
        <div>
          <div className="snr-categories-grid">
            {SINS_CATEGORIES.map((cat) => {
              const topics = SINS_TOPICS.filter((t) => t.rightsCategory === cat.rightsCategory);
              return (
                <div key={cat.id} className="snr-category-card">
                  <div className="snr-category-card-header">
                    <div className={`snr-category-icon snr-category-icon--${cat.rightsCategory}`}>
                      {cat.icon}
                    </div>
                    <div>
                      <div className="snr-category-title">{cat.title}</div>
                      <div className="snr-category-subtitle">{cat.subtitle}</div>
                    </div>
                  </div>
                  <p className="snr-category-desc">{cat.description}</p>
                  <div className="snr-category-topics">
                    {topics.map((t) => (
                      <Link key={t.slug} href={`/sins-and-rights/${t.slug}`} className="snr-topic-chip">
                        {t.title}
                      </Link>
                    ))}
                    {cat.topicSlugs.length > topics.length && (
                      <span className="snr-topic-chip" style={{ opacity: 0.6 }}>
                        + قيد الإعداد
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* إحصائيات سريعة */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
            {[
              { label: "موضوعاً موثقاً", value: SINS_TOPICS.filter((t) => t.reviewStatus === "reviewed").length },
              { label: "قيد المراجعة", value: SINS_TOPICS.filter((t) => t.reviewStatus === "pending").length },
              { label: "أسئلة عملية", value: WHAT_IF_QA.length },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  flex: "1 1 140px",
                  background: "rgba(24,54,42,0.05)",
                  borderRadius: "var(--elite-r-md, 12px)",
                  padding: "1rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--elite-green, #18362A)" }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--elite-ink-soft, #5D726A)" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* روابط سريعة للأقسام الأخرى */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <Link href="/tawba" className="snr-related-link" style={{ flex: "1 1 160px" }}>
              <span className="snr-related-link-label">📖 التوبة والاستغفار</span>
              <span className="snr-mindmap-child-arrow">←</span>
            </Link>
            <Link href="/fiqh" className="snr-related-link" style={{ flex: "1 1 160px" }}>
              <span className="snr-related-link-label">⚖️ الأحكام الشرعية</span>
              <span className="snr-mindmap-child-arrow">←</span>
            </Link>
            <Link href="/akhlaq" className="snr-related-link" style={{ flex: "1 1 160px" }}>
              <span className="snr-related-link-label">🌿 الأخلاق الإسلامية</span>
              <span className="snr-mindmap-child-arrow">←</span>
            </Link>
          </div>
        </div>
      )}

      {activeTab === "allah" && <TopicsGrid category="allah" />}
      {activeTab === "ibad"  && <TopicsGrid category="ibad" />}
      {activeTab === "shared" && <TopicsGrid category="shared" />}
      {activeTab === "guide" && <RepentanceGuide />}
      {activeTab === "what-if" && <WhatIfSection />}
      {activeTab === "muhasaba" && <MuhasabaSection />}
      {activeTab === "mindmap" && <MindMap />}
    </div>
  );
}
