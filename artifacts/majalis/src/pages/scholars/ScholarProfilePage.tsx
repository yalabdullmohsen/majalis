import { useEffect } from "react";
import { Link, Redirect, useParams } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import {
  listScholarProfiles,
  resolveScholarSlug,
  type ScholarProfile,
} from "@/data/scholars-profiles";
import NotFound from "@/views/not-found";
import { ShareButtons } from "@/components/ContentActions";
import "@/styles/pages/scholar-profile.css";

function ScholarProfileView({ profile }: { profile: ScholarProfile }) {
  useEffect(() => {
    applyPageSeo({
      path: `/scholars/${profile.slug}`,
      title: `${profile.name} | سُنّة`,
      description: profile.summary.slice(0, 155),
      keywords: [profile.name, profile.fullName, ...profile.specialty, "علماء"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Person",
          name: profile.fullName,
          alternateName: profile.name,
          description: profile.summary,
          url: `https://majlisilm.com/scholars/${profile.slug}`,
          jobTitle: profile.specialty.join(" · "),
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: profile.faq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        },
      ],
    });
  }, [profile]);

  return (
    <main className="sp-page" dir="rtl" lang="ar">
      <header className="sp-hero">
        <p className="sp-hero__eyebrow">علماء الأمة</p>
        <h1 className="sp-hero__title">{profile.name}</h1>
        <p className="sp-hero__full">{profile.fullName}</p>
        <p className="sp-hero__meta">
          {[profile.born ? `وُلد ${profile.born}` : null, `تُوفي ${profile.died}`, profile.era]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <ul className="sp-tags" aria-label="التخصصات">
          {profile.specialty.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </header>

      <section className="sp-section" aria-labelledby="sp-sum">
        <h2 id="sp-sum">نبذة</h2>
        <p>{profile.summary}</p>
        {profile.methodology ? (
          <>
            <h3>منهجه</h3>
            <p>{profile.methodology}</p>
          </>
        ) : null}
      </section>

      <section className="sp-section" aria-labelledby="sp-works">
        <h2 id="sp-works">أهم المؤلفات</h2>
        <ul className="sp-list">
          {profile.works.map((w) => (
            <li key={w.title}>
              {w.href ? <Link href={w.href}>{w.title}</Link> : <strong>{w.title}</strong>}
              {w.note ? <span className="sp-note"> — {w.note}</span> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="sp-section" aria-labelledby="sp-src">
        <h2 id="sp-src">مصادر الترجمة</h2>
        <ul className="sp-list">
          {profile.sources.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section className="sp-section" aria-labelledby="sp-faq">
        <h2 id="sp-faq">أسئلة مختصرة</h2>
        <dl className="sp-faq">
          {profile.faq.map((item) => (
            <div key={item.q}>
              <dt>{item.q}</dt>
              <dd>{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <nav className="sp-related" aria-label="روابط ذات صلة">
        {profile.related.map((r) => (
          <Link key={r.href} href={r.href} className="sp-related__link">
            {r.label}
          </Link>
        ))}
        <Link href="/scholars" className="sp-related__link">
          فهرس العلماء
        </Link>
      </nav>

      <div className="sp-share">
        <ShareButtons
          title={`${profile.name} — سُنّة`}
          url={`https://majlisilm.com/scholars/${profile.slug}`}
        />
      </div>
    </main>
  );
}

function ScholarsIndexPage() {
  const profiles = listScholarProfiles();
  useEffect(() => {
    applyPageSeo({
      path: "/scholars",
      title: "علماء الأمة | سُنّة",
      description: "تراجم موجزة لأئمة الحديث والفقه والتفسير: مالك والنووي والبخاري والشافعي وغيرهم.",
      keywords: ["علماء", "أئمة", "مالك", "النووي", "البخاري"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "علماء الأمة",
          numberOfItems: profiles.length,
          itemListElement: profiles.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: p.name,
            url: `https://majlisilm.com/scholars/${p.slug}`,
          })),
        },
      ],
    });
  }, [profiles]);

  return (
    <main className="sp-page" dir="rtl" lang="ar">
      <header className="sp-hero">
        <p className="sp-hero__eyebrow">سُنّة</p>
        <h1 className="sp-hero__title">علماء الأمة</h1>
        <p className="sp-hero__full">
          تراجم موجزة موثّقة — ليست تحويلًا إلى مذهب أو كتاب مختصر باسم العالِم.
        </p>
      </header>
      <ul className="sp-index">
        {profiles.map((p) => (
          <li key={p.slug}>
            <Link href={`/scholars/${p.slug}`} className="sp-index__card">
              <strong>{p.name}</strong>
              <span>{p.fullName}</span>
              <em>ت {p.died}</em>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

function ScholarGonePage({ slug }: { slug: string }) {
  useEffect(() => {
    applyPageSeo({
      path: `/scholars/${slug}`,
      title: "الصفحة أُزيلت | سُنّة",
      description: "أُزيل هذا المعرّف القديم أو المكرر من فهرس العلماء.",
      robots: "noindex, nofollow",
    });
  }, [slug]);

  return (
    <main className="sp-page sp-page--gone" dir="rtl" lang="ar">
      <h1>المعرّف غير متاح (410)</h1>
      <p>هذا الرابط يشير إلى سجل قديم خاطئ أو مكرر، وأُزيل عمدًا.</p>
      <p>
        <Link href="/scholars">فهرس العلماء</Link>
        {" · "}
        <Link href="/tarikh-islami">التاريخ الإسلامي</Link>
      </p>
    </main>
  );
}

export default function ScholarProfilePage() {
  const params = useParams<{ id?: string }>();
  const id = params?.id;

  if (!id) return <ScholarsIndexPage />;

  const resolved = resolveScholarSlug(id);
  if (resolved.kind === "alias" && resolved.slug) {
    return <RedirectToCanonical slug={resolved.slug} />;
  }
  if (resolved.kind === "gone") {
    return <ScholarGonePage slug={id} />;
  }
  if (resolved.kind === "profile" && resolved.profile) {
    return <ScholarProfileView profile={resolved.profile} />;
  }
  return <NotFound />;
}

function RedirectToCanonical({ slug }: { slug: string }) {
  return <Redirect to={`/scholars/${slug}`} />;
}

export function ScholarsHubPage() {
  return <ScholarsIndexPage />;
}
