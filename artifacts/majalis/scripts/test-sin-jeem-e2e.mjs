#!/usr/bin/env node
/**
 * Sin Jeem E2E simulation — game modes, scoring, API validation (offline).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

let pass = 0;
let fail = 0;

function ok(c, m) {
  if (c) {
    pass++;
    console.log(`✓ ${m}`);
  } else {
    fail++;
    console.error(`✗ ${m}`);
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickQuestions(config, pool) {
  let questions = [...pool];
  if (config.categorySlugs?.length) {
    questions = questions.filter((q) => config.categorySlugs.includes(q.category_slug || ""));
  }
  const used = new Set();
  const picked = [];
  for (const q of shuffle(questions)) {
    if (picked.length >= config.questionCount) break;
    if (used.has(q.question)) continue;
    used.add(q.question);
    picked.push(q);
  }
  return picked.slice(0, config.questionCount);
}

function simulateMatch(mode, pool, questionCount = 5) {
  const config = {
    mode,
    questionCount,
    categorySlugs: [],
    teamAName: mode === "solo" ? "أنت" : "فريق أ",
    teamBName: mode === "solo" ? "" : "فريق ب",
  };
  const questions = pickQuestions(config, pool);
  let scoreA = 0;
  let scoreB = 0;
  let correctA = 0;
  let correctB = 0;

  for (let i = 0; i < questions.length; i++) {
    const side = mode === "solo" ? "a" : i % 2 === 0 ? "a" : "b";
    const correct = i % 3 !== 2;
    if (side === "a") {
      if (correct) {
        scoreA += 10;
        correctA++;
      }
    } else if (correct) {
      scoreB += 10;
      correctB++;
    }
  }

  const winner = mode === "solo" ? "a" : scoreA === scoreB ? "draw" : scoreA > scoreB ? "a" : "b";
  return {
    mode,
    questions: questions.length,
    scoreA,
    scoreB,
    correctA,
    correctB,
    winner,
    durationMs: 60000 + questions.length * 5000,
  };
}

function validateMatchPayload(body) {
  const teamAScore = Number(body.team_a_score);
  const teamBScore = Number(body.team_b_score);
  const totalQuestions = Number(body.total_questions);
  const durationMs = Number(body.duration_ms);
  if (!body.team_a_name?.trim()) return { ok: false, error: "invalid_team_a" };
  if (!Number.isFinite(teamAScore) || teamAScore < 0) return { ok: false, error: "invalid_score_a" };
  if (totalQuestions < 1 || totalQuestions > 50) return { ok: false, error: "invalid_question_count" };
  if (durationMs < 1000 || durationMs > 3_600_000) return { ok: false, error: "invalid_duration" };
  const maxAllowed = totalQuestions * 50;
  if (teamAScore > maxAllowed || teamBScore > maxAllowed) return { ok: false, error: "score_exceeds_cap" };
  return { ok: true };
}

const bank = JSON.parse(fs.readFileSync(path.join(ROOT, "data/sin-jeem/questions-bank.json"), "utf8"));

for (const mode of ["solo", "team_vs_team", "player_vs_player", "daily", "quick", "tournament"]) {
  const result = simulateMatch(mode, bank);
  ok(result.questions >= 1, `${mode}: completes with ${result.questions} questions`);
  ok(result.durationMs >= 1000, `${mode}: valid duration`);
  const payload = {
    team_a_name: result.mode === "solo" ? "أنت" : "فريق أ",
    team_b_name: result.mode === "solo" ? null : "فريق ب",
    team_a_score: result.scoreA,
    team_b_score: result.scoreB,
    team_a_correct: result.correctA,
    team_b_correct: result.correctB,
    total_questions: result.questions,
    duration_ms: result.durationMs,
    mode,
  };
  const v = validateMatchPayload(payload);
  ok(v.ok, `${mode}: API payload valid`);
}

const types = [...new Set(bank.map((q) => q.question_type))];
for (const t of types) {
  const sample = bank.find((q) => q.question_type === t);
  ok(Boolean(sample?.question), `Question type playable: ${t}`);
}

ok(validateMatchPayload({ team_a_name: "", team_a_score: 0, team_b_score: 0, total_questions: 5, duration_ms: 5000 }).ok === false, "Rejects empty team name");
ok(validateMatchPayload({ team_a_name: "X", team_a_score: 9999, team_b_score: 0, total_questions: 5, duration_ms: 5000 }).ok === false, "Rejects score cap breach");

const api = fs.readFileSync(path.join(ROOT, "lib/api-handlers/sin-jeem.js"), "utf8");
for (const action of ["submit_match", "leaderboard", "admin_import", "admin_export", "admin_bulk_approve", "generate"]) {
  ok(api.includes(action), `API action: ${action}`);
}

console.log(`\nE2E simulation: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
