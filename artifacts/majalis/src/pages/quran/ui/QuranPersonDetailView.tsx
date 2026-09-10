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

function splitReadableParagraphs(text: string): string[] {
  const raw = String(text || "").replace(/\s+/g, " ").trim();
  if (!raw) return [];
  const sentences = raw.split(/(?<=[.۔!?؟])\s+/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length <= 2) return [raw];
  const paras: string[] = [];
  let buf: string[] = [];
  let len = 0;
  for (const s of sentences) {
    buf.push(s);
    len += s.length;
    if (buf.length >= 2 && len >= 140) {
      paras.push(buf.join(" "));
      buf = [];
      len = 0;
    }
  }
  if (buf.length) paras.push(buf.join(" "));
  return paras;
}

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
        const seoDesc = String(p.definition || "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 155);
        applyPageSeo({
          title: `${p.nameAr} في القرآن`,
          description: seoDesc,
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
        subtitle="تحديث المحتوى"
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

  const definitionParas = splitReadableParagraphs(person.definition);
  const whyParas = splitReadableParagraphs(person.whyMentioned);

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
          <div className="qp-person-detail__prose">
            {definitionParas.map((para) => (
              <p key={para.slice(0, 48)}>{para}</p>
            ))}
          </div>
        </article>

        <article className="qp-person-detail__card">
          <h2 className="qp-person-detail__h">سبب الذكر</h2>
          <div className="qp-person-detail__prose">
            {whyParas.map((para) => (
              <p key={para.slice(0, 48)}>{para}</p>
            ))}
          </div>
        </article>

        {person.lessons.length > 0 && (
          <article className="qp-person-detail__card">
            <h2 className="qp-person-detail__h">العِبَر</h2>
            <ul className="qp-person-detail__lessons">
              {person.lessons.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </article>
        )}

        {(person.prophetSlug || (person.relatedLinks?.length ?? 0) > 0) && (
          <article className="qp-person-detail__card">
            <h2 className="qp-person-detail__h">روابط مرتبطة</h2>
            <ul className="qp-person-detail__links">
              {person.prophetSlug && (
                <li>
                  <Link href={prophetStoryHref(person.prophetSlug)}>
                    قصة {person.nameAr} في قصص الأنبياء
                  </Link>
                </li>
              )}
              {person.relatedLinks?.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </article>
        )}

        <section className="qp-person-detail__ayahs" aria-labelledby="qp-ayahs-title">
          <h2 id="qp-ayahs-title" className="qp-person-detail__h">
            مواضع الذكر في المصحف
          </h2>
          <p className="qp-person-detail__ayah-lead">
            {toArabicDigits(person.occurrences.length)} موضع — اضغط للانتقال إلى الآية في المصحف.
          </p>
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
                    سورة {surahName}
                    <span className="qp-person-detail__ayah-meta">
                      {" "}
                      · آية {toArabicDigits(o.ayah)}
                    </span>
                    {o.note ? <span className="qp-person-detail__note">{o.note}</span> : null}
                  </span>
                  <span className="qp-person-detail__open">المصحف</span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </SectionTemplatePage>
  );
}
