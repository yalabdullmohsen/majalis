/**
 * شبكة معلومات سريعة — بطاقات موجودة فقط، عمودان على الهاتف.
 */
import type { ReactNode } from "react";
import { ProphetTopicCard } from "@/components/prophets/ProphetTopicCard";

export type ProphetQuickFact = {
  id: string;
  label: string;
  value: ReactNode;
  wide?: boolean;
  meterPct?: number;
};

type Props = {
  facts: ProphetQuickFact[];
};

export function ProphetQuickFacts({ facts }: Props) {
  if (!facts.length) return null;

  return (
    <div
      className="prophet-quick-facts prophet-facts-grid"
      data-component="ProphetQuickFacts"
      data-testid="prophet-quick-facts"
      role="list"
      aria-label="معلومات سريعة"
    >
      {facts.map((fact) => (
        <div key={fact.id} role="listitem">
          <ProphetTopicCard
            label={fact.label}
            value={fact.value}
            wide={fact.wide}
            meterPct={fact.meterPct}
          />
        </div>
      ))}
    </div>
  );
}
