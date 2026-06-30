import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  ALL_QUESTIONS,
  GAME_CATEGORIES,
  mergeSupabaseQuestions,
  pickQuestion,
  type CategoryQuestions,
  type GameCategory,
  type PointValue,
  type QuizQuestion,
} from "@/data/islamicQuizData";
import { getQuizQuestions } from "@/lib/supabase";

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
  | { type: "SELECT_CELL"; cell: Cell; pool: Record<string, CategoryQuestions> }
  | { type: "REVEAL_HINT" }
  | { type: "MARK_CORRECT" }
  | { type: "MARK_WRONG" }
  | { type: "USE_LIFELINE_PENALIZE" }
  | { type: "USE_LIFELINE_ELIMINATE" }
  | { type: "PASS_QUESTION" }
  | { type: "RESET" };

// ─── Palette ───────────────────────────────────────────────────────────────

const S = {
  navy: "#0D1B2A",
  navyMid: "#152233",
  navyLight: "#1A2B40",
  gold: "#C9A84C",
  goldLight: "#E8C96E",
  goldDark: "#9B7B2A",
  ivory: "#F0EAD6",
  ivorySoft: "#A8A090",
  correct: "#1A6B4A",
  wrong: "#8B1A1A",
  cellGold: "#2A2210",
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
      const q = pickQuestion(action.cell.categoryId, action.cell.points, usedSet, action.pool);
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

// ─── Style helpers ─────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.625rem 0.75rem",
  borderRadius: "0.5rem",
  border: "1px solid #2A3A4A",
  background: S.navy,
  color: S.ivory,
  fontSize: "0.9rem",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const solidBtn = (bg: string, fg: string): React.CSSProperties => ({
  padding: "0.875rem 1.5rem",
  borderRadius: "0.75rem",
  background: bg,
  color: fg,
  border: "none",
  fontSize: "1rem",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
});

const ghostBtn: React.CSSProperties = {
  background: "transparent",
  border: `1px solid ${S.navyLight}`,
  color: S.ivorySoft,
  padding: "0.5rem 1rem",
  borderRadius: "0.5rem",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontFamily: "inherit",
};

const lifelineStyle = (color: string, bg: string): React.CSSProperties => ({
  padding: "0.4rem 0.75rem",
  borderRadius: "0.5rem",
  background: bg,
  color,
  border: `1px solid ${color}`,
  cursor: "pointer",
  fontSize: "0.8rem",
  fontWeight: 600,
  fontFamily: "inherit",
});

// ─── Score Bar ─────────────────────────────────────────────────────────────

function ScoreBar({ teams, activeTeam }: { teams: [Team, Team]; activeTeam: TeamId }) {
  return (
    <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
      {teams.map((t) => {
        const active = t.id === activeTeam;
        const accent = t.id === "team1" ? "#1A7A55" : "#8B4515";
        return (
          <div
            key={t.id}
            style={{
              flex: 1,
              padding: "0.875rem 1rem",
              borderRadius: "0.75rem",
              background: active ? accent : S.navyLight,
              border: `2px solid ${active ? S.gold : "transparent"}`,
              textAlign: "center",
              transition: "all 0.3s ease",
            }}
          >
            {active && (
              <p style={{ margin: "0 0 0.2rem", fontSize: "0.7rem", color: S.goldLight, fontWeight: 700 }}>▶ دوره ◀</p>
            )}
            <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: S.ivory }}>{t.name}</p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "1.6rem", fontWeight: 800, color: active ? S.goldLight : S.gold }}>
              {t.score.toLocaleString("ar-EG")}
            </p>
            <p style={{ margin: 0, fontSize: "0.7rem", color: S.ivorySoft }}>نقطة</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "0.3rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
              {t.lifelines.penalize && <span style={{ fontSize: "0.6rem", padding: "0.1rem 0.35rem", borderRadius: 999, border: "1px solid #FFB347", color: "#FFB347" }}>خصم</span>}
              {t.lifelines.eliminate && <span style={{ fontSize: "0.6rem", padding: "0.1rem 0.35rem", borderRadius: 999, border: "1px solid #C080FF", color: "#C080FF" }}>استبعاد</span>}
              {t.lifelines.pass && <span style={{ fontSize: "0.6rem", padding: "0.1rem 0.35rem", borderRadius: 999, border: "1px solid #80C0FF", color: "#80C0FF" }}>تمرير</span>}
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
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🕌</div>
        <h1 style={{ margin: 0, fontSize: "2rem", color: S.goldLight, fontWeight: 800 }}>لعبة سؤال وجواب</h1>
        <p style={{ margin: "0.5rem 0 0", color: S.ivorySoft, fontSize: "0.9rem" }}>
          لعبة جماعية تنافسية بطابع إسلامي — فريقان يتنافسان على النقاط
        </p>
      </div>

      <section style={{ background: S.navyMid, borderRadius: "1rem", padding: "1.5rem", marginBottom: "1rem", border: `1px solid ${S.navyLight}` }}>
        <h2 style={{ margin: "0 0 1rem", color: S.gold, fontSize: "0.95rem", fontWeight: 700 }}>🏆 أسماء الفريقين</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", color: S.ivorySoft, marginBottom: "0.35rem" }}>الفريق الأول</label>
            <input value={name1} onChange={(e) => setName1(e.target.value)} maxLength={20} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", color: S.ivorySoft, marginBottom: "0.35rem" }}>الفريق الثاني</label>
            <input value={name2} onChange={(e) => setName2(e.target.value)} maxLength={20} style={inputStyle} />
          </div>
        </div>
      </section>

      <section style={{ background: S.navyMid, borderRadius: "1rem", padding: "1.5rem", marginBottom: "1rem", border: `1px solid ${S.navyLight}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0, color: S.gold, fontSize: "0.95rem", fontWeight: 700 }}>📚 اختر الفئات</h2>
          <span style={{ fontSize: "0.78rem", color: S.ivorySoft }}>{selected.length}/6 (2 كحد أدنى)</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.6rem" }}>
          {GAME_CATEGORIES.map((cat) => {
            const on = selected.includes(cat.id);
            const maxed = !on && selected.length >= 6;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggle(cat.id)}
                disabled={maxed}
                style={{
                  padding: "0.75rem 0.5rem",
                  borderRadius: "0.625rem",
                  border: `2px solid ${on ? S.gold : S.navyLight}`,
                  background: on ? S.cellGold : S.navyLight,
                  color: on ? S.goldLight : maxed ? "#555" : S.ivory,
                  cursor: maxed ? "not-allowed" : "pointer",
                  textAlign: "center",
                  fontSize: "0.82rem",
                  fontWeight: on ? 700 : 400,
                  transition: "border-color 0.2s, background 0.2s",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ fontSize: "1.2rem", marginBottom: "0.25rem" }}>{cat.icon}</div>
                {cat.name}
              </button>
            );
          })}
        </div>
      </section>

      <section style={{ background: S.navyMid, borderRadius: "1rem", padding: "1.25rem", marginBottom: "1.5rem", border: `1px solid ${S.navyLight}` }}>
        <h3 style={{ margin: "0 0 0.75rem", color: S.gold, fontSize: "0.88rem", fontWeight: 700 }}>⚡ وسائل المساعدة (لكل فريق 3 وسائل)</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", fontSize: "0.78rem" }}>
          {([
            ["#FFB347", "خصم نقاط", "تُخصم نقاط الخلية من رصيد الخصم"],
            ["#C080FF", "استبعاد لاعب", "يُستبعد لاعب من الفريق المنافس"],
            ["#80C0FF", "تمرير السؤال", "يُحوَّل السؤال للفريق المنافس"],
          ] as [string, string, string][]).map(([color, title, desc]) => (
            <div key={title} style={{ padding: "0.6rem", borderRadius: "0.5rem", background: S.navyLight, textAlign: "center" }}>
              <div style={{ color, fontWeight: 700, marginBottom: "0.25rem", fontSize: "0.82rem" }}>{title}</div>
              <div style={{ color: S.ivorySoft, lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={() => canStart && onStart(selected, [name1.trim() || "الفريق الأول", name2.trim() || "الفريق الثاني"])}
        disabled={!canStart}
        style={{
          ...solidBtn(canStart ? `linear-gradient(135deg, ${S.gold}, ${S.goldDark})` : S.navyLight, canStart ? S.navy : "#555"),
          width: "100%",
          fontSize: "1.1rem",
          cursor: canStart ? "pointer" : "not-allowed",
        }}
      >
        {canStart ? "ابدأ اللعبة 🎮" : selected.length < 2 ? "اختر فئتين على الأقل" : "أدخل أسماء الفريقين"}
      </button>
    </div>
  );
}

// ─── Board Phase ───────────────────────────────────────────────────────────

function BoardPhase({
  state,
  dispatch,
  poolRef,
}: {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  poolRef: React.RefObject<Record<string, CategoryQuestions>>;
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

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as unknown as undefined }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${colCount}, minmax(105px, 1fr))`,
            gap: "0.45rem",
            minWidth: colCount * 115,
          }}
        >
          {activeCats.map((cat) => (
            <div
              key={cat.id}
              style={{
                padding: "0.6rem 0.35rem",
                background: S.navyMid,
                borderRadius: "0.5rem",
                textAlign: "center",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: S.goldLight,
                border: `1px solid ${S.navyLight}`,
                lineHeight: 1.4,
              }}
            >
              <div style={{ fontSize: "1rem" }}>{cat.icon}</div>
              <div style={{ marginTop: "0.2rem" }}>{cat.name}</div>
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
                  onClick={() => dispatch({ type: "SELECT_CELL", cell, pool: poolRef.current ?? ALL_QUESTIONS })}
                  style={{
                    padding: "1rem 0.375rem",
                    borderRadius: "0.5rem",
                    border: `1px solid ${cell.used ? "#1A2535" : S.gold}`,
                    background: cell.used ? "#0A1220" : S.navyMid,
                    color: cell.used ? "#2A3545" : S.goldLight,
                    fontSize: "1.2rem",
                    fontWeight: 800,
                    cursor: cell.used ? "default" : "pointer",
                    transition: "all 0.2s ease",
                    opacity: cell.used ? 0.4 : 1,
                    fontFamily: "inherit",
                  }}
                >
                  {cell.used ? "—" : pts}
                </button>
              );
            }),
          )}
        </div>
      </div>

      <div style={{ marginTop: "1.25rem", display: "flex", justifyContent: "center" }}>
        <button type="button" onClick={() => dispatch({ type: "RESET" })} style={ghostBtn}>
          ← إعادة الإعداد
        </button>
      </div>
    </div>
  );
}

