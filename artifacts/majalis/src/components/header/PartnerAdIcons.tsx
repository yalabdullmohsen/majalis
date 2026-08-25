/** أيقونات SVG عالية الدقة لكارت إعلان الشراكة — بلا صور raster. */
type IconProps = {
  className?: string;
  title?: string;
};

export function PartnerWatchIcon({ className, title = "ساعة ذكية" }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={20}
      height={20}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 8.5V12l2.6 1.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 3.5h5.6l.7 2.1a8.3 8.3 0 0 0-7 0l.7-2.1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 20.5h5.6l-.7-2.1a8.3 8.3 0 0 1-4.2 0l-.7 2.1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type PartnerChargeIconProps = IconProps;

export function PartnerChargeIcon({
  className,
  title = "حالة الشحن",
}: PartnerChargeIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width={20}
      height={20}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <rect
        x="3.5"
        y="7.5"
        width="15"
        height="9"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M19.5 10.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect
        x="5.5"
        y="9.5"
        width="9.5"
        height="5"
        rx="1"
        fill="currentColor"
        opacity="0.92"
      />
      <path
        d="M11.5 11.2 9.8 13h1.4l-1.2 2.2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
