/**
 * شريط أعداد المحتوى من content-counts.json (مولَّد من السجلات، لا أرقام ثابتة يدويًا).
 */
import { Link } from "wouter";
import contentCounts from "@/data/content-counts.json";
import { PROPHETS } from "@/lib/prophets-data";
import { toArabicDigits } from "@/lib/utils";

const STATS = [
  { href: "/library", label: "كتابًا", value: contentCounts.books },
  { href: "/scholars", label: "عالمًا", value: contentCounts.scholars },
  { href: "/adhkar", label: "ذكرًا", value: contentCounts.adhkar },
  { href: "/rulings", label: "حكمًا", value: contentCounts.rulings },
  { href: "/prophets", label: "قصة نبي", value: PROPHETS.length },
] as const;

export function HomeLiveStatsStrip() {
  return (
    <section className="home-live-stats" aria-label="أعداد المحتوى">
      <ul className="home-live-stats__list">
        {STATS.map((s) => (
          <li key={s.href}>
            <Link href={s.href} className="home-live-stats__item">
              <strong>{toArabicDigits(s.value)}</strong>
              <span>{s.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="home-live-stats__note" role="note">
        الأرقام من فهرس المحتوى المحدَّث مع البناء، وليست تقديرات تسويقية.
      </p>
    </section>
  );
}
