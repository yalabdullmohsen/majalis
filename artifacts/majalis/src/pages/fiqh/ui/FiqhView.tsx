import { useEffect, useState } from "react";
import { Building2, FlaskConical, GraduationCap, Landmark, Moon, Scale } from "lucide-react";
import { SectionIcon } from "@/components/ui/SectionIcon";
import type { LucideIcon } from "lucide-react";
import { Link, useSearch } from "wouter";
import { usePageView } from "@/hooks/usePageView";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { PageHero, HubCard } from "@/components/ui-common";
import { loadSeedQa } from "@/lib/qa-seed";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";
import "@/styles/pages/fiqh-hub.css";

type Tab = "qawaid" | "madhahib" | "nawazil" | "council" | "ibadat";

const TABS: { key: Tab; label: string; Icon: LucideIcon }[] = [
  { key: "qawaid", label: "القواعد الفقهية", Icon: Scale },
  { key: "madhahib", label: "المذاهب الأربعة", Icon: GraduationCap },
  { key: "nawazil", label: "النوازل المعاصرة", Icon: FlaskConical },
  { key: "council", label: "قرارات المجامع", Icon: Building2 },
  { key: "ibadat", label: "العبادات", Icon: Moon },
];

const IBADAT_IDS = new Set(["tahara", "salah", "zakat", "sawm", "hajj"]);

const COUNCIL_SECTIONS = [
  { href: "/fiqh-council",             label: "رئيسية المجمع",     desc: "بوابة المجمع الفقهي: قرارات معتمدة وفتاوى موثّقة وتوثيق جلساته وأبحاثه، مع فهرس موضوعي يسهّل الرجوع إلى المسائل المدروسة." },
  { href: "/fiqh-council/issues",      label: "المسائل الفقهية",   desc: "المسائل الفقهية التي ناقشها المجمع أو أُحيلت إليه: عرضٌ للسؤال والخلاف والأدلة قبل صدور القرار النهائي." },
  { href: "/fiqh-council/resolutions", label: "القرارات",          desc: "قرارات هيئات الإفتاء والمجامع الفقهية المعتمدة، مرتّبة بحسب الموضوع مع ذكر المجلس والتاريخ والحكم المختار." },
  { href: "/fiqh-council/fatwas",      label: "فتاوى المجمع",      desc: "فتاوى المجمع الفقهي موثّقة بأسانيدها ومراجعها، مع بيان المذهب أو القول الراجح والأدلة المعتمدة عليه." },
  { href: "/fiqh-council/live",        label: "البيانات الحية",    desc: "البيانات الحية لآخر جلسات المجمع ونشاطاته: جدول الاجتماعات والمسائل المدرجة والبيانات الصادرة عنها." },
  { href: "/fiqh-council/index",       label: "الفهرس الموضوعي",  desc: "الفهرس الموضوعي للمجمع: تصفّح القرارات والفتاوى حسب أبواب الفقه من العبادات إلى المعاملات والنوازل." },
  { href: "/fiqh-council/nawazil",     label: "النوازل المعاصرة",  desc: "النوازل المعاصرة التي يعالجها المجمع: مسائل العصر من تقنية وطب واقتصاد، بضوابط شرعية معتمدة." },
  { href: "/fiqh-council/research",   label: "البحوث الفقهية",    desc: "البحوث الفقهية المعمّقة: دراسات تمهّد للقرار، تجمع الأدلة والخلاف والترجيح قبل إصدار الفتوى." },
  { href: "/fiqh-council/compare",    label: "المقارنة الفقهية",  desc: "أداة المقارنة الفقهية: قارن بين قرارات المجامع وفتاوى الهيئات في مسألة واحدة لمعرفة الخلاف والاتفاق." },
];

const NAWAZIL_LINKS = COUNCIL_SECTIONS.filter((s) =>
  ["/fiqh-council/nawazil", "/fiqh-council/issues", "/fiqh-council/compare"].includes(s.href),
);

// ─── أقسام الفقه والأحكام ────────────────────────────────────────────────────

import { FIQH_HUB_TOPICS } from "@/lib/fiqh-hub-topics";

const VALID_TABS = new Set<Tab>(TABS.map((t) => t.key));

