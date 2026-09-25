import { Link } from "wouter";
import { toArabicDigits } from "@/lib/utils";
import { ScreenTitle, SupportingText, LabelText, Caption } from "@/components/design-system/text";

export type CollectionCrumb = {
  label: string;
  href?: string;
};

type Props = {
  eyebrow: string;
  title: string;
  lead?: string;
  crumbs?: CollectionCrumb[];
};

export function CollectionHero({ eyebrow, title, lead, crumbs }: Props) {
  return (
    <header className="kc-hero">
      {crumbs && crumbs.length > 0 ? (
        <nav aria-label="مسار التصفح">
          <ol className="kc-hero__crumb">
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <li key={`${c.label}-${i}`}>
                  {last || !c.href ? (
                    <span aria-current={last ? "page" : undefined}>{c.label}</span>
                  ) : (
                    <Link href={c.href}>{c.label}</Link>
                  )}
                  {!last ? <span aria-hidden="true"> · </span> : null}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}
      <LabelText as="p" className="kc-hero__eyebrow">
        {eyebrow}
      </LabelText>
      <ScreenTitle as="h1" className="kc-hero__title">
        {title}
      </ScreenTitle>
      {lead ? (
        <SupportingText as="p" className="kc-hero__lead">
          {lead}
        </SupportingText>
      ) : null}
    </header>
  );
}

type StatsProps = {
  doors: number;
  topics: number;
  levelLabel?: string;
  doorsLabel?: string;
  topicsLabel?: string;
};

export function CollectionStats({
  doors,
  topics,
  levelLabel = "تدرّج ميسر",
  doorsLabel = "بابًا",
  topicsLabel = "موضوعًا",
}: StatsProps) {
  return (
    <ul className="kc-stats" aria-label="إحصاءات المجموعة">
      <li className="kc-stats__item">
        <LabelText as="span" className="kc-stats__value">
          {toArabicDigits(doors)}
        </LabelText>
        <Caption as="span" className="kc-stats__label">
          {doorsLabel}
        </Caption>
      </li>
      <li className="kc-stats__item">
        <LabelText as="span" className="kc-stats__value">
          {toArabicDigits(topics)}
        </LabelText>
        <Caption as="span" className="kc-stats__label">
          {topicsLabel}
        </Caption>
      </li>
      <li className="kc-stats__item">
        <LabelText as="span" className="kc-stats__value">
          {levelLabel}
        </LabelText>
        <Caption as="span" className="kc-stats__label">
          المستوى
        </Caption>
      </li>
    </ul>
  );
}
