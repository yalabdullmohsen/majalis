import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  buildSearchSuggestions,
  SUGGESTION_GROUP_LABELS,
  type SearchSuggestion,
} from "@/lib/search-suggestions";
import { fetchSearchAutocomplete } from "@/lib/scholarly-intelligence-service";
import { getSearchHistory, clearSearchHistory } from "@/lib/search-history";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  inputClassName?: string;
  compact?: boolean;
};

type ApiSuggestion = {
  id: string;
  label: string;
  meta?: string;
  kind: string;
  href: string;
};

const API_KIND_LABELS: Record<string, string> = {
  quran: "قرآن",
  hadith: "حديث",
  lesson: "درس",
  topic: "موضوع",
  tafsir: "تفسير",
};

export function SearchSuggestions({
  value,
  onChange,
  onSubmit,
  placeholder = "ابحث في الدروس والفوائد والأسئلة والأذكار...",
  inputClassName = "",
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [apiSuggestions, setApiSuggestions] = useState<ApiSuggestion[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const localSuggestions = useMemo(
    () => buildSearchSuggestions(value),
    [value],
  );

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setApiSuggestions([]);
      return;
    }
    const id = window.setTimeout(() => {
      void fetchSearchAutocomplete(q, 10).then(setApiSuggestions);
    }, 200);
    return () => window.clearTimeout(id);
  }, [value]);

  const suggestions: SearchSuggestion[] = useMemo(() => {
    const fromApi: SearchSuggestion[] = apiSuggestions.map((s) => ({
      id: s.id,
      label: s.label,
      meta: s.meta || API_KIND_LABELS[s.kind],
      href: s.href,
      group: s.kind === "topic" ? "lessons" : (s.kind as SearchSuggestion["group"]) || "lessons",
    }));
    const seen = new Set(fromApi.map((s) => `${s.group}:${s.label}`));
    const merged = [...fromApi];
    for (const loc of localSuggestions) {
      const key = `${loc.group}:${loc.label}`;
      if (!seen.has(key)) merged.push(loc);
    }
    return merged.slice(0, 14);
  }, [apiSuggestions, localSuggestions]);

  const history = useMemo(() => getSearchHistory(), [open, value]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [value, suggestions.length]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, SearchSuggestion[]>();
    for (const item of suggestions) {
      const label = item.meta || SUGGESTION_GROUP_LABELS[item.group] || item.group;
      const list = map.get(label) || [];
      list.push(item);
      map.set(label, list);
    }
    return map;
  }, [suggestions]);

  const flat = suggestions;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      if (activeIndex >= 0 && flat[activeIndex]) {
        event.preventDefault();
        onSubmit(flat[activeIndex].label);
        setOpen(false);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`search-suggestions-root${compact ? " search-suggestions-root--compact" : ""}`}
    >
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="كلمة البحث"
        aria-expanded={open && suggestions.length > 0}
        aria-autocomplete="list"
        className={inputClassName}
        autoComplete="off"
      />

      {open && value.trim().length < 2 && history.length > 0 && (
        <div className="search-suggestions-panel" role="listbox" aria-label="سجل البحث">
          <div className="search-suggestions-group">
            <p className="search-suggestions-group-label">بحثت سابقًا</p>
            {history.map((item) => (
              <button
                key={item}
                type="button"
                className="search-suggestion-item"
                onClick={() => {
                  onChange(item);
                  onSubmit(item);
                  setOpen(false);
                }}
              >
                <span className="search-suggestion-label">{item}</span>
              </button>
            ))}
            <button type="button" className="search-suggestions-clear" onClick={() => { clearSearchHistory(); setOpen(false); }}>
              مسح السجل
            </button>
          </div>
        </div>
      )}

      {open && value.trim().length >= 2 && suggestions.length > 0 && (
        <div className="search-suggestions-panel" role="listbox">
          {Array.from(grouped.entries()).map(([group, items]) => (
            <div key={group} className="search-suggestions-group">
              <p className="search-suggestions-group-label">{group}</p>
              {items.map((item) => {
                const index = flat.indexOf(item);
                return (
                  <Link
                    key={`${group}-${item.id}`}
                    href={item.href.startsWith("/search") ? item.href : item.href}
                    className={`search-suggestion-item${index === activeIndex ? " search-suggestion-item--active" : ""}`}
                    onClick={() => {
                      if (!item.href.startsWith("/search")) {
                        setOpen(false);
                      } else {
                        onSubmit(item.label);
                        setOpen(false);
                      }
                    }}
                    role="option"
                    aria-selected={index === activeIndex}
                  >
                    <span className="search-suggestion-label">{item.label}</span>
                    {item.meta && <span className="search-suggestion-meta">{item.meta}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchSuggestions;
