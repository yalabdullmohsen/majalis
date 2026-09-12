import { useState, type ImgHTMLAttributes } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type DirectoryMediaProps = {
  src?: string | null;
  alt: string;
  /** نسبة العرض للارتفاع — افتراضي 16/10 */
  ratio?: string;
  className?: string;
  imgClassName?: string;
  fallbackLabel?: string;
} & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "className">;

/**
 * وسائط الأدلة — أبعاد ثابتة، object-fit:cover، بدون شريط عمودي أو نص Alt ظاهر.
 * عند الفشل: placeholder هوية سُنّة (أيقونة + تسمية قصيرة خارج منطقة القراءة).
 */
export function DirectoryMedia({
  src,
  alt,
  ratio = "16 / 10",
  className,
  imgClassName,
  fallbackLabel,
  ...imgRest
}: DirectoryMediaProps) {
  const [failed, setFailed] = useState(false);
  const url = (src || "").trim();
  const showImg = Boolean(url) && !failed;

  return (
    <div
      className={cn("dir-media", className)}
      style={{ aspectRatio: ratio }}
      data-media-state={showImg ? "ready" : "fallback"}
    >
      {showImg ? (
        <img
          {...imgRest}
          src={url}
          alt={alt}
          className={cn("dir-media__img", imgClassName)}
          loading={imgRest.loading ?? "lazy"}
          decoding={imgRest.decoding ?? "async"}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="dir-media__fallback" aria-hidden="true">
          <MapPin size={28} strokeWidth={1.75} className="dir-media__fallback-icon" />
          {fallbackLabel ? <span className="dir-media__fallback-label">{fallbackLabel}</span> : null}
        </div>
      )}
      {/* النص الوصفي لقارئ الشاشة فقط — لا يُعرض كشريط عمودي */}
      <span className="sr-only">{alt}</span>
    </div>
  );
}
