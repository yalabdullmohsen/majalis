import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type AspectPreset = "16/9" | "1/1" | "4/3" | "auto";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "loading" | "decoding"> & {
  /** أسفل الطية: lazy (افتراضي). */
  lazy?: boolean;
  /** صورة LCP فقط — eager + fetchPriority high. */
  priority?: boolean;
  /** نسبة جاهزة أو auto. */
  aspect?: AspectPreset;
  /** نسبة CSS صريحة مثل "1 / 1" (تتقدّم على aspect). */
  aspectRatio?: string;
  wrapperClassName?: string;
  /** إظهار هيكل placeholder حتى التحميل. */
  skeleton?: boolean;
};

function resolveAspect(aspect: AspectPreset, aspectRatio?: string): string | undefined {
  if (aspectRatio) return aspectRatio;
  if (aspect === "auto") return undefined;
  return aspect.replace("/", " / ");
}

/**
 * صورة عامة لـ Vite/React (بديل Next/Image):
 * lazy افتراضي، decode async، مساحة محجوزة، placeholder خفيف.
 */
export function AppImage({
  lazy = true,
  priority = false,
  aspect = "auto",
  aspectRatio,
  className,
  wrapperClassName,
  skeleton = true,
  alt = "",
  onLoad,
  onError,
  style,
  width,
  height,
  ...rest
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const ratio = resolveAspect(aspect, aspectRatio);

  if (failed || !rest.src) return null;

  const img = (
    <img
      {...rest}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : lazy ? "lazy" : "eager"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      className={cn("mj-smooth-image__img", !skeleton && "mj-media", className)}
      style={!skeleton ? { ...(ratio ? { aspectRatio: ratio } : undefined), ...style } : style}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
    />
  );

  if (!skeleton) return img;

  return (
    <div
      className={cn("mj-smooth-image", loaded && "is-loaded", wrapperClassName)}
      style={ratio ? { aspectRatio: ratio, ...style } : style}
    >
      {!loaded ? <div className="mj-smooth-image__skel" aria-hidden="true" /> : null}
      {img}
    </div>
  );
}

export default AppImage;
