import { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { LANG_META, type Lang } from "@/lib/language-preference";

export function LanguageSwitcher() {
  const { lang, setLang, dir } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = LANG_META.find((m) => m.code === lang) ?? LANG_META[0];

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // إغلاق بـ Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = (code: Lang) => {
    setLang(code);
    setOpen(false);
  };

  return (
    <div className="lsw-wrap" ref={containerRef} dir={dir}>
      <button
        type="button"
        className="lsw-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`اللغة الحالية: ${current.nativeName}`}
      >
        <Globe size={15} strokeWidth={1.6} aria-hidden="true" />
        <span className="lsw-trigger__name">{current.nativeName}</span>
        <ChevronDown
          size={13}
          aria-hidden="true"
          className={`lsw-trigger__chevron${open ? " lsw-trigger__chevron--open" : ""}`}
        />
      </button>

      {open && (
        <ul
          className="lsw-menu"
          role="listbox"
          aria-label="اختر اللغة"
          aria-activedescendant={`lsw-opt-${lang}`}
        >
          {LANG_META.map((m) => (
            <li
              key={m.code}
              id={`lsw-opt-${m.code}`}
              role="option"
              aria-selected={lang === m.code}
              className={`lsw-option${lang === m.code ? " lsw-option--active" : ""}`}
              onClick={() => handleSelect(m.code)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleSelect(m.code)}
              tabIndex={0}
              dir={m.dir}
            >
              <span className="lsw-option__dir-badge">{m.dir === "rtl" ? "RTL" : "LTR"}</span>
              <span className="lsw-option__native">{m.nativeName}</span>
              <span className="lsw-option__label">{m.label}</span>
              {lang === m.code && (
                <Check size={13} className="lsw-option__check" aria-hidden="true" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
