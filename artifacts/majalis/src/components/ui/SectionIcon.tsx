/**
 * SectionIcon — نظام الأيقونات الموحّد
 * المصدر الوحيد لأيقونات الأقسام والبطاقات والقوائم.
 * يحوّل كل إيموجي معرّف إلى أيقونة Lucide أو SVG إسلامي مخصص.
 */
import {
  AlertTriangle, Award, Ban, Bandage, Bell, BookMarked, BookOpen,
  Brain, Briefcase, Calendar, CalendarDays, CheckCircle,
  Circle, ClipboardList, Clock, Crown, Dog, DoorOpen, Droplets,
  Dumbbell, Eye, FileText, FlaskConical, Flame, Flower2, Footprints,
  Frown, Gem, Gift, Globe, GraduationCap, Hand, Handshake, Hash,
  Headphones, Heart, HelpCircle, Home, Hospital, Key, Landmark,
  Laptop, LayoutGrid, Leaf, Library, Lightbulb,
  Link, Lock, Mail, MapPin, Medal, Megaphone, MessageCircle,
  MessageSquare, Moon, Mountain, Music, PawPrint, PersonStanding,
  Phone, PhoneOff, Pill, RefreshCw, RotateCcw, Ruler, Scale, ScrollText,
  Search, Shield, ShowerHead, Smile, Sparkles, Sprout, Star, Store,
  Stethoscope, Sunrise, Syringe, Target, Telescope, Tent,
  Timer, TreePine, Trees, TrendingUp, Trophy, UserRound,
  Utensils, Waves, Wheat, Wind, Wine, XCircle, Zap, Shirt, User,
  Banknote, Sun,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import type { FC } from "react";

// ── أيقونات إسلامية مخصصة ──────────────────────────────────────────────────

type SvgIconProps = { size?: number; className?: string };

function MosqueIcon({ size = 24, className = "" }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 21h18" />
      <path d="M5 21V10l7-7 7 7v11" />
      <path d="M10 21v-5a2 2 0 0 1 4 0v5" />
      <path d="M12 3c0-1.1-.9-2-2-2" />
      <path d="M12 3c0-1.1.9-2 2-2" />
      <circle cx="12" cy="3" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function KaabaIcon({ size = 24, className = "" }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="4" y="8" width="16" height="13" rx="1" />
      <path d="M4 8 12 4l8 4" />
      <path d="M4 12h16" />
      <path d="M10 21v-5a2 2 0 0 1 4 0v5" />
    </svg>
  );
}

function TasbihIcon({ size = 24, className = "" }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="3.5" r="1.5" />
      <circle cx="18.5" cy="8.5" r="1.5" />
      <circle cx="20.5" cy="15.5" r="1.5" />
      <circle cx="15.5" cy="21" r="1.5" />
      <circle cx="8.5" cy="21" r="1.5" />
      <circle cx="3.5" cy="15.5" r="1.5" />
      <circle cx="5.5" cy="8.5" r="1.5" />
      <path d="M12 5c3.5 0 6.5 3 7.2 7" />
      <path d="M19 17c-1.5 3-4.5 5-7 5" />
      <path d="M5 17c1.5 3 4.5 5 7 5" />
      <path d="M5 10c.7-4 3.7-7 7.2-7" />
    </svg>
  );
}

function PrayerHandsIcon({ size = 24, className = "" }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 2C10 4 7 7 7 12" />
      <path d="M12 2c2 2 5 5 5 10" />
      <path d="M7 12v5l5 5 5-5v-5" />
      <path d="M9 12v4" />
      <path d="M15 12v4" />
      <path d="M12 12v5" />
    </svg>
  );
}

function CrescentIcon({ size = 24, className = "" }: SvgIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      <path d="M17 4l.5-1 .5 1 1 .5-1 .5-.5 1-.5-1-1-.5Z" />
    </svg>
  );
}

// ── نوع موحّد للأيقونات ──────────────────────────────────────────────────────

type AnyIconFC = FC<SvgIconProps> | FC<LucideProps>;

// ── الخريطة الشاملة: إيموجي → مكوّن ─────────────────────────────────────────

