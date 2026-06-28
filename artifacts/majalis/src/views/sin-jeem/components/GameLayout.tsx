import { Link } from "wouter";
import { GAME_SUBTITLE, GAME_TITLE } from "@/lib/sin-jeem/constants";

export function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sin-jeem-root">
      <div className="sin-jeem-shell">
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <Link href="/sin-jeem" style={{ textDecoration: "none", color: "var(--majalis-emerald-deep)", fontWeight: 800, fontSize: "0.9375rem" }}>
            ← {GAME_TITLE}
          </Link>
          <Link href="/" style={{ fontSize: "0.8125rem", color: "var(--majalis-ink-soft)" }}>
            المجلس العلمي
          </Link>
        </nav>
        {children}
      </div>
    </div>
  );
}

export function GameHero() {
  return (
    <header className="sj-hero">
      <div className="sj-hero-badge">🎮 لعبة تعليمية تفاعلية</div>
      <h1 className="sj-hero-title">{GAME_TITLE}</h1>
      <p className="sj-hero-sub">{GAME_SUBTITLE}</p>
    </header>
  );
}
