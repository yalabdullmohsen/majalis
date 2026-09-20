import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import { TopicPage } from "@/components/topic/TopicPage";
import { applyPageSeo } from "@/lib/seo";
import { EMPTY } from "@/lib/ui-copy";
import { ShareButtons } from "@/components/ContentActions";
import { InternalLinkCard } from "@/components/ui/InternalCards";
import { KnowledgeLayout } from "@/components/knowledge";
import { KnowledgeDetailSurface } from "@/components/knowledge/KnowledgeDetailSurface";
import type { KnowledgeDetailSurfaceSection } from "@/components/knowledge/KnowledgeDetailSurface";
import {
  getIslamicSectPublicationStatus,
  getPublishedIslamicSectById,
} from "@/lib/islamic-sects";
import { getIslamicSectById } from "@/data/islamic-sects";
import { UtilityScreen } from "@/components/design-system/screens";
import "@/styles/pages/islamic-sects.css";

const LIST_PATH = "/islamic-sects";

function sectNeedsSourceBanner(sect: {
  spread?: string;
  founder?: string;
  fullName?: string;
  quote?: string;
  keyBeliefs?: string[];
}): boolean {
  const blob = [
    sect.spread,
    sect.founder,
    sect.fullName,
    sect.quote,
    ...(sect.keyBeliefs ?? []),
  ]
    .filter(Boolean)
    .join("\n");
  return (
    /\d+\s*[-–—]\s*\d+\s*%|\d+\s*%/.test(blob) ||
    /غير موثّق|تحتاج إحالة|قيد المراجعة|مرشح ببليوغرافي|لم تُراجع هنا|تسمية خارجية/.test(
      blob,
    )
  );
}

