import { Component, type ErrorInfo, type ReactNode } from "react";
import { C } from "@/lib/theme";

type Props = { children: ReactNode };
type State = { error: Error | null; reportSaved: boolean; errorId: string };

function userFacingErrorMessage(error: Error): string {
  const msg = (error.message || "").toLowerCase();

  if (
    msg.includes("failed to fetch dynamically imported module") ||
    msg.includes("loading chunk") ||
    msg.includes("chunkloaderror") ||
    msg.includes("/assets/") ||
    msg.includes("importing a module script failed")
  ) {
    return "تعذر تحميل هذه الصفحة. حدّث المتصفح أو حاول مجددًا.";
  }

  return "تعذر عرض هذه الصفحة. حاول مجددًا.";
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, reportSaved: false, errorId: "" };

  static getDerivedStateFromError(error: Error): State {
    return { error, reportSaved: false, errorId: `MJL-${Date.now().toString(36).toUpperCase()}` };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const report = {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
      url: typeof window !== "undefined" ? window.location.href : "",
      at: new Date().toISOString(),
    };
    if (import.meta.env.DEV) {
      console.error("[majalis:ErrorBoundary]", report);
    }
    try {
      const key = "majalis-error-reports-v1";
      const reports = JSON.parse(window.localStorage.getItem(key) || "[]");
      reports.unshift(report);
      window.localStorage.setItem(key, JSON.stringify(reports.slice(0, 10)));
    } catch {
      /* localStorage may be unavailable */
    }
  }

  reset = () => this.setState({ error: null, reportSaved: false, errorId: "" });

  report = () => {
    try {
      const detail = encodeURIComponent(
        `URL: ${window.location.href}\nError: ${this.state.error?.message || "unknown"}\n\n${this.state.error?.stack || ""}`,
      );
      window.open(`mailto:support@majlisilm.com?subject=Majalis%20Error%20Report&body=${detail}`, "_blank", "noopener,noreferrer");
      this.setState({ reportSaved: true });
    } catch {
      this.setState({ reportSaved: true });
    }
  };

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          style={{
            maxWidth: "40rem",
            margin: "3rem auto",
            padding: "2rem 1.5rem",
            borderRadius: "0.75rem",
            border: `1px solid ${C.line}`,
            background: C.parchmentDeep,
            textAlign: "center",
          }}
        >
          <h1 style={{ color: C.emeraldDeep, marginBottom: "0.75rem", fontSize: "1.35rem" }}>
            حدث خطأ غير متوقع
          </h1>
          <p style={{ color: C.inkSoft, marginBottom: "1rem", lineHeight: 1.7, fontSize: "0.95rem" }}>
            {userFacingErrorMessage(this.state.error)}
          </p>
          <p style={{ color: C.inkSoft, marginBottom: "1rem", fontSize: "0.82rem" }}>
            رقم التتبع: <code>{this.state.errorId}</code>
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={this.reset}
              style={{
                padding: "0.55rem 1.1rem",
                borderRadius: "0.5rem",
                background: C.emerald,
                color: C.parchment,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 700,
              }}
            >
              إعادة المحاولة
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: "0.55rem 1.1rem",
                borderRadius: "0.5rem",
                background: C.panel,
                color: C.emeraldDeep,
                border: `1px solid ${C.line}`,
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 700,
              }}
            >
              تحديث الصفحة
            </button>
            <button
              type="button"
              onClick={this.report}
              style={{
                padding: "0.55rem 1.1rem",
                borderRadius: "0.5rem",
                background: C.parchment,
                color: C.inkSoft,
                border: `1px solid ${C.line}`,
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 700,
              }}
            >
              الإبلاغ عن الخطأ
            </button>
            <a
              href="/"
              style={{
                padding: "0.55rem 1.1rem",
                borderRadius: "0.5rem",
                background: C.panel,
                color: C.emeraldDeep,
                border: `1px solid ${C.line}`,
                fontFamily: "inherit",
                fontWeight: 700,
              }}
            >
              العودة للرئيسية
            </a>
          </div>
          {this.state.reportSaved && (
            <p style={{ color: C.inkSoft, marginTop: "0.75rem", fontSize: "0.85rem" }}>
              تم تجهيز تقرير الخطأ ونسخه في سجل المتصفح المحلي.
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

type SectionBoundaryProps = {
  name: string;
  children: ReactNode;
};

type SectionBoundaryState = {
  error: Error | null;
  errorId: string;
};

export class SectionErrorBoundary extends Component<SectionBoundaryProps, SectionBoundaryState> {
  state: SectionBoundaryState = { error: null, errorId: "" };

  static getDerivedStateFromError(error: Error): SectionBoundaryState {
    return { error, errorId: `SEC-${Date.now().toString(36).toUpperCase()}` };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const report = {
      section: this.props.name,
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
      url: typeof window !== "undefined" ? window.location.href : "",
      at: new Date().toISOString(),
    };
    if (import.meta.env.DEV) {
      console.error("[majalis:SectionErrorBoundary]", report);
    }
    try {
      const key = "majalis-section-error-reports-v1";
      const reports = JSON.parse(window.localStorage.getItem(key) || "[]");
      reports.unshift(report);
      window.localStorage.setItem(key, JSON.stringify(reports.slice(0, 20)));
    } catch {
      /* ignore */
    }
  }

  reset = () => this.setState({ error: null, errorId: "" });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <section className="home-section-error" role="alert">
        <strong>تعذر عرض قسم {this.props.name}</strong>
        <p>بقيت الصفحة تعمل، ويمكنك إعادة محاولة تحميل هذا القسم فقط.</p>
        <small>رقم التتبع: {this.state.errorId}</small>
        <button type="button" onClick={this.reset}>إعادة المحاولة</button>
      </section>
    );
  }
}
