import type { ShariaRulingExtended } from "@/lib/rulings-types";
import type { RulingRelationLink } from "@/lib/rulings-types";
import { RELATION_TYPE_LABELS } from "@/lib/rulings-relations";
import { Link } from "wouter";
import FavoriteButton from "@/components/FavoriteButton";
import { AdminInlineEdit } from "@/components/AdminInlineEdit";

type Props = {
  ruling: ShariaRulingExtended;
  relations: RulingRelationLink[];
};

export function RulingDetailSections({ ruling, relations }: Props) {
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: ruling.title, url }).catch(() => {});
    } else {
      await navigator.clipboard?.writeText(url);
    }
  };

  const copyLink = () => navigator.clipboard?.writeText(window.location.href);

  return (
    <>
      <div className="ruling-detail-actions">
        <button type="button" className="ui-card-btn" onClick={share}>
          مشاركة
        </button>
        <AdminInlineEdit
          contentType="ruling"
          contentId={ruling.id}
          initialData={{ title: ruling.title, category: ruling.category, subcategory: ruling.subcategory, content: ruling.body, evidence: ruling.evidence }}
          className="ui-card-btn"
        />
        <button type="button" className="ui-card-btn" onClick={copyLink}>
          نسخ الرابط
        </button>
        <button type="button" className="ui-card-btn" onClick={() => window.print()}>
          طباعة
        </button>
        <FavoriteButton contentType="sharia_ruling" contentId={ruling.id} compact />
      </div>

      {(ruling.quran_evidence?.length ?? 0) > 0 && (
        <section className="ruling-detail-block ui-card">
          <h2>الدليل من القرآن</h2>
          <ul>
            {ruling.quran_evidence!.map((ev, i) => (
              <li key={i}>
                {ev.text}
                {ev.source && <em> — {ev.source}</em>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(ruling.sunnah_evidence?.length ?? 0) > 0 && (
        <section className="ruling-detail-block ui-card">
          <h2>الدليل من السنة</h2>
          <ul>
            {ruling.sunnah_evidence!.map((ev, i) => (
              <li key={i}>
                {ev.text}
                {ev.source && <em> — {ev.source}</em>}
                {ruling.hadith_grade && i === 0 && <span className="ruling-hadith-grade"> ({ruling.hadith_grade})</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(ruling.scholar_opinions?.length ?? 0) > 0 && (
        <section className="ruling-detail-block ui-card">
          <h2>أقوال العلماء</h2>
          <ul>
            {ruling.scholar_opinions!.map((op, i) => (
              <li key={i}>
                <strong>{op.scholar}:</strong> {op.opinion}
                {op.isPrevailing && <span className="ruling-card__badge"> الراجح</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {ruling.prevailing_view && (
        <section className="ruling-detail-block ui-card ruling-prevailing">
          <h2>الراجح</h2>
          <p>{ruling.prevailing_view}</p>
        </section>
      )}

      {(ruling.benefits?.length ?? 0) > 0 && (
        <section className="ruling-detail-block ui-card">
          <h2>الفوائد</h2>
          <ul>
            {ruling.benefits!.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </section>
      )}

      {((ruling.evidence?.length ?? 0) > 0 || (ruling.references?.length ?? 0) > 0) && (
        <section className="ruling-detail-block ui-card">
          <h2>المراجع</h2>
          <ul>
            {[...(ruling.evidence ?? []), ...(ruling.references ?? [])].map((ref, i) => (
              <li key={i}>
                {ref.type && <strong>{ref.type}: </strong>}
                {ref.text}
                {ref.source && <> — <em>{ref.source}</em></>}
                {ref.url && (
                  <>
                    {" "}
                    <a href={ref.url} target="_blank" rel="noopener noreferrer">
                      رابط
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {relations.length > 0 && (
        <section className="ruling-detail-block ui-card">
          <h2>الربط الذكي</h2>
          {Object.entries(
            relations.reduce<Record<string, RulingRelationLink[]>>((acc, link) => {
              if (!acc[link.type]) acc[link.type] = [];
              acc[link.type].push(link);
              return acc;
            }, {}),
          ).map(([type, links]) => (
            <div key={type} className="ruling-relations-group">
              <h3>{RELATION_TYPE_LABELS[type] || type}</h3>
              <ul>
                {links.map((link) => (
                  <li key={`${type}-${link.id}`}>
                    <Link href={link.href}>{link.title}</Link>
                    {link.meta && <span className="ruling-relation-meta"> — {link.meta}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {ruling.source_origin && (
        <p className="ruling-source-origin">
          <small>المصدر: {ruling.source_origin}</small>
        </p>
      )}
    </>
  );
}
