/**
 * كاشف نشاط صوتي خفيف على الجهاز (Energy VAD) —
 * يُستخدم لتجاهل الصمت وتفريغ المخزن فور انتهاء الكلام بلا انتظار مهلة شبكة.
 */

export type VadSpeechState = "silence" | "speech" | "trailing";

export type VadOptions = {
  /** عتبة RMS (0–1 بعد التطبيع) لاعتبار الإطار كلامًا */
  speechThreshold?: number;
  /** إطارات متتالية فوق العتبة لبدء الكلام */
  startFrames?: number;
  /** إطارات صمت متتالية لإنهاء الكلام (تفريغ فوري) */
  endFrames?: number;
};

export type VadTickResult = {
  speaking: boolean;
  /** انتقل من كلام → صمت للتو — إشارة تفريغ المخزن */
  speechEnded: boolean;
  /** انتقل من صمت → كلام للتو */
  speechStarted: boolean;
  rms: number;
  state: VadSpeechState;
};

const DEFAULTS = {
  speechThreshold: 0.02,
  startFrames: 3,
  endFrames: 8,
};

export class EnergyVad {
  private opts: Required<VadOptions>;
  private above = 0;
  private below = 0;
  private state: VadSpeechState = "silence";

  constructor(opts: VadOptions = {}) {
    this.opts = { ...DEFAULTS, ...opts };
  }

  reset() {
    this.above = 0;
    this.below = 0;
    this.state = "silence";
  }

  /** عيّنة من AnalyserNode.getByteTimeDomainData */
  tickFromTimeDomain(data: Uint8Array): VadTickResult {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i]! - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / Math.max(1, data.length));
    return this.tick(rms);
  }

  tick(rms: number): VadTickResult {
    const { speechThreshold, startFrames, endFrames } = this.opts;
    let speechStarted = false;
    let speechEnded = false;

    if (rms >= speechThreshold) {
      this.above += 1;
      this.below = 0;
      if (this.state === "silence" && this.above >= startFrames) {
        this.state = "speech";
        speechStarted = true;
      } else if (this.state === "trailing") {
        this.state = "speech";
      }
    } else {
      this.below += 1;
      this.above = 0;
      if (this.state === "speech" && this.below >= 2) {
        this.state = "trailing";
      }
      if ((this.state === "speech" || this.state === "trailing") && this.below >= endFrames) {
        this.state = "silence";
        speechEnded = true;
      }
    }

    return {
      speaking: this.state === "speech" || this.state === "trailing",
      speechEnded,
      speechStarted,
      rms,
      state: this.state,
    };
  }
}

/** تقدير سريع لمستوى 0–1 من RMS */
export function rmsToLevel01(rms: number): number {
  return Math.min(1, Math.max(0, rms * 4));
}
