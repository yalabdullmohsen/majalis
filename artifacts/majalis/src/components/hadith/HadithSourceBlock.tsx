import { HadithGradeBadge } from "./HadithGradeBadge";

type Props = {
  source?: string | null;
  takhrij?: string | null;
  grade?: string | null;
  narrator?: string | null;
  title?: string;
  className?: string;
};

/** وحدة مستقلة: المصدر · التخريج · الحكم */
export function HadithSourceBlock({
  source,
  takhrij,
  grade,
  narrator,
  title = "مصدر الحديث",
  className = "",
}: Props) {
  if (!source && !takhrij && !grade && !narrator) return null;
  return (
    <aside className={`hdl-source-block ${className}`.trim()} aria-label={title}>
      <h3 className="hdl-source-block__title">{title}</h3>
      <dl>
        {narrator ? (
          <div className="hdl-source-block__row">
            <dt>الراوي</dt>
            <dd className="hdl-role--narrator">{narrator}</dd>
          </div>
        ) : null}
        {source ? (
          <div className="hdl-source-block__row">
            <dt>المصدر</dt>
            <dd className="hdl-role--source">{source}</dd>
          </div>
        ) : null}
        {takhrij ? (
          <div className="hdl-source-block__row">
            <dt>التخريج</dt>
            <dd>
              <span className="hdl-role--takhrij">{takhrij}</span>
            </dd>
          </div>
        ) : null}
        {grade ? (
          <div className="hdl-source-block__row">
            <dt>الحكم</dt>
            <dd>
              <HadithGradeBadge grade={grade} />
            </dd>
          </div>
        ) : null}
      </dl>
    </aside>
  );
}
