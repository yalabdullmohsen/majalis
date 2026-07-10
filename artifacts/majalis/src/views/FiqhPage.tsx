import { useEffect, useMemo, useState } from "react";
import { Banknote, BookOpen, Building2, ClipboardList, Droplets, FileSignature, Flame, FlaskConical, GraduationCap, Handshake, Heart, Landmark, Library, MapPin, MessageCircle, Moon, Scale, ScrollText, Shield, Shirt, Users, Utensils } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useSearch } from "wouter";
import { usePageView } from "@/hooks/usePageView";
import { applyPageSeo } from "@/lib/seo";
import { getFatwas } from "@/lib/platform-content-service";
import { getLatestFatwas } from "@/lib/fatwa-seed";
import { getRulingsEncyclopedia } from "@/lib/rulings-service";
import { RULINGS_CATEGORY_TREE } from "@/lib/rulings-categories";
import { SkeletonCardGrid, Empty } from "@/components/ui-common";
import { getQaQuestions } from "@/lib/supabase";
import { SEED_QA, QA_CATEGORIES } from "@/lib/qa-seed";
import { RequestManager } from "@/lib/request-manager";
import type { ShariaRulingExtended } from "@/lib/rulings-types";

type Tab = "fatawa" | "rulings" | "qa" | "council";

const RULINGS_ICON_MAP: Record<string, LucideIcon> = {
  Landmark, Droplets, Banknote, Moon, MapPin, Handshake, Utensils, Shirt, Users,
  ScrollText, Scale, FileSignature, Shield, Heart, BookOpen, GraduationCap, FlaskConical, Flame,
};
function CatIcon({ name }: { name?: string }) {
  const I: LucideIcon = (name ? RULINGS_ICON_MAP[name] : undefined) ?? BookOpen;
  return <I size={20} />;
}

const TABS: { key: Tab; label: string; Icon: LucideIcon }[] = [
  { key: "fatawa",  label: "الفتاوى",          Icon: ClipboardList },
  { key: "rulings", label: "الأحكام الشرعية",  Icon: BookOpen },
  { key: "qa",      label: "الأسئلة والأجوبة", Icon: MessageCircle },
  { key: "council", label: "المجمع الفقهي",     Icon: Building2 },
];

const COUNCIL_SECTIONS = [
  { href: "/fiqh-council",             label: "رئيسية المجمع",     desc: "القرارات والفتاوى والتوثيق" },
  { href: "/fiqh-council/issues",      label: "المسائل الفقهية",   desc: "المسائل المطروحة والمدروسة" },
  { href: "/fiqh-council/resolutions", label: "القرارات",          desc: "قرارات هيئات الإفتاء المعتمدة" },
  { href: "/fiqh-council/fatwas",      label: "فتاوى المجمع",      desc: "فتاوى موثقة بأسانيدها" },
  { href: "/fiqh-council/live",        label: "البيانات الحية",    desc: "آخر الجلسات والنشاطات" },
  { href: "/fiqh-council/index",       label: "الفهرس الموضوعي",  desc: "تصفح حسب الأبواب" },
  { href: "/fiqh-council/nawazil",     label: "النوازل المعاصرة",  desc: "مسائل العصر ومستجداته" },
  { href: "/scholarly-research",       label: "الباحث الشرعي",    desc: "بحث وتوثيق بالمصادر" },
];

const RULINGS_CATEGORIES = RULINGS_CATEGORY_TREE.slice(0, 8);

// ─── أقسام الفقه والأحكام ────────────────────────────────────────────────────

type FiqhTopic = { emoji: string; title: string; desc: string; href: string; color: string };

