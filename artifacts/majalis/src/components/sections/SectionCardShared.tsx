import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft } from "lucide-react";
import { haptics } from "@/lib/haptics";

const LONG_PRESS_MS = 520;
const SAVED_KEY = "majalis-saved-sections-v1";
const PROGRESS_KEY = "majalis-section-progress-v1";

function readSaved(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function addSavedSection(id: string): void {
  const next = Array.from(new Set([...readSaved(), id]));
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

export function readSectionProgress(id: string): number | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const n = parsed[id];
    return typeof n === "number" && n > 0 && n <= 1 ? n : null;
  } catch {
    return null;
  }
}

async function shareSection(label: string, route: string): Promise<void> {
  const url = `${window.location.origin}${route}`;
  try {
    if (typeof navigator.share === "function") {
      await navigator.share({ title: label, url });
      return;
    }
  } catch {
    /* user cancel */
  }
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    /* ignore */
  }
}

type PressOpts = {
  route: string;
  label: string;
  id: string;
  onOpen: () => void;
  onPrefetch?: () => void;
};

export function useSectionCardPress({ route, label, id, onOpen, onPrefetch }: PressOpts) {
  const [menuOpen, setMenuOpen] = useState(false);
  const timer = useRef(0);
  const didLong = useRef(false);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = 0;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    onPrefetch?.();
    didLong.current = false;
    clearTimer();
    timer.current = window.setTimeout(() => {
      didLong.current = true;
      haptics.medium();
      setMenuOpen(true);
    }, LONG_PRESS_MS) as unknown as number;
  };

  const onPointerUp = () => clearTimer();
  const onPointerCancel = () => clearTimer();

  const onClick = () => {
    if (didLong.current) {
      didLong.current = false;
      return;
    }
    haptics.selection();
    onOpen();
  };

  const closeMenu = () => setMenuOpen(false);

  const actions = {
    open: () => {
      closeMenu();
      haptics.selection();
      onOpen();
    },
    save: () => {
      addSavedSection(id);
      closeMenu();
      haptics.success();
    },
    share: () => {
      void shareSection(label, route);
      closeMenu();
    },
  };

  return { menuOpen, closeMenu, onPointerDown, onPointerUp, onPointerCancel, onClick, actions };
}

type FrameProps = {
  icon: ReactNode;
  label: string;
  subtitle: string;
  count?: string;
  progress?: number | null;
  menuOpen: boolean;
  onCloseMenu: () => void;
  actions: { open: () => void; save: () => void; share: () => void };
};

export function SectionCardFrame({
  icon,
  label,
  subtitle,
  count,
  progress,
  menuOpen,
  onCloseMenu,
  actions,
}: FrameProps) {
  return (
    <>
      <span className="card__icon" aria-hidden>
        {icon}
      </span>
      <span className="card__body">
        <span className="card__label">{label}</span>
        <span className="card__subtitle">{subtitle}</span>
      </span>
      <span className="card__meta" aria-hidden>
        {count ? <span className="card__count">{count}</span> : null}
        <ChevronLeft className="card__chevron" size={18} strokeWidth={2} />
      </span>
      {progress != null ? (
        <span className="card__progress" aria-hidden>
          <span className="card__progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
        </span>
      ) : null}
      {menuOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="card-quick-root" role="presentation">
              <button type="button" className="card-quick-scrim" aria-label="إغلاق" onClick={onCloseMenu} />
              <div className="card-quick" role="menu" aria-label="إجراءات سريعة">
                <button type="button" className="card-quick__item" role="menuitem" onClick={actions.open}>
                  فتح
                </button>
                <button type="button" className="card-quick__item" role="menuitem" onClick={actions.save}>
                  إضافة إلى المحفوظات
                </button>
                <button type="button" className="card-quick__item" role="menuitem" onClick={actions.share}>
                  مشاركة
                </button>
                <button type="button" className="card-quick__item" onClick={onCloseMenu}>
                  إلغاء
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
