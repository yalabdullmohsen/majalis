import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, RotateCcw, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import {
  HOME_WIDGET_DEFS,
  getLocalHomepagePrefs,
  saveLocalHomepagePrefs,
  saveRemoteHomepagePrefs,
  resetHomepagePrefs,
  type HomepagePrefs,
} from "@/lib/homepage-layout";

const LABELS: Record<string, string> = Object.fromEntries(HOME_WIDGET_DEFS.map((w) => [w.id, w.label]));

export function HomeCustomizeSheet({
  open,
  onClose,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  onChange: (prefs: HomepagePrefs) => void;
}) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<HomepagePrefs>(() => getLocalHomepagePrefs());

  useEffect(() => {
    if (open) setPrefs(getLocalHomepagePrefs());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const keyHandler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", keyHandler);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const commit = (next: HomepagePrefs) => {
    setPrefs(next);
    saveLocalHomepagePrefs(next);
    onChange(next);
    if (user?.id) saveRemoteHomepagePrefs(user.id, next);
  };

  const toggleHidden = (id: string) => {
    const hiddenSet = new Set(prefs.hidden);
    if (hiddenSet.has(id as never)) hiddenSet.delete(id as never);
    else hiddenSet.add(id as never);
    commit({ ...prefs, hidden: Array.from(hiddenSet) as typeof prefs.hidden });
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = prefs.order.indexOf(id as never);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= prefs.order.length) return;
    const order = [...prefs.order];
    [order[idx], order[target]] = [order[target], order[idx]];
    commit({ ...prefs, order });
  };

  const handleReset = () => {
    const next = resetHomepagePrefs();
    setPrefs(next);
    onChange(next);
    if (user?.id) saveRemoteHomepagePrefs(user.id, next);
  };

  return createPortal(
    <div className="bottom-sheet-overlay" role="presentation" onClick={onClose}>
      <div className="bottom-sheet" role="dialog" aria-modal="true" aria-label="تخصيص الصفحة الرئيسية" onClick={(e) => e.stopPropagation()}>
        <div className="bottom-sheet__handle" />
        <div className="bottom-sheet__head">
          <span>تخصيص الصفحة الرئيسية</span>
          <button type="button" onClick={onClose} className="bottom-sheet__close-btn" aria-label="إغلاق">
            <X size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>

        <div className="bottom-sheet__body">
          <p className="hcz-hint">أظهر أو أخفِ الأقسام، ورتّبها كما تفضّل. يُحفَظ تلقائيًا على هذا الجهاز{user ? " ويُزامَن مع حسابك" : ""}.</p>

          <div className="hcz-list">
            {prefs.order.map((id, idx) => {
              const isHidden = prefs.hidden.includes(id as never);
              return (
                <div key={id} className={`hcz-row${isHidden ? " hcz-row--hidden" : ""}`}>
                  <button
                    type="button"
                    className="hcz-row__visibility"
                    onClick={() => toggleHidden(id)}
                    aria-pressed={!isHidden}
                    aria-label={isHidden ? `إظهار ${LABELS[id]}` : `إخفاء ${LABELS[id]}`}
                  >
                    {isHidden ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                  </button>
                  <span className="hcz-row__label">{LABELS[id]}</span>
                  <div className="hcz-row__move">
                    <button type="button" onClick={() => move(id, -1)} disabled={idx === 0} aria-label={`تحريك ${LABELS[id]} للأعلى`}>
                      <ArrowUp size={15} strokeWidth={2} />
                    </button>
                    <button type="button" onClick={() => move(id, 1)} disabled={idx === prefs.order.length - 1} aria-label={`تحريك ${LABELS[id]} للأسفل`}>
                      <ArrowDown size={15} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button type="button" className="hcz-reset" onClick={handleReset}>
            <RotateCcw size={14} strokeWidth={2} aria-hidden="true" /> استعادة الترتيب الافتراضي
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
