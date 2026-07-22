import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  Award, BookOpen, CheckCircle2, Handshake, Library, Lightbulb, RefreshCw, ScrollText, Moon, Search, Send, Star, Scale, Building2, Landmark, Gem, Trophy, User, Users, XCircle, Zap,
  type LucideIcon,
} from "lucide-react";
import {
  ALL_QUESTIONS,
  GAME_CATEGORIES,
  mergeSupabaseQuestions,
  pickQuestion,
  type CategoryQuestions,
  type PointValue,
  type QuizQuestion,
} from "@/data/islamicQuizData";
import { getQuizQuestions, getLocalUsedQuizIds, markQuizQuestionUsed } from "@/lib/supabase";
import { recordQuizAttempt } from "@/lib/quiz-performance-service";
import { hapticNotify } from "@/lib/capacitor-utils";

// ─── Icon renderer ─────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  "scroll-text": ScrollText,
  moon: Moon,
  star: Star,
  scale: Scale,
  "building-2": Building2,
  landmark: Landmark,
  gem: Gem,
};

function CategoryIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = CATEGORY_ICONS[name];
  return Icon ? <Icon size={size} aria-hidden="true" /> : null;
}

// ─── Types ─────────────────────────────────────────────────────────────────
//
// نمط اللعب: "solo" (لاعب واحد، لا دوران أدوار، لا خصم) أو "team" (2-4 فرق
// تتناوب الأدوار). TeamId أصبح string ديناميكيًا ("team1".."team4" أو "solo")
// بدل union ثابت بقيمتين — teams أصبح مصفوفة بطول 1-4 بدل Tuple ثابت.

type GameMode = "solo" | "team";
type TeamId = string;
interface Lifelines { penalize: boolean; eliminate: boolean; pass: boolean; }

interface Team {
  id: TeamId;
  name: string;
  score: number;
  lifelines: Lifelines;
}

interface Cell {
  categoryId: string;
  points: PointValue;
  used: boolean;
}

type Phase = "setup" | "board" | "question" | "winner";

interface GameState {
  mode: GameMode;
  phase: Phase;
  teams: Team[];
  activeTeamId: TeamId;
  selectedCategories: string[];
  board: Cell[][];
  activeCell: Cell | null;
  activeQuestion: QuizQuestion | null;
  /** الفريق الذي أُرسل إليه السؤال حاليًا (تمرير حر أو وسيلة "تمرير") — null إن لم يُرسَل بعد. */
  passedToTeamId: TeamId | null;
  usedIds: string[];
  showHint: boolean;
}

type Action =
  | { type: "START_GAME"; mode: GameMode; categories: string[]; names: string[] }
  | { type: "SELECT_CELL"; cell: Cell; pool: Record<string, CategoryQuestions>; persistedUsedIds?: Set<string> }
  | { type: "REVEAL_HINT" }
  | { type: "MARK_CORRECT" }
  | { type: "MARK_WRONG" }
  | { type: "USE_LIFELINE_PENALIZE"; targetId: TeamId }
  | { type: "USE_LIFELINE_ELIMINATE" }
  | { type: "PASS_QUESTION"; targetId: TeamId }
  | { type: "TRANSFER_QUESTION"; targetId: TeamId }
  | { type: "SOLO_SKIP" }
  | { type: "RESET" };

// ─── Palette — منسجمة مع design system المنصة ─────────────────────────────

const S = {
  bg:          "var(--ds-parchment)",
  card:        "#ffffff",
  cardAlt:     "var(--ds-parchment-deep)",
  border:      "var(--ds-line-color)",
  ink:         "var(--ds-ink)",
  inkSoft:     "var(--ds-ink-soft)",
  gold:        "var(--majalis-brass)",
  goldDeep:    "var(--majalis-brass-deep)",
  emerald:     "var(--ds-emerald)",
  emeraldDeep: "var(--ds-emerald-deep)",
  emeraldSoft: "var(--ds-emerald-soft)",
  correct:     "var(--majalis-emerald, #173D35)",
  wrong:       "var(--majalis-danger, #9B1C1C)",
} as const;

// ─── Reducer helpers ───────────────────────────────────────────────────────

function makeTeam(id: TeamId, name: string): Team {
  return { id, name, score: 0, lifelines: { penalize: true, eliminate: true, pass: true } };
}

/** دوران الأدوار العام: يعمل لأي عدد فرق (1-4) — يدور للفريق التالي في المصفوفة.
 *  لفريق واحد (وضع فردي) يعيد نفس المعرّف دائمًا (idx+1 % 1 === idx). */
function nextTeamId(teams: Team[], currentId: TeamId): TeamId {
  const idx = teams.findIndex((t) => t.id === currentId);
  if (idx === -1) return currentId;
  return teams[(idx + 1) % teams.length].id;
}

