"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { PageHeader } from "@/components/ui-common";
import {
  YES_NO_CATEGORIES,
  filterYesNoQuestions,
  pickRandomYesNo,
  type YesNoCategory,
} from "@/lib/yes-no-game-seed";
import {
  getActiveMatch,
  getLeaderboard,
  getSinJeemFavorites,
  getSinJeemStats,
  pushLeaderboard,
  recordMatchResult,
  saveActiveMatch,
  saveSinJeemPosition,
  toggleSinJeemFavorite,
} from "@/lib/yes-no-game-storage";
import {
  DEFAULT_TEAMS,
  advanceQuestion,
  createMatch,
  getQuestionById,
  getWinner,
  matchStats,
  scoreAnswer,
  skipQuestion,
  type MatchConfig,
  type MatchProgress,
} from "@/lib/sin-jeem-engine";

type View = "hub" | "solo" | "team-setup" | "team-play" | "results";

const TIMER_DEFAULT = 30;

function formatDuration(ms: number) {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function SinJeemPage() {
  const [view, setView] = useState<View>("hub");
  const [category, setCategory] = useState<YesNoCategory | "all">("all");
  const [teams, setTeams] = useState(DEFAULT_TEAMS);
  const [match, setMatch] = useState<MatchProgress | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [timer, setTimer] = useState(TIMER_DEFAULT);
  const [soloIndex, setSoloIndex] = useState(0);
  const [soloRevealed, setSoloRevealed] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => getSinJeemFavorites());
  const [leaderboard, setLeaderboard] = useState(getLeaderboard);
  const stats = useMemo(() => getSinJeemStats(), [view, match?.finishedAt]);

  const soloQuestions = useMemo(() => filterYesNoQuestions(category, ""), [category]);
  const soloCurrent = soloQuestions[soloIndex];

  useEffect(() => {
    if (view !== "team-play" || revealed || !match) return;
    if (timer <= 0) return;
    const id = window.setInterval(() => setTimer((t) => t - 1), 1000);
    return () => window.clearInterval(id);
  }, [view, revealed, match, timer]);

  useEffect(() => {
    if (view === "team-play" && timer === 0 && match && !revealed) {
      setMatch((m) => (m ? skipQuestion(m) : m));
      setRevealed(true);
    }
  }, [timer, view, match, revealed]);

  const currentTeamQuestion = match ? getQuestionById(match.questionIds[match.index]) : undefined;

  const startTeamMatch = () => {
    const config: MatchConfig = {
      mode: "team",
      category,
      roundSize: 10,
      timerSec: TIMER_DEFAULT,
      teams,
    };
    const next = createMatch(config);
    setMatch(next);
    saveActiveMatch(next);
    setTimer(TIMER_DEFAULT);
    setRevealed(false);
    setView("team-play");
  };

  const resumeMatch = () => {
    const saved = getActiveMatch();
    if (!saved || saved.finishedAt) return;
    setMatch(saved);
    setTeams(saved.config.teams);
    setCategory(saved.config.category);
    setTimer(TIMER_DEFAULT);
    setRevealed(false);
    setView(saved.config.mode === "team" ? "team-play" : "solo");
  };

  const finishMatch = useCallback((final: MatchProgress) => {
    saveActiveMatch(null);
    recordMatchResult(final);
    const winner = getWinner(final);
    if (winner !== null && winner !== "tie") {
      pushLeaderboard({
        teamName: final.config.teams[winner].name,
        score: final.scores[winner],
        category: final.config.category,
        mode: "team",
      });
    }
    setLeaderboard(getLeaderboard());
    setMatch(final);
    setView("results");
  }, []);

  const handleTeamAnswer = (team: 0 | 1, isCorrect: boolean) => {
    if (!match || !currentTeamQuestion) return;
    let next = scoreAnswer(match, team, isCorrect);
    next = advanceQuestion(next);
    setRevealed(false);
    setTimer(TIMER_DEFAULT);
    if (next.finishedAt || next.index >= next.questionIds.length) {
      finishMatch(next);
    } else {
      setMatch(next);
      saveActiveMatch(next);
    }
  };

  const handleSkip = () => {
    if (!match) return;
    let next = skipQuestion(match);
    next = advanceQuestion(next);
    setRevealed(false);
    setTimer(TIMER_DEFAULT);
    if (next.finishedAt || next.index >= next.questionIds.length) finishMatch(next);
    else {
      setMatch(next);
      saveActiveMatch(next);
    }
  };

  if (view === "hub") {
    return (
      <div className="page-shell narrow sin-jeem-page calm-page">
        <PageHeader eyebrow="المجلس العلمي" title="سين جيم" subtitle="لعبة معرفية — فردي أو جماعي، مع مؤقت ولوحة متصدرين." />

        <div className="sin-jeem-hub-grid">
          <button type="button" className="calm-btn calm-btn--primary" onClick={() => setView("solo")}>بدء اللعب الفردي</button>
          <button type="button" className="calm-btn calm-btn--secondary" onClick={() => setView("team-setup")}>لعب جماعي (فريقان)</button>
          <button type="button" className="calm-btn calm-btn--ghost" onClick={resumeMatch}>متابعة آخر مباراة</button>
        </div>

        <section className="calm-panel">
          <h2 className="calm-section-title">اختر الفئة</h2>
          <div className="content-hub-chips">
            <button type="button" className={category === "all" ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"} onClick={() => setCategory("all")}>الكل</button>
            {YES_NO_CATEGORIES.map((cat) => (
              <button key={cat} type="button" className={category === cat ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"} onClick={() => setCategory(cat)}>{cat}</button>
            ))}
          </div>
        </section>

        <section className="calm-panel">
          <h2 className="calm-section-title">الإحصائيات</h2>
          <div className="sin-jeem-stats-row">
            <span>{stats.gamesPlayed} مباراة</span>
            <span>{stats.totalCorrect} صحيح</span>
            <span>{stats.totalWrong} خطأ</span>
            <span>أفضل فردي: {stats.bestSoloScore}</span>
          </div>
        </section>

        <section className="calm-panel">
          <h2 className="calm-section-title">لوحة المتصدرين</h2>
          {leaderboard.length === 0 ? (
            <p className="settings-note">لا نتائج بعد — العب أول جولة!</p>
          ) : (
            <ol className="sin-jeem-leaderboard">
              {leaderboard.slice(0, 10).map((row, i) => (
                <li key={row.id}>
                  <span>{i + 1}. {row.teamName}</span>
                  <strong>{row.score} نقطة</strong>
                </li>
              ))}
            </ol>
          )}
        </section>

        <Link href="/qa" className="calm-btn calm-btn--ghost">← الأسئلة والأجوبة</Link>
      </div>
    );
  }

  if (view === "team-setup") {
    return (
      <div className="page-shell narrow sin-jeem-page calm-page">
        <PageHeader title="إعداد الفريقين" subtitle="اسم ولون لكل فريق — 10 أسئلة في الجولة." />
        <div className="sin-jeem-team-setup">
          {[0, 1].map((i) => (
            <label key={i} className="settings-field">
              <span>الفريق {i + 1}</span>
              <input value={teams[i].name} onChange={(e) => setTeams((t) => { const n = [...t] as typeof t; n[i] = { ...n[i], name: e.target.value }; return n; })} />
              <input type="color" value={teams[i].color} onChange={(e) => setTeams((t) => { const n = [...t] as typeof t; n[i] = { ...n[i], color: e.target.value }; return n; })} aria-label={`لون الفريق ${i + 1}`} />
            </label>
          ))}
        </div>
        <div className="sin-jeem-hub-grid">
          <button type="button" className="calm-btn calm-btn--primary" onClick={startTeamMatch}>ابدأ المباراة</button>
          <button type="button" className="calm-btn calm-btn--ghost" onClick={() => setView("hub")}>رجوع</button>
        </div>
      </div>
    );
  }

  if (view === "team-play" && match) {
    return (
      <div className="page-shell narrow sin-jeem-page calm-page">
        <div className="sin-jeem-scoreboard">
          {teams.map((team, i) => (
            <div key={team.name} className="sin-jeem-team-score" style={{ borderColor: team.color }}>
              <span>{team.name}</span>
              <strong>{match.scores[i]}</strong>
            </div>
          ))}
        </div>
        <p className="sin-jeem-turn">دور: {teams[match.activeTeam].name} · سؤال {match.index + 1}/{match.questionIds.length} · ⏱ {timer}s</p>

        {currentTeamQuestion && (
          <article className="calm-panel sin-jeem-card">
            <span className="page-tag">{currentTeamQuestion.category}</span>
            <h2 className="sin-jeem-card__question">{currentTeamQuestion.question}</h2>
            {!revealed ? (
              <button type="button" className="calm-btn calm-btn--primary" onClick={() => setRevealed(true)}>كشف الإجابة</button>
            ) : (
              <div className="sin-jeem-card__answer">
                <p className={`sin-jeem-verdict sin-jeem-verdict--${currentTeamQuestion.answer ? "yes" : "no"}`}>
                  {currentTeamQuestion.answer ? "نعم ✓" : "لا ✗"}
                </p>
                <p className="sin-jeem-explanation">{currentTeamQuestion.explanation}</p>
                <div className="sin-jeem-team-actions">
                  <button type="button" className="calm-btn calm-btn--primary" style={{ background: teams[0].color }} onClick={() => handleTeamAnswer(0, true)}>{teams[0].name} ✓</button>
                  <button type="button" className="calm-btn calm-btn--primary" style={{ background: teams[1].color }} onClick={() => handleTeamAnswer(1, true)}>{teams[1].name} ✓</button>
                  <button type="button" className="calm-btn calm-btn--ghost" onClick={() => handleTeamAnswer(match.activeTeam, false)}>خطأ</button>
                </div>
              </div>
            )}
          </article>
        )}

        <div className="sin-jeem-hub-grid">
          <button type="button" className="calm-btn calm-btn--ghost" onClick={handleSkip}>تخطي (−1)</button>
          <button type="button" className="calm-btn calm-btn--ghost" onClick={() => finishMatch({ ...match, finishedAt: Date.now() })}>إنهاء الجولة</button>
        </div>
      </div>
    );
  }

  if (view === "results" && match) {
    const { elapsedMs, total, pct } = matchStats(match);
    const winner = getWinner(match);
    return (
      <div className="page-shell narrow sin-jeem-page calm-page">
        <PageHeader title="نتيجة الجولة" subtitle={winner === "tie" ? "تعادل!" : winner !== null ? `الفائز: ${teams[winner].name}` : "انتهت الجولة"} />
        <div className="calm-panel sin-jeem-results">
          <p>الأسئلة: {total}</p>
          <p>صحيح: {match.correct} · خطأ: {match.wrong} · تخطي: {match.skipped}</p>
          <p>النسبة: {pct}%</p>
          <p>الزمن: {formatDuration(elapsedMs)}</p>
          <p>{teams[0].name}: {match.scores[0]} — {teams[1].name}: {match.scores[1]}</p>
        </div>
        <div className="sin-jeem-hub-grid">
          <button type="button" className="calm-btn calm-btn--primary" onClick={() => { setView("team-setup"); setMatch(null); }}>إعادة المباراة</button>
          <button type="button" className="calm-btn calm-btn--ghost" onClick={() => { setView("hub"); setMatch(null); }}>الرئيسية</button>
        </div>
      </div>
    );
  }

  // Solo mode (enhanced from previous)
  const goSolo = (next: number) => {
    const clamped = ((next % soloQuestions.length) + soloQuestions.length) % soloQuestions.length;
    setSoloIndex(clamped);
    setSoloRevealed(false);
    const item = soloQuestions[clamped];
    if (item) saveSinJeemPosition(clamped, item.id);
  };

  return (
    <div className="page-shell narrow sin-jeem-page calm-page">
      <PageHeader title="اللعب الفردي" subtitle={`${soloIndex + 1} / ${soloQuestions.length}`} />
      {soloCurrent ? (
        <article className="calm-panel sin-jeem-card">
          <span className="page-tag">{soloCurrent.category}</span>
          <h2 className="sin-jeem-card__question">{soloCurrent.question}</h2>
          {!soloRevealed ? (
            <button type="button" className="calm-btn calm-btn--primary" onClick={() => setSoloRevealed(true)}>كشف الإجابة</button>
          ) : (
            <div className="sin-jeem-card__answer">
              <p className={`sin-jeem-verdict sin-jeem-verdict--${soloCurrent.answer ? "yes" : "no"}`}>{soloCurrent.answer ? "نعم ✓" : "لا ✗"}</p>
              <p className="sin-jeem-explanation">{soloCurrent.explanation}</p>
            </div>
          )}
          <div className="sin-jeem-toolbar">
            <button type="button" className="calm-btn calm-btn--ghost" onClick={() => goSolo(soloIndex - 1)}>السابق</button>
            <button type="button" className="calm-btn calm-btn--ghost" onClick={() => goSolo(soloIndex + 1)}>التالي</button>
            <button type="button" className="calm-btn calm-btn--ghost" onClick={() => { const p = pickRandomYesNo(soloCurrent.id); if (p) { const idx = soloQuestions.findIndex((q) => q.id === p.id); if (idx >= 0) goSolo(idx); } }}>عشوائي</button>
            <button type="button" className={`calm-btn calm-btn--ghost${favorites.includes(soloCurrent.id) ? " is-active" : ""}`} onClick={() => setFavorites(toggleSinJeemFavorite(soloCurrent.id))}>
              {favorites.includes(soloCurrent.id) ? "★" : "☆"}
            </button>
          </div>
        </article>
      ) : (
        <p className="settings-note">لا أسئلة في هذه الفئة.</p>
      )}
      <button type="button" className="calm-btn calm-btn--ghost" onClick={() => setView("hub")}>← الرئيسية</button>
    </div>
  );
}
