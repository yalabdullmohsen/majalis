/**
 * حالة شريط التلاوة المصغّر — يستمر بعد مغادرة المصحف عبر AudioEngine.
 * AudioEngine يُحمَّل كسولًا حتى لا يدخل حزمة الإقلاع (App يستورد الظهور فقط).
 */
export type MiniPlayerVisibility = {
  visible: boolean;
};

type Listener = (state: MiniPlayerVisibility) => void;

let visible = false;
const listeners = new Set<Listener>();

function emit(): void {
  const snap = { visible };
  for (const l of listeners) {
    try {
      l(snap);
    } catch {
      /* ignore */
    }
  }
}

export function subscribeMiniPlayer(listener: Listener): () => void {
  listeners.add(listener);
  listener({ visible });
  return () => listeners.delete(listener);
}

export function isMiniPlayerVisible(): boolean {
  return visible;
}

export function showMiniPlayer(): void {
  visible = true;
  emit();
}

export function hideMiniPlayer(): void {
  visible = false;
  emit();
}

/** تسليم التشغيل من قارئ المصحف إلى المحرّك العام دون إيقاف مفاجئ للإحساس. */
export function handoffMushafPlayback(opts: {
  surah: number;
  ayah: number;
  reciterId: string;
}): void {
  void import("@/core/audio/AudioEngine").then(({ AudioEngine }) => {
    const engine = AudioEngine.getInstance();
    engine.setReciter(opts.reciterId);
    void engine.playAyah(opts.surah, opts.ayah, opts.reciterId);
  });
  showMiniPlayer();
}

/**
 * CLOSE: يوقف التلاوة · يلغي الحلقة/النطاق · يفرّغ المحرّك · يخفي المشغّل.
 * لا يغيّر المسار. لا يعادل COLLAPSE (طي فقط) ولا STOP الجزئي داخل الرصيف.
 */
export function stopMiniPlayer(): void {
  void import("@/core/audio/AudioEngine")
    .then(({ AudioEngine }) => {
      const engine = AudioEngine.getInstance();
      engine.setLoopConfig(engine.getSnapshot().surah ?? 1, null);
      engine.stopAndUnload();
    })
    .catch(() => undefined);
  hideMiniPlayer();
}
