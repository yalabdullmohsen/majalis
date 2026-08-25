/**
 * Fluid Gesture Engine — فيزياء نابضة للمس والتمرير.
 * يستبدل المنحنيات الخطية بتغذية راجعة فورية مبنية على السرعة.
 */
export type SpringState = {
  value: number;
  velocity: number;
  target: number;
};

export type SpringConfig = {
  stiffness?: number;
  damping?: number;
  mass?: number;
};

const DEFAULT: Required<SpringConfig> = {
  stiffness: 280,
  damping: 26,
  mass: 1,
};

/** خطوة فيزياء واحدة — dt بالثواني. */
export function stepSpring(state: SpringState, dt: number, cfg?: SpringConfig): SpringState {
  const { stiffness, damping, mass } = { ...DEFAULT, ...cfg };
  const force = -stiffness * (state.value - state.target) - damping * state.velocity;
  const acceleration = force / mass;
  const velocity = state.velocity + acceleration * dt;
  const value = state.value + velocity * dt;
  return { value, velocity, target: state.target };
}

/** يُرجع true عند استقرار النابض. */
export function isSpringSettled(state: SpringState, epsilon = 0.4, velEpsilon = 0.05): boolean {
  return (
    Math.abs(state.value - state.target) < epsilon && Math.abs(state.velocity) < velEpsilon
  );
}

export type SwipeSample = { dx: number; dy: number; dt: number };

/** سرعة px/s من عيّنة لمس. */
export function swipeVelocity(sample: SwipeSample): { vx: number; vy: number } {
  const dt = Math.max(1, sample.dt) / 1000;
  return { vx: sample.dx / dt, vy: sample.dy / dt };
}

export type FluidSwipeHandlers = {
  onSwipe?: (dir: "left" | "right" | "up" | "down", velocity: number) => void;
  threshold?: number;
  minVelocity?: number;
};

/** يربط عنصرًا بإيماءات سرعة-محورية — بلا DOM reflow. */
export function bindFluidSwipe(el: HTMLElement, handlers: FluidSwipeHandlers): () => void {
  let startX = 0;
  let startY = 0;
  let startT = 0;
  const threshold = handlers.threshold ?? 48;
  const minVelocity = handlers.minVelocity ?? 180;

  const onStart = (ev: PointerEvent) => {
    startX = ev.clientX;
    startY = ev.clientY;
    startT = performance.now();
  };

  const onEnd = (ev: PointerEvent) => {
    const dx = ev.clientX - startX;
    const dy = ev.clientY - startY;
    const dt = performance.now() - startT;
    const { vx, vy } = swipeVelocity({ dx, dy, dt });
    const absVx = Math.abs(vx);
    const absVy = Math.abs(vy);
    if (Math.max(absVx, absVy) < minVelocity) return;
    if (absVx >= absVy) {
      if (Math.abs(dx) < threshold) return;
      handlers.onSwipe?.(dx < 0 ? "left" : "right", absVx);
    } else {
      if (Math.abs(dy) < threshold) return;
      handlers.onSwipe?.(dy < 0 ? "up" : "down", absVy);
    }
  };

  el.addEventListener("pointerdown", onStart, { passive: true });
  el.addEventListener("pointerup", onEnd, { passive: true });
  el.addEventListener("pointercancel", onEnd, { passive: true });
  return () => {
    el.removeEventListener("pointerdown", onStart);
    el.removeEventListener("pointerup", onEnd);
    el.removeEventListener("pointercancel", onEnd);
  };
}

/** يُحدّث CSS var للتحريك السلس — للمصحف والأوراق. */
export function applyFluidTransformVar(el: HTMLElement, value: number, unit = "px"): void {
  el.style.setProperty("--fluid-offset", `${value}${unit}`);
}
