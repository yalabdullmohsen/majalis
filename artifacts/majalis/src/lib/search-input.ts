/**
 * خصائص وسلوك موحّد لحقول البحث — enterKeyHint + إغلاق الكيبورد عند Enter.
 */
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

/** خصائص HTML ثابتة لكل حقل بحث نصّي. */
export const SEARCH_INPUT_ATTRS = {
  type: "search",
  enterKeyHint: "search",
  inputMode: "search",
  autoComplete: "off",
  autoCorrect: "off",
  autoCapitalize: "none",
  spellCheck: false,
} as const;

/**
 * عند Enter: نفّذ البحث (اختياري) ثم أغلق لوحة المفاتيح عبر blur.
 * لا تستدعِ preventDefault إن كان النموذج يعتمد الإرسال الأصلي — مرّر
 * `preventDefault: true` عندما تتعامل أنت مع الإرسال.
 */
export function handleSearchEnterKey(
  event: ReactKeyboardEvent<HTMLInputElement>,
  options?: {
    onSearch?: () => void;
    preventDefault?: boolean;
  },
): void {
  if (event.key !== "Enter") return;
  if (options?.preventDefault !== false) {
    event.preventDefault();
  }
  options?.onSearch?.();
  event.currentTarget.blur();
}

/** هل العنصر حقل بحث يستحق سلوك Enter الموحّد؟ */
export function isSearchLikeInput(el: EventTarget | null): el is HTMLInputElement {
  if (!(el instanceof HTMLInputElement)) return false;
  if (el.type === "search") return true;
  if (el.getAttribute("enterkeyhint") === "search") return true;
  if (el.getAttribute("role") === "combobox" && el.closest(".search-suggestions-root, [role='search'], .gsm-topbar")) {
    return true;
  }
  return false;
}