function isBoardDone(board: Cell[][]): boolean {
  return board.every((col) => col.every((c) => c.used));
}

function buildBoard(categories: string[]): Cell[][] {
  return categories.map((catId) =>
    ([200, 400, 600] as PointValue[]).map((pts) => ({ categoryId: catId, points: pts, used: false })),
  );
}

const DEFAULT_TEAM_NAMES = ["الفريق الأول", "الفريق الثاني", "الفريق الثالث", "الفريق الرابع"];

const initial: GameState = {
  mode: "team",
  phase: "setup",
  teams: [makeTeam("team1", DEFAULT_TEAM_NAMES[0]), makeTeam("team2", DEFAULT_TEAM_NAMES[1])],
  activeTeamId: "team1",
  selectedCategories: [],
  board: [],
  activeCell: null,
  activeQuestion: null,
  passedToTeamId: null,
  usedIds: [],
  showHint: false,
};

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "START_GAME": {
      const teams = action.mode === "solo"
        ? [makeTeam("solo", action.names[0]?.trim() || "اللاعب")]
        : action.names.map((n, i) => makeTeam(`team${i + 1}`, n));
      return {
        ...initial,
        mode: action.mode,
        phase: "board",
        teams,
        activeTeamId: teams[0].id,
        selectedCategories: action.categories,
        board: buildBoard(action.categories),
      };
    }

    case "SELECT_CELL": {
      const usedSet = new Set(state.usedIds);
      const q = pickQuestion(action.cell.categoryId, action.cell.points, usedSet, action.pool, action.persistedUsedIds);
      return { ...state, phase: "question", activeCell: action.cell, activeQuestion: q, passedToTeamId: null, showHint: false };
    }

    case "REVEAL_HINT":
      return { ...state, showHint: true };

    case "MARK_CORRECT": {
      const winnerId = state.passedToTeamId ?? state.activeTeamId;
      const pts = state.activeCell?.points ?? 0;
      const teams = state.teams.map((t) =>
        t.id === winnerId ? { ...t, score: t.score + pts } : t,
      );
      const board = markCellUsed(state.board, state.activeCell);
      const usedIds = state.activeQuestion ? [...state.usedIds, state.activeQuestion.id] : state.usedIds;
      return {
        ...state,
        phase: isBoardDone(board) ? "winner" : "board",
        teams,
        board,
        usedIds,
        activeCell: null,
        activeQuestion: null,
        passedToTeamId: null,
        showHint: false,
        activeTeamId: nextTeamId(state.teams, state.activeTeamId),
      };
    }

    case "MARK_WRONG": {
      const board = markCellUsed(state.board, state.activeCell);
      const usedIds = state.activeQuestion ? [...state.usedIds, state.activeQuestion.id] : state.usedIds;
      return {
        ...state,
        phase: isBoardDone(board) ? "winner" : "board",
        board,
        usedIds,
        activeCell: null,
        activeQuestion: null,
        passedToTeamId: null,
        showHint: false,
        activeTeamId: nextTeamId(state.teams, state.activeTeamId),
      };
    }

    case "USE_LIFELINE_PENALIZE": {
      if (!state.teams.find((t) => t.id === state.activeTeamId)?.lifelines.penalize) return state;
      const pts = state.activeCell?.points ?? 200;
      const teams = state.teams.map((t) => {
        if (t.id === state.activeTeamId) return { ...t, lifelines: { ...t.lifelines, penalize: false } };
        if (t.id === action.targetId) return { ...t, score: Math.max(0, t.score - pts) };
        return t;
      });
      return { ...state, teams };
    }

    case "USE_LIFELINE_ELIMINATE": {
      if (!state.teams.find((t) => t.id === state.activeTeamId)?.lifelines.eliminate) return state;
      const teams = state.teams.map((t) =>
        t.id === state.activeTeamId ? { ...t, lifelines: { ...t.lifelines, eliminate: false } } : t,
      );
      return { ...state, teams };
    }

    case "PASS_QUESTION": {
      if (!state.teams.find((t) => t.id === state.activeTeamId)?.lifelines.pass) return state;
      const teams = state.teams.map((t) =>
        t.id === state.activeTeamId ? { ...t, lifelines: { ...t.lifelines, pass: false } } : t,
      );
      return { ...state, teams, passedToTeamId: action.targetId };
    }

    case "TRANSFER_QUESTION":
      if (state.passedToTeamId) return state;
      return { ...state, passedToTeamId: action.targetId };

    // وضع فردي: لا خصم لتمرير السؤال إليه، فبدل وسيلتي "استبعاد لاعب من
    // الفريق المنافس" و"تمرير السؤال للفريق الآخر" (تفترضان خصمًا) — لاعب
    // الوضع الفردي يملك وسيلة واحدة مكافئة منطقيًا: "مساعدة إضافية" تتخطى
    // سؤالًا صعبًا بلا تسجيله خطأً (الخلية تُستهلك، لا نقاط تُضاف أو تُخصم).
    case "SOLO_SKIP": {
      const solo = state.teams[0];
      if (!solo?.lifelines.pass) return state;
      const teams = state.teams.map((t) => ({ ...t, lifelines: { ...t.lifelines, pass: false } }));
      const board = markCellUsed(state.board, state.activeCell);
      const usedIds = state.activeQuestion ? [...state.usedIds, state.activeQuestion.id] : state.usedIds;
      return {
        ...state,
        phase: isBoardDone(board) ? "winner" : "board",
        teams,
        board,
        usedIds,
        activeCell: null,
        activeQuestion: null,
        passedToTeamId: null,
        showHint: false,
        activeTeamId: nextTeamId(state.teams, state.activeTeamId),
      };
    }

    case "RESET":
      return initial;

    default:
      return state;
  }
}

