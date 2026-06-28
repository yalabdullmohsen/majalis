import type { CSSProperties } from "react";
import type { IbnQayyimRank } from "@/lib/prayer-ibn-qayyim-ranks";

type Props = { rank: IbnQayyimRank };

export function IbnQayyimRankCard({ rank }: Props) {
  return (
    <article
      className="ibn-qayyim-rank-card ui-card"
      style={{
        "--rank-color": rank.color,
        "--rank-color-soft": rank.colorSoft,
      } as CSSProperties}
    >
      <header className="ibn-qayyim-rank-card__head">
        <span className="ibn-qayyim-rank-card__num" aria-hidden>{rank.level}</span>
        <div>
          <p className="ibn-qayyim-rank-card__title">{rank.title}</p>
          <h2>{rank.name}</h2>
        </div>
        <span className="ibn-qayyim-rank-card__icon" aria-hidden>{rank.icon}</span>
      </header>

      <p className="ibn-qayyim-rank-card__summary">{rank.summary}</p>

      <blockquote className="ibn-qayyim-rank-card__source">
        <span className="ibn-qayyim-rank-card__source-label">من كلام ابن القيم — المعنى:</span>
        {rank.sourceText}
      </blockquote>

      <section className="ibn-qayyim-rank-card__block">
        <h3>العلامات التي تدل عليها</h3>
        <ul>
          {rank.signs.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className="ibn-qayyim-rank-card__block">
        <h3>وسائل الانتقال إلى المرتبة الأعلى</h3>
        <ul>
          {rank.ascentMeans.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className="ibn-qayyim-rank-card__ascend">
        <h3>كيف أرتقي؟</h3>
        <ol>
          {rank.howToAscend.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>
    </article>
  );
}
