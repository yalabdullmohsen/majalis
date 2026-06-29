import { useState } from "react";
import type { ScholarProfile } from "@/lib/scholar-biography";
import { buildPublicBiographySections, hasPublicBiography } from "@/lib/scholar-biography";
import { ScholarCollapsibleCard } from "./ScholarCollapsibleCard";

export function ScholarBiographySection({ profile }: { profile: ScholarProfile }) {
  const [expanded, setExpanded] = useState(false);
  const sections = buildPublicBiographySections(profile);

  if (!hasPublicBiography(profile)) {
    return null;
  }

  if (!expanded) {
    return (
      <section className="scholar-bio-teaser">
        <h2 className="scholar-bio-teaser-title">السيرة الذاتية</h2>
        {profile.bio && <p className="scholar-bio-teaser-intro">{profile.bio}</p>}
        {sections.length > 0 && (
          <button type="button" className="ds-btn ds-btn--primary scholar-bio-teaser-btn" onClick={() => setExpanded(true)}>
            عرض السيرة
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="scholar-bio-expanded" aria-label="السيرة الذاتية">
      <div className="scholar-bio-expanded-header">
        <h2>السيرة الذاتية</h2>
        <button type="button" className="ds-btn ds-btn--ghost ds-btn--sm" onClick={() => setExpanded(false)}>
          إخفاء
        </button>
      </div>

      {profile.bio && <p className="scholar-bio-intro">{profile.bio}</p>}

      {sections.map((section) => (
        <ScholarCollapsibleCard key={section.key} title={section.label}>
          {section.type === "text" && section.text && (
            <p className="scholar-bio-text">{section.text}</p>
          )}
          {section.type === "list" && section.items && (
            <ul className="scholar-bio-list">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {section.type === "accounts" && section.accounts && (
            <div className="scholar-links-row">
              {section.accounts.map((acc) => (
                <a
                  key={acc.url}
                  href={acc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ds-btn ds-btn--ghost ds-btn--sm"
                >
                  {acc.platform}
                </a>
              ))}
            </div>
          )}
        </ScholarCollapsibleCard>
      ))}
    </section>
  );
}