function markCellUsed(board: Cell[][], cell: Cell | null): Cell[][] {
  if (!cell) return board;
  return board.map((col) =>
    col.map((c) => c.categoryId === cell.categoryId && c.points === cell.points ? { ...c, used: true } : c),
  );
}

// ─── Style helpers removed — using CSS classes (qzg-*) ────────────────────

// ─── Timer Bar ─────────────────────────────────────────────────────────────

function TimerBar({ seconds, maxSeconds }: { seconds: number; maxSeconds: number }) {
  const pct = maxSeconds > 0 ? seconds / maxSeconds : 0;
  const color = pct > 0.4 ? "#22c55e" : pct > 0.2 ? "#173D35" : "#ef4444";
  const label = seconds <= 0 ? "انتهى الوقت" : `${seconds}ث`;
  const urgent = seconds > 0 && seconds <= 10;
  return (
    <div
      className="qzg-timer"
      role="timer"
      aria-label={`الوقت المتبقي: ${label}`}
      style={{ "--qzg-timer-color": color, "--qzg-timer-pct": `${Math.max(0, pct * 100)}%` } as React.CSSProperties}
    >
      <div className="qzg-timer__head">
        <span className="qzg-timer__label">⏱ الوقت</span>
        <span className="qzg-timer__count" aria-live={urgent ? "assertive" : "off"} aria-atomic="true">{label}</span>
      </div>
      <div className="qzg-timer__track">
        <div className="qzg-timer__fill" />
      </div>
    </div>
  );
}

// ─── Score Bar ─────────────────────────────────────────────────────────────

