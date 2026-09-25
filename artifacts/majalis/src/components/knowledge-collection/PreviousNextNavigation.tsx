import { Link } from "wouter";

type NavItem = {
  href: string;
  title: string;
} | null;

type Props = {
  previous: NavItem;
  next: NavItem;
};

function Slot({
  dir,
  title,
  href,
}: {
  dir: string;
  title: string;
  href?: string;
}) {
  if (href) {
    return (
      <Link href={href}>
        <span className="kc-nav__dir">{dir}</span>
        <span className="kc-nav__title">{title}</span>
      </Link>
    );
  }
  return (
    <span className="is-disabled" aria-disabled="true">
      <span className="kc-nav__dir">{dir}</span>
      <span className="kc-nav__title">{title}</span>
    </span>
  );
}

export function PreviousNextNavigation({ previous, next }: Props) {
  return (
    <nav className="kc-nav" aria-label="التنقل بين الموضوعات">
      <Slot dir="السابق" title={previous?.title ?? "—"} href={previous?.href} />
      <Slot dir="التالي" title={next?.title ?? "—"} href={next?.href} />
    </nav>
  );
}