const FIQH_TOPICS: FiqhTopic[] = [
  { emoji: "🚿", title: "الطهارة",           desc: "الوضوء والغسل والتيمم",          href: "/tahara",       color: "#0F766E" },
  { emoji: "🕌", title: "الصلاة",            desc: "أحكام الصلاة وأوقاتها",          href: "/salah-guide",  color: "#1F4D3A" },
  { emoji: "💰", title: "الزكاة",            desc: "أحكام الزكاة وحسابها",           href: "/zakat",        color: "#0F5132" },
  { emoji: "🌙", title: "الصيام",            desc: "أحكام رمضان والنوافل",           href: "/sawm",         color: "#5B21B6" },
  { emoji: "🕋", title: "الحج والعمرة",       desc: "مناسك الحج والعمرة",             href: "/hajj",         color: "#92400E" },
  { emoji: "🕯️", title: "الجنائز",           desc: "أحكام الجنائز والتعزية",         href: "/janaza",       color: "#374151" },
  { emoji: "⚖️", title: "المواريث",          desc: "حاسبة الفرائض والتركات",         href: "/mawarith",     color: "#DC2626" },
  { emoji: "📐", title: "القواعد الفقهية",   desc: "القواعد الخمس الكبرى وفروعها",   href: "/fiqh-qawaid",  color: "#1F4D3A" },
  { emoji: "📚", title: "المذاهب الأربعة",   desc: "الحنفي والمالكي والشافعي والحنبلي", href: "/madhahib",  color: "#7C3AED" },
  { emoji: "❓", title: "الأسئلة والأجوبة",  desc: "أسئلة شرعية موثقة",              href: "/qa",           color: "#0F766E" },
  { emoji: "📜", title: "الفتاوى",           desc: "فتاوى مُحقَّقة ومُصنَّفة",       href: "/fatwa",        color: "#1F4D3A" },
  { emoji: "🏛️", title: "المجمع الفقهي",    desc: "قرارات المجامع الفقهية",          href: "/fiqh-council", color: "#0F5132" },
  { emoji: "📋", title: "الأحكام الشرعية",   desc: "موسوعة الأحكام بالمذاهب",        href: "/rulings",      color: "#065F46" },
  { emoji: "🔬", title: "الباحث الشرعي",    desc: "بحث وتوثيق بالمصادر",             href: "/scholarly-research", color: "#374151" },
];

