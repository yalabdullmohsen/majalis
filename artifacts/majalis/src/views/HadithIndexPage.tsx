import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, BadgeCheck, AlertTriangle, Ban } from "lucide-react";
import { PageHeader } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { getVerifiedHadith } from "@/lib/supabase";
import { HADITH_CLASS_META, type HadithClass } from "./HadithPage";

type SectionDef = {
  cls: HadithClass;
  href: string;
  description: string;
  accent: string;
  Icon: typeof BadgeCheck;
};

// ثلاث قوائم مستقلة ومتتابعة بالترتيب المطلوب
const SECTIONS: SectionDef[] = [
  {
    cls: "sahih",
    href: "/hadith/sahih",
    description: "الأحاديث الصحيحة والحسنة الثابتة عن النبي ﷺ من مصادر موثوقة ومحققة.",
    accent: "#1F6E54",
    Icon: BadgeCheck,
  },
  {
    cls: "daif",
    href: "/hadith/daif",
    description: "الأحاديث الضعيفة الإسناد، تُبيَّن درجتها للتحذير من الاحتجاج بها.",
    accent: "#1F4D3A",
    Icon: AlertTriangle,
  },
  {
    cls: "mawdu",
    href: "/hadith/mawdu",
    description: "الأحاديث الموضوعة والمكذوبة على النبي ﷺ، يُحذَّر منها ولا تجوز نسبتها إليه.",
    accent: "#B91C1C",
    Icon: Ban,
  },
];

export default function HadithIndexPage() {
  const [counts, setCounts] = useState<Record<HadithClass, number | null>>({
    sahih: null,
    daif: null,
    mawdu: null,
  });

  useEffect(() => {
    applyPageSeo({
      path: "/hadith",
      title: "الأحاديث النبوية، صحيحة وضعيفة وموضوعة | المجلس العلمي",
      description: "قسم الأحاديث النبوية في المجلس العلمي: الأحاديث الصحيحة، والأحاديث الضعيفة، والأحاديث الموضوعة والمكذوبة، مصنّفة ومفصولة لمنع الاختلاط.",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "أقسام الأحاديث النبوية",
          description: "تصنيف الأحاديث النبوية إلى صحيح وضعيف وموضوع",
          numberOfItems: SECTIONS.length,
          itemListElement: SECTIONS.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: HADITH_CLASS_META[s.cls]?.title ?? s.cls,
            description: s.description,
            url: `https://majlisilm.com${s.href}`,
          })),
        },
      ],
    });
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all(
      SECTIONS.map((s) => getVerifiedHadith({ limit: 500, authenticityClass: s.cls }).then((r) => r.data?.length ?? 0)),
    )
      .then(([sahih, daif, mawdu]) => {
        if (active) setCounts({ sahih, daif, mawdu });
      })
      .catch(() => {
        if (active) setCounts({ sahih: 0, daif: 0, mawdu: 0 });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="السنة النبوية الشريفة"
        title="الأحاديث النبوية"
        subtitle="ثلاثة أقسام مستقلة ومفصولة: الصحيحة، ثم الضعيفة، ثم الموضوعة والمكذوبة، لمنع أي اختلاط."
      />

      <div className="hadith-index-grid">
        {SECTIONS.map((s) => {
          const meta = HADITH_CLASS_META[s.cls];
          const count = counts[s.cls];
          const Icon = s.Icon;
          return (
            <Link key={s.cls} href={s.href} className={`hadith-index-card hadith-index-card--${s.cls}`}>
              <span className="hadith-index-card__icon" aria-hidden="true">
                <Icon size={22} strokeWidth={2} color="#fff" />
              </span>
              <h2 className="hadith-index-card__title">{meta.title}</h2>
              <p className="hadith-index-card__desc">{s.description}</p>
              <span className="hadith-index-card__count">
                {count == null ? "…" : `${count.toLocaleString("ar-EG")} ${meta.countUnit}`}
              </span>
              <span className="hadith-index-card__go">
                تصفّح القسم <ArrowLeft size={16} aria-hidden="true" />
              </span>
            </Link>
          );
        })}
      </div>

      <div className="twh-share">
        <ShareButtons title="فهرس الأحاديث النبوية — المجلس العلمي" url="https://majlisilm.com/hadith-index" />
      </div>
    </div>
  );
}
