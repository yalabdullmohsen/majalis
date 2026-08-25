import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ExternalLink, MapPin, Trophy } from "lucide-react";
import { ShareButtons } from "@/components/ContentActions";
import { SectionLobby } from "@/components/lobby/SectionLobby";
import { usePageView } from "@/hooks/usePageView";
import { applyPageSeo } from "@/lib/seo";
import {
  COMPETITION_FILTERS,
  COMPETITION_TYPE_LABELS,
  filterCompetitions,
  formatCompetitionDate,
  listPublishedCompetitions,
  registrationIsOpen,
  type CompetitionFilterId,
  type ExternalCompetition,
} from "@/lib/competitions";
import "@/components/sections/section-cards.css";
import "./competitions.css";

function CompetitionCard({ item }: { item: ExternalCompetition }) {
  const open = registrationIsOpen(item.registrationStatus);
  const deadline = formatCompetitionDate(item.registrationDeadline);
  const typeLabel = COMPETITION_TYPE_LABELS[item.competitionType];

  return (
    <article className="cmp-card" data-competition-card="1" data-status={item.registrationStatus}>
      {item.imageUrl ? (
        <div className="cmp-card__media">
          <img src={item.imageUrl} alt="" loading="lazy" decoding="async" />
        </div>
      ) : (
        <div className="cmp-card__media cmp-card__media--fallback" aria-hidden>
          <Trophy size={28} strokeWidth={1.5} />
        </div>
      )}
      <div className="cmp-card__body">
        <div className="cmp-card__badges">
          <span className="cmp-badge">{typeLabel}</span>
          <span className={`cmp-badge ${open ? "cmp-badge--open" : "cmp-badge--closed"}`}>
            {item.registrationStatus}
          </span>
          {item.prizeText ? <span className="cmp-badge cmp-badge--prize">جوائز</span> : null}
        </div>
        <h2 className="cmp-card__title">
          <Link href={`/competitions/${item.id}`}>{item.title}</Link>
        </h2>
        <p className="cmp-card__org">{item.organizerName}</p>
        {deadline ? <p className="cmp-card__meta">آخر موعد للتسجيل: {deadline}</p> : null}
        {(item.location || item.isRemote) && (
          <p className="cmp-card__meta">
            <MapPin size={14} aria-hidden /> {item.isRemote ? "عن بعد" : item.location}
          </p>
        )}
        <div className="cmp-card__actions">
          <Link href={`/competitions/${item.id}`} className="cmp-btn cmp-btn--ghost">
            عرض التفاصيل
          </Link>
          {open && item.registrationUrl ? (
            <a
              className="cmp-btn cmp-btn--primary"
              href={item.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              التسجيل <ExternalLink size={14} aria-hidden />
            </a>
          ) : !open ? (
            <span className="cmp-btn cmp-btn--disabled" aria-disabled="true">
              انتهى التسجيل
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function CompetitionsHubView() {
  const [filter, setFilter] = useState<CompetitionFilterId>("all");
  const all = useMemo(() => listPublishedCompetitions(), []);
  const items = useMemo(() => filterCompetitions(all, filter), [all, filter]);

  usePageView("competitions", null);

  useEffect(() => {
    applyPageSeo({
      path: "/competitions",
      title: "المسابقات | المجلس العلمي",
      description:
        "إعلانات مسابقات خارجية قرآنية وحديثية وتجويدية، مع روابط التسجيل والمصدر.",
      keywords: ["مسابقات", "حفظ قرآن", "تسميع", "الماهر", "حديث", "جوائز", "المجلس العلمي"],
    });
  }, []);

  return (
    <SectionLobby lobbyId="hub" title="المسابقات" groups={[]}>
      <div className="cmp-hub" data-competitions-hub="1">
        <p className="cmp-hub__lead">
          إعلانات مسابقات خارجية قرآنية وحديثية وتجويدية، مع روابط التسجيل والمصدر. وليست
          أسئلة داخل التطبيق.
        </p>

        <div className="cmp-filters" role="toolbar" aria-label="تصفية المسابقات">
          {COMPETITION_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={filter === f.id ? "cmp-filter cmp-filter--active" : "cmp-filter"}
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="cmp-empty" role="status" data-competitions-empty="1">
            <Trophy size={36} strokeWidth={1.4} aria-hidden />
            <p>لا مسابقات منشورة حاليًا. نضيف مسابقات موثوقة عند توفرها بإذن الله.</p>
            <p className="cmp-empty__hint">
              يمكنك في الأثناء الاستفادة من{" "}
              <Link href="/quiz">الاختبارات</Link>
              {" "}و{" "}
              <Link href="/lessons">الدروس</Link>.
            </p>
          </div>
        ) : (
          <div className="cmp-grid">
            {items.map((item) => (
              <CompetitionCard key={item.id} item={item} />
            ))}
          </div>
        )}

        <div className="twh-share">
          <ShareButtons title="المسابقات — المجلس العلمي" url="https://majlisilm.com/competitions" />
        </div>
      </div>
    </SectionLobby>
  );
}
