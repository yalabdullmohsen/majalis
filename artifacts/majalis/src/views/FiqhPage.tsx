import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { usePageView } from "@/hooks/usePageView";
import { applyPageSeo } from "@/lib/seo";
import { getFatwas } from "@/lib/platform-content-service";
import { getLatestFatwas } from "@/lib/fatwa-seed";
import { getRulingsEncyclopedia } from "@/lib/rulings-service";
import { RULINGS_CATEGORY_TREE } from "@/lib/rulings-categories";
import { Loading, Empty } from "@/components/ui-common";
import { getQaQuestions } from "@/lib/supabase";
import { SEED_QA, QA_CATEGORIES } from "@/lib/qa-seed";
import { RequestManager } from "@/lib/request-manager";
import type { ShariaRulingExtended } from "@/lib/rulings-types";

type Tab = "fatawa" | "rulings" | "qa" | "council";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "fatawa",  label: "الفتاوى",         icon: "📋" },
  { key: "rulings", label: "الأحكام الشرعية", icon: "📚" },
  { key: "qa",      label: "الأسئلة والأجوبة", icon: "💬" },
  { key: "council", label: "المجمع الفقهي",    icon: "🏛️" },
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
    <div dir="rtl" className="min-h-screen bg-[var(--majalis-parchment)]">
      {/* Hero */}
      <div className="text-white px-4 py-10 ldb-hero">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-teal-100 text-sm px-4 py-1.5 rounded-full mb-4">
            <span>⚖️</span>
            <span>الفقه الإسلامي</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3">الفقه الإسلامي</h1>
          <p className="text-teal-100 max-w-xl mx-auto text-sm leading-relaxed">
            مرجع موحّد للفتاوى والأحكام الشرعية وقرارات المجامع الفقهية — كل شيء من مصادر موثقة ومعتمدة
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-[var(--majalis-panel)] border-b border-[var(--majalis-line)] shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === t.key
                  ? "border-[var(--mn-border-active)] text-[var(--mn-text-active)]"
                  : "border-transparent text-[var(--majalis-ink-soft)] hover:text-[var(--majalis-ink-soft)]"
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* تبويب الفتاوى */}
        {activeTab === "fatawa" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--majalis-ink)]">📋 الفتاوى الشرعية</h2>
              <Link href="/fatwa">
                <span className="text-sm text-[var(--majalis-emerald)] hover:underline cursor-pointer">عرض الكل ←</span>
              </Link>
            </div>

            {/* فتاوى حديثة */}
            {loadingF ? (
              <Loading />
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
                <span
                  className="inline-block px-8 py-3 text-white rounded-xl font-medium transition-colors cursor-pointer fqp-cta-btn"
                >
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
              <h2 className="text-xl font-bold text-[var(--majalis-ink)]">📚 الأحكام الشرعية</h2>
              <Link href="/rulings">
                <span className="text-sm text-[var(--majalis-emerald)] hover:underline cursor-pointer">عرض الكل ←</span>
              </Link>
            </div>

            {/* تصنيفات الأحكام */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {RULINGS_CATEGORIES.map((cat) => (
                <Link key={cat.slug} href={`/rulings?category=${encodeURIComponent(cat.name)}`}>
                  <div className="bg-[var(--majalis-panel)] border border-[var(--majalis-line)] rounded-xl p-4 text-center hover:shadow-md hover:border-[var(--majalis-emerald)] transition-all cursor-pointer">
                    <div className="text-2xl mb-1">{cat.icon}</div>
                    <div className="text-sm font-medium text-[var(--majalis-ink)]">{cat.name}</div>
                  </div>
                </Link>
              ))}
            </div>

            {loadingR ? (
              <Loading />
            ) : rulings.length === 0 ? (
              <Empty text="لا توجد أحكام بعد" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {rulings.slice(0, 8).map((r) => (
                  <Link key={r.id} href={`/rulings/${r.id}`}>
                    <div className="bg-[var(--majalis-panel)] border border-[var(--majalis-line)] rounded-xl p-4 hover:shadow-md transition-all cursor-pointer">
                      <h3 className="font-semibold text-[var(--majalis-ink)] text-sm line-clamp-2 mb-1">{r.title}</h3>
                      {r.category && (
                        <span className="text-xs bg-[var(--majalis-emerald-muted)] text-[var(--majalis-emerald)] px-2 py-0.5 rounded-full">{r.category}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-8 text-center">
              <Link href="/rulings">
                <span
                  className="inline-block px-8 py-3 text-white rounded-xl font-medium transition-colors cursor-pointer fqp-cta-btn"
                >
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
              <h2 className="text-xl font-bold text-[var(--majalis-ink)]">💬 الأسئلة والأجوبة الشرعية</h2>
              <Link href="/qa">
                <span className="text-sm text-[var(--majalis-emerald)] hover:underline cursor-pointer">عرض الكل ←</span>
              </Link>
            </div>

            {/* تصنيفات الأسئلة */}
            <div className="flex flex-wrap gap-2 mb-6">
              {QA_CATEGORIES.slice(0, 8).map((cat) => (
                <Link key={cat.id} href={`/qa?cat=${cat.slug}`}>
                  <span className="inline-block px-3 py-1.5 text-xs font-medium bg-[var(--majalis-emerald-muted)] text-[var(--majalis-emerald)] rounded-full cursor-pointer hover:opacity-80 transition-opacity">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>

            {loadingQ ? (
              <Loading />
            ) : qaItems.length === 0 ? (
              <Empty text="لا توجد أسئلة بعد" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {qaItems.map((item: any) => (
                  <Link key={item.id} href={`/qa/${item.id}`}>
                    <div className="bg-[var(--majalis-panel)] border border-[var(--majalis-line)] rounded-xl p-4 hover:shadow-md transition-all cursor-pointer h-full">
                      <p className="font-semibold text-[var(--majalis-ink)] text-sm line-clamp-2 mb-2 leading-snug">
                        {item.question}
                      </p>
                      {(item.qa_categories?.name || item.category_name) && (
                        <span className="text-xs bg-[var(--majalis-emerald-muted)] text-[var(--majalis-emerald)] px-2 py-0.5 rounded-full">
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
                <span
                  className="inline-block px-8 py-3 text-white rounded-xl font-medium transition-colors cursor-pointer fqp-cta-btn"
                >
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
              <h2 className="text-xl font-bold text-[var(--majalis-ink)] mb-2">🏛️ المجمع الفقهي الإسلامي</h2>
              <p className="text-sm text-[var(--majalis-ink-soft)]">
                قرارات وبيانات وفتاوى المجامع الفقهية المعتمدة — موثقة بمصادرها
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {COUNCIL_SECTIONS.map((s) => (
                <Link key={s.href} href={s.href}>
                  <div className="flex items-start gap-3 p-4 bg-[var(--majalis-panel)] border border-[var(--majalis-line)] rounded-xl hover:shadow-md hover:border-[var(--majalis-emerald)] transition-all cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--majalis-ink)] text-sm">{s.label}</p>
                      <p className="text-xs text-[var(--majalis-ink-soft)] mt-0.5">{s.desc}</p>
                    </div>
                    <span className="text-[var(--majalis-ink-soft)] opacity-60 text-lg flex-shrink-0">←</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <Link href="/fiqh-council">
                <span
                  className="inline-block px-8 py-3 text-white rounded-xl font-medium transition-colors cursor-pointer fqp-cta-btn"
                >
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
      <div className="bg-[var(--majalis-panel)] border border-[var(--majalis-line)] rounded-xl p-4 hover:shadow-md transition-all cursor-pointer h-full">
        <h3 className="font-semibold text-[var(--majalis-ink)] text-sm line-clamp-2 mb-2 leading-snug">
          {item.title || item.question || "فتوى شرعية"}
        </h3>
        {(item.category || item.subject) && (
          <span className="text-xs bg-[var(--majalis-emerald-muted)] text-[var(--majalis-emerald)] px-2 py-0.5 rounded-full">
            {item.category || item.subject}
          </span>
        )}
      </div>
    </Link>
  );
}
