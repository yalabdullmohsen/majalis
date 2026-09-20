import { useEffect, useMemo } from "react";
import { Link, useRoute } from "wouter";
import { TopicPage } from "@/components/topic/TopicPage";
import { applyPageSeo } from "@/lib/seo";
import { EMPTY } from "@/lib/ui-copy";
import { ShareButtons } from "@/components/ContentActions";
import { KnowledgeLayout } from "@/components/knowledge";
import { KnowledgeDetailSurface } from "@/components/knowledge/KnowledgeDetailSurface";
import type { KnowledgeDetailSurfaceSection } from "@/components/knowledge/KnowledgeDetailSurface";
import { getMadhhabById } from "@/data/madhahib";
import { UtilityScreen } from "@/components/design-system/screens";
import "@/styles/pages/madhahib.css";

const LIST_PATH = "/madhahib";

export default function MadhahibDetailPage() {
  const [, params] = useRoute("/madhahib/:id");
  const id = params?.id ?? "";
  const madhhab = getMadhhabById(id);

  const sections = useMemo((): KnowledgeDetailSurfaceSection[] => {
    if (!madhhab) return [];
    return [
      {
        id: `${madhhab.id}-overview`,
        title: "نظرة عامة",
        variant: "overview",
        prose: madhhab.summary,
      },
      {
        id: `${madhhab.id}-meta`,
        title: "النشأة والسياق",
        fields: [
          { label: "الاسم الكامل", value: madhhab.fullName },
          {
            label: "المؤسس",
            value: `الإمام ${madhhab.founder} (${madhhab.born}–${madhhab.died})`,
          },
          { label: "المنشأ", value: madhhab.origin },
          { label: "الانتشار", value: madhhab.spread },
        ],
      },
      {
        id: `${madhhab.id}-method`,
        title: "المنهج الأصولي",
        prose: madhhab.methodology,
      },
      {
        id: `${madhhab.id}-sources`,
        title: "مصادر التشريع",
        items: madhhab.sources,
      },
      {
        id: `${madhhab.id}-features`,
        title: "أبرز المميزات",
        items: madhhab.features,
      },
      {
        id: `${madhhab.id}-books`,
        title: "أهم المصنَّفات",
        items: madhhab.books.map((b) => `${b.title} — ${b.author}`),
      },
      {
        id: `${madhhab.id}-scholars`,
        title: "كبار علماء المذهب",
        items: madhhab.scholars,
      },
      {
        id: `${madhhab.id}-quote`,
        title: "نص منقول",
        variant: "quote",
        quote: `«${madhhab.quote.text}» — ${madhhab.quote.source}`,
      },
    ];
  }, [madhhab]);

  useEffect(() => {
    if (!madhhab) {
      applyPageSeo({
        path: `${LIST_PATH}/${id}`,
        title: "مذهب غير موجود | المذاهب الفقهية | سُنّة",
        description: "هذا المذهب غير متاح في الفهرس.",
        robots: "noindex, follow",
      });
      return;
    }
    applyPageSeo({
      path: `${LIST_PATH}/${madhhab.id}`,
      title: `${madhhab.fullName} | المذاهب الفقهية | سُنّة`,
      description: madhhab.summary.slice(0, 160),
      keywords: [madhhab.name, madhhab.fullName, "مذاهب فقهية"],
    });
  }, [madhhab, id]);

  if (!madhhab) {
    return (
      <UtilityScreen compose="mark">
        <TopicPage
          themeId="fiqh"
          sectionRoute={LIST_PATH}
          breadcrumb={[
            { label: "الرئيسية", href: "/" },
            { label: "المذاهب الفقهية", href: LIST_PATH },
            { label: "غير موجود" },
          ]}
          eyebrow="الفقه الإسلامي"
          title="مذهب غير موجود"
          subtitle={EMPTY.data}
        >
          <Link href={LIST_PATH}>العودة إلى المذاهب</Link>
        </TopicPage>
      </UtilityScreen>
    );
  }

  return (
    <UtilityScreen compose="mark">
      <TopicPage
        themeId="fiqh"
        sectionRoute={LIST_PATH}
        breadcrumb={[
          { label: "الرئيسية", href: "/" },
          { label: "المذاهب الفقهية", href: LIST_PATH },
          { label: madhhab.fullName },
        ]}
        eyebrow="الفقه الإسلامي"
        title={madhhab.fullName}
        subtitle={`الإمام ${madhhab.founder} · ${madhhab.origin}`}
        className="topic-page--madhahib-detail"
      >
        <KnowledgeLayout kind="fiqh">
          <KnowledgeDetailSurface sections={sections} />
          <ShareButtons
            title={`${madhhab.fullName} — سُنّة`}
            url={`https://www.ssunnah.com${LIST_PATH}/${madhhab.id}`}
          />
        </KnowledgeLayout>
      </TopicPage>
    </UtilityScreen>
  );
}
