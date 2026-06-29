import { Link } from "wouter";
import { GAME_SUBTITLE, GAME_TITLE } from "@/lib/sin-jeem/constants";
import { QA_ROUTES } from "@/lib/question-answer/routes";
import { SjIcon } from "@/components/sin-jeem/SjIcon";

export function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sin-jeem-root">
      <div className="sin-jeem-shell">
        <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <Link href={QA_ROUTES.home} style={{ textDecoration: "none", color: "var(--majalis-emerald-deep)", fontWeight: 800, fontSize: "0.9375rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
            <SjIcon name="arrow-right" size={16} />
            {GAME_TITLE}
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
      <div className="sj-hero-badge">
        <SjIcon name="gamepad" size={14} />
        لعبة تعليمية تفاعلية
      </div>
      <h1 className="sj-hero-title">{GAME_TITLE}</h1>
      <p className="sj-hero-sub">{GAME_SUBTITLE}</p>
    </header>
  );
}
