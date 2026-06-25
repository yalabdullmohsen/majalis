const LEGACY_SIZE: Record<string, number> = {
  sm: 64,
  md: 80,
  lg: 100,
  xl: 120,
};

type SizeProp = number | keyof typeof LEGACY_SIZE | "responsive";

type Props = {
  src?: string;
  /** @deprecated use src */
  imageUrl?: string;
  name?: string;
  size?: SizeProp;
  className?: string;
};

export function SheikhAvatar({
  src,
  imageUrl,
  name = "شيخ",
  size = "responsive",
  className = "",
}: Props) {
  const resolvedSrc = (src || imageUrl || "").trim() || "/logo.png";
  const isResponsive = size === "responsive";
  const numericSize =
    typeof size === "number" ? size : isResponsive ? undefined : LEGACY_SIZE[size] ?? 96;

  const rootClass = [
    "sheikh-avatar-ring",
    isResponsive ? "sheikh-avatar-ring--responsive" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style =
    numericSize !== undefined
      ? { width: numericSize, height: numericSize, minWidth: numericSize, minHeight: numericSize }
      : undefined;

  return (
    <div className={rootClass} style={style}>
      <img
        src={resolvedSrc}
        alt={name}
        className="sheikh-avatar-ring__img"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

export default SheikhAvatar;
