import { Link } from "wouter";
import { ScientificAnnouncementCard } from "@/components/scientific/ScientificAnnouncementCard";
import { getScientificAnnouncements } from "@/lib/scientific-announcements";

type Props = {
  limit?: number;
  showViewAll?: boolean;
  className?: string;
};

export function ScientificAnnouncementsSection({
  limit,
  showViewAll = true,
  className = "",
}: Props) {
  const items = getScientificAnnouncements();
  const visible = limit ? items.slice(0, limit) : items;

  return (
    <section
      id="scientific-announcements"
      className={`sci-ann-section ${className}`.trim()}
      aria-labelledby="scientific-announcements-heading"
    >
      <div className="sci-ann-section__head">
        <div>
          <p className="home-eyebrow">إعلانات رسمية</p>
          <h2 id="scientific-announcements-heading">إعلانات ودروس علمية</h2>
          <p className="sci-ann-section__lead">
            دروس ومحاضرات ودورات مستخرجة من الإعلانات الرسمية — مع التفاصيل والمواعيد.
          </p>
        </div>
        {showViewAll && (
          <Link href="/lessons#scientific-announcements" className="home-section-link">
            عرض الكل
          </Link>
        )}
      </div>

      <div className="sci-ann-grid">
        {visible.map((item) => (
          <ScientificAnnouncementCard key={item.id} item={item} compact={Boolean(limit)} />
        ))}
      </div>
    </section>
  );
}

export default ScientificAnnouncementsSection;
