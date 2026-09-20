import { useEffect } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";
import { KnowledgeSummaryCard } from "@/components/knowledge/KnowledgeSummaryCard";
import { MADHAHIB } from "@/data/madhahib";
import { saveKnowledgeListState } from "@/lib/knowledge-list-scroll";
import "@/styles/pages/madhahib.css";
import { UtilityScreen } from "@/components/design-system/screens";

const LIST_PATH = "/madhahib";

export default function MadhahibPage() {
  useEffect(() => {
    applyPageSeo({
      path: LIST_PATH,
      title: "المذاهب الفقهية الأربعة | سُنّة",
      description:
        "تعرَّف على المذاهب الفقهية الأربعة: الحنفي والمالكي والشافعي والحنبلي؛ مع بيان منهج كل مذهب ومصادره؛ مرجع في المذاهب الفقهية الأربعة.",
      keywords: ["مذاهب فقهية", "فقه إسلامي", "حنفي مالكي شافعي حنبلي", "أصول الفقه"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "المذاهب الفقهية الأربعة",
          description:
            "المذاهب الفقهية الأربعة: الحنفي والمالكي والشافعي والحنبلي؛ مع بيان منهج كل مذهب ومصادره ومؤسسيه وانتشاره الجغرافي — للتعلم.",
          numberOfItems: MADHAHIB.length,
          itemListElement: MADHAHIB.map((m, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `${m.fullName} — ${m.founder}`,
            url: `https://www.ssunnah.com${LIST_PATH}/${m.id}`,
          })),
        },
      ],
    });
  }, []);

  const persistBeforeNavigate = () => {
    saveKnowledgeListState(LIST_PATH, {
      scrollY: typeof window !== "undefined" ? window.scrollY : 0,
    });
  };

  return (
    <UtilityScreen compose="mark">
      <main className="mdb-page" dir="rtl">
        <section className="mdb-hero">
          <div className="mdb-hero__badge">الفقه الإسلامي</div>
          <h1 className="mdb-hero__title">المذاهب الفقهية الأربعة</h1>
          <p className="mdb-hero__sub">
            المذاهب الأربعة من ثمار الاجتهاد الفقهي في الإسلام، كلها قائمة على الكتاب والسنة
            والإجماع، تختلف في بعض الأصول والتفريعات، ويجمعها الولاء لمنهج أهل السنة والجماعة.
            والخلاف بينها في الفروع سائغ معتبر مع بيان الراجح بدليله عند حاجة العمل، وحفظ مقام
            المخالف.
          </p>
        </section>

        <div className="mdb-list mdb-list--summary">
          {MADHAHIB.map((m) => (
            <KnowledgeSummaryCard
              key={m.id}
              id={m.id}
              href={`${LIST_PATH}/${m.id}`}
              title={m.fullName}
              icon={m.icon}
              category="مذهب فقهي"
              summary={m.summary}
              onNavigate={persistBeforeNavigate}
            />
          ))}
        </div>

        <div className="mdb-notice">
          <p>
            جميع المذاهب الأربعة مذاهب معتبرة في الإسلام، والاختلاف المعتبر بينها من سعة الشريعة
            ورحمة الاجتهاد المنضبط. المسلم يتبع مذهبه بعلم أو يسأل أهل العلم في بلده.
          </p>
        </div>

        <div className="twh-share">
          <ShareButtons
            title="المذاهب الفقهية الأربعة — سُنّة"
            url={`https://www.ssunnah.com${LIST_PATH}`}
          />
        </div>

        <section className="mdb-related">
          <h2 className="mdb-related__title">استكشف أيضاً</h2>
          <div className="mdb-related__grid">
            {[
              { href: "/fiqh", label: "الفقه الإسلامي" },
              { href: "/fiqh-qawaid", label: "القواعد الفقهية" },
              { href: "/hadith-science", label: "مصطلح الحديث" },
              { href: "/tawhid", label: "التوحيد والعقيدة" },
              { href: "/arkan", label: "أركان الإسلام" },
              { href: "/tarikh-islami", label: "التاريخ الإسلامي" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="mdb-related__link">
                {label}
              </Link>
            ))}
          </div>
        </section>
        <RelatedKnowledge kind="fatwa" query="المذاهب الفقهية" title="معرفة ذات صلة بالمذاهب" limit={6} />
        <div className="px-4 pb-6 mt-4">
          <SectionQuiz sectionId="fiqh" title="اختبر معلوماتك في المذاهب الفقهية" count={4} />
        </div>
      </main>
    </UtilityScreen>
  );
}
