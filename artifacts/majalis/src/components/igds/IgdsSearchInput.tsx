import type { InputHTMLAttributes } from "react";
import { Search } from "lucide-react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
};

export function IgdsSearchInput({ label = "بحث", className, ...rest }: Props) {
  return (
    <label className={["igds-search", className].filter(Boolean).join(" ")}>
      <Search size={16} strokeWidth={1.8} aria-hidden="true" />
      <span className="igds-sr-only">{label}</span>
      <input className="igds-search__input" type="search" enterKeyHint="search" {...rest} />
    </label>
  );
}
