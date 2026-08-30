/**
 * مدير الطبقات السفلية داخل المصحف — مصدر واحد للارتفاعات والتكديس.
 * لا يرسم UI؛ يضبط data-* ومتغيرات CSS على الجذر.
 */
export const READER_BOTTOM = {
  nav: 84,
  action: 96,
  audio: 112,
} as const;

export type ReaderBottomState = {
  ayahBar: boolean;
  audioDock: boolean;
};

/** ارتفاع التكديس الظاهر (بلا safe-area) */
export function readerBottomStackPx(state: ReaderBottomState): number {
  let h = 0;
  if (state.audioDock) h += READER_BOTTOM.audio;
  if (state.ayahBar) h += READER_BOTTOM.action;
  return h;
}

/** قيم data-* للعرض في الجذر */
export function readerBottomDataAttrs(state: ReaderBottomState): {
  "data-ayah-bar": "0" | "1";
  "data-audio-dock": "0" | "1";
  "data-bottom-stack": string;
} {
  return {
    "data-ayah-bar": state.ayahBar ? "1" : "0",
    "data-audio-dock": state.audioDock ? "1" : "0",
    "data-bottom-stack": String(readerBottomStackPx(state)),
  };
}
