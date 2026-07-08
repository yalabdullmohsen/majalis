import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  Award, BookOpen, CheckCircle2, Handshake, Library, Lightbulb, RefreshCw, ScrollText, Moon, Search, Send, Star, Scale, Building2, Landmark, Gem, Trophy, XCircle,
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

type TeamId = "team1" | "team2";
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
  phase: Phase;
  teams: [Team, Team];
  activeTeam: TeamId;
  selectedCategories: string[];
  board: Cell[][];
  activeCell: Cell | null;
  activeQuestion: QuizQuestion | null;
  passedToOpponent: boolean;
  usedIds: string[];
  showHint: boolean;
}

type Action =
  | { type: "START_GAME"; categories: string[]; names: [string, string] }
  | { type: "SELECT_CELL"; cell: Cell; pool: Record<string, CategoryQuestions>; persistedUsedIds?: Set<string> }
  | { type: "REVEAL_HINT" }
  | { type: "MARK_CORRECT" }
  | { type: "MARK_WRONG" }
  | { type: "USE_LIFELINE_PENALIZE" }
  | { type: "USE_LIFELINE_ELIMINATE" }
  | { type: "PASS_QUESTION" }
  | { type: "TRANSFER_QUESTION" }
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
  correct:     "#1A6B4A",
  wrong:       "#8B1A1A",
} as const;

// ─── Reducer helpers ───────────────────────────────────────────────────────

function makeTeam(id: TeamId, name: string): Team {
  return { id, name, score: 0, lifelines: { penalize: true, eliminate: true, pass: true } };
}

function opponentOf(id: TeamId): TeamId { return id === "team1" ? "team2" : "team1"; }

function isBoardDone(board: Cell[][]): boolean {
  return board.every((col) => col.every((c) => c.used));
}

function buildBoard(categories: string[]): Cell[][] {
  return categories.map((catId) =>
    ([200, 400, 600] as PointValue[]).map((pts) => ({ categoryId: catId, points: pts, used: false })),
  );
}

const initial: GameState = {
  phase: "setup",
  teams: [makeTeam("team1", "الفريق الأول"), makeTeam("team2", "الفريق الثاني")],
  activeTeam: "team1",
  selectedCategories: [],
  board: [],
  activeCell: null,
  activeQuestion: null,
  passedToOpponent: false,
  usedIds: [],
  showHint: false,
};

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "START_GAME":
      return {
        ...initial,
        phase: "board",
        teams: [makeTeam("team1", action.names[0]), makeTeam("team2", action.names[1])],
        selectedCategories: action.categories,
        board: buildBoard(action.categories),
      };

    case "SELECT_CELL": {
      const usedSet = new Set(state.usedIds);
      const q = pickQuestion(action.cell.categoryId, action.cell.points, usedSet, action.pool, action.persistedUsedIds);
      return { ...state, phase: "question", activeCell: action.cell, activeQuestion: q, passedToOpponent: false, showHint: false };
    }

    case "REVEAL_HINT":
      return { ...state, showHint: true };

    case "MARK_CORRECT": {
      const winner = state.passedToOpponent ? opponentOf(state.activeTeam) : state.activeTeam;
      const pts = state.activeCell?.points ?? 0;
      const teams = state.teams.map((t) =>
        t.id === winner ? { ...t, score: t.score + pts } : t,
      ) as [Team, Team];
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
        passedToOpponent: false,
        showHint: false,
        activeTeam: opponentOf(state.activeTeam),
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
        passedToOpponent: false,
        showHint: false,
        activeTeam: opponentOf(state.activeTeam),
      };
    }

    case "USE_LIFELINE_PENALIZE": {
      if (!state.teams.find((t) => t.id === state.activeTeam)?.lifelines.penalize) return state;
      const pts = state.activeCell?.points ?? 200;
      const opp = opponentOf(state.activeTeam);
      const teams = state.teams.map((t) => {
        if (t.id === state.activeTeam) return { ...t, lifelines: { ...t.lifelines, penalize: false } };
        if (t.id === opp) return { ...t, score: Math.max(0, t.score - pts) };
        return t;
      }) as [Team, Team];
      return { ...state, teams };
    }

    case "USE_LIFELINE_ELIMINATE": {
      if (!state.teams.find((t) => t.id === state.activeTeam)?.lifelines.eliminate) return state;
      const teams = state.teams.map((t) =>
        t.id === state.activeTeam ? { ...t, lifelines: { ...t.lifelines, eliminate: false } } : t,
      ) as [Team, Team];
      return { ...state, teams };
    }

    case "PASS_QUESTION": {
      if (!state.teams.find((t) => t.id === state.activeTeam)?.lifelines.pass) return state;
      const teams = state.teams.map((t) =>
        t.id === state.activeTeam ? { ...t, lifelines: { ...t.lifelines, pass: false } } : t,
      ) as [Team, Team];
      return { ...state, teams, passedToOpponent: true };
    }

    case "TRANSFER_QUESTION":
      if (state.passedToOpponent) return state;
      return { ...state, passedToOpponent: true };

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
  const color = pct > 0.4 ? "#22c55e" : pct > 0.2 ? "#f59e0b" : "#ef4444";
  const label = seconds <= 0 ? "انتهى الوقت" : `${seconds}ث`;
  return (
    <div
      className="qzg-timer"
      style={{ "--qzg-timer-color": color, "--qzg-timer-pct": `${Math.max(0, pct * 100)}%` } as React.CSSProperties}
    >
      <div className="qzg-timer__head">
        <span className="qzg-timer__label">⏱ الوقت</span>
        <span className="qzg-timer__count">{label}</span>
      </div>
      <div className="qzg-timer__track">
        <div className="qzg-timer__fill" />
      </div>
    </div>
  );
}

