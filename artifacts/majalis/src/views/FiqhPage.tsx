import { useEffect, useState } from "react";
import { Banknote, BookOpen, Building2, Droplets, FileSignature, Flame, FlaskConical, GraduationCap, Handshake, Heart, Landmark, Library, MapPin, MessageCircle, Moon, Scale, ScrollText, Shield, Shirt, Users, Utensils } from "lucide-react";
import { SectionIcon } from "@/components/ui/SectionIcon";
import type { LucideIcon } from "lucide-react";
import { Link, useSearch } from "wouter";
import { usePageView } from "@/hooks/usePageView";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { getRulingsEncyclopedia } from "@/lib/rulings-service";
import { RULINGS_CATEGORY_TREE } from "@/lib/rulings-categories";
import { SkeletonCardGrid, Empty, ErrorState, PageHero } from "@/components/ui-common";
import { getQaQuestions } from "@/lib/supabase";
import { QA_CATEGORIES, loadSeedQa } from "@/lib/qa-seed";
import { RequestManager } from "@/lib/request-manager";
import type { ShariaRulingExtended } from "@/lib/rulings-types";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";
import "@/styles/pages/fiqh-hub.css";

type Tab = "rulings" | "qa" | "council";

const RULINGS_ICON_MAP: Record<string, LucideIcon> = {
  Landmark, Droplets, Banknote, Moon, MapPin, Handshake, Utensils, Shirt, Users,
  ScrollText, Scale, FileSignature, Shield, Heart, BookOpen, GraduationCap, FlaskConical, Flame,
};
function CatIcon({ name }: { name?: string }) {
  const I: LucideIcon = (name ? RULINGS_ICON_MAP[name] : undefined) ?? BookOpen;
  return <I size={20} />;
}

const TABS: { key: Tab; label: string; Icon: LucideIcon }[] = [
  { key: "rulings", label: "الأحكام الشرعية",  Icon: BookOpen },
  { key: "qa",      label: "الأسئلة والأجوبة", Icon: MessageCircle },
  { key: "council", label: "المجمع الفقهي",     Icon: Building2 },
];

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

const RULINGS_CATEGORIES = RULINGS_CATEGORY_TREE.slice(0, 8);

// ─── أقسام الفقه والأحكام ────────────────────────────────────────────────────

import { FIQH_HUB_TOPICS } from "@/lib/fiqh-hub-topics";

