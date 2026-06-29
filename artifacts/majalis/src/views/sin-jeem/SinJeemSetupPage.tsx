import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import {
  DEFAULT_CONFIG,
  DIFFICULTIES,
  TIMER_OPTIONS,
} from "@/lib/sin-jeem/constants";
import { getTopLevelCategories } from "@/lib/sin-jeem/categories-seed";
import type { GameMode, MatchConfig } from "@/lib/sin-jeem/types";
import { trackPlayer } from "@/lib/sin-jeem/storage";
import { useGame } from "@/lib/sin-jeem/context";
import { QA_BASE, QA_ROUTES } from "@/lib/question-answer/routes";
import { SjIcon, categoryIconName } from "@/components/sin-jeem/SjIcon";
import { GameHero, GameLayout } from "./components/GameLayout";

const MODE_LABELS: Record<string, string> = {
  team_vs_team: "فريق ضد فريق",
  player_vs_player: "لاعب ضد لاعب",
  solo: "لعب فردي",
};

export default function SinJeemSetupPage() {
  const [, params] = useRoute(`${QA_BASE}/setup/:mode`);
  const [, setLocation] = useLocation();
  const { startGame, starting } = useGame();
  const mode = (params?.mode || "team_vs_team") as GameMode;
  const categories = getTopLevelCategories();

  const [config, setConfig] = useState<MatchConfig>({
    ...DEFAULT_CONFIG,
    mode,
    teamAName: mode === "player_vs_player" ? "اللاعب 1" : mode === "solo" ? "أنت" : "الفريق أ",
    teamBName: mode === "player_vs_player" ? "اللاعب 2" : mode === "solo" ? "" : "الفريق ب",
    questionCount: mode === "solo" ? 10 : 10,
  });

  const [selectedCats, setSelectedCats] = useState<string[]>([]);

  const toggleCat = (slug: string) => {
    setSelectedCats((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const handleStart = async () => {
    trackPlayer(config.teamAName);
    if (config.teamBName) trackPlayer(config.teamBName);
    const finalConfig = { ...config, categorySlugs: selectedCats };
    await startGame(finalConfig);
    setLocation(QA_ROUTES.play);
  };

  return (
    <GameLayout>
      <GameHero />
      <h2 style={{ textAlign: "center", fontWeight: 800, marginBottom: "1.25rem" }}>
        {MODE_LABELS[mode] || "إعداد المباراة"}
      </h2>

      <div className="sj-form">
        {mode !== "solo" && (
          <div className="sj-field-row">
            <div className="sj-field">
              <label>{mode === "player_vs_player" ? "اللاعب الأول" : "الفريق الأول"}</label>
              <input
                value={config.teamAName}
                onChange={(e) => setConfig({ ...config, teamAName: e.target.value })}
                placeholder="اسم الفريق"
              />
            </div>
            <div className="sj-field">
              <label>{mode === "player_vs_player" ? "اللاعب الثاني" : "الفريق الثاني"}</label>
              <input
                value={config.teamBName}
                onChange={(e) => setConfig({ ...config, teamBName: e.target.value })}
                placeholder="اسم الفريق"
              />
            </div>
          </div>
        )}

        <div className="sj-field-row">
          <div className="sj-field">
            <label>عدد الأسئلة</label>
            <select
              value={config.questionCount}
              onChange={(e) => setConfig({ ...config, questionCount: Number(e.target.value) })}
            >
              {[5, 10, 15, 20].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="sj-field">
            <label>عدد الجولات</label>
            <select
              value={config.roundCount}
              onChange={(e) => setConfig({ ...config, roundCount: Number(e.target.value) })}
            >
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="sj-field-row">
          <div className="sj-field">
            <label>مستوى الصعوبة</label>
            <select
              value={config.difficulty}
              onChange={(e) => setConfig({ ...config, difficulty: e.target.value as MatchConfig["difficulty"] })}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="sj-field">
            <label>وقت السؤال (ثانية)</label>
            <select
              value={config.timerSeconds}
              onChange={(e) => setConfig({ ...config, timerSeconds: Number(e.target.value) })}
            >
              {TIMER_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="sj-field-row">
          <div className="sj-field">
            <label>نقاط الإجابة الصحيحة</label>
            <input
              type="number"
              min={5}
              max={50}
              value={config.pointsPerCorrect}
              onChange={(e) => setConfig({ ...config, pointsPerCorrect: Number(e.target.value) })}
            />
          </div>
          <div className="sj-field">
            <label>مكافأة السرعة</label>
            <input
              type="number"
              min={0}
              max={20}
              value={config.speedBonus}
              onChange={(e) => setConfig({ ...config, speedBonus: Number(e.target.value) })}
            />
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}>
          <input
            type="checkbox"
            checked={config.penaltyWrong}
            onChange={(e) => setConfig({ ...config, penaltyWrong: e.target.checked })}
          />
          خصم نقاط على الإجابة الخاطئة (-2)
        </label>

        <div className="sj-field">
          <label>الفئات (اختياري — الكل إن لم تُحدد)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.35rem" }}>
            {categories.map((c) => (
              <button
                key={c.slug}
                type="button"
                className="sj-badge"
                style={{
                  cursor: "pointer",
                  border: selectedCats.includes(c.slug) ? "2px solid var(--majalis-emerald-deep)" : "1px solid transparent",
                  padding: "0.35rem 0.65rem",
                }}
                onClick={() => toggleCat(c.slug)}
              >
                <SjIcon name={categoryIconName(c.slug)} size={14} /> {c.name_ar}
              </button>
            ))}
          </div>
        </div>

        <button type="button" className="sj-cta-primary sj-btn-animate" onClick={() => void handleStart()} disabled={starting}>
          {starting ? "جاري التحضير…" : (<><SjIcon name="rocket" size={18} /> ابدأ المباراة</>)}
        </button>
      </div>
    </GameLayout>
  );
}
