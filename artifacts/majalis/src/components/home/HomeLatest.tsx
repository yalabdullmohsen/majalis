import { Link } from "wouter";
import { SEED_FAWAID } from "@/lib/fawaid-seed";
import { SEED_QA } from "@/lib/qa-seed";
import { lessonAds } from "@/lib/lesson-ads";

type LatestItem = {
  id: string;
  title: string;
  meta: string;
  href: string;
  type: string;
};

export function HomeLatest() {
  const items: LatestItem[] = [
    ...lessonAds.slice(0, 2).map((ad) => ({
      id: ad.id,
      title: ad.title,
      meta: ad.teacher,
      href: "/announcements",
      type: "درس",
    })),
    ...SEED_FAWAID.slice(0, 2).map((f) => ({
      id: f.id,
      title: f.text.slice(0, 80) + (f.text.length > 80 ? "…" : ""),
      meta: f.category || "فائدة",
      href: "/fawaid",
      type: "فائدة",
    })),
    ...SEED_QA.slice(0, 2).map((q) => ({
      id: q.id,
      title: q.question,
      meta: q.qa_categories?.name || "سؤال",
      href: "/qa",
      type: "سؤال",
    })),
  ].slice(0, 6);

  return (
    <section className="home-section" aria-labelledby="home-latest-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">الجديد</p>
          <h2 id="home-latest-heading">أحدث الإضافات</h2>
        </div>
      </div>
      <div className="home-latest-grid">
        {items.map((item) => (
          <Link key={item.id} href={item.href} className="ui-card home-latest-card">
            <span className="home-tag">{item.type}</span>
            <h3>{item.title}</h3>
            <p>{item.meta}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
