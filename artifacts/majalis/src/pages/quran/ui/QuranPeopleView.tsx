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
  QURAN_PEOPLE_PAGE_TITLE,
  type QuranPerson,
  type PersonCategory,
} from "@/features/quran-people";
import "@/styles/pages/quran-hub.css";
import "@/styles/pages/quran-people.css";

type SortMode = "alpha" | "mentions";

function nameGlyph(nameAr: string): string {
  const ch = Array.from(nameAr.trim())[0];
  return ch || "ذ";
}

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
      title: QURAN_PEOPLE_PAGE_TITLE,
      description: "فهرس من ذُكروا في القرآن بأسمائهم، مع مواضع الآيات والربط بقصص الأنبياء.",
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
    <div className="quran-hub-page qp-people" dir="rtl">
      <PageHero
        title={QURAN_PEOPLE_PAGE_TITLE}
        description="أسماء صريحة موثّقة بمواضع الآيات — مع ربط لقصص الأنبياء دون إعادة سرد"
      />
      <div className="qp-people__body">
        <p className="qp-people__intro">
          الدفعة الحالية: المذكورون بالاسم. ما ذُكر بالوصف فقط مدرج في طابور مراجعة ولا يُعرض كحقيقة قطعية.
          انظر أيضاً:{" "}
          <Link href="/prophets">قصص الأنبياء</Link>
          {" · "}
          <Link href="/nations">الأمم السابقة</Link></p>

        <div className="qp-people__toolbar">
          <label>
            <span className="sr-only">بحث</span>
            <input
              className="qp-people__search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث باسم أو لقب…"
              autoComplete="off"
              enterKeyHint="search"
            />
          </label>

          <div className="qp-people__filters">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PersonCategory | "all")}
              aria-label="التصنيف"
            >
              <option value="all">كل التصنيفات</option>
              {(Object.keys(PERSON_CATEGORY_LABEL) as PersonCategory[]).map((c) => (
                <option key={c} value={c}>{PERSON_CATEGORY_LABEL[c]}</option>
              ))}
            </select>
            <select
              value={mention}
              onChange={(e) => setMention(e.target.value as typeof mention)}
              aria-label="نوع الذكر"
            >
              <option value="all">كل أنواع الذكر</option>
              <option value="name">{MENTION_TYPE_LABEL.name}</option>
              <option value="description">{MENTION_TYPE_LABEL.description}</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              aria-label="الترتيب"
            >
              <option value="alpha">أبجدي</option>
              <option value="mentions">الأكثر ذكراً</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="qp-people__status" role="status"></p>
        ) : filtered.length === 0 ? (
          <p className="qp-people__status">لا نتائج مطابقة.</p>
        ) : (
          <>
            <p className="qp-people__meta-count">
              {toArabicDigits(filtered.length)} اسم
            </p>
            <ul className="qp-people__grid">
              {filtered.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/quran/people/${p.slug}`}
                    className="qp-person-card"
                    data-category={p.category}
                  >
                    <div className="qp-person-card__top">
                      <span className="qp-person-card__glyph" aria-hidden="true">
                        {nameGlyph(p.nameAr)}
                      </span>
                      <div className="qp-person-card__heading">
                        <h2 className="qp-person-card__name">{p.nameAr}</h2>
                        <span className="qp-person-card__badge">
                          {PERSON_CATEGORY_LABEL[p.category]}
                        </span>
                      </div>
                    </div>
                    <p className="qp-person-card__def">{p.definition}</p>
                    <div className="qp-person-card__foot">
                      <span className="qp-person-card__meta">
                        {MENTION_TYPE_LABEL[p.mentionType]} · {toArabicDigits(p.occurrences.length)} موضع
                      </span>
                      <span className="qp-person-card__cta" aria-hidden="true">التفاصيل ←</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
