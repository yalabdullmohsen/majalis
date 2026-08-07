import {
  useCallback,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type ExclusiveChoiceItem = {
  id: string;
  label: ReactNode;
  disabled?: boolean;
};

type Props = {
  items: ExclusiveChoiceItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
  className?: string;
  /** تمييز أحادي: تظليل كامل — مقابل متعددة بمربع اختيار */
  variant?: "exclusive" | "multi-look";
};

/**
 * مجموعة اختيار أحادي — قيمة مفردة فقط، radiogroup + أسهم لوحة المفاتيح.
 * التحديد الجديد يستبدل السابق في نفس الإطار (لا تراكم).
 */
export function ExclusiveChoiceGroup({
  items,
  value,
  onChange,
  ariaLabel = "اختيار",
  className,
  variant = "exclusive",
}: Props) {
  const labelId = useId();
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const enabledIds = items.filter((i) => !i.disabled).map((i) => i.id);
  const activeIndex = Math.max(0, enabledIds.indexOf(value));

  const move = useCallback(
    (delta: number) => {
      if (enabledIds.length === 0) return;
      const next = (activeIndex + delta + enabledIds.length) % enabledIds.length;
      const id = enabledIds[next];
      onChange(id);
      const idx = items.findIndex((i) => i.id === id);
      btnRefs.current[idx]?.focus();
    },
    [activeIndex, enabledIds, items, onChange],
  );

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      // RTL: السهم لليسار = التالي في القائمة
      const forward = e.key === "ArrowLeft";
      move(forward ? 1 : -1);
    } else if (e.key === "Home") {
      e.preventDefault();
      if (enabledIds[0]) onChange(enabledIds[0]);
    } else if (e.key === "End") {
      e.preventDefault();
      const last = enabledIds[enabledIds.length - 1];
      if (last) onChange(last);
    }
  };

  return (
    <div
      className={cn(
        "exclusive-choice",
        variant === "exclusive" && "exclusive-choice--fill",
        className,
      )}
      role="radiogroup"
      aria-labelledby={labelId}
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
    >
      <span id={labelId} className="sr-only">
        {ariaLabel}
      </span>
      {items.map((item, i) => {
        const checked = value === item.id;
        return (
          <button
            key={item.id}
            ref={(el) => {
              btnRefs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            disabled={item.disabled}
            tabIndex={checked ? 0 : -1}
            className={cn(
              "exclusive-choice__opt",
              "content-hub-chip",
              checked && "content-hub-chip--active exclusive-choice__opt--checked",
            )}
            onClick={() => onChange(item.id)}
          >
            {variant === "multi-look" ? (
              <span className="exclusive-choice__box" aria-hidden="true" data-checked={checked} />
            ) : null}
            <span className="exclusive-choice__label">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
