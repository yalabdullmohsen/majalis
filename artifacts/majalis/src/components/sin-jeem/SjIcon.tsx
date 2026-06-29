import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle2,
  CircleX,
  Crown,
  Flame,
  Gamepad2,
  Heart,
  Lightbulb,
  Medal,
  Pause,
  RefreshCw,
  Rocket,
  Scale,
  Sparkles,
  Star,
  Swords,
  Target,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  trophy: Trophy,
  zap: Zap,
  bolt: Zap,
  target: Target,
  brain: Brain,
  calendar: Calendar,
  gamepad: Gamepad2,
  swords: Swords,
  sparkles: Sparkles,
  flame: Flame,
  heart: Heart,
  crown: Crown,
  medal: Medal,
  "circle-check": CheckCircle2,
  "circle-x": CircleX,
  "book-open": BookOpen,
  library: BookOpen,
  scale: Scale,
  star: Star,
  lightbulb: Lightbulb,
  refresh: RefreshCw,
  rocket: Rocket,
  users: Users,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  pause: Pause,
};

export type SjIconName = keyof typeof ICON_MAP;

type Props = {
  name: SjIconName | string;
  size?: number;
  className?: string;
  strokeWidth?: number;
  "aria-hidden"?: boolean;
};

export function SjIcon({ name, size = 20, className, strokeWidth = 1.75, ...rest }: Props) {
  const Icon = ICON_MAP[name] || Sparkles;
  return <Icon size={size} className={className} strokeWidth={strokeWidth} aria-hidden={rest["aria-hidden"] ?? true} />;
}

export function categoryIconName(slug: string): SjIconName {
  const map: Record<string, SjIconName> = {
    quran: "book-open",
    tafsir: "book-open",
    hadith: "book-open",
    fiqh: "scale",
    aqeeda: "star",
    tajweed: "sparkles",
    seerah: "star",
    history: "book-open",
  };
  for (const [key, icon] of Object.entries(map)) {
    if (slug.includes(key)) return icon;
  }
  return "star";
}
