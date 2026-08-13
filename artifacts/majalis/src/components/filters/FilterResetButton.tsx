import { cn } from "@/lib/utils";

type Props = {
  onClick: () => void;
  label?: string;
  className?: string;
  disabled?: boolean;
};

export function FilterResetButton({
  onClick,
  label = "مسح الكل",
  className,
  disabled = false,
}: Props) {
  return (
    <button
      type="button"
      className={cn("mj-filter-reset", className)}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      {label}
    </button>
  );
}
