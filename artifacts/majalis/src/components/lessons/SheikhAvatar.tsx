import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { sheikhInitial } from "@/lib/current-lessons";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<Size, string> = {
  sm: "la-sheikh-avatar la-sheikh-avatar--sm",
  md: "la-sheikh-avatar la-sheikh-avatar--md",
  lg: "la-sheikh-avatar la-sheikh-avatar--lg",
  xl: "la-sheikh-avatar la-sheikh-avatar--xl",
};

type Props = {
  name: string;
  imageUrl?: string;
  size?: Size;
  className?: string;
};

export function SheikhAvatar({ name, imageUrl, size = "lg", className = "" }: Props) {
  const initial = sheikhInitial(name);
  const rootClass = [SIZE_CLASS[size], className].filter(Boolean).join(" ");

  return (
    <Avatar className={rootClass}>
      {imageUrl ? (
        <AvatarImage src={imageUrl} alt={`فضيلة الشيخ ${name}`} className="la-sheikh-avatar__img" />
      ) : null}
      <AvatarFallback className="la-sheikh-avatar__fallback" delayMs={imageUrl ? 600 : 0}>
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
