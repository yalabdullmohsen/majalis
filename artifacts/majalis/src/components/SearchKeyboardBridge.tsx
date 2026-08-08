/**
 * جسر عام لحقول البحث:
 * - يضبط enterKeyHint/inputMode عند التركيز (يغطي كل الصفحات بلا تعديل جماعي)
 * - بعد Enter يغلق لوحة المفاتيح عبر blur (بعد معالجات React المحلية)
 */
import { useEffect } from "react";
import { isSearchLikeInput } from "@/lib/search-input";

function enhanceSearchInput(el: HTMLInputElement): void {
  if (!el.getAttribute("enterkeyhint")) {
    el.setAttribute("enterkeyhint", "search");
  }
  if (!el.getAttribute("inputmode")) {
    el.setAttribute("inputmode", "search");
  }
  if (el.type === "text" && el.getAttribute("role") === "combobox") {
    /* اترك type كما هو للاقتراحات؛ enterkeyhint يكفي للوحة المفاتيح */
  } else if (el.type !== "search" && el.dataset.searchField === "1") {
    el.type = "search";
  }
}

export function SearchKeyboardBridge() {
  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      const el = event.target;
      if (!(el instanceof HTMLInputElement)) return;
      if (
        el.type === "search" ||
        el.getAttribute("enterkeyhint") === "search" ||
        el.getAttribute("role") === "combobox" ||
        el.dataset.searchField === "1" ||
        el.classList.contains("gsm-input") ||
        el.closest(".search-suggestions-root, [role='search'], .bottom-sheet__search")
      ) {
        enhanceSearchInput(el);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter") return;
      const el = event.target;
      if (!isSearchLikeInput(el) && !(el instanceof HTMLInputElement && (
        el.classList.contains("gsm-input") ||
        el.closest(".search-suggestions-root, [role='search'], .bottom-sheet__search")
      ))) {
        return;
      }
      if (!(el instanceof HTMLInputElement)) return;
      window.setTimeout(() => {
        if (document.activeElement === el) el.blur();
      }, 0);
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return null;
}
