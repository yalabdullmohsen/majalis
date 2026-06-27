"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui-common";
import { getAllChallengeStatuses, type ChallengeId } from "@/lib/challenges";

function ChallengeBar({ id, title, description, current, target, percent, done }: {
  id: ChallengeId;
  title: string;
  description: string;
  current: number;
  target: number;
  percent: number;
  done: boolean;
}) {
  return (
    <article className={`challenge-card${done ? " challenge-card--done" : ""}`} data-challenge={id}>
      <div className="challenge-card__head">
        <strong>{title}</strong>
        <span>{current}/{target}</span>
      </div>
      <p>{description}</p>
      <div className="challenge-card__bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="challenge-card__fill" style={{ width: `${percent}%` }} />
      </div>
      {done && <p className="challenge-card__done">✓ أُنجزت اليوم</p>}
    </article>
  );
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState(getAllChallengeStatuses());

  useEffect(() => {
    const refresh = () => setChallenges(getAllChallengeStatuses());
    window.addEventListener("majalis-challenges-updated", refresh);
    window.addEventListener("majalis-activity-updated", refresh);
    return () => {
      window.removeEventListener("majalis-challenges-updated", refresh);
      window.removeEventListener("majalis-activity-updated", refresh);
    };
  }, []);

  const completedCount = challenges.filter((c) => c.done).length;

  return (
    <div className="platform-page challenges-page">
      <PageHeader
        eyebrow="تحدٍّ يومي"
        title="مركز التحديات"
        subtitle={`أنجزت ${completedCount} من ${challenges.length} تحديات اليوم`}
      />

      <div className="challenges-grid">
        {challenges.map((c) => (
          <ChallengeBar key={c.id} {...c} />
        ))}
      </div>
    </div>
  );
}
