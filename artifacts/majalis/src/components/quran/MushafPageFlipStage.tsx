/**
 * مسرح تقليب المصحف: ورقة أمامية + تحتية حقيقية (N±1) + ظلال طيّة.
 * المحتوى القرآني يبقى DOM/QPC بلا تحويل لصورة.
 *
 * مهم: في السكون لا تُركَّب صفحة تحتية تحتوي `.mf2-lines` — بوابات القياس
 * تستخدم querySelector وتعود لأول تطابق في الشجرة.
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
  /** صفحة تحت الورقة أثناء التقليب (التالية عند سحب يمينًا) */
  underlay?: ReactNode;
  children: ReactNode;
  /** ورقة يسرى في وضع الانتشار */
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
  const style = {
    ["--mpv-flip" as string]: String(flip.progress),
    ["--mpv-flip-abs" as string]: String(abs),
    ["--mpv-flip-edge" as string]: String(FLIP_EDGE_FRAC),
    ["--mpv-flip-dir" as string]: dirNext ? "1" : "-1",
  } as CSSProperties;

  const leaf = (
    <div className="qs-mushaf-body-inner mpv-flip-leaf" data-mushaf-active-leaf="1">
      {children}
      {flipping ? <div className="mpv-flip-leaf__curl" aria-hidden="true" /> : null}
    </div>
  );

  const underlayNode = (
    <div className="mpv-flip-underlay" aria-hidden="true" data-mushaf-underlay="1">
      {/* صفحة حقيقية فقط أثناء التقليب — وإلا ورقة فارغة كـ curl القديم */}
      {flipping && underlay ? underlay : <div className="mpv-flip-underlay__paper" />}
    </div>
  );

  const fx = (
    <>
      <div className="mpv-flip-shade" aria-hidden="true" />
      {flipping ? <div className="mpv-flip-corner" aria-hidden="true" /> : null}
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
          {/* الورقة النشطة أولًا في الشجرة حتى لا تلتقط البوابات .mf2-lines من التحتية */}
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
