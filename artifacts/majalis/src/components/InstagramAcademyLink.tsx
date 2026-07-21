import { Instagram, ExternalLink } from "lucide-react";
import { ACADEMY_INSTAGRAM_HANDLE, ACADEMY_INSTAGRAM_URL, ACADEMY_NAME, openInstagramAcademy } from "@/lib/social-links";

interface InstagramAcademyLinkProps {
  /** "card": بطاقة كاملة بالاسم والوصف وزر زيارة (من نحن / تواصل معنا).
   *  "compact": رابط أيقونة+اسم مضغوط (الفوتر). */
  variant?: "card" | "compact";
  className?: string;
}

/**
 * رابط حساب انستغرام لأكاديمية ورثة الأنبياء — المصدر الوحيد المعتمد لعرضه.
 * على iOS يحاول فتح تطبيق انستغرام مباشرةً، وإلا يفتح المتصفح الآمن في تبويب جديد.
 */
export function InstagramAcademyLink({ variant = "card", className }: InstagramAcademyLinkProps) {
  const classes = ["instagram-academy-link", `instagram-academy-link--${variant}`, className].filter(Boolean).join(" ");

  return (
    <a
      href={ACADEMY_INSTAGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={classes}
      onClick={(event) => openInstagramAcademy(event)}
      aria-label={`${ACADEMY_NAME} على انستغرام — فتح في نافذة جديدة`}
    >
      <span className="instagram-academy-link__icon" aria-hidden="true">
        <Instagram size={variant === "card" ? 22 : 18} strokeWidth={1.8} />
      </span>
      <span className="instagram-academy-link__text">
        <strong className="instagram-academy-link__name">{ACADEMY_NAME}</strong>
        {variant === "card" && (
          <span className="instagram-academy-link__handle">@{ACADEMY_INSTAGRAM_HANDLE}</span>
        )}
      </span>
      {variant === "card" && (
        <span className="instagram-academy-link__cta">
          زيارة
          <ExternalLink size={14} strokeWidth={1.8} aria-hidden="true" />
        </span>
      )}
    </a>
  );
}

export default InstagramAcademyLink;