export default function FiqhPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialTab = (params.get("tab") as Tab) || "rulings";

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [rulings, setRulings]     = useState<ShariaRulingExtended[]>([]);
  const [qaItems, setQaItems]     = useState<any[]>([]);
  const [loadingR, setLoadingR]   = useState(false);
  const [loadingQ, setLoadingQ]   = useState(false);
  const [rulingsError, setRulingsError] = useState<string | null>(null);
  const [rulingsRetry, setRulingsRetry] = useState(0);

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
        title: "الفقه الإسلامي، أحكام وأسئلة | المجلس العلمي",
        description: "مرجع شامل في الفقه الإسلامي: أحكام شرعية موثقة، أسئلة وأجوبة، وقرارات المجمع الفقهي. يغطّي أبواب العبادات والمعاملات والنوازل مرجع موثّق لطالب العلم والباحث.",
        keywords: ["فقه إسلامي", "أحكام شرعية", "الفقه الحنفي", "القواعد الفقهية", "المجمع الفقهي", "أسئلة شرعية"],
        ...(faqSchema ? { jsonLd: [faqSchema] } : {}),
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "rulings") return;
    if (rulings.length > 0 && !rulingsError && rulingsRetry === 0) return;

    let cancelled = false;
    setLoadingR(true);
    setRulingsError(null);
    RequestManager.run(
      "fiqh:rulings-preview",
      () => getRulingsEncyclopedia({ page: 1, limit: 12, category: "الكل" }),
      { timeoutMs: 15_000 },
    )
      .then((result) => {
        if (cancelled) return;
        if (result.dbError && result.dbError !== "empty" && !result.needsSeed) {
          setRulings([]);
          setRulingsError(result.dbError);
          return;
        }
        setRulings(result.data);
        setRulingsError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setRulings([]);
        setRulingsError(String((err as Error)?.message || err));
      })
      .finally(() => {
        if (!cancelled) setLoadingR(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, rulingsRetry]);

  useEffect(() => {
    if (activeTab === "qa" && qaItems.length === 0) {
      setLoadingQ(true);
      RequestManager.run("fiqh:qa-preview", () =>
        getQaQuestions({ search: "" }),
      )
        .then(({ data }) => setQaItems(Array.isArray(data) ? data.slice(0, 8) : []))
        .catch(async () => {
          const seed = await loadSeedQa();
          setQaItems(seed.slice(0, 8));
        })
        .finally(() => setLoadingQ(false));
    }
  }, [activeTab]);

  return (
    <div className="fqp-root page-shell" dir="rtl">
      {/* مسار التنقل */}
      <nav className="tawheed-breadcrumb" aria-label="مسار التنقل">
        <Link href="/">الرئيسية</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">الفقه والأحكام</span>
      </nav>

      {/* رأس بوابة الفقه */}
      <PageHero
        eyebrow="الفقه الإسلامي الشامل"
        title="الفقه والأحكام"
        description="مرجع موحّد للعبادات والأحكام وقرارات المجامع الفقهية، كل شيء من مصادر موثقة ومعتمدة"
      />

      {/* شبكة أقسام الفقه */}
      <section aria-labelledby="fiqh-hub-heading">
        <h2 id="fiqh-hub-heading" className="tawheed-principles-heading fiqh-section-heading">
          أقسام الفقه والأحكام
        </h2>
        <div className="fqh-hub-grid">
          {FIQH_HUB_TOPICS.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              className="fqh-hub-card"
              style={{ "--fqh-clr": t.color } as React.CSSProperties}
            >
              <span className="fqh-hub-card__emoji" aria-hidden="true"><SectionIcon name={t.emoji} size={28} /></span>
              <p className="fqh-hub-card__title">{t.title}</p>
              <p className="fqh-hub-card__desc">{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* فاصل */}
      <hr className="fiqh-section-divider" />

      {/* Tabs، للمحتوى الديناميكي */}
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

        {/* تبويب الأحكام الشرعية */}
        {activeTab === "rulings" && (
          <div role="tabpanel" id="fqp-panel-rulings" aria-labelledby="fqp-tab-rulings">
            <div className="flex items-center justify-between mb-6">
              <h2 className="fqp-section-title"><Library size={20} />الأحكام الشرعية</h2>
              <Link href="/rulings"><span className="fqp-see-all">عرض الكل ←</span></Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {RULINGS_CATEGORIES.map((cat) => (
                <Link key={cat.slug} href={`/rulings?category=${encodeURIComponent(cat.name)}`}>
                  <div className="fqp-card fqp-card--center fqp-card--hover-border">
                    <div className="fqp-card__icon"><CatIcon name={cat.icon} /></div>
                    <div className="fqp-card__title">{cat.name}</div>
                  </div>
                </Link>
              ))}
            </div>

            {loadingR ? (
              <SkeletonCardGrid count={6} />
            ) : rulingsError ? (
              <ErrorState
                text="تعذّر تحميل الأحكام الشرعية حاليًا. يرجى المحاولة مرة أخرى."
                onRetry={() => {
                  setRulings([]);
                  setRulingsRetry((n) => n + 1);
                }}
              />
            ) : rulings.length === 0 ? (
              <Empty text="لا توجد أحكام بعد" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rulings.slice(0, 8).map((r) => (
                  <Link key={r.id} href={`/rulings/${r.id}`}>
                    <div className="fqp-card">
                      <h3 className="fqp-card__title line-clamp-2 mb-1">{r.title}</h3>
                      {r.category && <span className="fqp-cat-badge">{r.category}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-8 text-center">
              <Link href="/rulings">
                <span className="inline-block px-8 py-3 text-white rounded-xl font-medium transition-colors cursor-pointer fqp-cta-btn">
                  استعرض موسوعة الأحكام
                </span>
              </Link>
            </div>
          </div>
        )}

        {/* تبويب الأسئلة والأجوبة */}
        {activeTab === "qa" && (
          <div role="tabpanel" id="fqp-panel-qa" aria-labelledby="fqp-tab-qa">
            <div className="flex items-center justify-between mb-6">
              <h2 className="fqp-section-title"><MessageCircle size={20} />الأسئلة والأجوبة الشرعية</h2>
              <Link href="/qa"><span className="fqp-see-all">عرض الكل ←</span></Link>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {QA_CATEGORIES.slice(0, 8).map((cat) => (
                <Link key={cat.id} href={`/qa?cat=${cat.slug}`}>
                  <span className="fqp-cat-chip">{cat.name}</span>
                </Link>
              ))}
            </div>

            {loadingQ ? (
              <SkeletonCardGrid count={6} />
            ) : qaItems.length === 0 ? (
              <Empty text="لا توجد أسئلة بعد" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {qaItems.map((item: any) => (
                  <Link key={item.id} href={`/qa?id=${encodeURIComponent(item.id)}`}>
                    <div className="fqp-card h-full">
                      <p className="fqp-card__title fqp-card__title--mb2 line-clamp-2 leading-snug">
                        {item.question}
                      </p>
                      {(item.qa_categories?.name || item.category_name) && (
                        <span className="fqp-cat-badge">
                          {item.qa_categories?.name ?? item.category_name}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-8 text-center">
              <Link href="/qa">
                <span className="inline-block px-8 py-3 text-white rounded-xl font-medium transition-colors cursor-pointer fqp-cta-btn">
                  استعرض جميع الأسئلة والأجوبة
                </span>
              </Link>
            </div>
          </div>
        )}

        {/* تبويب المجمع الفقهي */}
        {activeTab === "council" && (
          <div role="tabpanel" id="fqp-panel-council" aria-labelledby="fqp-tab-council">
            <div className="mb-6">
              <h2 className="fqp-section-title mb-2"><Landmark size={20} />المجمع الفقهي الإسلامي</h2>
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
