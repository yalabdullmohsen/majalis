"use client";

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, BadgeCheck, AlertTriangle, Ban } from "lucide-react";
import { PageHeader } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
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
    accent: "#0E6E52",
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
      title: "الأحاديث النبوية — صحيحة وضعيفة وموضوعة | المجلس العلمي",
      description: "قسم الأحاديث النبوية في المجلس العلمي: الأحاديث الصحيحة، والأحاديث الضعيفة، والأحاديث الموضوعة والمكذوبة — مصنّفة ومفصولة لمنع الاختلاط.",
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
        subtitle="ثلاثة أقسام مستقلة ومفصولة: الصحيحة، ثم الضعيفة، ثم الموضوعة والمكذوبة — لمنع أي اختلاط."
      />

      <div className="hadith-index-grid">
        {SECTIONS.map((s) => {
          const meta = HADITH_CLASS_META[s.cls];
          const count = counts[s.cls];
          const Icon = s.Icon;
          return (
            <Link key={s.cls} href={s.href} className="hadith-index-card" style={{ borderTopColor: s.accent }}>
              <span className="hadith-index-card__icon" style={{ background: s.accent }} aria-hidden="true">
                <Icon size={22} strokeWidth={2} color="#fff" />
              </span>
              <h2 className="hadith-index-card__title" style={{ color: s.accent }}>{meta.title}</h2>
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
    </div>
  );
}
