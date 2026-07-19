import { useEffect, useState } from "react";
import { BookMarked } from "lucide-react";
import { getBenefitCards } from "@/lib/unified-content-service";
import type { AutoImportedContent } from "@/lib/auto-content/auto-content-utils";
import { Widget } from "@/components/widgets/Widget";

const BADGE_LABELS: Record<string, string> = {
  hadith: "حديث",
  benefit: "فائدة",
  tarbiyah: "تربية",
  tadabbur: "تدبر",
  sunnah: "سنة",
};

function guessBadge(item: AutoImportedContent): string {
  const text = `${item.title} ${item.summary || ""}`;
  if (text.includes("حديث") || text.includes("رواه")) return BADGE_LABELS.hadith;
  if (text.includes("تدبر")) return BADGE_LABELS.tadabbur;
  if (text.includes("سنة") || text.includes("السنة")) return BADGE_LABELS.sunnah;
  if (text.includes("تربية") || text.includes("تزكية")) return BADGE_LABELS.tarbiyah;
  return BADGE_LABELS.benefit;
}

export function HomeDailyBenefits() {
  const [items, setItems] = useState<AutoImportedContent[] | null>(null);

  useEffect(() => {
    let alive = true;
    getBenefitCards(6).then((data) => {
      if (alive) setItems(data);
    });
    return () => {
      alive = false;
    };
  }, []);

  const icon = (
    <span aria-hidden="true">
      <BookMarked size={18} strokeWidth={1.8} color="#173D35" />
    </span>
  );

  const state = items === null ? "loading" : items.length === 0 ? "empty" : "ready";

  return (
    <Widget
      id="daily-benefits"
      className="dmb"
      icon={icon}
      eyebrow="من معين العلم"
      title="فوائد منتقاة"
      state={state}
      emptyMessage="لا فوائد متاحة حاليًا."
    >
      {items && items.length > 0 && (
        <div className="dmb__grid">
          {items.map((item) => (
            <BenefitCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </Widget>
  );
}

function BenefitCard({ item }: { item: AutoImportedContent }) {
  const speaker = item.attribution_name || item.organization_name || "المصدر: الحساب الرسمي";
  return (
    <article className="dmb__card ui-card">
      {item.image_url && (
        <div className="dmb__card-media">
          <img src={item.image_url} alt="" loading="lazy" decoding="async" />
        </div>
      )}
      <span className="dmb__badge">{guessBadge(item)}</span>
      <p className="dmb__text">{item.summary || item.title}</p>
      <div className="dmb__meta">
        <span className="dmb__speaker">{speaker}</span>
        {item.source_published_at && (
          <span className="dmb__date">
            {new Intl.DateTimeFormat("ar", { dateStyle: "medium" }).format(new Date(item.source_published_at))}
          </span>
        )}
      </div>
      {item.original_url && (
        <a href={item.original_url} target="_blank" rel="noopener noreferrer" className="dmb__source-btn">
          قراءة المصدر ←
        </a>
      )}
    </article>
  );
}

export default HomeDailyBenefits;
