import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  /** نسبة العرض/الارتفاع لتثبيت المساحة ومنع CLS (مثل "1 / 1") */
  aspectRatio?: string;
  wrapperClassName?: string;
};

/** صورة بتلاشي ناعم وهيكل ثابت — بلا انزياح تخطيط. */
export function SmoothImage({
  src,
  alt = "",
  className,
  wrapperClassName,
  aspectRatio,
  onLoad,
  loading = "lazy",
  decoding = "async",
  ...rest
}: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={cn("mj-smooth-image", loaded && "is-loaded", wrapperClassName)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {!loaded ? <div className="mj-smooth-image__skel" aria-hidden="true" /> : null}
      <img
        {...rest}
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        className={cn("mj-smooth-image__img", className)}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
      />
    </div>
  );
}
