import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import { HOME_SEARCH_INPUT_ID } from "@/lib/home-search-id";
import { addSearchHistory } from "@/lib/search-history";

type Props = {
  inputId?: string;
};

/** بحث خفيف للشاشة الأولى — ينتقل إلى /search دون تحميل فهرس موحّد في الإقلاع. */
export function StartSearchCard({ inputId = HOME_SEARCH_INPUT_ID }: Props) {
  const [, navigate] = useLocation();
  const [raw, setRaw] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = raw.trim();
    if (!q) return;
    addSearchHistory(q);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form className="mj-start-search" role="search" onSubmit={onSubmit} dir="rtl">
      <label className="mj-start-search__label" htmlFor={inputId}>
        بحث
      </label>
      <div className="mj-start-search__field">
        <input
          id={inputId}
          type="search"
          className="mj-start-search__input"
          placeholder="ابحث في القرآن والكتب والدروس والأذكار..."
          aria-label="ابحث في القرآن والكتب والدروس والأذكار"
          value={raw}
          autoComplete="off"
          inputMode="search"
          enterKeyHint="search"
          onChange={(e) => setRaw(e.target.value)}
        />
        <button type="submit" className="mj-start-search__btn">
          بحث
        </button>
      </div>
    </form>
  );
}
