/**
 * مسرح تقليب المصحف: ورقة أمامية + جيران مرسومان مسبقاً (visibility).
 * أثناء السحب يحدّث الخطاف CSS vars مباشرة — بلا إعادة رسم React لكل إطار.
 */
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import type { MushafFlipState } from "@/hooks/useMushafPageFlip";
import { FLIP_EDGE_FRAC } from "@/hooks/useMushafPageFlip";

type Props = {
  stageRef?: Ref<HTMLDivElement>;
  flip: MushafFlipState;
  flipHandlers: {
    onPointerDown: (e: ReactPointerEvent) => void;
    onPointerMove: (e: ReactPointerEvent) => void;
    onPointerUp: (e: ReactPointerEvent) => void;
    onPointerCancel: () => void;
  };
  underlay?: ReactNode;
  children: ReactNode;
  spreadLeft?: ReactNode;
  isSpread?: boolean;
};

export function MushafPageFlipStage({
  stageRef,
  flip,
  flipHandlers,
  underlay,
  children,
  spreadLeft,
  isSpread = false,
}: Props) {
  const abs = Math.abs(flip.progress);
  const flipping = flip.active || flip.settling || abs > 0.001;
  const dirNext = flip.progress >= 0;
  /* قيم ابتدائية/سكون — أثناء السحب يكتب الخطاف مباشرة على العنصر */
  const style = {
    ["--mpv-flip" as string]: String(flip.progress),
    ["--mpv-flip-abs" as string]: String(abs),
    ["--mpv-flip-edge" as string]: String(FLIP_EDGE_FRAC),
    ["--mpv-flip-dir" as string]: dirNext ? "1" : "-1",
  } as CSSProperties;

  const leaf = (
    <div className="qs-mushaf-body-inner mpv-flip-leaf" data-mushaf-active-leaf="1">
      {children}
      <div className="mpv-flip-leaf__curl" aria-hidden="true" />
    </div>
  );

  const underlayNode = (
    <div
      className={[
        "mpv-flip-underlay",
        flipping && underlay ? "mpv-flip-underlay--live" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
      data-mushaf-underlay="1"
    >
      {/* الجيران مرسومان مسبقاً ومخفيان بـ visibility — بلا بناء DOM وقت السحب */}
      {underlay ? (
        <div
          className="mpv-flip-underlay__page"
          style={{ visibility: flipping ? "visible" : "hidden" }}
        >
          {underlay}
        </div>
      ) : (
        <div className="mpv-flip-underlay__paper" />
      )}
    </div>
  );

  const fx = (
    <>
      <div className="mpv-flip-shade" aria-hidden="true" />
      <div className="mpv-flip-corner" aria-hidden="true" />
    </>
  );

  return (
    <div
      ref={stageRef}
      className={[
        "mpv-flip-stage",
        flip.active || flip.settling ? "mpv-flip-stage--active" : "",
        flipping ? "mpv-flip-stage--flipping" : "",
        flip.peeling ? "mpv-flip-stage--peeling" : "",
        flip.reducedMotion ? "mpv-flip-stage--reduced" : "",
        isSpread ? "mpv-flip-stage--spread" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-flip-progress={flip.progress.toFixed(3)}
      style={style}
      {...flipHandlers}
    >
      {isSpread && spreadLeft ? (
        <div className="mpv-flip-spread-left" aria-hidden={false}>
          {spreadLeft}
        </div>
      ) : null}

      {isSpread ? (
        <div className="mpv-flip-book">
          {leaf}
          {underlayNode}
          {fx}
        </div>
      ) : (
        <>
          {leaf}
          {underlayNode}
          {fx}
        </>
      )}

      <div className="mpv-flip-edge mpv-flip-edge--next" aria-hidden="true" />
      <div className="mpv-flip-edge mpv-flip-edge--prev" aria-hidden="true" />
    </div>
  );
}

export default MushafPageFlipStage;
