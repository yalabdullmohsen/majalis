import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label?: string;
};

/** يفتح البحث الشامل الموحّد — لا محرك محلي ثانٍ. */
export function OpenGlobalSearchButton({ label = "بحث شامل", className, ...rest }: Props) {
  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      onClick={() => {
        try {
          sessionStorage.setItem("gsm-initial-filter", "all");
        } catch {
          /* ignore */
        }
        window.dispatchEvent(new CustomEvent("global-search-open", { detail: { filter: "all" } }));
      }}
      {...rest}
    >
      {label}
    </button>
  );
}