function ScoreBar({ teams, activeTeamId }: { teams: Team[]; activeTeamId: TeamId }) {
  const solo = teams.length === 1;
  return (
    <div className="qzg-score-row" data-team-count={teams.length}>
      {teams.map((t, i) => {
        const active = t.id === activeTeamId;
        // يتناوب على لونَي الهوية الحاليَين (زمردي/أحمر) حسب فهرس الفريق —
        // يحافظ حرفيًا على مظهر الوضع الثنائي الأصلي (فريق1=زمردي، فريق2=أحمر)
        // ويمدّه بنمط متكرر لأي عدد فرق دون إدخال ألوان جديدة.
        const activeBg = i % 2 === 0 ? S.emerald : "var(--majalis-danger, #9B1C1C)";
        return (
          <div
            key={t.id}
            className={`qzg-team-card${active ? " qzg-team-card--active" : ""}`}
            style={{
              "--qzg-team-bg": active ? activeBg : S.cardAlt,
              "--qzg-team-border": active ? "var(--majalis-brass)" : "var(--ds-line-color)",
              "--qzg-name-color": active ? "#fff" : S.ink,
              "--qzg-score-color": active ? "var(--majalis-brass)" : S.emeraldDeep,
              "--qzg-unit-color": active ? "rgba(255,255,255,0.7)" : S.inkSoft,
            } as React.CSSProperties}
          >
            {!solo && active && <p className="qzg-team-card__turn">▶ دوره ◀</p>}
            <p className="qzg-team-card__name">{t.name}</p>
            <p className="qzg-team-card__score">{t.score.toLocaleString("ar-EG")}</p>
            <p className="qzg-team-card__unit">نقطة</p>
            <div className="qzg-team-card__lifelines">
              {solo ? (
                t.lifelines.pass && <span className="qzg-lifeline qzg-lifeline--pass">مساعدة</span>
              ) : (
                <>
                  {t.lifelines.penalize && (
                    <span className="qzg-lifeline qzg-lifeline--penalize">خصم</span>
                  )}
                  {t.lifelines.eliminate && (
                    <span className="qzg-lifeline qzg-lifeline--eliminate">استبعاد</span>
                  )}
                  {t.lifelines.pass && (
                    <span className="qzg-lifeline qzg-lifeline--pass">تمرير</span>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Setup Phase ───────────────────────────────────────────────────────────

function SetupPhase({ onStart }: { onStart: (cats: string[], mode: GameMode, names: string[]) => void }) {
  const [mode, setMode] = useState<GameMode>("team");
  const [teamCount, setTeamCount] = useState<2 | 3 | 4>(2);
  const [teamNames, setTeamNames] = useState<string[]>(["", ""]);
  const [soloName, setSoloName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 6 ? [...prev, id] : prev,
    );

  const canStart = selected.length >= 2;

  const changeTeamCount = (n: 2 | 3 | 4) => {
    setTeamCount(n);
    setTeamNames((prev) => {
      const next = prev.slice(0, n);
      while (next.length < n) next.push("");
      return next;
    });
  };

  const handleStart = () => {
    if (!canStart) return;
    if (mode === "solo") {
      onStart(selected, "solo", [soloName]);
    } else {
      const names = teamNames.map((n, i) => n.trim() || DEFAULT_TEAM_NAMES[i]);
      onStart(selected, "team", names);
    }
  };

  return (
    <div className="qzg-setup">
      <div className="qzg-setup__hero">
        <div className="qzg-setup__icon"><Landmark size={40} strokeWidth={1.3} /></div>
        <h1 className="qzg-setup__title">لعبة سؤال وجواب</h1>
        <p className="qzg-setup__sub">
          {mode === "solo"
            ? "تحدَّ نفسك في اختبار معلوماتك الإسلامية"
            : "لعبة جماعية تنافسية بطابع إسلامي — فرق تتنافس على النقاط"}
        </p>
      </div>

      <section className="qzg-section-card">
        <h2 className="qzg-section-h2"><Users size={18} className="inline ml-1" />نمط اللعب</h2>
        <div className="qzg-mode-toggle">
          <button
            type="button"
            onClick={() => setMode("solo")}
            className={`qzg-mode-btn${mode === "solo" ? " qzg-mode-btn--on" : ""}`}
          >
            <User size={16} className="inline ml-1" />فردي
          </button>
          <button
            type="button"
            onClick={() => setMode("team")}
            className={`qzg-mode-btn${mode === "team" ? " qzg-mode-btn--on" : ""}`}
          >
            <Users size={16} className="inline ml-1" />جماعي
          </button>
        </div>
      </section>

      {mode === "team" ? (
        <section className="qzg-section-card">
          <h2 className="qzg-section-h2"><Trophy size={18} className="inline ml-1" />عدد الفرق وأسماؤها</h2>
          <div className="qzg-team-count-row">
            {([2, 3, 4] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => changeTeamCount(n)}
                className={`qzg-count-btn${teamCount === n ? " qzg-count-btn--on" : ""}`}
              >
                {n} فرق
              </button>
            ))}
          </div>
          <div className="qzg-teams-grid qzg-teams-grid--dynamic" style={{ "--qzg-teams-cols": teamCount } as React.CSSProperties}>
            {teamNames.map((name, i) => (
              <div key={i}>
                <label htmlFor={`qzg-team${i + 1}`} className="qzg-team-label">{DEFAULT_TEAM_NAMES[i]}</label>
                <input
                  id={`qzg-team${i + 1}`}
                  value={name}
                  onChange={(e) => setTeamNames((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))}
                  placeholder={DEFAULT_TEAM_NAMES[i]}
                  maxLength={20}
                  className="qzg-input"
                />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="qzg-section-card">
          <h2 className="qzg-section-h2"><User size={18} className="inline ml-1" />اسمك (اختياري)</h2>
          <input
            value={soloName}
            onChange={(e) => setSoloName(e.target.value)}
            placeholder="اللاعب"
            maxLength={20}
            className="qzg-input"
          />
        </section>
      )}

      <section className="qzg-section-card">
        <div className="qzg-cats-head">
          <h2 className="qzg-section-h2 qzg-section-h2--flush"><Library size={16} className="inline ml-1" />اختر الفئات</h2>
          <span className="qzg-cats-count">{selected.length}/6 (2 كحد أدنى)</span>
        </div>
        <div className="qzg-cats-grid">
          {GAME_CATEGORIES.map((cat) => {
            const on = selected.includes(cat.id);
            const maxed = !on && selected.length >= 6;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggle(cat.id)}
                disabled={maxed}
                className={`qzg-cat-btn${on ? " qzg-cat-btn--on" : ""}${maxed ? " qzg-cat-btn--maxed" : ""}`}
              >
                <div className="qzg-cat-btn__icon">
                  <CategoryIcon name={cat.icon} size={20} />
                </div>
                {cat.name}
              </button>
            );
          })}
        </div>
      </section>

      <section className="qzg-section-card qzg-section-card--mb-lg">
        <h3 className="qzg-lifelines-h3">
          <Zap size={14} className="inline ml-1" />
          {mode === "solo" ? "مساعدة إضافية" : "وسائل المساعدة (لكل فريق 3 وسائل)"}
        </h3>
        <div className={`qzg-lifelines-grid${mode === "solo" ? " qzg-lifelines-grid--solo" : ""}`}>
          {mode === "solo" ? (
            <div className="qzg-lifeline-info">
              <div className="qzg-lifeline-info__title qzg-ll--transfer">مساعدة إضافية</div>
              <div className="qzg-lifeline-info__desc">تخطَّ سؤالاً واحدًا صعبًا بلا خسارة نقاط — تُستخدم مرة واحدة طوال اللعبة</div>
            </div>
          ) : (
            ([
              ["qzg-ll--score",    "خصم نقاط",     "تُخصم نقاط الخلية من رصيد فريق منافس تختاره"],
              ["qzg-ll--exclude",  "استبعاد لاعب", "يُستبعد لاعب من فريق منافس تختاره"],
              ["qzg-ll--transfer", "تمرير السؤال", "يُحوَّل السؤال لفريق منافس تختاره"],
            ] as [string, string, string][]).map(([llMod, title, desc]) => (
              <div key={title} className="qzg-lifeline-info">
                <div className={`qzg-lifeline-info__title ${llMod}`}>{title}</div>
                <div className="qzg-lifeline-info__desc">{desc}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <button
        type="button"
        onClick={handleStart}
        disabled={!canStart}
        className={`qzg-btn-primary qzg-btn-primary--wide${canStart ? "" : " qzg-btn-primary--disabled"}`}
      >
        {canStart ? "ابدأ اللعبة" : "اختر فئتين على الأقل"}
      </button>
    </div>
  );
}

// ─── Board Phase ───────────────────────────────────────────────────────────

function BoardPhase({
  state,
  dispatch,
  poolRef,
  persistedUsedIds,
}: {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  poolRef: React.RefObject<Record<string, CategoryQuestions>>;
  persistedUsedIds: Set<string>;
}) {
  const activeCats = GAME_CATEGORIES.filter((c) => state.selectedCategories.includes(c.id));
  const colCount = activeCats.length;

  const getCellFromBoard = (catId: string, pts: PointValue): Cell | undefined => {
    const colIdx = state.selectedCategories.indexOf(catId);
    return state.board[colIdx]?.find((c) => c.points === pts);
  };

  return (
    <div>
      <ScoreBar teams={state.teams} activeTeamId={state.activeTeamId} />

      <div className="qzg-board-scroll">
        <div
          className="qzg-board-grid"
          style={{
            "--qzg-board-cols": `repeat(${colCount}, minmax(105px, 1fr))`,
            "--qzg-board-min-w": `${colCount * 115}px`,
          } as React.CSSProperties}
        >
          {activeCats.map((cat) => (
            <div key={cat.id} className="qzg-board-cat">
              <div className="qzg-board-cat__icon"><CategoryIcon name={cat.icon} size={16} /></div>
              <div className="qzg-board-cat__name">{cat.name}</div>
            </div>
          ))}

          {([200, 400, 600] as PointValue[]).flatMap((pts) =>
            activeCats.map((cat) => {
              const cell = getCellFromBoard(cat.id, pts);
              if (!cell) return <div key={`${cat.id}-${pts}`} />;
              return (
                <button
                  key={`${cat.id}-${pts}`}
                  type="button"
                  disabled={cell.used}
                  onClick={() => dispatch({ type: "SELECT_CELL", cell, pool: poolRef.current ?? ALL_QUESTIONS, persistedUsedIds })}
                  className={`qzg-board-cell${cell.used ? " qzg-board-cell--used" : ""}`}
                >
                  {cell.used ? "—" : pts}
                </button>
              );
            }),
          )}
        </div>
      </div>

      <div className="qzg-board-reset-row">
        <button type="button" onClick={() => dispatch({ type: "RESET" })} className="qzg-btn-ghost">
          ← إعادة الإعداد
        </button>
      </div>
    </div>
  );
}

// ─── Question Phase ────────────────────────────────────────────────────────

type LifelineKind = "transfer" | "pass" | "penalize" | "eliminate";

function QuestionPhase({
  state,
  dispatch,
  timerSec,
  maxTimerSec,
  onMarkCorrect,
  onMarkWrong,
}: {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  timerSec: number;
  maxTimerSec: number;
  onMarkCorrect: () => void;
  onMarkWrong: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<LifelineKind | null>(null);
  const [eliminateBanner, setEliminateBanner] = useState<string | null>(null);
  const { activeCell, activeQuestion, teams, activeTeamId, passedToTeamId, showHint, mode } = state;

  if (!activeCell) return null;

  const cat = GAME_CATEGORIES.find((c) => c.id === activeCell.categoryId);
  const activeTeamObj = teams.find((t) => t.id === activeTeamId)!;
  const scoringTeam = passedToTeamId ? teams.find((t) => t.id === passedToTeamId) : activeTeamObj;
  const otherTeams = teams.filter((t) => t.id !== activeTeamId);

  // اختيار الفريق المستهدف: مع فريق منافس واحد فقط (الوضع الثنائي التقليدي)
  // يُطبَّق التأثير فورًا كما كان دومًا — لا كسر للسلوك الحالي. مع 3-4 فرق
  // يفتح لوحة اختيار صريحة لاسم الفريق المستهدَف.
  const requestTeamAction = (kind: LifelineKind) => {
    if (otherTeams.length === 0) return;
    if (otherTeams.length === 1) {
      applyTeamAction(kind, otherTeams[0].id);
    } else {
      setPendingTarget(kind);
    }
  };

  const applyTeamAction = (kind: LifelineKind, targetId: TeamId) => {
    if (kind === "transfer") dispatch({ type: "TRANSFER_QUESTION", targetId });
    if (kind === "pass") dispatch({ type: "PASS_QUESTION", targetId });
    if (kind === "penalize") dispatch({ type: "USE_LIFELINE_PENALIZE", targetId });
    if (kind === "eliminate") {
      setEliminateBanner(teams.find((t) => t.id === targetId)?.name ?? null);
      dispatch({ type: "USE_LIFELINE_ELIMINATE" });
    }
    setPendingTarget(null);
  };

  const noLifelinesLeft = mode === "solo"
    ? !activeTeamObj.lifelines.pass
    : !activeTeamObj.lifelines.penalize && !activeTeamObj.lifelines.eliminate && !activeTeamObj.lifelines.pass;

  return (
    <div className="qzg-question-wrap">
      <ScoreBar teams={teams} activeTeamId={activeTeamId} />

      <TimerBar seconds={timerSec} maxSeconds={maxTimerSec} />

      <div className="qzg-section-card qzg-section-card--brass qzg-section-card--mb-sm">
        <div className="qzg-q-header">
          <span className="qzg-q-cat-label"><CategoryIcon name={cat?.icon ?? ""} size={14} /> {cat?.name}</span>
          <span className="qzg-q-points-badge">{activeCell.points} نقطة</span>
        </div>

        {passedToTeamId && (
          <div className="qzg-q-passed-banner">
            <Send size={14} className="inline ml-1" />تم إرسال السؤال — يجيب الآن: <strong>{scoringTeam?.name}</strong>
          </div>
        )}

        {activeQuestion ? (
          <p className="qzg-q-text">{activeQuestion.q}</p>
        ) : (
          <p className="qzg-q-noq">لا يوجد سؤال متاح — حدد النتيجة يدوياً</p>
        )}

        {mode === "team" && !passedToTeamId && (
          <div className="qzg-q-transfer-row">
            <button type="button" onClick={() => requestTeamAction("transfer")} className="qzg-btn-transfer">
              <Send size={14} className="inline ml-1" />أرسل لفريق آخر
            </button>
          </div>
        )}
      </div>

      {!revealed && (
        <button type="button" onClick={() => setRevealed(true)} className="qzg-btn-gold qzg-btn-gold--wide qzg-btn-gold--mb">
          <Search size={14} className="inline ml-1" />كشف الإجابة
        </button>
      )}

      {revealed && (
        <>
          <div className="qzg-section-card qzg-section-card--mb-sm">
            <p className="qzg-answer-label">الإجابة الصحيحة:</p>
            <p className="qzg-answer-text">{activeQuestion?.a ?? "—"}</p>
            {showHint && (
              <p className="qzg-hint-text"><Lightbulb size={13} className="inline ml-1" />{activeQuestion?.hint}</p>
            )}
            {!showHint && activeQuestion?.hint && (
              <button type="button" onClick={() => dispatch({ type: "REVEAL_HINT" })} className="qzg-btn-ghost qzg-btn-ghost--mt">
                عرض الشرح
              </button>
            )}
          </div>

          <div className="qzg-result-grid">
            <button type="button" onClick={onMarkCorrect} className="qzg-btn-correct">
              <CheckCircle2 size={14} className="inline ml-1" />صحيح +{activeCell.points}
            </button>
            <button type="button" onClick={onMarkWrong} className="qzg-btn-wrong">
              <XCircle size={14} className="inline ml-1" />خطأ
            </button>
          </div>
        </>
      )}

      <div className="qzg-section-card">
        <p className="qzg-lifelines-label"><Zap size={14} className="inline ml-1" />وسائل المساعدة — {activeTeamObj.name}</p>

        {eliminateBanner && (
          <p className="qzg-q-passed-banner">تم استبعاد لاعب من: <strong>{eliminateBanner}</strong></p>
        )}

        <div className="qzg-lifelines-flex">
          {mode === "solo" ? (
            <>
              {activeTeamObj.lifelines.pass && (
                <button type="button" onClick={() => dispatch({ type: "SOLO_SKIP" })}
                  className="qzg-ll-btn qzg-ll-btn--pass">
                  مساعدة إضافية (تخطَّ السؤال)
                </button>
              )}
              {noLifelinesLeft && <span className="qzg-no-lifelines">لا وسائل متبقية</span>}
            </>
          ) : (
            <>
              {activeTeamObj.lifelines.penalize && (
                <button type="button" onClick={() => requestTeamAction("penalize")}
                  className="qzg-ll-btn qzg-ll-btn--penalize">
                  خصم {activeCell.points} من فريق منافس
                </button>
              )}
              {activeTeamObj.lifelines.eliminate && (
                <button type="button" onClick={() => requestTeamAction("eliminate")}
                  className="qzg-ll-btn qzg-ll-btn--eliminate">
                  استبعاد لاعب
                </button>
              )}
              {activeTeamObj.lifelines.pass && !passedToTeamId && (
                <button type="button" onClick={() => requestTeamAction("pass")}
                  className="qzg-ll-btn qzg-ll-btn--pass">
                  تمرير لفريق آخر (وسيلة)
                </button>
              )}
              {noLifelinesLeft && <span className="qzg-no-lifelines">لا وسائل متبقية</span>}
            </>
          )}
        </div>

        {pendingTarget && (
          <div className="qzg-target-picker">
            <p className="qzg-target-picker__label">اختر الفريق المستهدَف:</p>
            <div className="qzg-target-picker__list">
              {otherTeams.map((t) => (
                <button key={t.id} type="button" onClick={() => applyTeamAction(pendingTarget, t.id)} className="qzg-target-btn">
                  {t.name}
                </button>
              ))}
              <button type="button" onClick={() => setPendingTarget(null)} className="qzg-btn-ghost">إلغاء</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Winner Phase ──────────────────────────────────────────────────────────

function WinnerPhase({ teams, mode, onReset }: { teams: Team[]; mode: GameMode; onReset: () => void }) {
  const isSolo = mode === "solo" || teams.length === 1;
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const topScore = sorted[0]?.score ?? 0;
  const isDraw = !isSolo && sorted.filter((t) => t.score === topScore).length > 1;

  const title = isSolo ? "انتهت اللعبة!" : isDraw ? "تعادل!" : `فاز ${sorted[0].name}`;
  const subtitle = isSolo
    ? "أحسنت! إليك نتيجتك النهائية"
    : isDraw
      ? "تعادل الفرق المتصدرة — تكافؤ رائع!"
      : "أحسنتم جميعاً وبارك الله في سعيكم";

  return (
    <div className="qzg-winner-wrap">
      <div className="qzg-winner-trophy">{isDraw ? <Handshake size={48} strokeWidth={1.3} /> : <Trophy size={48} strokeWidth={1.3} />}</div>
      <h1 className="qzg-winner-title">{title}</h1>
      <p className="qzg-winner-sub">{subtitle}</p>

      <div className="qzg-winner-grid" data-team-count={sorted.length}>
        {sorted.map((team, i) => (
          <div key={team.id}
            className={`qzg-section-card qzg-winner-card${i === 0 ? " qzg-winner-card--first" : ""}`}>
            <div className="qzg-winner-rank">{i === 0 ? (isDraw ? <Handshake size={24} /> : <Trophy size={24} />) : <Award size={24} />}</div>
            <p className="qzg-winner-name">{team.name}</p>
            <p className={`qzg-winner-score${i === 0 ? " qzg-winner-score--first" : ""}`}>
              {team.score.toLocaleString("ar-EG")}
            </p>
            <p className="qzg-winner-unit">نقطة</p>
          </div>
        ))}
      </div>

      <button type="button" onClick={onReset} className="qzg-btn-gold qzg-btn-gold--px">
        <RefreshCw size={14} className="inline ml-1" />لعبة جديدة
      </button>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────

export function IslamicQuizGame() {
  const [state, dispatch] = useReducer(reducer, initial);
  const poolRef = useRef<Record<string, CategoryQuestions>>(ALL_QUESTIONS);
  const persistedUsedIdsRef = useRef<Set<string>>(new Set());

  // Timer state
  const [timerSec, setTimerSec] = useState(60);
  const [maxTimerSec, setMaxTimerSec] = useState(60);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const passedRef = useRef(state.passedToTeamId);
  useEffect(() => { passedRef.current = state.passedToTeamId; }, [state.passedToTeamId]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  // Start/reset timer on question phase or when question is transferred
  useEffect(() => {
    if (state.phase !== "question") { clearTimer(); return; }
    const duration = state.passedToTeamId ? 30 : 60;
    setTimerSec(duration);
    setMaxTimerSec(duration);
    clearTimer();
    timerRef.current = setInterval(() => {
      setTimerSec((prev) => {
        if (prev <= 1) {
          clearTimer();
          // تمديد تلقائي (30ث لفريق آخر) عند انتهاء الوقت لأول مرة — لا يُطبَّق
          // إلا حين يوجد فريق منافس واحد بالضبط (الوضع الثنائي التقليدي)، إذ
          // لا يوجد هدف واحد واضح لتحويله إليه تلقائيًا مع 3-4 فرق أو في
          // الوضع الفردي؛ في تلك الحالات ينتهي السؤال مباشرةً بـ"خطأ".
          const others = state.teams.filter((t) => t.id !== state.activeTeamId);
          const canAutoForward = others.length === 1 && !passedRef.current;
          if (canAutoForward) {
            dispatch({ type: "TRANSFER_QUESTION", targetId: others[0].id });
          } else {
            const qId = (state as GameState).activeQuestion?.id;
            if (qId) markQuizQuestionUsed(qId);
            dispatch({ type: "MARK_WRONG" });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return clearTimer;
  }, [state.phase, state.passedToTeamId]);

  useEffect(() => {
    getQuizQuestions().then(({ data }) => {
      if (data && data.length > 0) {
        poolRef.current = mergeSupabaseQuestions(data);
      }
    });
    persistedUsedIdsRef.current = getLocalUsedQuizIds();
  }, []);

  const handleStart = useCallback(
    (cats: string[], mode: GameMode, names: string[]) => dispatch({ type: "START_GAME", mode, categories: cats, names }),
    [],
  );

  const handleMarkCorrect = useCallback(() => {
    clearTimer();
    if (state.activeQuestion?.id) markQuizQuestionUsed(state.activeQuestion.id);
    if (state.activeQuestion?.id && state.activeCell?.categoryId) {
      void recordQuizAttempt(state.activeCell.categoryId, state.activeQuestion.id, true, "team_game");
    }
    void hapticNotify("success");
    dispatch({ type: "MARK_CORRECT" });
  }, [state.activeQuestion, state.activeCell, clearTimer]);

  const handleMarkWrong = useCallback(() => {
    clearTimer();
    if (state.activeQuestion?.id) markQuizQuestionUsed(state.activeQuestion.id);
    if (state.activeQuestion?.id && state.activeCell?.categoryId) {
      void recordQuizAttempt(state.activeCell.categoryId, state.activeQuestion.id, false, "team_game");
    }
    void hapticNotify("error");
    dispatch({ type: "MARK_WRONG" });
  }, [state.activeQuestion, state.activeCell, clearTimer]);

  return (
    <div className="qzg-root">
      <div className="qzg-inner">
        {(state.phase === "board" || state.phase === "question") && (
          <div className="qzg-game-title-bar">
            <span className="qzg-game-title"><Landmark size={16} className="inline ml-1" />لعبة سؤال وجواب الإسلامية</span>
          </div>
        )}

        {state.phase === "setup" && <SetupPhase onStart={handleStart} />}
        {state.phase === "board" && (
          <BoardPhase
            state={state}
            dispatch={dispatch}
            poolRef={poolRef}
            persistedUsedIds={persistedUsedIdsRef.current}
          />
        )}
        {state.phase === "question" && (
          <QuestionPhase
            state={state}
            dispatch={dispatch}
            timerSec={timerSec}
            maxTimerSec={maxTimerSec}
            onMarkCorrect={handleMarkCorrect}
            onMarkWrong={handleMarkWrong}
          />
        )}
        {state.phase === "winner" && <WinnerPhase teams={state.teams} mode={state.mode} onReset={() => dispatch({ type: "RESET" })} />}
      </div>
    </div>
  );
}