// ─── Question Phase ────────────────────────────────────────────────────────

function QuestionPhase({ state, dispatch }: { state: GameState; dispatch: React.Dispatch<Action> }) {
  const [revealed, setRevealed] = useState(false);
  const { activeCell, activeQuestion, teams, activeTeam, passedToOpponent, showHint } = state;

  if (!activeCell) return null;

  const cat = GAME_CATEGORIES.find((c) => c.id === activeCell.categoryId);
  const activeTeamObj = teams.find((t) => t.id === activeTeam)!;
  const scoringTeam = passedToOpponent ? teams.find((t) => t.id !== activeTeam) : activeTeamObj;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <ScoreBar teams={teams} activeTeam={activeTeam} />

      <div style={{ background: S.navyMid, borderRadius: "1rem", padding: "1.5rem", border: `2px solid ${S.gold}`, marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.82rem", color: S.ivorySoft }}>{cat?.icon} {cat?.name}</span>
          <span style={{ padding: "0.3rem 0.875rem", borderRadius: 999, background: S.cellGold, color: S.goldLight, fontWeight: 800, fontSize: "1rem", border: `1px solid ${S.gold}` }}>
            {activeCell.points} نقطة
          </span>
        </div>

        {passedToOpponent && (
          <div style={{ padding: "0.5rem 0.75rem", background: "#081830", borderRadius: "0.5rem", marginBottom: "0.875rem", fontSize: "0.82rem", color: "#80C0FF", border: "1px solid #204080" }}>
            📨 تم تمرير السؤال — يجيب الآن: <strong>{scoringTeam?.name}</strong>
          </div>
        )}

        {activeQuestion ? (
          <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: S.ivory, lineHeight: 1.9, textAlign: "center", padding: "0.75rem 0" }}>
            {activeQuestion.q}
          </p>
        ) : (
          <p style={{ margin: 0, color: S.ivorySoft, textAlign: "center", fontSize: "0.9rem" }}>
            لا يوجد سؤال متاح — حدد النتيجة يدوياً
          </p>
        )}
      </div>

      {!revealed && (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          style={{ ...solidBtn(`linear-gradient(135deg, ${S.gold}, ${S.goldDark})`, S.navy), width: "100%", marginBottom: "0.75rem" }}
        >
          🔍 كشف الإجابة
        </button>
      )}

      {revealed && (
        <>
          <div style={{ background: S.navyMid, borderRadius: "1rem", padding: "1.25rem", marginBottom: "0.75rem", border: `1px solid ${S.navyLight}` }}>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.78rem", color: S.goldLight, fontWeight: 700 }}>الإجابة الصحيحة:</p>
            <p style={{ margin: 0, fontSize: "1.1rem", color: S.ivory, fontWeight: 600, lineHeight: 1.8 }}>{activeQuestion?.a ?? "—"}</p>
            {showHint && (
              <p style={{ margin: "0.625rem 0 0", fontSize: "0.85rem", color: S.ivorySoft, lineHeight: 1.6, paddingTop: "0.625rem", borderTop: `1px solid ${S.navyLight}` }}>
                💡 {activeQuestion?.hint}
              </p>
            )}
            {!showHint && activeQuestion?.hint && (
              <button type="button" onClick={() => dispatch({ type: "REVEAL_HINT" })} style={{ ...ghostBtn, marginTop: "0.625rem", fontSize: "0.78rem" }}>
                عرض الشرح
              </button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem", marginBottom: "0.875rem" }}>
            <button type="button" onClick={() => dispatch({ type: "MARK_CORRECT" })} style={{ ...solidBtn(S.correct, "#fff"), textAlign: "center" }}>
              ✅ صحيح +{activeCell.points}
            </button>
            <button type="button" onClick={() => dispatch({ type: "MARK_WRONG" })} style={{ ...solidBtn(S.wrong, "#fff"), textAlign: "center" }}>
              ❌ خطأ
            </button>
          </div>
        </>
      )}

      <div style={{ background: S.navyMid, borderRadius: "0.75rem", padding: "1rem", border: `1px solid ${S.navyLight}` }}>
        <p style={{ margin: "0 0 0.625rem", fontSize: "0.82rem", color: S.gold, fontWeight: 700 }}>
          ⚡ وسائل المساعدة — {activeTeamObj.name}
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {activeTeamObj.lifelines.penalize && (
            <button type="button" onClick={() => dispatch({ type: "USE_LIFELINE_PENALIZE" })} style={lifelineStyle("#FFB347", "#2A1800")}>
              خصم {activeCell.points} من الخصم
            </button>
          )}
          {activeTeamObj.lifelines.eliminate && (
            <button type="button" onClick={() => dispatch({ type: "USE_LIFELINE_ELIMINATE" })} style={lifelineStyle("#C080FF", "#1A0830")}>
              استبعاد لاعب
            </button>
          )}
          {activeTeamObj.lifelines.pass && !passedToOpponent && (
            <button type="button" onClick={() => dispatch({ type: "PASS_QUESTION" })} style={lifelineStyle("#80C0FF", "#081830")}>
              تمرير للخصم
            </button>
          )}
          {!activeTeamObj.lifelines.penalize && !activeTeamObj.lifelines.eliminate && !activeTeamObj.lifelines.pass && (
            <span style={{ fontSize: "0.8rem", color: "#555", padding: "0.4rem 0" }}>لا وسائل متبقية</span>
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
    <div style={{ textAlign: "center", maxWidth: 480, margin: "0 auto", paddingTop: "1rem" }}>
      <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>{isDraw ? "🤝" : "🏆"}</div>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "2rem", color: S.goldLight, fontWeight: 800 }}>
        {isDraw ? "تعادل!" : `فاز ${a.name}`}
      </h1>
      <p style={{ color: S.ivorySoft, marginBottom: "2rem", fontSize: "0.95rem" }}>
        {isDraw ? "تعادل الفريقان — أنتما متكافئان!" : "أحسنتم جميعاً وبارك الله في سعيكم"}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2rem" }}>
        {[a, b].map((team, i) => (
          <div key={team.id} style={{ padding: "1.5rem 1rem", borderRadius: "1rem", background: S.navyMid, border: `2px solid ${i === 0 ? S.gold : S.navyLight}` }}>
            <div style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{i === 0 ? (isDraw ? "🤝" : "🥇") : "🥈"}</div>
            <p style={{ margin: "0 0 0.5rem", fontWeight: 700, color: S.ivory, fontSize: "0.95rem" }}>{team.name}</p>
            <p style={{ margin: 0, fontSize: "2.25rem", fontWeight: 800, color: i === 0 ? S.goldLight : S.ivorySoft }}>
              {team.score.toLocaleString("ar-EG")}
            </p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: S.ivorySoft }}>نقطة</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onReset}
        style={{ ...solidBtn(`linear-gradient(135deg, ${S.gold}, ${S.goldDark})`, S.navy), paddingInline: "2.5rem" }}
      >
        🔄 لعبة جديدة
      </button>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────

export function IslamicQuizGame() {
  const [state, dispatch] = useReducer(reducer, initial);
  const poolRef = useRef<Record<string, CategoryQuestions>>(ALL_QUESTIONS);

  useEffect(() => {
    getQuizQuestions().then(({ data }) => {
      if (data && data.length > 0) {
        poolRef.current = mergeSupabaseQuestions(data);
      }
    });
  }, []);

  const handleStart = useCallback(
    (cats: string[], names: [string, string]) => dispatch({ type: "START_GAME", categories: cats, names }),
    [],
  );

  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        background: S.navy,
        padding: "1.25rem 1rem",
        direction: "rtl",
        fontFamily: "'Cairo', 'Noto Kufi Arabic', 'IBM Plex Sans Arabic', system-ui, sans-serif",
        color: S.ivory,
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto", paddingBottom: "3rem" }}>
        {(state.phase === "board" || state.phase === "question") && (
          <div style={{ textAlign: "center", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: `1px solid ${S.navyLight}` }}>
            <span style={{ color: S.gold, fontWeight: 700 }}>🕌 لعبة سؤال وجواب الإسلامية</span>
          </div>
        )}

        {state.phase === "setup" && <SetupPhase onStart={handleStart} />}
        {state.phase === "board" && <BoardPhase state={state} dispatch={dispatch} poolRef={poolRef} />}
        {state.phase === "question" && <QuestionPhase state={state} dispatch={dispatch} />}
        {state.phase === "winner" && <WinnerPhase teams={state.teams} onReset={() => dispatch({ type: "RESET" })} />}
      </div>
    </div>
  );
}