export default function FiqhPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialTab = (params.get("tab") as Tab) || "fatawa";

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [fatwas, setFatwas]       = useState<any[]>([]);
  const [rulings, setRulings]     = useState<ShariaRulingExtended[]>([]);
  const [qaItems, setQaItems]     = useState<any[]>([]);
  const [loadingF, setLoadingF]   = useState(false);
  const [loadingR, setLoadingR]   = useState(false);
  const [loadingQ, setLoadingQ]   = useState(false);

  usePageView("fiqh", null);

  useEffect(() => {
    applyPageSeo({
      path: "/fiqh",
      title: "الفقه الإسلامي — فتاوى وأحكام وأسئلة | المجلس العلمي",
      description: "مرجع شامل في الفقه الإسلامي: فتاوى موثقة، أحكام شرعية، أسئلة وأجوبة، وقرارات المجمع الفقهي.",
      keywords: ["فقه إسلامي", "فتاوى", "أحكام شرعية", "الفقه الحنفي", "أسئلة شرعية"],
    });
  }, []);

  useEffect(() => {
    if (activeTab === "fatawa" && fatwas.length === 0) {
      setLoadingF(true);
      getFatwas({ category: "الكل", format: "الكل", search: "" })
        .then(({ data }) => setFatwas(data.slice(0, 12)))
        .catch(() => setFatwas(getLatestFatwas(12)))
        .finally(() => setLoadingF(false));
    }
    if (activeTab === "rulings" && rulings.length === 0) {
      setLoadingR(true);
      getRulingsEncyclopedia({ page: 1, limit: 12, category: "الكل" })
        .then(({ data }) => setRulings(data))
        .finally(() => setLoadingR(false));
    }
    if (activeTab === "qa" && qaItems.length === 0) {
      setLoadingQ(true);
      RequestManager.run("fiqh:qa-preview", () =>
        getQaQuestions({ search: "" }),
      )
        .then(({ data }) => setQaItems(Array.isArray(data) ? data.slice(0, 8) : []))
        .catch(() => setQaItems(SEED_QA.slice(0, 8)))
        .finally(() => setLoadingQ(false));
    }
  }, [activeTab]);

  const latestFatwas = useMemo(() => getLatestFatwas(6), []);

  return (
    <div className="fqp-root page-shell" dir="rtl">
      {/* مسار التنقل */}
      <nav className="tawheed-breadcrumb" aria-label="مسار التنقل">
        <Link href="/">الرئيسية</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">الفقه والأحكام</span>
      </nav>

      {/* رأس بوابة الفقه */}
      <header className="fqh-hub-hero">
        <p className="fqh-hub-hero__eyebrow">الفقه الإسلامي الشامل</p>
        <h1 className="fqh-hub-hero__title">الفقه والأحكام</h1>
        <p className="fqh-hub-hero__sub">
          مرجع موحّد للفتاوى والعبادات والأحكام وقرارات المجامع الفقهية — كل شيء من مصادر موثقة ومعتمدة
        </p>
      </header>

      {/* شبكة أقسام الفقه */}
      <section aria-labelledby="fiqh-hub-heading">
        <h2 id="fiqh-hub-heading" className="tawheed-principles-heading" style={{ marginBottom: "1rem" }}>
          أقسام الفقه والأحكام
        </h2>
        <div className="fqh-hub-grid">
          {FIQH_TOPICS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="fqh-hub-card"
              style={{ "--fqh-clr": t.color } as React.CSSProperties}
            >
              <span className="fqh-hub-card__emoji" aria-hidden="true">{t.emoji}</span>
              <p className="fqh-hub-card__title">{t.title}</p>
              <p className="fqh-hub-card__desc">{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* فاصل */}
      <hr style={{ border: "none", borderTop: "1px solid var(--majalis-line, #E2EAE6)", margin: "1.5rem 0" }} />

      {/* Tabs — للمحتوى الديناميكي */}
      <div className="fqp-tabs-nav" style={{ background: "none", boxShadow: "none" }}>
        <div className="flex gap-1 overflow-x-auto" style={{ paddingBottom: "0.5rem" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`fqp-tab${activeTab === t.key ? " fqp-tab--active" : ""}`}
              aria-pressed={activeTab === t.key}
            >
              <t.Icon size={15} strokeWidth={1.8} aria-hidden="true" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="fqp-tab-content">

        {/* تبويب الفتاوى */}
        {activeTab === "fatawa" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="fqp-section-title"><ScrollText size={20} />الفتاوى الشرعية</h2>
              <Link href="/fatwa"><span className="fqp-see-all">عرض الكل ←</span></Link>
            </div>

            {loadingF ? (
              <SkeletonCardGrid count={6} />
            ) : fatwas.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {latestFatwas.map((f, i) => (
                  <FatwaCard key={i} item={f} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {fatwas.map((f: any, i: number) => (
                  <FatwaCard key={f.id ?? i} item={f} />
                ))}
              </div>
            )}

            <div className="mt-8 text-center">
              <Link href="/fatwa">
                <span className="inline-block px-8 py-3 text-white rounded-xl font-medium transition-colors cursor-pointer fqp-cta-btn">
                  استعرض جميع الفتاوى
                </span>
              </Link>
            </div>
          </div>
        )}

        {/* تبويب الأحكام الشرعية */}
        {activeTab === "rulings" && (
          <div>
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
          <div>
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
                  <Link key={item.id} href={`/qa/${item.id}`}>
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
          <div>
            <div className="mb-6">
              <h2 className="fqp-section-title mb-2"><Landmark size={20} />المجمع الفقهي الإسلامي</h2>
              <p className="fqp-section-desc">
                قرارات وبيانات وفتاوى المجامع الفقهية المعتمدة — موثقة بمصادرها
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

      </div>
    </div>
  );
}

function FatwaCard({ item }: { item: any }) {
  return (
    <Link href={item.id ? `/fatwa/${item.id}` : "/fatwa"}>
      <div className="fqp-card h-full">
        <h3 className="fqp-card__title fqp-card__title--mb2 line-clamp-2 leading-snug">
          {item.title || item.question || "فتوى شرعية"}
        </h3>
        {(item.category || item.subject) && (
          <span className="fqp-cat-badge">{item.category || item.subject}</span>
        )}
      </div>
    </Link>
  );
}