// ─── Score Bar ─────────────────────────────────────────────────────────────

function ScoreBar({ teams, activeTeam }: { teams: [Team, Team]; activeTeam: TeamId }) {
  return (
    <div className="qzg-score-row">
      {teams.map((t) => {
        const active = t.id === activeTeam;
        const activeBg = t.id === "team1" ? S.emerald : "#8B4515";
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
            {active && <p className="qzg-team-card__turn">▶ دوره ◀</p>}
            <p className="qzg-team-card__name">{t.name}</p>
            <p className="qzg-team-card__score">{t.score.toLocaleString("ar-EG")}</p>
            <p className="qzg-team-card__unit">نقطة</p>
            <div className="qzg-team-card__lifelines">
              {t.lifelines.penalize && (
                <span className="qzg-lifeline" style={{ "--qzg-ll-border": "#FFB347", "--qzg-ll-color": active ? "#FFB347" : "#9A6B10" } as React.CSSProperties}>خصم</span>
              )}
              {t.lifelines.eliminate && (
                <span className="qzg-lifeline" style={{ "--qzg-ll-border": "#9B59B6", "--qzg-ll-color": active ? "#C080FF" : "#7D3C98" } as React.CSSProperties}>استبعاد</span>
              )}
              {t.lifelines.pass && (
                <span className="qzg-lifeline" style={{ "--qzg-ll-border": "#2E86C1", "--qzg-ll-color": active ? "#80C0FF" : "#1A5276" } as React.CSSProperties}>تمرير</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Setup Phase ───────────────────────────────────────────────────────────

function SetupPhase({ onStart }: { onStart: (cats: string[], names: [string, string]) => void }) {
  const [name1, setName1] = useState("الفريق الأول");
  const [name2, setName2] = useState("الفريق الثاني");
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 6 ? [...prev, id] : prev,
    );

  const canStart = selected.length >= 2 && name1.trim() && name2.trim();

  return (
    <div className="qzg-setup">
      <div className="qzg-setup__hero">
        <div className="qzg-setup__icon"><Landmark size={40} strokeWidth={1.3} /></div>
        <h1 className="qzg-setup__title">لعبة سؤال وجواب</h1>
        <p className="qzg-setup__sub">
          لعبة جماعية تنافسية بطابع إسلامي — فريقان يتنافسان على النقاط
        </p>
      </div>

      <section className="qzg-section-card">
        <h2 className="qzg-section-h2"><Trophy size={18} className="inline ml-1" />أسماء الفريقين</h2>
        <div className="qzg-teams-grid">
          <div>
            <label className="qzg-team-label">الفريق الأول</label>
            <input value={name1} onChange={(e) => setName1(e.target.value)} maxLength={20} className="qzg-input" />
          </div>
          <div>
            <label className="qzg-team-label">الفريق الثاني</label>
            <input value={name2} onChange={(e) => setName2(e.target.value)} maxLength={20} className="qzg-input" />
          </div>
        </div>
      </section>

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
        <h3 className="qzg-lifelines-h3">⚡ وسائل المساعدة (لكل فريق 3 وسائل)</h3>
        <div className="qzg-lifelines-grid">
          {([
            ["#FFB347", "خصم نقاط", "تُخصم نقاط الخلية من رصيد الخصم"],
            ["#9B59B6", "استبعاد لاعب", "يُستبعد لاعب من الفريق المنافس"],
            ["#2E86C1", "تمرير السؤال", "يُحوَّل السؤال للفريق المنافس"],
          ] as [string, string, string][]).map(([color, title, desc]) => (
            <div key={title} className="qzg-lifeline-info">
              <div className="qzg-lifeline-info__title" style={{ "--qzg-ll-info-color": color } as React.CSSProperties}>{title}</div>
              <div className="qzg-lifeline-info__desc">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={() => canStart && onStart(selected, [name1.trim() || "الفريق الأول", name2.trim() || "الفريق الثاني"])}
        disabled={!canStart}
        className={`qzg-btn-primary qzg-btn-primary--wide${canStart ? "" : " qzg-btn-primary--disabled"}`}
      >
        {canStart ? "ابدأ اللعبة" : selected.length < 2 ? "اختر فئتين على الأقل" : "أدخل أسماء الفريقين"}
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
      <ScoreBar teams={state.teams} activeTeam={state.activeTeam} />

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
  const { activeCell, activeQuestion, teams, activeTeam, passedToOpponent, showHint } = state;

  if (!activeCell) return null;

  const cat = GAME_CATEGORIES.find((c) => c.id === activeCell.categoryId);
  const activeTeamObj = teams.find((t) => t.id === activeTeam)!;
  const scoringTeam = passedToOpponent ? teams.find((t) => t.id !== activeTeam) : activeTeamObj;

  return (
    <div className="qzg-question-wrap">
      <ScoreBar teams={teams} activeTeam={activeTeam} />

      <TimerBar seconds={timerSec} maxSeconds={maxTimerSec} />

      <div className="qzg-section-card qzg-section-card--brass qzg-section-card--mb-sm">
        <div className="qzg-q-header">
          <span className="qzg-q-cat-label">{cat?.icon} {cat?.name}</span>
          <span className="qzg-q-points-badge">{activeCell.points} نقطة</span>
        </div>

        {passedToOpponent && (
          <div className="qzg-q-passed-banner">
            <Send size={14} className="inline ml-1" />تم إرسال السؤال — يجيب الآن: <strong>{scoringTeam?.name}</strong>
          </div>
        )}

        {activeQuestion ? (
          <p className="qzg-q-text">{activeQuestion.q}</p>
        ) : (
          <p className="qzg-q-noq">لا يوجد سؤال متاح — حدد النتيجة يدوياً</p>
        )}

        {!passedToOpponent && (
          <div className="qzg-q-transfer-row">
            <button type="button" onClick={() => dispatch({ type: "TRANSFER_QUESTION" })} className="qzg-btn-transfer">
              <Send size={14} className="inline ml-1" />أرسل للفريق الآخر
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
        <p className="qzg-lifelines-label">⚡ وسائل المساعدة — {activeTeamObj.name}</p>
        <div className="qzg-lifelines-flex">
          {activeTeamObj.lifelines.penalize && (
            <button type="button" onClick={() => dispatch({ type: "USE_LIFELINE_PENALIZE" })}
              className="qzg-ll-btn"
              style={{ "--qzg-ll-bg": "#FFF8EE", "--qzg-ll-c": "#FFB347", "--qzg-ll-border": "#FFB347" } as React.CSSProperties}>
              خصم {activeCell.points} من الخصم
            </button>
          )}
          {activeTeamObj.lifelines.eliminate && (
            <button type="button" onClick={() => dispatch({ type: "USE_LIFELINE_ELIMINATE" })}
              className="qzg-ll-btn"
              style={{ "--qzg-ll-bg": "#F5EEF8", "--qzg-ll-c": "#9B59B6", "--qzg-ll-border": "#9B59B6" } as React.CSSProperties}>
              استبعاد لاعب
            </button>
          )}
          {activeTeamObj.lifelines.pass && !passedToOpponent && (
            <button type="button" onClick={() => dispatch({ type: "PASS_QUESTION" })}
              className="qzg-ll-btn"
              style={{ "--qzg-ll-bg": "#EBF5FB", "--qzg-ll-c": "#2E86C1", "--qzg-ll-border": "#2E86C1" } as React.CSSProperties}>
              تمرير للخصم (وسيلة)
            </button>
          )}
          {!activeTeamObj.lifelines.penalize && !activeTeamObj.lifelines.eliminate && !activeTeamObj.lifelines.pass && (
            <span className="qzg-no-lifelines">لا وسائل متبقية</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Winner Phase ──────────────────────────────────────────────────────────

function WinnerPhase({ teams, onReset }: { teams: [Team, Team]; onReset: () => void }) {
  const [a, b] = teams[0].score >= teams[1].score ? teams : [teams[1], teams[0]];
  const isDraw = a.score === b.score;

  return (
    <div className="qzg-winner-wrap">
      <div className="qzg-winner-trophy">{isDraw ? <Handshake size={48} strokeWidth={1.3} /> : <Trophy size={48} strokeWidth={1.3} />}</div>
      <h1 className="qzg-winner-title">{isDraw ? "تعادل!" : `فاز ${a.name}`}</h1>
      <p className="qzg-winner-sub">
        {isDraw ? "تعادل الفريقان — أنتما متكافئان!" : "أحسنتم جميعاً وبارك الله في سعيكم"}
      </p>

      <div className="qzg-winner-grid">
        {[a, b].map((team, i) => (
          <div key={team.id}
            className="qzg-section-card qzg-winner-card"
            style={{ "--qzg-wc-border": i === 0 ? "var(--majalis-brass)" : "var(--ds-line-color)" } as React.CSSProperties}>
            <div className="qzg-winner-rank">{i === 0 ? (isDraw ? <Handshake size={24} /> : <Trophy size={24} />) : <Award size={24} />}</div>
            <p className="qzg-winner-name">{team.name}</p>
            <p className="qzg-winner-score" style={{ "--qzg-winner-score-color": i === 0 ? "var(--majalis-brass)" : "var(--majalis-ink-soft)" } as React.CSSProperties}>
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
  const passedRef = useRef(state.passedToOpponent);
  useEffect(() => { passedRef.current = state.passedToOpponent; }, [state.passedToOpponent]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  // Start/reset timer on question phase or when question is transferred
  useEffect(() => {
    if (state.phase !== "question") { clearTimer(); return; }
    const duration = state.passedToOpponent ? 30 : 60;
    setTimerSec(duration);
    setMaxTimerSec(duration);
    clearTimer();
    timerRef.current = setInterval(() => {
      setTimerSec((prev) => {
        if (prev <= 1) {
          clearTimer();
          if (!passedRef.current) {
            dispatch({ type: "TRANSFER_QUESTION" });
          } else {
            // auto mark wrong — need to also mark the question used
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
  }, [state.phase, state.passedToOpponent]);

  useEffect(() => {
    getQuizQuestions().then(({ data }) => {
      if (data && data.length > 0) {
        poolRef.current = mergeSupabaseQuestions(data);
      }
    });
    persistedUsedIdsRef.current = getLocalUsedQuizIds();
  }, []);

  const handleStart = useCallback(
    (cats: string[], names: [string, string]) => dispatch({ type: "START_GAME", categories: cats, names }),
    [],
  );

  const handleMarkCorrect = useCallback(() => {
    clearTimer();
    if (state.activeQuestion?.id) markQuizQuestionUsed(state.activeQuestion.id);
    dispatch({ type: "MARK_CORRECT" });
  }, [state.activeQuestion, clearTimer]);

  const handleMarkWrong = useCallback(() => {
    clearTimer();
    if (state.activeQuestion?.id) markQuizQuestionUsed(state.activeQuestion.id);
    dispatch({ type: "MARK_WRONG" });
  }, [state.activeQuestion, clearTimer]);

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
        {state.phase === "winner" && <WinnerPhase teams={state.teams} onReset={() => dispatch({ type: "RESET" })} />}
      </div>
    </div>
  );
}
