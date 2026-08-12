/**
 * تثبيت سلوك Enter/enterKeyHint لحقول البحث — يُحمَّل كسولًا خارج حزمة الدخول.
 */

function isSearchLikeTarget(el: EventTarget | null): el is HTMLInputElement {
  if (!(el instanceof HTMLInputElement)) return false;
  if (el.type === "search") return true;
  if (el.getAttribute("enterkeyhint") === "search") return true;
  if (el.dataset.searchField === "1") return true;
  if (el.classList.contains("gsm-input")) return true;
  if (el.getAttribute("role") === "combobox" && el.closest(".search-suggestions-root, [role='search']")) {
    return true;
  }
  return Boolean(el.closest(".bottom-sheet__search, [role='search']"));
}

function enhanceSearchInput(el: HTMLInputElement): void {
  if (!el.getAttribute("enterkeyhint")) el.setAttribute("enterkeyhint", "search");
  if (!el.getAttribute("inputmode")) el.setAttribute("inputmode", "search");
}

function onFocusIn(event: FocusEvent): void {
  const el = event.target;
  if (isSearchLikeTarget(el)) enhanceSearchInput(el);
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key !== "Enter") return;
  const el = event.target;
  if (!isSearchLikeTarget(el)) return;
  window.setTimeout(() => {
    if (document.activeElement === el) el.blur();
  }, 0);
}

export function installSearchKeyboardBridge(): () => void {
  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("keydown", onKeyDown);
  return () => {
    document.removeEventListener("focusin", onFocusIn);
    document.removeEventListener("keydown", onKeyDown);
  };
}
