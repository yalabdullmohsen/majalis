import { useState, type ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "loading" | "decoding"> & {
  /** Prefer true for below-the-fold media (default). */
  lazy?: boolean;
  /** Mark LCP hero images with fetchPriority high. */
  priority?: boolean;
  aspect?: "16/9" | "1/1" | "4/3" | "auto";
};

/**
 * Vite/React equivalent of Next/Image basics:
 * lazy-by-default, async decode, aspect-ratio reserved space (CLS),
 * graceful fallback when the asset fails.
 */
export function OptimizedImage({
  lazy = true,
  priority = false,
  aspect = "auto",
  className = "",
  alt = "",
  onError,
  style,
  ...rest
}: Props) {
  const [failed, setFailed] = useState(false);
  if (failed || !rest.src) return null;

  const aspectStyle =
    aspect === "auto"
      ? undefined
      : { aspectRatio: aspect.replace("/", " / "), ...style };

  return (
    <img
      {...rest}
      alt={alt}
      className={`mj-media ${aspect !== "auto" ? "mj-media--poster" : ""} ${className}`.trim()}
      loading={priority ? "eager" : lazy ? "lazy" : "eager"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      style={aspectStyle ?? style}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
    />
  );
}

export default OptimizedImage;
