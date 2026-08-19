import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { SectionTemplatePage, TopicCard } from "@/components/topic/TopicPage";
import { TARIKH_ISLAMI } from "@/lib/tarikh-islami-data";
import type { DarsItem } from "@/lib/dars-types";

type TabId = "tarikh" | "mudun" | "muassasat" | "tarikh-hadara" | "azamat" | "manhaj";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "tarikh", label: "العصور والدول" },
  { id: "mudun", label: "المدن" },
  { id: "muassasat", label: "المؤسسات" },
  { id: "tarikh-hadara", label: "الحضارة والنظم" },
  { id: "azamat", label: "الأزمات" },
  { id: "manhaj", label: "المنهج" },
];

const RELATED = [
  {
    href: "/tarikh-islami",
    title: "التاريخ الإسلامي والحضارة",
    description: "عصور ودول ومدن ومؤسسات ونظم — فهرس دراسي منضبط",
    badge: "أنت هنا",
    isCurrent: true,
  },
  {
    href: "/seerah",
    title: "السيرة النبوية",
    description: "حياة النبي ﷺ من المولد إلى الوفاة في مراحل متتابعة",
    badge: "سيرة",
  },
  {
    href: "/nations",
    title: "الأمم السابقة",
    description: "قصص الأمم في القرآن بضابط الرواية لا الإسرائيليات",
    badge: "قصص",
  },
  {
    href: "/tawhid",
    title: "العقيدة والتوحيد",
    description: "أصول الإيمان والتوحيد على منهج أهل السنة",
    badge: "عقيدة",
  },
  {
    href: "/methodology",
    title: "منهج الموقع",
    description: "ضوابط النقل والتمحيص في أبواب السيرة والتاريخ",
    badge: "منهج",
  },
];

const MANHAJ_CARDS: Array<{ title: string; body: string }> = [
  {
    title: "تمحيص الروايات",
    body: "نروي الوقائع بعد تمحيص الروايات؛ فما ثبت في المغازي المعتمدة يُقدَّم، وما كان من المراسيل أو الحكايات يُذكر بتحفّظ ولا يُبنى عليه حكمٌ تعبّدي.",
  },
  {
    title: "الصحابة والفتن",
    body: "نضبط الكلام في الصحابة رضي الله عنهم والفتن بضوابط أهل السنة: الكفّ عما شجر مع حفظ مقامهم، وترك الخوض الذي يفتح باب الطعن.",
  },
  {
    title: "اجتناب الإسرائيليات",
    body: "نجتنب الإسرائيليات والحكايات الواهية وما لا سند له، ولا نملأ الفراغ التاريخي بما لم يثبت.",
  },
  {
    title: "لا تنزيل على المعاصرين",
    body: "لا ننزّل نصوص التاريخ وأحكامه على أعيان معاصرين بلا دليل؛ التاريخ ذاكرة وعبرة لا مادة خصومة.",
  },
  {
    title: "صلة السيرة بالحضارة",
    body: "السيرة أصل هذا الباب: الدولة الأولى في المدينة، ثم العصور من الراشدين فما بعد. للتفاصيل النبوية المعتمدة راجع صفحة السيرة، ولضوابط النقل راجع منهج الموقع.",
  },
];

function lessonText(item: DarsItem): string {
  const raw = (item.summary || item.body || "").trim();
  return raw || item.title;
}

export default function TarikhIslamiPage() {
  const [activeTab, setActiveTab] = useState<TabId>("tarikh");

  const sectionById = useMemo(
    () => Object.fromEntries(TARIKH_ISLAMI.map((s) => [s.id, s])),
    [],
  );

  useEffect(() => {
    applyPageSeo({
      path: "/tarikh-islami",
      title: "التاريخ الإسلامي والحضارة | المجلس العلمي",
      description:
        "فهرس دراسي في عصور الإسلام ودوله ومدنه ومؤسساته ونظمه الحضارية، مع ضوابط أهل السنة في الرواية والصحابة والفتن.",
      keywords: ["التاريخ الإسلامي", "الحضارة الإسلامية", "الخلافة", "المدن الإسلامية", "الوقف"],
    });
  }, []);

  const current = activeTab === "manhaj" ? null : sectionById[activeTab];

  return (
    <SectionTemplatePage
      route="/tarikh-islami"
      eyebrow="السيرة والتاريخ"
      title="التاريخ الإسلامي والحضارة"
      subtitle="عصور ودول ومدن ومؤسسات ونظم — نروي بعد التمحيص ولا نملأ الفراغ بما لم يثبت"
      groupTitle="أبواب التاريخ والحضارة"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as TabId)}
      syncTabParam
      relatedTopics={RELATED}
    >
      {activeTab === "manhaj" ? (
        <>
          <p className="topic-card__body">
            هذا القسم فهرس عناوين يُستكمل تدريجيًا. للتفاصيل المعتمدة في السيرة النبوية انظر{" "}
            <Link href="/seerah">السيرة</Link>
            ، ولضوابط النقل انظر{" "}
            <Link href="/methodology">منهج الموقع</Link>.
          </p>
          {MANHAJ_CARDS.map((c) => (
            <TopicCard key={c.title} title={c.title} body={c.body} />
          ))}
        </>
      ) : current ? (
        <>
          <p className="topic-card__body">
            {current.icon} {current.title} — {current.lessons.length} موضوعًا.
          </p>
          {current.lessons.map((item, i) => (
            <TopicCard
              key={item.id}
              title={`${i + 1}. ${item.title}`}
              body={lessonText(item)}
            />
          ))}
        </>
      ) : null}

      {activeTab === "tarikh" ? (
        <SectionQuiz sectionId="islamic-history" title="اختبر معلوماتك في التاريخ الإسلامي" count={4} />
      ) : null}

      <ShareButtons
        title="التاريخ الإسلامي والحضارة — المجلس العلمي"
        url="https://www.majlisilm.com/tarikh-islami"
      />
    </SectionTemplatePage>
  );
}
