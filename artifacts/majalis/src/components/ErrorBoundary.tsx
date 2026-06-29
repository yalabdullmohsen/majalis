import { Component, type ErrorInfo, type ReactNode } from "react";
import { C } from "@/lib/theme";
import { buildErrorReport, copyErrorId, createErrorId, logClientError } from "@/lib/error-report";

type Props = { children: ReactNode };
type State = { error: Error | null; copied: boolean; errorId: string; componentStack: string | null };

function userFacingBody(error: Error, chunkError: boolean): string {
  if (chunkError) {
    return "تعذر تحميل هذه الصفحة. حدّث المتصفح أو حاول مجددًا.";
  }
  const msg = (error.message || "").toLowerCase();
  if (msg.includes("cannot read") || msg.includes("undefined")) {
    return "حدث خلل بسبب بيانات ناقصة في هذه الصفحة. جرّب البحث أو العودة للرئيسية.";
  }
  return "حدث خلل أثناء تحميل هذا القسم. يمكنك إعادة المحاولة أو العودة للرئيسية.";
}

function isChunkLoadError(error: Error): boolean {
  const msg = (error.message || "").toLowerCase();
  return (
    msg.includes("failed to fetch dynamically imported module") ||
    msg.includes("loading chunk") ||
    msg.includes("chunkloaderror") ||
    msg.includes("/assets/") ||
    msg.includes("importing a module script failed")
  );
}

function inferPageLabel(pathname: string): string {
  const rules: Array<[RegExp, string]> = [
    [/^\/lessons\//, "تفاصيل درس"],
    [/^\/search/, "البحث"],
    [/^\/scholar-search/, "الباحث العلمي"],
    [/^\/research\//, "تفاصيل بحث"],
    [/^\/library\//, "تفاصيل كتاب"],
    [/^\/fatwa\//, "تفاصيل فتوى"],
    [/^\/rulings\//, "تفاصيل حكم"],
    [/^\/qa\//, "سؤال وجواب"],
    [/^\/annual-courses\//, "تفاصيل دورة"],
    [/^\/quran-scientific-circles\//, "تفاصيل حلقة"],
    [/^\/sheikhs\//, "ملف شيخ"],
    [/^\/calendar/, "التقويم"],
    [/^\/fiqh-council\//, "المجمع الفقهي"],
  ];
  for (const [pattern, label] of rules) {
    if (pattern.test(pathname)) return label;
  }
  return "صفحة المحتوى";
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, copied: false, errorId: "", componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error, copied: false, errorId: createErrorId("MJL"), componentStack: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const errorId = this.state.errorId || createErrorId("MJL");
    this.setState({ componentStack: info.componentStack ?? null, errorId });

    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    void logClientError(
      buildErrorReport(error, {
        errorId,
        componentStack: info.componentStack,
        component: "ErrorBoundary",
        section: inferPageLabel(pathname),
        route: pathname,
      }),
    );
  }

  reset = () => this.setState({ error: null, copied: false, errorId: "", componentStack: null });

  copyId = async () => {
    const ok = await copyErrorId(this.state.errorId);
    if (ok) this.setState({ copied: true });
  };

  report = () => {
    const detail = encodeURIComponent(
      `Error ID: ${this.state.errorId}\nURL: ${typeof window !== "undefined" ? window.location.href : ""}\nMessage: ${this.state.error?.message || "unknown"}`,
    );
    window.open(`mailto:support@majlisilm.com?subject=MJL%20Error%20${this.state.errorId}&body=${detail}`, "_blank", "noopener,noreferrer");
    this.setState({ copied: true });
  };

  render() {
    if (this.state.error) {
      const isDev = import.meta.env?.DEV;
      const chunkError = isChunkLoadError(this.state.error);
      const pathname = typeof window !== "undefined" ? window.location.pathname : "";
      const pageLabel = inferPageLabel(pathname);
      const briefReason = this.state.error.message
        ? this.state.error.message.slice(0, 120)
        : "خطأ غير معروف";

      return (
        <div
          role="alert"
          className="error-boundary-page"
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
            تعذر عرض هذه الصفحة
          </h1>
          <p style={{ color: C.inkSoft, marginBottom: "0.75rem", lineHeight: 1.7, fontSize: "0.95rem" }}>
            {userFacingBody(this.state.error, chunkError)}
          </p>
          <p style={{ color: C.inkSoft, marginBottom: "0.35rem", fontSize: "0.85rem" }}>
            نوع الصفحة: <strong>{pageLabel}</strong>
          </p>
          {pathname && (
            <p style={{ color: C.inkSoft, marginBottom: "0.75rem", fontSize: "0.82rem", wordBreak: "break-all" }}>
              الرابط: <code dir="ltr">{pathname}</code>
            </p>
          )}
          {!chunkError && (
            <p style={{ color: C.inkSoft, marginBottom: "0.75rem", fontSize: "0.78rem", opacity: 0.85 }}>
              سبب مختصر: {briefReason}
            </p>
          )}
          <p style={{ color: C.inkSoft, marginBottom: "1rem", fontSize: "0.82rem" }}>
            رقم التتبع: <code>{this.state.errorId}</code>
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <button type="button" onClick={() => window.history.back()} className="error-boundary-btn error-boundary-btn--secondary">
              رجوع
            </button>
            <button type="button" onClick={this.reset} className="error-boundary-btn error-boundary-btn--primary">
              إعادة المحاولة
            </button>
            <a href="/" className="error-boundary-btn error-boundary-btn--secondary">
              العودة للرئيسية
            </a>
            <a href="/search" className="error-boundary-btn error-boundary-btn--ghost">
              البحث
            </a>
            <button type="button" onClick={this.copyId} className="error-boundary-btn error-boundary-btn--ghost">
              {this.state.copied ? "تم النسخ" : "نسخ رقم الخطأ"}
            </button>
            <button type="button" onClick={this.report} className="error-boundary-btn error-boundary-btn--ghost">
              الإبلاغ عن الخطأ
            </button>
          </div>

          {this.state.copied && (
            <p style={{ color: C.inkSoft, marginTop: "0.75rem", fontSize: "0.85rem" }}>
              تم تجهيز تقرير الخطأ.
            </p>
          )}

          {isDev && (
            <details style={{ marginTop: "1.25rem", textAlign: "right", fontSize: "0.78rem", color: C.inkSoft }}>
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>تفاصيل للمطور</summary>
              <pre style={{ overflow: "auto", marginTop: "0.5rem", whiteSpace: "pre-wrap", direction: "ltr", textAlign: "left" }}>
                {`name: ${this.state.error.name}\nmessage: ${this.state.error.message}\nroute: ${pathname}\nuserAgent: ${typeof navigator !== "undefined" ? navigator.userAgent : ""}\n\ncomponentStack:${this.state.componentStack || ""}\n\nstack:\n${this.state.error.stack || ""}`}
              </pre>
            </details>
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
    return { error, errorId: createErrorId("SEC") };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    void logClientError(
      buildErrorReport(error, {
        errorId: this.state.errorId || createErrorId("SEC"),
        componentStack: info.componentStack,
        section: this.props.name,
        component: this.props.name,
      }),
    );
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
