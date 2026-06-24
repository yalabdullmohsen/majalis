import { Component, type ErrorInfo, type ReactNode } from "react";
import { C } from "@/lib/theme";

type Props = { children: ReactNode };
type State = { error: Error | null };

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
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[majalis:ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

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
          <button
            type="button"
            onClick={() => window.location.reload()}
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
        </div>
      );
    }

    return this.props.children;
  }
}
