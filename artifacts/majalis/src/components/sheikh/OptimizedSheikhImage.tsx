import { useEffect, useMemo, useState } from "react";
import { focalToObjectPosition, resolveSheikhFocalPoint } from "@/lib/sheikh-image-focal";
import {
  FALLBACK_LOGO,
  isSheikhFallbackLogo,
  processSheikhImage,
  type SheikhImageVariant,
} from "@/lib/sheikh-image-process";

const LEGACY_SIZE: Record<string, number> = {
  sm: 72,
  md: 88,
  lg: 108,
  xl: 128,
};

type SizeProp = number | keyof typeof LEGACY_SIZE | "responsive";

export type OptimizedSheikhImageProps = {
  src?: string;
  /** @deprecated use src */
  imageUrl?: string;
  name?: string;
  size?: SizeProp;
  variant?: SheikhImageVariant;
  className?: string;
  /** Load eagerly for above-the-fold hero usage */
  priority?: boolean;
  aspectRatio?: "4:5" | "3:4" | "1:1";
};

function resolveOutputSize(size: SizeProp): number {
  if (size === "responsive") return 192;
  if (typeof size === "number") return Math.max(size, 56);
  return LEGACY_SIZE[size] ?? 112;
}

function resolveCssSize(size: SizeProp): number | undefined {
  if (size === "responsive") return undefined;
  if (typeof size === "number") return size;
  return LEGACY_SIZE[size] ?? 112;
}

function aspectClass(aspectRatio: OptimizedSheikhImageProps["aspectRatio"], variant: SheikhImageVariant) {
  if (aspectRatio === "3:4") return "optimized-sheikh-image--ratio-3-4";
  if (aspectRatio === "1:1" || variant === "avatar") return "optimized-sheikh-image--ratio-1-1";
  return "optimized-sheikh-image--ratio-4-5";
}

export function OptimizedSheikhImage({
  src,
  imageUrl,
  name = "شيخ",
  size = "responsive",
  variant = "avatar",
  className = "",
  priority = false,
  aspectRatio,
}: OptimizedSheikhImageProps) {
  const resolvedSrc = (src || imageUrl || "").trim() || FALLBACK_LOGO;
  const outputSize = resolveOutputSize(size);
  const cssSize = resolveCssSize(size);
  const isResponsive = size === "responsive";
  const focal = useMemo(() => resolveSheikhFocalPoint(resolvedSrc), [resolvedSrc]);
  const objectPosition = focalToObjectPosition(focal);

  const [displaySrc, setDisplaySrc] = useState(resolvedSrc);
  const [srcSet, setSrcSet] = useState<string | undefined>();
  const [loading, setLoading] = useState(!isSheikhFallbackLogo(resolvedSrc));
  const [failed, setFailed] = useState(false);
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setDisplaySrc(resolvedSrc);
    setSrcSet(undefined);
    setProcessed(false);
    setLoading(!isSheikhFallbackLogo(resolvedSrc));

    if (isSheikhFallbackLogo(resolvedSrc)) {
      setLoading(false);
      return;
    }

    processSheikhImage({
      src: resolvedSrc,
      variant,
      outputSize,
      devicePixelRatio: typeof window !== "undefined" ? window.devicePixelRatio : 1,
    })
      .then((result) => {
        if (cancelled) return;
        setDisplaySrc(result.src);
        setSrcSet(result.srcSet);
        setProcessed(result.processed);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setDisplaySrc(resolvedSrc);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [resolvedSrc, variant, outputSize]);

  const handleError = () => {
    setFailed(true);
    setDisplaySrc(FALLBACK_LOGO);
    setSrcSet(undefined);
    setLoading(false);
  };

  const isLogo = isSheikhFallbackLogo(resolvedSrc);
  const rootClass = [
    "optimized-sheikh-image",
    aspectClass(aspectRatio, variant),
    variant === "avatar" ? "optimized-sheikh-image--avatar" : "optimized-sheikh-image--portrait",
    isResponsive ? "optimized-sheikh-image--responsive" : "",
    loading ? "optimized-sheikh-image--loading" : "",
    processed ? "optimized-sheikh-image--processed" : "optimized-sheikh-image--css",
    isLogo || failed ? "optimized-sheikh-image--logo-fallback" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const style =
    cssSize !== undefined
      ? {
          width: cssSize,
          height: variant === "avatar" ? cssSize : Math.round(cssSize / (4 / 5)),
          minWidth: cssSize,
          minHeight: variant === "avatar" ? cssSize : Math.round(cssSize / (4 / 5)),
        }
      : undefined;

  const imgSizes =
    cssSize !== undefined
      ? `${cssSize}px`
      : "(min-width: 768px) 7.75rem, 6.5rem";

  const imgStyle = {
    objectFit: "cover" as const,
    objectPosition,
  };

  const webpSrc = !isLogo && !failed && displaySrc.match(/\.(jpg|jpeg)$/i)
    ? displaySrc.replace(/\.(jpg|jpeg)$/i, ".webp")
    : undefined;

  const imgEl = (
    <img
      src={displaySrc}
      srcSet={srcSet}
      sizes={srcSet ? imgSizes : undefined}
      alt={name}
      className="optimized-sheikh-image__img"
      style={imgStyle}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      width={cssSize ?? outputSize}
      height={
        cssSize !== undefined
          ? variant === "avatar"
            ? cssSize
            : Math.round(cssSize / (4 / 5))
          : variant === "avatar"
            ? outputSize
            : Math.round(outputSize / (4 / 5))
      }
      onLoad={() => setLoading(false)}
      onError={handleError}
    />
  );

  return (
    <div
      className={rootClass}
      style={{
        ...style,
        ["--sheikh-object-position" as string]: objectPosition,
      }}
      aria-busy={loading}
    >
      {loading && (
        <div className="optimized-sheikh-image__skeleton" aria-hidden="true">
          <span className="optimized-sheikh-image__skeleton-shimmer" />
        </div>
      )}
      {webpSrc ? (
        <picture>
          <source srcSet={webpSrc} type="image/webp" />
          {imgEl}
        </picture>
      ) : imgEl}
    </div>
  );
}

export default OptimizedSheikhImage;