export default function IslamicSectsDetailPage() {
  const [, params] = useRoute("/islamic-sects/:id");
  const id = params?.id ?? "";
  const sect = getPublishedIslamicSectById(id);
  const existsUnpublished = !sect && Boolean(getIslamicSectById(id));
  const publicationStatus = getIslamicSectPublicationStatus(id);
  const needsReview = sect ? sectNeedsSourceBanner(sect) : false;
  /** lazy: المراجع والنصوص بعد تفاعل/تمرير بسيط لتقليل العمل الأولي */
  const [loadHeavy, setLoadHeavy] = useState(false);

  useEffect(() => {
    if (!sect) return;
    const t = window.setTimeout(() => setLoadHeavy(true), 0);
    const onScroll = () => setLoadHeavy(true);
    window.addEventListener("scroll", onScroll, { once: true, passive: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, [sect]);

  const sections = useMemo((): KnowledgeDetailSurfaceSection[] => {
    if (!sect) return [];
    const base: KnowledgeDetailSurfaceSection[] = [
      {
        id: `${sect.id}-def`,
        title: "التعريف",
        variant: "overview",
        prose: `${sect.fullName} — ضمن تصنيف واجهة قديم «${sect.category}» (التصنيف العلمي في عقد الجرد منفصل).`,
      },
      {
        id: `${sect.id}-summary`,
        title: "ملخص محايد",
        prose: sect.foundingCause,
      },
      {
        id: `${sect.id}-origin`,
        title: "النشأة والسياق التاريخي",
        fields: [
          { label: "الفترة", value: sect.era },
          { label: "المنشأ", value: sect.origin },
          {
            label: "شخصيات مرتبطة تاريخيًا (ليس بالضرورة «مؤسسًا»)",
            value: sect.founder,
          },
        ],
      },
      {
        id: `${sect.id}-spread`,
        title: "الانتشار",
        prose: sect.spread
          ? `${sect.spread}${
              needsReview
                ? " — أي ادعاء انتشار أو نسبة يحتاج مصدرًا وتاريخ تحقق؛ العرض للتنظيم فقط."
                : ""
            }`
          : undefined,
      },
      {
        id: `${sect.id}-beliefs`,
        title: "أبرز المقالات أو الأفكار",
        items: sect.keyBeliefs,
      },
      {
        id: `${sect.id}-scholars`,
        title: "الجذور أو الشخصيات المرتبطة تاريخيًا",
        items: sect.keyScholars,
      },
    ];

    if (loadHeavy) {
      base.push(
        {
          id: `${sect.id}-refs`,
          title: "المصادر والكتب",
          items: sect.keyBooks,
        },
        {
          id: `${sect.id}-quote`,
          title: "نص منقول",
          variant: "quote",
          quote: sect.quote,
        },
      );
    }

    base.push({
      id: `${sect.id}-review`,
      title: "حالة المراجعة",
      prose: `منشور للعامة · حالة العقد: ${publicationStatus ?? "PUBLISHED"}. لا حكم شرعي باسم سُنّة.`,
    });

    if (sect.id === "ahl-al-sunna") {
      base.push({
        id: `${sect.id}-related`,
        title: "تعلّم ذو صلة",
        variant: "related",
        children: (
          <div className="sect-related">
            <InternalLinkCard
              href="/tawhid/ahl-sunnah"
              title="دروس عقيدة أهل السنة والجماعة"
              variant="compact"
              className="sect-related__link"
            />
            <InternalLinkCard
              href="/tawhid"
              title="بوابة العقيدة والتوحيد"
              variant="compact"
              className="sect-related__link sect-related__link--ghost"
            />
          </div>
        ),
      });
    }

    return base;
  }, [sect, needsReview, loadHeavy, publicationStatus]);

  useEffect(() => {
    if (!sect) {
      applyPageSeo({
        path: `${LIST_PATH}/${id}`,
        title: existsUnpublished
          ? "سجل قيد المراجعة | الفرق الإسلامية | سُنّة"
          : "سجل غير موجود | الفرق الإسلامية | سُنّة",
        description: existsUnpublished
          ? "هذا السجل غير منشور للعامة بعد — بانتظار مراجعة بشرية ومصادر."
          : "هذا السجل غير متاح في فهرس الفرق الإسلامية.",
        robots: "noindex, follow",
      });
      return;
    }
    applyPageSeo({
      path: `${LIST_PATH}/${sect.id}`,
      title: `${sect.name} — الفرق الإسلامية | سُنّة`,
      description: sect.foundingCause.slice(0, 160),
      keywords: [sect.name, sect.category, "فرق إسلامية"],
    });
  }, [sect, id, existsUnpublished]);

  if (!sect) {
    return (
      <UtilityScreen compose="mark">
        <TopicPage
          themeId="aqeedah"
          sectionRoute={LIST_PATH}
          breadcrumb={[
            { label: "الرئيسية", href: "/" },
            { label: "الفرق الإسلامية", href: LIST_PATH },
            { label: existsUnpublished ? "قيد المراجعة" : "غير موجود" },
          ]}
          eyebrow="العقيدة والتوحيد"
          title={existsUnpublished ? "سجل قيد المراجعة" : "سجل غير موجود"}
          subtitle={
            existsUnpublished
              ? "لا يُعرض للعامة حتى حالة PUBLISHED بعد قرار بشري ومصادر معتمدة."
              : EMPTY.data
          }
          className="topic-page--sects topic-page--sects-detail"
        >
          <Link href={LIST_PATH} className="sect-hub__chip is-active">
            العودة إلى القائمة
          </Link>
        </TopicPage>
      </UtilityScreen>
    );
  }

  return (
    <UtilityScreen compose="mark">
      <TopicPage
        themeId="aqeedah"
        sectionRoute={LIST_PATH}
        breadcrumb={[
          { label: "الرئيسية", href: "/" },
          { label: "الفرق الإسلامية", href: LIST_PATH },
          { label: sect.name },
        ]}
        eyebrow="العقيدة والتوحيد"
        title={sect.name}
        subtitle={`${sect.category} · منشور بعد مراجعة`}
        className="topic-page--sects topic-page--sects-detail"
      >
        <KnowledgeLayout kind="knowledge" className="sect-detail-kx">
          <p className="sect-hub__note">
            <strong>ملاحظة منهجية:</strong> عرض علمي تاريخي وفق مصادر معتمدة للمراجعة، ولا يمثل فتوى
            شرعية ولا حكمًا على الأعيان.
          </p>
          <KnowledgeDetailSurface sections={sections} />
          {!loadHeavy ? (
            <button
              type="button"
              className="sect-hub__chip is-active"
              onClick={() => setLoadHeavy(true)}
            >
              عرض المراجع والنصوص المنقولة
            </button>
          ) : null}
          <div className="sect-hub__share">
            <p className="sect-hub__share-title">شارك الفائدة</p>
            <ShareButtons
              title={`${sect.name} — الفرق الإسلامية | سُنّة`}
              url={`https://www.ssunnah.com${LIST_PATH}/${sect.id}`}
            />
          </div>
        </KnowledgeLayout>
      </TopicPage>
    </UtilityScreen>
  );
}
