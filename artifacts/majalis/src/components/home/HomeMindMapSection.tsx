import { Link } from "wouter";
import { BookMarked, Brain } from "lucide-react";
import { Widget } from "@/components/widgets/Widget";
import "@/styles/components/home/home-mindmap.css";

const MAPS = [
  {
    href: "/quran-knowledge",
    Icon: BookMarked,
    title: "القرآن وعلومه",
    desc: "فهرس القرآن وعلومه وأسباب النزول وقصص السور",
    tag: "قسم",
  },
  {
    href: "/memorization",
    Icon: Brain,
    title: "الحفظ والمراجعة",
    desc: "اختبارات الحفظ وخطط الحفظ والمراجعة",
    tag: "قسم",
  },
] as const;

export function HomeMindMapSection() {
  return (
    <Widget
      id="mind-map"
      className="hmm-section"
      eyebrow="أقسام مقترحة"
      title="تابع التعلم"
      moreHref="/quran-knowledge"
      moreLabel="القرآن وعلومه"
      state="ready"
    >
      <div className="hmm-grid">
        {MAPS.map(({ href, Icon, title, desc, tag }) => (
          <Link key={href} href={href} className="hmm-card">
            <div className="hmm-card__icon" aria-hidden="true">
              <Icon size={24} strokeWidth={1.6} />
            </div>
            <div className="hmm-card__body">
              <span className="hmm-card__tag">{tag}</span>
              <strong className="hmm-card__title">{title}</strong>
              <p className="hmm-card__desc">{desc}</p>
            </div>
            <span className="hmm-card__arrow" aria-hidden="true">←</span>
          </Link>
        ))}
      </div>
    </Widget>
  );
}
