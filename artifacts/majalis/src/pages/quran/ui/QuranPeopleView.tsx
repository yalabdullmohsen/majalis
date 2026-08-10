import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { PageHero } from "@/components/ui/PageHero";
import { toArabicDigits } from "@/lib/utils";
import { arabicMatchAny } from "@/lib/arabic-search";
import {
  loadQuranPeople,
  PERSON_CATEGORY_LABEL,
  MENTION_TYPE_LABEL,
  type QuranPerson,
  type PersonCategory,
} from "@/features/quran-people";
import "@/styles/pages/quran-hub.css";

type SortMode = "alpha" | "mentions";

export default function QuranPeopleView() {
  const [people, setPeople] = useState<QuranPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const deferredQ = useDeferredValue(q);
  const [category, setCategory] = useState<PersonCategory | "all">("all");
  const [mention, setMention] = useState<"all" | "name" | "description">("all");
  const [sort, setSort] = useState<SortMode>("alpha");

  useEffect(() => {
    applyPageSeo({
      title: "الأشخاص المذكورون في القرآن",
      description: "فهرس من ذُكروا بأسمائهم في القرآن مع مواضع الآيات والربط بقصص الأنبياء.",
      path: "/quran/people",
    });
    let cancelled = false;
    void loadQuranPeople().then((list) => {
      if (!cancelled) {
        setPeople(list);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    let list = people;
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (mention !== "all") list = list.filter((p) => p.mentionType === mention);
    if (deferredQ.trim()) {
      const needle = deferredQ.trim();
      list = list.filter((p) =>
        arabicMatchAny([p.nameAr, ...(p.aliases ?? []), p.definition], needle),
      );
    }
    const sorted = [...list];
    if (sort === "mentions") {
      sorted.sort((a, b) => b.occurrences.length - a.occurrences.length || a.nameAr.localeCompare(b.nameAr, "ar"));
    } else {
      sorted.sort((a, b) => a.nameAr.localeCompare(b.nameAr, "ar"));
    }
    return sorted;
  }, [people, category, mention, deferredQ, sort]);

  return (
    <div className="quran-hub-page" dir="rtl">
      <PageHero
        title="الأشخاص المذكورون في القرآن"
        description="أسماء صريحة موثّقة بمواضع الآيات — مع ربط لقصص الأنبياء دون إعادة سرد"
      />
      <div className="quran-hub-page__body" style={{ maxWidth: 720, marginInline: "auto", padding: "0 1rem 2rem" }}>
        <p style={{ color: "var(--color-muted, #6b6560)", fontSize: "0.95rem", lineHeight: 1.6 }}>
          الدفعة الحالية: المذكورون بالاسم. ما ذُكر بالوصف فقط مدرج في طابور مراجعة ولا يُعرض كحقيقة قطعية.
          انظر أيضاً:{" "}
          <Link href="/prophets">قصص الأنبياء</Link>
          {" · "}
          <Link href="/nations">الأمم السابقة</Link>
        </p>

        <label style={{ display: "block", marginTop: "1rem" }}>
          <span className="sr-only">بحث</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث باسم أو لقب…"
            autoComplete="off"
            enterKeyHint="search"
            style={{
              width: "100%",
              padding: "0.65rem 0.85rem",
              border: "1px solid var(--color-border, #ddd)",
              borderRadius: 8,
              fontSize: "1rem",
              background: "var(--color-surface, #fff)",
            }}
          />
        </label>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
          <select value={category} onChange={(e) => setCategory(e.target.value as PersonCategory | "all")} aria-label="التصنيف">
            <option value="all">كل التصنيفات</option>
            {(Object.keys(PERSON_CATEGORY_LABEL) as PersonCategory[]).map((c) => (
              <option key={c} value={c}>{PERSON_CATEGORY_LABEL[c]}</option>
            ))}
          </select>
          <select value={mention} onChange={(e) => setMention(e.target.value as typeof mention)} aria-label="نوع الذكر">
            <option value="all">كل أنواع الذكر</option>
            <option value="name">{MENTION_TYPE_LABEL.name}</option>
            <option value="description">{MENTION_TYPE_LABEL.description}</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)} aria-label="الترتيب">
            <option value="alpha">أبجدي</option>
            <option value="mentions">الأكثر ذكراً</option>
          </select>
        </div>

        {loading ? (
          <p style={{ marginTop: "1.5rem" }}>جاري التحميل…</p>
        ) : filtered.length === 0 ? (
          <p style={{ marginTop: "1.5rem" }}>لا نتائج مطابقة.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: "1.25rem 0 0", display: "grid", gap: "0.65rem" }}>
            {filtered.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/quran/people/${p.slug}`}
                  style={{
                    display: "block",
                    padding: "0.85rem 1rem",
                    borderBottom: "1px solid var(--color-border, #e8e4df)",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <strong style={{ fontSize: "1.05rem" }}>{p.nameAr}</strong>
                  <span style={{ display: "block", fontSize: "0.85rem", color: "var(--color-muted, #6b6560)", marginTop: 4 }}>
                    {PERSON_CATEGORY_LABEL[p.category]} · {MENTION_TYPE_LABEL[p.mentionType]} ·{" "}
                    {toArabicDigits(p.occurrences.length)} موضع
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
