import { Link } from "wouter";
import { mushafPageUrl } from "@/lib/mushaf/kuwait-mushaf-data";

type Props = {
  page: number;
  surah?: number;
  ayah?: number;
  label?: string;
  className?: string;
};

/** Platform integration — open ayah/page in mushaf reader */
export function OpenInMushafLink({ page, surah, ayah, label = "افتح في المصحف", className = "km-actions__btn" }: Props) {
  const href = mushafPageUrl(page, surah, ayah);
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export default OpenInMushafLink;
