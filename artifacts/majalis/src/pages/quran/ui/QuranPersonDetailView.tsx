import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { PageHero } from "@/components/ui/PageHero";
import { toArabicDigits } from "@/lib/utils";
import { getSurahMeta } from "@/lib/quran-api";
import {
  getQuranPerson,
  mushafAyahHref,
  prophetStoryHref,
  PERSON_CATEGORY_LABEL,
  MENTION_TYPE_LABEL,
  type QuranPerson,
} from "@/features/quran-people";
import "@/styles/pages/quran-hub.css";

export default function QuranPersonDetailView() {
  const params = useParams<{ slug?: string }>();
  const slug = params.slug ?? "";
  const [person, setPerson] = useState<QuranPerson | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void getQuranPerson(slug).then((p) => {
      if (cancelled) return;
      setPerson(p);
      if (p) {
        applyPageSeo({
          title: `${p.nameAr} في القرآن`,
          description: p.definition,
          path: `/quran/people/${p.slug}`,
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (person === undefined) {
    return <div className="quran-hub-page" dir="rtl"><p style={{ padding: "2rem" }}></p></div>;
  }
  if (!person) {
    return (
      <div className="quran-hub-page" dir="rtl">
        <PageHero title="غير موجود" description="لم نجد هذه الشخصية في الفهرس المنشور" />
        <p style={{ padding: "1rem", textAlign: "center" }}>
          <Link href="/quran/people">العودة إلى الذين ذكروا في القرآن</Link></p>
      </div>
    );
  }

  return (
    <div className="quran-hub-page" dir="rtl">
      <PageHero
        title={person.nameAr}
        description={`${PERSON_CATEGORY_LABEL[person.category]} · ${MENTION_TYPE_LABEL[person.mentionType]}`}
      />
      <article style={{ maxWidth: 720, marginInline: "auto", padding: "0 1rem 2.5rem", lineHeight: 1.7 }}>
        <p><Link href="/quran/people">← الذين ذكروا في القرآن</Link></p>

        <section style={{ marginTop: "1.25rem" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.35rem" }}>التعريف</h2>
          <p>{person.definition}</p>
        </section>

        <section style={{ marginTop: "1.25rem" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.35rem" }}>سبب الذكر</h2>
          <p>{person.whyMentioned}</p>
        </section>

        {person.lessons.length > 0 && (
          <section style={{ marginTop: "1.25rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.35rem" }}>العِبَر</h2>
            <ul>
              {person.lessons.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </section>
        )}

        {(person.prophetSlug || (person.relatedLinks?.length ?? 0) > 0) && (
          <section style={{ marginTop: "1.25rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.35rem" }}>روابط مرتبطة</h2>
            <ul>
              {person.prophetSlug && (
                <li>
                  <Link href={prophetStoryHref(person.prophetSlug)}>
                    قصة {person.nameAr} في قصص الأنبياء
                  </Link>
                  {" — دون إعادة سرد هنا"}
                </li>
              )}
              {person.relatedLinks?.map((l) => (
                <li key={l.href}><Link href={l.href}>{l.label}</Link></li>
              ))}
            </ul>
          </section>
        )}

        <section style={{ marginTop: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>مواضع الذكر في المصحف</h2>
          <div style={{ display: "grid", gap: "0.5rem" }}>
            {person.occurrences.map((o) => {
              const surahName = getSurahMeta(o.surah)?.name ?? String(o.surah);
              return (
                <Link
                  key={`${o.surah}:${o.ayah}`}
                  href={mushafAyahHref(o.surah, o.ayah)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    padding: "0.7rem 0.85rem",
                    border: "1px solid var(--color-border, #e5e0d8)",
                    borderRadius: 8,
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <span>
                    سورة {surahName} · آية {toArabicDigits(o.ayah)}
                    {o.note ? <span style={{ color: "var(--color-muted)", display: "block", fontSize: "0.85rem" }}>{o.note}</span> : null}
                  </span>
                  <span style={{ color: "var(--color-mushaf-gold, #8B6914)", whiteSpace: "nowrap" }}>فتح المصحف</span>
                </Link>
              );
            })}
          </div>
        </section>
      </article>
    </div>
  );
}
