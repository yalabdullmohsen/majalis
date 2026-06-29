/**
 * Unified Lucide icon registry — single library, no emoji in UI.
 */
import {
  Book,
  BookOpen,
  Calendar,
  CircleDot,
  Clock,
  Compass,
  Download,
  Flame,
  Gamepad2,
  GraduationCap,
  Hand,
  Headphones,
  Heart,
  Library,
  Mic2,
  Moon,
  Pause,
  Play,
  Radio,
  ScrollText,
  Search,
  Sparkles,
  Star,
  Sun,
  Users,
  Volume2,
  type LucideIcon,
} from "lucide-react";

export const Icons = {
  book: Book,
  bookOpen: BookOpen,
  calendar: Calendar,
  circleDot: CircleDot,
  clock: Clock,
  compass: Compass,
  download: Download,
  flame: Flame,
  gamepad: Gamepad2,
  graduationCap: GraduationCap,
  hand: Hand,
  headphones: Headphones,
  heart: Heart,
  library: Library,
  mic: Mic2,
  moon: Moon,
  pause: Pause,
  play: Play,
  radio: Radio,
  scroll: ScrollText,
  search: Search,
  sparkles: Sparkles,
  star: Star,
  sun: Sun,
  users: Users,
  volume: Volume2,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof Icons;

const LEGACY_MAP: Record<string, IconName> = {
  "book-open": "bookOpen",
  book: "book",
  library: "library",
  users: "users",
  search: "search",
  sparkles: "sparkles",
  hands: "hand",
  hand: "hand",
  clock: "clock",
  "circle-dot": "circleDot",
  radio: "radio",
  scroll: "scroll",
  compass: "compass",
  gamepad: "gamepad",
  "graduation-cap": "graduationCap",
  mic: "mic",
  headphones: "headphones",
};

export function resolveIcon(name: string): LucideIcon {
  const key = LEGACY_MAP[name] || (name as IconName);
  return Icons[key] || Icons.bookOpen;
}

type IconProps = {
  name: IconName | string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  "aria-hidden"?: boolean;
};

export function Icon({ name, size = 20, strokeWidth = 1.75, className }: IconProps) {
  const Cmp = resolveIcon(name);
  return <Cmp size={size} strokeWidth={strokeWidth} className={className} aria-hidden />;
}