export default function FiqhPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const tabParam = params.get("tab") as Tab | null;
  const initialTab: Tab = tabParam && VALID_TABS.has(tabParam) ? tabParam : "qawaid";

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  usePageView("fiqh", null);

  useEffect(() => {
    let cancelled = false;
    void loadSeedQa().then((seed) => {
      if (cancelled) return;
      const topQa = seed.filter((q) => q.answer).slice(0, 5);
      const faqSchema = topQa.length
        ? {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: topQa.map((q) => ({
              "@type": "Question",
              name: q.question,
              acceptedAnswer: { "@type": "Answer", text: q.answer },
            })),
          }
        : undefined;
      applyPageSeo({
        path: "/fiqh",
        title: "الفقه الإسلامي | المجلس العلمي",
        description: "بوابة الفقه: قواعد فقهية، مذاهب، نوازل، قرارات المجامع، وأحكام العبادات.",
        keywords: ["فقه إسلامي", "القواعد الفقهية", "المذاهب الأربعة", "المجمع الفقهي"],
        ...(faqSchema ? { jsonLd: [faqSchema] } : {}),
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);


  return (
    <div className="fqp-root page-shell" dir="rtl">
      <PageHero
        title="الفقه والأحكام"
        description="بوابة الفقه: قواعد فقهية، مذاهب، نوازل، قرارات المجامع، وأحكام العبادات."
      />

      {/* بطاقات المحاور — ظاهرة دائمًا (لا تعتمد على تبويب) لتباين/اكتشاف الواجهة */}
      <div className="hub-card-grid fqh-hub-grid fqh-hub-grid--overview">
        {FIQH_HUB_TOPICS.filter((t) =>
          ["tahara", "salah", "fiqh-qawaid", "madhahib", "fiqh-council"].includes(t.id),
        ).map((t) => (
          <HubCard
            key={t.id}
            href={t.href}
            title={t.title}
            description={t.desc}
            icon={<SectionIcon name={t.emoji} size={22} />}
          />
        ))}
      </div>

      {/* تبويبات الباب الرئيسي */}
      <div className="fqp-tabs-nav fqp-tabs-nav--bare">
        <div className="fqp-tabs-scroll" role="tablist" aria-label="أقسام الفقه">
          {TABS.map((t) => (
            <button
              key={t.key}
              id={`fqp-tab-${t.key}`}
              type="button"
              role="tab"
              onClick={() => setActiveTab(t.key)}
              className={`fqp-tab${activeTab === t.key ? "fqp-tab--active" : ""}`}
              aria-selected={activeTab === t.key}
              aria-controls={`fqp-panel-${t.key}`}
            >
              <t.Icon size={15} strokeWidth={1.8} aria-hidden="true" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="fqp-tab-content">

        {/* تبويب القواعد */}
        {activeTab === "qawaid" && (
          <div role="tabpanel" id="fqp-panel-qawaid" aria-labelledby="fqp-tab-qawaid">
            <h2 className="fqp-section-title mb-4"><Scale size={20} />القواعد الفقهية</h2>
            <div className="hub-card-grid fqh-hub-grid">
              {FIQH_HUB_TOPICS.filter((t) => t.id === "fiqh-qawaid").map((t) => (
                <HubCard key={t.id} href={t.href} title={t.title} description={t.desc} icon={<SectionIcon name={t.emoji} size={22} />} />
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link href="/fiqh-qawaid"><span className="inline-block px-8 py-3 text-white rounded-xl font-medium fqp-cta-btn">فتح القواعد الفقهية</span></Link>
            </div>
          </div>
        )}

        {activeTab === "madhahib" && (
          <div role="tabpanel" id="fqp-panel-madhahib" aria-labelledby="fqp-tab-madhahib">
            <h2 className="fqp-section-title mb-4"><GraduationCap size={20} />المذاهب الأربعة</h2>
            <div className="hub-card-grid fqh-hub-grid">
              {FIQH_HUB_TOPICS.filter((t) => t.id === "madhahib").map((t) => (
                <HubCard key={t.id} href={t.href} title={t.title} description={t.desc} icon={<SectionIcon name={t.emoji} size={22} />} />
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link href="/madhahib"><span className="inline-block px-8 py-3 text-white rounded-xl font-medium fqp-cta-btn">فتح المذاهب الأربعة</span></Link>
            </div>
          </div>
        )}

        {activeTab === "nawazil" && (
          <div role="tabpanel" id="fqp-panel-nawazil" aria-labelledby="fqp-tab-nawazil">
            <h2 className="fqp-section-title mb-4"><FlaskConical size={20} />النوازل المعاصرة</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {NAWAZIL_LINKS.map((s) => (
                <Link key={s.href} href={s.href}>
                  <div className="fqp-card fqp-card--hover-border flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="fqp-council-label">{s.label}</p>
                      <p className="fqp-council-desc">{s.desc}</p>
                    </div>
                    <span className="fqp-arrow">←</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {activeTab === "ibadat" && (
          <div role="tabpanel" id="fqp-panel-ibadat" aria-labelledby="fqp-tab-ibadat">
            <h2 className="fqp-section-title mb-4"><Moon size={20} />العبادات</h2>
            <p className="fqp-section-desc mb-4">طهارة، صلاة، زكاة، صيام، حج</p>
            <div className="hub-card-grid fqh-hub-grid">
              {FIQH_HUB_TOPICS.filter((t) => IBADAT_IDS.has(t.id)).map((t) => (
                <HubCard key={t.id} href={t.href} title={t.title} description={t.desc} icon={<SectionIcon name={t.emoji} size={22} />} />
              ))}
            </div>
          </div>
        )}

        {/* تبويب المجمع الفقهي */}
        {activeTab === "council" && (
          <div role="tabpanel" id="fqp-panel-council" aria-labelledby="fqp-tab-council">
            <div className="mb-6">
              <h2 className="fqp-section-title mb-2"><Landmark size={20} />قرارات المجامع</h2>
              <p className="fqp-section-desc">
                قرارات وبيانات وفتاوى المجامع الفقهية المعتمدة، موثقة بمصادرها
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {COUNCIL_SECTIONS.map((s) => (
                <Link key={s.href} href={s.href}>
                  <div className="fqp-card fqp-card--hover-border flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="fqp-council-label">{s.label}</p>
                      <p className="fqp-council-desc">{s.desc}</p>
                    </div>
                    <span className="fqp-arrow">←</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <Link href="/fiqh-council">
                <span className="inline-block px-8 py-3 text-white rounded-xl font-medium transition-colors cursor-pointer fqp-cta-btn">
                  دخول المجمع الفقهي
                </span>
              </Link>
            </div>
          </div>
        )}

      <RelatedKnowledge kind="fatwa" query="الفقه الإسلامي" title="معرفة ذات صلة بالفقه" limit={6} />
      <SectionQuiz
        categoryId="fiqh"
        title="اختبر معلوماتك في الفقه الإسلامي"
        count={4}
      />

      <div className="twh-share">
        <ShareButtons title="الفقه الإسلامي — المجلس العلمي" url="https://www.majlisilm.com/fiqh" />
      </div>

      </div>
    </div>
  );
}
