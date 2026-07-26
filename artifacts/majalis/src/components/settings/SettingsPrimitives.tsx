import type { ReactNode } from "react";
import { Link } from "wouter";
import { ChevronLeft, Star } from "lucide-react";

export function SettingsGroup({
  title,
  footer,
  children,
}: {
  title?: string;
  footer?: string;
  children: ReactNode;
}) {
  return (
    <section className="ios-set-group">
      {title ? <h2 className="ios-set-group__title">{title}</h2> : null}
      <div className="ios-set-card">{children}</div>
      {footer ? <p className="ios-set-group__footer">{footer}</p> : null}
    </section>
  );
}

export function SettingsNavRow({
  icon,
  iconTone,
  title,
  subtitle,
  value,
  onClick,
  href,
  destructive,
}: {
  icon?: ReactNode;
  iconTone?: string;
  title: string;
  subtitle?: string;
  value?: string;
  onClick?: () => void;
  href?: string;
  destructive?: boolean;
}) {
  const body = (
    <>
      {icon ? (
        <span className={`ios-set-icon${iconTone ? ` ios-set-icon--${iconTone}` : ""}`} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="ios-set-row__text">
        <span className={`ios-set-row__title${destructive ? " is-danger" : ""}`}>{title}</span>
        {subtitle ? <span className="ios-set-row__desc">{subtitle}</span> : null}
      </span>
      {value ? <span className="ios-set-row__value">{value}</span> : null}
      <ChevronLeft className="ios-set-chevron" size={18} strokeWidth={2.2} aria-hidden="true" />
    </>
  );

  if (href) {
    const external = href.startsWith("http") || href.startsWith("mailto:");
    if (external) {
      return (
        <a className="ios-set-row ios-set-row--nav" href={href}>
          {body}
        </a>
      );
    }
    return (
      <Link href={href} className="ios-set-row ios-set-row--nav">
        {body}
      </Link>
    );
  }

  return (
    <button type="button" className="ios-set-row ios-set-row--nav" onClick={onClick}>
      {body}
    </button>
  );
}

export function SettingsToggleRow({
  title,
  description,
  checked,
  onChange,
  favoriteKey,
  isFavorite,
  onToggleFavorite,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  favoriteKey?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (key: string) => void;
}) {
  return (
    <div className="ios-set-row ios-set-row--control">
      <span className="ios-set-row__text">
        <span className="ios-set-row__title-row">
          <span className="ios-set-row__title">{title}</span>
          {favoriteKey && onToggleFavorite ? (
            <button
              type="button"
              className={`ios-set-fav${isFavorite ? " is-on" : ""}`}
              aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
              onClick={() => onToggleFavorite(favoriteKey)}
            >
              <Star size={14} strokeWidth={2.2} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          ) : null}
        </span>
        {description ? <span className="ios-set-row__desc">{description}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        className={`ios-set-switch${checked ? " is-on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className="ios-set-switch__thumb" />
      </button>
    </div>
  );
}

export function SettingsSelectRow({
  title,
  description,
  value,
  options,
  onChange,
  favoriteKey,
  isFavorite,
  onToggleFavorite,
}: {
  title: string;
  description?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  favoriteKey?: string;
  isFavorite?: boolean;
  onToggleFavorite?: (key: string) => void;
}) {
  return (
    <label className="ios-set-row ios-set-row--control">
      <span className="ios-set-row__text">
        <span className="ios-set-row__title-row">
          <span className="ios-set-row__title">{title}</span>
          {favoriteKey && onToggleFavorite ? (
            <button
              type="button"
              className={`ios-set-fav${isFavorite ? " is-on" : ""}`}
              aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite(favoriteKey);
              }}
            >
              <Star size={14} strokeWidth={2.2} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          ) : null}
        </span>
        {description ? <span className="ios-set-row__desc">{description}</span> : null}
      </span>
      <select
        className="ios-set-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={title}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SettingsChoiceRow({
  title,
  description,
  value,
  options,
  onChange,
}: {
  title: string;
  description?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="ios-set-row ios-set-row--stack">
      <span className="ios-set-row__text">
        <span className="ios-set-row__title">{title}</span>
        {description ? <span className="ios-set-row__desc">{description}</span> : null}
      </span>
      <div className="ios-set-segment" role="group" aria-label={title}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`ios-set-segment__btn${value === opt.value ? " is-active" : ""}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SettingsSliderRow({
  title,
  description,
  value,
  min,
  max,
  step = 1,
  display,
  onChange,
}: {
  title: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="ios-set-row ios-set-row--stack">
      <span className="ios-set-row__text ios-set-row__text--split">
        <span>
          <span className="ios-set-row__title">{title}</span>
          {description ? <span className="ios-set-row__desc">{description}</span> : null}
        </span>
        <strong className="ios-set-row__value">{display ?? value}</strong>
      </span>
      <input
        className="ios-set-slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={title}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function SettingsActionRow({
  title,
  description,
  onClick,
  destructive,
  value,
}: {
  title: string;
  description?: string;
  onClick: () => void;
  destructive?: boolean;
  value?: string;
}) {
  return (
    <button type="button" className="ios-set-row ios-set-row--nav" onClick={onClick}>
      <span className="ios-set-row__text">
        <span className={`ios-set-row__title${destructive ? " is-danger" : ""}`}>{title}</span>
        {description ? <span className="ios-set-row__desc">{description}</span> : null}
      </span>
      {value ? <span className="ios-set-row__value">{value}</span> : null}
    </button>
  );
}

export function SettingsInfoRow({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="ios-set-row ios-set-row--control">
      <span className="ios-set-row__text">
        <span className="ios-set-row__title">{title}</span>
        {description ? <span className="ios-set-row__desc">{description}</span> : null}
      </span>
      <span className="ios-set-row__value">{value}</span>
    </div>
  );
}

export function SettingsLinkRow({
  title,
  description,
  href,
  destructive,
}: {
  title: string;
  description?: string;
  href: string;
  destructive?: boolean;
}) {
  const body = (
    <>
      <span className="ios-set-row__text">
        <span className={`ios-set-row__title${destructive ? " is-danger" : ""}`}>{title}</span>
        {description ? <span className="ios-set-row__desc">{description}</span> : null}
      </span>
      <ChevronLeft className="ios-set-chevron" size={18} strokeWidth={2.2} aria-hidden="true" />
    </>
  );
  const external = href.startsWith("http") || href.startsWith("mailto:");
  if (external) {
    return (
      <a className="ios-set-row ios-set-row--nav" href={href}>
        {body}
      </a>
    );
  }
  return (
    <Link href={href} className="ios-set-row ios-set-row--nav">
      {body}
    </Link>
  );
}
