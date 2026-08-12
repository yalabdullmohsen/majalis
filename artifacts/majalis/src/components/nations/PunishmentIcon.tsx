import {
  CloudRain,
  Wind,
  Volume2,
  Waves,
  Zap,
  ArrowDownToLine,
  RotateCcw,
  CloudLightning,
  Cloud,
  Bird,
  Split,
  ShieldCheck,
  Clock,
  HelpCircle,
} from "lucide-react";
import type { PunishmentType } from "@/lib/nations-seed";

/**
 * أيقونة متجهة لكل نوع عقوبة — مجردة رمزية بلا أي تجسيد لبشر أو ملائكة،
 * ولا صور مخيفة، التزاماً بضوابط القسم.
 */
const MAP: Record<PunishmentType, typeof CloudRain> = {
  "الطوفان": CloudRain,
  "الريح العقيم": Wind,
  "الصيحة": Volume2,
  "الرجفة": Waves,
  "الصاعقة": Zap,
  "الخسف": ArrowDownToLine,
  "قلب القرى": RotateCcw,
  "الحاصب": CloudLightning,
  "الغرق": Waves,
  "الظلة": Cloud,
  "المسخ": HelpCircle,
  "طير أبابيل": Bird,
  "تفريق وسيل العرم": Split,
  "النجاة والإيمان": ShieldCheck,
  "غير مفصل": HelpCircle,
  "لم يقع بعد": Clock,
};

export function PunishmentIcon({
  type,
  className,
  size = 22,
}: {
  type: PunishmentType;
  className?: string;
  size?: number;
}) {
  const Icon = MAP[type] ?? HelpCircle;
  return <Icon className={className} size={size} aria-hidden="true" focusable="false" />;
}

export default PunishmentIcon;
