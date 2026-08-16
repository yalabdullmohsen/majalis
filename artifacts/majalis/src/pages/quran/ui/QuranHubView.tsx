/**
 * مركز القرآن — بطاقات من سجل الأقسام عبر hub: 'quran' فقط.
 */
import { useEffect } from "react";
import { applyPageSeo } from "@/lib/seo";
import { quranHubSections } from "@/config/sections.registry";
import { FeaturedSectionCard, SectionCard } from "@/components/sections";
import { loadLastPageSync } from "@/lib/quran-last-page";
import "@/components/sections/section-cards.css";
import "@/styles/pages/quran-hub.css";
import "@/styles/pages/quran-numbers.css";

export default function QuranHubPage() {
  const sections = quranHubSections();
  const openMushaf = sections.find((s) => s.id === "open-mushaf");
  const rest = sections.filter((s) => s.id !== "open-mushaf");

  useEffect(() => {
    applyPageSeo({
      path: "/quran-hub",
      title: "مركز القرآن — المجلس العلمي",
      description: "مركز القرآن: المصحف والتفسير والتلاوة وعلوم القرآن والإحصاءات الموثّقة.",
      keywords: ["القرآن الكريم", "المصحف", "تفسير", "تلاوة"],
    });
  }, []);

  return (
    <div className="quran-hub-page sections-hub" dir="rtl" data-quran-hub="1">
      <header className="quran-hub-page__head quran-hub-page__head--title-only">
        <h1 className="quran-hub-page__title">مركز القرآن</h1>
      </header>

      {openMushaf ? (
        <div style={{ padding: "8px 16px 16px" }}>
          <FeaturedSectionCard
            section={openMushaf}
            resolveRoute={() => {
              const page = loadLastPageSync();
              return page && page > 1 ? `/mushaf?page=${page}` : "/mushaf";
            }}
          />
        </div>
      ) : null}

      <div className="card-grid" style={{ padding: "0 16px 16px" }} data-sections-grid="quran-hub">
        {rest.map((s) => (
          <SectionCard key={s.id} section={s} />
        ))}
      </div>
    </div>
  );
}
