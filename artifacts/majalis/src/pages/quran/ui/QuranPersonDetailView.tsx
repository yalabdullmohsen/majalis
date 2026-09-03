import { useEffect, useState } from "react";
import { Link, Redirect, useParams } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import { toArabicDigits } from "@/lib/utils";
import { getSurahMeta } from "@/lib/quran-api";
import {
  getQuranPerson,
  getProphetPeopleRedirect,
  mushafAyahHref,
  prophetStoryHref,
  PERSON_CATEGORY_LABEL,
  MENTION_TYPE_LABEL,
  type QuranPerson,
} from "@/features/quran-people";
import "@/styles/pages/quran-hub.css";
import "@/styles/pages/quran-people.css";

export default function QuranPersonDetailView() {
  const params = useParams<{ slug?: string }>();
  const slug = params.slug ?? "";
  const [person, setPerson] = useState<QuranPerson | null | undefined>(undefined);
  const [prophetRedirect, setProphetRedirect] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPerson(undefined);
    setProphetRedirect(null);
    void (async () => {
      const p = await getQuranPerson(slug);
      if (cancelled) return;
      if (p) {
        setPerson(p);
        applyPageSeo({
          title: `${p.nameAr} في القرآن`,
          description: p.definition,
          path: `/quran/people/${p.slug}`,
        });
        return;
      }
      const to = await getProphetPeopleRedirect(slug);
      if (cancelled) return;
      if (to) {
        setProphetRedirect(to);
        return;
      }
      setPerson(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (prophetRedirect) {
    return <Redirect to={prophetRedirect} />;
  }

  if (person === undefined) {
    return (
      <SectionTemplatePage
        route="/quran/people"
        title="الذين ذكروا في القرآن"
        subtitle="جاري التحميل…"
        groupTitle="المذكورون في القرآن"
      >
        <p className="qp-people__status" role="status"></p>
      </SectionTemplatePage>
    );
  }

  if (!person) {
    return (
      <SectionTemplatePage
        route="/quran/people"
        title="غير موجود"
        subtitle="لم نجد هذه الشخصية في الفهرس المنشور"
        groupTitle="المذكورون في القرآن"
        breadcrumb={[
          { label: "الرئيسية", href: "/" },
          { label: "الذين ذكروا في القرآن", href: "/quran/people" },
          { label: "غير موجود" },
        ]}
      >
        <p className="qp-people__status">
          <Link href="/quran/people">العودة إلى الذين ذكروا في القرآن</Link>
          {" · "}
          <Link href="/prophets">قصص الأنبياء</Link>
        </p>
      </SectionTemplatePage>
    );
  }

  return (
    <SectionTemplatePage
      route="/quran/people"
      title={person.nameAr}
      subtitle={`${PERSON_CATEGORY_LABEL[person.category]} · ${MENTION_TYPE_LABEL[person.mentionType]}`}
      eyebrow="الذين ذكروا في القرآن"
      groupTitle="مواضع الذكر"
      breadcrumb={[
        { label: "الرئيسية", href: "/" },
        { label: "الذين ذكروا في القرآن", href: "/quran/people" },
        { label: person.nameAr },
      ]}
    >
      <div className="qp-people qp-person-detail" dir="rtl">
        <article className="qp-person-detail__card">
          <h2 className="qp-person-detail__h">التعريف</h2>
          <p>{person.definition}</p>
        </article>

        <article className="qp-person-detail__card">
          <h2 className="qp-person-detail__h">سبب الذكر</h2>
          <p>{person.whyMentioned}</p>
        </article>

        {person.lessons.length > 0 && (
          <article className="qp-person-detail__card">
            <h2 className="qp-person-detail__h">العِبَر</h2>
            <ul>
              {person.lessons.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </article>
        )}

        {(person.prophetSlug || (person.relatedLinks?.length ?? 0) > 0) && (
          <article className="qp-person-detail__card">
            <h2 className="qp-person-detail__h">روابط مرتبطة</h2>
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
          </article>
        )}

        <section className="qp-person-detail__ayahs" aria-labelledby="qp-ayahs-title">
          <h2 id="qp-ayahs-title" className="qp-person-detail__h">مواضع الذكر في المصحف</h2>
          <div className="qp-person-detail__ayah-grid">
            {person.occurrences.map((o) => {
              const surahName = getSurahMeta(o.surah)?.name ?? String(o.surah);
              return (
                <Link
                  key={`${o.surah}:${o.ayah}`}
                  href={mushafAyahHref(o.surah, o.ayah)}
                  className="qp-person-detail__ayah"
                >
                  <span>
                    سورة {surahName} · آية {toArabicDigits(o.ayah)}
                    {o.note ? <span className="qp-person-detail__note">{o.note}</span> : null}
                  </span>
                  <span className="qp-person-detail__open">فتح المصحف</span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </SectionTemplatePage>
  );
}
