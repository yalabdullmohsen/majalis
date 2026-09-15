import type { FiqhSource } from "@/lib/fiqh-books";
import type { FiqhContentStatus } from "@/lib/fiqh/fiqhNormalize";
import { cn } from "@/lib/utils";

type Props = {
  sources: FiqhSource[];
  /** حالة تحريرية داخلية — تُتجاهل في العرض العام */
  status?: FiqhContentStatus;
  className?: string;
};

export function FiqhSourceLine({ sources, status, className }: Props) {
  void status;

  if (!sources.length) {
    return (
      <div className={cn("fiqh-source-line fiqh-source-line--empty", className)}>
        <h2 className="fiqh-source-line__title">المصادر والمراجع</h2>
        <p className="fiqh-source-line__note">
          لم يُثبَّت مرجع علمي كافٍ بعد؛ لا يُعرض الحكم كرأي نهائي بلا مصدر.
        </p>
      </div>
    );
  }

  return (
    <section className={cn("fiqh-source-line", className)} aria-labelledby="fiqh-source-title">
      <div className="fiqh-source-line__head">
        <h2 id="fiqh-source-title" className="fiqh-source-line__title">
          المصادر والمراجع
        </h2>
      </div>
      <ul className="fiqh-source-line__list">
        {sources.map((source, index) => (
          <li key={`${source.book}-${source.ref}-${index}`}>
            <strong>{source.book}</strong>
            {source.author ? <span> — {source.author}</span> : null}
            {source.ref ? <span> · {source.ref}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
