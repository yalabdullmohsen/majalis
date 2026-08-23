import { useEffect, useMemo } from "react";
import { Link } from "wouter";
import { ArrowRight, ExternalLink, Trophy } from "lucide-react";
import { ShareButtons } from "@/components/ContentActions";
import { DirectionalIcon } from "@/components/DirectionalIcon";
import { applyPageSeo } from "@/lib/seo";
import {
  COMPETITION_TYPE_LABELS,
  buildCompetitionShareText,
  formatCompetitionDate,
  getCompetitionById,
  registrationIsOpen,
} from "@/lib/competitions";
import "./competitions.css";

export default function CompetitionDetailView({ params }: { params: { id: string } }) {
  const item = useMemo(() => getCompetitionById(params.id), [params.id]);

  useEffect(() => {
    if (!item) {
      applyPageSeo({
        path: `/competitions/${params.id}`,
        title: "المسابقة غير موجودة | المجلس العلمي",
        description: "لم يُعثر على إعلان هذه المسابقة.",
      });
      return;
    }
    applyPageSeo({
      path: `/competitions/${item.id}`,
      title: `${item.title} | المسابقات`,
      description: item.description || `${item.title} — ${item.organizerName}`,
      keywords: ["مسابقة", item.title, item.organizerName],
    });
  }, [item, params.id]);

  if (!item) {
    return (
      <div className="cmp-detail" dir="rtl">
        <p role="status">لم يُعثر على هذه المسابقة.</p>
        <Link href="/competitions" className="cmp-btn cmp-btn--ghost">
          العودة إلى المسابقات
        </Link>
      </div>
    );
  }

  const open = registrationIsOpen(item.registrationStatus);
  const deadline = formatCompetitionDate(item.registrationDeadline);
  const start = formatCompetitionDate(item.startDate);
  const end = formatCompetitionDate(item.endDate);
  const shareText = buildCompetitionShareText(item);
  const pageUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${(import.meta.env.BASE_URL || "/").replace(/\/$/, "")}/competitions/${item.id}`
      : `https://www.majlisilm.com/competitions/${item.id}`;

  return (
    <div className="cmp-detail" dir="rtl" data-competition-detail="1">
      <Link href="/competitions" className="cmp-detail__back">
        <DirectionalIcon icon={ArrowRight} size={16} />
        المسابقات
      </Link>

      {!open ? (
        <div className="cmp-detail__alert" role="status">
          انتهى التسجيل أو أُغلق — لا يمكن التسجيل عبر هذه الصفحة.
        </div>
      ) : null}

      {item.imageUrl ? (
        <div className="cmp-detail__hero">
          <img src={item.imageUrl} alt="" />
        </div>
      ) : (
        <div className="cmp-detail__hero cmp-detail__hero--fallback" aria-hidden>
          <Trophy size={40} strokeWidth={1.4} />
        </div>
      )}

      <h1 className="cmp-detail__title">{item.title}</h1>
      <p className="cmp-detail__org">{item.organizerName}</p>

      <div className="cmp-card__badges">
        <span className="cmp-badge">{COMPETITION_TYPE_LABELS[item.competitionType]}</span>
        <span className={`cmp-badge ${open ? "cmp-badge--open" : "cmp-badge--closed"}`}>
          {item.registrationStatus}
        </span>
        {item.prizeText ? <span className="cmp-badge cmp-badge--prize">جوائز</span> : null}
      </div>

      {item.description ? <p className="cmp-detail__desc">{item.description}</p> : null}

      <dl className="cmp-detail__dl">
        {item.prizeText ? (
          <>
            <dt>الجوائز</dt>
            <dd>{item.prizeText}</dd>
          </>
        ) : null}
        <dt>الفئة المستهدفة</dt>
        <dd>{item.genderTarget}</dd>
        {(start || end) && (
          <>
            <dt>الموعد</dt>
            <dd>
              {start || "—"}
              {end ? ` → ${end}` : ""}
            </dd>
          </>
        )}
        {deadline ? (
          <>
            <dt>آخر موعد للتسجيل</dt>
            <dd>{deadline}</dd>
          </>
        ) : null}
        <dt>المكان</dt>
        <dd>{item.isRemote ? "عن بعد" : item.location || "غير محدد"}</dd>
        {item.requirements && item.requirements.length > 0 ? (
          <>
            <dt>الشروط</dt>
            <dd>
              <ul>
                {item.requirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </dd>
          </>
        ) : null}
        {item.levels && item.levels.length > 0 ? (
          <>
            <dt>المستويات</dt>
            <dd>{item.levels.join(" · ")}</dd>
          </>
        ) : null}
        {item.sourceUrl ? (
          <>
            <dt>المصدر</dt>
            <dd>
              <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                {item.sourceName || "رابط المصدر"} <ExternalLink size={12} aria-hidden />
              </a>
            </dd>
          </>
        ) : null}
      </dl>

      <div className="cmp-card__actions">
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
          <span className="cmp-btn cmp-btn--disabled">انتهى التسجيل</span>
        ) : null}
      </div>

      <div className="twh-share">
        <ShareButtons title={shareText} url={pageUrl} />
      </div>
    </div>
  );
}
