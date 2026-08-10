import { Component, type ErrorInfo, type ReactNode } from "react";
import { buildErrorReport, copyErrorId, createErrorId, logClientError } from "@/lib/error-report";
import { CONTACT_EMAIL } from "@/lib/site-config";
import {
  hardRecoverStaleDeploy,
  isChunkLoadError,
  isChunkRecoveryInFlight,
  tryRecoverFromStaleChunk,
} from "@/lib/chunk-recovery";
import { clearChunkReloadGuard } from "@/lib/lazy-with-retry";
import "@/styles/components/error-boundary.css";

type Props = { children: ReactNode };
type State = {
  error: Error | null;
  copied: boolean;
  errorId: string;
  componentStack: string | null;
  /** استعادة chunk جارية — لا تُعرض شاشة الخطأ الصلبة */
  recovering: boolean;
};

function userFacingBody(): string {
  return "حدث خلل أثناء تحميل هذا القسم. يمكنك إعادة المحاولة أو العودة للرئيسية.";
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    error: null,
    copied: false,
    errorId: "",
    componentStack: null,
    recovering: false,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    // نقي: واجهة استعادة تفاؤلية لأخطاء chunk؛ الحسم في componentDidCatch.
    return {
      error,
      copied: false,
      errorId: createErrorId("MJL"),
      componentStack: null,
      recovering: isChunkLoadError(error),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const errorId = this.state.errorId || createErrorId("MJL");
    this.setState({ componentStack: info.componentStack ?? null, errorId });

    void logClientError(
      buildErrorReport(error, {
        errorId,
        componentStack: info.componentStack,
        component: "ErrorBoundary",
      }),
    );

    if (isChunkLoadError(error)) {
      const started = tryRecoverFromStaleChunk("boundary-catch") || isChunkRecoveryInFlight();
      if (!started) this.setState({ recovering: false });
    }
  }

  reset = () => {
    clearChunkReloadGuard();
    this.setState({
      error: null,
      copied: false,
      errorId: "",
      componentStack: null,
      recovering: false,
    });
  };

  goHome = () => {
    this.reset();
    window.history.pushState(null, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  copyId = async () => {
    const ok = await copyErrorId(this.state.errorId);
    if (ok) this.setState({ copied: true });
  };

  report = () => {
    const detail = encodeURIComponent(
      `Error ID: ${this.state.errorId}\nURL: ${typeof window !== "undefined" ? window.location.href : ""}\nMessage: ${this.state.error?.message || "unknown"}`,
    );
    window.open(`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`ملاحظة تقنية — MJL Error ${this.state.errorId}`)}&body=${detail}`, "_blank", "noopener,noreferrer");
    this.setState({ copied: true });
  };

  hardRecover = () => {
    void hardRecoverStaleDeploy();
  };

  render() {
    if (this.state.error) {
      const isDev = import.meta.env?.DEV;
      const chunkError = isChunkLoadError(this.state.error);

      if (this.state.recovering || (chunkError && isChunkRecoveryInFlight())) {
        return (
          <div className="error-boundary-page error-boundary-page--recovering" role="status" aria-live="polite" dir="rtl">
            <h1 className="error-boundary-page__title">جاري تحديث العرض</h1>
            <p className="error-boundary-page__body">
              تم تحديث المنصة، جاري تحسين العرض…
            </p>
          </div>
        );
      }

      return (
        <div role="alert" className="error-boundary-page">
          <h1 className="error-boundary-page__title">تعذّر عرض هذه الصفحة</h1>
          <p className="error-boundary-page__body">
            {chunkError
              ? "تعذّر تحميل ملفات الصفحة بعد تحديث المنصة. اضغط «تحديث المنصة» لمسح الكاش وإعادة التحميل."
              : userFacingBody()}
          </p>
          <p className="error-boundary-page__id">
            رقم التتبع: <code>{this.state.errorId}</code>
          </p>
          <div className="error-boundary-page__actions">
            {chunkError ? (
              <button type="button" onClick={this.hardRecover} className="error-boundary-btn error-boundary-btn--primary">
                تحديث المنصة
              </button>
            ) : (
              <button type="button" onClick={this.reset} className="error-boundary-btn error-boundary-btn--primary">
                إعادة المحاولة
              </button>
            )}
            <button type="button" onClick={this.goHome} className="error-boundary-btn error-boundary-btn--secondary">
              العودة للرئيسية
            </button>
            <button type="button" onClick={this.copyId} className="error-boundary-btn error-boundary-btn--ghost">
              {this.state.copied ? "تم النسخ" : "نسخ رقم الخطأ"}
            </button>
            <button type="button" onClick={this.report} className="error-boundary-btn error-boundary-btn--ghost">
              الإبلاغ عن الخطأ
            </button>
          </div>

          {this.state.copied && (
            <p className="error-boundary-page__copied">تم تجهيز تقرير الخطأ.</p>
          )}

          {isDev && (
            <details className="error-boundary-page__dev">
              <summary>تفاصيل للمطور</summary>
              <pre>
                {`name: ${this.state.error.name}\nmessage: ${this.state.error.message}\nroute: ${typeof window !== "undefined" ? window.location.pathname : ""}\nuserAgent: ${typeof navigator !== "undefined" ? navigator.userAgent : ""}\n\ncomponentStack:${this.state.componentStack || ""}\n\nstack:\n${this.state.error.stack || ""}`}
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
  /** Bumps on retry so failed React.lazy factories are not reused. */
  remountKey: number;
  recovering: boolean;
};

/**
 * Lazy-section boundary: one chunk reload max, then Arabic retry that remounts children.
 */
export class SectionErrorBoundary extends Component<SectionBoundaryProps, SectionBoundaryState> {
  state: SectionBoundaryState = { error: null, errorId: "", remountKey: 0, recovering: false };

  static getDerivedStateFromError(error: Error): Partial<SectionBoundaryState> {
    return {
      error,
      errorId: createErrorId("SEC"),
      recovering: isChunkLoadError(error),
    };
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

    if (isChunkLoadError(error)) {
      const started =
        tryRecoverFromStaleChunk(`section:${this.props.name}`) || isChunkRecoveryInFlight();
      if (!started) this.setState({ recovering: false });
    }
  }

  reset = () => {
    this.setState((s) => ({
      error: null,
      errorId: "",
      remountKey: s.remountKey + 1,
      recovering: false,
    }));
  };

  hardRecover = () => {
    void hardRecoverStaleDeploy();
  };

  render() {
    if (this.state.error) {
      const chunkError = isChunkLoadError(this.state.error);
      if (this.state.recovering || (chunkError && isChunkRecoveryInFlight())) {
        return (
          <div className="adv-error-state adv-error-state--section" role="status" aria-live="polite" dir="rtl">
            <p className="adv-error-state__msg">تم تحديث المنصة، جاري تحسين العرض…</p>
          </div>
        );
      }
      return (
        <div className="adv-error-state adv-error-state--section" role="alert" aria-live="assertive" dir="rtl">
          <p className="adv-error-state__msg">
            {chunkError
              ? `تعذّر تحميل قسم «${this.props.name}» بعد تحديث المنصة. اضغط لتحديث المنصة.`
              : `تعذّر عرض قسم «${this.props.name}». يمكنك إعادة المحاولة.`}
          </p>
          <button
            type="button"
            className="adv-error-state__retry"
            onClick={chunkError ? this.hardRecover : this.reset}
            aria-label={chunkError ? "تحديث المنصة" : "إعادة المحاولة"}
          >
            {chunkError ? "تحديث المنصة" : "إعادة المحاولة"}
          </button>
        </div>
      );
    }

    return <div key={this.state.remountKey}>{this.props.children}</div>;
  }
}
