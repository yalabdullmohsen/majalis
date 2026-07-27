import { useEffect } from "react";
import { Link } from "wouter";
import { BookUser, Landmark, Scale, Shield, Star } from "lucide-react";
import { PageHeader } from "@/components/ui-common";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/pages/library.css";

const LEARN_SECTIONS = [
  {
    href: "/fiqh",
    label: "الفقه والأحكام",
    desc: "مداخل الفقه، العبادات، وموسوعة الأحكام الشرعية الموثّقة.",
    Icon: Scale,
  },
  {
    href: "/seerah",
    label: "السيرة النبوية",
    desc: "سيرة النبي ﷺ ومغازيه وشمائله بضوابط الرواية والتمحيص.",
    Icon: BookUser,
  },
  {
    href: "/tawhid",
    label: "العقيدة",
    desc: "التوحيد وأنواعُه ومسائل العقيدة على منهج أهل السنة.",
    Icon: Shield,
  },
  {
    href: "/prophets",
    label: "قصص الأنبياء",
    desc: "قصص الأنبياء المذكورين في القرآن للعبرة والاقتداء.",
    Icon: Star,
  },
  {
    href: "/nations",
    label: "الأمم السابقة",
    desc: "أخبار الأمم في القرآن والسنة الصحيحة وما فيها من عبر.",
    Icon: Landmark,
  },
] as const;

export default function LearnHubPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/learn",
      title: "تعلّم | المجلس العلمي",
      description:
        "بوابة التعلّم: الفقه والأحكام، السيرة النبوية، العقيدة، قصص الأنبياء، والأمم السابقة.",
      keywords: [
        "تعلّم",
        "الفقه والأحكام",
        "السيرة النبوية",
        "العقيدة",
        "قصص الأنبياء",
        "الأمم السابقة",
        "المجلس العلمي",
      ],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "تعلّم",
          url: "https://www.majlisilm.com/learn",
          description:
            "أقسام التعلّم الأساسية: فقه وأحكام، سيرة، عقيدة، قصص أنبياء، وأمم سابقة",
          hasPart: LEARN_SECTIONS.map((s) => ({
            "@type": "WebPage",
            name: s.label,
            url: `https://www.majlisilm.com${s.href}`,
          })),
        },
      ],
    });
  }, []);

  return (
    <div className="page-shell lrn-hub">
      <PageHeader
        eyebrow="بوابة التعلّم"
        title="تعلّم"
        subtitle="اختر بابًا: الفقه والأحكام، السيرة، العقيدة، قصص الأنبياء، والأمم السابقة."
      />

      <nav className="lrn-hub-grid" aria-label="أقسام التعلّم">
        {LEARN_SECTIONS.map(({ href, label, desc, Icon }) => (
          <Link key={href} href={href} className="lrn-hub-card">
            <div className="lrn-hub-card__icon">
              <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
            </div>
            <h2 className="lrn-hub-card__title">{label}</h2>
            <p className="lrn-hub-card__desc">{desc}</p>
          </Link>
        ))}
      </nav>
    </div>
  );
}