const EMOJI_ICON_MAP: Record<string, AnyIconFC> = {
  // إسلامي مخصص
  "🕌": MosqueIcon,
  "🕋": KaabaIcon,
  "📿": TasbihIcon,
  "🤲": PrayerHandsIcon,
  "☪️": CrescentIcon,

  // سماوي وطبيعة
  "🌙": Moon,
  "🌑": Moon,
  "🌒": Moon,
  "🌕": Moon,
  "😴": Moon,
  "💤": Moon,
  "🌟": Star,
  "⭐": Star,
  "🌠": Star,
  "✨": Sparkles,
  "💫": Sparkles,
  "💅": Sparkles,
  "🌿": Leaf,
  "🌱": Sprout,
  "🌾": Wheat,
  "🌲": TreePine,
  "🌳": Trees,
  "🌺": Flower2,
  "🌸": Flower2,
  "🌷": Flower2,
  "🌹": Heart,
  "🌅": Sunrise,
  "🌄": Sunrise,
  "🌊": Waves,
  "🌍": Globe,
  "🌏": Globe,
  "🌌": Telescope,
  "🌈": Sun,
  "🌀": RefreshCw,

  // مباني ومواقع
  "🏠": Home,
  "🏡": Home,
  "💒": Home,
  "🏆": Trophy,
  "🏅": Medal,
  "🏦": Landmark,
  "🏛️": Landmark,
  "🏥": Hospital,
  "🏪": Store,
  "🏹": Target,
  "🚪": DoorOpen,
  "⛺": Tent,
  "⛰️": Mountain,
  "🪨": Mountain,
  "🗿": Mountain,

  // أشخاص وعلاقات
  "👨": User,
  "👩": User,
  "👧": UserRound,
  "👶": Heart,
  "👴": User,
  "👦": User,
  "💑": Heart,
  "🤰": Heart,
  "🤱": Heart,
  "🙇": User,
  "👼": Star,
  "🚶": PersonStanding,
  "🏃": PersonStanding,
  "👋": Hand,
  "👐": Handshake,
  "🤝": Handshake,
  "🙏": PrayerHandsIcon,

  // كتب وعلم
  "📖": BookOpen,
  "📜": ScrollText,
  "📚": Library,
  "📗": BookMarked,
  "📋": ClipboardList,
  "📝": FileText,
  "📐": Ruler,
  "📏": Ruler,
  "📈": TrendingUp,
  "🎓": GraduationCap,
  "🧠": Brain,

  // مال وأعمال
  "💰": Banknote,
  "💵": Banknote,
  "💼": Briefcase,
  "💎": Gem,
  "💍": Gem,

  // صحة وطب
  "🩺": Stethoscope,
  "🩸": Droplets,
  "🩹": Bandage,
  "💊": Pill,
  "💉": Syringe,
  "🤢": Frown,
  "🤮": Frown,
  "💪": Dumbbell,

  // ماء وطهارة
  "💧": Droplets,
  "💦": Droplets,
  "🚿": ShowerHead,
  "🚰": Droplets,
  "🚽": ShowerHead,

  // تقنية وأجهزة
  "💻": Laptop,
  "🔬": FlaskConical,
  "🔭": Telescope,

  // أدوات وأشياء
  "⚡": Zap,
  "⏰": Clock,
  "⏳": Timer,
  "🔔": Bell,
  "🔒": Lock,
  "🔐": Lock,
  "🔏": Lock,
  "🤐": Lock,
  "🔑": Key,
  "🔗": Link,
  "🔍": Search,
  "🔥": Flame,
  "🕯️": Flame,
  "🔄": RotateCcw,
  "📍": MapPin,
  "📅": CalendarDays,
  "📆": Calendar,
  "📣": Megaphone,
  "📢": Megaphone,
  "📞": Phone,
  "📵": PhoneOff,
  "💬": MessageCircle,
  "💭": MessageSquare,
  "💌": Mail,
  "💡": Lightbulb,
  "🎁": Gift,
  "🎯": Target,
  "🎵": Music,
  "🎧": Headphones,
  "🎙️": Megaphone,
  "🔮": Eye,
  "👁️": Eye,
  "🤫": Eye,

  // أيقونات منوّعة
  "⚖️": Scale,
  "🚫": Ban,
  "🔢": Hash,
  "👑": Crown,
  "🏄": Waves,
  "🦁": Shield,
  "🦅": Wind,
  "🦶": Footprints,
  "🐄": Leaf,
  "🐑": Leaf,
  "🐶": Dog,
  "🐷": PawPrint,
  "🐾": PawPrint,
  "🍺": Wine,
  "🥩": Utensils,
  "🧥": Shirt,
  "👘": Shirt,
  "🧱": LayoutGrid,

  // حالات ومشاعر → أيقونات مجردة
  "😊": Smile,
  "😌": Smile,
  "😇": Star,
  "😨": AlertTriangle,
  "😤": Wind,
  "😵": Frown,
  "💔": Heart,
  "💞": Heart,
  "💚": Heart,
  "🤍": Heart,
  "💙": Heart,
  "✅": CheckCircle,
  "❌": XCircle,
  "❓": HelpCircle,
  "⚫": Circle,
  "⚪": Circle,
  "🧹": Flame,
  "⚠️": AlertTriangle,
  "🎖️": Award,
};

// ── المكوّن الرئيسي ──────────────────────────────────────────────────────────

interface SectionIconProps {
  name: string;
  size?: number;
  className?: string;
}

export function SectionIcon({ name, size = 22, className = "" }: SectionIconProps) {
  const Comp = EMOJI_ICON_MAP[name];

  if (!Comp) {
    return <BookOpen size={size} className={className} aria-hidden="true" />;
  }

  // SVG إسلامي مخصص
  const isCustomSvg =
    Comp === MosqueIcon ||
    Comp === KaabaIcon ||
    Comp === TasbihIcon ||
    Comp === PrayerHandsIcon ||
    Comp === CrescentIcon;

  if (isCustomSvg) {
    const CustomComp = Comp as FC<SvgIconProps>;
    return <CustomComp size={size} className={className} />;
  }

  const LucideComp = Comp as FC<LucideProps>;
  return <LucideComp size={size} className={className} aria-hidden="true" />;
}

export default SectionIcon;
