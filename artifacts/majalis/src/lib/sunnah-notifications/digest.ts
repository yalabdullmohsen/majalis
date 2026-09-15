/**
 * تجميع محتوى جديد في ملخص يومي — بدل إشعارات متفرقة.
 */

export type DigestCandidate = {
  id: string;
  title: string;
  href?: string;
  createdAtIso: string;
};

export type DigestBundle = {
  dayKey: string;
  items: DigestCandidate[];
  title: string;
  body: string;
};

function dayKeyFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "invalid";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** يبني ملخصًا عربيًا هادئًا دون ضغط تسويقي. */
export function composeContentDigest(
  items: DigestCandidate[],
  opts?: { nowIso?: string; maxItems?: number },
): DigestBundle | null {
  const max = Math.max(1, opts?.maxItems ?? 5);
  const nowIso = opts?.nowIso ?? new Date().toISOString();
  const today = dayKeyFromIso(nowIso);
  const todayItems = items
    .filter((i) => dayKeyFromIso(i.createdAtIso) === today)
    .slice(0, max);
  if (todayItems.length === 0) return null;

  const title =
    todayItems.length === 1
      ? "محتوى جديد في سُنّة"
      : `${todayItems.length} إضافات جديدة في سُنّة`;

  const lines = todayItems.map((i, idx) => `${idx + 1}. ${i.title}`);
  const body =
    lines.length === 1
      ? todayItems[0]!.title
      : `ملخص اليوم:\n${lines.join("\n")}`;

  return { dayKey: today, items: todayItems, title, body };
}

export function digestDedupeKey(bundle: DigestBundle): string {
  return `digest:new_content:${bundle.dayKey}`;
}
