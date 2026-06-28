/** Simple Web Audio feedback — no external assets required */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function tone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.08): void {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(audio.destination);
  osc.start();
  g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  osc.stop(audio.currentTime + duration);
}

export function playCorrectSound(): void {
  tone(523, 0.12);
  setTimeout(() => tone(659, 0.15), 80);
}

export function playWrongSound(): void {
  tone(220, 0.25, "sawtooth", 0.06);
}

export function playTickSound(): void {
  tone(880, 0.04, "square", 0.03);
}

export function playWinSound(): void {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.2), i * 120));
}

export function playLoseSound(): void {
  [392, 330, 262].forEach((f, i) => setTimeout(() => tone(f, 0.25, "triangle", 0.05), i * 150));
}

export function playScorePop(): void {
  tone(1200, 0.08, "square", 0.04);
}
