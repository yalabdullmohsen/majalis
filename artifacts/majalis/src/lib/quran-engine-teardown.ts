/**
 * سجل تفكيك موارد محرك المصحف — يضمن إيقاف مستمعين/مؤقّتات/عقد صوت عند فك التركيب.
 */
type Disposable = () => void;

const sessionDisposables = new Set<Disposable>();

export function registerQuranEngineDisposable(dispose: Disposable): () => void {
  sessionDisposables.add(dispose);
  return () => {
    sessionDisposables.delete(dispose);
  };
}

/** يُستدعى عند مغادرة قارئ المصحف — آمن للتكرار. */
export function teardownQuranEngineSession(): void {
  const list = [...sessionDisposables];
  sessionDisposables.clear();
  for (const dispose of list) {
    try {
      dispose();
    } catch {
      /* ignore */
    }
  }
}

/** لفّ addEventListener بإزالة تلقائية عند teardown الجلسة. */
export function bindEngineListener<K extends keyof WindowEventMap>(
  target: Window | Document | HTMLElement,
  type: K,
  listener: (ev: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): () => void {
  const t = target as EventTarget;
  t.addEventListener(type, listener as EventListener, options);
  const off = () => t.removeEventListener(type, listener as EventListener, options);
  return registerQuranEngineDisposable(off);
}

/** إغلاق AudioContext بأمان (إن وُجد في جلسة التسميع/التعليم). */
export function disposeAudioContextSafe(ctx: AudioContext | null | undefined): void {
  if (!ctx) return;
  try {
    void ctx.close();
  } catch {
    /* ignore */
  }
}
