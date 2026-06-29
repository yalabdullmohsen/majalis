import { useLocation } from "wouter";
import { Link } from "wouter";
import { MODE_CARDS, GAME_TITLE } from "@/lib/sin-jeem/constants";
import { healthLabel } from "@/lib/sin-jeem/activation-state";
import { useActivationState } from "@/lib/sin-jeem/activation-provider";
import { QA_ROUTES } from "@/lib/question-answer/routes";
import { SjIcon, type SjIconName } from "@/components/sin-jeem/SjIcon";
import { GameHero, GameLayout } from "./components/GameLayout";
import { ActivationStatusBanner } from "./components/ActivationStatusBanner";
import { PlayerProgressPanel } from "./components/PlayerProgressPanel";

export default function SinJeemHomePage() {
  const [, setLocation] = useLocation();
  const {
    loading,
    health,
    gameReady,
    questionCount,
    categoryCount,
    playerCount,
    matchCount,
    leaders,
    startDisabledReason,
    dataSource,
  } = useActivationState();

  const startDisabled = loading || !gameReady;
  const statsSource =
    dataSource === "supabase" ? "قاعدة البيانات" : dataSource === "local" ? "محلي" : "بنك مدمج";

  return (
    <GameLayout>
      <GameHero />

      {!loading && health !== "READY" && (
        <p
          style={{
            textAlign: "center",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "var(--majalis-ink-soft)",
            marginBottom: "0.75rem",
          }}
          aria-label="حالة اللعبة"
        >
          الحالة: {healthLabel(health)} · المصدر: {statsSource}
        </p>
      )}

      <ActivationStatusBanner />
      <PlayerProgressPanel />

      <button
        type="button"
        className="sj-cta-primary sj-btn-animate"
        disabled={startDisabled}
        title={startDisabled ? startDisabledReason || undefined : undefined}
        aria-disabled={startDisabled}
        onClick={() => {
          if (!startDisabled) setLocation(QA_ROUTES.setup("team_vs_team"));
        }}
      >
        {loading ? (
          "جاري التحميل…"
        ) : startDisabled ? (
          startDisabledReason || "غير جاهز"
        ) : (
          <>
            <SjIcon name="zap" size={18} />
            ابدأ اللعبة
          </>
        )}
      </button>

      <div className="sj-stats" aria-live="polite">
        <div className="sj-stat">
          <div className="sj-stat-value">{loading ? "…" : questionCount.toLocaleString("ar")}</div>
          <div className="sj-stat-label">عدد الأسئلة</div>
        </div>
        <div className="sj-stat">
          <div className="sj-stat-value">{loading ? "…" : categoryCount.toLocaleString("ar")}</div>
          <div className="sj-stat-label">عدد الفئات</div>
        </div>
        <div className="sj-stat">
          <div className="sj-stat-value">{loading ? "…" : playerCount > 0 ? playerCount.toLocaleString("ar") : "—"}</div>
          <div className="sj-stat-label">عدد اللاعبين</div>
        </div>
        <div className="sj-stat">
          <div className="sj-stat-value">{loading ? "…" : matchCount.toLocaleString("ar")}</div>
          <div className="sj-stat-label">مباريات</div>
        </div>
      </div>

      <h2 style={{ fontSize: "1rem", fontWeight: 800, margin: "1.5rem 0 0.75rem", color: "var(--majalis-emerald-deep)" }}>
        أوضاع اللعب
      </h2>
      <div className={`sj-modes${startDisabled ? " sj-modes--disabled" : ""}`}>
        {MODE_CARDS.map((m) => (
          <button
            key={m.mode}
            type="button"
            className="sj-mode-card sj-card-hover"
            style={{ background: m.gradient, border: "none", textAlign: "start" }}
            disabled={startDisabled}
            onClick={() => {
              if (startDisabled) return;
              if (m.mode === "quick") setLocation(`${QA_ROUTES.play}?mode=quick`);
              else if (m.mode === "daily") setLocation(`${QA_ROUTES.play}?mode=daily`);
              else if (m.mode === "tournament") setLocation(QA_ROUTES.tournament);
              else setLocation(QA_ROUTES.setup(m.mode));
            }}
          >
            <span className="sj-mode-icon">
              <SjIcon name={m.icon as SjIconName} size={22} strokeWidth={1.5} />
            </span>
            <span className="sj-mode-title">{m.title}</span>
            <span className="sj-mode-desc">{m.desc}</span>
          </button>
        ))}
      </div>

      {leaders.length > 0 && (
        <section style={{ marginTop: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.65rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--majalis-emerald-deep)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <SjIcon name="trophy" size={18} />
              أفضل اللاعبين
            </h2>
            <Link href={QA_ROUTES.leaderboard} style={{ fontSize: "0.8125rem", color: "var(--majalis-brass-deep)" }}>
              عرض الكل
            </Link>
          </div>
          {leaders.slice(0, 5).map((l, i) => (
            <div key={l.id} className="sj-leader-row">
              <span className={`sj-rank ${i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : ""}`}>{l.rank}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{l.name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--majalis-ink-soft)" }}>{l.wins} فوز · {l.games} لعبة</div>
              </div>
              <div style={{ fontWeight: 800, color: "var(--majalis-emerald-deep)" }}>{l.score}</div>
            </div>
          ))}
        </section>
      )}

      <p style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.75rem", color: "var(--majalis-ink-soft)" }}>
        {GAME_TITLE} — جزء من منصة مجالس العلم
      </p>
    </GameLayout>
  );
}
