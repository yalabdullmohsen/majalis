// ══════════════════════════════════════════════════════
// بطاقات الحفظ — مكوّن العميل
// الموضع: components/memorize/Flashcards.tsx
// يعتمد على: lib/srs.ts + flashcards.css + جداول sr_*
// عدّل سطر استيراد supabase بما يطابق مشروعك.
// ══════════════════════════════════════════════════════

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { schedule, MAX_SESSION, type Rating } from "@/lib/srs";
import "@/styles/pages/flashcards.css";

type DeckSummary = { slug: string; title: string; total: number; due: number; next_due: string | null };
type Card = {
  id: string; deck_slug: string; ordinal: number; face: string; back: string;
  source_ref: string | null; interval: number; ease: number; reps: number;
};

const ar = (n: number) => n.toLocaleString("ar-EG");
const arDate = (d: string) =>
  new Date(d).toLocaleDateString("ar-EG", { day: "numeric", month: "long" });

export default function Flashcards() {
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [queue, setQueue] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [exit, setExit] = useState<Rating | null>(null);
  const [tally, setTally] = useState({ ok: 0, later: 0, hard: 0 });
  const [view, setView] = useState<"decks" | "session" | "result">("decks");
  const [deckTitle, setDeckTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { void loadDecks(); }, []);

  async function loadDecks() {
    setLoading(true);
    const { data } = await supabase.rpc("sr_deck_summary");
    setDecks((data as DeckSummary[]) ?? []);
    setLoading(false);
  }

  async function startSession(deck: DeckSummary) {
    const { data } = await supabase.rpc("sr_due_cards", { p_deck: deck.slug, p_limit: MAX_SESSION });
    const cards = (data as Card[]) ?? [];
    if (!cards.length) return;
    setQueue(cards);
    setIdx(0);
    setTally({ ok: 0, later: 0, hard: 0 });
    setFlipped(false);
    setDeckTitle(deck.title);
    setView("session");
  }

  async function rate(r: Rating) {
    if (!flipped || exit) return;
    const card = queue[idx];
    const next = schedule(card, r);

    setTally(t => ({ ...t, [r]: t[r] + 1 }));
    setExit(r);

    // الحفظ في الخلفية — لا ننتظره حتى لا تتأخر البطاقة التالية
    void supabase.from("sr_reviews").upsert({
      card_id: card.id,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      due_on: next.dueOn,
      interval: next.interval,
      ease: next.ease,
      reps: next.reps,
      lapses: next.lapses,
      last_rating: r,
      updated_at: new Date().toISOString(),
    });

    setTimeout(() => {
      // «صعب» يعيد البطاقة إلى آخر الجلسة
      const q = next.again ? [...queue, { ...card, ...next }] : queue;
      const nextIdx = idx + 1;
      setQueue(q);
      setExit(null);
      setFlipped(false);
      if (nextIdx >= q.length) { setView("result"); void loadDecks(); }
      else setIdx(nextIdx);
    }, 260);
  }

  /* ── شاشة الرزم ── */
  if (view === "decks") {
    const dueCount = decks.filter(d => Number(d.due) > 0).length;
    return (
      <div className="fc">
        <p className="fc-lead">راجِع اليوم</p>
        <p className="fc-sub">
          {loading ? "جارٍ التحميل…"
            : dueCount ? `${ar(dueCount)} رزم فيها بطاقات مستحقة`
            : "لا مراجعة مستحقة"}
        </p>

        {decks.map(d => {
          const due = Number(d.due);
          const cls = due > 0 ? "fc-pill--due" : "fc-pill--rest";
          const label = due > 0 ? "اليوم" : d.next_due ? arDate(d.next_due) : "—";
          return (
            <button key={d.slug} type="button" className="fc-deck-row" onClick={() => void startSession(d)} disabled={!due}>
              <span>
                <b>{d.title}</b>
                <em>{ar(Number(d.total))} بطاقة · {ar(due)} مستحقة</em>
              </span>
              <span className={`fc-pill ${cls}`}>{label}</span>
            </button>
          );
        })}

        {!loading && !dueCount && (
          <div className="fc-empty">
            <div className="fc-dot" />
            <b>لا مراجعة اليوم</b>
            <span>أتممت ما عليك. المراجعة قبل موعدها تُفسد جدولة التكرار المتباعد.</span>
          </div>
        )}
      </div>
    );
  }

  /* ── شاشة النتيجة ── */
  if (view === "result") {
    const total = tally.ok + tally.later + tally.hard;
    return (
      <div className="fc">
        <div className="fc-result">
          <b>{ar(tally.ok)} / {ar(total)}</b>
          <span>بطاقة أتقنتها في هذه الجلسة</span>
        </div>
        <div className="fc-row"><span>أعرفه</span><i>{ar(tally.ok)}</i></div>
        <div className="fc-row"><span>أعِده لاحقًا</span><i>{ar(tally.later)}</i></div>
        <div className="fc-row"><span>صعب</span><i className="is-due">{ar(tally.hard)}</i></div>
        <button type="button" className="fc-cta" onClick={() => setView("decks")}>رجوع إلى الرزم</button>
      </div>
    );
  }

  /* ── شاشة الجلسة ── */
  const card = queue[idx];
  if (!card) return null;

  return (
    <div className="fc">
      <div className="fc-sess">
        <span>{deckTitle}</span>
        <span>{ar(idx + 1)} من {ar(queue.length)}</span>
      </div>
      <div className="fc-sess-bar"><i style={{ width: `${(idx / queue.length) * 100}%` }} /></div>

      <div className="fc-deck">
        <div className="fc-card fc-card--b3" aria-hidden />
        <div className="fc-card fc-card--b2" aria-hidden />
        <button
          type="button"
          className="fc-card fc-card--front"
          data-flipped={flipped}
          data-exit={exit ?? undefined}
          onClick={() => setFlipped(true)}
          aria-label={flipped ? "التكملة ظاهرة" : "اكشف التكملة"}
        >
          <span className="fc-face">
            <span className="fc-badge">{card.deck_slug === "arbaeen" ? `حديث ${ar(card.ordinal)}` : "بطاقة"}</span>
            <span className="fc-q">{card.face}</span>
            <span className="fc-hint">اضغط البطاقة لكشف التكملة</span>
            {card.source_ref ? <span className="fc-src">{card.source_ref}</span> : null}
          </span>
          <span className="fc-face fc-face--back">
            <span className="fc-a">{card.back}</span>
            <span className="fc-src">{card.source_ref}</span>
          </span>
        </button>
      </div>

      <div className="fc-rate">
        <button type="button" className="is-hard"  disabled={!flipped} onClick={() => void rate("hard")}>صعب</button>
        <button type="button" className="is-later" disabled={!flipped} onClick={() => void rate("later")}>أعِده لاحقًا</button>
        <button type="button" className="is-ok"    disabled={!flipped} onClick={() => void rate("ok")}>أعرفه</button>
      </div>
    </div>
  );
}
