import {
  BookOpen,
  Droplets,
  Scale,
  Moon,
  Landmark,
  Handshake,
  ScrollText,
  Heart,
  Gavel,
  Shield,
  Utensils,
  HandHelping,
  type LucideIcon,
} from "lucide-react";
import { formatMasailCount, formatAbwabCount } from "@/lib/arabic-count";
import {
  fiqhDoorGroup,
  type FiqhCanonicalDoor,
  type FiqhDoorSummary,
} from "@/lib/fiqh/fiqhNormalize";
import { cn } from "@/lib/utils";
import { SectionEntryCard } from "@/components/ui/HubCard";

type Props = {
  door: FiqhDoorSummary;
  className?: string;
  featured?: boolean;
};

const DOOR_ICONS: Partial<Record<FiqhCanonicalDoor, LucideIcon>> = {
  tahara: Droplets,
  salah: BookOpen,
  janaza: ScrollText,
  zakat: HandHelping,
  sawm: Moon,
  hajj: Landmark,
  jihad: Shield,
  buyu: Handshake,
  faraid: ScrollText,
  nikah: Heart,
  talaq: Heart,
  iddah_rida: Heart,
  nafaqat: Heart,
  jinayat: Gavel,
  diyat: Scale,
  hudud: Gavel,
  atima: Utensils,
  ayman: ScrollText,
  itikaf: Moon,
  udhiya: Landmark,
  sayd: Utensils,
  qada: Scale,
  shahadat: Scale,
  iqrar: Scale,
  usul: BookOpen,
  qawaid: Scale,
  nawazil: ScrollText,
};

const SUPPORTING_DOORS = new Set<FiqhCanonicalDoor>(["usul", "qawaid", "nawazil"]);

export function FiqhCategoryCard({ door, className, featured = false }: Props) {
  const entryHref = door.bookHref ?? door.href;
  const group = fiqhDoorGroup(door.id);
  const Icon = DOOR_ICONS[door.id] ?? BookOpen;
  const hasContent = door.hasVerifiedIssueCount && door.issueCount > 0;
  const metaLabel = SUPPORTING_DOORS.has(door.id)
    ? formatAbwabCount(door.issueCount)
    : formatMasailCount(door.issueCount);

  return (
    <SectionEntryCard
      href={entryHref}
      title={door.label}
      description={door.desc}
      meta={hasContent ? metaLabel : undefined}
      Icon={Icon}
      featured={featured}
      className={cn(
        "fiqh-category-card",
        `fiqh-category-card--${group}`,
        featured && "fiqh-category-card--featured",
        `fiqh-category-card--${door.id}`,
        className,
      )}
    />
  );
}
