import { Link } from "wouter";
import { Network } from "lucide-react";
import { Widget } from "@/components/widgets/Widget";
import "@/styles/components/home/home-mindmap.css";

export function HomeMindMapSection() {
  return (
    <Widget
      id="mind-map"
      className="hmm-section"
      eyebrow="التعلم المرئي"
      title="استكشف المعرفة"
      moreHref="/knowledge-graph"
      moreLabel="افتح الشبكة"
      state="ready"
    >
      <div className="hmm-grid">
        <Link href="/knowledge-graph" className="hmm-card">
          <div className="hmm-card__icon" aria-hidden="true">
            <Network size={24} strokeWidth={1.6} />
          </div>
          <div className="hmm-card__body">
            <span className="hmm-card__tag">مرئي</span>
            <strong className="hmm-card__title">شبكة المعرفة الإسلامية</strong>
            <p className="hmm-card__desc">
              استكشف العلاقات بين العلوم والمفاهيم الشرعية برسم بياني تفاعلي
            </p>
          </div>
          <span className="hmm-card__arrow" aria-hidden="true">←</span>
        </Link>
      </div>
    </Widget>
  );
}
