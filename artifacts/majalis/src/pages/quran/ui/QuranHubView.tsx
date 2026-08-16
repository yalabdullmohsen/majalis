/**
 * مركز القرآن — بطاقات من سجل الأقسام (سطح quranHub) بلا مصفوفة يدوية.
 */
import { useEffect } from "react";
import { applyPageSeo } from "@/lib/seo";
import { quranHubSections } from "@/config/sections.registry";
import { FeaturedSectionCard, SectionCard } from "@/components/sections";
import { loadLastPageSync } from "@/lib/quran-last-page";
import "@/components/sections/section-cards.css";
import "@/styles/pages/quran-hub.css";

export default function QuranHubPage() {
  const sections = quranHubSections();
  const openMushaf = sections.find((s) => s.id === "open-mushaf");
  const rest = sections.filter((s) => s.id !== "open-mushaf");

  useEffect(() => {
    applyPageSeo({
      path: "/quran-hub",
      title: "مركز القرآن — المجلس العلمي",
      description: "مركز القرآن: فتح المصحف، التلاوة، التفسير، التسميع، فهرس السور، والبحث.",
      keywords: ["القرآن الكريم", "المصحف", "تفسير", "تلاوة"],
    });
  }, []);

  return (
    <div className="quran-hub-page sections-hub" dir="rtl" data-quran-hub="1">
      <header className="quran-hub-page__head" style={{ padding: "16px 16px 8px" }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>مركز القرآن</h1>
        <p style={{ margin: "8px 0 0", fontSize: 15, color: "var(--mj-muted)" }}>
          اقرأ، استمع، راجع، وابحث — من مصدر واحد
        </p>
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
