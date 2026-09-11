import { useEffect } from "react";
import { Link } from "wouter";
import {
  Baby,
  BookOpen,
  Sparkles,
  Star,
  Heart,
  HelpCircle,
  ChevronLeft,
} from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/pages/kids.css";
import { DashboardScreen } from "@/components/design-system/screens";

const KIDS_ENTRIES = [
  {
    href: "/prophets",
    title: "قصص الأنبياء",
    desc: "من آدم إلى محمد ﷺ — قصص ميسّرة بعبر واضحة.",
    Icon: Star,
  },
  {
    href: "/adhkar",
    title: "أذكار يومية",
    desc: "أذكار الصباح والمساء والنوم بصيغ مختصرة مناسبة.",
    Icon: Heart,
  },
  {
    href: "/quran-hub",
    title: "القرآن الكريم",
    desc: "المصحف والاستماع وقراءة ميسّرة بمرافقة ولي الأمر.",
    Icon: BookOpen,
  },
  {
    href: "/quiz",
    title: "أسئلة سين جيم",
    desc: "أسئلة قصيرة للمراجعة مع الأسرة — اختر ما يناسب العمر.",
    Icon: HelpCircle,
  },
  {
    href: "/stories",
    title: "قصص إيمانية",
    desc: "قصص مختارة تُقرّب المعاني دون مسائل خلافية ثقيلة.",
    Icon: Sparkles,
  },
] as const;

/**
 * ركن الأطفال — مدخل مخصّص يوجّه لصغار السن نحو محتوى موجود وآمن.
 * لا يُنسب حكم قطعي بلا مصدر؛ المحتوى التفصيلي في الصفحات المرتبطة.
 */
export default function KidsPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/kids",
      title: "ركن الأطفال | سُنّة",
      description:
        "ركن الأطفال في سُنّة: قصص أنبياء وأذكار وقرآن وأسئلة ميسّرة بمرافقة ولي الأمر.",
      keywords: ["الأطفال", "قصص الأنبياء", "أذكار الأطفال", "تعليم إسلامي"],
      robots: "index, follow",
    });
  }, []);

  return (
    <DashboardScreen compose="mark">
    <div className="kids-hub-page" dir="rtl">
      <section className="kids-hub-intro soft-card soft-card--on-light mj-framed" aria-labelledby="kids-title">
        <Baby size={36} className="kids-hub-intro__icon" aria-hidden="true" />
        <h1 id="kids-title" className="kids-hub-intro__title">
          ركن الأطفال
        </h1>
        <p className="kids-hub-intro__sub">
          مداخل ميسّرة لصغار السن من محتوى المنصة — بمرافقة ولي الأمر، وبلا مسائل
          خلافية ثقيلة في هذا الركن.
        </p>
      </section>

      <nav className="kids-hub-grid" aria-label="مداخل ركن الأطفال">
        {KIDS_ENTRIES.map(({ href, title, desc, Icon }) => (
          <Link key={href} href={href} className="kids-hub-card soft-card soft-card--on-light">
            <span className="kids-hub-card__icon" aria-hidden="true">
              <Icon size={22} strokeWidth={1.8} />
            </span>
            <span className="kids-hub-card__body">
              <span className="kids-hub-card__title">{title}</span>
              <span className="kids-hub-card__desc">{desc}</span>
            </span>
            <ChevronLeft size={18} className="kids-hub-card__chevron" aria-hidden="true" />
          </Link>
        ))}
      </nav>
    </div>
    </DashboardScreen>
  );
}
