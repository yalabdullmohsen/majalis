/**
 * مسار الحفظ — غلاف AppPage خلف Feature Flag.
 * PR-1: Routes + هيكل فقط · المحتوى في PR-2+.
 * العلم OFF → إعادة توجيه إلى /memorization (لا فتح للعامة).
 */
import { useEffect, useMemo } from "react";
import { Redirect } from "wouter";
import { BookMarked, FolderOpen, Library } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import { SectionEntryCard } from "@/components/ui/HubCard";
import { sectionTemplateChrome } from "@/config/section-template";
import { UtilityScreen } from "@/components/design-system/screens";
import { EmptyStateV2 } from "@/components/design-system/EmptyStateV2";
import {
  HIFZ_PATH_USER_TAGLINE,
  isHifzPathEnabled,
} from "@/lib/memorization-path";
import "@/components/sections/section-cards.css";

const PATH = "/hifz-path";

export default function HifzPathPage() {
  if (!isHifzPathEnabled()) {
    return <Redirect to="/memorization" />;
  }

  return <HifzPathShell />;
}

function HifzPathShell() {
  useEffect(() => {
    applyPageSeo({
      path: PATH,
      title: "مسار الحفظ | سُنّة",
      description: HIFZ_PATH_USER_TAGLINE,
      keywords: ["مسار الحفظ", "حفظ", "سُنّة"],
      robots: "noindex, follow",
    });
  }, []);

  const chrome = useMemo(
    () =>
      sectionTemplateChrome(PATH, {
        title: "مسار الحفظ",
        subtitle: HIFZ_PATH_USER_TAGLINE,
        eyebrow: "مسار الحفظ",
        groupTitle: "تصفح المسارات",
      }),
    [],
  );

  return (
    <UtilityScreen compose="mark">
      <SectionTemplatePage
        route={PATH}
        title={chrome.title}
        subtitle={chrome.subtitle}
        eyebrow={chrome.eyebrow}
        groupTitle={chrome.groupTitle}
      >
        <div className="hub-card-grid" data-section-entry-grid="1">
          <SectionEntryCard
            href={`${PATH}/my`}
            title="محفوظاتي"
            subtitle="متابعة الوحدات التي سجّلتها للمراجعة"
            Icon={BookMarked}
          />
          <SectionEntryCard
            href={PATH}
            title="المسارات المقترحة"
            subtitle="حسب المستوى والهدف — تُنشر بعد اعتماد المصادر"
            Icon={Library}
          />
          <SectionEntryCard
            href={`${PATH}/c/quran`}
            title="التصنيفات"
            subtitle="قرآن · أحاديث · أذكار · متون — المنشور فقط"
            Icon={FolderOpen}
          />
        </div>
        <EmptyStateV2
          title="لا مسارات منشورة بعد"
          description="مسارات الحفظ تُفتح للعامة بعد اعتماد المصدر والترخيص والمراجعة."
        />
      </SectionTemplatePage>
    </UtilityScreen>
  );
}
