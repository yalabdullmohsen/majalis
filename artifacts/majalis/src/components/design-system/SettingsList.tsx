import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { SectionTitle } from "@/components/design-system/text/SsText";

export type SettingsListRow = {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  value?: ReactNode;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
};

type SettingsListProps = {
  title?: string;
  rows: SettingsListRow[];
  className?: string;
};

/**
 * قائمة إعدادات حديثة (صفوف iOS-like): أيقونة · عنوان · وصف · قيمة · سهم.
 */
export function SettingsList({ title, rows, className }: SettingsListProps) {
  return (
    <section className={cn("mur-settings-block", className)}>
      {title ? <SectionTitle className="settings-section-title">{title}</SectionTitle> : null}
      <div className="mur-settings-list">
        {rows.map((row) => {
          const body = (
            <>
              {row.icon ? <span className="mur-settings-row__icon">{row.icon}</span> : <span />}
              <span className="min-w-0">
                <span className={cn("mur-settings-row__title", row.danger && "text-[var(--mj-danger,#b54a4a)]")}>
                  {row.title}
                </span>
                {row.description ? (
                  <span className="mur-settings-row__desc block">{row.description}</span>
                ) : null}
              </span>
              {row.value != null ? <span className="mur-settings-row__value">{row.value}</span> : <span />}
              {row.href || row.onClick ? (
                <ChevronLeft className="mur-settings-row__chevron" aria-hidden />
              ) : (
                <span />
              )}
            </>
          );

          if (row.href && !row.disabled) {
            return (
              <Link key={row.id} href={row.href} className="mur-settings-row">
                {body}
              </Link>
            );
          }

          return (
            <button
              key={row.id}
              type="button"
              className="mur-settings-row"
              disabled={row.disabled}
              onClick={row.onClick}
            >
              {body}
            </button>
          );
        })}
      </div>
    </section>
  );
}
